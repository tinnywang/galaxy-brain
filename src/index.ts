import $ from "jquery";

$(document).ready(function() {
  const path = "https://raw.githubusercontent.com/tinnywang/rubiks-cube/master/models/rubiks-cube.json";

  $.get(path, () => {});
});
