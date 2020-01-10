var currentInstrument = new Array(16).fill(0);
var ppos = 0;
var tpos = 0;
var runningStatus = null;
var trackDuration = 0;
var noteDelta = Array(16).fill(0);
var isNewTrack = true;
var currentLabel = 'Goomba'
var midiInstrumentNames = ['Acoustic Grand Piano', 'Bright Acoustic Piano', // Thank you to the person who already did this for me
'Electric Grand Piano', 'Honky-tonk Piano',
'Electric Piano 1', 'Electric Piano 2', 'Harpsichord',
'Clavinet', 'Celesta', 'Glockenspiel', 'Music Box',
'Vibraphone', 'Marimba', 'Xylophone', 'Tubular Bells',
'Dulcimer', 'Drawbar Organ', 'Percussive Organ',
'Rock Organ', 'Church Organ', 'Reed Organ', 'Accordion',
'Harmonica', 'Tango Accordion', 'Acoustic Guitar (nylon)',
'Acoustic Guitar (steel)', 'Electric Guitar (jazz)',
'Electric Guitar (clean)', 'Electric Guitar (muted)',
'Overdriven Guitar', 'Distortion Guitar',
'Guitar Harmonics', 'Acoustic Bass',
'Electric Bass (finger)', 'Electric Bass (pick)',
'Fretless Bass', 'Slap Bass 1', 'Slap Bass 2',
'Synth Bass 1', 'Synth Bass 2', 'Violin', 'Viola', 'Cello',
'Contrabass', 'Tremolo Strings', 'Pizzicato Strings',
'Orchestral Harp', 'Timpani', 'String Ensemble 1',
'String Ensemble 2', 'Synth Strings 1', 'Synth Strings 2',
'Choir Aahs', 'Voice Oohs', 'Synth Choir', 'Orchestra Hit',
'Trumpet', 'Trombone', 'Tuba', 'Muted Trumpet',
'French Horn', 'Brass Section', 'Synth Brass 1',
'Synth Brass 2', 'Soprano Sax', 'Alto Sax', 'Tenor Sax',
'Baritone Sax', 'Oboe', 'English Horn', 'Bassoon',
'Clarinet', 'Piccolo', 'Flute', 'Recorder', 'Pan Flute',
'Blown bottle', 'Shakuhachi', 'Whistle', 'Ocarina',
'Lead 1 (square)', 'Lead 2 (sawtooth)',
'Lead 3 (calliope)', 'Lead 4 chiff', 'Lead 5 (charang)',
'Lead 6 (voice)', 'Lead 7 (fifths)',
'Lead 8 (bass + lead)', 'Pad 1 (new age)', 'Pad 2 (warm)',
'Pad 3 (polysynth)', 'Pad 4 (choir)', 'Pad 5 (bowed)',
'Pad 6 (metallic)', 'Pad 7 (halo)', 'Pad 8 (sweep)',
'FX 1 (rain)', 'FX 2 (soundtrack)', 'FX 3 (crystal)',
'FX 4 (atmosphere)', 'FX 5 (brightness)', 'FX 6 (goblins)',
'FX 7 (echoes)', 'FX 8 (sci-fi)', 'Sitar', 'Banjo',
'Shamisen', 'Koto', 'Kalimba', 'Bagpipe', 'Fiddle',
'Shanai', 'Tinkle Bell', 'Agogo', 'Steel Drums',
'Woodblock', 'Taiko Drum', 'Melodic Tom', 'Synth Drum',
'Reverse Cymbal', 'Guitar Fret Noise', 'Breath Noise',
'Seashore', 'Bird Tweet', 'Telephone Ring', 'Helicopter',
'Applause', 'Gunshot'];

class MIDIfile{
      constructor(file){
            this.bytes = file;
            this.tracks = []; // Each track is filled with an array of events
            this.trkLabels = [];
            this.trkQuantizeErrors = [];
            this.hasNotes = [];
            this.error = 0;
            this.debug = 0;
            this.timingFormat = 0;
            this.timing = 0;
            this.duration = 0;
            this.noteCount = 0;
            this.blocksPerBeat = 1;
            this.precision = 3;
            this.usedInstruments = [];
            this.notes;
            this.firstBbar = 1;
            this.firstTempo = 0;
            currentInstrument = new Array(16).fill(0);
            ppos = 0;
            tpos = 0;
            runningStatus = null;
            trackDuration = 0;
            noteDelta = Array(16).fill(0);
            isNewTrack = true;
            currentLabel = 'Goomba'
            this.parse();
      }

