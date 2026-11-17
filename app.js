"use strict";

const regions = [
  ["Africa", 7.09, "#03295f"],
  ["Europe", 18.03, "#073678"],
  ["South America", 5.52, "#004ea2"],
  ["Middle East", 22.61, "#1b60ac"],
  ["North America", 4.73, "#2e72bd"],
  ["South Asia", 16.94, "#4887cd"],
  ["Southeast Asia", 11.41, "#6ca3e1"],
  ["Central Asia", 0.44, "#89b7ed"],
  ["East Asia", 11.78, "#aecff6"],
  ["Oceania", 1.45, "#c5e0fb"],
];
const metrics = [
  ["Countries", "170+", 172],
  ["Global Members", "7,500+", 226],
  ["International Ports", "706+", 247],
  ["Successful Conferences", "14", 334],
];

const byId = (id) => document.getElementById(id);
const form = byId("settings");
const preview = byId("poster");
const download = byId("download");
const exportStatus = byId("export-status");
const logo = new Image();
const blue = "#004ea2";
const paper = "#ebf5ff";
let ready = false;
let exporting = false;
let frame;

const regionInputs = regions.map(([name, value, color]) => {
  const label = document.createElement("label");
  label.className = "region";
  const swatch = document.createElement("span");
  swatch.className = "swatch";
  swatch.style.backgroundColor = color;
  swatch.setAttribute("aria-hidden", "true");
  const percent = document.createElement("span");
  percent.className = "percent";
  const input = document.createElement("input");
  Object.assign(input, { type: "number", min: "0", max: "100", step: ".01", required: true, defaultValue: value.toFixed(2) });
  input.setAttribute("aria-label", name + " 占比（%）");
  percent.append(input, "%");
  label.append(swatch, name, percent);
  byId("regions").append(label);
  return input;
});

const metricInputs = metrics.map(([name, value]) => {
  const label = document.createElement("label");
  label.className = "metric";
  const input = document.createElement("input");
  Object.assign(input, { type: "text", maxLength: 14, defaultValue: value });
  label.append(name, input);
  byId("metrics").append(label);
  return input;
});

function readSettings() {
  const values = regionInputs.map((input) => input.validity.valid ? input.valueAsNumber : 0);
  const sum = values.reduce((total, value) => total + Math.round(value * 100), 0);
  const title = byId("headline").value.trim();
  const figures = metricInputs.map((input) => input.value.trim());
  let error = "";
  if (regionInputs.some((input) => !input.validity.valid)) {
    error = "每个地区请输入 0–100 之间的数值，最多两位小数。";
  } else if (sum !== 10000) {
    error = "请将地区占比合计调整为 100.00% 后下载。";
  } else if (!title || figures.some((value) => !value)) {
    error = "请填写海报标题和全部底部指标。";
  }
  return { values, sum, title, figures, error };
}

