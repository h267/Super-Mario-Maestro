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
        if (this.fetchString(4) === 'MThd') { /* console.log('MThd'); */
        } else {
            console.log('ERROR: No MThd');
            this.error = {code: 1, pos: ppos, msg: 'No MIDI header detected.'};
            return;
        }
        if (this.fetchBytes(4) !== 6) {
            console.log('ERROR: File header is not 6 bytes long.');
            this.error = {code: 2, pos: ppos, msg: 'Unrecognized MIDI header length.'};
            return;
        }
        this.fmt = this.fetchBytes(2);
        if (this.fmt > 2) {
            console.log('ERROR: Unrecognized format number.');
            this.error = {code: 3, pos: ppos, msg: 'Unrecognized MIDI format number.'};
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
            this.error = {code: 4, pos: ppos, msg: 'Failed to find MIDI track.'};
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
        if (trackDuration > this.duration) {
            this.duration = trackDuration;
        }
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
                            if (this.firstTempo === 0) {
                                [this.firstTempo] = data;
                            }
                            break;
                        case 0x58:
                            len = this.fetchBytes(1);
                            for (let i = 0; i < len; i++) {
                                data.push(this.fetchBytes(1));
                            }
                            if (this.firstBbar === 0) {
                                this.firstBbar = data[0] / 2 ** data[1];
                            }
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
                default:
                    console.log('parser error');
            }
            if (channel !== 15) {
                eventType = statusByte;
            }
            channel = -1; // global
        } else {
            switch (eventType) {
                case 0x9:
                    if (!rs) {
                        data.push(this.fetchBytes(1));
                    }
                    data.push(this.fetchBytes(1));
                    if (data[1] === 0) {
                        break;
                    }
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
                    if (isNotInArr(this.trks[tpos].usedChannels, channel)) {
                        this.trks[tpos].usedChannels.push(channel);
                    }
                    break;
                case 0xC:
                    if (!rs) {
                        data.push(this.fetchBytes(1));
                    }
                    // console.log(tpos+': '+data[0]);
                    currentLabel = getInstrumentLabel(data[0]);
                    // The last instrument on a channel ends where an instrument on the same channel begins
                    // this.usedInstruments[tpos].push({ins: data[0], ch: channel, start: trackDuration});
                    // if(notInArr(this.usedInstruments,data[0])){this.usedInstruments.push(data[0])} // Do this for now
                    [currentInstrument[channel]] = data;
                    break;
                case 0xD:
                    if (!rs) {
                        data.push(this.fetchBytes(1));
                    }
                    break;
                default:
                    if (!rs) {
                        data.push(this.fetchBytes(1));
                    }
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
        if (this.debug > 0) {
            return true;
        }
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
        if (n === 1) {
            return byteArr[0];
        }
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
                if (thisLabel === this.trks[i].label) {
                    pass = false;
                }
            }
        }
        return iteration;
    }
}