#!/usr/bin/env python3
"""Generate every shipped Munch launcher icon and splash image.

Source of truth: public/brand/munch-mark-512.png — the plump-apple mark
(PR #165), RGBA with a transparent background and the Nutrition-Facts
rule rhythm as transparent knockouts. The generated assets composite
that mark, with its authored framing unchanged, onto the brand paper.

Paper color: #F6F1E7 — the `--paper` design token in
public/editorial.css. (The mark PNG's own corner pixel is transparent
black, (0, 0, 0, 0): no paper is baked into the source file, so the
design token is the authoritative paper.)

Outputs (all committed; CI never runs this script):
  Android legacy   mipmap-{mdpi..xxxhdpi}/ic_launcher.png        48..192
                   mipmap-{mdpi..xxxhdpi}/ic_launcher_round.png  (circle mask)
  Android adaptive mipmap-{mdpi..xxxhdpi}/ic_launcher_foreground.png
                   108..432, mark on transparency, sized inside the
                   66dp adaptive safe zone; the background is the
                   @color/ic_launcher_background value (#F6F1E7) set in
                   res/values/ic_launcher_background.xml.
  Android splash   drawable{,-port-*,-land-*}/splash.png at the exact
                   sizes already present in the tree.
  iOS              AppIcon.appiconset/AppIcon-512@2x.png  1024, opaque
                   Splash.imageset/splash-2732x2732*.png 2732, opaque

Requires Python 3 + Pillow (pip install pillow). Run from the repo
root:  python3 scripts/generate-app-icons.py
"""

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
MARK_PATH = ROOT / "public" / "brand" / "munch-mark-512.png"
PAPER = (246, 241, 231, 255)  # #F6F1E7, --paper in public/editorial.css

RES = ROOT / "android" / "app" / "src" / "main" / "res"
IOS_ASSETS = ROOT / "ios" / "App" / "App" / "Assets.xcassets"

# Android density buckets: (folder suffix, legacy icon px, adaptive px).
DENSITIES = [
    ("mdpi", 48, 108),
    ("hdpi", 72, 162),
    ("xhdpi", 96, 216),
    ("xxhdpi", 144, 324),
    ("xxxhdpi", 192, 432),
]

# The adaptive foreground canvas is 108dp; the guaranteed-visible safe
# zone is the centered 66dp circle. The mark's art occupies ~57% x ~64%
# of its own canvas, so the mark canvas is placed at 90% of the
# foreground canvas: art lands at ~51% x ~58%, inside the safe zone.
FOREGROUND_MARK_FRACTION = 0.90

# Splash: mark canvas sized against the canvas' smaller dimension.
SPLASH_MARK_FRACTION = 0.36

SS = 4  # supersampling factor for clean downscales


def load_mark() -> Image.Image:
    mark = Image.open(MARK_PATH).convert("RGBA")
    if mark.size != (512, 512):
        raise SystemExit(f"Unexpected mark size: {mark.size}")
    return mark


def place_mark(canvas: Image.Image, mark: Image.Image, fraction: float) -> None:
    """Composite the mark canvas, centered, at `fraction` of canvas width."""
    target = round(canvas.width * fraction)
    resized = mark.resize((target, target), Image.LANCZOS)
    x = (canvas.width - target) // 2
    y = (canvas.height - target) // 2
    canvas.alpha_composite(resized, (x, y))


def icon_composition(size: int, mark: Image.Image) -> Image.Image:
    """Mark on paper at the mark's authored full-canvas framing — the
    same composition as the approved Play listing icon."""
    canvas = Image.new("RGBA", (size * SS, size * SS), PAPER)
    place_mark(canvas, mark, 1.0)
    return canvas.resize((size, size), Image.LANCZOS)


def round_variant(image: Image.Image) -> Image.Image:
    size = image.width * SS
    big = image.resize((size, size), Image.LANCZOS)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size, size), fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(big, (0, 0), mask)
    return out.resize((image.width, image.width), Image.LANCZOS)


def foreground(size: int, mark: Image.Image) -> Image.Image:
    canvas = Image.new("RGBA", (size * SS, size * SS), (0, 0, 0, 0))
    place_mark(canvas, mark, FOREGROUND_MARK_FRACTION)
    return canvas.resize((size, size), Image.LANCZOS)


def splash(width: int, height: int, mark: Image.Image) -> Image.Image:
    scale = SS
    canvas = Image.new("RGBA", (width * scale, height * scale), PAPER)
    target = round(min(width, height) * SPLASH_MARK_FRACTION) * scale
    resized = mark.resize((target, target), Image.LANCZOS)
    canvas.alpha_composite(
        resized,
        ((canvas.width - target) // 2, (canvas.height - target) // 2),
    )
    return canvas.resize((width, height), Image.LANCZOS).convert("RGB")


def save(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, format="PNG", optimize=True)
    print(f"wrote {path.relative_to(ROOT)} ({image.width}x{image.height})")


def main() -> None:
    mark = load_mark()

    for suffix, legacy_px, adaptive_px in DENSITIES:
        folder = RES / f"mipmap-{suffix}"
        icon = icon_composition(legacy_px, mark)
        save(icon, folder / "ic_launcher.png")
        save(round_variant(icon), folder / "ic_launcher_round.png")
        save(foreground(adaptive_px, mark), folder / "ic_launcher_foreground.png")

    splash_targets = [RES / "drawable" / "splash.png"]
    for orientation in ("port", "land"):
        for suffix, _, _ in DENSITIES:
            splash_targets.append(
                RES / f"drawable-{orientation}-{suffix}" / "splash.png"
            )
    for target in splash_targets:
        existing = Image.open(target)
        save(splash(existing.width, existing.height, mark), target)

    appicon = icon_composition(1024, mark).convert("RGB")
    save(appicon, IOS_ASSETS / "AppIcon.appiconset" / "AppIcon-512@2x.png")

    ios_splash = splash(2732, 2732, mark)
    for name in (
        "splash-2732x2732.png",
        "splash-2732x2732-1.png",
        "splash-2732x2732-2.png",
    ):
        save(ios_splash, IOS_ASSETS / "Splash.imageset" / name)


if __name__ == "__main__":
    main()
