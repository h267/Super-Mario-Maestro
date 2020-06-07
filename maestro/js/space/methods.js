function getRectangleDist(r1, r2) { // Thanks Tri
	let xdist = Math.max(r1.x1 - r2.x2, r2.x1 - r1.x2);
	let ydist = Math.max(r1.y1 - r2.y2, r2.y1 - r1.y2);
	return { xdist, ydist };
}

/* Structure Encoding:
      0 = Air
      1 = Block
      2 = Cloud Block
      3 = Note Block
*/

function getStructTemplate(n) {
	// TODO: Allow other setups to be in cells after fixing interactions
	switch (n) {
	case 0:
		return {
			blueprint: getBlueprint(n),
			entityPos: [{ x: 1, y: 2 }],
			entityProperties: [{ parachute: false }],
			xOfs: -1,
			yOfs: -3,
			collisionBox: getColBox(n),
			canBeInCell: true,
			hasFall: false,
			hasParachute: false
		};
	case 1:
		return {
			blueprint: getBlueprint(n),
			entityPos: [{ x: 1, y: 2 }],
			entityProperties: [{ parachute: false }],
			xOfs: -1,
			yOfs: -5,
			collisionBox: getColBox(n),
			canBeInCell: false,
			hasFall: true,
			hasParachute: false
		};
	case 2:
		return {
			blueprint: getBlueprint(n),
			entityPos: [{ x: 1, y: 2 }],
			entityProperties: [{ parachute: true }],
			xOfs: -1,
			yOfs: -4,
			collisionBox: getColBox(n),
			canBeInCell: false,
			hasFall: false,
			hasParachute: true
		};
	case 3:
		return {
			blueprint: getBlueprint(n),
			entityPos: [{ x: 1, y: 2 }],
			entityProperties: [{ parachute: true }],
			xOfs: -1,
			yOfs: -5,
			collisionBox: getColBox(n),
			canBeInCell: false,
			hasFall: false,
			hasParachute: true
		};
	case 4:
		return {
			blueprint: getBlueprint(n),
			entityPos: [{ x: 1, y: 2 }],
			entityProperties: [{ parachute: true }],
			xOfs: -1,
			yOfs: -6,
			collisionBox: getColBox(n),
			canBeInCell: false,
			hasFall: false,
			hasParachute: true
		};
	case 5:
		return {
			blueprint: getBlueprint(n),
			entityPos: [{ x: 1, y: 2 }],
			entityProperties: [{ parachute: false }],
			xOfs: -1,
			yOfs: -6,
			collisionBox: getColBox(n),
			canBeInCell: false,
			hasFall: true,
			hasParachute: false
		};
	case 6:
		return {
			blueprint: getBlueprint(n),
			entityPos: [{ x: 1, y: 2 }],
			entityProperties: [{ parachute: false }],
			xOfs: -1,
			yOfs: -4,
			collisionBox: getColBox(n),
			canBeInCell: false,
			hasFall: true,
			hasParachute: false
		};

	default:
		console.log('invalid setup');
		return null;
	}
}

function getBlueprint(n) {
	switch (n) {
	case 0:
		return new Blueprint([
			[0, 1, 0],
			[1, 0, 1],
			[1, 2, 1],
			[0, 3, 0]
		]);
	case 1:
		return new Blueprint([
			[0, 1, 0],
			[1, 0, 1],
			[1, 2, 1],
			[1, 0, 1],
			[1, 0, 1],
			[0, 3, 0]
		]);
	case 2:
		return new Blueprint([
			[0, 1, 0],
			[1, 0, 1],
			[1, 2, 1],
			[1, 0, 1],
			[0, 3, 0]
		]);
	case 3:
		return new Blueprint([
			[0, 1, 0],
			[1, 0, 1],
			[1, 2, 1],
			[1, 0, 1],
			[1, 0, 1],
			[0, 3, 0]
		]);
	case 4:
		return new Blueprint([
			[0, 1, 0],
			[1, 0, 1],
			[1, 2, 1],
			[1, 0, 1],
			[1, 0, 1],
			[1, 0, 1],
			[0, 3, 0]
		]);
	case 5:
		return new Blueprint([
			[0, 1, 0],
			[1, 0, 1],
			[1, 2, 1],
			[1, 0, 1],
			[1, 0, 1],
			[1, 0, 1],
			[0, 3, 0]
		]);
	case 6:
		return new Blueprint([
			[0, 1, 0],
			[1, 0, 1],
			[1, 2, 1],
			[1, 0, 1],
			[0, 3, 0]
		]);
	default:
		console.log('invalid blueprint');
		return null;
	}
}

function getColBox(n) {
	switch (n) {
	case 0:
		return new CollisionBox(1, 1, 1, 3);
	case 1:
		return new CollisionBox(1, 1, 1, 5);
	case 2:
		return new CollisionBox(1, 1, 1, 4);
	case 3:
		return new CollisionBox(1, 1, 1, 5);
	case 4:
		return new CollisionBox(1, 1, 1, 6);
	case 5:
		return new CollisionBox(1, 1, 1, 6);
	case 6:
		return new CollisionBox(1, 1, 1, 4);
	default:
		console.log('invalid collision box');
		return null;
	}
}

