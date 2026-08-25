// French (fr) translation of the landing page content — see src/copy/index.ts
// for the authoritative shape (`IndexDoc`) and the full doc comments on what
// each field means and why the decorative chat-widget blocks are stored as
// one trusted HTML block per message rather than split field-by-field.
//
// Terminology kept consistent with tools.fr.ts and alternatives.fr.ts:
// protein → protéines, carbs → glucides, fat → lipides, fiber → fibres,
// (total) sugar → sucres (totaux), alcohol → alcool (grammes d'éthanol pur),
// caffeine → caféine, meal → repas, water → eau, weigh-in → pesée,
// goals → objectifs, timezone → fuseau horaire, export → exporter/export,
// widget → widget. Informal "tu" register throughout, matching the English
// source's direct, plain-spoken address to the reader.

import type { IndexDoc } from "./index.js";

const HERO_CHIPS_HTML_PLACEHOLDER = `
                            <span class="chip chip-1"
                                ><i style="--c: var(--cal)"></i
                                ><b>+340</b> kcal</span
                            >
                            <span class="chip chip-2"
                                ><i style="--c: #8b5cf6"></i
                                ><b>20 g</b> protéines</span
                            >
                            <span class="chip chip-3"
                                ><i style="--c: #10b981"></i
                                ><b>30 g</b> glucides</span
                            >
                            <span class="chip chip-4"
                                ><i style="--c: #0ea5e9"></i
                                ><b>500 ml</b> d'eau</span
                            >`;
const HERO_CHAT_HTML_PLACEHOLDER = `
                                <div class="cw-header">
                                    <span class="cw-avatar"
                                        ><i class="fa-solid fa-apple-whole"></i
                                    ></span>
                                    <span class="cw-title">Nutrition MCP</span>
                                    <span class="cw-status">en ligne</span>
                                </div>
                                <div class="cw-body">
                                    <div class="chat-thread">
                                        <div class="msg msg-user">
                                            Deux œufs, du pain complet grillé
                                            et un café pour le petit-déjeuner
                                        </div>

                                        <div class="msg msg-ai">
                                            <div class="wdg">
                                                <div class="wdg-head">
                                                    <div class="wdg-title">
                                                        Repas enregistré
                                                    </div>
                                                    <div class="wdg-sub">
                                                        Deux œufs, toast et
                                                        café · petit-déjeuner
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
                                                                    Calories
                                                                    aujourd'hui
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
                                                                            2 100</span
                                                                        >
                                                                    </div>
                                                                    <div
                                                                        class="wdg-calleft"
                                                                    >
                                                                        1 760
                                                                        kcal
                                                                        restants
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
                                                                            >Protéines</span
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
                                                                            >Glucides</span
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
                                                                            >Lipides</span
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
                                                                            >Sucre</span
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
                                                                        limit 45
                                                                        g
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
                                                                            >Caféine</span
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
                                                                        limite
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
                                                                            >Fibres</span
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
                                                                        of 30 g
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div
                                                                class="wdg-mhint"
                                                                aria-hidden="true"
                                                            >
                                                                Touche une valeur pour
                                                                voir les repas
                                                                concernés
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            Ajouté au petit-déjeuner : deux
                                            œufs, du pain grillé et un café.
                                            Ça fait environ 340 kcal (20g de
                                            protéines, 30g de glucides, 15g de
                                            lipides, 3.4g de fibres), plus
                                            95mg de caféine grâce au café.
                                        </div>

                                        <div class="msg msg-user">
                                            Comment évolue mon poids ?
                                        </div>

                                        <div class="msg msg-ai">
                                            <div class="wdg">
                                                <div class="wdg-head wdg-mid">
                                                    <div class="wdg-title">
                                                        Poids
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
                                                            Dernier relevé
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
                                                            −0.6 kg depuis le 5
                                                            juil.
                                                        </div>
                                                    </div>
                                                    <svg
                                                        class="wdg-wchart"
                                                        viewBox="0 0 300 62"
                                                        role="img"
                                                        aria-label="Poids du 5 juil. au 11 juil., dernier relevé 74.5 kg"
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
                                                        >7 pesées · 5 juil. →
                                                        11 juil.</span
                                                    >
                                                    <span
                                                        ><b>Objectif 73.0 kg</b> ·
                                                        1.5 kg à perdre</span
                                                    >
                                                </div>
                                            </div>
                                            Tu as perdu 0.6 kg cette semaine,
                                            à 1.5 kg de ton objectif de 73 kg
                                            — ta moyenne sur 7 jours est en
                                            baisse, bon rythme.
                                        </div>
                                    </div>
                                </div>
                                <div class="cw-input">
                                    <span class="cw-field"
                                        >Message à Nutrition…</span
                                    >
                                    <span class="cw-send"
                                        ><i class="fa-solid fa-arrow-up"></i
                                    ></span>
                                </div>`;
