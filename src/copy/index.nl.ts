// Dutch (nl) translation of IndexDoc for the landing page. See
// src/copy/index.ts for the full type shape and the reasoning behind
// keeping the hero chat demo / "try saying" slides as trusted HTML
// blocks. The markup, CSS classes, data attributes, and all decorative
// SVG paths below are copied verbatim from the English source — only the
// human-readable text (dialogue and illustrative widget-chrome labels)
// is translated.

import type { IndexDoc } from "./index.js";

const HERO_CHIPS_HTML = `
                            <span class="chip chip-1"
                                ><i style="--c: var(--cal)"></i
                                ><b>+340</b> kcal</span
                            >
                            <span class="chip chip-2"
                                ><i style="--c: #8b5cf6"></i
                                ><b>20 g</b> eiwit</span
                            >
                            <span class="chip chip-3"
                                ><i style="--c: #10b981"></i
                                ><b>30 g</b> koolhydraten</span
                            >
                            <span class="chip chip-4"
                                ><i style="--c: #0ea5e9"></i
                                ><b>500 ml</b> water</span
                            >`;

const HERO_CHAT_HTML = `
                                <div class="cw-header">
                                    <span class="cw-avatar"
                                        ><i class="fa-solid fa-apple-whole"></i
                                    ></span>
                                    <span class="cw-title">Nutrition MCP</span>
                                    <span class="cw-status">online</span>
                                </div>
                                <div class="cw-body">
                                    <div class="chat-thread">
                                        <div class="msg msg-user">
                                            Twee eieren, volkoren toast en een
                                            koffie als ontbijt
                                        </div>

                                        <div class="msg msg-ai">
                                            <div class="wdg">
                                                <div class="wdg-head">
                                                    <div class="wdg-title">
                                                        Maaltijd gelogd
                                                    </div>
                                                    <div class="wdg-sub">
                                                        Twee eieren, toast &amp;
                                                        koffie · ontbijt
                                                    </div>
                                                    <div
                                                        class="wdg-meta wdg-kcal"
                                                    >
                                                        +340 kcal
                                                    </div>
                                                </div>
                                                <div class="wdg-strip">
                                                    <div class="wdg-srow">
                                                        <div class="wdg-cal">
                                                            <div
                                                                class="wdg-gauge"
                                                            >
                                                                <div
                                                                    class="wdg-ring"
                                                                    style="
                                                                        --c: var(
                                                                            --cal
                                                                        );
                                                                        --p: 16;
                                                                    "
                                                                ></div>
                                                                <div
                                                                    class="wdg-rc"
                                                                >
                                                                    <span
                                                                        class="wdg-rp"
                                                                        style="
                                                                            color: var(
                                                                                --cal
                                                                            );
                                                                        "
                                                                        >16%</span
                                                                    >
                                                                </div>
                                                            </div>
                                                            <div
                                                                class="wdg-caltxt"
                                                            >
                                                                <div
                                                                    class="wdg-callab"
                                                                >
                                                                    Calorieën
                                                                    vandaag
                                                                </div>
                                                                <div
                                                                    class="wdg-calline"
                                                                >
                                                                    <div
                                                                        class="wdg-calval"
                                                                    >
                                                                        340<span
                                                                            class="wdg-calgoal"
                                                                            >/
                                                                            2.100</span
                                                                        >
                                                                    </div>
                                                                    <div
                                                                        class="wdg-calleft"
                                                                    >
                                                                        1.760
                                                                        kcal
                                                                        over
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div class="wdg-grids">
                                                            <div
                                                                class="wdg-mgrid"
                                                            >
                                                                <div
                                                                    class="wdg-mtile"
                                                                >
                                                                    <div
                                                                        class="wdg-mtop"
                                                                    >
                                                                        <span
                                                                            class="wdg-mkey"
                                                                            >Eiwit</span
                                                                        >
                                                                        <span
                                                                            class="wdg-mnum"
                                                                            >20<span
                                                                                class="wdg-msub"
                                                                                >/150</span
                                                                            ></span
                                                                        >
                                                                    </div>
                                                                    <div
                                                                        class="wdg-mbar"
                                                                    >
                                                                        <div
                                                                            class="wdg-mfill"
                                                                            style="
                                                                                width: 13.3%;
                                                                                background: var(
                                                                                    --pro
                                                                                );
                                                                            "
                                                                        ></div>
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    class="wdg-mtile"
                                                                >
                                                                    <div
                                                                        class="wdg-mtop"
                                                                    >
                                                                        <span
                                                                            class="wdg-mkey"
                                                                            >Koolhydraten</span
                                                                        >
                                                                        <span
                                                                            class="wdg-mnum"
                                                                            >30<span
                                                                                class="wdg-msub"
                                                                                >/220</span
                                                                            ></span
                                                                        >
                                                                    </div>
                                                                    <div
                                                                        class="wdg-mbar"
                                                                    >
                                                                        <div
                                                                            class="wdg-mfill"
                                                                            style="
                                                                                width: 13.6%;
                                                                                background: var(
                                                                                    --car
                                                                                );
                                                                            "
                                                                        ></div>
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    class="wdg-mtile"
                                                                >
                                                                    <div
                                                                        class="wdg-mtop"
                                                                    >
                                                                        <span
                                                                            class="wdg-mkey"
                                                                            >Vet</span
                                                                        >
                                                                        <span
                                                                            class="wdg-mnum"
                                                                            >15<span
                                                                                class="wdg-msub"
                                                                                >/70</span
                                                                            ></span
                                                                        >
                                                                    </div>
                                                                    <div
                                                                        class="wdg-mbar"
                                                                    >
                                                                        <div
                                                                            class="wdg-mfill"
                                                                            style="
                                                                                width: 21.4%;
                                                                                background: var(
                                                                                    --fat
                                                                                );
                                                                            "
                                                                        ></div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div
                                                                class="wdg-mgrid wdg-lim wdg-sec"
                                                            >
                                                                <div
                                                                    class="wdg-mtile"
                                                                >
                                                                    <div
                                                                        class="wdg-mtop"
                                                                    >
                                                                        <span
                                                                            class="wdg-mkey"
                                                                            >Suiker</span
                                                                        >
                                                                        <span
                                                                            class="wdg-mnum"
                                                                            >2.5</span
                                                                        >
                                                                    </div>
                                                                    <div
                                                                        class="wdg-mbar"
                                                                    >
                                                                        <div
                                                                            class="wdg-mfill"
                                                                            style="
                                                                                width: 5.6%;
                                                                                background: var(
                                                                                    --sug
                                                                                );
                                                                            "
                                                                        ></div>
                                                                    </div>
                                                                    <div
                                                                        class="wdg-mcap"
                                                                    >
                                                                        limiet
                                                                        45 g
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    class="wdg-mtile"
                                                                >
                                                                    <div
                                                                        class="wdg-mtop"
                                                                    >
                                                                        <span
                                                                            class="wdg-mkey"
                                                                            >Cafeïne</span
                                                                        >
                                                                        <span
                                                                            class="wdg-mnum"
                                                                            >95</span
                                                                        >
                                                                    </div>
                                                                    <div
                                                                        class="wdg-mbar"
                                                                    >
                                                                        <div
                                                                            class="wdg-mfill"
                                                                            style="
                                                                                width: 23.8%;
                                                                                background: var(
                                                                                    --caf
                                                                                );
                                                                            "
                                                                        ></div>
                                                                    </div>
                                                                    <div
                                                                        class="wdg-mcap"
                                                                    >
                                                                        limiet
                                                                        400 mg
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    class="wdg-mtile"
                                                                >
                                                                    <div
                                                                        class="wdg-mtop"
                                                                    >
                                                                        <span
                                                                            class="wdg-mkey"
                                                                            >Vezels</span
                                                                        >
                                                                        <span
                                                                            class="wdg-mnum"
                                                                            >3.4</span
                                                                        >
                                                                    </div>
                                                                    <div
                                                                        class="wdg-mbar"
                                                                    >
                                                                        <div
                                                                            class="wdg-mfill"
                                                                            style="
                                                                                width: 11.3%;
                                                                                background: var(
                                                                                    --fib
                                                                                );
                                                                            "
                                                                        ></div>
                                                                    </div>
                                                                    <div
                                                                        class="wdg-mcap"
                                                                    >
                                                                        van 30 g
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div
                                                                class="wdg-mhint"
                                                                aria-hidden="true"
                                                            >
                                                                Tik op een
                                                                waarde voor de
                                                                maaltijden
                                                                erachter
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            Gedaan — toegevoegd aan het
                                            ontbijt: twee eieren, toast en een
                                            koffie. Dat is ongeveer 340 kcal
                                            (20g eiwit, 30g koolhydraten, 15g
                                            vet, 3.4g vezels), plus 95mg
                                            cafeïne van de koffie.
                                        </div>

                                        <div class="msg msg-user">
                                            Hoe ontwikkelt mijn gewicht zich?
                                        </div>

                                        <div class="msg msg-ai">
                                            <div class="wdg">
                                                <div class="wdg-head wdg-mid">
                                                    <div class="wdg-title">
                                                        Gewicht
                                                    </div>
                                                    <div
                                                        class="wdg-seg"
                                                        aria-hidden="true"
                                                    >
                                                        <span
                                                            class="wdg-seg-btn wdg-on"
                                                            >7</span
                                                        >
                                                        <span
                                                            class="wdg-seg-btn"
                                                            >14</span
                                                        >
                                                        <span
                                                            class="wdg-seg-btn"
                                                            >30</span
                                                        >
                                                    </div>
                                                </div>
                                                <div class="wdg-wmain">
                                                    <div class="wdg-wnow">
                                                        <div class="wdg-wtag">
                                                            Laatste
                                                        </div>
                                                        <div class="wdg-wval">
                                                            74.5<span
                                                                class="wdg-wunit"
                                                                >kg</span
                                                            >
                                                        </div>
                                                        <div
                                                            class="wdg-wdelta"
                                                            style="
                                                                color: var(
                                                                    --accent
                                                                );
                                                            "
                                                        >
                                                            −0.6 kg sinds 5 jul
                                                        </div>
                                                    </div>
                                                    <svg
                                                        class="wdg-wchart"
                                                        viewBox="0 0 300 62"
                                                        role="img"
                                                        aria-label="Gewicht van 5 jul tot 11 jul, laatste 74.5 kg"
                                                    >
                                                        <line
                                                            class="wdg-goalline"
                                                            x1="5"
                                                            y1="50.4"
                                                            x2="295"
                                                            y2="50.4"
                                                        />
                                                        <path
                                                            d="M5.0 13.6 L53.3 15.4 L101.7 18.9 L150.0 17.1 L198.3 22.4 L246.7 20.6 L295.0 24.1 L295.0 57 L5.0 57 Z"
                                                            fill="var(--accent)"
                                                            opacity="0.16"
                                                        />
                                                        <path
                                                            d="M5.0 13.6 L53.3 15.4 L101.7 18.9 L150.0 17.1 L198.3 22.4 L246.7 20.6 L295.0 24.1"
                                                            fill="none"
                                                            stroke="var(--accent)"
                                                            stroke-width="2"
                                                            stroke-linejoin="round"
                                                            stroke-linecap="round"
                                                        />
                                                        <circle
                                                            cx="5.0"
                                                            cy="13.6"
                                                            r="2.6"
                                                            fill="var(--accent)"
                                                        />
                                                        <circle
                                                            cx="53.3"
                                                            cy="15.4"
                                                            r="2.6"
                                                            fill="var(--accent)"
                                                        />
                                                        <circle
                                                            cx="101.7"
                                                            cy="18.9"
                                                            r="2.6"
                                                            fill="var(--accent)"
                                                        />
                                                        <circle
                                                            cx="150.0"
                                                            cy="17.1"
                                                            r="2.6"
                                                            fill="var(--accent)"
                                                        />
                                                        <circle
                                                            cx="198.3"
                                                            cy="22.4"
                                                            r="2.6"
                                                            fill="var(--accent)"
                                                        />
                                                        <circle
                                                            cx="246.7"
                                                            cy="20.6"
                                                            r="2.6"
                                                            fill="var(--accent)"
                                                        />
                                                        <circle
                                                            cx="295.0"
                                                            cy="24.1"
                                                            r="2.6"
                                                            fill="var(--accent)"
                                                        />
                                                    </svg>
                                                </div>
                                                <div class="wdg-sec wdg-wfoot">
                                                    <span
                                                        >7 weegmomenten · 5 jul
                                                        → 11 jul</span
                                                    >
                                                    <span
                                                        ><b>Doel 73.0 kg</b> ·
                                                        nog 1.5 kg te
                                                        gaan</span
                                                    >
                                                </div>
                                            </div>
                                            Je bent deze week 0.6 kg kwijt en
                                            zit nog 1.5 kg van je doel van 73
                                            kg — je 7-daags gemiddelde daalt
                                            mooi gestaag.
                                        </div>
                                    </div>
                                </div>
                                <div class="cw-input">
                                    <span class="cw-field"
                                        >Bericht aan Nutrition…</span
                                    >
                                    <span class="cw-send"
                                        ><i class="fa-solid fa-arrow-up"></i
                                    ></span>
                                </div>`;

