// Debug note: Clicking the ruler tool on the bottom right will give the x-coord of whatever tile it's dragged to
class Level {
	/**
     * Initializes the level object.
     * @constructor
     */
	constructor() {
		this.width = levelWidth * numBlockSubdivisions;
		this.height = levelHeight;
		this.noteGroups = [];
		this.overview = new Area(this.width, this.height);
		this.isTrackOccupant = new Array(this.width);
		this.numberOfOccupants = new Array(this.width);
		this.entityCount = 0;
		this.powerupCount = 0;
		this.maxWidth = 0;
		this.resolution = numBlockSubdivisions;
		this.limitLine = null;
		this.refresh();
	}

	/**
     * Gets the type of tile in the specified location
     * @param {number} x The x-coordinate of the tile.
     * @param {number} y The y-coordinate of the tile.
     * @returns {number} The value of the tile in the location.
     */
	checkTile(x, y) {
		return this.overview.getTile(x, y, true);
	}

	checkBgTile(x, y) {
		return this.background.getTile(x, y, true);
	}

	checkFgTile(x, y) {
		return this.foreground.getTile(x, y, true);
	}

	/**
     * Adds a note group to the stored list. One note group corresponds to a MIDI track.
     * @param {PreloadedNoteGroup} group The NoteGroup to add.
     */
	addNoteGroup(group) {
		this.noteGroups.push(group);
	}

	/**
     * Clears all of the notes of a stored note group.
     * @param {number} index The index of the stored note group to clear.
     */
	clearNoteGroup(index) {
		if (index >= this.noteGroups.length) return;
		this.noteGroups[index].notes = [];
	}

	/**
     * Refreshes the level overview by plotting values from the stored note groups.
     */
	refresh() {
		// console.log('rf');
		this.overview = new Area(levelWidth * numBlockSubdivisions, levelHeight);
		this.background = new Area(levelWidth * numBlockSubdivisions, levelHeight);
		this.foreground = new Area(levelWidth * numBlockSubdivisions, levelHeight);
		this.isTrackOccupant = new Array(levelWidth * numBlockSubdivisions);
		this.numberOfOccupants = new Array(levelWidth * numBlockSubdivisions);
		structures = [];
		this.entityCount = 0;
		this.powerupCount = 0;
		this.conflictCount = 0;
		// this.width = 0;
		this.limitLine = null;
		let columnCounts = [];
		let i;
		let j;
		for (i = 0; i < levelWidth * numBlockSubdivisions; i++) {
			this.isTrackOccupant[i] = new Array(levelHeight);
			this.numberOfOccupants[i] = new Array(levelHeight);
			for (j = 0; j < levelHeight; j++) {
				this.isTrackOccupant[i][j] = new Array(this.noteGroups.length).fill(false);
				this.numberOfOccupants[i][j] = 0;
			}
		}
		resetSpatialData(true);
		// TODO: Use notegroup xShifts to draw notes offset from one another
		// But also have it so if shifted and non-shifted notes overlap, they are both visible
		for (i = 0; i < this.noteGroups.length; i++) {
			if (!this.noteGroups[i].isVisible || (isSoloMode && i !== selectedTrack)) {
				continue;
			}
			for (j = 0; j < this.noteGroups[i].notes.length; j++) {
				let thisNote = this.noteGroups[i].notes[j];
				let x = (thisNote.x + marginWidth - ofsX) * numBlockSubdivisions;
				let y = thisNote.pitch + this.noteGroups[i].ofsY - ofsY;
				if (!isVisible(x / numBlockSubdivisions, y, marginWidth, 0)) {
					continue;
				}

				// Set note
				if (!isBuildMode) this.overview.setTile(x, y, 1);
				this.isTrackOccupant[x][y][i] = true;
				this.numberOfOccupants[x][y]++; // TODO: Properly update this information after conflict resolution

				// Set instrument
				let ins = thisNote.instrument;
				if (y < 26) {
					if (columnCounts[x] === undefined) {
						columnCounts[x] = { entities: 0, powerups: 0 };
					}
					if (MM2Instruments[ins].isPowerup) {
						this.powerupCount++;
						columnCounts[x].powerups++;
					} else {
						this.entityCount++;
						columnCounts[x].entities++;
					}
					// if (x > this.width) this.width = x;
					// if((this.powerupCount > 100 || this.entityCount > 100) &&
					// (this.limitLine === null)) this.limitLine = x + marginWidth + 1;
					if (!isBuildMode) this.overview.setTile(x, y + 1, ins + 2);
					this.isTrackOccupant[x][y + 1][i] = true;
					this.numberOfOccupants[x][y + 1]++; // TODO: Also here
				}

				if (isBuildMode) {
					let newStruct = new NoteStructure(0, x / numBlockSubdivisions, y, ins);
					newStruct.entities[0] = ins + 2;
				}
			}
		}
		let curCount = { entities: 0, powerups: 0 };
		for (i = 0; i < columnCounts.length; i++) {
			if (columnCounts[i] === undefined) continue;
			if (columnCounts[i].entities !== undefined) curCount.entities += columnCounts[i].entities;
			if (columnCounts[i].powerups !== undefined) curCount.powerups += columnCounts[i].powerups;
			if ((curCount.entities > 100 || curCount.powerups > 100) && this.limitLine === null) {
				this.limitLine = i;
			}
		}

		let that = this;
		structures.forEach((struct) => { // First pass: Handle conflicts
			struct.checkForCollisions();
		});
		// let preSolveTime = new Date().getMilliseconds();
		handleAllConflicts();
		// if (isBuildMode) console.log(`Solver finished in ${new Date().getMilliseconds() - preSolveTime} ms`);

		// resetSpatialData(false);
		this.conflictCount = 0;
		if (isBuildMode) {
			let lowestX = 27;
			structures.forEach((struct) => { // Second pass: Check for unhandled conflicts, etc after solver has finished
			// TODO: Move structures back to an offset of 0 if possible, or any lesser offset
				if (struct.hasSemisolid) this.markTile(struct.x, struct.y, 6);
				struct.checkForCollisions();
				if (struct.conflictingStructures.length > 0 || !struct.checkForLegality()) {
					this.markTile(struct.x, struct.y, 1);
					this.conflictCount++;
				}
				lowestX = Math.min(lowestX, struct.x);
			});
			drawOffsetX = 27 - lowestX;
			cells.forEach((cell) => cell.build());
			cells.forEach((cell) => cell.members.forEach((struct) => {
				struct.checkForCollisions();
				if (struct.conflictingStructures.length > 0) {
					this.markTile(struct.x, struct.y, 1);
					this.conflictCount++;
				}
			}));
			// console.log(cells);

			let offsetCount = 0;
			structures.forEach((struct) => { // Third pass: Draw the structures
				if (struct.conflictingStructures.length === 0) that.drawStructure(struct);
				if (struct.setup.offset !== 0) offsetCount++;
			});
			// console.log(`${offsetCount} offsets present`);

			forbiddenTiles.forEach((forbiddenTile) => {
				let markX = forbiddenTile.x + marginWidth - ofsX;
				let markY = forbiddenTile.y - 1 - ofsY;
				this.markTile(markX, markY, 5);
			});
		}

		// console.log('---');
	}

