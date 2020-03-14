// Super Mario Maestro v1.3.1
// made by h267

/* TODO: New features:

1.4:
 - Animated entities with physics simulation
 - Partition system where different settings can apply
 - Toolbar for display tools
 - Manual note editing
 - CSS loading animation (if needed)
 - Spatial Management, com_poser tricks, maybe autoscroll tracks
 - Warning system
 - Theme, style, day/night indicators
 - Overlay exclamation points on impossible placements
 - Handle dynamic tempo changes
 - Start music playback from anywhere in the blueprint
*/

const levelWidth = 240;
const marginWidth = 27;
const levelHeight = 27;
const baseOfsY = 48;
const discordInviteLink = 'https://discord.gg/KhmXzfp';
const tutorialLink = 'https://www.reddit.com/r/MarioMaker/comments/f5fdzl/tutorial_for_automatically_generating_music/';
const contPlayback = false; // Dev toggle for full map playback
const numParts = 20;
const autoShowRatio = 0.7;

var reader = new FileReader();
var numCommonTempos = 0;
var midi;
var mapWidth;

/**
 * Data on the various scroll speeds in Mario Maker 2. Tempos are stored in their 4 block per beat equivalents.
 */
const MM2Tempos = [
      {name: 'Slow Autoscroll', bpm: 28, isCommon: false},
      {name: 'Backwards Normal Conveyor - Walking', bpm: 28, isCommon: false},
      {name: 'Underwater - Walking', bpm: 32, isCommon: false},
      {name: 'Normal Conveyor - Idle', bpm: 56, isCommon: false},
      {name: 'Medium Autoscroll', bpm: 56, isCommon: true},
      {name: 'Backwards Fast Conveyor - Running', bpm: 56, isCommon: false},
      {name: 'Swimming', bpm: 64, isCommon: false},
      {name: 'Walking', bpm: 84, isCommon: true},
      {name: 'Blaster in Cloud - Idle', bpm: 84, isCommon: false},
      {name: 'Normal Underwater Conveyor - Walking', bpm: 88, isCommon: false},
      {name: 'Swimming Holding Item', bpm: 101, isCommon: false},
      {name: 'Fast Autoscroll', bpm: 112, isCommon: true},
      {name: 'Backwards Normal Conveyor - Running', bpm: 112, isCommon: false},
      {name: 'Fast Conveyor - Idle', bpm: 112, isCommon: false},
      {name: 'Underwater Blaster in Cloud - Walking', bpm: 116, isCommon: false},
      {name: 'Normal Conveyor - Walking', bpm: 140, isCommon: false},
      {name: 'Fast Lava Lift', bpm: 140, isCommon: true},
      {name: 'Fast Underwater Conveyor - Walking', bpm: 144, isCommon: false},
      {name: 'Underwater Blaster in Cloud - Swimming', bpm: 148, isCommon: false},
      {name: 'Blaster in Cloud - Walking', bpm: 166, isCommon: false},
      {name: 'Running', bpm: 168, isCommon: true},
      {name: 'Underwater Blaster in Cloud - Swimming Holding Item', bpm: 186, isCommon: false},
      {name: 'Fast Conveyor - Walking', bpm: 194, isCommon: false},
      {name: 'Normal Conveyor - Running', bpm: 227, isCommon: false},
      {name: 'Blaster in Cloud - Running', bpm: 256, isCommon: false},
      {name: 'Fast Conveyor - Running', bpm: 279, isCommon: false}
];

/**
 * Data on the instruments available in Mario Maker 2.
 */
const MM2Instruments = [
      {id: 'goomba', name: 'Goomba (Grand Piano)', octave: 1, isPowerup: false},
      {id: 'buzzybeetle', name: 'Buzzy Shellmet (Detuned Bell)', octave: 1, isPowerup: false},
      {id: '1up', name: '1-Up (Synth Organ)', octave: 0, isPowerup: true},
      {id: 'spiketop', name: 'Spike Top (Harpsichord)', octave: 0, isPowerup: false},
      {id: 'sledgebro', name: 'Sledge Bro (Bass Guitar)', octave: -2, isPowerup: false},
      {id: 'piranhaplant', name: 'Piranha Plant (Pizzicato Strings)', octave: 1, isPowerup: false},
      {id: 'bobomb', name: 'Bob-Omb (Orchestra Hit)', octave: 0, isPowerup: false},
      {id: 'spiny', name: 'Spiny Shellmet (Trumpet)', octave: 1, isPowerup: false},
      {id: 'drybones', name: 'Dry Bones Shell (Flute)', octave: 2, isPowerup: false},
      {id: 'mushroom', name: 'Mushroom (Square Wave)', octave: 1, isPowerup: true},
      {id: 'rottenmushroom', name: 'Rotten Mushroom (Low Synth)', octave: -2, isPowerup: true},
      {id: 'greenbeachkoopa', name: 'Green Beach Koopa (Bark)', octave: 0, isPowerup: false},
      {id: 'montymole', name: 'Monty Mole (Banjo)', octave: 0, isPowerup: false},
      {id: 'pswitch', name: 'P-Switch (Snare Drum)', octave: 0, isPowerup: false},
      {id: 'redbeachkoopa', name: 'Red Beach Koopa (Meow)', octave: 0, isPowerup: false},
      {id: 'bigmushroom', name: 'Big Mushroom (Shamisen)', octave: 0, isPowerup: true},
      {id: 'billblaster', name: 'Bill Blaster (Timpani)', octave: 0, isPowerup: false},
      {id: 'shoegoomba', name: 'Shoe Goomba (Low Accordion)', octave: -1, isPowerup: false},
      {id: 'stilettogoomba', name: 'Stiletto Goomba (Accordion)', octave: 0, isPowerup: false},
      {id: 'cannon', name: 'Cannon (Timbales)', octave: 0, isPowerup: false},
      {id: 'chainchomp', name: 'Chain Chomp (Unchained) (Synth Piano)', octave: 0, isPowerup: false},
      {id: 'post', name: 'Chain Chomp Post (Wood Block)', octave: 0, isPowerup: false},
      {id: 'coin', name: 'Coin (Sleigh Bells)', octave: 0, isPowerup: false},
      {id: 'firepiranhaplant', name: 'Fire Piranha Plant (Legato Strings)', octave: 0, isPowerup: false},
      {id: 'fireflower', name: 'Fire Flower (Recorder)', octave: 1, isPowerup: true},
      {id: 'goombrat', name: 'Goombrat (Honky-Tonk Piano)', octave: 1, isPowerup: false},
      {id: 'greenkoopa', name: 'Green Koopa (Xylophone)', octave: 1, isPowerup: false},
      {id: 'redkoopa', name: 'Red Koopa (Vibraphone)', octave: 1, isPowerup: false},
      {id: 'hammerbro', name: 'Hammer Bro (Electric Guitar)', octave: 1, isPowerup: false},
      {id: 'magikoopa', name: 'Magikoopa (Synth Choir)', octave: 1, isPowerup: false},
      {id: 'muncher', name: 'Muncher (Synth Piano 2)', octave: 0, isPowerup: false},
      {id: 'pow', name: 'POW Block (Kick Drum)', octave: 0, isPowerup: false},
      {id: 'spring', name: 'Trampoline (Crash Cymbal)', octave: 0, isPowerup: false},
      {id: 'sidewaysspring', name: 'Sideways Trampoline (Hi-Hat)', octave: 0, isPowerup: false},
      {id: 'star', name: 'Super Star (Music Box)', octave: 1, isPowerup: true},
      {id: 'superball', name: 'Superball Flower (Organ)', octave: 1, isPowerup: true},
      {id: 'thwomp', name: 'Thwomp (Ethnic Drum)', octave: 0, isPowerup: false},
      {id: 'wiggler', name: 'Wiggler (Tubular Bells)', octave: 1, isPowerup: false},
      {id: 'spike', name: 'Spike (Acoustic Bass Guitar)', octave: -2, isPowerup: false},
      {id: 'spikeball', name: 'Spike Ball (Bass Drum)', octave: 0, isPowerup: false},
      {id: 'snowball', name: 'Snowball (Tom-Tom Drum)', octave: 0, isPowerup: false},
      {id: 'pokey', name: 'Pokey (Acoustic Guitar)', octave: 0, isPowerup: false},
      {id: 'snowpokey', name: 'Snow Pokey (Kazoo)', octave: 1, isPowerup: false},
      {id: 'sword', name: 'Master Sword (Synth Horn)', octave: 0, isPowerup: true},/*
      {id: 'toad', name: 'Toad (Suffering)', octave: 0, isPowerup: false},*/ // If you uncomment this, only pain and suffering awaits
];
var alphabetizedInstruments = alphabetizeInstruments(MM2Instruments);
var tiles;
var bgs;
var marioSprites;
var speed = 10;
var level = new Level();
var ofsX = 0;
var ofsY = baseOfsY;
var bpm = 120;
var songBPM = 120;
var fileLoaded = false;
var blocksPerBeat = 4;
var recmdBlocksPerBeat = 4;
var currentHighlight = {x:-1,y:-1};
var prevHighlighted = false;
var clickedTile = null;
var minimapData = null;
var displayData = null;
var bbar = 1;
var noMouse = false;
var cursor;
var isNewFile;
var noiseThreshold = 0;
var selectedTrack = 0;
var octaveShifts = [];
var notesAboveScreen = [];
var notesBelowScreen = [];
var instrumentChanges;
var quantizeErrorAggregate = 0;
var scrollPos = 0;
var hasVisibleNotes;
var conflictCount = 0;
var usingAdvSettings = false;
var semitoneShifts = [];
var acceptableBPBs = null;
var reccBPB;
var lastBPB;
var outlineLayers;
var numRecommendedInstruments = 0;
var entityOverflowStatus = {entity: false, powerup: false};
var noteRange = 0;
var defaultZoom = 1;
var hasLoadedBuffers = false;

