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
            this.chunkListIndex = null;
            this.entities = [];
            this.cell = null;
            this.hasModifiedBlueprint = false;
            this.conflictingStructures = [];
            this.putInChunk();

            structures.push(this);
      }

      checkForCollisions(){
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

      moveTo(x, y){ // TODO: Set this up

      }

      putInChunk(){
            this.chunkIndex = Math.floor(this.x/blocksPerChunk);
            chunks[this.chunkIndex].push(this);
      }
}

class NoteStructure extends Structure {
      constructor(type, x, y){
            super(type, x, y);
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

      getNumConflictsWhenOffsetTo(){ // Hypothetically, if the note offset was something else, how many conflicts would there be?
            // TODO: Loop through all of the offsets, find a way to try them (likely making a new colbox) and struct chunks
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
                        if(localStruct.x > this.locationMap[xPos].tallest.collisionBox.x) this.locationMap[xPos].tallest = localStruct;
                  });
            }
            this.locationMap[xPos].list.push(struct);
      }

      clear(){
            this.members = [];
            this.locationMap = {};
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
                  blueprint: new Blueprint([
                        [0, 1, 0],
                        [1, 0, 1],
                        [1, 2, 1],
                        [0, 3, 0]
                  ]),
                  entityPos: [ {x: 1, y: 2} ],
                  entityProperties: [ {parachute: false} ],
                  xOfs: -1,
                  yOfs: -3,
                  collisionBox: new CollisionBox(1, 1, 1, 3, 0),
                  canBeInCell: true,
            };
            case 1: return {
                  blueprint: new Blueprint([
                        [0, 1, 0],
                        [1, 0, 1],
                        [1, 2, 1],
                        [1, 0, 1],
                        [1, 0, 1],
                        [0, 3, 0]
                  ]),
                  entityPos: [ {x: 1, y: 2} ],
                  entityProperties: [ {parachute: false} ],
                  xOfs: -1,
                  yOfs: -5,
                  collisionBox: new CollisionBox(1, 1, 1, 5, 0),
                  canBeInCell: false,
            };
            case 2: return {
                  blueprint: new Blueprint([
                        [0, 1, 0],
                        [1, 0, 1],
                        [1, 2, 1],
                        [1, 0, 1],
                        [0, 3, 0]
                  ]),
                  entityPos: [ {x: 1, y: 2} ],
                  entityProperties: [ {parachute: true} ],
                  xOfs: -1,
                  yOfs: -4,
                  collisionBox: new CollisionBox(1, 1, 1, 4),
                  canBeInCell: false,
            };
            case 3: return {
                  blueprint: new Blueprint([
                        [0, 1, 0],
                        [1, 0, 1],
                        [1, 2, 1],
                        [1, 0, 1],
                        [1, 0, 1],
                        [0, 3, 0]
                  ]),
                  entityPos: [ {x: 1, y: 2} ],
                  entityProperties: [ {parachute: true} ],
                  xOfs: -1,
                  yOfs: -5,
                  collisionBox: new CollisionBox(1, 1, 1, 5),
                  canBeInCell: false,
            };
            case 4: return {
                  blueprint: new Blueprint([
                        [0, 1, 0],
                        [1, 0, 1],
                        [1, 2, 1],
                        [1, 0, 1],
                        [1, 0, 1],
                        [1, 0, 1],
                        [0, 3, 0]
                  ]),
                  entityPos: [ {x: 1, y: 2} ],
                  entityProperties: [ {parachute: true} ],
                  xOfs: -1,
                  yOfs: -6,
                  collisionBox: new CollisionBox(1, 1, 1, 6),
                  canBeInCell: false,
            };
            
            // TODO: More setups, like the "up 3" one
      }
}

function createCell(){
      let newCell = new Cell(cells.length);
      cells.push(newCell);
      return newCell;
}

function clearCells(){
      cells = [];
}

function resetSpatialInformation(){
      structures = [];
      cells = [];
}

function handleAllConflicts(){ // TODO: Do all spatial conflict resolution stuff here
      structures.forEach(struct => {
            if(struct.conflictingStructures.length > 0){ // TODO: Try offsets
                  console.log(struct);
            }
      });
}