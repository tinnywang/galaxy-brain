declare module "@ojdom/matrix-rain" {
    export class MatrixController {
		constructor(options?: {}, canvas?: HTMLCanvasElement);
		start: () => void;
		disable: () => void;
		stop: () => void;
	}
}
