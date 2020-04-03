const KEY_A4 = 69;
const KEY_C4 = 60;
const KEY_F3 = 53;

const SAMPLE_RATE = 44100;
const MASTER_VOLUME = 0.15;

const RELEASE_POS = Math.round(12000/44100 * SAMPLE_RATE);
const LONG_RELEASE_POS = Math.round(45500/44100 * SAMPLE_RATE);
const RELEASE_DURATION = Math.round(6000/44100 * SAMPLE_RATE);

const PPQ = 2520;

const LOAD_DELAY = 0.5;

const LOAD_SIZE = 0.5;

var audioCtx = new (window.AudioContext || window.webkitAudioContext)(); // jshint ignore:line

/**
 * A class for playing back a sequence of scheduled notes.
 */
class NoteSchedule {
      /**
       * Initializes the NoteSchedule object.
       * @constructor
       */
      constructor(){
            this.schedule = [];
            this.secondsPerBeat = 0.5;
            this.ppq = PPQ;
            this.volume = 0.5;
            this.instruments = [];
            this.audioSchedule = [];
            this.audioScheduleIndex = 0;
            this.audioScheduleTime = 0;
            this.audioScheduleInterval = null;
            this.audioScheduleStartTime = null;
            this.isPlaying = false;
            this.playbackNode = null;
            this.renderingCtx = null;
      }

      /**
       * Sets the tempo of playback.
       * @param {number} bpm The tempo, in beats per minute.
       */
      setBPM(bpm){
            this.secondsPerBeat = 60/bpm;
      }

      /**
       * Adds an instrument to the list of instruments.
       * @param {number} index Which array index in the instrument list to insert the instrument in.
       * @param {string} url The local file location of the sound sample to be used.
       * @param {Object} options Other options:
       * * baseNote: The MIDI note that the input sample is pitched at. The default is 60, or Middle C.
       * * hasLongSustain: If the note plays longer than most others. This option is reserved for the small subset of sustained instruments in MM2.
       */
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

      /**
       * Adds a note to the list of scheduled notes. Notes need to be added in chronological order to work properly.
       * @param {Object} note An object describing the basic features of the note:
       * * instrument: The ID of the instrument stored in this NoteSchedule.
       * * value: The MIDI pitch of the note.
       * * ticks: The time that the note is played.
       */
      addNote(note){
            this.schedule.push( {instrument: note.instrument, value: note.value, ticks: note.time} );
      }

      /**
       * Stops playback and cancels all scheduled notes.
       */
      stop(){
            this.isPlaying = false;
            clearInterval(this.audioScheduleInterval);
            this.audioScheduleIndex = 0;
            if(this.playbackNode != null) this.playbackNode.stop();
      }

      /**
       * Pre-renders and plays the notes in the schedule.
       * @returns {Promise} A Promise that resolves when rendering has completed.
       */
      playPrerender(){
            let that = this;
            return new Promise(async function(resolve, reject){
                  let buffer = await that.render(); // To monitor progress, see https://github.com/WebAudio/web-audio-api/issues/302#issuecomment-310829366
                  resolve();
                  var source = audioCtx.createBufferSource();
                  that.playbackNode = source;
                  source.buffer = buffer;
                  source.connect(audioCtx.destination);
                  source.start();
            });
      }

      /**
       * Renders the notes in the schedule to an audio buffer.
       * @returns {Promise<AudioBuffer>} A Promise holding the rendered audio buffer.
       */
      async render(){
            let offlineCtx = new OfflineAudioContext(1, Math.ceil((this.ticksToSeconds(this.schedule[this.schedule.length-1].ticks) + 2) * SAMPLE_RATE), SAMPLE_RATE);
            this.renderingCtx = offlineCtx;
            let that = this;

            this.schedule.forEach(function(thisNote, idx){ // Second pass; play back each note at the correct duration
                  let time = that.ticksToSeconds(thisNote.ticks);
                  let inst = thisNote.instrument;
                  //that.audioSchedule.push({inst: inst, pitch: thisNote.value, time: time, duration: 1});
                  that.instruments[inst].playNote(thisNote.value, time, 1, offlineCtx);
            });

            let renderedBuffer = await offlineCtx.startRendering();
            return renderedBuffer;
      }

      /**
       * Cancels the audio rendering process.
       */
      cancelRender(){
            this.renderingCtx.suspend();
            setPlaybackWaitStatus(false);
      }

