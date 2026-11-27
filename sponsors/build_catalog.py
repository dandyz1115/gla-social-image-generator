"""Publish the selected sponsorship product mockups and their thumbnails."""

import argparse
import hashlib
import json
from pathlib import Path
import shutil

from PIL import Image, ImageOps


HERE = Path(__file__).resolve().parent
PRODUCTS = (
    ("深圳2027/GLA深圳2027-万能转换头赞助-英文海报.png", "GLA 深圳 2027 万能转换头赞助", "", "万能转换头", "英文招商海报 · YOUR LOGO赞助位 · 含报名二维码"),
    ("深圳2027/GLA深圳2027-万能转换头赞助-中文海报.png", "GLA 深圳 2027 万能转换头赞助", "", "万能转换头", "中文招商海报 · YOUR LOGO赞助位 · 含报名二维码"),
    ("Vanessa/TCL-白色迷你订书机-赞助效果图-2K.png", "TCL", "Vanessa", "订书机", "白色迷你款 · 展会场景"),
    ("Ivy/Marsa Shipping-纸张赞助效果图-2K.png", "Marsa Shipping", "Ivy", "纸张", "英文服务清单 · 双页平铺"),
    ("深圳2027/GLA深圳2027-大头贴相册-展会手持效果图.png", "GLA 深圳 2027 大头贴相册", "", "大头贴相册", "展会手持场景"),
    ("Matt/GLA深圳2027-大头贴相册-赞助总览-价格待议-中文.png", "GLA 深圳 2027 大头贴相册", "Matt", "大头贴相册", "中文总览 · 四款 · 价格待议"),
    ("深圳2027/GLA深圳2027-大头贴相册-赞助总览-价格待议.png", "GLA 深圳 2027 大头贴相册", "Matt", "大头贴相册", "英文总览 · 四款 · 价格待议"),
    ("深圳2027/GLA深圳2027-行李牌杯垫赞助总览-价格与权益待议.png", "GLA 深圳 2027 行李牌／杯垫", "", "行李牌", "中文总览 · 价格与赞助权益待议"),
    ("深圳2027/GLA深圳2027-行李牌杯垫赞助总览-价格与权益待议-英文.png", "GLA 深圳 2027 行李牌／杯垫", "", "行李牌", "英文总览 · 价格与赞助权益待议"),
    ("深圳2027/GLA深圳2027-白色行李牌-行李箱场景.png", "GLA 深圳 2027 行李牌", "", "行李牌", "白色圆形款 · 行李箱场景"),
    ("深圳2027/GLA深圳2027-白色行李牌-背包场景.png", "GLA 深圳 2027 行李牌", "", "行李牌", "白色圆形款 · 背包场景"),
    ("深圳2027/GLA深圳2027-白色行李牌-翻开细节.png", "GLA 深圳 2027 行李牌", "", "行李牌", "白色圆形款 · 翻开细节"),
    ("深圳2027/GLA深圳2027-吊旗-近景.png", "GLA 深圳 2027 吊旗", "", "吊旗", "展馆近景"),
    ("深圳2027/GLA深圳2027-吊旗-场馆远景.png", "GLA 深圳 2027 吊旗", "", "吊旗", "展馆远景"),
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

    # Preserve the original product mockups; publish current sale resources as
    # one card per project, sharing the approved bilingual sample temporarily.
    (HERE / "effect-catalog.json").write_text(json.dumps(entries, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    inventory = json.loads((HERE / "availability.json").read_text())
    english = next(entry for entry in entries if "英文海报" in entry["filename"])
    chinese = next(entry for entry in entries if "中文海报" in entry["filename"])
    entries = [
        dict(chinese, company=item["name"], type=item["name"],
             priority="首推赞助" if item["recommended"] else "其他待售",
             recommended=item["recommended"], quantity=item["quantity"],
             variant="待售名额 × " + str(item["quantity"]) + (" · " + item["note"] if item["note"] else "") + " · 统一海报示例（待替换）",
             originalEn=english["original"], filenameEn=english["filename"])
        for item in inventory["items"]
    ]

    (HERE / "catalog.json").write_text(json.dumps(entries, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    build(parser.parse_args().source.resolve(strict=True))
