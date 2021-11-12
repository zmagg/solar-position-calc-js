#!/usr/bin/env node
var calcJulianDay = function (year, month, day) {
    var date = new Date(year, month - 1, day);
    var jdate = Math.floor(date.getTime() / 1000 / 86400) + 2440587.5;
    return jdate;
};
var calcTimeJulianCent = function (jdate) {
    return (jdate - 2451545.0) / 36525.0;
};
function calcAzimuthElevation(year, month, day, minutesIntoDay, lat, long, tzone) {
    var jTime = calcJulianDay(year, month, day);
    var t = calcTimeJulianCent(jTime + (minutesIntoDay / 1444.0) - (tzone / 24.0));
    var eqTime = calcEquationOfTime(t);
    var theta = calcSunDeclination(t);
    var solarTimeFix = eqTime + 4.0 * long - 60.0 * tzone;
    var trueSolarTime = minutesIntoDay + solarTimeFix;
    while (trueSolarTime > 1440)
        trueSolarTime -= 1440;
    var hourAngle = trueSolarTime / 4.0 - 180.0;
    if (hourAngle < -180) {
        hourAngle += 360.0;
    }
    var haRad = degToRad(hourAngle);
    var csz = Math.sin(degToRad(lat)) * Math.sin(degToRad(theta)) + Math.cos(degToRad(lat)) * Math.cos(degToRad(theta)) * Math.cos(haRad);
    if (csz > 1.0) {
        csz = 1.0;
    }
    else if (csz < -1.0) {
        csz = -1.0;
    }
    var zenith = radToDeg(Math.acos(csz));
    var azDenom = (Math.cos(degToRad(lat)) * Math.sin(degToRad(zenith)));
    var azimuth;
    if (Math.abs(azDenom) > 0.001) {
        var azRad = ((Math.sin(degToRad(lat)) * Math.cos(degToRad(zenith))) - Math.sin(degToRad(theta))) / azDenom;
        if (Math.abs(azRad) > 1.0) {
            if (azRad < 0) {
                azRad = -1.0;
            }
            else {
                azRad = 1.0;
            }
        }
        azimuth = 180.0 - radToDeg(Math.acos(azRad));
        if (hourAngle > 0.0) {
            azimuth = -azimuth;
        }
    }
    else {
        if (lat > 0.0) {
            azimuth = 180.0;
        }
        else {
            azimuth = 0.0;
        }
    }
    if (azimuth < 0.0) {
        azimuth += 360.0;
    }
    var azelev = {
        azimuth: azimuth,
        elevation: 90 - zenith
    };
    return azelev;
}
function calcEquationOfTime(jTime) {
    var epsilon = calcObliquityCorrection(jTime);
    var l0 = calcGeomMeanLongSun(jTime);
    var e = calcEccentricityEarthOrbit(jTime);
    var m = calcGeomMeanAnomalySun(jTime);
    var y = Math.tan(degToRad(epsilon) / 2.0);
    y *= y;
    var sin2l0 = Math.sin(2.0 * degToRad(l0));
    var sinm = Math.sin(degToRad(m));
    var cos2l0 = Math.cos(2.0 * degToRad(l0));
    var sin4l0 = Math.sin(4.0 * degToRad(l0));
    var sin2m = Math.sin(2.0 * degToRad(m));
    var eTime = y * sin2l0 - 2.0 * e * sinm + 4.0 * e * y * sinm * cos2l0 - 0.5 * y * y * sin4l0 - 1.25 * e * e * sin2m;
    return radToDeg(eTime) * 4.0;
}
function calcMeanObliquityOfEcliptic(t) {
    var seconds = 21.448 - t * (46.8150 + t * (0.00059 - t * (0.001813)));
    var e0 = 23.0 + (26.0 + (seconds / 60.0)) / 60.0;
    return e0;
}
function calcObliquityCorrection(t) {
    var e0 = calcMeanObliquityOfEcliptic(t);
    var omega = 125.04 - 1934.136 * t;
    var e = e0 + 0.00256 * Math.cos(degToRad(omega));
    return e;
}
function calcGeomMeanLongSun(t) {
    var L0 = 280.46646 + t * (36000.76983 + t * (0.0003032));
    while (L0 > 360.0) {
        L0 -= 360.0;
    }
    while (L0 < 0.0) {
        L0 += 360.0;
    }
    return L0;
}
function calcEccentricityEarthOrbit(t) {
    var e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
    return e;
}
function calcGeomMeanAnomalySun(t) {
    var M = 357.52911 + t * (35999.05029 - 0.0001537 * t);
    return M;
}
function calcSunDeclination(t) {
    var e = calcObliquityCorrection(t);
    var lambda = calcSunApparentLong(t);
    var sint = Math.sin(degToRad(e)) * Math.sin(degToRad(lambda));
    var theta = radToDeg(Math.asin(sint));
    return theta;
}
function calcSunApparentLong(t) {
    var o = calcSunTrueLong(t);
    var omega = 125.04 - 1934.136 * t;
    var lambda = o - 0.00569 - 0.00478 * Math.sin(degToRad(omega));
    return lambda;
}
function calcSunTrueLong(t) {
    var l0 = calcGeomMeanLongSun(t);
    var c = calcSunEqOfCenter(t);
    var O = l0 + c;
    return O;
}
function calcSunEqOfCenter(t) {
    var m = calcGeomMeanAnomalySun(t);
    var mrad = degToRad(m);
    var sinm = Math.sin(mrad);
    var sin2m = Math.sin(mrad + mrad);
    var sin3m = Math.sin(mrad + mrad + mrad);
    var C = sinm * (1.914602 - t * (0.004817 + 0.000014 * t)) + sin2m * (0.019993 - 0.000101 * t) + sin3m * 0.000289;
    return C;
}
function radToDeg(angleRad) {
    return (180.0 * angleRad / Math.PI);
}
function degToRad(angleDeg) {
    return (Math.PI * angleDeg / 180.0);
}
var sunx = 0;
var suny = 280;
var sundown = false;
var r = Math.random() * 256;
var r2 = Math.random() * 256;
var b = Math.random() * 256;
var b2 = Math.random() * 256;
var g = 100;
function setup() {
    createCanvas(400, 375);
    frameRate(10);
    var backgroundColor = lerpColor(color(r, g, b), color(256, 256, 256), 0.75);
    background(backgroundColor);
}
function draw() {
    var backgroundColor = lerpColor(color(r, g, b), color(256, 256, 256), 0.75);
    background(backgroundColor);
    var x = 100;
    var y = 350;
    var groundcolor = lerpColor(color(r2, g, b2), color(256, 256, 256), 0.1);
    fill(groundcolor);
    rect(0, y - 75, 400, 150);
    var c = color(r, g, b);
    fill(c);
    noStroke();
    var canvas = document.getElementById("mycanvas");
    var drawingContext = canvas.getContext("2d");
    drawingContext.shadowOffsetX = 1;
    drawingContext.shadowOffsetY = -1;
    drawingContext.shadowBlur = 2;
    drawingContext.shadowColor = lerpColor(c, color(0, 0, 0), 0.5).toString();
    arc(x + 20, y - 72, 250, 50, PI, 2 * PI);
    arc(320, y - 50, 250, 70, PI, 2 * PI);
    var c2 = color(r2, g, b2);
    fill(c2);
    drawingContext.shadowColor = lerpColor(c2, color(0, 0, 0), 0.5).toString();
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
    drawingContext.shadowColor = lerpColor(darkerC2, color(0, 0, 0), 0.5).toString();
    ellipse(x + 100, y, 700, 75);
    var sunColor = color(255, 170, 0);
    drawingContext.shadowOffsetX = 0;
    drawingContext.shadowOffsetY = 0;
    drawingContext.shadowBlur = 0;
    fill(sunColor);
    ellipse(sunx, suny, 50, 50);
    sunx += 10;
    if (sunx < 200 && !sundown) {
        suny -= 5;
    }
    else {
        sundown = true;
        suny += 5;
    }
}
//# sourceMappingURL=build.js.map