      // Main parsing functions
      parse(){
            //console.log('Started parsing');
            this.parseHeader();
            this.notes = new Array(this.ntrks);
            var t0 = (new Date).getTime();
            for(tpos=0;tpos<this.ntrks;tpos++){
                  isNewTrack = true;
                  this.usedInstruments.push([]);
                  this.usedInstruments[tpos].push();
                  this.parseTrack();
                  //console.log(this.tracks[tpos]);
            }
            var lowestQuantizeError = Infinity;
            var bestBPB = 0;
            for(var i=0;i<16;i++){
                  var total = 0;
                  for(var j=0;j<this.tracks.length;j++){
                        total += this.trkQuantizeErrors[j][i];
                  }
                  // console.log('BPB: ' + (i+1) + ', error: ' + total);
                  if(total<lowestQuantizeError){
                        lowestQuantizeError = total;
                        bestBPB = i+1;
                  }
            }
            this.blocksPerBeat = bestBPB;
            console.log(this);
            if(this.error!=0){alert('The file was parsed unsuccessfully. Check the browser console for details.');}
            //console.log(this.noteCount+' notes');
            //console.log(this.notes);
            console.log('MIDI data loaded in '+((new Date).getTime() - t0)+' ms');
      }
      parseHeader(){
            if(this.parseString(4) == 'MThd'){/*console.log('MThd');*/}
            else{
                  console.log('ERROR: No MThd');
                  this.error = 1;
                  return;
            }
            if(this.fetchBytes(4)!=6){
                  console.log('ERROR: File header is not 6 bytes long.');
                  this.error = 2;
                  return;
            }
            this.fmt = this.fetchBytes(2);
            if(this.fmt > 2){
                  console.log('ERROR: Unrecognized format number.');
                  this.error = 3;
            }
            this.ntrks = this.fetchBytes(2);
            //console.log('Format '+this.fmt+', '+this.ntrks+' tracks');

            // Parse timing division
            var tdiv = this.fetchBytes(2);
            if(!(tdiv >> 16)){
                  //console.log(tdiv+' ticks per quarter note');
                  this.timing = tdiv;
            }
            else{
                  console.log('SMPTE timing format is unsupported.');
                  alert('SMPTE timing format is currently unsupported. Please give feedback if you see this message.');
                  this.timingFormat = 1;
                  return;
            }
      }
      parseTrack(){
            var done = false;
            if(this.parseString(4) != 'MTrk'){
                  console.log('ERROR: No MTrk');
                  this.error = 4;
                  return;
            }
            this.tracks.push([]);
            this.notes[tpos] = [];
            this.trkQuantizeErrors[tpos] = new Array(16).fill(0);
            var len = this.fetchBytes(4);
            //console.log('len = '+len);
            while(!done){
                  done = this.parseEvent();
            }
            this.trkLabels.push(this.labelCurrentTrack());
            //console.log('Track '+tpos);
            //console.log(this.tracks[tpos]);
            //console.log(trackDuration);
            if(trackDuration > this.duration){this.duration = trackDuration;}
            trackDuration = 0;
            noteDelta.fill(0);
      }
      parseEvent(){
            var delta = this.parseDeltaTime();
            trackDuration += delta;
            var statusByte = this.fetchBytes(1);
            var data = [];
            var rs = false;
            var EOT = false;
            if(statusByte<128){ // Running status
                  data.push(statusByte);
                  statusByte = runningStatus;
                  rs = true;
            }
            else{
                  runningStatus = statusByte;
            }
            var eventType = statusByte >> 4;
            var channel = statusByte & 0x0F;
            if(eventType == 0xF){ // System events and meta events 
                  switch(channel){ // System message types are stored in the last nibble instead of a channel
                        // Don't really need these and probably nobody uses them but we'll keep them for completeness.

                        case 0x0: // System exclusive message -- wait for exit sequence
                              //console.log('sysex');
                              var cbyte = this.fetchBytes(1);
                              while(cbyte!=247){
                                    data.push(cbyte);
                                    cbyte = this.fetchBytes(1);
                              }
                        break;

                        case 0x2:
                              data.push(this.fetchBytes(1));
                              data.push(this.fetchBytes(1));
                              break;

                        case 0x3:
                              data.push(this.fetchBytes(1));
                              break;

                        case 0xF: // Meta events: where some actually important non-music stuff happens
                              var metaType = this.fetchBytes(1);
                              var i;
                              switch(metaType){
                                    case 0x2F: // End of track
                                          this.skip(1);
                                          EOT = true;
                                          //console.log('EOT');
                                          break;

                                    case 0x51:
                                          var len = this.fetchBytes(1);
                                          data.push(this.fetchBytes(len)); // All one value
                                          if(this.firstTempo == 0){this.firstTempo = data[0];}
                                          break;
                                    case 0x58:
                                          var len = this.fetchBytes(1);
                                          for(i=0;i<len;i++){
                                                data.push(this.fetchBytes(1));
                                          }
                                          if(this.firstBbar == 0){this.firstBbar = data[0]/Math.pow(2,data[1]);}
                                          break;
                                    default:
                                          var len = this.fetchBytes(1);
                                          //console.log('Mlen = '+len);
                                          for(i=0;i<len;i++){
                                                data.push(this.fetchBytes(1));
                                          }
                              }
                              eventType = getIntFromBytes([255,metaType]);
                  }
                  if(channel!=15){eventType = statusByte;}
                  channel = -1; // global
            }
            else{
                  switch(eventType){
                        case 0x9:
                              if(!rs){data.push(this.fetchBytes(1));}
                              data.push(this.fetchBytes(1));
                              var note = new Note(trackDuration,data[0],data[1],currentInstrument[channel],channel)
                              this.notes[tpos].push(note);
                              // TODO: When a new instrument is found, push a new track in the event and notes array, then copy events and notes there instead of in this track
                              if(notInArr(this.usedInstruments[tpos],currentInstrument[channel])){this.usedInstruments[tpos].push(currentInstrument[channel]);}
                              break;
                        case 0xC:
                              if(!rs){data.push(this.fetchBytes(1));}
                              //console.log(tpos+': '+data[0]);
                              currentLabel = getInstrumentLabel(data[0]);
                              // The last instrument on a channel ends where an instrument on the same channel begins
                              //this.usedInstruments[tpos].push({ins: data[0], ch: channel, start: trackDuration});
                              //if(notInArr(this.usedInstruments,data[0])){this.usedInstruments.push(data[0])} // Do this for now
                              currentInstrument[channel] = data[0];
                              break;
                        case 0xD:
                              if(!rs){data.push(this.fetchBytes(1));}
                              break;
                        default:
                              if(!rs){data.push(this.fetchBytes(1));}
                              data.push(this.fetchBytes(1));
                  }
                  var i;
                  for(i=0;i<noteDelta.length;i++){
                        noteDelta[i] += delta;
                  }
                  if(eventType==0x9 && data[1]!=0){
                        this.hasNotes[tpos] = true;
                        var bpbStuff = getThisBPB(noteDelta[channel],this.timing);
                    
                        // console.log(bpbStuff);
                        for(var i=1;i<=16;i++){
                              var x = i*noteDelta[channel]/this.timing;
                              var roundX = Math.round(x);
                              // console.log("Rounded by: " + roundX-x);
                              this.trkQuantizeErrors[tpos][i-1] += Math.abs(roundX-x);
                        }
                        noteDelta[channel] = 0;
                        this.noteCount++;
                  }
            }
            this.tracks[tpos].push(new MIDIevent(delta,eventType,channel,data));
            //console.log('+'+delta+': '+eventType+' @'+channel);
            //console.log(data);
            //this.debug++;
            if(this.debug>0){return true;}
            return EOT;//|| this.debug>=4;
      }

