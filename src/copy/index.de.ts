// German translation of src/copy/index.ts's IndexDoc. See that file's header
// for the shape/trust-level rules this follows (Html-suffixed fields carry
// trusted inline markup; the hero chat demo and "try saying" slides are each
// one HTML block per message, translated in place).

import type { IndexDoc } from "./index.js";

const HERO_CHIPS_HTML_PLACEHOLDER = `
<span class="chip chip-1"><i style="--c: var(--cal)"></i><b>+340</b> kcal</span>
<span class="chip chip-2"><i style="--c: #8b5cf6"></i><b>20 g</b> Protein</span>
<span class="chip chip-3"><i style="--c: #10b981"></i><b>30 g</b> Kohlenhydrate</span>
<span class="chip chip-4"><i style="--c: #0ea5e9"></i><b>500 ml</b> Wasser</span>`;

const HERO_CHAT_HTML_PLACEHOLDER = `
<div class="cw-header">
    <span class="cw-avatar"><i class="fa-solid fa-apple-whole"></i></span>
    <span class="cw-title">Nutrition MCP</span>
    <span class="cw-status">Online</span>
</div>
<div class="cw-body">
    <div class="chat-thread">
        <div class="msg msg-user">
            Zwei Eier, Vollkorntoast und ein Kaffee zum Frühstück
        </div>

        <div class="msg msg-ai">
            <div class="wdg">
                <div class="wdg-head">
                    <div class="wdg-title">Mahlzeit erfasst</div>
                    <div class="wdg-sub">Zwei Eier, Toast &amp; Kaffee · Frühstück</div>
                    <div class="wdg-meta wdg-kcal">+340 kcal</div>
                </div>
                <div class="wdg-strip">
                    <div class="wdg-srow">
                        <div class="wdg-cal">
                            <div class="wdg-gauge">
                                <div class="wdg-ring" style="--c: var(--cal); --p: 16;"></div>
                                <div class="wdg-rc"><span class="wdg-rp" style="color: var(--cal);">16%</span></div>
                            </div>
                            <div class="wdg-caltxt">
                                <div class="wdg-callab">Kalorien heute</div>
                                <div class="wdg-calline">
                                    <div class="wdg-calval">340<span class="wdg-calgoal">/ 2.100</span></div>
                                    <div class="wdg-calleft">1.760 kcal übrig</div>
                                </div>
                            </div>
                        </div>
                        <div class="wdg-grids">
                            <div class="wdg-mgrid">
                                <div class="wdg-mtile">
                                    <div class="wdg-mtop">
                                        <span class="wdg-mkey">Protein</span>
                                        <span class="wdg-mnum">20<span class="wdg-msub">/150</span></span>
                                    </div>
                                    <div class="wdg-mbar"><div class="wdg-mfill" style="width: 13.3%; background: var(--pro);"></div></div>
                                </div>
                                <div class="wdg-mtile">
                                    <div class="wdg-mtop">
                                        <span class="wdg-mkey">Kohlenhydrate</span>
                                        <span class="wdg-mnum">30<span class="wdg-msub">/220</span></span>
                                    </div>
                                    <div class="wdg-mbar"><div class="wdg-mfill" style="width: 13.6%; background: var(--car);"></div></div>
                                </div>
                                <div class="wdg-mtile">
                                    <div class="wdg-mtop">
                                        <span class="wdg-mkey">Fett</span>
                                        <span class="wdg-mnum">15<span class="wdg-msub">/70</span></span>
                                    </div>
                                    <div class="wdg-mbar"><div class="wdg-mfill" style="width: 21.4%; background: var(--fat);"></div></div>
                                </div>
                            </div>
                            <div class="wdg-mgrid wdg-lim wdg-sec">
                                <div class="wdg-mtile">
                                    <div class="wdg-mtop">
                                        <span class="wdg-mkey">Zucker</span>
                                        <span class="wdg-mnum">2,5</span>
                                    </div>
                                    <div class="wdg-mbar"><div class="wdg-mfill" style="width: 5.6%; background: var(--sug);"></div></div>
                                    <div class="wdg-mcap">Limit 45 g</div>
                                </div>
                                <div class="wdg-mtile">
                                    <div class="wdg-mtop">
                                        <span class="wdg-mkey">Koffein</span>
                                        <span class="wdg-mnum">95</span>
                                    </div>
                                    <div class="wdg-mbar"><div class="wdg-mfill" style="width: 23.8%; background: var(--caf);"></div></div>
                                    <div class="wdg-mcap">Limit 400 mg</div>
                                </div>
                                <div class="wdg-mtile">
                                    <div class="wdg-mtop">
                                        <span class="wdg-mkey">Ballaststoffe</span>
                                        <span class="wdg-mnum">3,4</span>
                                    </div>
                                    <div class="wdg-mbar"><div class="wdg-mfill" style="width: 11.3%; background: var(--fib);"></div></div>
                                    <div class="wdg-mcap">von 30 g</div>
                                </div>
                            </div>
                            <div class="wdg-mhint" aria-hidden="true">Tippe auf einen Wert für die zugehörigen Mahlzeiten</div>
                        </div>
                    </div>
                    <div class="wdg-wrow wdg-sec">
                        <span class="wdg-wlab"><span class="wdg-dot" style="background: var(--wat);"></span>Wasser</span>
                        <div class="wdg-mbar"><div class="wdg-mfill" style="width: 48%; background: var(--wat);"></div></div>
                        <span class="wdg-wnum">1,2<span class="wdg-wsub">/2,5 l</span></span>
                    </div>
                </div>
            </div>
            Erledigt — zum Frühstück hinzugefügt: zwei Eier, Toast und ein Kaffee.
            Das sind etwa 340 kcal (20 g Protein, 30 g Kohlenhydrate, 15 g Fett,
            3,4 g Ballaststoffe), plus 95 mg Koffein aus dem Kaffee.
        </div>

        <div class="msg msg-user">
            Wie entwickelt sich mein Gewicht?
        </div>

        <div class="msg msg-ai">
            <div class="wdg">
                <div class="wdg-head wdg-mid">
                    <div class="wdg-title">Gewicht</div>
                    <div class="wdg-seg" aria-hidden="true">
                        <span class="wdg-seg-btn wdg-on">7</span>
                        <span class="wdg-seg-btn">14</span>
                        <span class="wdg-seg-btn">30</span>
                    </div>
                </div>
                <div class="wdg-wmain">
                    <div class="wdg-wnow">
                        <div class="wdg-wtag">Aktuell</div>
                        <div class="wdg-wval">74,5<span class="wdg-wunit">kg</span></div>
                        <div class="wdg-wdelta" style="color: var(--accent);">−0,6 kg seit 5. Jul.</div>
                    </div>
                    <svg class="wdg-wchart" viewBox="0 0 300 62" role="img" aria-label="Gewicht vom 5. bis 11. Juli, aktuell 74,5 kg">
                        <line class="wdg-goalline" x1="5" y1="50.4" x2="295" y2="50.4" />
                        <path d="M5.0 13.6 L53.3 15.4 L101.7 18.9 L150.0 17.1 L198.3 22.4 L246.7 20.6 L295.0 24.1 L295.0 57 L5.0 57 Z" fill="var(--accent)" opacity="0.16" />
                        <path d="M5.0 13.6 L53.3 15.4 L101.7 18.9 L150.0 17.1 L198.3 22.4 L246.7 20.6 L295.0 24.1" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
                        <circle cx="5.0" cy="13.6" r="2.6" fill="var(--accent)" />
                        <circle cx="53.3" cy="15.4" r="2.6" fill="var(--accent)" />
                        <circle cx="101.7" cy="18.9" r="2.6" fill="var(--accent)" />
                        <circle cx="150.0" cy="17.1" r="2.6" fill="var(--accent)" />
                        <circle cx="198.3" cy="22.4" r="2.6" fill="var(--accent)" />
                        <circle cx="246.7" cy="20.6" r="2.6" fill="var(--accent)" />
                        <circle cx="295.0" cy="24.1" r="2.6" fill="var(--accent)" />
                    </svg>
                </div>
                <div class="wdg-sec wdg-wfoot">
                    <span>7 Wiegungen · 5. Jul. → 11. Jul.</span>
                    <span><b>Ziel 73,0 kg</b> · noch 1,5 kg</span>
                </div>
            </div>
            Du hast diese Woche 0,6 kg abgenommen und bist noch 1,5 kg von
            deinem Ziel von 73 kg entfernt — dein 7-Tage-Schnitt entwickelt
            sich schön nach unten.
        </div>
    </div>
</div>
<div class="cw-input">
    <span class="cw-field">Nachricht an Nutrition…</span>
    <span class="cw-send"><i class="fa-solid fa-arrow-up"></i></span>
</div>`;

