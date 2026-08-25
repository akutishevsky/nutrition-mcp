import type { IndexDoc } from "./index.js";

const HERO_CHIPS_HTML_PL = `
    <span class="chip chip-1"><i style="--c: var(--cal)"></i><b>+340</b> kcal</span>
    <span class="chip chip-2"><i style="--c: #8b5cf6"></i><b>20 g</b> białka</span>
    <span class="chip chip-3"><i style="--c: #10b981"></i><b>30 g</b> węglowodanów</span>
    <span class="chip chip-4"><i style="--c: #0ea5e9"></i><b>500 ml</b> wody</span>`;

const HERO_CHAT_HTML_PL = `
    <div class="cw-header">
        <span class="cw-avatar"><i class="fa-solid fa-apple-whole"></i></span>
        <span class="cw-title">Nutrition MCP</span>
        <span class="cw-status">online</span>
    </div>
    <div class="cw-body">
        <div class="chat-thread">
            <div class="msg msg-user">
                Dwa jajka, tosty pełnoziarniste i kawa na śniadanie
            </div>

            <div class="msg msg-ai">
                <div class="wdg">
                    <div class="wdg-head">
                        <div class="wdg-title">Posiłek zapisany</div>
                        <div class="wdg-sub">Dwa jajka, tosty i kawa · śniadanie</div>
                        <div class="wdg-meta wdg-kcal">+340 kcal</div>
                    </div>
                    <div class="wdg-strip">
                        <div class="wdg-srow">
                            <div class="wdg-cal">
                                <div class="wdg-gauge">
                                    <div class="wdg-ring" style="--c: var(--cal); --p: 16;"></div>
                                    <div class="wdg-rc">
                                        <span class="wdg-rp" style="color: var(--cal);">16%</span>
                                    </div>
                                </div>
                                <div class="wdg-caltxt">
                                    <div class="wdg-callab">Kalorie dzisiaj</div>
                                    <div class="wdg-calline">
                                        <div class="wdg-calval">340<span class="wdg-calgoal">/ 2 100</span></div>
                                        <div class="wdg-calleft">Zostało 1 760 kcal</div>
                                    </div>
                                </div>
                            </div>
                            <div class="wdg-grids">
                                <div class="wdg-mgrid">
                                    <div class="wdg-mtile">
                                        <div class="wdg-mtop">
                                            <span class="wdg-mkey">Białko</span>
                                            <span class="wdg-mnum">20<span class="wdg-msub">/150</span></span>
                                        </div>
                                        <div class="wdg-mbar">
                                            <div class="wdg-mfill" style="width: 13.3%; background: var(--pro);"></div>
                                        </div>
                                    </div>
                                    <div class="wdg-mtile">
                                        <div class="wdg-mtop">
                                            <span class="wdg-mkey">Węglowodany</span>
                                            <span class="wdg-mnum">30<span class="wdg-msub">/220</span></span>
                                        </div>
                                        <div class="wdg-mbar">
                                            <div class="wdg-mfill" style="width: 13.6%; background: var(--car);"></div>
                                        </div>
                                    </div>
                                    <div class="wdg-mtile">
                                        <div class="wdg-mtop">
                                            <span class="wdg-mkey">Tłuszcz</span>
                                            <span class="wdg-mnum">15<span class="wdg-msub">/70</span></span>
                                        </div>
                                        <div class="wdg-mbar">
                                            <div class="wdg-mfill" style="width: 21.4%; background: var(--fat);"></div>
                                        </div>
                                    </div>
                                </div>
                                <div class="wdg-mgrid wdg-lim wdg-sec">
                                    <div class="wdg-mtile">
                                        <div class="wdg-mtop">
                                            <span class="wdg-mkey">Cukry</span>
                                            <span class="wdg-mnum">2.5</span>
                                        </div>
                                        <div class="wdg-mbar">
                                            <div class="wdg-mfill" style="width: 5.6%; background: var(--sug);"></div>
                                        </div>
                                        <div class="wdg-mcap">limit 45 g</div>
                                    </div>
                                    <div class="wdg-mtile">
                                        <div class="wdg-mtop">
                                            <span class="wdg-mkey">Kofeina</span>
                                            <span class="wdg-mnum">95</span>
                                        </div>
                                        <div class="wdg-mbar">
                                            <div class="wdg-mfill" style="width: 23.8%; background: var(--caf);"></div>
                                        </div>
                                        <div class="wdg-mcap">limit 400 mg</div>
                                    </div>
                                    <div class="wdg-mtile">
                                        <div class="wdg-mtop">
                                            <span class="wdg-mkey">Błonnik</span>
                                            <span class="wdg-mnum">3.4</span>
                                        </div>
                                        <div class="wdg-mbar">
                                            <div class="wdg-mfill" style="width: 11.3%; background: var(--fib);"></div>
                                        </div>
                                        <div class="wdg-mcap">z 30 g</div>
                                    </div>
                                </div>
                                <div class="wdg-mhint" aria-hidden="true">Dotknij wskaźnika, by zobaczyć posiłki, które się na niego złożyły</div>
                            </div>
                        </div>
                    </div>
                </div>
                Gotowe — dodałem to do śniadania: dwa jajka, tosty i kawa. To około
                340 kcal (20 g białka, 30 g węglowodanów, 15 g tłuszczu, 3,4 g
                błonnika), plus 95 mg kofeiny z kawy.
            </div>

            <div class="msg msg-user">
                Jak wygląda trend mojej wagi?
            </div>

            <div class="msg msg-ai">
                <div class="wdg">
                    <div class="wdg-head wdg-mid">
                        <div class="wdg-title">Waga</div>
                        <div class="wdg-seg" aria-hidden="true">
                            <span class="wdg-seg-btn wdg-on">7</span>
                            <span class="wdg-seg-btn">14</span>
                            <span class="wdg-seg-btn">30</span>
                        </div>
                    </div>
                    <div class="wdg-wmain">
                        <div class="wdg-wnow">
                            <div class="wdg-wtag">Ostatni pomiar</div>
                            <div class="wdg-wval">74.5<span class="wdg-wunit">kg</span></div>
                            <div class="wdg-wdelta" style="color: var(--accent);">−0,6 kg od 5 lipca</div>
                        </div>
                        <svg class="wdg-wchart" viewBox="0 0 300 62" role="img" aria-label="Waga od 5 lipca do 11 lipca, ostatni pomiar 74,5 kg">
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
                        <span>7 ważeń · 5 lip → 11 lip</span>
                        <span><b>Cel 73,0 kg</b> · 1,5 kg do zrzucenia</span>
                    </div>
                </div>
                Twoja waga spadła w tym tygodniu o 0,6 kg i została Ci 1,5 kg do celu
                73 kg — Twoja 7-dniowa średnia ładnie spada.
            </div>
        </div>
    </div>
    <div class="cw-input">
        <span class="cw-field">Napisz do Nutrition…</span>
        <span class="cw-send"><i class="fa-solid fa-arrow-up"></i></span>
    </div>`;

