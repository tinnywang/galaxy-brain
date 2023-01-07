import { vec3 } from "gl-matrix";
import Matrix from "./matrix";

export interface Light {
  position: vec3;
  color: vec3;
  power: number;
  matrix: Matrix;
}
