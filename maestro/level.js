class Level{
      constructor(areas){
            this.areas = areas;
            if(this.areas == undefined){this.areas = [];}
            this.setDims();
            this.overview = new Area(this.width,this.height);
            this.isTrackOccupant = new Array(this.width);
            this.numberOfOccupants = new Array(this.width);
            this.refresh;
      }
      checkTile(x,y){
            /*var i;
            var occupants = [];
            for(i=0;i<this.areas.length;i++){
                  if(!this.areas[i].visible){continue;}
                  var thisTile = this.areas[i].getTile(x,y);
                  if(thisTile!=null){occupants.push(thisTile);}
            }
            return occupants;*/
            return this.overview.getTile(x,y);
      }
      setDims(){
            var max = {w: 0, h: 0};
            var i;
            for(i=0;i<this.areas.length;i++){
                  if(this.areas[i].w > max.w){max.w = this.areas[i].w;}
                  if(this.areas[i].h > max.h){max.h = this.areas[i].h;}
            }
            this.width = max.w;
            this.height = max.h;
      }
      addArea(area){
            this.areas.push(area);
            this.setDims();
      }
      reset(){
            var i;
            for(i=0;i<this.areas.length;i++){
                  this.areas[i].clear();
            }
      }
      refresh(){
            this.overview = new Area(this.width,this.height);
            this.isTrackOccupant = new Array(this.width);
            this.numberOfOccupants = new Array(this.width);
            var i;
            var j;
            for(i=0;i<this.width;i++){
                  this.isTrackOccupant[i] = new Array(this.height);
                  this.numberOfOccupants[i] = new Array(this.height);
                  for(j=0;j<this.height;j++){
                        this.isTrackOccupant[i][j] = new Array(this.areas.length).fill(false);
                        this.numberOfOccupants[i][j] = 0;
                  }
            }
            var k;
            for(i=0;i<this.areas.length;i++){
                  if(!this.areas[i].visible){continue;}
                  for(j=0;j<this.areas[i].w;j++){
                        for(k=0;k<this.areas[i].h;k++){
                              var thisTile = this.areas[i].getTile(j,k,true);
                              if(thisTile!=null){
                                    this.overview.setTile(j,k,thisTile);
                                    this.isTrackOccupant[j][k][i] = true;
                                    this.numberOfOccupants[j][k]++;
                              }
                        }
                  }
            }
            var i;
      }

}
class Area{
      constructor(w,h){
            this.w = w;
            this.h = h;
            this.ofsX = 0;
            this.ofsY = 0;
            this.visible = true;
            this.clear();
      }
      getTile(x,y,useOfs){
            if(!this.isInBounds(x,y)){return null;}
            if(useOfs){return this.grid[x+this.ofsX][y+this.ofsY];}
            else{return this.grid[x][y];}
      }
      isOccupied(x,y){
            if(!this.isInBounds(x,y)){return true;}
            return this.grid[x][y] != null;
      }
      setTile(x,y,n){
            if(!this.isInBounds(x,y)){return;}
            this.grid[x][y] = n;
            if(x>=this.w){console.log('AA'+x+' v '+this.w);this.w=x+1;}
            if(y>=this.h){this.h=y+1;}
      }
      clearTile(x,y){
            if(!this.isInBounds(x,y)){return;}
            this.grid[x][y] = null;
      }
      clear(){
            var i;
            var j;
            this.grid = [];
            for(i=0;i<this.w;i++){
                  this.grid[i] = [];
                  for(j=0;j<this.h;j++){
                        this.grid[i][j] = null;
                  }
            }
      }
      setVisibility(v){
            this.visible = v;
      }
      isInBounds(x,y){
            return x < this.w + this.ofsX && x >= this.ofsX && y < this.h + this.ofsY && y >= this.ofsY;
      }
}

class Instructions{
      constructor(){
            this.paths = [];
      }
      addPath(path){
            this.paths.push(path);
      }
}

class Path{
      constructor(x1,y1,x2,y2){
            this.sx = x1;
            this.sy = y1;
            this.ex = x2;
            this.ey = y2;
      }
      getXLength(){
            return Math.abs(this.ex-this.sx);
      }
      getYLength(){
            return Math.abs(this.ey-this.sy);
      }
      isRight(){
            return this.ey-this.sy >= 0;
      }
      isUp(){
            return this.ey-this.sy >= 0;
      }
}