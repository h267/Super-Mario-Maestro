// Super Mario Maestro v1.3.0.1
// made by h267

// FIXME: Mixed track with percussion is read as all percussion

/* TODO: New features:

1.3.0.1:
- Dynamic zoom toggle

1.3.1 (By Feb 14th):
- Dynamic zoom toggle
- Get rid of level grid system for speed
- Pre-rendered audio
- Full level playback
- Example MIDI
- Animation during playback
- Better percussion splitting
- A tutorial

1.4:
 - Animated entities with physics simulation
 - Partition system where different settings can apply
 - Toolbar for display tools
 - Manual note editing
 - CSS loading animation
 - Spatial Management, com_poser tricks, maybe autoscroll tracks
 - Warning system
 - Theme, style, day/night indicators
 - Highlight enemies that don't have much room, maybe overlay exclamation point [New UI]
 - A small info button that shows how to use everything and shows patch notes [New UI]
 - Handle dynamic tempo changes [New UI]
 - x-offset number input or other way to nudge x-offset [New UI]
 - Start music playback from anywhere in the blueprint
*/

var reader = new FileReader;
var numCommonTempos = 0;
var midi;
// blocks per beat: 4
var tempos = [
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
      {name: 'Running', bpm: 169, isCommon: true},
      {name: 'Underwater Blaster in Cloud - Swimming Holding Item', bpm: 186, isCommon: false},
      {name: 'Fast Conveyor - Walking', bpm: 194, isCommon: false},
      {name: 'Normal Conveyor - Running', bpm: 227, isCommon: false},
      {name: 'Blaster in Cloud - Running', bpm: 256, isCommon: false},
      {name: 'Fast Conveyor - Running', bpm: 279, isCommon: false}
];

var instruments = [
      {id: 'goomba', name: 'Goomba (Grand Piano)', octave: 1, isPowerup: false},
      {id: 'buzzybeetle', name: 'Shellmet (Detuned Bell)', octave: 1, isPowerup: false},
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
      {id: 'bigmushroom', name: 'Big Mushroom (Shamisen)', octave: 0, isPowerup: false},
      {id: 'billblaster', name: 'Bill Blaster (Timpani)', octave: 0, isPowerup: false},
      {id: 'shoegoomba', name: 'Shoe Goomba (Low Accordion)', octave: -1, isPowerup: false},
      {id: 'stilettogoomba', name: 'Stiletto Goomba (Accordion)', octave: 0, isPowerup: false},
      {id: 'cannon', name: 'Cannon (Timbales)', octave: 0, isPowerup: false},
      {id: 'chainchomp', name: 'Unchained Chomp (Synth Piano)', octave: 0, isPowerup: false},
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
      {id: 'superball', name: 'Superball Flower (Organ)', octave: 1, isPowerup: false},
      {id: 'thwomp', name: 'Thwomp (Ethnic Drum)', octave: 0, isPowerup: false},
      {id: 'wiggler', name: 'Wiggler (Tubular Bells)', octave: 1, isPowerup: false},
      {id: 'spike', name: 'Spike (Acoustic Bass Guitar)', octave: -2, isPowerup: false},
      {id: 'spikeball', name: 'Spike Ball (Bass Drum)', octave: 0, isPowerup: false},
      {id: 'snowball', name: 'Snowball (Tom-Tom Drum)', octave: 0, isPowerup: false},
      {id: 'pokey', name: 'Pokey (Acoustic Guitar)', octave: 0, isPowerup: false},
      {id: 'snowpokey', name: 'Snow Pokey (Kazoo)', octave: 1, isPowerup: false},
      {id: 'sword', name: 'Master Sword (Synth Horn)', octave: 0, isPowerup: false},/*
      {id: 'toad', name: 'Toad (Suffering)', octave: 0, isPowerup: false},*/ // If you uncomment this, only pain and suffering awaits
];
var alphabetizedInstruments = alphabetizeInstruments(instruments);
var tiles;
var bgs;
var speed = 10;
var level = new Level();
var ofsX = 0;
var ofsY = 48;
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
var limitLine = null;
var entityCount = 0;
var powerupCount = 0;
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
var advancedSettings = false;
var semitoneShifts = [];
var acceptableBPBs = null;
var reccBPB;
var lastBPB;
var outlineLayers;
var numRecommendedInstruments = 0;
var entityOverflowStatus = {entity: false, powerup: false};
var noteRange = 0;
var defaultZoom = 1;

// Load graphics and draw the initial state of the level
document.getElementById('canvas').addEventListener ('mouseout', handleOut, false);
getImg('icon/ruler.png').then(function(cursorImg){
      cursor = cursorImg;
      loadTiles().then(function(){
            loadBGs().then(function(){
                  drawLevel(false,true);
            });
      });
});

function loadTiles(){
      return new Promise(function(resolve,reject){
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
                  getImg('tiles/toad.png')
                  ]
            ).then(function(loaded){
                  //console.log('All tiles loaded');
                  tiles = loaded;
                  resolve();
            });
      });
}

