/**
 * A class responsible for playing notes and holding instrument-specific playback data.
 */
class Instrument {
	/**
     * Initializes an Instrument object.
     * @param {AudioBuffer} buffer An AudioBuffer object of the loaded sample.
     * @param {number} baseNote The MIDI pitch that the buffer is tuned to.
     * @constructor
     */
	constructor(buffer, baseNote = KEY_C4) {
		this.buffer = buffer;
		this.baseNote = baseNote;
		this.noteBuffers = {};
		this.hasLongSustain = false;
	}

	/**
     * Generates an AudioBuffer for a specific note to be played.
     * @param {number} note The MIDI pitch of the note to be generated.
     * @returns {Promise} A Promise showing the status of the asynchronous operation.
     */
	async generateBufferForNote(note) {
		let that = this;
		let buffer = await renderBufferAtPlaybackRate(
			that.buffer,
			midiNoteToFreq(note) / midiNoteToFreq(that.baseNote)
		);
		let bufferData = buffer.getChannelData(0);
		applyReleaseEnvelope(bufferData, that.hasLongSustain);
		that.noteBuffers[note.toString()] = buffer;
	}

	/**
     * Plays a note at a certain time.
     * @param {number} note The MIDI pitch of the note to be played.
     * @param {number} time The time, in seconds, when the note should be played.
     * @param {number} duration The time, in seconds, that a note can play before being terminated.
     * @param {AudioContext} ctx The AudioContext object to play the sound through. (Optional)
     */
	playNote(note, time, duration, ctx = audioCtx) {
		playBuffer(this.noteBuffers[note], time, duration, ctx);
	}

	playNoteRealTime(note, time, isLongSustain, duration, ctx = audioCtx) {
		let rate = midiNoteToFreq(note) / midiNoteToFreq(this.baseNote);
		let sustainTime;
		if (!isLongSustain) sustainTime = RELEASE_POS / 44100;
		else sustainTime = LONG_RELEASE_POS / 44100;
		playBufferAtPlaybackRate(this.buffer, time, rate, sustainTime, duration, ctx);
	}
}
