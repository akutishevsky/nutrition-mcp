// Italian (it) translation of the landing page copy. See src/copy/index.ts
// for the full field-by-field documentation of this shape; this file
// mirrors its structure exactly. Decorative widget-mockup HTML blocks
// (hero chips/chat, the seven "try saying" slides) keep every class,
// data attribute, inline style, SVG path and numeric/data value byte-
// identical to the English source — only human-readable text nodes
// (dialogue, widget chrome labels) are translated, per the localization
// brief. Product UI element names quoted in the install steps (e.g.
// "Customize", "Connectors", "Create app") are left in English since
// they are literal button/menu labels in Claude's and ChatGPT's own
// interfaces, which this pass could not verify are localized into
// Italian; translating them risked giving incorrect instructions.

import type { IndexDoc } from "./index.js";

const HERO_CHIPS_HTML_IT = `
                            <span class="chip chip-1"
                                ><i style="--c: var(--cal)"></i
                                ><b>+340</b> kcal</span
                            >
                            <span class="chip chip-2"
                                ><i style="--c: #8b5cf6"></i
                                ><b>20 g</b> proteine</span
                            >
                            <span class="chip chip-3"
                                ><i style="--c: #10b981"></i
                                ><b>30 g</b> carboidrati</span
                            >
                            <span class="chip chip-4"
                                ><i style="--c: #0ea5e9"></i
                                ><b>500 ml</b> acqua</span
                            >`;
const HERO_CHAT_HTML_IT = `
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
                                            Due uova, pane integrale tostato e un caffè per colazione
                                        </div>

                                        <div class="msg msg-ai">
                                            <div class="wdg">
                                                <div class="wdg-head">
                                                    <div class="wdg-title">
                                                        Pasto registrato
                                                    </div>
                                                    <div class="wdg-sub">
                                                        Due uova, toast e caffè · colazione
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
                                                                    Calorie di oggi
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
                                                                        kcal rimanenti
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
                                                                            >Proteine</span
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
                                                                            >Carboidrati</span
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
                                                                            >Grassi</span
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
                                                                            >Zuccheri</span
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
                                                                        limite 45 g
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
                                                                            >Caffeina</span
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
                                                                        limite 400 mg
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
                                                                            >Fibre</span
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
                                                                        su 30 g
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div
                                                                class="wdg-mhint"
                                                                aria-hidden="true"
                                                            >
                                                                Tocca una metrica per vedere i pasti che la riguardano
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            Fatto — aggiunto alla colazione: due uova, toast e un caffè. Sono circa 340 kcal (20g proteine, 30g carboidrati, 15g grassi, 3.4g fibre), più 95mg di caffeina dal caffè.
                                        </div>

                                        <div class="msg msg-user">
                                            Come sta andando il mio peso?
                                        </div>

                                        <div class="msg msg-ai">
                                            <div class="wdg">
                                                <div class="wdg-head wdg-mid">
                                                    <div class="wdg-title">
                                                        Peso
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
                                                            Ultimo
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
                                                            −0.6 kg dal 5 lug
                                                        </div>
                                                    </div>
                                                    <svg
                                                        class="wdg-wchart"
                                                        viewBox="0 0 300 62"
                                                        role="img"
                                                        aria-label="Peso dal 5 lug all'11 lug, ultimo 74.5 kg"
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
                                                        >7 pesate · 5 lug → 11 lug</span
                                                    >
                                                    <span
                                                        ><b>Obiettivo 73.0 kg</b> ·
                                                        1.5 kg da perdere</span
                                                    >
                                                </div>
                                            </div>
                                            Hai perso 0.6 kg questa settimana e sei a 1.5 kg dal tuo obiettivo di 73 kg — la tua media a 7 giorni è in calo, un ottimo andamento.
                                        </div>
                                    </div>
                                </div>
                                <div class="cw-input">
                                    <span class="cw-field"
                                        >Scrivi a Nutrition…</span
                                    >
                                    <span class="cw-send"
                                        ><i class="fa-solid fa-arrow-up"></i
                                    ></span>
                                </div>`;
