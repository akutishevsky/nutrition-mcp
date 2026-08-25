// Japanese (ja) translation of the landing page content — see src/copy/index.ts
// for the authoritative shape (`IndexDoc`) and the full doc comments on what
// each field means and why the decorative chat-widget blocks are stored as
// one trusted HTML block per message rather than split field-by-field.
//
// Terminology kept consistent across the widget mockups and prose:
// protein → タンパク質, carbs → 炭水化物, fat → 脂質, fiber → 食物繊維,
// (total) sugar → 糖類, alcohol → アルコール（純アルコール換算のグラム）,
// caffeine → カフェイン, meal → 食事, water → 水分, weigh-in → 記録,
// goals/target → 目標, limit → 上限, timezone → タイムゾーン,
// export → エクスポート, trends → トレンド. Standard polite です/ます
// register throughout the prose, matching how a modern consumer SaaS
// product speaks in Japanese; link/button labels use plain/dictionary
// form where that's the natural Japanese UI convention (e.g. a bare
// noun phrase like "食事を記録"), even inside an otherwise です/ます page.
// Proper nouns (Nutrition MCP, Claude, ChatGPT, GitHub, MyFitnessPal,
// Cronometer, Lose It!, MacroFactor, MCP) stay in Latin script, never
// transliterated into katakana. Numbers stay half-width digits with the
// same comma thousands-separator as the English source (e.g. "2,100") —
// unlike French's narrow-space grouping, Japanese numeral convention
// matches English here, so figures inside the widget mockups are
// byte-identical to src/copy/index.ts.

import type { IndexDoc } from "./index.js";

const HERO_CHIPS_HTML_PLACEHOLDER = `
                            <span class="chip chip-1"
                                ><i style="--c: var(--cal)"></i
                                ><b>+340</b> kcal</span
                            >
                            <span class="chip chip-2"
                                ><i style="--c: #8b5cf6"></i
                                ><b>20 g</b> タンパク質</span
                            >
                            <span class="chip chip-3"
                                ><i style="--c: #10b981"></i
                                ><b>30 g</b> 炭水化物</span
                            >
                            <span class="chip chip-4"
                                ><i style="--c: #0ea5e9"></i
                                ><b>500 ml</b> 水分</span
                            >`;
const HERO_CHAT_HTML_PLACEHOLDER = `
                                <div class="cw-header">
                                    <span class="cw-avatar"
                                        ><i class="fa-solid fa-apple-whole"></i
                                    ></span>
                                    <span class="cw-title">Nutrition MCP</span>
                                    <span class="cw-status">オンライン</span>
                                </div>
                                <div class="cw-body">
                                    <div class="chat-thread">
                                        <div class="msg msg-user">
                                            朝食に卵2個、全粒粉トースト、コーヒー
                                        </div>

                                        <div class="msg msg-ai">
                                            <div class="wdg">
                                                <div class="wdg-head">
                                                    <div class="wdg-title">
                                                        食事を記録しました
                                                    </div>
                                                    <div class="wdg-sub">
                                                        卵2個、トースト、コーヒー
                                                        · 朝食
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
                                                                    本日のカロリー
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
                                                                            2,100</span
                                                                        >
                                                                    </div>
                                                                    <div
                                                                        class="wdg-calleft"
                                                                    >
                                                                        残り1,760
                                                                        kcal
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
                                                                            >タンパク質</span
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
                                                                            >炭水化物</span
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
                                                                            >脂質</span
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
                                                                            >糖類</span
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
                                                                        上限45
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
                                                                            >カフェイン</span
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
                                                                        上限
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
                                                                            >食物繊維</span
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
                                                                        目標30
                                                                        g
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div
                                                                class="wdg-mhint"
                                                                aria-hidden="true"
                                                            >
                                                                数値をタップすると対象の食事が表示されます
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            完了しました —
                                            朝食に卵2個、トースト、コーヒーを記録しました。約340
                                            kcal（タンパク質20g、炭水化物30g、脂質15g、食物繊維3.4g）、コーヒーからカフェイン95mgです。
                                        </div>

                                        <div class="msg msg-user">
                                            体重の推移はどうですか?
                                        </div>

                                        <div class="msg msg-ai">
                                            <div class="wdg">
                                                <div class="wdg-head wdg-mid">
                                                    <div class="wdg-title">
                                                        体重
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
                                                            直近
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
                                                            7月5日から −0.6 kg
                                                        </div>
                                                    </div>
                                                    <svg
                                                        class="wdg-wchart"
                                                        viewBox="0 0 300 62"
                                                        role="img"
                                                        aria-label="7月5日から7月11日までの体重推移、直近74.5 kg"
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
                                                        >7回の記録 · 7月5日 →
                                                        7月11日</span
                                                    >
                                                    <span
                                                        ><b>目標73.0 kg</b> ·
                                                        あと1.5 kgで達成</span
                                                    >
                                                </div>
                                            </div>
                                            今週は0.6kg減り、目標の73kgまであと1.5kgです
                                            —
                                            7日間平均は順調に下降しています。
                                        </div>
                                    </div>
                                </div>
                                <div class="cw-input">
                                    <span class="cw-field"
                                        >Nutritionにメッセージ…</span
                                    >
                                    <span class="cw-send"
                                        ><i class="fa-solid fa-arrow-up"></i
                                    ></span>
                                </div>`;
