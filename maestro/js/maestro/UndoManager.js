class UndoManager {
	constructor() {
		this.undoStack = [];
		this.undoIndex = 0;
		this.updateButton();
	}

	addEvent(event) {
		this.undoStack.push(event);
		this.undoIndex = this.undoStack.length - 1;
		this.updateButton();
	}

	undo() {
		if (this.undoStack.length === 0) return;
		let undoEvent = this.undoStack.pop();
		undoEvent.runInverse();
		this.updateButton();
	}

	clear() {
		this.undoStack = [];
		this.undoIndex = 0;
		this.updateButton();
	}

	updateButton() {
		let undoButton = document.getElementById('undoBtn');
		if (this.undoStack.length === 0) {
			undoButton.style.visibility = 'hidden';
		} else {
			undoButton.style.visibility = 'visible';
		}
	}
}