const SLIDE_1_HTML_PLACEHOLDER = `
                                            <div class="msg msg-user">
                                                Ajoute un burrito bowl au
                                                poulet pour le déjeuner
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
                                                            Repas enregistré
                                                        </div>
                                                        <div class="wdg-sub">
                                                            Burrito bowl au
                                                            poulet · déjeuner
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
                                                                        Calories
                                                                        aujourd'hui
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
                                                                                2 100</span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-calleft"
                                                                        >
                                                                            1 110
                                                                            kcal
                                                                            restants
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
                                                                                >Protéines</span
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
                                                                                >Glucides</span
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
                                                                                >Lipides</span
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
                                                                                >Sucre</span
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
                                                                            limite
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
                                                                                >Caféine</span
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
                                                                            limite
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
                                                                                >Fibres</span
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
                                                                            sur
                                                                            30 g
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    class="wdg-mhint"
                                                                    aria-hidden="true"
                                                                >
                                                                    Touche une valeur
                                                                    pour voir les
                                                                    repas
                                                                    concernés
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
                                                                >Eau</span
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
                                                Ajouté un burrito bowl au
                                                poulet au déjeuner, environ
                                                650 kcal (42g de protéines,
                                                68g de glucides, 22g de
                                                lipides) et 12g de fibres
                                                grâce aux haricots.
                                            </div>`;
const SLIDE_2_HTML_PLACEHOLDER = `
                                            <div
                                                class="msg-img"
                                                aria-hidden="true"
                                            >
                                                <svg
                                                    viewBox="0 0 220 150"
                                                    class="chat-photo"
                                                    role="img"
                                                    aria-label="Photo d'une assiette de dîner"
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
                                                Voici mon dîner — qu'est-ce
                                                qu'il y a dedans ?
                                            </div>
                                            <div
                                                class="typing"
                                                aria-hidden="true"
                                            >
                                                <span></span><span></span
                                                ><span></span>
                                            </div>
                                            <div class="msg msg-ai">
                                                On dirait du saumon grillé
                                                avec du riz et des brocolis —
                                                enregistré au dîner, environ
                                                540 kcal (38g de protéines,
                                                45g de glucides, 20g de
                                                lipides).
                                            </div>`;
const SLIDE_3_HTML_PLACEHOLDER = `
                                            <div
                                                class="msg-img"
                                                aria-hidden="true"
                                            >
                                                <svg
                                                    viewBox="0 0 220 150"
                                                    class="chat-photo"
                                                    role="img"
                                                    aria-label="Photo d'un code-barres de produit"
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
                                                Enregistre ça
                                            </div>
                                            <div
                                                class="typing"
                                                aria-hidden="true"
                                            >
                                                <span></span><span></span
                                                ><span></span>
                                            </div>
                                            <div class="msg msg-ai step-ask">
                                                Trouvé — yaourt grec Chobani,
                                                1 tasse : 120 kcal, 15g de
                                                protéines. C'est pour quel
                                                repas ?
                                                <div class="meal-pick">
                                                    <span class="meal-chip"
                                                        >Petit-déjeuner</span
                                                    >
                                                    <span class="meal-chip"
                                                        >Déjeuner</span
                                                    >
                                                    <span class="meal-chip"
                                                        >Dîner</span
                                                    >
                                                    <span
                                                        class="meal-chip meal-pick-target"
                                                        >Collation</span
                                                    >
                                                </div>
                                            </div>
                                            <div class="msg msg-ai step-done">
                                                <div class="wdg">
                                                    <div class="wdg-head">
                                                        <div class="wdg-title">
                                                            Repas enregistré
                                                        </div>
                                                        <div class="wdg-sub">
                                                            Yaourt grec
                                                            Chobani, 1 tasse ·
                                                            collation
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
                                                                        Calories
                                                                        aujourd'hui
                                                                    </div>
                                                                    <div
                                                                        class="wdg-calline"
                                                                    >
                                                                        <div
                                                                            class="wdg-calval"
                                                                        >
                                                                            1 540<span
                                                                                class="wdg-calgoal"
                                                                                >/
                                                                                2 100</span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-calleft"
                                                                        >
                                                                            560
                                                                            kcal
                                                                            restants
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
                                                                                >Protéines</span
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
                                                                                >Glucides</span
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
                                                                                >Lipides</span
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
                                                                                >Sucre</span
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
                                                                            limite
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
                                                                                >Caféine</span
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
                                                                            limite
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
                                                                                >Fibres</span
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
                                                                            sur
                                                                            30 g
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    class="wdg-mhint"
                                                                    aria-hidden="true"
                                                                >
                                                                    Touche une valeur
                                                                    pour voir les
                                                                    repas
                                                                    concernés
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                Enregistré en collation — 120
                                                kcal, 15g de protéines, 9g de
                                                sucre.
                                            </div>`;