const SLIDE_1_HTML_PL = `
    <div class="msg msg-user">
        Zapisz burrito bowl z kurczakiem na obiad
    </div>
    <div class="typing" aria-hidden="true"><span></span><span></span><span></span></div>
    <div class="msg msg-ai">
        <div class="wdg">
            <div class="wdg-head">
                <div class="wdg-title">Posiłek zapisany</div>
                <div class="wdg-sub">Burrito bowl z kurczakiem · obiad</div>
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
                            <div class="wdg-callab">Kalorie dzisiaj</div>
                            <div class="wdg-calline">
                                <div class="wdg-calval">990<span class="wdg-calgoal">/ 2 100</span></div>
                                <div class="wdg-calleft">Zostało 1 110 kcal</div>
                            </div>
                        </div>
                    </div>
                    <div class="wdg-grids">
                        <div class="wdg-mgrid">
                            <div class="wdg-mtile">
                                <div class="wdg-mtop">
                                    <span class="wdg-mkey">Białko</span>
                                    <span class="wdg-mnum">62<span class="wdg-msub">/150</span></span>
                                </div>
                                <div class="wdg-mbar"><div class="wdg-mfill" style="width: 41.3%; background: var(--pro);"></div></div>
                            </div>
                            <div class="wdg-mtile">
                                <div class="wdg-mtop">
                                    <span class="wdg-mkey">Węglowodany</span>
                                    <span class="wdg-mnum">98<span class="wdg-msub">/220</span></span>
                                </div>
                                <div class="wdg-mbar"><div class="wdg-mfill" style="width: 44.5%; background: var(--car);"></div></div>
                            </div>
                            <div class="wdg-mtile">
                                <div class="wdg-mtop">
                                    <span class="wdg-mkey">Tłuszcz</span>
                                    <span class="wdg-mnum">37<span class="wdg-msub">/70</span></span>
                                </div>
                                <div class="wdg-mbar"><div class="wdg-mfill" style="width: 52.9%; background: var(--fat);"></div></div>
                            </div>
                        </div>
                        <div class="wdg-mgrid wdg-lim wdg-sec">
                            <div class="wdg-mtile">
                                <div class="wdg-mtop"><span class="wdg-mkey">Cukry</span><span class="wdg-mnum">6.5</span></div>
                                <div class="wdg-mbar"><div class="wdg-mfill" style="width: 14.4%; background: var(--sug);"></div></div>
                                <div class="wdg-mcap">limit 45 g</div>
                            </div>
                            <div class="wdg-mtile">
                                <div class="wdg-mtop"><span class="wdg-mkey">Kofeina</span><span class="wdg-mnum">95</span></div>
                                <div class="wdg-mbar"><div class="wdg-mfill" style="width: 23.8%; background: var(--caf);"></div></div>
                                <div class="wdg-mcap">limit 400 mg</div>
                            </div>
                            <div class="wdg-mtile">
                                <div class="wdg-mtop"><span class="wdg-mkey">Błonnik</span><span class="wdg-mnum">15.4</span></div>
                                <div class="wdg-mbar"><div class="wdg-mfill" style="width: 51.3%; background: var(--fib);"></div></div>
                                <div class="wdg-mcap">z 30 g</div>
                            </div>
                        </div>
                        <div class="wdg-mhint" aria-hidden="true">Dotknij wskaźnika, by zobaczyć posiłki, które się na niego złożyły</div>
                    </div>
                    <div class="wdg-wrow wdg-sec">
                        <span class="wdg-wlab"><span class="wdg-dot" style="background: var(--wat);"></span>Woda</span>
                        <div class="wdg-mbar"><div class="wdg-mfill" style="width: 48%; background: var(--wat);"></div></div>
                        <span class="wdg-wnum">1.2<span class="wdg-wsub">/2.5 L</span></span>
                    </div>
                </div>
            </div>
        </div>
        Zapisane — dodałem burrito bowl z kurczakiem do obiadu, około 650 kcal
        (42 g białka, 68 g węglowodanów, 22 g tłuszczu) i 12 g błonnika z fasoli.
    </div>`;

