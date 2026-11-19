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

图库使用按图片内容命名的资源。更新时会保留先前已发布的文件路径，以便旧下载链接继续可用。模板、聊天截图和未标识的素材应保留在图库外。
