import { mat4, vec3 } from "gl-matrix";
import { Animation } from "./animation";

export class Scale extends Animation {
    private readonly matrix: mat4;

    private readonly scale: number;

    private readonly delta: number;

    private readonly scaleUp: boolean;

    constructor(matrix: mat4, n: number, duration: DOMHighResTimeStamp) {
        super(duration);

        this.matrix = matrix;

        // If the model was previously scaled by 0.5 and is now being scaled by 2,
        // its final scale should be 0.5 * 2 = 1.
        const s = this.scaling();
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
                delta *= -1;
            }

            const scaling = this.scaling();
            if ((this.scaleUp && this.scale < scaling + delta) || (!this.scaleUp && this.scale > scaling + delta)) {
                delta = this.scale - scaling;
            }

            const s = 1 + delta / scaling;
            mat4.scale(this.matrix, this.matrix, vec3.fromValues(s, s, s));
        }
    }

    isDone() {
        return this.scale === this.scaling();
    }

    private scaling() {
        return mat4.getScaling(vec3.create(), this.matrix)[0];
    }
}
