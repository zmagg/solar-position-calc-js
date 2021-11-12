// sun animation position
var sunx = 0;
var suny = 0;

// Day of year
var inputYear = 2021;
var inputMonth = 11;
var inputDay = 11;
var minutesIntoDay = 0;
var lat = 37.8715;
var long = -122.273;
var tzone = -8;

// Randomize two colors.
var r = Math.random() * 256;
var r2 = Math.random() * 256;
var b = Math.random() * 256;
var b2 = Math.random() * 256;
var g = 100;

let canvasWidth = 400;
let canvasHeight = 375;

function setup() {
  createCanvas(canvasWidth, canvasHeight);
  frameRate(10);
  var backgroundColor = lerpColor(color(r, g, b), color(256, 256, 256), 0.75);
  background(backgroundColor);

  createLoop({ duration: 10, gif: { fileName: "sunoops2.gif" } });
}

function draw() {
  var canvas = document.getElementById("mycanvas");
  var drawingContext = canvas.getContext("2d");
  // todo better algo for color palette generation?
  var backgroundColor = lerpColor(color(r, g, b), color(256, 256, 256), 0.75);
  background(backgroundColor);
  var x = 100;
  var y = 350;

  /*
   * Set up sun.
   */
  var sunColor = color(255, 170, 0);
  // no shadow for the sun, it's the sun!
  drawingContext.shadowOffsetX = 0;
  drawingContext.shadowOffsetY = 0;
  drawingContext.shadowBlur = 0;
  fill(sunColor);

  azel = calcAzimuthElevation(
    inputYear,
    inputMonth,
    inputDay,
    minutesIntoDay,
    lat,
    long,
    tzone
  );
  let elevation = azel.elevation;
  let azimuth = azel.azimuth;

  // Humans have a 120 degree frame of view, but the sun rises/sets in 360 degrees.

  // Can't see the sun if it's directly above
  if (azimuth > 120 && azimuth < 240 && elevation < 70) {
    sunx = ((azimuth - 120) / 120) * canvasWidth;
    suny = canvasHeight - (elevation / 90) * canvasHeight - 75;
    ellipse(sunx, suny, 50, 50);
  } else {
  }

  //console.log(azimuth);

  //Set up ground
  var groundcolor = lerpColor(color(r2, g, b2), color(256, 256, 256), 0.1);
  fill(groundcolor);
  rect(0, y - 75, 400, 150);
  // Set up hills.
  // todo: algo generate hill placement
  var c = color(r, g, b);
  fill(c);
  noStroke();

  drawingContext.shadowOffsetX = 1;
  drawingContext.shadowOffsetY = -1;
  drawingContext.shadowBlur = 2;
  drawingContext.shadowColor = lerpColor(c, color(0, 0, 0), 0.5).toString();
  arc(x + 20, y - 72, 250, 50, PI, 2 * PI);
  arc(320, y - 50, 250, 70, PI, 2 * PI);
  var c2 = color(r2, g, b2);
  fill(c2);
  drawingContext.shadowColor = lerpColor(c2, color(0, 0, 0), 0.5).toString();
  //arc(x+40, y-40, 90, 90, PI, 2*PI);
  //293120arc(0, y-40, 90, 90, PI, 2*PI);
  arc((x + 40) / 2, y - 40, 90, 45, PI, 2 * PI);
  arc(400 - (x + 40) / 2 - 20, y - 30, 90, 45, PI, 2 * PI);
  arc(150, y - 58, 100, 70, PI, 2 * PI);
  var c3 = lerpColor(c, c2, 0.33);
  fill(c3);
  drawingContext.shadowColor = lerpColor(c3, color(0, 0, 0), 0.5).toString();
  arc(x + 25, y, 200, 125, PI, 2 * PI);
  arc(x + 125, y, 200, 140, PI, 2 * PI);
  var darkerC2 = lerpColor(c2, color(0, 0, 0), 0.1);
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

  minutesIntoDay += 15;
}
