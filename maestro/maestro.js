// Super Mario Maestro
// made by h267

/* TODO: New features

1.2:
 - Bug fixes
 - y-offsets for individual tracks [New UI]
 - Changing/replacing instruments in tracks [New UI]
 - Add all instruments that can be reused more than a few times
 - Display both limit separately, prompt instrument changes if the entity limit or powerup limit runs out [New UI]

 - Highlight enemies that don't have much room, maybe overlay exclamation point [New UI]
 - Better error messages to alleviate confusion and allow for better debugging
 - Playback line optionally drags the scrollbar with it (maybe a play all button)
 - A small info button that shows how to use everything and shows patch notes [New UI]
 - GM Drum Kit Support
 - Handle dynamic tempo changes [New UI]
 - x-offset number input or other way to nudge x-offset [New UI]
 - Music levels on tracks: Loup's Algorithms, then Ren's once acceleration is known
 - A dividing line that shows when the entity limit is reached

*/

// TODO: Bug fixes
// - Fix mislabeling, including the below issue and labeling tracks with multiple instruments
// - Track tempos will sometimes not display when certains files are loaded

// TODO: Mislabeling with indirect instruments (see Megalovania.mid)

// TODO: Finish level, noise threshold 31. Use monitor expressions debugger to restore threshold

var reader = new FileReader;
var midi;
var bpms = [
      28, // Slow Autoscroll
      // 28, // Backwards Normal Conveyor, Walking
      56, // Normal Conveyor, Idle
      57, // Medium Autoscroll
      // 57, // Backwards Fast Conveyor, Running
      85, // Walking
      113, // Fast Conveyor, Idle
      114, // Backwards Normal Conveyor, Running
      115, // Fast Autoscroll
      143, // Normal Conveyor, Walking
      //143 // Blue Skull Ride, Idle
      175, // Running
      203, // Fast Conveyor, Walking  
      231, // Normal Conveyor, Running
      286, // Fast Conveyor, Running
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
var resolution = 4;
var currentHighlight = {x:-1,y:-1};
var prevHighlighted = false;
var clickedTile = null;
var minimapData = null;
var bbar = 1;
var noMouse = false;
var cursor;
var noteCount;
var isNewFile;
var noiseThreshold = 0;
var selectedTrack = 0;
var octaveShifts = [];

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
                  getImg('tiles/mew.png')
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
            octaveShifts = new Array(midi.tracks.length);
            octaveShifts.fill(0);
            document.getElementById('octaveshift').value = 0;
            resolution = midi.resolution;
            document.getElementById('respicker').value = midi.precision;
            isNewFile = true;
            fileLoaded = true;
            placeNoteBlocks(false);
            isNewFile = false;
            document.getElementById('yofspicker').disabled = false;
            document.getElementById('respicker').disabled = false;
            //console.log(midi.noteCount+' notes total');
      }
}

