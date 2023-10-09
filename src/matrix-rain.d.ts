declare module "@ojdom/matrix-rain" {
  class MatrixController {
    constructor(options?: {}, canvas?: HTMLCanvasElement);
    start: () => void;

    disable: () => void;

    stop: () => void;
  }

  const Matrix: any;

  export { Matrix, MatrixController };
}