const SLIDE_1_HTML_PLACEHOLDER = `
                                            <div class="msg msg-user">
                                                昼食にチキンブリトーボウルを記録して
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
                                                            食事を記録しました
                                                        </div>
                                                        <div class="wdg-sub">
                                                            チキンブリトーボウル
                                                            · 昼食
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
                                                                        本日のカロリー
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
                                                                                2,100</span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-calleft"
                                                                        >
                                                                            残り1,110
                                                                            kcal
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
                                                                                >タンパク質</span
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
                                                                                >炭水化物</span
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
                                                                                >脂質</span
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
                                                                                >糖類</span
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
                                                                            上限
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
                                                                                >カフェイン</span
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
                                                                            上限
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
                                                                                >食物繊維</span
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
                                                                            目標
                                                                            30 g
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    class="wdg-mhint"
                                                                    aria-hidden="true"
                                                                >
                                                                    数値をタップすると対象の食事が表示されます
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
                                                                >水分</span
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
                                                了解しました —
                                                昼食にチキンブリトーボウルを記録しました。約650
                                                kcal（タンパク質42g、炭水化物68g、脂質22g）、豆から食物繊維12gです。
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
                                                    aria-label="夕食の皿の写真"
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
                                                これが夕食です —
                                                何が入っていますか?
                                            </div>
                                            <div
                                                class="typing"
                                                aria-hidden="true"
                                            >
                                                <span></span><span></span
                                                ><span></span>
                                            </div>
                                            <div class="msg msg-ai">
                                                グリルサーモンにご飯とブロッコリーのようですね
                                                — 夕食に記録しました。約540
                                                kcal（タンパク質38g、炭水化物45g、脂質20g）です。
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
                                                    aria-label="商品バーコードの写真"
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
                                                これを記録して
                                            </div>
                                            <div
                                                class="typing"
                                                aria-hidden="true"
                                            >
                                                <span></span><span></span
                                                ><span></span>
                                            </div>
                                            <div class="msg msg-ai step-ask">
                                                見つかりました —
                                                Chobaniのギリシャヨーグルト、1カップ:120
                                                kcal、タンパク質15g。どの食事に記録しますか?
                                                <div class="meal-pick">
                                                    <span class="meal-chip"
                                                        >朝食</span
                                                    >
                                                    <span class="meal-chip"
                                                        >昼食</span
                                                    >
                                                    <span class="meal-chip"
                                                        >夕食</span
                                                    >
                                                    <span
                                                        class="meal-chip meal-pick-target"
                                                        >間食</span
                                                    >
                                                </div>
                                            </div>
                                            <div class="msg msg-ai step-done">
                                                <div class="wdg">
                                                    <div class="wdg-head">
                                                        <div class="wdg-title">
                                                            食事を記録しました
                                                        </div>
                                                        <div class="wdg-sub">
                                                            Chobaniのギリシャヨーグルト、1カップ
                                                            · 間食
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
                                                                        本日のカロリー
                                                                    </div>
                                                                    <div
                                                                        class="wdg-calline"
                                                                    >
                                                                        <div
                                                                            class="wdg-calval"
                                                                        >
                                                                            1,540<span
                                                                                class="wdg-calgoal"
                                                                                >/
                                                                                2,100</span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-calleft"
                                                                        >
                                                                            残り560
                                                                            kcal
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
                                                                                >タンパク質</span
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
                                                                                >炭水化物</span
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
                                                                                >脂質</span
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
                                                                                >糖類</span
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
                                                                            上限
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
                                                                                >カフェイン</span
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
                                                                            上限
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
                                                                                >食物繊維</span
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
                                                                            目標
                                                                            30 g
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    class="wdg-mhint"
                                                                    aria-hidden="true"
                                                                >
                                                                    数値をタップすると対象の食事が表示されます
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                間食に記録しました — 120
                                                kcal、タンパク質15g、糖類9gです。
                                            </div>`;
