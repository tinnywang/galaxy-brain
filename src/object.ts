/* eslint-disable camelcase */

interface Material {
  ambient: number[];
  diffuse: number[];
  specular: number[];
  specular_exponent: number;
}

export interface Face {
  material: Material;
  vertex_indices: number[];
}

export interface Object {
  name: string;
  faces: Face[];
  normals: number[];
  vertices: number[];
}
