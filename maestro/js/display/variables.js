let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
let minimap = document.getElementById('minimap');
let ctxMini = minimap.getContext('2d');
let miniRect = minimap.getBoundingClientRect();
let mox = miniRect.left;
let moy = miniRect.top;
let dragging = false;
let mx = 0;
let my = 0;
let lastMiniData = null;
let minimapZoomY = 1;
let minimapZoomX = 1; // Unused

/**
 * A set of DrawLayers for the main display.
 */
const dlayer = {
    bgLayer: 0,
    noteLayer: 3,
    overlayLayer: 4,
    outlineLayer: 5,
    mouseLayer: 6
};
const canvasWidth = 3840;
const canvasHeight = 432;
const miniHeight = 64;
const numCanvasLayers = 7;
const numMiniLayers = 2;
const miniPlotSize = 2;

// 0: BG, 1: Semisolids, 2: One-ways, 3: Notes, 4: Overlays, 5: Cursor and tools
let canvasLayers = makeLayers(numCanvasLayers, canvasWidth, canvasHeight);
let miniLayers;