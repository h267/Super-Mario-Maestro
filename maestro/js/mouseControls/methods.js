function enableMouseTools() {
	isHiddenToolsEnabled = true;
	document.getElementById('toolbarContainer').innerHTML = '';
	setupToolbar();
	console.log('Hidden mouse tools enabled.');
}

function setupToolIcons() {
	toolIcons.forEach((icon, i) => {
		mouseTools[i].icon = icon;
	});
}

function refreshMouseTool() {
	currentMouseTool = mouseTools[mouseToolId];
	cursorImg = currentMouseTool.icon;
	document.getElementById(`mousetool${prevMouseToolId}`).style.backgroundColor = '';
	document.getElementById(`mousetool${mouseToolId}`).style.backgroundColor = '#7289da';
	prevMouseToolId = mouseToolId;
}

function getMainMouseLevelPos(e) {
	let tilePos = getMainMouseTilePos(e);
	let levelPos = { x: tilePos.x + ofsX - 27, y: tilePos.y + ofsY };
	return levelPos;
}

function getMainMouseTilePos(e) {
	let canvasOfs = getOffset(e);
	let div = document.getElementById('displayContainer');
	let scrollOfs = { x: div.scrollLeft, y: div.scrollTop };
	let offset = { x: (canvasOfs.x + scrollOfs.x) / canvasZoom, y: (canvasOfs.y + scrollOfs.y) / canvasZoom };
	let tilePos = { x: Math.floor(offset.x / 16), y: (27 - Math.floor(offset.y / 16)) };
	return tilePos;
}

/**
 * Handles when the main canvas is clicked, and toggle the ruler.
 * @param {MouseEvent} e The mouse event.
 */
function handleMainMouseDown(e) { // TODO: Distinguish left and right click
	if (noMouse || e.button !== 0) {
		return;
	} // Exit if the mouse is disabled
	if (!currentMouseTool.isAvailableInBuildMode && isBuildMode) return;
	isMainMouseHolding = true;
	processClick(e);
}

function processClick(e) {
	lastClickedTile = getMainMouseLevelPos(e);
	lastClickedLvlPos = getMainMouseLevelPos(e);

	currentMouseTool.onLeftClick();
}

function handleMainMouseUp(e) {
	if (noMouse) {
		return;
	} // Exit if the mouse is disabled
	isMainMouseHolding = false;
}

function handleMainRightClick(e) {
	if (noMouse) {
		return;
	} // Exit if the mouse is disabled
	if (!currentMouseTool.isAvailableInBuildMode && isBuildMode) return;

	lastClickedTile = getMainMouseLevelPos(e);
	lastClickedLvlPos = getMainMouseLevelPos(e);

	currentMouseTool.onRightClick();

	e.preventDefault(); // Disable regular context menu
}

/**
 * Handles when the mouse is moved across the main canvas.
 * @param {MouseEvent} e The mouse event.
 */
function handleMainMove(e) {
	if (noMouse) {
		return;
	} // Exit if the mouse is disabled

	let tilePos = getMainMouseTilePos(e);
	let levelPos = getMainMouseLevelPos(e);
	let refresh = false;

	if (currentHighlight.x !== tilePos.x || currentHighlight.y !== tilePos.y) {
		drawCursor(tilePos);
		currentHighlight = { x: tilePos.x, y: tilePos.y };
		refresh = true;
	}

	if (isMainMouseHolding && refresh) {
		processClick(e); // Repeat click actions on new tiles if the mouse is held
		return;
	}

	if (refresh && showRuler) { // If the highlighted tile position has changed, redraw the ruler
		drawRuler(levelPos, tilePos);
	}

	refreshCanvas();
}

function handleMainWheel(e) {
	let tilePos = getMainMouseTilePos(e);

	let change = Math.sign(e.deltaY); // +/- 1, depending on scroll direction
	do {
		mouseToolId += change;

		// Wrap back around if scrolled past the ends of the tool list
		if (mouseToolId < 0) mouseToolId = mouseTools.length - 1;
		if (mouseToolId >= mouseTools.length) mouseToolId = 0;
	} while (!mouseTools[mouseToolId].isVisible && !isHiddenToolsEnabled);

	switchTool(tilePos);

	e.preventDefault();
}

function switchTool(tilePos) {
	currentMouseTool.close();
	refreshMouseTool();
	drawCursor(tilePos);
	refreshCanvas();
}

