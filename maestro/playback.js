var schTime = 0;
var pos = 0;
var len = 0;
var notes = [];
var framesPerColumn = 0;

// Load all of the instruments in a very neat and concise way
// (Why does it have to be this way Tone.js)
// TODO: Come back to this please
// The octave of each instrument is listed as the same so the playback will match in-game playback
// (some instruments sound lower than others at the same y value)
var goomba = new Tone.Sampler({'F3': './wav/goomba.wav'},function(){
//var goomba = new Tone.Sampler({'F3': './wav/sine.wav'},function(){
      goomba.toMaster();
      goomba.volume.value = -5;
      goomba.curve = 'linear';
});
var shellmet = new Tone.Sampler({'F3': './wav/shellmet.wav'},function(){
      shellmet.toMaster();
      shellmet.volume.value = -5;
      shellmet.curve = 'linear';
});
var up = new Tone.Sampler({'F3': './wav/1up.wav'},function(){
      up.toMaster();
      up.volume.value = -5;
      up.curve = 'linear';
});
var spiketop = new Tone.Sampler({'F3': './wav/spiketop.wav'},function(){
      spiketop.toMaster();
      spiketop.volume.value = -5;
      spiketop.curve = 'linear';
});
var sledgebro = new Tone.Sampler({'F3': './wav/sledgebro.wav'},function(){
      sledgebro.toMaster();
      sledgebro.volume.value = -5;
      sledgebro.curve = 'linear';
});
var piranha = new Tone.Sampler({'F3': './wav/piranha.wav'},function(){
      piranha.toMaster();
      piranha.volume.value = -5;
      piranha.curve = 'linear';
});
var bobomb = new Tone.Sampler({'F3': './wav/bobomb.wav'},function(){
      bobomb.toMaster();
      bobomb.volume.value = -5;
      bobomb.curve = 'linear';
});
var spikedshellmet = new Tone.Sampler({'F3': './wav/spikedshellmet.wav'},function(){
      spikedshellmet.toMaster();
      spikedshellmet.volume.value = -5;
      spikedshellmet.curve = 'linear';
});
var drybones = new Tone.Sampler({'F3': './wav/drybones.wav'},function(){
      drybones.toMaster();
      drybones.volume.value = -5;
      drybones.curve = 'linear';
});
var shroom = new Tone.Sampler({'F3': './wav/shroom.wav'},function(){
      shroom.toMaster();
      shroom.volume.value = -5;
      shroom.curve = 'linear';
});
var rottenshroom = new Tone.Sampler({'F3': './wav/rottenshroom.wav'},function(){
      rottenshroom.toMaster();
      rottenshroom.volume.value = -5;
      rottenshroom.curve = 'linear';
});
var bark = new Tone.Sampler({'F3': './wav/bark.wav'},function(){
      bark.toMaster();
      bark.volume.value = -5;
      bark.curve = 'linear';
});
var mole = new Tone.Sampler({'F3': './wav/mole.wav'},function(){
      mole.toMaster();
      mole.volume.value = -5;
      mole.curve = 'linear';
});
var pswitch = new Tone.Sampler({'F3': './wav/pswitch.wav'},function(){
      pswitch.toMaster();
      pswitch.volume.value = -5;
      pswitch.curve = 'linear';
});
var zuls = new Tone.Sampler({'F3': './wav/zuls.wav'},function(){
      zuls.toMaster();
      zuls.volume.value = -5;
      zuls.curve = 'linear';
});
var bigshroom = new Tone.Sampler({'F3': './wav/bigshroom.wav'},function(){
      bigshroom.toMaster();
      bigshroom.volume.value = -5;
      bigshroom.curve = 'linear';
});
var blaster = new Tone.Sampler({'F3': './wav/blaster.wav'},function(){
      blaster.toMaster();
      blaster.volume.value = -5;
      blaster.curve = 'linear';
});
var boot = new Tone.Sampler({'F3': './wav/boot.wav'},function(){
      boot.toMaster();
      boot.volume.value = -5;
      boot.curve = 'linear';
});
var stiletto = new Tone.Sampler({'F3': './wav/stiletto.wav'},function(){
      stiletto.toMaster();
      stiletto.volume.value = -5;
      stiletto.curve = 'linear';
});
var cannon = new Tone.Sampler({'F3': './wav/cannon.wav'},function(){
      cannon.toMaster();
      cannon.volume.value = -5;
      cannon.curve = 'linear';
});
var chomp = new Tone.Sampler({'F3': './wav/chomp.wav'},function(){
      chomp.toMaster();
      chomp.volume.value = -5;
      chomp.curve = 'linear';
});
var post = new Tone.Sampler({'F3': './wav/post.wav'},function(){
      post.toMaster();
      post.volume.value = -5;
      post.curve = 'linear';
});
var coin = new Tone.Sampler({'F3': './wav/coin.wav'},function(){
      coin.toMaster();
      coin.volume.value = -5;
      coin.curve = 'linear';
});
var fireplant = new Tone.Sampler({'F3': './wav/fireplant.wav'},function(){
      fireplant.toMaster();
      fireplant.volume.value = -5;
      fireplant.curve = 'linear';
});
var flower = new Tone.Sampler({'F3': './wav/flower.wav'},function(){
      flower.toMaster();
      flower.volume.value = -5;
      flower.curve = 'linear';
});
var goombrat = new Tone.Sampler({'F3': './wav/goombrat.wav'},function(){
      goombrat.toMaster();
      goombrat.volume.value = -5;
      goombrat.curve = 'linear';
});
var greenkoopa = new Tone.Sampler({'F3': './wav/greenkoopa.wav'},function(){
      greenkoopa.toMaster();
      greenkoopa.volume.value = -5;
      greenkoopa.curve = 'linear';
});
var redkoopa = new Tone.Sampler({'F3': './wav/redkoopa.wav'},function(){
      redkoopa.toMaster();
      redkoopa.volume.value = -5;
      redkoopa.curve = 'linear';
});
var hammerbro = new Tone.Sampler({'F3': './wav/hammerbro.wav'},function(){
      hammerbro.toMaster();
      hammerbro.volume.value = -5;
      hammerbro.curve = 'linear';
});
var magikoopa = new Tone.Sampler({'F3': './wav/magikoopa.wav'},function(){
      magikoopa.toMaster();
      magikoopa.volume.value = -5;
      magikoopa.curve = 'linear';
});
var muncher = new Tone.Sampler({'F3': './wav/muncher.wav'},function(){
      muncher.toMaster();
      muncher.volume.value = -5;
      muncher.curve = 'linear';
});
var pow = new Tone.Sampler({'F3': './wav/pow.wav'},function(){
      pow.toMaster();
      pow.volume.value = -5;
      pow.curve = 'linear';
});
var spring = new Tone.Sampler({'F3': './wav/spring.wav'},function(){
      spring.toMaster();
      spring.volume.value = -5;
      spring.curve = 'linear';
});
var sidespring = new Tone.Sampler({'F3': './wav/sidespring.wav'},function(){
      sidespring.toMaster();
      sidespring.volume.value = -5;
      sidespring.curve = 'linear';
});
var star = new Tone.Sampler({'F3': './wav/star.wav'},function(){
      star.toMaster();
      star.volume.value = -5;
      star.curve = 'linear';
});
var superball = new Tone.Sampler({'F3': './wav/superball.wav'},function(){
      superball.toMaster();
      superball.volume.value = -5;
      superball.curve = 'linear';
});
var thwomp = new Tone.Sampler({'F3': './wav/thwomp.wav'},function(){
      thwomp.toMaster();
      thwomp.volume.value = -5;
      thwomp.curve = 'linear';
});
var wiggler = new Tone.Sampler({'F3': './wav/wiggler.wav'},function(){
      wiggler.toMaster();
      wiggler.volume.value = -5;
      wiggler.curve = 'linear';
});
var spike = new Tone.Sampler({'F3': './wav/spike.wav'},function(){
      spike.toMaster();
      spike.volume.value = -7;
      spike.curve = 'linear';
});
var spikeball = new Tone.Sampler({'F3': './wav/spikeball.wav'},function(){
      spikeball.toMaster();
      spikeball.volume.value = -5;
      spikeball.curve = 'linear';
});
var snowball = new Tone.Sampler({'F3': './wav/snowball.wav'},function(){
      snowball.toMaster();
      snowball.volume.value = -5;
      snowball.curve = 'linear';
});
var pokey = new Tone.Sampler({'F3': './wav/pokey.wav'},function(){
      pokey.toMaster();
      pokey.volume.value = -5;
      pokey.curve = 'linear';
});
var snowpokey = new Tone.Sampler({'F3': './wav/snowpokey.wav'},function(){
      snowpokey.toMaster();
      snowpokey.volume.value = -5;
      snowpokey.curve = 'linear';
});
var sword = new Tone.Sampler({'F3': './wav/sword.wav'},function(){
      sword.toMaster();
      sword.volume.value = -5;
      sword.curve = 'linear';
});
var toad = new Tone.Sampler({'C4': './wav/toad.wav'},function(){
      toad.toMaster();
      toad.volume.value = -5;
      toad.curve = 'linear';
});


