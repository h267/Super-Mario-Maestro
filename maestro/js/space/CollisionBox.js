/* Collision Types:
   1. The two boxes must be touching.
   2. The two boxes must be intersecting in the x domain and touching in the y domain.
   3. The two boxes must be intersecting in the y domain and touching in the x domain.
*/

class CollisionBox {
	constructor(xOfs, yOfs, w, h, type) {
		if (type === undefined) this.type = 0;
		else this.type = type;
		this.xOfs = xOfs;
		this.yOfs = yOfs;
		this.x = this.xOfs;
		this.y = this.yOfs;
		this.w = w;
		this.h = h;
		this.whitelist = [];
	}

	moveTo(x, y) {
		this.x = x + this.xOfs;
		this.y = y + this.yOfs;
	}

	getCollisionWith(otherBox, options = {}) {
		let dists = this.getCollisionDistWith(otherBox, options);
		switch (this.type) {
		case 0:
			return (dists.xdist <= 0 && dists.ydist <= 0 && dists.xdist + dists.ydist < 0);
		case 1:
			return (dists.xdist < 0 && dists.ydist <= 0 && dists.xdist + dists.ydist < 0);
		case 2:
			return (dists.xdist <= 0 && dists.ydist < 0 && dists.xdist + dists.ydist < 0);
		default:
			console.log('invalid colbox');
			return true;
		}
	}

	getCollisionDistWith(otherBox, options = {}) {
		let r1Height = this.h;
		let r2Height = otherBox.h;
		if (options.thisHeight !== undefined) r1Height = options.thisHeight;
		if (options.otherHeight !== undefined) r2Height = options.otherHeight;
		let r1 = {
			x1: this.x,
			x2: this.x + this.w,
			y1: this.y,
			y2: this.y + r1Height
		};
		let r2 = {
			x1: otherBox.x,
			x2: otherBox.x + otherBox.w,
			y1: otherBox.y,
			y2: otherBox.y + r2Height
		};
		return getRectangleDist(r1, r2);
	}
}
