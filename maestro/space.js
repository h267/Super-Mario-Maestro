// Here we go!
const noteHeightLimit = 6; // 3 block jump
const setups = [ // TODO: Port to different tempos
      {offset: -2, structType: 1},
      {offset: -6, structType: 2},
      {offset: -11, structType: 3},
      {offset: -16, structType: 4},
];
const blocksPerChunk = 8;
const numStructChunks = 240/blocksPerChunk;
const noteColBoxHeights = [3, 5, 4, 5, 6];

const structTemplates = [
      {
            entityProperties: [ {parachute: false} ],
      },
      {
            entityProperties: [ {parachute: false} ],
      },
      {
            entityProperties: [ {parachute: true} ],
      },
      {
            entityProperties: [ {parachute: true} ],
      },
      {
            entityProperties: [ {parachute: true} ],
      },
];

let structures = [];
let cells = [];
let chunks = [];
for(let i = 0; i < numStructChunks; i++) chunks[i] = [];

class Blueprint {
      constructor(arr2d){
            this.grid = [];
            for(let i = 0; i < arr2d[0].length; i++){
                  this.grid[i] = [];
                  for(let j = 0; j < arr2d.length; j++){
                        this.grid[i][j] = arr2d[j][i];
                  }
            }

            this.width = this.grid.length;
            this.height = this.grid[0].length;
      }

      get(x, y){
            return this.grid[x][y];
      }

      set(x, y, n){
            this.grid[x][y] = n;
      }

      insertRow(y, row){
            for(let i = 0; i < row.length; i++){
                  this.grid[i].splice(y, 0, row[i]);
            }
            this.height++;
      }
}

/* Collision Types:
   1. The two boxes must be touching.
   2. The two boxes must be intersecting in the x domain and touching in the y domain.
   3. The two boxes must be intersecting in the y domain and touching in the x domain.
*/

class CollisionBox {
      constructor(xOfs, yOfs, w, h, type){
            if(type == undefined) this.type = 0;
            else this.type = type;
            this.xOfs = xOfs;
            this.yOfs = yOfs;
            this.x = this.xOfs;
            this.y = this.yOfs;
            this.w = w;
            this.h = h;
            this.whitelist = [];
      }

      moveTo(x, y){
            this.x = x + this.xOfs;
            this.y = y + this.yOfs;
      }

      getCollisionWith(otherBox){
            let dists = this.getCollisionDistWith(otherBox);
            switch(this.type){
                  case 0:
                        return (dists.xdist <= 0 && dists.ydist <= 0 && dists.xdist + dists.ydist < 0);
                  case 1:
                        return (dists.xdist < 0 && dists.ydist <= 0 && dists.xdist + dists.ydist < 0);
                  case 2:
                        return (dists.xdist <= 0 && dists.ydist < 0 && dists.xdist + dists.ydist < 0);
            }
      }

      getCollisionDistWith(otherBox){
            let r1 = {
                  x1: this.x,
                  x2: this.x + this.w,
                  y1: this.y,
                  y2: this.y + this.h
            };
            let r2 = {
                  x1: otherBox.x,
                  x2: otherBox.x + otherBox.w,
                  y1: otherBox.y,
                  y2: otherBox.y + otherBox.h
            };
            return getRectangleDist(r1, r2);
      }
}

class Structure {
      constructor(type, x, y, id){
            Object.assign(this, getStructTemplate(type));

            this.type = type;
            this.x = x;
            this.y = y;

            this.collisionBox.moveTo(this.x + this.xOfs, this.y);
            if(id == undefined) this.id = structures.length;
            else this.id = id;
            this.chunkIndex = null;
            this.entities = [];
            this.cell = null;
            this.hasModifiedBlueprint = false;
            this.conflictingStructures = [];
            this.isNote = false;
            this.originalX = x;
            this.putInChunk();

            structures.push(this);
      }

      checkForCollisions(){
            this.conflictingStructures = [];
            for(let j = 0; j < 3; j++){
                  if(this.chunkIndex+j-1 < 0 || this.chunkIndex+j-1 >= numStructChunks) continue;
                  for(let k = 0; k < chunks[this.chunkIndex+j-1].length; k++){
                        let otherStruct = chunks[this.chunkIndex+j-1][k];
                        if(this.id == otherStruct.id) continue;
                        if(this.checkCollisionWith(otherStruct)) this.conflictingStructures.push(otherStruct);
                  }
            }
      }

      checkCollisionWith(otherStruct){ // TODO: Multiple collision box support
            return this.collisionBox.getCollisionWith(otherStruct.collisionBox);
      }