const SLIDE_4_HTML_PLACEHOLDER = `
                                            <div class="msg msg-user">
                                                Mets mon fuseau horaire sur
                                                New York
                                            </div>
                                            <div
                                                class="typing"
                                                aria-hidden="true"
                                            >
                                                <span></span><span></span
                                                ><span></span>
                                            </div>
                                            <div class="msg msg-ai">
                                                Fait — tes journées basculent
                                                maintenant à minuit heure de
                                                l'Est, tes totaux du jour
                                                restent donc justes où que tu
                                                sois.
                                            </div>`;
const SLIDE_5_HTML_PLACEHOLDER = `
                                            <div class="msg msg-user">
                                                Où j'en suis avec les
                                                protéines aujourd'hui ?
                                            </div>
                                            <div
                                                class="typing"
                                                aria-hidden="true"
                                            >
                                                <span></span><span></span
                                                ><span></span>
                                            </div>
                                            <div class="msg msg-ai">
                                                Tu es à 118g sur ton objectif
                                                de 150g — encore 32g. Une
                                                tasse de yaourt grec ou un
                                                blanc de poulet et c'est fait.
                                            </div>`;
const SLIDE_6_HTML_PLACEHOLDER = `
                                            <div class="msg msg-user">
                                                Montre mes tendances cette
                                                semaine
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
                                                            Tendances
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
                                                                >Calories /
                                                                jour</span
                                                            >
                                                            <span
                                                                class="wdg-cmeta"
                                                                >7/7 jours
                                                                enregistrés</span
                                                            >
                                                        </div>
                                                        <svg
                                                            viewBox="0 0 480 54"
                                                            role="img"
                                                            aria-label="Calories par jour sur les 7 derniers jours"
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
                                                                        Moy.
                                                                        7 j ·
                                                                        tous les jours
                                                                    </div>
                                                                    <div
                                                                        class="wdg-calline"
                                                                    >
                                                                        <div
                                                                            class="wdg-calval"
                                                                        >
                                                                            1 980<span
                                                                                class="wdg-calgoal"
                                                                                >/
                                                                                2 100</span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-calleft"
                                                                        >
                                                                            120
                                                                            kcal
                                                                            sous l'objectif
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
                                                                                >Protéines</span
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
                                                                                >Glucides</span
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
                                                                                >Lipides</span
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
                                                                                >Sucre</span
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
                                                                            limite
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
                                                                                >Caféine</span
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
                                                                            limite
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
                                                                                >Fibres</span
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
                                                                            sur
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
                                                                >Eau</span
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
                                                Tu es à 1 980 kcal en moyenne
                                                par jour — 120 sous l'objectif,
                                                avec le sucre et la caféine
                                                bien dans leurs limites. Les
                                                fibres sont en moyenne à
                                                26.8 g, juste sous ton
                                                objectif de 30 g.
                                            </div>`;
