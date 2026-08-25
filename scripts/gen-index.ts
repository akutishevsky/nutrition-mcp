/**
 * Generates public/index.html (the landing page) and its translated
 * counterparts under public/{locale}/ from the typed data in
 * src/copy/index.ts. This page used to be hand-authored HTML with
 * nav()/footer() copy-pasted in by hand; see scripts/gen-legal.ts and
 * scripts/site-partials.ts for why every generated page now shares one
 * copy of that markup instead.
 *
 * Re-run after editing src/copy/index.ts:
 *   bun run scripts/gen-index.ts
 * The generated .html files are the served artifacts — don't hand-edit them.
 */

import { HTML_LANG, pathFor, urlFor, type SiteLocale } from "../src/routes.js";
import {
    SITE,
    esc,
    footer,
    generatedBanner,
    jsonLd,
    localeHead,
    nav,
    translationNotice,
    HEAD_ASSETS,
    SITE_SCRIPT,
    THEME_PREPAINT,
} from "./site-partials.js";
import { INDEX, type FaqEntry, type IndexDoc } from "../src/copy/index.js";

// The landing page's own stats-odometer / world-map / theme-tilt / carousel
// / copy-button JS. Not prose — page behaviour, kept byte-for-byte as it was
// in the hand-authored file. It contains backticks of its own (template
// literals inside the script), so it is embedded via JSON.stringify rather
// than as a TS template literal, which sidesteps escaping them by hand.
//
// Exported for src/landing-script.test.ts, which pins the nine generated
// pages against THIS constant. Everything else that test knows about the
// script it reads back out of the HTML, which cannot tell an edit that was
// never regenerated from no edit at all.
export const LANDING_SCRIPT: string =
    '            (function () {\n                var reduceMotion = window.matchMedia(\n                    "(prefers-reduced-motion: reduce)",\n                ).matches;\n\n                // The page\'s own language, stamped on <html lang> by the\n                // generator. One script serves all nine locales, so it can\n                // never name a locale of its own: it reads the one it was\n                // rendered in.\n                var NUM_LOCALE = document.documentElement.lang || "en";\n\n                // ---------- animated stat numbers ----------\n                function fmtInt(n) {\n                    return Math.round(n).toLocaleString(NUM_LOCALE);\n                }\n                // ---------- weight unit ----------\n                // Every weight the API returns is in grams and is only ever\n                // rendered through these, so the kg/lb toggle is a repaint\n                // and never a refetch.\n                var UNIT_STORE = "stats-unit";\n                var GRAMS_PER = { kg: 1000, lb: 453.59237 };\n                var OUNCE_G = 28.349523125;\n                var WEIGHT_KEYS = [\n                    "total_protein_g",\n                    "total_carbs_g",\n                    "total_fat_g",\n                ];\n                // A remembered choice wins; failing that, the visitor\'s own\n                // measurement system, since "512 kg" is not a quantity most\n                // readers of the English page have a feel for.\n                var unit = "kg";\n                try {\n                    var savedUnit = localStorage.getItem(UNIT_STORE);\n                    if (savedUnit === "kg" || savedUnit === "lb")\n                        unit = savedUnit;\n                    else if (/^en-US\\b/i.test(navigator.language || ""))\n                        unit = "lb";\n                } catch (e) {}\n                function toWeight(g) {\n                    return g / GRAMS_PER[unit];\n                }\n                function fmtWeight(n) {\n                    return fmtInt(n) + " " + unit;\n                }\n                var FORMATS = {\n                    food_logs: {\n                        to: function (v) {\n                            return v;\n                        },\n                        fmt: fmtInt,\n                    },\n                    timezones: {\n                        to: function (v) {\n                            return v;\n                        },\n                        fmt: fmtInt,\n                    },\n                    total_protein_g: { to: toWeight, fmt: fmtWeight },\n                    total_carbs_g: { to: toWeight, fmt: fmtWeight },\n                    total_fat_g: { to: toWeight, fmt: fmtWeight },\n                };\n                // A count-up owns its element\'s text until the last frame,\n                // so anything repainting that element behind its back is undone\n                // by the next one. The kg/lb toggle is exactly that, and the\n                // frame that wins writes the OLD unit\'s magnitude under the NEW\n                // unit\'s suffix - "600 lb" where "1,323 lb" is right. It then\n                // sticks, because setStats leaves a key alone whose value did\n                // not change on the next poll. So every pending frame is parked\n                // here, and a repaint cancels the loop that would overwrite it.\n                var pending = new WeakMap();\n                function cancelAnim(el) {\n                    var h = pending.get(el);\n                    if (h) {\n                        cancelAnimationFrame(h);\n                        pending.delete(el);\n                    }\n                }\n                // Counts from `from` (0 on first paint, the previous value on\n                // a live update) to `target`.\n                function animate(el, target, fmt, from) {\n                    from = from || 0;\n                    // A second update landing mid-count-up replaces the first\n                    // rather than racing it for the same textContent.\n                    cancelAnim(el);\n                    if (reduceMotion) {\n                        el.textContent = fmt(target);\n                        return;\n                    }\n                    var dur = 1300,\n                        start = null;\n                    function step(ts) {\n                        if (start === null) start = ts;\n                        var p = Math.min((ts - start) / dur, 1);\n                        var e = 1 - Math.pow(1 - p, 3);\n                        el.textContent = fmt(from + (target - from) * e);\n                        if (p < 1) pending.set(el, requestAnimationFrame(step));\n                        else pending.delete(el);\n                    }\n                    pending.set(el, requestAnimationFrame(step));\n                }\n                // ---------- live deltas ----------\n                // Every figure is compared with the baseline captured when\n                // the page loaded, and the tag shows the net change since\n                // then ("+150 kcal") for as long as the page is open. Raw\n                // units, not the display ones: a 40 g change is invisible\n                // once rounded to kg.\n                var DELTA_UNIT = {\n                    food_logs: "",\n                    timezones: "",\n                    total_calories: " kcal",\n                };\n                // A weight row\'s delta is read in the small unit of whichever\n                // system is on screen — grams under kg, ounces under lb.\n                function deltaFor(key, diff) {\n                    if (key in DELTA_UNIT)\n                        return { n: Math.round(diff), unit: DELTA_UNIT[key] };\n                    return unit === "kg"\n                        ? { n: Math.round(diff), unit: " g" }\n                        : { n: Math.round(diff / OUNCE_G), unit: " oz" };\n                }\n                // `quiet` repaints the tag without replaying the pop — used\n                // when the unit changed but the underlying figure did not.\n                function showDelta(el, key, diff, quiet) {\n                    var d = deltaFor(key, diff);\n                    var n = d.n;\n                    var host = el.closest(".facts-row, .facts-cal") || el;\n                    var tag = host.querySelector(".delta");\n                    if (!n) {\n                        if (tag) tag.remove();\n                        return;\n                    }\n                    if (!tag) {\n                        tag = document.createElement("span");\n                        tag.className = "delta";\n                        tag.setAttribute("role", "status");\n                        // Sits between the label and the figure.\n                        host.insertBefore(\n                            tag,\n                            host.querySelector("b, .odo-hero") || null,\n                        );\n                    }\n                    tag.classList.toggle("down", n < 0);\n                    tag.textContent =\n                        (n > 0 ? "+" : "\\u2212") + fmtInt(Math.abs(n)) + d.unit;\n                    if (quiet) return;\n                    // Re-trigger the pop so a second change is noticed.\n                    tag.classList.remove("pop");\n                    void tag.offsetWidth;\n                    tag.classList.add("pop");\n                }\n                // ---------- nav badge ----------\n                // An app-icon-style count on the "Live stats" nav item, so\n                // someone reading down the page can see that other people\n                // are logging meals while they read. The markup ships\n                // [hidden] in the nav of every page (liveBadge in\n                // scripts/site-partials.ts); this is the only page that\n                // ever fills it in.\n                // Capped low on purpose: the badge is anchored by its left edge and\n                // grows rightward into a fixed reserved margin (.nav-has-badge in\n                // styles.css), so the cap is what bounds that reserve. Three\n                // characters is also as much as fits beside the label without\n                // crowding the next nav item.\n                var NAV_BADGE_MAX = 99;\n                var navBadges = null;\n                var navPlurals = null;\n                // The label after the digits is count-sensitive ("1 new food\n                // log", not "1 new food logs"), and in Polish and Ukrainian\n                // the noun case turns on the digit class. This script is\n                // byte-identical across all nine locales, so it can no more\n                // hold those forms than it can hold the odometer caption:\n                // liveBadge in scripts/site-partials.ts ships every form the\n                // locale has as a data-plural-* attribute and this picks one.\n                // Selected on the true count rather than the capped text, so\n                // "99+" still reads in the right form.\n                function navBadgeLabel(b, n) {\n                    if (navPlurals === null) {\n                        try {\n                            navPlurals = new Intl.PluralRules(NUM_LOCALE);\n                        } catch (e) {\n                            navPlurals = false;\n                        }\n                    }\n                    var cat = "other";\n                    if (navPlurals) {\n                        try {\n                            cat = navPlurals.select(n);\n                        } catch (e) {}\n                    }\n                    // Falls back to "other" for any category this locale\n                    // does not carry, the same degradation the widgets use.\n                    return (\n                        b.getAttribute("data-plural-" + cat) ||\n                        b.getAttribute("data-plural-other")\n                    );\n                }\n                function setNavBadge(n) {\n                    if (navBadges === null)\n                        navBadges =\n                            document.querySelectorAll("[data-live-badge]");\n                    var text =\n                        n > NAV_BADGE_MAX ? NAV_BADGE_MAX + "+" : fmtInt(n);\n                    navBadges.forEach(function (b) {\n                        if (n <= 0) {\n                            b.hidden = true;\n                            return;\n                        }\n                        var num = b.querySelector(".nav-badge-n");\n                        // The hamburger copy is aria-hidden and carries no\n                        // label span, so there is nothing to reword on it.\n                        var vh = b.querySelector(".vh");\n                        var label = vh ? navBadgeLabel(b, n) : null;\n                        // Two counts can share one capped text ("99+") and\n                        // still want different forms, so the label is part of\n                        // what counts as unchanged.\n                        if (\n                            !b.hidden &&\n                            num.textContent === text &&\n                            (!vh || !label || vh.textContent === label)\n                        )\n                            return;\n                        num.textContent = text;\n                        if (vh && label) vh.textContent = label;\n                        b.hidden = false;\n                        // Restart the pop so a second arrival is noticed\n                        // too, not just the first.\n                        b.classList.remove("pop");\n                        void b.offsetWidth;\n                        b.classList.add("pop");\n                    });\n                }\n                // ---------- odometer ----------\n                // Builds one reel per digit of the real total, so the digits\n                // that roll are the digits that are true — nothing is invented\n                // to make the motion look better. Reels further right spin\n                // through more cycles and take longer, so the leading digits\n                // settle first and the tail is still turning, the way a\n                // mechanical counter reads.\n                var ODO_MAX_CYCLES = 6;\n                function setOdometer(el, value) {\n                    var text = fmtInt(value);\n                    // The translated caption already sits beside the reel, in\n                    // the sibling .odo-cap the generator renders from\n                    // stats.calCaption. Read it rather than name the nutrient\n                    // in English, which is what every locale used to announce.\n                    var cap =\n                        el.parentNode &&\n                        el.parentNode.querySelector(".odo-cap");\n                    var capText = cap ? cap.textContent.trim() : "";\n                    el.setAttribute(\n                        "aria-label",\n                        capText\n                            ? text + " " + capText\n                            : text + " calories tracked",\n                    );\n                    el.textContent = "";\n                    if (reduceMotion) {\n                        el.textContent = text;\n                        return;\n                    }\n                    var strips = [],\n                        i = 0;\n                    text.split("").forEach(function (ch) {\n                        if (ch < "0" || ch > "9") {\n                            var sep = document.createElement("span");\n                            sep.className = "odo-sep";\n                            sep.textContent = ch;\n                            el.appendChild(sep);\n                            return;\n                        }\n                        var cycles = Math.min(ODO_MAX_CYCLES, 2 + i);\n                        var reel = document.createElement("span");\n                        reel.className = "odo-reel";\n                        var strip = document.createElement("span");\n                        strip.className = "odo-strip";\n                        for (var c = 0; c <= cycles; c++) {\n                            for (var d = 0; d < 10; d++) {\n                                var cell = document.createElement("span");\n                                cell.textContent = d;\n                                strip.appendChild(cell);\n                            }\n                        }\n                        strip.style.transitionDuration = 1.1 + i * 0.12 + "s";\n                        // Land on a cell whose face is ch, `cycles` turns down.\n                        // Expressed as a share of the strip\'s own height so the\n                        // reel stays in register at any font size.\n                        var cells = (cycles + 1) * 10;\n                        var stop = cycles * 10 + Number(ch);\n                        strips.push([strip, (stop / cells) * 100]);\n                        reel.appendChild(strip);\n                        el.appendChild(reel);\n                        i++;\n                    });\n                    // Paint at rest first. Moving in the same frame as the\n                    // insert gives the strip no start value to animate from, so\n                    // the transition is skipped and the number just appears.\n                    requestAnimationFrame(function () {\n                        requestAnimationFrame(function () {\n                            strips.forEach(function (s) {\n                                s[0].style.transform =\n                                    "translateY(-" + s[1] + "%)";\n                            });\n                        });\n                    });\n                }\n\n                // `prev` is the last stats object painted, or null on first\n                // load. Unchanged figures are left alone so the page is still\n                // while nothing happens; changed ones count from old to new.\n                function setStats(stats, prev, base) {\n                    Object.keys(FORMATS).forEach(function (key) {\n                        if (typeof stats[key] !== "number") return;\n                        var before = prev ? prev[key] : null;\n                        if (prev && before === stats[key]) return;\n                        document\n                            .querySelectorAll(\'[data-stat="\' + key + \'"]\')\n                            .forEach(function (el) {\n                                var c = FORMATS[key];\n                                animate(\n                                    el,\n                                    c.to(stats[key]),\n                                    c.fmt,\n                                    typeof before === "number"\n                                        ? c.to(before)\n                                        : 0,\n                                );\n                                if (base)\n                                    showDelta(el, key, stats[key] - base[key]);\n                            });\n                    });\n                    document\n                        .querySelectorAll("[data-odo]")\n                        .forEach(function (el) {\n                            var key = el.dataset.odo;\n                            var v = stats[key];\n                            if (typeof v !== "number") return;\n                            var before = prev ? prev[key] : null;\n                            if (prev && before === v) return;\n                            setOdometer(el, v);\n                            if (base) showDelta(el, key, v - base[key]);\n                        });\n                    // The badge counts food logs alone, and off the same\n                    // page-load baseline as the delta tags — so it agrees\n                    // with the delta on that row and with the menu\'s\n                    // "since you opened" hint instead of keeping its own\n                    // clock.\n                    if (base && typeof stats.food_logs === "number")\n                        setNavBadge(stats.food_logs - base.food_logs);\n                }\n\n                // ---------- world map ----------\n                var SVGNS = "http://www.w3.org/2000/svg";\n                // UTC-equivalent zones all resolve to the map center [500,250]\n                // (lon 0, lat 0 — open ocean), so plotting them drops a bogus\n                // dot in the middle of the map. Skip them.\n                // gen-map-data.ts parks all of these on null island, so every\n                // one of them has to be skipped — GMT and Etc/Greenwich were\n                // missing here, and a profile on either would have drawn a dot\n                // in the middle of the Atlantic.\n                var UTC_TZS = {\n                    UTC: 1,\n                    "Etc/UTC": 1,\n                    "Etc/GMT": 1,\n                    GMT: 1,\n                    "Etc/Greenwich": 1,\n                };\n                // [halo, core] radius per level. Radii step by roughly √2 in\n                // area terms rather than linearly, because a circle is read by\n                // its area: doubling the radius would look like four times the\n                // share. Level 3 is the old fixed size, so a typical dot is\n                // unchanged and only the extremes move.\n                var TZ_RADII = [\n                    [5.5, 2.0],\n                    [7.0, 2.5],\n                    [9.0, 3.2],\n                    [11.5, 3.9],\n                    [14.5, 4.7],\n                ];\n                // Expect this to render almost empty right now, and NOT because\n                // of a bug here: the 2026-08-15 nullable_profile_timezone\n                // migration reset every profile\'s timezone to NULL (see #99),\n                // and /api/stats\'s timezone_counts/timezone_list only count\n                // `where timezone is not null` — so tzLevels is near-empty\n                // until users call set_timezone again. That warning was itself\n                // silently unreachable for the most common log call (no\n                // logged_at) until #111 fixed it the same day, so expect this\n                // to self-heal gradually as people log meals, not instantly.\n                function buildMap(mapData, tzLevels) {\n                    var svg = document.getElementById("world-svg");\n                    if (!svg || !mapData) return;\n                    var landFrag = document.createDocumentFragment();\n                    mapData.land.forEach(function (p) {\n                        var c = document.createElementNS(SVGNS, "circle");\n                        c.setAttribute("cx", p[0]);\n                        c.setAttribute("cy", p[1]);\n                        c.setAttribute("r", "1.9");\n                        c.setAttribute("class", "land-dot");\n                        landFrag.appendChild(c);\n                    });\n                    svg.appendChild(landFrag);\n                    function sizeDot(dot, level) {\n                        var r = TZ_RADII[level - 1];\n                        dot.halo.setAttribute("r", r[0]);\n                        dot.core.setAttribute("r", r[1]);\n                        dot.level = level;\n                    }\n                    var seen = {};\n                    var plotted = 0;\n                    Object.keys(tzLevels || {}).forEach(function (tz) {\n                        if (UTC_TZS[tz]) return;\n                        var pt = mapData.tz[tz];\n                        if (!pt) return;\n                        var level = Math.min(\n                            TZ_RADII.length,\n                            Math.max(1, Math.round(tzLevels[tz]) || 1),\n                        );\n                        // Alias spellings (Europe/Kiev vs Europe/Kyiv) project\n                        // to the same coordinates and so share one dot. Keep\n                        // the larger level rather than whichever name came\n                        // first, so the dot is never smaller than the busiest\n                        // zone standing on it.\n                        var k = pt[0] + "," + pt[1];\n                        if (seen[k]) {\n                            if (level > seen[k].level) sizeDot(seen[k], level);\n                            return;\n                        }\n                        var halo = document.createElementNS(SVGNS, "circle");\n                        halo.setAttribute("cx", pt[0]);\n                        halo.setAttribute("cy", pt[1]);\n                        halo.setAttribute("class", "tz-halo");\n                        if (!reduceMotion)\n                            halo.style.animationDelay =\n                                (plotted % 6) * 0.45 + "s";\n                        var core = document.createElementNS(SVGNS, "circle");\n                        core.setAttribute("cx", pt[0]);\n                        core.setAttribute("cy", pt[1]);\n                        core.setAttribute("class", "tz-core");\n                        var dot = { halo: halo, core: core, level: 0 };\n                        sizeDot(dot, level);\n                        seen[k] = dot;\n                        svg.appendChild(halo);\n                        svg.appendChild(core);\n                        plotted++;\n                    });\n                }\n\n                // ---------- load data, then keep it live ----------\n                var POLL_MS = 5000;\n                var lastStats = null;\n                var baseStats = null;\n                var pollTimer = null;\n                var liveEl = document.getElementById("facts-live");\n                // The translated word the generator rendered into that node\n                // ("Live", "En direct", "Na zywo"). Captured before the first\n                // live update overwrites it, so the line below is rebuilt from\n                // it rather than replaced with English.\n                var liveLabel = liveEl ? liveEl.textContent.trim() : "";\n\n                // ---------- kg / lb toggle ----------\n                var unitBtns = [].slice.call(\n                    document.querySelectorAll("[data-unit]"),\n                );\n                function paintUnitToggle() {\n                    unitBtns.forEach(function (b) {\n                        b.setAttribute(\n                            "aria-pressed",\n                            b.getAttribute("data-unit") === unit\n                                ? "true"\n                                : "false",\n                        );\n                    });\n                }\n                // Repainted in place rather than through setStats: counting\n                // 512 up to 1,129 would read as the figure changing, when\n                // all that changed is the unit it is written in. Cancelling\n                // first is what makes the toggle win over a count-up already\n                // in flight on the same row; see animate().\n                function repaintWeights() {\n                    if (!lastStats) return;\n                    WEIGHT_KEYS.forEach(function (key) {\n                        var v = lastStats[key];\n                        if (typeof v !== "number") return;\n                        document\n                            .querySelectorAll(\'[data-stat="\' + key + \'"]\')\n                            .forEach(function (el) {\n                                cancelAnim(el);\n                                el.textContent = fmtWeight(toWeight(v));\n                                if (baseStats)\n                                    showDelta(\n                                        el,\n                                        key,\n                                        v - baseStats[key],\n                                        true,\n                                    );\n                            });\n                    });\n                }\n                paintUnitToggle();\n                unitBtns.forEach(function (b) {\n                    b.addEventListener("click", function () {\n                        var next = b.getAttribute("data-unit");\n                        if (next === unit) return;\n                        unit = next;\n                        try {\n                            localStorage.setItem(UNIT_STORE, unit);\n                        } catch (e) {}\n                        paintUnitToggle();\n                        repaintWeights();\n                    });\n                });\n                function fetchStats() {\n                    return fetch("/api/stats", { cache: "no-store" }).then(\n                        function (r) {\n                            if (!r.ok) throw new Error("stats");\n                            return r.json();\n                        },\n                    );\n                }\n                function poll() {\n                    pollTimer = null;\n                    if (document.hidden) return;\n                    fetchStats()\n                        .then(function (stats) {\n                            setStats(stats, lastStats, baseStats);\n                            lastStats = stats;\n                            if (liveEl) liveEl.classList.remove("stale");\n                        })\n                        .catch(function () {\n                            if (liveEl) liveEl.classList.add("stale");\n                        })\n                        .then(schedule);\n                }\n                function schedule() {\n                    if (pollTimer || document.hidden) return;\n                    pollTimer = setTimeout(poll, POLL_MS);\n                }\n                // A background tab stops polling; coming back refetches at\n                // once so the figures are never minutes behind.\n                document.addEventListener("visibilitychange", function () {\n                    if (document.hidden) {\n                        clearTimeout(pollTimer);\n                        pollTimer = null;\n                    } else if (lastStats) {\n                        poll();\n                    }\n                });\n                Promise.all([\n                    fetchStats(),\n                    fetch("/map-data.json").then(function (r) {\n                        return r.ok ? r.json() : null;\n                    }),\n                ])\n                    .then(function (res) {\n                        var stats = res[0];\n                        setStats(stats, null, null);\n                        lastStats = stats;\n                        baseStats = stats;\n                        buildMap(res[1], stats.timezone_levels);\n                        if (liveEl) {\n                            liveEl.classList.add("on");\n                            // The deltas are measured from this moment.\n                            var t = new Date().toLocaleTimeString(NUM_LOCALE, {\n                                hour: "numeric",\n                                minute: "2-digit",\n                            });\n                            liveEl.textContent =\n                                (liveLabel ? liveLabel + " \\u00b7 " : "") + t;\n                        }\n                        schedule();\n                    })\n                    .catch(function () {\n                        var row = document.getElementById("stat-row");\n                        var map = document.getElementById("map-block");\n                        if (row) row.style.display = "none";\n                        if (map) map.style.display = "none";\n                    });\n\n                // ---------- live GitHub star count ----------\n                var ghEl = document.getElementById("gh-stars");\n                if (ghEl) {\n                    fetch(\n                        "https://api.github.com/repos/akutishevsky/nutrition-mcp",\n                    )\n                        .then(function (r) {\n                            return r.ok ? r.json() : null;\n                        })\n                        .then(function (d) {\n                            if (d && typeof d.stargazers_count === "number") {\n                                // Grouped in the page\'s language like every\n                                // other figure. Latent until the repo passes\n                                // 999 stars, at which point a German page\n                                // would have read 1,024 rather than 1.024.\n                                ghEl.textContent =\n                                    "· ★ " +\n                                    d.stargazers_count.toLocaleString(\n                                        NUM_LOCALE,\n                                    );\n                            }\n                        })\n                        .catch(function () {});\n                }\n\n                // ---------- "try saying" chat carousel ----------\n                var carousel = document.getElementById("try-carousel");\n                if (carousel) {\n                    var track = carousel.querySelector(".carousel-track");\n                    var slides = carousel.querySelectorAll(".slide");\n                    var dots = carousel.querySelectorAll(".dot");\n                    var idx = 0;\n                    var timer = null;\n                    // Play the typing -> reply animation for the active slide.\n                    function play(active) {\n                        slides.forEach(function (s) {\n                            var tp = s.querySelector(".typing");\n                            var aiList = s.querySelectorAll(".msg-ai");\n                            var meal = s.querySelector(".meal-pick");\n                            var target = s.querySelector(".meal-pick-target");\n                            clearTimeout(s._t);\n                            clearTimeout(s._t2);\n                            clearTimeout(s._t3);\n                            function complete() {\n                                if (tp) tp.style.display = "none";\n                                aiList.forEach(function (a) {\n                                    a.style.display = "";\n                                    a.style.animation = "none";\n                                });\n                                if (target) target.classList.add("selected");\n                            }\n                            if (s !== active || reduceMotion) {\n                                complete();\n                                return;\n                            }\n                            // reset, then play the sequence\n                            aiList.forEach(function (a) {\n                                a.style.display = "none";\n                                a.style.animation = "none";\n                            });\n                            if (target) target.classList.remove("selected");\n                            if (tp) tp.style.display = "flex";\n                            if (meal) {\n                                var ask = s.querySelector(".step-ask");\n                                var done = s.querySelector(".step-done");\n                                s._t = setTimeout(function () {\n                                    if (tp) tp.style.display = "none";\n                                    if (ask) {\n                                        ask.style.display = "";\n                                        ask.style.animation =\n                                            "msgin 0.4s ease both";\n                                    }\n                                    s._t2 = setTimeout(function () {\n                                        if (target)\n                                            target.classList.add("selected");\n                                        s._t3 = setTimeout(function () {\n                                            if (done) {\n                                                done.style.display = "";\n                                                done.style.animation =\n                                                    "msgin 0.4s ease both";\n                                            }\n                                        }, 750);\n                                    }, 1300);\n                                }, 1000);\n                            } else {\n                                var ai = aiList[0];\n                                s._t = setTimeout(function () {\n                                    if (tp) tp.style.display = "none";\n                                    if (ai) {\n                                        ai.style.display = "";\n                                        ai.style.animation =\n                                            "msgin 0.4s ease both";\n                                    }\n                                }, 1100);\n                            }\n                        });\n                    }\n                    function goTo(n) {\n                        idx = (n + slides.length) % slides.length;\n                        track.style.transform =\n                            "translateX(" + -idx * 100 + "%)";\n                        dots.forEach(function (d, k) {\n                            d.classList.toggle("active", k === idx);\n                        });\n                        play(slides[idx]);\n                    }\n                    function start() {\n                        if (reduceMotion) return;\n                        stop();\n                        timer = setInterval(function () {\n                            goTo(idx + 1);\n                        }, 5200);\n                    }\n                    function stop() {\n                        if (timer) clearInterval(timer);\n                        timer = null;\n                    }\n                    dots.forEach(function (d, k) {\n                        d.addEventListener("click", function () {\n                            goTo(k);\n                            start();\n                        });\n                    });\n                    carousel\n                        .querySelectorAll(".carousel-arrow")\n                        .forEach(function (arrow) {\n                            arrow.addEventListener("click", function () {\n                                goTo(\n                                    idx +\n                                        (arrow.getAttribute("data-dir") ===\n                                        "next"\n                                            ? 1\n                                            : -1),\n                                );\n                                start();\n                            });\n                        });\n                    carousel.addEventListener("mouseenter", stop);\n                    carousel.addEventListener("mouseleave", start);\n                    carousel.addEventListener("focusin", stop);\n                    carousel.addEventListener("focusout", start);\n                    // basic touch swipe\n                    var x0 = null;\n                    carousel.addEventListener(\n                        "touchstart",\n                        function (e) {\n                            x0 = e.touches[0].clientX;\n                        },\n                        { passive: true },\n                    );\n                    carousel.addEventListener("touchend", function (e) {\n                        if (x0 === null) return;\n                        var dx = e.changedTouches[0].clientX - x0;\n                        if (Math.abs(dx) > 40) goTo(idx + (dx < 0 ? 1 : -1));\n                        x0 = null;\n                        start();\n                    });\n                    goTo(0);\n                    start();\n                }\n            })();';