      putInChunk(){
            this.chunkIndex = Math.floor(this.x/blocksPerChunk);
            chunks[this.chunkIndex].push(this);
      }

      updateChunkLocation(){ // TODO: Generalize for all structures or move to NoteStructure class
            let curChunk = this.chunkIndex;
            let newChunk = Math.floor(this.x/blocksPerChunk);

            if(newChunk != curChunk){
                  // Remove a reference to the structure in the current chunk
                  let foundIndex = chunks[curChunk].findIndex((thisStruct) => {return (thisStruct.id == this.id);});
                  chunks[curChunk].splice(foundIndex, 1);

                  // Add to the new chunk
                  this.putInChunk();
            }

            // Remove from cell // TODO: Add to new cell 
            // FIXME: Cells that get merged are not handled properly
            let curCell = this.cell;
            if(curCell == null) return;
            curCell.removeStructure(this);
      }
}

class NoteStructure extends Structure {
      constructor(type, x, y){
            super(type, x, y);
            this.isNote = true;
      }

      checkCollisionWith(otherStruct){
            let dists = this.collisionBox.getCollisionDistWith(otherStruct.collisionBox);
            if(dists.xdist == 0 && dists.ydist < -1){ // Merge into a cell
                  return this.checkCellCollision(otherStruct, true);
            }
            else if(dists.xdist == 0 && dists.ydist == -1){
                  return false;
            }
            else{
                  return this.collisionBox.getCollisionWith(otherStruct.collisionBox);
            }
      }

      checkCellCollision(otherStruct, doAdd){
            /*let tID = this.id;
            let oID = otherStruct.id;
            console.log(tID + ' @ ' + this.collisionBox.x + ' <-> ' + oID + ' @ ' + otherStruct.collisionBox.x);*/
            let highestPoint = Math.max(this.collisionBox.y + this.collisionBox.h, otherStruct.collisionBox.y + otherStruct.collisionBox.h);
            let isAcceptable = true;
            let thisCell = this.cell;
            let otherCell = otherStruct.cell;

            // Make sure all structures can be expanded and put into cells
            let isSameCell;
            if(thisCell == null || otherCell == null) isSameCell = false;
            else isSameCell = (otherCell.id == thisCell.id);
            if(isSameCell) return false;
            if(thisCell != null){
                  for(let i = 0; i < thisCell.members.length; i++){
                        isAcceptable = isAcceptable && thisCell.members[i].isExtendableUpwardsTo(highestPoint) && thisCell.members[i].canBeInCell;
                  }
                  isAcceptable = isAcceptable && this.canBeInCell;
            }
            if(otherCell != null && !isSameCell){
                  if(!isSameCell){
                        for(let i = 0; i < otherCell.members.length; i++){
                              isAcceptable = isAcceptable && otherCell.members[i].isExtendableUpwardsTo(highestPoint) && otherCell.members[i].canBeInCell;
                        }
                  }
                  isAcceptable = isAcceptable && otherCell.canBeInCell;
            }
             
      
            // Conflict if there is an issue
            if(!isAcceptable) return true;

            // Else, add to the cell
            if(!doAdd) return false;
            if(thisCell == null && otherCell != null){
                  otherStruct.cell.add(this);
                  thisCell = otherCell;
            }
            else if(thisCell != null && otherCell == null){
                  this.cell.add(otherStruct);
            }
            else if(thisCell != null && otherCell != null && thisCell.id != otherCell.id){
                  thisCell.mergeWith(otherCell);
                  thisCell.add(otherStruct);
            }
            else if(thisCell == null && otherCell == null){
                  let newCell = createCell();
                  newCell.add(this);
                  newCell.add(otherStruct);
                  thisCell = newCell;
            }

            return false;
      }

      trimSide(isRightSide, numBlocks){
            let x;
            if(isRightSide) x = 2;
            else x = 0;
            for(let i = 0; i < numBlocks; i++){
                  if(1+i > this.blueprint.height) break;
                  this.blueprint.set(x, 1+i, 0);
            }
      }

      extendUpwardsBy(numBlocks, isCopyMode){
            if(isCopyMode == undefined) isCopyMode = false;
            if(numBlocks == 0) return;
            if(!isCopyMode){
                  for(let i = 0; i < numBlocks; i++){
                        this.shearInsertRow(3, 1, [1, 0, 1]);
                  }
            }
            else{
                  for(let i = 0; i < numBlocks; i++){
                        this.insertCopyRow(2, this.blueprint.height - 1);
                  }
            }
            this.collisionBox.h += numBlocks;
            this.entityPos[0].y += numBlocks;
            this.yOfs -= numBlocks;
            this.hasModifiedBlueprint = true;
      }

