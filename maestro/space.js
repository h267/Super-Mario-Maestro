// Here we go!
const noteHeightLimit = 5; // 3 block jump

let structures = [];
let cells = [];
let cellHighestPoints = [];

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
      constructor(type, x, y){
            Object.assign(this, getStructTemplate(type));

            this.type = type;
            this.x = x;
            this.y = y;

            this.collisionBox.moveTo(this.x + this.xOfs, this.y + this.yOfs);
            this.chunkIndex = null;
            this.id = null;
            this.chunkListIndex = null;
            this.entities = [];
            this.memberOf = null;
      }

      checkCollisionWith(otherStruct){ // TODO: Multiple collision box support
            return this.collisionBox.getCollisionWith(otherStruct.collisionBox);
      }

      moveTo(x, y){ // TODO: Set this up

      }
}

class NoteStructure extends Structure {
      constructor(type, x, y){
            super(type, x, y);
      }

      checkCollisionWith(otherStruct){ // TODO: Recursive height updates, max height limit
            let dists = this.collisionBox.getCollisionDistWith(otherStruct.collisionBox);
            if(dists.xdist == 0 && dists.ydist < -1){ // Merge into a cell
                  return this.buildCell(otherStruct, dists);
            }
            else if(dists.xdist == 0 && dists.ydist == -1){
                  return false;
            }
            else{
                  return this.collisionBox.getCollisionWith(otherStruct.collisionBox);
            }
      }

      buildCell(otherStruct, dists){
            let tID = this.id;
            let oID = otherStruct.id;
            //console.log(tID + ' @ ' + this.collisionBox.x + ' <-> ' + oID + ' @ ' + otherStruct.collisionBox.x);
            let xdiff = this.collisionBox.x - otherStruct.collisionBox.x;
            let expandDist = (this.collisionBox.y + this.collisionBox.h) - (otherStruct.collisionBox.y + otherStruct.collisionBox.h);
            let highestPoint = Math.max(this.collisionBox.y + this.collisionBox.h, otherStruct.collisionBox.y + otherStruct.collisionBox.h);
            let isAcceptable = true;
            let trimSize;
            let thisCell = this.memberOf;
            let otherCell = otherStruct.memberOf;

            // Make sure all cells can be expanded
            if(thisCell != null){
                  for(let i = 0; i < cells[thisCell].length; i++){
                        isAcceptable = isAcceptable && structures[cells[thisCell][i]].isExtendableUpwardsTo(highestPoint);
                  }
            }
            if(otherCell != null && otherCell != thisCell){
                  for(let i = 0; i < cells[otherCell].length; i++){
                        isAcceptable = isAcceptable && structures[cells[otherCell][i]].isExtendableUpwardsTo(highestPoint);
                  }
            }

            // Conflict if there is an issue
            if(!isAcceptable) return true;

            // Else, add to the cell
            if(thisCell == null && otherCell != null){
                  addToCell(otherStruct.memberOf, otherStruct.id);
                  thisCell = otherCell;
            }
            else if(thisCell != null && otherCell == null){
                  addToCell(this.memberOf, otherStruct.id);
            }
            else if(thisCell != null && otherCell != null && thisCell != otherCell){
                  let newID = mergeCells(thisCell, otherCell);
                  addToCell(newID, this.id);
                  addToCell(newID, otherStruct.id);
                  thisCell = newID;
            }
            else if(thisCell == null && otherCell == null){
                  let newID = createCell();
                  addToCell(newID, this.id);
                  addToCell(newID, otherStruct.id);
                  thisCell = newID;
            }
            // No action is taken when the cells of the two structures match
            // TODO: Sort cell entries by x pos, or have a search function for them

            if(expandDist < 0){
                  //console.log(tID + ' expanded by ' + (-expandDist));
                  this.extendUpwardsBy(-expandDist);
                  trimSize = otherStruct.collisionBox.h - 1;
            }
            else if(expandDist > 0){
                  //console.log(oID + ' expanded by ' + (expandDist));
                  otherStruct.extendUpwardsBy(expandDist);
                  trimSize = this.collisionBox.h - 1;
            }
            else{
                  trimSize = Math.min(this.collisionBox.h, otherStruct.collisionBox.h) - 1;
            }
            //console.log(tID + ' and ' + oID + ' trimmed by '+trimSize);

            let isRightSide = (xdiff < 0);
            this.trimSide(isRightSide, trimSize);
            otherStruct.trimSide(!isRightSide, trimSize);

            let targetY = (this.collisionBox.y + this.collisionBox.h);
            for(let i = 0; i < cells[thisCell].length; i++){
                  let curStruct = structures[cells[thisCell][i]];
                  let expandDist = targetY - (curStruct.collisionBox.y + curStruct.collisionBox.h);
                  if(expandDist > 0){ // FIXME: These are not sorted by x pos!
                        curStruct.extendUpwardsBy(expandDist, true);
                  }
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
      }

      shearInsertRow(y1, y2, row){ // Specialized function for note blueprints to splice middle rows at y1, but the sides at y2
            for(let i = 0; i < row.length; i++){
                  if(i == 0 || i == row.length - 1) this.blueprint.grid[i].splice(y2, 0, row[i]);
                  else this.blueprint.grid[i].splice(y1, 0, row[i]);
            }
            this.blueprint.height++;
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
      }

      isExtendableUpwardsTo(yPos){
            return (yPos - this.collisionBox.y <= noteHeightLimit);
      }
}

function getRectangleDist(r1, r2){ // Thanks Tri
      let xdist = Math.max(r1.x1 - r2.x2, r2.x1 - r1.x2);
      let ydist = Math.max(r1.y1 - r2.y2, r2.y1 - r1.y2);
      return {xdist, ydist};
      //return (xdist <= 0 && ydist <= 0 && xdist + ydist < 0);
}

function isSimpleNote(structID){
      return structID < 5; // TODO: Revise when other setups get added
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
            };
      }
}

function addToCell(cellID, structID){
      cells[cellID].push(structID);
      structures[structID].memberOf = cellID;
      let structHighestPoint = this.collisionBox.y + this.collisionBox.h;
      cellHighestPoints[cellID] = Math.max(cellHighestPoints[cellID], structHighestPoint);
}

function createCell(){
      cells.push([]);
      cellHighestPoints.push(0);
      return cells.length - 1;
}

function mergeCells(origCell, destCell){
      for(var i = 0; i < cells[origCell].length; i++){
            addToCell(destCell, cells[origCell][i]);
      }
      cellHighestPoints[destCell] = Math.max(cellHighestPoints[origCell], cellHighestPoints[destCell]);
      cells[origCell] = [];
      cellHighestPoints[origCell] = 0;
      return origCell;
}

function clearCells(){
      cells = [];
      cellHighestPoints = [];
}