const SLIDE_1_HTML_PLACEHOLDER = `
<div class="msg msg-user">
    Trag eine Chicken-Burrito-Bowl als Mittagessen ein
</div>
<div class="typing" aria-hidden="true"><span></span><span></span><span></span></div>
<div class="msg msg-ai">
    <div class="wdg">
        <div class="wdg-head">
            <div class="wdg-title">Mahlzeit erfasst</div>
            <div class="wdg-sub">Chicken-Burrito-Bowl · Mittagessen</div>
            <div class="wdg-meta wdg-kcal">+650 kcal</div>
        </div>
        <div class="wdg-strip">
            <div class="wdg-srow">
                <div class="wdg-cal">
                    <div class="wdg-gauge">
                        <div class="wdg-ring" style="--c: var(--cal); --p: 47;"></div>
                        <div class="wdg-rc"><span class="wdg-rp" style="color: var(--cal);">47%</span></div>
                    </div>
                    <div class="wdg-caltxt">
                        <div class="wdg-callab">Kalorien heute</div>
                        <div class="wdg-calline">
                            <div class="wdg-calval">990<span class="wdg-calgoal">/ 2.100</span></div>
                            <div class="wdg-calleft">1.110 kcal übrig</div>
                        </div>
                    </div>
                </div>
                <div class="wdg-grids">
                    <div class="wdg-mgrid">
                        <div class="wdg-mtile">
                            <div class="wdg-mtop">
                                <span class="wdg-mkey">Protein</span>
                                <span class="wdg-mnum">62<span class="wdg-msub">/150</span></span>
                            </div>
                            <div class="wdg-mbar"><div class="wdg-mfill" style="width: 41.3%; background: var(--pro);"></div></div>
                        </div>
                        <div class="wdg-mtile">
                            <div class="wdg-mtop">
                                <span class="wdg-mkey">Kohlenhydrate</span>
                                <span class="wdg-mnum">98<span class="wdg-msub">/220</span></span>
                            </div>
                            <div class="wdg-mbar"><div class="wdg-mfill" style="width: 44.5%; background: var(--car);"></div></div>
                        </div>
                        <div class="wdg-mtile">
                            <div class="wdg-mtop">
                                <span class="wdg-mkey">Fett</span>
                                <span class="wdg-mnum">37<span class="wdg-msub">/70</span></span>
                            </div>
                            <div class="wdg-mbar"><div class="wdg-mfill" style="width: 52.9%; background: var(--fat);"></div></div>
                        </div>
                    </div>
                    <div class="wdg-mgrid wdg-lim wdg-sec">
                        <div class="wdg-mtile">
                            <div class="wdg-mtop">
                                <span class="wdg-mkey">Zucker</span>
                                <span class="wdg-mnum">6,5</span>
                            </div>
                            <div class="wdg-mbar"><div class="wdg-mfill" style="width: 14.4%; background: var(--sug);"></div></div>
                            <div class="wdg-mcap">Limit 45 g</div>
                        </div>
                        <div class="wdg-mtile">
                            <div class="wdg-mtop">
                                <span class="wdg-mkey">Koffein</span>
                                <span class="wdg-mnum">95</span>
                            </div>
                            <div class="wdg-mbar"><div class="wdg-mfill" style="width: 23.8%; background: var(--caf);"></div></div>
                            <div class="wdg-mcap">Limit 400 mg</div>
                        </div>
                        <div class="wdg-mtile">
                            <div class="wdg-mtop">
                                <span class="wdg-mkey">Ballaststoffe</span>
                                <span class="wdg-mnum">15,4</span>
                            </div>
                            <div class="wdg-mbar"><div class="wdg-mfill" style="width: 51.3%; background: var(--fib);"></div></div>
                            <div class="wdg-mcap">von 30 g</div>
                        </div>
                    </div>
                    <div class="wdg-mhint" aria-hidden="true">Tippe auf einen Wert für die zugehörigen Mahlzeiten</div>
                </div>
            </div>
            <div class="wdg-wrow wdg-sec">
                <span class="wdg-wlab"><span class="wdg-dot" style="background: var(--wat);"></span>Wasser</span>
                <div class="wdg-mbar"><div class="wdg-mfill" style="width: 48%; background: var(--wat);"></div></div>
                <span class="wdg-wnum">1,2<span class="wdg-wsub">/2,5 l</span></span>
            </div>
        </div>
    </div>
    Erledigt — eine Chicken-Burrito-Bowl zum Mittagessen hinzugefügt, etwa
    650 kcal (42 g Protein, 68 g Kohlenhydrate, 22 g Fett) und 12 g
    Ballaststoffe aus den Bohnen.
</div>`;

