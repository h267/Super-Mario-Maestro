/**
 * An independent canvas to be drawn on top of other DrawLayers and the main canvasses.
 */
class DrawLayer{
      /**
       * Initializes a new DrawLayer with its own virtual canvas element and 2D rendering context.
       * @param {number} width The width of the canvas.
       * @param {number} height The height of the canvas.
       * @constructor
       */
      constructor(width, height){
            this.isVisible = true;
            this.canvas = document.createElement('canvas');
            this.canvas.width = width;
            this.canvas.height = height;
            this.width = width;
            this.height = height;
            this.ctx = this.canvas.getContext('2d');
      }
      /**
       * Clears the layer.
       */
      clear(){
            this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
      }

      /**
       * Draws a circle on the layer.
       * @param {number} x The x-coordinate of the circle's center.
       * @param {number} y The y-coordinate of the circle's center.
       * @param {number} r The radius of the circle.
       * @param {string} style The fill style. (Optional)
       */
      drawCircle(x,y,r,style){
            if(style == undefined){style = 'black';}
            this.ctx.fillStyle = style;
            this.ctx.beginPath();
            this.ctx.arc(x,y,r,0,2*Math.PI,false);
            this.ctx.lineWidth = 1;
            this.ctx.fill();
      }

      /**
       * Draws a straight line between two points on the layer.
       * @param {number} x1 The starting x-coordinate.
       * @param {number} y1 The starting y-coordinate.
       * @param {number} x2 The ending x-coordinate.
       * @param {number} y2 The ending y-coordinate.
       * @param {string} style The stroke style. (Optional)
       * @param {number} width The thickness of the line. (Optional)
       */
      drawLine(x1,y1,x2,y2,style,width){
            if(style == undefined){style = 'black';}
            if(width == undefined){width = 1;}
            this.ctx.beginPath();
            this.ctx.moveTo(x1,y1);
            this.ctx.lineTo(x2,y2);
            this.ctx.lineWidth = width;
            this.ctx.strokeStyle = style;
            this.ctx.stroke();
      }

      /**
       * Draws a filled rectangle on the layer.
       * @param {number} x The x-coordinate of the upper left point.
       * @param {number} y The y-coordinate of the upper left point.
       * @param {number} w The width of the rectangle.
       * @param {number} h The height of the rectangle.
       * @param {string} style The fill style (Optional)
       */
      fillRect(x,y,w,h,style){
            if(style == undefined){style = 'black';}
            this.ctx.fillStyle = style;
            this.ctx.fillRect(x,y,w,h);
      }

      /**
       * Draws a hollow rectangle on the layer.
       * @param {number} x The x-coordinate of the upper left point.
       * @param {number} y The y-coordinate of the upper left point.
       * @param {number} w The width of the rectangle.
       * @param {number} h The height of the rectangle.
       * @param {number} thickness The line thickness. (Optional)
       * @param {string} style The fill style. (Optional)
       */
      drawBox(x,y,w,h,thickness,style){
            if(style == undefined){style = 'black';}
            if(thickness == undefined){thickness = 1;}
            this.ctx.beginPath();
            this.ctx.strokeStyle = style;
            this.ctx.lineWidth = thickness;
            this.ctx.rect(x,y,w,h);
            this.ctx.stroke();
      }

      /**
       * Displays black text on a white rectangle on the layer.
       * @param {number} x The x-coordinate of the upper left point.
       * @param {number} y The y-coordinate of the upper left point.
       * @param {string} str The string of text to be displayed.
       */
      text(x,y,str){
            this.ctx.font = '11px Arial';
            var size = {h: 11, w: this.ctx.measureText(str).width + 2};
            this.fillRect(x,(y-size.h)+2,size.w,size.h,'white');
            this.drawBox(x-1,(y-size.h)+1,size.w+1,size.h+1,1,'black');
            this.ctx.fillStyle='black';
            this.ctx.fillText(str,x,y);
      }
}

var canvas=document.getElementById("canvas");
var ctx=canvas.getContext("2d");
var minimap=document.getElementById("minimap");
var ctxMini=minimap.getContext("2d");
var miniRect = minimap.getBoundingClientRect();
var mox = miniRect.left;
var moy = miniRect.top;
var dragging = false;
var mx = 0;
var my = 0;
var bgs = null;
var lastMiniData = null;
var minimapZoomY = 1;
var minimapZoomX = 1; // Unused

