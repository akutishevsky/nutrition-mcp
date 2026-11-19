import type { SiteLocale } from "../routes.js";
import type { DeepPartial } from "./merge.js";
import type { AltUiCopy } from "./alt-ui.js";
import type { AltPageMeta, AppCopy, AppSlug } from "./alternatives.js";
import type { AppleHealthDoc } from "./apple-health.js";
import type { ChromeCopy } from "./chrome.js";
import type { DashboardDoc } from "./dashboard.js";
import type { HealthSyncCopy } from "./health-sync.js";
import type { IndexTranslation } from "./index.js";
import type { LegalDoc } from "./legal.js";
import type {
    LoginClientNotice,
    LoginDashboardCopy,
    LoginDoc,
    LoginErrors,
} from "./login.js";
import type { ToolsDoc } from "./tools.js";
import type { WidgetStrings } from "./widgets.js";

import de from "./translations/de.json" with { type: "json" };
import es from "./translations/es.json" with { type: "json" };
import fr from "./translations/fr.json" with { type: "json" };
import it from "./translations/it.json" with { type: "json" };
import ja from "./translations/ja.json" with { type: "json" };
import nl from "./translations/nl.json" with { type: "json" };
import pl from "./translations/pl.json" with { type: "json" };
import tr from "./translations/tr.json" with { type: "json" };
import uk from "./translations/uk.json" with { type: "json" };

export type NonEnLocale = Exclude<SiteLocale, "en">;

export interface TranslationBundle {
    chrome?: DeepPartial<ChromeCopy>;
    dashboard?: DeepPartial<DashboardDoc>;
    healthSync?: DeepPartial<HealthSyncCopy>;
    login?: DeepPartial<LoginDoc>;
    loginErrors?: DeepPartial<LoginErrors>;
    loginClientNotice?: DeepPartial<LoginClientNotice>;
    loginDashboard?: DeepPartial<LoginDashboardCopy>;
    altUi?: DeepPartial<AltUiCopy>;
    appleHealth?: DeepPartial<AppleHealthDoc>;
    altPageMeta?: DeepPartial<AltPageMeta>;
    alternatives?: DeepPartial<Record<AppSlug, AppCopy>>;
    index?: IndexTranslation;
    tools?: DeepPartial<ToolsDoc>;
    widgets?: DeepPartial<WidgetStrings>;
    privacy?: DeepPartial<LegalDoc>;
    terms?: DeepPartial<LegalDoc>;
}

export const TRANSLATIONS: Record<NonEnLocale, TranslationBundle> = {
    de: de as unknown as TranslationBundle,
    es: es as unknown as TranslationBundle,
    fr: fr as unknown as TranslationBundle,
    it: it as unknown as TranslationBundle,
    ja: ja as unknown as TranslationBundle,
    nl: nl as unknown as TranslationBundle,
    pl: pl as unknown as TranslationBundle,
    tr: tr as unknown as TranslationBundle,
    uk: uk as unknown as TranslationBundle,
};

export function translationOverlays<K extends keyof TranslationBundle>(
    key: K,
): Record<NonEnLocale, TranslationBundle[K]> {
    const out = {} as Record<NonEnLocale, TranslationBundle[K]>;
    for (const locale of Object.keys(TRANSLATIONS) as NonEnLocale[]) {
        out[locale] = TRANSLATIONS[locale][key];
    }
    return out;
}
