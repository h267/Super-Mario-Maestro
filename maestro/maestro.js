/* TODO:

 - y-offsets for individual tracks
 - Highlight enemies that don't have much room, maybe overlay exclamation point
 - Bug fixes
 - Better error messages to alleviate confusion and allow for better debugging
 - Player line optionally drags the scrollbar with it (maybe a play all button)
 - Dropdown menu for tempos, gets automatically set to best match
 - A small info button that shows how to use everything and shows patch notes

*/

var reader = new FileReader;
var midi;
var bpms = [
      85, // Walking
      175, // Running
      28, // Slow Autoscroll
      57, // Medium Autoscroll
      115, // Fast Autoscroll
      56, // Normal Conveyor, Idle
      143, // Normal Conveyor, Walking
      231, // Normal Conveyor, Running
      113, // Fast Conveyor, Idle
      203, // Fast Conveyor, Walking
      286, // Fast Conveyor, Running
      //28, // Backwards Normal Conveyor, Walking
      114, // Backwards Normal Conveyor, Running
      //57, // Backwards Fast Conveyor, Running
      //143 // Blue Skull Ride, Idle
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
            resolution = midi.resolution;
            document.getElementById('respicker').value = midi.precision;
            fileLoaded = true;
            placeNoteBlocks(false);
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
      var currentProgram = new Array(16);
      currentProgram.fill(0);
      var uspqn = 500000; // Assumed
      level = new Level();
            for(i=0;i<midi.tracks.length;i++){
                  // Add checkbox with label for each track
                  if(!noRecBPM){
                        var chkbox = document.createElement('input');
                        chkbox.id = 'chk'+i;
                        chkbox.type = 'checkbox';
                        chkbox.setAttribute('onchange','chkRefresh();');
                        chkbox.checked = true;
                        document.getElementById('trkcontainer').appendChild(chkbox);
                        var labl = document.createElement('label');
                        labl.for = 'chk'+i;
                        labl.style = 'font-size:12px';
                        labl.innerHTML = 'Track '+i;
                        document.getElementById('trkcontainer').appendChild(labl);
                        document.getElementById('trkcontainer').appendChild(document.createElement('br'));
                  }

                  level.addArea(new Area(width,height));
                  x = 0;
                  for(j=0;j<midi.tracks[i].length;j++){
                        //x+=tempo*midi.tracks[i][j].deltaTime;
                        x += (midi.tracks[i][j].deltaTime/midi.timing)*resolution;
                        //console.log('x += '+Math.round((midi.tracks[i][j].deltaTime/midi.timing)*4));
                        //error += Math.abs(Math.round((midi.tracks[i][j].deltaTime/midi.timing)*4)-((midi.tracks[i][j].deltaTime/midi.timing)*4));
                        if(midi.tracks[i][j].type == 65361){ // Tempo Change
                              uspqn = midi.tracks[i][j].data[0];
                              //console.log(midi.tracks[i][j].data[0]+' uspqn');
                              //console.log((60000000/uspqn)+' bpm');
                              //setTempoText(Math.round(60000000/uspqn)+' bpm');
                              songBPM = 60000000/uspqn;
                              bpm = reccomendTempo(songBPM,resolution,true);
                              if(!noRecBPM){reccomendRes();}
                              //console.log('tempo = '+uspqn+' / '+midi.timing+' = '+uspqn/midi.timing+' microseconds per tick');
                              //tempo = (uspqn/midi.timing)*bpus[speed];
                              //console.log(tempo+' blocks per tick');
                        }
                        else if(midi.tracks[i][j].type == 65368){ // Time Signature
                              //console.log('Time Signature');
                              //console.log(midi.tracks[i][j].data[0]+'/'+Math.pow(2,midi.tracks[i][j].data[1]));
                              bbar = midi.tracks[i][j].data[0]/Math.pow(2,midi.tracks[i][j].data[1]);
                              //console.log(midi.tracks[i][j].data[2]+' clocks per beat, '+midi.tracks[i][j].data[3]+' 32nd notes per qn');
                        }
                        else if(midi.tracks[i][j].type == 12){ // Program Change
                              //console.log('Program Change: #'+midi.tracks[i][j].data[0]+' on channel '+midi.tracks[i][j].channel);
                              currentProgram[midi.tracks[i][j].channel] = midi.tracks[i][j].data[0];
                        }
                        else if(midi.tracks[i][j].type == 9&&midi.tracks[i][j].data[1]>0){ // Music Note
                              if(midi.tracks[i][j].data[1]==0){continue;} // Skip notes with zero volume
                              y = midi.tracks[i][j].data[0];
                              level.areas[i].setTile(Math.round(x),y,1);
                              if(y+1<level.height && level.checkTile(Math.round(x),y+1)==null){
                                    level.areas[i].setTile(Math.round(x),y+1,getInstrument(currentProgram[midi.tracks[i][j].channel]));
                              }

                              //miniPlot(x/2,y/2);
                              //drawCircle(x,(y*0.5)+200,1,'black');
                              //drawTile(tiles[1],Math.round(x)*16,y*16);
                        }
                        //console.log(advance+' '+tempo+' '+midi.tracks[i][j].deltaTime);
                  }
                  //console.log('error = '+error);
            }
            //console.log(resolution+' bpqn chosen');
            level.refresh();
            drawLevel(true);
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
                  document.getElementById('ELtext').style = 'font-size:12px; display:inline';
            }
            else if(noteCount>100&&noteCount<=200){
                  document.getElementById('ELtext').style = 'font-size:12px; color:blue; display:inline';
            }
            else if(noteCount>200){
                  document.getElementById('ELtext').style = 'font-size:12px; color:red; display:inline';
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
            case 0: return 'Walking';
            case 1: return 'Running';
            case 2: return 'Slow Autoscroll OR Backwards Normal Conveyor - Walking';
            case 3: return 'Medium Autoscroll OR Backwards Fast Conveyor - Running';
            case 4: return 'Fast Autoscroll';
            case 5: return 'Normal Conveyor - Idle';
            case 6: return 'Normal Conveyor - Walking OR Blue Skulls'
            case 7: return 'Normal Conveyor - Running';
            case 8: return 'Fast Conveyor - Idle';
            case 9: return 'Fast Conveyor - Walking';
            case 10: return 'Fast Conveyor - Running';
            case 11: return 'Backwards Normal Conveyor - Running';
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
      if(print){setTempoText(bpmIDtoStr(recc)+' ('+Math.round(songBPM)+' bpm -> '+Math.round(bpms[recc]*(4/res))+' bpm)');}
      return bpms[recc]*(4/res);
}

function chkRefresh(){
      var i;
      for(i=0;i<midi.tracks.length;i++){
            level.areas[i].setVisibility(document.getElementById('chk'+i).checked);
      }
      noMouse = false;
      stopAudio();
      level.refresh();
      drawLevel(true);
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
      placeNoteBlocks(true);
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
            playLvl(level,bpm,resolution,ofsX,ofsY);
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

function showEverything(){ // Bad code that was rushed and stuff
      document.getElementById('playbtn').style = 'float:left';
      document.getElementById('stopbtn').style = '';
      document.getElementById('tempop').style = 'font-size:12px; display: inline';
      document.getElementById('fstxt').style = 'font-size:12px;  margin-bottom:0px;';
      document.getElementById('minimapcontainer').style = 'overflow: auto';
      document.getElementById('labrs').style = 'font-size:12px';
      document.getElementById('respicker').style = 'width:50px;';
      document.getElementById('labys').style = 'font-size:12px';
      document.getElementById('yofspicker').style = 'width:50px;';
      document.getElementById('trkcontainer').style = 'border:1px solid black; width:100px; height: 100px; overflow-y: scroll';
}