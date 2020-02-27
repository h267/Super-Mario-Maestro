const insPlayData = [
      {file: 'goomba'},
      {file: 'shellmet', baseNote: KEY_F3},
      {file: '1up'},
      {file: 'spiketop'},
      {file: 'sledgebro'},
      {file: 'piranha'},
      {file: 'bobomb'},
      {file: 'spiny'},
      {file: 'drybones', hasLongSustain: true},
      {file: 'shroom'},
      {file: 'rottenshroom'},
      {file: 'bark', baseNote: KEY_F3},
      {file: 'mole'},
      {file: 'pswitch'},
      {file: 'meow', baseNote: KEY_F3},
      {file: 'bigshroom'},
      {file: 'blaster'},
      {file: 'boot'},
      {file: 'stiletto'},
      {file: 'cannon'},
      {file: 'chomp'},
      {file: 'post'},
      {file: 'coin'},
      {file: 'fireplant', hasLongSustain: true},
      {file: 'flower'},
      {file: 'goombrat'},
      {file: 'greenkoopa'},
      {file: 'redkoopa'},
      {file: 'hammerbro', hasLongSustain: true},
      {file: 'magikoopa'},
      {file: 'muncher'},
      {file: 'pow'},
      {file: 'spring'},
      {file: 'sidespring'},
      {file: 'star'},
      {file: 'superball'},
      {file: 'thwomp'},
      {file: 'wiggler'},
      {file: 'spike', volumeOffset: -2},
      {file: 'spikeball'},
      {file: 'snowball'},
      {file: 'pokey'},
      {file: 'snowpokey'},
      {file: 'sword'},
      {file: 'toad'}
];
const defaultInsPlayData = {file: 'goomba', baseNote: KEY_C4, volumeOffset: 0};
const masterVolume = -5;

var schTime = 0;
var pos = 0;
var len = 0;
var notes = [];
var framesPerColumn = 0;
var isPlaying = false;
var endBound;
var outputBuffer;
var samplers = [];
var buffers = [];
var isContinuousPlayback = false;
var noteSchedule = new NoteSchedule();

var restrictPitchRange = true; // Make this var so Hermit can change it with his epic hacking skillz

// TODO: Import new sounds
// TODO: Bring back real time for non-full map playback

function loadBuffers(){
      buffers = [];
      var promises = [];
      insPlayData.forEach(function(n,i){
            promises.push(new Promise(async function(resolve, reject){
                  let baseNote;
                  if(n.baseNote == undefined) baseNote = defaultInsPlayData.baseNote;
                  else baseNote = n.baseNote;
                  let hasLongSustain;
                  if(!n.hasLongSustain) hasLongSustain = false;
                  else hasLongSustain = true;
                  await noteSchedule.addInstrument(i, './wav/'+n.file+'.wav', {baseNote: baseNote, hasLongSustain: hasLongSustain});
                  for(let j = 0; j < levelHeight - 1; j++){
                        await noteSchedule.instruments[i].generateBufferForNote(baseOfsY + j);
                  }
                  resolve();
            }));
            // TODO: Only load instruments that are CURRENTLY being used in range (possibly trigger during level overview construction)
      });
      return Promise.all(promises);
}

async function playLvl(midi,level,bpm,blocksPerBeat,ofsX,ofsY){
      stopAudio();
      await loadBuffers();
      isContinuousPlayback = false;
      endBound = level.width;
      framesPerColumn = 1/(blocksPerBeat*bpm/3600);
      var i;
      var j;
      notes = [];
      for(i=0;i<endBound;i++){
            notes[i] = [];
      }
      for(i=0;i<level.noteGroups.length;i++){
            if(!level.noteGroups[i].isVisible) continue;
            for(j=0;j<level.noteGroups[i].notes.length;j++){
                  var thisNote = level.noteGroups[i].notes[j];
                  var yPos = thisNote.pitch + level.noteGroups[i].ofsY;
                  if((yPos < ofsY || yPos >= ofsY+levelHeight-1) && restrictPitchRange) continue;
                  notes[thisNote.x - ofsX].push({note: yPos - (ofsY - baseOfsY), instrument: getMM2Instrument(thisNote.instrument)-2});
            }
      }
      while(pos < endBound-marginWidth+1){
            advanceSchTime(2520/blocksPerBeat);
      }
      playAudio(bpm);
}

async function playMap(midi,level,bpm,blocksPerBeat,ofsX,ofsY){ // TODO: Reintroduce
      stopAudio();
      isContinuousPlayback = true;
      endBound = Math.floor((midi.duration/midi.timing)*blocksPerBeat);
      console.log(endBound-ofsX);
      framesPerColumn = 1/(blocksPerBeat*bpm/3600);
      notes = [];
      for(i=0;i<endBound;i++){
            notes[i] = [];
      }
      for(i=0;i<level.noteGroups.length;i++){
            if(!level.noteGroups[i].isVisible) continue;
            for(j=0;j<midi.trks[i].notes.length;j++){
                  var thisNote = midi.trks[i].notes[j];
                  var x = Math.floor((thisNote.time/midi.timing)*blocksPerBeat);
                  if(x < ofsX) continue;
                  var yPos = thisNote.pitch + level.noteGroups[i].ofsY;
                  if((yPos < ofsY || yPos >= ofsY+levelHeight-1) && restrictPitchRange) continue;
                  // FIXME: Changing BPB breaks x-ofsX when ??
                  // FIXME: Need end scrolling behavior
                  notes[x - ofsX].push({note: yPos - (ofsY - baseOfsY), instrument: getMM2Instrument(thisNote.instrument)-2});
            }
      }
      while(pos <= endBound-ofsX){
            advanceSchTimeCont(2520/blocksPerBeat);
      }
      clearDisplayLayer(dlayer.overlayLayer);
      clearDisplayLayer(dlayer.outlineLayer);
      playAudio(bpm);
}

function playAudio(bpm){
      if(bpm==undefined){bpm=120;}
      pos = 0;
      isPlaying = true;
      noteSchedule.setBPM(bpm);
      noteSchedule.play();
}

function stopAudio(){
      noteSchedule.stop();
      noteSchedule.clear();
      isPlaying = false;
      schTime = 0;
      pos = 0;
      notes = [];
      if(isContinuousPlayback){
            refreshBlocks();
            hardRefresh();
      }
}

function resetPlayback(){
      enableMouse();
      document.getElementById('playbtn').disabled = false;
      clearDisplayLayer(dlayer.mouseLayer);
      scrollDisplayTo(0);
      refreshCanvas();
}

function advanceSchTime(delta){
      var curNotes = notes[pos];
      if(curNotes != undefined){
            curNotes.forEach(function(n,i){
                  noteSchedule.addNote({value: n.note, instrument: n.instrument, time: schTime});
            });
      }
      /*if(pos >= endBound-ofsX){ // FIXME: Triggering incorrectly
            resetPlayback();
      }*/
      schTime += delta;
      pos++;
}

function scrollLevel(dx){
      scrollLevelByX(dx);
}