/**
 * Loads an image from a local file.
 * @param {string} loc The local file path for the image.
 * @returns {Promise<Image>} A promise containing an image object with the loaded image.
 */
function getImg(loc) {
	return new Promise(((resolve, reject) => {
		let img = new Image();
		img.onload = () => {
			resolve(img);
		};
		img.onerror = () => {
			console.log(`Failed to load: ${loc}`);
			reject(img);
		};
		img.src = loc;
	}));
}

/**
 * Plots a point on the minimap.
 * @param {number} x The x-coordinate of the point.
 * @param {number} y The y-coordinate of the point.
 * @param {string} style The fill style. (Optional)
 */
function miniPlot(x, y, style) {
	let drawX = Math.round(x * minimapZoomX);
	let drawY = minimap.height - Math.round((y - (64 - (64 / minimapZoomY) / 2)) * minimapZoomY);
	miniLayers[dlayer.bgLayer].fillRect(drawX, drawY, miniPlotSize, miniPlotSize, style);
}

/**
 * Clears the entire minimap, or a single layer if specified.
 * @param {number} layer The ID of the layer to be cleared. (Optional)
 */
function miniClear(layer) {
	let i;
	if (layer === undefined) {
		for (i = 0; i < miniLayers.length; i++) {
			miniLayers[i].clear();
		}
	} else {
		miniLayers[layer].clear();
	}
}

/**
 * Draws the file scrubber on the minimap.
 * @param {number} x The x-coordinate of the top left corner.
 * @param {number} y The y-coordinate of the top left corner.
 * @param {number} w The width of the scrubber.
 * @param {number} h The height of the scrubber.
 */
function drawScrubber(x, y, w, h) {
	let drawX = Math.round(x * minimapZoomX);
	let drawY = minimap.height - Math.round((y - (64 - (64 / minimapZoomY) / 2)) * minimapZoomY);
	let drawW = Math.round(w * minimapZoomX);
	let drawH = Math.round(h * minimapZoomY);
	miniLayers[1].fillRect(drawX, drawY, drawW, drawH, 'rgba(127,127,255,0.2)');
	miniLayers[1].drawBox(drawX, drawY, drawW, drawH, 1, 'rgb(127,127,255)');
}

/**
 * Clears a layer on the main display.
 * @param {number} layer The ID of the layer on the main display to clear.
 */
function clearDisplayLayer(layer) {
	canvasLayers[layer].clear();
}

/**
 * Changes the width of the minimap.
 * @param {number} w The new width of the minimap.
 */
function setMiniWidth(w) {
	minimap.width = w * minimapZoomX;
	miniLayers = makeLayers(numMiniLayers, w, miniHeight); // 0: Notes, 1: Scrubber
}

/**
 * Highlights a tile on the main display.
 * @param {number} tx The x-coordinate of the tile to be highlighted, in tile units.
 * @param {number} ty The y-coordinate of the tile to be highlighted, in tile units.
 * @param {Object} opts Extra options: (Optional)
 * * style: The fill style.
 * * layer: Which layer to highlight on. It is the overlay layer by default.
 */
function highlightTile(tx, ty, opts) {
	let style = 'rgba(0,255,0,0.5)';
	if (opts.style !== undefined) {
		style = opts.style;
	}
	let layer = dlayer.overlayLayer;
	if (opts.layer !== undefined) {
		layer = opts.layer;
	}
	canvasLayers[layer].fillRect(tx * 16, ty * 16, 16, 16, style);
}

/**
 * Outlines a tile on the main display.
 * @param {number} tx The x-coordinate of the tile to be outlined, in tile units.
 * @param {number} ty The y-coordinate of the tile to be outlined, in tile units.
 * @param {number} thickness The thickness of the outline. (Optional)
 * @param {string} style The stroke style of the outline. (Optional)
 */
function outlineTile(tx, ty, thickness = 1, style = 'rgba(0,255,0,0.5)') {
	canvasLayers[dlayer.overlayLayer].drawBox(tx * 16, ty * 16, 16, 16, thickness, style);
}

/**
 * Outlines a tile on a specific layer on the main display.
 * @param {number} layer The layer ID of the layer to draw the outline on.
 * @param {number} tx The x-coordinate of the tile to be outlined, in tile units.
 * @param {number} ty The y-coordinate of the tile to be outlined, in tile units.
 * @param {number} thickness The thickness of the outline. (Optional)
 * @param {string} style The stroke style of the outline. (Optional)
 */
function outlineTileOnDrawLayer(layer, tx, ty, thickness = 1, style = 'rgba(0,255,0,0.5)') {
	layer.drawBox(tx * 16, ty * 16, 16, 16, thickness, style);
}

/**
 * Highlights a column on the main display.
 * @param {number} tx The x-coordinate of the tile to be highlighted, in tile units.
 * @param {string} style The fill style.
 */