function loadFile(){ // Load file from the file input element
      var fname = document.getElementById('fileinput').files[0].name;
      if(fname.substring(fname.length-8,fname.length).toLowerCase()=='.mp3.mid'){ // Detect MP3 MIDIs
            document.getElementById('noisecontrol').style.display = '';
      }
      else{
            document.getElementById('noisecontrol').style.display = 'none';
      }
      reader.readAsArrayBuffer(document.getElementById('fileinput').files[0]);
	reader.onload = function(){
            if(fileLoaded){
                  enableMouse();
                  stopAudio();
            }
            if(!fileLoaded){showEverything();}
            midi = new MIDIfile(new Uint8Array(reader.result));
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
                  instrumentChanges[i] = new Array();
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
            for(i=0;i<midi.trks.length;i++){
                  if(midi.trks[i].usedInstruments.length > 1){
                        sepInsFromTrk(midi.trks[i]);
                  }
                  if(midi.trks[i].usedInstruments.length == 0 || midi.trks[i].hasPercussion){continue;}
                  octaveShifts[i] = instruments[getMM2Instrument(midi.trks[i].usedInstruments[0])-2].octave*-1;
                  if(midi.trks[i].highestNote == null || midi.trks[i].highestNote == null){continue;}
                  var thisRange = Math.max(Math.abs(64-midi.trks[i].lowestNote),Math.abs(64-midi.trks[i].highestNote));
                  if(thisRange > noteRange){noteRange = thisRange;}
            }
            //console.log(noteRange);
            placeNoteBlocks(false, true);
            isNewFile = false;
            document.getElementById('yofspicker').disabled = false;
            document.getElementById('bpbpicker').disabled = false;
            document.getElementById('tempotext').innerHTML = 'Original: '+Math.round(songBPM)+' bpm';
            /*var newTrack = new MIDItrack();
            newTrack.label = 'test'
            newTrack.notes[0] = new Note(0,0,1,0,0);
            addTrack(newTrack);*/
            //console.log(midi.noteCount+' notes total');
      }
}

