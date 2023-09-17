export abstract class Animation {
    protected readonly duration: DOMHighResTimeStamp;

    protected elapsedTimestamp: DOMHighResTimeStamp | undefined; 

    private previousTimestamp: DOMHighResTimeStamp | undefined;

    private requestID: number;

    private static queue: Animation[] = [];

    constructor(duration: DOMHighResTimeStamp) {
        this.duration = duration;

        this.requestID = requestAnimationFrame(this.render.bind(this));
    }

    render(timestamp: DOMHighResTimeStamp) {
        if (this.previousTimestamp) {
            this.elapsedTimestamp = timestamp - this.previousTimestamp;
        }
        this.previousTimestamp = timestamp;

        if (this.isDone()) {
            this.cancel();
        } else {
            this.requestID = requestAnimationFrame(this.render.bind(this))
        }
    }

    private cancel() {
        cancelAnimationFrame(this.requestID);
    }

    abstract isDone(): boolean;

    static run(...animations: Animation[]) {
        // Cancel in-progress animations and clear the queue.
        Animation.queue.forEach((a) => a.cancel());
        Animation.queue = [];

        Animation.queue.push(...animations);
    }
}