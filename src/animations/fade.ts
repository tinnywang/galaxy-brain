import { Light } from "../light";
import { Model } from "../models/model";
import { Animation } from "./animation";

abstract class Fade extends Animation<Model | Light> {
    private delta: number;

    constructor(model: Model | Light, alphaDelta: number, duration: DOMHighResTimeStamp) {
        super(model, duration);

        this.delta = alphaDelta / this.duration;
    }

    render(timestamp: DOMHighResTimeStamp) {
        super.render(timestamp);

        if (!this.isDone()) {
            const delta = this.elapsedTimestamp ? this.delta * this.elapsedTimestamp : 0;
            this.model.alpha += delta;
        }
    }
}

export class FadeIn extends Fade {
    constructor(model: Model | Light, duration: DOMHighResTimeStamp) {
        super(model, 1 - model.alpha, duration);
    }

    isDone() {
        this.model.alpha = Math.min(this.model.alpha, 1);
        return this.model.alpha === 1;
    }
}

export class FadeOut extends Fade {
    constructor(model: Model | Light, duration: DOMHighResTimeStamp) {
        super(model, -model.alpha, duration);
    }

    isDone() {
        this.model.alpha = Math.max(this.model.alpha, 0);
        return this.model.alpha === 0;
    }
}