const SLIDE_2_HTML_PLACEHOLDER = `
<div class="msg-img" aria-hidden="true">
    <svg viewBox="0 0 220 150" class="chat-photo" role="img" aria-label="Foto eines Abendessen-Tellers">
        <rect width="220" height="150" fill="#efe9df" />
        <ellipse cx="110" cy="82" rx="72" ry="52" fill="#fbfaf7" />
        <ellipse cx="110" cy="82" rx="72" ry="52" fill="none" stroke="#e6e0d3" stroke-width="2.5" />
        <ellipse cx="110" cy="82" rx="58" ry="41" fill="none" stroke="#efe9df" stroke-width="1.5" />
        <ellipse cx="136" cy="64" rx="28" ry="19" fill="#f3efe6" />
        <ellipse cx="136" cy="64" rx="28" ry="19" fill="none" stroke="#e7e1d4" stroke-width="1" />
        <g fill="#ffffff">
            <circle cx="126" cy="60" r="1.6" />
            <circle cx="138" cy="58" r="1.6" />
            <circle cx="146" cy="66" r="1.6" />
            <circle cx="132" cy="70" r="1.6" />
            <circle cx="142" cy="68" r="1.6" />
        </g>
        <g transform="rotate(-16 86 92)">
            <rect x="58" y="80" width="56" height="26" rx="9" fill="#e0916b" />
            <rect x="64" y="86" width="44" height="3" rx="1.5" fill="#edb293" />
            <rect x="64" y="92" width="44" height="3" rx="1.5" fill="#edb293" />
            <rect x="64" y="98" width="44" height="3" rx="1.5" fill="#edb293" />
        </g>
        <g>
            <rect x="128" y="98" width="4" height="12" rx="2" fill="#9ab98a" />
            <circle cx="124" cy="98" r="10" fill="#5f8f4e" />
            <circle cx="136" cy="95" r="8.5" fill="#6fa35d" />
            <circle cx="133" cy="105" r="7.5" fill="#537f44" />
            <circle cx="121" cy="106" r="6.5" fill="#6a9a58" />
        </g>
    </svg>
</div>
<div class="msg msg-user">Hier ist mein Abendessen — was ist da drin?</div>
<div class="typing" aria-hidden="true"><span></span><span></span><span></span></div>
<div class="msg msg-ai">
    Sieht nach gegrilltem Lachs mit Reis und Brokkoli aus — als Abendessen
    erfasst, etwa 540 kcal (38 g Protein, 45 g Kohlenhydrate, 20 g Fett).
</div>`;

const SLIDE_3_HTML_PLACEHOLDER = `
<div class="msg-img" aria-hidden="true">
    <svg viewBox="0 0 220 150" class="chat-photo" role="img" aria-label="Foto eines Produkt-Barcodes">
        <rect width="220" height="150" fill="#efe9df" />
        <rect x="40" y="32" width="140" height="86" rx="12" fill="#ffffff" stroke="#e6e0d3" stroke-width="2" />
        <g>
            <rect x="53" y="50" width="3" height="44" fill="#2b2b2b" />
            <rect x="58.6" y="50" width="1" height="44" fill="#2b2b2b" />
            <rect x="62.2" y="50" width="2" height="44" fill="#2b2b2b" />
            <rect x="66.8" y="50" width="1" height="44" fill="#2b2b2b" />
            <rect x="70.39999999999999" y="50" width="1" height="44" fill="#2b2b2b" />
            <rect x="73.99999999999999" y="50" width="3" height="44" fill="#2b2b2b" />
            <rect x="79.59999999999998" y="50" width="2" height="44" fill="#2b2b2b" />
            <rect x="84.19999999999997" y="50" width="1" height="44" fill="#2b2b2b" />
            <rect x="87.79999999999997" y="50" width="2" height="44" fill="#2b2b2b" />
            <rect x="92.39999999999996" y="50" width="1" height="44" fill="#2b2b2b" />
            <rect x="95.99999999999996" y="50" width="3" height="44" fill="#2b2b2b" />
            <rect x="101.59999999999995" y="50" width="1" height="44" fill="#2b2b2b" />
            <rect x="105.19999999999995" y="50" width="1" height="44" fill="#2b2b2b" />
            <rect x="108.79999999999994" y="50" width="2" height="44" fill="#2b2b2b" />
            <rect x="113.39999999999993" y="50" width="2" height="44" fill="#2b2b2b" />
            <rect x="117.99999999999993" y="50" width="1" height="44" fill="#2b2b2b" />
            <rect x="121.59999999999992" y="50" width="3" height="44" fill="#2b2b2b" />
            <rect x="127.19999999999992" y="50" width="1" height="44" fill="#2b2b2b" />
            <rect x="130.79999999999993" y="50" width="2" height="44" fill="#2b2b2b" />
            <rect x="135.39999999999992" y="50" width="1" height="44" fill="#2b2b2b" />
            <rect x="138.99999999999991" y="50" width="1" height="44" fill="#2b2b2b" />
            <rect x="142.5999999999999" y="50" width="2" height="44" fill="#2b2b2b" />
            <rect x="147.1999999999999" y="50" width="3" height="44" fill="#2b2b2b" />
            <rect x="152.7999999999999" y="50" width="1" height="44" fill="#2b2b2b" />
        </g>
        <text x="110" y="108" text-anchor="middle" font-family="ui-monospace, monospace" font-size="10" letter-spacing="2" fill="#9a9a9f">0 12345 67890</text>
    </svg>
</div>
<div class="msg msg-user">Erfasse das</div>
<div class="typing" aria-hidden="true"><span></span><span></span><span></span></div>
<div class="msg msg-ai step-ask">
    Gefunden — Chobani griechischer Joghurt, 1 Tasse: 120 kcal, 15 g Protein.
    Welche Mahlzeit ist das?
    <div class="meal-pick">
        <span class="meal-chip">Frühstück</span>
        <span class="meal-chip">Mittagessen</span>
        <span class="meal-chip">Abendessen</span>
        <span class="meal-chip meal-pick-target">Snack</span>
    </div>
</div>
<div class="msg msg-ai step-done">
    <div class="wdg">
        <div class="wdg-head">
            <div class="wdg-title">Mahlzeit erfasst</div>
            <div class="wdg-sub">Chobani griechischer Joghurt, 1 Tasse · Snack</div>
            <div class="wdg-meta wdg-kcal">+120 kcal</div>
        </div>
        <div class="wdg-strip">
            <div class="wdg-srow">
                <div class="wdg-cal">
                    <div class="wdg-gauge">
                        <div class="wdg-ring" style="--c: var(--cal); --p: 73;"></div>
                        <div class="wdg-rc"><span class="wdg-rp" style="color: var(--cal);">73%</span></div>
                    </div>
                    <div class="wdg-caltxt">
                        <div class="wdg-callab">Kalorien heute</div>
                        <div class="wdg-calline">
                            <div class="wdg-calval">1.540<span class="wdg-calgoal">/ 2.100</span></div>
                            <div class="wdg-calleft">560 kcal übrig</div>
                        </div>
                    </div>
                </div>
                <div class="wdg-grids">
                    <div class="wdg-mgrid">
                        <div class="wdg-mtile">
                            <div class="wdg-mtop">
                                <span class="wdg-mkey">Protein</span>
                                <span class="wdg-mnum">98<span class="wdg-msub">/150</span></span>
                            </div>
                            <div class="wdg-mbar"><div class="wdg-mfill" style="width: 65.3%; background: var(--pro);"></div></div>
                        </div>
                        <div class="wdg-mtile">
                            <div class="wdg-mtop">
                                <span class="wdg-mkey">Kohlenhydrate</span>
                                <span class="wdg-mnum">150<span class="wdg-msub">/220</span></span>
                            </div>
                            <div class="wdg-mbar"><div class="wdg-mfill" style="width: 68.2%; background: var(--car);"></div></div>
                        </div>
                        <div class="wdg-mtile">
                            <div class="wdg-mtop">
                                <span class="wdg-mkey">Fett</span>
                                <span class="wdg-mnum">52<span class="wdg-msub">/70</span></span>
                            </div>
                            <div class="wdg-mbar"><div class="wdg-mfill" style="width: 74.3%; background: var(--fat);"></div></div>
                        </div>
                    </div>
                    <div class="wdg-mgrid wdg-lim wdg-sec">
                        <div class="wdg-mtile">
                            <div class="wdg-mtop">
                                <span class="wdg-mkey">Zucker</span>
                                <span class="wdg-mnum">28,4</span>
                            </div>
                            <div class="wdg-mbar"><div class="wdg-mfill" style="width: 63.1%; background: var(--sug);"></div></div>
                            <div class="wdg-mcap">Limit 45 g</div>
                        </div>
                        <div class="wdg-mtile">
                            <div class="wdg-mtop">
                                <span class="wdg-mkey">Koffein</span>
                                <span class="wdg-mnum">95</span>
                            </div>
                            <div class="wdg-mbar"><div class="wdg-mfill" style="width: 23.8%; background: var(--caf);"></div></div>
                            <div class="wdg-mcap">Limit 400 mg</div>
                        </div>
                        <div class="wdg-mtile">
                            <div class="wdg-mtop">
                                <span class="wdg-mkey">Ballaststoffe</span>
                                <span class="wdg-mnum">19,2</span>
                            </div>
                            <div class="wdg-mbar"><div class="wdg-mfill" style="width: 64%; background: var(--fib);"></div></div>
                            <div class="wdg-mcap">von 30 g</div>
                        </div>
                    </div>
                    <div class="wdg-mhint" aria-hidden="true">Tippe auf einen Wert für die zugehörigen Mahlzeiten</div>
                </div>
            </div>
        </div>
    </div>
    Als Snack erfasst — 120 kcal, 15 g Protein, 9 g Zucker.
</div>`;

