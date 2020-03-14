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
const CONT_SCROLL_X = 120;

let playbackAnim;
let timeout = null;
let isAnimating = false;

/**
 * Plays the playback animation that runs during the audio preview.
 * @param {number} blocksPerFrame The scroll speed of the animation, in tiles travelled per 60th of a second.
 * @param {number} maxX The maximum position to scroll to before ending the animation.
 * @param {number} delay The number of seconds before the animation starts.
 */
function animatePlayback(blocksPerFrame, maxX, delay){
      playbackAnim = new Animation(function(anim){
            canvasLayers[dlayer.mouseLayer].clear();
            let xPos = Math.floor( ( marginWidth + (blocksPerFrame * anim.frameCount) ) * 16 );
            if(xPos/16 > maxX-marginWidth){
                  if(isAnimating){
                        setTimeout(() => stopAudio(), 2000);
                        isAnimating = false;
                        resetPlayback();
                  }
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
      isAnimating = true;
      setTimeout(() => playbackAnim.start(), delay*1000);
      
}

/**
 * Animates playback for the entire song, not just the level.
 * @param {number} blocksPerFrame The scroll speed of the animation, in tiles travelled per 60th of a second.
 * @param {number} maxX The maximum position to scroll to before ending the animation.
 * @param {number} delay The number of seconds before the animation starts.
 */
function animateContinuousPlayback(blocksPerFrame, delay){
      const startX = ofsX;
      const tileLimX = Math.floor((minimap.width-(canvas.width/16-27))+(blocksPerBeat*bbar)/16) + CONT_SCROLL_X;
      let lastMovingX = 0;
      let ranEndTransition = false;
      playbackAnim = new Animation(function(anim){
            canvasLayers[dlayer.mouseLayer].clear();
            let xPos = Math.floor( ( marginWidth + (blocksPerFrame * anim.frameCount) ) * 16 );
            let tilePos = Math.floor(xPos/16);
            let globalTilePos = xPos/16 + startX;
            let drawPos = xPos;
            if(globalTilePos > tileLimX + levelWidth - CONT_SCROLL_X + 5){
                  if(isAnimating){
                        setTimeout(() => stopAudio(), 2000);
                        isAnimating = false;
                        resetPlayback();
                  }
                  return;
            }
            //console.log(xPos);
            if(tilePos < CONT_SCROLL_X){ // Case 1: Level begins scrolling
                  drawPos = xPos;
                  scrollDisplayTo(xPos - (marginWidth * 16));
            }
            else if(tilePos >= CONT_SCROLL_X && globalTilePos < tileLimX){ // Case 2: The level is in the middle of scrolling
                  let ofs = xPos%16;
                  drawPos = (CONT_SCROLL_X*16) + ofs;
                  setLevelXTo(tilePos - CONT_SCROLL_X + startX);
                  scrollDisplayTo((CONT_SCROLL_X - marginWidth)*16 + ofs);
                  canvasLayers[dlayer.bgLayer].setXOfs(ofs);
            }
            else{ // Case 3: The level is about to stop scrolling // TODO: Fix the end getting cut off, causing desync when the scrubber is at the end
                  if(!ranEndTransition){
                        lastMovingX = tilePos - CONT_SCROLL_X + startX + 1;
                        canvasLayers[dlayer.bgLayer].setXOfs(0);
                        ranEndTransition = true;
                  }
                  setLevelXTo(lastMovingX);
                  drawPos = (CONT_SCROLL_X + globalTilePos - tileLimX)*16;
                  scrollDisplayTo((CONT_SCROLL_X + globalTilePos - tileLimX - marginWidth)*16);
            }
            canvasLayers[dlayer.mouseLayer].drawLine(drawPos, 0, drawPos, levelHeight*16);

            let spriteNum = 0;
            let period = Math.round( (BASE_WALK_SPEED/blocksPerFrame) * BASE_WALK_PERIOD); // Adjust the animation speed based on the scroll speed
            if( getFraction(anim.frameCount / period) < 0.5 ) spriteNum = 0;
            else spriteNum = 1;
            if(blocksPerFrame >= RUN_SPEED * 0.99) spriteNum += 2; // Change to running animation if the speed is within 1% of running speed
            drawSprite(marioSprites[spriteNum], drawPos - 240, 396, dlayer.mouseLayer);
            refreshCanvas();
      });
      isAnimating = true;
      setTimeout(() => playbackAnim.start(), delay*1000);
}

/**
 * End the level playback animation.
 */
function stopPlaybackAnimation(){
      if(playbackAnim == undefined) return;
      playbackAnim.stop();
      canvasLayers[dlayer.mouseLayer].clear();
      canvasLayers[dlayer.bgLayer].setXOfs(0);
      refreshCanvas();
}