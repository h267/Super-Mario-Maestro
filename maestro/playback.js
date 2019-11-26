var schTime = 0;
var pos = 0;
var len = 0;
var notes = [];

// Load all of the instruments in a very neat and concise way
var goomba = new Tone.Sampler({'F#3': './wav/goomba.wav'},function(){
      goomba.toMaster();
      goomba.volume.value = -5;
      goomba.curve = 'linear';
});
var shellmet = new Tone.Sampler({'F#3': './wav/shellmet.wav'},function(){
      shellmet.toMaster();
      shellmet.volume.value = -5;
      shellmet.curve = 'linear';
});
var up = new Tone.Sampler({'F#3': './wav/1up.wav'},function(){
      up.toMaster();
      up.volume.value = -5;
      up.curve = 'linear';
});
var spiketop = new Tone.Sampler({'F#3': './wav/spiketop.wav'},function(){
      spiketop.toMaster();
      spiketop.volume.value = -5;
      spiketop.curve = 'linear';
});
var sledgebro = new Tone.Sampler({'F#3': './wav/sledgebro.wav'},function(){
      sledgebro.toMaster();
      sledgebro.volume.value = -5;
      sledgebro.curve = 'linear';
});
var piranha = new Tone.Sampler({'F#3': './wav/piranha.wav'},function(){
      piranha.toMaster();
      piranha.volume.value = -5;
      piranha.curve = 'linear';
});
var bobomb = new Tone.Sampler({'F#3': './wav/bobomb.wav'},function(){
      bobomb.toMaster();
      bobomb.volume.value = -5;
      bobomb.curve = 'linear';
});
var spikedshellmet = new Tone.Sampler({'F#3': './wav/spikedshellmet.wav'},function(){
      spikedshellmet.toMaster();
      spikedshellmet.volume.value = -5;
      spikedshellmet.curve = 'linear';
});
var drybones = new Tone.Sampler({'F#3': './wav/drybones.wav'},function(){
      drybones.toMaster();
      drybones.volume.value = -5;
      drybones.curve = 'linear';
});
var shroom = new Tone.Sampler({'F#3': './wav/shroom.wav'},function(){
      shroom.toMaster();
      shroom.volume.value = -5;
      shroom.curve = 'linear';
});
var rottenshroom = new Tone.Sampler({'F#3': './wav/rottenshroom.wav'},function(){
      rottenshroom.toMaster();
      rottenshroom.volume.value = -5;
      rottenshroom.curve = 'linear';
});
var bark = new Tone.Sampler({'F#3': './wav/bark.wav'},function(){
      bark.toMaster();
      bark.volume.value = -5;
      bark.curve = 'linear';
});
var mole = new Tone.Sampler({'F#3': './wav/mole.wav'},function(){
      mole.toMaster();
      mole.volume.value = -5;
      mole.curve = 'linear';
});
var pswitch = new Tone.Sampler({'F#3': './wav/pswitch.wav'},function(){
      pswitch.toMaster();
      pswitch.volume.value = -5;
      pswitch.curve = 'linear';
});
var zuls = new Tone.Sampler({'F#3': './wav/zuls.wav'},function(){
      zuls.toMaster();
      zuls.volume.value = -5;
      zuls.curve = 'linear';
});


Tone.Transport.PPQ = 128;

function playLvl(level,bpm,resolution,ofsX,ofsY){
      stopAudio();
      var i;
      var j;
      for(i=ofsX;i<ofsX+240-27;/*i<level.width;*/i++){
            if(i>=level.width){break;} // Plays extra music otherwise. Probably should come back to this
            notes.push([]);
            for(j=ofsY+1;j<ofsY+27;/*j=0;j<level.height;*/j++){
                  if(j>=level.height || j<0){continue;}
                  if(level.checkTile(i,j) == 1){
                        addNote((j-ofsY)+48,level.checkTile(i,j+1)-2);
                  }
            }
            advanceSchTime(128/resolution);
      }
      //console.log(notes);
      playAudio(bpm);
}

function playAudio(bpm){
      if(bpm==undefined){bpm=120;}
      pos = 0;
      Tone.Transport.bpm.value = Math.round(bpm);
      //console.log(Tone.Transport.bpm.value+' bpm used');
      Tone.Transport.start('+1');
}

function stopAudio(){
      Tone.Transport.stop();
      Tone.Transport.cancel();
      schTime = 0;
      pos = 0;
      notes = [];
}

function addNote(note,instrument){
      notes[pos].push({note:note, instrument:instrument});
      //console.log('Scheduled '+note+' at '+schTime);
      
}

function advanceSchTime(delta){
      Tone.Transport.schedule(function(time){
            //console.log('p '+pos);
            //console.log(notes);
            var curNotes = notes[pos];
            //if(notes.length!=0){console.log(curNotes);}
            //if(curNotes.length>0){console.log('ye');}
            drawLevel(false,true);
            highlightCol(pos+27,'rgba(255,0,0,0.5)');
            playNotes(curNotes);
            if(pos+27==239){
                  drawLevel(false,true);
                  enableMouse();
            }
            //console.log(time);
            pos++;
      }, schTime.toString()+'i');
      /*Tone.Draw.schedule(function(time){
            //highlightTile(pos+27,0);
            //highlightTile(Math.floor((240-27)*(time/Tone.Ticks(schTime).toSeconds()))+27,0);
      },schTime.toString()+'i');*/
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
            switch(curNotes[i].instrument){ // Couldn't put all the instruments in an array so now we have this
                  case 0: goomba.triggerAttackRelease(noteNumToStr(curNotes[i].note),'4n'); break;
                  case 1: shellmet.triggerAttackRelease(noteNumToStr(curNotes[i].note),'4n'); break;
                  case 2: up.triggerAttackRelease(noteNumToStr(curNotes[i].note),'4n'); break;
                  case 3: spiketop.triggerAttackRelease(noteNumToStr(curNotes[i].note),'4n'); break;
                  case 4: sledgebro.triggerAttackRelease(noteNumToStr(curNotes[i].note),'4n'); break;
                  case 5: piranha.triggerAttackRelease(noteNumToStr(curNotes[i].note),'4n'); break;
                  case 6: bobomb.triggerAttackRelease(noteNumToStr(curNotes[i].note),'4n'); break;
                  case 7: spikedshellmet.triggerAttackRelease(noteNumToStr(curNotes[i].note),'4n'); break;
                  case 8: drybones.triggerAttackRelease(noteNumToStr(curNotes[i].note),'4n'); break;
                  case 9: shroom.triggerAttackRelease(noteNumToStr(curNotes[i].note),'4n'); break;
                  case 10: rottenshroom.triggerAttackRelease(noteNumToStr(curNotes[i].note),'4n'); break;
                  case 11: bark.triggerAttackRelease(noteNumToStr(curNotes[i].note),'4n'); break;
                  case 12: mole.triggerAttackRelease(noteNumToStr(curNotes[i].note),'4n'); break;
                  case 13: pswitch.triggerAttackRelease(noteNumToStr(curNotes[i].note),'4n'); break;
                  case 14: zuls.triggerAttackRelease(noteNumToStr(curNotes[i].note),'4n'); break;
            }
      }
      
}