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