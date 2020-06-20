/**
 * Loads the data from an audio file into an AudioBuffer object.
 * @param {string} url The local file location of the audio data to load.
 * @returns {Promise<AudioBuffer>} A Promise containing the loaded audio data as an AudioBuffer object.
 */
function loadSample(url) {
	return new Promise(((resolve, reject) => {
		let request = new XMLHttpRequest();
		request.open('GET', url, true);
		request.responseType = 'arraybuffer';

		request.onload = () => {
			audioCtx.decodeAudioData(request.response, (buffer) => {
				resolve(buffer);
			}, () => {
				console.error(`Failed to decode ${url}.`);
			});
		};
		request.send();
	}));
}

/**
 * Plays the audio in an AudioBuffer.
 * @param {AudioBuffer} buffer The AudioBuffer to play.
 * @param {number} time The amount of time, in seconds, before the note is to be played.
 * @param {number} duration The amount of time, in seconds, that a note can play before being terminated.
 * @param {AudioContext} ctx The AudioContext to play the sound through. (Optional)
 * @returns {AudioBufferSourceNode} The AudioBufferSourceNode that controls this note's playback.
 */
function playBuffer(buffer, time = 0, duration, ctx = audioCtx) {
	let curTime = 0; // audioCtx.currentTime;
	let source = ctx.createBufferSource();
	source.buffer = buffer;
	let gainNode = ctx.createGain();
	gainNode.gain.setValueAtTime(MASTER_VOLUME, 0); // Prevent Firefox bug
	// if(!isNaN(duration)) gainNode.gain.setTargetAtTime(0, curTime + time + duration, 0.4);
	// gainNode.gain.setValueAtTime(0, curTime + time + 0.1);

	source.connect(gainNode);
	gainNode.connect(ctx.destination);

	if (Number.isNaN(duration) || duration === 0) source.start(curTime + time);
	else source.start(curTime + time, 0);
	return source;
}

function playBufferAtPlaybackRate(buffer, time = 0, rate, sustainTime, duration, ctx = audioCtx) {
	// Release note at the end of the duration or at the normal time, whichever is sooner
	let releaseTime = Math.min(time + duration, time + sustainTime);
	let endTime = releaseTime + (RELEASE_DURATION / 44100);

	let source = ctx.createBufferSource();
	source.buffer = buffer;
	source.playbackRate.value = rate;

	let gainNode = ctx.createGain();
	gainNode.gain.value = MASTER_VOLUME;
	gainNode.gain.linearRampToValueAtTime(MASTER_VOLUME, releaseTime);
	gainNode.gain.linearRampToValueAtTime(0, endTime);

	source.connect(gainNode);
	gainNode.connect(ctx.destination);

	// if (Number.isNaN(duration) || duration === 0) source.start(time); // Play polyphonic notes
	// else source.start(time, 0);
	source.start(time, 0);
	return source;
}

/**
 * Converts a MIDI note to a frequency in Hertz.
 * @param {number} note The MIDI note number.
 * @returns {number} The equivalent frequency of the note.
 */
function midiNoteToFreq(note) {
	return (2 ** ((note - KEY_A4) / 12)) * 440;
}

/**
 * Renders an AudioBuffer of an input AudioBuffer played at a specified playback speed.
 * @param {AudioBuffer} buffer The AudioBuffer to render at a different speed.
 * @param {number} rate The playback speed for the original sample to be rendered at.
 * @returns {AudioBuffer} An AudioBuffer of the input buffer being played at the speed.
 */
async function renderBufferAtPlaybackRate(buffer, rate) {
	let newDuration = buffer.duration / rate;
	let offlineCtx = new window.OfflineAudioContext(1, Math.ceil(newDuration * SAMPLE_RATE), SAMPLE_RATE);

	let source = offlineCtx.createBufferSource();
	source.buffer = buffer;
	source.playbackRate.value = rate;
	source.connect(offlineCtx.destination);
	source.start();

	let renderedBuffer = await offlineCtx.startRendering();
	return renderedBuffer;
}

/**
 * Modifies the audio samples in an AudioBuffer to have a linear release envelope.
 * @param {number[]} bufferData A Float32 array of raw audio samples obtained from an AudioBuffer.
 * @param {boolean} hasLongSustain If the note should be played longer than usual.
 */
function applyReleaseEnvelope(bufferData, hasLongSustain) {
	let multiplier;
	let releasePos;
	// Uncommenting this will turn long sustain back on
	/* if(hasLongSustain) releasePos = LONG_RELEASE_POS;
      else */
	releasePos = RELEASE_POS;
	for (let i = releasePos; i < bufferData.length; i++) {
		multiplier = 1.0 - ((i - releasePos) / RELEASE_DURATION);
		bufferData[i] *= Math.max(multiplier, 0);
	}
}