function placeNoteBlocks(limitedUpdate, reccTempo){
      //console.log('rebuilding level');
      var t0 = (new Date).getTime();
      var i;
      var j;
      var x;
      var y;
      var width = Math.ceil((midi.duration/midi.timing)*blocksPerBeat);
      setMiniWidth(width);
      var height = 128;
      var uspqn = 500000; // Assumed
      var haveTempo = false; // TODO: Get rid of this when adding dynamic tempo
      level = new Level();
      bbar = midi.firstBbar;
      if(!limitedUpdate){
            document.getElementById('trkcontainer').innerHTML = '';
            recommendBPB();
      }
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
                  chkbox.checked = true;
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
            level.addArea(new Area(width,height));
            //x = 0;
            if(midi.firstTempo != 0){songBPM = 60000000/midi.firstTempo;}
            for(j=0;j<midi.trks[i].events.length;j++){ // This code is still here for if I add dynamic tempo/time signature options
                  break;
                  //x+=tempo*midi.tracks[i][j].deltaTime;
                  //x += (midi.tracks[i][j].deltaTime/midi.timing)*blocksPerBeat;
                  //console.log('x += '+Math.round((midi.tracks[i][j].deltaTime/midi.timing)*4));
                  //error += Math.abs(Math.round((midi.tracks[i][j].deltaTime/midi.timing)*4)-((midi.tracks[i][j].deltaTime/midi.timing)*4));
                  if(midi.tracks[i][j].type == 0xFF51 && !haveTempo){ // Tempo Change
                        uspqn = midi.tracks[i][j].data[0];
                        //console.log(midi.tracks[i][j].data[0]+' uspqn');
                        //console.log((60000000/uspqn)+' bpm');
                        //setTempoText(Math.round(60000000/uspqn)+' bpm');
                        songBPM = 60000000/uspqn;
                        refreshTempos(blocksPerBeat);
                        bpm = recommendTempo(songBPM,blocksPerBeat,true);
                        if(!limitedUpdate){recommendBPB();}
                        haveTempo = true;
                        //console.log('tempo = '+uspqn+' / '+midi.timing+' = '+uspqn/midi.timing+' microseconds per tick');
                        //tempo = (uspqn/midi.timing)*bpus[speed];
                        //console.log(tempo+' blocks per tick');
                  }
                  else if(midi.tracks[i][j].type == 0xFF58){ // Time Signature
                        //console.log('Time Signature');
                        //console.log(midi.tracks[i][j].data[0]+'/'+Math.pow(2,midi.tracks[i][j].data[1]));
                        bbar = midi.tracks[i][j].data[0]/Math.pow(2,midi.tracks[i][j].data[1]);
                        //console.log(midi.tracks[i][j].data[2]+' clocks per beat, '+midi.tracks[i][j].data[3]+' 32nd notes per qn');
                  }
                  /*else if(midi.tracks[i][j].type == 12){ // Program Change
                        //console.log('Program Change: #'+midi.tracks[i][j].data[0]+' on channel '+midi.tracks[i][j].channel);
                        currentInstrument[midi.tracks[i][j].channel] = midi.tracks[i][j].data[0];
                  }
                  else if(midi.tracks[i][j].type == 9&&midi.tracks[i][j].data[1]>0){ // Music Note
                        if(midi.tracks[i][j].data[1]<=noiseThreshold){continue;} // Skip notes with volume below noise threshold
                        y = midi.tracks[i][j].data[0];
                        level.areas[i].setTile(Math.round(x),y,1);
                        if(y+1<level.height && level.checkTile(Math.round(x),y+1)==null){
                              level.areas[i].setTile(Math.round(x),y+1,getInstrument(currentInstrument[midi.tracks[i][j].channel]));
                        }

                        //miniPlot(x/2,y/2);
                        //drawCircle(x,(y*0.5)+200,1,'black');
                        //drawTile(tiles[1],Math.round(x)*16,y*16);
                  }*/
                  //console.log(advance+' '+tempo+' '+midi.tracks[i][j].deltaTime);
            }
            for(j=0;j<midi.trks[i].notes.length;j++){
                  var note = midi.trks[i].notes[j];
                  if(note.volume<=noiseThreshold){continue;} // Skip notes with volume below noise threshold
                  x = (note.time/midi.timing)*blocksPerBeat;
                  var roundX = Math.round(x);
                  var instrument = getMM2Instrument(note.instrument);
                  y = note.pitch+1; // y = note.pitch;
                  if(note.channel == 9){
                        instrument = getPercussionInstrument(note.pitch)+2;
                        note.instrument = getMidiInstrument(instrument);
                        note.originalInstrument = note.instrument;
                        y = 54;
                  }
                  level.areas[i].setTile(roundX,y,1); // 1 is the ID of a note block tile
                  if(y+1<level.height && level.checkTile(roundX,y+1)==null){ // Check if there is room for an enemy can be placed on top of a note
                        level.areas[i].setTile(roundX,y+1,instrument);
                  }
            }
            level.areas[i].ofsY = octaveShifts[i]*12;
            //console.log('error = '+error);
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
            if(!limitedUpdate){recommendBPB();} // FIXME: Probably unintentional behavior now
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

function drawBG(){
      setBG('#00B2EE');
      drawGrid(16);
      var i;
      for(i=0;i<240;i++){
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
                        x = Math.round((note.time/midi.timing)*blocksPerBeat);
                        if(note.channel!=9){y = note.pitch + 1 + level.areas[i].ofsY;}
                        else{y = 54;}
                        // y = note.pitch - level.areas[i].ofsY
                        if(y <= ofsY){notesBelowScreen[i]++;}
                        else if(y > ofsY+26){notesAboveScreen[i]++;} // Omit the notes on the very top row for now
                        else if(x >= ofsX && x < ofsX+240){ // Check if notes are visible
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
      if(!noDOM){limitLine = null;}
      if(redrawMini){
            clearDisplayLayer(dlayer.overlayLayer);
            clearDisplayLayer(dlayer.noteLayer);
      }
      else{
            //if(fileLoaded){miniClear(0);}
      }
      if(fileLoaded){
            clearDisplayLayer(dlayer.outlineLayer);
            outlineLayers = new Array(midi.trks.length);
            for(var i=0;i<midi.trks.length;i++){
                  outlineLayers[i] = new DrawLayer(canvas.width, canvas.height);
            }
      }
      powerupCount = 0;
      entityCount = 0;
      for(i=27;i<level.width+27;i++){
            for(j=0;j<level.height;j++){ // This code is very confusing AND very slow // TODO: Why...
                  if(!redrawMini && i>ofsX+240){break;}
                  x = ofsX + i - 27;
                  y = ofsY + j;
                  var tile = level.checkTile(x,y); // Tile on the main screen
                  if(tile != null && isVisible(x,y,ofsX,ofsY)){
                        drawTile(tiles[tile],i*16,((27-j)*16));
                        if(level.numberOfOccupants[x][y] > 1){ // Highlight any overalapping tiles in red
                              //console.log('h '+x+','+y);
                              conflictCount++;
                              highlightTile(i,27-j,{style: 'rgba(255,0,0,0.4)'});
                        }
                        if(tile == 1 && level.isTrackOccupant[x][y][selectedTrack]){ // Outline note blocks of the selected track
                              outlineTile(i,27-j,2,'rgb(102,205,170)');
                              //outlineTileOnDrawLayer(outlineLayers[selectedTrack],i,27-j,2,'rgb(102,205,170)'); // TODO: Loop through tracks, make minimap work
                        }
                        if(!noDOM){
                              var occupants = level.getTileOccupants(x,y);
                              for(k=0;k<occupants.length;k++){
                                    if(occupants[k] < 2){continue;}
                                    if(instruments[occupants[k]-2].isPowerup){
                                          powerupCount++;
                                    }
                                    else{
                                          entityCount++;
                                    }
                              }
                              if((entityCount > 100 || powerupCount > 100) && (limitLine == null || i < limitLine)){
                                    limitLine = i+1;
                              }
                                 
                        }
                  }
                  var ijtile = level.checkTile(i-27,j); // Tile on the minimap
                  //var ijoccupants = level.getTileOccupants(i-27,j);
                  if(ijtile == 1 && redrawMini){
                        if(level.isTrackOccupant[i-27][j][selectedTrack]){
                              miniPlot(i-27,j,'mediumaquamarine');
                        }
                        else{
                              miniPlot(i-27,j);
                        }
                  }
                  /*if(!noDOM){
                        if(i<ofsX+240 && i>=ofsX+27 && j<=ofsY+27 && j>ofsY && ijtile >= 2){
                              var k;
                              if(ijoccupants.length > 1){console.log(ijoccupants);}
                              for(k=0;k<ijoccupants.length;k++){
                                    if(ijoccupants[k] < 2){continue;}
                                    if(instruments[ijoccupants[k]-2].isPowerup){
                                          powerupCount++;
                                    }
                                    else{
                                          entityCount++;
                                    }
                              }
                              if((entityCount > 100 || powerupCount > 100) && (limitLine == null || i-ofsX < limitLine)){
                                    limitLine = i-ofsX;
                              }
                        }
                  }*/
            }
            if(!redrawMini && i>ofsX+240){break;}
      }
      if(limitLine != null){drawLimitLine(limitLine);}
      if(!noDOM){
            document.getElementById('ELtext').innerHTML = "Entities in Area: "+entityCount;
            document.getElementById('PLtext').innerHTML = "Powerups in Area: "+powerupCount;

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
            /*if(quantizeErrorAggregate / midi.noteCount / blocksPerBeat < 0.05){
                  if(quantizeErrorAggregate / midi.noteCount / blocksPerBeat == 0){
                        document.getElementById('QEtext').innerHTML = "Blocks per Beat quality: Perfect";
                        document.getElementById('QEtext').style.color = 'green';
                  } else {
                        document.getElementById('QEtext').innerHTML = "Blocks per Beat quality: OK";
                        document.getElementById('QEtext').style.color = 'orange';
                  }
            } else {
                  document.getElementById('QEtext').innerHTML = "Blocks per Beat quality: Bad";
                  document.getElementById('QEtext').style.color = 'red';
            }*/

            if(entityCount>100){document.getElementById('ELtext').style.color = 'red';}
            else{document.getElementById('ELtext').style.color = '';}

            if(powerupCount>100){document.getElementById('PLtext').style.color = 'red';}
            else{document.getElementById('PLtext').style.color = '';}
            updateOutOfBoundsNoteCounts();
      }
      if(fileLoaded){
            miniClear(1);
            drawScrubber(ofsX,ofsY+27,canvas.width/16-27,canvas.height/16);
      }
      if(fileLoaded){canvasLayers[dlayer.outlineLayer].ctx.drawImage(outlineLayers[selectedTrack].canvas,0,0,canvas.width,canvas.height);}
      if(!noDOM && fileLoaded && (!(entityOverflowStatus.entity == entityCount > 100) || !(entityOverflowStatus.powerup == powerupCount > 100))){
            updateInstrumentContainer();
      }
      entityOverflowStatus = {entity: entityCount > 100, powerup: powerupCount > 100};
      refreshCanvas();
      if(fileLoaded){refreshMini();}
}

function moveOffsetTo(ox,oy){ // Offsets are given as percentages of the level
      if(!fileLoaded){return;}
      var width = Math.ceil((midi.duration/midi.timing)*blocksPerBeat);
      if(ox!=null){
            ofsX = Math.floor(ox*width);
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
      drawLevel(false);
}

function nudgeY(){
      enableMouse();
      stopAudio();
      var relativeOfs = parseInt(document.getElementById('yofspicker').value)*-1;
      //console.log(relativeOfs+48);
      moveOffsetTo(null,(relativeOfs+48)/127);
}

function resetOffsets(){
      ofsX = 0;
      ofsY = 48;
      document.getElementById('yofspicker').value = 0;
}

function recommendTempo(songBPM,bpb,print){
      var closestDist = 10000;
      var recc = -1;
      for(i=0;i<tempos.length;i++){
            var dist = Math.abs((tempos[i].bpm*(4/bpb))-songBPM);
            //console.log((bpms[i]*(4/bpqn))+' is dist of '+dist);
            if(dist<closestDist){
                  closestDist = dist;
                  recc = i;
            }
      }
      //console.log(bpmIDtoStr(recc));
      //console.log(songBPM+' -> '+bpms[recc]*(4/res));
      if(print){document.getElementById('temposelect').selectedIndex = numCommonTempos+recc;}
      return tempos[recc].bpm*(4/bpb);
}

function chkRefresh(){
      var i;
      for(i=0;i<midi.trks.length;i++){
            level.areas[i].setVisibility(document.getElementById('chk'+i).checked);
      }
      enableMouse();
      stopAudio();
      softRefresh();
}

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
      else{return midiInstrument - 127 + 16;} // For new instruments
}

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
            default: return mm2Instrument + 127 - 17
            //case 17: return 128;
            //default: return mm2Instrument + 127 - 16;
      }
}

function handleClick(e){
      if(noMouse){return;}
      if(clickedTile!=null){
            clickedTile = null;
            clearDisplayLayer(dlayer.mouseLayer);
            //drawLevel(false,true);
            return;
      }
      var canvasOfs = getOffset(e);
      var div = document.getElementById('displaycontainer');
      var scrollOfs = {x: div.scrollLeft, y: div.scrollTop};
      var offset = {x: canvasOfs.x + scrollOfs.x, y: canvasOfs.y + scrollOfs.y};
      var tilePos = {x: Math.floor(offset.x/16), y:27-Math.floor(offset.y/16)}
      var levelPos = {x:tilePos.x + ofsX - 27, y:tilePos.y + ofsY};

      //if(level.checkTile(levelPos.x,levelPos.y) == 1){
            //console.log('clicked a note!');
            clickedTile = levelPos;
      //}
}

function handleMove(e){
      if(noMouse){return;}
      var canvasOfs = getOffset(e);
      var div = document.getElementById('displaycontainer');
      var scrollOfs = {x: div.scrollLeft, y: div.scrollTop};
      var offset = {x: canvasOfs.x + scrollOfs.x, y: canvasOfs.y + scrollOfs.y};
      var tilePos = {x: Math.floor(offset.x/16), y:27-Math.floor(offset.y/16)}
      var realTpos= tilePos;
      var levelPos = {x:tilePos.x + ofsX - 27, y:tilePos.y + ofsY};
      var refresh = false;

      if(currentHighlight.x!=tilePos.x || currentHighlight.y!=tilePos.y){
            clearDisplayLayer(dlayer.mouseLayer);
            highlightTile(tilePos.x,27-tilePos.y,{style:'rgba(0,0,0,0.1)', layer: dlayer.mouseLayer}); // Lightly highlight the tile the cursor is on
            drawTile(cursor,(tilePos.x-1)*16,(27-(tilePos.y+1))*16,dlayer.mouseLayer); // Draw the cursor icon
            refreshCanvas();
            currentHighlight = {x: tilePos.x, y: tilePos.y};
            refresh = true;
      }

      if(clickedTile==null){return;}

      //if(level.checkTile(levelPos.x,levelPos.y) == 1){
            //console.log('On another note!');
            //console.log(levelPos);
            if(refresh){
                  //highlightTile(tilePos.x,27-tilePos.y);

                  // Very bad and confusing because I changed my mind halfway through and didn't feel like fixing it
                  var i = levelPos.x;
                  var j = levelPos.y;
                  levelPos = clickedTile;
                  tilePos = {x: levelPos.x - ofsX + 27, y: levelPos.y - ofsY};

                  //console.log('Found at '+i+', '+j);
                  //console.log('Delta: Left '+(i-levelPos.x)+', Up '+(j-levelPos.y));
                  var dirStr = {h: '', v: ''};
                  var k;
                  if(i-levelPos.x > 0){
                        dirStr.h = 'Right'
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
                              //console.log('h '+(tilePos.x+(i-levelPos.x))+', '+(27-(j-ofsY-k)));
                              highlightTile((tilePos.x+(i-levelPos.x)),27-(j-ofsY-k),{style: 'rgba(0,191,0,0.5)', layer: dlayer.mouseLayer});
                        }
                  }
                  else if(j-levelPos.y < 0){
                        dirStr.v = 'Down';
                        for(k=0;k<(j-levelPos.y)*-1;k++){
                              //console.log('h '+(tilePos.x+(i-levelPos.x))+', '+(27-(j-ofsY-k)));
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
      //}
      refreshCanvas();
}

function pickBPB(){
      var val = document.getElementById('bpbpicker').value;
      val = Math.floor(val);
      if(val == 69){
            alert('stop');
      }
      if(val < 1){val = 1;}
      if(val > 8){val = 8;}
      blocksPerBeat = val;
      if(!advancedSettings){filterBPB();}
      document.getElementById('bpbpicker').value = blocksPerBeat;
      lastBPB = blocksPerBeat;
      changeBPB();
}

function changeToRecommendedBPB(){
      //document.getElementById('bpbrecommend').disabled = true;
      blocksPerBeat = recmdBlocksPerBeat;
      document.getElementById('bpbpicker').value = blocksPerBeat;
      changeBPB();
}

function changeBPB(moveOfs){
      if(!fileLoaded){return;}
      //if(moveOfs == undefined){moveOfs = true;}
      moveOfs = true;
      /*if(recmdBlocksPerBeat !== blocksPerBeat){
            document.getElementById('bpbrecommend').disabled = false;
      } else {
            document.getElementById('bpbrecommend').disabled = true;
      }*/
      quantizeErrorAggregate = 0;
      for(var i=0;i<midi.trks.length;i++){
            if(!level.areas[i] || level.areas[i].isVisible){quantizeErrorAggregate += midi.trks[i].quantizeErrors[blocksPerBeat-1];}
      }
      if(moveOfs && !isNewFile){
            enableMouse();
            stopAudio();
            var ratio = (ofsX*minimapZoomX)/minimap.width;
            moveOffsetTo(ratio,null);
            miniClear(1);
            drawScrubber(ofsX,ofsY+27,canvas.width/16-27,canvas.height/16);
            hardRefresh(true, true);
      }
}

function playBtn(){
      if(fileLoaded){
            /*if(noteCount>200){
                  alert('Too many notes! Try removing tracks to free up space.');
                  return;
            }*/
            noMouse = true;
            document.getElementById('playbtn').disabled = true;
            playLvl(level,bpm,blocksPerBeat,ofsX,ofsY);
            //playLvl(level,songBPM,blocksPerBeat,ofsX,ofsY);
      }
}

function stopBtn(){
      resetPlayback();
      stopAudio();
}

function recommendBPB(){
      var lowestQuantizeError = Infinity;
      var bestBPB = 0;
      for(var i=0;i<8;i++){ // Iterate to 8 for now
            var total = 0;
            for(var j=0;j<midi.trks.length;j++){
                  if(!level.areas[j] || level.areas[j].isVisible){total += midi.trks[j].quantizeErrors[i];}
            }
            // console.log('quantize at ' + (i+1) + 'BPB: ' + total);
            if(total<lowestQuantizeError){
                  lowestQuantizeError = total;
                  bestBPB = i+1;
            }
      }
      var recmd = bestBPB;
      //var curBPM = bpm;
      //var diffPercent = Math.abs(curBPM-songBPM)/songBPM;
      // console.log('S'+bestBPB+': '+diffPercent+' @ '+curBPM);
      /*while(diffPercent > 0.1){
            curBPM = recommendTempo(songBPM,recmd,false);
            diffPercent = Math.abs(curBPM-songBPM)/songBPM;
            // console.log(recmd+': '+diffPercent+' @ '+curBPM);
            if(recmd + bestBPB >= 16){break;}
            recmd += bestBPB;
      }*.
      recmdBlocksPerBeat = recmd;
      /*if(recmdBlocksPerBeat !== blocksPerBeat){
            var button = document.getElementById('bpbrecommend')
            button.disabled = "false";
            button.onclick = function(){document.getElementById('bpbpicker').value = recmdBlocksPerBeat;}
      }*/
      changeBPB(false);
      return recmd;
}

function isVisible(x,y,ofsX,ofsY){
      return (x >= ofsX && x < ofsX+240-27 && y > ofsY && y <= ofsY+27);
}

function enableMouse(){
      noMouse = false;
}

function handleOut(){
      if(noMouse){return;}
      clearDisplayLayer(dlayer.mouseLayer);
      refreshCanvas();
      //drawLevel(false,true);
}

function showEverything(){
      document.getElementById('toolbox').style = ''; // Much better
}

function refreshTempos(){
      var i;
      var commonGroup = document.getElementById('comtempos');
      var allGroup = document.getElementById('alltempos');
      commonGroup.innerHTML = '';
      allGroup.innerHTML = '';
      if(isNewFile){numCommonTempos = 0;}
      for(i=0;i<tempos.length;i++){
            var opt = document.createElement('option');
            opt.value = i;
            opt.innerHTML = tempos[i].name+' ('+Math.round(tempos[i].bpm*(4/blocksPerBeat))+' bpm)';
            allGroup.appendChild(opt);
            if(tempos[i].isCommon){
                  if(isNewFile){numCommonTempos++;}
                  var opt2 = document.createElement('option');
                  opt2.value = i;
                  opt2.innerHTML = tempos[i].name+' ('+Math.round(tempos[i].bpm*(4/blocksPerBeat))+' bpm)';
                  commonGroup.appendChild(opt2);
            }
      }
}

function selectTempo(){
      var sel = document.getElementById('temposelect');
      var selected = sel.value;
      bpm = tempos[selected].bpm*(4/blocksPerBeat);
}

function softRefresh(noDOM, redrawMini){ // Refresh changes to track layers
      if(noDOM == undefined){noDOM = false;}
      if(redrawMini == undefined){redrawMini = true;}
      level.refresh();
      drawLevel(redrawMini,noDOM);
}

function hardRefresh(reccTempo, limitUpdate){ // Refresh changes to the entire MIDI
      if(limitUpdate == undefined){limitUpdate = true;}
      placeNoteBlocks(limitUpdate, reccTempo);
}

function changeNoiseThreshold(){
      noiseThreshold = document.getElementById('noiseslider').value;
      hardRefresh(false);
}

function shiftTrackOctave(){
      octaveShifts[selectedTrack] = parseInt(document.getElementById('octaveshift').value);
      semitoneShifts[selectedTrack] = parseInt(document.getElementById('semitoneshift').value);
      level.areas[selectedTrack].ofsY = octaveShifts[selectedTrack]*12 + semitoneShifts[selectedTrack];
      calculateNoteRange();
      adjustZoom();
      softRefresh();
      updateInstrumentContainer();
}

function selectTrack(trkID){
      var initSelect = (trkID == -1);
      if(trkID == -1){
            var i;
            for(i=0;i<midi.trks.length;i++){ // Find the first visible checkbox to select 
                  trkID = i;
                  if(document.getElementById('chk'+i).style.display != 'none'){break;}
            }
      }
      if(document.getElementById('chk'+trkID).checked != level.areas[trkID].isVisible && !initSelect){return;} // Check to see if the checkbox is about to update. If yes, return
      selectedTrack = trkID;
      document.getElementById('octaveshift').value = octaveShifts[selectedTrack];
      document.getElementById('semitoneshift').value = semitoneShifts[selectedTrack];
      document.getElementById('shiftbutton').disabled = (octaveShifts[selectedTrack] == getViewOctaveShift(selectedTrack));
      if(midi.trks[selectedTrack].hasPercussion || advancedSettings){
            document.getElementById('semishiftdiv').style.display = 'inline';
      }
      else{
            document.getElementById('semishiftdiv').style.display = 'none';
      }
      //console.log(trkID);
      var i;
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

function changeInstrument(trk, ins, newIns){
      var i;
      for(i=0;i<midi.trks[trk].notes.length;i++){
            if(getMM2Instrument(midi.trks[trk].notes[i].originalInstrument) == ins){midi.trks[trk].notes[i].instrument = getMidiInstrument(newIns);}
      }
      hardRefresh(false);
}

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
            div.style = 'width: max-content;'
            var picker = document.createElement('select');
            picker.id = 'inspicker'+i;
            picker.setAttribute('onchange','triggerInstrChange('+i+');');
            picker.setAttribute('class','dropdown');
            var isPowerupOverflow = entityCount > 100;
            var isEntityOverflow = powerupCount > 100;
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
                  if(alphabetizedInstruments[j].octave == targetOctave){
                        var optClone = opt.cloneNode(true);
                        recOctGroup.appendChild(optClone);
                        numRecommendedInstruments++;
                        hasOctaveRec = true;
                  }
                  if(isEntityOverflow && !isPowerupOverflow){
                        if(!alphabetizedInstruments[j].isPowerup){
                              var optClone = opt.cloneNode(true);
                              recEntGroup.appendChild(optClone);
                              numRecommendedInstruments++;
                              hasEntityRec = true;
                        }
                  }
                  else if(isPowerupOverflow && !isEntityOverflow){
                        if(alphabetizedInstruments[j].isPowerup){
                              var optClone = opt.cloneNode(true);
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
            picker.selectedIndex = getUnsortedInstrumentIndex(instrumentChanges[selectedTrack][i]) + numRecommendedInstruments;
            container.appendChild(div);
            updateOutOfBoundsNoteCounts();
      }
}

function triggerInstrChange(selectedInstrument){
      var selectedInsIndex = alphabetizedInstruments[document.getElementById('inspicker'+selectedInstrument).value].pos;
      changeInstrument(selectedTrack,getMM2Instrument(midi.trks[selectedTrack].usedInstruments[selectedInstrument]),selectedInsIndex+2);
      instrumentChanges[selectedTrack][selectedInstrument] = selectedInsIndex;
}

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

function getInstrumentById(name){ // Not the fastest solution, but it's convenient
      for(var i=0;i<instruments.length;i++){
            if(instruments[i].id == name){return i;}
      }
}

function getPercussionInstrument(pitch){
      pitch++;
      switch(pitch){
            case 35: return getInstrumentById('pow'); break;
            case 36: return getInstrumentById('pow'); break;
            case 37: return getInstrumentById('pow'); break;
            case 40: return getInstrumentById('pswitch'); break;
            case 41: return getInstrumentById('spikeball'); break;
            case 42: return getInstrumentById('pow'); break;
            case 43: return getInstrumentById('spikeball'); break;
            case 44: return getInstrumentById('sidewaysspring'); break;
            case 45: return getInstrumentById('spikeball'); break;
            case 46: return getInstrumentById('sidewaysspring'); break;
            case 47: return getInstrumentById('spikeball'); break;
            case 48: return getInstrumentById('spring'); break;
            case 51: return getInstrumentById('spring'); break;
            case 52: return getInstrumentById('spring'); break;
            case 55: return getInstrumentById('spring'); break;
            case 57: return getInstrumentById('spring'); break;
            case 59: return getInstrumentById('spring'); break;
            case 65: return getInstrumentById('billblaster'); break;
            case 66: return getInstrumentById('billblaster'); break;
            case 76: return getInstrumentById('post'); break;
            case 77: return getInstrumentById('post'); break;
            default: return getInstrumentById('pswitch');
      }
}

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
      snipTrack(trk);
}

function addTrack(trk){
      midi.trks.push(trk);
      octaveShifts.push(0);
      semitoneShifts.push(0);
      notesAboveScreen.push(0);
      notesBelowScreen.push(0);
      instrumentChanges.push([getMM2Instrument(trk.usedInstruments[0])-2]);
}

function snipTrack(trk){ // This makes the track invisible, but doesn't actually remove it from the array
      trk.notes = [];
}

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
            window.open('https://discord.gg/KhmXzfp');
      }, 600);
      /*setTimeout(function(){
            btn.style.animationPlayState = 'running';
      }, 1000);*/
}

