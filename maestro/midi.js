let currentInstrument = new Array(16).fill(0);
let ppos = 0;
let tpos = 0;
let runningStatus = null;
let trackDuration = 0;
let noteDelta = Array(16).fill(0);
let isNewTrack = true;
let currentLabel = 'Goomba';

// Thank you to the person who already did this for me
const midiInstrumentNames = ['Acoustic Grand Piano', 'Bright Acoustic Piano',
	'Electric Grand Piano', 'Honky-tonk Piano',
	'Electric Piano 1', 'Electric Piano 2', 'Harpsichord',
	'Clavinet', 'Celesta', 'Glockenspiel', 'Music Box',
	'Vibraphone', 'Marimba', 'Xylophone', 'Tubular Bells',
	'Dulcimer', 'Drawbar Organ', 'Percussive Organ',
	'Rock Organ', 'Church Organ', 'Reed Organ', 'Accordion',
	'Harmonica', 'Tango Accordion', 'Acoustic Guitar (nylon)',
	'Acoustic Guitar (steel)', 'Electric Guitar (jazz)',
	'Electric Guitar (clean)', 'Electric Guitar (muted)',
	'Overdriven Guitar', 'Distortion Guitar',
	'Guitar Harmonics', 'Acoustic Bass',
	'Electric Bass (finger)', 'Electric Bass (pick)',
	'Fretless Bass', 'Slap Bass 1', 'Slap Bass 2',
	'Synth Bass 1', 'Synth Bass 2', 'Violin', 'Viola', 'Cello',
	'Contrabass', 'Tremolo Strings', 'Pizzicato Strings',
	'Orchestral Harp', 'Timpani', 'String Ensemble 1',
	'String Ensemble 2', 'Synth Strings 1', 'Synth Strings 2',
	'Choir Aahs', 'Voice Oohs', 'Synth Choir', 'Orchestra Hit',
	'Trumpet', 'Trombone', 'Tuba', 'Muted Trumpet',
	'French Horn', 'Brass Section', 'Synth Brass 1',
	'Synth Brass 2', 'Soprano Sax', 'Alto Sax', 'Tenor Sax',
	'Baritone Sax', 'Oboe', 'English Horn', 'Bassoon',
	'Clarinet', 'Piccolo', 'Flute', 'Recorder', 'Pan Flute',
	'Blown bottle', 'Shakuhachi', 'Whistle', 'Ocarina',
	'Lead 1 (square)', 'Lead 2 (sawtooth)',
	'Lead 3 (calliope)', 'Lead 4 chiff', 'Lead 5 (charang)',
	'Lead 6 (voice)', 'Lead 7 (fifths)',
	'Lead 8 (bass + lead)', 'Pad 1 (new age)', 'Pad 2 (warm)',
	'Pad 3 (polysynth)', 'Pad 4 (choir)', 'Pad 5 (bowed)',
	'Pad 6 (metallic)', 'Pad 7 (halo)', 'Pad 8 (sweep)',
	'FX 1 (rain)', 'FX 2 (soundtrack)', 'FX 3 (crystal)',
	'FX 4 (atmosphere)', 'FX 5 (brightness)', 'FX 6 (goblins)',
	'FX 7 (echoes)', 'FX 8 (sci-fi)', 'Sitar', 'Banjo',
	'Shamisen', 'Koto', 'Kalimba', 'Bagpipe', 'Fiddle',
	'Shanai', 'Tinkle Bell', 'Agogo', 'Steel Drums',
	'Woodblock', 'Taiko Drum', 'Melodic Tom', 'Synth Drum',
	'Reverse Cymbal', 'Guitar Fret Noise', 'Breath Noise',
	'Seashore', 'Bird Tweet', 'Telephone Ring', 'Helicopter',
	'Applause', 'Gunshot'];

/**
 * A container that holds MIDI data parsed from a MIDI file.
 */