function highlightCol(tx, style = 'rgba(0,255,0,0.5)') {
	canvasLayers[dlayer.mouseLayer].fillRect(tx * 16, 0, 16, canvas.height, style);
}

/**
 * Draws a tile on the main display.
 * @param {Image} image The image to draw.
 * @param {number} x The x-coordinate of where the tile should be drawn.
 * @param {number} y The y-coordinate of where the tile should be drawn.
 * @param {number} layer The layer ID of the layer to draw the tile on.
 * @param {boolean} isSemiTransparent Whether the tile should be drawn with less opacity.
 */
function drawTile(image, x, y, layer = dlayer.noteLayer, isSemiTransparent = false) {
	if (isSemiTransparent) canvasLayers[layer].ctx.globalAlpha = 0.5;
	else canvasLayers[layer].ctx.globalAlpha = 1.0;
	canvasLayers[layer].ctx.drawImage(image, x, y);
	canvasLayers[layer].ctx.globalAlpha = 1.0;
}

/**
 * Draws a sprite on the main display.
 * @param {Image} image The image to draw.
 * @param {number} x The x-coordinate of where the sprite should be drawn.
 * @param {number} y The y-coordinate of where the sprite should be drawn.
 * @param {number} layer The layer ID of the layer to draw the sprite on.
 */
function drawSprite(image, x, y, layer = dlayer.noteLayer) {
	let layerCtx = canvasLayers[layer].ctx;
	layerCtx.shadowColor = 'rgba(0,0,0,0.4)';
	layerCtx.shadowOffsetX = 4;
	layerCtx.drawImage(image, x, y);
	layerCtx.shadowOffsetX = 0;
}

/**
 * Draws the background elements on the main display.
 */
function decorateBG() {
	drawTile(bgs[0], 16, canvas.height - 64, 0);
	drawTile(bgs[1], (240 - 10) * 16, 17 * 16, 0);
}

/**
 * Draws a solid red vertical line, signifying a limit.
 * @param {number} x The x-coordinate to draw the line at.
 */
function drawLimitLine(x) {
	canvasLayers[dlayer.overlayLayer].drawLine(x * 16, 0, x * 16, 27 * 16, 'rgba(255,0,0,1)', 3);
}

/**
 * Fills in the background color on the main display.
 * @param {string} style The fill style of the background.
 */
function setBG(style) {
	canvasLayers[dlayer.bgLayer].fillRect(0, 0, canvas.width, canvas.height, style);
}

/**
 * Draws the background grid.
 */
function drawGrid() {
	let i;
	for (i = 0; i < canvas.width / 16; i++) {
		canvasLayers[dlayer.bgLayer].drawLine(i * 16, 0, i * 16, canvas.height - 1, 'rgba(0,0,0,0.2)');
		if (i % 24 === 0) {
			canvasLayers[dlayer.bgLayer].drawLine(i * 16, 0, i * 16, canvas.height - 1, 'rgba(0,0,0,0.25)', 2);
		}
	}
	for (i = 0; i < canvas.height / 16; i++) {
		canvasLayers[dlayer.bgLayer].drawLine(0, i * 16, canvas.width - 1, i * 16, 'rgba(0,0,0,0.2)');
		if (i % 13 === 0) {
			canvasLayers[dlayer.bgLayer].drawLine(0, i * 16, canvas.width - 1, i * 16, 'rgba(0,0,0,0.25)', 2);
		}
	}
}

/**
 * Draws a text label at a certain position on the main display.
 * @param {number} x The x-coordinate of the top left corner of the label.
 * @param {number} y The y-coordinate of the top left corner of the label.
 * @param {string} str The text to be displayed in the label.
 * @param {number} layer (Optional) The layer ID of the layer to draw the label on.
 */
function drawLabel(x, y, str, layer = dlayer.mouseLayer) {
	canvasLayers[layer].text(x, y, str);
}

/**
 * Loads all of the tiles used for display on the level grid.
 * @returns {Promise<Image[]>} An array of image objects containing the tile image data.
 */
