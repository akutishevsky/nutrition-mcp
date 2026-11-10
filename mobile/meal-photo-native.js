import { chooseInstalledPhoto, takeInstalledPhoto } from "./mobile-runtime.js";

/**
 * S4 — native meal-photo capture for the packaged shell.
 *
 * The S3 "Log by photo" dialog (public/app.js) uses a WebView file
 * input. In the packaged app this module applies the proven Pantry
 * pattern (mobile/pantry-native.js) to that dialog: injected
 * Take photo / Choose photo buttons backed by @capacitor/camera, the
 * captured image handed to the existing dialog as a File through the
 * same #meal-photo-file input the web flow submits (8 MB cap), and a
 * pending capture restored after process death via sessionStorage +
 * the runtime's `munch:camera-restored` event. Web behaviour is
 * untouched — this module only loads inside the packaged bundle.
 */

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const CAPTURE_KEY = "munch.pendingMealPhotoCapture";
const RESULT_KEY = "munch.pendingMealPhotoResult";

function imageExtension(result) {
    const format = String(result?.metadata?.format || "jpeg").toLowerCase();
    if (format === "jpg" || format === "jpeg") return "jpg";
    if (format === "png" || format === "webp") return format;
    return "jpg";
}

function mimeType(result, blob) {
    if (blob.type?.startsWith("image/")) return blob.type;
    const format = imageExtension(result);
    return format === "jpg" ? "image/jpeg" : `image/${format}`;
}

async function fileFromNativeResult(result) {
    if (!result?.webPath)
        throw new Error("The selected image was unavailable.");
    const response = await fetch(result.webPath);
    if (!response.ok) throw new Error("The selected image could not be read.");
    const blob = await response.blob();
    if (!blob.size) throw new Error("The selected image was empty.");
    if (blob.size > MAX_IMAGE_BYTES) {
        throw new Error("Image exceeds the 8 MB meal photo limit.");
    }
    return new File([blob], `meal-${Date.now()}.${imageExtension(result)}`, {
        type: mimeType(result, blob),
        lastModified: Date.now(),
    });
}

function dialogStatus(message) {
    const status = document.querySelector("#meal-photo-status");
    if (status) status.textContent = message || "";
}

async function handImageToMealPhotoDialog(result) {
    const input = document.querySelector("#meal-photo-file");
    if (!(input instanceof HTMLInputElement)) {
        throw new Error("The meal photo review surface is unavailable.");
    }
    const file = await fileFromNativeResult(result);
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    dialogStatus("Photo added — check the meal type, then estimate my meal.");
}

async function capture(source) {
    sessionStorage.setItem(CAPTURE_KEY, "meal-photo");
    try {
        const result =
            source === "camera"
                ? await takeInstalledPhoto()
                : await chooseInstalledPhoto();
        if (!result) {
            dialogStatus("");
            return;
        }
        await handImageToMealPhotoDialog(result);
    } catch (error) {
        const message = String(
            error?.message || error || "Image capture failed.",
        );
        if (/cancel/i.test(message)) dialogStatus("");
        else dialogStatus(message);
    } finally {
        sessionStorage.removeItem(CAPTURE_KEY);
    }
}

function createButton(text, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "button button-secondary";
    button.textContent = text;
    button.addEventListener("click", onClick);
    return button;
}

async function restorePendingResult() {
    const raw = sessionStorage.getItem(RESULT_KEY);
    if (!raw) return;
    sessionStorage.removeItem(RESULT_KEY);
    try {
        await handImageToMealPhotoDialog(JSON.parse(raw));
    } catch (error) {
        dialogStatus(error?.message || "Unable to restore the captured photo.");
    }
}

function enhanceMealPhotoDialog() {
    const input = document.querySelector("#meal-photo-file");
    if (!(input instanceof HTMLInputElement)) return;
    if (input.dataset.nativeEnhanced === "true") return;
    input.dataset.nativeEnhanced = "true";

    const actions = document.createElement("div");
    actions.className = "meal-photo-native-actions";
    actions.append(
        createButton("Take photo", () => capture("camera")),
        createButton("Choose photo", () => capture("library")),
    );
    const label = input.closest("label") || input;
    label.insertAdjacentElement("afterend", actions);
    input.classList.add("hidden");
    void restorePendingResult();
}

// The dialog is rendered dynamically by app.js, so watch for the
// file input appearing (and re-appearing on each open).
const observer = new MutationObserver(() => enhanceMealPhotoDialog());
observer.observe(document.documentElement, { childList: true, subtree: true });
enhanceMealPhotoDialog();

window.addEventListener("munch:camera-restored", async (event) => {
    if (sessionStorage.getItem(CAPTURE_KEY) !== "meal-photo") return;
    sessionStorage.removeItem(CAPTURE_KEY);
    try {
        await handImageToMealPhotoDialog(event.detail);
    } catch {
        // The dialog is not open after a process-death relaunch: keep
        // the capture so it lands in the dialog when the user reopens
        // "Log by photo" instead of dropping it.
        try {
            sessionStorage.setItem(RESULT_KEY, JSON.stringify(event.detail));
        } catch {
            dialogStatus("Unable to restore the captured photo.");
        }
    }
});
