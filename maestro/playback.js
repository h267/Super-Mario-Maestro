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
const polyphonyCap = 2;

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

var restrictPitchRange = true; // Just change 3 lines of code Hermit smh my head

/**
 * Loads all of the instrument sound samples into new instruments for the noteSchedule object.
 * @returns {Promise[]} An array of Promises showing the status of each asynchronous file load.
 */
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
      });
      return Promise.all(promises);
}

/**
 * Prepares the level for playback, then triggers playback.
 * @param {MIDIfile} midi The MIDIfile object holding all of the note data.
 * @param {Level} level The level object holding all of the level data.
 * @param {number} bpm The tempo to play the music at, in beats per minute.
 * @param {number} blocksPerBeat The number of blocks or tiles in every beat.
 * @param {number} ofsX The x-coordinate at which playback is to begin.
 * @param {number} ofsY The y-coordinate that dictates vertical displacement.
 */
async function playLvl(midi,level,bpm,blocksPerBeat,ofsX,ofsY){
      stopAudio();
      schTime = 0;
      isContinuousPlayback = false;
      endBound = level.width;
      framesPerColumn = 1/(blocksPerBeat*bpm/3600);
      var i;
      var j;
      notes = [];
      let noteCount = [];
      for(i=0;i<endBound;i++){
            notes[i] = [];
            noteCount[i] = {};
      }
      for(i=0;i<level.noteGroups.length;i++){
            if(!level.noteGroups[i].isVisible) continue;
            for(j=0;j<level.noteGroups[i].notes.length;j++){
                  let thisNote = level.noteGroups[i].notes[j];
                  let yPos = thisNote.pitch + level.noteGroups[i].ofsY;
                  if((yPos < ofsY || yPos >= ofsY+levelHeight-1) && restrictPitchRange) continue;
                  let pitch = yPos - (ofsY - baseOfsY);
                  let xPos = thisNote.x - ofsX;
                  if(noteCount[xPos][pitch] <= polyphonyCap || noteCount[xPos][pitch] == undefined){ // Prevent things from getting too loud
                        notes[xPos].push({note: pitch, instrument: getMM2Instrument(thisNote.instrument)-2});
                        if(noteCount[xPos][pitch] == undefined) noteCount[xPos][pitch] = 1;
                        else noteCount[xPos][pitch]++;
                  }
            }
      }
      while(pos < endBound-marginWidth+1){
            advanceSchTime(PPQ/blocksPerBeat);
      }
      prerenderAndPlay(bpm, blocksPerBeat, Math.min(levelWidth, level.maxWidth), false);
}

/**
 * Prepares the whole MIDI for playback, then triggers playback for the whole song.
 */
async function playMap(midi,level,bpm,blocksPerBeat,ofsX,ofsY){
      stopAudio();
      schTime = 0;
      isContinuousPlayback = true;
      endBound = mapWidth;
      framesPerColumn = 1/(blocksPerBeat*bpm/3600);
      notes = [];
      let noteCount = [];
      for(i=0;i<endBound;i++){
            notes[i] = [];
            noteCount[i] = {};
      }
      for(i=0;i<level.noteGroups.length;i++){
            if(!level.noteGroups[i].isVisible) continue;
            for(j=0;j<midi.trks[i].notes.length;j++){ // TODO: Can binary search for the starting bound
                  let thisNote = midi.trks[i].notes[j];
                  let yPos = thisNote.pitch + level.noteGroups[i].ofsY;
                  if((yPos < ofsY || yPos >= ofsY+levelHeight-1) && restrictPitchRange) continue;
                  let pitch = yPos - (ofsY - baseOfsY);
                  let xPos = Math.round(ticksToBlocks(thisNote.time)) - ofsX;
                  if(xPos < 0) continue;
                  if(noteCount[xPos][pitch] <= polyphonyCap || noteCount[xPos][pitch] == undefined){ // Prevent things from getting too loud
                        notes[xPos].push({note: pitch, instrument: getMM2Instrument(thisNote.instrument)-2});
                        if(noteCount[xPos][pitch] == undefined) noteCount[xPos][pitch] = 1;
                        else noteCount[xPos][pitch]++;
                  }
            }
      }
      while(pos <= endBound){
            advanceSchTime(PPQ/blocksPerBeat);
      }
      clearDisplayLayer(dlayer.overlayLayer);
      clearDisplayLayer(dlayer.outlineLayer);
      prerenderAndPlay(bpm, blocksPerBeat, endBound, true);
}

/**
 * Plays a preview of how the notes in the level would sound in-game.
 * @param {number} bpm The tempo to play the music at, in beats per minute.
 * @param {number} bpb The number of blocks or tiles in every beat.
 * @param {number} maxX The maximum scrolling position of playback.
 * @param {boolean} isContinuousPlayback If the entire MIDI is to be played instead of just the visible level.
 */
function playAudio(bpm, bpb, maxX, isContinuousPlayback){
      if(bpm==undefined){bpm=120;}
      pos = 0;
      isPlaying = true;
      noteSchedule.setBPM(bpm);
      noteSchedule.play();
      if(isContinuousPlayback) animateContinuousPlayback(bpm * bpb / 3600, LOAD_DELAY);
      else animatePlayback(bpm * bpb / 3600, maxX + marginWidth + 2, LOAD_DELAY);
}

/**
* Renders and plays a preview of how the notes in the level would sound in-game.
* @param {number} bpm The tempo to play the music at, in beats per minute.
* @param {number} bpb The number of blocks or tiles in every beat.
* @param {number} maxX The maximum scrolling position of playback.
* @param {boolean} isContinuousPlayback If the entire MIDI is to be played instead of just the visible level.
*/
function prerenderAndPlay(bpm, bpb, maxX, isContinuousPlayback){
     if(bpm==undefined){bpm=120;}
     pos = 0;
     isPlaying = true;
     noteSchedule.setBPM(bpm);
     setPlaybackWaitStatus(true);
     noteSchedule.playPrerender().then(() => {
            setPlaybackWaitStatus(false);
            if(isContinuousPlayback) animateContinuousPlayback(bpm * bpb / 3600, 0);
            else animatePlayback(bpm * bpb / 3600, maxX + marginWidth + 2, 0);
     });
}

/**
 * Stops the playback preview.
 */
function stopAudio(){
      if(isAnimating) return;
      noteSchedule.stop();
      noteSchedule.clear();
      stopPlaybackAnimation();
      isPlaying = false;
      schTime = 0;
      pos = 0;
      notes = [];
      if(isContinuousPlayback){
            refreshBlocks();
            hardRefresh();
      }
}

/**
 * Resets the UI to its non-playback state.
 */
function resetPlayback(){
      enableMouse();
      document.getElementById('playbtn').disabled = false;
      clearDisplayLayer(dlayer.mouseLayer);
      scrollDisplayTo(0);
      refreshCanvas();
}

/**
 * Advance the time to schedule notes at in the noteSchedule.
 * @param {number} delta The number of playback ticks to schedule the next notes at.
 */
function advanceSchTime(delta){
      var curNotes = notes[pos];
      if(curNotes != undefined){
            curNotes.forEach(function(n,i){
                  noteSchedule.addNote({value: n.note, instrument: n.instrument, time: schTime});
            });
      }
      schTime += delta;
      pos++;
}

/**
 * Scroll the x-offset of the entire level, moving the file scrubber and rendering region.
 * @param {number} dx The amount of scrolling to perform in the horizontal direction, in whole tile increments.
 */
function scrollLevel(dx){
      scrollLevelByX(dx);
}