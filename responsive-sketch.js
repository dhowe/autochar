
let w = window.innerWidth;
let h = window.innerHeight;

function setup() {
  canvas = createCanvas(w, h * .99);
}

function draw() {
  background(255, 255, 128);
  fill(200, 200, 200);
  noStroke();
  rect(20, 20, w - 40, h - 40);
}

window.onresize = function () {
  w = window.innerWidth;
  h = window.innerHeight;
  canvas.size(w, h * .99);
}