class UndoManager {
	constructor() {
		this.undoStack = [];
		this.undoIndex = 0;
	}

	addEvent(event) {
		this.undoStack.push(event);
		this.undoIndex = this.undoStack.length - 1;
	}

	undo() {
		let undoEvent = this.undoStack.pop();
		undoEvent.runInverse();
	}
}
