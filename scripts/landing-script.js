(function () {
    var reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;

    // The page's own language, stamped on <html lang> by the generator. One
    // script serves all nine locales, so it never names a locale of its own:
    // every number and every plural is formatted in the one it was rendered
    // in, and every word it shows was rendered into the markup.
    var NUM_LOCALE = document.documentElement.lang || "en";

    function fmtInt(n) {
        return Math.round(n).toLocaleString(NUM_LOCALE);
    }
    function fmtDec(n, digits) {
        return n.toLocaleString(NUM_LOCALE, {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits,
        });
    }
    function pad2(n) {
        return (n < 10 ? "0" : "") + n;
    }

    // ---------- odometer ----------
    // One reel of 0-9 per digit of the real figure: the digits that roll are
    // the digits that are true. Rightmost reels start first. Widths are the
    // design's per-digit advance in em, so a "1" doesn't sit in a "0"-wide
    // slot.
    var DIGIT_W = [0.61, 0.36, 0.58, 0.52, 0.59, 0.58, 0.57, 0.55, 0.58, 0.57];
    function setOdometer(el, digits, spoken) {
        var text = spoken;
        // The tile's translated label sits beside the figure in .odo-cap;
        // the spoken name is the figure plus that label, never English.
        var tile = el.closest(".lp-tile");
        var cap = tile && tile.querySelector(".odo-cap");
        var capText = cap ? cap.textContent.trim() : "";
        el.setAttribute(
            "aria-label",
            capText ? text + " " + capText : text + " calories tracked",
        );
        if (reduceMotion) {
            el.textContent = digits;
            el._shape = null;
            return;
        }
        var shape = digits.replace(/[0-9]/g, "0");
        if (el._shape !== shape) {
            el._shape = shape;
            el.textContent = "";
            el._reels = [];
            digits.split("").forEach(function (ch) {
                var cell = document.createElement("span");
                if (ch < "0" || ch > "9") {
                    cell.className = "lp-odo-sep";
                    cell.textContent = ch;
                    el.appendChild(cell);
                    return;
                }
                cell.className = "lp-odo-d";
                var col = document.createElement("span");
                col.className = "lp-odo-col";
                for (var d = 0; d < 10; d++) {
                    var face = document.createElement("span");
                    face.textContent = d;
                    col.appendChild(face);
                }
                cell.appendChild(col);
                el.appendChild(cell);
                el._reels.push({ cell: cell, col: col });
            });
        }
        var nums = digits.replace(/[^0-9]/g, "");
        var reels = el._reels;
        // Paint at rest first, so a fresh reel rolls up from 0 instead of
        // appearing already in place.
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                reels.forEach(function (r, j) {
                    var d = Number(nums.charAt(j));
                    var delay = (reels.length - 1 - j) * 70 + "ms";
                    r.cell.style.width = DIGIT_W[d] + "em";
                    r.cell.style.transitionDelay = delay;
                    r.col.style.transitionDelay = delay;
                    r.col.style.transform = "translateY(-" + d * 10 + "%)";
                });
            });
        });
    }

    // ---------- units ----------
    // Every mass the API returns is in grams and every volume in ml, and
    // only ever rendered through these, so the Metric / Imperial toggle is a
    // repaint and never a refetch.
    var UNIT_STORE = "stats-unit";
    var unit = "kg";
    try {
        var savedUnit = localStorage.getItem(UNIT_STORE);
        if (savedUnit === "kg" || savedUnit === "lb") unit = savedUnit;
        else if (/^en-US\b/i.test(navigator.language || "")) unit = "lb";
    } catch (e) {}
    var LB_G = 453.59237;
    var OZ_G = 28.349523125;
    var GAL_ML = 3785.41;
    var FLOZ_ML = 29.5735;
    var MASS = {
        total_protein_g: 1,
        total_carbs_g: 1,
        total_fat_g: 1,
        weight_lost_g: 1,
    };
    function display(key, v) {
        if (key in MASS) {
            var big = unit === "kg" ? v / 1000 : v / LB_G;
            var digits =
                key === "weight_lost_g" && unit === "kg"
                    ? fmtDec(big, 1)
                    : fmtInt(big);
            return { digits: digits, unit: unit };
        }
        if (key === "total_water_ml") {
            return {
                digits: fmtInt(unit === "kg" ? v / 1000 : v / GAL_ML),
                unit: unit === "kg" ? "L" : "gal",
            };
        }
        if (key === "total_calories")
            return { digits: fmtInt(v), unit: "kcal" };
        return { digits: fmtInt(v), unit: "" };
    }

    // ---------- live deltas ----------
    // Net change since this page was opened, in a unit small enough to see
    // it move: grams under kg, ounces under lb, ml under L, fl oz under gal.
    var plural = new Intl.PluralRules(NUM_LOCALE);
    function deltaText(key, tile, diff) {
        var n, u;
        if (key === "total_calories") {
            n = Math.round(diff);
            if (!n) return "";
            return fmtInt(Math.abs(n)) + " kcal";
        }
        if (key === "food_logs") {
            n = Math.round(diff);
            if (!n) return "";
            var cat = plural.select(Math.abs(n));
            var word =
                tile.getAttribute("data-plural-" + cat) ||
                tile.getAttribute("data-plural-other") ||
                "";
            return fmtInt(Math.abs(n)) + (word ? " " + word : "");
        }
        var a = Math.abs(diff);
        if (key in MASS) {
            if (unit === "kg") {
                if (a < 1000) {
                    n = Math.round(a);
                    u = " g";
                } else return fmtDec(a / 1000, 1) + " kg";
            } else {
                if (a < LB_G) {
                    n = Math.round(a / OZ_G);
                    u = " oz";
                } else return fmtDec(a / LB_G, 1) + " lb";
            }
        } else {
            if (unit === "kg") {
                if (a < 1000) {
                    n = Math.round(a);
                    u = " ml";
                } else return fmtDec(a / 1000, 1) + " L";
            } else {
                if (a < GAL_ML) {
                    n = Math.round(a / FLOZ_ML);
                    u = " fl oz";
                } else return fmtDec(a / GAL_ML, 1) + " gal";
            }
        }
        return n ? fmtInt(n) + u : "";
    }
    function showDelta(key, tile, diff, quiet) {
        var chip = tile.querySelector(".lp-delta");
        if (!chip) return;
        var t = deltaText(key, tile, diff);
        if (!t) {
            chip.hidden = true;
            return;
        }
        chip.hidden = false;
        chip.classList.toggle("down", diff < 0);
        chip.textContent = (diff > 0 ? "+" : "−") + t;
        if (quiet) return;
        // Restart the chip's rise so a second change is noticed.
        chip.style.animation = "none";
        void chip.offsetWidth;
        chip.style.animation = "";
    }

    // ---------- tiles ----------
    var KEYS = [
        "total_calories",
        "food_logs",
        "total_protein_g",
        "total_carbs_g",
        "total_fat_g",
        "weight_lost_g",
        "total_water_ml",
    ];
    function paintTile(key, v, base, live, quiet) {
        var tile = document.querySelector('.lp-tile[data-tile="' + key + '"]');
        if (!tile) return;
        if (typeof v !== "number") {
            // weight_lost_g / total_water_ml are optional in /api/stats: a
            // tile with nothing to show is hidden rather than reading NaN.
            tile.hidden = true;
            return;
        }
        tile.hidden = false;
        var shown = display(key, v);
        var odo = tile.querySelector("[data-odo]");
        var unitEl = tile.querySelector(".lp-unit");
        if (unitEl) unitEl.textContent = shown.unit;
        if (odo)
            setOdometer(
                odo,
                shown.digits,
                shown.digits + (shown.unit ? " " + shown.unit : ""),
            );
        if (base && typeof base[key] === "number")
            showDelta(key, tile, v - base[key], quiet);
        if (live) {
            tile.classList.add("is-live");
            clearTimeout(tile._live);
            tile._live = setTimeout(function () {
                tile.classList.remove("is-live");
            }, 2200);
        }
    }

    // `prev` is the last stats object painted, or null on first load.
    // Unchanged figures are left alone so the page is still while nothing
    // happens.
    function setStats(stats, prev, base) {
        KEYS.forEach(function (key) {
            var v = stats[key];
            var before = prev ? prev[key] : null;
            if (prev && before === v) return;
            paintTile(key, v, base, !!prev, false);
        });
        document
            .querySelectorAll('[data-stat="timezones"]')
            .forEach(function (b) {
                if (typeof stats.timezones === "number")
                    b.textContent = fmtInt(stats.timezones);
            });
        // The "Live stats" nav badge is site.js's (it is on every page);
        // handing it the figures fetched here keeps this page on one poll,
        // and passing our page-load baseline keeps the badge in step with
        // the food-log tile's delta chip.
        document.dispatchEvent(
            new CustomEvent("live-stats", {
                detail: { stats: stats, base: base },
            }),
        );
    }

    // ---------- world map ----------
    var SVGNS = "http://www.w3.org/2000/svg";
    // gen-map-data.ts parks every UTC-equivalent zone on null island, which
    // would draw a dot in the Atlantic. Skip them.
    var UTC_TZS = {
        UTC: 1,
        "Etc/UTC": 1,
        "Etc/GMT": 1,
        GMT: 1,
        "Etc/Greenwich": 1,
    };
    // [halo, core] radius per level 1-5. A circle is read by its area, so
    // radii step by roughly root-2 in area terms rather than linearly.
    var TZ_RADII = [
        [5.5, 2.0],
        [7.2, 2.55],
        [9.2, 3.15],
        [11.2, 3.75],
        [14.5, 4.7],
    ];
    // The design crops the poles: every y moves up by 20 into a 1000 x 440
    // box.
    var MAP_DY = 20;
    function buildMap(mapData, tzLevels) {
        var svg = document.getElementById("world-svg");
        if (!svg || !mapData) return;
        var landFrag = document.createDocumentFragment();
        mapData.land.forEach(function (p) {
            var c = document.createElementNS(SVGNS, "circle");
            c.setAttribute("cx", p[0]);
            c.setAttribute("cy", p[1] - MAP_DY);
            c.setAttribute("r", "1.9");
            c.setAttribute("class", "lp-land");
            landFrag.appendChild(c);
        });
        svg.appendChild(landFrag);
        var seen = {};
        var plotted = 0;
        function sizeDot(dot, level) {
            var r = TZ_RADII[level - 1];
            dot.halo.setAttribute("r", r[0]);
            dot.core.setAttribute("r", r[1]);
            dot.level = level;
        }
        Object.keys(tzLevels || {}).forEach(function (tz) {
            if (UTC_TZS[tz]) return;
            var pt = mapData.tz[tz];
            if (!pt) return;
            var level = Math.min(
                TZ_RADII.length,
                Math.max(1, Math.round(tzLevels[tz]) || 1),
            );
            // Alias spellings (Europe/Kiev vs Europe/Kyiv) project to the
            // same point and share one dot, at the larger level.
            var k = pt[0] + "," + pt[1];
            if (seen[k]) {
                if (level > seen[k].level) sizeDot(seen[k], level);
                return;
            }
            var g = document.createElementNS(SVGNS, "g");
            var halo = document.createElementNS(SVGNS, "circle");
            var core = document.createElementNS(SVGNS, "circle");
            [halo, core].forEach(function (c) {
                c.setAttribute("cx", pt[0]);
                c.setAttribute("cy", pt[1] - MAP_DY);
            });
            halo.setAttribute("class", "lp-tz-halo");
            core.setAttribute("class", "lp-tz-core");
            halo.style.animationDelay = (plotted % 6) * 0.45 + "s";
            var dot = { halo: halo, core: core, level: 0 };
            sizeDot(dot, level);
            g.appendChild(halo);
            g.appendChild(core);
            seen[k] = dot;
            svg.appendChild(g);
            plotted++;
        });
    }

    // ---------- load data, then keep it live ----------
    var POLL_MS = 5000;
    var lastStats = null;
    var baseStats = null;
    var pollTimer = null;
    var nextAt = 0;
    var openedAt = Date.now();
    var liveEl = document.getElementById("facts-live");
    // The translated word the generator rendered into that node, captured
    // before the first update rewrites it, so the line is rebuilt from it
    // rather than replaced with English.
    var liveLabel = liveEl ? liveEl.textContent.trim() : "";
    var countEl = document.getElementById("stats-next");
    var sinceEl = document.getElementById("stats-since");
    var ringEl = document.getElementById("stats-ring");

    function restartRing() {
        if (!ringEl || reduceMotion) return;
        var fresh = ringEl.cloneNode(true);
        ringEl.parentNode.replaceChild(fresh, ringEl);
        ringEl = fresh;
    }
    function elapsed(ms) {
        var s = Math.floor(ms / 1000);
        var h = Math.floor(s / 3600);
        var m = Math.floor((s % 3600) / 60);
        s = s % 60;
        return h ? h + "h " + m + "m" : m ? m + "m " + s + "s" : s + "s";
    }
    setInterval(function () {
        if (document.hidden) return;
        if (countEl && nextAt)
            countEl.textContent = fmtInt(
                Math.max(1, Math.ceil((nextAt - Date.now()) / 1000)),
            );
        if (sinceEl) sinceEl.textContent = elapsed(Date.now() - openedAt);
    }, 1000);

    // ---------- Metric / Imperial toggle ----------
    var unitBtns = [].slice.call(document.querySelectorAll("[data-unit]"));
    function paintUnitToggle() {
        unitBtns.forEach(function (b) {
            b.setAttribute(
                "aria-pressed",
                b.getAttribute("data-unit") === unit ? "true" : "false",
            );
        });
    }
    paintUnitToggle();
    unitBtns.forEach(function (b) {
        b.addEventListener("click", function () {
            var next = b.getAttribute("data-unit");
            if (next === unit) return;
            unit = next;
            try {
                localStorage.setItem(UNIT_STORE, unit);
            } catch (e) {}
            paintUnitToggle();
            if (!lastStats) return;
            // Repainted in place: the figures did not change, only the unit
            // they are written in, so nothing glows.
            KEYS.forEach(function (key) {
                if (key in MASS || key === "total_water_ml")
                    paintTile(key, lastStats[key], baseStats, false, true);
            });
        });
    });

    function fetchStats() {
        return fetch("/api/stats", { cache: "no-store" }).then(function (r) {
            if (!r.ok) throw new Error("stats");
            return r.json();
        });
    }
    function poll() {
        pollTimer = null;
        if (document.hidden) return;
        fetchStats()
            .then(function (stats) {
                setStats(stats, lastStats, baseStats);
                lastStats = stats;
                if (liveEl) liveEl.classList.remove("stale");
            })
            .catch(function () {
                if (liveEl) liveEl.classList.add("stale");
            })
            .then(schedule);
    }
    function schedule() {
        if (pollTimer || document.hidden) return;
        nextAt = Date.now() + POLL_MS;
        restartRing();
        pollTimer = setTimeout(poll, POLL_MS);
    }
    // A background tab stops polling; coming back refetches at once.
    document.addEventListener("visibilitychange", function () {
        if (document.hidden) {
            clearTimeout(pollTimer);
            pollTimer = null;
        } else if (lastStats) {
            poll();
        }
    });
    Promise.all([
        fetchStats(),
        fetch("/map-data.json").then(function (r) {
            return r.ok ? r.json() : null;
        }),
    ])
        .then(function (res) {
            var stats = res[0];
            setStats(stats, null, null);
            lastStats = stats;
            baseStats = stats;
            buildMap(res[1], stats.timezone_levels);
            if (liveEl) {
                liveEl.classList.add("on");
                // The deltas are measured from this moment.
                var t = new Date().toLocaleTimeString(NUM_LOCALE, {
                    hour: "numeric",
                    minute: "2-digit",
                });
                liveEl.textContent = (liveLabel ? liveLabel + " · " : "") + t;
            }
            schedule();
        })
        .catch(function () {
            var row = document.getElementById("stat-row");
            var map = document.getElementById("map-block");
            var meta = document.getElementById("stats-meta");
            if (row) row.hidden = true;
            if (map) map.hidden = true;
            if (meta) meta.hidden = true;
        });

    // ---------- hero chat replay ----------
    // Every message is in the markup, so a reader without script (or with
    // reduced motion) gets the whole conversation. With motion, the thread is
    // emptied and replayed once it is on screen: typed user turns, a typing
    // indicator, then the reply and its card.
    var thread = document.getElementById("hero-thread");
    var pauseBtn = document.querySelector("[data-hero-pause]");
    var replayBtn = document.querySelector("[data-hero-replay]");
    if (thread && !reduceMotion && "IntersectionObserver" in window) {
        var script = [].slice.call(thread.children);
        var run = 0;
        var paused = false;
        var typing = null;
        var wait = function (ms, id) {
            return new Promise(function (resolve, reject) {
                var left = ms;
                (function tick() {
                    if (id !== run) return reject(new Error("stale"));
                    if (paused || document.hidden) return setTimeout(tick, 200);
                    if (left <= 0) return resolve();
                    var step = Math.min(200, left);
                    left -= step;
                    setTimeout(tick, step);
                })();
            });
        };
        var follow = function () {
            thread.scrollTo({ top: thread.scrollHeight, behavior: "smooth" });
        };
        var push = function (node) {
            if (typing) {
                typing.remove();
                typing = null;
            }
            thread.appendChild(node);
            follow();
        };
        var showTyping = function () {
            typing = document.createElement("div");
            typing.className = "lp-typing";
            typing.setAttribute("aria-hidden", "true");
            typing.innerHTML = "<span></span><span></span><span></span>";
            thread.appendChild(typing);
            follow();
        };
        var setPaused = function (p) {
            paused = p;
            if (!pauseBtn) return;
            pauseBtn.setAttribute("aria-pressed", p ? "true" : "false");
            var icon = pauseBtn.querySelector("i");
            if (icon)
                icon.className = p ? "fa-solid fa-play" : "fa-solid fa-pause";
        };
        var play = async function () {
            var id = ++run;
            thread.textContent = "";
            typing = null;
            thread.setAttribute("aria-busy", "true");
            setPaused(false);
            if (pauseBtn) pauseBtn.hidden = false;
            if (replayBtn) replayBtn.hidden = true;
            try {
                for (var i = 0; i < script.length; i++) {
                    var item = script[i];
                    var kind = item.getAttribute("data-kind");
                    var node = item.cloneNode(true);
                    if (kind === "user") {
                        await wait(500, id);
                        var text = node.textContent;
                        node.textContent = "";
                        var words = document.createTextNode("");
                        var caret = document.createElement("span");
                        caret.className = "lp-caret";
                        node.appendChild(words);
                        node.appendChild(caret);
                        push(node);
                        for (var c = 1; c <= text.length; c++) {
                            await wait(24, id);
                            words.nodeValue = text.slice(0, c);
                        }
                        caret.remove();
                        await wait(350, id);
                        showTyping();
                        await wait(900, id);
                    } else if (kind === "photo") {
                        await wait(500, id);
                        push(node);
                        await wait(700, id);
                        showTyping();
                        await wait(1100, id);
                    } else if (kind === "card") {
                        push(node);
                        await wait(1400, id);
                    } else {
                        push(node);
                        await wait(2600, id);
                    }
                }
            } catch (e) {
                return;
            }
            thread.removeAttribute("aria-busy");
            if (pauseBtn) pauseBtn.hidden = true;
            if (replayBtn) replayBtn.hidden = false;
        };
        if (pauseBtn)
            pauseBtn.addEventListener("click", function () {
                setPaused(!paused);
            });
        if (replayBtn)
            replayBtn.addEventListener("click", function () {
                play();
            });
        thread.textContent = "";
        var seenHero = new IntersectionObserver(
            function (entries) {
                if (!entries[0].isIntersecting) return;
                seenHero.disconnect();
                play();
            },
            { threshold: 0.4 },
        );
        seenHero.observe(thread);
    }

    // ---------- examples carousel ----------
    var exTabs = [].slice.call(
        document.querySelectorAll("#ex-tabs [role=tab]"),
    );
    var exPanels = [].slice.call(document.querySelectorAll(".lp-ex-panel"));
    var exRing = document.getElementById("ex-ring");
    var exStrip = document.getElementById("ex-tabs");
    var exCount = document.getElementById("ex-count");
    var exBox = document.getElementById("try-carousel");
    var exIdx = 0;
    function placeRing() {
        var tab = exTabs[exIdx];
        if (!exRing || !tab) return;
        exRing.style.transform =
            "translate(" + tab.offsetLeft + "px," + tab.offsetTop + "px)";
        exRing.style.borderColor = tab.getAttribute("data-c");
        exRing.style.opacity = "1";
    }
    function showExample(i, focus) {
        if (!exTabs.length) return;
        exIdx = (i + exTabs.length) % exTabs.length;
        exTabs.forEach(function (t, k) {
            var on = k === exIdx;
            t.setAttribute("aria-selected", on ? "true" : "false");
            t.tabIndex = on ? 0 : -1;
        });
        exPanels.forEach(function (p, k) {
            p.classList.toggle("is-on", k === exIdx);
        });
        var tab = exTabs[exIdx];
        if (exBox) {
            exBox.style.setProperty("--c", tab.getAttribute("data-c"));
            exBox.style.setProperty("--c-icon", tab.getAttribute("data-ci"));
        }
        if (exCount) exCount.textContent = pad2(exIdx + 1);
        placeRing();
        if (exStrip && exStrip.scrollWidth > exStrip.clientWidth)
            exStrip.scrollTo({
                left:
                    tab.offsetLeft -
                    (exStrip.clientWidth - tab.offsetWidth) / 2,
                behavior: reduceMotion ? "auto" : "smooth",
            });
        if (focus) tab.focus();
    }
    exTabs.forEach(function (t, k) {
        t.addEventListener("click", function () {
            showExample(k, false);
        });
        t.addEventListener("keydown", function (e) {
            var go =
                e.key === "ArrowRight"
                    ? 1
                    : e.key === "ArrowLeft"
                      ? -1
                      : e.key === "Home"
                        ? -exIdx
                        : e.key === "End"
                          ? exTabs.length - 1 - exIdx
                          : 0;
            if (!go) return;
            e.preventDefault();
            showExample(exIdx + go, true);
        });
    });
    document.querySelectorAll("[data-ex-dir]").forEach(function (b) {
        b.addEventListener("click", function () {
            showExample(
                exIdx + (b.getAttribute("data-ex-dir") === "next" ? 1 : -1),
                false,
            );
        });
    });
    if (exTabs.length) {
        showExample(0, false);
        window.addEventListener("resize", placeRing);
        if (document.fonts && document.fonts.ready)
            document.fonts.ready.then(placeRing);
    }

    // ---------- recent Patreon posts ----------
    var patreonBlock = document.getElementById("patreon-updates");
    var patreonGrid = document.getElementById("patreon-grid");
    if (patreonBlock && patreonGrid) {
        fetch("/api/patreon-posts")
            .then(function (r) {
                return r.ok ? r.json() : [];
            })
            .then(function (posts) {
                if (!posts || !posts.length) return;
                var pager = document.getElementById("patreon-pager");
                var dots = document.getElementById("patreon-dots");
                var prev = document.querySelector('[data-posts-dir="prev"]');
                var next = document.querySelector('[data-posts-dir="next"]');
                var linkLabel = patreonGrid.getAttribute("data-link-label");
                var dotLabel = dots ? dots.getAttribute("data-dot-label") : "";
                var page = 0;
                var per = 3;
                function perPage() {
                    var w = window.innerWidth;
                    return w < 700 ? 1 : w < 1000 ? 2 : 3;
                }
                function card(p) {
                    var a = document.createElement("a");
                    a.href = p.url;
                    a.target = "_blank";
                    a.rel = "noopener noreferrer";
                    a.className = "lp-post";
                    var title = document.createElement("b");
                    title.textContent = p.title;
                    a.appendChild(title);
                    if (p.preview) {
                        var preview = document.createElement("span");
                        preview.className = "lp-post-preview";
                        preview.textContent = p.preview;
                        a.appendChild(preview);
                    }
                    var more = document.createElement("span");
                    more.className = "lp-post-link";
                    more.textContent = linkLabel;
                    var icon = document.createElement("i");
                    icon.className = "fa-solid fa-arrow-up-right-from-square";
                    icon.setAttribute("aria-hidden", "true");
                    more.appendChild(icon);
                    a.appendChild(more);
                    return a;
                }
                function render() {
                    var pages = Math.ceil(posts.length / per);
                    page = Math.min(page, pages - 1);
                    patreonGrid.style.setProperty("--per", per);
                    patreonGrid.textContent = "";
                    posts
                        .slice(page * per, page * per + per)
                        .forEach(function (p) {
                            patreonGrid.appendChild(card(p));
                        });
                    if (!pager) return;
                    pager.hidden = pages < 2;
                    if (prev) prev.disabled = page === 0;
                    if (next) next.disabled = page >= pages - 1;
                    if (!dots) return;
                    dots.textContent = "";
                    for (var k = 0; k < pages; k++) {
                        var b = document.createElement("button");
                        b.type = "button";
                        b.setAttribute("aria-label", dotLabel + " " + (k + 1));
                        if (k === page) b.setAttribute("aria-current", "true");
                        b.appendChild(document.createElement("span"));
                        (function (to) {
                            b.addEventListener("click", function () {
                                page = to;
                                render();
                            });
                        })(k);
                        dots.appendChild(b);
                    }
                }
                if (prev)
                    prev.addEventListener("click", function () {
                        page = Math.max(0, page - 1);
                        render();
                    });
                if (next)
                    next.addEventListener("click", function () {
                        page = page + 1;
                        render();
                    });
                window.addEventListener("resize", function () {
                    var p = perPage();
                    if (p === per) return;
                    page = Math.floor((page * per) / p);
                    per = p;
                    render();
                });
                per = perPage();
                render();
                patreonBlock.hidden = false;
            })
            .catch(function () {});
    }
})();
