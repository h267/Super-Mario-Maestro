class MaestroNote {
    constructor(midiNote = null) {
        if (midiNote === null) return;
        this.pitch = midiNote.pitch;
        this.time = midiNote.time; // TODO: Store x coord at 4 bpb
        let insId;
        if (midiNote.channel !== 9) insId = getMM2Instrument(midiNote.instrument) - 2;
        else {
            insId = getPercussionInstrument(midiNote.instrument);
            this.pitch = 56;
        }
        this.instrument = insId;
    }
}
