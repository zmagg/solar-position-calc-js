#!/usr/bin/env node

type AzimuthElevation = {
  azimuth: number;
  elevation: number;
};
let calcJulianDay = (year: number, month: number, day: number): number => {
  let date = new Date(year, month - 1, day);
  let jdate = Math.floor(date.getTime() / 1000 / 86400) + 2440587.5;
  // https://stackoverflow.com/qu86400000estions/11759992/calculating-jdayjulian-day-in-javascript
  return jdate;
};
// jd => julian time since century
// Converts Julian Day into centuries since J2000.00 (astronomy epoch)
let calcTimeJulianCent = (jdate: number): number => {
  return (jdate - 2451545.0) / 36525.0;
};

/**
 * @param number minutesIntoDay minutes since midnight of the Gregorian Day
 * @param number lat
 * @param number long
 * @param number tzone Time zone represented as offset from UTC. e.g. Chicago is -6.0
 */
function calcAzimuthElevation(
  year: number,
  month: number,
  day: number,
  minutesIntoDay: number,
  lat: number,
  long: number,
  tzone: number
): AzimuthElevation {
  let jTime = calcJulianDay(year, month, day);
  let t = calcTimeJulianCent(jTime + minutesIntoDay / 1444.0 - tzone / 24.0);
  const eqTime = calcEquationOfTime(t);
  const theta = calcSunDeclination(t);
  const solarTimeFix = eqTime + 4.0 * long - 60.0 * tzone;
  let trueSolarTime = minutesIntoDay + solarTimeFix;
  while (trueSolarTime > 1440) trueSolarTime -= 1440;

  let hourAngle = trueSolarTime / 4.0 - 180.0;
  if (hourAngle < -180) {
    hourAngle += 360.0;
  }
  const haRad = degToRad(hourAngle);
  let csz =
    Math.sin(degToRad(lat)) * Math.sin(degToRad(theta)) +
    Math.cos(degToRad(lat)) * Math.cos(degToRad(theta)) * Math.cos(haRad);
  if (csz > 1.0) {
    csz = 1.0;
  } else if (csz < -1.0) {
    csz = -1.0;
  }
  const zenith = radToDeg(Math.acos(csz));
  const azDenom = Math.cos(degToRad(lat)) * Math.sin(degToRad(zenith));
  let azimuth;
  if (Math.abs(azDenom) > 0.001) {
    let azRad =
      (Math.sin(degToRad(lat)) * Math.cos(degToRad(zenith)) -
        Math.sin(degToRad(theta))) /
      azDenom;
    if (Math.abs(azRad) > 1.0) {
      if (azRad < 0) {
        azRad = -1.0;
      } else {
        azRad = 1.0;
      }
    }
    azimuth = 180.0 - radToDeg(Math.acos(azRad));
    if (hourAngle > 0.0) {
      azimuth = -azimuth;
    }
  } else {
    if (lat > 0.0) {
      azimuth = 180.0;
    } else {
      azimuth = 0.0;
    }
  }
  if (azimuth < 0.0) {
    azimuth += 360.0;
  }
  let azelev: AzimuthElevation = {
    azimuth: azimuth,
    elevation: 90 - zenith,
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
function calcEquationOfTime(jTime: number): number {
  const epsilon = calcObliquityCorrection(jTime);
  const l0 = calcGeomMeanLongSun(jTime);
  const e = calcEccentricityEarthOrbit(jTime);
  const m = calcGeomMeanAnomalySun(jTime);

  let y = Math.tan(degToRad(epsilon) / 2.0);
  y *= y;

  const sin2l0 = Math.sin(2.0 * degToRad(l0));
  const sinm = Math.sin(degToRad(m));
  const cos2l0 = Math.cos(2.0 * degToRad(l0));
  const sin4l0 = Math.sin(4.0 * degToRad(l0));
  const sin2m = Math.sin(2.0 * degToRad(m));

  const eTime =
    y * sin2l0 -
    2.0 * e * sinm +
    4.0 * e * y * sinm * cos2l0 -
    0.5 * y * y * sin4l0 -
    1.25 * e * e * sin2m;
  return radToDeg(eTime) * 4.0; // in minutes of time
}

function calcMeanObliquityOfEcliptic(t: number): number {
  const seconds = 21.448 - t * (46.815 + t * (0.00059 - t * 0.001813));
  const e0 = 23.0 + (26.0 + seconds / 60.0) / 60.0;
  return e0; // in degrees
}

function calcObliquityCorrection(t: number): number {
  const e0 = calcMeanObliquityOfEcliptic(t);
  const omega = 125.04 - 1934.136 * t;
  const e = e0 + 0.00256 * Math.cos(degToRad(omega));
  return e; // in degrees
}

function calcGeomMeanLongSun(t: number): number {
  let L0 = 280.46646 + t * (36000.76983 + t * 0.0003032);
  while (L0 > 360.0) {
    L0 -= 360.0;
  }
  while (L0 < 0.0) {
    L0 += 360.0;
  }
  return L0; // in degrees
}

function calcEccentricityEarthOrbit(t: number): number {
  const e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
  return e; // unitless
}

function calcGeomMeanAnomalySun(t: number): number {
  const M = 357.52911 + t * (35999.05029 - 0.0001537 * t);
  return M; // in degrees
}

function calcSunDeclination(t: number): number {
  const e = calcObliquityCorrection(t);
  const lambda = calcSunApparentLong(t);

  const sint = Math.sin(degToRad(e)) * Math.sin(degToRad(lambda));
  const theta = radToDeg(Math.asin(sint));
  return theta; // in degrees
}

function calcSunApparentLong(t: number): number {
  const o = calcSunTrueLong(t);
  const omega = 125.04 - 1934.136 * t;
  const lambda = o - 0.00569 - 0.00478 * Math.sin(degToRad(omega));
  return lambda; // in degrees
}

function calcSunTrueLong(t: number): number {
  const l0 = calcGeomMeanLongSun(t);
  const c = calcSunEqOfCenter(t);
  const O = l0 + c;
  return O; // in degrees
}

function calcSunEqOfCenter(t: number): number {
  const m = calcGeomMeanAnomalySun(t);
  const mrad = degToRad(m);
  const sinm = Math.sin(mrad);
  const sin2m = Math.sin(mrad + mrad);
  const sin3m = Math.sin(mrad + mrad + mrad);
  const C =
    sinm * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    sin2m * (0.019993 - 0.000101 * t) +
    sin3m * 0.000289;
  return C; // in degrees
}

function radToDeg(angleRad: number) {
  return (180.0 * angleRad) / Math.PI;
}

function degToRad(angleDeg: number) {
  return (Math.PI * angleDeg) / 180.0;
}
