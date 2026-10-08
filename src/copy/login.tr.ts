import type { LoginClientNotice, LoginDoc, LoginErrors } from "./login.js";

export const LOGIN_TR: LoginDoc = {
    title: "Nutrition MCP",
    subtitle: "Bağlanmak için giriş yap",
    googleButton: "Google ile devam et",
    dividerText: "veya e-posta kullan",
    emailLabel: "E-posta",
    passwordLabel: "Şifre",
    signInButton: "Giriş yap",
    createAccountButton: "Hesap oluştur",
    modeGroupAriaLabel: "Hesap",
    showPasswordLabel: "Şifreyi göster",
    hidePasswordLabel: "Şifreyi gizle",
    consentNote:
        "Devam ederek en az 16 yaşında olduğunu onaylıyor, {terms} ve {privacy} belgelerini kabul ediyor ve kaydettiğin yemek, kilo, vücut ölçüsü ve alkol verilerini (bunlar sağlık verisidir) saklamamıza izin veriyorsun.",
    termsLinkText: "Kullanım Koşulları",
    privacyLinkText: "Gizlilik Politikası",
    newHereNote:
        "Yeni misin? E-postanı ve bir şifre gir, sonra Hesap oluştur'u seç.",
    afterConnectNote:
        "İstemcinde bağlantı kurulduktan sonra şifreni bir yere kaydet ve bu tarayıcı sekmesini kapat.",
};

export const LOGIN_ERRORS_TR: LoginErrors = {
    googleCancelled: "Google ile giriş iptal edildi. Lütfen tekrar dene.",
    googleFailed: "Google ile giriş başarısız oldu. Lütfen tekrar dene.",
    invalidCredentials: "E-posta veya şifre yanlış.",
    signInFailed:
        "Giriş şu anda çalışmıyor. Lütfen birkaç dakika sonra tekrar dene.",
    weakPassword:
        "Bu şifre fazla zayıf. Harf, sayı ve simge içeren daha uzun bir tane seç.",
    passwordTooLong: "Bu şifre fazla uzun. En çok 72 karakterlik bir tane seç.",
    emailInvalid:
        "Bu e-posta adresi geçersiz. Yazım hatası olup olmadığına bak.",
    signUpFailed: "Hesabını oluşturamadık. Lütfen daha sonra tekrar dene.",
};

export const LOGIN_CLIENT_NOTICE_TR: LoginClientNotice = {
    returnTo: "Giriş yaptıktan sonra {host} adresine geri gönderileceksin.",
    unknownHost:
        "{host}, tanıdığımız bir asistan değil. Bağlanmayı {host} üzerinden kendin başlattıysan devam et.",
    loopback:
        "Bu bilgisayarda çalışan bir programa geri gönderileceksin ({host}). Bu bağlantıyı oradan kendin başlattıysan devam et.",
    healthSync:
        "Giriş yapmak, bu sayfayı açan cihazda Apple Health eşitlemesini bağlar. Bunu az önce kendi iPhone cihazındaki Nutrition MCP kısayolundan sen başlatmadıysan bu sayfayı kapat.",
};