function placeNoteBlocks(noRecBPM){
      var i;
      var j;
      var x;
      var y;
      var width = Math.ceil((midi.duration/midi.timing)*resolution);
      setMiniWidth(width/2);
      var height = 128;
      var uspqn = 500000; // Assumed
      var haveTempo = false; // TODO: Get rid of this when adding dynamic tempo
      level = new Level();
      for(i=0;i<midi.tracks.length;i++){
            // Add checkbox with label for each track
            if(!noRecBPM){
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
            refreshTempos(resolution);
            bpm = reccomendTempo(songBPM,resolution,true);
            if(!noRecBPM){reccomendRes();}
            haveTempo = true;

            bbar = midi.firstBbar


            for(j=0;j<midi.tracks[i].length;j++){ // This code is still here for if I add dynamic tempo/time signature options
                  break;
                  //x+=tempo*midi.tracks[i][j].deltaTime;
                  //x += (midi.tracks[i][j].deltaTime/midi.timing)*resolution;
                  //console.log('x += '+Math.round((midi.tracks[i][j].deltaTime/midi.timing)*4));
                  //error += Math.abs(Math.round((midi.tracks[i][j].deltaTime/midi.timing)*4)-((midi.tracks[i][j].deltaTime/midi.timing)*4));
                  if(midi.tracks[i][j].type == 0xFF51 && !haveTempo){ // Tempo Change
                        uspqn = midi.tracks[i][j].data[0];
                        //console.log(midi.tracks[i][j].data[0]+' uspqn');
                        //console.log((60000000/uspqn)+' bpm');
                        //setTempoText(Math.round(60000000/uspqn)+' bpm');
                        songBPM = 60000000/uspqn;
                        refreshTempos(resolution);
                        bpm = reccomendTempo(songBPM,resolution,true);
                        if(!noRecBPM){reccomendRes();}
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
            for(j=0;j<midi.notes[i].length;j++){
                  var note = midi.notes[i][j];
                  if(note.volume<=noiseThreshold){continue;} // Skip notes with volume below noise threshold
                  x = (note.time/midi.timing)*resolution
                  y = note.pitch;
                  level.areas[i].setTile(Math.round(x),y,1);
                  if(y+1<level.height && level.checkTile(Math.round(x),y+1)==null){
                        level.areas[i].setTile(Math.round(x),y+1,getInstrument(note.instrument));
                  }
            }
            level.areas[i].ofsY = octaveShifts[i]*-13;
            //console.log('error = '+error);
      }
      //console.log(resolution+' bpqn chosen');
      if(!haveTempo){ // Use default tempo if none was found
            refreshTempos(resolution);
            bpm = reccomendTempo(songBPM,resolution,true);
            if(!noRecBPM){reccomendRes();}
            haveTempo = true;
      }
      if(!noRecBPM){selectTrack(-1);}
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
      noteCount = 0;
      var j;
      var x;
      var y;
      for(i=27;i<level.width+27;i++){
            for(j=0;j<level.height;j++){
                  if(!redrawMini && i>ofsX+240){break;}
                  x = ofsX + i - 27;
                  y = ofsY + j;
                  var tile = level.checkTile(x,y);
                  if(tile != null && isVisible(x,y,ofsX,ofsY)){drawTile(tiles[tile],i*16,((27-j)*16));}
                  if(level.checkTile(i-27,j) == 1){
                        if(redrawMini){miniPlot((i-27)/2,j/2);}
                        if(i<ofsX+240 && i>=ofsX+27 && j<=ofsY+27 && j>ofsY){
                              noteCount++;
                        }
                  }
            }
            if(!redrawMini && i>ofsX+240){break;}
      }
      decorateBG();
      if(!noDOM){
            document.getElementById('ELtext').innerHTML = "Notes in Area: "+noteCount;
            if(noteCount<=100){
                  document.getElementById('ELtext').style = 'display:inline';
            }
            else if(noteCount>100&&noteCount<=200){
                  document.getElementById('ELtext').style = 'color:blue; display:inline';
            }
            else if(noteCount>200){
                  document.getElementById('ELtext').style = 'color:red; display:inline';
            }
      }
      if(redrawMini){minimapData = captureMini();}
      else{setMiniData(minimapData);}
      if(fileLoaded){
            miniBox(ofsX/2,(ofsY/2)+(27/2),(canvas.width/32)-(27/2),canvas.height/32);
      }
}

function moveOffsetTo(ox,oy){ // Offsets are given as percentages of the level
      if(!fileLoaded){return;}
      var width = Math.ceil((midi.duration/midi.timing)*resolution);
      if(ox!=null){
            ofsX = Math.floor(ox*width);
            //console.log(ox+' -> '+ofsX);
      }
      if(ofsX>(minimap.width-((canvas.width/32)-(27/2)))*2){ofsX = (minimap.width-((canvas.width/32)-(27/2)))*2;}
      if(ofsX<0){ofsX=0;}
      ofsX = Math.floor(ofsX/(resolution*bbar))*resolution*bbar; // Quantize to the nearest measure
      if(oy!=null){ofsY = oy*127;}
      drawLevel();
}

function nudgeY(){
      noMouse = false;
      stopAudio();
      var relativeOfs = parseInt(document.getElementById('yofspicker').value);
      //console.log(relativeOfs+48);
      moveOffsetTo(null,(relativeOfs+48)/127);
}

function resetOffsets(){
      ofsX = 0;
      ofsY = 48;
      document.getElementById('yofspicker').value = 0;
}

function bpmIDtoStr(id){
      switch(id){
            case 0: return 'Slow Autoscroll OR Backwards Normal Conveyor - Walking';
            case 1: return 'Normal Conveyor - Idle';
            case 2: return 'Medium Autoscroll OR Backwards Fast Conveyor - Running';
            case 3: return 'Walking';
            case 4: return 'Fast Conveyor - Idle';
            case 5: return 'Backwards Normal Conveyor - Running';
            case 6: return 'Fast Autoscroll';
            case 7: return 'Blue Skulls OR Normal Conveyor - Walking';
            case 8: return 'Running';
            case 9: return 'Fast Conveyor - Walking';
            case 10: return 'Normal Conveyor - Running';
            case 11: return 'Fast Conveyor - Running';
      }
}

function reccomendTempo(songBPM,res,print){
      var closestDist = 10000;
      var recc = -1;
      for(i=0;i<bpms.length;i++){
            var dist = Math.abs((bpms[i]*(4/res))-songBPM);
            //console.log((bpms[i]*(4/bpqn))+' is dist of '+dist);
            if(dist<closestDist){
                  closestDist = dist;
                  recc = i;
            }
      }
      //console.log(bpmIDtoStr(recc));
      //console.log(songBPM+' -> '+bpms[recc]*(4/res));
      if(print){document.getElementById('temposelect').selectedIndex = recc;}
      return bpms[recc]*(4/res);
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

function getInstrument(program){
      program++;
      // 1. Specific MIDI Instruments
      // To be added in 1.1

      // 2. General Category Instruments
      if(program<=8){return 2;} // Piano
      if(program>=9 && program<=16){return 3;} // Chromatic Percussion
      if(program>=17 && program<=24){return 4;} // Organ
      if(program>=25 && program<=32){return 5;} // Guitar
      if(program>=33 && program<=40){return 6;} // Bass
      if(program>=41 && program<=48){return 7;} // Strings
      if(program>=49 && program<=56){return 8;} // Ensemble
      if(program>=57 && program<=72){return 9;} // Brass, Lead
      if(program>=73 && program<=80){return 10;} // Pipe
      if(program>=81 && program<=88){return 11;} // Synth Lead
      if(program>=89 && program<=96){return 12;} // Synth Pad
      if(program>=97 && program<=104){return 13;} // Synth Effects
      if(program>=105 && program<=112){return 14;} // Ethnic
      if(program>=113 && program<=120){return 15;} // Percussive
      if(program>=121 && program<=128){return 16;} // Sound Effects

      // 3. Goomba by Default
      return 2;
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

function changeRes(){
      if(!fileLoaded){return;}
      noMouse = false;
      stopAudio();
      //console.log(Math.pow(2,(7-document.getElementById('respicker').value)-4));
      var newRes = 1/Math.pow(2,(7-document.getElementById('respicker').value)-4);
      var ratio = (ofsX/2)/minimap.width;
      //console.log(ofsX+' / '+(minimap.width/2));
      //if(ratio>1){ratio = ratio-Math.floor(ratio);}
      //console.log(ratio+'... '+ofsX+' -> '+(ofsX*ratio));
      resolution = newRes;
      //console.log('chose res of '+resolution);
      //document.getElementById('trkcontainer').innerHTML = '';
      hardRefresh();
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
            playLvl(level,bpm/*songBPM*/,resolution,ofsX,ofsY);
      }
}

function stopBtn(){
      noMouse = false;
      stopAudio();
}

function reccomendRes(){
      var recmd = resolution;
      var curBPM = bpm;
      var diffPercent = Math.abs(curBPM-songBPM)/songBPM;
      var diff = 0;
      //console.log('S'+resolution+': '+diffPercent+' @ '+curBPM);
      while(diffPercent>0.2){
            recmd/=2;
            diff++;
            curBPM = reccomendTempo(songBPM,recmd,false);
            diffPercent = Math.abs(curBPM-songBPM)/songBPM;
            //console.log(recmd+': '+diffPercent+' @ '+curBPM);
            if(recmd<=0.25){break;}
      }
      document.getElementById('respicker').value -= diff;
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
            opt.innerHTML = bpmIDtoStr(i)+' ('+Math.round(bpms[i]*(4/resolution))+' bpm)';
            sel.appendChild(opt);        
      }
}

function selectTempo(){
      var sel = document.getElementById('temposelect');
      var selected = sel.selectedIndex;
      bpm = bpms[selected]*(4/resolution);
}

function softRefresh(){ // Refresh changes to track layers
      level.refresh();
      drawLevel(true);
}

function hardRefresh(){ // Refresh changes to the entire MIDI
      placeNoteBlocks(true);
}

function changeNoiseThreshold(){
      noiseThreshold = document.getElementById('noiseslider').value;
      hardRefresh();
}

function moveTrackOfs(){
      // Move selected track by offset times 13 vertically
}

function shiftTrackOctave(){
      octaveShifts[selectedTrack] = document.getElementById('octaveshift').value;
      level.areas[selectedTrack].ofsY = octaveShifts[selectedTrack]*-13;
      //changeInstrument(selectedTrack,0,2,13);
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
      loadTrackSettings();
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
}

function loadTrackSettings(){ // TODO: Also use this for instrument swaps, etc
      document.getElementById('octaveshift').value = octaveShifts[selectedTrack];
}

// TODO: Reset new UI elements on file change

function changeInstrument(trk, ch, oldIns, newIns){ // TODO: Change this: go through notes array, modify current instruments based on the originals, then hard refresh.
      var i;
      var j;
      for(i=0;i<level.areas[trk].w;i++){
            for(j=0;j<level.areas[trk].h;j++){
                  if(level.areas[trk].getTile(i,j) == oldIns){level.areas[trk].setTile(i,j,newIns)}
            }
      }
}