      // Helper parsing functions
      fetchBytes(n){
            var i;
            var byteArr = [];
            for(i=0;i<n;i++){
                  byteArr[i] = this.bytes[ppos+i];
            }
            ppos += n;
            if(n==1){return byteArr[0];}
            else{return getIntFromBytes(byteArr);}
      }
      parseString(n){
            var i;
            var str = '';
            for(i=0;i<n;i++){
                  str += ASCII(this.bytes[ppos+i]);
            }
            ppos += n;
            return str;
      }
      parseDeltaTime(){
            var reading = true;
            var arr = [];
            var nbytes = 0;
            while(reading){
                  nbytes++;
                  if(nbytes>4){
                        console.log('Something is very wrong here.');
                        console.log(this.tracks[tpos]);
                        this.debug = 1;
                        break;
                  }
                  var byte = this.fetchBytes(1);
                  if(byte<128){
                        reading = false;
                        arr.push(byte);
                  }
                  else{
                        arr.push(byte-128);
                  }
            }
            return getIntFromBytes(arr,7);
      }
      skip(n){
            ppos += n;
      }
      labelCurrentTrack(){
            var labl = 'empty';
            if(this.usedInstruments[tpos].length == 1){
                  labl = getInstrumentLabel(this.usedInstruments[tpos][0]);
            }
            else if(this.usedInstruments[tpos].length > 1){
                  labl = 'Mixed Track';
            }
            this.trkLabels[tpos] = labl+' '+this.getLabelNumber(labl);
      }
      getLabelNumber(label){ // Check for duplicates
            var iteration = 0;
            var pass = false;
            while(!pass){
                  iteration++;
                  pass = true;
                  var thisLabel = label+' '+iteration.toString();
                  //console.log(thisLabel);
                  var i = 0;
                  for(i=0;i<this.trkLabels.length;i++){
                        if(thisLabel == this.trkLabels[i]){pass = false;}
                  }
            }
            return iteration;
      }
}

