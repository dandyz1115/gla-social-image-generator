"use strict";

const search = document.querySelector("#search");
const fields = ["owner", "size", "type"];
const filters = Object.fromEntries(fields.map((field) => [field, document.getElementById(field)]));
const cards = document.querySelector("#cards");
const status = document.querySelector("#status");
const more = document.querySelector("#more");
const preview = document.querySelector("#preview");
const previewImage = document.querySelector("#preview-image");
const pageSize = 24;
let images = [];
let matches = [];
let shown = 0;

function normalized(value) {
  return value.normalize("NFKC").toLowerCase().replace(/[×＊*]/g, "x").trim();
}

function describe(entry) {
  return [entry.size, entry.type, entry.owner].filter(Boolean).join(" · ");
}

function downloadLink(link, entry) {
  link.href = entry.original;
  link.download = entry.filename;
}

function openPreview(entry) {
  document.querySelector("#preview-title").textContent = entry.company;
  document.querySelector("#preview-meta").textContent = [describe(entry), entry.variant].filter(Boolean).join(" · ");
  previewImage.alt = entry.company + " 展位效果图";
  previewImage.src = entry.original;
  downloadLink(document.querySelector("#preview-download"), entry);
  preview.showModal();
}

function addCards() {
  const fragment = document.createDocumentFragment();
  for (const entry of matches.slice(shown, shown + pageSize)) {
    const card = document.createElement("article");
    card.className = "booth-card";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "booth-image";
    button.setAttribute("aria-label", "预览 " + entry.company + " " + describe(entry));
    button.addEventListener("click", () => openPreview(entry));
    const thumbnail = document.createElement("img");
    thumbnail.alt = "";
    thumbnail.loading = "lazy";
    thumbnail.decoding = "async";
    thumbnail.src = entry.thumbnail;
    button.append(thumbnail);

    const content = document.createElement("div");
    content.className = "booth-content";
    const title = document.createElement("h2");
    title.textContent = entry.company;
    const meta = document.createElement("p");
    meta.className = "booth-meta";
    meta.textContent = describe(entry);
    content.append(title, meta);
    if (entry.variant) {
      const variant = document.createElement("p");
      variant.className = "booth-variant";
      variant.textContent = entry.variant;
      content.append(variant);
    }
    const link = document.createElement("a");
    link.className = "download";
    link.textContent = "下载原图";
    link.setAttribute("aria-label", "下载 " + entry.company + " " + describe(entry) + " 原图");
    downloadLink(link, entry);
    content.append(link);
    card.append(button, content);
    fragment.append(card);
  }
  cards.append(fragment);
  shown = Math.min(shown + pageSize, matches.length);
  more.hidden = shown >= matches.length;
  status.textContent = matches.length ? `共 ${matches.length} 张，已显示 ${shown} 张` : "没有找到符合条件的效果图。";
}

function applyFilters() {
  const terms = normalized(search.value).split(/\s+/).filter(Boolean);
  matches = images.filter((entry) =>
    fields.every((field) => !filters[field].value || entry[field] === filters[field].value) &&
    terms.every((term) => entry.searchText.includes(term))
  );
  shown = 0;
  cards.replaceChildren();
  addCards();
}

async function loadImages() {
  try {
    const response = await fetch("./catalog.json");
    if (!response.ok) throw new Error("Catalog unavailable");
    images = await response.json();
    for (const entry of images) {
      const compactSize = entry.size.replace(/[^0-9]/g, "");
      const reversedSize = entry.size.replace(/^(\d+)×(\d+)m$/, "$2×$1m");
      entry.searchText = normalized([entry.filename, entry.company, describe(entry), entry.variant, compactSize, reversedSize, reversedSize.replace(/[^0-9]/g, "")].join(" "));
    }
    for (const field of fields) {
      const values = [...new Set(images.map((entry) => entry[field]).filter(Boolean))].sort();
      for (const value of values) filters[field].add(new Option(value, value));
      filters[field].addEventListener("change", applyFilters);
    }
    search.addEventListener("input", applyFilters);
    document.querySelector("#clear").addEventListener("click", () => {
      search.value = "";
      for (const field of fields) filters[field].value = "";
      applyFilters();
      search.focus();
    });
    applyFilters();
  } catch {
    status.textContent = "图库暂时无法加载，请刷新页面重试。";
  }
}

more.addEventListener("click", addCards);
document.querySelector("#close-preview").addEventListener("click", () => preview.close());
preview.addEventListener("close", () => previewImage.removeAttribute("src"));
loadImages();