//getEquivalentBlocks(2.75);

// Load graphics and draw the initial state of the level
document.getElementById('canvas').addEventListener ('mouseout', handleOut, false);
getImg('icon/ruler.png').then(async function(cursorImg){
      cursor = cursorImg;
      tiles = await loadTiles();
      bgs = await loadBGs();
      marioSprites = await loadMario();
      drawLevel(false,true);
});

loadBuffers().then(() => {
      hasLoadedBuffers = true;
      document.getElementById('stopbtn').innerHTML = 'Stop';
      document.getElementById('stopbtn').disabled = false;
      document.getElementById('playbtn').innerHTML = 'Play';
      document.getElementById('playbtn').disabled = false;
});

/**
 * Loads a MIDI file from the file input.
 */
function loadFileFromInput(){
      let fname = document.getElementById('fileinput').files[0].name;
      if(fname.substring(fname.length-8,fname.length).toLowerCase()=='.mp3.mid'){ // Detect MP3 MIDIs
            document.getElementById('noisecontrol').style.display = '';
      }
      else{
            document.getElementById('noisecontrol').style.display = 'none';
      }
      reader.readAsArrayBuffer(document.getElementById('fileinput').files[0]);
	reader.onload = () => loadData(new Uint8Array(reader.result));
}

/**
 * Loads the example MIDI file.
 */
function loadExample(){
      document.getElementById("fileinput").value = "";
      let request = new XMLHttpRequest();
      request.open("GET", "./example.mid", true);
      request.responseType = "arraybuffer";
      request.onerror = (e) => console.error('Unable to load example MIDI.');
      request.onload = () => {
            let arraybuffer = request.response;
            if(arraybuffer){
                  loadData(new Uint8Array(arraybuffer));
            }
      };
      request.send();
}

/**
 * Loads MIDI data and initializes the state of the level.
 * @param {Uint8Array} bytes The MIDI data to load.
 */
function loadData(bytes){ // Load file from the file input element
      if(fileLoaded){
            cancelPlayback();
      }
      if(!fileLoaded){showEverything();}
      midi = new MIDIfile(bytes);
      document.getElementById('advbox').checked = false;
      resetOffsets();
      if(fileLoaded){
            miniClear();
            drawScrubber(ofsX,ofsY+27,canvas.width/16-27,canvas.height/16);
            refreshMini();
      }
      document.getElementById('trkcontainer').innerHTML = '';
      //document.getElementById('trkselect').innerHTML = '';
      selectedTrack = 0;
      octaveShifts = new Array(midi.trks.length).fill(0);
      semitoneShifts = new Array(midi.trks.length).fill(0);
      instrumentChanges = new Array(midi.trks.length);
      hasVisibleNotes = new Array(midi.trks.length).fill(false);
      var i;
      var j;
      for(i=0;i<instrumentChanges.length;i++){
            instrumentChanges[i] = [];
            for(j=0;j<midi.trks[i].usedInstruments.length;j++){
                  instrumentChanges[i][j] = getMM2Instrument(midi.trks[i].usedInstruments[j])-2;
            }
      }
      notesAboveScreen = new Array(midi.trks.length);
      notesAboveScreen.fill(0);
      notesBelowScreen = new Array(midi.trks.length);
      notesBelowScreen.fill(0);
      document.getElementById('octaveshift').value = 0;
      document.getElementById('semitoneshift').value = 0;
      blocksPerBeat = midi.blocksPerBeat;
      reccBPB = blocksPerBeat;
      lastBPB = blocksPerBeat;
      document.getElementById('bpbpicker').value = blocksPerBeat;
      acceptableBPBs = generateAcceptableBPBs();
      isNewFile = true;
      fileLoaded = true;
      noteRange = 0;
      mapWidth = Math.ceil(ticksToBlocks(midi.duration));
      level.noteGroups = [];
      outlineLayers = new Array(midi.trks.length);
      for(i=0;i<midi.trks.length;i++){
            level.addNoteGroup(new PreloadedNoteGroup());
            if(midi.trks[i].usedInstruments.length > 1){
                  sepInsFromTrk(midi.trks[i]);
            }
            if(midi.trks[i].hasPercussion){
                  let isInPartitions = new Array(numParts).fill(false);
                  let partitionSize = Math.floor(mapWidth/numParts);
                  for(j=0;j<midi.trks[i].notes.length;j++){
                        let curPartition = Math.floor(ticksToBlocks(midi.trks[i].notes[j].time)/partitionSize);
                        isInPartitions[curPartition] = true;
                  }
                  let sum = 0;
                  for(j=0;j<isInPartitions.length;j++){
                        if(isInPartitions[j]) sum++;
                  }
                  if(sum/numParts < autoShowRatio) level.noteGroups[i].setVisibility(false);
            }
            outlineLayers[i] = new DrawLayer(canvas.width, canvas.height);
            if(midi.trks[i].usedInstruments.length == 0 || midi.trks[i].hasPercussion){continue;}
            octaveShifts[i] = MM2Instruments[getMM2Instrument(midi.trks[i].usedInstruments[0])-2].octave*-1;
            if(midi.trks[i].highestNote == null || midi.trks[i].highestNote == null){continue;}
            var thisRange = Math.max(Math.abs(64-midi.trks[i].lowestNote),Math.abs(64-midi.trks[i].highestNote));
            if(thisRange > noteRange){noteRange = thisRange;}
      }
      //console.log(noteRange);
      refreshBlocks();
      updateUI(false, true);
      isNewFile = false;
      document.getElementById('yofspicker').disabled = false;
      document.getElementById('bpbpicker').disabled = false;
      document.getElementById('tempotext').innerHTML = 'Original: '+Math.round(songBPM)+' bpm';
      document.getElementById('advbox').checked = usingAdvSettings;
      /*var newTrack = new MIDItrack();
      newTrack.label = 'test'
      newTrack.notes[0] = new Note(0,0,1,0,0);
      addTrack(newTrack);*/
      //console.log(midi.noteCount+' notes total');
}

/**
 * Refreshes the state of the user interface.
 */
