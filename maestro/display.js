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

function drawCircle(x,y,r,style){
      if(style == undefined){style = 'black';}
      ctx.fillStyle = style;
      ctx.beginPath();
      ctx.arc(x,y,r,0,2*Math.PI,false);
      ctx.lineWidth = 1;
      ctx.fill();
}

function drawLine(x1,y1,x2,y2,style,width){
      if(style == undefined){style = 'black';}
      if(width == undefined){width = 1;}
      ctx.beginPath();
      ctx.moveTo(x1,y1);
      ctx.lineTo(x2,y2);
      ctx.lineWidth = width;
      ctx.strokeStyle = style;
      ctx.stroke();
}

function cls(){
	ctx.fillStyle = "white";
	ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function getWH(){
      return {w: canvas.width, h: canvas.height};
}

function getGridWH(){
      return {w: Math.ceil(canvas.width/16), h: Math.ceil(canvas.height/16)};
}

function drawGrid(){
      var i;
      for(i=0;i<canvas.width/16;i++){
            drawLine(i*16,0,i*16,canvas.height-1,'rgba(0,0,0,0.2)');
            if(i%24==0){drawLine(i*16,0,i*16,canvas.height-1,'rgba(0,0,0,0.25)',2);}
      }
      for(i=0;i<canvas.height/16;i++){
            drawLine(0,i*16,canvas.width-1,i*16,'rgba(0,0,0,0.2)');
            if(i%13==0){drawLine(0,i*16,canvas.width-1,i*16,'rgba(0,0,0,0.25)',2);}
      }
}

function fillRect(x,y,w,h,style){
      if(style == undefined){style = 'black';}
      ctx.fillStyle = style;
      ctx.fillRect(x,y,w,h);
}

function getImg(loc){
      return new Promise(function(resolve,reject){
            var img = new Image();
            img.onload = function(){
                  resolve(img);
            };
            img.onerror = function(){
                  console.log('Failed to load: '+loc);
                  reject(img);
            }
            img.src = loc;
      });
}

function drawTile(image,x,y){
      ctx.drawImage(image, x, y);
}

function miniPlot(x,y,style){
      if(style == undefined){style = 'black';}
      ctxMini.fillStyle = style;
      ctxMini.fillRect(x,minimap.height-y,1,1);
}

// Minimap graphics functions

function setMiniWidth(w){
      minimap.width = w;
}

function miniClear(){
      ctxMini.fillStyle = "white";
	ctxMini.clearRect(0, 0, minimap.width, minimap.height);
}

function miniBox(x,y,w,h,style){
      if(style == undefined){style = 'rgba(0,178,238,0.4)';}
      ctxMini.fillStyle = style;
      ctxMini.fillRect(x,minimap.height-y,w,h);
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

function setTempoText(text){
      document.getElementById('tempop').innerHTML = text;
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

function highlightTile(tx,ty,style){
      if(style==undefined){style='rgba(0,255,0,0.5)';}
      fillRect(tx*16,ty*16,16,16,style);
}

function highlightCol(tx,style){
      if(style==undefined){style='rgba(0,255,0,0.5)';}
      fillRect(tx*16,0,16,canvas.height,style);
}

function text(x,y,str){
      ctx.font = '11px Arial';
      var size = {h: 11, w: ctx.measureText(str).width};
      ctx.fillStyle = 'white'
      ctx.fillRect(x,(y-size.h)+2,size.w,size.h);
      ctx.fillStyle='black';
      ctx.fillText(str,x,y);
}

function captureMini(){
      var data = ctxMini.getImageData(0,0,minimap.width,minimap.height);
      lastMiniData = data;
      return data;
}

function setMiniData(imgData){
      if(imgData == null){return;}
      ctxMini.putImageData(imgData,0,0);
}

function getLastMiniData(){
      return lastMiniData;
}

function decorateBG(){
      if(bgs==null){
            loadBGs().then(function(loaded){
                  bgs = loaded;
                  decorateBG();
            });
            return;
      }
      drawTile(bgs[0],16,canvas.height-64);
      drawTile(bgs[1],(240-10)*16,17*16);
}

function drawLimitLine(x){
      drawLine(x*16,0,x*16,27*16,'rgba(255,0,0,1)',3);
}

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

minimap.onmousedown = function(e){handleMouseDown(e);};
minimap.onmousemove = function(e){handleMouseMove(e);};
minimap.onmouseup = function(e){handleMouseUp(e);};
minimap.onmouseout = function(e){handleMouseOut(e);};

canvas.onmousemove = function(e){handleMove(e);};
canvas.onclick = function(e){handleClick(e);};