const SLIDE_2_HTML_PL = `
    <div class="msg-img" aria-hidden="true">
        <svg viewBox="0 0 220 150" class="chat-photo" role="img" aria-label="Zdjęcie talerza z kolacją">
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
    <div class="msg msg-user">
        Oto moja kolacja — co w niej jest?
    </div>
    <div class="typing" aria-hidden="true"><span></span><span></span><span></span></div>
    <div class="msg msg-ai">
        Wygląda na grillowanego łososia z ryżem i brokułami — zapisane jako
        kolacja, około 540 kcal (38 g białka, 45 g węglowodanów, 20 g tłuszczu).
    </div>`;

const SLIDE_3_HTML_PL = `
    <div class="msg-img" aria-hidden="true">
        <svg viewBox="0 0 220 150" class="chat-photo" role="img" aria-label="Zdjęcie kodu kreskowego produktu">
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
    <div class="msg msg-user">
        Zapisz to
    </div>
    <div class="typing" aria-hidden="true"><span></span><span></span><span></span></div>
    <div class="msg msg-ai step-ask">
        Znalazłem — jogurt grecki Chobani, 1 kubek: 120 kcal, 15 g białka. Do
        którego posiłku to zaliczyć?
        <div class="meal-pick">
            <span class="meal-chip">Śniadanie</span>
            <span class="meal-chip">Obiad</span>
            <span class="meal-chip">Kolacja</span>
            <span class="meal-chip meal-pick-target">Przekąska</span>
        </div>
    </div>
    <div class="msg msg-ai step-done">
        <div class="wdg">
            <div class="wdg-head">
                <div class="wdg-title">Posiłek zapisany</div>
                <div class="wdg-sub">Jogurt grecki Chobani, 1 kubek · przekąska</div>
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
                            <div class="wdg-callab">Kalorie dzisiaj</div>
                            <div class="wdg-calline">
                                <div class="wdg-calval">1 540<span class="wdg-calgoal">/ 2 100</span></div>
                                <div class="wdg-calleft">Zostało 560 kcal</div>
                            </div>
                        </div>
                    </div>
                    <div class="wdg-grids">
                        <div class="wdg-mgrid">
                            <div class="wdg-mtile">
                                <div class="wdg-mtop"><span class="wdg-mkey">Białko</span><span class="wdg-mnum">98<span class="wdg-msub">/150</span></span></div>
                                <div class="wdg-mbar"><div class="wdg-mfill" style="width: 65.3%; background: var(--pro);"></div></div>
                            </div>
                            <div class="wdg-mtile">
                                <div class="wdg-mtop"><span class="wdg-mkey">Węglowodany</span><span class="wdg-mnum">150<span class="wdg-msub">/220</span></span></div>
                                <div class="wdg-mbar"><div class="wdg-mfill" style="width: 68.2%; background: var(--car);"></div></div>
                            </div>
                            <div class="wdg-mtile">
                                <div class="wdg-mtop"><span class="wdg-mkey">Tłuszcz</span><span class="wdg-mnum">52<span class="wdg-msub">/70</span></span></div>
                                <div class="wdg-mbar"><div class="wdg-mfill" style="width: 74.3%; background: var(--fat);"></div></div>
                            </div>
                        </div>
                        <div class="wdg-mgrid wdg-lim wdg-sec">
                            <div class="wdg-mtile">
                                <div class="wdg-mtop"><span class="wdg-mkey">Cukry</span><span class="wdg-mnum">28.4</span></div>
                                <div class="wdg-mbar"><div class="wdg-mfill" style="width: 63.1%; background: var(--sug);"></div></div>
                                <div class="wdg-mcap">limit 45 g</div>
                            </div>
                            <div class="wdg-mtile">
                                <div class="wdg-mtop"><span class="wdg-mkey">Kofeina</span><span class="wdg-mnum">95</span></div>
                                <div class="wdg-mbar"><div class="wdg-mfill" style="width: 23.8%; background: var(--caf);"></div></div>
                                <div class="wdg-mcap">limit 400 mg</div>
                            </div>
                            <div class="wdg-mtile">
                                <div class="wdg-mtop"><span class="wdg-mkey">Błonnik</span><span class="wdg-mnum">19.2</span></div>
                                <div class="wdg-mbar"><div class="wdg-mfill" style="width: 64%; background: var(--fib);"></div></div>
                                <div class="wdg-mcap">z 30 g</div>
                            </div>
                        </div>
                        <div class="wdg-mhint" aria-hidden="true">Dotknij wskaźnika, by zobaczyć posiłki, które się na niego złożyły</div>
                    </div>
                </div>
            </div>
        </div>
        Zapisane jako przekąska — 120 kcal, 15 g białka, 9 g cukru.
    </div>`;

const SLIDE_4_HTML_PL = `
    <div class="msg msg-user">
        Ustaw moją strefę czasową na Nowy Jork
    </div>
    <div class="typing" aria-hidden="true"><span></span><span></span><span></span></div>
    <div class="msg msg-ai">
        Gotowe — Twoje dni zmieniają się teraz o północy czasu wschodniego, więc
        dzisiejsze podsumowania są trafne, gdziekolwiek jesteś.
    </div>`;

const SLIDE_5_HTML_PL = `
    <div class="msg msg-user">
        Jak mi idzie z białkiem dzisiaj?
    </div>
    <div class="typing" aria-hidden="true"><span></span><span></span><span></span></div>
    <div class="msg msg-ai">
        Masz 118 g z celu 150 g — zostało 32 g. Kubek jogurtu greckiego albo
        pierś z kurczaka i będzie zaliczone.
    </div>`;

