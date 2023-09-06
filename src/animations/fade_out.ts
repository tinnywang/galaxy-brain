import { Model } from "../models/model";
import { Animation } from "./animation";

export class FadeOut extends Animation {
    private readonly delta: number;

    constructor(model: Model, duration: DOMHighResTimeStamp) {
        super(model, duration);

        this.delta = model.alpha / duration;
    }

    render(timestamp: DOMHighResTimeStamp) {
        super.render(timestamp);

        if (!this.isDone()) {
            const delta = this.elapsedTimestamp ? this.delta * this.elapsedTimestamp : 0;
            this.model.alpha -= delta;
        }
    }

    isDone() {
        return this.model.alpha <= 0;
    }
}
