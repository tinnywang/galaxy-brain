import { Model } from "../models/model";

export abstract class Animation {
    protected model: Model;

    protected value: number;

    protected duration: DOMHighResTimeStamp;

    protected elapsedTimestamp: DOMHighResTimeStamp | undefined; 

    private previousTimestamp: DOMHighResTimeStamp | undefined;

    private requestID: number;

    constructor(model: Model, value: number, duration: DOMHighResTimeStamp) {
        this.model = model;
        this.value = value;
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