const SLIDE_4_HTML_PLACEHOLDER = `
                                            <div class="msg msg-user">
                                                タイムゾーンをニューヨークに設定して
                                            </div>
                                            <div
                                                class="typing"
                                                aria-hidden="true"
                                            >
                                                <span></span><span></span
                                                ><span></span>
                                            </div>
                                            <div class="msg msg-ai">
                                                完了しました —
                                                1日の区切りが東部時間の深夜0時になったので、どこにいても今日の合計が正確になります。
                                            </div>`;
const SLIDE_5_HTML_PLACEHOLDER = `
                                            <div class="msg msg-user">
                                                今日のタンパク質摂取量はどうですか?
                                            </div>
                                            <div
                                                class="typing"
                                                aria-hidden="true"
                                            >
                                                <span></span><span></span
                                                ><span></span>
                                            </div>
                                            <div class="msg msg-ai">
                                                目標150gのうち118gです —
                                                あと32g。ギリシャヨーグルト1カップか鶏むね肉1枚で達成できます。
                                            </div>`;
const SLIDE_6_HTML_PLACEHOLDER = `
                                            <div class="msg msg-user">
                                                今週のトレンドを見せて
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
                                                            トレンド
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
                                                                >カロリー/日</span
                                                            >
                                                            <span
                                                                class="wdg-cmeta"
                                                                >7/7日
                                                                記録済み</span
                                                            >
                                                        </div>
                                                        <svg
                                                            viewBox="0 0 480 54"
                                                            role="img"
                                                            aria-label="過去7日間の1日あたりカロリー"
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
                                                                        7日間平均
                                                                        ·
                                                                        全日
                                                                    </div>
                                                                    <div
                                                                        class="wdg-calline"
                                                                    >
                                                                        <div
                                                                            class="wdg-calval"
                                                                        >
                                                                            1,980<span
                                                                                class="wdg-calgoal"
                                                                                >/
                                                                                2,100</span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-calleft"
                                                                        >
                                                                            120
                                                                            kcal少ない
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
                                                                                >タンパク質</span
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
                                                                                >炭水化物</span
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
                                                                                >脂質</span
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
                                                                                >糖類</span
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
                                                                            上限
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
                                                                                >カフェイン</span
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
                                                                            上限
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
                                                                                >食物繊維</span
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
                                                                            目標
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
                                                                >水分</span
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
                                                1日平均1,980
                                                kcalです —
                                                目標より120
                                                kcal少なく、糖類とカフェインもどちらも上限内に余裕があります。食物繊維は平均26.8
                                                gで、目標の30
                                                gにわずかに届いていません。
                                            </div>`;