const SLIDE_7_HTML_PLACEHOLDER = `
                                            <div class="msg msg-user">
                                                Enregistre mon poids, 74.5 kg
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
                                                            Poids
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
                                                                Dernier relevé
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
                                                                −0.6 kg
                                                                depuis le 5
                                                                juil.
                                                            </div>
                                                        </div>
                                                        <svg
                                                            class="wdg-wchart"
                                                            viewBox="0 0 300 62"
                                                            role="img"
                                                            aria-label="Poids du 5 juil. au 11 juil., dernier relevé 74.5 kg"
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
                                                            >7 pesées · 5
                                                            juil. → 11
                                                            juil.</span
                                                        >
                                                        <span
                                                            ><b
                                                                >Objectif 73.0
                                                                kg</b
                                                            >
                                                            · 1.5 kg à
                                                            perdre</span
                                                        >
                                                    </div>
                                                </div>
                                                Enregistré — tu te rapproches
                                                de ton objectif.
                                            </div>`;

export const INDEX_FR: IndexDoc = {
    title: "Nutrition MCP — Suivi IA des repas et macros pour Claude et ChatGPT",
    metaDescription:
        "Suis tes repas, macros, poids et historique nutritionnel en conversant avec Claude ou ChatGPT. Serveur MCP gratuit pour enregistrer tes repas, scanner des codes-barres, compter les calories, suivre ton poids et ton alimentation grâce à l'IA.",
    ogDescription:
        "Suis tes repas, macros, poids et historique nutritionnel en conversant avec Claude ou ChatGPT. Serveur MCP gratuit pour enregistrer tes repas, scanner des codes-barres et suivre ton poids grâce à l'IA.",
    keywords:
        "suivi nutritionnel, suivi des repas, serveur MCP, Claude AI, ChatGPT, compteur de calories, suivi des macros, scanner de codes-barres, journal alimentaire, suivi de régime, suivi du poids, carnet de poids, nutrition IA, Model Context Protocol",

    chatChrome: {
        brand: "Nutrition MCP",
        status: "en ligne",
        inputPlaceholder: "Message à Nutrition…",
    },

    hero: {
        eyebrow: "Gratuit · Open source · OAuth 2.0",
        titleBeforeEm: "Suis ta nutrition en ",
        titleEm: "parlant",
        titleAfterEm: " à ton IA.",
        lead: "Connecte Claude ou ChatGPT, puis dis simplement ce que tu as mangé. Calories et macros, enregistrées automatiquement.",
        ctaPrimary: "Installation rapide",
        ctaSecondary: "Soutenir",
        chipsHtml: HERO_CHIPS_HTML_PLACEHOLDER,
        chatHtml: HERO_CHAT_HTML_PLACEHOLDER,
    },

    how: {
        eyebrow: "Comment ça marche",
        title: "Trois étapes. Aucune app à apprendre.",
        steps: [
            {
                title: "Connecte-toi une fois",
                body: "Fonctionne avec n'importe quel client IA compatible avec les serveurs MCP distants — Claude, ChatGPT, et d'autres. Aucune installation, aucune clé API.",
            },
            {
                title: "Dis simplement ce que tu as mangé",
                body: "Décris-le en langage courant — ou envoie une photo de ton repas, une capture d'une app de livraison, ou un code-barres (le produit est recherché en ligne). Macros enregistrées automatiquement.",
            },
            {
                title: "Suis et consulte",
                body: "Demande des résumés quotidiens, des tendances hebdomadaires, ta progression vers tes objectifs, ou exporte tout ce que tu as enregistré en fichiers CSV — entièrement gratuit.",
            },
        ],
    },

    install: {
        eyebrow: "Installation rapide",
        title: "Connecte-toi en moins d'une minute",
        sub: "Fonctionne avec tout client MCP compatible OAuth 2.0 avec PKCE. À la première connexion, tu crées un compte avec Google ou un e-mail et un mot de passe ; connecte-toi de la même façon pour retrouver tes données.",
        claude: {
            steps: [
                "Ouvre <strong>Claude</strong> (web ou bureau) et clique sur <strong>Personnaliser</strong> en haut à gauche.",
                "Clique sur <strong>Connecteurs</strong>.",
                "Clique sur <strong>+</strong>, puis <strong>Ajouter un connecteur personnalisé</strong>.",
                "Donne-lui un nom, par exemple <strong>Nutrition</strong>.",
                'Colle <span class="copy-url"><code>https://nutrition-mcp.com/mcp</code><button class="copy-mini" type="button" data-copy="https://nutrition-mcp.com/mcp" aria-label="Copier l\'URL du serveur"><i class="fa-solid fa-copy"></i></button></span> dans le champ <strong>URL du serveur MCP distant</strong>.',
                "Clique sur <strong>Ajouter</strong>.",
                "Clique sur <strong>Connecter</strong> — la page de connexion s'ouvre ; continue avec Google ou connecte-toi avec un e-mail et un mot de passe.",
                "C'est fait. Ça fonctionne immédiatement et apparaît automatiquement dans tes apps iOS et Android.",
            ],
            note: "Fonctionne sur tous les forfaits Claude. Le forfait gratuit permet un serveur MCP connecté à la fois.",
        },
        chatgpt: {
            steps: [
                "Ouvre <strong>ChatGPT sur le web</strong> → <strong>Paramètres</strong> → <strong>Applications</strong>.",
                "Clique sur <strong>Créer une application</strong> en bas de la fenêtre. Si tu ne le vois pas, active le <strong>Mode développeur</strong> dans <strong>Paramètres avancés</strong>.",
                "Donne-lui un nom, par exemple <strong>Nutrition</strong>.",
                'Pour <strong>Connexion</strong>, colle <span class="copy-url"><code>https://nutrition-mcp.com/mcp</code><button class="copy-mini" type="button" data-copy="https://nutrition-mcp.com/mcp" aria-label="Copier l\'URL du serveur"><i class="fa-solid fa-copy"></i></button></span>.',
                "Pour <strong>Authentification</strong>, choisis <strong>OAuth</strong> — laisse tout le reste tel quel.",
                "Coche <strong>« I understand and want to continue »</strong>.",
                "Clique sur <strong>Créer</strong>.",
                "Clique sur <strong>Se connecter avec Nutrition</strong> — la page de connexion s'ouvre ; continue avec Google ou connecte-toi avec un e-mail et un mot de passe.",
                "C'est fait. Ça fonctionne immédiatement et apparaît automatiquement dans tes apps iOS et Android.",
            ],
        },
        other: {
            note: "Ajoute la config ci-dessus à ton client (Cursor, VS Code, Claude Code, et d'autres). Windsurf utilise <code>serverUrl</code> au lieu de <code>url</code>. Dans Claude Code, exécute <code>claude mcp add --transport http nutrition https://nutrition-mcp.com/mcp</code>. Ton client gère la connexion OAuth automatiquement.",
        },
        otherTabLabel: "Autres clients",
    },

    onboarding: {
        eyebrow: "Prise en main",
        title: "Configure une fois — ou commence direct à parler",
        sub: "C'est entièrement facultatif — Nutrition MCP fonctionne dès que tu te connectes. Si tu veux, ces trois étapes rapides le rendent plus précis, mais tu peux aussi passer directement à l'enregistrement.",
        steps: [
            '<strong>Définis ton fuseau horaire</strong> — pour que tes journées basculent à minuit heure locale et que les totaux du jour restent justes où que tu sois. <span class="step-say">Dis simplement <q>Mets mon fuseau horaire sur New York</q>.</span>',
            '<strong>Définis tes objectifs</strong> — cibles quotidiennes de calories, macros et eau, plus un poids cible facultatif et ton unité de poids préférée (kg ou lb), pour suivre ta progression. <span class="step-say">Dis simplement <q>Mets mon objectif quotidien à 2 000 calories et 150g de protéines</q>.</span>',
            "<strong>Définis ta langue</strong> — la langue dans laquelle les widgets du chat (tableaux de bord, graphiques) s'affichent, pas ce que l'IA t'écrit. <span class=\"step-say\">Dis simplement <q>Affiche mes widgets en allemand</q>.</span>",
            "<strong>Commence à enregistrer</strong> — dis simplement ce que tu as mangé, envoie une photo ou scanne un code-barres. C'est tout. <span class=\"step-say\">Dis simplement <q>J'ai pris du porridge avec des fruits rouges au petit-déjeuner</q>.</span>",
        ],
        note: "Tout ceci est facultatif. Tu peux le faire maintenant, plus tard, ou jamais — commence simplement à enregistrer et règle ça quand tu veux.",
        toolsCta: {
            heading: "Curieux de voir tout ce que ça peut faire ?",
            body: "Parcours les 36 outils — enregistrement, codes-barres, eau, poids, objectifs et tendances — avec une description et un exemple de formulation pour chacun.",
            arrow: "Explorer les outils",
        },
    },

    try: {
        eyebrow: "Essaie de dire",
        title: "Il te suffit de lui parler.",
        sub: "Quelques exemples de ce que tu peux faire — juste en parlant.",
        prevLabel: "Exemple précédent",
        nextLabel: "Exemple suivant",
        exampleLabel: "Exemple",
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
        eyebrow: "Suivi jusqu'ici, ensemble",
        title: "Un journal alimentaire mondial en pleine croissance",
        factsTitle: "Valeurs nutritionnelles",
        servingPrefix: "Portion ",
        servingBold: "tout le monde, jusqu'ici",
        liveLabel: "En direct",
        calLabel: "Calories ",
        calSmall: "suivies, au total",
        calCaption: "Calories suivies",
        rowFoodLogs: "Repas enregistrés",
        rowProtein: "Protéines",
        rowCarbs: "Glucides",
        rowFat: "Lipides",
        unitGroupLabel: "Unité de poids",
        unitKgLabel: "Kilogrammes",
        unitLbLabel: "Livres",
        foot: "Totaux tous comptes confondus, mis à jour à chaque repas enregistré. Les données individuelles ne sont jamais affichées.",
        mapPrefix: "Enregistré dans",
        mapSuffix: "fuseaux horaires à travers le monde",
        mapAriaLabel:
            "Carte du monde montrant les fuseaux horaires où Nutrition MCP est utilisé",
    },

    features: {
        eyebrow: "Tout, juste en discutant",
        title: "Ce que tu peux suivre",
        cards: [
            {
                icon: "fa-solid fa-utensils",
                title: "Repas en langage courant",
                body: "Décris ce que tu as mangé — ton IA estime les calories, protéines, glucides, lipides, fibres, sucres totaux et caféine en milligrammes, et l'enregistre.",
            },
            {
                icon: "fa-solid fa-barcode",
                title: "Scanne un code-barres",
                body: "Prends en photo ou tape le code-barres d'un produit et récupère les macros, fibres et sucres depuis Open Food Facts, ajustés à la quantité que tu as mangée.",
            },
            {
                icon: "fa-solid fa-bullseye",
                title: "Objectifs et progression",
                body: "Définis des cibles quotidiennes de calories, macros, fibres et eau — plus des limites de sucre, caféine et alcool à ne pas dépasser — et suis ta progression en direct.",
            },
            {
                icon: "fa-solid fa-chart-area",
                title: "Résumés et tendances",
                body: "Bilans quotidiens et hebdomadaires, tendances sur 7/14/30 jours, séries et habitudes alimentaires récurrentes.",
            },
            {
                icon: "fa-solid fa-glass-water",
                title: "Suivi de l'eau",
                body: "Suis ton hydratation en millilitres en plus de tes repas et consulte-la jour par jour.",
            },
            {
                icon: "fa-solid fa-weight-scale",
                title: "Suivi du poids",
                body: "Enregistre ton poids en kg ou en lb, consulte les tendances sur 7/14/30 jours et suis ta progression vers un poids cible.",
            },
            {
                icon: "fa-solid fa-clock-four",
                title: "Adapté au fuseau horaire",
                body: "Tes journées basculent à ton heure locale, où que tu sois dans le monde.",
            },
            {
                icon: "fa-solid fa-file-import",
                title: "Importer depuis une autre app",
                body: "Récupère ton historique de repas depuis MyFitnessPal, Cronometer, Lose It! ou MacroFactor — ou n'importe quel autre CSV, en associant toi-même ses colonnes. Tu confirmes ce qui sera ajouté avant que rien ne soit enregistré.",
            },
            {
                icon: "fa-solid fa-file-csv",
                title: "Exporte et garde le contrôle de tes données",
                body: "Récupère tout ce que tu as ici — repas, eau, poids, objectifs et profil — dans un seul ZIP de fichiers CSV. Les repas sont pour l'instant la seule partie qui peut être réimportée. Supprime ton compte et tes données quand tu veux.",
            },
        ],
    },

    why: {
        eyebrow: "Pourquoi Nutrition MCP",
        title: "Parler bat taper.",
        sub: "Scanne un code-barres ou dis simplement ce que tu as mangé — pas de fouille dans une base de données, pas d'app séparée à ouvrir.",
        oldHeading: "Apps traditionnelles",
        oldItems: [
            "Chercher chaque aliment dans une base de données",
            "Corriger à la main les entrées erronées",
            "Encore une app, un compte et un mur payant",
            "Enregistrement manuel fastidieux",
        ],
        newHeading: "Nutrition MCP",
        newItems: [
            "Décris tes repas en langage courant",
            "Calories et macros estimées pour toi",
            "Fonctionne dans Claude ou ChatGPT, gratuit",
            "Demande tendances, résumés et objectifs",
        ],
        noteHtml:
            'Tu viens d\'une app en particulier ? Découvre comment Nutrition MCP se compare à <a href="/alternatives" data-link="alternatives">MyFitnessPal, Cronometer et d\'autres trackers</a>.',
    },

    trust: [
        {
            label: "Privé par défaut",
            small: "Toi seul peux voir tes données.",
        },
        { label: "Open source", small: "Audite-le ou héberge-le toi-même." },
        {
            label: "Exporte à tout moment",
            small: "Chaque table en CSV, dans un seul ZIP.",
        },
        {
            label: "Supprime instantanément",
            small: "Retire ton compte et tes données.",
        },
    ],

    support: {
        eyebrow: "Soutien",
        title: "Aide à le faire tourner.",
        sub: "Nutrition MCP est gratuit et sans publicité. Patreon couvre les frais de serveur et de base de données.",
        free: {
            tier: "Membre gratuit",
            price: "0 $",
            desc: "Suis l'actualité — reçois les nouvelles et mises à jour sur le serveur, les nouveaux outils et ce qui arrive ensuite.",
            cta: "Suivre sur Patreon",
        },
        paid: {
            tier: "Membre payant",
            price: "Paie ce que tu veux",
            desc: "Contribue aux frais d'hébergement et de base de données pour que le serveur reste gratuit et en ligne pour tout le monde.",
            cta: "Devenir soutien",
        },
    },

    cta: {
        title: "Commence à suivre en moins d'une minute.",
        sub: "Gratuit et open source — ça fonctionne avec l'IA que tu utilises déjà.",
        primary: "Installation rapide",
        secondary: "Star sur GitHub",
    },

    contact: {
        eyebrow: "Contact",
        title: "Des questions ou des retours ?",
        sub: "Un bug trouvé, une fonctionnalité souhaitée, ou juste une question ? Écris-moi directement — je lis chaque message.",
        cta: "Envoyer un e-mail",
    },

    faqSection: {
        eyebrow: "FAQ",
        title: "Questions fréquentes",
    },
    faq: [
        {
            question: "Qu'est-ce que Nutrition MCP ?",
            visibleHtml:
                "Nutrition MCP est un serveur Model Context Protocol (MCP) gratuit qui te permet de suivre tes repas, calories, macros et historique nutritionnel par simple conversation avec Claude ou ChatGPT. Plutôt que de taper dans une app traditionnelle, tu dis à ton IA ce que tu as mangé et elle enregistre tout pour toi.",
        },
        {
            question: "Qu'est-ce que le Model Context Protocol (MCP) ?",
            visibleHtml:
                "Le Model Context Protocol est un standard ouvert qui permet à des assistants IA comme Claude et ChatGPT de se connecter à des outils et sources de données externes. Un serveur MCP fournit des capacités précises — ici, le suivi nutritionnel — que l'IA peut utiliser pendant une conversation. Vois ça comme un système de plugins pour assistants IA.",
        },
        {
            // The visible answer deliberately omits the server URL (already
            // stated elsewhere on the page); the JSON-LD answer, read
            // standalone by search engines, states it explicitly. This
            // mismatch predates this extraction — preserved verbatim rather
            // than silently reconciled.
            question: "Ça fonctionne avec ChatGPT ?",
            visibleHtml:
                "Oui. Dans ChatGPT sur le web, ouvre Paramètres → Applications, crée une app personnalisée avec l'URL du serveur via OAuth, et connecte-toi. Ça fonctionne sur tous les forfaits ChatGPT.",
            jsonLdText:
                "Oui. Dans ChatGPT sur le web, ouvre Paramètres → Applications, crée une app personnalisée avec l'URL du serveur https://nutrition-mcp.com/mcp via OAuth, et connecte-toi. Ça fonctionne sur tous les forfaits ChatGPT.",
        },
        {
            question: "Quels autres clients sont pris en charge ?",
            visibleHtml:
                "Tout client MCP compatible OAuth 2.0 avec PKCE — dont Claude.ai, les apps Claude bureau et mobile, Claude Code, Cursor, Windsurf et VS Code.",
        },
        {
            question: "Puis-je l'héberger moi-même ?",
            visibleHtml:
                'Oui. Nutrition MCP est open source (MIT). Tu peux faire tourner ta propre instance avec ton propre projet Supabase — le <a href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer">dépôt GitHub</a> inclut un guide d\'auto-hébergement complet et un Dockerfile.',
        },
        {
            question: "Nutrition MCP est-il gratuit ?",
            visibleHtml:
                "Oui, c'est entièrement gratuit — pas de forfait premium, de publicité ni de frais cachés. Il te faut juste un compte Claude ou ChatGPT pour te connecter. Les dons sur Patreon aident à couvrir les frais de serveur.",
        },
        {
            question: "Que puis-je suivre ?",
            visibleHtml:
                "Calories, protéines, glucides, lipides, fibres, sucres totaux et eau pour chaque entrée — décrits en langage courant ou récupérés depuis le code-barres d'un produit via Open Food Facts. La caféine est suivie aussi, en milligrammes, l'unité utilisée par toutes les étiquettes, et elle n'ajoute aucune calorie. L'alcool est suivi également, en grammes d'éthanol pur, une fois que tu l'actives. Tu peux aussi enregistrer ton poids en kg ou en lb et suivre les tendances vers un poids cible. Consulte des résumés quotidiens, interroge tes repas par période, modifie ou supprime des entrées passées, définis des objectifs et surveille les tendances dans le temps.",
        },
        {
            question: "Est-ce que ça suit l'alcool ?",
            visibleHtml:
                "Seulement si tu l'actives — le suivi de l'alcool est désactivé par défaut. Une fois activé, les boissons sont enregistrées en grammes d'éthanol pur et affichées en verres standards américains ou en unités britanniques, selon ta préférence. Rien n'est déduit automatiquement pour toi : ça vient d'une boisson que tu enregistres ou d'une colonne alcool dans un fichier que tu importes. Le désactiver à nouveau masque l'alcool de tes repas, objectifs et résumés et empêche l'importateur de lire les colonnes alcool — ce n'est pas un interrupteur de suppression, et ton export CSV inclut toujours ce que tu as enregistré.",
        },
        {
            question:
                "Puis-je importer mon historique depuis MyFitnessPal ou une autre app ?",
            visibleHtml:
                "Oui. Demande à importer ton historique et un importateur s'ouvre dans le chat : tu choisis le CSV exporté par ton ancienne app, tu vérifies comment ses colonnes sont associées, et tu vois ce qui sera ajouté avant de confirmer. Les exports de MyFitnessPal, Cronometer, Lose It! et MacroFactor sont reconnus automatiquement, et tout autre CSV fonctionne en associant toi-même les colonnes. Ton navigateur lit le fichier, donc l'IA ne retape jamais tes lignes. Dans les clients sans panneaux intégrés au chat, tu peux coller ton export à la place — et importer deux fois le même fichier ne crée pas de doublons.",
        },
        {
            question: "Mes données sont-elles privées ?",
            visibleHtml:
                "Tes données sont stockées de façon sécurisée et liées à ton compte personnel. Toi seul peux accéder à ton historique nutritionnel via ta session authentifiée. Nutrition MCP ne vend ni ne partage tes données, et tu peux supprimer ton compte et toutes tes données à tout moment.",
        },
    ],
};
