/**
 * Loads a MIDI file from the file input.
 */
function loadFileFromInput() {
	let fname = document.getElementById('fileInput').files[0].name;
	if (fname.substring(fname.length - 8, fname.length).toLowerCase() === '.mp3.mid') { // Detect MP3 MIDIs
		document.getElementById('noisecontrol').hidden = false;
	} else {
		document.getElementById('noisecontrol').hidden = true;
	}
	reader.readAsArrayBuffer(document.getElementById('fileInput').files[0]);
	reader.onload = () => loadData(new Uint8Array(reader.result));
}

/**
 * Loads the example MIDI file.
 */
function loadExample() {
	document.getElementById('fileInput').value = '';
	let request = new XMLHttpRequest();
	request.open('GET', './example.mid', true);
	request.responseType = 'arraybuffer';
	request.onerror = (e) => console.error('Unable to load example MIDI.');
	request.onload = () => {
		let arraybuffer = request.response;
		if (arraybuffer) {
			loadData(new Uint8Array(arraybuffer));
		}
	};
	request.send();
}

/**
 * Loads MIDI data and initializes the state of the level.
 * @param {Uint8Array} bytes The MIDI data to load.
 */
function loadData(bytes) { // Load file from the file input element
	if (fileLoaded) {
		cancelPlayback();
	}
	if (!fileLoaded) {
		showEverything();
	}
	midi = new MIDIfile(bytes);
	tracks = [];
	midi.trks.forEach((midiTrk) => {
		if (midiTrk.usedChannels.length > 1) {
			console.log(midiTrk.label);
		}
		tracks.push(new MaestroTrack(midiTrk));
	});
	// console.log(tracks);
	document.getElementById('advanceSettings').checked = false;
	resetOffsets();
	if (fileLoaded) {
		miniClear();
		drawScrubber(ofsX, ofsY + 27, canvas.width / 16 - 27, canvas.height / 16);
		refreshMini();
	}
	document.getElementById('trackedItemsContainer').innerHTML = '';
	// document.getElementById('trkselect').innerHTML = '';
	selectedTrack = 0;
	let i;
	let j;
	for (i = 0; i < tracks.length; i++) {
		tracks[i].instrumentChanges = [];
		for (j = 0; j < midi.trks[i].usedInstruments.length; j++) {
			tracks[i].instrumentChanges[j] = getMM2Instrument(midi.trks[i].usedInstruments[j]) - 2;
		}
	}
	document.getElementById('octaveShift').value = 0;
	document.getElementById('semitones').value = 0;
	blocksPerBeat = midi.blocksPerBeat;
	reccBPB = blocksPerBeat;
	lastBPB = blocksPerBeat;
	document.getElementById('blockPerBeat').value = blocksPerBeat;
	acceptableBPBs = generateAcceptableBPBs();
	isNewFile = true;
	fileLoaded = true;
	noteRange = 0;
	undoManager.clear();
	mapWidth = Math.ceil(ticksToBlocks(midi.duration));
	level.noteGroups = [];
	outlineLayers = new Array(midi.trks.length);
	for (i = 0; i < midi.trks.length; i++) { // TODO: Better separation
		level.addNoteGroup(new PreloadedNoteGroup());
		if (midi.trks[i].usedInstruments.length > 1) {
			sepInsFromTrk(midi.trks[i]);
			tracks[i].notes = [];
		}
		if (midi.trks[i].hasPercussion) {
			let isInPartitions = new Array(numParts).fill(false);
			let partitionSize = Math.floor(mapWidth / numParts);
			for (j = 0; j < midi.trks[i].notes.length; j++) {
				let curPartition = Math.floor(ticksToBlocks(midi.trks[i].notes[j].time) / partitionSize);
				isInPartitions[curPartition] = true;
			}
			let sum = 0;
			for (j = 0; j < isInPartitions.length; j++) {
				if (isInPartitions[j]) sum++;
			}
			if (sum / numParts < autoShowRatio) level.noteGroups[i].setVisibility(false);
		}
		outlineLayers[i] = new DrawLayer(canvas.width, canvas.height);
		if (midi.trks[i].usedInstruments.length === 0 || midi.trks[i].hasPercussion) {
			continue;
		}
		tracks[i].octaveShift = MM2Instruments[getMM2Instrument(midi.trks[i].usedInstruments[0]) - 2].octave * -1;
		if (midi.trks[i].highestNote === null || midi.trks[i].highestNote === null) {
			continue;
		}
		let thisRange = Math.max(Math.abs(64 - midi.trks[i].lowestNote), Math.abs(64 - midi.trks[i].highestNote));
		if (thisRange > noteRange) {
			noteRange = thisRange;
		}
		tracks[i].isHidden = false;
	}
	refreshBlocks();
	updateUI(false, true);
	secondaryTrack = getFirstVisibleTrack();
	updateTrackList();
	togglePercussion();
	isNewFile = false;
	document.getElementById('tempotext').innerHTML = `Original: ${Math.round(songBPM)} bpm`;
	document.getElementById('advanceSettings').checked = usingAdvSettings;
}

/**
 * Refreshes the state of the user interface.
 */
function updateUI(limitedUpdate, reccTempo, doBPB = true) {
	let i;
	let width = mapWidth;
	setMiniWidth(width);
	let haveTempo = false; // TODO: Get rid of this when adding dynamic tempo
	bbar = midi.firstBbar;
	if (!limitedUpdate) {
		document.getElementById('trackedItemsContainer').innerHTML = '';
		if (doBPB) recommendBPB();
	}
	if (midi.firstTempo !== 0) {
		songBPM = 60000000 / midi.firstTempo;
	}
	if (!limitedUpdate) updateTrackList();
	if (reccTempo) {
		refreshTempos(blocksPerBeat);
		bpm = recommendTempo(songBPM, blocksPerBeat, true);
		haveTempo = true;
	}
	// console.log(blocksPerBeat+' bpqn chosen');
	if (!haveTempo && reccTempo) { // Use default tempo if none was found
		refreshTempos(blocksPerBeat);
		bpm = recommendTempo(songBPM, blocksPerBeat, true);
		if (!limitedUpdate) {
			recommendBPB();
		} // TODO: Probably unintentional behavior now
	}
	haveTempo = true;
	if (!limitedUpdate) {
		selectTrack(-1);
	}
	if (isNewFile) {
		calculateNoteRange();
		defaultZoom = adjustZoom();
	}
	if (fileLoaded && !isNewFile) {
		chkRefresh();
	} else {
		softRefresh();
	}
	// console.log('Completed in '+((new Date).getTime()-t0)+' ms');
}

function updateTrackList() {
	document.getElementById('trackedItemsContainer').innerHTML = '';
	for (i = 0; i < tracks.length; i++) {
		// Add checkbox with label for each track
		let div = document.createElement('div');
		div.id = `item${i}`;
		div.setAttribute('class', 'tracklistitem');
		div.setAttribute('onclick', `selectTrack(${i});`);
		div.style.borderRadius = '5px';
		div.style.borderColor = 'mediumaquamarine';
		div.style.borderWidth = '0px';
		// Add a new track checkbox
		let chkbox = document.createElement('input');
		chkbox.id = `chk${i}`;
		chkbox.type = 'checkbox';
		chkbox.setAttribute('onchange', 'chkRefresh();');
		chkbox.checked = level.noteGroups[i].isVisible;
		div.appendChild(chkbox);
		let rad = document.createElement('input');
		rad.id = `rad${i}`;
		rad.name = 'trkrad';
		rad.type = 'radio';
		rad.value = i;
		rad.style = 'display:none';
		// rad.setAttribute('onclick','selectTrack(this.value);');
		let labl = document.createElement('label');
		if ((tracks[i].notes.length === 0 && !tracks[i].isFromUser) || tracks[i].isHidden) { // Hide empty or hidden tracks
			chkbox.style.display = 'none';
			labl.style.display = 'none';
		}
		labl.appendChild(rad);
		labl.innerHTML += tracks[i].label;
		labl.setAttribute('for', rad.id);
		labl.style.position = 'relative';
		labl.style.bottom = '3px';
		labl.id = `trklabl${i}`;
		labl.setAttribute('class', 'tracklabel');
		div.appendChild(labl);

		document.getElementById('trackedItemsContainer').appendChild(div);
		/* if(midi.hasNotes[i]){
                        document.getElementById('trackedItemsContainer').appendChild(document.createElement('br'));
                  } */

		// Add a new track option
		if (tracks[i].label.charAt(0) !== '[') {
			let opt = document.createElement('option');
			opt.value = i;
			opt.innerHTML = tracks[i].label;
			// document.getElementById('trkselect').appendChild(opt);
		}
	}
}

