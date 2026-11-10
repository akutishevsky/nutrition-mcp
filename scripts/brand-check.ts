#!/usr/bin/env bun

import { createHash } from "node:crypto";

const forbidden = [
    "nutrition-mcp.com",
    "googletagmanager",
    "google-analytics.com",
    "Patreon",
    "your-domain.com",
    "anton@nutrition-mcp.com",
];

const allowedPaths = new Set(["LICENSE", "NOTICE.md", "README.md"]);

const roots = ["public", "src"];
const failures: string[] = [];

for (const root of roots) {
    const glob = new Bun.Glob("**/*.{html,css,js,ts,txt,xml,json}");
    for await (const relative of glob.scan({ cwd: root })) {
        const path = `${root}/${relative}`;
        if (allowedPaths.has(path)) continue;
        const text = await Bun.file(path).text();
        for (const value of forbidden) {
            if (text.includes(value)) failures.push(`${path}: ${value}`);
        }
    }
}

// Launcher/splash art guard. The 2026-11-10 Pixel defect: the app
// shipped the stock Capacitor template art as its icon on BOTH
// platforms — the brand mark existed (PR #165) but was never wired
// into the Android mipmaps/adaptive vectors or the iOS AppIcon, and no
// lane compared the shipped art against anything. Every hash below is
// a byte-exact SHA-256 of a stock Capacitor placeholder file as it
// existed on main before scripts/generate-app-icons.py replaced the
// set; if any shipped art file ever byte-matches one again, the
// placeholder is back and this check fails.
const capacitorPlaceholderHashes = new Set([
    // android mipmap-*/ic_launcher.png (template glyph on grid)
    "27ed3603010ebc278f64f8645741ab132ff517abb5308eb9df6c8e42a48956b2",
    "72b71c3581ca3b5a23b1c168d69b9d855b3f184fa079902a01f088eb4f0607d5",
    "d35dbfff175b83c13ef59cf924abfc810f7b6a158595d7417c5498ea8c7c7ed1",
    "ed346eb1e3f0280f15709393705899b3ff55c20b88f4e0308006b3c33cf5fe14",
    "87cb2f2ffe992652bb4fa768c73719a37b5852ab17fbf8e170e888f7a42b0761",
    // android mipmap-*/ic_launcher_foreground.png
    "58e78a618778926b1f6d9472a6468de878de8530970934e94aab5ba4ba08cc00",
    "32baa10d2632a4417454a579f992bd640e0a3cec79321423559b2c9940de58a9",
    "6f88083b8166cc559102f7044688de7525287632ebe09ac45d001ac8bf4b3eae",
    "4a82bc1e9923576275869998925ce0ae021a79aa18b24a0dd87ad6b61ca85053",
    "bd24fd383253bf8d43f0a81f11c071d76d1d555114376dd647cd9fb38fa0a9da",
    // android mipmap-*/ic_launcher_round.png
    "0166fc333074c373fbd0ce6b5defd71552166165ac778121ca9c9dff6b83f0fc",
    "bfcc1b0fa931b14bb241372c76ab4f04374b67d02363c98d9cb12edfdacdf5f3",
    "40911a00922868686854a4804b93fd6e56b503664696de03f450bff690affb6d",
    "1ee4cd9ff371dcb2e3938097e434f6fb8731688ed7165e61fc63693ad5b2f455",
    "ab93096331e7cd8ec379f73f1e9adcaaa9ee1115c9f4ff10411a811fb9700174",
    // android template vectors: teal grid background + glyph foreground
    "718ba51adf166bb55c3e9936bb8199a0148457f7f0191aaa2f37a94f3159d6ec",
    "a8514094f754b099d3e55ce1d6e0b2de79db418b2eeacb0fc2a6bb0bfadef221",
    // android drawable*/splash.png (template glyph on white)
    "5cf98b4451bd99b20df26f9e608a46946118be6b0ae90762f9ca1786a30c76ff",
    "c5015f4ba3628392b538386c5e210f0b94f352a3160adab934fd0311972137ca",
    "07fa579e1c83e04ba7f9cbcbfcf41b68e15fe3638f2c44a04e58b809103e6b69",
    "b73049cb37fe76d6c11b87a796766bf6af0c85483b31eb6a921657b0d764a4b9",
    "0c7f1212f25b7b90e9a6e1d320013e4ff3d3e03e634cbb07b7b7981cac51627f",
    "3db071a03b2f8ffe0dfd4170fc59842d53cd15bba5e88af59401d58efabf7827",
    "08cc34ad7713fe7ed58bceaa37b2387b670c53cd60264b4bd6442db3098e75dc",
    "22f87e1e3bc89aa01a7dbc39c9a4db058cd0bf4ad3fe9f55712bf69eb997f4bf",
    "42aa26392546fcdee1b8d3ac6d4b41bfcceb41dc6a4f3a3c30c24a8a8f4db862",
    "60393ce8636fd263e4e1fea3fd4ab2de948c6295e898fda9b50ac4e5283be809",
    // ios AppIcon (template glyph) + ios Splash imageset
    "29e4777e319de3ee5a52c3a8004ec19d0568414004257e36d7c94a077d71c93b",
    "1b5002b74a5500e697298ced06ca2811ac33f2771f236f3c720ff23243890530",
]);

const shippedArtPaths = [
    ...["mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"].flatMap((density) => [
        `android/app/src/main/res/mipmap-${density}/ic_launcher.png`,
        `android/app/src/main/res/mipmap-${density}/ic_launcher_foreground.png`,
        `android/app/src/main/res/mipmap-${density}/ic_launcher_round.png`,
        `android/app/src/main/res/drawable-port-${density}/splash.png`,
        `android/app/src/main/res/drawable-land-${density}/splash.png`,
    ]),
    "android/app/src/main/res/drawable/splash.png",
    "android/app/src/main/res/drawable/ic_launcher_background.xml",
    "android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml",
    "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png",
    "ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png",
    "ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-1.png",
    "ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-2.png",
];

for (const path of shippedArtPaths) {
    const file = Bun.file(path);
    if (!(await file.exists())) continue;
    const digest = createHash("sha256")
        .update(Buffer.from(await file.arrayBuffer()))
        .digest("hex");
    if (capacitorPlaceholderHashes.has(digest)) {
        failures.push(`${path}: stock Capacitor placeholder art`);
    }
}

if (failures.length > 0) {
    console.error("Munch brand check failed:\n" + failures.join("\n"));
    process.exit(1);
}

console.log("Munch public brand check passed.");
