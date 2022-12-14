class WebGL2 {
  static renderingContext(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
    });
    if (gl === null) {
      throw new Error(
        "Unable to initialize WebGL. Your browser or machine may not support it."
      );
    }

    gl.clearColor(1, 1, 1, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    return gl;
  }

  static createColorTextures(
    gl: WebGL2RenderingContext,
    n: number
  ): Array<WebGLTexture> {
    return WebGL2.createTextures(
      gl,
      n,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      gl.LINEAR
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

  static createImageTexture(
    gl: WebGL2RenderingContext,
    src: string
  ): WebGLTexture {
    const texture = gl.createTexture();
    if (texture === null) {
      throw new Error("Unable to create texture.");
    }

    const image = new Image();
    image.src = src;
    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image
      );
      // The image's dimensions must be a power of 2.
      gl.generateMipmap(gl.TEXTURE_2D);
    };

    return texture;
  }

  static createTextures(
    gl: WebGL2RenderingContext,
    n: number,
    format: number,
    attachment: number,
    type: number,
    filter: number
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
        gl.drawingBufferWidth,
        gl.drawingBufferHeight,
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
}

export default WebGL2;