const SLIDE_1_HTML_IT = `
                                            <div class="msg msg-user">
                                                Registra una burrito bowl di pollo per pranzo
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
                                                            Pasto registrato
                                                        </div>
                                                        <div class="wdg-sub">
                                                            Burrito bowl di pollo · pranzo
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
                                                                        Calorie di oggi
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
                                                                            kcal rimanenti
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
                                                                                >Proteine</span
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
                                                                                >Carboidrati</span
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
                                                                                >Grassi</span
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
                                                                                >Zuccheri</span
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
                                                                            limite 45 g
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
                                                                                >Caffeina</span
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
                                                                            limite 400 mg
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
                                                                                >Fibre</span
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
                                                                            su 30 g
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    class="wdg-mhint"
                                                                    aria-hidden="true"
                                                                >
                                                                    Tocca una metrica per vedere i pasti che la riguardano
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
                                                                >Acqua</span
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
                                                Fatto — aggiunta una burrito bowl di pollo al pranzo, circa 650 kcal (42g proteine, 68g carboidrati, 22g grassi) e 12g di fibre dai fagioli.
                                            </div>`;
const SLIDE_2_HTML_IT = `
                                            <div
                                                class="msg-img"
                                                aria-hidden="true"
                                            >
                                                <svg
                                                    viewBox="0 0 220 150"
                                                    class="chat-photo"
                                                    role="img"
                                                    aria-label="Foto di un piatto di cena"
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
                                                Ecco la mia cena — cosa contiene?
                                            </div>
                                            <div
                                                class="typing"
                                                aria-hidden="true"
                                            >
                                                <span></span><span></span
                                                ><span></span>
                                            </div>
                                            <div class="msg msg-ai">
                                                Sembra salmone alla griglia con riso e broccoli — registrato a cena, circa 540 kcal (38g proteine, 45g carboidrati, 20g grassi).
                                            </div>`;
const SLIDE_3_HTML_IT = `
                                            <div
                                                class="msg-img"
                                                aria-hidden="true"
                                            >
                                                <svg
                                                    viewBox="0 0 220 150"
                                                    class="chat-photo"
                                                    role="img"
                                                    aria-label="Foto di un codice a barre di un prodotto"
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
                                                Registra questo
                                            </div>
                                            <div
                                                class="typing"
                                                aria-hidden="true"
                                            >
                                                <span></span><span></span
                                                ><span></span>
                                            </div>
                                            <div class="msg msg-ai step-ask">
                                                Trovato — yogurt greco Chobani, 1 tazza: 120 kcal, 15g proteine. A quale pasto lo aggiungo?
                                                <div class="meal-pick">
                                                    <span class="meal-chip"
                                                        >Colazione</span
                                                    >
                                                    <span class="meal-chip"
                                                        >Pranzo</span
                                                    >
                                                    <span class="meal-chip"
                                                        >Cena</span
                                                    >
                                                    <span
                                                        class="meal-chip meal-pick-target"
                                                        >Spuntino</span
                                                    >
                                                </div>
                                            </div>
                                            <div class="msg msg-ai step-done">
                                                <div class="wdg">
                                                    <div class="wdg-head">
                                                        <div class="wdg-title">
                                                            Pasto registrato
                                                        </div>
                                                        <div class="wdg-sub">
                                                            Yogurt greco Chobani, 1 tazza · spuntino
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
                                                                        Calorie di oggi
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
                                                                            kcal rimanenti
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
                                                                                >Proteine</span
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
                                                                                >Carboidrati</span
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
                                                                                >Grassi</span
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
                                                                                >Zuccheri</span
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
                                                                            limite 45 g
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
                                                                                >Caffeina</span
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
                                                                            limite 400 mg
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
                                                                                >Fibre</span
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
                                                                            su 30 g
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    class="wdg-mhint"
                                                                    aria-hidden="true"
                                                                >
                                                                    Tocca una metrica per vedere i pasti che la riguardano
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                Registrato tra gli spuntini — 120 kcal, 15g proteine, 9g zuccheri.
                                            </div>`;
