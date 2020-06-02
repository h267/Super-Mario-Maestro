/**
 * A simplified Note class optimized for placement in the level.
 */
class PreloadedNote {
    /**
     * Initializes the PreloadedNote.
     * @param {number} pitch The MIDI pitch of the note.
     * @param {number} instrument The MIDI instrument of the note.
     * @param {number} x The x-coordinate of the note to be placed in relation to the entire MIDI file.
     * @param {number} y The y-coordinate of the note to be placed in relation to the entire MIDI file.
     * @param {MaestroNote} origNote The corresponding MaestroNote object.
     * @constructor
     */
    constructor(pitch, instrument, x, y, origNote) {
        this.pitch = pitch;
        this.instrument = instrument;

        this.x = x; // Math.floor(x);
        // this.xShift = x - this.x;

        this.y = y;
        this.origNote = origNote;
    }
}