function createCell() {
	let newCell = new Cell(cells.length);
	cells.push(newCell);
	return newCell;
}

// Where the magic happens
function handleAllConflicts() { // TODO: Let either colliding structure move each other
	let structQueue = [];
	structures.forEach((struct) => structQueue.push({ struct, blacklist: [], forceMove: false }));
	while (structQueue.length > 0) {
		let structEntry = structQueue.shift();
		let { struct } = structEntry;
		let { blacklist } = structEntry;
		struct.checkForCollisions();
		if ((struct.conflictingStructures.length > 0 || obfuscateNotes || structEntry.forceMove || struct.isInForbiddenTile() || !struct.checkForLegality()) && struct.isNote) {
			let success = false;
			let nodeCount = 0;
			let moveQueue = [{ struct, history: [] }];
			while (moveQueue.length > 0) {
				nodeCount++;
				let entry = moveQueue.shift();
				entry.history.forEach((step) => step.struct.moveBySetup(step.setup));
				let attempt = entry.struct.tryAllSetups();
				if (attempt.success) {
					if (nodeCount > 1 && showSetupLogs) {
						console.log(`success after ${nodeCount} attempts for struct ${struct.id}`);
						for (let i = 0; i < entry.history.length; i++) {
							console.log(`${i + 1}. Move ${entry.history[i].struct.id} to ${entry.history[i].setup.offset}`);
						}
						console.log(`${entry.history.length + 1}. Move ${entry.struct.id} to ${entry.struct.setup.offset}`);
					}
					success = true;
					break;
				}
				if (!useSolver) break;
				// TODO: New system for this, maybe none at all
				/* if (attempt.minConflicts > 1 && attempt.minConflicts !== Infinity) {
                    console.log(`splitting ${attempt.minConflicts} conflicts from struct ${struct.id}`);
                    for (let i = 0; i < attempt.availableMoves.length; i++) {
                        let { structs } = attempt.availableMoves[i];
                        if (structs.length === attempt.minConflicts);
                        for (let j = 0; j < attempt.minConflicts; j++) {
                            console.log(`pushing struct ${structs[j].id}`);
                            let newBlacklist = mergeHistoryAndBlacklist(entry.history, blacklist);
                            newBlacklist.push(struct.id);
                            structQueue.push({ struct: structs[j], blacklist: newBlacklist, forceMove: true });
                            structQueue.push({ struct, blacklist: newBlacklist, forceMove: false });
                        }
                    }
                    continue;
                } */
				let availableMoves = attempt.availableMoves.filter(
					(move) => (!(isAlreadyUsed(entry.history, blacklist, move.structs[0]) || move.structs.length > 1))
				);
				/* if (availableMoves.length === 0 && attempt.minConflicts <= 1) {
                    console.log(`queue exhausted for struct ${struct.id}`);
                } */
				for (let i = 0; i < availableMoves.length; i++) {
					let history = entry.history.slice(0);
					history.push({ struct: entry.struct, setup: availableMoves[i].setup, origSetup: entry.struct.setup });
					moveQueue.push({ struct: availableMoves[i].structs[0], history });
				}
				entry.history.forEach((step) => step.struct.moveBySetup(step.origSetup));
				if (nodeCount >= 1024) { // Quit if no solutions are found in time
					console.log(`failed to find solution in time for struct ${struct.id}`);
					break;
				}
			}
			// if (!success) console.log(`out of options for struct ${struct.id}...`);
		}
	}
	if (showSetupLogs) console.log('done');
}

function isAlreadyUsed(history, blacklist, struct) {
	for (let i = 0; i < history.length; i++) {
		if (struct.id === history[i].struct.id) return true;
	}
	for (let i = 0; i < blacklist.length; i++) {
		if (struct.id === blacklist[i]) return true;
	}
	return false;
}

function mergeHistoryAndBlacklist(history, blacklist) {
	let mergedArr = [];
	for (let i = 0; i < history.length; i++) {
		mergedArr.push(history[i].struct.id);
	}
	for (let i = 0; i < blacklist.length; i++) {
		mergedArr.push(blacklist[i]);
	}
	return mergedArr;
}

function getNoteCollisionFromDists(dists) {
	if (dists.xdist === 0 && dists.ydist < -1) return true; // TODO: Change to false and properly compute cell merging
	if (dists.xdist === 0 && dists.ydist === -1) return false;
	return (dists.xdist <= 0 && dists.ydist <= 0 && dists.xdist + dists.ydist < 0);
}

function shuffleArray(array) {
	let counter = array.length;
	while (counter > 0) {
		let index = Math.floor(Math.random() * counter);
		counter--;
		let temp = array[counter];
		array[counter] = array[index];
		array[index] = temp;
	}
	return array;
}