// src/copy/index.ts's `why.noteHtml` carries a plain
// href="/alternatives" data-link="alternatives" marker, because the content
// string itself has no access to `locale` — this rewrites that href to the
// locale-correct path (e.g. "/de/alternatives") and drops the marker.
// Without it, a translated landing page's in-prose link to the comparison
// hub would silently point at the English one (the exact bug the login page
// shipped once — see scripts/gen-login.ts / gen-legal.ts's own version of
// this same fix).
function localizeLinks(html: string, locale: SiteLocale): string {
    return html.replace(
        /href="\/alternatives" data-link="alternatives"/,
        `href="${pathFor(locale, "/alternatives")}"`,
    );
}

function stripTags(html: string): string {
    return html
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function faqJsonLdText(entry: FaqEntry): string {
    return entry.jsonLdText ?? stripTags(entry.visibleHtml);
}

function renderFaq(entry: FaqEntry): string {
    return `                        <details>
                            <summary>${esc(entry.question)}</summary>
                            <p>${entry.visibleHtml}</p>
                        </details>`;
}

function renderFeatureCard(
    card: IndexDoc["features"]["cards"][number],
): string {
    return `                        <article class="card feature">
                            <span class="feature-icon" aria-hidden="true"
                                ><i class="${card.icon}"></i
                            ></span>
                            <h3>${esc(card.title)}</h3>
                            <p>
                                ${esc(card.body)}
                            </p>
                        </article>`;
}

function renderHowStep(
    step: IndexDoc["how"]["steps"][number],
    icon: string,
): string {
    return `                        <div class="step3">
                            <span class="step3-icon"
                                ><i class="${icon}"></i
                            ></span>
                            <h3>${esc(step.title)}</h3>
                            <p>
                                ${esc(step.body)}
                            </p>
                        </div>`;
}

const HOW_ICONS = [
    "fa-solid fa-plug",
    "fa-solid fa-message",
    "fa-solid fa-chart-area",
];
const TRUST_ICONS = [
    "fa-solid fa-lock",
    "fa-solid fa-code-branch",
    "fa-solid fa-file-export",
    "fa-solid fa-trash",
];

function renderDoc(doc: IndexDoc, locale: SiteLocale): string {
    const suffix = "";
    const url = urlFor(locale, suffix);
    const title = esc(doc.title);
    const notice = translationNotice(locale, suffix);

    const softwareAppSchema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Nutrition MCP",
        description: doc.metaDescription,
        url,
        applicationCategory: "HealthApplication",
        operatingSystem: "Any",
        offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
        },
    };

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: doc.faq.map((entry) => ({
            "@type": "Question",
            name: entry.question,
            acceptedAnswer: {
                "@type": "Answer",
                text: faqJsonLdText(entry),
            },
        })),
    };

    const dots = doc.try.slides
        .map(
            (_, i) =>
                `                                <button
                                    class="dot${i === 0 ? " active" : ""}"
                                    type="button"
                                    aria-label="${esc(doc.try.exampleLabel)} ${i + 1}"
                                ></button>`,
        )
        .join("\n");

    const slides = doc.try.slides
        .map(
            (s) => `                                    <div
                                        class="slide"
                                        role="group"
                                        aria-roledescription="slide"
                                    >
                                        <div class="mini-chat">
${s.html}
                                        </div>
                                    </div>`,
        )
        .join("\n");

    return `<!doctype html>
<html lang="${HTML_LANG[locale]}">
    <head>
        <title>
            ${title}
        </title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="utf-8" />
        <meta name="description" content="${esc(doc.metaDescription)}" />
        <meta name="keywords" content="${esc(doc.keywords)}" />
        <meta property="og:title" content="${title}" />
        <meta property="og:description" content="${esc(doc.ogDescription)}" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="${url}" />
        <meta property="og:image" content="${SITE}/og.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="${SITE}/og.png" />
        <meta name="twitter:title" content="${title}" />
        <meta name="twitter:description" content="${esc(doc.ogDescription)}" />
${localeHead(locale, suffix)}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#fbfbf9" />
${jsonLd(softwareAppSchema)}
${jsonLd(faqSchema)}
${HEAD_ASSETS}
    </head>
    <body class="landing">
${generatedBanner("scripts/gen-index.ts")}
${THEME_PREPAINT}

${nav(locale, suffix)}

        <main id="main">
            <!-- Hero -->
            <section class="hero">
                <div class="container hero-grid">
                    <div class="hero-copy">
                        <p class="eyebrow">${esc(doc.hero.eyebrow)}</p>
                        <h1 class="hero-title">
                            ${esc(doc.hero.titleBeforeEm)}<em>${esc(doc.hero.titleEm)}</em>${esc(doc.hero.titleAfterEm)}
                        </h1>
                        <p class="lead">
                            ${esc(doc.hero.lead)}
                        </p>
                        <div class="hero-actions">
                            <a class="btn btn-primary" href="#install"
                                >${esc(doc.hero.ctaPrimary)}</a
                            >
                            <a class="btn btn-secondary" href="#support"
                                >${esc(doc.hero.ctaSecondary)}</a
                            >
                        </div>
                    </div>

                    <!-- Illustrative chat demo (decorative). Three depth
                         layers: a faint label panel at the back, macro chips
                         in the middle, the chat card in front. site.js moves
                         them by scroll × data-depth and tilts the card. -->
                    <div class="hero-stage" aria-hidden="true">
                        <div class="hero-panel depth" data-depth="0.22"></div>
                        <div class="hero-chips depth" data-depth="0.1">
${doc.hero.chipsHtml}
                        </div>
                        <div class="hero-card depth" data-depth="-0.04">
                            <div class="chat-window">
${doc.hero.chatHtml}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

${
    notice
        ? `            <div class="container translation-notice-band">