class MIDIevent{
      constructor(deltaTime, type, channel, data){
            this.deltaTime = deltaTime;
            this.type = type;
            this.channel = channel; // -1 means global event, such as meta or sysex
            this.data = data; // An array of the parameters
      }
}

class Note{
      constructor(time, pitch, volume, instrument, channel){
            this.time = time;
            this.pitch = pitch;
            this.volume = volume;
            this.originalInstrument = instrument;
            this.instrument = instrument;
            this.channel = channel;
      }
}

var recurse = 0;

function ASCII(n){
      return String.fromCharCode(n);
}

function arrToASCII(arr){
      var i;
      var str = '';
      for(i=0;i<arr.length;i++){
            str += ASCII(arr[i]);
      }
      return str;
}

function getIntFromBytes(arr,pad){ // Gets an integer value from an arbitrary number of bytes
      if(pad==undefined){pad=8;}
      var n = 0;
      var i;
      for(i=0;i<arr.length;i++){
            n = n << pad | arr[i]
      }
      return n;
}

function getThisBPB(delta,qnTime){
      if(delta==0){return 1;}
      //console.log(delta/qnTime);
      var i;
      for(i=1;i<=16;i++){
            var quotient = i*delta/qnTime;
            //console.log(quotient);
            if(Math.floor(quotient)==quotient){ // Recursion until the quotient becomes a whole number
                  //console.log('Y '+(delta/qnTime)+' -> '+i);
                  return {bpb: i, prc: i+1};
            }
      }
      //console.log(delta+' / '+qnTime+' = '+(delta/qnTime)+' WEIRD');
      //console.log('Rounded to '+Math.round(quotient/blocksPerBeat)*blocksPerBeat);
      return {bpb: 4, prc: 0}; // Give up
}

function getInstrumentLabel(program){ // Return a label name for the track based on the instrument
      program++;
      if(program<=8){return 'Goomba';} // Piano
      if(program>=9 && program<=16){return 'Shellmet';} // Chromatic Percussion
      if(program>=17 && program<=24){return '1-Up';} // Organ
      if(program>=25 && program<=32){return 'Spike Top';} // Guitar
      if(program>=33 && program<=40){return 'Sledge Bro';} // Bass
      if(program>=41 && program<=48){return 'Piranha Plant';} // Strings
      if(program>=49 && program<=56){return 'Bob-Omb';} // Ensemble
      if(program>=57 && program<=72){return 'Spiny Shellmet';} // Brass, Lead
      if(program>=73 && program<=80){return 'Dry Bones Shell';} // Pipe
      if(program>=81 && program<=88){return 'Mushroom';} // Synth Lead
      if(program>=89 && program<=96){return 'Rotten Mushroom';} // Synth Pad
      if(program>=97 && program<=104){return 'Green No-Shell Koopa';} // Synth Effects
      if(program>=105 && program<=112){return 'Monty Mole';} // Ethnic
      if(program>=113 && program<=120){return 'P-Switch';} // Percussive
      if(program>=121 && program<=128){return 'Red No-Shell Koopa';} // Sound Effects
      
      return 'Unintentional Goomba'; // You should not see this in regular use
}

function notInArr(arr,n){
      var i;
      for(i=0;i<arr.length;i++){
            if(arr[i] == n){return false;}
      }
      return true;
}

function getMidiInstrumentName(n){
      return midiInstrumentNames[n];
}

// https://www.cs.cmu.edu/~music/cmsip/readings/Standard-MIDI-file-format-updated.pdf