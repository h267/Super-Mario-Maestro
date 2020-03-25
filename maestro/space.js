// Here we go!

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

      checkCollisionWith(otherStruct){
            let dists = this.collisionBox.getCollisionDistWith(otherStruct.collisionBox);
            if(dists.xdist == 0 && dists.ydist < 0){ // Can be merged into a cell

                  // TODO: Finish adjustments
                  let ydiff = this.collisionBox.y - otherStruct.collisionBox.y;
                  let xdiff = this.collisionBox.x - otherStruct.collisionBox.x;

                  // TODO: Expand structures using ydiff
                  if(ydiff != 0) return true;
                  else{
                        let isRightSide = (xdiff < 0);
                        this.trimSide(isRightSide, 2);
                        otherStruct.trimSide(!isRightSide, 2);
                  }
            }
            else{
                  return this.collisionBox.getCollisionWith(otherStruct.collisionBox);
            }
      }

      trimSide(isRightSide, numBlocks){
            let x;
            if(isRightSide) x = 2;
            else x = 0;
            for(let i = 0; i < numBlocks; i++){
                  this.blueprint.set(x, i+1, 0);
            }
      }

      extendUpwardsBy(numBlocks){
            for(let i = 0; i < numBlocks; i++){
                  this.blueprint.insertRow(1, [1, 0, 1]);
            }
            this.collisionBox.h += numBlocks;
            this.entityPos[0].y += numBlocks;
            this.yOfs -= numBlocks;
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