/**
 * Draws the background of the main canvas.
 */
function drawBG() {
	setBG('#00B2EE');
	drawGrid(16);
	let i;
	for (i = 0; i < levelWidth; i++) {
		drawTile(tiles[0], i * 16, canvas.height - 16, 0);
	}
	decorateBG();
}

function drawLevel(redrawMini = false, noDOM = false) {
	if (tiles === undefined) {
		return;
	}
	if (fileLoaded && redrawMini) {
		miniClear(0);
	}
	if (isNewFile || !fileLoaded) {
		drawBG();
	}
	entityCount = 0;
	powerupCount = 0;
	conflictCount = 0;
	let j;
	if (fileLoaded && !noDOM) { // Update offscreen note count (and octave shift button)
		// Enable button if recommended octave shift and actual octave shift don't match
		document.getElementById('shiftBtn')
			.disabled = (tracks[selectedTrack].octaveShift === getViewOctaveShift(selectedTrack));
		for (let i = 0; i < tracks.length; i++) {
			tracks[i].hasVisibleNotes = false;
			tracks[i].numNotesOffscreen.above = 0;
			tracks[i].numNotesOffscreen.below = 0;
			for (j = 0; j < tracks[i].notes.length; j++) {
				let note = tracks[i].notes[j];
				let x = Math.round(ticksToBlocks(note.time));
				let y = pitchToBlocks(i, note.pitch);
				// Omit the notes on the very top row for now
				if (y <= ofsY) {
					tracks[i].numNotesOffscreen.below++;
				} else if (y > ofsY + 26) {
					tracks[i].numNotesOffscreen.above++;
				} else if (x >= ofsX && x < ofsX + levelWidth) { // Check if notes are visible
					tracks[i].hasVisibleNotes = true;
				}
			}
			if (tracks[i].hasVisibleNotes) {
				if (i === selectedTrack) {
					document.getElementById(`trklabl${i}`).style.color = 'black';
				} else {
					document.getElementById(`trklabl${i}`).style.color = 'white';
				}
			} else if (i === selectedTrack) {
				document.getElementById(`trklabl${i}`).style.color = 'gray';
			} else {
				document.getElementById(`trklabl${i}`).style.color = 'lightgray';
			}
			if (i === secondaryTrack) document.getElementById(`trklabl${i}`).style.fontWeight = 'bold';
			else document.getElementById(`trklabl${i}`).style.fontWeight = 'normal';
		}
	}
	let x;
	let y;
	if (redrawMini) {
		clearDisplayLayer(dlayer.overlayLayer);
		clearDisplayLayer(dlayer.noteLayer);
	} else {
		// if(fileLoaded){miniClear(0);}
	}
	if (!isNewFile && fileLoaded) {
		clearDisplayLayer(dlayer.outlineLayer);
		if (outlineLayers.length !== tracks.length) {
			outlineLayers = new Array(tracks.length);
			for (let i = 0; i < tracks.length; i++) {
				outlineLayers[i] = new DrawLayer(canvas.width, canvas.height);
			}
		} else {
			for (let i = 0; i < tracks.length; i++) {
				if (outlineLayers[i] === undefined) {
					outlineLayers[i] = new DrawLayer(canvas.width, canvas.height);
					continue;
				}
				if (outlineLayers[i].width !== canvas.width || outlineLayers[i].height !== canvas.height) {
					outlineLayers[i] = new DrawLayer(canvas.width, canvas.height);
				} else {
					outlineLayers[i].clear();
				}
			}
		}
	}
	powerupCount = 0;
	entityCount = 0;
	for (let i = 0; i < levelWidth * numBlockSubdivisions; i++) {
		for (j = 0; j < 27; j++) {
			let tile = level.checkTile(i, j); // Tile on the main screen
			let bgTile = level.checkBgTile(i, j);
			let fgTile = level.checkFgTile(i, j);
			let drawY = 27 - j - 1;
			let drawX = (i / numBlockSubdivisions) + drawOffsetX;

			if (bgTile !== null) drawTile(tiles[bgTile], drawX * 16, drawY * 16);
			if (tile !== null) {
				drawTile(tiles[tile], drawX * 16, drawY * 16);
				if (level.numberOfOccupants[i][j] > 1 && !isBuildMode) { // Highlight any overalapping tiles in red
					conflictCount++;
					highlightTile(drawX, drawY, { style: 'rgba(255,0,0,0.4)' });
				}
				// Outline note blocks of the selected track
				if (tile === 1 && level.isTrackOccupant[i][j][selectedTrack]) {
					outlineTile(drawX, drawY, 2, 'rgb(44, 153, 121)');
				}
			}
			if (fgTile !== null) drawTile(bgs[2 + fgTile], drawX * 16, drawY * 16);
		}
		if (i / numBlockSubdivisions > ofsX + levelWidth) {
			break;
		}
	}
	if (showDebugLabels) {
		clearDisplayLayer(dlayer.overlayLayer);
		for (let i = 0; i < structures.length; i++) {
			drawLabel(
				structures[i].x * 16,
				canvas.height - structures[i].y * 16,
				i,
				dlayer.overlayLayer
			);
		}
	}
	if (redrawMini) {
		redrawMinimap();
	}
	if (level.limitLine !== null) {
		drawLimitLine(level.limitLine / numBlockSubdivisions);
	}
	if (!noDOM) {
		document.getElementById('ELtext').innerHTML = `Entities in Area: ${level.entityCount}`;
		document.getElementById('PLtext').innerHTML = `Powerups in Area: ${level.powerupCount}`;

		let qeScore = quantizeErrorAggregate / midi.noteCount / blocksPerBeat;
		if (qeScore === 0) {
			document.getElementById('QEtext').innerHTML = 'BPB Quality: Perfect';
			document.getElementById('QEtext').style.color = 'lime';
		} else if (qeScore > 20) {
			document.getElementById('QEtext').innerHTML = 'BPB Quality: Bad';
			document.getElementById('QEtext').style.color = 'tomato';
		} else if (qeScore > 5) {
			document.getElementById('QEtext').innerHTML = 'BPB Quality: Okay';
			document.getElementById('QEtext').style.color = 'orange';
		} else if (qeScore > 1) {
			document.getElementById('QEtext').innerHTML = 'BPB Quality: Good';
			document.getElementById('QEtext').style.color = 'limegreen';
		} else {
			document.getElementById('QEtext').innerHTML = 'BPB Quality: Great';
			document.getElementById('QEtext').style.color = 'limegreen';
		}
		// console.log('qeScore = '+qeScore);
		conflictCount = level.conflictCount;
		document.getElementById('NCtext').innerHTML = `Spatial Conficts: ${conflictCount}`;
		if (conflictCount > 20) {
			document.getElementById('NCtext').style.color = 'orange';
		} else if (conflictCount > 0) {
			document.getElementById('NCtext').style.color = 'limegreen';
		} else {
			document.getElementById('NCtext').style.color = 'lime';
		}

		if (level.entityCount > 100) {
			document.getElementById('ELtext').style.color = 'tomato';
		} else {
			document.getElementById('ELtext').style.color = '';
		}

		if (level.powerupCount > 100) {
			document.getElementById('PLtext').style.color = 'tomato';
		} else {
			document.getElementById('PLtext').style.color = '';
		}
		updateOutOfBoundsNoteCounts();
	}
	if (fileLoaded) {
		miniClear(1);
		drawScrubber(ofsX, ofsY + 27, canvas.width / 16 - 27, canvas.height / 16);
	}
	if (fileLoaded) {
		canvasLayers[dlayer.outlineLayer].ctx.drawImage(
			outlineLayers[selectedTrack].canvas,
			0,
			0,
			canvas.width,
			canvas.height
		);
	}
	if ((!noDOM && fileLoaded && (entityOverflowStatus.entity !== (level.entityCount > 100)))
        || (entityOverflowStatus.powerup !== (level.powerupCount > 100))) {
		updateInstrumentContainer();
	}
	entityOverflowStatus = { entity: level.entityCount > 100, powerup: level.powerupCount > 100 };
	refreshCanvas();
	if (fileLoaded) {
		refreshMini();
	}
}

