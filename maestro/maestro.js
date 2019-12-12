// Super Mario Maestro v1.2.0.1
// made by h267

/* TODO: New features:
1.2.1:
 - Any more bug fixes if found
 - Percussion support
 - Pitching of percussion tracks by one-block increments
 - Track-Channel Management
 - Color-coded tracks - highlight notes in that color and color them that way in the scrubber, and of course show the color in the list
 - Bigger file scrubber

 - Highlight enemies that don't have much room, maybe overlay exclamation point [New UI]
 - Better error messages to alleviate confusion and allow for better debugging
 - Playback line optionally drags the scrollbar with it (maybe a play all button)
 - A small info button that shows how to use everything and shows patch notes [New UI]
 - Handle dynamic tempo changes [New UI]
 - x-offset number input or other way to nudge x-offset [New UI]
 - Music levels on tracks: Loup's Algorithms, then Ren's once acceleration is known
 - Start music playback from anywhere in the blueprint
*/

// TODO: Finish level, noise threshold 31. Use monitor expressions debugger to restore threshold

var reader = new FileReader;
var midi;
// blocks per beat: 4
var bpms = [
      28, // Slow Autoscroll
      // 28, // Backwards Normal Conveyor, Walking
      32, // Underwater Walking
      56, // Normal Conveyor, Idle
      // 56, // Medium Autoscroll
      // 56, // Backwards Fast Conveyor, Running
      64, // Swimming
      84, // Walking
      // 84, // Blaster in a Cloud, Idle
      88, // Normal Conveyor, Underwater Walking
      101, // Swimming Holding an Item
      112, // Fast Autoscroll
      // 112, // Backwards Normal Conveyor, Running
      // 112, // Fast Conveyor, Idle
      116, // Blaster in a Cloud, Underwater Walking
      140, // Normal Conveyor, Walking
      // 140 // Blue Skull Ride, Idle
      144, // Fast Conveyor, Underwater Walking
      148, // Blaster in a Cloud, Swimming
      166, // Blaster in a Cloud, Walking
      169, // Running
      186, // Blaster in a Cloud, Swimming Holding an Item
      194, // Fast Conveyor, Walking  
      227, // Normal Conveyor, Running
      256, // Blaster in a Cloud, Running
      279, // Fast Conveyor, Running
];
var instruments = [
      {name: 'Goomba (Grand Piano)', octave: 1, isPowerup: false},
      {name: 'Shellmet (Reverb Cowbell)', octave: 1, isPowerup: false},
      {name: '1-Up (Synth Organ)', octave: 0, isPowerup: true},
      {name: 'Spike Top (Harpsichord)', octave: 0, isPowerup: false},
      {name: 'Sledge Bro (Bass Guitar)', octave: -2, isPowerup: false},
      {name: 'Piranha Plant (Pizzicato Strings)', octave: 1, isPowerup: false},
      {name: 'Bob-Omb (Orchestra Hit)', octave: 0, isPowerup: false},
      {name: 'Spiny Shellmet (Trumpet)', octave: 1, isPowerup: false},
      {name: 'Dry Bones Shell (Flute)', octave: 2, isPowerup: false},
      {name: 'Mushroom (Square Wave)', octave: 1, isPowerup: true},
      {name: 'Rotten Mushroom (Low Synth)', octave: -2, isPowerup: true},
      {name: 'Green Beach Koopa (Bark)', octave: 0, isPowerup: false},
      {name: 'Monty Mole (Banjo)', octave: 0, isPowerup: false},
      {name: 'P-Switch (Snare Drum)', octave: 0, isPowerup: false},
      {name: 'Red Beach Koopa (Meow)', octave: 0, isPowerup: false},
      {name: 'Big Mushroom (Shamisen)', octave: 0, isPowerup: false},
      {name: 'Bill Blaster (Timpani)', octave: 0, isPowerup: false},
      {name: 'Shoe Goomba (Low Accordion)', octave: -1, isPowerup: false},
      {name: 'Stiletto Goomba (Accordion)', octave: 0, isPowerup: false},
      {name: 'Cannon (Timbales)', octave: 0, isPowerup: false},
      {name: 'Unchained Chomp (Synth Piano)', octave: 0, isPowerup: false},
      {name: 'Chain Chomp Post (Wood Block)', octave: 0, isPowerup: false},
      {name: 'Coin (Sleigh Bells)', octave: 0, isPowerup: false},
      {name: 'Fire Piranha Plant (Legato Strings)', octave: 0, isPowerup: false},
      {name: 'Fire Flower (Recorder)', octave: 1, isPowerup: false},
      {name: 'Goombrat (Honky-Tonk Piano)', octave: 1, isPowerup: false},
      {name: 'Green Koopa (Xylophone)', octave: 1, isPowerup: false},
      {name: 'Red Koopa (Vibraphone)', octave: 1, isPowerup: false},
      {name: 'Hammer Bro (Electric Guitar)', octave: 1, isPowerup: false},
      {name: 'Magikoopa (Synth Choir)', octave: 1, isPowerup: false},
      {name: 'Muncher (Synth Piano 2)', octave: 0, isPowerup: false},
      {name: 'POW Block (Kick Drum)', octave: 0, isPowerup: false},
      {name: 'Trampoline (Crash Cymbal)', octave: 0, isPowerup: false},
      {name: 'Sideways Trampoline (Hi-Hat)', octave: 0, isPowerup: false},
      {name: 'Super Star (Music Box)', octave: 1, isPowerup: true},
      {name: 'Superball Flower (Organ)', octave: 1, isPowerup: false},
      {name: 'Thwomp (Ethnic Drum)', octave: 0, isPowerup: false},
      {name: 'Wiggler (Tubular Bells)', octave: 1, isPowerup: false},
      {name: 'Spike (Acoustic Bass Guitar)', octave: -2, isPowerup: false},
      {name: 'Spike Ball (Bass Drum)', octave: 0, isPowerup: false},
      {name: 'Snowball (Tom-Tom Drum)', octave: 0, isPowerup: false},
      {name: 'Pokey (Acoustic Guitar)', octave: 0, isPowerup: false},
      {name: 'Snow Pokey (Kazoo)', octave: 1, isPowerup: false},
      {name: 'Master Sword (Synth Horn)', octave: 0, isPowerup: false},/*
      {name: 'Toad (Suffering)', octave: 0, isPowerup: false},*/ // If you uncomment this, only pain and suffering awaits
];
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
var currentHighlight = {x:-1,y:-1};
var prevHighlighted = false;
var clickedTile = null;
var minimapData = null;
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