Tone.Transport.PPQ = 2520;

function playLvl(level,bpm,blocksPerBeat,ofsX,ofsY,playConflicts){
      if(playConflicts == undefined){playConflicts = true;}
      stopAudio();
      framesPerColumn = 1/(blocksPerBeat*bpm/3600);
      var i;
      var j;
      for(i=ofsX;i<ofsX+240-27;i++){
      //for(i=ofsX;i<i<level.width;i++){
            if(i>=level.width){break;} // Plays extra music otherwise. Probably should come back to this
            notes.push([]);
            for(j=ofsY+1;j<ofsY+27;j++){
            //for(j=0;j<level.height;j++){
                  if(j>=level.height || j<0){continue;}
                  if(!playConflicts){
                        if(level.checkTile(i,j) == 1){
                              addNote((j-ofsY)+47,level.checkTile(i,j+1)-2);
                        }
                  }
                  else{
                        for(var k=0;k<level.areas.length;k++){
                              if(!level.areas[k].isVisible){continue;}
                              if(level.areas[k].getTile(i,j,true) == 1){
                                    addNote((j-ofsY)+47,level.areas[k].getTile(i,j+1,true)-2);
                              }    
                        }
                  }
            }
            advanceSchTime(2520/blocksPerBeat);
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

function resetPlayback(){
      enableMouse();
      document.getElementById('playbtn').disabled = false;
      clearDisplayLayer(dlayer.mouseLayer);
      scrollDisplayTo(0);
      refreshCanvas();
}

function addNote(note,instrument){
      notes[pos].push({note:note, instrument:instrument});
      //console.log('Scheduled '+note+' at '+schTime);
      
}

function advanceSchTime(delta){
      Tone.Transport.schedule(function(time){
            //console.log('p '+pos);
            //console.log(notes);
            /*if(pos==0){
                  //smoothScrollCont(framesPerColumn, duration);
                  smoothScrollCont(framesPerColumn);
            }*/
            var curNotes = notes[pos];
            //if(notes.length!=0){console.log(curNotes);}
            //if(curNotes.length>0){console.log('ye');}
            clearDisplayLayer(dlayer.mouseLayer);
            highlightCol(pos+27,'rgba(255,0,0,0.5)');
            scrollDisplayTo(pos*16);
            refreshCanvas();
            if(curNotes != undefined){playNotes(curNotes);} // Prevent weird crash
            if(pos >= Math.min(239-27,level.width)-1){
                  resetPlayback();
            }
            //console.log(time);
            pos++;
      }, Math.round(schTime).toString()+'i');
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
                  case 15: bigshroom.triggerAttackRelease(noteNumToStr(curNotes[i].note),'4n'); break;
                  case 16: blaster.triggerAttackRelease(noteNumToStr(curNotes[i].note),'4n'); break;
                  case 17: boot.triggerAttackRelease(noteNumToStr(curNotes[i].note),'4n'); break;
                  case 18: stiletto.triggerAttackRelease(noteNumToStr(curNotes[i].note),'4n'); break;
                  case 19: cannon.triggerAttackRelease(noteNumToStr(curNotes[i].note),'4n'); break;
                  case 20: chomp.triggerAttackRelease(noteNumToStr(curNotes[i].note),'4n'); break;
                  case 21: post.triggerAttackRelease(noteNumToStr(curNotes[i].note),'4n'); break;
                  case 22: coin.triggerAttackRelease(noteNumToStr(curNotes[i].note),'4n'); break;
                  case 23: fireplant.triggerAttackRelease(noteNumToStr(curNotes[i].note),'4n'); break;
                  case 24: flower.triggerAttackRelease(noteNumToStr(curNotes[i].note),'4n'); break;
                  case 25: goombrat.triggerAttackRelease(noteNumToStr(curNotes[i].note),'4n'); break;
                  case 26: greenkoopa.triggerAttackRelease(noteNumToStr(curNotes[i].note),'4n'); break;
                  case 27: redkoopa.triggerAttackRelease(noteNumToStr(curNotes[i].note),'4n'); break;
                  case 28: hammerbro.triggerAttackRelease(noteNumToStr(curNotes[i].note),'4n'); break;
                  case 29: magikoopa.triggerAttackRelease(noteNumToStr(curNotes[i].note),'4n'); break;
                  case 30: muncher.triggerAttackRelease(noteNumToStr(curNotes[i].note),'4n'); break;
                  case 31: pow.triggerAttackRelease(noteNumToStr(curNotes[i].note),'4n'); break;
                  case 32: spring.triggerAttackRelease(noteNumToStr(curNotes[i].note),'4n'); break;
                  case 33: sidespring.triggerAttackRelease(noteNumToStr(curNotes[i].note),'4n'); break;
                  case 34: star.triggerAttackRelease(noteNumToStr(curNotes[i].note),'4n'); break;
                  case 35: superball.triggerAttackRelease(noteNumToStr(curNotes[i].note),'4n'); break;
                  case 36: thwomp.triggerAttackRelease(noteNumToStr(curNotes[i].note),'4n'); break;
                  case 37: wiggler.triggerAttackRelease(noteNumToStr(curNotes[i].note),'4n'); break;
                  case 38: spike.triggerAttackRelease(noteNumToStr(curNotes[i].note),'4n'); break;
                  case 39: spikeball.triggerAttackRelease(noteNumToStr(curNotes[i].note),'4n'); break;
                  case 40: snowball.triggerAttackRelease(noteNumToStr(curNotes[i].note),'4n'); break;
                  case 41: pokey.triggerAttackRelease(noteNumToStr(curNotes[i].note),'4n'); break;
                  case 42: snowpokey.triggerAttackRelease(noteNumToStr(curNotes[i].note),'4n'); break;
                  case 43: sword.triggerAttackRelease(noteNumToStr(curNotes[i].note),'4n'); break;
                  case 44: toad.triggerAttackRelease(noteNumToStr(curNotes[i].note),'4n'); break;
            }
      }
}