function drawPoster(canvas, data) {
  const ctx = canvas.getContext("2d");
  const scale = canvas.width / 1080;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, 1080, 1080);
  ctx.fillStyle = blue;
  ctx.fillRect(0, 0, 1080, 173);

  function text(value, x, y, size, color, { weight = 400, align = "left", width = 1000 } = {}) {
    ctx.fillStyle = color;
    ctx.textAlign = align;
    const font = (pixels) => weight + " " + pixels + "px Harmony, sans-serif";
    ctx.font = font(size);
    const measured = ctx.measureText(value).width;
    if (measured > width) ctx.font = font(size * width / measured);
    ctx.fillText(value, x, y);
    return ctx.measureText(value).width;
  }

  function line(points, color, width) {
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for (const point of points.slice(1)) ctx.lineTo(...point);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  ctx.drawImage(logo, 50, 45, 237, 237 * logo.naturalHeight / logo.naturalWidth);
  const right = { align: "right", weight: 700 };
  text("TO CREATE A BETTER WORLD", 1030, 73, 20, "white", right);
  text("FOR GLOBAL LOGISTICS", 1030, 96, 20, "white", right);
  text("www.glafamily.com", 1030, 123, 18, "white", { align: "right" });

  const titleWidth = text(data.title, 540, 261, 50, blue, { weight: 700, align: "center", width: 744 });
  const titleEdge = titleWidth / 2 + 22;
  line([[72, 244], [540 - titleEdge, 244]], blue, 2.5);
  line([[540 + titleEdge, 244], [1008, 244]], blue, 2.5);

  const cx = 540;
  const cy = 599;
  const outer = 231;
  const inner = 134;
  const point = (angle, radius) => [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
  const labels = [];
  let start = -Math.PI / 2;

  data.values.forEach((value, index) => {
    if (value === 0) return;
    const [name, , color] = regions[index];
    const span = value / (data.sum / 100) * 2 * Math.PI;
    const end = start + span;
    const mid = (start + end) / 2;
    const corner = Math.min(7, span * inner * .17);
    const gap = Math.min(1.5, span * inner * .08);
    const outerPad = (corner + gap) / (outer - corner);
    const innerPad = (corner + gap) / (inner + corner);
    ctx.beginPath();
    ctx.arc(cx, cy, outer - corner, start + outerPad, end - outerPad);
    ctx.arc(cx, cy, inner + corner, end - innerPad, start + innerPad, true);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineJoin = "round";
    ctx.lineWidth = corner * 2;
    ctx.fill();
    ctx.stroke();
    labels.push({
      name, value, side: Math.cos(mid) >= 0 ? 1 : -1,
      anchor: point(mid, outer + 3),
      elbow: point(mid, outer + 32),
    });
    start = end;
  });

  for (const side of [-1, 1]) {
    const column = labels.filter((label) => label.side === side).sort((a, b) => a.elbow[1] - b.elbow[1]);
    let y = 327;
    for (const label of column) {
      label.y = Math.max(y, label.elbow[1]);
      y = label.y + 54;
    }
    y = 858;
    for (const label of [...column].reverse()) {
      label.y = Math.min(y, label.y);
      y = label.y - 54;
    }
    for (const { name, value, anchor, elbow, y: labelY } of column) {
      const align = side < 0 ? "right" : "left";
      ctx.font = "700 20px Harmony, sans-serif";
      const labelWidth = Math.max(ctx.measureText(name).width, 90);
      const edge = side < 0 ? 39 + labelWidth : 1041 - labelWidth;
      const textX = side < 0 ? Math.max(edge, elbow[0] - 94) : Math.min(edge, elbow[0] + 94);
      const endX = textX - side * 6;
      const bendX = side < 0 ? Math.max(endX, elbow[0]) : Math.min(endX, elbow[0]);
      line([anchor, [bendX, labelY], [endX, labelY]], "#498cda", 1.8);
      text(value.toFixed(2) + "%", textX, labelY - 3, 27, blue, { weight: 700, align });
      text(name, textX, labelY + 24, 20, "#28364a", { weight: 700, align });
    }
  }

  ctx.strokeStyle = blue;
  ctx.lineWidth = 1;
  ctx.strokeRect(50.5, 944.5, 979, 85);
  let left = 50;
  metrics.forEach(([label, , width], index) => {
    if (index > 0) line([[left, 954], [left, 1020]], blue, 1);
    const center = left + width / 2;
    text(data.figures[index], center, 980, 28, blue, { weight: 700, align: "center", width: width - 24 });
    text(label, center, 1013, 25, blue, { align: "center", width: width - 24 });
    left += width;
  });
}

function refresh() {
  const data = readSettings();
  byId("total").value = (data.sum / 100).toFixed(2) + "%";
  byId("validation").textContent = data.error;
  download.disabled = !ready || exporting || Boolean(data.error);
  if (ready) drawPoster(preview, data);
}

function queueRefresh() {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(refresh);
}

form.addEventListener("input", () => {
  if (ready && !exporting) exportStatus.textContent = "";
  queueRefresh();
});
form.addEventListener("submit", (event) => event.preventDefault());
form.addEventListener("reset", () => {
  if (ready && !exporting) exportStatus.textContent = "";
  queueRefresh();
});

download.addEventListener("click", async () => {
  const data = readSettings();
  if (!ready || exporting || data.error) return;
  exporting = true;
  download.disabled = true;
  exportStatus.textContent = "正在生成 PNG…";

  try {
    const size = Number(byId("size").value);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    drawPoster(canvas, data);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("PNG encoding failed");
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "GLA-Members-Distribution-" + size + "px.png";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    exportStatus.textContent = "已生成 " + size + " × " + size + " px PNG。";
  } catch {
    exportStatus.textContent = "导出失败，请重试。";
  } finally {
    exporting = false;
    refresh();
  }
});

logo.src = "./assets/gla-white.svg";
Promise.all([logo.decode(), document.fonts.load("400 24px Harmony"), document.fonts.load("700 24px Harmony")])
  .then(() => {
    ready = true;
    refresh();
    exportStatus.textContent = "";
  })
  .catch(() => {
    ready = false;
    download.disabled = true;
    exportStatus.textContent = "海报素材加载失败，请刷新页面重试。";
  });
