/**
 * An independent canvas to be drawn on top of other DrawLayers and the main canvasses.
 */
class DrawLayer {
    /**
     * Initializes a new DrawLayer with its own virtual canvas element and 2D rendering context.
     * @param {number} width The width of the canvas.
     * @param {number} height The height of the canvas.
     * @constructor
     */
    constructor(width, height) {
        this.isVisible = true;
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        this.width = width;
        this.height = height;
        this.xOfs = 0;
        this.ctx = this.canvas.getContext('2d');
    }

    /**
     * Clears the layer.
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Sets the layer's horizontal offset to some amount.
     * @param {number} x The number of pixels to offset the layer by.
     */
    setXOfs(x) {
        this.xOfs = x;
    }

    /**
     * Draws a circle on the layer.
     * @param {number} x The x-coordinate of the circle's center.
     * @param {number} y The y-coordinate of the circle's center.
     * @param {number} r The radius of the circle.
     * @param {string} style The fill style. (Optional)
     */
    drawCircle(x, y, r, style = 'black') {
        this.ctx.fillStyle = style;
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, 2 * Math.PI, false);
        this.ctx.lineWidth = 1;
        this.ctx.fill();
    }

    /**
     * Draws a straight line between two points on the layer.
     * @param {number} x1 The starting x-coordinate.
     * @param {number} y1 The starting y-coordinate.
     * @param {number} x2 The ending x-coordinate.
     * @param {number} y2 The ending y-coordinate.
     * @param {string} style The stroke style. (Optional)
     * @param {number} width The thickness of the line. (Optional)
     */
    drawLine(x1, y1, x2, y2, style = 'black', width = 1) {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.lineWidth = width;
        this.ctx.strokeStyle = style;
        this.ctx.stroke();
    }

    /**
     * Draws a filled rectangle on the layer.
     * @param {number} x The x-coordinate of the upper left point.
     * @param {number} y The y-coordinate of the upper left point.
     * @param {number} w The width of the rectangle.
     * @param {number} h The height of the rectangle.
     * @param {string} style The fill style (Optional)
     */
    fillRect(x, y, w, h, style = 'black') {
        this.ctx.fillStyle = style;
        this.ctx.fillRect(x, y, w, h);
    }

    /**
     * Draws a hollow rectangle on the layer.
     * @param {number} x The x-coordinate of the upper left point.
     * @param {number} y The y-coordinate of the upper left point.
     * @param {number} w The width of the rectangle.
     * @param {number} h The height of the rectangle.
     * @param {number} thickness The line thickness. (Optional)
     * @param {string} style The fill style. (Optional)
     */
    drawBox(x, y, w, h, thickness = 1, style = 'black') {
        this.ctx.beginPath();
        this.ctx.strokeStyle = style;
        this.ctx.lineWidth = thickness;
        this.ctx.rect(x, y, w, h);
        this.ctx.stroke();
    }

    /**
     * Displays black text on a white rectangle on the layer.
     * @param {number} x The x-coordinate of the upper left point.
     * @param {number} y The y-coordinate of the upper left point.
     * @param {string} str The string of text to be displayed.
     */
    text(x, y, str) {
        this.ctx.font = '11px Arial';
        let size = {h: 11, w: this.ctx.measureText(str).width + 2};
        this.fillRect(x, (y - size.h) + 2, size.w, size.h, 'white');
        this.drawBox(x - 1, (y - size.h) + 1, size.w + 1, size.h + 1, 1, 'black');
        this.ctx.fillStyle = 'black';
        this.ctx.fillText(str, x, y);
    }
}