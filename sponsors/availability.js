"use strict";
(() => {
  const list = document.getElementById("availability-list");
  const status = document.getElementById("availability-status");
  const input = document.getElementById("availability-search");
  const buttons = [...document.querySelectorAll("[data-availability]")];
  let items = [], mode = "recommended";
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
      header.append(title, quantity); card.append(header);
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
