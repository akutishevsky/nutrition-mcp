import type { LoginClientNotice, LoginDoc, LoginErrors } from "./login.js";

export const LOGIN_ES: LoginDoc = {
    title: "Nutrition MCP",
    subtitle: "Inicia sesión para conectarte",
    googleButton: "Continuar con Google",
    dividerText: "o usa tu correo",
    emailLabel: "Correo electrónico",
    passwordLabel: "Contraseña",
    signInButton: "Iniciar sesión",
    createAccountButton: "Crear cuenta",
    modeGroupAriaLabel: "Cuenta",
    showPasswordLabel: "Mostrar contraseña",
    hidePasswordLabel: "Ocultar contraseña",
    consentNote:
        "Al continuar, confirmas que tienes al menos 16 años, aceptas los {terms} y la {privacy}, y consientes que almacenemos las comidas, el peso y el alcohol que registres, que son datos de salud.",
    termsLinkText: "Términos de servicio",
    privacyLinkText: "Política de privacidad",
    newHereNote:
        "¿Primera vez por aquí? Escribe tu correo y una contraseña, y luego elige «Crear cuenta».",
    afterConnectNote:
        "Cuando tu cliente se haya conectado correctamente, guarda tu contraseña en algún lugar y cierra esta pestaña del navegador.",
};

export const LOGIN_ERRORS_ES: LoginErrors = {
    googleCancelled:
        "Se canceló el inicio de sesión con Google. Inténtalo de nuevo.",
    googleFailed: "No se pudo iniciar sesión con Google. Inténtalo de nuevo.",
    invalidCredentials: "Correo o contraseña incorrectos.",
    signInFailed:
        "Ahora mismo no se puede iniciar sesión. Inténtalo de nuevo en unos minutos.",
    weakPassword:
        "Esa contraseña es demasiado débil. Elige una más larga que combine letras, números y símbolos.",
    passwordTooLong:
        "Esa contraseña es demasiado larga. Elige una de 72 caracteres como máximo.",
    emailInvalid:
        "Esa dirección de correo no es válida. Revisa que no tenga errores.",
    signUpFailed: "No pudimos crear tu cuenta. Inténtalo de nuevo más tarde.",
};

export const LOGIN_CLIENT_NOTICE_ES: LoginClientNotice = {
    returnTo: "Después de iniciar sesión, volverás a {host}.",
    unknownHost:
        "{host} no es un asistente que reconozcamos. Continúa solo si fuiste tú quien inició la conexión desde {host}.",
    loopback:
        "Volverás a un programa que se está ejecutando en este equipo ({host}). Continúa solo si iniciaste esta conexión desde él.",
};
