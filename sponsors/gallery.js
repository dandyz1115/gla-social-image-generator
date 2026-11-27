"use strict";

const search = document.querySelector("#search");
const fields = ["owner", "type"].filter((field) => document.getElementById(field));
const filters = Object.fromEntries(fields.map((field) => [field, document.getElementById(field)]));
const cards = document.querySelector("#cards");
const status = document.querySelector("#status");
const pagination = document.querySelector("#pagination");
const preview = document.querySelector("#preview");
const previewImage = document.querySelector("#preview-image");
const pageSize = 30;
const posterLanguages = new Map();
let images = [];
let matches = [];
let layoutFrame = 0;
const masonryObserver = typeof ResizeObserver === "function" ? new ResizeObserver(scheduleMasonry) : null;

function scheduleMasonry() {
  if (!layoutFrame) layoutFrame = requestAnimationFrame(layoutMasonry);
}

function layoutMasonry() {
  layoutFrame = 0;
  const items = [...cards.children];
  const width = cards.getBoundingClientRect().width;
  if (!items.length || !width) {
    cards.classList.remove("is-masonry");
    cards.style.removeProperty("height");
    return;
  }

  const style = getComputedStyle(cards);
  const columns = Number(style.getPropertyValue("--gallery-columns"));
  const gap = parseFloat(style.getPropertyValue("--gallery-gap"));
  const columnStep = (width + gap) / columns;
  const columnBottoms = Array(columns).fill(0);

  cards.classList.add("is-masonry");
  const heights = items.map((item) => item.getBoundingClientRect().height);
  items.forEach((item, index) => {
    // Keep DOM order and place each new card below the shortest column.
    const top = Math.min(...columnBottoms);
    const column = columnBottoms.indexOf(top);
    item.style.transform = `translate(${column * columnStep}px, ${top}px)`;
    columnBottoms[column] = top + heights[index] + gap;
  });
  cards.style.height = `${Math.max(...columnBottoms) - gap}px`;
}

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
  previewImage.alt = entry.company + " 效果图";
  previewImage.src = entry.original;
  downloadLink(document.querySelector("#preview-download"), entry);
  preview.showModal();
}

function renderPage(page) {
  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, matches.length);
  const fragment = document.createDocumentFragment();
  for (const baseEntry of matches.slice(start, end)) {
    let posterLanguage = posterLanguages.get(baseEntry.company) || "zh";
    let entry = posterLanguage === "en" && baseEntry.originalEn ? {...baseEntry, company:baseEntry.companyEn || baseEntry.company, type:baseEntry.companyEn || baseEntry.type, variant:baseEntry.variantEn || baseEntry.variant, original:baseEntry.originalEn, thumbnail:baseEntry.thumbnailEn || baseEntry.thumbnail, filename:baseEntry.filenameEn} : baseEntry;
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
    link.textContent = baseEntry.originalEn ? "下载中文" : "下载原图";
    link.setAttribute("aria-label", "下载 " + entry.company + " " + describe(entry) + " 原图");
    downloadLink(link, entry);
    content.append(link);
    if (baseEntry.originalEn) {
    const actions = document.createElement("div"); actions.className = "bilingual-actions";
    downloadLink(link, baseEntry); actions.append(link);
    if (baseEntry.originalEn) {
      const tabs = document.createElement("div"); tabs.className = "card-languages";
      tabs.setAttribute("role", "group"); tabs.setAttribute("aria-label", "海报语言");
      for (const [language, label] of [["zh","中文"],["en","English"]]) {
        const tab = document.createElement("button"); tab.type = "button"; tab.className = "quiet"; tab.textContent = label;
        tab.setAttribute("aria-pressed", String(language === posterLanguage));
        tab.addEventListener("click", () => {
          posterLanguage = language; posterLanguages.set(baseEntry.company, language);
          entry = language === "en" ? {...baseEntry, company:baseEntry.companyEn, type:baseEntry.companyEn, variant:baseEntry.variantEn, original:baseEntry.originalEn, thumbnail:baseEntry.thumbnailEn, filename:baseEntry.filenameEn} : baseEntry;
          thumbnail.src = entry.thumbnail;
          title.textContent = entry.company; meta.textContent = describe(entry);
          const variantText = content.querySelector(".booth-variant");
          if (variantText) variantText.textContent = entry.variant;
          const badge = content.querySelector(".priority-label");
          if (badge) badge.textContent = language === "en" ? "Featured" : "首推赞助";
          button.setAttribute("aria-label", "预览 " + entry.company);
          for (const other of tabs.children) other.setAttribute("aria-pressed", String(other === tab));
          scheduleMasonry();
        });
        tabs.append(tab);
      }
      content.append(tabs);
      const englishDownload = document.createElement("a"); englishDownload.className = "download";
      englishDownload.href = entry.originalEn; englishDownload.download = entry.filenameEn; englishDownload.textContent = "下载英文";
      actions.append(englishDownload);
    }
    content.append(actions);
    }
    if (entry.recommended) {
      const badge = document.createElement("p"); badge.className = "priority-label"; badge.textContent = "首推赞助"; content.prepend(badge);
    }
    card.append(button, content);
    fragment.append(card);
  }
  masonryObserver?.disconnect();
  cards.replaceChildren(fragment);
  if (masonryObserver) {
    masonryObserver.observe(cards);
    for (const card of cards.children) masonryObserver.observe(card);
    scheduleMasonry();
  }
  const pageCount = Math.ceil(matches.length / pageSize);
  status.textContent = matches.length
    ? `共 ${matches.length} 张 · 第 ${page} / ${pageCount} 页 · 显示第 ${start + 1}–${end} 张`
    : "没有找到符合条件的效果图。";
  renderPagination(page, pageCount);
}

function renderPagination(page, pageCount) {
  pagination.replaceChildren();
  pagination.hidden = pageCount <= 1;
  if (pagination.hidden) return;

  function addButton(label, destination, disabled = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quiet";
    button.textContent = label;
    button.disabled = disabled;
    button.addEventListener("click", () => {
      renderPage(destination);
      status.focus({ preventScroll: true });
      status.scrollIntoView({ block: "start" });
    });
    pagination.append(button);
    return button;
  }

  addButton("上一页", page - 1, page === 1);
  for (let number = 1; number <= pageCount; number++) {
    const button = addButton(String(number), number, number === page);
    button.setAttribute("aria-label", `第 ${number} 页`);
    if (number === page) button.setAttribute("aria-current", "page");
  }
  addButton("下一页", page + 1, page === pageCount);
}

function applyFilters() {
  const terms = normalized(search.value).split(/\s+/).filter(Boolean);
  matches = images.filter((entry) =>
    fields.every((field) => !filters[field].value || entry[field] === filters[field].value) &&
    terms.every((term) => entry.searchText.includes(term))
  );
  renderPage(1);
}

async function loadImages() {
  try {
    const response = await fetch("./catalog.json", {cache:"no-cache"});
    if (!response.ok) throw new Error("Catalog unavailable");
    images = await response.json();
    for (const entry of images) {
      const compactSize = entry.size.replace(/[^0-9]/g, "");
      const reversedSize = entry.size.replace(/^(\d+)×(\d+)m$/, "$2×$1m");
      entry.searchText = normalized([entry.filename, entry.company, entry.companyEn || "", describe(entry), entry.variant, compactSize, reversedSize, reversedSize.replace(/[^0-9]/g, "")].join(" "));
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

document.querySelector("#close-preview").addEventListener("click", () => preview.close());
preview.addEventListener("close", () => previewImage.removeAttribute("src"));
loadImages();