function updateUI(limitedUpdate, reccTempo){
      var i;
      var width = mapWidth;
      setMiniWidth(width);
      var haveTempo = false; // TODO: Get rid of this when adding dynamic tempo
      bbar = midi.firstBbar;
      if(!limitedUpdate){
            document.getElementById('trkcontainer').innerHTML = '';
            recommendBPB();
      }
      if(midi.firstTempo != 0){songBPM = 60000000/midi.firstTempo;}
      for(i=0;i<midi.trks.length;i++){
            // Add checkbox with label for each track
            if(!limitedUpdate){
                  var div = document.createElement('div');
                  div.id = 'item'+i;
                  div.setAttribute('class','tracklistitem');
                  div.setAttribute('onclick','selectTrack('+i+');');
                  div.style.borderRadius = '5px';
                  div.style.borderColor = 'mediumaquamarine';
                  div.style.borderWidth = '0px';
                  // Add a new track checkbox
                  var chkbox = document.createElement('input');
                  chkbox.id = 'chk'+i;
                  chkbox.type = 'checkbox';
                  chkbox.setAttribute('onchange','chkRefresh();');
                  chkbox.checked = level.noteGroups[i].isVisible;
                  div.appendChild(chkbox);
                  var rad = document.createElement('input');
                  rad.id = 'rad'+i;
                  rad.name = 'trkrad';
                  rad.type = 'radio';
                  rad.value = i;
                  rad.style = 'display:none';
                  //rad.setAttribute('onclick','selectTrack(this.value);');
                  var labl = document.createElement('label');
                  if(midi.trks[i].notes.length == 0){ // Patch this in without breaking anything
                        chkbox.style.display = 'none';
                        labl.style.display = 'none';
                  }
                  labl.appendChild(rad);
                  labl.innerHTML += midi.trks[i].label;
                  labl.setAttribute('for',rad.id);
                  labl.style.position = 'relative';
                  labl.style.bottom = '3px';
                  labl.id = 'trklabl'+i;
                  labl.setAttribute('class','tracklabel');
                  div.appendChild(labl);

                  document.getElementById('trkcontainer').appendChild(div);
                  /*if(midi.hasNotes[i]){
                        document.getElementById('trkcontainer').appendChild(document.createElement('br'));
                  }*/

                  // Add a new track option
                  if(midi.trks[i].label.charAt(0)!='['){
                        var opt = document.createElement('option');
                        opt.value = i;
                        opt.innerHTML = midi.trks[i].label;
                        //document.getElementById('trkselect').appendChild(opt);
                  }
            }
      }
      if(reccTempo){
            refreshTempos(blocksPerBeat);
            bpm = recommendTempo(songBPM,blocksPerBeat,true);
            haveTempo = true;
      }
      //console.log(blocksPerBeat+' bpqn chosen');
      if(!haveTempo && reccTempo){ // Use default tempo if none was found
            refreshTempos(blocksPerBeat);
            bpm = recommendTempo(songBPM,blocksPerBeat,true);
            if(!limitedUpdate){recommendBPB();} // TODO: Probably unintentional behavior now
      }
      haveTempo = true;
      if(!limitedUpdate){selectTrack(-1);}
      if(isNewFile){
            calculateNoteRange();
            defaultZoom = adjustZoom();
      }
      if(fileLoaded && !isNewFile){
            chkRefresh();
      }
      else{
            softRefresh();
      }
      //console.log('Completed in '+((new Date).getTime()-t0)+' ms');
}

/** 
 * Draws the background of the main canvas.
 */
function drawBG(){
      setBG('#00B2EE');
      drawGrid(16);
      var i;
      for(i=0;i<levelWidth;i++){
            drawTile(tiles[0],i*16,canvas.height-16,0);
      }
      decorateBG();
}

function drawLevel(redrawMini,noDOM){
      if(tiles==undefined){return;}
      if(redrawMini==undefined){redrawMini=false;}
      if(noDOM==undefined){noDOM=false;}
      if(fileLoaded && redrawMini){miniClear(0);}
      if(isNewFile || !fileLoaded){drawBG();}
      entityCount = 0;
      powerupCount = 0;
      conflictCount = 0;
      var j;
      if(fileLoaded && !noDOM){ // Update offscreen note count (and octave shift button)
            // Enable button if recommended octave shift and actual octave shift don't match
            document.getElementById('shiftbutton').disabled = (octaveShifts[selectedTrack] == getViewOctaveShift(selectedTrack));
            hasVisibleNotes = new Array(midi.trks.length).fill(false);
            for(i=0;i<midi.trks.length;i++){
                  notesAboveScreen[i] = 0;
                  notesBelowScreen[i] = 0;
                  for(j=0;j<midi.trks[i].notes.length;j++){
                        var note = midi.trks[i].notes[j];
                        x = Math.round(ticksToBlocks(note.time));
                        if(note.channel!=9){y = note.pitch + 1 + level.noteGroups[i].ofsY;}
                        else{y = 54;}
                        if(y <= ofsY){notesBelowScreen[i]++;}
                        else if(y > ofsY+26){notesAboveScreen[i]++;} // Omit the notes on the very top row for now
                        else if(x >= ofsX && x < ofsX+levelWidth){ // Check if notes are visible
                              hasVisibleNotes[i] = true;
                        }
                  }
                  //if(!isNewFile){
                        if(hasVisibleNotes[i]){
                              if(i == selectedTrack){document.getElementById('trklabl'+i).style.color = 'black';}
                              else{document.getElementById('trklabl'+i).style.color = 'white';}
                              
                        }
                        else{
                              if(i == selectedTrack){document.getElementById('trklabl'+i).style.color = 'gray';}
                              else{document.getElementById('trklabl'+i).style.color = 'lightgray';}
                        }
                  //}
            }
      }
      var x;
      var y;
      if(redrawMini){
            clearDisplayLayer(dlayer.overlayLayer);
            clearDisplayLayer(dlayer.noteLayer);
      }
      else{
            //if(fileLoaded){miniClear(0);}
      }
      if(!isNewFile && fileLoaded){
            clearDisplayLayer(dlayer.outlineLayer);
            if(outlineLayers.length != midi.trks.length){
                  outlineLayers = new Array(midi.trks.length);
                  for(var i=0;i<midi.trks.length;i++){
                        outlineLayers[i] = new DrawLayer(canvas.width, canvas.height); 
                  }
            }
            else{
                  for(i=0;i<midi.trks.length;i++){
                        if(outlineLayers[i] == undefined){
                              outlineLayers[i] = new DrawLayer(canvas.width, canvas.height);
                              continue;
                        }
                        if(outlineLayers[i].width != canvas.width || outlineLayers[i].height != canvas.height){
                              outlineLayers[i] = new DrawLayer(canvas.width, canvas.height);
                        }
                        else{
                              outlineLayers[i].clear();
                        }
                  }
            }
      }
      powerupCount = 0;
      entityCount = 0;
      for(i=marginWidth;i<levelWidth;i++){
            for(j=0;j<27;j++){
                  x = ofsX + i - marginWidth;
                  y = ofsY + j;
                  var tile = level.checkTile(i,j); // Tile on the main screen
                  var drawY = 27-j-1;
                  if(tile != null && isVisible(x,y,ofsX,ofsY)){
                        drawTile(tiles[tile],i*16,(drawY*16));
                        if(level.numberOfOccupants[i][j] > 1){ // Highlight any overalapping tiles in red
                              conflictCount++;
                              highlightTile(i,drawY,{style: 'rgba(255,0,0,0.4)'});
                        }
                        if(tile == 1 && level.isTrackOccupant[i][j][selectedTrack]){ // Outline note blocks of the selected track
                              outlineTile(i,drawY,2,'rgb(102,205,170)');
                        }
                  }
            }
            if(i>ofsX+levelWidth){break;}
      }
      if(redrawMini){redrawMinimap();}
      if(level.limitLine != null){drawLimitLine(level.limitLine);}
      if(!noDOM){
            document.getElementById('ELtext').innerHTML = "Entities in Area: "+level.entityCount;
            document.getElementById('PLtext').innerHTML = "Powerups in Area: "+level.powerupCount;

            // console.log(quantizeErrorAggregate / midi.noteCount / blocksPerBeat);
            var qeScore = quantizeErrorAggregate / midi.noteCount / blocksPerBeat;
            if(qeScore == 0){
                  document.getElementById('QEtext').innerHTML = "BPB Quality: Perfect";
                  document.getElementById('QEtext').style.color = 'lime';
            }
            else if(qeScore > 20){
                  document.getElementById('QEtext').innerHTML = "BPB Quality: Bad";
                  document.getElementById('QEtext').style.color = 'red';
            }
            else if(qeScore > 5){
                  document.getElementById('QEtext').innerHTML = "BPB Quality: Okay";
                  document.getElementById('QEtext').style.color = 'orange';
            }
            else if(qeScore > 1){
                  document.getElementById('QEtext').innerHTML = "BPB Quality: Good";
                  document.getElementById('QEtext').style.color = 'limegreen';
            }
            else{
                  document.getElementById('QEtext').innerHTML = "BPB Quality: Great";
                  document.getElementById('QEtext').style.color = 'limegreen';
            }
            //console.log('qeScore = '+qeScore);
            document.getElementById('NCtext').innerHTML = "Spatial Conficts: " + conflictCount;
            if(conflictCount > 20){document.getElementById('NCtext').style.color = 'orange';}
            else if(conflictCount > 0){document.getElementById('NCtext').style.color = 'limegreen';}
            else{document.getElementById('NCtext').style.color = 'lime';}

            if(level.entityCount>100){document.getElementById('ELtext').style.color = 'red';}
            else{document.getElementById('ELtext').style.color = '';}

            if(level.powerupCount>100){document.getElementById('PLtext').style.color = 'red';}
            else{document.getElementById('PLtext').style.color = '';}
            updateOutOfBoundsNoteCounts();
      }
      if(fileLoaded){
            miniClear(1);
            drawScrubber(ofsX,ofsY+27,canvas.width/16-27,canvas.height/16);
      }
      if(fileLoaded){canvasLayers[dlayer.outlineLayer].ctx.drawImage(outlineLayers[selectedTrack].canvas,0,0,canvas.width,canvas.height);}
      if(!noDOM && fileLoaded && (entityOverflowStatus.entity != (level.entityCount > 100)) || (entityOverflowStatus.powerup != (level.powerupCount > 100))){
            updateInstrumentContainer();
      }
      entityOverflowStatus = {entity: level.entityCount > 100, powerup: level.powerupCount > 100};
      refreshCanvas();
      if(fileLoaded){refreshMini();}
}

