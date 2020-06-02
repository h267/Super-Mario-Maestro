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