/**
 * Moves the file viewer to the specified area in the level.
 * @param {number} ox The x-offset as a percentage.
 * @param {number} oy The y-offset as a percentage.
 */

function moveOffsetTo(ox, oy) { // Offsets are given as percentages of the level
	if (!fileLoaded) {
		return;
	}
	cancelPlayback();
	if (ox !== null) {
		ofsX = Math.floor(ox * mapWidth);
		// console.log(ox+' -> '+ofsX);
	}
	let limX = (minimap.width - (canvas.width / 16 - 27)) + (blocksPerBeat * bbar);
	if (ofsX > limX) {
		ofsX = limX;
	}
	if (ofsX < 0) {
		ofsX = 0;
	}
	ofsX = Math.floor(ofsX / (blocksPerBeat * bbar)) * blocksPerBeat * bbar; // Quantize to the nearest measure
	if (oy !== null) {
		ofsY = oy * 127;
	}
	clearDisplayLayer(dlayer.noteLayer);
	clearDisplayLayer(dlayer.overlayLayer);
	clearDisplayLayer(dlayer.outlineLayer);
	refreshBlocks();
	softRefresh(false, false);
}

/**
 * Reads the value in the vertical offset number picker and moves the offset to that value.
 */
function nudgeY() {
	enableMouse();
	cancelPlayback();
	let relativeOfs = parseInt(document.getElementById('verticalShift').value, 10) * -1;
	// console.log(relativeOfs+48);
	moveOffsetTo(null, (relativeOfs + baseOfsY) / 127);
}

/**
 * Sets the global x and y offsets to their default values.
 */
function resetOffsets() {
	ofsX = 0;
	ofsY = baseOfsY;
	document.getElementById('verticalShift').value = 0;
}

/**
 * Recommends a tempo based on the song's BPM and the number of blocks per beat.
 * @param {number} origBPM The tempo of the song, in beats per minute.
 * @param {number} bpb The number of blocks per beat.
 */
function recommendTempo(origBPM, bpb) {
	let closestDist = 10000;
	let recc = -1;
	for (i = 0; i < MM2Tempos.length; i++) {
		let dist = Math.abs((MM2Tempos[i].bpm * (4 / bpb)) - origBPM);
		// console.log((bpms[i]*(4/bpqn))+' is dist of '+dist);
		if (dist < closestDist) {
			closestDist = dist;
			recc = i;
		}
	}
	// console.log(bpmIDtoStr(recc));
	// console.log(songBPM+' -> '+bpms[recc]*(4/res));
	document.getElementById('tempoSelect').selectedIndex = numCommonTempos + recc;
	buildSetups = MM2Tempos[recc].setups;
	if (buildSetups === undefined) buildSetups = defaultSetups;
	return MM2Tempos[recc].bpm * (4 / bpb);
}

/**
 * Reads the state of the track visibility checkboxes and updates the level accordingly.
 */
function chkRefresh() {
	let i;
	for (i = 0; i < tracks.length; i++) {
		level.noteGroups[i].setVisibility(document.getElementById(`chk${i}`).checked);
	}
	enableMouse();
	cancelPlayback();
	calculateNoteRange();
	adjustZoom();
	softRefresh();
}

/**
 * Determines the equivalent Mario Maker 2 tile ID for a given MIDI instrument.
 * @param {number} instrument The zero-indexed ID of the MIDI instrument.
 */
function getMM2Instrument(instrument) {
	let midiInstrument = instrument + 1;
	// 1. Specific MIDI Instruments
	// TODO: Add these in

	// 2. General Category Instruments
	if (midiInstrument <= 8) {
		return 2;
	} // Piano
	if (midiInstrument >= 9 && midiInstrument <= 16) {
		return 3;
	} // Chromatic Percussion
	if (midiInstrument >= 17 && midiInstrument <= 24) {
		return 4;
	} // Organ
	if (midiInstrument >= 25 && midiInstrument <= 32) {
		return 22;
	} // Guitar
	if (midiInstrument >= 33 && midiInstrument <= 40) {
		return 40;
	} // Bass
	if (midiInstrument >= 41 && midiInstrument <= 48) {
		return 26;
	} // Strings
	if (midiInstrument >= 49 && midiInstrument <= 56) {
		return 8;
	} // Ensemble
	if (midiInstrument >= 57 && midiInstrument <= 72) {
		return 9;
	} // Brass, Lead
	if (midiInstrument >= 73 && midiInstrument <= 80) {
		return 10;
	} // Pipe
	if (midiInstrument >= 81 && midiInstrument <= 88) {
		return 11;
	} // Synth Lead
	if (midiInstrument >= 89 && midiInstrument <= 96) {
		return 12;
	} // Synth Pad
	if (midiInstrument >= 97 && midiInstrument <= 104) {
		return 2;
	} // Synth Effects
	if (midiInstrument >= 105 && midiInstrument <= 112) {
		return 14;
	} // Ethnic
	if (midiInstrument >= 113 && midiInstrument <= 120) {
		return 15;
	} // Percussive
	if (midiInstrument >= 121 && midiInstrument <= 128) {
		return 2;
	} // Sound Effects
	return null;
}

/**
 * Reads the blocks per beat number picker, and snaps to the closest value if an invalid input is given.
 */
function pickBPB() {
	let val = document.getElementById('blockPerBeat').value;
	val = Math.floor(val);
	if (val === 69) {
		alert('stop');
	}
	if (val < 1) {
		val = 1;
	}
	if (val > 8) {
		val = 8;
	}
	blocksPerBeat = val;
	if (!usingAdvSettings) {
		filterBPB();
	}
	document.getElementById('blockPerBeat').value = blocksPerBeat;
	lastBPB = blocksPerBeat;
	mapWidth = Math.ceil(ticksToBlocks(midi.duration));
	changeBPB();
}

/**
 * Sets the blocks per beat value to the recommended one.
 */
function changeToRecommendedBPB() {
	blocksPerBeat = recmdBlocksPerBeat;
	document.getElementById('blockPerBeat').value = blocksPerBeat;
	changeBPB();
}

/**
 * Refreshes the level and calculates the new x-offset if the blocks per beat setting is changed.
 */
function changeBPB() {
	if (!fileLoaded) {
		return;
	}
	quantizeErrorAggregate = 0;
	for (let i = 0; i < midi.trks.length; i++) {
		if (!level.noteGroups[i] || level.noteGroups[i].isVisible) {
			quantizeErrorAggregate += midi.trks[i].quantizeErrors[blocksPerBeat - 1];
		}
	}
	if (!isNewFile) {
		cancelPlayback();
		let ratio = (ofsX * minimapZoomX) / minimap.width;
		moveOffsetTo(ratio, null);
		miniClear(1);
		drawScrubber(ofsX, ofsY + 27, canvas.width / 16 - 27, canvas.height / 16);
		hardRefresh(true, true);
	}
}

