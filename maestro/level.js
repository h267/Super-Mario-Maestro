const numStructChunks = 30;

// Debug note: Clicking the ruler tool on the bottom right will give the x-coord of whatever tile it's dragged to

class Level{
      /**
       * Initializes the level object.
       * @constructor
       */
      constructor(){
            this.noteGroups = [];
            this.overview = new Area(this.width,this.height);
            this.isTrackOccupant = new Array(this.width);
            this.numberOfOccupants = new Array(this.width);
            this.entityCount = 0;
            this.powerupCount = 0;
            this.width = levelWidth;
            this.maxWidth = 0;
            this.limitLine = null;
            this.structures = [];
            this.structChunks = [];
            for(let i = 0; i < numStructChunks; i++) this.structChunks[i] = [];
            this.refresh();
      }

      /**
       * Gets the type of tile in the specified location
       * @param {number} x The x-coordinate of the tile.
       * @param {number} y The y-coordinate of the tile.
       * @returns {number} The value of the tile in the location.
       */
      checkTile(x,y){
            return this.overview.getTile(x,y,true);
      }

      checkBgTile(x,y){
            return this.background.getTile(x,y,true);
      }

      checkFgTile(x,y){
            return this.foreground.getTile(x,y,true);
      }

      /**
       * Adds a note group to the stored list. One note group corresponds to a MIDI track.
       * @param {PreloadedNoteGroup} group The NoteGroup to add.
       */
      addNoteGroup(group){
            this.noteGroups.push(group);
      }

      /**
       * Clears all of the notes of a stored note group.
       * @param {number} index The index of the stored note group to clear.
       */
      clearNoteGroup(index){
            if(index >= this.noteGroups.length) return;
            this.noteGroups[index].notes = [];
      }

      /**
       * Refreshes the level overview by plotting values from the stored note groups.
       */
      refresh(){
            console.log('rf');
            this.overview = new Area(levelWidth,levelHeight);
            this.background = new Area(levelWidth,levelHeight);
            this.foreground = new Area(levelWidth,levelHeight);
            this.isTrackOccupant = new Array(levelWidth);
            this.numberOfOccupants = new Array(levelWidth);
            this.structures = [];
            this.structChunks = [];
            for(let i = 0; i < numStructChunks; i++) this.structChunks[i] = [];
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
                        this.isTrackOccupant[i][j] = new Array(this.noteGroups.length).fill(false);
                        this.numberOfOccupants[i][j] = 0;
                  }
            }
            for(i=0;i<this.noteGroups.length;i++){
                  if(!this.noteGroups[i].isVisible){continue;}
                  for(j=0;j<this.noteGroups[i].notes.length;j++){
                        var thisNote = this.noteGroups[i].notes[j];
                        var x = thisNote.x + marginWidth - ofsX;
                        var y = thisNote.pitch + this.noteGroups[i].ofsY - ofsY;
                        if(!isVisible(x,y,marginWidth,0)){continue;}

                        // Set note
                        //this.overview.setTile(x,y,1);
                        this.isTrackOccupant[x][y][i] = true;
                        this.numberOfOccupants[x][y]++;

                        // Set instrument
                        let ins = getMM2Instrument(thisNote.instrument)-2;
                        if(y<26){
                              if(columnCounts[x] == undefined){
                                    columnCounts[x] = {entities: 0, powerups: 0};
                              }
                              let ins = getMM2Instrument(thisNote.instrument)-2;
                              if(MM2Instruments[ins].isPowerup){
                                    this.powerupCount++;
                                    columnCounts[x].powerups++;
                              }
                              else{
                                    this.entityCount++;
                                    columnCounts[x].entities++;
                              }
                              if(x > this.width) this.width = x;
                              //if((this.powerupCount > 100 || this.entityCount > 100) && (this.limitLine == null)) this.limitLine = x + marginWidth + 1;
                              //this.overview.setTile(x,y+1,ins+2);
                              this.isTrackOccupant[x][y+1][i] = true;
                              this.numberOfOccupants[x][y+1]++;
                        }

                        let newStruct = new NoteStructure(0, x, y);
                        let structID = this.structures.length;
                        let chunkLocation = Math.floor(x/(levelWidth/numStructChunks));
                        newStruct.chunkIndex = chunkLocation;
                        newStruct.id = structID;
                        newStruct.entities[0] = ins+2;
                        this.structures[structID] = newStruct;
                        newStruct.chunkListIndex = this.structChunks[chunkLocation].length;
                        this.structChunks[chunkLocation][newStruct.chunkListIndex] = structID;

                        // Debug
                        //newStruct.extendUpwardsBy(3);
                        //newStruct.trimSide(false, 2);
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
            let that = this;
            this.structures.forEach((struct, i) => { // First pass: Handle conflicts
                  for(let j = 0; j < 3; j++){
                        if(struct.chunkIndex+j-1 < 0 || struct.chunkIndex+j-1 >= numStructChunks) continue;
                        for(let k = 0; k < this.structChunks[struct.chunkIndex+j-1].length; k++){
                              let otherStruct = this.structures[this.structChunks[struct.chunkIndex+j-1][k]];
                              if(struct.id == otherStruct.id) continue;
                              if(struct.checkCollisionWith(otherStruct)){
                                    this.markTile(struct.x, struct.y, 1);
                              }
                              //this.highlightCollisionBox(struct.collisionBox);
                        }
                  }
            });
            this.structures.forEach((struct, i) => { // Second pass: Draw the structures
                  that.drawStructure(struct);
            });
            console.log('---');
      }

      drawStructure(structure){
            for(let i = 0; i < structure.blueprint.width; i++){
                  for(let j = 0; j < structure.blueprint.height; j++){
                        let tile = structure.blueprint.get(i,j);
                        if(tile == 0) continue;
                        let x = structure.x + structure.xOfs + i;
                        let y = structure.y - structure.yOfs - j;
                        if(this.overview.getTile(x, y, true) == 1 && tile == 1) continue; // Don't replace note blocks with hard blocks
                        let isBG = getIsBG(tile);
                        if(!isBG) this.overview.setTile(x, y, getLvlTile(tile));
                        else this.background.setTile(x, y, getLvlTile(tile));
                  }
            }
            for(let i = 0; i < structure.entities.length; i++){
                  let x = structure.x-structure.xOfs-structure.entityPos[i].x;
                  let y = structure.y-structure.yOfs-structure.entityPos[i].y;
                  this.overview.setTile(x, y, structure.entities[i]);
                  if(structure.entityProperties[0].parachute) this.foreground.setTile(x, y+1, 0);
            }
      }

      markTile(x, y, id){
            if(id == undefined) id = 2;
            this.foreground.setTile(x, y, id);
      }

      highlightCollisionBox(colBox){
            let color = colBox.x % 2;
            for(let i = 0; i < colBox.w; i++){
                  for(let j = 0; j < colBox.h; j++){
                        this.markTile(colBox.x + i, colBox.y + colBox.h + 1 - j, color + 3);
                  }
            }
      }
}