const SLIDE_4_HTML_IT = `
                                            <div class="msg msg-user">
                                                Imposta il mio fuso orario su New York
                                            </div>
                                            <div
                                                class="typing"
                                                aria-hidden="true"
                                            >
                                                <span></span><span></span
                                                ><span></span>
                                            </div>
                                            <div class="msg msg-ai">
                                                Fatto — i tuoi giorni ora cambiano a mezzanotte, ora della East Coast USA, così i totali di oggi restano corretti ovunque tu sia.
                                            </div>`;
const SLIDE_5_HTML_IT = `
                                            <div class="msg msg-user">
                                                Come sto andando con le proteine oggi?
                                            </div>
                                            <div
                                                class="typing"
                                                aria-hidden="true"
                                            >
                                                <span></span><span></span
                                                ><span></span>
                                            </div>
                                            <div class="msg msg-ai">
                                                Sei a 118g del tuo obiettivo di 150g — te ne mancano 32g. Una tazza di yogurt greco o un petto di pollo ti basterebbero per arrivarci.
                                            </div>`;
const SLIDE_6_HTML_IT = `
                                            <div class="msg msg-user">
                                                Mostrami i miei andamenti di questa settimana
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
                                                            Andamenti
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
                                                                >Calorie al giorno</span
                                                            >
                                                            <span
                                                                class="wdg-cmeta"
                                                                >7/7 giorni registrati</span
                                                            >
                                                        </div>
                                                        <svg
                                                            viewBox="0 0 480 54"
                                                            role="img"
                                                            aria-label="Calorie al giorno negli ultimi 7 giorni"
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
                                                                        Media 7 giorni · tutti i giorni
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
                                                                            kcal in meno
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
                                                                                >Proteine</span
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
                                                                                >Carboidrati</span
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
                                                                                >Grassi</span
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
                                                                                >Zuccheri</span
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
                                                                            limite 45 g
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
                                                                                >Caffeina</span
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
                                                                            limite 400 mg
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
                                                                                >Fibre</span
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
                                                                            su 30 g
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
                                                                >Acqua</span
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
                                                Stai facendo una media di 1.980 kcal al giorno — 120 sotto l'obiettivo, con zuccheri e caffeina comodamente entro i limiti. Le fibre sono a una media di 26.8 g, appena sotto il tuo obiettivo di 30 g.
                                            </div>`;
const SLIDE_7_HTML_IT = `
                                            <div class="msg msg-user">
                                                Registra il mio peso, 74.5 kg
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
                                                            Peso
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
                                                                Ultimo
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
                                                                −0.6 kg dal 5 lug
                                                            </div>
                                                        </div>
                                                        <svg
                                                            class="wdg-wchart"
                                                            viewBox="0 0 300 62"
                                                            role="img"
                                                            aria-label="Peso dal 5 lug all'11 lug, ultimo 74.5 kg"
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
                                                            >7 pesate · 5 lug → 11 lug</span
                                                        >
                                                        <span
                                                            ><b
                                                                >Obiettivo 73.0 kg</b
                                                            >
                                                            · 1.5 kg da perdere</span
                                                        >
                                                    </div>
                                                </div>
                                                Registrato — stai andando verso il tuo obiettivo.
                                            </div>`;

