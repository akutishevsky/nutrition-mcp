// Regenerates public/map-data.json — the dot-matrix land mask plus projected
// coordinates for every IANA timezone, all in one equirectangular viewBox. The
// landing page highlights whichever timezones /api/stats reports as active.
//
//   bun run scripts/gen-map-data.ts
//
// Sources: Natural Earth 110m land (public domain) for the land mask, and the
// system tz database (/usr/share/zoneinfo/zone.tab) for timezone coordinates.

const W = 1000;
const H = 500;
const STEP_DEG = 3.4; // grid spacing; tuned for ~1.3k land dots
const LAND_GEOJSON =
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson";
const ZONE_TAB = "/usr/share/zoneinfo/zone.tab";
const OUT = new URL("../public/map-data.json", import.meta.url).pathname;

// equirectangular projection (lon/lat -> viewBox x/y)
const proj = (lat: number, lon: number): [number, number] => [
    Math.round(((lon + 180) / 360) * W * 10) / 10,
    Math.round(((90 - lat) / 180) * H * 10) / 10,
];

// ---- timezone coordinates from zone.tab (ISO 6709) ----
function parseISO6709(s: string): [number, number] | null {
    const m = s.match(
        /^([+-])(\d{2})(\d{2})(\d{2})?([+-])(\d{3})(\d{2})(\d{2})?$/,
    );
    if (!m) return null;
    const lat =
        (m[1] === "-" ? -1 : 1) *
        (+m[2] + +m[3] / 60 + (m[4] ? +m[4] / 3600 : 0));
    const lon =
        (m[5] === "-" ? -1 : 1) *
        (+m[6] + +m[7] / 60 + (m[8] ? +m[8] / 3600 : 0));
    return [lat, lon];
}

const zoneTab = await Bun.file(ZONE_TAB).text();
const tzCoords: Record<string, [number, number]> = {};
for (const line of zoneTab.split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const cols = line.split("\t");
    if (cols.length < 3) continue;
    const coord = parseISO6709(cols[1]);
    if (coord) tzCoords[cols[2]] = coord;
}
// Common aliases that may not be primary rows in every tzdata version.
const aliases: Record<string, string> = {
    "Europe/Kiev": "Europe/Kyiv",
    "Asia/Kolkata": "Asia/Calcutta",
    "America/Argentina/Buenos_Aires": "America/Buenos_Aires",
};
for (const [a, b] of Object.entries(aliases)) {
    if (!tzCoords[a] && tzCoords[b]) tzCoords[a] = tzCoords[b];
    if (!tzCoords[b] && tzCoords[a]) tzCoords[b] = tzCoords[a];
}
const tz: Record<string, [number, number]> = {};
for (const [name, [lat, lon]] of Object.entries(tzCoords)) {
    tz[name] = proj(lat, lon);
}
// profiles.timezone defaults to 'UTC', which has no zone.tab row. Without this
// such users are counted in the headline but never plotted, so the dot count
// would trail the number. Place UTC/GMT on "null island" (0,0).
const utc = proj(0, 0);
for (const z of ["UTC", "Etc/UTC", "GMT", "Etc/GMT", "Etc/Greenwich"]) {
    if (!tz[z]) tz[z] = utc;
}

// ---- land dot-matrix from Natural Earth ----
const geo = await (await fetch(LAND_GEOJSON)).json();
type Ring = number[][];
const rings: Ring[] = [];
for (const f of geo.features) {
    const g = f.geometry;
    if (g.type === "Polygon") rings.push(g.coordinates[0]);
    else if (g.type === "MultiPolygon")
        for (const poly of g.coordinates) rings.push(poly[0]);
}
function inRing(lon: number, lat: number, ring: Ring): boolean {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i][0],
            yi = ring[i][1];
        const xj = ring[j][0],
            yj = ring[j][1];
        if (
            yi > lat !== yj > lat &&
            lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
        )
            inside = !inside;
    }
    return inside;
}
function isLand(lon: number, lat: number): boolean {
    for (const r of rings) if (inRing(lon, lat, r)) return true;
    return false;
}
const land: [number, number][] = [];
for (let lat = 84; lat >= -56; lat -= STEP_DEG) {
    for (let lon = -180; lon <= 180; lon += STEP_DEG) {
        if (isLand(lon, lat)) land.push(proj(lat, lon));
    }
}

await Bun.write(OUT, JSON.stringify({ w: W, h: H, land, tz }));
console.log(
    `Wrote ${OUT} — ${land.length} land dots, ${Object.keys(tz).length} timezones`,
);