${notice}
            </div>`
        : ""
}

            <!-- How it works -->
            <section class="section band" id="how">
                <div class="container" data-reveal>
                    <div class="section-head">
                        <p class="eyebrow">${esc(doc.how.eyebrow)}</p>
                        <h2 class="section-title">
                            ${esc(doc.how.title)}
                        </h2>
                    </div>
                    <div class="steps3" data-reveal="stagger">
${doc.how.steps.map((s, i) => renderHowStep(s, HOW_ICONS[i]!)).join("\n")}
                    </div>
                </div>
            </section>

            <!-- Quick install -->
            <section class="section" id="install">
                <div class="container" data-reveal>
                    <div class="section-head">
                        <p class="eyebrow">${esc(doc.install.eyebrow)}</p>
                        <h2 class="section-title">${esc(doc.install.title)}</h2>
                        <p class="section-sub">
                            ${esc(doc.install.sub)}
                        </p>
                    </div>

                    <div class="card install-card">
                        <div class="tabs-wrap">
                            <input
                                type="radio"
                                name="itab"
                                id="itab-claude"
                                class="tab-input"
                                checked
                            />
                            <input
                                type="radio"
                                name="itab"
                                id="itab-chatgpt"
                                class="tab-input"
                            />
                            <input
                                type="radio"
                                name="itab"
                                id="itab-other"
                                class="tab-input"
                            />

                            <div class="seg">
                                <label for="itab-claude" class="seg-claude"
                                    ><i class="fa-brands fa-claude" aria-hidden="true"></i>
                                    Claude</label
                                >
                                <label for="itab-chatgpt" class="seg-chatgpt"
                                    ><i class="fa-brands fa-openai" aria-hidden="true"></i>
                                    ChatGPT</label
                                >
                                <label for="itab-other" class="seg-other"
                                    ><i class="fa-solid fa-terminal" aria-hidden="true"></i>
                                    ${esc(doc.install.otherTabLabel)}</label
                                >
                            </div>

                            <div class="tab-panel panel-claude">
                                <ol class="steps">
${doc.install.claude.steps.map((s) => `                                    <li>${s}</li>`).join("\n")}
                                </ol>
                                <p class="note">
                                    ${esc(doc.install.claude.note)}
                                </p>
                            </div>

                            <div class="tab-panel panel-chatgpt">
                                <ol class="steps">
${doc.install.chatgpt.steps.map((s) => `                                    <li>${s}</li>`).join("\n")}
                                </ol>
                            </div>

                            <div class="tab-panel panel-other">
                                <!-- prettier-ignore -->
                                <pre class="code-block">{
  "mcpServers": {
    "nutrition": {
      "url": "https://nutrition-mcp.com/mcp"
    }
  }
}</pre>
                                <p class="note">
                                    ${doc.install.other.note}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Optional onboarding -->
            <section class="section" id="onboarding">
                <div class="container" data-reveal>
                    <div class="section-head">
                        <p class="eyebrow">${esc(doc.onboarding.eyebrow)}</p>
                        <h2 class="section-title">
                            ${esc(doc.onboarding.title)}
                        </h2>
                        <p class="section-sub">
                            ${esc(doc.onboarding.sub)}
                        </p>
                    </div>

                    <div class="card install-card">
                        <ol class="steps">
${doc.onboarding.steps.map((s) => `                            <li>\n                                ${s}\n                            </li>`).join("\n")}
                        </ol>
                        <p class="note">
                            ${esc(doc.onboarding.note)}
                        </p>
                    </div>

                    <a class="tools-cta" href="${pathFor(locale, "/tools")}">
                        <span class="tools-cta-icon" aria-hidden="true"
                            ><i class="fa-solid fa-wand-magic-sparkles"></i
                        ></span>
                        <span class="tools-cta-text">
                            <strong>${esc(doc.onboarding.toolsCta.heading)}</strong>
                            ${esc(doc.onboarding.toolsCta.body)}
                        </span>
                        <span class="tools-cta-arrow" aria-hidden="true"
                            >${esc(doc.onboarding.toolsCta.arrow)}
                            <i class="fa-solid fa-arrow-right"></i
                        ></span>
                    </a>
                </div>
            </section>

            <!-- Try saying -->
            <section class="section band" id="try">
                <div class="container" data-reveal>
                    <div class="section-head">
                        <p class="eyebrow">${esc(doc.try.eyebrow)}</p>
                        <h2 class="section-title">${esc(doc.try.title)}</h2>
                        <p class="section-sub">
                            ${esc(doc.try.sub)}
                        </p>
                    </div>
                    <div class="cw-wrap" id="try-carousel">
                        <div class="chat-window">
                            <div class="cw-header">
                                <span class="cw-avatar" aria-hidden="true"
                                    ><i class="fa-solid fa-apple-whole"></i
                                ></span>
                                <span class="cw-title">${esc(doc.chatChrome.brand)}</span>
                                <span class="cw-status">${esc(doc.chatChrome.status)}</span>
                            </div>
                            <div class="carousel-viewport cw-body">
                                <div class="carousel-track">
${slides}
                                </div>
                            </div>
                            <div class="cw-input" aria-hidden="true">
                                <span class="cw-field">${esc(doc.chatChrome.inputPlaceholder)}</span>
                                <span class="cw-send"
                                    ><i class="fa-solid fa-arrow-up"></i
                                ></span>
                            </div>
                        </div>
                        <div class="carousel-controls">
                            <button
                                class="carousel-arrow"
                                type="button"
                                data-dir="prev"
                                aria-label="${esc(doc.try.prevLabel)}"
                            >
                                <i class="fa-solid fa-chevron-left"></i>
                            </button>
                            <div class="carousel-dots">
${dots}
                            </div>
                            <button
                                class="carousel-arrow"
                                type="button"
                                data-dir="next"
                                aria-label="${esc(doc.try.nextLabel)}"
                            >
                                <i class="fa-solid fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Stats + world map -->
            <section class="section" id="stats">
                <div class="container" data-reveal>
                    <div class="section-head">
                        <p class="eyebrow">${esc(doc.stats.eyebrow)}</p>
                        <h2 class="section-title">${esc(doc.stats.title)}</h2>
                    </div>

                    <div class="facts" id="stat-row" data-reveal>
                        <p class="facts-title">
                            <span>${esc(doc.stats.factsTitle)}</span>
                            <span
                                class="facts-unit"
                                role="group"
                                aria-label="${esc(doc.stats.unitGroupLabel)}"
                            >
                                <button
                                    type="button"
                                    data-unit="kg"
                                    aria-pressed="true"
                                    aria-label="${esc(doc.stats.unitKgLabel)}"
                                >
                                    kg
                                </button>
                                <button
                                    type="button"
                                    data-unit="lb"
                                    aria-pressed="false"
                                    aria-label="${esc(doc.stats.unitLbLabel)}"
                                >
                                    lb
                                </button>
                            </span>
                        </p>
                        <p class="facts-serving">
                            <span>${esc(doc.stats.servingPrefix)}<b>${esc(doc.stats.servingBold)}</b></span>
                            <span class="facts-live" id="facts-live">${esc(doc.stats.liveLabel)}</span>
                        </p>
                        <div class="facts-cal">
                            <span class="label"
                                >${esc(doc.stats.calLabel)}<small>${esc(doc.stats.calSmall)}</small></span
                            >
                            <div class="odo-hero">
                                <span
                                    class="odo"
                                    data-odo="total_calories"
                                    role="img"
                                    aria-label="${esc(doc.stats.calCaption)}"
                                    >—</span
                                >
                                <span class="odo-cap">${esc(doc.stats.calCaption)}</span>
                            </div>
                        </div>
                        <p class="facts-row">
                            <span>${esc(doc.stats.rowFoodLogs)}</span>
                            <b data-stat="food_logs">—</b>
                        </p>
                        <p class="facts-row">
                            <span>${esc(doc.stats.rowProtein)}</span>
                            <b data-stat="total_protein_g">—</b>
                        </p>
                        <p class="facts-row">
                            <span>${esc(doc.stats.rowCarbs)}</span>
                            <b data-stat="total_carbs_g">—</b>
                        </p>
                        <p class="facts-row">
                            <span>${esc(doc.stats.rowFat)}</span>
                            <b data-stat="total_fat_g">—</b>
                        </p>
                        <p class="facts-foot">
                            ${esc(doc.stats.foot)}
                        </p>
                    </div>

                    <div class="map-block" id="map-block">
                        <p class="map-head">
                            ${esc(doc.stats.mapPrefix)}
                            <span class="map-count" data-stat="timezones"
                                >35</span
                            >
                            ${esc(doc.stats.mapSuffix)}
                        </p>
                        <div class="world-map">
                            <svg
                                id="world-svg"
                                viewBox="0 0 1000 500"
                                preserveAspectRatio="xMidYMid meet"
                                role="img"
                                aria-label="${esc(doc.stats.mapAriaLabel)}"
                            ></svg>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Features -->
            <section class="section band" id="features">
                <div class="container" data-reveal>
                    <div class="section-head">
                        <p class="eyebrow">${esc(doc.features.eyebrow)}</p>
                        <h2 class="section-title">${esc(doc.features.title)}</h2>
                    </div>
                    <div class="features-grid" data-reveal="stagger">
${doc.features.cards.map(renderFeatureCard).join("\n")}
                    </div>
                </div>
            </section>

            <!-- Why / comparison -->
            <section class="section" id="why">
                <div class="container" data-reveal>
                    <div class="section-head">
                        <p class="eyebrow">${esc(doc.why.eyebrow)}</p>
                        <h2 class="section-title">${esc(doc.why.title)}</h2>
                        <p class="section-sub">
                            ${esc(doc.why.sub)}
                        </p>
                    </div>
                    <div class="compare">
                        <div class="compare-col">
                            <h3 class="compare-h compare-h-old">
                                ${esc(doc.why.oldHeading)}
                            </h3>
                            <ul>
${doc.why.oldItems.map((i) => `                                <li>\n                                    <i class="fa-solid fa-xmark"></i> ${esc(i)}\n                                </li>`).join("\n")}
                            </ul>
                        </div>
                        <div class="compare-col compare-col-new">
                            <h3 class="compare-h compare-h-new">
                                ${esc(doc.why.newHeading)}
                            </h3>
                            <ul>
${doc.why.newItems.map((i) => `                                <li>\n                                    <i class="fa-solid fa-circle-check"></i> ${esc(i)}\n                                </li>`).join("\n")}
                            </ul>
                        </div>
                    </div>
                    <p class="note compare-note">
                        ${localizeLinks(doc.why.noteHtml, locale)}
                    </p>
                </div>
            </section>

            <!-- Trust -->
            <section class="section band" id="trust">
                <div class="container trust-grid" data-reveal="stagger">
${doc.trust.map((t, i) => `                    <div class="trust-item">\n                        <i class="${TRUST_ICONS[i]}"></i>\n                        <span>${esc(t.label)}</span>\n                        <small>${esc(t.small)}</small>\n                    </div>`).join("\n")}
                </div>
            </section>

            <!-- Support -->
            <section class="section" id="support">
                <div class="container" data-reveal>
                    <div class="section-head">
                        <p class="eyebrow">${esc(doc.support.eyebrow)}</p>
                        <h2 class="section-title">${esc(doc.support.title)}</h2>
                        <p class="section-sub">
                            ${esc(doc.support.sub)}
                        </p>
                    </div>
                    <div class="support-grid">
                        <div class="card support-card">
                            <h3 class="support-tier">${esc(doc.support.free.tier)}</h3>
                            <p class="support-price">${esc(doc.support.free.price)}</p>
                            <p class="support-desc">
                                ${esc(doc.support.free.desc)}
                            </p>
                            <a
                                class="btn btn-secondary"
                                href="https://patreon.com/akutishevskyi?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink"
                                target="_blank"
                                rel="noopener noreferrer"
                                >${esc(doc.support.free.cta)}</a
                            >
                        </div>
                        <div class="card support-card support-card-paid">
                            <h3 class="support-tier">${esc(doc.support.paid.tier)}</h3>
                            <p class="support-price">${esc(doc.support.paid.price)}</p>
                            <p class="support-desc">
                                ${esc(doc.support.paid.desc)}
                            </p>
                            <a
                                class="btn btn-primary"
                                href="https://patreon.com/akutishevskyi?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink"
                                target="_blank"
                                rel="noopener noreferrer"
                                >${esc(doc.support.paid.cta)}</a
                            >
                        </div>
                    </div>
                </div>
            </section>

            <!-- Closing CTA -->
            <section class="section cta">
                <div class="container cta-inner" data-reveal>
                    <h2 class="cta-title">${esc(doc.cta.title)}</h2>
                    <p class="cta-sub">
                        ${esc(doc.cta.sub)}
                    </p>
                    <div class="cta-actions">
                        <a class="btn btn-on-accent" href="#install"
                            >${esc(doc.cta.primary)}</a
                        >
                        <a
                            class="btn btn-ghost-accent"
                            href="https://github.com/akutishevsky/nutrition-mcp"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <i class="fa-brands fa-github"></i> ${esc(doc.cta.secondary)}
                            <span class="gh-stars" id="gh-stars"></span>
                        </a>
                    </div>
                </div>
            </section>

            <!-- Contact -->
            <section class="section band" id="contact">
                <div class="container" data-reveal>
                    <div class="section-head">
                        <p class="eyebrow">${esc(doc.contact.eyebrow)}</p>
                        <h2 class="section-title">${esc(doc.contact.title)}</h2>
                        <p class="section-sub">
                            ${esc(doc.contact.sub)}
                        </p>
                    </div>
                    <div class="card contact-card">
                        <span class="contact-icon" aria-hidden="true"
                            ><i class="fa-solid fa-envelope"></i
                        ></span>
                        <a
                            class="contact-email"
                            href="mailto:anton@nutrition-mcp.com"
                            >anton@nutrition-mcp.com</a
                        >
                        <a
                            class="btn btn-primary"
                            href="mailto:anton@nutrition-mcp.com"
                            >${esc(doc.contact.cta)}</a
                        >
                    </div>
                </div>
            </section>

            <!-- FAQ -->
            <section class="section" id="faq">
                <div class="container" data-reveal>
                    <div class="section-head">
                        <p class="eyebrow">${esc(doc.faqSection.eyebrow)}</p>
                        <h2 class="section-title">
                            ${esc(doc.faqSection.title)}
                        </h2>
                    </div>
                    <div class="faq">
${doc.faq.map(renderFaq).join("\n")}
                    </div>
                </div>
            </section>
        </main>

${footer(locale)}

        <script>
            ${LANDING_SCRIPT}
        </script>
${SITE_SCRIPT}
    </body>
</html>
`;
}

// Only when run as a script. src/landing-script.test.ts imports
// LANDING_SCRIPT from here, and an unguarded write loop would regenerate the
// nine pages as a side effect of that import — which is precisely the drift
// the test exists to catch, silently repaired a millisecond before it looks.
if (import.meta.main) {
    for (const [locale, doc] of Object.entries(INDEX) as [
        SiteLocale,
        IndexDoc,
    ][]) {
        const file =
            locale === "en"
                ? "./public/index.html"
                : `./public/${locale}/index.html`;
        await Bun.write(file, renderDoc(doc, locale));
        console.log(`wrote ${file}`);
    }
}
