/**
 * Belgian Lambert 2008 (EPSG:3812) to longitude and latitude (ETRS89, which WGS 84 data such as
 * the NGI's matches to well within a metre). The projection is a Lambert conformal conic with two
 * standard parallels on the GRS 80 ellipsoid; the inverse follows the formulas of IOGP guidance
 * note 7-2 (EPSG method 9802).
 */
import type { Position } from './geopackage.ts'

const degrees = (d: number, m = 0, s = 0) => ((d + m / 60 + s / 3600) * Math.PI) / 180

// GRS 80
const A = 6378137
const FLATTENING = 1 / 298.257222101
const E = Math.sqrt(2 * FLATTENING - FLATTENING ** 2)

// EPSG:3812
const LATITUDE_OF_ORIGIN = degrees(50, 47, 52.134)
const LONGITUDE_OF_ORIGIN = degrees(4, 21, 33.177)
const PARALLEL_1 = degrees(49, 50)
const PARALLEL_2 = degrees(51, 10)
const FALSE_EASTING = 649328
const FALSE_NORTHING = 665262

const m = (phi: number) => Math.cos(phi) / Math.sqrt(1 - (E * Math.sin(phi)) ** 2)
const t = (phi: number) =>
    Math.tan(Math.PI / 4 - phi / 2) / ((1 - E * Math.sin(phi)) / (1 + E * Math.sin(phi))) ** (E / 2)

const N =
    (Math.log(m(PARALLEL_1)) - Math.log(m(PARALLEL_2))) /
    (Math.log(t(PARALLEL_1)) - Math.log(t(PARALLEL_2)))
const F = m(PARALLEL_1) / (N * t(PARALLEL_1) ** N)
const R_ORIGIN = A * F * t(LATITUDE_OF_ORIGIN) ** N

/** A Lambert 2008 easting and northing, in metres, as [longitude, latitude] in degrees */
export function lambert2008ToWgs84([easting, northing]: Position): Position {
    const dx = easting - FALSE_EASTING
    const dy = R_ORIGIN - (northing - FALSE_NORTHING)
    const r = Math.sign(N) * Math.hypot(dx, dy)
    const tPrime = (r / (A * F)) ** (1 / N)
    const theta = Math.atan2(dx, dy)
    const longitude = theta / N + LONGITUDE_OF_ORIGIN
    let latitude = Math.PI / 2 - 2 * Math.atan(tPrime)
    for (let i = 0; i < 10; i++) {
        const sin = E * Math.sin(latitude)
        latitude = Math.PI / 2 - 2 * Math.atan(tPrime * ((1 - sin) / (1 + sin)) ** (E / 2))
    }
    return [(longitude * 180) / Math.PI, (latitude * 180) / Math.PI]
}
