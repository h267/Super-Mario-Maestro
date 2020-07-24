class EditEvent {
	constructor(track, type, data) {
		this.track = track;
		this.type = type;
		this.data = data;
	}

	run() { // TODO: This and redo functionality
		switch (this.type) {
		case 0: console.log('add note'); break;
		case 1: console.log('rm note'); break;
		default: console.log(`Unknown event type: ${this.type}`);
		}
	}

	runInverse() {
		switch (this.type) {
		case 0:
			tracks[this.track].notes.splice(this.data.idx, 1);
			midi.trks[this.track].notes.splice(this.data.idx, 1);
			refreshBlocks();
			softRefresh();
			break;
		case 1: // FIXME: Change restored notes to correct instrument
			this.data.note.instrument = tracks[this.track].instrumentChanges[0]; // Fix instrument smuggling
			tracks[this.track].notes.splice(this.data.idx, 0, this.data.note);
			midi.trks[this.track].notes.splice(this.data.idx, 0, this.data.note);
			refreshBlocks();
			softRefresh();
			break;
		default:
			console.log(`Unknown event type: ${this.type}`);
		}
	}
}