/**
 * Triggers level playback.
 */
function playBtn() {
	if (fileLoaded) {
		disableMouse();
		document.getElementById('playBtn').disabled = true;
		if (contPlayback) playMap(midi, level, bpm, blocksPerBeat, ofsX, ofsY);
		else playLvl(midi, level, bpm, blocksPerBeat, ofsX, ofsY);
	}
}

/**
 * Stops level playback.
 */
function cancelPlayback() {
	isPlaybackInterrupted = true;
	if (!isPlaying || isRendering) return;
	isAnimating = false;
	resetPlayback();
	stopAudio();
}

/**
 * Recommends a blocks per beat value based on the quantization errors of each track.
 */
function recommendBPB() {
	let lowestQuantizeError = Infinity;
	let bestBPB = 0;
	for (let i = 0; i < 8; i++) { // Iterate to 8 for now, maybe double for when semisolid technique becomes a thing
		let total = 0;
		for (let j = 0; j < midi.trks.length; j++) {
			if (!level.noteGroups[j] || level.noteGroups[j].isVisible) {
				total += midi.trks[j].quantizeErrors[i];
			}
		}
		if (total < lowestQuantizeError) {
			lowestQuantizeError = total;
			bestBPB = i + 1;
		}
	}
	let recmd = bestBPB;
	changeBPB();
	return recmd;
}

/**
 * Determines whether or not a given point should be visible in the level based on x and y offsets.
 * @param {number} x The x-coordinate of the query point.
 * @param {number} y The y-coordinate of the query point.
 * @param {number} xOfs The x-offset of the viewing window.
 * @param {number} yOfs The y-offset of the viewing window.
 * @returns {boolean} If the point is visible.
 */
function isVisible(x, y, xOfs, yOfs) {
	return (x >= xOfs && x < xOfs + levelWidth - 27 && y >= yOfs && y < yOfs + 27);
}

/**
 * Enables mouse controls on the main canvas.
 */
function enableMouse() {
	noMouse = false;
}

/**
 * Disables mouse controls on the main canvas.
 */
function disableMouse() {
	noMouse = true;
}

/**
 * Handles when the mouse leaves the main canvas.
 */
function handleOut() {
	if (noMouse) {
		return;
	}
	clearDisplayLayer(dlayer.mouseLayer);
	refreshCanvas();
}

/**
 * Displays the main tools.
 */
function showEverything() {
	document.getElementById('toolboxContainer').hidden = false;
	document.getElementById('playBtn').disabled = !hasLoadedBuffers;
	document.getElementById('stopBtn').disabled = !hasLoadedBuffers;
}

/**
 * Refreshes the options in the tempo dropdown menu.
 */
function refreshTempos() {
	let i;
	let commonGroup = document.getElementById('comtempos');
	let allGroup = document.getElementById('alltempos');
	commonGroup.innerHTML = '';
	allGroup.innerHTML = '';
	if (isNewFile) {
		numCommonTempos = 0;
	}
	for (i = 0; i < MM2Tempos.length; i++) {
		let opt = document.createElement('option');
		opt.value = i;
		opt.innerHTML = `${MM2Tempos[i].name} (${Math.round(MM2Tempos[i].bpm * (4 / blocksPerBeat))} bpm)`;
		allGroup.appendChild(opt);
		if (MM2Tempos[i].isCommon) {
			if (isNewFile) {
				numCommonTempos++;
			}
			let opt2 = document.createElement('option');
			opt2.value = i;
			opt2.innerHTML = `${MM2Tempos[i].name} (${Math.round(MM2Tempos[i].bpm * (4 / blocksPerBeat))} bpm)`;
			commonGroup.appendChild(opt2);
		}
	}
}

/**
 * Reads the value of the tempo dropdown and updates the tempo accordingly.
 */
function selectTempo() {
	let sel = document.getElementById('tempoSelect');
	let selected = sel.value;
	bpm = MM2Tempos[selected].bpm * (4 / blocksPerBeat);
	buildSetups = MM2Tempos[selected].setups;
	if (buildSetups === undefined) buildSetups = defaultSetups;
	cancelPlayback();
	softRefresh();
}

/**
 * Refreshes the state of the level without updating the entire UI.
 */
function softRefresh(noDOM = false, redrawMini = true) { // Refresh changes to track layers
	level.refresh();
	drawLevel(redrawMini, noDOM);
}

/**
 * Refreshes the state of the level and UI.
 */
function hardRefresh(reccTempo, limitUpdate = true) { // Refresh changes to the entire MIDI
	updateUI(limitUpdate, reccTempo);
	softRefresh(false, true);
}

/**
 * Reads the value of the noise slider and refreshes the level.
 */
function changeNoiseThreshold() {
	noiseThreshold = document.getElementById('noiseThreshold').value;
	refreshBlocks();
	hardRefresh(false);
}

/**
 * Reads the values of the octave and semitone shift inputs and shifts the selected track accordingly.
 */
function shiftTrackOctave() {
	cancelPlayback();
	tracks[selectedTrack].octaveShift = parseInt(document.getElementById('octaveShift').value, 10);
	tracks[selectedTrack].semitoneShift = parseInt(document.getElementById('semitones').value, 10);
	level.noteGroups[selectedTrack].ofsY = tracks[selectedTrack].octaveShift * 12 + tracks[selectedTrack].semitoneShift;
	calculateNoteRange();
	adjustZoom();
	softRefresh();
	updateInstrumentContainer();
}

/**
 * Changes the currently selected track, refreshing the track selector.
 * @param {number} trkID The ID of the track to select.
 */
function selectTrack(trkID) {
	if (isPlaying && isContinuousPlayback) cancelPlayback();
	let initSelect = (trkID === -1);
	let trackID = trkID;
	if (trackID === -1) trackID = getFirstVisibleTrack();
	// Check to see if the checkbox is about to update. If yes, return
	if (document.getElementById(`chk${trackID}`)
		.checked !== level.noteGroups[trackID].isVisible && !initSelect) {
		return;
	}
	selectedTrack = trackID;
	document.getElementById('octaveShift').value = tracks[selectedTrack].octaveShift;
	document.getElementById('semitones').value = tracks[selectedTrack].semitoneShift;
	document.getElementById('shiftBtn')
		.disabled = (tracks[selectedTrack].octaveShift === getViewOctaveShift(selectedTrack));
	if (tracks[selectedTrack].hasPercussion || usingAdvSettings) {
		document.getElementById('semitonesContainer').hidden = false;
	} else {
		document.getElementById('semitonesContainer').hidden = true;
	}
	for (let i = 0; i < tracks.length; i++) {
		let trkdiv = document.getElementById(`item${i}`);
		if (i !== trackID) {
			trkdiv.style.backgroundColor = '';
			trkdiv.style.borderWidth = '0px';
			if (tracks[i].hasVisibleNotes) {
				document.getElementById(`trklabl${i}`).style.color = '';
			} else {
				document.getElementById(`trklabl${i}`).style.color = 'lightgray';
			}
		} else {
			trkdiv.style.backgroundColor = 'mediumaquamarine';
			trkdiv.style.borderWidth = '2px';
			if (tracks[i].hasVisibleNotes) {
				document.getElementById(`trklabl${i}`).style.color = 'black';
			} else {
				document.getElementById(`trklabl${i}`).style.color = 'gray';
			}
		}
	}
	document.getElementById('trackName').value = '';
	document.getElementById('trackName').placeholder = tracks[selectedTrack].label;
	// if(!isNewFile){refreshOutlines();}
	softRefresh(false);
	updateInstrumentContainer();
}

function getFirstVisibleTrack() {
	for (let i = 0; i < tracks.length; i++) { // Find the first visible checkbox to select
		if (document.getElementById(`chk${i}`).style.display !== 'none') return i;
	}
	return -1;
}