      /**
       * Clears the schedule of all notes.
       */
      clear(){
            this.schedule = [];
      }

      /**
       * Converts a duration in playback ticks to seconds.
       * @param {number} ticks The number of playback ticks.
       * @returns {number} The equivalent number of seconds.
       */
      ticksToSeconds(ticks){
            return ( ticks / this.ppq ) * this.secondsPerBeat;
      }
}

/**
 * A class responsible for playing notes and holding instrument-specific playback data.
 */
class Instrument {
      /**
       * Initializes an Instrument object.
       * @param {AudioBuffer} buffer An AudioBuffer object of the loaded sample.
       * @param {number} baseNote The MIDI pitch that the buffer is tuned to.
       * @constructor
       */
      constructor(buffer, baseNote){
            if(baseNote == undefined) baseNote = KEY_C4;
            this.buffer = buffer;
            this.baseNote = baseNote;
            this.noteBuffers = {};
            this.hasLongSustain = false;
      }

      /**
       * Generates an AudioBuffer for a specific note to be played.
       * @param {number} note The MIDI pitch of the note to be generated.
       * @returns {Promise} A Promise showing the status of the asynchronous operation.
       */
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

      /**
       * Plays a note at a certain time.
       * @param {number} note The MIDI pitch of the note to be played.
       * @param {number} time The time, in seconds, when the note should be played.
       * @param {number} duration The time, in seconds, that a note can play before being terminated.
       * @param {AudioContext} ctx The AudioContext object to play the sound through. (Optional)
       */
      playNote(note, time, duration, ctx){
            if(ctx == undefined) ctx = audioCtx;
            playBuffer(this.noteBuffers[note], time, duration, ctx);
      }
}

/**
 * Loads the data from an audio file into an AudioBuffer object.
 * @param {string} url The local file location of the audio data to load.
 * @returns {Promise<AudioBuffer>} A Promise containing the loaded audio data as an AudioBuffer object.
 */
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

/**
 * Plays the audio in an AudioBuffer.
 * @param {AudioBuffer} buffer The AudioBuffer to play.
 * @param {number} time The amount of time, in seconds, before the note is to be played.
 * @param {number} duration The amount of time, in seconds, that a note can play before being terminated.
 * @param {AudioContext} ctx The AudioContext to play the sound through. (Optional)
 * @returns {AudioBufferSourceNode} The AudioBufferSourceNode that controls this note's playback.
 */
function playBuffer(buffer, time, duration, ctx){
      if(time == undefined) time = 0;
      if(ctx == undefined) ctx = audioCtx;

      var curTime =  0; //audioCtx.currentTime;
      var source = ctx.createBufferSource();
      source.buffer = buffer;
      var gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(MASTER_VOLUME, 0); // Prevent Firefox bug
      //if(!isNaN(duration)) gainNode.gain.setTargetAtTime(0, curTime + time + duration, 0.4);
      //gainNode.gain.setValueAtTime(0, curTime + time + 0.1);

      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      if(isNaN(duration) || duration == 0) source.start(curTime + time);
      else source.start(curTime + time, 0);
      return source;
}

/**
 * Converts a MIDI note to a frequency in Hertz.
 * @param {number} note The MIDI note number.
 * @returns {number} The equivalent frequency of the note.
 */
function midiNoteToFreq(note){
      return Math.pow(2, (note - KEY_A4) / 12) * 440;
}

/**
 * Renders an AudioBuffer of an input AudioBuffer played at a specified playback speed.
 * @param {AudioBuffer} buffer The AudioBuffer to render at a different speed.
 * @param {number} rate The playback speed for the original sample to be rendered at.
 * @returns {AudioBuffer} An AudioBuffer of the input buffer being played at the speed.
 */
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

/**
 * Modifies the audio samples in an AudioBuffer to have a linear release envelope.
 * @param {number[]} bufferData A Float32 array of raw audio samples obtained from an AudioBuffer.
 * @param {boolean} hasLongSustain If the note should be played longer than usual.
 */
function applyReleaseEnvelope(bufferData, hasLongSustain){
      let multiplier;
      let releasePos;
      /*if(hasLongSustain) releasePos = LONG_RELEASE_POS;
      else*/ releasePos = RELEASE_POS;
      for(let i = releasePos; i < bufferData.length; i++){
            multiplier = 1.0 - ((i - releasePos) / RELEASE_DURATION);
            bufferData[i] *= Math.max(multiplier, 0);
      }
}