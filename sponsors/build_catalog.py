"""Publish the selected sponsorship product mockups and their thumbnails."""

import argparse
import hashlib
import json
from pathlib import Path
import shutil

from PIL import Image, ImageOps


HERE = Path(__file__).resolve().parent
PRODUCTS = (
    ("Vanessa/eMove Global-白色迷你订书机-赞助效果图.png", "eMove Global", "Vanessa", "订书机", "白色迷你款"),
    ("一对一台卡-长桌面对面-通用版.png", "GLA 一对一台卡", "", "台卡", "长桌会谈"),
    ("参会证-人物佩戴效果图.png", "GLA 参会证", "", "参会证", "现场佩戴"),
)


def build(source):
    for folder in ("originals", "thumbs"):
        (HERE / folder).mkdir(exist_ok=True)

    entries = []
    for relative, title, owner, kind, variant in PRODUCTS:
        local = source / relative
        with local.open("rb") as original_file:
            digest = hashlib.file_digest(original_file, "sha256").hexdigest()[:20]
        original = f"originals/{digest}{local.suffix.lower()}"
        thumbnail = f"thumbs/{digest}.webp"
        shutil.copyfile(local, HERE / original)
        with Image.open(local) as image:
            preview = ImageOps.exif_transpose(image).convert("RGB")
            preview.thumbnail((760, 520))
            preview.save(HERE / thumbnail, "WEBP", quality=80)
        entries.append(dict(company=title, owner=owner, type=kind, size="", variant=variant,
                            filename=local.name, original=original, thumbnail=thumbnail))

    (HERE / "catalog.json").write_text(json.dumps(entries, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    build(parser.parse_args().source.resolve(strict=True))
