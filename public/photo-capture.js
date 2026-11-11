/**
 * Shared camera-first photo capture control (photo-flow P8).
 *
 * ONE control for every photo capture/attach point in the app — meal
 * photo, receipt scan, pantry scan, cook photos. Michael's ruling:
 * "the 'choose file' stuff needs to just be default camera with an
 * option to add photo from library. It's almost always gonna be
 * camera."
 *
 * On the web the control renders two real buttons — "Take photo"
 * (drives the file input with capture="environment", which opens the
 * camera directly on mobile browsers) and "Choose from library" (the
 * same input without the capture hint). The raw file input itself is
 * never presented bare. In the packaged app, mobile/capture-native.js
 * upgrades the SAME control: it flags the element
 * (data-native-capture="true", which disables this module's click
 * wiring) and drives @capacitor/camera instead — camera by default,
 * library as the visible secondary action.
 *
 * Selection state lives on the control's single file input, so every
 * existing consumer (FormData forms, input.files readers) works
 * unchanged, and a `photo-capture:change` event announces new files.
 */

export const PHOTO_CAPTURE_CHANGE_EVENT = "photo-capture:change";

/** Long-edge cap for client-side downscale before upload (P7). Phone
 * cameras ship 3–8 MB frames; the vision model needs none of that
 * resolution, and every megabyte costs upload seconds on mobile. */
export const PHOTO_DOWNSCALE_MAX_EDGE = 1568;

function escapeAttribute(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll('"', "&quot;")
        .replaceAll("<", "&lt;");
}

function escapeText(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

/**
 * The control markup. `inputId` / `name` preserve each surface's
 * existing contract (the meal-photo dialog reads #meal-photo-file;
 * cook forms submit a FormData field named "photos"; pantry.js reads
 * #pantry-photo / #receipt-photo).
 */
export function photoCaptureMarkup({
    inputId,
    name,
    label,
    multiple = false,
    accept = "image/jpeg,image/png,image/webp",
    cameraLabel = "Take photo",
    libraryLabel = "Choose from library",
} = {}) {
    return `<div class="photo-capture" data-photo-capture><span class="photo-capture-label">${escapeText(label ?? "Photo")}</span><div class="photo-capture-actions"><button class="button button-primary photo-capture-button" type="button" data-capture-action="camera">${escapeText(cameraLabel)}</button><button class="button button-secondary photo-capture-button" type="button" data-capture-action="library">${escapeText(libraryLabel)}</button></div><input class="photo-capture-input" type="file"${inputId ? ` id="${escapeAttribute(inputId)}"` : ""}${name ? ` name="${escapeAttribute(name)}"` : ""} accept="${escapeAttribute(accept)}"${multiple ? " multiple" : ""} hidden /><p class="tiny photo-capture-files" data-capture-files role="status"></p></div>`;
}

/** Reflect the input's current selection in the control's file line. */
export function updatePhotoCaptureFileList(control, files) {
    const line = control?.querySelector?.("[data-capture-files]");
    if (!line) return;
    const names = [...(files ?? [])].map((file) => file.name).filter(Boolean);
    line.textContent = names.length
        ? names.length === 1
            ? names[0]
            : `${names.length} photos selected`
        : "";
}

/**
 * Hand files to a control programmatically (the packaged enhancer's
 * native-camera delivery path): they land on the control's input, the
 * file line updates, and `photo-capture:change` fires — the same
 * observable state as a user picking the files on the web.
 */
export function setPhotoCaptureFiles(control, files, { append = false } = {}) {
    const input = control?.querySelector?.("input.photo-capture-input");
    if (!input) return false;
    const transfer = new DataTransfer();
    if (append) {
        for (const file of input.files ?? []) transfer.items.add(file);
    }
    for (const file of files ?? []) transfer.items.add(file);
    input.files = transfer.files;
    updatePhotoCaptureFileList(control, input.files);
    control.dispatchEvent(
        new CustomEvent(PHOTO_CAPTURE_CHANGE_EVENT, {
            bubbles: true,
            detail: { control, files: [...input.files] },
        }),
    );
    return true;
}

let installed = false;

/**
 * Wire the web behaviour: one delegated click + change pair for the
 * whole document, so dynamically rendered surfaces (dialogs, cook
 * forms, the draft review) need no per-render setup. Controls flagged
 * data-native-capture="true" (the packaged enhancer) are left alone.
 */
export function installPhotoCapture() {
    if (installed || typeof document === "undefined") return;
    installed = true;
    document.addEventListener("click", (event) => {
        const button = event.target?.closest?.("[data-capture-action]");
        if (!button) return;
        const control = button.closest("[data-photo-capture]");
        if (!control || control.dataset.nativeCapture === "true") return;
        const input = control.querySelector("input.photo-capture-input");
        if (!input) return;
        if (button.dataset.captureAction === "camera") {
            input.setAttribute("capture", "environment");
        } else {
            input.removeAttribute("capture");
        }
        input.click();
    });
    document.addEventListener("change", (event) => {
        const input = event.target;
        if (!(input instanceof HTMLInputElement)) return;
        if (!input.classList?.contains("photo-capture-input")) return;
        const control = input.closest("[data-photo-capture]");
        if (!control) return;
        updatePhotoCaptureFileList(control, input.files);
        control.dispatchEvent(
            new CustomEvent(PHOTO_CAPTURE_CHANGE_EVENT, {
                bubbles: true,
                detail: { control, files: [...(input.files ?? [])] },
            }),
        );
    });
}

/** Fit (width, height) inside a long-edge cap, preserving aspect. */
export function fitWithinEdge(width, height, maxEdge) {
    const longest = Math.max(width, height);
    if (!Number.isFinite(longest) || longest <= maxEdge) {
        return { width, height, scaled: false };
    }
    const ratio = maxEdge / longest;
    return {
        width: Math.max(1, Math.round(width * ratio)),
        height: Math.max(1, Math.round(height * ratio)),
        scaled: true,
    };
}

/**
 * Downscale an image file client-side before upload (photo-flow P7):
 * long edge capped at PHOTO_DOWNSCALE_MAX_EDGE, re-encoded as JPEG.
 * Any failure — undecodable image, no canvas, a result that is not
 * actually smaller — returns the original file untouched.
 */
export async function downscaleImageFile(
    file,
    { maxEdge = PHOTO_DOWNSCALE_MAX_EDGE, quality = 0.85 } = {},
) {
    if (!file || !String(file.type ?? "").startsWith("image/")) return file;
    if (
        typeof createImageBitmap === "undefined" ||
        typeof document === "undefined"
    ) {
        return file;
    }
    try {
        const bitmap = await createImageBitmap(file);
        const fitted = fitWithinEdge(bitmap.width, bitmap.height, maxEdge);
        if (!fitted.scaled) {
            bitmap.close?.();
            return file;
        }
        const canvas = document.createElement("canvas");
        canvas.width = fitted.width;
        canvas.height = fitted.height;
        const context = canvas.getContext("2d");
        if (!context) {
            bitmap.close?.();
            return file;
        }
        context.drawImage(bitmap, 0, 0, fitted.width, fitted.height);
        bitmap.close?.();
        const blob = await new Promise((resolve) =>
            canvas.toBlob(resolve, "image/jpeg", quality),
        );
        if (!blob || blob.size >= file.size) return file;
        const baseName = String(file.name || "photo").replace(/\.[^.]+$/, "");
        return new File([blob], `${baseName}.jpg`, {
            type: "image/jpeg",
            lastModified: Date.now(),
        });
    } catch {
        return file;
    }
}