const SLIDE_1_HTML = `
                                            <div class="msg msg-user">
                                                Log een kip-burritobowl voor de
                                                lunch
                                            </div>
                                            <div
                                                class="typing"
                                                aria-hidden="true"
                                            >
                                                <span></span><span></span
                                                ><span></span>
                                            </div>
                                            <div class="msg msg-ai">
                                                <div class="wdg">
                                                    <div class="wdg-head">
                                                        <div class="wdg-title">
                                                            Maaltijd gelogd
                                                        </div>
                                                        <div class="wdg-sub">
                                                            Kip-burritobowl ·
                                                            lunch
                                                        </div>
                                                        <div
                                                            class="wdg-meta wdg-kcal"
                                                        >
                                                            +650 kcal
                                                        </div>
                                                    </div>
                                                    <div class="wdg-strip">
                                                        <div class="wdg-srow">
                                                            <div
                                                                class="wdg-cal"
                                                            >
                                                                <div
                                                                    class="wdg-gauge"
                                                                >
                                                                    <div
                                                                        class="wdg-ring"
                                                                        style="
                                                                            --c: var(
                                                                                --cal
                                                                            );
                                                                            --p: 47;
                                                                        "
                                                                    ></div>
                                                                    <div
                                                                        class="wdg-rc"
                                                                    >
                                                                        <span
                                                                            class="wdg-rp"
                                                                            style="
                                                                                color: var(
                                                                                    --cal
                                                                                );
                                                                            "
                                                                            >47%</span
                                                                        >
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    class="wdg-caltxt"
                                                                >
                                                                    <div
                                                                        class="wdg-callab"
                                                                    >
                                                                        Calorieën
                                                                        vandaag
                                                                    </div>
                                                                    <div
                                                                        class="wdg-calline"
                                                                    >
                                                                        <div
                                                                            class="wdg-calval"
                                                                        >
                                                                            990<span
                                                                                class="wdg-calgoal"
                                                                                >/
                                                                                2.100</span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-calleft"
                                                                        >
                                                                            1.110
                                                                            kcal
                                                                            over
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div
                                                                class="wdg-grids"
                                                            >
                                                                <div
                                                                    class="wdg-mgrid"
                                                                >
                                                                    <div
                                                                        class="wdg-mtile"
                                                                    >
                                                                        <div
                                                                            class="wdg-mtop"
                                                                        >
                                                                            <span
                                                                                class="wdg-mkey"
                                                                                >Eiwit</span
                                                                            >
                                                                            <span
                                                                                class="wdg-mnum"
                                                                                >62<span
                                                                                    class="wdg-msub"
                                                                                    >/150</span
                                                                                ></span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mbar"
                                                                        >
                                                                            <div
                                                                                class="wdg-mfill"
                                                                                style="
                                                                                    width: 41.3%;
                                                                                    background: var(
                                                                                        --pro
                                                                                    );
                                                                                "
                                                                            ></div>
                                                                        </div>
                                                                    </div>
                                                                    <div
                                                                        class="wdg-mtile"
                                                                    >
                                                                        <div
                                                                            class="wdg-mtop"
                                                                        >
                                                                            <span
                                                                                class="wdg-mkey"
                                                                                >Koolhydraten</span
                                                                            >
                                                                            <span
                                                                                class="wdg-mnum"
                                                                                >98<span
                                                                                    class="wdg-msub"
                                                                                    >/220</span
                                                                                ></span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mbar"
                                                                        >
                                                                            <div
                                                                                class="wdg-mfill"
                                                                                style="
                                                                                    width: 44.5%;
                                                                                    background: var(
                                                                                        --car
                                                                                    );
                                                                                "
                                                                            ></div>
                                                                        </div>
                                                                    </div>
                                                                    <div
                                                                        class="wdg-mtile"
                                                                    >
                                                                        <div
                                                                            class="wdg-mtop"
                                                                        >
                                                                            <span
                                                                                class="wdg-mkey"
                                                                                >Vet</span
                                                                            >
                                                                            <span
                                                                                class="wdg-mnum"
                                                                                >37<span
                                                                                    class="wdg-msub"
                                                                                    >/70</span
                                                                                ></span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mbar"
                                                                        >
                                                                            <div
                                                                                class="wdg-mfill"
                                                                                style="
                                                                                    width: 52.9%;
                                                                                    background: var(
                                                                                        --fat
                                                                                    );
                                                                                "
                                                                            ></div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    class="wdg-mgrid wdg-lim wdg-sec"
                                                                >
                                                                    <div
                                                                        class="wdg-mtile"
                                                                    >
                                                                        <div
                                                                            class="wdg-mtop"
                                                                        >
                                                                            <span
                                                                                class="wdg-mkey"
                                                                                >Suiker</span
                                                                            >
                                                                            <span
                                                                                class="wdg-mnum"
                                                                                >6.5</span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mbar"
                                                                        >
                                                                            <div
                                                                                class="wdg-mfill"
                                                                                style="
                                                                                    width: 14.4%;
                                                                                    background: var(
                                                                                        --sug
                                                                                    );
                                                                                "
                                                                            ></div>
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mcap"
                                                                        >
                                                                            limiet
                                                                            45 g
                                                                        </div>
                                                                    </div>
                                                                    <div
                                                                        class="wdg-mtile"
                                                                    >
                                                                        <div
                                                                            class="wdg-mtop"
                                                                        >
                                                                            <span
                                                                                class="wdg-mkey"
                                                                                >Cafeïne</span
                                                                            >
                                                                            <span
                                                                                class="wdg-mnum"
                                                                                >95</span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mbar"
                                                                        >
                                                                            <div
                                                                                class="wdg-mfill"
                                                                                style="
                                                                                    width: 23.8%;
                                                                                    background: var(
                                                                                        --caf
                                                                                    );
                                                                                "
                                                                            ></div>
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mcap"
                                                                        >
                                                                            limiet
                                                                            400
                                                                            mg
                                                                        </div>
                                                                    </div>
                                                                    <div
                                                                        class="wdg-mtile"
                                                                    >
                                                                        <div
                                                                            class="wdg-mtop"
                                                                        >
                                                                            <span
                                                                                class="wdg-mkey"
                                                                                >Vezels</span
                                                                            >
                                                                            <span
                                                                                class="wdg-mnum"
                                                                                >15.4</span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mbar"
                                                                        >
                                                                            <div
                                                                                class="wdg-mfill"
                                                                                style="
                                                                                    width: 51.3%;
                                                                                    background: var(
                                                                                        --fib
                                                                                    );
                                                                                "
                                                                            ></div>
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mcap"
                                                                        >
                                                                            van
                                                                            30 g
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    class="wdg-mhint"
                                                                    aria-hidden="true"
                                                                >
                                                                    Tik op een
                                                                    waarde voor
                                                                    de
                                                                    maaltijden
                                                                    erachter
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div
                                                            class="wdg-wrow wdg-sec"
                                                        >
                                                            <span
                                                                class="wdg-wlab"
                                                                ><span
                                                                    class="wdg-dot"
                                                                    style="
                                                                        background: var(
                                                                            --wat
                                                                        );
                                                                    "
                                                                ></span
                                                                >Water</span
                                                            >
                                                            <div
                                                                class="wdg-mbar"
                                                            >
                                                                <div
                                                                    class="wdg-mfill"
                                                                    style="
                                                                        width: 48%;
                                                                        background: var(
                                                                            --wat
                                                                        );
                                                                    "
                                                                ></div>
                                                            </div>
                                                            <span
                                                                class="wdg-wnum"
                                                                >1.2<span
                                                                    class="wdg-wsub"
                                                                    >/2.5
                                                                    L</span
                                                                ></span
                                                            >
                                                        </div>
                                                    </div>
                                                </div>
                                                Gelukt — een kip-burritobowl
                                                toegevoegd aan de lunch,
                                                ongeveer 650 kcal (42g eiwit,
                                                68g koolhydraten, 22g vet) en
                                                12g vezels uit de bonen.
                                            </div>`;

