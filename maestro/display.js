class DrawLayer{
      constructor(width, height){
            this.isVisible = true;
            this.canvas = document.createElement('canvas');
            this.canvas.width = width;
            this.canvas.height = height;
            this.width = width;
            this.height = height;
            this.ctx = this.canvas.getContext('2d');
      }
      clear(){
            this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
      }
      drawCircle(x,y,r,style){
            if(style == undefined){style = 'black';}
            this.ctx.fillStyle = style;
            this.ctx.beginPath();
            this.ctx.arc(x,y,r,0,2*Math.PI,false);
            this.ctx.lineWidth = 1;
            this.ctx.fill();
      }
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
      fillRect(x,y,w,h,style){
            if(style == undefined){style = 'black';}
            this.ctx.fillStyle = style;
            this.ctx.fillRect(x,y,w,h);
      }
      drawBox(x,y,w,h,thickness,style){
            if(style == undefined){style = 'black';}
            if(thickness == undefined){thickness = 1;}
            this.ctx.beginPath();
            this.ctx.strokeStyle = style;
            this.ctx.lineWidth = thickness;
            this.ctx.rect(x,y,w,h);
            this.ctx.stroke();
      }
      text(x,y,str){
            this.ctx.font = '11px Arial';
            var size = {h: 11, w: this.ctx.measureText(str).width};
            this.ctx.fillStyle = 'white';
            this.ctx.fillRect(x,(y-size.h)+2,size.w,size.h);
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

function miniPlot(x,y,style){
      x = Math.round(x*minimapZoomX);
      y -= 64 - (64/minimapZoomY)/2;
      y = Math.round(y*minimapZoomY);
      y = minimap.height - y;
      miniLayers[dlayer.bgLayer].fillRect(x,y,miniPlotSize,miniPlotSize,style);
}

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

function clearDisplayLayer(layer){
      canvasLayers[layer].clear();
}

function setMiniWidth(w){
      minimap.width = w*minimapZoomX;
      miniLayers = makeLayers(numMiniLayers,w,miniHeight); // 0: Notes, 1: Scrubber
}

function handleMouseDown(e){
      var coords = getRealMiniOfs(e);
      mx = coords.x;
      my = coords.y;
      moveOffsetTo(mx/minimap.width,null);
      dragging = true;
}

function handleMouseUp(e){
      var coords = getRealMiniOfs(e);
      mx = coords.x;
      my = coords.y;
      dragging = false;
}

function handleMouseOut(e){
      var coords = getRealMiniOfs(e);
      mx = coords.x;
      my = coords.y;
      dragging = false;
}

function handleMouseMove(e){
      var coords = getRealMiniOfs(e);
      mx = coords.x;
      my = coords.y;
      if(dragging){
            moveOffsetTo(mx/minimap.width,null);
      }
}

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

function highlightTile(tx,ty,opts){
      var style = 'rgba(0,255,0,0.5)';
      if(opts.style != undefined){style = opts.style;}
      var layer = dlayer.overlayLayer;
      if(opts.layer != undefined){layer = opts.layer;}
      canvasLayers[layer].fillRect(tx*16,ty*16,16,16,style);
}

function outlineTile(tx,ty,thickness,style){
      if(thickness==undefined){thickness = 1;}
      if(style==undefined){style='rgba(0,255,0,0.5)';}
      canvasLayers[dlayer.overlayLayer].drawBox(tx*16,ty*16,16,16,thickness,style);
}

function outlineTileOnDrawLayer(layer, tx, ty, thickness, style){
      if(thickness==undefined){thickness = 1;}
      if(style==undefined){style='rgba(0,255,0,0.5)';}
      layer.drawBox(tx*16,ty*16,16,16,thickness,style);
}

function highlightCol(tx,style){
      if(style==undefined){style='rgba(0,255,0,0.5)';}
      canvasLayers[dlayer.mouseLayer].fillRect(tx*16,0,16,canvas.height,style);
}

function drawTile(image,x,y,layer){
      if(layer == undefined){layer=dlayer.noteLayer;}
      canvasLayers[layer].ctx.drawImage(image, x, y);
}

function decorateBG(){
      drawTile(bgs[0],16,canvas.height-64,0);
      drawTile(bgs[1],(240-10)*16,17*16,0);
}

function drawLimitLine(x){
      canvasLayers[dlayer.overlayLayer].drawLine(x*16,0,x*16,27*16,'rgba(255,0,0,1)',3);
}

function setBG(style){
      canvasLayers[dlayer.bgLayer].fillRect(0,0,canvas.width,canvas.height,style);
}

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

function drawLabel(x,y,str){
      canvasLayers[dlayer.mouseLayer].text(x,y,str);
}

function loadBGs(){
      return new Promise(function(resolve,reject){
            Promise.all([
                  getImg('bg/sign.png'),
                  getImg('bg/goal.png')
            ]).then(function(loaded){
                  //console.log('BGs loaded');
                  bgs = loaded;
                  resolve(loaded);
            });
      });
}

function makeLayers(amount, width, height){
      var arr = [];
      var i;
      for(i=0;i<amount;i++){
            arr[i] = new DrawLayer(width, height);
      }
      return arr;
}

function refreshCanvas(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      var i;
      for(i=0;i<canvasLayers.length;i++){
            if(!canvasLayers[i].isVisible){continue;}
            ctx.drawImage(canvasLayers[i].canvas,0,0,canvasLayers[i].canvas.width,canvasLayers[i].canvas.height);
      }
}

function refreshMini(){
      ctxMini.clearRect(0,0,minimap.width,minimap.height);
      var i;
      for(i=0;i<miniLayers.length;i++){
            if(!miniLayers[i].isVisible){continue;}
            ctxMini.drawImage(miniLayers[i].canvas,0,0,miniLayers[i].width,miniLayers[i].canvas.height);
      }
}

function setMiniZoomY(zoom){
      minimapZoomY = zoom;
}

minimap.onmousedown = function(e){handleMouseDown(e);};
minimap.onmousemove = function(e){handleMouseMove(e);};
minimap.onmouseup = function(e){handleMouseUp(e);};
minimap.onmouseout = function(e){handleMouseOut(e);};

canvas.onmousemove = function(e){handleMove(e);};
canvas.onclick = function(e){handleClick(e);};