function scrollDisplayBy(pixels){
      var current = document.getElementById('displaycontainer').scrollLeft;
      document.getElementById('displaycontainer').scrollLeft = current + pixels;
}

function scrollDisplayTo(pixelsOfs){
      document.getElementById('displaycontainer').scrollLeft = pixelsOfs;
}

function toggleAdvancedMode(){
      advancedSettings = document.getElementById('advbox').checked;
      if(midi.trks[selectedTrack].hasPercussion || advancedSettings){
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
                        level.areas[selectedTrack].ofsY = octaveShifts[selectedTrack]*12;
                  }
            }
            softRefresh();
      }
      if(!advancedSettings){
            blocksPerBeat = reccBPB;
            document.getElementById('bpbpicker').value = blocksPerBeat;
            lastBPB = blocksPerBeat;
            changeBPB();
      }
}

function generateAcceptableBPBs(){
      if(Math.ceil(Math.log2(reccBPB)) == Math.floor(Math.log2(reccBPB))){ // Check if the number is a power of 2
            return [1,2,4,8];
      }
      else if(reccBPB%3 == 0){return [3,6]}
      else{return [reccBPB];} // For BPBs 5 and 7
}

function filterBPB(){
      var i;
      for(i=0;i<acceptableBPBs.length;i++){
            if(blocksPerBeat == acceptableBPBs[i]){return;}
      }
      var delta = blocksPerBeat - lastBPB;
      var last = acceptableBPBs[0];
      for(i=0;i<acceptableBPBs.length;i++){
            if(acceptableBPBs[i] > blocksPerBeat){
                  if(delta < 0){
                        blocksPerBeat = last;
                        return;
                  }
                  else{
                        blocksPerBeat = acceptableBPBs[i];
                        return;
                  }
            }
            last = acceptableBPBs[i];
      }
}

