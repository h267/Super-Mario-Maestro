class MaestroTrack {
    constructor(midiTrk) {
        this.notes = [];
        this.octaveShift = 0;
        this.semitoneShift = 0;
        this.origInstrument = 0;
        this.instrumentChanges = [];
        if (midiTrk.usedInstruments[0] !== undefined) {
            this.instrumentChanges.push(getMM2Instrument(midiTrk.usedInstruments[0]) - 2);
            this.origInstrument = getMM2Instrument(midiTrk.usedInstruments[0]) - 2;
        }
        this.hasVisibleNotes = false;
        this.numNotesOffscreen = {above: 0, below: 0};
        this.label = midiTrk.label;
        this.hasPercussion = midiTrk.hasPercussion;
        this.isFromUser = false;
        if (midiTrk.isFromUser) this.isFromUser = true;

        if (midiTrk === null) return;
        midiTrk.notes.forEach((midiNote) => {
            this.notes.push(new MaestroNote(midiNote));
        });
    }
}