const SLIDE_4_HTML_PLACEHOLDER = `
<div class="msg msg-user">
    Stell meine Zeitzone auf New York
</div>
<div class="typing" aria-hidden="true"><span></span><span></span><span></span></div>
<div class="msg msg-ai">
    Erledigt — dein Tag wechselt jetzt um Mitternacht Eastern Time, damit die
    heutigen Werte stimmen, egal wo du bist.
</div>`;

const SLIDE_5_HTML_PLACEHOLDER = `
<div class="msg msg-user">
    Wie stehe ich heute beim Protein da?
</div>
<div class="typing" aria-hidden="true"><span></span><span></span><span></span></div>
<div class="msg msg-ai">
    Du liegst bei 118 g von deinem 150-g-Ziel — noch 32 g. Eine Tasse
    griechischer Joghurt oder eine Hähnchenbrust würden dich hinbringen.
</div>`;

const SLIDE_6_HTML_PLACEHOLDER = `
<div class="msg msg-user">
    Zeig mir meine Trends diese Woche
</div>
<div class="typing" aria-hidden="true"><span></span><span></span><span></span></div>
<div class="msg msg-ai">
    <div class="wdg">
        <div class="wdg-head wdg-mid">
            <div class="wdg-title">Trends</div>
            <div class="wdg-seg" aria-hidden="true">
                <span class="wdg-seg-btn wdg-on">7</span>
                <span class="wdg-seg-btn">14</span>
                <span class="wdg-seg-btn">30</span>
            </div>
        </div>
        <div class="wdg-chart">
            <div class="wdg-chead">
                <span class="wdg-ctitle">Kalorien / Tag</span>
                <span class="wdg-cmeta">7/7 Tage erfasst</span>
            </div>
            <svg viewBox="0 0 480 54" role="img" aria-label="Kalorien pro Tag in den letzten 7 Tagen">
                <line class="wdg-axis" x1="8" y1="50" x2="472" y2="50" />
                <line class="wdg-goalline" x1="8" y1="11.7" x2="472" y2="11.7" />
                <path d="M8.0 50 L8.0 13.2 L85.3 14.7 L162.7 11.9 L240.0 15.7 L317.3 13.4 L394.7 14.4 L472.0 14.2 L472.0 50 Z" fill="var(--cal)" opacity="0.16" />
                <path d="M8.0 13.2 L85.3 14.7 L162.7 11.9 L240.0 15.7 L317.3 13.4 L394.7 14.4 L472.0 14.2" fill="none" stroke="var(--cal)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
                <circle cx="8.0" cy="13.2" r="2.2" fill="var(--cal)" />
                <circle cx="85.3" cy="14.7" r="2.2" fill="var(--cal)" />
                <circle cx="162.7" cy="11.9" r="2.2" fill="var(--cal)" />
                <circle cx="240.0" cy="15.7" r="2.2" fill="var(--cal)" />
                <circle cx="317.3" cy="13.4" r="2.2" fill="var(--cal)" />
                <circle cx="394.7" cy="14.4" r="2.2" fill="var(--cal)" />
                <circle cx="472.0" cy="14.2" r="2.2" fill="var(--cal)" />
            </svg>
            <div class="wdg-tdates"><span>07-05</span><span>07-11</span></div>
        </div>
        <div class="wdg-strip wdg-sec">
            <div class="wdg-srow">
                <div class="wdg-cal">
                    <div class="wdg-gauge">
                        <div class="wdg-ring" style="--c: var(--cal); --p: 94;"></div>
                        <div class="wdg-rc"><span class="wdg-rp" style="color: var(--cal);">94%</span></div>
                    </div>
                    <div class="wdg-caltxt">
                        <div class="wdg-callab">7-Tage-Schnitt · alle Tage</div>
                        <div class="wdg-calline">
                            <div class="wdg-calval">1.980<span class="wdg-calgoal">/ 2.100</span></div>
                            <div class="wdg-calleft">120 kcal unter Ziel</div>
                        </div>
                    </div>
                </div>
                <div class="wdg-grids">
                    <div class="wdg-mgrid">
                        <div class="wdg-mtile">
                            <div class="wdg-mtop">
                                <span class="wdg-mkey">Protein</span>
                                <span class="wdg-mnum">148<span class="wdg-msub">/150</span></span>
                            </div>
                            <div class="wdg-mbar"><div class="wdg-mfill" style="width: 98.7%; background: var(--pro);"></div></div>
                        </div>
                        <div class="wdg-mtile">
                            <div class="wdg-mtop">
                                <span class="wdg-mkey">Kohlenhydrate</span>
                                <span class="wdg-mnum">205<span class="wdg-msub">/220</span></span>
                            </div>
                            <div class="wdg-mbar"><div class="wdg-mfill" style="width: 93.2%; background: var(--car);"></div></div>
                        </div>
                        <div class="wdg-mtile">
                            <div class="wdg-mtop">
                                <span class="wdg-mkey">Fett</span>
                                <span class="wdg-mnum">66<span class="wdg-msub">/70</span></span>
                            </div>
                            <div class="wdg-mbar"><div class="wdg-mfill" style="width: 94.3%; background: var(--fat);"></div></div>
                        </div>
                    </div>
                    <div class="wdg-mgrid wdg-lim wdg-sec">
                        <div class="wdg-mtile">
                            <div class="wdg-mtop">
                                <span class="wdg-mkey">Zucker</span>
                                <span class="wdg-mnum">38,2</span>
                            </div>
                            <div class="wdg-mbar"><div class="wdg-mfill" style="width: 84.9%; background: var(--sug);"></div></div>
                            <div class="wdg-mcap">Limit 45 g</div>
                        </div>
                        <div class="wdg-mtile">
                            <div class="wdg-mtop">
                                <span class="wdg-mkey">Koffein</span>
                                <span class="wdg-mnum">180</span>
                            </div>
                            <div class="wdg-mbar"><div class="wdg-mfill" style="width: 45%; background: var(--caf);"></div></div>
                            <div class="wdg-mcap">Limit 400 mg</div>
                        </div>
                        <div class="wdg-mtile">
                            <div class="wdg-mtop">
                                <span class="wdg-mkey">Ballaststoffe</span>
                                <span class="wdg-mnum">26,8</span>
                            </div>
                            <div class="wdg-mbar"><div class="wdg-mfill" style="width: 89.3%; background: var(--fib);"></div></div>
                            <div class="wdg-mcap">von 30 g</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="wdg-wrow wdg-sec">
                <span class="wdg-wlab"><span class="wdg-dot" style="background: var(--wat);"></span>Wasser</span>
                <div class="wdg-mbar"><div class="wdg-mfill" style="width: 84%; background: var(--wat);"></div></div>
                <span class="wdg-wnum">2,1<span class="wdg-wsub">/2,5 l</span></span>
            </div>
        </div>
    </div>
    Du liegst im Schnitt bei 1.980 kcal am Tag — 120 unter Ziel, mit Zucker
    und Koffein beide komfortabel innerhalb deiner Grenzwerte. Ballaststoffe
    liegen im Schnitt bei 26,8 g, knapp unter deinem 30-g-Ziel.
</div>`;