class MIDIfile {
	/**
       * Initializes the MIDIfile object.
       * @param {Uint8Array} bytes An array of 8-bit unsigned bytes that express the MIDI data.
       * @constructor
       */
	constructor(bytes) {
		this.bytes = bytes;
		this.trks = null;
		this.error = null;
		this.debug = 0;
		this.timingFormat = 0;
		this.timing = 0;
		this.duration = 0;
		this.noteCount = 0;
		this.blocksPerBeat = 1;
		this.precision = 3;
		this.firstBbar = 1;
		this.firstTempo = 0;
		currentInstrument = new Array(16).fill(0);
		ppos = 0;
		tpos = 0;
		runningStatus = null;
		trackDuration = 0;
		noteDelta = Array(16).fill(0);
		isNewTrack = true;
		currentLabel = 'Goomba';
		this.parse();
		if (this.error !== null) {
			alert(`An error occurred while attempting to read the file:\n
			${this.error.msg}\nPosition 0x${this.error.pos.toString(16)}`);
		}
	}

	// Main parsing functions

	/**
       * Parses the loaded MIDI data.
       */
	parse() {
		// console.log('Started parsing');
		this.parseHeader();
		if (this.error !== null) {
			if (this.error.code <= 2 && this.error.code !== 0) {
				return;
			}
		}
		this.trks = new Array(this.ntrks);
		let t0 = (new Date()).getTime();
		let i;
		for (i = 0; i < this.ntrks; i++) {
			this.trks[i] = new MIDItrack();
		}
		for (tpos = 0; tpos < this.ntrks; tpos++) {
			isNewTrack = true;
			this.trks[tpos].usedInstruments.push();
			this.parseTrack();
			// console.log(this.trks[tpos].events);
		}
		let lowestQuantizeError = Infinity;
		let bestBPB = 0;
		for (i = 0; i < 16; i++) {
			let total = 0;
			for (let j = 0; j < this.trks.length; j++) {
				total += this.trks[j].quantizeErrors[i];
			}
			// console.log('BPB: ' + (i+1) + ', error: ' + total);
			if (total < lowestQuantizeError && i < 8) {
				lowestQuantizeError = total;
				bestBPB = i + 1;
			}
		}
		this.blocksPerBeat = bestBPB;
		// console.log(this);
		// console.log(this.noteCount+' notes');
		// console.log('MIDI data loaded in '+((new Date).getTime() - t0)+' ms');
	}

	/**
       * Parses the MIDI header, which determines the number of tracks and timing in the MIDI file.
       */
	parseHeader() {
		if (this.fetchString(4) === 'MThd') { /* console.log('MThd'); */ } else {
			console.log('ERROR: No MThd');
			this.error = { code: 1, pos: ppos, msg: 'No MIDI header detected.' };
			return;
		}
		if (this.fetchBytes(4) !== 6) {
			console.log('ERROR: File header is not 6 bytes long.');
			this.error = { code: 2, pos: ppos, msg: 'Unrecognized MIDI header length.' };
			return;
		}
		this.fmt = this.fetchBytes(2);
		if (this.fmt > 2) {
			console.log('ERROR: Unrecognized format number.');
			this.error = { code: 3, pos: ppos, msg: 'Unrecognized MIDI format number.' };
		}
		this.ntrks = this.fetchBytes(2);
		// console.log('Format '+this.fmt+', '+this.ntrks+' tracks');

		// Parse timing division
		let tdiv = this.fetchBytes(2);
		if (!(tdiv >> 16)) {
			// console.log(tdiv+' ticks per quarter note');
			this.timing = tdiv;
		} else {
			console.log('SMPTE timing format is unsupported.');
			alert('SMPTE timing format is currently unsupported. Please give feedback if you see this message.');
			this.timingFormat = 1;
		}
	}

	/**
       * Parses a single MIDI track, which contains all of the events for one MIDI track.
       */
	parseTrack() {
		let done = false;
		if (this.fetchString(4) !== 'MTrk') {
			console.log('ERROR: No MTrk');
			this.error = { code: 4, pos: ppos, msg: 'Failed to find MIDI track.' };
			return;
		}
		// this.trks.push(new MIDItrack());
		let len = this.fetchBytes(4);
		// console.log('len = '+len);
		while (!done) {
			done = this.parseEvent();
		}
		this.labelCurrentTrack();
		// console.log('Track '+tpos);
		// console.log(this.trks[tpos].events);
		// console.log(trackDuration);
		if (trackDuration > this.duration) { this.duration = trackDuration; }
		trackDuration = 0;
		noteDelta.fill(0);
	}