      shearInsertRow(y1, y2, row){ // Specialized function for note blueprints to splice middle rows at y1, but the sides at y2
            for(let i = 0; i < row.length; i++){
                  if(i == 0 || i == row.length - 1) this.blueprint.grid[i].splice(y2, 0, row[i]);
                  else this.blueprint.grid[i].splice(y1, 0, row[i]);
            }
            this.blueprint.height++;
            this.hasModifiedBlueprint = true;
      }

      insertCopyRow(y1, y2){ // Specialized function for note blueprints that inserts a copy of the walls of the row at y1 to y2.
            let row = [];
            for(let i = 0; i < this.blueprint.width; i++){
                  if(i != 0 && i != this.blueprint.width - 1) row.push(0); // Only clone the walls, empty space otherwise
                  else row.push(this.blueprint.get(i, y1));
            }
            for(let i = 0; i < row.length; i++){
                  this.blueprint.grid[i].splice(y2, 0, row[i]);
            }
            this.blueprint.height++;
            this.hasModifiedBlueprint++;
      }

      isExtendableUpwardsTo(yPos){
            return (yPos - this.collisionBox.y <= noteHeightLimit);
      }

      getConflictsForSetups(){ // Hypothetically, if the note offset was something else, how many conflicts would there be?
            let testBox = new CollisionBox(this.collisionBox.xOfs, this.collisionBox.yOfs, this.collisionBox.w, this.collisionBox.h, 0);
            testBox.x = this.collisionBox.x;
            testBox.y = this.collisionBox.y;
            let baseX = this.collisionBox.x;
            let conflicts = [];
            let currentChunk = 0;

            for (let i = 0; i < setups.length; i++) {
                  const thisSetup = setups[i];
                  conflicts[i] = [];
                  if(thisSetup.structType == this.type) continue;
                  testBox.h = noteColBoxHeights[thisSetup.structType];
                  testBox.x = baseX + thisSetup.offset;
                  currentChunk = Math.floor(testBox.x/blocksPerChunk);

                  for (let j = 0; j < 3; j++) {
                        if(currentChunk + j - 1 < 0 || currentChunk + j - 1 >= numStructChunks) continue;
                        const thisChunk = chunks[currentChunk + j - 1];
                        thisChunk.forEach(otherStruct => {
                              let otherBox = otherStruct.collisionBox;
                              let dists = testBox.getCollisionDistWith(otherBox);
                              if(getNoteCollisionFromDists(dists)){
                                    conflicts[i].push(otherStruct);
                              }
                        });
                  }
            }
            return conflicts;
            // TODO: Store total height of cells to quickly evalutate if the struct would make the cell too tall
      }

      moveBySetup(setup){

            // First, remove all references to collisions with this structure
            this.conflictingStructures.forEach(otherStruct => {
                  let foundIndex = otherStruct.conflictingStructures.findIndex((thisStruct) => {return (thisStruct.id == this.id);});
                  otherStruct.conflictingStructures.splice(foundIndex, 1);
            });

            // Change structure type to the appropriate setup
            this.changeToType(setup.structType);

            // Move structure
            let xOfs = setup.offset;
            this.x += xOfs;
            this.collisionBox.x += xOfs;
            this.conflictingStructures = [];

            // Update Chunk
            this.updateChunkLocation();
      }

      changeToType(typeNum){
            this.blueprint = getBlueprint(typeNum);
            let prevLoc = {x: this.collisionBox.x, y: this.collisionBox.y};
            this.collisionBox = getColBox(typeNum);
            this.collisionBox.x = prevLoc.x;
            this.collisionBox.y = prevLoc.y;
            this.yOfs = -this.collisionBox.h;
            this.entityProperties = structTemplates[typeNum].entityProperties;
      }
}

class Cell {
      constructor(id){
            this.id = id;
            this.members = [];
            this.locationMap = {};
            this.highestPoint = 0;
            this.startX = Infinity;
            this.endX = 0;
      }

      add(struct){ // Add a structure to the cell
            this.members.push(struct);
            struct.cell = this;

            let structHighestPoint = struct.collisionBox.y + struct.collisionBox.h;
            this.highestPoint = Math.max(this.highestPoint, structHighestPoint);
            this.startX = Math.min(this.startX, struct.collisionBox.x);
            this.endX = Math.max(this.endX, struct.collisionBox.x);

            this.addToLocMap(struct);
      }

