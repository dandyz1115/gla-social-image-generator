"""Create the public booth index from the local delivery folder."""

import argparse
import hashlib
import json
import re
import shutil
from pathlib import Path

from PIL import Image, ImageOps


HERE = Path(__file__).resolve().parent
SIZE = re.compile(r"(\d+)\s*[×xX*]\s*(\d+)\s*m?", re.IGNORECASE)
EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}


def publishable(path, root):
    relative = path.relative_to(root)
    name = path.stem
    if path.suffix.lower() not in EXTENSIONS or any(marker in name for marker in ("预览", "3D渲染", "3D模型")):
        return False
    if name in {"6x6标展", "F2 LOGISTICS-6×3m-特展-Option 3-四面门楣空顶-尺寸标注-2K"}:
        return False
    if len(relative.parts) == 1:
        return bool(SIZE.search(name) and ("标展" in name or "特展" in name))
    if len(relative.parts) != 2:
        return False
    if relative.parts[0].endswith("-展位效果图"):
        return True
    if relative.parts[0] == "模板":
        return name.endswith("-AI模板-2K") and name.startswith((
            "GLA-3×3m-标展-三面开放-",
            "GLA-6×3m-特展-Option 3-",
        ))
    return relative.parts[0] == "6x6米展位-3D模型" and name.startswith("GLA-") and "尺寸标注" in name


def replaced(path, source):
    name = path.stem
    for suffix in ("-尺寸标注-2K", "-3×3m-标展-尺寸标注-2K"):
        if name.endswith(suffix):
            prefix = name.removesuffix(suffix)
            for revision in ("-尺寸校正-2K", "-尺寸标注-门头更新-2K", "-3×3m-标展-完整Logo-尺寸标注-2K"):
                if path.with_name(prefix + revision + path.suffix) in source:
                    return True
    if name.startswith("Horizon Cleford-6×3m-特展"):
        if name.endswith(("-冷白-2K", "-冷白原色Logo-2K")):
            return True
        if "Option 3" in name and name.endswith("-冷白反白优化-2K"):
            return any(p.parent == path.parent and p.stem.startswith("Horizon Cleford-6×3m-特展-Option 3-前柱对齐") for p in source)
    if name.endswith("-v1") and path.with_name(name[:-3] + "-v2" + path.suffix) in source:
        return True
    return False


def describe(path, root):
    name = path.stem
    match = SIZE.search(name)
    owner = path.parent.name.removesuffix("-展位效果图") if path.parent.name.endswith("-展位效果图") else ""
    if owner == "TRANSEAGO":
        owner = ""
    if name.startswith("Option") and "TRANSEAGO" in name:
        return "TRANSEAGO", owner, "6×3m", "特展", name.replace("-TRANSEAGO", "").replace("-6×3m", "").removesuffix("-2K").replace("-", " · ")
    if not match:
        raise ValueError(f"Missing booth size: {path.relative_to(root)}")
    company = name[:match.start()].strip(" -")
    width, depth = sorted((int(match[1]), int(match[2])), reverse=True)
    type_name = "特展" if "特展" in name else "标展"
    variant = name[match.end():].strip(" -")
    variant = re.sub(r"(标展效果图|特展效果图|拼接标展|标展|特展|效果图|尺寸标注|2K)", "", variant)
    variant = " · ".join(part for part in variant.split("-") if part)
    if company == "Transport Services and Logistics Group":
        company += " (TSL)"
    return company, owner, f"{width}×{depth}m", type_name, variant


def build(root, prune=False):
    source = {path for path in root.rglob("*") if path.is_file() and publishable(path, root)}
    (HERE / "originals").mkdir(exist_ok=True)
    (HERE / "thumbs").mkdir(exist_ok=True)
    entries = []
    seen = set()
    for path in sorted(source, key=lambda p: (p.parent == root, str(p).casefold())):
        if replaced(path, source):
            continue
        with path.open("rb") as original_file:
            digest = hashlib.file_digest(original_file, "sha256").hexdigest()
        if digest in seen:
            continue
        seen.add(digest)
        company, owner, size, type_name, variant = describe(path, root)
        original = f"originals/{digest[:20]}{path.suffix.lower()}"
        thumbnail = f"thumbs/{digest[:20]}.webp"
        if not (HERE / original).exists():
            shutil.copyfile(path, HERE / original)
        if not (HERE / thumbnail).exists():
            with Image.open(path) as image:
                preview = ImageOps.exif_transpose(image).convert("RGB")
                preview.thumbnail((760, 520))
                preview.save(HERE / thumbnail, "WEBP", quality=80)
        entries.append(dict(company=company, owner=owner, size=size, type=type_name, variant=variant,
                            filename=path.name, original=original, thumbnail=thumbnail, modified=path.stat().st_mtime))
    entries.sort(key=lambda entry: (-entry["modified"], entry["filename"]))
    for entry in entries:
        del entry["modified"]
    (HERE / "catalog.json").write_text(json.dumps(entries, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if prune:
        for key, folder in (("original", "originals"), ("thumbnail", "thumbs")):
            keep = {HERE / entry[key] for entry in entries}
            for path in (HERE / folder).iterdir():
                if path.is_file() and path.suffix.lower() in EXTENSIONS and path not in keep:
                    path.unlink()
    print(f"{len(entries)} booth renders")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("--prune", action="store_true", help="Remove unpublished image copies from the site")
    args = parser.parse_args()
    build(args.source.resolve(strict=True), args.prune)