const SLIDE_7_HTML_PLACEHOLDER = `
                                            <div class="msg msg-user">
                                                体重を記録して、74.5 kg
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
                                                            体重
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
                                                                直近
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
                                                                7月5日から
                                                                −0.6 kg
                                                            </div>
                                                        </div>
                                                        <svg
                                                            class="wdg-wchart"
                                                            viewBox="0 0 300 62"
                                                            role="img"
                                                            aria-label="7月5日から7月11日までの体重推移、直近74.5 kg"
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
                                                            >7回の記録 · 7月5日
                                                            → 7月11日</span
                                                        >
                                                        <span
                                                            ><b
                                                                >目標73.0
                                                                kg</b
                                                            >
                                                            · あと1.5
                                                            kgで達成</span
                                                        >
                                                    </div>
                                                </div>
                                                記録しました —
                                                目標に近づいています。
                                            </div>`;

export const INDEX_JA: IndexDoc = {
    title: "Nutrition MCP — ClaudeとChatGPTで使えるAI食事・栄養トラッカー",
    metaDescription:
        "ClaudeやChatGPTとの会話で食事・栄養素・体重・履歴を記録。AIによる食事記録、バーコードスキャン、カロリー計算、体重管理、食事管理ができる無料のMCPサーバーです。",
    ogDescription:
        "ClaudeやChatGPTとの会話で食事・栄養素・体重・履歴を記録。AIによる食事記録、バーコードスキャン、体重管理ができる無料のMCPサーバーです。",
    keywords:
        "栄養トラッカー, 食事記録, MCPサーバー, Claude AI, ChatGPT, カロリーカウンター, 栄養素トラッカー, バーコードスキャナー, 食事ログ, ダイエット管理, 体重トラッカー, 体重記録, AI栄養管理, Model Context Protocol",

    chatChrome: {
        brand: "Nutrition MCP",
        status: "オンライン",
        inputPlaceholder: "Nutritionにメッセージ…",
    },

    hero: {
        eyebrow: "無料 · オープンソース · OAuth 2.0",
        titleBeforeEm: "AIに",
        titleEm: "話しかける",
        titleAfterEm: "だけで栄養管理。",
        lead: "ClaudeまたはChatGPTを接続して、食べたものを話すだけ。カロリーと栄養素が自動で記録されます。",
        ctaPrimary: "かんたん導入",
        ctaSecondary: "サポート",
        chipsHtml: HERO_CHIPS_HTML_PLACEHOLDER,
        chatHtml: HERO_CHAT_HTML_PLACEHOLDER,
    },

    how: {
        eyebrow: "使い方",
        title: "3ステップ。覚えるアプリはありません。",
        steps: [
            {
                title: "一度接続するだけ",
                body: "リモートMCPサーバーに対応したAIクライアントならどれでも使えます — Claude、ChatGPTなど。インストールもAPIキーも不要です。",
            },
            {
                title: "食べたものを話すだけ",
                body: "普通の言葉で説明するだけ — 食事の写真、デリバリーアプリのスクリーンショット、バーコード（オンラインで商品を検索します）を送ってもOKです。栄養素は自動で記録されます。",
            },
            {
                title: "記録して振り返る",
                body: "日次サマリー、週次トレンド、目標の進捗を聞いたり、記録したすべてをCSVファイルとしてエクスポートしたりできます — すべて無料です。",
            },
        ],
    },

    install: {
        eyebrow: "かんたん導入",
        title: "1分足らずで接続完了",
        sub: "OAuth 2.0（PKCE対応）をサポートするMCPクライアントならどれでも使えます。初回接続時にGoogleまたはメールアドレスとパスワードでアカウントを作成し、同じ方法でサインインすればデータを引き継げます。",
        claude: {
            steps: [
                "<strong>Claude</strong>（Webまたはデスクトップ版）を開き、左上の<strong>カスタマイズ</strong>をクリックします。",
                "<strong>コネクタ</strong>をクリックします。",
                "<strong>+</strong>をクリックし、<strong>カスタムコネクタを追加</strong>を選択します。",
                "名前を付けます（例:<strong>Nutrition</strong>）。",
                '<strong>リモートMCPサーバーURL</strong>欄に<span class="copy-url"><code>https://nutrition-mcp.com/mcp</code><button class="copy-mini" type="button" data-copy="https://nutrition-mcp.com/mcp" aria-label="サーバーURLをコピー"><i class="fa-solid fa-copy"></i></button></span>を貼り付けます。',
                "<strong>追加</strong>をクリックします。",
                "<strong>接続</strong>をクリックすると、ログインページが開きます。Googleで続行するか、メールアドレスとパスワードでサインインしてください。",
                "完了です。すぐに使えるようになり、iOS・Androidアプリにも自動的に反映されます。",
            ],
            note: "すべてのClaudeプランで利用できます。無料プランでは同時に接続できるMCPサーバーは1つまでです。",
        },
        chatgpt: {
            steps: [
                "<strong>ChatGPT（Web版）</strong>を開き、<strong>設定</strong> → <strong>アプリ</strong>に進みます。",
                "ポップアップ下部の<strong>アプリを作成</strong>をクリックします。表示されない場合は、<strong>詳細設定</strong>で<strong>開発者モード</strong>をオンにしてください。",
                "名前を付けます（例:<strong>Nutrition</strong>）。",
                '<strong>Connection</strong>には、<span class="copy-url"><code>https://nutrition-mcp.com/mcp</code><button class="copy-mini" type="button" data-copy="https://nutrition-mcp.com/mcp" aria-label="サーバーURLをコピー"><i class="fa-solid fa-copy"></i></button></span>を貼り付けます。',
                "<strong>Authentication</strong>では<strong>OAuth</strong>を選択し、それ以外はそのままにします。",
                '<strong>"I understand and want to continue"</strong>にチェックを入れます。',
                "<strong>作成</strong>をクリックします。",
                "<strong>Nutritionでサインイン</strong>をクリックすると、ログインページが開きます。Googleで続行するか、メールアドレスとパスワードでサインインしてください。",
                "完了です。すぐに使えるようになり、iOS・Androidアプリにも自動的に反映されます。",
            ],
        },
        other: {
            note: "上記の設定をお使いのクライアント（Cursor、VS Code、Claude Codeなど）に追加してください。Windsurfでは<code>url</code>の代わりに<code>serverUrl</code>を使います。Claude Codeでは<code>claude mcp add --transport http nutrition https://nutrition-mcp.com/mcp</code>を実行します。OAuthログインはクライアントが自動的に処理します。",
        },
        otherTabLabel: "その他のエージェント",
    },

    onboarding: {
        eyebrow: "オンボーディング",
        title: "一度設定するか、そのまま話し始めるか",
        sub: "こちらは完全に任意です — Nutrition MCPは接続した瞬間から使えます。より正確にしたい場合は、次の3つの簡単なステップを行ってください。もちろん、そのまま記録を始めてもかまいません。",
        steps: [
            '<strong>タイムゾーンを設定</strong> — 現地時間の深夜0時に日付が切り替わり、どこにいても今日の合計が正確になります。<span class="step-say"><q>タイムゾーンをニューヨークに設定して</q>と言うだけ。</span>',
            '<strong>目標を設定</strong> — 1日あたりのカロリー・栄養素・水分の目標に加え、任意で目標体重と単位（kgまたはlb）を設定して、進捗を追跡できます。<span class="step-say"><q>1日の目標を2,000カロリーとタンパク質150gに設定して</q>と言うだけ。</span>',
            '<strong>言語を設定</strong> — チャット内ウィジェット（ダッシュボードやグラフ）を表示する言語です。AIがあなたに返す文章の言語ではありません。<span class="step-say"><q>ウィジェットをドイツ語で表示して</q>と言うだけ。</span>',
            '<strong>記録を始める</strong> — 食べたものを話すか、写真を送るか、バーコードをスキャンするだけ。それだけです。<span class="step-say"><q>朝食にベリー入りオートミールを食べました</q>と言うだけ。</span>',
        ],
        note: "ここでの設定はすべて任意です。今すぐでも、後からでも、しなくても構いません — まずは記録を始めて、好きなタイミングで設定してください。",
        toolsCta: {
            heading: "実際に何ができるか気になりますか?",
            body: "記録、バーコード、水分、体重、目標、トレンドなど、全36個のツールをそれぞれの説明とプロンプト例つきで確認できます。",
            arrow: "ツールを見る",
        },
    },

    try: {
        eyebrow: "こう話しかけてみて",
        title: "話しかけるだけ。",
        sub: "話しかけるだけでできることの一部です。",
        prevLabel: "前の例",
        nextLabel: "次の例",
        exampleLabel: "例",
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
        eyebrow: "みんなでここまで記録",
        title: "世界中で広がる食事記録",
        factsTitle: "栄養成分表示",
        servingPrefix: "内容量 ",
        servingBold: "これまでの全員",
        liveLabel: "ライブ",
        calLabel: "カロリー ",
        calSmall: "これまでの累計",
        calCaption: "追跡したカロリーの合計",
        rowFoodLogs: "食事ログ数",
        rowProtein: "タンパク質",
        rowCarbs: "炭水化物",
        rowFat: "脂質",
        unitGroupLabel: "重量の単位",
        unitKgLabel: "キログラム",
        unitLbLabel: "ポンド",
        foot: "全アカウントの合計値で、食事が記録されるたびに更新されます。個人のデータが表示されることはありません。",
        mapPrefix: "世界の",
        mapSuffix: "のタイムゾーンで記録",
        mapAriaLabel: "Nutrition MCPが使われているタイムゾーンを示す世界地図",
    },

    features: {
        eyebrow: "チャットするだけで、すべてが揃う",
        title: "記録できること",
        cards: [
            {
                icon: "fa-solid fa-utensils",
                title: "自然な言葉で食事記録",
                body: "食べたものを説明するだけで、AIがカロリー、タンパク質、炭水化物、脂質、食物繊維、総糖類、カフェイン（mg）を推定して記録します。",
            },
            {
                icon: "fa-solid fa-barcode",
                title: "バーコードをスキャン",
                body: "商品のバーコードを撮影または入力すると、Open Food Factsから栄養素・食物繊維・糖類を取得し、食べた量に合わせて調整します。",
            },
            {
                icon: "fa-solid fa-bullseye",
                title: "目標と進捗",
                body: "1日あたりのカロリー・栄養素・食物繊維・水分の目標を設定し、糖類・カフェイン・アルコールの上限も決められます。進捗はリアルタイムで確認できます。",
            },
            {
                icon: "fa-solid fa-chart-area",
                title: "サマリーとトレンド",
                body: "日次・週次の内訳、7/14/30日間のトレンド、連続記録日数、よく食べるパターンを確認できます。",
            },
            {
                icon: "fa-solid fa-glass-water",
                title: "水分記録",
                body: "食事と合わせて水分摂取量（ml）を記録し、日ごとに振り返れます。",
            },
            {
                icon: "fa-solid fa-weight-scale",
                title: "体重管理",
                body: "体重をkgまたはlbで記録し、7/14/30日間のトレンドを確認して、目標体重への進捗を追跡できます。",
            },
            {
                icon: "fa-solid fa-clock-four",
                title: "タイムゾーン対応",
                body: "世界のどこにいても、現地時間で日付が切り替わります。",
            },
            {
                icon: "fa-solid fa-file-import",
                title: "他のアプリからインポート",
                body: "MyFitnessPal、Cronometer、Lose It!、MacroFactorから食事履歴を持ち込めます — その他のCSVでも列を自分で対応付ければ利用できます。保存する前に、追加内容を確認できます。",
            },
            {
                icon: "fa-solid fa-file-csv",
                title: "エクスポートしてデータを所有",
                body: "食事、水分、体重、目標、プロフィールなど、ここにあるすべてのデータをCSVファイルのZIPとして取得できます。現時点で再インポートできるのは食事のみです。アカウントとデータはいつでも削除できます。",
            },
        ],
    },

    why: {
        eyebrow: "Nutrition MCPを選ぶ理由",
        title: "タップより、話す方が早い。",
        sub: "バーコードを撮るか、食べたものを話すだけ — データベースを探し回る必要も、別のアプリを開く必要もありません。",
        oldHeading: "従来のアプリ",
        oldItems: [
            "食品ごとにデータベースを検索",
            "間違ったデータを手作業で修正",
            "また別のアプリ、アカウント、課金",
            "面倒な手入力",
        ],
        newHeading: "Nutrition MCP",
        newItems: [
            "自然な言葉で食事を説明するだけ",
            "カロリーと栄養素を自動で推定",
            "ClaudeやChatGPT内で無料で使える",
            "トレンド・サマリー・目標もすぐ聞ける",
        ],
        noteHtml:
            '特定のアプリから乗り換えを検討中ですか? Nutrition MCPが<a href="/alternatives" data-link="alternatives">MyFitnessPal、Cronometerなど他のトラッカー</a>とどう違うかご覧ください。',
    },

    trust: [
        {
            label: "デフォルトで非公開",
            small: "データを見られるのはあなただけです。",
        },
        {
            label: "オープンソース",
            small: "コードを確認したり、自分でホストしたりできます。",
        },
        {
            label: "いつでもエクスポート",
            small: "すべてのテーブルをCSVで、1つのZIPにまとめて。",
        },
        {
            label: "即座に削除",
            small: "アカウントとデータを削除できます。",
        },
    ],

    support: {
        eyebrow: "サポート",
        title: "運営を支えてください。",
        sub: "Nutrition MCPは無料・広告なしです。サーバーとデータベースの費用はPatreonでまかなっています。",
        free: {
            tier: "無料メンバー",
            price: "$0",
            desc: "フォローして最新情報をチェック — サーバー、新しいツール、今後の予定についてのニュースが届きます。",
            cta: "Patreonでフォロー",
        },
        paid: {
            tier: "有料メンバー",
            price: "任意の金額で支援",
            desc: "ホスティングとデータベースの費用を支援して、サーバーがみんなのために無料で稼働し続けられるようにしましょう。",
            cta: "支援者になる",
        },
    },

    cta: {
        title: "1分足らずで記録を始めよう。",
        sub: "無料でオープンソース — すでに使っているAIでそのまま使えます。",
        primary: "かんたん導入",
        secondary: "GitHubでStar",
    },

    contact: {
        eyebrow: "お問い合わせ",
        title: "質問やフィードバックはありますか?",
        sub: "バグを見つけた、機能の要望がある、質問がある — どんなことでも直接メールしてください。すべてのメッセージに目を通しています。",
        cta: "メールを送る",
    },

    faqSection: {
        eyebrow: "FAQ",
        title: "よくある質問",
    },
    faq: [
        {
            question: "Nutrition MCPとは?",
            visibleHtml:
                "Nutrition MCPは、ClaudeやChatGPTとの自然な会話を通じて食事・カロリー・栄養素・栄養履歴を記録できる無料のModel Context Protocol（MCP）サーバーです。従来のアプリに入力する代わりに、AIに食べたものを伝えるだけで、すべて自動で記録されます。",
        },
        {
            question: "Model Context Protocol（MCP）とは?",
            visibleHtml:
                "Model Context Protocolは、ClaudeやChatGPTのようなAIアシスタントが外部のツールやデータソースに接続できるようにするオープンな標準規格です。MCPサーバーは特定の機能（ここでは栄養管理）を提供し、AIは会話の中でそれを利用できます。AIアシスタント向けのプラグインシステムのようなものだと考えてください。",
        },
        {
            // The visible answer deliberately omits the server URL (already
            // stated elsewhere on the page); the JSON-LD answer, read
            // standalone by search engines, states it explicitly. This
            // mismatch predates this extraction — preserved verbatim rather
            // than silently reconciled.
            question: "ChatGPTでも使えますか?",
            visibleHtml:
                "はい。ChatGPT（Web版）で設定 → アプリを開き、サーバーURLを使ってOAuthでカスタムアプリを作成し、サインインしてください。すべてのChatGPTプランで利用できます。",
            jsonLdText:
                "はい。ChatGPT（Web版）で設定 → アプリを開き、サーバーURL https://nutrition-mcp.com/mcp を使ってOAuthでカスタムアプリを作成し、サインインしてください。すべてのChatGPTプランで利用できます。",
        },
        {
            question: "他にどのクライアントに対応していますか?",
            visibleHtml:
                "OAuth 2.0（PKCE対応）をサポートするMCPクライアントであれば利用できます — Claude.ai、Claudeのデスクトップ・モバイルアプリ、Claude Code、Cursor、Windsurf、VS Codeなど。",
        },
        {
            question: "セルフホストできますか?",
            visibleHtml:
                'はい。Nutrition MCPはオープンソース（MITライセンス）です。独自のSupabaseプロジェクトで自分のインスタンスを運用できます — <a href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer">GitHubリポジトリ</a>には、詳しいセルフホスティングガイドとDockerfileが含まれています。',
        },
        {
            question: "Nutrition MCPは無料ですか?",
            visibleHtml:
                "はい、完全に無料です — プレミアムプラン、広告、隠れた費用は一切ありません。接続にはClaudeまたはChatGPTのアカウントが必要なだけです。Patreonでの寄付がサーバー費用を支えています。",
        },
        {
            question: "何を記録できますか?",
            visibleHtml:
                "カロリー、タンパク質、炭水化物、脂質、食物繊維、総糖類、水分をすべての記録について確認できます — 自然な言葉で説明するか、Open Food Facts経由で商品バーコードから取得します。カフェインもすべての表示ラベルで使われる単位、ミリグラムで記録され、カロリーには加算されません。アルコールもオンにすれば純アルコール量（グラム）で記録できます。体重もkgまたはlbで記録し、目標体重へのトレンドを追跡できます。日次サマリーの表示、期間指定での食事の検索、過去の記録の更新・削除、目標の設定、時系列でのトレンドの確認も可能です。",
        },
        {
            question: "アルコールも記録できますか?",
            visibleHtml:
                "オンにした場合のみです — アルコール記録はデフォルトでオフになっています。オンにすると、飲み物は純アルコール量（グラム）で記録され、お好みでUS標準ドリンクまたはUKユニットとして表示されます。AIが勝手にアルコールを推測することはありません。記録した飲み物か、インポートしたファイルのアルコール列からのみ反映されます。再びオフにすると、食事・目標・サマリーからアルコールが非表示になり、インポート時もアルコール列を読み込まなくなります — データが削除されるわけではなく、CSVエクスポートには常に記録した内容がすべて含まれます。",
        },
        {
            question:
                "MyFitnessPalなど他のアプリから履歴をインポートできますか?",
            visibleHtml:
                "はい。履歴のインポートを依頼すると、チャット内にインポーターが開きます。以前のアプリがエクスポートしたCSVを選び、列の対応付けを確認し、追加される内容を確認してから確定できます。MyFitnessPal、Cronometer、Lose It!、MacroFactorのエクスポートは自動的に認識され、その他のCSVも列を自分で対応付ければ利用できます。ファイルを読み込むのはブラウザなので、AIが行を書き写すことはありません。チャット内パネルに対応していないクライアントでは、エクスポートを貼り付けることもできます — 同じファイルを2回インポートしても重複は作成されません。",
        },
        {
            question: "データはプライベートに保たれますか?",
            visibleHtml:
                "データは安全に保存され、あなた個人のアカウントに紐づけられます。認証済みのセッションを通じて栄養履歴にアクセスできるのはあなただけです。Nutrition MCPはデータを販売・共有することはなく、アカウントとすべてのデータはいつでも削除できます。",
        },
    ],
};