const SLIDE_6_HTML_PL = `
    <div class="msg msg-user">
        Pokaż moje trendy z tego tygodnia
    </div>
    <div class="typing" aria-hidden="true"><span></span><span></span><span></span></div>
    <div class="msg msg-ai">
        <div class="wdg">
            <div class="wdg-head wdg-mid">
                <div class="wdg-title">Trendy</div>
                <div class="wdg-seg" aria-hidden="true">
                    <span class="wdg-seg-btn wdg-on">7</span>
                    <span class="wdg-seg-btn">14</span>
                    <span class="wdg-seg-btn">30</span>
                </div>
            </div>
            <div class="wdg-chart">
                <div class="wdg-chead">
                    <span class="wdg-ctitle">Kalorie / dzień</span>
                    <span class="wdg-cmeta">7/7 dni zapisanych</span>
                </div>
                <svg viewBox="0 0 480 54" role="img" aria-label="Kalorie dziennie w ciągu ostatnich 7 dni">
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
                            <div class="wdg-callab">Średnia 7-dniowa · wszystkie dni</div>
                            <div class="wdg-calline">
                                <div class="wdg-calval">1 980<span class="wdg-calgoal">/ 2 100</span></div>
                                <div class="wdg-calleft">120 kcal poniżej celu</div>
                            </div>
                        </div>
                    </div>
                    <div class="wdg-grids">
                        <div class="wdg-mgrid">
                            <div class="wdg-mtile">
                                <div class="wdg-mtop"><span class="wdg-mkey">Białko</span><span class="wdg-mnum">148<span class="wdg-msub">/150</span></span></div>
                                <div class="wdg-mbar"><div class="wdg-mfill" style="width: 98.7%; background: var(--pro);"></div></div>
                            </div>
                            <div class="wdg-mtile">
                                <div class="wdg-mtop"><span class="wdg-mkey">Węglowodany</span><span class="wdg-mnum">205<span class="wdg-msub">/220</span></span></div>
                                <div class="wdg-mbar"><div class="wdg-mfill" style="width: 93.2%; background: var(--car);"></div></div>
                            </div>
                            <div class="wdg-mtile">
                                <div class="wdg-mtop"><span class="wdg-mkey">Tłuszcz</span><span class="wdg-mnum">66<span class="wdg-msub">/70</span></span></div>
                                <div class="wdg-mbar"><div class="wdg-mfill" style="width: 94.3%; background: var(--fat);"></div></div>
                            </div>
                        </div>
                        <div class="wdg-mgrid wdg-lim wdg-sec">
                            <div class="wdg-mtile">
                                <div class="wdg-mtop"><span class="wdg-mkey">Cukry</span><span class="wdg-mnum">38.2</span></div>
                                <div class="wdg-mbar"><div class="wdg-mfill" style="width: 84.9%; background: var(--sug);"></div></div>
                                <div class="wdg-mcap">limit 45 g</div>
                            </div>
                            <div class="wdg-mtile">
                                <div class="wdg-mtop"><span class="wdg-mkey">Kofeina</span><span class="wdg-mnum">180</span></div>
                                <div class="wdg-mbar"><div class="wdg-mfill" style="width: 45%; background: var(--caf);"></div></div>
                                <div class="wdg-mcap">limit 400 mg</div>
                            </div>
                            <div class="wdg-mtile">
                                <div class="wdg-mtop"><span class="wdg-mkey">Błonnik</span><span class="wdg-mnum">26.8</span></div>
                                <div class="wdg-mbar"><div class="wdg-mfill" style="width: 89.3%; background: var(--fib);"></div></div>
                                <div class="wdg-mcap">z 30 g</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="wdg-wrow wdg-sec">
                    <span class="wdg-wlab"><span class="wdg-dot" style="background: var(--wat);"></span>Woda</span>
                    <div class="wdg-mbar"><div class="wdg-mfill" style="width: 84%; background: var(--wat);"></div></div>
                    <span class="wdg-wnum">2.1<span class="wdg-wsub">/2.5 L</span></span>
                </div>
            </div>
        </div>
        Średnio masz 1 980 kcal dziennie — 120 kcal poniżej celu, a cukier i
        kofeina mieszczą się wygodnie w limitach. Błonnik wynosi średnio 26,8 g,
        tuż poniżej celu 30 g.
    </div>`;

const SLIDE_7_HTML_PL = `
    <div class="msg msg-user">
        Zapisz moją wagę, 74,5 kg
    </div>
    <div class="typing" aria-hidden="true"><span></span><span></span><span></span></div>
    <div class="msg msg-ai">
        <div class="wdg">
            <div class="wdg-head wdg-mid">
                <div class="wdg-title">Waga</div>
                <div class="wdg-seg" aria-hidden="true">
                    <span class="wdg-seg-btn wdg-on">7</span>
                    <span class="wdg-seg-btn">14</span>
                    <span class="wdg-seg-btn">30</span>
                </div>
            </div>
            <div class="wdg-wmain">
                <div class="wdg-wnow">
                    <div class="wdg-wtag">Ostatni pomiar</div>
                    <div class="wdg-wval">74.5<span class="wdg-wunit">kg</span></div>
                    <div class="wdg-wdelta" style="color: var(--accent);">−0,6 kg od 5 lipca</div>
                </div>
                <svg class="wdg-wchart" viewBox="0 0 300 62" role="img" aria-label="Waga od 5 lipca do 11 lipca, ostatni pomiar 74,5 kg">
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
                <span>7 ważeń · 5 lip → 11 lip</span>
                <span><b>Cel 73,0 kg</b> · 1,5 kg do zrzucenia</span>
            </div>
        </div>
        Zapisane — zbliżasz się do celu.
    </div>`;

