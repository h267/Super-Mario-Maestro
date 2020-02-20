const insPlayData = [
      {file: 'goomba'},
      {file: 'shellmet'},
      {file: '1up'},
      {file: 'spiketop'},
      {file: 'sledgebro'},
      {file: 'piranha'},
      {file: 'bobomb'},
      {file: 'spikedshellmet'},
      {file: 'drybones'},
      {file: 'shroom'},
      {file: 'rottenshroom'},
      {file: 'bark'},
      {file: 'mole'},
      {file: 'pswitch'},
      {file: 'zuls'},
      {file: 'bigshroom'},
      {file: 'blaster'},
      {file: 'boot'},
      {file: 'stiletto'},
      {file: 'cannon'},
      {file: 'chomp'},
      {file: 'post'},
      {file: 'coin'},
      {file: 'fireplant'},
      {file: 'flower'},
      {file: 'goombrat'},
      {file: 'greenkoopa'},
      {file: 'redkoopa'},
      {file: 'hammerbro'},
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
      {file: 'toad', baseNote: 'C4'}
];
const defaultInsPlayData = {file: 'goomba', baseNote: 'F3', volumeOffset: 0};
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

var restrictPitchRange = false; // Make this var so Hermit can change it with his epic hacking skillz

Tone.Transport.PPQ = 2520;

loadInstruments();

// TODO: Import new sounds

function loadInstruments(){
      insPlayData.forEach(function(n,i){
            var vol = masterVolume;
            if(n.volumeOffset != undefined) vol += n.volumeOffset;
            var thisSampler = new Tone.Sampler({'F3':'./wav/'+n.file+'.wav'},function(){
                  thisSampler.toMaster();
                  thisSampler.volume.value = vol;
                  thisSampler.curve = 'linear';
                  thisSampler.label = n.file;
                  samplers[i] = thisSampler;
            });
      });
}

async function playLvl(level,bpm,blocksPerBeat,ofsX,ofsY){
      stopAudio();
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
                  notes[thisNote.x - ofsX].push({note: noteNumToStr(yPos - (ofsY - baseOfsY)), instrument: getMM2Instrument(thisNote.instrument)-2});
            }
      }
      while(pos < endBound-marginWidth+1){
            advanceSchTime(2520/blocksPerBeat);
      }
      playAudio(bpm);
}

async function playMap(midi,level,bpm,blocksPerBeat,ofsX,ofsY){
      stopAudio();
      var trks = midi.trks;
      endBound = Math.floor((midi.duration/midi.timing)*blocksPerBeat);
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
                  // FIXME: Changing BPB breaks x-ofsX
                  notes[x - ofsX].push({note: noteNumToStr(yPos - (ofsY - baseOfsY)), instrument: getMM2Instrument(thisNote.instrument)-2});
            }
      }
      while(pos < endBound){
            advanceSchTimeCont(2520/blocksPerBeat);
      }
      playAudio(bpm);
}

function playAudio(bpm){
      if(bpm==undefined){bpm=120;}
      pos = 0;
      isPlaying = true;
      Tone.Transport.bpm.value = Math.round(bpm);
      Tone.Transport.start('+0.05');
}

function stopAudio(){
      Tone.Transport.stop();
      Tone.Transport.cancel();
      isPlaying = false;
      schTime = 0;
      pos = 0;
      notes = [];
}

function resetPlayback(){
      enableMouse();
      document.getElementById('playbtn').disabled = false;
      clearDisplayLayer(dlayer.mouseLayer);
      scrollDisplayTo(0);
      refreshCanvas();
}

function advanceSchTime(delta){
      Tone.Transport.schedule(function(time){
            var curNotes = notes[pos];
            clearDisplayLayer(dlayer.mouseLayer);
            highlightCol(pos+27,'rgba(255,0,0,0.5)');
            scrollDisplayTo(pos*16);
            refreshCanvas();
            if(curNotes != undefined){playNotes(curNotes);}
            if(pos >= endBound-marginWidth){
                  resetPlayback();
            }
            pos++;
      }, Math.round(schTime).toString()+'i');
      schTime += delta;
      pos++;
}

function advanceSchTimeCont(delta){
      Tone.Transport.schedule(function(time){
            var curNotes = notes[pos];
            clearDisplayLayer(dlayer.mouseLayer);
            highlightCol(27,'rgba(255,0,0,0.5)');
            //scrollDisplayTo(pos*16);
            scrollLevel(1);
            //refreshCanvas();
            if(curNotes != undefined){playNotes(curNotes);}
            if(pos >= endBound-marginWidth){
                  resetPlayback();
            }
            pos++;
      }, Math.round(schTime).toString()+'i');
      schTime += delta;
      pos++;
}

function noteNumToStr(n){
      var octave = Math.floor(n/12)-1;
      var key = n%12;
      switch(key){
            case 0: return 'C'+octave;
            case 1: return 'C#'+octave;
            case 2: return 'D'+octave;
            case 3: return 'D#'+octave;
            case 4: return 'E'+octave;
            case 5: return 'F'+octave;
            case 6: return 'F#'+octave;
            case 7: return 'G'+octave;
            case 8: return 'G#'+octave;
            case 9: return 'A'+octave;
            case 10: return 'A#'+octave;
            case 11: return 'B'+octave;
      }
}

function playNotes(curNotes){
      var i;
      for(i=0;i<curNotes.length;i++){
            samplers[curNotes[i].instrument].triggerAttackRelease(curNotes[i].note,'4n');
      }
}

function scrollLevel(dx){
      scrollByX(dx);
}