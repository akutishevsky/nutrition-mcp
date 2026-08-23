// Ukrainian translation of IndexDoc for the landing page. See
// src/copy/index.ts for the structural notes on Html-suffixed trusted
// markup fields and why the decorative hero chat demo / "Try saying"
// carousel are stored as whole HTML blocks rather than per-label fields.
// The widget-chrome labels inside those HTML blocks (Protein, Carbs,
// Water, "Meal logged", etc.) are translated in place, verbatim markup
// otherwise untouched; aria-label / class / data-* attribute values are
// left as-is per that file's guidance to keep markup and attributes
// untranslated.

import type { IndexDoc } from "./index.js";

const HERO_CHIPS_HTML_PLACEHOLDER = `
                            <span class="chip chip-1"
                                ><i style="--c: var(--cal)"></i
                                ><b>+340</b> ккал</span
                            >
                            <span class="chip chip-2"
                                ><i style="--c: #8b5cf6"></i
                                ><b>20 г</b> білка</span
                            >
                            <span class="chip chip-3"
                                ><i style="--c: #10b981"></i
                                ><b>30 г</b> вуглеводів</span
                            >
                            <span class="chip chip-4"
                                ><i style="--c: #0ea5e9"></i
                                ><b>500 мл</b> води</span
                            >`;
const HERO_CHAT_HTML_PLACEHOLDER = `
                                <div class="cw-header">
                                    <span class="cw-avatar"
                                        ><i class="fa-solid fa-apple-whole"></i
                                    ></span>
                                    <span class="cw-title">Nutrition MCP</span>
                                    <span class="cw-status">онлайн</span>
                                </div>
                                <div class="cw-body">
                                    <div class="chat-thread">
                                        <div class="msg msg-user">
                                            Два яйця, цільнозерновий тост і кава на сніданок
                                        </div>

                                        <div class="msg msg-ai">
                                            <div class="wdg">
                                                <div class="wdg-head">
                                                    <div class="wdg-title">
                                                        Прийом їжі додано
                                                    </div>
                                                    <div class="wdg-sub">
                                                        Два яйця, тост і кава · сніданок
                                                    </div>
                                                    <div
                                                        class="wdg-meta wdg-kcal"
                                                    >
                                                        +340 ккал
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
                                                                    Калорії сьогодні
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
                                                                        1 760 ккал залишилось
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
                                                                            >Білки</span
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
                                                                            >Вуглеводи</span
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
                                                                            >Жири</span
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
                                                                            >Цукор</span
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
                                                                        ліміт 45 г
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
                                                                            >Кофеїн</span
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
                                                                        ліміт 400 мг
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
                                                                            >Клітковина</span
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
                                                                        з 30 г
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div
                                                                class="wdg-mhint"
                                                                aria-hidden="true"
                                                            >
                                                                Торкнись показника, щоб побачити прийоми їжі
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            Готово — додав це до сніданку: два яйця, тост і кава. Це близько 340 ккал (20г білка, 30г вуглеводів, 15г жирів, 3.4г клітковини), а ще 95мг кофеїну з кави.
                                        </div>

                                        <div class="msg msg-user">
                                            Як змінюється моя вага?
                                        </div>

                                        <div class="msg msg-ai">
                                            <div class="wdg">
                                                <div class="wdg-head wdg-mid">
                                                    <div class="wdg-title">
                                                        Вага
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
                                                            Останнє
                                                        </div>
                                                        <div class="wdg-wval">
                                                            74.5<span
                                                                class="wdg-wunit"
                                                                >кг</span
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
                                                            −0.6 кг з 5 лип
                                                        </div>
                                                    </div>
                                                    <svg
                                                        class="wdg-wchart"
                                                        viewBox="0 0 300 62"
                                                        role="img"
                                                        aria-label="Weight from 5 Jul to 11 Jul, latest 74.5 kg"
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
                                                        >7 зважувань · 5 лип → 11 лип</span
                                                    >
                                                    <span
                                                        ><b>Ціль 73.0 кг</b> · залишилось 1.5 кг</span
                                                    >
                                                </div>
                                            </div>
                                            Цього тижня ти скинув 0.6 кг, і залишилось 1.5 кг до цілі в 73 кг — твоє середнє за 7 днів впевнено знижується.
                                        </div>
                                    </div>
                                </div>
                                <div class="cw-input">
                                    <span class="cw-field"
                                        >Повідомлення Nutrition…</span
                                    >
                                    <span class="cw-send"
                                        ><i class="fa-solid fa-arrow-up"></i
                                    ></span>
                                </div>`;