function drawCursor(tilePos) {
	if (!isLoaded) return;
	// Draw the cursor
	clearDisplayLayer(dlayer.mouseLayer);
	// Lightly highlight the tile the cursor is on
	highlightTile(tilePos.x, 27 - tilePos.y, { style: 'rgba(0,0,0,0.1)', layer: dlayer.mouseLayer });
	// Draw the cursor icon
	drawTile(cursorImg,
		(tilePos.x - 1) * 16,
		(27 - (tilePos.y + 1)) * 16,
		dlayer.mouseLayer);
}

function drawRuler(lPos, realTpos) {
	let i = lPos.x;
	let j = lPos.y;
	let levelPos = lastClickedTile;
	let tilePos = { x: levelPos.x - ofsX + 27, y: levelPos.y - ofsY };

	let dirStr = { h: '', v: '' }; // The string to display next to the ruler
	let k;
	if (i - levelPos.x > 0) {
		dirStr.h = 'Right';
		for (k = 0; k < i - levelPos.x; k++) {
			highlightTile(tilePos.x + k + 1, 27 - tilePos.y, { layer: dlayer.mouseLayer });
		}
	} else if (i - levelPos.x < 0) {
		dirStr.h = 'Left';
		for (k = 0; k < (i - levelPos.x) * -1; k++) {
			highlightTile(tilePos.x - k - 1, 27 - tilePos.y, { layer: dlayer.mouseLayer });
		}
	}

	if (j - levelPos.y > 0) {
		dirStr.v = 'Up';
		for (k = 0; k < j - levelPos.y; k++) {
			highlightTile(
				(tilePos.x + (i - levelPos.x)),
				27 - (j - ofsY - k),
				{ style: 'rgba(0,191,0,0.5)', layer: dlayer.mouseLayer }
			);
		}
	} else if (j - levelPos.y < 0) {
		dirStr.v = 'Down';
		for (k = 0; k < (j - levelPos.y) * -1; k++) {
			highlightTile(
				(tilePos.x + (i - levelPos.x)),
				27 - (j - ofsY + k),
				{ style: 'rgba(0,191,0,0.5)', layer: dlayer.mouseLayer }
			);
		}
	}
	if (dirStr.h !== '' && dirStr.v !== '') {
		drawLabel(
			realTpos.x * 16 - 24,
			(27 - realTpos.y) * 16 - 8,
			`${dirStr.h} ${Math.abs(i - levelPos.x)}, ${dirStr.v} ${Math.abs(j - levelPos.y)}`
		);
	} else if (dirStr.h === '' && dirStr.v !== '') {
		drawLabel(realTpos.x * 16 - 24, (27 - realTpos.y) * 16 - 8, `${dirStr.v} ${Math.abs(j - levelPos.y)}`);
	} else {
		drawLabel(realTpos.x * 16 - 24, (27 - realTpos.y) * 16 - 8, `${dirStr.h} ${Math.abs(i - levelPos.x)}`);
	}
}

/**
 * Moves the file scrubber to the cursor position when the minimap is clicked.
 * @param {MouseEvent} e The mouse event.
 */
function handleMiniMouseDown(e) {
	let coords = getRealMiniOfs(e);
	mx = coords.x;
	my = coords.y;
	moveOffsetTo(mx / minimap.width, null);
	dragging = true;
}

/**
 * Handles when the mouse is no longer dragging the file scrubber.
 * @param {MouseEvent} e The mouse event.
 */
function handleMiniMouseUp(e) {
	let coords = getRealMiniOfs(e);
	mx = coords.x;
	my = coords.y;
	dragging = false;
}

/**
 * Handles when the mouse is no longer hovering over the minimap.
 * @param {MouseEvent} e The mouse event.
 */
function handleMiniMouseOut(e) {
	let coords = getRealMiniOfs(e);
	mx = coords.x;
	my = coords.y;
	dragging = false;
}

/**
 * Handles when the mouse is moved over the minimap.
 * @param {MouseEvent} e The mouse event.
 */
function handleMiniMouseMove(e) {
	let coords = getRealMiniOfs(e);
	mx = coords.x;
	my = coords.y;
	if (dragging) {
		moveOffsetTo(mx / minimap.width, null);
	}
}

/**
 * Obtains the x and y coordinates of the mouse's location over a canvas element.
 * @param {MouseEvent} evt The mouse event.
 * @returns {Object} An object containing the x and y coordinates of the cursor.
 */
function getOffset(evt) {
	let el = evt.target;
	let x = 0;
	let y = 0;

	while (el && !Number.isNaN(el.offsetLeft) && !Number.isNaN(el.offsetTop)) {
		x += el.offsetLeft - el.scrollLeft;
		y += el.offsetTop - el.scrollTop;
		el = el.offsetParent;
	}

	x = evt.clientX - x;
	y = evt.clientY - y;

	return { x, y };
}