/** 
 * Moves the file viewer to the specified area in the level.
 * @param {number} ox The x-offset as a percentage.
 * @param {number} oy The y-offset as a percentage.
 */

function moveOffsetTo(ox,oy){ // Offsets are given as percentages of the level
      if(!fileLoaded){return;}
      cancelPlayback();
      if(ox!=null){
            ofsX = Math.floor(ox*mapWidth);
            //console.log(ox+' -> '+ofsX);
      }
      var limX = (minimap.width-(canvas.width/16-27))+(blocksPerBeat*bbar);
      if(ofsX>limX){ofsX = limX;}
      if(ofsX<0){ofsX=0;}
      ofsX = Math.floor(ofsX/(blocksPerBeat*bbar))*blocksPerBeat*bbar; // Quantize to the nearest measure
      if(oy!=null){ofsY = oy*127;}
      clearDisplayLayer(dlayer.noteLayer);
      clearDisplayLayer(dlayer.overlayLayer);
      clearDisplayLayer(dlayer.outlineLayer);
      refreshBlocks();
      softRefresh(false,false);
}

/**
 * Reads the value in the vertical offset number picker and moves the offset to that value.
 */
function nudgeY(){
      enableMouse();
      cancelPlayback();
      var relativeOfs = parseInt(document.getElementById('yofspicker').value)*-1;
      //console.log(relativeOfs+48);
      moveOffsetTo(null,(relativeOfs+baseOfsY)/127);
}

/**
 * Sets the global x and y offsets to their default values.
 */
function resetOffsets(){
      ofsX = 0;
      ofsY = baseOfsY;
      document.getElementById('yofspicker').value = 0;
}

/**
 * Recommends a tempo based on the song's BPM and the number of blocks per beat.
 * @param {number} songBPM The tempo of the song, in beats per minute.
 * @param {number} bpb The number of blocks per beat.
 */
function recommendTempo(songBPM, bpb){
      var closestDist = 10000;
      var recc = -1;
      for(i=0;i<MM2Tempos.length;i++){
            var dist = Math.abs((MM2Tempos[i].bpm*(4/bpb))-songBPM);
            //console.log((bpms[i]*(4/bpqn))+' is dist of '+dist);
            if(dist<closestDist){
                  closestDist = dist;
                  recc = i;
            }
      }
      //console.log(bpmIDtoStr(recc));
      //console.log(songBPM+' -> '+bpms[recc]*(4/res));
      document.getElementById('temposelect').selectedIndex = numCommonTempos+recc;
      return MM2Tempos[recc].bpm*(4/bpb);
}

/**
 * Reads the state of the track visibility checkboxes and updates the level accordingly.
 */
function chkRefresh(){
      var i;
      for(i=0;i<midi.trks.length;i++){
            level.noteGroups[i].setVisibility(document.getElementById('chk'+i).checked);
      }
      enableMouse();
      cancelPlayback();
      calculateNoteRange();
      adjustZoom();
      softRefresh();
}

/**
 * Determines the equivalent Mario Maker 2 tile ID for a given MIDI instrument.
 * @param {number} midiInstrument The zero-indexed ID of the MIDI instrument.
 */
function getMM2Instrument(midiInstrument){
      midiInstrument++;
      // 1. Specific MIDI Instruments
      // TODO: Add these in

      // 2. General Category Instruments
      if(midiInstrument<=8){return 2;} // Piano
      if(midiInstrument>=9 && midiInstrument<=16){return 3;} // Chromatic Percussion
      if(midiInstrument>=17 && midiInstrument<=24){return 4;} // Organ
      if(midiInstrument>=25 && midiInstrument<=32){return 5;} // Guitar
      if(midiInstrument>=33 && midiInstrument<=40){return 6;} // Bass
      if(midiInstrument>=41 && midiInstrument<=48){return 7;} // Strings
      if(midiInstrument>=49 && midiInstrument<=56){return 8;} // Ensemble
      if(midiInstrument>=57 && midiInstrument<=72){return 9;} // Brass, Lead
      if(midiInstrument>=73 && midiInstrument<=80){return 10;} // Pipe
      if(midiInstrument>=81 && midiInstrument<=88){return 11;} // Synth Lead
      if(midiInstrument>=89 && midiInstrument<=96){return 12;} // Synth Pad
      if(midiInstrument>=97 && midiInstrument<=104){return 13;} // Synth Effects
      if(midiInstrument>=105 && midiInstrument<=112){return 14;} // Ethnic
      if(midiInstrument>=113 && midiInstrument<=120){return 15;} // Percussive
      if(midiInstrument>=121 && midiInstrument<=127){return 16;} // Sound Effects

      else return midiInstrument - 127 + 16; // For new instruments
}

/**
 * Determines the equivalent zero-indexed MIDI instrument ID for a given Mario Maker 2 tile ID.
 * @param {number} mm2Instrument The tile ID of the entity to convert to a MIDI instrument.
 * @returns {number} The MIDI instrument ID.
 */
function getMidiInstrument(mm2Instrument){
      switch(mm2Instrument){
            case 2: return 0;
            case 3: return 9;
            case 4: return 17;
            case 5: return 25;
            case 6: return 33;
            case 7: return 41;
            case 8: return 49;
            case 9: return 57;
            case 10: return 73;
            case 11: return 81;
            case 12: return 89;
            case 13: return 97;
            case 14: return 105;
            case 15: return 113;
            case 16: return 121;
            default: return mm2Instrument + 127 - 17;
            //case 17: return 128;
            //default: return mm2Instrument + 127 - 16;
      }
}

/**
 * Handles when the main canvas is clicked, and toggle the ruler.
 * @param {MouseEvent} e The mouse event.
 */
function handleClick(e){
      if(noMouse){return;} // Exit if the mouse is disabled
      if(clickedTile!=null){
            // If the ruler is on...
            clickedTile = null; // Turn off the ruler
            clearDisplayLayer(dlayer.mouseLayer);
            refreshCanvas();
            return;
      }
      // Else, if the ruler is off...
      var canvasOfs = getOffset(e);
      var div = document.getElementById('displaycontainer');
      var scrollOfs = {x: div.scrollLeft, y: div.scrollTop};
      var offset = {x: canvasOfs.x + scrollOfs.x, y: canvasOfs.y + scrollOfs.y};
      var tilePos = {x: Math.floor(offset.x/16), y:27-Math.floor(offset.y/16)};
      var levelPos = {x:tilePos.x + ofsX - 27, y:tilePos.y + ofsY};
      clickedTile = levelPos; // Turn on the ruler
}

/**
 * Handles when the mouse is moved across the main canvas.
 * @param {MouseEvent} e The mouse event.
 */
function handleMove(e){
      if(noMouse){return;} // Exit if the mouse is disabled
      var canvasOfs = getOffset(e);
      var div = document.getElementById('displaycontainer');
      var scrollOfs = {x: div.scrollLeft, y: div.scrollTop};
      var offset = {x: canvasOfs.x + scrollOfs.x, y: canvasOfs.y + scrollOfs.y};
      var tilePos = {x: Math.floor(offset.x/16), y:27-Math.floor(offset.y/16)};
      var realTpos= tilePos;
      var levelPos = {x:tilePos.x + ofsX - 27, y:tilePos.y + ofsY};
      var refresh = false;

      if(currentHighlight.x!=tilePos.x || currentHighlight.y!=tilePos.y){
            // Draw the cursor
            clearDisplayLayer(dlayer.mouseLayer);
            highlightTile(tilePos.x,27-tilePos.y,{style:'rgba(0,0,0,0.1)', layer: dlayer.mouseLayer}); // Lightly highlight the tile the cursor is on
            drawTile(cursor,(tilePos.x-1)*16,(27-(tilePos.y+1))*16,dlayer.mouseLayer); // Draw the cursor icon
            refreshCanvas();
            currentHighlight = {x: tilePos.x, y: tilePos.y};
            refresh = true;
      }

      if(clickedTile==null){return;}

      if(refresh){ // If the highlighted tile position has changed, redraw the ruler

            var i = levelPos.x;
            var j = levelPos.y;
            levelPos = clickedTile;
            tilePos = {x: levelPos.x - ofsX + 27, y: levelPos.y - ofsY};

            var dirStr = {h: '', v: ''}; // The string to display next to the ruler
            var k;
            if(i-levelPos.x > 0){
                  dirStr.h = 'Right';
                  for(k=0;k<i-levelPos.x;k++){
                        highlightTile(tilePos.x+k+1,27-tilePos.y,{layer: dlayer.mouseLayer});
                  }
            }
            else if(i-levelPos.x < 0){
                  dirStr.h = 'Left';
                  for(k=0;k<(i-levelPos.x)*-1;k++){
                        highlightTile(tilePos.x-k-1,27-tilePos.y,{layer: dlayer.mouseLayer});
                  }                        
            }
            
            if(j-levelPos.y > 0){
                  dirStr.v = 'Up';
                  for(k=0;k<j-levelPos.y;k++){
                        highlightTile((tilePos.x+(i-levelPos.x)),27-(j-ofsY-k),{style: 'rgba(0,191,0,0.5)', layer: dlayer.mouseLayer});
                  }
            }
            else if(j-levelPos.y < 0){
                  dirStr.v = 'Down';
                  for(k=0;k<(j-levelPos.y)*-1;k++){
                        highlightTile((tilePos.x+(i-levelPos.x)),27-(j-ofsY+k),{style: 'rgba(0,191,0,0.5)', layer: dlayer.mouseLayer});
                  }
            }
            if(dirStr.h!=''&&dirStr.v!=''){
                  drawLabel(realTpos.x*16-24,(27-realTpos.y)*16-8,dirStr.h+' '+Math.abs(i-levelPos.x)+', '+dirStr.v+' '+Math.abs(j-levelPos.y));
            }
            else if(dirStr.h==''&&dirStr.v!=''){
                  drawLabel(realTpos.x*16-24,(27-realTpos.y)*16-8,dirStr.v+' '+Math.abs(j-levelPos.y));
            }
            else{
                  drawLabel(realTpos.x*16-24,(27-realTpos.y)*16-8,dirStr.h+' '+Math.abs(i-levelPos.x));
            }
      }
      refreshCanvas();
}

