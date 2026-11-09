#!/usr/bin/env bun

import { cp, readFile, writeFile } from "node:fs/promises";

const variablesPath = "android/variables.gradle";
let variables = await readFile(variablesPath, "utf8");
variables = variables.replace(/minSdkVersion\s*=\s*24/, "minSdkVersion = 26");
if (!/minSdkVersion\s*=\s*26/.test(variables)) {
    throw new Error("Android minSdkVersion was not raised to 26");
}
if (!/compileSdkVersion\s*=\s*36/.test(variables)) {
    throw new Error("Capacitor Android shell is not compiling against API 36");
}
if (!/targetSdkVersion\s*=\s*36/.test(variables)) {
    throw new Error("Capacitor Android shell is not targeting API 36");
}
await writeFile(variablesPath, variables);

const javaDir = "android/app/src/main/java/business/munch/app";
await cp("mobile/android/MainActivity.java", `${javaDir}/MainActivity.java`);
await cp(
    "mobile/android/MunchSecureSessionPlugin.java",
    `${javaDir}/MunchSecureSessionPlugin.java`,
);
await cp(
    "mobile/android/MunchPlayBillingPlugin.java",
    `${javaDir}/MunchPlayBillingPlugin.java`,
);
await cp(
    "mobile/android/MunchGoogleSignInPlugin.java",
    `${javaDir}/MunchGoogleSignInPlugin.java`,
);
await cp(
    "mobile/android/MunchAdsPlugin.java",
    `${javaDir}/MunchAdsPlugin.java`,
);

const buildGradlePath = "android/app/build.gradle";
let buildGradle = await readFile(buildGradlePath, "utf8");
const requiredDependencies = [
    "com.android.billingclient:billing:9.1.0",
    "androidx.credentials:credentials:1.6.0",
    "androidx.credentials:credentials-play-services-auth:1.6.0",
    "com.google.android.libraries.identity.googleid:googleid:1.2.1",
    "com.google.android.gms:play-services-ads:25.5.0",
    "com.google.android.ump:user-messaging-platform:4.0.0",
];
for (const dependency of requiredDependencies) {
    if (!buildGradle.includes(dependency)) {
        buildGradle = buildGradle.replace(
            "dependencies {",
            `dependencies {\n    implementation "${dependency}"`,
        );
    }
    if (!buildGradle.includes(dependency)) {
        throw new Error(`Android dependency is missing: ${dependency}`);
    }
}
await writeFile(buildGradlePath, buildGradle);

const manifestPath = "android/app/src/main/AndroidManifest.xml";
let manifest = await readFile(manifestPath, "utf8");
if (
    !manifest.includes(
        'android:name="com.google.android.gms.ads.APPLICATION_ID"',
    )
) {
    manifest = manifest.replace(
        /(<application\b[^>]*>)/,
        '$1\n        <meta-data\n            android:name="com.google.android.gms.ads.APPLICATION_ID"\n            android:value="${munchAdMobAppId}" />',
    );
}
manifest = manifest.replace(
    'android:allowBackup="true"',
    'android:allowBackup="false"',
);
if (!manifest.includes('android:usesCleartextTraffic="false"')) {
    const secureTheme = [
        'android:theme="@style/AppTheme"',
        '        android:usesCleartextTraffic="false">',
    ].join("\n");
    manifest = manifest.replace(
        'android:theme="@style/AppTheme">',
        secureTheme,
    );
}
const deepLink = [
    "            <intent-filter>",
    '                <action android:name="android.intent.action.VIEW" />',
    '                <category android:name="android.intent.category.DEFAULT" />',
    '                <category android:name="android.intent.category.BROWSABLE" />',
    '                <data android:scheme="munch" android:host="app" />',
    "            </intent-filter>",
    "",
].join("\n");
if (!manifest.includes('android:scheme="munch"')) {
    manifest = manifest.replace(
        "        </activity>",
        `${deepLink}        </activity>`,
    );
}
const verifiedAuthLink = [
    '            <intent-filter android:autoVerify="true">',
    '                <action android:name="android.intent.action.VIEW" />',
    '                <category android:name="android.intent.category.DEFAULT" />',
    '                <category android:name="android.intent.category.BROWSABLE" />',
    "                <data",
    '                    android:scheme="https"',
    '                    android:host="munch.business"',
    '                    android:pathPrefix="/mobile/auth/callback" />',
    "            </intent-filter>",
    "",
].join("\n");
if (!manifest.includes('android:pathPrefix="/mobile/auth/callback"')) {
    manifest = manifest.replace(
        "        </activity>",
        `${verifiedAuthLink}        </activity>`,
    );
}
// S4: verified app links for the /app allowlist itself, so an
// https://munch.business/app/* link opens the shell and routes through
// mobile/navigation.js. The auth callback filter above stays intact
// and the runtime keeps owning that path.
const verifiedAppLink = [
    '            <intent-filter android:autoVerify="true">',
    '                <action android:name="android.intent.action.VIEW" />',
    '                <category android:name="android.intent.category.DEFAULT" />',
    '                <category android:name="android.intent.category.BROWSABLE" />',
    "                <data",
    '                    android:scheme="https"',
    '                    android:host="munch.business"',
    '                    android:pathPrefix="/app" />',
    "            </intent-filter>",
    "",
].join("\n");
if (!manifest.includes('android:pathPrefix="/app"')) {
    manifest = manifest.replace(
        "        </activity>",
        `${verifiedAppLink}        </activity>`,
    );
}
if (!manifest.includes('android:allowBackup="false"')) {
    throw new Error(
        "Android backups were not disabled for installed credentials",
    );
}
const applicationMatch = manifest.match(/^[ \t]*<application\b/m);
if (!applicationMatch || applicationMatch.index === undefined) {
    throw new Error("Android application element is missing");
}
const permissionPattern = /^[ \t]*<uses-permission\b[^>]*\/>[ \t]*(?:\r?\n)?/gm;
const trailingPermissions = [...manifest.matchAll(permissionPattern)].filter(
    (match) => match.index > applicationMatch.index!,
);
if (trailingPermissions.length > 0) {
    const permissionLines = trailingPermissions.map((match) => match[0].trim());
    for (const match of trailingPermissions.toReversed()) {
        manifest =
            manifest.slice(0, match.index) +
            manifest.slice(match.index + match[0].length);
    }
    const updatedApplicationMatch = manifest.match(/^[ \t]*<application\b/m);
    if (
        !updatedApplicationMatch ||
        updatedApplicationMatch.index === undefined
    ) {
        throw new Error(
            "Android application element disappeared while moving permissions",
        );
    }
    const applicationIndent = updatedApplicationMatch[0].slice(
        0,
        updatedApplicationMatch[0].indexOf("<application"),
    );
    const permissionBlock = `${permissionLines.map((line) => `${applicationIndent}${line}`).join("\n")}\n\n`;
    manifest =
        manifest.slice(0, updatedApplicationMatch.index) +
        permissionBlock +
        manifest.slice(updatedApplicationMatch.index);
}
if (!manifest.includes('android:usesCleartextTraffic="false"')) {
    throw new Error("Android cleartext traffic was not disabled");
}
if (
    !manifest.includes(
        'android:name="com.google.android.gms.ads.APPLICATION_ID"',
    )
) {
    throw new Error("Google Mobile Ads app ID metadata is missing");
}
await writeFile(manifestPath, manifest);

console.log(
    "Configured Android API 36, Billing, sign-in, ads, App Links, and plugins",
);
