/**
 * A controllable event to be triggered every time the graphics refesh.
 */
class Animation {
      /**
       * Initializes the Animation object.
       * @param {function} callback The callback function to run every available frame.
       */
      constructor(callback){
            this.isRunning = false;
            this.callback = callback;
            this.frameCount = 0;
            this.state = 0;
      }

      /**
       * Begins running the animation.
       */
      start(){
            this.startTime = Date.now();
            this.isRunning = true;
            this.frame();
      }

      /**
       * Stops running the animation.
       */
      stop(){
            this.isRunning = false;
      }

      /**
       * Renders a frame of the animation.
       */
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

/**
 * Plays the playback animation that runs during the audio preview.
 * @param {number} blocksPerFrame The scroll speed of the animation, in tiles travelled per 60th of a second.
 * @param {number} maxX The maximum position to scroll to before ending the animation.
 */
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

/**
 * Animates playback for the entire song, not just the level.
 */
function animateContinuousPlayback(blocksPerFrame, maxX){ // TODO: Change to work continuously
      playbackAnim = new Animation(function(anim){
            canvasLayers[dlayer.mouseLayer].clear();
            let xPos = Math.floor( ( marginWidth + (blocksPerFrame * anim.frameCount) ) * 16 );
            if(xPos/16 > maxX){ // TODO: Change to be max(levelWidth, this level width)
                  stopAudio();
                  resetPlayback();
                  return;
            }
            canvasLayers[dlayer.mouseLayer].drawLine(xPos, 0, xPos, levelHeight*16);
            //scrollDisplayTo(xPos - (marginWidth * 16));
            //scrollLevelXBy(1);
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

/**
 * End the level playback animation.
 */
function stopPlaybackAnimation(){
      if(playbackAnim == undefined) return;
      playbackAnim.stop();
      canvasLayers[dlayer.mouseLayer].clear();
      refreshCanvas();
}