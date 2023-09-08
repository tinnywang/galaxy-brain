import { Model } from "../models/model";
import { Animation } from "./animation";

export class Scale extends Animation<Model> {
    private readonly scale: number;

    private readonly delta: number;

    private readonly scaleUp: boolean;

    constructor(model: Model, n: number, duration: DOMHighResTimeStamp) {
        super(model, duration);

        // If the model was previously scaled by 0.5 and is now being scaled by 2,
        // its final scale should be 0.5 * 2 = 1.
        const s = this.model.getScale();
        this.scale = s * n;

        this.delta = Math.abs(s - this.scale) / this.duration;

        this.scaleUp = n > 1;
    }

    render(timestamp: DOMHighResTimeStamp) {
        super.render(timestamp);

        // Scale the model linearly over time.
        // If the model were scaled by delta every frame, it would be scaled exponentially (delta^n).
        if (!this.isDone()) {
           let delta = this.elapsedTimestamp ? this.delta * this.elapsedTimestamp : 0;
            if (!this.scaleUp) {
                delta *= -1
            }
            this.model.scale(1 + delta / this.model.getScale());
        }
    }

    isDone() {
        const s = this.model.getScale();
        return this.scaleUp ? s >= this.scale : s <= this.scale;
    }
}