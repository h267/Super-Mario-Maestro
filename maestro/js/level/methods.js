function getLvlTile(n) {
	if (n === 0) return 0;
	if (n < 3) return n + MM2Instruments.length + 1; // Building tiles come after all entities
	return 1;
}

function getIsBG(n) {
	if (n === 2) return true;
	return false;
}

function removeElementFromArr(arr, n) {
	return arr.splice(n, 1);
}

function resetSpatialData(deleteStructs) { // TODO: Reset chunks
	if (deleteStructs) structures = [];
	cells = [];
	chunks = [];
	for (let i = 0; i < numStructChunks; i++) chunks[i] = [];
	if (!deleteStructs) {
		structures.forEach((thisStruct) => {
			thisStruct.putInChunk();
		});
	}
}
