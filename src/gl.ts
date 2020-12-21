export function initGL(canvas: HTMLCanvasElement): WebGLRenderingContext {
  const gl = canvas.getContext("webgl");
  if (gl === null) {
    throw new Error("Unable to initialize WebGL. Your browser or machine may not support it.");
  }

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  return gl;
}
