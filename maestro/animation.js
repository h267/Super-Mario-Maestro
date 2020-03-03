class Animation {
      constructor(callback){
            this.isRunning = false;
            this.callback = callback;
            this.frameCount = 0;
            this.state = 0;
      }
      start(){
            this.startTime = Date.now();
            this.isRunning = true;
            this.frame();
      }
      stop(){
            this.isRunning = false;
      }
      frame(){
            if(!this.isRunning) return;
            this.frameCount = Math.floor( (Date.now() - this.startTime) / (50/3) );
            this.callback(this);
            window.requestAnimationFrame(this.frame.bind(this));
      }
}

const BASE_WALK_SPEED = (7/75);
const BASE_WALK_PERIOD = 6;
const RUN_SPEED = (17/90);

var playbackAnim;

function animatePlayback(blocksPerFrame, maxX){
      playbackAnim = new Animation(function(anim){
            canvasLayers[dlayer.mouseLayer].clear();
            let xPos = Math.floor( ( marginWidth + (blocksPerFrame * anim.frameCount) ) * 16 );
            if(xPos/16 > maxX){ // TODO: Change to be max(levelWidth, this level width)
                  stopAudio();
                  resetPlayback();
                  return;
            }
            canvasLayers[dlayer.mouseLayer].drawLine(xPos, 0, xPos, levelHeight*16);
            scrollDisplayTo(xPos - (marginWidth * 16));
            let spriteNum = 0;
            let period = Math.round( (BASE_WALK_SPEED/blocksPerFrame) * BASE_WALK_PERIOD); // Adjust the animation speed based on the scroll speed
            if( getFraction(anim.frameCount / period) < 0.5 ) spriteNum = 0;
            else spriteNum = 1;
            if(blocksPerFrame >= RUN_SPEED * 0.99) spriteNum += 2; // Change to running animation if the speed is within 1% of running speed
            drawSprite(marioSprites[spriteNum], xPos - 240, 396, dlayer.mouseLayer);
            refreshCanvas();
      });
      playbackAnim.start();
}

function animateContinuousPlayback(){ // TODO: Change to work continuously
      playbackAnim = new Animation(function(anim){
            canvasLayers[dlayer.mouseLayer].clear();
            let xPos = Math.floor( ( marginWidth + (blocksPerFrame * anim.frameCount) ) * 16 );
            if(xPos/16 > maxX){ // TODO: Change to be max(levelWidth, this level width)
                  stopAudio();
                  resetPlayback();
                  return;
            }
            canvasLayers[dlayer.mouseLayer].drawLine(xPos, 0, xPos, levelHeight*16);
            scrollDisplayTo(xPos - (marginWidth * 16));
            let spriteNum = 0;
            let period = Math.round( (BASE_WALK_SPEED/blocksPerFrame) * BASE_WALK_PERIOD); // Adjust the animation speed based on the scroll speed
            if( getFraction(anim.frameCount / period) < 0.5 ) spriteNum = 0;
            else spriteNum = 1;
            if(blocksPerFrame >= RUN_SPEED * 0.99) spriteNum += 2; // Change to running animation if the speed is within 1% of running speed
            drawSprite(marioSprites[spriteNum], xPos - 240, 396, dlayer.mouseLayer);
            refreshCanvas();
      });
      playbackAnim.start();
}

function stopPlaybackAnimation(){
      if(playbackAnim == undefined) return;
      playbackAnim.stop();
      canvasLayers[dlayer.mouseLayer].clear();
      refreshCanvas();
}