/**
 * Changes every instance of an original instrument in the specified track into a new instrument.
 * @param {number} trk The ID of the track to replace instruments in.
 * @param {number} ins The Mario Maker 2 tile ID of the orignal instrument to replace.
 * The original instrument is the instrument originally detected in the MIDI file.
 * @param {number} newIns The Mario Maker 2 tile ID of the instrument to replace the detected instruments with.
 */
function changeInstrument(trk, ins, newIns) {
	let i;
	for (i = 0; i < tracks[trk].notes.length; i++) {
		if (getMM2Instrument(midi.trks[trk].notes[i].originalInstrument) === ins) {
			tracks[trk].notes[i].instrument = newIns - 2;
		}
	}
	refreshBlocks();
	hardRefresh(false);
}

/**
 * Refreshes the options in the instrument dropdown menu, recommending instruments based on
 * the current instrument's octave and entity counts.
 */
function updateInstrumentContainer() { // TODO: Refactor grouping code
	/* if (tracks[selectedTrack].hasPercussion) { // TODO: Remove; add MIDI percussion names, selection category
        document.getElementById('instrumentContainer').hidden = true;
        return;
    } */

	// TODO: Show only percussion on percussion tracks unless in advanced mode
	// Don't show percussion on non-percussion unless in advanced mode

	document.getElementById('instrumentContainer').hidden = false;

	let container = document.getElementById('instrumentContainer');
	container.innerHTML = '';
	let targetOctave = -tracks[selectedTrack].octaveShift;
	let i;
	for (i = 0; i < midi.trks[selectedTrack].usedInstruments.length; i++) {
		let div = document.createElement('div');
		div.id = `inscontainer${i}`;
		div.style = 'width: max-content';
		let picker = document.createElement('select');
		picker.id = `inspicker${i}`;
		picker.setAttribute('onchange', `triggerInstrChange(${i});`);
		picker.setAttribute('class', 'dropdown');

		let isPowerupOverflow = level.entityCount > 100;
		let isEntityOverflow = level.powerupCount > 100;
		let hasOctaveRec = false;
		let hasEntityRec = false;
		let hasPercussion = false;

		let recOctGroup = document.createElement('optgroup');
		recOctGroup.setAttribute('label', 'Recommended: Complementary Octave');
		let percussionGroup = document.createElement('optgroup');
		percussionGroup.setAttribute('label', 'Percussion');
		let recEntGroup = document.createElement('optgroup');
		if (isEntityOverflow && !isPowerupOverflow) {
			recEntGroup.setAttribute('label', 'Recommended - General Entities');
		} else if (isPowerupOverflow && !isEntityOverflow) {
			recEntGroup.setAttribute('label', 'Recommended - Powerups');
		}

		let allGroup = document.createElement('optgroup');
		allGroup.setAttribute('label', 'All Instruments');
		numRecommendedInstruments = 0;
		for (let j = 0; j < alphabetizedInstruments.length; j++) {
			if (!alphabetizedInstruments[j].isBuildable && !showUnbuildables) continue;
			let opt = document.createElement('option');
			opt.value = j; // alphabetizedInstruments[j].id;
			opt.innerHTML = `${alphabetizedInstruments[j].name} (`;
			if (alphabetizedInstruments[j].octave >= 0) {
				opt.innerHTML += `+${alphabetizedInstruments[j].octave} 8va)`;
			} else {
				opt.innerHTML += `${alphabetizedInstruments[j].octave} 8vb)`;
			}
			let optClone;
			if (alphabetizedInstruments[j].isPercussion) {
				optClone = opt.cloneNode(true);
				percussionGroup.appendChild(optClone);
				numRecommendedInstruments++;
				hasPercussion = true;
			}
			if (alphabetizedInstruments[j].octave === targetOctave) {
				optClone = opt.cloneNode(true);
				recOctGroup.appendChild(optClone);
				numRecommendedInstruments++;
				hasOctaveRec = true;
			}
			if (isEntityOverflow && !isPowerupOverflow) {
				if (!alphabetizedInstruments[j].isPowerup) {
					optClone = opt.cloneNode(true);
					recEntGroup.appendChild(optClone);
					numRecommendedInstruments++;
					hasEntityRec = true;
				}
			} else if (isPowerupOverflow && !isEntityOverflow) {
				if (alphabetizedInstruments[j].isPowerup) {
					optClone = opt.cloneNode(true);
					recEntGroup.appendChild(optClone);
					numRecommendedInstruments++;
					hasEntityRec = true;
				}
			}
			allGroup.appendChild(opt);
		}
		let labl = document.createElement('label');
		labl.id = `inspickerlabl${i}`;
		labl.for = `inspicker${i}`;
		labl.innerHTML = `${getMidiInstrumentName(midi.trks[selectedTrack].usedInstruments[i])} ➞ `;
		div.appendChild(labl);
		div.appendChild(picker);
		if (hasOctaveRec) {
			picker.appendChild(recOctGroup);
		}
		if (hasEntityRec) {
			picker.appendChild(recEntGroup);
		}
		if (hasPercussion || usingAdvSettings) {
			picker.appendChild(percussionGroup);
		}
		picker.appendChild(allGroup);
		picker.selectedIndex = getSortedInstrumentIndex(tracks[selectedTrack].instrumentChanges[i])
            + numRecommendedInstruments;
		container.appendChild(div);
		updateOutOfBoundsNoteCounts();
	}
}

/**
 * Reads the value of the instrument dropdown and changes the instrument accordingly.
 */
function triggerInstrChange(selectedInstrument) {
	let selectedInsIndex = alphabetizedInstruments[document.getElementById(`inspicker${selectedInstrument}`).value].pos;
	// let selectedInsIndex = getInstrumentById(document.getElementById(`inspicker${selectedInstrument}`).value);
	changeInstrument(
		selectedTrack,
		getMM2Instrument(midi.trks[selectedTrack].usedInstruments[selectedInstrument]),
		selectedInsIndex + 2
	);
	tracks[selectedTrack].instrumentChanges[selectedInstrument] = selectedInsIndex;
}

/**
 * Displays the number of notes above and below the viewing window, colorizing based on the
 * ratio of out-of-bounds notes to total notes in the selected track.
 */
function updateOutOfBoundsNoteCounts() {
	let nasText = document.getElementById('noteAboveScreenText');
	let nbsText = document.getElementById('noteBelowScreenText');
	let denom = tracks[selectedTrack].notes.length;
	let nasPercent = Math.round((tracks[selectedTrack].numNotesOffscreen.above * 100) / denom);
	nasText.innerHTML = `Notes above screen: ${nasPercent}%`;
	if (nasPercent === 0) nasText.style.color = 'lime';
	else if (nasPercent <= 15) nasText.style.color = 'limegreen';
	else if (nasPercent <= 30) nasText.style.color = 'orange';
	else nasText.style.color = 'tomato';
	let nbsPercent = Math.round((tracks[selectedTrack].numNotesOffscreen.below * 100) / denom);
	nbsText.innerHTML = `Notes below screen: ${nbsPercent}%`;
	if (nbsPercent === 0) nbsText.style.color = 'lime';
	else if (nbsPercent <= 15) nbsText.style.color = 'limegreen';
	else if (nbsPercent <= 30) nbsText.style.color = 'orange';
	else nbsText.style.color = 'tomato';
}

/**
 * Finds the Mario Maker 2 instrument ID of the instrument corresponding to the input name.
 * @param {string} name The name of the instrument to retrieve the ID of.
 * @returns {number} The instrument ID of the instrument with the name.
 */
function getInstrumentById(name) { // Not the fastest solution, but it's convenient
	for (let i = 0; i < MM2Instruments.length; i++) {
		if (MM2Instruments[i].id === name) {
			return i;
		}
	}
	return -1;
}