	/**
       * Parses a MIDI event and puts the data in a MIDIevent object.
       */
	parseEvent() {
		let addr = ppos;
		let delta = this.parseDeltaTime();
		trackDuration += delta;
		let statusByte = this.fetchBytes(1);
		let data = [];
		let rs = false;
		let EOT = false;
		if (statusByte < 128) { // Running status
			data.push(statusByte);
			statusByte = runningStatus;
			rs = true;
		} else {
			runningStatus = statusByte;
		}
		let eventType = statusByte >> 4;
		let channel = statusByte & 0x0F;
		if (eventType === 0xF) { // System events and meta events
			switch (channel) { // System message types are stored in the last nibble instead of a channel
			// Don't really need these and probably nobody uses them but we'll keep them for completeness.

			case 0x0: // System exclusive message -- wait for exit sequence
				// console.log('sysex');
				let cbyte = this.fetchBytes(1);
				while (cbyte !== 247) {
					data.push(cbyte);
					cbyte = this.fetchBytes(1);
				}
				break;

			case 0x2:
				data.push(this.fetchBytes(1));
				data.push(this.fetchBytes(1));
				break;

			case 0x3:
				data.push(this.fetchBytes(1));
				break;

			case 0xF: // Meta events: where some actually important non-music stuff happens
				let metaType = this.fetchBytes(1);
				let len;
				switch (metaType) {
				case 0x2F: // End of track
					this.skip(1);
					EOT = true;
					// console.log('EOT');
					break;

				case 0x51:
					len = this.fetchBytes(1);
					data.push(this.fetchBytes(len)); // All one value
					if (this.firstTempo === 0) { [this.firstTempo] = data; }
					break;
				case 0x58:
					len = this.fetchBytes(1);
					for (let i = 0; i < len; i++) {
						data.push(this.fetchBytes(1));
					}
					if (this.firstBbar === 0) { this.firstBbar = data[0] / 2 ** data[1]; }
					break;
				default:
					len = this.fetchBytes(1);
					// console.log('Mlen = '+len);
					for (let i = 0; i < len; i++) {
						data.push(this.fetchBytes(1));
					}
				}
				eventType = getIntFromBytes([0xFF, metaType]);
				break;
			default: console.log('parser error');
			}
			if (channel !== 15) { eventType = statusByte; }
			channel = -1; // global
		} else {
			switch (eventType) {
			case 0x9:
				if (!rs) { data.push(this.fetchBytes(1)); }
				data.push(this.fetchBytes(1));
				if (data[1] === 0) { break; }
				let ins;
				// var ins = currentInstrument[channel]; // Patch out percussion splitting
				// TODO: Patch back in, in a new way
				if (channel === 9) {
					this.trks[tpos].hasPercussion = true;
					[ins] = data;
				} else {
					ins = currentInstrument[channel];
				}
				let note = new Note(trackDuration, data[0], data[1], ins, channel);
				if ((data[0] < this.trks[tpos].lowestNote && !this.trks[tpos].hasPercussion)
				|| this.trks[tpos].lowestNote === null) {
					[this.trks[tpos].lowestNote] = data;
				}
				if (data[0] > this.trks[tpos].highestNote && !this.trks[tpos].hasPercussion) {
					[this.trks[tpos].highestNote] = data;
				}
				this.trks[tpos].notes.push(note);
				if (isNotInArr(this.trks[tpos].usedInstruments, ins)) {
					this.trks[tpos].usedInstruments.push(ins);
				}
				break;
			case 0xC:
				if (!rs) { data.push(this.fetchBytes(1)); }
				// console.log(tpos+': '+data[0]);
				currentLabel = getInstrumentLabel(data[0]);
				// The last instrument on a channel ends where an instrument on the same channel begins
				// this.usedInstruments[tpos].push({ins: data[0], ch: channel, start: trackDuration});
				// if(notInArr(this.usedInstruments,data[0])){this.usedInstruments.push(data[0])} // Do this for now
				[currentInstrument[channel]] = data;
				break;
			case 0xD:
				if (!rs) { data.push(this.fetchBytes(1)); }
				break;
			default:
				if (!rs) { data.push(this.fetchBytes(1)); }
				data.push(this.fetchBytes(1));
			}
			for (let i = 0; i < noteDelta.length; i++) {
				noteDelta[i] += delta;
			}
			if (eventType === 0x9 && data[1] !== 0) {
				// console.log(bpbStuff);
				for (let i = 1; i <= 16; i++) {
					let x = (i * noteDelta[channel]) / this.timing;
					let roundX = Math.round(x);
					// console.log("Rounded by: " + roundX-x);
					this.trks[tpos].quantizeErrors[i - 1] += Math.round(Math.abs((roundX - x) / i) * 100);
				}
				noteDelta[channel] = 0;
				this.noteCount++;
			}
		}
		this.trks[tpos].events.push(new MIDIevent(delta, eventType, channel, data, addr));
		// console.log('+'+delta+': '+eventType+' @'+channel);
		// console.log(data);
		// this.debug++;
		if (this.debug > 0) { return true; }
		return EOT;// || this.debug>=4;
	}

