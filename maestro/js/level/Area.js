/**
 * A grid of tiles.
 */
class Area {
	/**
     * Initializes the Area object.
     * @param {number} w The width of the grid.
     * @param {number} h The height of the grid.
     */
	constructor(w, h) {
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
	getTile(x, y, useOfs) {
		if (!this.isInBounds(x, y)) {
			return null;
		}
		if (useOfs) {
			return this.grid[x + this.ofsX][y - this.ofsY];
		}
		return this.grid[x][y];
	}

	/**
     * Determines if the tile at the specified location is not empty.
     * @param {number} x The x-coordinate of the tile.
     * @param {number} y The y-coordinate of the tile.
     * @returns {boolean} If the tile at the location is not empty.
     */
	isOccupied(x, y) {
		if (!this.isInBounds(x, y)) {
			return true;
		}
		return this.grid[x][y] !== null;
	}

	/**
     * Changes the type of tile at the specified location.
     * @param {number} x The x-coordinate of the tile.
     * @param {number} y The y-coordinate of the tile.
     * @param {number} n The tile ID to assign to the location.
     */
	setTile(x, y, n) {
		if (!this.isInBounds(x, y)) {
			return;
		}
		this.grid[x][y] = n;
	}

	/**
     * Sets the tile at the specified location to null.
     * @param {number} x The x-coordinate of the tile.
     * @param {number} y The y-coordinate of the tile.
     */
	clearTile(x, y) {
		if (!this.isInBounds(x, y)) {
			return;
		}
		this.grid[x][y] = null;
	}

	/**
     * Clears the entire grid.
     */
	clear() {
		let i;
		this.grid = [];
		for (i = 0; i < this.w; i++) {
			this.grid[i] = new Array(this.h).fill(null);
		}
	}

	/**
     * Sets whether or not the grid is visible.
     * @param {boolean} v If the grid is visible.
     */
	setVisibility(v) {
		this.isVisible = v;
	}

	/**
     * Determines if a specified point is within the bounds of the grid.
     * @param {number} x The x-coordinate of the point.
     * @param {number} y The y-coordinate of the point.
     * @returns {boolean} If the point is in bounds.
     */
	isInBounds(x, y) {
		return x < this.w + this.ofsX && x >= this.ofsX && y < this.h + this.ofsY && y >= this.ofsY;
	}
}
