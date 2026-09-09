/**
 * Generates public/index.html (the landing page) and its translated
 * counterparts under public/{locale}/ from the typed data in
 * src/copy/index.ts.
 *
 * The page is the "Dawn" design (6a). Its header, sheet menu and footer are
 * the shared chrome — nav()/footer() in scripts/site-partials.ts, the same
 * markup every other generated page renders — and it loads the one site
 * stylesheet (/styles.css) through the shared HEAD_ASSETS; this file only
 * owns the sections between them (hero chat, how, connect, onboarding,
 * examples, live board, support, contact, FAQ, closing band) and the
 * page's own script. The design was first built here and then generalised
 * outward, which is why so many of the site's shared classes are nm-*.
 *
 * Re-run after editing src/copy/index.ts:
 *   bun run scripts/gen-index.ts
 * The generated .html files are the served artifacts — don't hand-edit them.
 */

import {
    HTML_LANG,
    QUOTES,
    hashPath,
    pathFor,
    urlFor,
    type SiteLocale,
} from "../src/routes.js";
import {
    EMAIL,
    EXT,
    GITHUB,
    HEAD_ASSETS,
    MCP_URL,
    PATREON,
    SITE,
    attr,
    esc,
    footer,
    generatedBanner,
    jsonLd,
    localeHead,
    nav,
    translationNotice,
    SITE_SCRIPT,
    THEME_PREPAINT,
} from "./site-partials.js";
import {
    INDEX,
    type FaqEntry,
    type HeroExchange,
    type IndexDoc,
} from "../src/copy/index.js";

