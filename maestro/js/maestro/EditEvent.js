class EditEvent {
	constructor(track, type, data) {
		this.track = track;
		this.type = type;
		this.data = data;
	}

	run() {
		switch (this.type) {
		case 0: console.log('add note'); break;
		case 1: console.log('rm note'); break;
		default: console.log(`Unknown event type: ${this.type}`);
		}
	}

	runInverse() {
		switch (this.type) {
		case 0: console.log('!add note'); break;
		case 1: console.log('!rm note'); break;
		default: console.log(`Unknown event type: ${this.type}`);
		}
	}
}
