class Structure {
	constructor(type, x, y, id) {
		Object.assign(this, getStructTemplate(type));

		this.type = type;
		this.efX = x;
		this.updateXFromEfX();
		this.y = y;

		this.collisionBox.moveTo(this.x + this.xOfs, this.y);
		if (id === undefined) this.id = structures.length;
		else this.id = id;
		this.chunkIndex = null;
		this.entities = [];
		this.cell = null;
		this.hasModifiedBlueprint = false;
		this.conflictingStructures = [];
		this.isNote = false;
		this.originalX = this.x;
		this.putInChunk();

		structures.push(this);
	}

	checkForCollisions() {
		this.conflictingStructures = [];
		for (let j = 0; j < 3; j++) {
			if (this.chunkIndex + j - 1 < 0 || this.chunkIndex + j - 1 >= numStructChunks) continue;
			for (let k = 0; k < chunks[this.chunkIndex + j - 1].length; k++) {
				let otherStruct = chunks[this.chunkIndex + j - 1][k];
				if (this.id === otherStruct.id) continue;
				if (this.checkCollisionWith(otherStruct)) this.conflictingStructures.push(otherStruct);
			}
		}
	}

	checkCollisionWith(otherStruct) { // TODO: Multiple collision box support
		return this.collisionBox.getCollisionWith(otherStruct.collisionBox);
	}

	putInChunk() {
		this.chunkIndex = Math.floor(this.x / blocksPerChunk);
		if (this.chunkIndex > 29) this.chunkIndex = 29;
		chunks[this.chunkIndex].push(this);
	}

	updateChunkLocation() { // TODO: Generalize for all structures or move to NoteStructure class
		let curChunk = this.chunkIndex;
		let newChunk = Math.floor(this.x / blocksPerChunk);

		if (newChunk !== curChunk) {
			// Remove a reference to the structure in the current chunk
			let foundIndex = chunks[curChunk].findIndex((thisStruct) => (thisStruct.id === this.id));
			chunks[curChunk].splice(foundIndex, 1);

			// Add to the new chunk
			this.putInChunk();
		}

		// Remove from cell // TODO: Add to new cell
		// TODO: Cells that get merged are not handled properly? (Might not be a necessary fix)
		let curCell = this.cell;
		if (curCell !== null) curCell.removeStructure(this);
		this.originalX = this.x;
	}

	isInForbiddenTile() {
		let thisX = this.x - marginWidth - ofsX;
		let thisY = this.y + 1 + ofsY;
		for (let j = 0; j < forbiddenTiles.length; j++) {
			if (thisX === forbiddenTiles[j].x && thisY === forbiddenTiles[j].y) {
				return true;
			}
		}
		return false;
	}
}
