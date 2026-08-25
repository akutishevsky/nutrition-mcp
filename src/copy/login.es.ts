import type { LoginDoc, LoginErrors } from "./login.js";

export const LOGIN_ES: LoginDoc = {
    title: "Nutrition MCP",
    subtitle: "Inicia sesión para conectar",
    googleButton: "Continuar con Google",
    dividerText: "o usa tu correo",
    emailLabel: "Correo electrónico",
    passwordLabel: "Contraseña",
    continueButton: "Continuar",
    consentNote:
        "Al continuar confirmas que tienes al menos 16 años y aceptas los {terms} y la {privacy}.",
    termsLinkText: "Términos de servicio",
    privacyLinkText: "Política de privacidad",
    newHereNote:
        "¿Es tu primera vez? Escribe tu correo y una contraseña — la cuenta se creará automáticamente.",
    afterConnectNote:
        "Cuando la conexión se haya completado en tu cliente, guarda la contraseña en un lugar seguro y cierra esta pestaña del navegador.",
};

export const LOGIN_ERRORS_ES: LoginErrors = {
    googleCancelled:
        "Se canceló el inicio de sesión con Google. Inténtalo de nuevo.",
    googleFailed: "El inicio de sesión con Google falló. Inténtalo de nuevo.",
};
