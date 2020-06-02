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