document.getElementById('canvas').addEventListener ('mouseout', handleOut, false);

getImg('icon/ruler.png').then(function(cursorImg){
      cursor = cursorImg;
      loadTiles().then(function(){
            drawLevel(false,true);  
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
            document.getElementById('noiseslider').style.display = '';
            document.getElementById('nslabl').style.display = '';
      }
      else{
            document.getElementById('nslabl').style.display = 'none';
            document.getElementById('noiseslider').style.display = 'none'; 
      }
      reader.readAsArrayBuffer(document.getElementById('fileinput').files[0]);
	reader.onload = function(){
            if(fileLoaded){
                  noMouse = false;
                  stopAudio();
            }
            if(!fileLoaded){showEverything();}
            midi = new MIDIfile(new Uint8Array(reader.result));
            resetOffsets();
            miniClear();
            miniBox(ofsX/2,(ofsY/2)+(27/2),(canvas.width/32)-(27/2),canvas.height/32);
            document.getElementById('trkcontainer').innerHTML = '';
            //document.getElementById('trkselect').innerHTML = '';
            selectedTrack = 0;
            octaveShifts = new Array(midi.tracks.length).fill(0);
            instrumentChanges = new Array(midi.tracks.length);
            var i;
            var j;
            for(i=0;i<instrumentChanges.length;i++){
                  instrumentChanges[i] = new Array();
                  for(j=0;j<midi.usedInstruments[i].length;j++){
                        instrumentChanges[i][j] = getMM2Instrument(midi.usedInstruments[i][j])-2;
                  }
            }
            notesAboveScreen = new Array(midi.tracks.length);
            notesAboveScreen.fill(0);
            notesBelowScreen = new Array(midi.tracks.length);
            notesBelowScreen.fill(0);
            document.getElementById('octaveshift').value = 0;
            blocksPerBeat = midi.blocksPerBeat;
            document.getElementById('bpbpicker').value = blocksPerBeat;
            isNewFile = true;
            fileLoaded = true;
            placeNoteBlocks(false, true);
            isNewFile = false;
            document.getElementById('yofspicker').disabled = false;
            document.getElementById('bpbpicker').disabled = false;
            //console.log(midi.noteCount+' notes total');
      }
}

function placeNoteBlocks(limitedUpdate, reccTempo){
      quantizeErrorAggregate = 0;
      var i;
      var j;
      var x;
      var y;
      var width = Math.ceil((midi.duration/midi.timing)*blocksPerBeat);
      setMiniWidth(width/2);
      var height = 128;
      var uspqn = 500000; // Assumed
      var haveTempo = false; // TODO: Get rid of this when adding dynamic tempo
      level = new Level();
      for(i=0;i<midi.tracks.length;i++){
            // Add checkbox with label for each track
            if(!limitedUpdate){
                  var div = document.createElement('div');
                  div.id = 'item'+i;
                  div.setAttribute('onclick','selectTrack('+i+');');
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
                  if(!midi.hasNotes[i]){ // Patch this in without breaking anything
                        chkbox.style.display = 'none';
                        labl.style.display = 'none';
                  }
                  labl.appendChild(rad);
                  labl.innerHTML += midi.trkLabels[i];
                  labl.setAttribute('for',rad.id);
                  labl.style.position = 'relative';
                  labl.style.bottom = '3px';
                  labl.id = 'trklabl'+i;
                  div.appendChild(labl);

                  document.getElementById('trkcontainer').appendChild(div);
                  /*if(midi.hasNotes[i]){
                        document.getElementById('trkcontainer').appendChild(document.createElement('br'));
                  }*/

                  // Add a new track option
                  if(midi.trkLabels[i].charAt(0)!='['){
                        var opt = document.createElement('option');
                        opt.value = i;
                        opt.innerHTML = midi.trkLabels[i];
                        //document.getElementById('trkselect').appendChild(opt);
                  }
            }
            level.addArea(new Area(width,height));
            //x = 0;
            if(midi.firstTempo != 0){songBPM = 60000000/midi.firstTempo;}
            if(reccTempo){
                  refreshTempos(blocksPerBeat);
                  bpm = reccomendTempo(songBPM,blocksPerBeat,true);
                  haveTempo = true;
            }
            if(!limitedUpdate){
                  reccomendBPB();
                  updateInstrumentContainer();
            }
            bbar = midi.firstBbar

            for(j=0;j<midi.tracks[i].length;j++){ // This code is still here for if I add dynamic tempo/time signature options
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
                        bpm = reccomendTempo(songBPM,blocksPerBeat,true);
                        if(!limitedUpdate){reccomendBPB();}
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
            notesAboveScreen[i] = 0;
            notesBelowScreen[i] = 0;
            for(j=0;j<midi.notes[i].length;j++){
                  var note = midi.notes[i][j];
                  if(note.volume<=noiseThreshold){continue;} // Skip notes with volume below noise threshold
                  x = (note.time/midi.timing)*blocksPerBeat
                  var roundX = Math.round(x);
                  var roundedBy = roundX-x;
                  // console.log("Rounded by: " + roundedBy);
                  if(roundedBy > 0.14){quantizeErrorAggregate += Math.abs(roundX-x);} // TODO: Figure out why this threshold is necessary
                  var instrument = getMM2Instrument(note.instrument);
                  y = note.pitch+(-12*instruments[instrument-2].octave)+1;
                  level.areas[i].setTile(roundX,y,1);
                  if(y+1<level.height && level.checkTile(roundX,y+1)==null){
                        level.areas[i].setTile(roundX,y+1,instrument);
                  }
                  if(y<=ofsY){notesBelowScreen[i]++;}
                  if(y>=ofsY+27){notesAboveScreen[i]++;}
            }
            level.areas[i].ofsY = octaveShifts[i]*-12;
            //console.log('error = '+error);
      }
      //console.log(blocksPerBeat+' bpqn chosen');
      if(!haveTempo && reccTempo){ // Use default tempo if none was found
            refreshTempos(blocksPerBeat);
            bpm = reccomendTempo(songBPM,blocksPerBeat,true); // TODO: Add a checkmark or asterisk next to the reccomended tempo
            if(!limitedUpdate){reccomendBPB();}
      }
      haveTempo = true;
      if(!limitedUpdate){selectTrack(-1);}
      if(fileLoaded && !isNewFile){
            chkRefresh();
      }
      else{
            softRefresh();
      }
}

function drawLevel(redrawMini,noDOM){
      if(tiles==undefined){return;}
      if(redrawMini==undefined){redrawMini=false;}
      if(noDOM==undefined){noDOM=false;}
      miniClear();
      fillRect(0,0,canvas.clientWidth,canvas.clientHeight,'#00B2EE');
      drawGrid(16);
      var i;
      for(i=0;i<240;i++){
            drawTile(tiles[0],i*16,canvas.height-16);
      }
      entityCount = 0;
      powerupCount = 0;
      var j;
      var x;
      var y;
      if(!noDOM){limitLine = null;}
      for(i=27;i<level.width+27;i++){
            for(j=0;j<level.height;j++){ // This code is very confusing... probably should fix it later
                  if(!redrawMini && i>ofsX+240){break;}
                  x = ofsX + i - 27;
                  y = ofsY + j;
                  var tile = level.checkTile(x,y);
                  if(tile != null && isVisible(x,y,ofsX,ofsY)){drawTile(tiles[tile],i*16,((27-j)*16));}
                  var ijtile = level.checkTile(i-27,j);
                  if(ijtile == 1){
                        if(redrawMini){miniPlot((i-27)/2,j/2);}
                  }
                  if(!noDOM){
                        if(i<ofsX+240 && i>=ofsX+27 && j<=ofsY+27 && j>ofsY && ijtile >= 2){
                              if(instruments[ijtile-2].isPowerup){
                                    powerupCount++;
                              }
                              else{
                                    entityCount++;
                              }
                              if((entityCount > 100 || powerupCount > 100) && limitLine == null){
                                    limitLine = i-ofsX;
                              }
                        }
                  }
            }
            if(!redrawMini && i>ofsX+240){break;}
      }
      if(limitLine != null){drawLimitLine(limitLine);}
      decorateBG();
      if(!noDOM){
            document.getElementById('ELtext').innerHTML = "Entities in Area: "+entityCount;
            document.getElementById('PLtext').innerHTML = "Powerups in Area: "+powerupCount;
            // console.log(quantizeErrorAggregate);
            if(quantizeErrorAggregate < 10){ // TODO: figure out what number this should actually be
                  if(quantizeErrorAggregate === 0){
                        document.getElementById('QEtext').innerHTML = "Blocks per Beat quality: Perfect";
                        document.getElementById('QEtext').style.color = 'green';
                  } else {
                        document.getElementById('QEtext').innerHTML = "Blocks per Beat quality: OK";
                        document.getElementById('QEtext').style.color = 'orange';
                  }
            } else {
                  document.getElementById('QEtext').innerHTML = "Blocks per Beat quality: Bad";
                  document.getElementById('QEtext').style.color = 'red';
            }
            if(entityCount>100){document.getElementById('ELtext').style.color = 'red';}
            else{document.getElementById('ELtext').style.color = '';}

            if(powerupCount>100){document.getElementById('PLtext').style.color = 'red';}
            else{document.getElementById('PLtext').style.color = '';}
            updateOutOfBoundsNoteCounts();
      }
      if(redrawMini){minimapData = captureMini();}
      else{setMiniData(minimapData);}
      if(fileLoaded){
            miniBox(ofsX/2,(ofsY/2)+(27/2),(canvas.width/32)-(27/2),canvas.height/32);
      }
}

function moveOffsetTo(ox,oy){ // Offsets are given as percentages of the level
      if(!fileLoaded){return;}
      var width = Math.ceil((midi.duration/midi.timing)*blocksPerBeat);
      if(ox!=null){
            ofsX = Math.floor(ox*width);
            //console.log(ox+' -> '+ofsX);
      }
      if(ofsX>(minimap.width-((canvas.width/32)-(27/2)))*2){ofsX = (minimap.width-((canvas.width/32)-(27/2)))*2;}
      if(ofsX<0){ofsX=0;}
      ofsX = Math.floor(ofsX/(blocksPerBeat*bbar))*blocksPerBeat*bbar; // Quantize to the nearest measure
      if(oy!=null){ofsY = oy*127;}
      drawLevel();
}

function nudgeY(){
      noMouse = false;
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

function bpmIDtoStr(id){
      const bpms = [
            'Slow Autoscroll OR Backwards Normal Conveyor - Walking',
            'Underwater Walking',
            'Normal Conveyor - Idle OR Medium Autoscroll OR Backwards Fast Conveyor - Running',
            'Swimming',
            'Walking OR Blaster in a Cloud - Idle',
            'Normal Conveyor - Underwater Walking',
            'Swimming Holding an Item',
            'Fast Autoscroll OR Fast Conveyor - Idle OR Backwards Normal Conveyor - Running',
            'Blaster in a Cloud - Underwater Walking',
            'Blue Skulls OR Normal Conveyor - Walking',
            'Fast Conveyor, Underwater Walking',
            'Blaster in a Cloud - Swimming',
            'Blaster in a Cloud - Walking',
            'Running',
            'Blaster in a Cloud - Swimming Holding an Item',
            'Fast Conveyor - Walking',
            'Normal Conveyor - Running',
            'Blaster in a Cloud - Running',
            'Fast Conveyor - Running',
      ];
      return bpms[id];
}

function reccomendTempo(songBPM,bpb,print){
      var closestDist = 10000;
      var recc = -1;
      for(i=0;i<bpms.length;i++){
            var dist = Math.abs((bpms[i]*(4/bpb))-songBPM);
            //console.log((bpms[i]*(4/bpqn))+' is dist of '+dist);
            if(dist<closestDist){
                  closestDist = dist;
                  recc = i;
            }
      }
      //console.log(bpmIDtoStr(recc));
      //console.log(songBPM+' -> '+bpms[recc]*(4/res));
      if(print){document.getElementById('temposelect').selectedIndex = recc;}
      return bpms[recc]*(4/bpb);
}

function chkRefresh(){
      var i;
      for(i=0;i<midi.tracks.length;i++){
            level.areas[i].setVisibility(document.getElementById('chk'+i).checked);
      }
      noMouse = false;
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
            drawLevel(false,true);
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
            drawLevel(false,true);
            highlightTile(tilePos.x,27-tilePos.y,'rgba(0,0,0,0.1)');
            drawTile(cursor,(tilePos.x-1)*16,(27-(tilePos.y+1))*16);
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
                              highlightTile(tilePos.x+k+1,27-tilePos.y);
                        }
                  }
                  else if(i-levelPos.x < 0){
                        dirStr.h = 'Left';
                        for(k=0;k<(i-levelPos.x)*-1;k++){
                              highlightTile(tilePos.x-k-1,27-tilePos.y);
                        }                        
                  }
                  
                  if(j-levelPos.y > 0){
                        dirStr.v = 'Up';
                        for(k=0;k<j-levelPos.y;k++){
                              //console.log('h '+(tilePos.x+(i-levelPos.x))+', '+(27-(j-ofsY-k)));
                              highlightTile((tilePos.x+(i-levelPos.x)),27-(j-ofsY-k),'rgba(0,191,0,0.5)');
                        }
                  }
                  else if(j-levelPos.y < 0){
                        dirStr.v = 'Down';
                        for(k=0;k<(j-levelPos.y)*-1;k++){
                              //console.log('h '+(tilePos.x+(i-levelPos.x))+', '+(27-(j-ofsY-k)));
                              highlightTile((tilePos.x+(i-levelPos.x)),27-(j-ofsY+k),'rgba(0,191,0,0.5)');
                        }
                  }
                  if(dirStr.h!=''&&dirStr.v!=''){
                        text(realTpos.x*16-24,(27-realTpos.y)*16-8,dirStr.h+' '+Math.abs(i-levelPos.x)+', '+dirStr.v+' '+Math.abs(j-levelPos.y));
                  }
                  else if(dirStr.h==''&&dirStr.v!=''){
                        text(realTpos.x*16-24,(27-realTpos.y)*16-8,dirStr.v+' '+Math.abs(j-levelPos.y));
                  }
                  else{
                        text(realTpos.x*16-24,(27-realTpos.y)*16-8,dirStr.h+' '+Math.abs(i-levelPos.x));
                  }
                  return;
            }
      //}
}

function changeRes(){ // TODO: Change the blocks per beat slider to a dropdown
      if(!fileLoaded){return;}
      noMouse = false;
      stopAudio();
      var ratio = (ofsX/2)/minimap.width;
      //console.log(ofsX+' / '+(minimap.width/2));
      //if(ratio>1){ratio = ratio-Math.floor(ratio);}
      //console.log(ratio+'... '+ofsX+' -> '+(ofsX*ratio));
      blocksPerBeat = document.getElementById('bpbpicker').value;
      //console.log('chose res of '+blocksPerBeat);
      //document.getElementById('trkcontainer').innerHTML = '';
      hardRefresh(true);
      //console.log('ratio = '+ratio);
      moveOffsetTo(ratio,null);
      miniBox(ofsX/2,(ofsY/2)+(27/2),(canvas.width/32)-(27/2),canvas.height/32);
}

function playBtn(){
      if(fileLoaded){
            /*if(noteCount>200){
                  alert('Too many notes! Try removing tracks to free up space.');
                  return;
            }*/
            noMouse = true;
            playLvl(level,bpm/*songBPM*/,blocksPerBeat,ofsX,ofsY);
      }
}

function stopBtn(){
      noMouse = false;
      stopAudio();
}

function reccomendBPB(){
      var recmd = blocksPerBeat;
      var curBPM = bpm;
      var diffPercent = Math.abs(curBPM-songBPM)/songBPM;
      // console.log('S'+blocksPerBeat+': '+diffPercent+' @ '+curBPM);
      while(diffPercent > 0.1){
            curBPM = reccomendTempo(songBPM,recmd,false);
            diffPercent = Math.abs(curBPM-songBPM)/songBPM;
            //console.log(recmd+': '+diffPercent+' @ '+curBPM);
            if(recmd + blocksPerBeat >= 16){break;}
            recmd += blocksPerBeat;
      }
      document.getElementById('bpbpicker').value = recmd;
      changeRes();
      return recmd;
}

function isVisible(x,y,ofsX,ofsY){
      return (x >= ofsX && x < ofsX+240 && y > ofsY && y <= ofsY+27);
}

function enableMouse(){
      noMouse = false;
}

function handleOut(){
      if(noMouse){return;}
      drawLevel(false,true);
}

function showEverything(){
      document.getElementById('toolbox').style = ''; // Much better
}

function refreshTempos(){
      var i;
      var sel = document.getElementById('temposelect');
      sel.innerHTML = '';
      for(i=0;i<bpms.length;i++){
            var opt = document.createElement('option');
            opt.value = i;
            opt.innerHTML = bpmIDtoStr(i)+' ('+Math.round(bpms[i]*(4/blocksPerBeat))+' bpm)';
            sel.appendChild(opt);        
      }
}

function selectTempo(){
      var sel = document.getElementById('temposelect');
      var selected = sel.selectedIndex;
      bpm = bpms[selected]*(4/blocksPerBeat);
}

function softRefresh(){ // Refresh changes to track layers
      level.refresh();
      drawLevel(true);
}

function hardRefresh(reccTempo){ // Refresh changes to the entire MIDI
      placeNoteBlocks(true, reccTempo);
}

function changeNoiseThreshold(){
      noiseThreshold = document.getElementById('noiseslider').value;
      hardRefresh(false);
}

function shiftTrackOctave(){
      octaveShifts[selectedTrack] = document.getElementById('octaveshift').value;
      level.areas[selectedTrack].ofsY = octaveShifts[selectedTrack]*-12;
      softRefresh();
}

function selectTrack(trkID){
      var initSelect = (trkID == -1);
      if(trkID == -1){
            var i;
            for(i=0;i<midi.tracks.length;i++){ // Find the first visible checkbox to select 
                  trkID = i;
                  if(document.getElementById('chk'+i).style.display != 'none'){break;}
            }
      }
      if(document.getElementById('chk'+trkID).checked != level.areas[trkID].visible && !initSelect){return;} // Check to see if the checkbox is about to update. If yes, return
      selectedTrack = trkID;
      document.getElementById('octaveshift').value = octaveShifts[selectedTrack];
      //console.log(trkID);
      var i;
      for(i=0;i<midi.tracks.length;i++){
            if(i != trkID){
                  document.getElementById('item'+i).style.backgroundColor = '';
            }
            else{
                  document.getElementById('item'+i).style.backgroundColor = '#c3c3ff';
            }
      }
      updateInstrumentContainer();
}

function changeInstrument(trk, ins, newIns){
      var i;
      for(i=0;i<midi.notes[trk].length;i++){
            if(getMM2Instrument(midi.notes[trk][i].originalInstrument) == ins){midi.notes[trk][i].instrument = getMidiInstrument(newIns);}
      }
      hardRefresh(false);
}

function updateInstrumentContainer(){
      var container = document.getElementById('instrumentcontainer');
      container.innerHTML = '';
      var i;
      for(i=0;i<midi.usedInstruments[selectedTrack].length;i++){
            var div = document.createElement('div');
            div.id = 'inscontainer'+i;
            div.style = 'width: max-content;'
            var picker = document.createElement('select');
            picker.id = 'inspicker'+i;
            picker.setAttribute('onchange','triggerInstrChange('+i+');');
            var j;
            for(j=0;j<instruments.length;j++){
                  var opt = document.createElement('option');
                  opt.value = j+2;
                  opt.innerHTML = instruments[j].name + ' (';
                  if(instruments[j].octave >= 0){
                        opt.innerHTML += '+' + instruments[j].octave + ' 8va)';
                  } else {
                        opt.innerHTML += '' + instruments[j].octave + ' 8vb)';
                  }
                  picker.appendChild(opt);
            }
            picker.selectedIndex = instrumentChanges[selectedTrack][i];
            var labl = document.createElement('label');
            labl.id = 'inspickerlabl'+i;
            labl.for = 'inspicker'+i;
            labl.innerHTML = getMidiInstrumentName(midi.usedInstruments[selectedTrack][i])+' ➞ ';
            div.appendChild(labl);
            div.appendChild(picker);
            container.appendChild(div);
            updateOutOfBoundsNoteCounts();
      }
}

function triggerInstrChange(selectedInstrument){
      changeInstrument(selectedTrack,getMM2Instrument(midi.usedInstruments[selectedTrack][selectedInstrument]),document.getElementById('inspicker'+selectedInstrument).selectedIndex+2);
      instrumentChanges[selectedTrack][selectedInstrument] = document.getElementById('inspicker'+selectedInstrument).selectedIndex;
}

function updateOutOfBoundsNoteCounts(){
      var nasText = document.getElementById('NASText');
      var nbsText = document.getElementById('NBSText');
      var denom = midi.noteCount/midi.tracks.length;
      nasText.innerHTML = 'Notes above screen: ' + notesAboveScreen[selectedTrack];
      console.log('Math.floor(255*'+notesAboveScreen[selectedTrack]+'/'+denom+')');
      var red = Math.floor(255*notesAboveScreen[selectedTrack]/denom);
      var green = 255-Math.floor(510*notesAboveScreen[selectedTrack]/denom);
      if(red > 255){red = 255;}
      if(green < 0){green = 0;}
      nasText.style.color = 'rgb('+red+','+green+',0)';
      nbsText.innerHTML = 'Notes below screen: ' + notesBelowScreen[selectedTrack];
      red = Math.floor(255*notesBelowScreen[selectedTrack]/denom);
      green = 255-Math.floor(510*notesBelowScreen[selectedTrack]/denom);
      if(red > 255){red = 255;}
      if(green < 0){green = 0;}
      nbsText.style.color = 'rgb('+red+','+green+',0)';
}