const SLIDE_2_HTML = `
                                            <div
                                                class="msg-img"
                                                aria-hidden="true"
                                            >
                                                <svg
                                                    viewBox="0 0 220 150"
                                                    class="chat-photo"
                                                    role="img"
                                                    aria-label="Foto van een bord met avondeten"
                                                >
                                                    <rect
                                                        width="220"
                                                        height="150"
                                                        fill="#efe9df"
                                                    />
                                                    <ellipse
                                                        cx="110"
                                                        cy="82"
                                                        rx="72"
                                                        ry="52"
                                                        fill="#fbfaf7"
                                                    />
                                                    <ellipse
                                                        cx="110"
                                                        cy="82"
                                                        rx="72"
                                                        ry="52"
                                                        fill="none"
                                                        stroke="#e6e0d3"
                                                        stroke-width="2.5"
                                                    />
                                                    <ellipse
                                                        cx="110"
                                                        cy="82"
                                                        rx="58"
                                                        ry="41"
                                                        fill="none"
                                                        stroke="#efe9df"
                                                        stroke-width="1.5"
                                                    />
                                                    <ellipse
                                                        cx="136"
                                                        cy="64"
                                                        rx="28"
                                                        ry="19"
                                                        fill="#f3efe6"
                                                    />
                                                    <ellipse
                                                        cx="136"
                                                        cy="64"
                                                        rx="28"
                                                        ry="19"
                                                        fill="none"
                                                        stroke="#e7e1d4"
                                                        stroke-width="1"
                                                    />
                                                    <g fill="#ffffff">
                                                        <circle
                                                            cx="126"
                                                            cy="60"
                                                            r="1.6"
                                                        />
                                                        <circle
                                                            cx="138"
                                                            cy="58"
                                                            r="1.6"
                                                        />
                                                        <circle
                                                            cx="146"
                                                            cy="66"
                                                            r="1.6"
                                                        />
                                                        <circle
                                                            cx="132"
                                                            cy="70"
                                                            r="1.6"
                                                        />
                                                        <circle
                                                            cx="142"
                                                            cy="68"
                                                            r="1.6"
                                                        />
                                                    </g>
                                                    <g
                                                        transform="rotate(-16 86 92)"
                                                    >
                                                        <rect
                                                            x="58"
                                                            y="80"
                                                            width="56"
                                                            height="26"
                                                            rx="9"
                                                            fill="#e0916b"
                                                        />
                                                        <rect
                                                            x="64"
                                                            y="86"
                                                            width="44"
                                                            height="3"
                                                            rx="1.5"
                                                            fill="#edb293"
                                                        />
                                                        <rect
                                                            x="64"
                                                            y="92"
                                                            width="44"
                                                            height="3"
                                                            rx="1.5"
                                                            fill="#edb293"
                                                        />
                                                        <rect
                                                            x="64"
                                                            y="98"
                                                            width="44"
                                                            height="3"
                                                            rx="1.5"
                                                            fill="#edb293"
                                                        />
                                                    </g>
                                                    <g>
                                                        <rect
                                                            x="128"
                                                            y="98"
                                                            width="4"
                                                            height="12"
                                                            rx="2"
                                                            fill="#9ab98a"
                                                        />
                                                        <circle
                                                            cx="124"
                                                            cy="98"
                                                            r="10"
                                                            fill="#5f8f4e"
                                                        />
                                                        <circle
                                                            cx="136"
                                                            cy="95"
                                                            r="8.5"
                                                            fill="#6fa35d"
                                                        />
                                                        <circle
                                                            cx="133"
                                                            cy="105"
                                                            r="7.5"
                                                            fill="#537f44"
                                                        />
                                                        <circle
                                                            cx="121"
                                                            cy="106"
                                                            r="6.5"
                                                            fill="#6a9a58"
                                                        />
                                                    </g>
                                                </svg>
                                            </div>
                                            <div class="msg msg-user">
                                                Dit is mijn avondeten — wat zit
                                                erin?
                                            </div>
                                            <div
                                                class="typing"
                                                aria-hidden="true"
                                            >
                                                <span></span><span></span
                                                ><span></span>
                                            </div>
                                            <div class="msg msg-ai">
                                                Dat lijkt op gegrilde zalm met
                                                rijst en broccoli — gelogd bij
                                                het avondeten, ongeveer 540
                                                kcal (38g eiwit, 45g
                                                koolhydraten, 20g vet).
                                            </div>`;

