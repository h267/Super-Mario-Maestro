class Blueprint {
    constructor(arr2d) {
        this.grid = [];
        for (let i = 0; i < arr2d[0].length; i++) {
            this.grid[i] = [];
            for (let j = 0; j < arr2d.length; j++) {
                this.grid[i][j] = arr2d[j][i];
            }
        }

        this.width = this.grid.length;
        this.height = this.grid[0].length;
    }

    get(x, y) {
        return this.grid[x][y];
    }

    set(x, y, n) {
        this.grid[x][y] = n;
    }

    insertRow(y, row) {
        for (let i = 0; i < row.length; i++) {
            this.grid[i].splice(y, 0, row[i]);
        }
        this.height++;
    }
}