export const INDEX_IT: IndexDoc = {
    title: "Nutrition MCP — Tracker di pasti e macro con l'IA per Claude e ChatGPT",
    metaDescription:
        "Registra pasti, macro, peso e storico alimentare parlando con Claude o ChatGPT. Server MCP gratuito per la registrazione dei pasti con l'IA, la scansione di codici a barre, il conteggio delle calorie, il monitoraggio del peso e della dieta.",
    ogDescription:
        "Registra pasti, macro, peso e storico alimentare parlando con Claude o ChatGPT. Server MCP gratuito per la registrazione dei pasti con l'IA, la scansione di codici a barre e il monitoraggio del peso.",
    keywords:
        "tracker nutrizionale, registro pasti, server MCP, Claude AI, ChatGPT, conta calorie, tracker macro, scanner codice a barre, registrazione pasti, diario alimentare, tracker peso, registro peso, nutrizione IA, Model Context Protocol",

    chatChrome: {
        brand: "Nutrition MCP",
        status: "online",
        inputPlaceholder: "Scrivi a Nutrition…",
    },

    hero: {
        eyebrow: "Gratuito · Open source · OAuth 2.0",
        titleBeforeEm: "Traccia la tua alimentazione ",
        titleEm: "parlando",
        titleAfterEm: " con la tua IA.",
        lead: "Collega Claude o ChatGPT, poi dì semplicemente cosa hai mangiato. Calorie e macro, registrate automaticamente.",
        ctaPrimary: "Installazione rapida",
        ctaSecondary: "Sostienici",
        chipsHtml: HERO_CHIPS_HTML_IT,
        chatHtml: HERO_CHAT_HTML_IT,
    },

    how: {
        eyebrow: "Come funziona",
        title: "Tre passaggi. Nessuna app da imparare.",
        steps: [
            {
                title: "Connetti una volta",
                body: "Funziona con qualsiasi client IA che supporti i server MCP remoti — Claude, ChatGPT e altri. Nessuna installazione, nessuna chiave API.",
            },
            {
                title: "Dì semplicemente cosa hai mangiato",
                body: "Descrivilo con parole tue — oppure invia una foto del tuo pasto, uno screenshot da un'app di consegna cibo o un codice a barre (il prodotto viene cercato online). Macro registrate automaticamente.",
            },
            {
                title: "Traccia e rivedi",
                body: "Chiedi riepiloghi giornalieri, andamenti settimanali, progressi verso gli obiettivi, oppure esporta tutto ciò che hai registrato in file CSV — completamente gratis.",
            },
        ],
    },

    install: {
        eyebrow: "Installazione rapida",
        title: "Connettiti in meno di un minuto",
        sub: "Funziona con qualsiasi client MCP che supporti OAuth 2.0 con PKCE. Al primo collegamento crei un account con Google oppure con email e password; accedi allo stesso modo per ritrovare i tuoi dati.",
        claude: {
            steps: [
                "Apri <strong>Claude</strong> (versione web o desktop) e clicca su <strong>Customize</strong> in alto a sinistra.",
                "Clicca su <strong>Connectors</strong>.",
                "Clicca su <strong>+</strong>, poi su <strong>Add custom connector</strong>.",
                "Dagli un nome, ad esempio <strong>Nutrition</strong>.",
                'Incolla <span class="copy-url"><code>https://nutrition-mcp.com/mcp</code><button class="copy-mini" type="button" data-copy="https://nutrition-mcp.com/mcp" aria-label="Copia l\'URL del server"><i class="fa-solid fa-copy"></i></button></span> nel campo <strong>Remote MCP server URL</strong>.',
                "Clicca su <strong>Add</strong>.",
                "Clicca su <strong>Connect</strong> — si apre la pagina di accesso; continua con Google oppure accedi con email e password.",
                "Fatto. Funziona subito e compare automaticamente anche nelle tue app iOS e Android.",
            ],
            note: "Funziona con ogni piano Claude. Il piano gratuito consente un solo server MCP connesso alla volta.",
        },
        chatgpt: {
            steps: [
                "Apri <strong>ChatGPT sul web</strong> → <strong>Settings</strong> → <strong>Apps</strong>.",
                "Clicca su <strong>Create app</strong> in fondo al popup. Se non lo vedi, attiva <strong>Developer mode</strong> in <strong>Advanced settings</strong>.",
                "Dagli un nome, ad esempio <strong>Nutrition</strong>.",
                'Alla voce <strong>Connection</strong>, incolla <span class="copy-url"><code>https://nutrition-mcp.com/mcp</code><button class="copy-mini" type="button" data-copy="https://nutrition-mcp.com/mcp" aria-label="Copia l\'URL del server"><i class="fa-solid fa-copy"></i></button></span>.',
                "Alla voce <strong>Authentication</strong>, scegli <strong>OAuth</strong> — lascia tutto il resto invariato.",
                'Seleziona <strong>"I understand and want to continue"</strong>.',
                "Clicca su <strong>Create</strong>.",
                "Clicca su <strong>Sign in with Nutrition</strong> — si apre la pagina di accesso; continua con Google oppure accedi con email e password.",
                "Fatto. Funziona subito e compare automaticamente anche nelle tue app iOS e Android.",
            ],
        },
        other: {
            note: "Aggiungi la configurazione qui sopra al tuo client (Cursor, VS Code, Claude Code e altri). Windsurf usa <code>serverUrl</code> invece di <code>url</code>. In Claude Code, esegui <code>claude mcp add --transport http nutrition https://nutrition-mcp.com/mcp</code>. Il tuo client gestisce automaticamente l'accesso OAuth.",
        },
        otherTabLabel: "Altri client",
    },

    onboarding: {
        eyebrow: "Onboarding",
        title: "Configura una volta sola — o inizia subito a parlare",
        sub: "È del tutto facoltativo — Nutrition MCP funziona non appena ti connetti. Se vuoi, questi due rapidi passaggi lo rendono più preciso, ma puoi anche passare direttamente alla registrazione.",
        steps: [
            '<strong>Imposta il tuo fuso orario</strong> — così i giorni cambiano alla tua mezzanotte locale e i totali di oggi restano corretti ovunque tu sia. <span class="step-say">Dì semplicemente <q>Imposta il mio fuso orario su New York</q>.</span>',
            '<strong>Imposta i tuoi obiettivi</strong> — target giornalieri di calorie, macro e acqua, oltre a un peso obiettivo facoltativo e alla tua unità di peso preferita (kg o lb), per monitorare i tuoi progressi. <span class="step-say">Dì semplicemente <q>Imposta il mio obiettivo giornaliero a 2.000 calorie e 150g di proteine</q>.</span>',
            '<strong>Inizia a registrare</strong> — dì semplicemente cosa hai mangiato, invia una foto o scansiona un codice a barre. Tutto qui. <span class="step-say">Dì semplicemente <q>Ho mangiato porridge con frutti di bosco a colazione</q>.</span>',
        ],
        note: "Tutto questo è facoltativo. Puoi farlo ora, più tardi o mai — inizia semplicemente a registrare e imposta queste opzioni quando vuoi.",
        toolsCta: {
            heading: "Curioso di scoprire cosa può fare davvero?",
            body: "Sfoglia tutti i 36 strumenti — registrazione, codici a barre, acqua, peso, obiettivi e andamenti — con una descrizione e un esempio di richiesta per ciascuno.",
            arrow: "Esplora gli strumenti",
        },
    },

    try: {
        eyebrow: "Prova a dire",
        title: "Parlaci e basta.",
        sub: "Alcune delle cose che puoi fare — semplicemente parlando.",
        prevLabel: "Esempio precedente",
        nextLabel: "Esempio successivo",
        exampleLabel: "Esempio",
        slides: [
            { html: SLIDE_1_HTML_IT },
            { html: SLIDE_2_HTML_IT },
            { html: SLIDE_3_HTML_IT },
            { html: SLIDE_4_HTML_IT },
            { html: SLIDE_5_HTML_IT },
            { html: SLIDE_6_HTML_IT },
            { html: SLIDE_7_HTML_IT },
        ],
    },

    stats: {
        eyebrow: "Tracciato finora, insieme",
        title: "Un registro alimentare globale in crescita",
        factsTitle: "Valori nutrizionali",
        servingPrefix: "Porzione ",
        servingBold: "tutti, finora",
        liveLabel: "Live",
        calLabel: "Calorie ",
        calSmall: "tracciate, in totale",
        calCaption: "Calorie tracciate",
        rowFoodLogs: "Pasti registrati",
        rowProtein: "Proteine",
        rowCarbs: "Carboidrati",
        rowFat: "Grassi",
        foot: "Totali di tutti gli account, aggiornati man mano che i pasti vengono registrati. I dati individuali non vengono mai mostrati.",
        mapPrefix: "Registrato in",
        mapSuffix: "fusi orari nel mondo",
        mapAriaLabel:
            "Mappa del mondo che mostra i fusi orari in cui viene usato Nutrition MCP",
    },

    features: {
        eyebrow: "Tutto, semplicemente chattando",
        title: "Cosa puoi tracciare",
        cards: [
            {
                icon: "fa-solid fa-utensils",
                title: "Pasti in linguaggio naturale",
                body: "Descrivi cosa hai mangiato — la tua IA stima calorie, proteine, carboidrati, grassi, fibre, zuccheri totali e caffeina in milligrammi, e lo registra.",
            },
            {
                icon: "fa-solid fa-barcode",
                title: "Scansiona un codice a barre",
                body: "Fotografa o digita il codice a barre di un prodotto e recupera macro, fibre e zuccheri da Open Food Facts, calcolati in base a quanto ne hai mangiato.",
            },
            {
                icon: "fa-solid fa-bullseye",
                title: "Obiettivi e progressi",
                body: "Imposta target giornalieri di calorie, macro, fibre e acqua — oltre a limiti di zuccheri, caffeina e alcol da non superare — e controlla i progressi in tempo reale.",
            },
            {
                icon: "fa-solid fa-chart-area",
                title: "Riepiloghi e andamenti",
                body: "Riepiloghi giornalieri e settimanali, andamenti a 7/14/30 giorni, serie di giorni consecutivi e pattern ricorrenti nei pasti.",
            },
            {
                icon: "fa-solid fa-glass-water",
                title: "Registrazione dell'acqua",
                body: "Tieni traccia dell'idratazione in millilitri insieme ai tuoi pasti e rivedila giorno per giorno.",
            },
            {
                icon: "fa-solid fa-weight-scale",
                title: "Monitoraggio del peso",
                body: "Registra il tuo peso corporeo in kg o lb, visualizza gli andamenti a 7/14/30 giorni e monitora i progressi verso un peso obiettivo.",
            },
            {
                icon: "fa-solid fa-clock-four",
                title: "Fuso orario intelligente",
                body: "I giorni cambiano al tuo orario locale, ovunque tu sia nel mondo.",
            },
            {
                icon: "fa-solid fa-file-import",
                title: "Importa da un'altra app",
                body: "Porta il tuo storico pasti da MyFitnessPal, Cronometer, Lose It! o MacroFactor — oppure da qualsiasi altro CSV, mappando tu stesso le colonne. Confermi cosa viene aggiunto prima che venga salvato qualsiasi cosa.",
            },
            {
                icon: "fa-solid fa-file-csv",
                title: "Esporta e possiedi i tuoi dati",
                body: "Porta via tutto ciò che hai qui — pasti, acqua, peso, obiettivi e profilo — come un unico ZIP di file CSV. Per ora, i pasti sono l'unica parte che può essere reimportata. Elimina il tuo account e i tuoi dati quando vuoi.",
            },
        ],
    },

    why: {
        eyebrow: "Perché Nutrition MCP",
        title: "Parlare batte il tocco.",
        sub: "Scansiona un codice a barre o dì semplicemente cosa hai mangiato — niente ricerche nei database, nessuna app separata da aprire.",
        oldHeading: "App tradizionali",
        oldItems: [
            "Cerca ogni alimento in un database",
            "Correggi a mano le voci sbagliate del database",
            "Un'altra app, un altro account, un altro paywall",
            "Registrazione manuale e noiosa",
        ],
        newHeading: "Nutrition MCP",
        newItems: [
            "Descrivi i pasti con parole tue",
            "Calorie e macro stimate per te",
            "Funziona dentro Claude o ChatGPT, gratis",
            "Chiedi andamenti, riepiloghi e obiettivi",
        ],
        noteHtml:
            'Stai passando da un\'app specifica? Scopri come Nutrition MCP si confronta con <a href="/alternatives" data-link="alternatives">MyFitnessPal, Cronometer e altri tracker</a>.',
    },

    trust: [
        {
            label: "Privato per impostazione predefinita",
            small: "Solo tu puoi vedere i tuoi dati.",
        },
        { label: "Open source", small: "Verificalo o ospitalo tu stesso." },
        {
            label: "Esporta quando vuoi",
            small: "Ogni tabella in CSV, in un unico ZIP.",
        },
        { label: "Elimina all'istante", small: "Rimuovi account e dati." },
    ],

    support: {
        eyebrow: "Supporto",
        title: "Aiutaci a tenerlo attivo.",
        sub: "Nutrition MCP è gratuito e senza pubblicità. Patreon copre le spese di server e database.",
        free: {
            tier: "Membro gratuito",
            price: "$0",
            desc: "Resta aggiornato — ricevi notizie e aggiornamenti sul server, i nuovi strumenti e cosa sta arrivando.",
            cta: "Segui su Patreon",
        },
        paid: {
            tier: "Membro sostenitore",
            price: "Paga quanto vuoi",
            desc: "Contribuisci alle spese di hosting e database per mantenere il server gratuito e online per tutti.",
            cta: "Diventa un sostenitore",
        },
    },

    cta: {
        title: "Inizia a tracciare in meno di un minuto.",
        sub: "Gratuito e open source — funziona con l'IA che già usi.",
        primary: "Installazione rapida",
        secondary: "Metti una stella su GitHub",
    },

    contact: {
        eyebrow: "Contatti",
        title: "Domande o feedback?",
        sub: "Hai trovato un bug, vuoi una nuova funzione o hai solo una domanda? Scrivimi direttamente — leggo ogni messaggio.",
        cta: "Invia un'email",
    },

    faqSection: {
        eyebrow: "FAQ",
        title: "Domande frequenti",
    },
    faq: [
        {
            question: "Cos'è Nutrition MCP?",
            visibleHtml:
                "Nutrition MCP è un server Model Context Protocol (MCP) gratuito che ti permette di tracciare pasti, calorie, macro e storico nutrizionale attraverso una conversazione naturale con Claude o ChatGPT. Invece di digitare in un'app tradizionale, dici alla tua IA cosa hai mangiato e lei registra tutto per te.",
        },
        {
            question: "Cos'è il Model Context Protocol (MCP)?",
            visibleHtml:
                "Il Model Context Protocol è uno standard aperto che permette ad assistenti IA come Claude e ChatGPT di collegarsi a strumenti e fonti di dati esterne. Un server MCP fornisce funzionalità specifiche — in questo caso, il tracciamento nutrizionale — che l'IA può usare durante una conversazione. Pensalo come un sistema di plugin per gli assistenti IA.",
        },
        {
            question: "Funziona con ChatGPT?",
            visibleHtml:
                "Sì. In ChatGPT sul web, apri Settings → Apps, crea un'app personalizzata con l'URL del server usando OAuth, e accedi. Funziona con ogni piano ChatGPT.",
            jsonLdText:
                "Sì. In ChatGPT sul web, apri Settings → Apps, crea un'app personalizzata con l'URL del server https://nutrition-mcp.com/mcp usando OAuth, e accedi. Funziona con ogni piano ChatGPT.",
        },
        {
            question: "Quali altri client sono supportati?",
            visibleHtml:
                "Qualsiasi client MCP che supporti OAuth 2.0 con PKCE — tra cui Claude.ai, le app desktop e mobile di Claude, Claude Code, Cursor, Windsurf e VS Code.",
        },
        {
            question: "Posso ospitarlo io stesso (self-host)?",
            visibleHtml:
                'Sì. Nutrition MCP è open source (licenza MIT). Puoi eseguire una tua istanza con un tuo progetto Supabase — il <a href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer">repository GitHub</a> include una guida completa al self-hosting e un Dockerfile.',
        },
        {
            question: "Nutrition MCP è gratuito?",
            visibleHtml:
                "Sì, è completamente gratuito — nessun piano premium, pubblicità o costi nascosti. Ti serve solo un account Claude o ChatGPT per connetterti. Le donazioni su Patreon aiutano a coprire i costi del server.",
        },
        {
            question: "Cosa posso tracciare?",
            visibleHtml:
                "Calorie, proteine, carboidrati, grassi, fibre, zuccheri totali e acqua per ogni voce — descritti con parole tue o recuperati dal codice a barre di un prodotto tramite Open Food Facts. Viene tracciata anche la caffeina, in milligrammi, l'unità usata da ogni etichetta, e non aggiunge calorie. Anche l'alcol viene tracciato, in grammi di etanolo puro, una volta che lo attivi. Puoi anche registrare il tuo peso corporeo in kg o lb e monitorare gli andamenti verso un peso obiettivo. Visualizza riepiloghi giornalieri, interroga i pasti per intervallo di date, aggiorna o elimina voci passate, imposta obiettivi e monitora gli andamenti nel tempo.",
        },
        {
            question: "Traccia l'alcol?",
            visibleHtml:
                "Solo se lo attivi — il tracciamento dell'alcol è disattivato per impostazione predefinita. Una volta attivato, i drink vengono registrati in grammi di etanolo puro e mostrati come drink standard USA o unità britanniche, a tua scelta. Niente viene dedotto automaticamente per te: l'alcol arriva solo da un drink che registri o da una colonna alcol in un file che importi. Disattivarlo di nuovo nasconde l'alcol da pasti, obiettivi e riepiloghi e impedisce all'importatore di leggere le colonne dell'alcol — non è un interruttore di eliminazione, e la tua esportazione CSV include sempre ciò che hai registrato.",
        },
        {
            question:
                "Posso importare il mio storico da MyFitnessPal o un'altra app?",
            visibleHtml:
                "Sì. Chiedi di importare il tuo storico e si apre un importatore nella chat: scegli il CSV esportato dalla tua vecchia app, controlli come vengono mappate le colonne e vedi cosa verrà aggiunto prima di confermare. Le esportazioni di MyFitnessPal, Cronometer, Lose It! e MacroFactor vengono riconosciute automaticamente, mentre qualsiasi altro CSV funziona mappando tu stesso le colonne. Il file viene letto dal tuo browser, quindi l'IA non riscrive mai le tue righe. Nei client senza pannelli in chat puoi invece incollare la tua esportazione — e importare lo stesso file due volte non crea duplicati.",
        },
        {
            question: "I miei dati sono privati?",
            visibleHtml:
                "I tuoi dati sono conservati in modo sicuro e collegati al tuo account personale. Solo tu puoi accedere al tuo storico nutrizionale, tramite la tua sessione autenticata. Nutrition MCP non vende né condivide i tuoi dati, e puoi eliminare il tuo account e tutti i dati in qualsiasi momento.",
        },
    ],
};