	// Helper parsing functions

	/**
       * Gets the integer from retrieving a specified number of bytes from the MIDI data stream
	 * and advances the read position.
       * @param {number} n The number of bytes to retrieve from the MIDI data stream.
       * @returns {number} An integer value corresponding to the retrieved bytes.
       */
	fetchBytes(n) {
		let i;
		let byteArr = [];
		for (i = 0; i < n; i++) {
			byteArr[i] = this.bytes[ppos + i];
		}
		ppos += n;
		if (n === 1) { return byteArr[0]; }
		return getIntFromBytes(byteArr);
	}

	/**
       * Gets the string from retrieving a specified number of bytes from the MIDI data stream
	 * and advances the read position.
       * @param {number} n The number of bytes to retrieve and convert to a string from the MIDI data stream.
       * @returns {string} The string created by the retrieved bytes.
       */
	fetchString(n) {
		let i;
		let str = '';
		for (i = 0; i < n; i++) {
			str += ASCII(this.bytes[ppos + i]);
		}
		ppos += n;
		return str;
	}

	/**
       * Parses a delta time value in a MIDI event.
       * @returns {number} The parsed delta time value.
       */
	parseDeltaTime() {
		let reading = true;
		let arr = [];
		let nbytes = 0;
		while (reading) {
			nbytes++;
			if (nbytes > 4) {
				console.log('Something is very wrong here.');
				console.log(this.trks[tpos].events);
				this.debug = 1;
				break;
			}
			let byte = this.fetchBytes(1);
			if (byte < 128) {
				reading = false;
				arr.push(byte);
			} else {
				arr.push(byte - 128);
			}
		}
		return getIntFromBytes(arr, 7);
	}

	/**
       * Makes the parser position skip a number of bytes.
       * @param {number} n The number of bytes to skip parsing.
       */
	// eslint-disable-next-line class-methods-use-this
	skip(n) {
		ppos += n;
	}

	/**
       * Generates a label for the current MIDI track.
       */
	labelCurrentTrack() {
		let labl = 'empty';
		if (this.trks[tpos].usedInstruments.length === 1) {
			if (this.trks[tpos].hasPercussion) {
				labl = 'Percussion';
			} else {
				labl = getInstrumentLabel(this.trks[tpos].usedInstruments[0]);
			}
		} else if (this.trks[tpos].usedInstruments.length > 1) {
			labl = 'Mixed Track';
		}
		this.trks[tpos].label = `${labl} ${this.getLabelNumber(labl)}`;
	}