const SLIDE_7_HTML_PLACEHOLDER = `
<div class="msg msg-user">
    Erfasse mein Gewicht, 74,5 kg
</div>
<div class="typing" aria-hidden="true"><span></span><span></span><span></span></div>
<div class="msg msg-ai">
    <div class="wdg">
        <div class="wdg-head wdg-mid">
            <div class="wdg-title">Gewicht</div>
            <div class="wdg-seg" aria-hidden="true">
                <span class="wdg-seg-btn wdg-on">7</span>
                <span class="wdg-seg-btn">14</span>
                <span class="wdg-seg-btn">30</span>
            </div>
        </div>
        <div class="wdg-wmain">
            <div class="wdg-wnow">
                <div class="wdg-wtag">Aktuell</div>
                <div class="wdg-wval">74,5<span class="wdg-wunit">kg</span></div>
                <div class="wdg-wdelta" style="color: var(--accent);">−0,6 kg seit 5. Jul.</div>
            </div>
            <svg class="wdg-wchart" viewBox="0 0 300 62" role="img" aria-label="Gewicht vom 5. bis 11. Juli, aktuell 74,5 kg">
                <line class="wdg-goalline" x1="5" y1="50.4" x2="295" y2="50.4" />
                <path d="M5.0 13.6 L53.3 15.4 L101.7 18.9 L150.0 17.1 L198.3 22.4 L246.7 20.6 L295.0 24.1 L295.0 57 L5.0 57 Z" fill="var(--accent)" opacity="0.16" />
                <path d="M5.0 13.6 L53.3 15.4 L101.7 18.9 L150.0 17.1 L198.3 22.4 L246.7 20.6 L295.0 24.1" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
                <circle cx="5.0" cy="13.6" r="2.6" fill="var(--accent)" />
                <circle cx="53.3" cy="15.4" r="2.6" fill="var(--accent)" />
                <circle cx="101.7" cy="18.9" r="2.6" fill="var(--accent)" />
                <circle cx="150.0" cy="17.1" r="2.6" fill="var(--accent)" />
                <circle cx="198.3" cy="22.4" r="2.6" fill="var(--accent)" />
                <circle cx="246.7" cy="20.6" r="2.6" fill="var(--accent)" />
                <circle cx="295.0" cy="24.1" r="2.6" fill="var(--accent)" />
            </svg>
        </div>
        <div class="wdg-sec wdg-wfoot">
            <span>7 Wiegungen · 5. Jul. → 11. Jul.</span>
            <span><b>Ziel 73,0 kg</b> · noch 1,5 kg</span>
        </div>
    </div>
    Erfasst — du bewegst dich auf dein Ziel zu.
</div>`;