/**
 * Reads the blocks per beat number picker, and snaps to the closest value if an invalid input is given.
 */
function pickBPB(){
      var val = document.getElementById('bpbpicker').value;
      val = Math.floor(val);
      if(val == 69){
            alert('stop');
      }
      if(val < 1){val = 1;}
      if(val > 8){val = 8;}
      blocksPerBeat = val;
      if(!usingAdvSettings){filterBPB();}
      document.getElementById('bpbpicker').value = blocksPerBeat;
      lastBPB = blocksPerBeat;
      mapWidth = Math.ceil(ticksToBlocks(midi.duration));
      changeBPB();
}

/**
 * Sets the blocks per beat value to the recommended one.
 */
function changeToRecommendedBPB(){
      blocksPerBeat = recmdBlocksPerBeat;
      document.getElementById('bpbpicker').value = blocksPerBeat;
      changeBPB();
}

/**
 * Refreshes the level and calculates the new x-offset if the blocks per beat setting is changed.
 */
function changeBPB(){
      if(!fileLoaded){return;}
      quantizeErrorAggregate = 0;
      for(var i=0;i<midi.trks.length;i++){
            if(!level.noteGroups[i] || level.noteGroups[i].isVisible){quantizeErrorAggregate += midi.trks[i].quantizeErrors[blocksPerBeat-1];}
      }
      if(!isNewFile){
            cancelPlayback();
            var ratio = (ofsX*minimapZoomX)/minimap.width;
            moveOffsetTo(ratio,null);
            miniClear(1);
            drawScrubber(ofsX,ofsY+27,canvas.width/16-27,canvas.height/16);
            hardRefresh(true, true);
      }
}

/**
 * Triggers level playback.
 */
function playBtn(){
      if(fileLoaded){
            disableMouse();
            document.getElementById('playbtn').disabled = true;
            if(contPlayback) playMap(midi,level,bpm,blocksPerBeat,ofsX,ofsY);
            else playLvl(midi,level,bpm,blocksPerBeat,ofsX,ofsY);
      }
}

/**
 * Stops level playback.
 */
function cancelPlayback(){
      if(!isPlaying) return;
      isAnimating = false;
      resetPlayback();
      stopAudio();
}

/**
 * Recommends a blocks per beat value based on the quantization errors of each track.
 */
function recommendBPB(){
      var lowestQuantizeError = Infinity;
      var bestBPB = 0;
      for(var i=0;i<8;i++){ // Iterate to 8 for now, maybe double for when semisolid technique becomes a thing
            var total = 0;
            for(var j=0;j<midi.trks.length;j++){
                  if(!level.noteGroups[j] || level.noteGroups[j].isVisible){total += midi.trks[j].quantizeErrors[i];}
            }
            if(total<lowestQuantizeError){
                  lowestQuantizeError = total;
                  bestBPB = i+1;
            }
      }
      var recmd = bestBPB;
      changeBPB();
      return recmd;
}

/**
 * Determines whether or not a given point should be visible in the level based on x and y offsets.
 * @param {number} x The x-coordinate of the query point.
 * @param {number} y The y-coordinate of the query point.
 * @param {number} ofsX The x-offset of the viewing window.
 * @param {number} ofsY The y-offset of the viewing window.
 * @returns {boolean} If the point is visible.
 */
function isVisible(x, y, ofsX, ofsY){
      return (x >= ofsX && x < ofsX+levelWidth-27 && y >= ofsY && y < ofsY+27);
}

/**
 * Enables mouse controls on the main canvas.
 */
function enableMouse(){
      noMouse = false;
}

/**
 * Disables mouse controls on the main canvas.
 */
function disableMouse(){
      noMouse = true;
}

/**
 * Handles when the mouse leaves the main canvas.
 */
function handleOut(){
      if(noMouse){return;}
      clearDisplayLayer(dlayer.mouseLayer);
      refreshCanvas();
}

/**
 * Displays the main tools.
 */
function showEverything(){
      document.getElementById('toolbox').style = '';
      document.getElementById('playbtn').disabled = !hasLoadedBuffers;
      document.getElementById('stopbtn').disabled = !hasLoadedBuffers;
}

/**
 * Refreshes the options in the tempo dropdown menu.
 */
function refreshTempos(){
      var i;
      var commonGroup = document.getElementById('comtempos');
      var allGroup = document.getElementById('alltempos');
      commonGroup.innerHTML = '';
      allGroup.innerHTML = '';
      if(isNewFile){numCommonTempos = 0;}
      for(i=0;i<MM2Tempos.length;i++){
            var opt = document.createElement('option');
            opt.value = i;
            opt.innerHTML = MM2Tempos[i].name+' ('+Math.round(MM2Tempos[i].bpm*(4/blocksPerBeat))+' bpm)';
            allGroup.appendChild(opt);
            if(MM2Tempos[i].isCommon){
                  if(isNewFile){numCommonTempos++;}
                  var opt2 = document.createElement('option');
                  opt2.value = i;
                  opt2.innerHTML = MM2Tempos[i].name+' ('+Math.round(MM2Tempos[i].bpm*(4/blocksPerBeat))+' bpm)';
                  commonGroup.appendChild(opt2);
            }
      }
}

/**
 * Reads the value of the tempo dropdown and updates the tempo accordingly.
 */
function selectTempo(){
      var sel = document.getElementById('temposelect');
      var selected = sel.value;
      bpm = MM2Tempos[selected].bpm*(4/blocksPerBeat);
      cancelPlayback();
}

/**
 * Refreshes the state of the level without updating the entire UI.
 */
function softRefresh(noDOM, redrawMini){ // Refresh changes to track layers
      if(noDOM == undefined){noDOM = false;}
      if(redrawMini == undefined){redrawMini = true;}
      level.refresh();
      drawLevel(redrawMini,noDOM);
}

/**
 * Refreshes the state of the level and UI.
 */
function hardRefresh(reccTempo, limitUpdate){ // Refresh changes to the entire MIDI
      if(limitUpdate == undefined){limitUpdate = true;}
      updateUI(limitUpdate, reccTempo);
      softRefresh(false,true);
}

/**
 * Reads the value of the noise slider and refreshes the level.
 */
function changeNoiseThreshold(){
      noiseThreshold = document.getElementById('noiseslider').value;
      refreshBlocks();
      hardRefresh(false);
}

/**
 * Reads the values of the octave and semitone shift inputs and shifts the selected track accordingly.
 */
function shiftTrackOctave(){
      cancelPlayback();
      octaveShifts[selectedTrack] = parseInt(document.getElementById('octaveshift').value);
      semitoneShifts[selectedTrack] = parseInt(document.getElementById('semitoneshift').value);
      level.noteGroups[selectedTrack].ofsY = octaveShifts[selectedTrack]*12 + semitoneShifts[selectedTrack];
      calculateNoteRange();
      adjustZoom();
      softRefresh();
      updateInstrumentContainer();
}

/**
 * Changes the currently selected track, refreshing the track selector.
 * @param {number} trkID The ID of the track to select.
 */