/**
 * A set of DrawLayers for the main display.
 */
const dlayer = {
      bgLayer: 0,
      noteLayer: 3,
      overlayLayer: 4,
      outlineLayer: 5,
      mouseLayer: 6
};
const canvasWidth = 3840;
const canvasHeight = 432;
const miniHeight = 64;
const numCanvasLayers = 7;
const numMiniLayers = 2;
const miniPlotSize = 2;

var canvasLayers = makeLayers(numCanvasLayers,canvasWidth, canvasHeight); // 0: BG, 1: Semisolids, 2: One-ways, 3: Notes, 4: Overlays, 5: Cursor and tools
var miniLayers;

/**
 * Loads an image from a local file.
 * @param {string} loc The local file path for the image.
 * @returns {Promise<Image>} A promise containing an image object with the loaded image.
 */
function getImg(loc){
      return new Promise(function(resolve,reject){
            var img = new Image();
            img.onload = function(){
                  resolve(img);
            };
            img.onerror = function(){
                  console.log('Failed to load: '+loc);
                  reject(img);
            };
            img.src = loc;
      });
}

/**
 * Plots a point on the minimap.
 * @param {number} x The x-coordinate of the point.
 * @param {number} y The y-coordinate of the point.
 * @param {string} style The fill style. (Optional)
 */
function miniPlot(x,y,style){
      x = Math.round(x*minimapZoomX);
      y -= 64 - (64/minimapZoomY)/2;
      y = Math.round(y*minimapZoomY);
      y = minimap.height - y;
      miniLayers[dlayer.bgLayer].fillRect(x,y,miniPlotSize,miniPlotSize,style);
}

/**
 * Clears the entire minimap, or a single layer if specified.
 * @param {number} layer The ID of the layer to be cleared. (Optional)
 */
function miniClear(layer){
      var i;
      if(layer == undefined){
            for(i=0;i<miniLayers.length;i++){
                  miniLayers[i].clear();
            }
      }
      else{
            miniLayers[layer].clear();
      }
      
}

/**
 * Draws the file scrubber on the minimap.
 * @param {number} x The x-coordinate of the top left corner.
 * @param {number} y The y-coordinate of the top left corner.
 * @param {number} w The width of the scrubber.
 * @param {number} h The height of the scrubber.
 */
function drawScrubber(x,y,w,h){
      x = Math.round(x*minimapZoomX);
      y -= 64 - (64/minimapZoomY)/2;
      y = Math.round(y*minimapZoomY);
      w = Math.round(w*minimapZoomX);
      h = Math.round(h*minimapZoomY);
      y = minimap.height - y;
      miniLayers[1].fillRect(x,y,w,h,'rgba(127,127,255,0.2)');
      miniLayers[1].drawBox(x,y,w,h,1,'rgb(127,127,255)');
}

/**
 * Clears a layer on the main display.
 * @param {number} layer The ID of the layer on the main display to clear.
 */
function clearDisplayLayer(layer){
      canvasLayers[layer].clear();
}

/**
 * Changes the width of the minimap.
 * @param {number} w The new width of the minimap.
 */
function setMiniWidth(w){
      minimap.width = w*minimapZoomX;
      miniLayers = makeLayers(numMiniLayers,w,miniHeight); // 0: Notes, 1: Scrubber
}

/**
 * Moves the file scrubber to the cursor position when the minimap is clicked.
 * @param {MouseEvent} e The mouse event.
 */
function handleMouseDown(e){
      var coords = getRealMiniOfs(e);
      mx = coords.x;
      my = coords.y;
      moveOffsetTo(mx/minimap.width,null);
      dragging = true;
}

/**
 * Handles when the mouse is no longer dragging the file scrubber.
 * @param {MouseEvent} e The mouse event.
 */
function handleMouseUp(e){
      var coords = getRealMiniOfs(e);
      mx = coords.x;
      my = coords.y;
      dragging = false;
}

/**
 * Handles when the mouse is no longer hovering over the minimap.
 * @param {MouseEvent} e The mouse event.
 */
