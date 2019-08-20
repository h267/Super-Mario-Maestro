class MIDIfile{
      constructor(file){
            this.bytes = file;
            this.ppos = 0;
            this.tpos = 0;
            this.runningStatus = null;
            this.tracks = []; // Each track is filled with an array of events
            this.error = 0;
            this.debug = 0;
            this.timingFormat = 0;
            this.timing = 0;
            this.duration = 0;
            this.trackDuration = 0;
            this.noteCount = 0;
            this.noteDelta = Array(16).fill(0);
            this.resolution = 1; // The smallest present unit of a note/rest is expressed as being 1/resolution quarter notes long.
            this.precision = 3;
            this.parse();
      }

      // Main parsing functions
      parse(){
            //console.log('Started parsing');
            this.parseHeader();
            for(this.tpos=0;this.tpos<this.ntrks;this.tpos++){
                  this.parseTrack();
            }
            if(this.error!=0){alert('The file was parsed unsuccessfully.');}
            //console.log(this.noteCount+' notes');
      }
      parseHeader(){
            if(this.parseString(4) == 'MThd'){/*console.log('MThd');*/}
            else{
                  console.log('ERROR: No MThd');
                  this.error = 1;
                  return;
            }
            if(this.parseBytes(4)!=6){
                  console.log('ERROR: File header is not 6 bytes long.');
                  this.error = 2;
                  return;
            }
            this.fmt = this.parseBytes(2);
            if(this.fmt > 2){
                  console.log('ERROR: Unrecognized format number.');
                  this.error = 3;
            }
            this.ntrks = this.parseBytes(2);
            //console.log('Format '+this.fmt+', '+this.ntrks+' tracks');

            // Parse timing division
            var tdiv = this.parseBytes(2);
            var tdivstr = decToBin(tdiv,16);
            if(tdivstr.charAt(0)=='0'){
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
            var len = this.parseBytes(4);
            //console.log('len = '+len);
            while(!done){
                  done = this.parseEvent();
            }
            //console.log('Track '+this.tpos);
            //console.log(this.tracks[this.tpos]);
            //console.log(this.trackDuration);
            if(this.trackDuration > this.duration){this.duration = this.trackDuration;}
            this.trackDuration = 0;
            this.noteDelta.fill(0);
      }
      parseEvent(){
            var delta = this.parseDeltaTime();
            this.trackDuration += delta;
            var statusByte = this.parseBytes(1)[0];
            var data = [];
            var rs = false;
            var EOT = false;
            if(statusByte<128){ // Running status
                  data.push(statusByte);
                  statusByte = this.runningStatus;
                  rs = true;
            }
            else{
                  this.runningStatus = statusByte;
            }
            var bstring = decToBin(statusByte,8);
            var eventType = binToDec(bstring.substring(0,4));
            var channel = binToDec(bstring.substring(4,8));
            if(eventType == 15){ // System events and meta events 
                  switch(channel){ // System message types are stored in the last nibble instead of a channel
                        // Don't really need these and probably nobody uses them but we'll keep them for completeness.

                        case 0: // System exclusive message -- wait for exit sequence
                              //console.log('sysex');
                              var cbyte = this.parseBytes(1)[0];
                              while(cbyte!=247){
                                    data.push(cbyte);
                                    cbyte = this.parseBytes(1)[0];
                              }
                        break;

                        case 2:
                              data.push(this.parseBytes(1)[0]);
                              data.push(this.parseBytes(1)[0]);
                              break;

                        case 3:
                              data.push(this.parseBytes(1)[0]);
                              break;

                        case 15: // Meta events: where some actually important non-music stuff happens
                              var metaType = this.parseBytes(1)[0];
                              var i;
                              switch(metaType){
                                    case 47: // End of track
                                          this.skip(1);
                                          EOT = true;
                                          //console.log('EOT');
                                          break;

                                    case 81:
                                          var len = this.parseBytes(1)[0];
                                          data.push(this.parseBytes(len)); // All one value
                                          break;
                                    default:
                                          var len = this.parseBytes(1)[0];
                                          //console.log('Mlen = '+len);
                                          for(i=0;i<len;i++){
                                                data.push(this.parseBytes(1)[0]);
                                          }
                              }
                              eventType = getIntFromBytes([255,metaType]);
                  }
                  if(channel!=15){eventType = statusByte;}
                  channel = -1; // global
            }
            else{
                  switch(eventType){
                        case 12:
                              if(!rs){data.push(this.parseBytes(1)[0]);}
                              break;
                        case 13:
                              if(!rs){data.push(this.parseBytes(1)[0]);}
                              break;
                        default:
                              if(!rs){data.push(this.parseBytes(1)[0]);}
                              data.push(this.parseBytes(1)[0]);
                  }
                  var i;
                  for(i=0;i<this.noteDelta.length;i++){
                        this.noteDelta[i] += delta;
                  }
                  if(eventType==9 && data[1]!=0){
                        var resStuff = getThisRes(this.noteDelta[channel],this.timing);
                        var thisRes = resStuff.res;
                        if(thisRes > this.resolution){this.resolution = thisRes; this.precision = resStuff.prc;}
                        this.noteDelta[channel] = 0;
                        this.noteCount++;
                  }
            }
            this.tracks[this.tpos].push(new MIDIevent(delta,eventType,channel,data));
            //console.log('+'+delta+': '+eventType+' @'+channel);
            //console.log(data);
            //this.debug++;
            if(this.debug>0){return true;}
            return EOT;//|| this.debug>=4;
      }

      // Helper parsing functions
      parseBytes(n){
            var i;
            var byteArr = [];
            for(i=0;i<n;i++){
                  byteArr[i] = this.bytes[this.ppos+i];
            }
            this.ppos += n;
            if(n==1){return byteArr;}
            else{return getIntFromBytes(byteArr);}
      }
      parseString(n){
            var i;
            var str = '';
            for(i=0;i<n;i++){
                  str += ASCII(this.bytes[this.ppos+i]);
            }
            this.ppos += n;
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
                        console.log(this.tracks[this.tpos]);
                        this.debug = 1;
                        break;
                  }
                  var byte = this.parseBytes(1)[0];
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
            this.ppos += n;
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

function ASCII(n){
      return String.fromCharCode(n);
}

function reverseBits(num){
      var reverse_num = 0; 
      var i; 
      for (i = 0; i < 8; i++){ 
            if((num & (1 << i))){reverse_num |= 1 << (7 - i);}
      }
      return reverse_num; 
}

function getIntFromBytes(arr,pad){ // Gets a signed integer value from an arbitrary number of bytes -- up to four
      if(pad==undefined){pad=8;}
      var str = '';
      var i;
      for(i=0;i<arr.length;i++){
            str += decToBin(arr[i],pad);
      }
      return binToDec(str);
}

function decToBin(n,padTo){
      var str = (n >>> 0).toString(2);
      if(padTo == undefined){return str;}
      var i;
      for(i=str.length;i<padTo;i++){
            str = '0'+str;
      }
      return str;
}

function binToDec(str){
      return parseInt(str,2);
}

function getThisRes(delta,qnTime){
      if(delta==0){return 1;}
      //console.log(delta/qnTime);
      var i;
      for(i=0;i<8;i++){
            var power = Math.pow(2,(7-i)-5);
            var quotient = (delta/qnTime)/power;
            if(Math.floor(quotient)==quotient){
                  //console.log('Y '+(delta/qnTime)+' -> '+(1/power));
                  return {res: (1/power), prc: i+1};
            }
      }
      //console.log(delta+' / '+qnTime+' = '+(delta/qnTime)+' WEIRD');
      //console.log('Rounded to '+Math.round(quotient/resolution)*resolution);
      return getThisRes(Math.round(quotient/resolution)*resolution,qnTime);
}

// https://www.cs.cmu.edu/~music/cmsip/readings/Standard-MIDI-file-format-updated.pdf