      mergeWith(otherCell){ // Combine two cells together
            otherCell.members.forEach(struct => {
                  this.add(struct);
            });
            otherCell.clear();
      }

      build(){ // Modify the blueprints of each member to form the proper structure
            if(this.members.length == 0) return;
            for (let i = this.startX; i <= this.endX; i++) { // First Pass: Expanding
                  if(this.locationMap[i] == undefined){
                        console.log('Missing structure in cell.');
                        continue;
                  }
                  this.locationMap[i].list.forEach(struct => {
                        let expandDist = this.highestPoint - (struct.collisionBox.y + struct.collisionBox.h);
                        struct.extendUpwardsBy(expandDist);
                  });
            }
            for (let i = this.startX; i < this.endX; i++) { // Second Pass: Trimming
                  this.locationMap[i].list.forEach(struct => {
                        let nextStruct = this.locationMap[i+1].tallest;
                        let trimDist = nextStruct.collisionBox.h - 1;
                        struct.trimSide(true, trimDist);
                        nextStruct.trimSide(false, trimDist);
                  });
            }
      }

      addToLocMap(struct){ // Register a structure in the location map
            const xPos = struct.collisionBox.x;
            if(this.locationMap[xPos] == undefined) this.locationMap[xPos] = {list: [], tallest: struct};
            else{
                  this.locationMap[xPos].list.forEach(localStruct => {
                        let localStructHeight = localStruct.collisionBox.y + localStruct.collisionBox.h;
                        let tallestStructHeight = this.locationMap[xPos].tallest.collisionBox.y + this.locationMap[xPos].tallest.collisionBox.h;
                        if(localStructHeight > tallestStructHeight) this.locationMap[xPos].tallest = localStruct;
                  });
            }
            this.locationMap[xPos].list.push(struct);
      }

      clear(){
            this.members = [];
            this.locationMap = {};
      }

      removeStructure(struct){

            // Remove from member list
            let origIndex = this.members.findIndex((thisStruct) => {return (thisStruct.id == struct.id);});
            this.members.splice(origIndex, 1);

            // Remove from location map
            let origEntry = this.locationMap[struct.originalX];
            let foundIndex = origEntry.list.findIndex((thisStruct) => {return (thisStruct.id == struct.id);});
            origEntry.list.splice(foundIndex, 1);

            // Remove from tallest structure if it is this cell, recalculate as necessary. Also recalculate starting and ending x coords
            if(this.locationMap[struct.originalX].tallest.id == struct.id){
                  let newStartX = 240;
                  let newEndX = 0;
                  if(origEntry.list.length == 0){
                        delete this.locationMap[struct.originalX];
                        if(struct.originalX != this.startX && struct.originalX != this.endX) this.split(origIndex); // FIXME: split by x-coords, safer
                  }
                  else{
                        origEntry.tallest = origEntry.list[0];
                        origEntry.list.forEach(localStruct => {
                              let localStructHeight = localStruct.collisionBox.y + localStruct.collisionBox.h;
                              let tallestStructHeight = origEntry.tallest.collisionBox.y + origEntry.tallest.collisionBox.h;
                              if(localStructHeight > tallestStructHeight) origEntry.tallest = localStruct;
                        });
                  }
                  this.members.forEach(localStruct => {
                        if(localStruct.x < newStartX) newStartX = localStruct.x;
                        if(localStruct.x > newEndX) newEndX = localStruct.x;
                  });
                  this.startX = newStartX;
                  this.endX = newEndX;
            }
            struct.cell = null;
      }

      split(splitPoint){ // Split the cell in two, removing structures from this cell and creating a new one
            // Store structures to be moved
            let moveStructures = [];
            for(let i = splitPoint; i < this.members.length; i++){
                  moveStructures.push(this.members[i]);
            }

            // Remove structures to be moved from this cell
            for(let i = moveStructures.length-1; i >= 0; i--){
                  //console.log('split off '+i);
                  this.removeStructure(moveStructures[i]);
            }

            // Add those structures to a new cell
            let newCell = createCell();
            for(let i = 0; i < moveStructures.length; i++){
                  newCell.add(moveStructures[i]);
            }
      }
}

function getRectangleDist(r1, r2){ // Thanks Tri
      let xdist = Math.max(r1.x1 - r2.x2, r2.x1 - r1.x2);
      let ydist = Math.max(r1.y1 - r2.y2, r2.y1 - r1.y2);
      return {xdist, ydist};
}

/* Structure Encoding:
      0 = Air
      1 = Block
      2 = Cloud Block
      3 = Note Block
*/