export const INDEX_DE: IndexDoc = {
    title: "Nutrition MCP — KI-Mahlzeiten- & Makro-Tracker für Claude & ChatGPT",
    metaDescription:
        "Erfasse Mahlzeiten, Makros, Gewicht und deine Ernährungshistorie im Gespräch mit Claude oder ChatGPT. Kostenloser MCP-Server für KI-gestütztes Essensprotokoll, Barcode-Scans, Kalorienzählung und Gewichts-Tracking.",
    ogDescription:
        "Erfasse Mahlzeiten, Makros, Gewicht und deine Ernährungshistorie im Gespräch mit Claude oder ChatGPT. Kostenloser MCP-Server für KI-gestütztes Essensprotokoll, Barcode-Scans und Gewichts-Tracking.",
    keywords:
        "Ernährungs-Tracker, Mahlzeiten-Tracker, MCP-Server, Claude AI, ChatGPT, Kalorienzähler, Makro-Tracker, Barcode-Scanner, Essensprotokoll, Diät-Tracker, Gewichts-Tracker, Gewichtsprotokoll, KI-Ernährung, Model Context Protocol",

    chatChrome: {
        brand: "Nutrition MCP",
        status: "Online",
        inputPlaceholder: "Nachricht an Nutrition…",
    },

    hero: {
        eyebrow: "Kostenlos · Quelloffen · OAuth 2.0",
        titleBeforeEm: "Erfasse deine Ernährung, indem du mit deiner KI ",
        titleEm: "sprichst",
        titleAfterEm: ".",
        lead: "Verbinde Claude oder ChatGPT und sag einfach, was du gegessen hast. Kalorien und Makros werden automatisch erfasst.",
        ctaPrimary: "Schnell installieren",
        ctaSecondary: "Unterstützen",
        chipsHtml: HERO_CHIPS_HTML_PLACEHOLDER,
        chatHtml: HERO_CHAT_HTML_PLACEHOLDER,
    },

    how: {
        eyebrow: "So funktioniert's",
        title: "Drei Schritte. Keine App zu lernen.",
        steps: [
            {
                title: "Einmal verbinden",
                body: "Funktioniert mit jedem KI-Client, der Remote-MCP-Server unterstützt — Claude, ChatGPT und mehr. Keine Installation, keine API-Schlüssel.",
            },
            {
                title: "Sag einfach, was du gegessen hast",
                body: "Beschreib es in normalen Worten — oder schick ein Foto deines Essens, einen Screenshot aus einer Lieferapp oder einen Barcode (das Produkt wird online nachgeschlagen). Makros werden automatisch erfasst.",
            },
            {
                title: "Erfassen & auswerten",
                body: "Frag nach Tagesübersichten, wöchentlichen Trends, Zielfortschritt oder exportiere alles, was du erfasst hast, als CSV-Dateien — völlig kostenlos.",
            },
        ],
    },

    install: {
        eyebrow: "Schnell installieren",
        title: "In unter einer Minute verbunden",
        sub: "Funktioniert mit jedem MCP-Client, der OAuth 2.0 mit PKCE unterstützt. Bei der ersten Verbindung erstellst du ein Konto mit Google oder einer E-Mail-Adresse und einem Passwort; melde dich auf demselben Weg an, um deine Daten zu behalten.",
        claude: {
            steps: [
                "Öffne <strong>Claude</strong> (Web oder Desktop) und klick oben links auf <strong>Customize</strong>.",
                "Klick auf <strong>Connectors</strong>.",
                "Klick auf <strong>+</strong> und dann auf <strong>Add custom connector</strong>.",
                "Gib ihm einen Namen, zum Beispiel <strong>Nutrition</strong>.",
                'Füge <span class="copy-url"><code>https://nutrition-mcp.com/mcp</code><button class="copy-mini" type="button" data-copy="https://nutrition-mcp.com/mcp" aria-label="Server-URL kopieren"><i class="fa-solid fa-copy"></i></button></span> in das Feld <strong>Remote MCP server URL</strong> ein.',
                "Klick auf <strong>Add</strong>.",
                "Klick auf <strong>Connect</strong> — die Anmeldeseite öffnet sich; fahre mit Google fort oder melde dich mit E-Mail und Passwort an.",
                "Fertig. Es funktioniert sofort und erscheint automatisch auch in deinen iOS- und Android-Apps.",
            ],
            note: "Funktioniert mit jedem Claude-Plan. Der kostenlose Plan erlaubt jeweils einen verbundenen MCP-Server.",
        },
        chatgpt: {
            steps: [
                "Öffne <strong>ChatGPT on the web</strong> → <strong>Settings</strong> → <strong>Apps</strong>.",
                "Klick unten im Popup auf <strong>Create app</strong>. Falls du es nicht siehst, aktiviere <strong>Developer mode</strong> in den <strong>Advanced settings</strong>.",
                "Gib ihr einen Namen, zum Beispiel <strong>Nutrition</strong>.",
                'Füge bei <strong>Connection</strong> <span class="copy-url"><code>https://nutrition-mcp.com/mcp</code><button class="copy-mini" type="button" data-copy="https://nutrition-mcp.com/mcp" aria-label="Server-URL kopieren"><i class="fa-solid fa-copy"></i></button></span> ein.',
                "Wähl bei <strong>Authentication</strong> <strong>OAuth</strong> — lass alles andere unverändert.",
                'Aktiviere <strong>„I understand and want to continue"</strong>.',
                "Klick auf <strong>Create</strong>.",
                "Klick auf <strong>Sign in with Nutrition</strong> — die Anmeldeseite öffnet sich; fahre mit Google fort oder melde dich mit E-Mail und Passwort an.",
                "Fertig. Es funktioniert sofort und erscheint automatisch auch in deinen iOS- und Android-Apps.",
            ],
        },
        other: {
            note: "Füge die Konfiguration oben zu deinem Client hinzu (Cursor, VS Code, Claude Code und weitere). Windsurf verwendet <code>serverUrl</code> statt <code>url</code>. Führe in Claude Code <code>claude mcp add --transport http nutrition https://nutrition-mcp.com/mcp</code> aus. Dein Client übernimmt die OAuth-Anmeldung automatisch.",
        },
    },

    onboarding: {
        eyebrow: "Erste Schritte",
        title: "Einmal einrichten — oder einfach loslegen",
        sub: "Das ist völlig optional — Nutrition MCP funktioniert, sobald du verbunden bist. Wenn du willst, machen dich diese zwei kurzen Schritte genauer, aber du kannst auch direkt mit dem Erfassen loslegen.",
        steps: [
            '<strong>Zeitzone einstellen</strong> — damit der Tag um deine lokale Mitternacht wechselt und die heutigen Werte stimmen, egal wo du bist. <span class="step-say">Sag einfach <q>Stell meine Zeitzone auf New York</q>.</span>',
            '<strong>Ziele festlegen</strong> — tägliche Kalorien-, Makro- und Wasserziele, dazu optional ein Zielgewicht und deine bevorzugte Gewichtseinheit (kg oder lb), um deinen Fortschritt daran zu messen. <span class="step-say">Sag einfach <q>Setze mein Tagesziel auf 2.000 Kalorien und 150 g Protein</q>.</span>',
            '<strong>Loslegen</strong> — sag einfach, was du gegessen hast, schick ein Foto oder scanne einen Barcode. Das war\'s. <span class="step-say">Sag einfach <q>Ich hatte Haferflocken mit Beeren zum Frühstück</q>.</span>',
        ],
        note: "Das alles ist optional. Du kannst es jetzt, später oder nie machen — leg einfach mit dem Erfassen los und stell das ein, wann immer du willst.",
        toolsCta: {
            heading: "Neugierig, was es wirklich kann?",
            body: "Sieh dir alle 38 Werkzeuge an — Erfassen, Barcodes, Wasser, Gewicht, Ziele und Trends — jeweils mit Beschreibung und einem Beispielsatz.",
            arrow: "Werkzeuge entdecken",
        },
    },

    try: {
        eyebrow: "Probier zu sagen",
        title: "Sprich einfach mit ihr.",
        sub: "Ein paar Dinge, die du einfach so sagen kannst.",
        prevLabel: "Vorheriges Beispiel",
        nextLabel: "Nächstes Beispiel",
        exampleLabel: "Beispiel",
        slides: [
            { html: SLIDE_1_HTML_PLACEHOLDER },
            { html: SLIDE_2_HTML_PLACEHOLDER },
            { html: SLIDE_3_HTML_PLACEHOLDER },
            { html: SLIDE_4_HTML_PLACEHOLDER },
            { html: SLIDE_5_HTML_PLACEHOLDER },
            { html: SLIDE_6_HTML_PLACEHOLDER },
            { html: SLIDE_7_HTML_PLACEHOLDER },
        ],
    },

    stats: {
        eyebrow: "Bisher gemeinsam erfasst",
        title: "Ein wachsendes globales Essensprotokoll",
        factsTitle: "Nährwerte",
        servingPrefix: "Portionsgröße ",
        servingBold: "alle, bisher",
        liveLabel: "Live",
        calLabel: "Kalorien ",
        calSmall: "erfasst, insgesamt",
        calCaption: "Erfasste Kalorien",
        rowFoodLogs: "Mahlzeiten-Einträge",
        rowProtein: "Protein",
        rowCarbs: "Kohlenhydrate",
        rowFat: "Fett",
        foot: "Summen über alle Konten, aktualisiert bei jeder erfassten Mahlzeit. Individuelle Daten werden nie angezeigt.",
        mapPrefix: "Erfasst in",
        mapSuffix: "Zeitzonen weltweit",
        mapAriaLabel:
            "Weltkarte mit den Zeitzonen, in denen Nutrition MCP genutzt wird",
    },

    features: {
        eyebrow: "Alles, einfach im Gespräch",
        title: "Was du erfassen kannst",
        cards: [
            {
                icon: "fa-solid fa-utensils",
                title: "Mahlzeiten in normaler Sprache",
                body: "Beschreib, was du gegessen hast — deine KI schätzt Kalorien, Protein, Kohlenhydrate, Fett, Ballaststoffe, Gesamtzucker und Koffein in Milligramm und erfasst es.",
            },
            {
                icon: "fa-solid fa-barcode",
                title: "Barcode scannen",
                body: "Fotografier oder tipp einen Produkt-Barcode ein und hol Makros, Ballaststoffe und Zucker von Open Food Facts — skaliert auf die Menge, die du gegessen hast.",
            },
            {
                icon: "fa-solid fa-bullseye",
                title: "Ziele & Fortschritt",
                body: "Leg tägliche Ziele für Kalorien, Makros, Ballaststoffe und Wasser fest — dazu Grenzwerte für Zucker, Koffein und Alkohol — und verfolg deinen Fortschritt live.",
            },
            {
                icon: "fa-solid fa-chart-area",
                title: "Übersichten & Trends",
                body: "Tages- und Wochenübersichten, 7/14/30-Tage-Trends, Serien und wiederkehrende Essgewohnheiten.",
            },
            {
                icon: "fa-solid fa-glass-water",
                title: "Wasser erfassen",
                body: "Verfolg deine Flüssigkeitszufuhr in Millilitern neben deinen Mahlzeiten und sieh sie dir tagesweise an.",
            },
            {
                icon: "fa-solid fa-weight-scale",
                title: "Gewichts-Tracking",
                body: "Erfasse dein Körpergewicht in kg oder lb, sieh dir 7/14/30-Tage-Trends an und verfolg deinen Fortschritt zu einem Zielgewicht.",
            },
            {
                icon: "fa-solid fa-clock-four",
                title: "Zeitzonenbewusst",
                body: "Der Tag wechselt in deiner lokalen Zeit, egal wo auf der Welt du bist.",
            },
            {
                icon: "fa-solid fa-file-import",
                title: "Import aus einer anderen App",
                body: "Bring deine Mahlzeiten-Historie aus MyFitnessPal, Cronometer, Lose It! oder MacroFactor mit — oder aus jeder anderen CSV, indem du die Spalten selbst zuordnest. Du bestätigst, was hinzugefügt wird, bevor irgendetwas gespeichert wird.",
            },
            {
                icon: "fa-solid fa-file-csv",
                title: "Export & Eigentum an deinen Daten",
                body: "Nimm alles mit, was du hier hast — Mahlzeiten, Wasser, Gewicht, Ziele und Profil — als ein ZIP mit CSV-Dateien. Mahlzeiten sind bisher der einzige Teil, der wieder importiert werden kann. Lösch dein Konto und deine Daten, wann immer du willst.",
            },
        ],
    },

    why: {
        eyebrow: "Warum Nutrition MCP",
        title: "Reden schlägt Tippen.",
        sub: "Fotografier einen Barcode oder sag einfach, was du gegessen hast — kein Wühlen in einer Datenbank, keine separate App zu öffnen.",
        oldHeading: "Klassische Apps",
        oldItems: [
            "Für jedes Lebensmittel eine Datenbank durchsuchen",
            "Falsche Datenbankeinträge von Hand korrigieren",
            "Noch eine App, noch ein Konto, noch eine Bezahlschranke",
            "Mühsames manuelles Erfassen",
        ],
        newHeading: "Nutrition MCP",
        newItems: [
            "Mahlzeiten in normaler Sprache beschreiben",
            "Kalorien & Makros werden für dich geschätzt",
            "Läuft kostenlos in Claude oder ChatGPT",
            "Frag nach Trends, Übersichten und Zielen",
        ],
        noteHtml:
            'Wechselst du von einer bestimmten App? Sieh dir an, wie Nutrition MCP im Vergleich zu <a href="/alternatives" data-link="alternatives">MyFitnessPal, Cronometer und anderen Trackern</a> abschneidet.',
    },

    trust: [
        {
            label: "Privat per Voreinstellung",
            small: "Nur du siehst deine Daten.",
        },
        { label: "Quelloffen", small: "Selbst prüfen oder hosten." },
        {
            label: "Jederzeit exportieren",
            small: "Jede Tabelle als CSV, in einem ZIP.",
        },
        { label: "Sofort löschen", small: "Konto & Daten entfernen." },
    ],

    support: {
        eyebrow: "Unterstützung",
        title: "Hilf mit, es am Laufen zu halten.",
        sub: "Nutrition MCP ist kostenlos und werbefrei. Patreon deckt die Server- und Datenbankkosten.",
        free: {
            tier: "Kostenloses Mitglied",
            price: "0 $",
            desc: "Bleib auf dem Laufenden — Neuigkeiten und Updates zum Server, neue Werkzeuge und was als Nächstes kommt.",
            cta: "Auf Patreon folgen",
        },
        paid: {
            tier: "Zahlendes Mitglied",
            price: "Zahl, was du willst",
            desc: "Beteilige dich an den Hosting- und Datenbankkosten, damit der Server für alle kostenlos und online bleibt.",
            cta: "Unterstützer werden",
        },
    },

    cta: {
        title: "Starte in unter einer Minute mit dem Erfassen.",
        sub: "Kostenlos und quelloffen — funktioniert mit der KI, die du schon nutzt.",
        primary: "Schnell installieren",
        secondary: "Stern auf GitHub geben",
    },

    contact: {
        eyebrow: "Kontakt",
        title: "Fragen oder Feedback?",
        sub: "Einen Bug gefunden, wünschst dir ein Feature oder hast einfach eine Frage? Schreib mir direkt eine E-Mail — ich lese jede Nachricht.",
        cta: "E-Mail senden",
    },

    faqSection: {
        eyebrow: "FAQ",
        title: "Häufig gestellte Fragen",
    },
    faq: [
        {
            question: "Was ist Nutrition MCP?",
            visibleHtml:
                "Nutrition MCP ist ein kostenloser Model Context Protocol (MCP) Server, mit dem du Mahlzeiten, Kalorien, Makros und deine Ernährungshistorie im natürlichen Gespräch mit Claude oder ChatGPT erfasst. Statt in eine klassische App zu tippen, sagst du deiner KI, was du gegessen hast, und sie erfasst alles für dich.",
        },
        {
            question: "Was ist das Model Context Protocol (MCP)?",
            visibleHtml:
                "Das Model Context Protocol ist ein offener Standard, der es KI-Assistenten wie Claude und ChatGPT ermöglicht, sich mit externen Werkzeugen und Datenquellen zu verbinden. Ein MCP-Server stellt bestimmte Fähigkeiten bereit — hier: Ernährungs-Tracking —, die die KI während eines Gesprächs nutzen kann. Man kann es sich wie ein Plugin-System für KI-Assistenten vorstellen.",
        },
        {
            // The visible answer deliberately omits the server URL (already
            // stated elsewhere on the page); the JSON-LD answer, read
            // standalone by search engines, states it explicitly — same
            // divergence as the English source's "Does it work with
            // ChatGPT?" entry.
            question: "Funktioniert es mit ChatGPT?",
            visibleHtml:
                "Ja. Öffne in ChatGPT im Web Settings → Apps, erstelle eine benutzerdefinierte App mit der Server-URL über OAuth und melde dich an. Es funktioniert mit jedem ChatGPT-Plan.",
            jsonLdText:
                "Ja. Öffne in ChatGPT im Web Settings → Apps, erstelle eine benutzerdefinierte App mit der Server-URL https://nutrition-mcp.com/mcp über OAuth und melde dich an. Es funktioniert mit jedem ChatGPT-Plan.",
        },
        {
            question: "Welche anderen Clients werden unterstützt?",
            visibleHtml:
                "Jeder MCP-Client, der OAuth 2.0 mit PKCE unterstützt — darunter Claude.ai, die Claude-Desktop- und -Mobil-Apps, Claude Code, Cursor, Windsurf und VS Code.",
        },
        {
            question: "Kann ich es selbst hosten?",
            visibleHtml:
                'Ja. Nutrition MCP ist quelloffen (MIT-Lizenz). Du kannst deine eigene Instanz mit deinem eigenen Supabase-Projekt betreiben — das <a href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer">GitHub-Repository</a> enthält eine vollständige Anleitung zum Selbst-Hosten und ein Dockerfile.',
        },
        {
            question: "Ist Nutrition MCP kostenlos?",
            visibleHtml:
                "Ja, es ist komplett kostenlos — keine Premium-Stufen, keine Werbung, keine versteckten Kosten. Du brauchst nur ein Claude- oder ChatGPT-Konto, um dich zu verbinden. Spenden auf Patreon helfen, die Serverkosten zu decken.",
        },
        {
            question: "Was kann ich erfassen?",
            visibleHtml:
                "Kalorien, Protein, Kohlenhydrate, Fett, Ballaststoffe, Gesamtzucker und Wasser für jeden Eintrag — beschrieben in normaler Sprache oder über einen Produkt-Barcode via Open Food Facts abgerufen. Koffein wird ebenfalls erfasst, in Milligramm, der Einheit, die jedes Etikett verwendet, und es liefert keine Kalorien. Auch Alkohol wird erfasst, in Gramm reinen Alkohols, sobald du das aktivierst. Du kannst außerdem dein Körpergewicht in kg oder lb erfassen und Trends zu einem Zielgewicht verfolgen. Sieh dir Tagesübersichten an, frag Mahlzeiten nach Datumsbereich ab, ändere oder lösche vergangene Einträge, leg Ziele fest und beobachte Trends über die Zeit.",
        },
        {
            question: "Wird Alkohol erfasst?",
            visibleHtml:
                "Nur wenn du es aktivierst — die Alkohol-Erfassung ist standardmäßig ausgeschaltet. Eingeschaltet werden Getränke in Gramm reinen Alkohols erfasst und wahlweise als US-Standard-Drinks oder UK-Einheiten angezeigt. Nichts leitet Alkohol stellvertretend für dich ab: Er stammt aus einem Getränk, das du einträgst, oder aus einer Alkohol-Spalte in einer importierten Datei. Schaltest du es wieder aus, wird Alkohol in Mahlzeiten, Zielen und Übersichten ausgeblendet, und der Importer liest die Alkohol-Spalte nicht mehr — das ist kein Löschschalter, und dein CSV-Export enthält immer, was du erfasst hast.",
        },
        {
            question:
                "Kann ich meine Historie aus MyFitnessPal oder einer anderen App importieren?",
            visibleHtml:
                "Ja. Bitte um den Import deiner Historie, und ein Importer öffnet sich im Chat: Du wählst die CSV, die deine alte App exportiert hat, prüfst, wie ihre Spalten zugeordnet werden, und siehst, was hinzugefügt wird, bevor du bestätigst. Exporte von MyFitnessPal, Cronometer, Lose It! und MacroFactor werden automatisch erkannt, und jede andere CSV funktioniert, indem du die Spalten selbst zuordnest. Dein Browser liest die Datei, die KI tippt deine Zeilen also nie ab. In Clients ohne In-Chat-Panels kannst du deinen Export stattdessen einfügen — und ein zweiter Import derselben Datei erzeugt keine Duplikate.",
        },
        {
            question: "Sind meine Daten privat?",
            visibleHtml:
                "Deine Daten werden sicher gespeichert und mit deinem persönlichen Konto verknüpft. Nur du kannst über deine authentifizierte Sitzung auf deine Ernährungshistorie zugreifen. Nutrition MCP verkauft oder teilt deine Daten nicht, und du kannst dein Konto und alle Daten jederzeit löschen.",
        },
    ],
};
