interface ColorStop {
  offset: number;
  color: string;
}

class Canvas2D {
  private static GRADIENTS: { [stage: number]: ColorStop[] } = {
    0: [
      { offset: 0, color: "#0D1C3D" },
      { offset: 1, color: "#06050B" },
    ],
    1: [
      { offset: 0, color: "#00D4FF" },
      { offset: 0.75, color: "#090979" },
      { offset: 1, color: "#020024" },
    ],
    2: [
      { offset: 0, color: "#E44B29" },
      { offset: 0.75, color: "#680000" },
      { offset: 1, color: "#280000" },
    ],
    3: [
      { offset: 0, color: "#053893" },
      { offset: 1, color: "#010836" },
    ],
  };

  static renderingContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
    const ctx = canvas.getContext("2d");
    if (ctx == null) {
      throw new Error("Unable to initialize CanvasRenderingContext2D.");
    }

    Canvas2D.evolve(ctx, 0);
    return ctx;
  }

  static evolve(ctx: CanvasRenderingContext2D, stage: number) {
    const [width, height] = [ctx.canvas.width, ctx.canvas.height];
    const [x, y] = [width / 2, height / 2];

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, height);
    Canvas2D.GRADIENTS[stage].forEach((cs) => {
      gradient.addColorStop(cs.offset, cs.color);
    });

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
}

export default Canvas2D;
