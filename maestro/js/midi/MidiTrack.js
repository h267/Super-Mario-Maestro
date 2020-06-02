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
        this.usedChannels = [];
        this.notes = [];
        this.hasPercussion = false;
        this.highestNote = null;
        this.lowestNote = null;
    }
}