const KEY_A4 = 69;
const KEY_C4 = 60;
const KEY_F3 = 53;

const SAMPLE_RATE = 44100;
const MASTER_VOLUME = 0.20;

const RELEASE_POS = 12000;
const LONG_RELEASE_POS = 45500;
const RELEASE_DURATION = 6000;

var audioCtx = new (window.AudioContext || window.webkitAudioContext)(); // jshint ignore:line
var masterGainNode = audioCtx.createGain();
masterGainNode.gain.setValueAtTime(MASTER_VOLUME, 0);

var sourceNodes = [];

class NoteSchedule {
      constructor(){
            this.schedule = [];
            this.secondsPerBeat = 0.5;
            this.ppq = 2520;
            this.volume = 0.5;
            this.instruments = [];
      }
      setBPM(bpm){
            this.secondsPerBeat = 60/bpm;
      }
      addInstrument(index, url, options){
            let that = this;
            let baseNote = KEY_C4;
            let hasLongSustain = false;
            if(options.baseNote != undefined) baseNote = options.baseNote;
            if(options.hasLongSustain != undefined) hasLongSustain = options.hasLongSustain;
            return new Promise(async function(resolve,reject){
                  that.instruments[index] = new Instrument(await loadSample(url), baseNote);
                  that.instruments[index].hasLongSustain = hasLongSustain;
                  resolve();
            });
      }
      addNote(note){
            this.schedule.push( {instrument: note.instrument, value: note.value, ticks: note.time} );
      }
      play(){
            let that = this;
            this.schedule.forEach(function(thisNote){
                  that.instruments[thisNote.instrument].playNote(thisNote, that.ticksToSeconds(thisNote.ticks));
            });
      }
      stop(){
            sourceNodes.forEach(function(n,i){
                  n.stop(0);
            });
            sourceNodes = [];
      }
      clear(){
            this.schedule = [];
      }
      ticksToSeconds(ticks){
            return ( ticks / this.ppq ) * this.secondsPerBeat;
      }
}

class Instrument {
      constructor(buffer, baseNote){
            if(baseNote == undefined) baseNote = KEY_C4;
            this.buffer = buffer;
            this.baseNote = baseNote;
            this.noteBuffers = {};
            this.hasLongSustain = false;
            this.sourceNodes = [];
      }
      generateBufferForNote(note){
            let that = this;
            return new Promise(async function(resolve, reject){
                  let buffer = await renderBufferAtPlaybackRate(that.buffer, midiNoteToFreq(note)/midiNoteToFreq(that.baseNote));
                  let bufferData = buffer.getChannelData(0);
                  applyReleaseEnvelope(bufferData, that.hasLongSustain);
                  that.noteBuffers[note.toString()] = buffer;
                  resolve();
            });
      }
      playNote(note, time){
            //if(this.sourceNodes.length > 0) //this.sourceNodes[this.sourceNodes.length - 1].stop(time+8); // TODO: Support polyphony FIXME: Doesn't cut
            this.sourceNodes.push(playBuffer(this.noteBuffers[note.value], time));
      }
}

function loadSample(url){
      return new Promise(function(resolve, reject){
            var request = new XMLHttpRequest();
            request.open('GET',url,true);
            request.responseType = 'arraybuffer';
      
            request.onload = function(){
                  audioCtx.decodeAudioData(request.response, function(buffer){
                        resolve(buffer);
                  },function(){
                        console.error('Failed to decode '+url+'.');
                  });
            };
            request.send();
      });
}

function playBuffer(buffer, time){
      if(time == undefined) time = 0;

      var source = audioCtx.createBufferSource();
      source.buffer = buffer;

      source.connect(masterGainNode);
      masterGainNode.connect(audioCtx.destination);
      source.start(audioCtx.currentTime + time);
      sourceNodes.push(source);
      return source;
}

function midiNoteToFreq(note){
      return Math.pow(2, (note - KEY_A4) / 12) * 440;
}

async function renderBufferAtPlaybackRate(buffer, rate){
      let newDuration = buffer.duration / rate;
      let offlineCtx = new OfflineAudioContext(1, Math.ceil(newDuration * SAMPLE_RATE), SAMPLE_RATE);

      var source = offlineCtx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = rate;
      source.connect(offlineCtx.destination);
      source.start();

      let renderedBuffer = await offlineCtx.startRendering();
      return renderedBuffer;
}

function applyReleaseEnvelope(bufferData, hasLongSustain){
      let multiplier;
      let releasePos;
      if(hasLongSustain) releasePos = LONG_RELEASE_POS;
      else releasePos = RELEASE_POS;
      for(let i = releasePos; i < bufferData.length; i++){
            multiplier = 1.0 - ((i - releasePos) / RELEASE_DURATION);
            bufferData[i] *= Math.max(multiplier, 0);
      }
}