/**
 * Gets the horizontal of the mouse cursor relative the the whole minimap, factoring out the scroll position.
 * @param {MouseEvent} e The mouse event.
 * @returns {number} The x-coordinate of the mouse cursor relative to the minimap.
 */
function getRealMiniOfs(e) {
	if (showRuler) {
		showRuler = false;
		drawLevel();
		return null;
	}
	let canvasOfs = getOffset(e);
	let div = document.getElementById('minimapcontainer');
	let scrollOfs = { x: div.scrollLeft, y: div.scrollTop };
	let offset = { x: canvasOfs.x + scrollOfs.x, y: canvasOfs.y + scrollOfs.y };
	return offset;
}

function setupToolbar() {
	toolIconFilenames.forEach((iconPath, i) => {
		if (mouseTools[i].isVisible || isHiddenToolsEnabled) {
			let newBtn = document.createElement('a');
			let newImg = document.createElement('img');
			newImg.setAttribute('src', `icon/${iconPath}.png`);
			newBtn.setAttribute('id', `mousetool${i}`);
			// newBtn.setAttribute('onclick', `() => { mouseToolId = ${i}; refreshMouseTool(); }`);
			newBtn.setAttribute('onclick', `changeToolTo(${i})`);
			newBtn.appendChild(newImg);
			document.getElementById('toolbarContainer').appendChild(newBtn);
		}
	});
}

function changeToolTo(id) {
	mouseToolId = id;
	refreshMouseTool();
}

function rulerTool() {
	if (showRuler) {
		// If the ruler is on...
		showRuler = false; // Turn off the ruler
		clearDisplayLayer(dlayer.mouseLayer);
		refreshCanvas();
		return;
	}
	// Else, if the ruler is off...
	showRuler = true;
}

function infoTool() {
	if (!fileLoaded || !level.noteGroups[selectedTrack].isVisible) return;
	let queryX = lastClickedLvlPos.x;
	let queryY = lastClickedLvlPos.y;
	let foundNote = level.noteGroups[selectedTrack].getNoteAt(queryX, queryY);
	console.log(foundNote);
}

function addNoteTool() {
	if (!fileLoaded || !level.noteGroups[selectedTrack].isVisible) return;
	let placeX = lastClickedLvlPos.x;
	if (placeX < 0) return;
	let placeY = lastClickedLvlPos.y;
	addNote(selectedTrack, blocksToTicks(placeX), blocksToPitch(selectedTrack, placeY));
}

function eraseNoteTool() {
	if (!fileLoaded || !level.noteGroups[selectedTrack].isVisible) return;
	let queryX = lastClickedLvlPos.x;
	let queryY = lastClickedLvlPos.y;
	removeNote(selectedTrack, blocksToTicks(queryX), blocksToPitch(selectedTrack, queryY));
}

function zoomInTool() {
	canvasZoom *= 2;
	document.getElementById('canvas').style.transform = `scale(${canvasZoom})`;
}

function zoomOutTool() {
	canvasZoom /= 2;
	document.getElementById('canvas').style.transform = `scale(${canvasZoom})`;
}

function changeTrackTool() {
	if (!fileLoaded || !level.noteGroups[selectedTrack].isVisible) return;
	let placeX = lastClickedLvlPos.x;
	let placeY = lastClickedLvlPos.y;
	let searchTicks = ticksToBlocks(Math.round(blocksToTicks(placeX)));
	if (!findNote(selectedTrack, blocksToTicks(searchTicks), blocksToPitch(selectedTrack, placeY)).success) return;
	removeNote(selectedTrack, blocksToTicks(placeX), blocksToPitch(selectedTrack, placeY));
	addNote(secondaryTrack, blocksToTicks(placeX), blocksToPitch(secondaryTrack, placeY));
}

function forbidTool() {
	let forbidTile = {
		x: lastClickedLvlPos.x,
		y: lastClickedLvlPos.y
	};
	if (forbiddenTiles.findIndex((tile) => tile.x === forbidTile.x && tile.y === forbidTile.y) === -1) {
		forbiddenTiles.push(forbidTile);
		console.log(forbidTile);
	}
	softRefresh(true, false);
}

function unforbidTool() {
	let queryX = lastClickedLvlPos.x;
	let queryY = lastClickedLvlPos.y;
	let idx = forbiddenTiles.findIndex((tile) => tile.x === queryX && tile.y === queryY);
	forbiddenTiles.splice(idx, 1);
	softRefresh(true, true);
}