/**
 * Suggests a Mario Maker 2 instrument recommendation for a percussion key on MIDI Channel 10.
 * @param {number} key The percussion key to recommend an instrument for.
 * @returns {number} The instrument ID of the recommended instrument.
 */
function getPercussionInstrument(key) {
	switch (key) {
	case 35:
		return getInstrumentById('pow');
	case 36:
		return getInstrumentById('pow');
	case 37:
		return getInstrumentById('pow');
	case 40:
		return getInstrumentById('pswitch');
	case 41:
		return getInstrumentById('pswitch');
	case 42:
		return getInstrumentById('pow');
	case 43:
		return getInstrumentById('pswitch');
	case 44:
		return getInstrumentById('sidewaysspring');
	case 45:
		return getInstrumentById('pswitch');
	case 46:
		return getInstrumentById('sidewaysspring');
	case 47:
		return getInstrumentById('pswitch');
	case 48:
		return getInstrumentById('spring');
	case 51:
		return getInstrumentById('spring');
	case 52:
		return getInstrumentById('spring');
	case 55:
		return getInstrumentById('spring');
	case 57:
		return getInstrumentById('spring');
	case 59:
		return getInstrumentById('spring');
	case 65:
		return getInstrumentById('billblaster');
	case 66:
		return getInstrumentById('billblaster');
	case 76:
		return getInstrumentById('post');
	case 77:
		return getInstrumentById('post');
	default:
		return getInstrumentById('pswitch');
	}
}

/**
 * Splits a track with multiple instruments into multiple tracks - one for each instrument.
 * @param {number} trk The ID of the multiple-instrument track to separate.
 */
function sepInsFromTrk(trk) { // Create new // TODO: Use MaestroTracks instead
	let i;
	let newTrks = new Array(trk.usedInstruments.length);
	for (i = 0; i < trk.usedInstruments.length; i++) {
		newTrks[i] = new MIDItrack();
		newTrks[i].usedInstruments = [trk.usedInstruments[i]];
	}
	let j;
	let thisHasPercussion;
	let thisLowestNote;
	let thisHighestNote;
	for (i = 0; i < trk.notes.length; i++) {
		thisHasPercussion = false;
		thisHighestNote = null;
		thisLowestNote = null;
		for (j = 0; j < trk.usedInstruments.length; j++) {
			if (trk.notes[i].instrument === trk.usedInstruments[j]) {
				if (trk.notes[i].channel === 9) {
					thisHasPercussion = true;
				}
				if ((trk.notes[i].pitch < thisLowestNote && !thisHasPercussion) || thisLowestNote === null) {
					thisLowestNote = trk.notes[i].pitch;
				}
				if (trk.notes[i].pitch > thisHighestNote && !thisHasPercussion) {
					thisHighestNote = trk.notes[i].pitch;
				}
				newTrks[j].notes.push(cloneNote(trk.notes[i]));
				break;
			}
		}
		newTrks[j].hasPercussion = thisHasPercussion;
		newTrks[j].highestNote = thisHighestNote;
		newTrks[j].lowestNote = thisLowestNote;
	}
	for (i = 0; i < newTrks.length; i++) {
		let labl;
		if (newTrks[i].hasPercussion) {
			labl = 'Percussion';
		} else {
			labl = getInstrumentLabel(newTrks[i].usedInstruments[0]);
		}
		newTrks[i].label = `${labl} ${midi.getLabelNumber(labl)}`;
		addTrack(newTrks[i]);
	}
	disableTrack(trk);
}

/**
 * Adds a new track to the list of current tracks in the level.
 * @param {MIDItrack} track The MIDItrack object of the track to add to the level.
 */
function addTrack(track) {
	midi.trks.push(track);
	tracks.push(new MaestroTrack(track));
	level.noteGroups.push(new PreloadedNoteGroup());
}

/**
 * Removes all of the notes in a track, effectively disabling it and making it invisible.
 * @param {MIDItrack} track The MIDItrack object of the track to disable.
 */
function disableTrack(track) { // This makes the track invisible, but doesn't actually remove it from the array
	track.notes = [];
}

/**
 * Plays a button press animation on the Discord button and opens the Discord invite in a new tab.
 */
function handleDiscordPress() {
	let btn = document.getElementById('discordBtn');
	btn.style.animationFillMode = 'both';
	btn.style.animation = '0.2s discordpress, 1.5s discordglow';
	btn.style.animationIterationCount = '1, infinite';
	btn.style.animationDirection = 'alternate';
	setTimeout(() => {
		btn.style.boxShadow = '#1a5586 0px 0px';
		btn.style.transform = 'translateY(8px)';
	}, 200);
	setTimeout(() => {
		btn.disabled = true;
		btn.style.animation = 'discorddisappear 0.5s';
		btn.style.animationFillMode = 'both';
		window.open(discordInviteLink);
	}, 600);
}

/**
 * Changes the position of the main display's scrollbar by an amount.
 * @param {number} pixels The amount to displace the scrollbar by, in pixels.
 */
function scrollDisplayBy(pixels) {
	let current = document.getElementById('displayContainer').scrollLeft;
	document.getElementById('displayContainer').scrollLeft = current + pixels;
}

/**
 * Changes the position of the main display's scrollbar to an exact amount.
 * @param {number} pixelsOfs The displacement of the scrollbar, in pixels.
 */
function scrollDisplayTo(pixelsOfs) {
	document.getElementById('displayContainer').scrollLeft = pixelsOfs;
}

/**
 * Toggles advanced settings, refreshing the UI accordingly.
 */
function toggleAdvancedMode() {
	usingAdvSettings = document.getElementById('advanceSettings').checked;
	if (tracks[selectedTrack].hasPercussion || usingAdvSettings) {
		document.getElementById('semitonesContainer').hidden = false;
	} else {
		// Reset semitone shifts on tracks where it can only be changed with Advanced Settings
		document.getElementById('semitones').value = 0;
		document.getElementById('semitonesContainer').hidden = true;
		let i;
		for (i = 0; i < tracks.length; i++) {
			if (!tracks[i].hasPercussion) {
				tracks[i].semitoneShift = 0;
				level.noteGroups[selectedTrack].ofsY = tracks[selectedTrack].octaveShift * 12;
			}
		}
		softRefresh();
	}
	if (!usingAdvSettings) {
		blocksPerBeat = reccBPB;
		document.getElementById('blockPerBeat').value = blocksPerBeat;
		lastBPB = blocksPerBeat;
		changeBPB();
	}
}

function togglePercussion() {
	let isEnabled = document.getElementById('showPercussion').checked;
	for (let i = 0; i < tracks.length; i++) {
		const thisTrk = tracks[i];
		if (thisTrk.hasPercussion) {
			tracks[i].isHidden = !isEnabled;
			level.noteGroups[i].isVisible = isEnabled;
		}
	}
	updateUI(false, false, false);
	softRefresh();
}

/**
 * Determines the set of acceptable blocks per beat values based on the recommended one.
 * @returns {number[]} The set of acceptable values.
 */
function generateAcceptableBPBs() {
	if (Math.ceil(Math.log2(reccBPB)) === Math.floor(Math.log2(reccBPB))) { // Check if the number is a power of 2
		return [1, 2, 4, 8];
	}
	if (reccBPB % 3 === 0 || reccBPB === 5) {
		return [3, 5, 6];
	}
	return [reccBPB]; // For BPB 7
}

/**
 * Corrects the value of the blocks per beat setting to the acceptable range
 * if it falls outside of the acceptable range.
 */
