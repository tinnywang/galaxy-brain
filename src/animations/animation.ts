export abstract class Animation<T> {
    protected readonly model: T;

    protected readonly duration: DOMHighResTimeStamp;

    protected elapsedTimestamp: DOMHighResTimeStamp | undefined; 

    private previousTimestamp: DOMHighResTimeStamp | undefined;

    private requestID: number;

    constructor(model: T, duration: DOMHighResTimeStamp) {
        this.model = model;
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

    cancel() {
        cancelAnimationFrame(this.requestID);
    }

    abstract isDone(): boolean;
}