/**
 * A grid of tiles.
 */
class Area{
      /**
       * Initializes the Area object.
       * @param {number} w The width of the grid.
       * @param {number} h The height of the grid.
       */
      constructor(w,h){
            this.w = w;
            this.h = h;
            this.ofsX = 0;
            this.ofsY = 0;
            this.isVisible = true;
            this.clear();
      }

      /**
       * Gets the ID of the tile at the specified location on the grid.
       * @param {number} x The x-coordinate of the tile to get.
       * @param {number} y The y-coordinate of the tile to get.
       * @param {boolean} useOfs If the x and y offset values should be factored in.
       * @returns {number} The ID of the tile found at the location.
       */
      getTile(x,y,useOfs){
            if(!this.isInBounds(x,y)){return null;}
            if(useOfs){return this.grid[x+this.ofsX][y-this.ofsY];}
            else{return this.grid[x][y];}
      }

      /**
       * Determines if the tile at the specified location is not empty.
       * @param {number} x The x-coordinate of the tile.
       * @param {number} y The y-coordinate of the tile.
       * @returns {boolean} If the tile at the location is not empty.
       */
      isOccupied(x,y){
            if(!this.isInBounds(x,y)){return true;}
            return this.grid[x][y] != null;
      }

      /**
       * Changes the type of tile at the specified location.
       * @param {number} x The x-coordinate of the tile.
       * @param {number} y The y-coordinate of the tile.
       * @param {number} n The tile ID to assign to the location.
       */
      setTile(x,y,n){
            if(!this.isInBounds(x,y)){return;}
            this.grid[x][y] = n;
            if(x>=this.w){this.w=x+1;}
            if(y>=this.h){this.h=y+1;}
      }

      /**
       * Sets the tile at the specified location to null.
       * @param {number} x The x-coordinate of the tile.
       * @param {number} y The y-coordinate of the tile.
       */
      clearTile(x,y){
            if(!this.isInBounds(x,y)){return;}
            this.grid[x][y] = null;
      }

      /**
       * Clears the entire grid.
       */
      clear(){
            var i;
            this.grid = [];
            for(i=0;i<this.w;i++){
                  this.grid[i] = new Array(this.h).fill(null);
            }
      }

      /**
       * Sets whether or not the grid is visible.
       * @param {boolean} v If the grid is visible.
       */
      setVisibility(v){
            this.isVisible = v;
      }

      /**
       * Determines if a specified point is within the bounds of the grid.
       * @param {number} x The x-coordinate of the point.
       * @param {number} y The y-coordinate of the point.
       * @returns {boolean} If the point is in bounds.
       */
      isInBounds(x,y){
            return x < this.w + this.ofsX && x >= this.ofsX && y < this.h + this.ofsY && y >= this.ofsY;
      }
}

/**
 * A simplified Note class optimized for placement in the level.
 */
class PreloadedNote{
      /**
       * Initializes the PreloadedNote.
       * @param {number} pitch The MIDI pitch of the note.
       * @param {number} instrument The MIDI instrument of the note.
       * @param {number} x The x-coordinate of the note to be placed in relation to the entire MIDI file.
       * @constructor
       */
      constructor(pitch, instrument, x){
            this.pitch = pitch;
            this.instrument = instrument;
            this.x = x;
      }
}

/**
 * A group of PreloadedNote objects, often used to represent a single MIDI track.
 */
class PreloadedNoteGroup{
      /**
       * Initializes the PreloadedNoteGroup object.
       */
      constructor(){
            this.notes = [];
            this.ofsY = 0;
            this.isVisible = true;
      }

      /**
       * Creates a new PreloadedNote using the provided data and adds it to the collection of other notes.
       * @param {number} pitch The MIDI pitch of the note.
       * @param {number} instrument The MIDI instrument of the note.
       * @param {number} x The x-coordinate of the note to be placed in relation to the entire MIDI file.
       */
      add(pitch, instrument, x){
            this.notes.push(new PreloadedNote(pitch, instrument, x));
      }

      /**
       * Sets whether or not this PreloadedNoteGroup is visible.
       * @param {boolean} visible If the note group is visible.
       */
      setVisibility(visible){
            this.isVisible = visible;
      }
}

function getLvlTile(n){
      if(n == 0) return 0;
      else if(n < 3) return n + 46;
      else return 1;
}

function getIsBG(n){
      if(n == 2) return true;
      else return false;
}

function removeElementFromArr(arr, n){
      return arr.splice(n, 1);
}