const SLIDE_3_HTML = `
                                            <div
                                                class="msg-img"
                                                aria-hidden="true"
                                            >
                                                <svg
                                                    viewBox="0 0 220 150"
                                                    class="chat-photo"
                                                    role="img"
                                                    aria-label="Foto van een productbarcode"
                                                >
                                                    <rect
                                                        width="220"
                                                        height="150"
                                                        fill="#efe9df"
                                                    />
                                                    <rect
                                                        x="40"
                                                        y="32"
                                                        width="140"
                                                        height="86"
                                                        rx="12"
                                                        fill="#ffffff"
                                                        stroke="#e6e0d3"
                                                        stroke-width="2"
                                                    />
                                                    <g>
                                                        <rect
                                                            x="53"
                                                            y="50"
                                                            width="3"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="58.6"
                                                            y="50"
                                                            width="1"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="62.2"
                                                            y="50"
                                                            width="2"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="66.8"
                                                            y="50"
                                                            width="1"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="70.39999999999999"
                                                            y="50"
                                                            width="1"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="73.99999999999999"
                                                            y="50"
                                                            width="3"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="79.59999999999998"
                                                            y="50"
                                                            width="2"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="84.19999999999997"
                                                            y="50"
                                                            width="1"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="87.79999999999997"
                                                            y="50"
                                                            width="2"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="92.39999999999996"
                                                            y="50"
                                                            width="1"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="95.99999999999996"
                                                            y="50"
                                                            width="3"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="101.59999999999995"
                                                            y="50"
                                                            width="1"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="105.19999999999995"
                                                            y="50"
                                                            width="1"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="108.79999999999994"
                                                            y="50"
                                                            width="2"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="113.39999999999993"
                                                            y="50"
                                                            width="2"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="117.99999999999993"
                                                            y="50"
                                                            width="1"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="121.59999999999992"
                                                            y="50"
                                                            width="3"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="127.19999999999992"
                                                            y="50"
                                                            width="1"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="130.79999999999993"
                                                            y="50"
                                                            width="2"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="135.39999999999992"
                                                            y="50"
                                                            width="1"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="138.99999999999991"
                                                            y="50"
                                                            width="1"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="142.5999999999999"
                                                            y="50"
                                                            width="2"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="147.1999999999999"
                                                            y="50"
                                                            width="3"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="152.7999999999999"
                                                            y="50"
                                                            width="1"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                    </g>
                                                    <text
                                                        x="110"
                                                        y="108"
                                                        text-anchor="middle"
                                                        font-family="ui-monospace, monospace"
                                                        font-size="10"
                                                        letter-spacing="2"
                                                        fill="#9a9a9f"
                                                    >
                                                        0 12345 67890
                                                    </text>
                                                </svg>
                                            </div>
                                            <div class="msg msg-user">
                                                Log dit
                                            </div>
                                            <div
                                                class="typing"
                                                aria-hidden="true"
                                            >
                                                <span></span><span></span
                                                ><span></span>
                                            </div>
                                            <div class="msg msg-ai step-ask">
                                                Gevonden — Chobani Griekse
                                                yoghurt, 1 kopje: 120 kcal, 15g
                                                eiwit. Bij welke maaltijd hoort
                                                dit?
                                                <div class="meal-pick">
                                                    <span class="meal-chip"
                                                        >Ontbijt</span
                                                    >
                                                    <span class="meal-chip"
                                                        >Lunch</span
                                                    >
                                                    <span class="meal-chip"
                                                        >Diner</span
                                                    >
                                                    <span
                                                        class="meal-chip meal-pick-target"
                                                        >Snack</span
                                                    >
                                                </div>
                                            </div>
                                            <div class="msg msg-ai step-done">
                                                <div class="wdg">
                                                    <div class="wdg-head">
                                                        <div class="wdg-title">
                                                            Maaltijd gelogd
                                                        </div>
                                                        <div class="wdg-sub">
                                                            Chobani Griekse
                                                            yoghurt, 1 kopje ·
                                                            snack
                                                        </div>
                                                        <div
                                                            class="wdg-meta wdg-kcal"
                                                        >
                                                            +120 kcal
                                                        </div>
                                                    </div>
                                                    <div class="wdg-strip">
                                                        <div class="wdg-srow">
                                                            <div
                                                                class="wdg-cal"
                                                            >
                                                                <div
                                                                    class="wdg-gauge"
                                                                >
                                                                    <div
                                                                        class="wdg-ring"
                                                                        style="
                                                                            --c: var(
                                                                                --cal
                                                                            );
                                                                            --p: 73;
                                                                        "
                                                                    ></div>
                                                                    <div
                                                                        class="wdg-rc"
                                                                    >
                                                                        <span
                                                                            class="wdg-rp"
                                                                            style="
                                                                                color: var(
                                                                                    --cal
                                                                                );
                                                                            "
                                                                            >73%</span
                                                                        >
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    class="wdg-caltxt"
                                                                >
                                                                    <div
                                                                        class="wdg-callab"
                                                                    >
                                                                        Calorieën
                                                                        vandaag
                                                                    </div>
                                                                    <div
                                                                        class="wdg-calline"
                                                                    >
                                                                        <div
                                                                            class="wdg-calval"
                                                                        >
                                                                            1.540<span
                                                                                class="wdg-calgoal"
                                                                                >/
                                                                                2.100</span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-calleft"
                                                                        >
                                                                            560
                                                                            kcal
                                                                            over
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div
                                                                class="wdg-grids"
                                                            >
                                                                <div
                                                                    class="wdg-mgrid"
                                                                >
                                                                    <div
                                                                        class="wdg-mtile"
                                                                    >
                                                                        <div
                                                                            class="wdg-mtop"
                                                                        >
                                                                            <span
                                                                                class="wdg-mkey"
                                                                                >Eiwit</span
                                                                            >
                                                                            <span
                                                                                class="wdg-mnum"
                                                                                >98<span
                                                                                    class="wdg-msub"
                                                                                    >/150</span
                                                                                ></span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mbar"
                                                                        >
                                                                            <div
                                                                                class="wdg-mfill"
                                                                                style="
                                                                                    width: 65.3%;
                                                                                    background: var(
                                                                                        --pro
                                                                                    );
                                                                                "
                                                                            ></div>
                                                                        </div>
                                                                    </div>
                                                                    <div
                                                                        class="wdg-mtile"
                                                                    >
                                                                        <div
                                                                            class="wdg-mtop"
                                                                        >
                                                                            <span
                                                                                class="wdg-mkey"
                                                                                >Koolhydraten</span
                                                                            >
                                                                            <span
                                                                                class="wdg-mnum"
                                                                                >150<span
                                                                                    class="wdg-msub"
                                                                                    >/220</span
                                                                                ></span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mbar"
                                                                        >
                                                                            <div
                                                                                class="wdg-mfill"
                                                                                style="
                                                                                    width: 68.2%;
                                                                                    background: var(
                                                                                        --car
                                                                                    );
                                                                                "
                                                                            ></div>
                                                                        </div>
                                                                    </div>
                                                                    <div
                                                                        class="wdg-mtile"
                                                                    >
                                                                        <div
                                                                            class="wdg-mtop"
                                                                        >
                                                                            <span
                                                                                class="wdg-mkey"
                                                                                >Vet</span
                                                                            >
                                                                            <span
                                                                                class="wdg-mnum"
                                                                                >52<span
                                                                                    class="wdg-msub"
                                                                                    >/70</span
                                                                                ></span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mbar"
                                                                        >
                                                                            <div
                                                                                class="wdg-mfill"
                                                                                style="
                                                                                    width: 74.3%;
                                                                                    background: var(
                                                                                        --fat
                                                                                    );
                                                                                "
                                                                            ></div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    class="wdg-mgrid wdg-lim wdg-sec"
                                                                >
                                                                    <div
                                                                        class="wdg-mtile"
                                                                    >
                                                                        <div
                                                                            class="wdg-mtop"
                                                                        >
                                                                            <span
                                                                                class="wdg-mkey"
                                                                                >Suiker</span
                                                                            >
                                                                            <span
                                                                                class="wdg-mnum"
                                                                                >28.4</span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mbar"
                                                                        >
                                                                            <div
                                                                                class="wdg-mfill"
                                                                                style="
                                                                                    width: 63.1%;
                                                                                    background: var(
                                                                                        --sug
                                                                                    );
                                                                                "
                                                                            ></div>
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mcap"
                                                                        >
                                                                            limiet
                                                                            45 g
                                                                        </div>
                                                                    </div>
                                                                    <div
                                                                        class="wdg-mtile"
                                                                    >
                                                                        <div
                                                                            class="wdg-mtop"
                                                                        >
                                                                            <span
                                                                                class="wdg-mkey"
                                                                                >Cafeïne</span
                                                                            >
                                                                            <span
                                                                                class="wdg-mnum"
                                                                                >95</span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mbar"
                                                                        >
                                                                            <div
                                                                                class="wdg-mfill"
                                                                                style="
                                                                                    width: 23.8%;
                                                                                    background: var(
                                                                                        --caf
                                                                                    );
                                                                                "
                                                                            ></div>
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mcap"
                                                                        >
                                                                            limiet
                                                                            400
                                                                            mg
                                                                        </div>
                                                                    </div>
                                                                    <div
                                                                        class="wdg-mtile"
                                                                    >
                                                                        <div
                                                                            class="wdg-mtop"
                                                                        >
                                                                            <span
                                                                                class="wdg-mkey"
                                                                                >Vezels</span
                                                                            >
                                                                            <span
                                                                                class="wdg-mnum"
                                                                                >19.2</span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mbar"
                                                                        >
                                                                            <div
                                                                                class="wdg-mfill"
                                                                                style="
                                                                                    width: 64%;
                                                                                    background: var(
                                                                                        --fib
                                                                                    );
                                                                                "
                                                                            ></div>
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mcap"
                                                                        >
                                                                            van
                                                                            30 g
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    class="wdg-mhint"
                                                                    aria-hidden="true"
                                                                >
                                                                    Tik op een
                                                                    waarde voor
                                                                    de
                                                                    maaltijden
                                                                    erachter
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                Gelogd bij snacks — 120 kcal,
                                                15g eiwit, 9g suiker.
                                            </div>`;

