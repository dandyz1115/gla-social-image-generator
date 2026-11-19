# GLA 会员分布社媒图生成器

在线生成和下载 GLA 会员分布海报。默认显示简体中文，可切换为英文，两版共用地区占比和底部指标，并可分别编辑标题。编辑地区占比、海报标题和四项底部指标后，预览随输入更新。地区占比合计为 100% 时，可导出 1080 或 2160 像素的正方形 PNG。

网页以 GitHub Pages 从 `main` 分支根目录发布。可在本目录运行 `python3 -m http.server 8080`，然后打开 `http://localhost:8080/` 进行本地预览。数据和 PNG 在浏览器内处理。刷新页面会恢复模板数据。

字体使用 HarmonyOS Sans SC，许可见 [HarmonyOS-LICENSE.txt](assets/HarmonyOS-LICENSE.txt)。

## 展位效果图图库

`booths/` 提供搜索、筛选、大图预览和原图下载。网站从 GitHub Pages 的 `main` 根目录发布。

从仓库根目录运行以下命令更新成品索引。需要 Python 3.11+ 及 Pillow（含 WebP 支持）。

```sh
python3 booths/build_catalog.py ../GLA展位效果图
```

展位图库收录 AI 效果图。发布时可加 `--prune`，从网站目录移除已下架图片的副本。

## 赞助产品效果图

`sponsors/` 提供赞助产品效果图浏览、筛选和下载。从仓库根目录运行 `python3 sponsors/build_catalog.py ../GLA效果图` 更新指定的发布定稿。
