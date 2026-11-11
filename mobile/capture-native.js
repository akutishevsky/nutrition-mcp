import {
    chooseInstalledPhoto,
    chooseInstalledPhotos,
    takeInstalledPhoto,
} from "./mobile-runtime.js";

/**
 * Photo-flow P8: ONE native enhancer for the shared capture control.
 *
 * Every capture point in the app renders the same control
 * (public/photo-capture.js): Take photo / Choose from library buttons
 * over a hidden file input. On the web those buttons drive the input
 * (camera via capture="environment"). Packaged, this module upgrades
 * every [data-photo-capture] control in place: it flags the control
 * data-native-capture="true" (which disables the web click wiring)
 * and drives @capacitor/camera instead — CAMERA by default for "Take
 * photo", the gallery for "Choose from library" — then hands the
 * captured files to the control's own input, so every existing
 * consumer (the meal-photo submit, the pantry Review buttons via
 * data-capture-review-button, the cook FormData forms) works
 * unchanged. This replaces the two divergent enhancers that used to
 * do this separately for the meal photo and the pantry captures.
 */

const PENDING_KEY = "munch.pendingCapture";
// Contract constant mirrored from public/photo-capture.js.
const PHOTO_CAPTURE_CHANGE_EVENT = "photo-capture:change";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

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

async function fileFromNativeResult(result, label) {
    if (!result?.webPath) {
        throw new Error("The captured image was unavailable.");
    }
    const response = await fetch(result.webPath);
    if (!response.ok) throw new Error("The captured image could not be read.");
    const blob = await response.blob();
    if (!blob.size) throw new Error("The captured image was empty.");
    if (blob.size > MAX_IMAGE_BYTES) {
        throw new Error("Image exceeds the 8 MB limit.");
    }
    return new File(
        [blob],
        `${label}-${Date.now()}.${imageExtension(result)}`,
        {
            type: mimeType(result, blob),
            lastModified: Date.now(),
        },
    );
}

function surfaceStatus(control, message) {
    const input = control.querySelector("input.photo-capture-input");
    let target = null;
    if (input?.id === "meal-photo-file") {
        target = document.getElementById("meal-photo-status");
    } else if (input?.id === "pantry-photo" || input?.id === "receipt-photo") {
        target = document.getElementById("status");
    }
    if (target) target.textContent = message;
}

function deliverFiles(control, files, { append = false } = {}) {
    const input = control.querySelector("input.photo-capture-input");
    if (!input || !files.length) return false;
    const transfer = new DataTransfer();
    if (append) {
        for (const file of input.files ?? []) transfer.items.add(file);
    }
    for (const file of files) transfer.items.add(file);
    input.files = transfer.files;
    const line = control.querySelector("[data-capture-files]");
    if (line) {
        line.textContent =
            input.files.length === 1
                ? input.files[0].name
                : `${input.files.length} photos selected`;
    }
    control.dispatchEvent(
        new CustomEvent(PHOTO_CAPTURE_CHANGE_EVENT, {
            bubbles: true,
            detail: { control, files: [...input.files] },
        }),
    );
    return true;
}

function afterDelivery(control) {
    const input = control.querySelector("input.photo-capture-input");
    const reviewSelector = control.dataset.captureReviewButton;
    if (reviewSelector) {
        document.querySelector(reviewSelector)?.click();
    }
    if (input?.id === "meal-photo-file") {
        surfaceStatus(
            control,
            "Photo added. Choose “Estimate my meal” when you're ready.",
        );
    }
}

function rememberPending(control) {
    const input = control.querySelector("input.photo-capture-input");
    if (!input?.id) return;
    try {
        sessionStorage.setItem(
            PENDING_KEY,
            JSON.stringify({ controlId: input.id }),
        );
    } catch {
        // sessionStorage can be unavailable; restore is best-effort.
    }
}

function forgetPending() {
    try {
        sessionStorage.removeItem(PENDING_KEY);
    } catch {
        // Best-effort only.
    }
}

async function captureFrom(control, source) {
    const input = control.querySelector("input.photo-capture-input");
    if (!input) return;
    const multiple = input.hasAttribute("multiple");
    rememberPending(control);
    surfaceStatus(
        control,
        source === "camera" ? "Opening camera…" : "Opening photo library…",
    );
    try {
        const files = [];
        if (source === "camera") {
            const result = await takeInstalledPhoto();
            if (result) files.push(await fileFromNativeResult(result, "photo"));
        } else if (multiple) {
            const results = await chooseInstalledPhotos();
            for (const result of results ?? []) {
                files.push(await fileFromNativeResult(result, "photo"));
            }
        } else {
            const result = await chooseInstalledPhoto();
            if (result) files.push(await fileFromNativeResult(result, "photo"));
        }
        if (!files.length) {
            surfaceStatus(control, "");
            return;
        }
        if (deliverFiles(control, files, { append: multiple })) {
            afterDelivery(control);
        }
    } catch (error) {
        const message = String(
            error?.message || error || "Image capture failed.",
        );
        if (/cancel/i.test(message)) {
            surfaceStatus(control, "");
            return;
        }
        if (
            source === "camera" &&
            /permission|denied|not allowed|unavailable/i.test(message)
        ) {
            // Camera permission denied (or no camera): the library is
            // the fallback, and the user is told why in plain words.
            surfaceStatus(
                control,
                "Camera isn't available — pick the photo from your library instead.",
            );
            await captureFrom(control, "library");
            return;
        }
        surfaceStatus(control, message);
    } finally {
        forgetPending();
    }
}

function enhanceControl(control) {
    if (!(control instanceof HTMLElement)) return;
    if (control.dataset.nativeCapture === "true") return;
    if (!control.querySelector("input.photo-capture-input")) return;
    control.dataset.nativeCapture = "true";
    control.addEventListener("click", (event) => {
        const button = event.target?.closest?.("[data-capture-action]");
        if (!button || !control.contains(button)) return;
        event.preventDefault();
        void captureFrom(
            control,
            button.dataset.captureAction === "camera" ? "camera" : "library",
        );
    });
}

function enhanceAll() {
    document
        .querySelectorAll("[data-photo-capture]")
        .forEach((control) => enhanceControl(control));
}

// The runtime restores a camera result after the OS killed the app
// mid-capture and forwards it as this event; deliver it to the
// control that started the capture.
window.addEventListener("munch:camera-restored", async (event) => {
    let pending = null;
    try {
        pending = JSON.parse(sessionStorage.getItem(PENDING_KEY) || "null");
    } catch {
        pending = null;
    }
    if (!pending?.controlId || !event.detail) return;
    const input = document.getElementById(pending.controlId);
    const control = input?.closest?.("[data-photo-capture]");
    try {
        if (control) {
            const file = await fileFromNativeResult(event.detail, "photo");
            if (
                deliverFiles(control, [file], {
                    append: input.hasAttribute("multiple"),
                })
            ) {
                afterDelivery(control);
            }
        }
    } catch (error) {
        if (control) {
            surfaceStatus(
                control,
                String(error?.message || "Unable to restore captured image."),
            );
        }
    } finally {
        forgetPending();
    }
});

enhanceAll();
new MutationObserver(enhanceAll).observe(document.documentElement, {
    childList: true,
    subtree: true,
});