function getViewOctaveShift(trkID){
      var sum = 0;
      var i;
      for(i=0;i<midi.trks[trkID].notes.length;i++){
            sum += midi.trks[trkID].notes[i].pitch;
      }
      var avg = sum/midi.trks[trkID].notes.length;
      return Math.round((avg - (60 + (ofsY-48)))/12)*-1;
}

function shiftTrackIntoView(){
      var shift = getViewOctaveShift(selectedTrack);
      octaveShifts[selectedTrack] = shift;
      document.getElementById('octaveshift').value = shift;
      level.areas[selectedTrack].ofsY = octaveShifts[selectedTrack]*12 + semitoneShifts[selectedTrack];
      calculateNoteRange();
      adjustZoom();
      softRefresh();
      updateInstrumentContainer();
}

function refreshOutlines(){
      clearDisplayLayer(dlayer.outlineLayer);
      canvasLayers[dlayer.outlineLayer].ctx.drawImage(outlineLayers[selectedTrack].canvas,0,0,canvas.width,canvas.height);
      refreshCanvas();
}

function alphabetizeInstruments(arr){
      var newArr = new Array(arr.length);
      for(var i=0;i<arr.length;i++){
            newArr[i] = { id: arr[i].id, name: arr[i].name, octave: arr[i].octave, pos: i, isPowerup: arr[i].isPowerup };
      }
      newArr.sort(function(a,b){
            if(a.id > b.id){return 1;}
            else{return -1;}
      });
      return newArr;
}

function getUnsortedInstrumentIndex(sortedIndex){
      var i;
      for(i=0;i<alphabetizedInstruments.length;i++){
            if(sortedIndex == alphabetizedInstruments[i].pos){return i;}
      }
}

function adjustZoom(){
      var range = noteRange;
      if(range < 18){range = 18;}
      var lowerBound = 64-range;
      var zoom = -32/(lowerBound-64);
      setMiniZoomY(zoom);
      //console.log('zoom set to '+zoom);
      return zoom;
}

function calculateNoteRange(){
      noteRange = 0;
      for(var i=0;i<midi.trks.length;i++){
            if(midi.trks[i].lowestNote == null || midi.trks[i].highestNote == null || !level.areas[i].isVisible){continue;}
            var thisRange = Math.max(Math.abs(64-(midi.trks[i].lowestNote+level.areas[i].ofsY)),Math.abs(64-(midi.trks[i].highestNote+level.areas[i].ofsY)));
            if(thisRange > noteRange){noteRange = thisRange;}
      }
}