function filterBPB() {
	// Return the minimum or maxiumum BPB if the current BPB is out of range of recommened BPBs

	if (blocksPerBeat > acceptableBPBs[acceptableBPBs.length - 1]) {
		blocksPerBeat = acceptableBPBs[acceptableBPBs.length - 1];
		return;
	}
	if (blocksPerBeat < acceptableBPBs[0]) {
		[blocksPerBeat] = acceptableBPBs;
		return;
	}

	// Handle when BPB is between the min and max recommended BPBs

	let i;
	for (i = 0; i < acceptableBPBs.length; i++) { // Loop through the acceptable BPBs and check for a match
		if (blocksPerBeat === acceptableBPBs[i]) {
			return;
		} // If there is, return; no correction needed
	}
	let delta = blocksPerBeat - lastBPB; // +1 or -1; whether the bpb was increased or decreased
	let last = acceptableBPBs[0];
	// Loop through the recommended BPBs, stopping when it exceeds the current uncorrected bpb
	for (i = 0; i < acceptableBPBs.length; i++) {
		if (acceptableBPBs[i] > blocksPerBeat) {
			if (delta < 0) { // Pick the lesser BPB if the BPB was decreased
				blocksPerBeat = last;
				return;
			}
			// Pick the greater BPB if the BPB was increased
			blocksPerBeat = acceptableBPBs[i];
			return;
		}
		last = acceptableBPBs[i]; // Save the last recommended BPB looped through
	}
}

/**
 * Calculates the octave shift value needed to shift a track into view from the average note pitch of the track.
 * @param {number} trkID The ID of the track to calculate the shift value for.
 * @returns {number} The octave shift value needed to shift the track into view.
 */
function getViewOctaveShift(trkID) {
	let sum = 0;
	let i;
	for (i = 0; i < tracks[trkID].notes.length; i++) {
		sum += tracks[trkID].notes[i].pitch;
	}
	let avg = sum / tracks[trkID].notes.length;
	return Math.round((avg - (60 + (ofsY - baseOfsY))) / 12) * -1;
}

/**
 * Shifts the selected track into view of the level.
 */
function shiftTrackIntoView() {
	cancelPlayback();
	let shift = getViewOctaveShift(selectedTrack);
	tracks[selectedTrack].octaveShift = shift;
	tracks[selectedTrack].semitoneShift = 0;
	document.getElementById('octaveShift').value = shift;
	level.noteGroups[selectedTrack].ofsY = tracks[selectedTrack].octaveShift * 12 + tracks[selectedTrack].semitoneShift;
	calculateNoteRange();
	adjustZoom();
	softRefresh();
	updateInstrumentContainer();
}

/**
 * Redraws the outline layer of the selected track onto the outline layer.
 */
function refreshOutlines() {
	clearDisplayLayer(dlayer.outlineLayer);
	canvasLayers[dlayer.outlineLayer].ctx
		.drawImage(outlineLayers[selectedTrack].canvas, 0, 0, canvas.width, canvas.height);
	refreshCanvas();
}

/**
 * Sorts the instruments array alphabetically.
 * @param {Object[]} arr The instrument array to sort.
 * @return {Object[]} The sorted instrument array.
 */
function alphabetizeInstruments(arr) { // TODO: Use Object.assign
	let newArr = new Array(arr.length);
	for (let i = 0; i < arr.length; i++) {
		newArr[i] = {
			id: arr[i].id,
			name: arr[i].name,
			octave: arr[i].octave,
			pos: i,
			isPercussion: arr[i].isPercussion,
			isPowerup: arr[i].isPowerup,
			isBuildable: arr[i].isBuildable
		};
	}
	newArr.sort((a, b) => {
		if (a.name > b.name) {
			return 1;
		}
		return -1;
	});
	return newArr;
}

/**
 * Finds the index of the alphabetized instrument array based on the index in the unalphabetized instrument array.
 * @param {number} unsortedIndex The index to get the sorted index of.
 * @returns {number} The corresponding index of the alphabetized instrument array.
 */
function getSortedInstrumentIndex(unsortedIndex) {
	let i;
	let idx = 0;
	for (i = 0; i < alphabetizedInstruments.length; i++) {
		if (!alphabetizedInstruments[i].isBuildable && !showUnbuildables) continue;
		if (unsortedIndex === alphabetizedInstruments[i].pos) {
			return idx;
		}
		idx++;
	}
	return -1;
}

/**
 * Adjusts the minimap's zoom level based on the detected range of notes in the file.
 * @returns {number} The calculated zoom level.
 */
function adjustZoom() {
	let range = noteRange;
	if (range < 18) {
		range = 18;
	}
	let lowerBound = 64 - range;
	let zoom = -32 / (lowerBound - 64);
	setMiniZoomY(zoom);
	return zoom;
}

/**
 * Calculates the difference between the highest and lowest visible note in the file.
 */
function calculateNoteRange() {
	noteRange = 0;
	for (let i = 0; i < midi.trks.length; i++) {
		if (midi.trks[i].lowestNote === null
            || midi.trks[i].highestNote === null
            || !level.noteGroups[i].isVisible) {
			continue;
		}
		let thisRange = Math.max(
			Math.abs(64 - (midi.trks[i].lowestNote + level.noteGroups[i].ofsY)),
			Math.abs(64 - (midi.trks[i].highestNote + level.noteGroups[i].ofsY))
		);
		if (thisRange > noteRange) {
			noteRange = thisRange;
		}
	}
}

/**
 * Redraws the points on the minimap where notes are located.
 */
function redrawMinimap() {
	miniClear(0);
	for (let i = 0; i <= tracks.length; i++) {
		let index = i;
		if (i === selectedTrack) continue;
		if (i === tracks.length) index = selectedTrack; // Draw the selected track last
		for (let j = 0; j < tracks[index].notes.length; j++) {
			if (!level.noteGroups[index].isVisible || tracks[index].notes.length === 0) continue;
			let note = tracks[index].notes[j];
			if (note.volume < noiseThreshold) continue;
			let x = Math.round(ticksToBlocks(note.time));
			let y = pitchToBlocks(index, note.pitch);
			if (index === selectedTrack) miniPlot(x, y, 'mediumaquamarine');
			else miniPlot(x, y);
		}
	}
}

/**
 * Updates the stored values for tile positions in the level.
 */
function refreshBlocks() { // TODO: Somehow quantize the notes further when the user switches to wigglers without losing data (they cannot use semisolids)
	let highestX = 0;
	for (let i = 0; i < tracks.length; i++) {
		level.clearNoteGroup(i);
		level.noteGroups[i].ofsY = tracks[i].octaveShift * 12 + tracks[i].semitoneShift;
		for (let j = 0; j < tracks[i].notes.length; j++) {
			let note = tracks[i].notes[j];
			if (note.volume < noiseThreshold) {
				continue;
			} // Skip notes with volume below noise threshold
			x = ticksToBlocks(note.time);
			// let levelX = Math.round(x);
			let levelX = roundBlocks(x);
			if (levelX > highestX) highestX = levelX;
			let levelY = note.pitch + 1;
			if (levelX >= ofsX && levelX < ofsX + levelWidth) {
				level.noteGroups[i].add(note.pitch, note.instrument, levelX, levelY, note);
			}
		}
	}
	level.maxWidth = highestX;
}

/**
 * Changes the level's x-offset and triggers a quick refresh of the level if a new value is set.
 * @param {number} ox The new x-offset.
 */
function setLevelXTo(ox) {
	if (!fileLoaded || ofsX === ox) {
		return;
	}
	ofsX = ox;
	let limX = (minimap.width - (canvas.width / 16 - 27)) + (blocksPerBeat * bbar);
	if (ofsX > limX) {
		ofsX = limX;
	}
	if (ofsX < 0) {
		ofsX = 0;
	}
	quickLevelRefresh();
}

/**
 * Obtains the fractional component of a number, which will always be less than 1.
 * @param {number} n A number.
 * @returns {number} The fractional part of the number.
 */
function getFraction(n) {
	return n - Math.floor(n);
}

/**
 * Converts MIDI time ticks to a quantity in blocks.
 * @param {number} ticks The number of ticks.
 * @returns {number} The number of blocks represented.
 */
