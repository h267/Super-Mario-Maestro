// Here we go!


// The plan:
/*
      - Class: Component - Represents a singular setup, which can be a note or space saving setup with multiple notes or a drum machine
            isMovable: Whether the setup is movable.
            x, y: The position
      - A collision checking routine - find all other nodes a node is colliding with and return a list of them
      ...

*/

/* Structure Encoding:
      0 = Air
      1 = Block
      2 = Cloud Block
      3 = Note Block
*/

const structureTemplates = [
      {
            blueprint:
            [
                  [0, 1, 0],
                  [1, 0, 1],
                  [1, 2, 1],
                  [0, 3, 0]
            ],
            entityPos: [ {x: 1, y: 2} ],
            xOfs: -1,
            yOfs: -3,
            collisionBox: {x: 1, y: 1, w: 1, h: 3}
      },
      {
            blueprint:
            [
                  [0, 1, 0],
                  [1, 0, 1],
                  [1, 2, 1],
                  [1, 0, 1],
                  [1, 0, 1],
                  [0, 3, 0]
            ],
            entityPos: [ {x: 1, y: 2} ],
            xOfs: -1,
            yOfs: -5,
            collisionBox: {x: 1, y: 1, w: 1, h: 5}
      },
];

class Structure {
      constructor(type, x, y){
            this.type = type;
            this.x = x;
            this.y = y;

            this.blueprint = structureTemplates[type].blueprint;
            this.entityPos = structureTemplates[type].entityPos;
            this.collisionBox = structureTemplates[type].collisionBox;
            this.xOfs = structureTemplates[type].xOfs;
            this.yOfs = structureTemplates[type].yOfs;
            this.chunkIndex = null;
            this.id = null;
            this.chunkListIndex = null;
            this.entities = [];
      }
      checkCollisionWith(struct2){ // TODO: Multiple collision box support
            let thisXOfs = this.x + this.xOfs + this.collisionBox.x;
            let thisYOfs = this.y + this.yOfs + this.collisionBox.y;
            let struct2XOfs = struct2.x + struct2.xOfs + struct2.collisionBox.x;
            let struct2YOfs = struct2.y + struct2.yOfs + struct2.collisionBox.y;
            let r1 = {
                  x1: thisXOfs,
                  x2: thisXOfs + this.collisionBox.w,
                  y1: thisYOfs,
                  y2: thisYOfs + this.collisionBox.h
            };
            let r2 = {
                  x1: struct2XOfs,
                  x2: struct2XOfs + struct2.collisionBox.w,
                  y1: struct2YOfs,
                  y2: struct2YOfs + struct2.collisionBox.h
            };
            if(getRectangleCollision(r1, r2)){
                  //console.log({r1, r2});
            }
            return getRectangleCollision(r1, r2);
      }
}

function getRectangleCollision(r1, r2){ // Thanks Tri
      let xdist = Math.max(r1.x1 - r2.x2, r2.x1 - r1.x2);
      let ydist = Math.max(r1.y1 - r2.y2, r2.y1 - r1.y2);
      return (xdist <= 0 && ydist <= 0 && xdist + ydist < 0); // If the rectangles are touching, they are colliding, except for corners
}