function handleMouseOut(e){
      var coords = getRealMiniOfs(e);
      mx = coords.x;
      my = coords.y;
      dragging = false;
}

/**
 * Handles when the mouse is moved over the minimap.
 * @param {MouseEvent} e The mouse event.
 */
function handleMouseMove(e){
      var coords = getRealMiniOfs(e);
      mx = coords.x;
      my = coords.y;
      if(dragging){
            moveOffsetTo(mx/minimap.width,null);
      }
}

/**
 * Obtains the x and y coordinates of the mouse's location over a canvas element.
 * @param {MouseEvent} evt The mouse event.
 * @returns {Object} An object containing the x and y coordinates of the cursor.
 */
function getOffset(evt) {
      var el = evt.target,
          x = 0,
          y = 0;
    
      while (el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop)) {
        x += el.offsetLeft - el.scrollLeft;
        y += el.offsetTop - el.scrollTop;
        el = el.offsetParent;
      }
    
      x = evt.clientX - x;
      y = evt.clientY - y;
    
      return { x: x, y: y };
}

/**
 * Gets the horizontal of the mouse cursor relative the the whole minimap, factoring out the scroll position.
 * @param {MouseEvent} e The mouse event.
 * @returns {number} The x-coordinate of the mouse cursor relative to the minimap.
 */
function getRealMiniOfs(e){
      if(clickedTile!=null){
            clickedTile = null;
            drawLevel();
            return;
      }
      var canvasOfs = getOffset(e);
      var div = document.getElementById('minimapcontainer');
      var scrollOfs = {x: div.scrollLeft, y: div.scrollTop};
      var offset = {x: canvasOfs.x + scrollOfs.x, y: canvasOfs.y + scrollOfs.y};
      return offset;
}

/**
 * Highlights a tile on the main display.
 * @param {number} tx The x-coordinate of the tile to be highlighted, in tile units.
 * @param {number} ty The y-coordinate of the tile to be highlighted, in tile units.
 * @param {Object} opts Extra options: (Optional)
 * * style: The fill style.
 * * layer: Which layer to highlight on. It is the overlay layer by default.
 */
function highlightTile(tx,ty,opts){
      var style = 'rgba(0,255,0,0.5)';
      if(opts.style != undefined){style = opts.style;}
      var layer = dlayer.overlayLayer;
      if(opts.layer != undefined){layer = opts.layer;}
      canvasLayers[layer].fillRect(tx*16,ty*16,16,16,style);
}

/**
 * Outlines a tile on the main display.
 * @param {number} tx The x-coordinate of the tile to be outlined, in tile units.
 * @param {number} ty The y-coordinate of the tile to be outlined, in tile units.
 * @param {number} thickness The thickness of the outline. (Optional)
 * @param {string} style The stroke style of the outline. (Optional)
 */
function outlineTile(tx,ty,thickness,style){
      if(thickness==undefined){thickness = 1;}
      if(style==undefined){style='rgba(0,255,0,0.5)';}
      canvasLayers[dlayer.overlayLayer].drawBox(tx*16,ty*16,16,16,thickness,style);
}

/**
 * Outlines a tile on a specific layer on the main display.
 * @param {number} layer The layer ID of the layer to draw the outline on.
 * @param {number} tx The x-coordinate of the tile to be outlined, in tile units.
 * @param {number} ty The y-coordinate of the tile to be outlined, in tile units.
 * @param {number} thickness The thickness of the outline. (Optional)
 * @param {string} style The stroke style of the outline. (Optional)
 */
function outlineTileOnDrawLayer(layer, tx, ty, thickness, style){
      if(thickness==undefined){thickness = 1;}
      if(style==undefined){style='rgba(0,255,0,0.5)';}
      layer.drawBox(tx*16,ty*16,16,16,thickness,style);
}

/**
 * Highlights a column on the main display.
 * @param {number} tx The x-coordinate of the tile to be highlighted, in tile units.
 * @param {string} style The fill style.
 */
function highlightCol(tx,style){
      if(style==undefined){style='rgba(0,255,0,0.5)';}
      canvasLayers[dlayer.mouseLayer].fillRect(tx*16,0,16,canvas.height,style);
}

