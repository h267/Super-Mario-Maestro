// Super Mario Maestro v1.4
// made by h267

// FIXME: Playback breaks after clicking different tracks?
// FIXME: Sometimes playback cannot be stopped

// TODO: Switch to original instrument when invalid instrument is switched to (adv settings toggle)
// TODO: Finish replacing midi tracks with Maestro tracks
// TODO: Eliminate instrument changes array, just use instrument of first note
// TODO: Build mode restrictions, button disable

// TODO: Re-enable gtag when releasing
// TODO: Disable auto tool enable when releasing

const discordInviteLink = 'https://discord.gg/KhmXzfp';
const tutorialLink = 'https://docs.google.com/document/d/1UG-Y-2zbdcqE7ciMgPVT3HICWEZHP002HmukCuWctxg/edit';
const contPlayback = false; // Dev toggle for full map playback
const numParts = 20;
const autoShowRatio = 0.7;
const showDebugLabels = false;
const useSolver = true;

let reader = new FileReader();
let numCommonTempos = 0;
let midi;
let tracks = [];
let mapWidth;
let alphabetizedInstruments = alphabetizeInstruments(MM2Instruments);
let tiles;
let bgs;
let marioSprites;
let toolIcons;
let speed = 10;
let level = new Level();
let ofsX = 0;
let ofsY = baseOfsY;
let bpm = 120;
let songBPM = 120;
let fileLoaded = false;
let blocksPerBeat = 4;
let recmdBlocksPerBeat = 4;
let currentHighlight = { x: -1, y: -1 };
let prevHighlighted = false;
let minimapData = null;
let displayData = null;
let bbar = 1;
let noMouse = false;
let isNewFile;
let noiseThreshold = 0;
let selectedTrack = 0;
let quantizeErrorAggregate = 0;
let scrollPos = 0;
let conflictCount = 0;
let usingAdvSettings = false;
let acceptableBPBs = null;
let reccBPB;
let lastBPB;
let outlineLayers;
let numRecommendedInstruments = 0;
let entityOverflowStatus = { entity: false, powerup: false };
let noteRange = 0;
let defaultZoom = 1;
let hasLoadedBuffers = false;
let showUnbuildables = false;
let canvasZoom = 1;
let isBuildMode = false;
let isSoloMode = false;
let undoManager = new UndoManager();

// getEquivalentBlocks(1.5);

// Load graphics and draw the initial state of the level
document.getElementById('canvas').addEventListener('mouseout', handleOut, false);
loadToolIcons().then(async (icons) => {
	toolIcons = icons;
	tiles = await loadTiles();
	bgs = await loadBGs();
	marioSprites = await loadMario();
	drawLevel(false, true);
});

loadBuffers().then(() => {
	hasLoadedBuffers = true;
	document.getElementById('stopBtn').innerHTML = 'Stop';
	document.getElementById('stopBtn').disabled = false;
	document.getElementById('playBtn').innerHTML = 'Play';
	document.getElementById('playBtn').disabled = false;
});