function selectTrack(trkID){
      if(isPlaying && isContinuousPlayback) cancelPlayback();
      var initSelect = (trkID == -1);
      if(trkID == -1){
            var i;
            for(i=0;i<midi.trks.length;i++){ // Find the first visible checkbox to select 
                  trkID = i;
                  if(document.getElementById('chk'+i).style.display != 'none'){break;}
            }
      }
      if(document.getElementById('chk'+trkID).checked != level.noteGroups[trkID].isVisible && !initSelect){return;} // Check to see if the checkbox is about to update. If yes, return
      selectedTrack = trkID;
      document.getElementById('octaveshift').value = octaveShifts[selectedTrack];
      document.getElementById('semitoneshift').value = semitoneShifts[selectedTrack];
      document.getElementById('shiftbutton').disabled = (octaveShifts[selectedTrack] == getViewOctaveShift(selectedTrack));
      if(midi.trks[selectedTrack].hasPercussion || usingAdvSettings){
            document.getElementById('semishiftdiv').style.display = 'inline';
      }
      else{
            document.getElementById('semishiftdiv').style.display = 'none';
      }
      for(i=0;i<midi.trks.length;i++){
            var trkdiv = document.getElementById('item'+i);
            if(i != trkID){
                  trkdiv.style.backgroundColor = '';
                  trkdiv.style.borderWidth = '0px';
                  if(hasVisibleNotes[i]){document.getElementById('trklabl'+i).style.color = '';}
                  else{document.getElementById('trklabl'+i).style.color = 'lightgray';}
            }
            else{
                  trkdiv.style.backgroundColor = 'mediumaquamarine';
                  trkdiv.style.borderWidth = '2px';
                  if(hasVisibleNotes[i]){document.getElementById('trklabl'+i).style.color = 'black';}
                  else{document.getElementById('trklabl'+i).style.color = 'gray';}
                  
            }
      }
      //if(!isNewFile){refreshOutlines();}
      softRefresh(false);
      updateInstrumentContainer();
}

/**
 * Changes every instance of an original instrument in the specified track into a new instrument.
 * @param {number} trk The ID of the track to replace instruments in.
 * @param {number} ins The Mario Maker 2 tile ID of the orignal instrument to replace. The original instrument is the instrument originally detected in the MIDI file.
 * @param {number} newIns The Mario Maker 2 tile ID of the instrument to replace the detected instruments with.
 */
function changeInstrument(trk, ins, newIns){
      var i;
      for(i=0;i<midi.trks[trk].notes.length;i++){
            if(getMM2Instrument(midi.trks[trk].notes[i].originalInstrument) == ins){midi.trks[trk].notes[i].instrument = getMidiInstrument(newIns);}
      }
      refreshBlocks();
      hardRefresh(false);
}

/**
 * Refreshes the options in the instrument dropdown menu, recommending instruments based on the current instrument's octave and entity counts.
 */
function updateInstrumentContainer(){
      if(midi.trks[selectedTrack].hasPercussion){
            document.getElementById('instrumentcontainer').style.display = 'none';
            return;
      }
      else{
            document.getElementById('instrumentcontainer').style.display = '';
      }
      var container = document.getElementById('instrumentcontainer');
      container.innerHTML = '';
      var targetOctave = -octaveShifts[selectedTrack];
      var i;
      for(i=0;i<midi.trks[selectedTrack].usedInstruments.length;i++){
            var div = document.createElement('div');
            div.id = 'inscontainer'+i;
            div.style = 'width: max-content';
            var picker = document.createElement('select');
            picker.id = 'inspicker'+i;
            picker.setAttribute('onchange','triggerInstrChange('+i+');');
            picker.setAttribute('class','dropdown');
            var isPowerupOverflow = level.entityCount > 100;
            var isEntityOverflow = level.powerupCount > 100;
            var hasOctaveRec = false;
            var hasEntityRec = false;
            var recOctGroup = document.createElement('optgroup');
            recOctGroup.setAttribute('label','Recommended: Complementary Octave');
            var recEntGroup = document.createElement('optgroup');
            if(isEntityOverflow && !isPowerupOverflow){recEntGroup.setAttribute('label','Recommended - General Entities');}
            else if(isPowerupOverflow && !isEntityOverflow){recEntGroup.setAttribute('label','Recommended - Powerups');}
            var allGroup = document.createElement('optgroup');
            allGroup.setAttribute('label','All Instruments');
            numRecommendedInstruments = 0;
            var j;
            for(j=0;j<alphabetizedInstruments.length;j++){
                  var opt = document.createElement('option');
                  opt.value = j;
                  opt.innerHTML = alphabetizedInstruments[j].name + ' (';
                  if(alphabetizedInstruments[j].octave >= 0){
                        opt.innerHTML += '+' + alphabetizedInstruments[j].octave + ' 8va)';
                  } else {
                        opt.innerHTML += '' + alphabetizedInstruments[j].octave + ' 8vb)';
                  }
                  var optClone;
                  if(alphabetizedInstruments[j].octave == targetOctave){
                        optClone = opt.cloneNode(true);
                        recOctGroup.appendChild(optClone);
                        numRecommendedInstruments++;
                        hasOctaveRec = true;
                  }
                  if(isEntityOverflow && !isPowerupOverflow){
                        if(!alphabetizedInstruments[j].isPowerup){
                              optClone = opt.cloneNode(true);
                              recEntGroup.appendChild(optClone);
                              numRecommendedInstruments++;
                              hasEntityRec = true;
                        }
                  }
                  else if(isPowerupOverflow && !isEntityOverflow){
                        if(alphabetizedInstruments[j].isPowerup){
                              optClone = opt.cloneNode(true);
                              recEntGroup.appendChild(optClone);
                              numRecommendedInstruments++;
                              hasEntityRec = true;
                        }
                  }
                  allGroup.appendChild(opt);
            }
            var labl = document.createElement('label');
            labl.id = 'inspickerlabl'+i;
            labl.for = 'inspicker'+i;
            labl.innerHTML = getMidiInstrumentName(midi.trks[selectedTrack].usedInstruments[i])+' ➞ ';
            div.appendChild(labl);
            div.appendChild(picker);
            if(hasOctaveRec){picker.appendChild(recOctGroup);}
            if(hasEntityRec){picker.appendChild(recEntGroup);}
            picker.appendChild(allGroup);
            picker.selectedIndex = getSortedInstrumentIndex(instrumentChanges[selectedTrack][i]) + numRecommendedInstruments;
            container.appendChild(div);
            updateOutOfBoundsNoteCounts();
      }
}

/**
 * Reads the value of the instrument dropdown and changes the instrument accordingly.
 */
function triggerInstrChange(selectedInstrument){
      var selectedInsIndex = alphabetizedInstruments[document.getElementById('inspicker'+selectedInstrument).value].pos;
      changeInstrument(selectedTrack,getMM2Instrument(midi.trks[selectedTrack].usedInstruments[selectedInstrument]),selectedInsIndex+2);
      instrumentChanges[selectedTrack][selectedInstrument] = selectedInsIndex;
}

/**
 * Displays the number of notes above and below the viewing window, colorizing based on the ratio of out-of-bounds notes to total notes in the selected track.
 */
function updateOutOfBoundsNoteCounts(){
      var nasText = document.getElementById('NASText');
      var nbsText = document.getElementById('NBSText');
      var denom = midi.trks[selectedTrack].notes.length;
      var nasPercent = Math.round(notesAboveScreen[selectedTrack]*100/denom);
      nasText.innerHTML = 'Notes above screen: ' + nasPercent +'%';
      if(nasPercent == 0) nasText.style.color = 'lime';
      else if(nasPercent <= 15) nasText.style.color = 'limegreen';
      else if(nasPercent <= 30) nasText.style.color = 'orange';
      else nasText.style.color = 'red';
      var nbsPercent = Math.round(notesBelowScreen[selectedTrack]*100/denom);
      nbsText.innerHTML = 'Notes below screen: ' + nbsPercent +'%';
      if(nbsPercent == 0) nbsText.style.color = 'lime';
      else if(nbsPercent <= 15) nbsText.style.color = 'limegreen';
      else if(nbsPercent <= 30) nbsText.style.color = 'orange';
      else nbsText.style.color = 'red';
}

/**
 * Finds the Mario Maker 2 instrument ID of the instrument corresponding to the input name.
 * @param {string} name The name of the instrument to retrieve the ID of.
 * @returns {number} The instrument ID of the instrument with the name.
 */
function getInstrumentById(name){ // Not the fastest solution, but it's convenient
      for(var i=0;i<MM2Instruments.length;i++){
            if(MM2Instruments[i].id == name){return i;}
      }
}

/**
 * Suggests a Mario Maker 2 instrument recommendation for a percussion key on MIDI Channel 10.
 * @param {number} key The percussion key to recommend an instrument for.
 * @returns {number} The instrument ID of the recommended instrument.
 */