/**
 * Draws a tile on the main display.
 * @param {Image} image The image to draw.
 * @param {number} x The x-coordinate of where the tile should be drawn.
 * @param {number} y The y-coordinate of where the tile should be drawn.
 * @param {number} layer The layer ID of the layer to draw the tile on.
 */
function drawTile(image,x,y,layer){
      if(layer == undefined){layer=dlayer.noteLayer;}
      canvasLayers[layer].ctx.drawImage(image, x, y);
}

/**
 * Draws a sprite on the main display.
 * @param {Image} image The image to draw.
 * @param {number} x The x-coordinate of where the sprite should be drawn.
 * @param {number} y The y-coordinate of where the sprite should be drawn.
 * @param {number} layer The layer ID of the layer to draw the sprite on.
 */
function drawSprite(image,x,y,layer){
      if(layer == undefined){layer=dlayer.noteLayer;}
      let layerCtx = canvasLayers[layer].ctx;
      layerCtx.shadowColor = 'rgba(0,0,0,0.4)';
      layerCtx.shadowOffsetX = 4;
      layerCtx.drawImage(image, x, y);
      layerCtx.shadowOffsetX = 0;
}

/**
 * Draws the background elements on the main display.
 */
function decorateBG(){
      drawTile(bgs[0],16,canvas.height-64,0);
      drawTile(bgs[1],(240-10)*16,17*16,0);
}

/**
 * Draws a solid red vertical line, signifying a limit.
 * @param {number} x The x-coordinate to draw the line at.
 */
function drawLimitLine(x){
      canvasLayers[dlayer.overlayLayer].drawLine(x*16,0,x*16,27*16,'rgba(255,0,0,1)',3);
}

/**
 * Fills in the background color on the main display.
 * @param {string} style The fill style of the background.
 */
function setBG(style){
      canvasLayers[dlayer.bgLayer].fillRect(0,0,canvas.width,canvas.height,style);
}

/**
 * Draws the background grid.
 */
function drawGrid(){
      var i;
      for(i=0;i<canvas.width/16;i++){
            canvasLayers[dlayer.bgLayer].drawLine(i*16,0,i*16,canvas.height-1,'rgba(0,0,0,0.2)');
            if(i%24==0){canvasLayers[dlayer.bgLayer].drawLine(i*16,0,i*16,canvas.height-1,'rgba(0,0,0,0.25)',2);}
      }
      for(i=0;i<canvas.height/16;i++){
            canvasLayers[dlayer.bgLayer].drawLine(0,i*16,canvas.width-1,i*16,'rgba(0,0,0,0.2)');
            if(i%13==0){canvasLayers[dlayer.bgLayer].drawLine(0,i*16,canvas.width-1,i*16,'rgba(0,0,0,0.25)',2);}
      }
}

/**
 * Draws a text label at a certain position on the main display.
 * @param {number} x The x-coordinate of the top left corner of the label.
 * @param {number} y The y-coordinate of the top left corner of the label.
 * @param {string} str The text to be displayed in the label.
 */
function drawLabel(x,y,str){
      canvasLayers[dlayer.mouseLayer].text(x,y,str);
}

/**
 * Loads all of the tiles used for display on the level grid.
 * @returns {Promise<Image[]>} An array of image objects containing the tile image data.
 */
