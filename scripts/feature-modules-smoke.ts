#!/usr/bin/env bun

import {
    getFeatureModules,
    saveFeatureModules,
} from "../src/feature-modules-repository.js";
import {
    closePlatformDatabase,
    withUserDatabase,
} from "../src/platform/database.js";
import { createSmokeIdentity } from "./support/smoke-user.js";

// Feature toggles (addendum 10, T4/T5): the flags persist per account
// on the server, default to all-on for an account that has never
// saved a preference, survive a partial patch, and are invisible to
// other accounts under RLS. Toggling writes only the flag columns —
// this smoke never touches module data.

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for the feature modules smoke");
}

function assert(condition: boolean, message: string) {
    if (!condition) throw new Error(message);
}

const owner = await createSmokeIdentity("features-owner");
const other = await createSmokeIdentity("features-other");
const ALL_ON = {
    plan: true,
    recipes: true,
    groceries: true,
    pantry: true,
    cooks: true,
};

try {
    // A fresh account reads as every module on (T1: opt-out, not in).
    const initial = await getFeatureModules(owner.userId);
    assert(
        JSON.stringify(initial) === JSON.stringify(ALL_ON),
        `fresh account should read all-on, got ${JSON.stringify(initial)}`,
    );

    // The "Just logging" preset state persists as all five false.
    const justLogging = await saveFeatureModules(owner.userId, {
        plan: false,
        recipes: false,
        groceries: false,
        pantry: false,
        cooks: false,
    });
    assert(
        Object.values(justLogging).every((value) => value === false),
        "just-logging save did not persist all five off",
    );
    const reread = await getFeatureModules(owner.userId);
    assert(
        JSON.stringify(reread) === JSON.stringify(justLogging),
        "just-logging state did not survive a re-read",
    );

    // A partial patch flips one flag and leaves the rest alone (T1:
    // individual switches stay adjustable after the preset).
    const reenabled = await saveFeatureModules(owner.userId, {
        pantry: true,
    });
    assert(
        reenabled.pantry === true && reenabled.plan === false,
        `partial patch should flip only Pantry, got ${JSON.stringify(reenabled)}`,
    );

    // RLS: the other account still reads its own (default) flags and
    // cannot see the owner's row at all.
    const otherFlags = await getFeatureModules(other.userId);
    assert(
        JSON.stringify(otherFlags) === JSON.stringify(ALL_ON),
        "another account's flags were affected by the owner's saves",
    );
    const visibleRows = await withUserDatabase(other.userId, async (tx) => {
        return tx<Array<{ user_id: string }>>`
            select user_id from munch.account_preferences
            where user_id = ${owner.userId}
        `;
    });
    assert(
        visibleRows.length === 0,
        "RLS leaked the owner's preference row to another account",
    );

    console.log("Feature modules smoke passed.");
} finally {
    await closePlatformDatabase();
}