// The landing page's own JS: the hero chat replay, the examples picker, the
// live-stats poller (count-ups, deltas, unit toggle, countdown, world map),
// the GitHub star count and the Patreon posts. Not prose — page behaviour.
// It holds no copy of its own: everything it shows it reads back out of the
// markup the generator wrote (<html lang>, data-* attributes, the static
// chat thread, the <template> for a post card), because this one string is
// embedded byte-identically into all nine locales' index.html.
//
// Written as a String.raw block so it reads as plain JS; the one rule that
// follows is that the script may contain neither a backtick nor "${".
// Exported for src/landing-script.test.ts, which pins the nine generated
// pages against THIS constant.
export const LANDING_SCRIPT: string = String.raw`            (function () {
                var reduceMotion = window.matchMedia(
                    "(prefers-reduced-motion: reduce)",
                ).matches;

                // The page's own language, stamped on <html lang> by the generator.
                // One script serves all nine locales, so it can never name a locale of
                // its own: it reads the one it was rendered in. Every figure, date and
                // clock on the page is formatted against this.
                var NUM_LOCALE = document.documentElement.lang || "en";

                function fmtInt(n) {
                    return Math.round(n).toLocaleString(NUM_LOCALE);
                }
                function fmtDec(n, digits) {
                    return n.toLocaleString(NUM_LOCALE, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: digits,
                    });
                }
                function wait(ms) {
                    return new Promise(function (resolve) {
                        setTimeout(resolve, ms);
                    });
                }
                // Resolves once the tab is visible again - the loops below sleep in a
                // background tab rather than burn timers nobody is watching.
                function whenVisible() {
                    if (!document.hidden) return Promise.resolve();
                    return new Promise(function (resolve) {
                        document.addEventListener("visibilitychange", function onShow() {
                            if (document.hidden) return;
                            document.removeEventListener("visibilitychange", onShow);
                            resolve();
                        });
                    });
                }
                function readJson(el, attr) {
                    try {
                        return JSON.parse(el.getAttribute(attr) || "{}");
                    } catch (e) {
                        return {};
                    }
                }

                // ---------- hero chat: replay the static thread ----------
                // The generator renders the whole conversation in full, so the page
                // reads without script and for crawlers. Here it is taken apart into
                // exchanges (a user or barcode bubble carrying data-add / data-clock /
                // data-widget, followed by its AI reply) and replayed as the design's
                // loop: type the user line, show the typing dots, reveal the reply, add
                // that exchange's nutrients to the summary widget. Every bubble on
                // screen is a clone of one the generator wrote - the script holds no
                // copy of its own.
                var chatList = document.querySelector("[data-chat-list]");
                var chatClock = document.querySelector("[data-chat-clock]");
                var chatPause = document.querySelector("[data-chat-pause]");
                // WCAG 2.2.2: the replay auto-starts and runs longer than 5 s, so
                // the reader gets a pause. It freezes the loop where it stands - mid
                // word if that is where it was - and play resumes from there. The
                // toggle mirrors whenVisible(): the loop awaits it at every step.
                var chatPaused = false;
                var chatResume = [];
                function whenPlaying() {
                    if (!chatPaused) return Promise.resolve();
                    return new Promise(function (resolve) {
                        chatResume.push(resolve);
                    });
                }
                if (chatPause && !reduceMotion) {
                    chatPause.addEventListener("click", function () {
                        chatPaused = !chatPaused;
                        chatPause.setAttribute("aria-pressed", String(chatPaused));
                        var icon = chatPause.querySelector("i");
                        if (icon) {
                            icon.classList.toggle("fa-pause", !chatPaused);
                            icon.classList.toggle("fa-play", chatPaused);
                        }
                        if (!chatPaused) {
                            var waiting = chatResume;
                            chatResume = [];
                            waiting.forEach(function (resolve) {
                                resolve();
                            });
                        }
                    });
                }
                if (chatList && !reduceMotion) {
                    var widgetTpl = chatList.querySelector(".nm-widget");
                    var exchanges = [];
                    [].slice.call(chatList.children).forEach(function (node) {
                        if (node.matches(".nm-msg-user, .nm-msg-barcode")) {
                            exchanges.push({
                                user: node,
                                ai: null,
                                add: readJson(node, "data-add"),
                                clock: node.getAttribute("data-clock") || "",
                                widget: node.hasAttribute("data-widget"),
                                barcode: node.classList.contains("nm-msg-barcode"),
                            });
                        } else if (node.matches(".nm-msg-ai") && exchanges.length) {
                            exchanges[exchanges.length - 1].ai = node;
                        }
                    });
                    // The widget's daily goals; the ring is kcal against 2,000 and each
                    // bar reads its own goal off data-goal in the markup.
                    var KCAL_GOAL = 2000;
                    var CHAT_MAX = 12;
                    var totals = null;
                    function resetTotals() {
                        totals = {
                            kcal: 0,
                            pro: 0,
                            car: 0,
                            fat: 0,
                            water: 0,
                            sugar: 0,
                            caf: 0,
                        };
                    }
                    function paintWidget(w) {
                        Object.keys(totals).forEach(function (k) {
                            var el = w.querySelector('[data-w="' + k + '"]');
                            if (el) el.textContent = fmtInt(totals[k]);
                        });
                        var ring = w.querySelector("[data-ring]");
                        if (ring)
                            ring.style.setProperty(
                                "--deg",
                                Math.min(360, Math.round((totals.kcal / KCAL_GOAL) * 360)) +
                                    "deg",
                            );
                        w.querySelectorAll("[data-bar]").forEach(function (bar) {
                            var k = bar.getAttribute("data-bar");
                            var goal = Number(bar.getAttribute("data-goal")) || 1;
                            bar.style.setProperty(
                                "--w",
                                Math.min(100, Math.round((totals[k] / goal) * 100)) + "%",
                            );
                        });
                    }
                    // Keeping the thread pinned to its bottom means reading
                    // scrollHeight, and reading it forces the browser to lay the
                    // thread out then and there. Doing that per typed character —
                    // roughly forty times a second — kept a layout running
                    // continuously underneath the sticky bar, which has to re-blur
                    // whatever moves behind it, and that is what made the bar flicker
                    // while the page sat still. Coalesced to at most one per frame,
                    // and taken inside the frame rather than between two timers.
                    var pinQueued = false;
                    function pinToBottom() {
                        if (pinQueued) return;
                        pinQueued = true;
                        requestAnimationFrame(function () {
                            pinQueued = false;
                            chatList.scrollTop = chatList.scrollHeight;
                        });
                    }
                    function push(el) {
                        var typing = chatList.querySelector(".nm-typing");
                        if (typing) typing.remove();
                        chatList.appendChild(el);
                        while (chatList.children.length > CHAT_MAX)
                            chatList.removeChild(chatList.firstChild);
                        pinToBottom();
                    }
                    function typingBubble() {
                        var d = document.createElement("div");
                        d.className = "nm-typing";
                        d.setAttribute("aria-hidden", "true");
                        for (var i = 0; i < 3; i++)
                            d.appendChild(document.createElement("span"));
                        return d;
                    }
                    async function typeUser(src) {
                        var text = src.textContent.trim();
                        // Shallow clone keeps the bubble's class and data attributes
                        // and drops its text, which is typed back in below.
                        var bubble = src.cloneNode(false);
                        var textNode = document.createTextNode("");
                        var caret = document.createElement("span");
                        caret.className = "nm-caret";
                        caret.setAttribute("aria-hidden", "true");
                        bubble.appendChild(textNode);
                        bubble.appendChild(caret);
                        push(bubble);
                        for (var i = 1; i <= text.length; i++) {
                            await whenPlaying();
                            textNode.nodeValue = text.slice(0, i);
                            pinToBottom();
                            await wait(24);
                        }
                        caret.remove();
                    }
                    async function replay() {
                        for (;;) {
                            chatList.textContent = "";
                            resetTotals();
                            for (var i = 0; i < exchanges.length; i++) {
                                await whenVisible();
                                await whenPlaying();
                                var ex = exchanges[i];
                                if (chatClock) chatClock.textContent = ex.clock;
                                await wait(500);
                                if (ex.barcode) {
                                    push(ex.user.cloneNode(true));
                                    await wait(900);
                                } else {
                                    await typeUser(ex.user);
                                }
                                await wait(350);
                                await whenPlaying();
                                push(typingBubble());
                                await wait(900);
                                await whenPlaying();
                                Object.keys(ex.add).forEach(function (k) {
                                    if (k in totals) totals[k] += Number(ex.add[k]) || 0;
                                });
                                if (ex.ai) push(ex.ai.cloneNode(true));
                                if (ex.widget && widgetTpl) {
                                    await wait(500);
                                    var w = widgetTpl.cloneNode(true);
                                    paintWidget(w);
                                    push(w);
                                    await wait(3600);
                                } else {
                                    await wait(2600);
                                }
                            }
                            await wait(2200);
                            await whenPlaying();
                        }
                    }
                    if (exchanges.length) replay();
                }

                // ---------- live GitHub star count ----------
                var starEls = document.querySelectorAll("[data-gh-stars]");
                if (starEls.length) {
                    fetch("https://api.github.com/repos/akutishevsky/nutrition-mcp")
                        .then(function (r) {
                            return r.ok ? r.json() : null;
                        })
                        .then(function (d) {
                            if (!d || typeof d.stargazers_count !== "number") return;
                            // Grouped in the page's language like every other figure.
                            var text = d.stargazers_count.toLocaleString(NUM_LOCALE);
                            starEls.forEach(function (el) {
                                el.textContent = text;
                            });
                        })
                        .catch(function () {});
                }

                // ---------- examples: picker + prev/next ----------
                // The picker is three radios (the highlight is CSS); the preview panels
                // sit in the other grid column, out of reach of a sibling selector, so
                // switching the active panel is the one thing left to script.
                var exRadios = [].slice.call(document.querySelectorAll('input[name="ex"]'));
                var exPanels = [].slice.call(document.querySelectorAll(".nm-ex-panel"));
                if (exRadios.length && exPanels.length) {
                    function showExample(i) {
                        exPanels.forEach(function (p, k) {
                            p.classList.toggle("is-active", k === i);
                        });
                    }
                    function currentExample() {
                        for (var i = 0; i < exRadios.length; i++)
                            if (exRadios[i].checked) return i;
                        return 0;
                    }
                    exRadios.forEach(function (r, i) {
                        r.addEventListener("change", function () {
                            if (r.checked) showExample(i);
                        });
                    });
                    document.querySelectorAll("[data-ex-dir]").forEach(function (btn) {
                        btn.addEventListener("click", function () {
                            var step = btn.getAttribute("data-ex-dir") === "prev" ? -1 : 1;
                            var n = exRadios.length;
                            var next = (currentExample() + step + n) % n;
                            exRadios[next].checked = true;
                            showExample(next);
                        });
                    });
                    showExample(currentExample());
                }

                // ---------- live stats: units ----------
                // Every weight the API returns is in grams and every volume in
                // millilitres; both are only ever rendered through these, so the
                // Metric / Imperial toggle is a repaint and never a refetch.
                var UNIT_STORE = "stats-unit";
                var GRAMS_PER = { kg: 1000, lb: 453.59237 };
                var ML_PER = { kg: 1000, lb: 3785.411784 };
                var OUNCE_G = 28.349523125;
                // A remembered choice wins; failing that, the visitor's own
                // measurement system, since "512 kg" is not a quantity most readers of
                // the English page have a feel for.
                var unit = "kg";
                try {
                    var savedUnit = localStorage.getItem(UNIT_STORE);
                    if (savedUnit === "kg" || savedUnit === "lb") unit = savedUnit;
                    else if (/^en-US\b/i.test(navigator.language || "")) unit = "lb";
                } catch (e) {}
                function isMetric() {
                    return unit === "kg";
                }
                function same(v) {
                    return v;
                }
                function toWeight(g) {
                    return g / GRAMS_PER[unit];
                }
                function toVolume(ml) {
                    return ml / ML_PER[unit];
                }
                // A weight row's delta is read in the small unit of whichever system
                // is on screen - grams under kg, ounces under lb. Raw units, not the
                // display ones: a 40 g change is invisible once rounded to kg.
                function weightDelta(diff) {
                    return isMetric()
                        ? { n: diff, unit: " g", dec: 0 }
                        : { n: diff / OUNCE_G, unit: " oz", dec: 1 };
                }
                // Per /api/stats key: how the raw figure converts for display, the unit
                // symbol written beside it, and how the change since page load reads.
                // A key with no "delta" shows none; a key with no "unit" leaves the
                // markup's own alone.
                var FORMATS = {
                    total_calories: {
                        to: same,
                        unit: function () {
                            return "kcal";
                        },
                        delta: function (diff) {
                            return { n: diff, unit: " kcal", dec: 0 };
                        },
                    },
                    food_logs: {
                        to: same,
                        unit: null,
                        // The word after the count ("logs") is the page's own, read
                        // off the tag's data-delta-unit.
                        delta: function (diff, tag) {
                            var word = tag.getAttribute("data-delta-unit") || "";
                            return { n: diff, unit: word ? " " + word : "", dec: 0 };
                        },
                    },
                    timezones: { to: same, unit: null, delta: null },
                    total_protein_g: {
                        to: toWeight,
                        unit: function () {
                            return unit;
                        },
                        delta: weightDelta,
                    },
                    total_carbs_g: {
                        to: toWeight,
                        unit: function () {
                            return unit;
                        },
                        delta: weightDelta,
                    },
                    total_fat_g: {
                        to: toWeight,
                        unit: function () {
                            return unit;
                        },
                        delta: weightDelta,
                    },
                    weight_lost_g: {
                        to: toWeight,
                        unit: function () {
                            return unit;
                        },
                        delta: function (diff) {
                            return { n: toWeight(diff), unit: " " + unit, dec: 1 };
                        },
                    },
                    total_water_ml: {
                        to: toVolume,
                        unit: function () {
                            return isMetric() ? "L" : "gal";
                        },
                        delta: function (diff) {
                            return {
                                n: toVolume(diff),
                                unit: isMetric() ? " L" : " gal",
                                dec: 1,
                            };
                        },
                    },
                };
                // The keys whose display changes with the unit toggle.
                var UNIT_KEYS = Object.keys(FORMATS).filter(function (key) {
                    return FORMATS[key].to !== same;
                });

                // ---------- live stats: count-ups ----------
                // A count-up owns its element's text until the last frame, so anything
                // repainting that element behind its back is undone by the next one.
                // The unit toggle is exactly that, and the frame that wins writes the
                // OLD unit's magnitude under the NEW unit's suffix. So every pending
                // frame is parked here, and a repaint cancels the loop that would
                // overwrite it.
                var pending = new WeakMap();
                function cancelAnim(el) {
                    var h = pending.get(el);
                    if (h) {
                        cancelAnimationFrame(h);
                        pending.delete(el);
                    }
                }
                // Counts from "from" (0 on first paint, the previous value on a live
                // update) to "target", 1.3 s ease-out.
                function animate(el, target, from) {
                    from = from || 0;
                    cancelAnim(el);
                    if (reduceMotion) {
                        el.textContent = fmtInt(target);
                        return;
                    }
                    var dur = 1300,
                        start = null;
                    function step(ts) {
                        if (start === null) start = ts;
                        var p = Math.min((ts - start) / dur, 1);
                        var e = 1 - Math.pow(1 - p, 3);
                        el.textContent = fmtInt(from + (target - from) * e);
                        if (p < 1) pending.set(el, requestAnimationFrame(step));
                        else pending.delete(el);
                    }
                    pending.set(el, requestAnimationFrame(step));
                }
                // Re-triggered on every change so a second change is noticed too.
                function flash(el) {
                    var host = el.closest(".nm-stat-v") || el;
                    host.classList.remove("nm-flash");
                    void host.offsetWidth;
                    host.classList.add("nm-flash");
                }
                function statEls(attr, key) {
                    return document.querySelectorAll("[" + attr + '="' + key + '"]');
                }
                function paintUnit(key) {
                    var c = FORMATS[key];
                    if (!c.unit) return;
                    statEls("data-stat-unit", key).forEach(function (el) {
                        el.textContent = c.unit();
                    });
                }
                // "quiet" repaints the tag without replaying the pop - used when the
                // unit changed but the underlying figure did not.
                function showDelta(key, diff, quiet) {
                    var c = FORMATS[key];
                    if (!c.delta) return;
                    statEls("data-delta", key).forEach(function (tag) {
                        var d = c.delta(diff, tag);
                        var scale = Math.pow(10, d.dec);
                        var n = Math.round(d.n * scale) / scale;
                        tag.classList.toggle("down", n < 0);
                        // Nothing changed means nothing to say: an empty tag rather
                        // than a "+-0" placeholder on every card while the page is
                        // still, so the eye lands only on figures that moved.
                        if (!n) {
                            tag.textContent = "";
                            tag.hidden = true;
                            return;
                        }
                        tag.textContent =
                            (n > 0 ? "+" : "\u2212") + fmtDec(Math.abs(n), d.dec) + d.unit;
                        tag.hidden = false;
                        if (quiet) return;
                        tag.classList.remove("pop");
                        void tag.offsetWidth;
                        tag.classList.add("pop");
                    });
                }

                // "prev" is the last stats object painted, or null on first load.
                // Unchanged figures are left alone so the page is still while nothing
                // happens; changed ones count from old to new and flash.
                function setStats(stats, prev, base) {
                    Object.keys(FORMATS).forEach(function (key) {
                        var c = FORMATS[key];
                        var v = stats[key];
                        if (typeof v !== "number") {
                            // An older public_landing_stats() without this key (the DB
                            // can lag the app on a deploy): hide the card rather than
                            // show NaN.
                            statEls("data-stat-card", key).forEach(function (card) {
                                card.hidden = true;
                            });
                            return;
                        }
                        var before = prev ? prev[key] : null;
                        if (prev && before === v) return;
                        statEls("data-stat", key).forEach(function (el) {
                            animate(
                                el,
                                c.to(v),
                                typeof before === "number" ? c.to(before) : 0,
                            );
                            if (prev) flash(el);
                        });
                        paintUnit(key);
                        if (base) showDelta(key, v - base[key]);
                    });
                    // The "Live" nav badge counts food logs alone, and it is on the nav
                    // of every page - so public/site.js owns it site-wide rather than
                    // this script, which only ships on the landing page. Handing over
                    // the figures already fetched here keeps this page on one poll
                    // instead of two, and passing our own page-load baseline alongside
                    // them keeps the badge showing exactly what the delta tag on the
                    // food-logs card shows.
                    document.dispatchEvent(
                        new CustomEvent("live-stats", {
                            detail: { stats: stats, base: base },
                        }),
                    );
                }

                // ---------- live stats: world map ----------
                var SVGNS = "http://www.w3.org/2000/svg";
                // UTC-equivalent zones all resolve to the map center (lon 0, lat 0 -
                // open ocean), so plotting them drops a bogus dot in the middle of the
                // Atlantic. gen-map-data.ts parks every one of these on null island.
                var UTC_TZS = {
                    UTC: 1,
                    "Etc/UTC": 1,
                    "Etc/GMT": 1,
                    GMT: 1,
                    "Etc/Greenwich": 1,
                };
                // [halo, core] radius per level 1..5. Radii step by roughly sqrt(2) in area
                // terms rather than linearly, because a circle is read by its area:
                // doubling the radius would look like four times the share.
                var TZ_RADII = [
                    [5.5, 2.0],
                    [7.0, 2.5],
                    [9.0, 3.2],
                    [11.5, 3.9],
                    [14.5, 4.7],
                ];
                var tip = document.querySelector(".nm-tz-tip");
                var tipName = tip && tip.querySelector(".nm-tz-tip-n");
                var tipShare = tip && tip.querySelector(".nm-tz-tip-s");
                // "{share} of accounts", in the page's language — the sentence is
                // copy and rides in on the markup, this script holds none.
                var SHARE_PATTERN = tip
                    ? tip.getAttribute("data-share-pattern") || ""
                    : "";
                var tipOn = null;
                var tipShownAt = 0;
                var fmtPct = null;
                try {
                    fmtPct = new Intl.NumberFormat(NUM_LOCALE, { style: "percent" });
                } catch (e) {
                    fmtPct = null;
                }
                // The API rounds every share to whole percent and buckets the whole
                // long tail into 0, which reads as "under 1%" rather than pinpointing
                // the zones holding a single person — see timezoneShares() in
                // src/supabase.ts. The "<" is punctuation, not a word, so it needs no
                // translation; the number beside it is formatted by the browser.
                function shareLine(share) {
                    if (!SHARE_PATTERN) return "";
                    var pct = fmtPct
                        ? fmtPct.format((share > 0 ? share : 1) / 100)
                        : (share > 0 ? share : 1) + "%";
                    return SHARE_PATTERN.replace(
                        "{share}",
                        share > 0 ? pct : "<" + pct,
                    );
                }
                function showTip(core) {
                    if (!tip) return;
                    if (tipOn && tipOn !== core) tipOn.classList.remove("is-on");
                    tipShownAt = Date.now();
                    tipOn = core;
                    core.classList.add("is-on");
                    if (tipName)
                        tipName.textContent = (
                            core.getAttribute("data-tz") || ""
                        ).replace(/_/g, " ");
                    if (tipShare) {
                        var raw = core.getAttribute("data-share");
                        var line = raw === null ? "" : shareLine(Number(raw));
                        tipShare.textContent = line;
                        tipShare.hidden = !line;
                    }
                    // Percentages of the 1000x440 viewBox (map-data.json projects into
                    // 1000x500, but nothing but Antarctica sits below 440, so the box is
                    // cropped like the design's), so the tip tracks the dot at any size.
                    var cx = Number(core.getAttribute("cx"));
                    var cy = Number(core.getAttribute("cy"));
                    var r = Number(core.getAttribute("r"));
                    tip.style.left = cx / 10 + "%";
                    tip.style.top = ((cy - r) / 440) * 100 + "%";
                    tip.hidden = false;
                    // The tip is centred on its dot, so on Auckland or Fiji half of
                    // it hung past the card's edge and was clipped. Once it has a
                    // width, slide it back inside the map by however much it
                    // overhangs; the transform keeps centring it on the dot otherwise.
                    var map = tip.parentNode;
                    if (map && map.getBoundingClientRect) {
                        var box = map.getBoundingClientRect();
                        var half = tip.offsetWidth / 2;
                        var x = (cx / 1000) * box.width;
                        var min = half + 4;
                        var max = box.width - half - 4;
                        if (x < min || x > max) {
                            tip.style.left =
                                Math.max(min, Math.min(max, x)) + "px";
                        }
                    }
                }
                function hideTip() {
                    if (!tip) return;
                    if (tipOn) tipOn.classList.remove("is-on");
                    tipOn = null;
                    tip.hidden = true;
                }
                // Expect this to render sparsely for a while: the 2026-08-15
                // nullable_profile_timezone migration reset every profile's timezone to
                // NULL (see #99), and /api/stats only counts profiles that have set one
                // since - so the map fills back in as people call set_timezone.
                function buildMap(mapData, tzLevels, tzShares) {
                    var svg = document.getElementById("world-svg");
                    if (!svg || !mapData) return;
                    // The svg is a role="group" (not "img", whose children are
                    // presentational) so each focusable timezone dot keeps its own
                    // accessible name; the ~1,000 decorative land dots are one
                    // hidden group so they never enter the tree.
                    var land = document.createElementNS(SVGNS, "g");
                    land.setAttribute("aria-hidden", "true");
                    mapData.land.forEach(function (p) {
                        var c = document.createElementNS(SVGNS, "circle");
                        c.setAttribute("cx", p[0]);
                        c.setAttribute("cy", p[1]);
                        c.setAttribute("r", "2.5");
                        c.setAttribute("class", "nm-land");
                        land.appendChild(c);
                    });
                    svg.appendChild(land);
                    function sizeDot(dot, level) {
                        var r = TZ_RADII[level - 1];
                        dot.halo.setAttribute("r", r[0]);
                        dot.core.setAttribute("r", r[1]);
                        dot.level = level;
                    }
                    // The dot's accessible name carries whatever the tooltip shows,
                    // so the share is not sighted-only. A database that predates
                    // timezone_counts serves no shares at all, and then the name is
                    // just the zone and the tooltip's second line stays hidden.
                    function nameDot(dot, share) {
                        var tz = (dot.core.getAttribute("data-tz") || "").replace(
                            /_/g,
                            " ",
                        );
                        var line = typeof share === "number" ? shareLine(share) : "";
                        if (typeof share === "number")
                            dot.core.setAttribute("data-share", String(share));
                        dot.core.setAttribute(
                            "aria-label",
                            line ? tz + ", " + line : tz,
                        );
                        dot.share = share;
                    }
                    var seen = {};
                    var plotted = 0;
                    var halos = document.createDocumentFragment();
                    var cores = document.createDocumentFragment();
                    Object.keys(tzLevels || {}).forEach(function (tz) {
                        if (UTC_TZS[tz]) return;
                        var pt = mapData.tz[tz];
                        if (!pt) return;
                        var level = Math.min(
                            TZ_RADII.length,
                            Math.max(1, Math.round(tzLevels[tz]) || 1),
                        );
                        var share = tzShares ? tzShares[tz] : undefined;
                        if (typeof share !== "number" || !isFinite(share))
                            share = undefined;
                        // Alias spellings (Europe/Kiev vs Europe/Kyiv) project to the
                        // same coordinates and so share one dot. Keep the larger level
                        // and the larger share rather than whichever name came first —
                        // summing them would double-count a zone the API already
                        // counted once under each spelling.
                        var k = pt[0] + "," + pt[1];
                        if (seen[k]) {
                            if (level > seen[k].level) sizeDot(seen[k], level);
                            if (
                                share !== undefined &&
                                (seen[k].share === undefined ||
                                    share > seen[k].share)
                            )
                                nameDot(seen[k], share);
                            return;
                        }
                        var halo = document.createElementNS(SVGNS, "circle");
                        halo.setAttribute("cx", pt[0]);
                        halo.setAttribute("cy", pt[1]);
                        halo.setAttribute("class", "nm-halo");
                        if (!reduceMotion)
                            halo.style.animationDelay = (plotted % 6) * 0.45 + "s";
                        var core = document.createElementNS(SVGNS, "circle");
                        core.setAttribute("cx", pt[0]);
                        core.setAttribute("cy", pt[1]);
                        core.setAttribute("class", "nm-tz");
                        core.setAttribute("data-tz", tz);
                        // Reachable by keyboard, and named for screen readers by the
                        // same text the tooltip shows. An aria-label rather than a
                        // <title>: browsers render <title> as a native tooltip too,
                        // which showed up as a second, grey copy under ours.
                        core.setAttribute("tabindex", "0");
                        core.setAttribute("role", "img");
                        var dot = { halo: halo, core: core, level: 0 };
                        sizeDot(dot, level);
                        nameDot(dot, share);
                        seen[k] = dot;
                        halos.appendChild(halo);
                        cores.appendChild(core);
                        plotted++;
                    });
                    // Halos first so no halo paints over a neighbouring core.
                    svg.appendChild(halos);
                    svg.appendChild(cores);
                    // Hover, focus and tap all show the tooltip; tapping the same dot
                    // again, leaving, blurring or Escape hide it.
                    svg.addEventListener("mouseover", function (e) {
                        var core = e.target.closest(".nm-tz");
                        if (core) showTip(core);
                    });
                    svg.addEventListener("mouseout", function (e) {
                        if (e.target.closest(".nm-tz")) hideTip();
                    });
                    svg.addEventListener("focusin", function (e) {
                        var core = e.target.closest(".nm-tz");
                        if (core) showTip(core);
                    });
                    svg.addEventListener("focusout", function (e) {
                        if (e.target.closest(".nm-tz")) hideTip();
                    });
                    // A tap arrives as mouseover, focusin, click in one gesture - the
                    // first two show the tip, so the click only counts as "tap again
                    // to dismiss" when the tip has been up for longer than a gesture.
                    svg.addEventListener("click", function (e) {
                        var core = e.target.closest(".nm-tz");
                        if (!core) return;
                        if (
                            tipOn === core &&
                            !tip.hidden &&
                            Date.now() - tipShownAt > 300
                        )
                            hideTip();
                        else showTip(core);
                    });
                    document.addEventListener("keydown", function (e) {
                        if (e.key === "Escape") hideTip();
                    });
                }

                // ---------- live stats: countdown + since-open ----------
                var POLL_MS = 5000;
                var POLL_S = POLL_MS / 1000;
                var RING_LEN = 37.7;
                var countdown = POLL_S;
                var cdEl = document.querySelector("[data-countdown]");
                var cdRing = document.querySelector("[data-countdown-ring]");
                function paintCountdown() {
                    if (cdEl) cdEl.textContent = fmtInt(countdown);
                    if (cdRing)
                        cdRing.style.strokeDashoffset = String(
                            RING_LEN * (1 - countdown / POLL_S),
                        );
                }
                var openedAt = Date.now();
                var sinceEl = document.querySelector("[data-since-open]");
                // The "s" / "m" suffixes are copy, and this script holds none: the
                // browser's own unit data writes them in the page's language ("35s",
                // "35 с", "35秒"). The bare-letter fallback only runs where Intl has
                // no unit style at all.
                var fmtSecs = null;
                var fmtMins = null;
                var fmtHours = null;
                try {
                    fmtSecs = new Intl.NumberFormat(NUM_LOCALE, {
                        style: "unit",
                        unit: "second",
                        unitDisplay: "narrow",
                    });
                    fmtMins = new Intl.NumberFormat(NUM_LOCALE, {
                        style: "unit",
                        unit: "minute",
                        unitDisplay: "narrow",
                    });
                    fmtHours = new Intl.NumberFormat(NUM_LOCALE, {
                        style: "unit",
                        unit: "hour",
                        unitDisplay: "narrow",
                    });
                } catch (e) {
                    fmtSecs = fmtMins = fmtHours = null;
                }
                // Two units at a time, coarsening as the tab stays open: seconds,
                // then minutes and seconds, then hours and minutes. Past an hour the
                // seconds are dropped rather than making a third segment — nobody
                // reads them at that scale, and the chip stops growing.
                function fmtSince(secs) {
                    var h = Math.floor(secs / 3600);
                    var m = Math.floor((secs % 3600) / 60);
                    var s = secs % 60;
                    if (fmtSecs && fmtMins && fmtHours)
                        return secs < 60
                            ? fmtSecs.format(secs)
                            : secs < 3600
                              ? fmtMins.format(m) + " " + fmtSecs.format(s)
                              : fmtHours.format(h) + " " + fmtMins.format(m);
                    return secs < 60
                        ? fmtInt(secs) + "s"
                        : secs < 3600
                          ? fmtInt(m) + "m " + fmtInt(s) + "s"
                          : fmtInt(h) + "h " + fmtInt(m) + "m";
                }
                function paintSince() {
                    if (!sinceEl) return;
                    var secs = Math.max(0, Math.round((Date.now() - openedAt) / 1000));
                    sinceEl.textContent = fmtSince(secs);
                }

                // ---------- live stats: load, then keep live ----------
                var lastStats = null;
                var baseStats = null;
                var pollTimer = null;
                // #facts-live is also what tells public/site.js that this page polls
                // /api/stats for itself (see the live-stats event above).
                var liveEl = document.getElementById("facts-live");

                var unitBtns = [].slice.call(document.querySelectorAll("[data-unit]"));
                function paintUnitToggle() {
                    unitBtns.forEach(function (b) {
                        b.setAttribute(
                            "aria-pressed",
                            b.getAttribute("data-unit") === unit ? "true" : "false",
                        );
                    });
                }
                // Repainted in place rather than through setStats: counting 512 up to
                // 1,129 would read as the figure changing, when all that changed is
                // the unit it is written in. Cancelling first is what makes the toggle
                // win over a count-up already in flight on the same card.
                function repaintUnits() {
                    UNIT_KEYS.forEach(function (key) {
                        paintUnit(key);
                        if (!lastStats) return;
                        var v = lastStats[key];
                        if (typeof v !== "number") return;
                        statEls("data-stat", key).forEach(function (el) {
                            cancelAnim(el);
                            el.textContent = fmtInt(FORMATS[key].to(v));
                        });
                        if (baseStats) showDelta(key, v - baseStats[key], true);
                    });
                }
                paintUnitToggle();
                repaintUnits();
                unitBtns.forEach(function (b) {
                    b.addEventListener("click", function () {
                        var next = b.getAttribute("data-unit");
                        if (next === unit) return;
                        unit = next;
                        try {
                            localStorage.setItem(UNIT_STORE, unit);
                        } catch (e) {}
                        paintUnitToggle();
                        repaintUnits();
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
                        .then(function () {
                            countdown = POLL_S;
                            paintCountdown();
                            schedule();
                        });
                }
                function schedule() {
                    if (pollTimer || document.hidden) return;
                    pollTimer = setTimeout(poll, POLL_MS);
                }
                // A background tab stops polling; coming back refetches at once so the
                // figures are never minutes behind.
                document.addEventListener("visibilitychange", function () {
                    if (document.hidden) {
                        clearTimeout(pollTimer);
                        pollTimer = null;
                    } else if (lastStats) {
                        poll();
                    }
                });
                if (liveEl) {
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
                            // The deltas are measured from this moment.
                            baseStats = stats;
                            buildMap(
                                res[1],
                                stats.timezone_levels,
                                stats.timezone_shares,
                            );
                            liveEl.classList.add("on");
                            paintCountdown();
                            setInterval(function () {
                                if (document.hidden) return;
                                countdown = countdown > 1 ? countdown - 1 : POLL_S;
                                paintCountdown();
                                paintSince();
                            }, 1000);
                            schedule();
                        })
                        .catch(function () {
                            // The countdown row goes too: nothing starts the interval
                            // on this path, so a visible "next in 5s" would sit frozen
                            // above an empty section forever.
                            var row = document.getElementById("stat-row");
                            var map = document.getElementById("map-block");
                            var meta = document.getElementById("live-meta");
                            if (row) row.hidden = true;
                            if (map) map.hidden = true;
                            if (meta) meta.hidden = true;
                        });
                }

                // ---------- latest Patreon posts ----------
                // #patreon-updates ships hidden and stays so unless /api/patreon-posts
                // returns at least one post (a self-hosted deploy with no Patreon
                // credentials gets [] forever). Cards are built from the <template>
                // the generator wrote, so the "read post" label is the page's own.
                var postsBlock = document.getElementById("patreon-updates");
                var postsGrid = document.getElementById("patreon-posts-grid");
                var postTpl = document.getElementById("patreon-post-tpl");
                if (postsBlock && postsGrid && postTpl) {
                    var POST_ICONS = ["fa-camera", "fa-receipt", "fa-square-poll-vertical"];
                    var POST_TINTS = ["nm-c-acc", "nm-c-cal", "nm-c-pro"];
                    fetch("/api/patreon-posts")
                        .then(function (r) {
                            return r.ok ? r.json() : [];
                        })
                        .then(function (posts) {
                            if (!posts || !posts.length) return;
                            posts.slice(0, 3).forEach(function (p, i) {
                                var card =
                                    postTpl.content.firstElementChild.cloneNode(true);
                                card.href = p.url;
                                var tile = card.querySelector("[data-post-tile]");
                                if (tile) tile.classList.add(POST_TINTS[i % 3]);
                                var icon = card.querySelector("[data-post-icon]");
                                if (icon) icon.className = "fa-solid " + POST_ICONS[i % 3];
                                var date = card.querySelector("[data-post-date]");
                                if (date) {
                                    var when = new Date(p.publishedAt);
                                    date.textContent = isNaN(when.getTime())
                                        ? ""
                                        : when.toLocaleDateString(NUM_LOCALE, {
                                              month: "short",
                                              day: "numeric",
                                          });
                                }
                                var title = card.querySelector("[data-post-title]");
                                if (title) title.textContent = p.title || "";
                                var preview = card.querySelector("[data-post-preview]");
                                if (preview) preview.textContent = p.preview || "";
                                postsGrid.appendChild(card);
                            });
                            postsBlock.hidden = false;
                        })
                        .catch(function () {});
                }
            })();`;

