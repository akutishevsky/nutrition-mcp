/* nutrition-mcp.com — shared site behaviour.
   Loaded by every public page. Everything here degrades: with no script the
   pages are fully readable, the menu is reachable through the footer, and
   nothing is hidden (reveals only engage once html.js is set below). */
(function () {
    "use strict";
    var doc = document;
    var root = doc.documentElement;
    var body = doc.body;
    root.classList.add("js");

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

    /* ---------- theme ---------- */
    // Three modes. "system" is the default and is stored as the ABSENCE of
    // a key, not as the string: a visitor who has never touched the control
    // and one who picked System back out of dark are in the same state, and
    // it is what THEME_PREPAINT (in the page head) already reads. The other
    // two stamp data-theme on <body>, which every dark rule keys off and
    // which the pre-paint script re-applies before first paint next time.
    var THEME_KEY = "theme";
    // The selected MODE ("system" / "light" / "dark") is read back off <body>,
    // never out of localStorage: setTheme() stamps the attribute even when the
    // write throws (Safari private browsing, site data blocked), so storage is
    // the one source that can disagree with what the visitor is looking at.
    // Absence of the attribute is System — the same encoding the key uses, and
    // what THEME_PREPAINT leaves behind when there is nothing stored.
    function selectedMode() {
        return body.getAttribute("data-theme") || "system";
    }
    // Effective theme = explicit override on <body>, else the OS setting.
    function effectiveTheme() {
        return (
            body.getAttribute("data-theme") ||
            (darkQuery.matches ? "dark" : "light")
        );
    }
    var metaTheme = doc.querySelector('meta[name="theme-color"]');
    function syncTheme() {
        var dark = effectiveTheme() === "dark";
        body.classList.toggle("is-dark", dark);
        if (metaTheme)
            // THEME_COLOR_DARK / THEME_COLOR_LIGHT in scripts/site-partials.ts
            // (the --bg token in each theme).
            metaTheme.setAttribute("content", dark ? "#0b0d12" : "#f7f7f9");
        var mode = selectedMode();
        doc.querySelectorAll("[data-theme-set]").forEach(function (btn) {
            btn.setAttribute(
                "aria-pressed",
                btn.getAttribute("data-theme-set") === mode ? "true" : "false",
            );
        });
    }
    function setTheme(mode) {
        try {
            if (mode === "system") localStorage.removeItem(THEME_KEY);
            else localStorage.setItem(THEME_KEY, mode);
        } catch (e) {}
        if (mode === "system") body.removeAttribute("data-theme");
        else body.setAttribute("data-theme", mode);
        syncTheme();
    }
    doc.querySelectorAll("[data-theme-set]").forEach(function (btn) {
        btn.addEventListener("click", function () {
            setTheme(btn.getAttribute("data-theme-set"));
        });
    });
    // Only meaningful in System mode — with an override on <body> the OS
    // flipping changes nothing on the page.
    darkQuery.addEventListener("change", function () {
        if (!body.getAttribute("data-theme")) syncTheme();
    });
    syncTheme();

    /* ---------- consent ---------- */
    // The analytics loader itself is the inline <script data-analytics> in
    // the page head (analyticsHead() in scripts/site-partials.ts): it reads
    // the stored choice, stamps data-consent on <html> ("granted", "denied"
    // or "ask" — "ask" is what shows the banner, in CSS) and exposes
    // window.nmConsent. This block is only the UI: the banner's two buttons,
    // the footer's "Cookie settings" button that reopens it, persisting a
    // new choice, and deleting the analytics cookies whenever the effective
    // choice is denied. No nmConsent means no loader on this page (the dev
    // deploy, the login page, a depersonalized fork), so the controls hide.
    function initConsent() {
        var nm = window.nmConsent;
        var openers = [].slice.call(
            doc.querySelectorAll("[data-consent-open]"),
        );
        var banners = [].slice.call(doc.querySelectorAll(".consent"));
        if (!nm) {
            openers.concat(banners).forEach(function (el) {
                el.hidden = true;
            });
            return;
        }
        // First-party cookies only: GA's _ga / _ga_<id> and Clarity's
        // _clck / _clsk. They may have been set on any parent domain, so try
        // host-only plus every suffix of the hostname down to the last two
        // labels; the browser silently ignores the ones it can't match.
        function sweepCookies() {
            var names = [];
            (doc.cookie || "").split(";").forEach(function (part) {
                var n = part.split("=")[0].trim();
                if (
                    n === "_ga" ||
                    n.indexOf("_ga_") === 0 ||
                    n === "_clck" ||
                    n === "_clsk"
                )
                    names.push(n);
            });
            if (!names.length) return;
            var labels = location.hostname.split(".");
            var domains = [""];
            for (var i = 0; i <= labels.length - 2; i++)
                domains.push("; domain=" + labels.slice(i).join("."));
            names.forEach(function (n) {
                domains.forEach(function (dm) {
                    doc.cookie =
                        n +
                        "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/" +
                        dm;
                });
            });
        }
        // Set while the banner was reopened from the footer: who opened it
        // (focus goes back there) and the state to restore on Escape.
        var reopened = null;
        function closeReopened() {
            doc.removeEventListener("keydown", onEscape, true);
            root.removeAttribute("data-consent-reopen");
            var opener = reopened && reopened.opener;
            reopened = null;
            return opener;
        }
        function onEscape(e) {
            if (e.key !== "Escape" || !reopened) return;
            // Another layer on top gets the Escape first. This listener is
            // in the capture phase so it still sees an open disclosure: the
            // disclosures' own bubble-phase handler, added at init, would
            // otherwise run first and close it before this check.
            if (
                body.classList.contains("menu-open") ||
                doc.querySelector(".lang-switch[open]")
            )
                return;
            root.setAttribute("data-consent", reopened.prev);
            var opener = closeReopened();
            if (opener) opener.focus();
        }
        function setChoice(choice) {
            if (choice !== "granted" && choice !== "denied") return;
            try {
                localStorage.setItem(
                    nm.key,
                    JSON.stringify({ v: 1, choice: choice, at: Date.now() }),
                );
            } catch (e) {}
            root.setAttribute("data-consent", choice);
            var opener = closeReopened();
            if (choice === "granted") {
                nm.load();
            } else if (nm.isLoaded()) {
                // Withdrawal after the tags ran on this view: tell both to
                // stop, delete what they set, and reload so neither script
                // is left running in the page.
                if (typeof window.gtag === "function")
                    window.gtag("consent", "update", {
                        analytics_storage: "denied",
                    });
                if (window.clarity) {
                    window.clarity("consentv2", {
                        ad_Storage: "denied",
                        analytics_Storage: "denied",
                    });
                    window.clarity("consent", false);
                }
                sweepCookies();
                location.reload();
                return;
            } else {
                sweepCookies();
            }
            if (opener) opener.focus();
        }
        if (root.getAttribute("data-consent") === "denied") sweepCookies();
        doc.querySelectorAll("[data-consent-choice]").forEach(function (btn) {
            btn.addEventListener("click", function () {
                setChoice(btn.getAttribute("data-consent-choice"));
            });
        });
        openers.forEach(function (btn) {
            btn.addEventListener("click", function () {
                if (!reopened) {
                    reopened = {
                        opener: btn,
                        prev: root.getAttribute("data-consent") || "ask",
                    };
                    doc.addEventListener("keydown", onEscape, true);
                } else {
                    reopened.opener = btn;
                }
                // The strip normally sits at the top of the page; reopened
                // from the footer it docks to the bottom edge instead.
                root.setAttribute("data-consent-reopen", "");
                root.setAttribute("data-consent", "ask");
                var first = doc.querySelector(".consent [data-consent-choice]");
                if (first) first.focus();
            });
        });
    }
    try {
        initConsent();
    } catch (e) {}

    /* ---------- mobile menu ---------- */
    var menuBtn = doc.getElementById("menu-btn");
    var menu = doc.getElementById("site-menu");
    // The sticky header: left out of setInert() and measured by openMenu().
    var head = doc.getElementById("site-head");
    // The button's two accessible names come out of the markup, which the
    // generator wrote in this page's language. This one script is served to
    // all nine locales, so naming either state here would be English on
    // eight of them — which is exactly what it used to do, overwriting the
    // translated label with "Close menu" on the first tap. Read once, from
    // the pristine attribute: after openMenu() has run, aria-label holds
    // the CLOSE label, so re-reading it later captures the wrong string.
    var openMenuLabel = menuBtn && menuBtn.getAttribute("aria-label");
    var closeMenuLabel = menuBtn && menuBtn.getAttribute("data-close-label");
    function setMenuLabel(label) {
        if (menuBtn && label) menuBtn.setAttribute("aria-label", label);
    }
    var lastFocus = null;
    var FOCUSABLE =
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';
    function menuItems() {
        return Array.prototype.slice.call(menu.querySelectorAll(FOCUSABLE));
    }
    function setInert(on) {
        // Everything outside the header and the menu is taken out of the
        // tab order and the accessibility tree while the sheet is open.
        Array.prototype.forEach.call(body.children, function (el) {
            if (el === menu || el === head || el.tagName === "SCRIPT") return;
            if (on) el.setAttribute("inert", "");
            else el.removeAttribute("inert");
        });
    }
    function openMenu() {
        if (!menu || !menuBtn) return;
        lastFocus = doc.activeElement;
        menu.hidden = false;
        // Two frames so the transition runs from the hidden state.
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                menu.setAttribute("data-open", "true");
                // Focusable only once visible.
                var first = menuItems()[0];
                if (first) first.focus({ preventScroll: true });
            });
        });
        menuBtn.setAttribute("aria-expanded", "true");
        setMenuLabel(closeMenuLabel);
        body.classList.add("menu-open");
        // The sheet is fixed under the sticky header and pads its top for a
        // header at the viewport's top edge. menu-open takes the consent
        // banner out of the flow (styles.css), which lifts the header there
        // whenever the page is near the top; anywhere the header still sits
        // lower, the sheet pads by that much more so no row hides behind it.
        var top = head ? Math.max(0, head.getBoundingClientRect().top) : 0;
        menu.style.setProperty("--menu-top", Math.round(top) + "px");
        setInert(true);
        doc.addEventListener("keydown", onMenuKey);
    }
    function closeMenu(returnFocus) {
        if (!menu || !menuBtn) return;
        menu.removeAttribute("data-open");
        menuBtn.setAttribute("aria-expanded", "false");
        setMenuLabel(openMenuLabel);
        body.classList.remove("menu-open");
        setInert(false);
        doc.removeEventListener("keydown", onMenuKey);
        var delay = reduceMotion.matches ? 0 : 260;
        setTimeout(function () {
            if (!menu.hasAttribute("data-open")) menu.hidden = true;
        }, delay);
        if (returnFocus !== false && lastFocus && lastFocus.focus)
            lastFocus.focus({ preventScroll: true });
    }
    function onMenuKey(e) {
        if (e.key === "Escape") {
            e.preventDefault();
            closeMenu();
            return;
        }
        if (e.key !== "Tab") return;
        // Focus trap: the toggle button (in the header) plus the sheet's
        // own links form the loop.
        var items = [menuBtn].concat(menuItems());
        var i = items.indexOf(doc.activeElement);
        if (e.shiftKey && (i <= 0 || i === -1)) {
            e.preventDefault();
            items[items.length - 1].focus();
        } else if (!e.shiftKey && i === items.length - 1) {
            e.preventDefault();
            items[0].focus();
        }
    }
    if (menuBtn && menu) {
        menu.hidden = true;
        menuBtn.addEventListener("click", function () {
            if (menuBtn.getAttribute("aria-expanded") === "true") closeMenu();
            else openMenu();
        });
        // Following a link closes the sheet; same-page anchors then scroll.
        menu.addEventListener("click", function (e) {
            var a = e.target.closest("a");
            if (a) closeMenu(false);
        });
    }
    // Leaving the phone layout with the sheet open would strand the inert
    // flags, so close on the way out. "The phone layout" is wherever the
    // hamburger is showing: under 1060px (styles.css), or wider when the
    // nav does not fit its pill (html.nav-tight, fitNav below) — so this
    // asks the button rather than a fixed media query.
    function closeMenuIfWide() {
        if (
            menuBtn &&
            menuBtn.getAttribute("aria-expanded") === "true" &&
            getComputedStyle(menuBtn).display === "none"
        )
            closeMenu(false);
    }

    /* ---------- primary nav: fit check + sliding active pill ---------- */
    // The design shows the nav from 1060px, but translated labels run far
    // longer than the English ones ("Statystyki na żywo"), and the nav
    // scrolls sideways with its scrollbar hidden rather than wrap, which
    // would silently clip the last items. So whenever it overflows its
    // pill, html.nav-tight hands the page to the hamburger instead.
    // Removed before measuring, since with it set the nav is not displayed.
    var headNav = doc.querySelector(".head-nav");
    var navInd = headNav && headNav.querySelector(".nav-ind");
    // The ink pill under the active link: the scroll-spy's .active link on
    // the landing page, else the link marked aria-current="page". It is a
    // child of .head-nav (position: relative), so offsetLeft is already in
    // its coordinates — and it scrolls with the links if the nav ever does.
    function placeInd() {
        if (!headNav || !navInd) return;
        var a =
            headNav.querySelector("a.active") ||
            headNav.querySelector('a[aria-current="page"]');
        var shown = a && a.offsetWidth > 0;
        headNav.style.setProperty("--ind-x", (shown ? a.offsetLeft : 0) + "px");
        headNav.style.setProperty(
            "--ind-w",
            (shown ? a.offsetWidth : 0) + "px",
        );
        headNav.style.setProperty("--ind-o", shown ? "1" : "0");
        // The first placement jumps; only later moves slide.
        if (shown && !headNav.classList.contains("ind-ready"))
            requestAnimationFrame(function () {
                headNav.classList.add("ind-ready");
            });
    }
    function fitNav() {
        if (!headNav) return;
        root.classList.remove("nav-tight");
        if (
            getComputedStyle(headNav).display !== "none" &&
            headNav.scrollWidth > headNav.clientWidth + 1
        )
            root.classList.add("nav-tight");
        placeInd();
        closeMenuIfWide();
    }
    var fitQueued = false;
    function queueFit() {
        if (fitQueued) return;
        fitQueued = true;
        requestAnimationFrame(function () {
            fitQueued = false;
            fitNav();
        });
    }
    window.addEventListener("resize", queueFit);
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(queueFit);
    fitNav();

    /* ---------- scroll-spy for same-page sections ---------- */
    var spyLinks = Array.prototype.filter.call(
        doc.querySelectorAll(".head-nav a[href*='#']"),
        function (a) {
            var url = new URL(a.href, location.href);
            return url.pathname === location.pathname && url.hash.length > 1;
        },
    );
    var menuSpyLinks = Array.prototype.filter.call(
        doc.querySelectorAll(".menu-nav a[href*='#']"),
        function (a) {
            var url = new URL(a.href, location.href);
            return url.pathname === location.pathname && url.hash.length > 1;
        },
    );
    if (spyLinks.length && "IntersectionObserver" in window) {
        var byId = {};
        spyLinks.forEach(function (a) {
            byId[new URL(a.href, location.href).hash.slice(1)] = a;
        });
        // Track which sections cross the reading line; the active link is
        // the first of them in document order, or none at all — a section
        // that has scrolled away must not keep its link lit.
        var visible = {};
        var spy = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (en) {
                    visible[en.target.id] = en.isIntersecting;
                });
                var found = null;
                Object.keys(byId).forEach(function (id) {
                    if (!found && visible[id]) found = byId[id];
                });
                var foundHash = found
                    ? new URL(found.href, location.href).hash
                    : null;
                spyLinks.forEach(function (a) {
                    a.classList.toggle("active", a === found);
                });
                // The sheet's copies of the same links light up too.
                menuSpyLinks.forEach(function (a) {
                    a.classList.toggle(
                        "active",
                        !!foundHash &&
                            new URL(a.href, location.href).hash === foundHash,
                    );
                });
                placeInd();
            },
            { rootMargin: "-40% 0px -55% 0px", threshold: 0 },
        );
        Object.keys(byId).forEach(function (id) {
            var el = doc.getElementById(id);
            if (el) spy.observe(el);
        });
    }

    /* ---------- scroll reveals ---------- */
    var reveals = doc.querySelectorAll("[data-reveal]");
    if (reveals.length) {
        if (reduceMotion.matches || !("IntersectionObserver" in window)) {
            reveals.forEach(function (el) {
                el.classList.add("in");
            });
        } else {
            var io = new IntersectionObserver(
                function (entries) {
                    entries.forEach(function (en) {
                        if (!en.isIntersecting) return;
                        en.target.classList.add("in");
                        io.unobserve(en.target);
                    });
                },
                { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
            );
            reveals.forEach(function (el) {
                io.observe(el);
            });
        }
    }

    /* ---------- copy buttons ---------- */
    doc.querySelectorAll(".copy-mini").forEach(function (btn) {
        var icon = btn.querySelector("i");
        btn.addEventListener("click", function () {
            var text = btn.getAttribute("data-copy");
            function ok() {
                btn.classList.add("copied");
                if (icon) icon.className = "fa-solid fa-check";
                setTimeout(function () {
                    btn.classList.remove("copied");
                    if (icon) icon.className = "fa-solid fa-copy";
                }, 1500);
            }
            function fallback() {
                try {
                    var ta = doc.createElement("textarea");
                    ta.value = text;
                    ta.style.position = "absolute";
                    ta.style.left = "-9999px";
                    body.appendChild(ta);
                    ta.select();
                    doc.execCommand("copy");
                    body.removeChild(ta);
                    ok();
                } catch (e) {}
            }
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(ok, fallback);
            } else fallback();
        });
    });

    /* ---------- header disclosures (light-dismiss for the <details>) ---------- */
    // The language switcher (the theme control beside it is a plain
    // segmented button group, not a disclosure). Kept as a list so a
    // second disclosure only has to be added to the selector.
    var disclosures = [].slice.call(doc.querySelectorAll(".lang-switch"));
    if (disclosures.length) {
        doc.addEventListener("click", function (e) {
            disclosures.forEach(function (d) {
                if (d.open && !d.contains(e.target)) d.open = false;
            });
        });
        doc.addEventListener("keydown", function (e) {
            if (e.key !== "Escape") return;
            disclosures.forEach(function (d) {
                if (!d.open) return;
                d.open = false;
                d.querySelector("summary").focus();
            });
        });
        // Two open menus overlapping each other is the one thing the
        // outside-click handler above cannot catch, since opening one is a
        // click inside it.
        disclosures.forEach(function (d) {
            d.addEventListener("toggle", function () {
                if (!d.open) return;
                disclosures.forEach(function (other) {
                    if (other !== d) other.open = false;
                });
            });
        });
    }

    /* ---------- live-stats nav badge ---------- */
    // An app-icon-style count on the "Live stats" nav item, so someone
    // reading the site can see that other people are logging meals while
    // they read. The markup ships [hidden] in the nav of EVERY page
    // (liveBadge() in scripts/site-partials.ts), which is why the driver
    // belongs here and not where it started: it lived inside the landing
    // page's own inline script, so on /tools, /privacy and every
    // /alternatives page the badge was rendered, reserved space for, and
    // then never moved.
    var badgeEls = doc.querySelectorAll("[data-live-badge]");
    if (badgeEls.length) {
        // Capped low on purpose: the badge sits inline after the label and
        // widens its nav item, and three characters is as much as fits
        // there without crowding the next item.
        var NAV_BADGE_MAX = 99;
        var BADGE_BASE_KEY = "live-base";
        // The landing page polls every 5s because its figures are on screen
        // and animate; a badge in the corner does not need that, and this
        // poll now runs on every page rather than one.
        var BADGE_POLL_MS = 15000;
        // The page's own language, stamped on <html lang> by the generator.
        // One file serves all nine locales, so it can never name a locale of
        // its own — the same contract LANDING_SCRIPT works under.
        var badgeLocale = root.lang || "en";
        var navPlurals = null;

        function badgeInt(n) {
            return Math.round(n).toLocaleString(badgeLocale);
        }

        // The label after the digits is count-sensitive ("1 new food log",
        // not "1 new food logs"), and in Polish and Ukrainian the noun case
        // turns on the digit class. liveBadge() ships every form the locale
        // has as a data-plural-* attribute and this picks one. Selected on
        // the true count rather than the capped text, so "99+" still reads
        // in the right form.
        function navBadgeLabel(b, n) {
            if (navPlurals === null) {
                try {
                    navPlurals = new Intl.PluralRules(badgeLocale);
                } catch (e) {
                    navPlurals = false;
                }
            }
            var cat = "other";
            if (navPlurals) {
                try {
                    cat = navPlurals.select(n);
                } catch (e) {}
            }
            // Falls back to "other" for any category this locale does not
            // carry, the same degradation the widgets use.
            return (
                b.getAttribute("data-plural-" + cat) ||
                b.getAttribute("data-plural-other")
            );
        }

        function setNavBadge(n) {
            var text = n > NAV_BADGE_MAX ? NAV_BADGE_MAX + "+" : badgeInt(n);
            badgeEls.forEach(function (b) {
                if (n <= 0) {
                    if (!b.hidden) {
                        b.hidden = true;
                        queueFit();
                    }
                    return;
                }
                var num = b.querySelector(".nav-badge-n");
                // The hamburger copy is aria-hidden and carries no label
                // span, so there is nothing to reword on it.
                var vh = b.querySelector(".vh");
                var label = vh ? navBadgeLabel(b, n) : null;
                // Two counts can share one capped text ("99+") and still want
                // different forms, so the label is part of what counts as
                // unchanged.
                if (
                    !b.hidden &&
                    num.textContent === text &&
                    (!vh || !label || vh.textContent === label)
                )
                    return;
                num.textContent = text;
                // "99+" carries its own plus; styles.css drops the leading
                // "+" (.nav-badge-n::before) on a capped badge.
                b.classList.toggle("capped", n > NAV_BADGE_MAX);
                if (vh && label) vh.textContent = label;
                b.hidden = false;
                // Restart the pop so a second arrival is noticed too, not
                // just the first.
                b.classList.remove("pop");
                void b.offsetWidth;
                b.classList.add("pop");
                // The inline badge widens the nav item it sits in, which can
                // tip the nav into overflow and move the active pill.
                queueFit();
            });
        }

        // "Since you opened" means since you opened the SITE, not this page:
        // the count carries across a click from /tools to /privacy instead of
        // restarting at zero on every navigation, which is what the badge was
        // asked for. sessionStorage is per-tab and dies with the visit, so
        // that is exactly the scope wanted. Kept in a variable as well, so a
        // browser that refuses the write (private mode, site data blocked)
        // still counts correctly for as long as the page is open.
        var badgeBase = null;
        try {
            var stored = sessionStorage.getItem(BADGE_BASE_KEY);
            if (stored !== null && stored !== "") badgeBase = Number(stored);
            if (!isFinite(badgeBase)) badgeBase = null;
        } catch (e) {}

        // `pageBase` is the landing page's own page-load baseline, sent with
        // its figures. On that page the same number also carries a delta tag
        // on its row ("+3"), measured from that moment, so the badge shows
        // the row's number rather than the session's and the two can never
        // disagree on screen. The session baseline keeps accumulating
        // underneath either way, for whichever page is opened next.
        function feedBadge(foodLogs, pageBase) {
            if (typeof foodLogs !== "number" || !isFinite(foodLogs)) return;
            if (badgeBase === null) {
                badgeBase = foodLogs;
                try {
                    sessionStorage.setItem(BADGE_BASE_KEY, String(badgeBase));
                } catch (e) {}
            }
            var from = typeof pageBase === "number" ? pageBase : badgeBase;
            setNavBadge(foodLogs - from);
        }

        // The landing page already polls /api/stats for the figures it
        // animates and hands them over here rather than let this poll a
        // second time alongside it (see setStats in scripts/gen-index.ts).
        doc.addEventListener("live-stats", function (e) {
            var d = e.detail || {};
            var stats = d.stats || {};
            feedBadge(stats.food_logs, d.base ? d.base.food_logs : null);
        });

        // Every other page has to ask for itself. #facts-live is the landing
        // page's own live indicator and so the marker for "someone else is
        // already fetching this".
        if (!doc.getElementById("facts-live")) {
            var badgeTimer = null;
            var badgePoll = function () {
                badgeTimer = null;
                if (doc.hidden) return;
                fetch("/api/stats", { cache: "no-store" })
                    .then(function (r) {
                        if (!r.ok) throw new Error("stats");
                        return r.json();
                    })
                    .then(function (s) {
                        feedBadge(s.food_logs, null);
                    })
                    .catch(function () {})
                    .then(badgeSchedule);
            };
            var badgeSchedule = function () {
                if (badgeTimer || doc.hidden) return;
                badgeTimer = setTimeout(badgePoll, BADGE_POLL_MS);
            };
            // A background tab stops polling; the badge is ambient and a
            // hidden tab has nobody to be ambient for.
            doc.addEventListener("visibilitychange", function () {
                if (doc.hidden) {
                    clearTimeout(badgeTimer);
                    badgeTimer = null;
                } else {
                    badgeSchedule();
                }
            });
            badgePoll();
        }
    }

    // ---------- live GitHub star count ----------
    // Every [data-gh-stars] badge on the page (every GitHub button but the
    // header's icon) ships hidden and is shown only once a count arrives.
    // The count comes from our own /api/github-stars, which asks GitHub
    // server-side and caches it, so the visitor's browser never contacts
    // GitHub. Without script, or with no count yet, the badge stays hidden.
    var ghEls = doc.querySelectorAll("[data-gh-stars]");
    if (ghEls.length && window.fetch) {
        var ghLocale = root.lang || "en";
        fetch("/api/github-stars")
            .then(function (r) {
                return r.ok ? r.json() : null;
            })
            .then(function (d) {
                var n = d && d.stars;
                if (typeof n !== "number" || !isFinite(n) || n < 0) return;
                var t =
                    n >= 1000
                        ? (Math.floor(n / 100) / 10).toLocaleString(ghLocale, {
                              minimumFractionDigits: 1,
                              maximumFractionDigits: 1,
                          }) + "k"
                        : Math.round(n).toLocaleString(ghLocale);
                ghEls.forEach(function (el) {
                    var num = el.querySelector("[data-gh-stars-n]");
                    if (num) num.textContent = t;
                    el.hidden = false;
                });
            })
            .catch(function () {});
    }
})();
