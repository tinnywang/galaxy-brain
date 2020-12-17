import {vec3} from "gl-matrix";

export interface Object {
    name: string
    faces: Array<Face>
    normals: Array<number>
    vertices: Array<number>
}

interface Face {
    material: Material
    vertexIndices: Array<number>
}

interface Material {
    ambient: vec3,
    diffuse: vec3,
    specular: vec3,
    specularExponent: number,
}