function loadTiles() { // TODO: Put with entities or make tile data array in data.js
	return new Promise(((resolve, reject) => {
		Promise.all(
			[
				getImg('tiles/ground.png'),
				getImg('tiles/note.png'),
				getImg('tiles/goomba.png'),
				getImg('tiles/shellmet.png'),
				getImg('tiles/1up.png'),
				getImg('tiles/spike-top.png'),
				getImg('tiles/sledge-bro.png'),
				getImg('tiles/piranha.png'),
				getImg('tiles/bob-omb.png'),
				getImg('tiles/spiked-shellmet.png'),
				getImg('tiles/dry-bones.png'),
				getImg('tiles/mushroom.png'),
				getImg('tiles/poison.png'),
				getImg('tiles/woof.png'),
				getImg('tiles/monty-mole.png'),
				getImg('tiles/p-switch.png'),
				getImg('tiles/mew.png'),
				getImg('tiles/big-mushroom.png'),
				getImg('tiles/bill-blaster.png'),
				getImg('tiles/goomba-shoe.png'),
				getImg('tiles/goomba-stiletto.png'),
				getImg('tiles/cannon.png'),
				getImg('tiles/chain-chomp.png'),
				getImg('tiles/peg.png'),
				getImg('tiles/coin.png'),
				getImg('tiles/fire-piranha.png'),
				getImg('tiles/flower.png'),
				getImg('tiles/goombud.png'),
				getImg('tiles/green-koopa.png'),
				getImg('tiles/red-koopa.png'),
				getImg('tiles/hammer-bro.png'),
				getImg('tiles/magikoopa.png'),
				getImg('tiles/muncher.png'),
				getImg('tiles/pow.png'),
				getImg('tiles/spring.png'),
				getImg('tiles/sideways-spring.png'),
				getImg('tiles/star.png'),
				getImg('tiles/superball.png'),
				getImg('tiles/thwomp.png'),
				getImg('tiles/wiggler.png'),
				getImg('tiles/spike.png'),
				getImg('tiles/spikeball.png'),
				getImg('tiles/snowball.png'),
				getImg('tiles/pokey.png'),
				getImg('tiles/snow-pokey.png'),
				getImg('tiles/sword.png'),
				getImg('tiles/acorn.png'),
				getImg('tiles/mechakoopa.png'),
				getImg('tiles/mechakoopa-blasta.png'),
				getImg('tiles/mechakoopa-zappa.png'),
				getImg('tiles/block.png'),
				getImg('tiles/donut.png')
			]
		).then((loaded) => {
			// console.log('All tiles loaded');
			resolve(loaded);
		});
	}));
}

/**
 * Loads all of the background elements used for display in the background.
 * @returns {Promise<Image[]>} An array of image objects containing the image data.
 */
function loadBGs() {
	return new Promise(((resolve, reject) => {
		Promise.all([
			getImg('bg/sign.png'),
			getImg('bg/goal.png'),
			getImg('icon/parachute.png'),
			getImg('icon/alert.png'),
			getImg('icon/marker.png'),
			getImg('icon/highlight.png'),
			getImg('icon/highlight2.png'),
			getImg('icon/forbidden.png'),
			getImg('icon/semisolid.png')
		]).then((loaded) => {
			// console.log('BGs loaded');
			resolve(loaded);
		});
	}));
}

/**
 * Loads all of Mario's animation frames as images.
 * @returns {Promise<Image[]>} An array of image objects containing the image data.
 */
function loadMario() {
	return new Promise(((resolve, reject) => {
		Promise.all([
			getImg('anim/mario/idle.png'),
			getImg('anim/mario/walk.png'),
			getImg('anim/mario/run1.png'),
			getImg('anim/mario/run2.png')
		]).then((loaded) => {
			resolve(loaded);
		});
	}));
}

function loadToolIcons() {
	let promises = [];
	toolIconFilenames.forEach((filename) => {
		promises.push(getImg(`icon/${filename}.png`));
	});
	return Promise.all(promises);
}

/**
 * Creates an array of DrawLayers for use with a canvas element.
 * @param {number} amount The number of layers to make.
 * @param {number} width The width of all of the layers, in pixels.
 * @param {number} height The height of all of the layers, in pixels.
 * @returns {DrawLayer[]} An array containing the newly created DrawLayer objects.
 */
function makeLayers(amount, width, height) {
	let arr = [];
	let i;
	for (i = 0; i < amount; i++) {
		arr[i] = new DrawLayer(width, height);
	}
	return arr;
}

/**
 * Redraws the main display with DrawLayers.
 */
function refreshCanvas() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	let i;
	for (i = 0; i < canvasLayers.length; i++) {
		if (!canvasLayers[i].isVisible) {
			continue;
		}
		ctx.drawImage(
			canvasLayers[i].canvas,
			canvasLayers[i].xOfs,
			0,
			canvasLayers[i].canvas.width,
			canvasLayers[i].canvas.height
		);
	}
}

/**
 * Redraws the minimap with DrawLayers.
 */
function refreshMini() {
	ctxMini.clearRect(0, 0, minimap.width, minimap.height);
	let i;
	for (i = 0; i < miniLayers.length; i++) {
		if (!miniLayers[i].isVisible) {
			continue;
		}
		ctxMini.drawImage(miniLayers[i].canvas, 0, 0, miniLayers[i].width, miniLayers[i].canvas.height);
	}
}

/**
 * Sets the minimap's vertical zoom magnification.
 * @param {number} zoom The zoom level, expressed as a percentage.
 */
function setMiniZoomY(zoom) {
	minimapZoomY = zoom;
}
