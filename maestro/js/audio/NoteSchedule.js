/**
 * A class for playing back a sequence of scheduled notes.
 */
class NoteSchedule {
	/**
     * Initializes the NoteSchedule object.
     * @constructor
     */
	constructor() {
		this.schedule = [];
		this.secondsPerBeat = 0.5;
		this.ppq = PPQ;
		this.volume = 0.5;
		this.instruments = [];
		this.audioSchedule = [];
		this.audioScheduleIndex = 0;
		this.audioScheduleTime = 0;
		this.audioScheduleInterval = null;
		this.audioScheduleStartTime = null;
		this.isPlaying = false;
		this.playbackNode = null;
		this.renderingCtx = null;
	}

	/**
     * Sets the tempo of playback.
     * @param {number} bpm The tempo, in beats per minute.
     */
	setBPM(bpm) {
		this.secondsPerBeat = 60 / bpm;
	}

	/**
     * Adds an instrument to the list of instruments.
     * @param {number} index Which array index in the instrument list to insert the instrument in.
     * @param {string} url The local file location of the sound sample to be used.
     * @param {Object} options Other options:
     * * baseNote: The MIDI note that the input sample is pitched at. The default is 60, or Middle C.
     * * hasLongSustain: If the note plays longer than most others. This option is reserved for
     * the small subset of sustained instruments in MM2.
     */
	async addInstrument(index, url, options) {
		let that = this;
		let baseNote = KEY_C4;
		let hasLongSustain = false;
		if (options.baseNote !== undefined) baseNote = options.baseNote;
		if (options.hasLongSustain !== undefined) hasLongSustain = options.hasLongSustain;
		that.instruments[index] = new Instrument(await loadSample(url), baseNote);
		that.instruments[index].hasLongSustain = hasLongSustain;
	}

	/**
     * Adds a note to the list of scheduled notes. Notes need to be added in chronological order to work properly.
     * @param {Object} note An object describing the basic features of the note:
     * * instrument: The ID of the instrument stored in this NoteSchedule.
     * * value: The MIDI pitch of the note.
     * * ticks: The time that the note is played.
     */
	addNote(note) {
		let prevNotes = this.getLastNotesOfInstrument(note.instrument, note.time);
		if (prevNotes.length > 0) {
			// prevNotes.duration = note.time - prevNotes.ticks;
			for (let i = 0; i < prevNotes.length; i++) {
				prevNotes[i].duration = note.time - prevNotes[i].ticks;
			}
		}
		this.schedule.push({
			instrument: note.instrument, value: note.value, duration: Infinity, ticks: note.time
		});
	}

	getLastNotesOfInstrument(instrument, disallowedTicks = -1) {
		// Get the last note played by the specified instruments whose ticks are not equal to disallowedTicks
		let foundNotes = [];
		let foundTicks = -1;
		for (let i = this.schedule.length - 1; i >= 0; i--) {
			let thisNote = this.schedule[i];
			if (thisNote.instrument === instrument && thisNote.ticks !== disallowedTicks && foundTicks === -1) {
				// Begin capturing all other notes that play at the same time as the found note
				foundTicks = thisNote.ticks;
			}
			if (thisNote.ticks === foundTicks) foundNotes.push(thisNote);
			else if (foundTicks !== -1) break; // Break when no other notes at the found time were detected
		}
		return foundNotes;
	}

	/**
     * Stops playback and cancels all scheduled notes.
     */
	stop() {
		this.isPlaying = false;
		clearInterval(this.audioScheduleInterval);
		this.audioScheduleIndex = 0;
		if (this.playbackNode !== null) this.playbackNode.stop();
		audioCtx.suspend();
		audioCtx = new window.AudioContext();
	}

	playRealTime() {
		console.table(this.schedule);
		this.schedule.forEach((thisNote, idx) => { // Second pass; play back each note at the correct duration
			let time = this.ticksToSeconds(thisNote.ticks) + audioCtx.currentTime + LOAD_DELAY;
			let duration = this.ticksToSeconds(thisNote.duration);
			let inst = thisNote.instrument;
			this.instruments[inst].playNoteRealTime(thisNote.value, time, this.instruments[inst].hasLongSustain, duration, audioCtx);
		});
	}

	/**
     * Pre-renders and plays the notes in the schedule.
     * @returns {Promise} A Promise that resolves when rendering has completed.
     */
	async playPrerender() {
		let that = this;
		// To monitor progress, see https://github.com/WebAudio/web-audio-api/issues/302#issuecomment-310829366
		let buffer = await that.render();
		if (isPlaybackInterrupted) return;
		let source = audioCtx.createBufferSource();
		that.playbackNode = source;
		source.buffer = buffer;
		source.connect(audioCtx.destination);
		source.start();
	}

	/**
     * Renders the notes in the schedule to an audio buffer.
     * @returns {Promise<AudioBuffer>} A Promise holding the rendered audio buffer.
     */
	async render() {
		let offlineCtx = new window.OfflineAudioContext(1, Math.ceil((this.ticksToSeconds(this.schedule[this.schedule.length - 1].ticks) + 2) * SAMPLE_RATE), SAMPLE_RATE);
		this.renderingCtx = offlineCtx;
		let that = this;

		this.schedule.forEach((thisNote, idx) => { // Second pass; play back each note at the correct duration
			let time = that.ticksToSeconds(thisNote.ticks);
			let inst = thisNote.instrument;
			// that.audioSchedule.push({inst: inst, pitch: thisNote.value, time: time, duration: 1});
			that.instruments[inst].playNote(thisNote.value, time, 1, offlineCtx);
		});

		let renderedBuffer = await offlineCtx.startRendering();
		return renderedBuffer;
	}

	/**
     * Cancels the audio rendering process.
     */
	cancelRender() {
		this.renderingCtx.suspend();
		setPlaybackWaitStatus(false);
	}

	/**
     * Clears the schedule of all notes.
     */
	clear() {
		this.schedule = [];
	}

	/**
     * Converts a duration in playback ticks to seconds.
     * @param {number} ticks The number of playback ticks.
     * @returns {number} The equivalent number of seconds.
     */
	ticksToSeconds(ticks) {
		return (ticks / this.ppq) * this.secondsPerBeat;
	}
}