const SLIDE_1_HTML_PLACEHOLDER = `
                                            <div class="msg msg-user">
                                                Запиши боул з куркою буріто на обід
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
                                                            Прийом їжі додано
                                                        </div>
                                                        <div class="wdg-sub">
                                                            Боул з куркою буріто · обід
                                                        </div>
                                                        <div
                                                            class="wdg-meta wdg-kcal"
                                                        >
                                                            +650 ккал
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
                                                                        Калорії сьогодні
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
                                                                            1 110 ккал залишилось
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
                                                                                >Білки</span
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
                                                                                >Вуглеводи</span
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
                                                                                >Жири</span
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
                                                                                >Цукор</span
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
                                                                            ліміт 45 г
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
                                                                                >Кофеїн</span
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
                                                                            ліміт 400 мг
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
                                                                                >Клітковина</span
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
                                                                            з 30 г
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    class="wdg-mhint"
                                                                    aria-hidden="true"
                                                                >
                                                                    Торкнись показника, щоб побачити прийоми їжі
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
                                                                >Вода</span
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
                                                                    >/2.5 л</span
                                                                ></span
                                                            >
                                                        </div>
                                                    </div>
                                                </div>
                                                Готово — додав боул з куркою буріто до обіду, близько 650 ккал (42г білка, 68г вуглеводів, 22г жирів) і 12г клітковини з квасолі.
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
                                                    aria-label="Photo of a dinner plate"
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
                                                Ось моя вечеря — що в ній?
                                            </div>
                                            <div
                                                class="typing"
                                                aria-hidden="true"
                                            >
                                                <span></span><span></span
                                                ><span></span>
                                            </div>
                                            <div class="msg msg-ai">
                                                Схоже на лосося на грилі з рисом і броколі — записав до вечері, приблизно 540 ккал (38г білка, 45г вуглеводів, 20г жирів).
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
                                                    aria-label="Photo of a product barcode"
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
                                                Запиши це
                                            </div>
                                            <div
                                                class="typing"
                                                aria-hidden="true"
                                            >
                                                <span></span><span></span
                                                ><span></span>
                                            </div>
                                            <div class="msg msg-ai step-ask">
                                                Знайшов — грецький йогурт Chobani, 1 склянка: 120 ккал, 15г білка. Це який прийом їжі?
                                                <div class="meal-pick">
                                                    <span class="meal-chip"
                                                        >Сніданок</span
                                                    >
                                                    <span class="meal-chip"
                                                        >Обід</span
                                                    >
                                                    <span class="meal-chip"
                                                        >Вечеря</span
                                                    >
                                                    <span
                                                        class="meal-chip meal-pick-target"
                                                        >Перекус</span
                                                    >
                                                </div>
                                            </div>
                                            <div class="msg msg-ai step-done">
                                                <div class="wdg">
                                                    <div class="wdg-head">
                                                        <div class="wdg-title">
                                                            Прийом їжі додано
                                                        </div>
                                                        <div class="wdg-sub">
                                                            Грецький йогурт Chobani, 1 склянка · перекус
                                                        </div>
                                                        <div
                                                            class="wdg-meta wdg-kcal"
                                                        >
                                                            +120 ккал
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
                                                                        Калорії сьогодні
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
                                                                            560 ккал залишилось
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
                                                                                >Білки</span
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
                                                                                >Вуглеводи</span
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
                                                                                >Жири</span
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
                                                                                >Цукор</span
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
                                                                            ліміт 45 г
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
                                                                                >Кофеїн</span
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
                                                                            ліміт 400 мг
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
                                                                                >Клітковина</span
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
                                                                            з 30 г
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    class="wdg-mhint"
                                                                    aria-hidden="true"
                                                                >
                                                                    Торкнись показника, щоб побачити прийоми їжі
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                Записано до перекусів — 120 ккал, 15г білка, 9г цукру.
                                            </div>`;
