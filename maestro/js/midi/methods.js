/**
 * Creates a copy of a note.
 * @param {Note} note The note to be cloned.
 * @returns {Note} A copy of the note.
 */
function cloneNote(note) {
	let newNote = new Note(note.time, note.pitch, note.volume, note.instrument, note.channel);
	newNote.originalInstrument = note.originalInstrument;
	return newNote;
}

/**
 * Gets the character corresponding to an ASCII value.
 * @param {number} n The ASCII index to get a character from.
 * @returns {string} The character corresponding to the ASCII index.
 */
function ASCII(n) {
	return String.fromCharCode(n);
}

/**
 * Gets an integer value from an arbitrary number of bytes.
 * @param {number[]} arr An array of bytes.
 * @param {number} pad The amount of padding applied.
 * @returns {number} The integer value obtained from the bytes.
 */
function getIntFromBytes(arr, pad = 8) {
	let n = 0;
	let i;
	for (i = 0; i < arr.length; i++) {
		n = (n << pad) | arr[i];
	}
	return n;
}

/**
 * Gets the name for a MIDI instrument.
 * @param midiInstrument The MIDI instrument number.
 * @returns {string} The name of the instrument.
 */
// TODO: Can probably use the data in maestro.js for this
function getInstrumentLabel(instrument) { // Return a label name for the track based on the instrument
	return midiInstrumentNames[instrument];
}

/**
 * Tests for whether or not a value is in an array.
 * @param {any[]} arr The array to search through.
 * @param {any} n The value to check for.
 * @returns If the value is present in the array.
 */
function isNotInArr(arr, n) {
	let i;
	for (i = 0; i < arr.length; i++) {
		if (arr[i] === n) {
			return false;
		}
	}
	return true;
}

/**
 * Gets the MIDI instrument name from at an index.
 * @param {number} index The MIDI instrument number to get the name of.
 * @returns {string} The name of the specified instrument.
 */
function getMidiInstrumentName(index) {
	return midiInstrumentNames[index];
}

// https://www.cs.cmu.edu/~music/cmsip/readings/Standard-MIDI-file-format-updated.pdf
