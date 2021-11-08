#!/usr/bin/env node
"use strict";
exports.__esModule = true;
var yargs = require("yargs");
require("p5");
var argv = yargs
    .option('year', {
    alias: 'y',
    description: "Year number in Gregorian time",
    demand: true,
    type: 'number'
})
    .option('month', {
    alias: 'mon',
    description: "Month number",
    demand: true,
    type: 'number'
})
    .option('day', {
    alias: 'd',
    description: "Day of month",
    demand: true,
    type: 'number'
})
    .option('hour', {
    alias: 'h',
    description: "Hour",
    demand: true,
    type: 'number'
})
    .option('minute', {
    alias: 'min',
    description: "minute",
    demand: true,
    type: 'number'
})
    .option('lat', {
    alias: 'lat',
    description: "Latitute",
    demand: true,
    type: 'number'
})
    .option('long', {
    alias: 'long',
    description: "Longitude",
    demand: true,
    type: 'number'
})
    .option('tzone', {
    alias: 'tzone',
    description: "Time zone represented as offset from UTC, aka chicago is -6",
    demand: true,
    type: 'number'
})
    .parseSync();
var calcJulianDay = function (year, month, day) {
    var date = new Date(year, month - 1, day);
    var jdate = Math.floor(date.getTime() / 1000 / 86400) + 2440587.5;
    // https://stackoverflow.com/qu86400000estions/11759992/calculating-jdayjulian-day-in-javascript
    return jdate;
};
// jd => julian time since century
// Converts Julian Day into centuries since J2000.00 (astronomy epoch)
var calcTimeJulianCent = function (jdate) {
    return (jdate - 2451545.0) / 36525.0;
};
/**
 * @param number minutesIntoDay minutes since midnight of the Gregorian Day
 * @param number lat
 * @param number long
 * @param number tzone Time zone represented as offset from UTC. e.g. Chicago is -6.0
  */
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
/**
 *
 * ********************
 * ********************
 * Astronomical helper functions
 * ✩☽🌙🌚🌕
 * ********************
 * ********************
 */
// @param number jTime is time since Julian Epoch J2000.0
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
    return radToDeg(eTime) * 4.0; // in minutes of time
}
function calcMeanObliquityOfEcliptic(t) {
    var seconds = 21.448 - t * (46.8150 + t * (0.00059 - t * (0.001813)));
    var e0 = 23.0 + (26.0 + (seconds / 60.0)) / 60.0;
    return e0; // in degrees
}
function calcObliquityCorrection(t) {
    var e0 = calcMeanObliquityOfEcliptic(t);
    var omega = 125.04 - 1934.136 * t;
    var e = e0 + 0.00256 * Math.cos(degToRad(omega));
    return e; // in degrees
}
function calcGeomMeanLongSun(t) {
    var L0 = 280.46646 + t * (36000.76983 + t * (0.0003032));
    while (L0 > 360.0) {
        L0 -= 360.0;
    }
    while (L0 < 0.0) {
        L0 += 360.0;
    }
    return L0; // in degrees
}
function calcEccentricityEarthOrbit(t) {
    var e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
    return e; // unitless
}
function calcGeomMeanAnomalySun(t) {
    var M = 357.52911 + t * (35999.05029 - 0.0001537 * t);
    return M; // in degrees
}
function calcSunDeclination(t) {
    var e = calcObliquityCorrection(t);
    var lambda = calcSunApparentLong(t);
    var sint = Math.sin(degToRad(e)) * Math.sin(degToRad(lambda));
    var theta = radToDeg(Math.asin(sint));
    return theta; // in degrees
}
function calcSunApparentLong(t) {
    var o = calcSunTrueLong(t);
    var omega = 125.04 - 1934.136 * t;
    var lambda = o - 0.00569 - 0.00478 * Math.sin(degToRad(omega));
    return lambda; // in degrees
}
function calcSunTrueLong(t) {
    var l0 = calcGeomMeanLongSun(t);
    var c = calcSunEqOfCenter(t);
    var O = l0 + c;
    return O; // in degrees
}
function calcSunEqOfCenter(t) {
    var m = calcGeomMeanAnomalySun(t);
    var mrad = degToRad(m);
    var sinm = Math.sin(mrad);
    var sin2m = Math.sin(mrad + mrad);
    var sin3m = Math.sin(mrad + mrad + mrad);
    var C = sinm * (1.914602 - t * (0.004817 + 0.000014 * t)) + sin2m * (0.019993 - 0.000101 * t) + sin3m * 0.000289;
    return C; // in degrees
}
function radToDeg(angleRad) {
    return (180.0 * angleRad / Math.PI);
}
function degToRad(angleDeg) {
    return (Math.PI * angleDeg / 180.0);
}
console.log(calcAzimuthElevation(argv.year, argv.month, argv.day, argv.hour * 60 + argv.minute, argv.lat, argv.long, argv.tzone));
function setup() {
    createCanvas(710, 400);
}
// The background function is a statement that tells the computer
// which color (or gray value) to make the background of the display window
function draw() {
    background(204, 153, 0);
}