function getPercussionInstrument(key){
      key++;
      switch(key){
            case 35: return getInstrumentById('pow');
            case 36: return getInstrumentById('pow');
            case 37: return getInstrumentById('pow');
            case 40: return getInstrumentById('pswitch');
            case 41: return getInstrumentById('spikeball');
            case 42: return getInstrumentById('pow');
            case 43: return getInstrumentById('spikeball');
            case 44: return getInstrumentById('sidewaysspring');
            case 45: return getInstrumentById('spikeball');
            case 46: return getInstrumentById('sidewaysspring');
            case 47: return getInstrumentById('spikeball');
            case 48: return getInstrumentById('spring');
            case 51: return getInstrumentById('spring');
            case 52: return getInstrumentById('spring');
            case 55: return getInstrumentById('spring');
            case 57: return getInstrumentById('spring');
            case 59: return getInstrumentById('spring');
            case 65: return getInstrumentById('billblaster');
            case 66: return getInstrumentById('billblaster');
            case 76: return getInstrumentById('post');
            case 77: return getInstrumentById('post');
            default: return getInstrumentById('pswitch');
      }
}

/**
 * Splits a track with multiple instruments into multiple tracks - one for each instrument.
 * @param {number} trk The ID of the multiple-instrument track to separate.
 */
function sepInsFromTrk(trk){ // Create new 
      var i;
      var newTrks = new Array(trk.usedInstruments.length);
      for(i=0;i<trk.usedInstruments.length;i++){
            newTrks[i] = new MIDItrack();
            newTrks[i].usedInstruments = [trk.usedInstruments[i]];
      }
      var j;
      var thisHasPercussion;
      var thisLowestNote;
      var thisHighestNote;
      for(i=0;i<trk.notes.length;i++){
            thisHasPercussion = false;
            thisHighestNote = null;
            thisLowestNote = null;
            for(j=0;j<trk.usedInstruments.length;j++){
                  if(trk.notes[i].instrument == trk.usedInstruments[j]){
                        if(trk.notes[i].channel == 9){thisHasPercussion = true;}
                        if(trk.notes[i].pitch < thisLowestNote && !thisHasPercussion || thisLowestNote == null){thisLowestNote = trk.notes[i].pitch;}
                        if(trk.notes[i].pitch > thisHighestNote && !thisHasPercussion){thisHighestNote = trk.notes[i].pitch;}
                        newTrks[j].notes.push(cloneNote(trk.notes[i]));
                        break;
                  }
            }
            newTrks[j].hasPercussion = thisHasPercussion;
            newTrks[j].highestNote = thisHighestNote;
            newTrks[j].lowestNote = thisLowestNote;
      }
      for(i=0;i<newTrks.length;i++){
            var labl;
            if(newTrks[i].hasPercussion){
                  labl = 'Percussion';
            }
            else{
                  labl = getInstrumentLabel(newTrks[i].usedInstruments[0]);
            }
            newTrks[i].label = labl+' '+midi.getLabelNumber(labl);
            addTrack(newTrks[i]);
      }
      disableTrack(trk);
}

/**
 * Adds a new track to the list of current tracks in the level.
 * @param {MIDItrack} track The MIDItrack object of the track to add to the level.
 */
function addTrack(track){
      midi.trks.push(track);
      octaveShifts.push(0);
      semitoneShifts.push(0);
      notesAboveScreen.push(0);
      notesBelowScreen.push(0);
      instrumentChanges.push([getMM2Instrument(track.usedInstruments[0])-2]);
}

/**
 * Removes all of the notes in a track, effectively disabling it and making it invisible.
 * @param {MIDItrack} track The MIDItrack object of the track to disable.
 */
function disableTrack(track){ // This makes the track invisible, but doesn't actually remove it from the array
      track.notes = [];
}

/**
 * Plays a button press animation on the Discord button and opens the Discord invite in a new tab.
 */