const SLIDE_4_HTML = `
                                            <div class="msg msg-user">
                                                Zet mijn tijdzone op New York
                                            </div>
                                            <div
                                                class="typing"
                                                aria-hidden="true"
                                            >
                                                <span></span><span></span
                                                ><span></span>
                                            </div>
                                            <div class="msg msg-ai">
                                                Gedaan — je dagen gaan nu om
                                                middernacht Eastern Time over,
                                                zodat de totalen van vandaag
                                                altijd kloppen, waar je ook
                                                bent.
                                            </div>`;

const SLIDE_5_HTML = `
                                            <div class="msg msg-user">
                                                Hoe sta ik ervoor met eiwit
                                                vandaag?
                                            </div>
                                            <div
                                                class="typing"
                                                aria-hidden="true"
                                            >
                                                <span></span><span></span
                                                ><span></span>
                                            </div>
                                            <div class="msg msg-ai">
                                                Je zit op 118g van je doel van
                                                150g — nog 32g te gaan. Een
                                                kopje Griekse yoghurt of een
                                                kipfilet zou je daar brengen.
                                            </div>`;

const SLIDE_6_HTML = `
                                            <div class="msg msg-user">
                                                Laat mijn trends van deze week
                                                zien
                                            </div>
                                            <div
                                                class="typing"
                                                aria-hidden="true"
                                            >
                                                <span></span><span></span
                                                ><span></span>
                                            </div>
                                            <div class="msg msg-ai">
                                                <div class="wdg">
                                                    <div
                                                        class="wdg-head wdg-mid"
                                                    >
                                                        <div class="wdg-title">
                                                            Trends
                                                        </div>
                                                        <div
                                                            class="wdg-seg"
                                                            aria-hidden="true"
                                                        >
                                                            <span
                                                                class="wdg-seg-btn wdg-on"
                                                                >7</span
                                                            >
                                                            <span
                                                                class="wdg-seg-btn"
                                                                >14</span
                                                            >
                                                            <span
                                                                class="wdg-seg-btn"
                                                                >30</span
                                                            >
                                                        </div>
                                                    </div>
                                                    <div class="wdg-chart">
                                                        <div class="wdg-chead">
                                                            <span
                                                                class="wdg-ctitle"
                                                                >Calorieën /
                                                                dag</span
                                                            >
                                                            <span
                                                                class="wdg-cmeta"
                                                                >7/7 dagen
                                                                gelogd</span
                                                            >
                                                        </div>
                                                        <svg
                                                            viewBox="0 0 480 54"
                                                            role="img"
                                                            aria-label="Calorieën per dag over de afgelopen 7 dagen"
                                                        >
                                                            <line
                                                                class="wdg-axis"
                                                                x1="8"
                                                                y1="50"
                                                                x2="472"
                                                                y2="50"
                                                            />
                                                            <line
                                                                class="wdg-goalline"
                                                                x1="8"
                                                                y1="11.7"
                                                                x2="472"
                                                                y2="11.7"
                                                            />
                                                            <path
                                                                d="M8.0 50 L8.0 13.2 L85.3 14.7 L162.7 11.9 L240.0 15.7 L317.3 13.4 L394.7 14.4 L472.0 14.2 L472.0 50 Z"
                                                                fill="var(--cal)"
                                                                opacity="0.16"
                                                            />
                                                            <path
                                                                d="M8.0 13.2 L85.3 14.7 L162.7 11.9 L240.0 15.7 L317.3 13.4 L394.7 14.4 L472.0 14.2"
                                                                fill="none"
                                                                stroke="var(--cal)"
                                                                stroke-width="2"
                                                                stroke-linejoin="round"
                                                                stroke-linecap="round"
                                                            />
                                                            <circle
                                                                cx="8.0"
                                                                cy="13.2"
                                                                r="2.2"
                                                                fill="var(--cal)"
                                                            />
                                                            <circle
                                                                cx="85.3"
                                                                cy="14.7"
                                                                r="2.2"
                                                                fill="var(--cal)"
                                                            />
                                                            <circle
                                                                cx="162.7"
                                                                cy="11.9"
                                                                r="2.2"
                                                                fill="var(--cal)"
                                                            />
                                                            <circle
                                                                cx="240.0"
                                                                cy="15.7"
                                                                r="2.2"
                                                                fill="var(--cal)"
                                                            />
                                                            <circle
                                                                cx="317.3"
                                                                cy="13.4"
                                                                r="2.2"
                                                                fill="var(--cal)"
                                                            />
                                                            <circle
                                                                cx="394.7"
                                                                cy="14.4"
                                                                r="2.2"
                                                                fill="var(--cal)"
                                                            />
                                                            <circle
                                                                cx="472.0"
                                                                cy="14.2"
                                                                r="2.2"
                                                                fill="var(--cal)"
                                                            />
                                                        </svg>
                                                        <div class="wdg-tdates">
                                                            <span>07-05</span
                                                            ><span>07-11</span>
                                                        </div>
                                                    </div>
                                                    <div
                                                        class="wdg-strip wdg-sec"
                                                    >
                                                        <div class="wdg-srow">
                                                            <div
                                                                class="wdg-cal"
                                                            >
                                                                <div
                                                                    class="wdg-gauge"
                                                                >
                                                                    <div
                                                                        class="wdg-ring"
                                                                        style="
                                                                            --c: var(
                                                                                --cal
                                                                            );
                                                                            --p: 94;
                                                                        "
                                                                    ></div>
                                                                    <div
                                                                        class="wdg-rc"
                                                                    >
                                                                        <span
                                                                            class="wdg-rp"
                                                                            style="
                                                                                color: var(
                                                                                    --cal
                                                                                );
                                                                            "
                                                                            >94%</span
                                                                        >
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    class="wdg-caltxt"
                                                                >
                                                                    <div
                                                                        class="wdg-callab"
                                                                    >
                                                                        7-daags
                                                                        gem. ·
                                                                        alle
                                                                        dagen
                                                                    </div>
                                                                    <div
                                                                        class="wdg-calline"
                                                                    >
                                                                        <div
                                                                            class="wdg-calval"
                                                                        >
                                                                            1.980<span
                                                                                class="wdg-calgoal"
                                                                                >/
                                                                                2.100</span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-calleft"
                                                                        >
                                                                            120
                                                                            kcal
                                                                            onder
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div
                                                                class="wdg-grids"
                                                            >
                                                                <div
                                                                    class="wdg-mgrid"
                                                                >
                                                                    <div
                                                                        class="wdg-mtile"
                                                                    >
                                                                        <div
                                                                            class="wdg-mtop"
                                                                        >
                                                                            <span
                                                                                class="wdg-mkey"
                                                                                >Eiwit</span
                                                                            >
                                                                            <span
                                                                                class="wdg-mnum"
                                                                                >148<span
                                                                                    class="wdg-msub"
                                                                                    >/150</span
                                                                                ></span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mbar"
                                                                        >
                                                                            <div
                                                                                class="wdg-mfill"
                                                                                style="
                                                                                    width: 98.7%;
                                                                                    background: var(
                                                                                        --pro
                                                                                    );
                                                                                "
                                                                            ></div>
                                                                        </div>
                                                                    </div>
                                                                    <div
                                                                        class="wdg-mtile"
                                                                    >
                                                                        <div
                                                                            class="wdg-mtop"
                                                                        >
                                                                            <span
                                                                                class="wdg-mkey"
                                                                                >Koolhydraten</span
                                                                            >
                                                                            <span
                                                                                class="wdg-mnum"
                                                                                >205<span
                                                                                    class="wdg-msub"
                                                                                    >/220</span
                                                                                ></span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mbar"
                                                                        >
                                                                            <div
                                                                                class="wdg-mfill"
                                                                                style="
                                                                                    width: 93.2%;
                                                                                    background: var(
                                                                                        --car
                                                                                    );
                                                                                "
                                                                            ></div>
                                                                        </div>
                                                                    </div>
                                                                    <div
                                                                        class="wdg-mtile"
                                                                    >
                                                                        <div
                                                                            class="wdg-mtop"
                                                                        >
                                                                            <span
                                                                                class="wdg-mkey"
                                                                                >Vet</span
                                                                            >
                                                                            <span
                                                                                class="wdg-mnum"
                                                                                >66<span
                                                                                    class="wdg-msub"
                                                                                    >/70</span
                                                                                ></span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mbar"
                                                                        >
                                                                            <div
                                                                                class="wdg-mfill"
                                                                                style="
                                                                                    width: 94.3%;
                                                                                    background: var(
                                                                                        --fat
                                                                                    );
                                                                                "
                                                                            ></div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    class="wdg-mgrid wdg-lim wdg-sec"
                                                                >
                                                                    <div
                                                                        class="wdg-mtile"
                                                                    >
                                                                        <div
                                                                            class="wdg-mtop"
                                                                        >
                                                                            <span
                                                                                class="wdg-mkey"
                                                                                >Suiker</span
                                                                            >
                                                                            <span
                                                                                class="wdg-mnum"
                                                                                >38.2</span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mbar"
                                                                        >
                                                                            <div
                                                                                class="wdg-mfill"
                                                                                style="
                                                                                    width: 84.9%;
                                                                                    background: var(
                                                                                        --sug
                                                                                    );
                                                                                "
                                                                            ></div>
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mcap"
                                                                        >
                                                                            limiet
                                                                            45 g
                                                                        </div>
                                                                    </div>
                                                                    <div
                                                                        class="wdg-mtile"
                                                                    >
                                                                        <div
                                                                            class="wdg-mtop"
                                                                        >
                                                                            <span
                                                                                class="wdg-mkey"
                                                                                >Cafeïne</span
                                                                            >
                                                                            <span
                                                                                class="wdg-mnum"
                                                                                >180</span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mbar"
                                                                        >
                                                                            <div
                                                                                class="wdg-mfill"
                                                                                style="
                                                                                    width: 45%;
                                                                                    background: var(
                                                                                        --caf
                                                                                    );
                                                                                "
                                                                            ></div>
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mcap"
                                                                        >
                                                                            limiet
                                                                            400
                                                                            mg
                                                                        </div>
                                                                    </div>
                                                                    <div
                                                                        class="wdg-mtile"
                                                                    >
                                                                        <div
                                                                            class="wdg-mtop"
                                                                        >
                                                                            <span
                                                                                class="wdg-mkey"
                                                                                >Vezels</span
                                                                            >
                                                                            <span
                                                                                class="wdg-mnum"
                                                                                >26.8</span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mbar"
                                                                        >
                                                                            <div
                                                                                class="wdg-mfill"
                                                                                style="
                                                                                    width: 89.3%;
                                                                                    background: var(
                                                                                        --fib
                                                                                    );
                                                                                "
                                                                            ></div>
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mcap"
                                                                        >
                                                                            van
                                                                            30 g
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div
                                                            class="wdg-wrow wdg-sec"
                                                        >
                                                            <span
                                                                class="wdg-wlab"
                                                                ><span
                                                                    class="wdg-dot"
                                                                    style="
                                                                        background: var(
                                                                            --wat
                                                                        );
                                                                    "
                                                                ></span
                                                                >Water</span
                                                            >
                                                            <div
                                                                class="wdg-mbar"
                                                            >
                                                                <div
                                                                    class="wdg-mfill"
                                                                    style="
                                                                        width: 84%;
                                                                        background: var(
                                                                            --wat
                                                                        );
                                                                    "
                                                                ></div>
                                                            </div>
                                                            <span
                                                                class="wdg-wnum"
                                                                >2.1<span
                                                                    class="wdg-wsub"
                                                                    >/2.5
                                                                    L</span
                                                                ></span
                                                            >
                                                        </div>
                                                    </div>
                                                </div>
                                                Je zit gemiddeld op 1.980 kcal
                                                per dag — 120 onder je doel,
                                                met suiker en cafeïne allebei
                                                ruim binnen je limieten.
                                                Vezels zitten gemiddeld op
                                                26.8 g, net onder je doel van
                                                30 g.
                                            </div>`;