function ticksToBlocks(ticks) {
	return (ticks / midi.timing) * blocksPerBeat;
}

function blocksToTicks(blocks) {
	return (blocks / blocksPerBeat) * midi.timing;
}

function pitchToBlocks(trkId, pitch) {
	return pitch + 1 + level.noteGroups[trkId].ofsY;
}

function blocksToPitch(trkId, blocks) {
	return blocks - level.noteGroups[trkId].ofsY - 1;
}

function roundBlocks(numBlocks) {
	let numUnits = Math.round(numBlocks * numBlockSubdivisions);
	return numUnits / numBlockSubdivisions;
}

/**
 * Converts a distance in blocks in fast autoscroll to the equivalent distance in all of the other tempos.
 * Then, lists the scroll speeds whose values are closest to being doable.
 * Underwater scroll speeds are omitted from this search.
 * This function is only used for research and discovery purposes.
 * @param {number} blocks The distance in blocks for fast autoscroll.
 */
function getEquivalentBlocks(blocks) {
	MM2Tempos.forEach((n) => {
		let val = (n.bpm / 112) * blocks;
		if (getFraction(val / 0.5) < 0.51 && n.name.search('water') === -1 && n.name.search('wim') === -1) {
			console.log(`${n.name}: ${val}`);
		}
	});
}

/**
 * Hides a MIDI track in the UI, but allows the user to still view it if desired.
 * @param {number} id The ID of the track to hide.
 */
function hideTrk(id) {
	level.noteGroups[id].setVisibility(false);
	document.getElementById(`chk${id}`).checked = false;
	// chkRefresh();
}

/**
 * Opens a link to a tutorial.
 */
function tutorialBtn() {
	window.open(tutorialLink);
}

/**
 * Sets the text and function in the playback controls depending on if audio is being rendered.
 * @param {boolean} status Whether the user is waiting for audio to be rendered.
 */
function setPlaybackWaitStatus(status) {
	if (status) {
		document.getElementById('playBtn').innerHTML = '. . .';
		document.getElementById('stopBtn').innerHTML = '. . .';
		document.getElementById('stopBtn').disabled = true;
	} else {
		document.getElementById('playBtn').innerHTML = 'Play';
		document.getElementById('stopBtn').innerHTML = 'Stop';
		document.getElementById('stopBtn').disabled = false;
	}
	isRendering = status;
}

function toggleBuildRestriction() {
	showUnbuildables = document.getElementById('unsupportedEntities').checked;
	updateInstrumentContainer();
}

function addNote(trkId, time, pitch) { // TODO: Log events
	let note = new MaestroNote();
	note.pitch = pitch;
	note.time = time;
	note.instrument = tracks[trkId].instrumentChanges[0];
	note.originalInstrument = tracks[trkId].origInstrument;
	note.x = ticksToBlocks(time);
	note.y = pitchToBlocks(trkId, pitch);
	note.origNote = note;

	// Search for matching pitch and x position globally
	let globalIdx = findNote(trkId, time, pitch).idx;

	tracks[trkId].notes.splice(globalIdx, 0, note);
	midi.trks[trkId].notes.splice(globalIdx, 0, note);

	let event = new EditEvent(trkId, 0, { note, idx: globalIdx });
	undoManager.addEvent(event);

	refreshBlocks();
	softRefresh();
}

function removeNote(trkId, time, pitch) {
	// Search for matching pitch and x position globally
	let noteSearch = findNote(trkId, time, pitch);
	if (!noteSearch.success) return;
	let globalIdx = noteSearch.idx;

	tracks[trkId].notes.splice(globalIdx, 1);
	midi.trks[trkId].notes.splice(globalIdx, 1);

	let event = new EditEvent(trkId, 1, { note: noteSearch.obj, idx: globalIdx });
	undoManager.addEvent(event);

	refreshBlocks();
	softRefresh();
}

function findNote(track, time, pitch, doRound = true) { // TODO: Prevent time precision loss
	let targetX = Math.round(ticksToBlocks(time));
	for (let i = 0; i < tracks[track].notes.length; i++) {
		let thisNote = tracks[track].notes[i];
		let thisX = Math.round(ticksToBlocks(thisNote.time));
		if (thisX === targetX && thisNote.pitch === pitch) return { success: true, idx: i, obj: thisNote };
		if (thisX > targetX) return { success: false, idx: i, obj: null };
	}
	return { success: false, idx: tracks[track].notes.length, obj: null };

	// TODO: Fix this binary search implementation
	/* let leftBound = 0;
	let rightBound = tracks[track].notes.length;
	let index;
	let isFound = false;
	let targetX = Math.round(ticksToBlocks(time));
	while (!isFound && Math.abs(leftBound - rightBound) > 1) {
		index = Math.floor((leftBound + rightBound) / 2);
		let thisNote = tracks[track].notes[index];
		let thisX = Math.round(ticksToBlocks(thisNote.time));
		if (thisX === targetX && thisNote.pitch === pitch) isFound = true;
		else if (thisX < targetX) leftBound = index;
		else rightBound = index;
		console.log(index - 1);
	}
	index--;
	console.log('out', isFound);
	if (isFound) return { success: true, idx: index };
	return { success: false, idx: index }; */
}

function toggleBuildMode() {
	setIsBuildMode(!isBuildMode);
	softRefresh(false, true);
}

function setIsBuildMode(isEnabled) {
	isBuildMode = isEnabled;
	drawOffsetX = 0;
}

function setSecondaryTrack() {
	secondaryTrack = selectedTrack;
	updateTrackList();
	selectTrack(selectedTrack);
}

function createNewTrack() {
	let newTrk = new MIDItrack();

	newTrk.usedInstruments = [0];
	newTrk.hasPercussion = false;
	newTrk.highestNote = null;
	newTrk.lowestNote = null;
	newTrk.isFromUser = true;

	let labl;
	if (newTrk.hasPercussion) {
		labl = 'Percussion';
	} else {
		labl = getInstrumentLabel(newTrk.usedInstruments[0]);
	}
	newTrk.label = `${labl} ${midi.getLabelNumber(labl)}`;

	addTrack(newTrk);
	updateUI(false, false, false);
	softRefresh();
}

function toggleSoloMode() {
	isSoloMode = document.getElementById('soloBox').checked;
	cancelPlayback();
	softRefresh();
}

function triggerTrackLabelChange() {
	let newName = document.getElementById('trackName').value;
	updateTrackLabel(selectedTrack, newName);
}

function updateTrackLabel(trkId, newLabel) {
	tracks[trkId].label = newLabel;
	updateTrackList();
	selectTrack(selectedTrack);
}

function triggerTrackDelete() {
	deleteTrack(selectedTrack);
}

function deleteTrack(trkId) { // TODO: Prevent last remaining track from being deleted
	tracks[trkId].isHidden = true;
	level.noteGroups[trkId].isVisible = false;
	updateUI(false, false, false);
	softRefresh();
}

function binarySearch(arr, value, valueFunc) {
	let leftBound = 0;
	let rightBound = arr.length;
	let index;
	let isFound = false;
	while (!isFound) {
		index = Math.floor((leftBound + rightBound) / 2);
		let thisVal = valueFunc(arr[index]);
		if (thisVal === value) isFound = true;
		else if (thisVal < value) leftBound = index;
		else rightBound = index;
	}
	if (isFound) return index;
	return -1;
}

function setToolbarVisibility(visible) {
	let toolbar = document.getElementById('outsideToolbarContainer');
	if (visible) toolbar.style.visibility = 'visible';
	else toolbar.style.visibility = 'hidden';
}

function setPushback() {
	let pickerVal = document.getElementById('pushbackLimit').value;
	pickerVal = Math.max(pickerVal, 0);
	levelPushBackLimit = pickerVal;
	hardRefresh(false, true);
}
