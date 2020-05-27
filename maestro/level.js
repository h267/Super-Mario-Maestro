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
		console.log('rf');
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
			if (!this.noteGroups[i].isVisible || (isSoloMode && i !== selectedTrack)) { continue; }
			for (j = 0; j < this.noteGroups[i].notes.length; j++) {
				let thisNote = this.noteGroups[i].notes[j];
				let x = (thisNote.x + marginWidth - ofsX) * numBlockSubdivisions;
				let y = thisNote.pitch + this.noteGroups[i].ofsY - ofsY;
				if (!isVisible(x / numBlockSubdivisions, y, marginWidth, 0)) { continue; }

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
		handleAllConflicts();

		// resetSpatialData(false);
		this.conflictCount = 0;
		structures.forEach((struct) => { // Second pass: Check for unhandled conflicts
			// TODO: Move structures back to an offset of 0 if possible, or any lesser offset
			struct.checkForCollisions();
			if (struct.conflictingStructures.length > 0 || !struct.checkForLegality()) {
				this.markTile(struct.x, struct.y, 1);
				this.conflictCount++;
			}
			if (struct.hasSemisolid) this.markTile(struct.x, struct.y, 3);
		});
		cells.forEach((cell) => cell.build());
		cells.forEach((cell) => cell.members.forEach((struct) => {
			struct.checkForCollisions();
			if (struct.conflictingStructures.length > 0) {
				this.markTile(struct.x, struct.y, 1);
				this.conflictCount++;
			}
		}));
		// console.log(cells);

		structures.forEach((struct) => { // Third pass: Draw the structures
			that.drawStructure(struct);
			// console.log(struct.id);
			// console.log(struct);
		});

		forbiddenTiles.forEach((forbiddenTile) => {
			let markX = forbiddenTile.x + marginWidth - ofsX;
			let markY = forbiddenTile.y - 1 - ofsY;
			this.markTile(markX, markY, 5);
		});
		console.log('---');
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
			if (structure.entityProperties[0].parachute) this.foreground.setTile(x, y + 1, 0);
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

/**
 * A grid of tiles.
 */
class Area {
	/**
       * Initializes the Area object.
       * @param {number} w The width of the grid.
       * @param {number} h The height of the grid.
       */
	constructor(w, h) {
		this.w = w;
		this.h = h;
		this.ofsX = 0;
		this.ofsY = 0;
		this.isVisible = true;
		this.clear();
	}

	/**
       * Gets the ID of the tile at the specified location on the grid.
       * @param {number} x The x-coordinate of the tile to get.
       * @param {number} y The y-coordinate of the tile to get.
       * @param {boolean} useOfs If the x and y offset values should be factored in.
       * @returns {number} The ID of the tile found at the location.
       */
	getTile(x, y, useOfs) {
		if (!this.isInBounds(x, y)) { return null; }
		if (useOfs) { return this.grid[x + this.ofsX][y - this.ofsY]; }
		return this.grid[x][y];
	}

	/**
       * Determines if the tile at the specified location is not empty.
       * @param {number} x The x-coordinate of the tile.
       * @param {number} y The y-coordinate of the tile.
       * @returns {boolean} If the tile at the location is not empty.
       */
	isOccupied(x, y) {
		if (!this.isInBounds(x, y)) { return true; }
		return this.grid[x][y] !== null;
	}

	/**
       * Changes the type of tile at the specified location.
       * @param {number} x The x-coordinate of the tile.
       * @param {number} y The y-coordinate of the tile.
       * @param {number} n The tile ID to assign to the location.
       */
	setTile(x, y, n) {
		if (!this.isInBounds(x, y)) { return; }
		this.grid[x][y] = n;
	}

	/**
       * Sets the tile at the specified location to null.
       * @param {number} x The x-coordinate of the tile.
       * @param {number} y The y-coordinate of the tile.
       */
	clearTile(x, y) {
		if (!this.isInBounds(x, y)) { return; }
		this.grid[x][y] = null;
	}

	/**
       * Clears the entire grid.
       */
	clear() {
		let i;
		this.grid = [];
		for (i = 0; i < this.w; i++) {
			this.grid[i] = new Array(this.h).fill(null);
		}
	}

	/**
       * Sets whether or not the grid is visible.
       * @param {boolean} v If the grid is visible.
       */
	setVisibility(v) {
		this.isVisible = v;
	}

	/**
       * Determines if a specified point is within the bounds of the grid.
       * @param {number} x The x-coordinate of the point.
       * @param {number} y The y-coordinate of the point.
       * @returns {boolean} If the point is in bounds.
       */
	isInBounds(x, y) {
		return x < this.w + this.ofsX && x >= this.ofsX && y < this.h + this.ofsY && y >= this.ofsY;
	}
}

/**
 * A simplified Note class optimized for placement in the level.
 */
class PreloadedNote {
	/**
       * Initializes the PreloadedNote.
       * @param {number} pitch The MIDI pitch of the note.
       * @param {number} instrument The MIDI instrument of the note.
       * @param {number} x The x-coordinate of the note to be placed in relation to the entire MIDI file.
	 * @param {number} y The y-coordinate of the note to be placed in relation to the entire MIDI file.
	 * @param {MaestroNote} origNote The corresponding MaestroNote object.
       * @constructor
       */
	constructor(pitch, instrument, x, y, origNote) {
		this.pitch = pitch;
		this.instrument = instrument;

		this.x = x; // Math.floor(x);
		// this.xShift = x - this.x;

		this.y = y;
		this.origNote = origNote;
	}
}

/**
 * A group of PreloadedNote objects, often used to represent a single MIDI track.
 */
class PreloadedNoteGroup {
	/**
       * Initializes the PreloadedNoteGroup object.
       */
	constructor() {
		this.notes = [];
		this.ofsY = 0;
		this.isVisible = true;
	}

	/**
       * Creates a new PreloadedNote using the provided data and adds it to the collection of other notes.
       * @param {number} pitch The MIDI pitch of the note.
       * @param {number} instrument The MIDI instrument of the note.
       * @param {number} x The x-coordinate of the note to be placed in relation to the entire MIDI file.
	 * TODO: update
       */
	add(pitch, instrument, x, y, origNote) {
		this.notes.push(new PreloadedNote(pitch, instrument, x, y, origNote));
	}

	/**
       * Sets whether or not this PreloadedNoteGroup is visible.
       * @param {boolean} visible If the note group is visible.
       */
	setVisibility(visible) {
		this.isVisible = visible;
	}

	getNoteAt(x, y, doRound = true) {
		// TODO: Replace with binary search
		let i = 0;
		for (i = 0; i < this.notes.length; i++) {
			let note = this.notes[i];
			let xPos = note.x;
			if (doRound) xPos = Math.floor(xPos);
			if (xPos > x) break;
			if (xPos === x && note.y + this.ofsY === y) {
				return { result: note, pos: i };
			}
		}
		return { result: null, pos: i };
	}
}

function getLvlTile(n) {
	if (n === 0) return 0;
	if (n < 3) return n + MM2Instruments.length + 1; // Building tiles come after all entities
	return 1;
}

function getIsBG(n) {
	if (n === 2) return true;
	return false;
}

function removeElementFromArr(arr, n) {
	return arr.splice(n, 1);
}

function resetSpatialData(deleteStructs) { // TODO: Reset chunks
	if (deleteStructs) structures = [];
	cells = [];
	chunks = [];
	for (let i = 0; i < numStructChunks; i++) chunks[i] = [];
	if (!deleteStructs) {
		structures.forEach((thisStruct) => {
			thisStruct.putInChunk();
		});
	}
}
