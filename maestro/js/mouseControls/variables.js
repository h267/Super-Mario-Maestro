let isLoaded = false;

let lastClickedTile = null;
let lastClickedLvlPos = null;

let mouseToolId = 2;
let prevMouseToolId = 2;
let cursorImg;
let currentMouseTool = null;
let editHistory = [];
let isMainMouseHolding = false;

let showRuler = false;
let isHiddenToolsEnabled = false;

let secondaryTrack = 0;

window.addEventListener('load', () => { // Wait for everything to load before executing
	setupToolIcons();
	setupToolbar();
	// enableMouseTools();
	refreshMouseTool();
	isLoaded = true;
});

// TODO: Functionality

const mouseTools = [
	{
		name: 'Info',
		isVisible: false,
		isHoldable: false,
		onLeftClick: () => infoTool(),
		onRightClick: () => {
		},
		close: () => {
		}
	},
	{
		name: 'Zoom',
		isVisible: false,
		isHoldable: false,
		onLeftClick: () => zoomInTool(),
		onRightClick: () => zoomOutTool(),
		close: () => {
		}
	},
	{
		name: 'Ruler',
		isVisible: true,
		isHoldable: false,
		onLeftClick: () => rulerTool(),
		onRightClick: () => {
		},
		close: () => {
			showRuler = false;
		}
	},
	{
		name: 'Add Note',
		isVisible: true,
		isHoldable: true,
		onLeftClick: () => addNoteTool(),
		onRightClick: () => {
		},
		close: () => {
		}
	},
	{
		name: 'Erase Note',
		isVisible: true,
		isHoldable: true,
		onLeftClick: () => eraseNoteTool(),
		onRightClick: () => {
		},
		close: () => {
		}
	},
	{
		name: 'Select Notes',
		isVisible: false,
		isHoldable: true,
		onLeftClick: () => {
		},
		onRightClick: () => {
		},
		close: () => {
		}
	},
	{
		name: 'Change Track',
		isVisible: true,
		isHoldable: true,
		onLeftClick: () => changeTrackTool(),
		onRightClick: () => {
		},
		close: () => {
		}
	},
	{
		name: 'Forbid Tile',
		isVisible: false,
		isHoldable: true,
		onLeftClick: () => forbidTool(),
		onRightClick: () => unforbidTool(),
		close: () => {
		}
	}
];

const MouseActions = []; // TODO: Fill out
Object.freeze(MouseActions);

minimap.onmousedown = (e) => {
	handleMiniMouseDown(e);
};
minimap.onmousemove = (e) => {
	handleMiniMouseMove(e);
};
minimap.onmouseup = (e) => {
	handleMiniMouseUp(e);
};
minimap.onmouseout = (e) => {
	handleMiniMouseOut(e);
};

canvas.onmousemove = (e) => {
	handleMainMove(e);
};
canvas.onmousedown = (e) => {
	handleMainMouseDown(e);
};
canvas.onmouseup = (e) => {
	handleMainMouseUp(e);
};
canvas.oncontextmenu = (e) => {
	handleMainRightClick(e);
};
canvas.onwheel = (e) => {
	handleMainWheel(e);
};