	/* refreshStructures() {

    } */

	drawStructure(structure) {
		for (let i = 0; i < structure.blueprint.width; i++) {
			for (let j = 0; j < structure.blueprint.height; j++) {
				let tile = structure.blueprint.get(i, j);
				if (tile === 0) continue;
				let x = (structure.x + structure.xOfs + i) * numBlockSubdivisions;
				let y = structure.y - structure.yOfs - j;
				// Don't replace note blocks with hard blocks
				if (this.overview.getTile(x, y, true) === 1 && tile === 1) continue;
				let isBG = getIsBG(tile);
				if (!isBG) this.overview.setTile(x, y, getLvlTile(tile));
				else this.background.setTile(x, y, getLvlTile(tile));
			}
		}
		for (let i = 0; i < structure.entities.length; i++) {
			let x = (structure.x - structure.xOfs - structure.entityPos[i].x) * numBlockSubdivisions;
			let y = structure.y - structure.yOfs - structure.entityPos[i].y;
			this.overview.setTile(x, y, structure.entities[i]);
			if (structure.entityProperties[0].parachute) this.foreground.setTile(x, y, 0);
		}
		// this.highlightCollisionBox(structure.collisionBox);
	}

	markTile(x, y, id = 2) {
		this.foreground.setTile(x * numBlockSubdivisions, y, id);
	}

	highlightCollisionBox(colBox) {
		let color = colBox.x % 2;
		for (let i = 0; i < colBox.w; i++) {
			for (let j = 0; j < colBox.h; j++) {
				this.markTile(colBox.x + i, colBox.y + 1 - j, color + 3);
			}
		}
	}
}
