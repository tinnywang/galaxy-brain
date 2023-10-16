import { mat4, vec3 } from "gl-matrix";
import { Animation } from "./animation";

export class Rotation extends Animation {
    private readonly matrices: mat4[];

    private readonly axis: vec3;

    private readonly delta: number;

    private angle: number;

    constructor(matrices: mat4[], axis: vec3, angle: number, duration: DOMHighResTimeStamp) {
        super(duration);

        this.matrices = matrices;
        this.axis = axis;
        this.delta = angle / this.duration;
        this.angle = angle;
    }

    render(timestamp: DOMHighResTimeStamp) {
        super.render(timestamp);

        if (!this.isDone()) {
            let delta = this.elapsedTimestamp ? this.delta * this.elapsedTimestamp : 0;
            if (Math.abs(this.angle) < Math.abs(delta)) {
              delta = this.angle;
            }

            this.matrices.forEach((m) => {
                const rotation = mat4.fromRotation(mat4.create(), delta, this.axis);
                mat4.multiply(m, rotation, m);
            });

            this.angle -= delta;
        }
    }

    isDone(): boolean {
        return this.delta === 0;
    }
}
