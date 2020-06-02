/**
 * A controllable event to be triggered every time the graphics refesh.
 */
class Animation {
    /**
     * Initializes the Animation object.
     * @param {function} callback The callback function to run every available frame.
     */
    constructor(callback) {
        this.isRunning = false;
        this.callback = callback;
        this.frameCount = 0;
        this.state = 0;
    }

    /**
     * Begins running the animation.
     */
    start() {
        this.startTime = Date.now();
        this.isRunning = true;
        this.frame();
    }

    /**
     * Stops running the animation.
     */
    stop() {
        this.isRunning = false;
    }

    /**
     * Renders a frame of the animation.
     */
    frame() {
        if (!this.isRunning) return;
        this.frameCount = Math.floor((Date.now() - this.startTime) / (50 / 3));
        this.callback(this);
        window.requestAnimationFrame(this.frame.bind(this));
    }
}