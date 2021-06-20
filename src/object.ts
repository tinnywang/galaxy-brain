import { vec3 } from "gl-matrix";

/* eslint-disable camelcase */

interface Material {
  ambient: vec3;
  diffuse: vec3;
  specular: vec3;
  specular_exponent: number;
}

interface Face {
  material: Material;
  vertex_indices: Array<number>;
}

export interface Object {
  name: string;
  faces: Array<Face>;
  normals: Array<number>;
  vertices: Array<number>;
}
