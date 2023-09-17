import { Animation } from "./animation";

interface Fadeable {
    alpha: number;
}

abstract class Fade extends Animation {
    protected object: Fadeable;

    private delta: number;

    constructor(object: Fadeable, delta: number, duration: DOMHighResTimeStamp) {
        super(duration);

        this.object = object;
        this.delta = delta / this.duration;
    }

    render(timestamp: DOMHighResTimeStamp) {
        super.render(timestamp);

        if (!this.isDone()) {
            const delta = this.elapsedTimestamp ? this.delta * this.elapsedTimestamp : 0;
            this.object.alpha += delta;
        }
    }
}

export class FadeIn extends Fade {
    constructor(object: Fadeable, duration: DOMHighResTimeStamp) {
        super(object, 1 - object.alpha, duration);
    }

    isDone() {
        this.object.alpha = Math.min(this.object.alpha, 1);
        return this.object.alpha === 1;
    }
}

export class FadeOut extends Fade {
    constructor(object: Fadeable, duration: DOMHighResTimeStamp) {
        super(object, -object.alpha, duration);
    }

    isDone() {
        this.object.alpha = Math.max(this.object.alpha, 0);
        return this.object.alpha === 0;
    }
}
