class WebGL2 {
  static renderingContext(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2", {
      antialias: false,
    });
    if (gl === null) {
      throw new Error(
        "Unable to initialize WebGL. Your browser or machine may not support it."
      );
    }

    gl.clear(gl.COLOR_BUFFER_BIT);

    return gl;
  }

  static createColorTextures(
    gl: WebGL2RenderingContext,
    n: number,
    width?: number,
    height?: number
  ): Array<WebGLTexture> {
    return WebGL2.createTextures(
      gl,
      n,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      gl.LINEAR,
      width,
      height
    );
  }

  static createDepthTextures(
    gl: WebGL2RenderingContext,
    n: number
  ): Array<WebGLTexture> {
    return WebGL2.createTextures(
      gl,
      n,
      gl.DEPTH_COMPONENT24,
      gl.DEPTH_COMPONENT,
      gl.UNSIGNED_INT,
      gl.NEAREST
    );
  }

  static createTextures(
    gl: WebGL2RenderingContext,
    n: number,
    format: number,
    attachment: number,
    type: number,
    filter: number,
    width?: number,
    height?: number
  ): Array<WebGLTexture> {
    const textures = new Array<WebGLTexture>();

    for (let i = 0; i < n; i += 1) {
      const texture = gl.createTexture();
      if (texture === null) {
        throw new Error("Unable to create texture.");
      }

      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        format,
        width ?? gl.drawingBufferWidth,
        height ?? gl.drawingBufferHeight,
        0,
        attachment,
        type,
        null
      );

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.NONE);

      textures.push(texture);
    }

    return textures;
  }

  static createImageTexture(gl: WebGL2RenderingContext, src: string): WebGLTexture {
    const texture = gl.createTexture();
    if (texture === null) {
      throw new Error("Unable to create texture.");
    }

    const image = new Image();
    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    image.src = src;

    return texture;
  }
}

export default WebGL2;