const SLIDE_4_HTML_PLACEHOLDER = `
                                            <div class="msg msg-user">
                                                Встанови мій часовий пояс на Нью-Йорк
                                            </div>
                                            <div
                                                class="typing"
                                                aria-hidden="true"
                                            >
                                                <span></span><span></span
                                                ><span></span>
                                            </div>
                                            <div class="msg msg-ai">
                                                Готово — тепер твої дні змінюються опівночі за східним часом, тож сьогоднішні підсумки залишаються точними, де б ти не був.
                                            </div>`;
const SLIDE_5_HTML_PLACEHOLDER = `
                                            <div class="msg msg-user">
                                                Як у мене справи з білком сьогодні?
                                            </div>
                                            <div
                                                class="typing"
                                                aria-hidden="true"
                                            >
                                                <span></span><span></span
                                                ><span></span>
                                            </div>
                                            <div class="msg msg-ai">
                                                У тебе 118г із цілі 150г — залишилось 32г. Склянка грецького йогурту або куряче філе допоможуть це закрити.
                                            </div>`;
const SLIDE_6_HTML_PLACEHOLDER = `
                                            <div class="msg msg-user">
                                                Покажи мої тренди за цей тиждень
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
                                                            Тренди
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
                                                                >Калорії / день</span
                                                            >
                                                            <span
                                                                class="wdg-cmeta"
                                                                >7/7 днів записано</span
                                                            >
                                                        </div>
                                                        <svg
                                                            viewBox="0 0 480 54"
                                                            role="img"
                                                            aria-label="Calories per day over the last 7 days"
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
                                                                        середнє за 7 днів · усі дні
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
                                                                            120 ккал менше цілі
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
                                                                                >Білки</span
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
                                                                                >Вуглеводи</span
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
                                                                                >Жири</span
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
                                                                                >Цукор</span
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
                                                                            ліміт 45 г
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
                                                                                >Кофеїн</span
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
                                                                            ліміт 400 мг
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
                                                                                >Клітковина</span
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
                                                                            з 30 г
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
                                                                >Вода</span
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
                                                                    >/2.5 л</span
                                                                ></span
                                                            >
                                                        </div>
                                                    </div>
                                                </div>
                                                У середньому в тебе 1980 ккал на день — на 120 менше цілі, а цукор і кофеїн упевнено в межах лімітів. Клітковина в середньому 26.8 г, трохи не дотягує до цілі в 30 г.
                                            </div>`;
const SLIDE_7_HTML_PLACEHOLDER = `
                                            <div class="msg msg-user">
                                                Запиши мою вагу, 74.5 кг
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
                                                            Вага
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
                                                                Останнє
                                                            </div>
                                                            <div
                                                                class="wdg-wval"
                                                            >
                                                                74.5<span
                                                                    class="wdg-wunit"
                                                                    >кг</span
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
                                                                −0.6 кг з 5 лип
                                                            </div>
                                                        </div>
                                                        <svg
                                                            class="wdg-wchart"
                                                            viewBox="0 0 300 62"
                                                            role="img"
                                                            aria-label="Weight from 5 Jul to 11 Jul, latest 74.5 kg"
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
                                                            >7 зважувань · 5 лип → 11 лип</span
                                                        >
                                                        <span
                                                            ><b
                                                                >Ціль 73.0 кг</b
                                                            >
                                                            · залишилось 1.5 кг</span
                                                        >
                                                    </div>
                                                </div>
                                                Записано — ти рухаєшся до своєї цілі.
                                            </div>`;

