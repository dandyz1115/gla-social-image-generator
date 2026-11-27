"use strict";
(() => {
  const list = document.getElementById("availability-list");
  const status = document.getElementById("availability-status");
  const input = document.getElementById("availability-search");
  const buttons = [...document.querySelectorAll("[data-availability]")];
  let items = [], mode = "all";
  function render() {
    const query = input.value.trim().toLocaleLowerCase();
    const shown = items.filter(item => (mode === "all" || item.recommended) && [item.name, item.note].join(" ").toLocaleLowerCase().includes(query));
    list.replaceChildren();
    for (const item of shown) {
      const card = document.createElement("article");
      card.className = "availability-item";
      const header = document.createElement("header");
      const title = document.createElement("h3"); title.textContent = item.name;
      const quantity = document.createElement("span"); quantity.className = "quantity"; quantity.textContent = "× " + item.quantity;
      const posterLink = document.createElement("a");
      posterLink.href = item.poster; posterLink.target = "_blank"; posterLink.rel = "noopener";
      posterLink.className = "availability-poster";
      posterLink.setAttribute("aria-label", "查看" + item.name + "的统一海报示例");
      const poster = document.createElement("img"); poster.src = item.thumbnail; poster.alt = "暂用万能转换头赞助海报，后续替换"; poster.loading = "lazy"; poster.decoding = "async";
      posterLink.append(poster); card.append(posterLink);
      header.append(title, quantity); card.append(header);
      const sample = document.createElement("p"); sample.className = "placeholder-label"; sample.textContent = "统一海报示例 · 待替换"; card.append(sample);
      if (item.note) { const note = document.createElement("p"); note.textContent = item.note; card.append(note); }
      if (item.recommended) { const tag = document.createElement("p"); tag.className = "recommended"; tag.textContent = "首推赞助"; card.append(tag); }
      list.append(card);
    }
    status.textContent = shown.length ? "共 " + shown.length + " 项" : "没有匹配的赞助项目，请更换关键词。";
  }
  buttons.forEach(button => button.addEventListener("click", () => {
    mode = button.dataset.availability;
    buttons.forEach(other => { const active = other === button; other.classList.toggle("active", active); other.setAttribute("aria-pressed", String(active)); }); render();
  }));
  input.addEventListener("input", render);
  fetch("./availability.json", {cache: "no-cache"}).then(response => {if (!response.ok) throw new Error("加载失败"); return response.json();})
    .then(data => {items = data.items; render();}).catch(() => {status.textContent = "赞助清单暂时加载失败，请刷新页面重试。";});
})();
