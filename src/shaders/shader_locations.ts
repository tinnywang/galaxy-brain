export class ShaderLocations {
	private gl: WebGL2RenderingContext;
	private program: WebGLProgram;

	readonly uniforms: Map<string, WebGLUniformLocation | null>;
	readonly attributes: Map<string, GLint>;

	constructor(gl: WebGL2RenderingContext, program: WebGLProgram) {
		this.gl = gl;
		this.program = program;
		this.uniforms = new Map<string, WebGLUniformLocation | null>();
		this.attributes = new Map<string, GLint>();
	}

	getUniform(name: string): WebGLUniformLocation | null {
		return this.uniforms.get(name) ?? null;
	}

	setUniform(name: string) {
		const locations = this.gl.getUniformLocation(this.program, name);
		this.uniforms.set(name, locations);
	}

	getAttribute(name: string): GLint {
		return this.attributes.get(name) ?? -1;
	}

	setAttribute(name: string) {
		const locations = this.gl.getAttribLocation(this.program, name);
		this.attributes.set(name, locations);
	}
}