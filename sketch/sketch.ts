// sun animation position
let sunx = 0;
let suny = 280;
let sundown = false;
let r = Math.random() * 256;
let r2 = Math.random() * 256;
let b = Math.random() * 256;
let b2 = Math.random() * 256;
let g = 100;

function setup() {
  createCanvas(400, 375);

  frameRate(10);
  let backgroundColor = lerpColor(color(r, g, b), color(256, 256, 256), 0.75);
  background(backgroundColor);
}

function draw() {
  // todo better algo for color palette generation?
  let backgroundColor = lerpColor(color(r, g, b), color(256, 256, 256), 0.75);
  background(backgroundColor);

  let x = 100;
  let y = 350;
  //Set up ground
  let groundcolor = lerpColor(color(r2, g, b2), color(256, 256, 256), 0.1);
  fill(groundcolor);
  rect(0, y - 75, 400, 150);

  // Set up hills.
  // todo: algo generate hill placement

  let c = color(r, g, b);
  fill(c);
  noStroke();

  var canvas = <HTMLCanvasElement>document.getElementById("mycanvas");
  var drawingContext = canvas.getContext("2d");
  drawingContext.shadowOffsetX = 1;
  drawingContext.shadowOffsetY = -1;
  drawingContext.shadowBlur = 2;
  drawingContext.shadowColor = lerpColor(c, color(0, 0, 0), 0.5).toString();
  arc(x + 20, y - 72, 250, 50, PI, 2 * PI);
  arc(320, y - 50, 250, 70, PI, 2 * PI);

  let c2 = color(r2, g, b2);
  fill(c2);
  drawingContext.shadowColor = lerpColor(c2, color(0, 0, 0), 0.5).toString();
  //arc(x+40, y-40, 90, 90, PI, 2*PI);
  //293120arc(0, y-40, 90, 90, PI, 2*PI);
  arc((x + 40) / 2, y - 40, 90, 45, PI, 2 * PI);
  arc(400 - (x + 40) / 2 - 20, y - 30, 90, 45, PI, 2 * PI);
  arc(150, y - 58, 100, 70, PI, 2 * PI);

  let c3 = lerpColor(c, c2, 0.33);
  fill(c3);
  drawingContext.shadowColor = lerpColor(c3, color(0, 0, 0), 0.5).toString();
  arc(x + 25, y, 200, 125, PI, 2 * PI);
  arc(x + 125, y, 200, 140, PI, 2 * PI);

  let darkerC2 = lerpColor(c2, color(0, 0, 0), 0.1);
  fill(darkerC2);
  drawingContext.shadowOffsetX = 1;
  drawingContext.shadowOffsetY = -1;
  drawingContext.shadowBlur = 1;
  drawingContext.shadowColor = lerpColor(
    darkerC2,
    color(0, 0, 0),
    0.5
  ).toString();
  ellipse(x + 100, y, 700, 75);

  // Set up sun.
  let sunColor = color(255, 170, 0);
  // no shadow for the sun, it's the sun!
  drawingContext.shadowOffsetX = 0;
  drawingContext.shadowOffsetY = 0;
  drawingContext.shadowBlur = 0;
  fill(sunColor);
  ellipse(sunx, suny, 50, 50);
  sunx += 10;
  if (sunx < 200 && !sundown) {
    suny -= 5;
  } else {
    sundown = true;
    suny += 5;
  }
}
