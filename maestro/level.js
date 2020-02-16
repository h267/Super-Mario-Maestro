class Level{
      constructor(areas){
            this.areas = areas;
            this.noteGroups = [];
            if(this.areas == undefined){this.areas = [];}
            this.overview = new Area(this.width,this.height);
            this.isTrackOccupant = new Array(this.width);
            this.numberOfOccupants = new Array(this.width);
            this.entityCount = 0;
            this.powerupCount = 0;
            this.width = levelWidth;
            this.limitLine = null;
            this.refresh();
      }
      checkTile(x,y){
            return this.overview.getTile(x,y,true);
      }
      getTileOccupants(x,y){
            var i;
            var occupants = [];
            for(i=0;i<this.areas.length;i++){
                  if(!this.areas[i].isVisible){continue;}
                  var thisTile = this.areas[i].getTile(x,y,true);
                  if(thisTile!=null){occupants.push(thisTile);}
            }
            return occupants;
      }
      addNoteGroup(group){
            this.noteGroups.push(group);
      }
      clearNoteGroup(index){
            if(index >= this.noteGroups.length) return;
            this.noteGroups[index].notes = [];
      }
      refresh(){
            this.overview = new Area(levelWidth,levelHeight);
            this.isTrackOccupant = new Array(levelWidth);
            this.numberOfOccupants = new Array(levelWidth);
            this.entityCount = 0;
            this.powerupCount = 0;
            this.width = 0;
            this.limitLine = null;
            var columnCounts = [];
            var i;
            var j;
            for(i=0;i<levelWidth;i++){
                  this.isTrackOccupant[i] = new Array(levelHeight);
                  this.numberOfOccupants[i] = new Array(levelHeight);
                  for(j=0;j<levelHeight;j++){
                        this.isTrackOccupant[i][j] = new Array(this.areas.length).fill(false);
                        this.numberOfOccupants[i][j] = 0;
                  }
            }
            for(i=0;i<this.noteGroups.length;i++){ // TODO: Array that keeps track of the number of entities and powerups in one column, determine lim line w/ it
                  if(!this.noteGroups[i].isVisible){continue;}
                  for(j=0;j<this.noteGroups[i].notes.length;j++){
                        var thisNote = this.noteGroups[i].notes[j];
                        var x = thisNote.x + marginWidth - ofsX;
                        var y = thisNote.pitch + this.noteGroups[i].ofsY - ofsY;
                        if(!isVisible(x,y,marginWidth,0)){continue;}

                        // Set note
                        this.overview.setTile(x,y,1);
                        this.isTrackOccupant[x][y][i] = true;
                        this.numberOfOccupants[x][y]++;

                        // Set instrument
                        if(y<26){
                              if(columnCounts[x] == undefined){
                                    columnCounts[x] = {entities: 0, powerups: 0};
                              }
                              var ins = getMM2Instrument(thisNote.instrument)-2;
                              if(instruments[ins].isPowerup){
                                    this.powerupCount++;
                                    columnCounts[x].powerups++;
                              }
                              else{
                                    this.entityCount++;
                                    columnCounts[x].entities++;
                                    if(x > this.width) this.width = x;
                              }
                              //if((this.powerupCount > 100 || this.entityCount > 100) && (this.limitLine == null)) this.limitLine = x + marginWidth + 1;
                              this.overview.setTile(x,y+1,ins+2);
                              this.isTrackOccupant[x][y+1][i] = true;
                              this.numberOfOccupants[x][y+1]++;
                        }
                  }
            }
            var curCount = {entities: 0, powerups: 0};
            for(i=0;i<columnCounts.length;i++){
                  if(columnCounts[i] == undefined) continue;
                  if(columnCounts[i].entities != undefined) curCount.entities += columnCounts[i].entities;
                  if(columnCounts[i].powerups != undefined) curCount.powerups += columnCounts[i].powerups;
                  if((curCount.entities > 100 || curCount.powerups > 100) && this.limitLine == null){
                        this.limitLine = i;
                  }
            }
      }
}

class Area{
      constructor(w,h){
            this.w = w;
            this.h = h;
            this.ofsX = 0;
            this.ofsY = 0;
            this.isVisible = true;
            this.clear();
      }
      getTile(x,y,useOfs){
            if(!this.isInBounds(x,y)){return null;}
            if(useOfs){return this.grid[x+this.ofsX][y-this.ofsY];}
            else{return this.grid[x][y];}
      }
      isOccupied(x,y){
            if(!this.isInBounds(x,y)){return true;}
            return this.grid[x][y] != null;
      }
      setTile(x,y,n){
            if(!this.isInBounds(x,y)){return;}
            this.grid[x][y] = n;
            if(x>=this.w){this.w=x+1;}
            if(y>=this.h){this.h=y+1;}
      }
      clearTile(x,y){
            if(!this.isInBounds(x,y)){return;}
            this.grid[x][y] = null;
      }
      clear(){
            var i;
            this.grid = [];
            for(i=0;i<this.w;i++){
                  this.grid[i] = new Array(this.h).fill(null);
            }
      }
      setVisibility(v){
            this.isVisible = v;
      }
      isInBounds(x,y){
            return x < this.w + this.ofsX && x >= this.ofsX && y < this.h + this.ofsY && y >= this.ofsY;
      }
}

class PreloadedNote{
      constructor(pitch, instrument, x){
            this.pitch = pitch;
            this.instrument = instrument;
            this.x = x;
      }
}

class PreloadedNoteGroup{
      constructor(){
            this.notes = [];
            this.ofsY = 0;
            this.isVisible = true;
      }
      add(pitch, instrument, x){
            this.notes.push(new PreloadedNote(pitch, instrument, x));
      }
      setVisibility(visible){
            this.isVisible = visible;
      }
}

function binarySearchNoteIndex(arr, queryX){ // Return the index of first instance of a note at the specified x-coordinate
      var lowBound = 0;
      var highBound = arr.length;
      var index = 0;
      var found = false;
      while(!found){
            if(lowBound == highBound){return -1;}
            index = Math.floor((highBound+lowBound)/2);
            if(arr[index].x == queryX && arr[index-1].x != queryX){return index;}
            else if(arr[index].x > queryX || (arr[index].x == queryX && arr[index-1].x == queryX)){highBound = index;}
            else if(arr[index].x < queryX){lowBound = index;}
      }
}