function getStructTemplate(n){
      switch(n){
            case 0: return {
                  blueprint: getBlueprint(n),
                  entityPos: [ {x: 1, y: 2} ],
                  entityProperties: [ {parachute: false} ],
                  xOfs: -1,
                  yOfs: -3,
                  collisionBox: getColBox(n),
                  canBeInCell: true,
            };
            case 1: return {
                  blueprint: getBlueprint(n),
                  entityPos: [ {x: 1, y: 2} ],
                  entityProperties: [ {parachute: false} ],
                  xOfs: -1,
                  yOfs: -5,
                  collisionBox: getColBox(n),
                  canBeInCell: true,
            };
            case 2: return {
                  blueprint: getBlueprint(n),
                  entityPos: [ {x: 1, y: 2} ],
                  entityProperties: [ {parachute: true} ],
                  xOfs: -1,
                  yOfs: -4,
                  collisionBox: getColBox(n),
                  canBeInCell: false,
            };
            case 3: return {
                  blueprint: getBlueprint(n),
                  entityPos: [ {x: 1, y: 2} ],
                  entityProperties: [ {parachute: true} ],
                  xOfs: -1,
                  yOfs: -5,
                  collisionBox: getColBox(n),
                  canBeInCell: false,
            };
            case 4: return {
                  blueprint: getBlueprint(n),
                  entityPos: [ {x: 1, y: 2} ],
                  entityProperties: [ {parachute: true} ],
                  xOfs: -1,
                  yOfs: -6,
                  collisionBox: getColBox(n),
                  canBeInCell: false,
            };
            
            // TODO: More setups, like the "up 3" one
      }
}

function getBlueprint(n){
      switch(n){
            case 0: return new Blueprint([
                  [0, 1, 0],
                  [1, 0, 1],
                  [1, 2, 1],
                  [0, 3, 0]
            ]);
            case 1: return new Blueprint([
                  [0, 1, 0],
                  [1, 0, 1],
                  [1, 2, 1],
                  [1, 0, 1],
                  [1, 0, 1],
                  [0, 3, 0]
            ]);
            case 2: return new Blueprint([
                  [0, 1, 0],
                  [1, 0, 1],
                  [1, 2, 1],
                  [1, 0, 1],
                  [0, 3, 0]
            ]);
            case 3: return new Blueprint([
                  [0, 1, 0],
                  [1, 0, 1],
                  [1, 2, 1],
                  [1, 0, 1],
                  [1, 0, 1],
                  [0, 3, 0]
            ]);
            case 4: return new Blueprint([
                  [0, 1, 0],
                  [1, 0, 1],
                  [1, 2, 1],
                  [1, 0, 1],
                  [1, 0, 1],
                  [1, 0, 1],
                  [0, 3, 0]
            ]);
      }
}

function getColBox(n){
      switch(n){
            case 0: return new CollisionBox(1, 1, 1, 3);
            case 1: return new CollisionBox(1, 1, 1, 5);
            case 2: return new CollisionBox(1, 1, 1, 4);
            case 3: return new CollisionBox(1, 1, 1, 5);
            case 4: return new CollisionBox(1, 1, 1, 6);
      }
}

function createCell(){
      let newCell = new Cell(cells.length);
      cells.push(newCell);
      return newCell;
}

// Where the magic happens
function handleAllConflicts(){ // TODO: Search tree, breadth-first search FIXME: Conflicting notes always moved, even if the conflict gets resolved by the movement of the other note
      // FIXME: SMW - Secret.mid, 4 bpb. Screenshot posted in Discord (see level.js)
      structures.forEach(struct => {
            if(struct.conflictingStructures.length > 0 && struct.isNote){
                  //console.log(struct);
                  let offsetConflicts = struct.getConflictsForSetups(); // TODO: Make this return an array of conflicting structs, or null if the offset is impossible
                  //console.log(offsetConflicts);
                  for(let i = 0; i < offsetConflicts.length; i++){
                        if(offsetConflicts[i].length == 0){
                              //console.log('Move ' + setups[i].offset);
                              struct.moveBySetup(setups[i]);
                              struct.debug = setups[i].offset;
                              break;
                        }
                  }
            }
      });
}

function getNoteCollisionFromDists(dists){
      if(dists.xdist == 0 && dists.ydist < -1) return true; // TODO: Change to false and compute cell merging
      else if(dists.xdist == 0 && dists.ydist == -1) return false;
      else return (dists.xdist <= 0 && dists.ydist <= 0 && dists.xdist + dists.ydist < 0);
}