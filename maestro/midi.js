var currentInstrument = new Array(16).fill(0);
var ppos = 0;
var tpos = 0;
var runningStatus = null;
var trackDuration = 0;
var noteDelta = Array(16).fill(0);
var isNewTrack = true;
var currentLabel = 'Goomba'

class MIDIfile{
      constructor(file){
            this.bytes = file;
            this.tracks = []; // Each track is filled with an array of events
            this.trkLabels = [];
            this.hasNotes = [];
            this.error = 0;
            this.debug = 0;
            this.timingFormat = 0;
            this.timing = 0;
            this.duration = 0;
            this.noteCount = 0;
            this.resolution = 1; // The smallest present unit of a note/rest is expressed as being 1/resolution quarter notes long.
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
            for(tpos=0;tpos<this.ntrks;tpos++){
                  isNewTrack = true;
                  this.usedInstruments.push([]);
                  this.usedInstruments[tpos].push();
                  this.parseTrack();
                  //console.log(this.tracks[tpos]);
            }
            console.log(this);
            if(this.error!=0){alert('The file was parsed unsuccessfully. Check the browser console for details.');}
            //console.log(this.noteCount+' notes');
            //console.log(this.notes);
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
            this.trkLabels.push('empty'); // Not intended to be seen in use
            var len = this.fetchBytes(4);
            //console.log('len = '+len);
            while(!done){
                  done = this.parseEvent();
            }
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
                              if(isNewTrack){ // Only properly label tracks with notes in them
                                    this.trkLabels[tpos] = currentLabel+' '+this.getLabelNumber(currentLabel); // TODO: Redo now that instrument detection is a thing
                                    isNewTrack = false;                     
                              }
                              if(!rs){data.push(this.fetchBytes(1));}
                              data.push(this.fetchBytes(1));
                              this.notes[tpos].push(new Note(trackDuration,data[0],data[1],currentInstrument[channel],channel));
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
                        var resStuff = getThisRes(noteDelta[channel],this.timing);
                        var thisRes = resStuff.res;
                        if(thisRes > this.resolution){this.resolution = thisRes; this.precision = resStuff.prc;}
                        // TODO: Drum kit
                        // if(channel==10){console.log(data[0]);}
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

function getThisRes(delta,qnTime){
      recurse++;
      if(delta==0){return 1;}
      //console.log(delta/qnTime);
      var i;
      for(i=0;i<8;i++){
            var power = Math.pow(2,(7-i)-5);
            var quotient = (delta/qnTime)/power;
            //console.log(quotient);
            if(Math.floor(quotient)==quotient){ // Recursion until the quotient becomes a whole number
                  //console.log('Y '+(delta/qnTime)+' -> '+(1/power));
                  recurse = 0;
                  return {res: (1/power), prc: i+1};
            }
            if(recurse>20){return {res: 4, prc: 5};} // Give up
      }
      //console.log(delta+' / '+qnTime+' = '+(delta/qnTime)+' WEIRD');
      //console.log('Rounded to '+Math.round(quotient/resolution)*resolution);
      // /console.log(recurse);
      return getThisRes(Math.round(quotient/resolution)*resolution,qnTime);
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
      if(program>=89 && program<=96){return 'Rotton Mushroom';} // Synth Pad
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

// https://www.cs.cmu.edu/~music/cmsip/readings/Standard-MIDI-file-format-updated.pdf