export const INDEX_UK: IndexDoc = {
    title: `Nutrition MCP — ШІ-трекер прийомів їжі та макронутрієнтів для Claude і ChatGPT`,
    metaDescription: `Відстежуй прийоми їжі, макронутрієнти, вагу та історію харчування через розмову з Claude чи ChatGPT. Безкоштовний MCP-сервер для запису їжі на основі ШІ, сканування штрихкодів, підрахунку калорій, відстеження ваги та харчування.`,
    ogDescription: `Відстежуй прийоми їжі, макронутрієнти, вагу та історію харчування через розмову з Claude чи ChatGPT. Безкоштовний MCP-сервер для запису їжі на основі ШІ, сканування штрихкодів і відстеження ваги.`,
    keywords:
        "трекер харчування, трекер прийомів їжі, MCP сервер, Claude AI, ChatGPT, лічильник калорій, трекер макронутрієнтів, сканер штрихкодів, запис їжі, трекер дієти, трекер ваги, щоденник ваги, ШІ харчування, Model Context Protocol",

    chatChrome: {
        brand: "Nutrition MCP",
        status: "онлайн",
        inputPlaceholder: "Повідомлення Nutrition…",
    },

    hero: {
        eyebrow: "Безкоштовно · Відкритий код · OAuth 2.0",
        titleBeforeEm: `Відстежуй харчування, просто `,
        titleEm: "розмовляючи",
        titleAfterEm: ` зі своїм ШІ.`,
        lead: `Підключи Claude чи ChatGPT, а тоді просто скажи, що ти з'їв. Калорії та макронутрієнти запишуться автоматично.`,
        ctaPrimary: "Швидке підключення",
        ctaSecondary: "Підтримати",
        chipsHtml: HERO_CHIPS_HTML_PLACEHOLDER,
        chatHtml: HERO_CHAT_HTML_PLACEHOLDER,
    },

    how: {
        eyebrow: "Як це працює",
        title: `Три кроки. Жодного застосунку вчити не треба.`,
        steps: [
            {
                title: `Підключись один раз`,
                body: `Працює з будь-яким ШІ-клієнтом, що підтримує віддалені MCP-сервери — Claude, ChatGPT та інші. Не треба нічого встановлювати чи отримувати API-ключі.`,
            },
            {
                title: `Просто скажи, що ти з'їв`,
                body: `Опиши це звичайними словами — або надішли фото своєї страви, скриншот із застосунку доставки чи штрихкод (продукт буде знайдено онлайн). Макронутрієнти запишуться автоматично.`,
            },
            {
                title: `Відстежуй і переглядай`,
                body: `Попроси денні зведення, тижневі тренди, прогрес по цілях, або експортуй усе, що записав, у CSV-файли — цілком безкоштовно.`,
            },
        ],
    },

    install: {
        eyebrow: "Швидке підключення",
        title: `Підключись менш ніж за хвилину`,
        sub: `Працює з будь-яким MCP-клієнтом, що підтримує OAuth 2.0 з PKCE. При першому підключенні ти створюєш акаунт через Google або через email і пароль; заходь так само, щоб зберегти свої дані.`,
        claude: {
            steps: [
                `Відкрий <strong>Claude</strong> (у браузері чи застосунку) і натисни <strong>Customize</strong> у верхньому лівому куті.`,
                `Натисни <strong>Connectors</strong>.`,
                `Натисни <strong>+</strong>, а тоді <strong>Add custom connector</strong>.`,
                `Дай йому назву, наприклад <strong>Nutrition</strong>.`,
                `Встав <span class="copy-url"><code>https://nutrition-mcp.com/mcp</code><button class="copy-mini" type="button" data-copy="https://nutrition-mcp.com/mcp" aria-label="Копіювати URL сервера"><i class="fa-solid fa-copy"></i></button></span> у поле <strong>Remote MCP server URL</strong>.`,
                `Натисни <strong>Add</strong>.`,
                `Натисни <strong>Connect</strong> — відкриється сторінка входу; продовж через Google або увійди через email і пароль.`,
                `Готово. Усе запрацює одразу і автоматично з'явиться в застосунках для iOS та Android.`,
            ],
            note: `Працює на будь-якому плані Claude. Безкоштовний план дозволяє підключити один MCP-сервер одночасно.`,
        },
        chatgpt: {
            steps: [
                `Відкрий <strong>ChatGPT on the web</strong> → <strong>Settings</strong> → <strong>Apps</strong>.`,
                `Натисни <strong>Create app</strong> внизу спливного вікна. Якщо не бачиш цієї кнопки, увімкни <strong>Developer mode</strong> в <strong>Advanced settings</strong>.`,
                `Дай йому назву, наприклад <strong>Nutrition</strong>.`,
                `У полі <strong>Connection</strong> встав <span class="copy-url"><code>https://nutrition-mcp.com/mcp</code><button class="copy-mini" type="button" data-copy="https://nutrition-mcp.com/mcp" aria-label="Копіювати URL сервера"><i class="fa-solid fa-copy"></i></button></span>.`,
                `У полі <strong>Authentication</strong> обери <strong>OAuth</strong> — решту залиш без змін.`,
                `Постав галочку <strong>"I understand and want to continue"</strong>.`,
                `Натисни <strong>Create</strong>.`,
                `Натисни <strong>Sign in with Nutrition</strong> — відкриється сторінка входу; продовж через Google або увійди через email і пароль.`,
                `Готово. Усе запрацює одразу і автоматично з'явиться в застосунках для iOS та Android.`,
            ],
        },
        other: {
            note: `Додай конфігурацію вище до свого клієнта (Cursor, VS Code, Claude Code та інших). Windsurf використовує <code>serverUrl</code> замість <code>url</code>. У Claude Code виконай <code>claude mcp add --transport http nutrition https://nutrition-mcp.com/mcp</code>. Твій клієнт сам обробить вхід через OAuth.`,
        },
        otherTabLabel: "Інші клієнти",
    },

    onboarding: {
        eyebrow: "Початок роботи",
        title: `Налаштуй один раз — або просто почни говорити`,
        sub: `Це повністю опціонально — Nutrition MCP працює одразу після підключення. Якщо хочеш, ці два швидкі кроки зроблять його точнішим, але можна одразу перейти до запису.`,
        steps: [
            `<strong>Встанови часовий пояс</strong> — щоб день змінювався опівночі за твоїм місцевим часом і сьогоднішні підсумки залишались точними, де б ти не був. <span class="step-say">Просто скажи <q>Встанови мій часовий пояс на Нью-Йорк</q>.</span>`,
            `<strong>Встанови свої цілі</strong> — денні цілі по калоріях, макронутрієнтах і воді, а також опціональну цільову вагу й обрану одиницю виміру (кг чи фунти), щоб відстежувати прогрес. <span class="step-say">Просто скажи <q>Встанови мою денну ціль на 2000 калорій і 150г білка</q>.</span>`,
            `<strong>Почни записувати</strong> — просто скажи, що ти з'їв, надішли фото чи заскануй штрихкод. Це все. <span class="step-say">Просто скажи <q>На сніданок я їв вівсянку з ягодами</q>.</span>`,
        ],
        note: `Усе це опціонально. Можеш зробити це зараз, пізніше або ніколи — просто почни записувати й налаштуй це, коли захочеш.`,
        toolsCta: {
            heading: `Цікаво, що він насправді вміє?`,
            body: `Переглянь усі 38 інструментів — запис, штрихкоди, вода, вага, цілі й тренди — з описом і прикладом запиту для кожного.`,
            arrow: "Перейти до інструментів",
        },
    },

    try: {
        eyebrow: "Спробуй сказати",
        title: `Просто заговори з ним.`,
        sub: `Кілька прикладів того, що можна зробити — просто розмовляючи.`,
        prevLabel: "Попередній приклад",
        nextLabel: "Наступний приклад",
        exampleLabel: "Приклад",
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
        eyebrow: "Відстежено разом, дотепер",
        title: `Глобальний щоденник їжі, що зростає`,
        factsTitle: "Харчова цінність",
        servingPrefix: "Розмір порції ",
        servingBold: "усі, дотепер",
        liveLabel: "Наживо",
        calLabel: "Калорії ",
        calSmall: "відстежено за весь час",
        calCaption: "Відстежено калорій",
        rowFoodLogs: "Записів їжі",
        rowProtein: "Білки",
        rowCarbs: "Вуглеводи",
        rowFat: "Жири",
        foot: `Загальні суми з усіх акаунтів, оновлюються під час запису прийомів їжі. Дані окремих користувачів ніколи не показуються.`,
        mapPrefix: "Записано в",
        mapSuffix: "часових поясах світу",
        mapAriaLabel:
            "Карта світу з часовими поясами, де використовують Nutrition MCP",
    },

    features: {
        eyebrow: "Усе — просто через чат",
        title: `Що можна відстежувати`,
        cards: [
            {
                icon: "fa-solid fa-utensils",
                title: `Прийоми їжі звичайними словами`,
                body: `Опиши, що ти з'їв — твій ШІ оцінить калорії, білок, вуглеводи, жири, клітковину, загальний цукор і кофеїн у міліграмах та запише це.`,
            },
            {
                icon: "fa-solid fa-barcode",
                title: `Скануй штрихкод`,
                body: `Сфотографуй або введи штрихкод продукту та отримай макронутрієнти, клітковину й цукор з Open Food Facts, масштабовані під з'їдену кількість.`,
            },
            {
                icon: "fa-solid fa-bullseye",
                title: `Цілі й прогрес`,
                body: `Встанови денні цілі по калоріях, макронутрієнтах, клітковині й воді — а також ліміти цукру, кофеїну й алкоголю — і перевіряй прогрес у режимі реального часу.`,
            },
            {
                icon: "fa-solid fa-chart-area",
                title: `Зведення й тренди`,
                body: `Денні й тижневі розбивки, тренди за 7/14/30 днів, серії записів та повторювані патерни харчування.`,
            },
            {
                icon: "fa-solid fa-glass-water",
                title: `Запис води`,
                body: `Відстежуй споживання води в мілілітрах поруч із прийомами їжі та переглядай по днях.`,
            },
            {
                icon: "fa-solid fa-weight-scale",
                title: `Відстеження ваги`,
                body: `Записуй вагу тіла в кг або фунтах, дивись тренди за 7/14/30 днів і стеж за прогресом до цільової ваги.`,
            },
            {
                icon: "fa-solid fa-clock-four",
                title: `Враховує часовий пояс`,
                body: `Дні змінюються за твоїм місцевим часом, де б ти не був у світі.`,
            },
            {
                icon: "fa-solid fa-file-import",
                title: `Імпорт з іншого застосунку`,
                body: `Перенеси історію прийомів їжі з MyFitnessPal, Cronometer, Lose It! або MacroFactor — або з будь-якого іншого CSV, самостійно зіставивши колонки. Ти підтверджуєш, що буде додано, перш ніж щось збережеться.`,
            },
            {
                icon: "fa-solid fa-file-csv",
                title: `Експортуй і володій своїми даними`,
                body: `Забери все, що тут є, — прийоми їжі, воду, вагу, цілі й профіль — одним ZIP-архівом CSV-файлів. Наразі назад можна імпортувати лише прийоми їжі. Видали свій акаунт і дані будь-коли.`,
            },
        ],
    },

    why: {
        eyebrow: "Чому Nutrition MCP",
        title: `Розмова краща за тапання.`,
        sub: `Сфотографуй штрихкод або просто скажи, що ти з'їв — без копирсання в базі даних, без окремого застосунку.`,
        oldHeading: "Традиційні застосунки",
        oldItems: [
            "Шукай у базі даних кожен продукт",
            "Виправляй неправильні записи вручну",
            "Ще один застосунок, акаунт і платний доступ",
            "Стомливий ручний запис",
        ],
        newHeading: "Nutrition MCP",
        newItems: [
            "Описуй прийоми їжі звичайними словами",
            "Калорії й макронутрієнти оцінюються за тебе",
            "Працює всередині Claude чи ChatGPT, безкоштовно",
            "Запитуй про тренди, зведення й цілі",
        ],
        noteHtml: `Переходиш з конкретного застосунку? Подивись, як Nutrition MCP порівнюється з <a href="/alternatives" data-link="alternatives">MyFitnessPal, Cronometer та іншими трекерами</a>.`,
    },

    trust: [
        {
            label: "Приватність за замовчуванням",
            small: "Тільки ти бачиш свої дані.",
        },
        {
            label: "Відкритий код",
            small: "Перевіряй код або розгортай самостійно.",
        },
        {
            label: "Експортуй будь-коли",
            small: "Кожна таблиця як CSV, в одному ZIP.",
        },
        { label: "Видаляй миттєво", small: `Видали свій акаунт і дані.` },
    ],

    support: {
        eyebrow: "Підтримка",
        title: `Допоможи це підтримувати.`,
        sub: `Nutrition MCP безкоштовний і без реклами. Patreon покриває рахунки за сервер і базу даних.`,
        free: {
            tier: "Безкоштовний учасник",
            price: "$0",
            desc: `Слідкуй за новинами — отримуй оновлення про сервер, нові інструменти та плани на майбутнє.`,
            cta: "Підписатися на Patreon",
        },
        paid: {
            tier: "Платний учасник",
            price: "Плати, скільки хочеш",
            desc: `Підтримай витрати на хостинг і базу даних, щоб сервер лишався безкоштовним і доступним для всіх.`,
            cta: "Стати спонсором",
        },
    },

    cta: {
        title: `Почни відстежувати менш ніж за хвилину.`,
        sub: `Безкоштовно і з відкритим кодом — працює з тим ШІ, яким ти вже користуєшся.`,
        primary: "Швидке підключення",
        secondary: "Постав зірку на GitHub",
    },

    contact: {
        eyebrow: "Контакти",
        title: `Питання чи відгук?`,
        sub: `Знайшов баг, хочеш нову функцію чи просто маєш питання? Напиши мені напряму — я читаю кожне повідомлення.`,
        cta: "Написати листа",
    },

    faqSection: {
        eyebrow: "FAQ",
        title: `Часті запитання`,
    },
    faq: [
        {
            question: `Що таке Nutrition MCP?`,
            visibleHtml: `Nutrition MCP — це безкоштовний сервер Model Context Protocol (MCP), який дозволяє відстежувати прийоми їжі, калорії, макронутрієнти та історію харчування через звичайну розмову з Claude чи ChatGPT. Замість того щоб вводити дані в традиційний застосунок, ти кажеш своєму ШІ, що з'їв, а він записує все за тебе.`,
        },
        {
            question: `Що таке Model Context Protocol (MCP)?`,
            visibleHtml: `Model Context Protocol — це відкритий стандарт, який дозволяє ШІ-асистентам на кшталт Claude і ChatGPT підключатися до зовнішніх інструментів і джерел даних. MCP-сервер надає конкретні можливості — у цьому випадку відстеження харчування — які ШІ може використовувати під час розмови. Сприймай це як систему плагінів для ШІ-асистентів.`,
        },
        {
            question: `Чи працює це з ChatGPT?`,
            visibleHtml: `Так. У ChatGPT в браузері відкрий Settings → Apps, створи власний застосунок з URL сервера через OAuth і увійди. Працює на будь-якому плані ChatGPT.`,
            jsonLdText: `Так. У ChatGPT в браузері відкрий Settings → Apps, створи власний застосунок з URL сервера https://nutrition-mcp.com/mcp через OAuth і увійди. Працює на будь-якому плані ChatGPT.`,
        },
        {
            question: `Які ще клієнти підтримуються?`,
            visibleHtml: `Будь-який MCP-клієнт, що підтримує OAuth 2.0 з PKCE — включно з Claude.ai, застосунками Claude для десктопу й мобільних пристроїв, Claude Code, Cursor, Windsurf і VS Code.`,
        },
        {
            question: `Чи можу я розгорнути це самостійно?`,
            visibleHtml: `Так. Nutrition MCP з відкритим кодом (MIT). Можеш запустити власний екземпляр із власним проєктом Supabase — <a href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer">репозиторій на GitHub</a> містить повний гайд із самостійного розгортання та Dockerfile.`,
        },
        {
            question: `Чи безкоштовний Nutrition MCP?`,
            visibleHtml: `Так, він повністю безкоштовний — без преміум-тарифів, реклами чи прихованих платежів. Тобі потрібен лише акаунт Claude чи ChatGPT, щоб підключитися. Донати на Patreon допомагають покривати витрати на сервер.`,
        },
        {
            question: `Що я можу відстежувати?`,
            visibleHtml: `Калорії, білок, вуглеводи, жири, клітковину та воду для кожного запису — описані звичайними словами або отримані за штрихкодом продукту через Open Food Facts. Кофеїн теж відстежується, у міліграмах, одиниці, яку використовує кожна етикетка, і він не додає калорій. Алкоголь теж відстежується, у грамах чистого етанолу, щойно ти це ввімкнеш. Ти також можеш записувати вагу тіла в кг або фунтах і стежити за трендами до цільової ваги. Переглядай денні зведення, запитуй прийоми їжі за період, оновлюй чи видаляй минулі записи, встановлюй цілі та відстежуй тренди з часом.`,
        },
        {
            question: `Чи відстежується алкоголь?`,
            visibleHtml: `Лише якщо ти це ввімкнеш — відстеження алкоголю за замовчуванням вимкнено. Коли ввімкнено, напої записуються в грамах чистого етанолу й показуються як американські стандартні порції або британські одиниці — що тобі більше підходить. Нічого не виводиться автоматично: дані беруться лише з напою, який ти записав, або з колонки алкоголю у файлі, який ти імпортував. Повторне вимкнення приховує алкоголь з прийомів їжі, цілей і зведень та зупиняє читання колонок алкоголю імпортером — це не кнопка видалення, і твій CSV-експорт завжди включає те, що ти записав.`,
        },
        {
            question: `Чи можу я імпортувати історію з MyFitnessPal чи іншого застосунку?`,
            visibleHtml: `Так. Попроси імпортувати свою історію, і в чаті відкриється імпортер: обери CSV, який експортував твій старий застосунок, перевір, як зіставились колонки, і подивись, що буде додано, перш ніж підтвердити. Експорти з MyFitnessPal, Cronometer, Lose It! і MacroFactor розпізнаються автоматично, а будь-який інший CSV працює через самостійне зіставлення колонок. Файл читає твій браузер, тож ШІ ніколи не перепечатує твої рядки. У клієнтах без панелей у чаті можна натомість вставити свій експорт текстом — а повторний імпорт того самого файлу не створює дублікатів.`,
        },
        {
            question: `Чи приватні мої дані?`,
            visibleHtml: `Твої дані зберігаються безпечно й прив'язані до твого особистого акаунта. Тільки ти маєш доступ до своєї історії харчування через свою автентифіковану сесію. Nutrition MCP не продає й не передає твої дані, і ти можеш видалити свій акаунт і всі дані будь-коли.`,
        },
    ],
};
