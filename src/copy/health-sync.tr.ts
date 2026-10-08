import type { HealthSyncCopy } from "./health-sync.js";

export const HEALTH_SYNC_TR: HealthSyncCopy = {
    opening: {
        title: "Kısayollar açılıyor…",
        heading: "Kısayollar açılıyor…",
        body: "Giriş yaptın. Apple Health eşitlemesinin bağlantısını tamamlamak için Nutrition MCP Health kısayolu açılıyor. Kendiliğinden açılmazsa düğmeye dokun.",
        button: "Kısayollar'ı aç",
        note: "Kısayol bağlandığını söylediğinde bu sayfayı kapatabilirsin.",
    },
    errors: {
        expired: {
            title: "Bağlantının süresi doldu",
            heading: "Bu bağlantının süresi doldu",
            body: "Bir bağlanma bağlantısı yalnızca bir kez ve yalnızca 30 dakika boyunca çalışır. Yenisini almak için iPhone cihazında Nutrition MCP Health kısayolunu yeniden çalıştır.",
        },
        signInFailed: {
            title: "Bağlanamadı",
            heading: "Giriş tamamlanamadı",
            body: "Apple Health eşitlemesi bağlanmadı. iPhone cihazında Nutrition MCP Health kısayolunu yeniden çalıştır ve açtığı sayfada giriş yap.",
        },
        generic: {
            title: "Bir şeyler ters gitti",
            heading: "Bir şeyler ters gitti",
            body: "Apple Health eşitlemesi bağlanmadı. Biraz bekle, sonra iPhone cihazında Nutrition MCP Health kısayolunu yeniden çalıştır.",
        },
    },
};