function loadTiles(){
      return new Promise(function(resolve,reject){
            Promise.all(
                  [
                  getImg('tiles/ground.png'),
                  getImg('tiles/note.png'),
                  getImg('tiles/goomba.png'),
                  getImg('tiles/shellmet.png'),
                  getImg('tiles/1up.png'),
                  getImg('tiles/spike-top.png'),
                  getImg('tiles/sledge-bro.png'),
                  getImg('tiles/piranha.png'),
                  getImg('tiles/bob-omb.png'),
                  getImg('tiles/spiked-shellmet.png'),
                  getImg('tiles/dry-bones.png'),
                  getImg('tiles/mushroom.png'),
                  getImg('tiles/poison.png'),
                  getImg('tiles/woof.png'),
                  getImg('tiles/monty-mole.png'),
                  getImg('tiles/p-switch.png'),
                  getImg('tiles/mew.png'),
                  getImg('tiles/big-mushroom.png'),
                  getImg('tiles/bill-blaster.png'),
                  getImg('tiles/goomba-shoe.png'),
                  getImg('tiles/goomba-stiletto.png'),
                  getImg('tiles/cannon.png'),
                  getImg('tiles/chain-chomp.png'),
                  getImg('tiles/peg.png'),
                  getImg('tiles/coin.png'),
                  getImg('tiles/fire-piranha.png'),
                  getImg('tiles/flower.png'),
                  getImg('tiles/goombud.png'),
                  getImg('tiles/green-koopa.png'),
                  getImg('tiles/red-koopa.png'),
                  getImg('tiles/hammer-bro.png'),
                  getImg('tiles/magikoopa.png'),
                  getImg('tiles/muncher.png'),
                  getImg('tiles/pow.png'),
                  getImg('tiles/spring.png'),
                  getImg('tiles/sideways-spring.png'),
                  getImg('tiles/star.png'),
                  getImg('tiles/superball.png'),
                  getImg('tiles/thwomp.png'),
                  getImg('tiles/wiggler.png'),
                  getImg('tiles/spike.png'),
                  getImg('tiles/spikeball.png'),
                  getImg('tiles/snowball.png'),
                  getImg('tiles/pokey.png'),
                  getImg('tiles/snow-pokey.png'),
                  getImg('tiles/sword.png'),
                  getImg('tiles/toad.png')
                  ]
            ).then(function(loaded){
                  //console.log('All tiles loaded');
                  resolve(loaded);
            });
      });
}

/**
 * Loads all of the background elements used for display in the background.
 * @returns {Promise<Image[]>} An array of image objects containing the image data.
 */
function loadBGs(){
      return new Promise(function(resolve,reject){
            Promise.all([
                  getImg('bg/sign.png'),
                  getImg('bg/goal.png')
            ]).then(function(loaded){
                  //console.log('BGs loaded');
                  resolve(loaded);
            });
      });
}

/**
 * Loads all of Mario's animation frames as images.
 * @returns {Promise<Image[]>} An array of image objects containing the image data.
 */
function loadMario(){
      return new Promise(function(resolve,reject){
            Promise.all([
                  getImg('anim/mario/idle.png'),
                  getImg('anim/mario/walk.png'),
                  getImg('anim/mario/run1.png'),
                  getImg('anim/mario/run2.png')
            ]).then(function(loaded){
                  resolve(loaded);
            });
      });
}

/**
 * Creates an array of DrawLayers for use with a canvas element.
 * @param {number} amount The number of layers to make.
 * @param {number} width The width of all of the layers, in pixels.
 * @param {number} height The height of all of the layers, in pixels.
 * @returns {DrawLayer[]} An array containing the newly created DrawLayer objects.
 */
function makeLayers(amount, width, height){
      var arr = [];
      var i;
      for(i=0;i<amount;i++){
            arr[i] = new DrawLayer(width, height);
      }
      return arr;
}

/**
 * Redraws the main display with DrawLayers.
 */
function refreshCanvas(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      var i;
      for(i=0;i<canvasLayers.length;i++){
            if(!canvasLayers[i].isVisible){continue;}
            ctx.drawImage(canvasLayers[i].canvas,0,0,canvasLayers[i].canvas.width,canvasLayers[i].canvas.height);
      }
}

/**
 * Redraws the minimap with DrawLayers.
 */
function refreshMini(){
      ctxMini.clearRect(0,0,minimap.width,minimap.height);
      var i;
      for(i=0;i<miniLayers.length;i++){
            if(!miniLayers[i].isVisible){continue;}
            ctxMini.drawImage(miniLayers[i].canvas,0,0,miniLayers[i].width,miniLayers[i].canvas.height);
      }
}

/**
 * Sets the minimap's vertical zoom magnification.
 * @param {number} zoom The zoom level, expressed as a percentage.
 */
function setMiniZoomY(zoom){
      minimapZoomY = zoom;
}

minimap.onmousedown = function(e){handleMouseDown(e);};
minimap.onmousemove = function(e){handleMouseMove(e);};
minimap.onmouseup = function(e){handleMouseUp(e);};
minimap.onmouseout = function(e){handleMouseOut(e);};

canvas.onmousemove = function(e){handleMove(e);};
canvas.onclick = function(e){handleClick(e);};