/** The number formatting the script itself uses (toLocaleString against
 *  <html lang>), so the static render and the replay agree on "1,059". */
function num(n: number, locale: SiteLocale): string {
    return Math.round(n).toLocaleString(HTML_LANG[locale]);
}

// A trusted-HTML field (FAQ answers, install steps, notes) can't call
// pathFor(locale, …) itself, so an in-prose link to another page of the
// site is written as href="/alternatives" data-link="alternatives" and
// rewritten here to the locale-correct path. Without it a translated page
// silently links to the English version (the exact bug the login page
// shipped once — see scripts/gen-legal.ts's localizeCrossLinks).
function localizeLinks(html: string, locale: SiteLocale): string {
    return html.replace(
        /href="\/(alternatives|tools|privacy|terms)" data-link="\1"/g,
        (_m, page: string) => `href="${pathFor(locale, "/" + page)}"`,
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

// -------------------------------------------------------------------- hero

// The barcode "photo" in the hero chat: the design's bar pattern, drawn
// once here as <rect>s. Odd entries are gaps.
const BARCODE_BARS = [
    3, 1, 1, 2, 1, 3, 1, 1, 2, 2, 1, 1, 3, 1, 2, 1, 1, 1, 3, 2, 1, 1, 2, 1, 1,
    3, 1, 2, 1, 1, 2, 3, 1, 1, 1, 2, 1, 3, 1, 1, 2, 1, 1, 2, 3, 1, 1,
];
const BARCODE_DIGITS = "5449000000996";

function barcodeSvg(): string {
    let x = 0;
    const rects: string[] = [];
    BARCODE_BARS.forEach((w, i) => {
        const at = x;
        x += w + (i % 2 ? 1 : 0.6);
        if (i % 2) return;
        rects.push(
            `<rect x="${Number(at.toFixed(1))}" y="0" width="${w}" height="40"></rect>`,
        );
    });
    return `<svg viewBox="0 0 120 40" aria-hidden="true">${rects.join("")}</svg>`;
}

type Totals = {
    kcal: number;
    pro: number;
    car: number;
    fat: number;
    water: number;
    sugar: number;
    caf: number;
};

/** The final state of the widget: every exchange's deltas summed. */
function sumExchanges(exchanges: HeroExchange[]): Totals {
    const t: Totals = {
        kcal: 0,
        pro: 0,
        car: 0,
        fat: 0,
        water: 0,
        sugar: 0,
        caf: 0,
    };
    for (const ex of exchanges) {
        for (const k of Object.keys(t) as (keyof Totals)[]) {
            t[k] += ex.add[k] ?? 0;
        }
    }
    return t;
}

// The widget's daily goals as drawn in the design. The script reads the bar
// goals back off data-goal and the ring's 2,000 is its own constant.
const WIDGET_GOALS = { kcal: 2000, pro: 160, car: 220, fat: 70 };

/** The in-chat summary widget. Rendered once, in its final state, after
 *  the last reply; the script clones it and repaints [data-w] / --deg /
 *  --w as the replay adds each exchange's nutrients. */
function renderWidget(doc: IndexDoc, totals: Totals, locale: SiteLocale) {
    const w = doc.hero.chat.widget;
    const pct = (v: number, goal: number) =>
        Math.min(100, Math.round((v / goal) * 100));
    const deg = Math.min(
        360,
        Math.round((totals.kcal / WIDGET_GOALS.kcal) * 360),
    );
    const bar = (
        key: "pro" | "car" | "fat",
        label: string,
        goal: number,
    ) => `                                    <div>
                                        <div class="nm-bar-l">
                                            <span>${esc(label)}</span>
                                            <b><span data-w="${key}">${num(totals[key], locale)}</span>/${goal} g</b>
                                        </div>
                                        <div class="nm-bar-t">
                                            <div
                                                class="nm-bar-f nm-c-${key}"
                                                data-bar="${key}"
                                                data-goal="${goal}"
                                                style="--w: ${pct(totals[key], goal)}%"
                                            ></div>
                                        </div>
                                    </div>`;
    const chip = (
        tint: string,
        label: string,
        key: "water" | "sugar" | "caf",
        unit: string,
    ) =>
        `                                <span class="nm-w-chip ${tint}"><span class="nm-w-chip-dot" aria-hidden="true"></span>${esc(label)} <span class="nm-w-chip-v"><span data-w="${key}">${num(totals[key], locale)}</span> ${unit}</span></span>`;
    return `                            <div class="nm-widget">
                                <div class="nm-w-head">
                                    <b>${esc(w.title)}</b><span>${esc(w.goal)}</span>
                                </div>
                                <div class="nm-w-body">
                                    <div class="nm-ring" data-ring style="--deg: ${deg}deg">
                                        <div class="nm-ring-in">
                                            <div>
                                                <div class="nm-ring-n" data-w="kcal">${num(totals.kcal, locale)}</div>
                                                <div class="nm-ring-u">${esc(w.kcalUnit)}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="nm-bars">
${bar("pro", w.protein, WIDGET_GOALS.pro)}
${bar("car", w.carbs, WIDGET_GOALS.car)}
${bar("fat", w.fat, WIDGET_GOALS.fat)}
                                    </div>
                                </div>
                                <div class="nm-w-chips">
${chip("nm-c-wat", w.water, "water", "ml")}
${chip("nm-c-sug", w.sugar, "sugar", "g")}
${chip("nm-c-caf", w.caffeine, "caf", "mg")}
                                </div>
                                <div class="nm-w-hint">${esc(w.hint)}</div>
                            </div>`;
}

/** One exchange of the hero thread, statically. The user / barcode bubble
 *  carries the deltas and clock the script replays from. */
function renderExchange(doc: IndexDoc, ex: HeroExchange): string {
    const data = ` data-add='${JSON.stringify(ex.add)}' data-clock="${attr(ex.clock)}"${ex.widget ? " data-widget" : ""}`;
    const user = ex.barcode
        ? `                            <div class="nm-msg nm-msg-barcode"${data}>
                                <div class="nm-barcode">
                                    ${barcodeSvg()}
                                    <span class="nm-barcode-digits">${BARCODE_DIGITS}</span>
                                </div>
                                <div class="nm-barcode-cap">${esc(doc.hero.chat.photoCaption)}</div>
                            </div>`
        : `                            <div class="nm-msg nm-msg-user"${data}>${esc(ex.userText ?? "")}</div>`;
    return `${user}
                            <div class="nm-msg nm-msg-ai">${esc(ex.aiText)}</div>`;
}

function renderHero(doc: IndexDoc, locale: SiteLocale): string {
    const hero = doc.hero;
    const exchanges = hero.chat.exchanges;
    const totals = sumExchanges(exchanges);
    const lastClock = exchanges.length
        ? exchanges[exchanges.length - 1]!.clock
        : "";
    return `            <section class="nm-section nm-hero" id="top" aria-labelledby="hero-title">
                <div>
                    <h1 class="nm-h1" id="hero-title">
                        ${esc(hero.titleBeforeEm)}<span class="nm-em">${esc(hero.titleEm)}<span class="nm-underline" aria-hidden="true"></span></span>${esc(hero.titleAfterEm)}
                    </h1>
                    <p class="nm-lead">${esc(hero.lead)}</p>
                    <div class="nm-hero-actions">
                        <a class="nm-btn nm-btn-primary" href="${hashPath(locale, "connect")}"
                            >${esc(hero.ctaPrimary)}
                            <i class="fa-solid fa-arrow-right" aria-hidden="true"></i
                        ></a>
                        <a class="nm-btn nm-btn-glass" href="${GITHUB}" ${EXT}>
                            <i class="fa-brands fa-github" aria-hidden="true"></i>
                            <span>${esc(hero.ctaGithub)}</span>
                            <span class="nm-stars"><i class="fa-solid fa-star" aria-hidden="true"></i><span data-gh-stars>—</span></span>
                        </a>
                    </div>
                </div>
                <div class="nm-hero-stage">
                    <div class="nm-chat-shell">
                        <div class="nm-chat">
                            <div class="nm-chat-head">
                                <span class="nm-chat-who">
                                    <span class="nm-avatar" aria-hidden="true">🍏</span>
                                    ${esc(hero.chat.status)}
                                </span>
                                <span class="nm-chat-tools">
                                    <span class="nm-chat-clock" data-chat-clock>${esc(lastClock)}</span>
                                    <button type="button" class="nm-round nm-chat-pause" data-chat-pause aria-pressed="false">
                                        <i class="fa-solid fa-pause" aria-hidden="true"></i>
                                        <span class="vh">${esc(hero.chat.pauseLabel)}</span>
                                    </button>
                                </span>
                            </div>
                            <div class="nm-chat-list" data-chat-list>
${exchanges.map((ex) => renderExchange(doc, ex)).join("\n")}
${renderWidget(doc, totals, locale)}
                            </div>
                        </div>
                    </div>
                    <a class="nm-more" href="${hashPath(locale, "examples")}"
                        >${esc(hero.moreExamples)}
                        <i class="fa-solid fa-arrow-down" aria-hidden="true"></i
                    ></a>
                </div>
            </section>`;
}

// ---------------------------------------------------------------- sections

const HOW_ICONS = ["fa-plug", "fa-comment-dots", "fa-chart-area"];
const HOW_TINTS = ["nm-c-acc", "nm-c-cal", "nm-c-pro"];

function renderHow(doc: IndexDoc): string {
    const cards = doc.how.steps
        .map(
            (
                s,
                i,
            ) => `                    <div class="nm-card ${HOW_TINTS[i] ?? "nm-c-acc"}">
                        <div class="nm-blob" aria-hidden="true"></div>
                        <div class="nm-card-top">
                            <span class="nm-tile" aria-hidden="true"><i class="fa-solid ${HOW_ICONS[i] ?? "fa-circle"}"></i></span>
                            <span class="nm-count">${esc(doc.how.counter.replace("{n}", String(i + 1)))}</span>
                        </div>
                        <div>
                            <h3>${esc(s.title)}</h3>
                            <p>${esc(s.body)}</p>
                        </div>
                    </div>`,
        )
        .join("\n");
    return `            <section class="nm-section" id="how" aria-labelledby="how-title" data-reveal>
                <div class="nm-head-row">
                    <div>
                        <p class="nm-eyebrow">${esc(doc.how.eyebrow)}</p>
                        <h2 class="nm-h2 nm-h2-narrow" id="how-title">${esc(doc.how.title)}</h2>
                    </div>
                    <p class="nm-sub">${esc(doc.how.sub)}</p>
                </div>
                <div class="nm-cards3" data-reveal="stagger">
${cards}
                </div>
            </section>`;
}

function renderConnect(doc: IndexDoc, locale: SiteLocale): string {
    const c = doc.connect;
    const steps = (list: string[]) =>
        list
            .map(
                (s) =>
                    `                                <li><span>${localizeLinks(s, locale)}</span></li>`,
            )
            .join("\n");
    return `            <section class="nm-section" id="connect" aria-labelledby="connect-title" data-reveal>
                <div class="nm-split">
                    <div>
                        <p class="nm-eyebrow">${esc(c.eyebrow)}</p>
                        <h2 class="nm-h2" id="connect-title">${esc(c.title)}</h2>
                        <p class="nm-sub">${esc(c.sub)}</p>
                        <div class="nm-endpoint">
                            <span class="nm-endpoint-url">${MCP_URL}</span>
                            <button
                                type="button"
                                class="copy-mini nm-copy"
                                data-copy="${MCP_URL}"
                                data-label="${attr(c.copyLabel)}"
                                data-copied-label="${attr(c.copiedLabel)}"
                                aria-label="${attr(c.copyAriaLabel)}"
                            >
                                <i class="fa-solid fa-copy" aria-hidden="true"></i>
                            </button>
                        </div>
                        <ul class="nm-checks">
${c.bullets.map((b) => `                            <li><i class="fa-solid fa-circle-check" aria-hidden="true"></i>${esc(b)}</li>`).join("\n")}
                        </ul>
                    </div>
                    <fieldset class="nm-panel nm-tabs">
                        <legend class="vh">${esc(c.tabsLabel)}</legend>
                        <input type="radio" name="itab" id="itab-claude" class="tab-input" checked />
                        <input type="radio" name="itab" id="itab-chatgpt" class="tab-input" />
                        <input type="radio" name="itab" id="itab-other" class="tab-input" />
                        <div class="nm-seg">
                            <label for="itab-claude" class="seg-claude"
                                ><i class="fa-brands fa-claude" aria-hidden="true"></i>
                                <span>Claude</span></label
                            >
                            <label for="itab-chatgpt" class="seg-chatgpt"
                                ><i class="fa-brands fa-openai" aria-hidden="true"></i>
                                <span>ChatGPT</span></label
                            >
                            <label for="itab-other" class="seg-other"
                                ><i class="fa-solid fa-terminal" aria-hidden="true"></i>
                                <span>${esc(c.otherTabLabel)}</span></label
                            >
                        </div>
                        <div class="nm-tab-panel panel-claude">
                            <ol class="nm-steps">
${steps(c.claude.steps)}
                            </ol>
                            <p class="nm-note">${esc(c.claude.note)}</p>
                        </div>
                        <div class="nm-tab-panel panel-chatgpt">
                            <ol class="nm-steps">
${steps(c.chatgpt.steps)}
                            </ol>
                            <p class="nm-note">${esc(c.chatgpt.note)}</p>
                        </div>
                        <div class="nm-tab-panel panel-other">
                            <!-- prettier-ignore -->
                            <pre class="nm-pre">{
  "mcpServers": {
    "nutrition": {
      "url": "${MCP_URL}"
    }
  }
}</pre>
                            <p>${localizeLinks(c.other.noteHtml, locale)}</p>
                        </div>
                    </fieldset>
                </div>
            </section>`;
}

const ONB_ICONS = [
    "fa-clock-four",
    "fa-bullseye",
    "fa-language",
    "fa-utensils",
];
const ONB_TINTS = ["nm-c-wat", "nm-c-pro", "nm-c-car", "nm-c-cal"];

function renderOnboarding(doc: IndexDoc, locale: SiteLocale): string {
    const o = doc.onboarding;
    // The example phrase is quoted in the locale's own marks („…“, 「…」),
    // not English curly quotes — punctuation is part of the translation.
    const [q1, q2] = QUOTES[locale];
    const cards = o.steps
        .map(
            (s, i) => `                    <div class="nm-onb-card">
                        <div class="nm-onb-step">
                            <span class="nm-tile nm-tile-sm ${ONB_TINTS[i] ?? "nm-c-acc"}" aria-hidden="true"><i class="fa-solid ${ONB_ICONS[i] ?? "fa-circle"}"></i></span>
                            ${esc(o.stepLabel.replace("{n}", String(i + 1)))}
                        </div>
                        <h3>${esc(s.title)}</h3>
                        <p>${esc(s.body)}</p>
                        <div class="nm-say"><span class="nm-say-l">${esc(o.justSay)}</span>${q1}${esc(s.say)}${q2}</div>
                    </div>`,
        )
        .join("\n");
    return `            <section class="nm-section" id="onboarding" aria-labelledby="onboarding-title" data-reveal>
                <div class="nm-head-row">
                    <h2 class="nm-h2 nm-h2-narrow" id="onboarding-title">${esc(o.title)}</h2>
                    <p class="nm-sub">${esc(o.sub)}</p>
                </div>
                <div class="nm-onb" data-reveal="stagger">
                    <div class="nm-rail" aria-hidden="true"></div>
${cards}
                </div>
            </section>`;
}

const EX_ICONS = ["fa-utensils", "fa-barcode", "fa-chart-area"];
const EX_TINTS = ["nm-c-cal", "nm-c-car", "nm-c-pro"];
// The trends mini-widget's sparkline, as drawn in the design.
const TREND_POINTS = "0,40 80,28 160,34 240,20 320,30 400,14 480,22";

function renderExamples(doc: IndexDoc): string {
    const e = doc.examples;
    const picks = e.slides
        .map(
            (
                s,
                i,
            ) => `                        <input type="radio" name="ex" id="ex-${i + 1}" class="tab-input"${i === 0 ? " checked" : ""} />
                        <label class="nm-ex-pick" for="ex-${i + 1}">
                            <span class="nm-ex-ic ${EX_TINTS[i] ?? "nm-c-acc"}" aria-hidden="true"><i class="fa-solid ${EX_ICONS[i] ?? "fa-circle"}"></i></span>
                            <span><b>${esc(s.title)}</b><small>${esc(s.sub)}</small></span>
                        </label>`,
        )
        .join("\n");
    const panels = e.slides
        .map((s, i) => {
            const widget = s.widget
                ? `
                            <div class="nm-trend">
                                <div class="nm-trend-head"><b>${esc(s.widget.title)}</b><span>${esc(s.widget.sub)}</span></div>
                                <div class="nm-trend-big"><span class="nm-trend-n">${esc(s.widget.big)}</span><span class="nm-trend-cap">${esc(s.widget.cap)}</span></div>
                                <svg viewBox="0 0 480 54" preserveAspectRatio="none" aria-hidden="true">
                                    <polyline class="nm-trend-line" points="${TREND_POINTS}"></polyline>
                                    <line class="nm-trend-goal" x1="0" y1="26" x2="480" y2="26"></line>
                                </svg>
                                <div class="nm-trend-foot"><span>${esc(s.widget.from)}</span><span>${esc(s.widget.goal)}</span><span>${esc(s.widget.today)}</span></div>
                            </div>`
                : "";
            return `                        <div class="nm-ex-panel${i === 0 ? " is-active" : ""}" data-ex="${i}">
                            <div class="nm-ex-q">${esc(s.userText)}</div>
                            <div class="nm-ex-a">${esc(s.aiText)}</div>${widget}
                        </div>`;
        })
        .join("\n");
    return `            <section class="nm-section nm-split nm-split-center" id="examples" aria-labelledby="examples-title" data-reveal>
                <div>
                    <h2 class="nm-h2" id="examples-title">${esc(e.title)}</h2>
                    <p class="nm-sub nm-ex-sub">${esc(e.sub)}</p>
                    <div class="nm-ex-picks" role="radiogroup" aria-label="${attr(e.pickerLabel)}">
${picks}
                    </div>
                </div>
                <div class="nm-ex-card" aria-live="polite">
                    <div class="nm-ex-head">
                        <span class="nm-chat-who">
                            <span class="nm-avatar" aria-hidden="true">🍏</span>
                            ${esc(e.status)}
                        </span>
                        <span class="nm-ex-nav">
                            <button type="button" class="nm-round" data-ex-dir="prev" aria-label="${attr(e.prevLabel)}"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button>
                            <button type="button" class="nm-round" data-ex-dir="next" aria-label="${attr(e.nextLabel)}"><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>
                        </span>
                    </div>
${panels}
                </div>
            </section>`;
}

type StatCard = {
    key: string;
    icon: string;
    tint: string;
    label: string;
    /** The unit the markup rests in (metric); the script repaints it. */
    unit: string;
    dark?: boolean;
    deltaUnit?: string;
};

function renderStatCard(s: StatCard): string {
    const deltaUnit = s.deltaUnit
        ? ` data-delta-unit="${attr(s.deltaUnit)}"`
        : "";
    return `                    <div class="nm-stat${s.dark ? " nm-stat-dark" : ""}" data-stat-card="${s.key}">
                        <div class="nm-stat-top">
                            <span class="nm-tile nm-tile-md ${s.tint}" aria-hidden="true"><i class="fa-solid ${s.icon}"></i></span>
                            <span class="nm-delta" data-delta="${s.key}"${deltaUnit} hidden></span>
                        </div>
                        <div>
                            <b class="nm-stat-v"><span data-stat="${s.key}">—</span><span class="nm-stat-u" data-stat-unit="${s.key}">${s.unit}</span></b>
                            <span class="nm-stat-l">${esc(s.label)}</span>
                        </div>
                    </div>`;
}

function renderLive(doc: IndexDoc): string {
    const l = doc.live;
    const cards: StatCard[] = [
        {
            key: "total_calories",
            icon: "fa-fire",
            tint: "nm-c-cal",
            label: l.cards.calories,
            unit: "kcal",
            dark: true,
        },
        {
            key: "food_logs",
            icon: "fa-utensils",
            tint: "nm-c-cal",
            label: l.cards.foodLogs,
            unit: "",
            deltaUnit: l.foodLogsUnit,
        },
        {
            key: "total_protein_g",
            icon: "fa-dumbbell",
            tint: "nm-c-pro",
            label: l.cards.protein,
            unit: "kg",
        },
        {
            key: "total_carbs_g",
            icon: "fa-wheat-awn",
            tint: "nm-c-car",
            label: l.cards.carbs,
            unit: "kg",
        },
        {
            key: "total_fat_g",
            // An oil bottle in a golden tint, not a droplet in the fat series'
            // pink - that read as a drop of blood next to the weight card.
            icon: "fa-bottle-droplet",
            tint: "nm-c-oil",
            label: l.cards.fat,
            unit: "kg",
        },
        {
            key: "weight_lost_g",
            icon: "fa-weight-scale",
            tint: "nm-c-fib",
            label: l.cards.weightLost,
            unit: "kg",
        },
        {
            key: "total_water_ml",
            icon: "fa-glass-water",
            tint: "nm-c-wat",
            label: l.cards.water,
            unit: "L",
        },
    ];
    return `            <section class="nm-section" id="live" aria-labelledby="live-title" data-reveal>
                <div class="nm-head-row nm-live-head">
                    <div>
                        <p class="nm-eyebrow nm-live-eyebrow">
                            <span class="nm-pulse-dot" aria-hidden="true"></span>${esc(l.eyebrow)}
                        </p>
                        <h2 class="nm-h2" id="live-title">${esc(l.title)}</h2>
                        <p class="nm-sub">${esc(l.sub)}</p>
                    </div>
                    <div class="nm-units" role="group" aria-label="${attr(l.unitGroupLabel)}">
                        <button type="button" data-unit="kg" aria-pressed="true">${esc(l.unitMetricLabel)}</button>
                        <button type="button" data-unit="lb" aria-pressed="false">${esc(l.unitImperialLabel)}</button>
                    </div>
                </div>
                <div class="nm-live-meta" id="live-meta">
                    <span id="facts-live" class="nm-refresh">
                        <svg class="nm-refresh-ring" viewBox="0 0 16 16" aria-hidden="true">
                            <circle class="nm-refresh-track" cx="8" cy="8" r="6"></circle>
                            <circle class="nm-refresh-arc" cx="8" cy="8" r="6" transform="rotate(-90 8 8)" data-countdown-ring></circle>
                        </svg>
                        <span>${esc(l.refreshBefore)}<b data-countdown>5</b>${esc(l.refreshAfter)}</span>
                    </span>
                    <span class="nm-since"><i class="fa-solid fa-arrow-trend-up" aria-hidden="true"></i>${esc(l.sinceOpenLabel)} · <span data-since-open>0s</span></span>
                </div>
                <div class="nm-stats" id="stat-row" data-reveal="stagger">
${cards.map(renderStatCard).join("\n")}
                </div>
                <div class="nm-map-card" id="map-block">
                    <div class="nm-map-head">
                        <span class="nm-tz-chip"><i class="fa-solid fa-earth-americas" aria-hidden="true"></i><b data-stat="timezones">—</b>${esc(l.timezonesAfter)}</span>
                        <span class="nm-map-note">${esc(l.mapNote)}</span>
                    </div>
                    <div class="nm-map">
                        <svg
                            id="world-svg"
                            viewBox="0 0 1000 440"
                            preserveAspectRatio="xMidYMid meet"
                            role="group"
                            aria-label="${attr(l.mapAriaLabel)}"
                        ></svg>
                        <div
                            class="nm-tz-tip"
                            role="tooltip"
                            data-share-pattern="${attr(l.mapShare)}"
                            hidden
                        >
                            <span class="nm-tz-tip-n"></span
                            ><span class="nm-tz-tip-s" hidden></span>
                        </div>
                    </div>
                </div>
            </section>`;
}

function renderSupport(doc: IndexDoc): string {
    const s = doc.support;
    return `            <section class="nm-section" id="support" aria-labelledby="support-title" data-reveal>
                <div class="nm-support-grid">
                    <div class="nm-card-big">
                        <p class="nm-eyebrow">${esc(s.eyebrow)}</p>
                        <h2 class="nm-h2 nm-h2-sm" id="support-title">${esc(s.title)}</h2>
                        <p class="nm-sub">${esc(s.sub)}</p>
                        <ul class="nm-checks">
${s.bullets.map((b) => `                            <li><i class="fa-solid fa-circle-check" aria-hidden="true"></i>${esc(b)}</li>`).join("\n")}
                        </ul>
                    </div>
                    <div class="nm-card-big nm-card-dark nm-c-acc">
                        <div class="nm-blob nm-blob-br" aria-hidden="true"></div>
                        <p class="nm-eyebrow">${esc(s.patreon.eyebrow)}</p>
                        <h3>${esc(s.patreon.title)}</h3>
                        <p class="nm-sub">${esc(s.patreon.sub)}</p>
                        <div class="nm-actions">
                            <a class="nm-btn nm-btn-primary nm-btn-md" href="${PATREON}" ${EXT}>
                                <i class="fa-brands fa-patreon" aria-hidden="true"></i>
                                ${esc(s.patreon.cta)}
                            </a>
                            <a class="nm-btn nm-btn-ghost nm-btn-md" href="${GITHUB}" ${EXT}>
                                <i class="fa-brands fa-github" aria-hidden="true"></i>
                                <span>${esc(s.patreon.starCta)}</span>
                                <span class="nm-stars"><i class="fa-solid fa-star" aria-hidden="true"></i><span data-gh-stars>—</span></span>
                            </a>
                        </div>
                    </div>
                </div>
                <div class="patreon-updates" id="patreon-updates" hidden>
                    <div class="nm-posts-head">
                        <h3><i class="fa-brands fa-patreon" aria-hidden="true"></i>${esc(s.postsTitle)}</h3>
                        <a class="nm-link-acc" href="${PATREON}" ${EXT}
                            >${esc(s.postsAll)}
                            <i class="fa-solid fa-arrow-right" aria-hidden="true"></i
                        ></a>
                    </div>
                    <div class="nm-posts" id="patreon-posts-grid"></div>
                    <template id="patreon-post-tpl">
                        <a class="nm-post" ${EXT}>
                            <span class="nm-post-top">
                                <span class="nm-tile nm-tile-36" data-post-tile aria-hidden="true"><i data-post-icon></i></span>
                                <span class="nm-post-date" data-post-date></span>
                            </span>
                            <b data-post-title></b>
                            <span class="nm-post-preview" data-post-preview></span>
                            <span class="vh">${esc(s.postLinkLabel)}</span>
                        </a>
                    </template>
                </div>
            </section>`;
}

function renderContact(doc: IndexDoc): string {
    const c = doc.contact;
    const row = (
        href: string,
        tint: string,
        icon: string,
        card: { title: string; sub: string },
        external: boolean,
    ) => `                        <a class="nm-row-link" href="${href}"${external ? " " + EXT : ""}>
                            <span class="nm-tile nm-tile-lg ${tint}" aria-hidden="true"><i class="${icon}"></i></span>
                            <span><b>${esc(card.title)}</b><small>${esc(card.sub)}</small></span>
                            <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
                        </a>`;
    return `            <section class="nm-section" id="contact" aria-labelledby="contact-title" data-reveal>
                <div class="nm-contact nm-c-acc">
                    <div class="nm-blob nm-blob-tl" aria-hidden="true"></div>
                    <div class="nm-contact-l">
                        <p class="nm-eyebrow">${esc(c.eyebrow)}</p>
                        <h2 class="nm-h2" id="contact-title">${esc(c.title)}</h2>
                        <p class="nm-sub">${esc(c.sub)}</p>
                        <a class="nm-email" href="mailto:${EMAIL}" aria-label="${attr(c.emailAriaLabel)}">
                            <span class="nm-email-addr">${EMAIL}</span>
                            <span class="nm-email-arrow" aria-hidden="true"><i class="fa-solid fa-arrow-right"></i></span>
                        </a>
                    </div>
                    <div class="nm-contact-r">
${row("mailto:" + EMAIL, "nm-c-acc", "fa-solid fa-envelope", c.cards.email, false)}
${row(GITHUB + "/issues", "nm-c-pro", "fa-brands fa-github", c.cards.issues, true)}
${row(PATREON, "nm-c-cal", "fa-brands fa-patreon", c.cards.patreon, true)}
                    </div>
                </div>
            </section>`;
}

const FAQ_CATEGORIES = [
    "all",
    "basics",
    "clients",
    "tracking",
    "data",
] as const;

function renderFaq(doc: IndexDoc, locale: SiteLocale): string {
    const f = doc.faqSection;
    const chips = FAQ_CATEGORIES.map(
        (
            cat,
            i,
        ) => `                        <input type="radio" name="faqcat" id="faqcat-${cat}" class="tab-input"${i === 0 ? " checked" : ""} />
                        <label class="nm-faq-chip" for="faqcat-${cat}">${esc(f.categories[cat])}</label>`,
    ).join("\n");
    const rows = doc.faq
        .map(
            (
                entry,
                i,
            ) => `                    <details class="nm-faq-row" data-cat="${entry.category}">
                        <summary>
                            <span class="nm-faq-n">${String(i + 1).padStart(2, "0")}</span>
                            <span class="nm-faq-q">${esc(entry.question)} <span class="nm-faq-cat">${esc(f.categories[entry.category])}</span></span>
                            <span class="nm-faq-ic" aria-hidden="true"><i class="fa-solid fa-plus"></i></span>
                        </summary>
                        <p>${localizeLinks(entry.visibleHtml, locale)}</p>
                    </details>`,
        )
        .join("\n");
    return `            <section class="nm-section nm-faq" id="faq" aria-labelledby="faq-title" data-reveal>
                <div class="nm-faq-side">
                    <p class="nm-eyebrow">${esc(f.eyebrow)}</p>
                    <h2 class="nm-h2" id="faq-title">${esc(f.title)}</h2>
                    <p class="nm-sub">
                        ${esc(f.subBefore)}<a href="${hashPath(locale, "contact")}">${esc(f.subLink)}</a>${esc(f.subAfter)}
                    </p>
                    <div class="nm-faq-cats" role="radiogroup" aria-label="${attr(f.categoriesLabel)}">
${chips}
                    </div>
                </div>
                <div class="nm-faq-list">
${rows}
                </div>
            </section>`;
}

function renderCta(doc: IndexDoc, locale: SiteLocale): string {
    const c = doc.cta;
    return `            <section class="nm-section nm-cta-sec" aria-labelledby="cta-title" data-reveal>
                <div class="nm-cta-band">
                    <div class="nm-blob nm-blob-bl nm-c-car" aria-hidden="true"></div>
                    <div class="nm-blob nm-blob-tr nm-c-pro" aria-hidden="true"></div>
                    <h2 id="cta-title">${esc(c.title)}</h2>
                    <p>${esc(c.sub)}</p>
                    <div class="nm-cta-actions">
                        <a class="nm-btn nm-btn-primary nm-btn-lg" href="${hashPath(locale, "connect")}">${esc(c.primary)}</a>
                        <a class="nm-btn nm-btn-ghost nm-btn-lg" href="${GITHUB}" ${EXT}>
                            <i class="fa-brands fa-github" aria-hidden="true"></i>
                            <span>${esc(c.secondary)}</span>
                            <span class="nm-stars"><i class="fa-solid fa-star" aria-hidden="true"></i><span data-gh-stars>—</span></span>
                        </a>
                    </div>
                </div>
            </section>`;
}

// -------------------------------------------------------------------- page

export function renderDoc(doc: IndexDoc, locale: SiteLocale): string {
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

    return `<!doctype html>
<html lang="${HTML_LANG[locale]}">
    <head>
        <title>
            ${title}
        </title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="utf-8" />
        <meta name="description" content="${attr(doc.metaDescription)}" />
        <meta name="keywords" content="${attr(doc.keywords)}" />
        <meta name="robots" content="index,follow,max-image-preview:large" />
        <meta property="og:title" content="${attr(doc.ogTitle ?? doc.title)}" />
        <meta property="og:description" content="${attr(doc.ogDescription)}" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="${url}" />
        <meta property="og:image" content="${SITE}/og.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="${SITE}/og.png" />
        <meta name="twitter:title" content="${attr(doc.ogTitle ?? doc.title)}" />
        <meta name="twitter:description" content="${attr(doc.twitterDescription ?? doc.ogDescription)}" />
${localeHead(locale, suffix)}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#f7f7f9" />
${jsonLd(softwareAppSchema)}
${jsonLd(faqSchema)}
${HEAD_ASSETS}
    </head>
    <body class="landing">
${generatedBanner("scripts/gen-index.ts")}
${THEME_PREPAINT}

        <!-- The three colour blobs behind the hero. -->
        <div class="nm-bg" aria-hidden="true">
            <div class="nm-bg-blob nm-bg-1"></div>
            <div class="nm-bg-blob nm-bg-2"></div>
            <div class="nm-bg-blob nm-bg-3"></div>
            <div class="nm-bg-fade"></div>
        </div>

${nav(locale, suffix)}

        <main id="main">
${renderHero(doc, locale)}
${
    notice
        ? `
            <div class="nm-section nm-notice-band">
${notice}
            </div>
`
        : ""
}
${renderHow(doc)}

${renderConnect(doc, locale)}

${renderOnboarding(doc, locale)}

${renderExamples(doc)}

${renderLive(doc)}

${renderSupport(doc)}

${renderContact(doc)}

${renderFaq(doc, locale)}

${renderCta(doc, locale)}
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
