const KEY_A4 = 69;
const KEY_C4 = 60;
const KEY_F3 = 53;

const SAMPLE_RATE = 44100;
const MASTER_VOLUME = 0.20;

const RELEASE_POS = 12000;
const LONG_RELEASE_POS = 45500;
const RELEASE_DURATION = 6000;

const PPQ = 2520;

var audioCtx = new (window.AudioContext || window.webkitAudioContext)(); // jshint ignore:line

var sourceNodes = [];

// TODO: Possibly offline rendering if lag once again becomes an issue

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
       * Adds a note to the list of scheduled notes.
       * @param {Object} note An object describing the basic features of the note:
       * * instrument: The ID of the instrument stored in this NoteSchedule.
       * * value: The MIDI pitch of the note.
       * * ticks: The time that the note is played.
       */
      addNote(note){
            this.schedule.push( {instrument: note.instrument, value: note.value, ticks: note.time} );
      }
      /**
       * Schedules and plays back the sequence of note using the correct instruments
       */
      play(){ // TODO: setTimeout scheduling routine (see https://www.html5rocks.com/en/tutorials/audio/scheduling/)
            console.table(this.schedule);
            let that = this;
            let noteTimes = [];
            let ndx = [];
            this.instruments.forEach(function(n,i){ // Keep track of all of the notes for each instrument
                  noteTimes[i] = [];
                  ndx[i] = 0;
            });
            this.schedule.forEach(function(thisNote){ // First pass; get the time of every note
                  noteTimes[thisNote.instrument].push(that.ticksToSeconds(thisNote.ticks));
            });
            this.schedule.forEach(function(thisNote){ // Second pass; play back each note at the correct duration
                  let time = that.ticksToSeconds(thisNote.ticks);
                  let inst = thisNote.instrument;
                  that.instruments[inst].playNote(thisNote.value, time, noteTimes[inst][ndx[inst]+1] - noteTimes[inst][ndx[inst]]);
                  ndx[inst]++;
            });
      }

      /**
       * Stops playback and cancels all scheduled notes.
       */
      stop(){
            sourceNodes.forEach(function(n,i){
                  n.stop(0);
            });
            sourceNodes = [];
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
            this.sourceNodes = [];
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
       */
      playNote(note, time, duration){
            this.sourceNodes.push(playBuffer(this.noteBuffers[note], time, duration));
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
 * @returns {AudioBufferSourceNode} The AudioBufferSourceNode that controls this note's playback.
 */
function playBuffer(buffer, time, duration){
      if(time == undefined) time = 0;

      var curTime = audioCtx.currentTime;
      var source = audioCtx.createBufferSource();
      source.buffer = buffer;
      var gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(MASTER_VOLUME, 0); // Prevent Firefox bug
      if(!isNaN(duration)) gainNode.gain.setTargetAtTime(0, curTime + time + duration, 0.4);
      //gainNode.gain.setValueAtTime(0, curTime + time + 0.1);

      source.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      if(isNaN(duration) || duration == 0) source.start(curTime + time); // TODO: Keep track of polyphonic notes and give them proper durations
      else source.start(curTime + time, 0);
      sourceNodes.push(source);
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
      if(hasLongSustain) releasePos = LONG_RELEASE_POS;
      else releasePos = RELEASE_POS;
      for(let i = releasePos; i < bufferData.length; i++){
            multiplier = 1.0 - ((i - releasePos) / RELEASE_DURATION);
            bufferData[i] *= Math.max(multiplier, 0);
      }
}