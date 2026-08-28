"""Knock out cream/white canvas from theme source PNGs and write 512×512 marks."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "extension" / "my_icons"
DEST = ROOT / "frontend" / "public" / "themes"
SIZE = 512


def is_mark(r: int, g: int, b: int, a: int) -> bool:
    if a < 20:
        return False
    luminance = 0.299 * r + 0.587 * g + 0.114 * b
    saturation = max(r, g, b) - min(r, g, b)
    return luminance < 222 or saturation > 20


def convex_hull(points: list[tuple[int, int]]) -> list[tuple[int, int]]:
    pts = sorted(set(points))
    if len(pts) <= 2:
        return pts

    def cross(o: tuple[int, int], a: tuple[int, int], b: tuple[int, int]) -> int:
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

    lower: list[tuple[int, int]] = []
    for p in pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)
    upper: list[tuple[int, int]] = []
    for p in reversed(pts):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)
    return lower[:-1] + upper[:-1]


def knock_out(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    points: list[tuple[int, int]] = []
    for y in range(height):
        for x in range(width):
            if is_mark(*pixels[x, y]):
                points.append((x, y))
    hull = convex_hull(points)
    mask = Image.new("L", (width, height), 0)
    ImageDraw.Draw(mask).polygon(hull, fill=255)
    alpha = mask.load()
    for y in range(height):
        for x in range(width):
            if alpha[x, y] == 0:
                pixels[x, y] = (0, 0, 0, 0)
    return rgba


def fit_square(image: Image.Image) -> Image.Image:
    pixels = image.load()
    width, height = image.size
    xs: list[int] = []
    ys: list[int] = []
    for y in range(height):
        for x in range(width):
            if pixels[x, y][3] > 20:
                xs.append(x)
                ys.append(y)
    if not xs:
        raise SystemExit("no opaque pixels")
    left, top, right, bottom = min(xs), min(ys), max(xs), max(ys)
    cropped = image.crop((left, top, right + 1, bottom + 1))
    box = max(cropped.size)
    pad = int(box * 0.08)
    canvas = Image.new("RGBA", (box + pad * 2, box + pad * 2), (0, 0, 0, 0))
    ox = (canvas.size[0] - cropped.size[0]) // 2
    oy = (canvas.size[1] - cropped.size[1]) // 2
    canvas.paste(cropped, (ox, oy), cropped)
    return canvas.resize((SIZE, SIZE), Image.LANCZOS)


def main() -> None:
    DEST.mkdir(parents=True, exist_ok=True)
    for path in sorted(SOURCE.glob("*.png")):
        out = DEST / path.name
        fitted = fit_square(knock_out(Image.open(path)))
        fitted.save(out, "PNG")
        print(f"{path.name} -> {out.relative_to(ROOT)} {fitted.size}")
    production = ROOT / "frontend" / "public" / "logo.png"
    (DEST / "terracotta.png").write_bytes(production.read_bytes())
    print("terracotta.png <- frontend/public/logo.png")


if __name__ == "__main__":
    main()