const SLIDE_7_HTML = `
                                            <div class="msg msg-user">
                                                Log mijn gewicht, 74.5 kg
                                            </div>
                                            <div
                                                class="typing"
                                                aria-hidden="true"
                                            >
                                                <span></span><span></span
                                                ><span></span>
                                            </div>
                                            <div class="msg msg-ai">
                                                <div class="wdg">
                                                    <div
                                                        class="wdg-head wdg-mid"
                                                    >
                                                        <div class="wdg-title">
                                                            Gewicht
                                                        </div>
                                                        <div
                                                            class="wdg-seg"
                                                            aria-hidden="true"
                                                        >
                                                            <span
                                                                class="wdg-seg-btn wdg-on"
                                                                >7</span
                                                            >
                                                            <span
                                                                class="wdg-seg-btn"
                                                                >14</span
                                                            >
                                                            <span
                                                                class="wdg-seg-btn"
                                                                >30</span
                                                            >
                                                        </div>
                                                    </div>
                                                    <div class="wdg-wmain">
                                                        <div class="wdg-wnow">
                                                            <div
                                                                class="wdg-wtag"
                                                            >
                                                                Laatste
                                                            </div>
                                                            <div
                                                                class="wdg-wval"
                                                            >
                                                                74.5<span
                                                                    class="wdg-wunit"
                                                                    >kg</span
                                                                >
                                                            </div>
                                                            <div
                                                                class="wdg-wdelta"
                                                                style="
                                                                    color: var(
                                                                        --accent
                                                                    );
                                                                "
                                                            >
                                                                −0.6 kg sinds 5
                                                                jul
                                                            </div>
                                                        </div>
                                                        <svg
                                                            class="wdg-wchart"
                                                            viewBox="0 0 300 62"
                                                            role="img"
                                                            aria-label="Gewicht van 5 jul tot 11 jul, laatste 74.5 kg"
                                                        >
                                                            <line
                                                                class="wdg-goalline"
                                                                x1="5"
                                                                y1="50.4"
                                                                x2="295"
                                                                y2="50.4"
                                                            />
                                                            <path
                                                                d="M5.0 13.6 L53.3 15.4 L101.7 18.9 L150.0 17.1 L198.3 22.4 L246.7 20.6 L295.0 24.1 L295.0 57 L5.0 57 Z"
                                                                fill="var(--accent)"
                                                                opacity="0.16"
                                                            />
                                                            <path
                                                                d="M5.0 13.6 L53.3 15.4 L101.7 18.9 L150.0 17.1 L198.3 22.4 L246.7 20.6 L295.0 24.1"
                                                                fill="none"
                                                                stroke="var(--accent)"
                                                                stroke-width="2"
                                                                stroke-linejoin="round"
                                                                stroke-linecap="round"
                                                            />
                                                            <circle
                                                                cx="5.0"
                                                                cy="13.6"
                                                                r="2.6"
                                                                fill="var(--accent)"
                                                            />
                                                            <circle
                                                                cx="53.3"
                                                                cy="15.4"
                                                                r="2.6"
                                                                fill="var(--accent)"
                                                            />
                                                            <circle
                                                                cx="101.7"
                                                                cy="18.9"
                                                                r="2.6"
                                                                fill="var(--accent)"
                                                            />
                                                            <circle
                                                                cx="150.0"
                                                                cy="17.1"
                                                                r="2.6"
                                                                fill="var(--accent)"
                                                            />
                                                            <circle
                                                                cx="198.3"
                                                                cy="22.4"
                                                                r="2.6"
                                                                fill="var(--accent)"
                                                            />
                                                            <circle
                                                                cx="246.7"
                                                                cy="20.6"
                                                                r="2.6"
                                                                fill="var(--accent)"
                                                            />
                                                            <circle
                                                                cx="295.0"
                                                                cy="24.1"
                                                                r="2.6"
                                                                fill="var(--accent)"
                                                            />
                                                        </svg>
                                                    </div>
                                                    <div
                                                        class="wdg-sec wdg-wfoot"
                                                    >
                                                        <span
                                                            >7 weegmomenten ·
                                                            5 jul → 11
                                                            jul</span
                                                        >
                                                        <span
                                                            ><b
                                                                >Doel 73.0
                                                                kg</b
                                                            >
                                                            · nog 1.5 kg te
                                                            gaan</span
                                                        >
                                                    </div>
                                                </div>
                                                Gelogd — je beweegt in de
                                                richting van je doel.
                                            </div>`;