function handleDiscordPress(){
      var btn = document.getElementById('discordbutton');
      btn.style.animationFillMode = 'both';
      btn.style.animation = '0.2s discordpress, 1.5s discordglow';
      btn.style.animationIterationCount = '1, infinite';
      btn.style.animationDirection = 'alternate';
      setTimeout(function(){
            btn.style.boxShadow = '#1a5586 0px 0px';
            btn.style.transform = 'translateY(8px)';
      }, 200);
      setTimeout(function(){
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
function scrollDisplayBy(pixels){
      var current = document.getElementById('displaycontainer').scrollLeft;
      document.getElementById('displaycontainer').scrollLeft = current + pixels;
}

/**
 * Changes the position of the main display's scrollbar to an exact amount.
 * @param {number} pixelsOfs The displacement of the scrollbar, in pixels.
 */
function scrollDisplayTo(pixelsOfs){
      document.getElementById('displaycontainer').scrollLeft = pixelsOfs;
}

/**
 * Toggles advanced settings, refreshing the UI accordingly.
 */
function toggleAdvancedMode(){
      usingAdvSettings = document.getElementById('advbox').checked;
      if(midi.trks[selectedTrack].hasPercussion || usingAdvSettings){
            document.getElementById('semishiftdiv').style.display = 'inline';
      }
      else{
            // Reset semitone shifts on tracks where it can only be changed with Advanced Settings
            document.getElementById('semitoneshift').value = 0;
            document.getElementById('semishiftdiv').style.display = 'none';
            var i;
            for(i=0;i<midi.trks.length;i++){
                  if(!midi.trks[i].hasPercussion){
                        semitoneShifts[i] = 0;
                        level.noteGroups[selectedTrack].ofsY = octaveShifts[selectedTrack]*12;
                  }
            }
            softRefresh();
      }
      if(!usingAdvSettings){
            blocksPerBeat = reccBPB;
            document.getElementById('bpbpicker').value = blocksPerBeat;
            lastBPB = blocksPerBeat;
            changeBPB();
      }
}

/**
 * Determines the set of acceptable blocks per beat values based on the recommended one.
 * @returns {number[]} The set of acceptable values.
 */
function generateAcceptableBPBs(){
      if(Math.ceil(Math.log2(reccBPB)) == Math.floor(Math.log2(reccBPB))){ // Check if the number is a power of 2
            return [1,2,4,8];
      }
      else if(reccBPB % 3 == 0 || reccBPB == 5){return [3,5,6];}
      else{return [reccBPB];} // For BPB 7
}

/**
 * Corrects the value of the blocks per beat setting to the acceptable range if it falls outside of the acceptable range.
 */
function filterBPB(){

      // Return the minimum or maxiumum BPB if the current BPB is out of range of recommened BPBs

      if(blocksPerBeat > acceptableBPBs[acceptableBPBs.length - 1]){
            blocksPerBeat = acceptableBPBs[acceptableBPBs.length - 1];
            return;
      }
      if(blocksPerBeat < acceptableBPBs[0]){
            blocksPerBeat = acceptableBPBs[0];
            return;
      }

      // Handle when BPB is between the min and max recommended BPBs

      var i;
      for(i=0;i<acceptableBPBs.length;i++){ // Loop through the acceptable BPBs and check for a match
            if(blocksPerBeat == acceptableBPBs[i]){return;} // If there is, return; no correction needed
      }
      var delta = blocksPerBeat - lastBPB; // +1 or -1; whether the bpb was increased or decreased
      var last = acceptableBPBs[0];
      for(i=0;i<acceptableBPBs.length;i++){ // Loop through the recommended BPBs, stopping when it exceeds the current uncorrected bpb
            if(acceptableBPBs[i] > blocksPerBeat){
                  if(delta < 0){ // Pick the lesser BPB if the BPB was decreased
                        blocksPerBeat = last;
                        return;
                  }
                  else{ // Pick the greater BPB if the BPB was increased
                        blocksPerBeat = acceptableBPBs[i];
                        return;
                  }
            }
            last = acceptableBPBs[i]; // Save the last recommended BPB looped through
      }
}

/**
 * Calculates the octave shift value needed to shift a track into view from the average note pitch of the track.
 * @param {number} trkID The ID of the track to calculate the shift value for.
 * @returns {number} The octave shift value needed to shift the track into view.
 */
function getViewOctaveShift(trkID){
      var sum = 0;
      var i;
      for(i=0;i<midi.trks[trkID].notes.length;i++){
            sum += midi.trks[trkID].notes[i].pitch;
      }
      var avg = sum/midi.trks[trkID].notes.length;
      return Math.round((avg - (60 + (ofsY-baseOfsY)))/12)*-1;
}

/**
 * Shifts the selected track into view of the level.
 */
function shiftTrackIntoView(){
      cancelPlayback();
      var shift = getViewOctaveShift(selectedTrack);
      octaveShifts[selectedTrack] = shift;
      semitoneShifts[selectedTrack] = 0;
      document.getElementById('octaveshift').value = shift;
      level.noteGroups[selectedTrack].ofsY = octaveShifts[selectedTrack]*12 + semitoneShifts[selectedTrack];
      calculateNoteRange();
      adjustZoom();
      softRefresh();
      updateInstrumentContainer();
}

/**
 * Redraws the outline layer of the selected track onto the outline layer.
 */
function refreshOutlines(){
      clearDisplayLayer(dlayer.outlineLayer);
      canvasLayers[dlayer.outlineLayer].ctx.drawImage(outlineLayers[selectedTrack].canvas,0,0,canvas.width,canvas.height);
      refreshCanvas();
}

/**
 * Sorts the instruments array alphabetically.
 * @param {Object[]} arr The instrument array to sort.
 * @return {Object[]} The sorted instrument array.
 */
function alphabetizeInstruments(arr){
      var newArr = new Array(arr.length);
      for(var i=0;i<arr.length;i++){
            newArr[i] = { id: arr[i].id, name: arr[i].name, octave: arr[i].octave, pos: i, isPowerup: arr[i].isPowerup };
      }
      newArr.sort(function(a,b){
            if(a.name > b.name){return 1;}
            else{return -1;}
      });
      return newArr;
}

/**
 * Finds the index of the alphabetized instrument array based on the index in the unalphabetized instrument array.
 * @param {number} unsortedIndex The index to get the sorted index of.
 * @returns {number} The corresponding index of the alphabetized instrument array.
 */
function getSortedInstrumentIndex(unsortedIndex){
      var i;
      for(i=0;i<alphabetizedInstruments.length;i++){
            if(unsortedIndex == alphabetizedInstruments[i].pos){return i;}
      }
}

/**
 * Adjusts the minimap's zoom level based on the detected range of notes in the file.
 * @returns {number} The calculated zoom level.
 */
function adjustZoom(){
      var range = noteRange;
      if(range < 18){range = 18;}
      var lowerBound = 64-range;
      var zoom = -32/(lowerBound-64);
      setMiniZoomY(zoom);
      return zoom;
}

/**
 * Calculates the difference between the highest and lowest visible note in the file.
 */
function calculateNoteRange(){
      noteRange = 0;
      for(var i=0;i<midi.trks.length;i++){
            if(midi.trks[i].lowestNote == null || midi.trks[i].highestNote == null || !level.noteGroups[i].isVisible){continue;}
            var thisRange = Math.max(Math.abs(64-(midi.trks[i].lowestNote+level.noteGroups[i].ofsY)),Math.abs(64-(midi.trks[i].highestNote+level.noteGroups[i].ofsY)));
            if(thisRange > noteRange){noteRange = thisRange;}
      }
}

/**
 * Redraws the points on the minimap where notes are located.
 */
function redrawMinimap(){
      miniClear(0);
      for(var i=0;i<=midi.trks.length;i++){
            var index = i;
            if(i == selectedTrack) continue;
            if(i == midi.trks.length) index = selectedTrack; // Draw the selected track last
            for(var j=0;j<midi.trks[index].notes.length;j++){
                  if(!level.noteGroups[index].isVisible || midi.trks[index].notes.length == 0) continue;
                  var note = midi.trks[index].notes[j];
                  if(note.volume < noiseThreshold) continue;
                  var x = Math.round(ticksToBlocks(note.time));
                  var y = note.pitch + level.noteGroups[index].ofsY;
                  if(index == selectedTrack) miniPlot(x,y,'mediumaquamarine');
                  else miniPlot(x,y);
            }
      }
}

/**
 * Updates the stored values for tile positions in the level.
 */
function refreshBlocks(){
      let highestX = 0;
      for(var i=0;i<midi.trks.length;i++){
            level.clearNoteGroup(i);
            level.noteGroups[i].ofsY = octaveShifts[i]*12 + semitoneShifts[i];
            for(var j=0;j<midi.trks[i].notes.length;j++){
                  var note = midi.trks[i].notes[j];
                  if(note.volume<noiseThreshold){continue;} // Skip notes with volume below noise threshold
                  x = ticksToBlocks(note.time);
                  var levelX = Math.round(x);
                  if(levelX > highestX) highestX = levelX;
                  var instrument = getMM2Instrument(note.instrument);
                  if(note.channel == 9){
                        instrument = getPercussionInstrument(note.key)+2; // Use note.key to avoid the pitch overwrite to 54 here
                        note.instrument = getMidiInstrument(instrument);
                        note.pitch = 54;
                  }
                  if(levelX >= ofsX && levelX < ofsX+levelWidth-27){
                        level.noteGroups[i].add(note.pitch, note.instrument, levelX);
                  }
            }
      }
      level.maxWidth = highestX;
}

/**
 * Changes the level's x-offset and triggers a quick refresh of the level if a new value is set.
 * @param {number} ox The new x-offset.
 */
function setLevelXTo(ox){
      if(!fileLoaded || ofsX == ox){return;}
      ofsX = ox;
      var limX = (minimap.width-(canvas.width/16-27))+(blocksPerBeat*bbar);
      if(ofsX>limX){ofsX = limX;}
      if(ofsX<0){ofsX=0;}
      quickLevelRefresh();
}

/**
 * Refreshes and redraws the level in a barebones but efficient way for use during playback.
 */
function quickLevelRefresh(){ // Redraw the level with only the bare necessities - the notes, and the entities on top of them
      clearDisplayLayer(dlayer.noteLayer);
      for(var i=0;i<midi.trks.length;i++){
            if(!level.noteGroups[i].isVisible) continue;
            for(var j=0;j<midi.trks[i].notes.length;j++){
                  var note = midi.trks[i].notes[j];
                  if(note.volume<noiseThreshold) continue; // Skip notes with volume below noise threshold
                  var levelX = Math.round(ticksToBlocks(note.time));
                  if(levelX > ofsX+levelWidth+marginWidth) break;
                  var instrument = getMM2Instrument(note.instrument);
                  if(note.channel == 9){
                        instrument = getPercussionInstrument(note.key)+2; // Use note.key to avoid the pitch overwrite to 54 here
                        note.instrument = getMidiInstrument(instrument);
                        note.pitch = 54;
                  }
                  var levelY = note.pitch + level.noteGroups[i].ofsY - ofsY + 1;
                  if(levelX >= ofsX && levelX < ofsX+levelWidth-marginWidth && levelY >=0 && levelY <= 27){
                        var drawY = 27-levelY;
                        drawTile(tiles[1],(levelX-ofsX+marginWidth)*16,(drawY*16));
                        drawTile(tiles[instrument],(levelX-ofsX+marginWidth)*16,((drawY-1)*16));
                  }
            }
      }
      miniClear(1);
      drawScrubber(ofsX,ofsY+27,canvas.width/16-27,canvas.height/16);
      refreshMini();
      refreshCanvas();
}

/**
 * Obtains the fractional component of a number, which will always be less than 1.
 * @param {number} n A number.
 * @returns {number} The fractional part of the number.
 */
function getFraction(n){
      return n - Math.floor(n);
}

/**
 * Converts MIDI time ticks to a quantity in blocks.
 * @param {number} ticks The number of ticks.
 * @returns {number} The number of blocks represented.
 */
function ticksToBlocks(ticks){
      return (ticks/midi.timing) * blocksPerBeat;
}

/**
 * Converts a distance in blocks in fast autoscroll to the equivalent distance in all of the other tempos.
 * Then, lists the scroll speeds whose values are closest to being doable.
 * Underwater scroll speeds are omitted from this search.
 * This function is only used for research and discovery purposes.
 * @param {number} blocks The distance in blocks for fast autoscroll.
 */
function getEquivalentBlocks(blocks){ // This function is only for research purposes and doesn't do anything meaningful otherwise.
      MM2Tempos.forEach((n) => {
            let val = (n.bpm/112)*blocks;
            if( getFraction(val/0.5) < 0.2 && n.name.search('water') == -1 && n.name.search('wim') == -1){
                  console.log(n.name + ': ' + val);
            }
      });
}

/**
 * Hides a MIDI track in the UI, but allows the user to still view it if desired.
 * @param {number} id The ID of the track to hide.
 */
function hideTrk(id){
      level.noteGroups[id].setVisibility(false);
      document.getElementById('chk'+id).checked = false;
      //chkRefresh();
}

/**
 * Opens a link to a tutorial.
 */
function tutorialBtn(){
      window.open(tutorialLink);
}

/**
 * Sets the text and function in the playback controls depending on if audio is being rendered.
 * @param {boolean} status Whether the user is waiting for audio to be rendered.
 */
function setPlaybackWaitStatus(status){
      if(status){
            document.getElementById('playbtn').innerHTML = ". . .";
            document.getElementById('stopbtn').innerHTML = ". . .";
            document.getElementById('stopbtn').disabled = true;
      }
      else{
            document.getElementById('playbtn').innerHTML = "Play";
            document.getElementById('stopbtn').innerHTML = "Stop";
            document.getElementById('stopbtn').disabled = false;
      }
}