export const INDEX_PL: IndexDoc = {
    title: "Nutrition MCP — Tracker posiłków i makroskładników AI dla Claude i ChatGPT",
    metaDescription:
        "Śledź posiłki, makroskładniki, wagę i historię odżywiania przez rozmowę z Claude albo ChatGPT. Darmowy serwer MCP do zapisywania jedzenia, skanowania kodów kreskowych, liczenia kalorii, śledzenia wagi i diety z pomocą AI.",
    ogDescription:
        "Śledź posiłki, makroskładniki, wagę i historię odżywiania przez rozmowę z Claude albo ChatGPT. Darmowy serwer MCP do zapisywania jedzenia, skanowania kodów kreskowych i śledzenia wagi z pomocą AI.",
    keywords:
        "tracker odżywiania, tracker posiłków, serwer MCP, Claude AI, ChatGPT, licznik kalorii, tracker makroskładników, skaner kodów kreskowych, zapisywanie jedzenia, tracker diety, tracker wagi, dziennik wagi, odżywianie AI, Model Context Protocol",

    chatChrome: {
        brand: "Nutrition MCP",
        status: "online",
        inputPlaceholder: "Napisz do Nutrition…",
    },

    hero: {
        eyebrow: "Darmowy · Open source · OAuth 2.0",
        titleBeforeEm: "Śledź swoją dietę, po prostu ",
        titleEm: "rozmawiając",
        titleAfterEm: " ze swoim AI.",
        lead: "Połącz Claude albo ChatGPT, a potem po prostu powiedz, co zjadłeś/aś. Kalorie i makroskładniki, zapisywane automatycznie.",
        ctaPrimary: "Szybka instalacja",
        ctaSecondary: "Wsparcie",
        chipsHtml: HERO_CHIPS_HTML_PL,
        chatHtml: HERO_CHAT_HTML_PL,
    },

    how: {
        eyebrow: "Jak to działa",
        title: "Trzy kroki. Żadnej aplikacji do nauki.",
        steps: [
            {
                title: "Połącz się raz",
                body: "Działa z każdym klientem AI, który obsługuje zdalne serwery MCP — Claude, ChatGPT i inne. Bez instalacji, bez kluczy API.",
            },
            {
                title: "Po prostu powiedz, co zjadłeś/aś",
                body: "Opisz to zwykłym językiem — albo wyślij zdjęcie posiłku, zrzut ekranu z aplikacji dostawczej albo kod kreskowy (produkt zostanie wyszukany w internecie). Makroskładniki zapisywane automatycznie.",
            },
            {
                title: "Śledź i przeglądaj",
                body: "Poproś o dzienne podsumowania, tygodniowe trendy, postęp celów albo wyeksportuj wszystko, co zapisałeś/aś, jako pliki CSV — całkowicie za darmo.",
            },
        ],
    },

    install: {
        eyebrow: "Szybka instalacja",
        title: "Połącz się w mniej niż minutę",
        sub: "Działa z każdym klientem MCP, który obsługuje OAuth 2.0 z PKCE. Przy pierwszym połączeniu zakładasz konto przez Google albo e-mail i hasło; loguj się tak samo, żeby zachować swoje dane.",
        claude: {
            steps: [
                "Otwórz <strong>Claude</strong> (w przeglądarce albo aplikacji) i kliknij <strong>Customize</strong> w lewym górnym rogu.",
                "Kliknij <strong>Connectors</strong>.",
                "Kliknij <strong>+</strong>, a potem <strong>Add custom connector</strong>.",
                "Nadaj mu nazwę, na przykład <strong>Nutrition</strong>.",
                'Wklej <span class="copy-url"><code>https://nutrition-mcp.com/mcp</code><button class="copy-mini" type="button" data-copy="https://nutrition-mcp.com/mcp" aria-label="Kopiuj adres URL serwera"><i class="fa-solid fa-copy"></i></button></span> w pole <strong>Remote MCP server URL</strong>.',
                "Kliknij <strong>Add</strong>.",
                "Kliknij <strong>Connect</strong> — otworzy się strona logowania; kontynuuj przez Google albo zaloguj się e-mailem i hasłem.",
                "Gotowe. Działa od razu i automatycznie pojawia się w Twoich aplikacjach na iOS i Androida.",
            ],
            note: "Działa na każdym planie Claude. Darmowy plan pozwala na jeden podłączony serwer MCP naraz.",
        },
        chatgpt: {
            steps: [
                "Otwórz <strong>ChatGPT w przeglądarce</strong> → <strong>Settings</strong> → <strong>Apps</strong>.",
                "Kliknij <strong>Create app</strong> na dole wyskakującego okna. Jeśli go nie widzisz, włącz <strong>Developer mode</strong> w <strong>Advanced settings</strong>.",
                "Nadaj mu nazwę, na przykład <strong>Nutrition</strong>.",
                'W polu <strong>Connection</strong> wklej <span class="copy-url"><code>https://nutrition-mcp.com/mcp</code><button class="copy-mini" type="button" data-copy="https://nutrition-mcp.com/mcp" aria-label="Kopiuj adres URL serwera"><i class="fa-solid fa-copy"></i></button></span>.',
                "W polu <strong>Authentication</strong> wybierz <strong>OAuth</strong> — resztę zostaw bez zmian.",
                'Zaznacz <strong>„I understand and want to continue"</strong>.',
                "Kliknij <strong>Create</strong>.",
                "Kliknij <strong>Sign in with Nutrition</strong> — otworzy się strona logowania; kontynuuj przez Google albo zaloguj się e-mailem i hasłem.",
                "Gotowe. Działa od razu i automatycznie pojawia się w Twoich aplikacjach na iOS i Androida.",
            ],
        },
        other: {
            note: "Dodaj powyższą konfigurację do swojego klienta (Cursor, VS Code, Claude Code i inne). Windsurf używa <code>serverUrl</code> zamiast <code>url</code>. W Claude Code uruchom <code>claude mcp add --transport http nutrition https://nutrition-mcp.com/mcp</code>. Twój klient obsłuży logowanie OAuth automatycznie.",
        },
        otherTabLabel: "Inni klienci",
    },

    onboarding: {
        eyebrow: "Pierwsze kroki",
        title: "Skonfiguruj raz — albo po prostu zacznij mówić",
        sub: "To całkowicie opcjonalne — Nutrition MCP działa od razu po połączeniu. Jeśli chcesz, te trzy szybkie kroki zwiększą dokładność, ale możesz też od razu przejść do zapisywania.",
        steps: [
            '<strong>Ustaw strefę czasową</strong> — żeby dni zmieniały się o Twojej lokalnej północy, a dzisiejsze podsumowania były trafne, gdziekolwiek jesteś. <span class="step-say">Po prostu powiedz <q>Ustaw moją strefę czasową na Nowy Jork</q>.</span>',
            '<strong>Ustaw swoje cele</strong> — dzienne cele kaloryczne, makroskładnikowe i wodne, a także opcjonalną wagę docelową i preferowaną jednostkę wagi (kg lub lb), względem których będziesz śledzić postępy. <span class="step-say">Po prostu powiedz <q>Ustaw mój dzienny cel na 2000 kalorii i 150 g białka</q>.</span>',
            '<strong>Ustaw swój język</strong> — język, w jakim wyświetlają się widżety w czacie (panele, wykresy), a nie treści, które pisze do Ciebie AI. <span class="step-say">Po prostu powiedz <q>Pokazuj moje widżety po niemiecku</q>.</span>',
            '<strong>Zacznij zapisywać</strong> — po prostu powiedz, co zjadłeś/aś, wyślij zdjęcie albo zeskanuj kod kreskowy. To wszystko. <span class="step-say">Po prostu powiedz <q>Zjadłem/am owsiankę z owocami na śniadanie</q>.</span>',
        ],
        note: "Wszystko tutaj jest opcjonalne. Możesz to zrobić teraz, później albo wcale — po prostu zacznij zapisywać, a to ustaw, kiedy tylko zechcesz.",
        toolsCta: {
            heading: "Ciekawi Cię, co naprawdę potrafi?",
            body: "Przejrzyj wszystkie 36 narzędzi — zapisywanie, kody kreskowe, woda, waga, cele i trendy — z opisem i przykładowym poleceniem dla każdego.",
            arrow: "Zobacz narzędzia",
        },
    },

    try: {
        eyebrow: "Spróbuj powiedzieć",
        title: "Po prostu z nim porozmawiaj.",
        sub: "Kilka rzeczy, które możesz zrobić — po prostu rozmawiając.",
        prevLabel: "Poprzedni przykład",
        nextLabel: "Następny przykład",
        exampleLabel: "Przykład",
        slides: [
            { html: SLIDE_1_HTML_PL },
            { html: SLIDE_2_HTML_PL },
            { html: SLIDE_3_HTML_PL },
            { html: SLIDE_4_HTML_PL },
            { html: SLIDE_5_HTML_PL },
            { html: SLIDE_6_HTML_PL },
            { html: SLIDE_7_HTML_PL },
        ],
    },

    stats: {
        eyebrow: "Zapisane dotąd, razem",
        title: "Rosnący globalny dziennik jedzenia",
        factsTitle: "Wartości odżywcze",
        servingPrefix: "Wielkość porcji: ",
        servingBold: "wszyscy, jak dotąd",
        liveLabel: "Na żywo",
        calLabel: "Kalorie ",
        calSmall: "zapisanych, łącznie",
        calCaption: "Zapisane kalorie",
        rowFoodLogs: "Wpisy jedzenia",
        rowProtein: "Białko",
        rowCarbs: "Węglowodany",
        rowFat: "Tłuszcz",
        unitGroupLabel: "Jednostka wagi",
        unitKgLabel: "Kilogramy",
        unitLbLabel: "Funty",
        foot: "Sumy ze wszystkich kont, aktualizowane na bieżąco w miarę zapisywania posiłków. Dane indywidualne nigdy nie są pokazywane.",
        mapPrefix: "Zapisywane w",
        mapSuffix: "strefach czasowych na całym świecie",
        mapAriaLabel:
            "Mapa świata pokazująca strefy czasowe, w których używany jest Nutrition MCP",
    },

    features: {
        eyebrow: "Wszystko, po prostu przez rozmowę",
        title: "Co możesz śledzić",
        cards: [
            {
                icon: "fa-solid fa-utensils",
                title: "Posiłki zwykłym językiem",
                body: "Opisz, co zjadłeś/aś — Twój AI szacuje kalorie, białko, węglowodany, tłuszcz, błonnik, cukry ogółem i kofeinę w miligramach, po czym to zapisuje.",
            },
            {
                icon: "fa-solid fa-barcode",
                title: "Zeskanuj kod kreskowy",
                body: "Zrób zdjęcie albo wpisz kod kreskowy produktu i pobierz makroskładniki, błonnik i cukier z Open Food Facts, przeliczone na zjedzoną ilość.",
            },
            {
                icon: "fa-solid fa-bullseye",
                title: "Cele i postępy",
                body: "Ustaw dzienne cele kaloryczne, makroskładnikowe, błonnika i wody — a także limity cukru, kofeiny i alkoholu, których nie należy przekraczać — i sprawdzaj postępy na bieżąco.",
            },
            {
                icon: "fa-solid fa-chart-area",
                title: "Podsumowania i trendy",
                body: "Dzienne i tygodniowe zestawienia, trendy 7/14/30-dniowe, serie i powtarzające się wzorce posiłków.",
            },
            {
                icon: "fa-solid fa-glass-water",
                title: "Zapisywanie wody",
                body: "Śledź nawodnienie w mililitrach razem z posiłkami i przeglądaj je dzień po dniu.",
            },
            {
                icon: "fa-solid fa-weight-scale",
                title: "Śledzenie wagi",
                body: "Zapisuj masę ciała w kg albo lb, oglądaj trendy 7/14/30-dniowe i śledź postęp w kierunku wagi docelowej.",
            },
            {
                icon: "fa-solid fa-clock-four",
                title: "Świadomy stref czasowych",
                body: "Dni zmieniają się w Twoim lokalnym czasie, gdziekolwiek jesteś na świecie.",
            },
            {
                icon: "fa-solid fa-file-import",
                title: "Import z innej aplikacji",
                body: "Przenieś historię posiłków z MyFitnessPal, Cronometer, Lose It! albo MacroFactor — albo dowolnego innego CSV, mapując jego kolumny samodzielnie. Potwierdzasz, co zostanie dodane, zanim cokolwiek zostanie zapisane.",
            },
            {
                icon: "fa-solid fa-file-csv",
                title: "Eksport i własność Twoich danych",
                body: "Zabierz wszystko, co tu masz — posiłki, wodę, wagę, cele i profil — jako jeden ZIP z plikami CSV. Na razie tylko posiłki można zaimportować z powrotem. Usuń swoje konto i dane, kiedy tylko zechcesz.",
            },
        ],
    },

    why: {
        eyebrow: "Dlaczego Nutrition MCP",
        title: "Rozmowa bije klikanie.",
        sub: "Zrób zdjęcie kodu kreskowego albo po prostu powiedz, co zjadłeś/aś — bez grzebania w bazie danych, bez osobnej aplikacji do otwierania.",
        oldHeading: "Tradycyjne aplikacje",
        oldItems: [
            "Przeszukuj bazę danych dla każdego produktu",
            "Ręcznie poprawiaj błędne wpisy w bazie",
            "Kolejna aplikacja, konto i płatny mur",
            "Żmudne ręczne zapisywanie",
        ],
        newHeading: "Nutrition MCP",
        newItems: [
            "Opisuj posiłki zwykłym językiem",
            "Kalorie i makroskładniki szacowane za Ciebie",
            "Działa wewnątrz Claude albo ChatGPT, za darmo",
            "Poproś o trendy, podsumowania i cele",
        ],
        noteHtml:
            'Przechodzisz z konkretnej aplikacji? Zobacz, jak Nutrition MCP wypada na tle <a href="/alternatives" data-link="alternatives">MyFitnessPal, Cronometer i innych trackerów</a>.',
    },

    trust: [
        { label: "Prywatne domyślnie", small: "Tylko Ty widzisz swoje dane." },
        {
            label: "Open source",
            small: "Sprawdź kod albo hostuj samodzielnie.",
        },
        {
            label: "Eksportuj kiedy chcesz",
            small: "Każdą tabelę jako CSV, w jednym ZIP-ie.",
        },
        { label: "Usuń natychmiast", small: "Usuń swoje konto i dane." },
    ],

    support: {
        eyebrow: "Wsparcie",
        title: "Pomóż utrzymać to w ruchu.",
        sub: "Nutrition MCP jest darmowy i bez reklam. Patreon pokrywa rachunki za serwer i bazę danych.",
        free: {
            tier: "Darmowy członek",
            price: "0 zł",
            desc: "Bądź na bieżąco — otrzymuj wiadomości i aktualizacje o serwerze, nowych narzędziach i tym, co nadchodzi.",
            cta: "Obserwuj na Patreon",
        },
        paid: {
            tier: "Płatny członek",
            price: "Zapłać, ile chcesz",
            desc: "Dorzuć się do kosztów hostingu i bazy danych, żeby serwer pozostał darmowy i dostępny dla wszystkich.",
            cta: "Zostań wspierającym",
        },
    },

    cta: {
        title: "Zacznij śledzić w mniej niż minutę.",
        sub: "Darmowy i open source — działa z AI, którego już używasz.",
        primary: "Szybka instalacja",
        secondary: "Postaw gwiazdkę na GitHub",
    },

    contact: {
        eyebrow: "Kontakt",
        title: "Pytania albo opinie?",
        sub: "Znalazłeś/aś błąd, chcesz nową funkcję, albo po prostu masz pytanie? Napisz do mnie bezpośrednio — czytam każdą wiadomość.",
        cta: "Wyślij e-mail",
    },

    faqSection: {
        eyebrow: "FAQ",
        title: "Najczęściej zadawane pytania",
    },
    faq: [
        {
            question: "Czym jest Nutrition MCP?",
            visibleHtml:
                "Nutrition MCP to darmowy serwer Model Context Protocol (MCP), który pozwala śledzić posiłki, kalorie, makroskładniki i historię odżywiania przez naturalną rozmowę z Claude albo ChatGPT. Zamiast wpisywać dane w tradycyjnej aplikacji, mówisz swojemu AI, co zjadłeś/aś, a ono zapisuje za Ciebie wszystko.",
        },
        {
            question: "Czym jest Model Context Protocol (MCP)?",
            visibleHtml:
                "Model Context Protocol to otwarty standard, który pozwala asystentom AI, takim jak Claude i ChatGPT, łączyć się z zewnętrznymi narzędziami i źródłami danych. Serwer MCP udostępnia konkretne możliwości — tutaj śledzenie odżywiania — z których AI może korzystać podczas rozmowy. Można to traktować jak system wtyczek dla asystentów AI.",
        },
        {
            // Widoczna odpowiedź celowo pomija adres URL serwera (podany już
            // gdzie indziej na stronie); odpowiedź JSON-LD, czytana osobno
            // przez wyszukiwarki, podaje go wprost. Ta rozbieżność istniała
            // już w źródle angielskim — zachowana wiernie, nie ujednolicona.
            question: "Czy działa z ChatGPT?",
            visibleHtml:
                "Tak. W ChatGPT w przeglądarce otwórz Settings → Apps, utwórz niestandardową aplikację z adresem URL serwera, używając OAuth, i zaloguj się. Działa na każdym planie ChatGPT.",
            jsonLdText:
                "Tak. W ChatGPT w przeglądarce otwórz Settings → Apps, utwórz niestandardową aplikację z adresem URL serwera https://nutrition-mcp.com/mcp, używając OAuth, i zaloguj się. Działa na każdym planie ChatGPT.",
        },
        {
            question: "Jakie inne klienty są obsługiwane?",
            visibleHtml:
                "Każdy klient MCP obsługujący OAuth 2.0 z PKCE — w tym Claude.ai, aplikacje Claude na komputer i telefon, Claude Code, Cursor, Windsurf i VS Code.",
        },
        {
            question: "Czy mogę hostować to samodzielnie?",
            visibleHtml:
                'Tak. Nutrition MCP jest open source (licencja MIT). Możesz uruchomić własną instancję z własnym projektem Supabase — <a href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer">repozytorium na GitHub</a> zawiera pełny przewodnik po samodzielnym hostingu i plik Dockerfile.',
        },
        {
            question: "Czy Nutrition MCP jest darmowy?",
            visibleHtml:
                "Tak, jest całkowicie darmowy — bez płatnych poziomów, reklam czy ukrytych kosztów. Potrzebujesz tylko konta Claude albo ChatGPT, żeby się połączyć. Darowizny na Patreon pomagają pokryć koszty serwera.",
        },
        {
            question: "Co mogę śledzić?",
            visibleHtml:
                "Kalorie, białko, węglowodany, tłuszcz, błonnik i wodę dla każdego wpisu — opisane zwykłym językiem albo pobrane z kodu kreskowego produktu przez Open Food Facts. Kofeina też jest śledzona, w miligramach, jednostce używanej na każdej etykiecie, i nie dodaje kalorii. Alkohol również jest śledzony, w gramach czystego etanolu, gdy go włączysz. Możesz też zapisywać masę ciała w kg albo lb i śledzić trendy w kierunku wagi docelowej. Zobacz dzienne podsumowania, przeszukuj posiłki po zakresie dat, aktualizuj lub usuwaj wcześniejsze wpisy, ustawiaj cele i monitoruj trendy w czasie.",
        },
        {
            question: "Czy śledzi alkohol?",
            visibleHtml:
                "Tylko jeśli to włączysz — śledzenie alkoholu jest domyślnie wyłączone. Po włączeniu drinki są zapisywane w gramach czystego etanolu i pokazywane jako standardowe drinki amerykańskie albo jednostki brytyjskie, zależnie od Twojego wyboru. Nic nie zgaduje alkoholu za Ciebie: pochodzi on z zapisanego przez Ciebie drinka albo kolumny alkoholu w importowanym pliku. Ponowne wyłączenie ukrywa alkohol z Twoich posiłków, celów i podsumowań oraz sprawia, że importer przestaje odczytywać kolumny alkoholu — to nie jest przełącznik usuwania, a Twój eksport CSV zawsze zawiera to, co zapisałeś/aś.",
        },
        {
            question:
                "Czy mogę zaimportować historię z MyFitnessPal albo innej aplikacji?",
            visibleHtml:
                "Tak. Poproś o import swojej historii, a w czacie otworzy się importer: wybierasz CSV wyeksportowany przez Twoją starą aplikację, sprawdzasz, jak mapowane są jego kolumny, i widzisz, co zostanie dodane, zanim potwierdzisz. Eksporty z MyFitnessPal, Cronometer, Lose It! i MacroFactor są rozpoznawane automatycznie, a każdy inny CSV działa dzięki ręcznemu mapowaniu kolumn. Twoja przeglądarka odczytuje plik, więc AI nigdy nie przepisuje Twoich wierszy. W klientach bez paneli w czacie możesz zamiast tego wkleić swój eksport — a ponowny import tego samego pliku nie tworzy duplikatów.",
        },
        {
            question: "Czy moje dane są prywatne?",
            visibleHtml:
                "Twoje dane są przechowywane bezpiecznie i powiązane z Twoim osobistym kontem. Tylko Ty masz dostęp do swojej historii odżywiania, poprzez uwierzytelnioną sesję. Nutrition MCP nie sprzedaje ani nie udostępnia Twoich danych, a Ty możesz usunąć swoje konto i wszystkie dane w dowolnym momencie.",
        },
    ],
};
