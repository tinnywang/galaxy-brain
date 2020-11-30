import $ from "jquery";
import { initGL } from "./gl";
import { Object } from "./object";

$(document).ready(function () {
  const $canvas: JQuery<HTMLCanvasElement> = $("canvas");
  try {
    initGL($canvas[0]);
  } catch (e) {
    console.error(e);
  }

  const path =
    "https://raw.githubusercontent.com/tinnywang/rubiks-cube/master/models/rubiks-cube.json";
  $.get(path, (data: string) => {
    let objects: Array<Object> = JSON.parse(data)
    objects.forEach((o) => {
      console.log(o);
    })
  });
});