	/**
       * Finds the number of duplicate track labels from a specified label.
       * @param {string} label The label to check for duplicates.
       * @returns {number} The number of duplicates plus one.
       */
	getLabelNumber(label) { // Check for duplicates
		let iteration = 0;
		let pass = false;
		while (!pass) {
			iteration++;
			pass = true;
			let thisLabel = `${label} ${iteration.toString()}`;
			// console.log(thisLabel);
			let i = 0;
			for (i = 0; i < this.trks.length; i++) {
				if (thisLabel === this.trks[i].label) { pass = false; }
			}
		}
		return iteration;
	}
}

/**
 * A single MIDI event.
 */
class MIDIevent {
	/**
       * Initializes the MIDIevent object.
       * @param {number} deltaTime The number of ticks elapsed before this event.
       * @param {number} type The type of MIDI event.
       * @param {number} channel Which MIDI channel this event occurs on.
       * @param {number} data An array of parameters for this event.
       * @param {number} address The position of this event in the MIDI file.
       * @constructor
       */
	constructor(deltaTime, type, channel, data, address) {
		this.deltaTime = deltaTime;
		this.type = type;
		this.channel = channel; // -1 means global event, such as meta or sysex
		this.data = data; // An array of the parameters
		this.address = address;
	}
}

/**
 * A single MIDI track, which holds a number of MIDI events.
 */
class MIDItrack {
	/**
       * Initializes the MIDItrack object.
       * @constructor
       */
	constructor() {
		this.events = [];
		this.label = '';
		this.quantizeErrors = new Array(16).fill(0);
		this.usedInstruments = [];
		this.notes = [];
		this.hasPercussion = false;
		this.highestNote = null;
		this.lowestNote = null;
	}
}

/**
 * A music note.
 */
class Note {
	/**
       * Initializes the Note object.
       * @param time The absolute time, in ticks, at which this note plays.
       * @param pitch The MIDI note number of this note.
       * @param volume The velocity of this note, from 0 to 127.
       * @param instrument The MIDI instrument number of this note.
       * @param channel Which MIDI channel this instrument plays on.
       * @constructor
       */
	constructor(time, pitch, volume, instrument, channel) {
		this.time = time;
		this.pitch = pitch;
		this.key = pitch; // For percussion
		this.volume = volume;
		this.originalInstrument = instrument;
		this.instrument = instrument;
		this.channel = channel;
	}
}

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
	if (midiInstrument <= 8) { return 'Goomba'; } // Piano
	if (midiInstrument >= 9 && midiInstrument <= 16) { return 'Shellmet'; } // Chromatic Percussion
	if (midiInstrument >= 17 && midiInstrument <= 24) { return '1-Up'; } // Organ
	if (midiInstrument >= 25 && midiInstrument <= 32) { return 'Chain Chomp'; } // Guitar
	if (midiInstrument >= 33 && midiInstrument <= 40) { return 'Spike'; } // Bass
	if (midiInstrument >= 41 && midiInstrument <= 48) { return 'Fire Flower'; } // Strings
	if (midiInstrument >= 49 && midiInstrument <= 56) { return 'Bob-Omb'; } // Ensemble
	if (midiInstrument >= 57 && midiInstrument <= 72) { return 'Spiny Shellmet'; } // Brass, Lead
	if (midiInstrument >= 73 && midiInstrument <= 80) { return 'Dry Bones Shell'; } // Pipe
	if (midiInstrument >= 81 && midiInstrument <= 88) { return 'Mushroom'; } // Synth Lead
	if (midiInstrument >= 89 && midiInstrument <= 96) { return 'Rotten Mushroom'; } // Synth Pad
	if (midiInstrument >= 97 && midiInstrument <= 104) { return 'Goomba'; } // Synth Effects
	if (midiInstrument >= 105 && midiInstrument <= 112) { return 'Monty Mole'; } // Ethnic
	if (midiInstrument >= 113 && midiInstrument <= 120) { return 'P-Switch'; } // Percussive
	if (midiInstrument >= 121 && midiInstrument <= 128) { return 'Goomba'; } // Sound Effects

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
		if (arr[i] === n) { return false; }
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
