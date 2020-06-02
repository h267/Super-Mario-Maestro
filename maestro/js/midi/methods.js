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
	midiInstrument = instrument + 1;
	if (midiInstrument <= 8) {
		return 'Goomba';
	} // Piano
	if (midiInstrument >= 9 && midiInstrument <= 16) {
		return 'Shellmet';
	} // Chromatic Percussion
	if (midiInstrument >= 17 && midiInstrument <= 24) {
		return '1-Up';
	} // Organ
	if (midiInstrument >= 25 && midiInstrument <= 32) {
		return 'Chain Chomp';
	} // Guitar
	if (midiInstrument >= 33 && midiInstrument <= 40) {
		return 'Spike';
	} // Bass
	if (midiInstrument >= 41 && midiInstrument <= 48) {
		return 'Fire Flower';
	} // Strings
	if (midiInstrument >= 49 && midiInstrument <= 56) {
		return 'Bob-Omb';
	} // Ensemble
	if (midiInstrument >= 57 && midiInstrument <= 72) {
		return 'Spiny Shellmet';
	} // Brass, Lead
	if (midiInstrument >= 73 && midiInstrument <= 80) {
		return 'Dry Bones Shell';
	} // Pipe
	if (midiInstrument >= 81 && midiInstrument <= 88) {
		return 'Mushroom';
	} // Synth Lead
	if (midiInstrument >= 89 && midiInstrument <= 96) {
		return 'Rotten Mushroom';
	} // Synth Pad
	if (midiInstrument >= 97 && midiInstrument <= 104) {
		return 'Goomba';
	} // Synth Effects
	if (midiInstrument >= 105 && midiInstrument <= 112) {
		return 'Monty Mole';
	} // Ethnic
	if (midiInstrument >= 113 && midiInstrument <= 120) {
		return 'P-Switch';
	} // Percussive
	if (midiInstrument >= 121 && midiInstrument <= 128) {
		return 'Goomba';
	} // Sound Effects

	return 'Unintentional Goomba'; // You should not see this in regular use
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