export const INDEX_NL: IndexDoc = {
    title: "Nutrition MCP — AI Maaltijd- & Macrotracker voor Claude & ChatGPT",
    metaDescription:
        "Houd maaltijden, macro's, gewicht en voedingsgeschiedenis bij door met Claude of ChatGPT te praten. Gratis MCP-server voor AI-gestuurd eten loggen, barcodes scannen, calorieën tellen, gewicht bijhouden en dieet volgen.",
    ogDescription:
        "Houd maaltijden, macro's, gewicht en voedingsgeschiedenis bij door met Claude of ChatGPT te praten. Gratis MCP-server voor AI-gestuurd eten loggen, barcodes scannen en gewicht bijhouden.",
    keywords:
        "voedingstracker, maaltijdtracker, MCP-server, Claude AI, ChatGPT, calorieënteller, macrotracker, barcodescanner, eten loggen, dieettracker, gewichtstracker, gewichtslog, AI-voeding, Model Context Protocol",

    chatChrome: {
        brand: "Nutrition MCP",
        status: "online",
        inputPlaceholder: "Bericht aan Nutrition…",
    },

    hero: {
        eyebrow: "Gratis · Open source · OAuth 2.0",
        titleBeforeEm: "Houd je voeding bij door te ",
        titleEm: "praten",
        titleAfterEm: " met je AI.",
        lead: "Verbind Claude of ChatGPT en zeg gewoon wat je hebt gegeten. Calorieën en macro's, automatisch gelogd.",
        ctaPrimary: "Snel installeren",
        ctaSecondary: "Steun",
        chipsHtml: HERO_CHIPS_HTML,
        chatHtml: HERO_CHAT_HTML,
    },

    how: {
        eyebrow: "Hoe het werkt",
        title: "Drie stappen. Geen app om te leren.",
        steps: [
            {
                title: "Eén keer verbinden",
                body: "Werkt met elke AI-client die remote MCP-servers ondersteunt — Claude, ChatGPT en meer. Geen installatie, geen API-sleutels.",
            },
            {
                title: "Zeg gewoon wat je hebt gegeten",
                body: "Omschrijf het in gewone taal — of stuur een foto van je maaltijd, een screenshot van een bezorgapp, of een barcode (het product wordt online opgezocht). Macro's worden automatisch gelogd.",
            },
            {
                title: "Bijhouden & bekijken",
                body: "Vraag om dagelijkse overzichten, wekelijkse trends, voortgang op je doelen, of exporteer alles wat je hebt gelogd als CSV-bestanden — helemaal gratis.",
            },
        ],
    },

    install: {
        eyebrow: "Snel installeren",
        title: "Verbind in minder dan een minuut",
        sub: "Werkt met elke MCP-client die OAuth 2.0 met PKCE ondersteunt. Bij de eerste verbinding maak je een account aan met Google of een e-mailadres en wachtwoord; log op dezelfde manier in om je gegevens te behouden.",
        claude: {
            steps: [
                "Open <strong>Claude</strong> (web of desktop) en klik op <strong>Customize</strong> in de linkerbovenhoek.",
                "Klik op <strong>Connectors</strong>.",
                "Klik op <strong>+</strong> en daarna op <strong>Add custom connector</strong>.",
                "Geef het een naam, bijvoorbeeld <strong>Nutrition</strong>.",
                'Plak <span class="copy-url"><code>https://nutrition-mcp.com/mcp</code><button class="copy-mini" type="button" data-copy="https://nutrition-mcp.com/mcp" aria-label="Serverlink kopiëren"><i class="fa-solid fa-copy"></i></button></span> in het veld <strong>Remote MCP server URL</strong>.',
                "Klik op <strong>Add</strong>.",
                "Klik op <strong>Connect</strong> — de inlogpagina opent; ga verder met Google of log in met een e-mailadres en wachtwoord.",
                "Klaar. Het werkt meteen en verschijnt automatisch in je iOS- en Android-apps.",
            ],
            note: "Werkt op elk Claude-abonnement. Het gratis abonnement staat één gekoppelde MCP-server tegelijk toe.",
        },
        chatgpt: {
            steps: [
                "Open <strong>ChatGPT op het web</strong> → <strong>Settings</strong> → <strong>Apps</strong>.",
                "Klik onderaan de popup op <strong>Create app</strong>. Zie je die niet, zet dan <strong>Developer mode</strong> aan bij <strong>Advanced settings</strong>.",
                "Geef het een naam, bijvoorbeeld <strong>Nutrition</strong>.",
                'Plak bij <strong>Connection</strong> <span class="copy-url"><code>https://nutrition-mcp.com/mcp</code><button class="copy-mini" type="button" data-copy="https://nutrition-mcp.com/mcp" aria-label="Serverlink kopiëren"><i class="fa-solid fa-copy"></i></button></span>.',
                "Kies bij <strong>Authentication</strong> voor <strong>OAuth</strong> — laat de rest ongewijzigd.",
                'Vink <strong>"I understand and want to continue"</strong> aan.',
                "Klik op <strong>Create</strong>.",
                "Klik op <strong>Sign in with Nutrition</strong> — de inlogpagina opent; ga verder met Google of log in met een e-mailadres en wachtwoord.",
                "Klaar. Het werkt meteen en verschijnt automatisch in je iOS- en Android-apps.",
            ],
        },
        other: {
            note: "Voeg de configuratie hierboven toe aan je client (Cursor, VS Code, Claude Code en meer). Windsurf gebruikt <code>serverUrl</code> in plaats van <code>url</code>. Voer in Claude Code <code>claude mcp add --transport http nutrition https://nutrition-mcp.com/mcp</code> uit. Je client handelt de OAuth-login automatisch af.",
        },
    },

    onboarding: {
        eyebrow: "Onboarding",
        title: "Eén keer instellen — of begin gewoon te praten",
        sub: "Dit is volledig optioneel — Nutrition MCP werkt zodra je verbonden bent. Als je wilt, maken deze twee korte stappen het nauwkeuriger, maar je kunt ook meteen beginnen met loggen.",
        steps: [
            '<strong>Stel je tijdzone in</strong> — zodat dagen om middernacht in jouw tijdzone overgaan en de totalen van vandaag altijd kloppen, waar je ook bent. <span class="step-say">Zeg gewoon <q>Zet mijn tijdzone op New York</q>.</span>',
            '<strong>Stel je doelen in</strong> — dagelijkse doelen voor calorieën, macro\'s en water, plus een optioneel streefgewicht en je gewenste gewichtseenheid (kg of lb), om je voortgang tegen af te zetten. <span class="step-say">Zeg gewoon <q>Zet mijn dagelijkse doel op 2.000 calorieën en 150 g eiwit</q>.</span>',
            '<strong>Begin met loggen</strong> — zeg gewoon wat je hebt gegeten, stuur een foto of scan een barcode. Dat is alles. <span class="step-say">Zeg gewoon <q>Ik had havermout met bessen als ontbijt</q>.</span>',
        ],
        note: "Dit alles is optioneel. Je kunt het nu doen, later, of nooit — begin gewoon met loggen en stel dit in wanneer je wilt.",
        toolsCta: {
            heading: "Benieuwd wat het écht allemaal kan?",
            body: "Bekijk alle 38 tools — loggen, barcodes, water, gewicht, doelen en trends — met een beschrijving en een voorbeeldzin voor elk.",
            arrow: "Bekijk de tools",
        },
    },

    try: {
        eyebrow: "Probeer te zeggen",
        title: "Praat er gewoon tegen.",
        sub: "Een paar dingen die je kunt doen — gewoon door te praten.",
        prevLabel: "Vorig voorbeeld",
        nextLabel: "Volgend voorbeeld",
        exampleLabel: "Voorbeeld",
        slides: [
            { html: SLIDE_1_HTML },
            { html: SLIDE_2_HTML },
            { html: SLIDE_3_HTML },
            { html: SLIDE_4_HTML },
            { html: SLIDE_5_HTML },
            { html: SLIDE_6_HTML },
            { html: SLIDE_7_HTML },
        ],
    },

    stats: {
        eyebrow: "Tot nu toe samen bijgehouden",
        title: "Een groeiend wereldwijd voedingslog",
        factsTitle: "Voedingswaarden",
        servingPrefix: "Portiegrootte ",
        servingBold: "iedereen, tot nu toe",
        liveLabel: "Live",
        calLabel: "Calorieën ",
        calSmall: "bijgehouden, all-time",
        calCaption: "Calorieën bijgehouden",
        rowFoodLogs: "Voedingslogs",
        rowProtein: "Eiwit",
        rowCarbs: "Koolhydraten",
        rowFat: "Vet",
        foot: "Totalen over alle accounts, bijgewerkt zodra maaltijden worden gelogd. Individuele gegevens worden nooit getoond.",
        mapPrefix: "Gelogd in",
        mapSuffix: "tijdzones wereldwijd",
        mapAriaLabel:
            "Wereldkaart met de tijdzones waarin Nutrition MCP wordt gebruikt",
    },

    features: {
        eyebrow: "Alles, gewoon door te chatten",
        title: "Wat je kunt bijhouden",
        cards: [
            {
                icon: "fa-solid fa-utensils",
                title: "Maaltijden in gewone taal",
                body: "Omschrijf wat je hebt gegeten — je AI schat calorieën, eiwit, koolhydraten, vet, vezels, totale suikers en cafeïne in milligram, en logt het.",
            },
            {
                icon: "fa-solid fa-barcode",
                title: "Scan een barcode",
                body: "Maak een foto van een productbarcode of typ hem, en haal macro's, vezels en suiker op bij Open Food Facts, geschaald naar hoeveel je hebt gegeten.",
            },
            {
                icon: "fa-solid fa-bullseye",
                title: "Doelen & voortgang",
                body: "Stel dagelijkse doelen in voor calorieën, macro's, vezels en water — plus limieten voor suiker, cafeïne en alcohol — en bekijk live je voortgang daarop.",
            },
            {
                icon: "fa-solid fa-chart-area",
                title: "Overzichten & trends",
                body: "Dagelijkse en wekelijkse uitsplitsingen, trends over 7/14/30 dagen, streaks en terugkerende maaltijdpatronen.",
            },
            {
                icon: "fa-solid fa-glass-water",
                title: "Water loggen",
                body: "Houd je hydratatie in milliliters bij naast je maaltijden en bekijk het per dag.",
            },
            {
                icon: "fa-solid fa-weight-scale",
                title: "Gewicht bijhouden",
                body: "Log je lichaamsgewicht in kg of lb, bekijk trends over 7/14/30 dagen en volg de voortgang naar een streefgewicht.",
            },
            {
                icon: "fa-solid fa-clock-four",
                title: "Tijdzonebewust",
                body: "Dagen gaan over in jouw lokale tijd, waar je ook bent in de wereld.",
            },
            {
                icon: "fa-solid fa-file-import",
                title: "Importeren uit een andere app",
                body: "Neem je maaltijdgeschiedenis over uit MyFitnessPal, Cronometer, Lose It! of MacroFactor — of elke andere CSV, door de kolommen zelf te koppelen. Jij bevestigt wat wordt toegevoegd voordat er iets wordt opgeslagen.",
            },
            {
                icon: "fa-solid fa-file-csv",
                title: "Exporteer & bezit je gegevens",
                body: "Neem alles wat je hier hebt — maaltijden, water, gewicht, doelen en profiel — mee als één ZIP met CSV-bestanden. Maaltijden zijn voorlopig het enige onderdeel dat je weer kunt importeren. Verwijder je account en gegevens wanneer je maar wilt.",
            },
        ],
    },

    why: {
        eyebrow: "Waarom Nutrition MCP",
        title: "Praten wint van tikken.",
        sub: "Scan een barcode of zeg gewoon wat je hebt gegeten — geen database om in te graven, geen aparte app om te openen.",
        oldHeading: "Traditionele apps",
        oldItems: [
            "Doorzoek een database voor elk item",
            "Corrigeer foute database-vermeldingen met de hand",
            "Weer een app, account en betaalmuur",
            "Vervelend handmatig loggen",
        ],
        newHeading: "Nutrition MCP",
        newItems: [
            "Omschrijf maaltijden in gewone taal",
            "Calorieën & macro's voor je geschat",
            "Werkt binnen Claude of ChatGPT, gratis",
            "Vraag om trends, overzichten en doelen",
        ],
        noteHtml:
            'Stap je over van een specifieke app? Bekijk hoe Nutrition MCP zich verhoudt tot <a href="/alternatives" data-link="alternatives">MyFitnessPal, Cronometer en andere trackers</a>.',
    },

    trust: [
        {
            label: "Privé, standaard",
            small: "Alleen jij kunt je gegevens zien.",
        },
        { label: "Open source", small: "Controleer het of host het zelf." },
        {
            label: "Exporteer wanneer je wilt",
            small: "Elke tabel als CSV, in één ZIP.",
        },
        {
            label: "Direct verwijderen",
            small: "Verwijder je account & gegevens.",
        },
    ],

    support: {
        eyebrow: "Steun",
        title: "Help het draaiende houden.",
        sub: "Nutrition MCP is gratis en reclamevrij. Patreon dekt de server- en databasekosten.",
        free: {
            tier: "Gratis lid",
            price: "$0",
            desc: "Blijf op de hoogte — nieuws en updates over de server, nieuwe tools, en wat eraan komt.",
            cta: "Volg op Patreon",
        },
        paid: {
            tier: "Betalend lid",
            price: "Betaal wat je wilt",
            desc: "Draag bij aan hosting- en databasekosten, zodat de server voor iedereen gratis en online blijft.",
            cta: "Word supporter",
        },
    },

    cta: {
        title: "Begin binnen een minuut met bijhouden.",
        sub: "Gratis en open source — het werkt met de AI die je al gebruikt.",
        primary: "Snel installeren",
        secondary: "Star op GitHub",
    },

    contact: {
        eyebrow: "Contact",
        title: "Vragen of feedback?",
        sub: "Een bug gevonden, een functiewens, of gewoon een vraag? Mail me rechtstreeks — ik lees elk bericht.",
        cta: "Stuur een e-mail",
    },

    faqSection: {
        eyebrow: "FAQ",
        title: "Veelgestelde vragen",
    },
    faq: [
        {
            question: "Wat is Nutrition MCP?",
            visibleHtml:
                "Nutrition MCP is een gratis Model Context Protocol (MCP)-server waarmee je maaltijden, calorieën, macro's en voedingsgeschiedenis bijhoudt via een natuurlijk gesprek met Claude of ChatGPT. In plaats van te typen in een traditionele app, vertel je je AI wat je hebt gegeten en die logt alles voor je.",
        },
        {
            question: "Wat is het Model Context Protocol (MCP)?",
            visibleHtml:
                "Het Model Context Protocol is een open standaard waarmee AI-assistenten zoals Claude en ChatGPT verbinding kunnen maken met externe tools en gegevensbronnen. Een MCP-server biedt specifieke mogelijkheden — hier voedingstracking — die de AI tijdens een gesprek kan gebruiken. Zie het als een pluginsysteem voor AI-assistenten.",
        },
        {
            // Het zichtbare antwoord laat de server-URL bewust weg (die staat
            // al elders op de pagina); het JSON-LD-antwoord, dat op zichzelf
            // door zoekmachines wordt gelezen, noemt hem expliciet. Dit
            // verschil bestond al in de Engelse bron — hier onveranderd
            // overgenomen in plaats van stilzwijgend gelijkgetrokken.
            question: "Werkt het met ChatGPT?",
            visibleHtml:
                "Ja. Open in ChatGPT op het web Settings → Apps, maak een custom app aan met de server-URL via OAuth, en log in. Het werkt op elk ChatGPT-abonnement.",
            jsonLdText:
                "Ja. Open in ChatGPT op het web Settings → Apps, maak een custom app aan met de server-URL https://nutrition-mcp.com/mcp via OAuth, en log in. Het werkt op elk ChatGPT-abonnement.",
        },
        {
            question: "Welke andere clients worden ondersteund?",
            visibleHtml:
                "Elke MCP-client die OAuth 2.0 met PKCE ondersteunt — waaronder Claude.ai, de Claude desktop- en mobiele apps, Claude Code, Cursor, Windsurf en VS Code.",
        },
        {
            question: "Kan ik het zelf hosten?",
            visibleHtml:
                'Ja. Nutrition MCP is open source (MIT). Je kunt je eigen instantie draaien met je eigen Supabase-project — de <a href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer">GitHub-repository</a> bevat een volledige zelfhostingshandleiding en een Dockerfile.',
        },
        {
            question: "Is Nutrition MCP gratis?",
            visibleHtml:
                "Ja, het is volledig gratis — geen premium-lagen, advertenties of verborgen kosten. Je hebt alleen een Claude- of ChatGPT-account nodig om te verbinden. Donaties op Patreon helpen de serverkosten te dekken.",
        },
        {
            question: "Wat kan ik bijhouden?",
            visibleHtml:
                "Calorieën, eiwit, koolhydraten, vet, vezels, totale suikers en water voor elke registratie — omschreven in gewone taal of opgehaald via een productbarcode met Open Food Facts. Cafeïne wordt ook bijgehouden, in milligram, de eenheid die elk label gebruikt, en het levert geen calorieën. Alcohol wordt ook bijgehouden, in gram zuivere ethanol, zodra je het aanzet. Je kunt ook je lichaamsgewicht loggen in kg of lb en trends volgen richting een streefgewicht. Bekijk dagelijkse overzichten, vraag maaltijden op per periode, werk eerdere registraties bij of verwijder ze, stel doelen in, en volg trends in de tijd.",
        },
        {
            question: "Houdt het alcohol bij?",
            visibleHtml:
                "Alleen als je het aanzet — alcoholregistratie staat standaard uit. Eenmaal aangezet worden drankjes vastgelegd in gram zuivere ethanol en getoond als Amerikaanse standaardglazen of Britse eenheden, wat je voorkeur heeft. Niets leidt alcohol voor je af: het komt van een drankje dat je logt of een alcoholkolom in een bestand dat je importeert. Het weer uitzetten verbergt alcohol uit je maaltijden, doelen en overzichten en zorgt dat de importer geen alcoholkolommen meer leest — het is geen verwijderschakelaar, en je CSV-export bevat altijd wat je hebt gelogd.",
        },
        {
            question:
                "Kan ik mijn geschiedenis importeren uit MyFitnessPal of een andere app?",
            visibleHtml:
                "Ja. Vraag om je geschiedenis te importeren en er opent een importvenster in de chat: je kiest de CSV die je oude app heeft geëxporteerd, controleert hoe de kolommen worden gekoppeld, en ziet wat er wordt toegevoegd voordat je bevestigt. Exports van MyFitnessPal, Cronometer, Lose It! en MacroFactor worden automatisch herkend, en elke andere CSV werkt door de kolommen zelf te koppelen. Je browser leest het bestand, dus de AI typt je regels nooit over. In clients zonder in-chat-panelen kun je je export in plaats daarvan plakken — en hetzelfde bestand twee keer importeren levert geen dubbele registraties op.",
        },
        {
            question: "Zijn mijn gegevens privé?",
            visibleHtml:
                "Je gegevens worden veilig opgeslagen en gekoppeld aan je persoonlijke account. Alleen jij hebt via je geauthenticeerde sessie toegang tot je voedingsgeschiedenis. Nutrition MCP verkoopt of deelt je gegevens niet, en je kunt je account en alle gegevens op elk moment verwijderen.",
        },
    ],
};
