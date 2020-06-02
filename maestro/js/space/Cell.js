class Cell {
	constructor(id) {
		this.id = id;
		this.members = [];
		this.locationMap = {};
		this.highestPoint = 0;
		this.startX = Infinity;
		this.endX = 0;
	}

	add(struct) { // Add a structure to the cell
		if (this.members.findIndex((member) => member.id === struct.id) !== -1) return;
		// TODO: Maybe find what's causing dupe structures
		this.members.push(struct);
		struct.cell = this;

		let structHighestPoint = struct.collisionBox.y + struct.collisionBox.h;
		this.highestPoint = Math.max(this.highestPoint, structHighestPoint);
		this.startX = Math.min(this.startX, struct.collisionBox.x);
		this.endX = Math.max(this.endX, struct.collisionBox.x);

		this.addToLocMap(struct);
	}

	mergeWith(otherCell) { // Combine two cells together
		otherCell.members.forEach((struct) => {
			this.add(struct);
		});
		otherCell.clear();
	}

	build() { // Modify the blueprints of each member to form the proper structure
		if (this.members.length === 0) return;
		for (let i = this.startX; i <= this.endX; i++) { // First Pass: Expanding
			if (this.locationMap[i] === undefined) {
				console.log('Missing structure in cell.');
				continue;
			}
			this.locationMap[i].list.forEach((struct) => {
				let expandDist = this.highestPoint - (struct.collisionBox.y + struct.collisionBox.h);
				struct.extendUpwardsBy(expandDist);
			});
		}
		for (let i = this.startX; i < this.endX; i++) { // Second Pass: Trimming
			this.locationMap[i].list.forEach((struct) => {
				let nextStruct = this.locationMap[i + 1].tallest;
				// let trimDist = nextStruct.collisionBox.h - 1;
				let trimDist = Math.min(nextStruct.collisionBox.h, struct.collisionBox.h) - 1;
				struct.trimSide(true, trimDist);
				nextStruct.trimSide(false, trimDist);
			});
		}
	}

	addToLocMap(struct) { // Register a structure in the location map
		const xPos = struct.collisionBox.x;
		if (this.locationMap[xPos] === undefined) this.locationMap[xPos] = { list: [], tallest: struct };
		else {
			this.locationMap[xPos].list.forEach((localStruct) => {
				let localStructHeight = localStruct.collisionBox.y + localStruct.collisionBox.h;
				let tallestStructHeight = this.locationMap[xPos].tallest.collisionBox.y
                    + this.locationMap[xPos].tallest.collisionBox.h;
				if (localStructHeight > tallestStructHeight) this.locationMap[xPos].tallest = localStruct;
			});
		}
		this.locationMap[xPos].list.push(struct);
	}

	clear() {
		this.members = [];
		this.locationMap = {};
		this.highestPoint = 0;
	}

	removeStructure(struct) {
		// Remove from member list
		let origIndex = this.members.findIndex((thisStruct) => (thisStruct.id === struct.id));
		this.members.splice(origIndex, 1);

		// Remove from location map
		let origEntry = this.locationMap[struct.originalX];
		let foundIndex = origEntry.list.findIndex((thisStruct) => (thisStruct.id === struct.id));
		origEntry.list.splice(foundIndex, 1);

		// Remove from tallest structure if it is this cell, recalculate as necessary.
		// Also recalculate starting and ending x coords
		// if (this.locationMap[struct.originalX].tallest.id === struct.id) { // TODO: Maybe a better fix?
		let newStartX = 240;
		let newEndX = 0;
		let newHighestPoint = 0;
		if (origEntry.list.length === 0) {
			delete this.locationMap[struct.originalX];
			if (struct.originalX !== this.startX && struct.originalX !== this.endX) {
				this.split(struct.originalX);
			}
		} else {
			[origEntry.tallest] = origEntry.list;
			origEntry.list.forEach((localStruct) => {
				let localStructHeight = localStruct.collisionBox.y + localStruct.collisionBox.h;
				let tallestStructHeight = origEntry.tallest.collisionBox.y + origEntry.tallest.collisionBox.h;
				if (localStructHeight > tallestStructHeight) origEntry.tallest = localStruct;
			});
		}
		this.members.forEach((localStruct) => {
			if (localStruct.x < newStartX) newStartX = localStruct.x;
			if (localStruct.x > newEndX) newEndX = localStruct.x;
			if (localStruct.collisionBox.y + localStruct.collisionBox.h > newHighestPoint) {
				newHighestPoint = localStruct.collisionBox.y + localStruct.collisionBox.h;
			}
		});
		this.startX = newStartX;
		this.endX = newEndX;
		this.highestPoint = newHighestPoint;
		// }
		struct.cell = null;
	}

	split(splitX) { // Split the cell in two, removing structures from this cell and creating a new one
		// Store structures to be moved
		let moveStructures = [];
		/* for (let i = splitPoint; i < this.members.length; i++) {
            moveStructures.push(this.members[i]);
        } */
		for (let i = splitX + 1; i <= this.endX; i++) {
			this.locationMap[i].list.forEach((struct) => {
				moveStructures.push(struct);
			});
		}

		// Remove structures to be moved from this cell
		for (let i = moveStructures.length - 1; i >= 0; i--) {
			// console.log('split off '+i);
			this.removeStructure(moveStructures[i]);
		}

		// Add those structures to a new cell
		let newCell = createCell();
		for (let i = 0; i < moveStructures.length; i++) {
			newCell.add(moveStructures[i]);
		}
	}
}
