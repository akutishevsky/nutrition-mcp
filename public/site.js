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
            metaTheme.setAttribute("content", dark ? "#0d1210" : "#fbfbf9");
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
            var disclosure = btn.closest("details");
            if (disclosure) disclosure.open = false;
        });
    });
    // Only meaningful in System mode — with an override on <body> the OS
    // flipping changes nothing on the page.
    darkQuery.addEventListener("change", function () {
        if (!body.getAttribute("data-theme")) syncTheme();
    });
    syncTheme();

    /* ---------- header: compact on scroll + reading progress ---------- */
    var head = doc.getElementById("site-head");
    var ticking = false;
    function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
            ticking = false;
            var y = window.scrollY || 0;
            if (head) {
                head.classList.toggle("scrolled", y > 8);
                var max = root.scrollHeight - window.innerHeight;
                head.style.setProperty(
                    "--progress",
                    max > 0 ? Math.min(1, y / max).toFixed(4) : 0,
                );
            }
            updateParallax(y);
        });
    }
    window.addEventListener("scroll", onScroll, { passive: true });

    /* ---------- mobile menu ---------- */
    var menuBtn = doc.getElementById("menu-btn");
    var menu = doc.getElementById("site-menu");
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
        // Leaving the phone layout with the sheet open would strand the
        // inert flags, so close on the way out. Matches styles.css's
        // .head-nav/.site-menu breakpoint.
        var wide = window.matchMedia("(min-width: 1120px)");
        wide.addEventListener("change", function (ev) {
            if (ev.matches && menuBtn.getAttribute("aria-expanded") === "true")
                closeMenu(false);
        });
    }

    /* ---------- scroll-spy for same-page sections ---------- */
    var spyLinks = Array.prototype.filter.call(
        doc.querySelectorAll(".head-nav a[href*='#']"),
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
                spyLinks.forEach(function (a) {
                    a.classList.toggle("active", a === found);
                });
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

    /* ---------- hero parallax + card tilt ---------- */
    var stage = doc.querySelector(".hero-stage");
    var layers = stage ? stage.querySelectorAll(".depth") : [];
    var card = stage ? stage.querySelector(".hero-card") : null;
    function updateParallax(y) {
        if (!stage || reduceMotion.matches || !layers.length) return;
        // Only while the hero is on screen; past it the work is wasted.
        if (y > window.innerHeight * 1.3) return;
        for (var i = 0; i < layers.length; i++) {
            var d = parseFloat(layers[i].getAttribute("data-depth") || "0");
            layers[i].style.setProperty("--py", (y * d).toFixed(1) + "px");
        }
    }
    if (stage && card && !reduceMotion.matches) {
        var fine = window.matchMedia("(hover: hover) and (pointer: fine)");
        if (fine.matches) {
            var rect = null;
            stage.addEventListener("pointerenter", function () {
                rect = stage.getBoundingClientRect();
            });
            stage.addEventListener("pointermove", function (e) {
                if (!rect) rect = stage.getBoundingClientRect();
                var px = (e.clientX - rect.left) / rect.width - 0.5;
                var py = (e.clientY - rect.top) / rect.height - 0.5;
                card.style.setProperty("--ry", (px * 8).toFixed(2) + "deg");
                card.style.setProperty("--rx", (-py * 8).toFixed(2) + "deg");
            });
            stage.addEventListener("pointerleave", function () {
                card.style.setProperty("--ry", "0deg");
                card.style.setProperty("--rx", "0deg");
                rect = null;
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
    // The language and theme switchers, which sit next to each other and
    // are the same control twice over.
    var disclosures = [].slice.call(
        doc.querySelectorAll(".lang-switch, .theme-switch"),
    );
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

    onScroll();
    // Lets CSS run the load choreography (hero underline etc.).
    requestAnimationFrame(function () {
        body.classList.add("is-ready");
    });
})();
