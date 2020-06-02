const noteHeightLimit = 6; // 3 block jump
let buildSetups = [];
const blocksPerChunk = 8;
const numStructChunks = 240 / blocksPerChunk;

const noteColBoxHeights = [3, 5, 4, 5, 6, 6, 4];
const structTemplates = [
    { // 0: Default
        entityProperties: [{parachute: false}]
    },
    { // 1: 2 Block Drop
        entityProperties: [{parachute: false}]
    },
    { // 2: 1 Block Parachute
        entityProperties: [{parachute: true}]
    },
    { // 3: 2 Block Parachute
        entityProperties: [{parachute: true}]
    },
    { // 4: 3 Block Parachute
        entityProperties: [{parachute: true}]
    },
    { // 5: 3 Block Drop
        entityProperties: [{parachute: false}]
    },
    { // 6: 1 Block Drop
        entityProperties: [{parachute: false}]
    }
];
const obfuscateNotes = false; // TODO: Shuffle setups array multiple times to make this work

let structures = [];
let cells = [];
let chunks = [];
for (let i = 0; i < numStructChunks; i++) chunks[i] = [];

let forbiddenTiles = [];