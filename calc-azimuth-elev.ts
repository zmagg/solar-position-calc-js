#!/usr/bin/env node
import yargs = require('yargs');

let argv = yargs
    .option('year', {
        alias: 'y',
        description: "Year number",
        demand: true
    }).parseSync();

console.log(argv.year);

type AzimuthElevation = {
    azimuth: number;
    elevation: number;
}

let getJulianDay = (year: number, month: number, day: number): number => {
    return 0;
}

// jd => julian time since century
// Converts Julian Day into time since J2000.00 (astronomy epoch)
let calcTimeSinceJulianEpoch = (jdate: number): number => {
    return 0;
}

function calcAzimuthElevation(timeSinceEpoch: number, minutesIntoDay: number, lat: number, long: number, tzone: number): AzimuthElevation {
    let azelev: AzimuthElevation = {
        azimuth: 0,
        elevation: 0
    };
    return azelev;

}

