const chartSpecs = [
  ["chart-01", "01-national-activity-ranking"],
  ["chart-02", "02-bushwalking-choropleth"],
  ["chart-03", "03-cycling-tourism-symbol-map"],
  ["chart-04", "04-tile-cartogram"],
  ["chart-05", "05-activity-state-heatmap"],
  ["chart-06", "06-activity-range-dumbbell"],
  ["chart-07", "07-activity-state-bump"],
  ["chart-08", "08-cycling-spend-treemap"],
  ["chart-09", "09-state-parallel-coordinates"],
  ["chart-11", "11-age-profile"],
  ["chart-12", "12-domestic-tourism-quarterly"],
  ["chart-13", "13-participation-tourism-scatter"],
  ["annual-change", "14-domestic-tourism-annual-change"],
];
const embedOptions = {
  actions: false,
  renderer: "svg",
  tooltip: { theme: "dark" },
};
async function renderChart(elementId, specName) {
  const response = await fetch(`specs/${specName}.json`);
  if (!response.ok) throw new Error(`Could not load ${specName}`);
  const spec = await response.json();
  await vegaEmbed(`#${elementId}`, spec, embedOptions);
}
async function loadData(path) {
  const r = await fetch(path);
  if (!r.ok) throw new Error(path);
  return r.json();
}
function pct(v) {
  return `${Number(v).toFixed(1)}%`;
}

async function renderSankey() {
  const host = document.getElementById("chart-10");
  const source = await loadData("data/purpose-destination-trips.json");
  const flows = source.flows;
  const purposes = ["Holiday / leisure", "Visiting friends & relatives", "Business", "Other / not asked"];
  const destinations = ["New South Wales", "Victoria", "Queensland", "South Australia", "Western Australia", "Tasmania", "Northern Territory", "Australian Capital Territory"];
  const colors = {
    "Holiday / leisure": "#E38B52",
    "Visiting friends & relatives": "#2B9C8C",
    "Business": "#477DA8",
    "Other / not asked": "#A58AB8"
  };
  // Flow totals are stored as absolute trip estimates; use the same unit for ribbons and labels.
  const fmt = v => {
    const trips = Number(v);
    if (trips >= 1_000_000) return `${(trips / 1_000_000).toFixed(2).replace(/0$/, "").replace(/\.$/, "")}M`;
    if (trips >= 1_000) return `${(trips / 1_000).toFixed(0)}K`;
    return Math.round(trips).toLocaleString();
  };
  const draw = () => {
    const width = Math.max(760, Math.min(host.clientWidth || 1000, 1180));
    const height = width < 850 ? 610 : 560;
    const margin = { top: 54, right: 205, bottom: 22, left: 205 };
    const plotH = height - margin.top - margin.bottom;
    const nodeW = 12;
    const leftX = margin.left;
    const rightX = width - margin.right;
    const gapL = 17, gapR = 13;
    const leftTotals = purposes.map(p => flows.filter(f => f.purpose === p).reduce((a, f) => a + f.trips, 0));
    const rightTotals = destinations.map(d => flows.filter(f => f.destination === d).reduce((a, f) => a + f.trips, 0));
    const scale = Math.min(
      (plotH - gapL * (purposes.length - 1)) / leftTotals.reduce((a, b) => a + b, 0),
      (plotH - gapR * (destinations.length - 1)) / rightTotals.reduce((a, b) => a + b, 0)
    );
    const leftUsed = leftTotals.reduce((a, b) => a + b, 0) * scale + gapL * (purposes.length - 1);
    const rightUsed = rightTotals.reduce((a, b) => a + b, 0) * scale + gapR * (destinations.length - 1);
    let y = margin.top + (plotH - leftUsed) / 2;
    const leftNodes = {};
    purposes.forEach((p, i) => { const h = leftTotals[i] * scale; leftNodes[p] = { x: leftX, y, h, total: leftTotals[i] }; y += h + gapL; });
    y = margin.top + (plotH - rightUsed) / 2;
    const rightNodes = {};
    destinations.forEach((d, i) => { const h = rightTotals[i] * scale; rightNodes[d] = { x: rightX, y, h, total: rightTotals[i] }; y += h + gapR; });
    const leftOffsets = Object.fromEntries(purposes.map(p => [p, 0]));
    const rightOffsets = Object.fromEntries(destinations.map(d => [d, 0]));
    const paths = [];
    for (const f of flows) {
      const ln = leftNodes[f.purpose], rn = rightNodes[f.destination], h = f.trips * scale;
      const y0 = ln.y + leftOffsets[f.purpose], y1 = rn.y + rightOffsets[f.destination];
      leftOffsets[f.purpose] += h; rightOffsets[f.destination] += h;
      const c1 = leftX + (rightX - leftX) * 0.48, c2 = rightX - (rightX - leftX) * 0.48;
      paths.push(`<path class="sankey-link" data-purpose="${f.purpose}" data-destination="${f.destination}" d="M ${leftX + nodeW} ${y0} C ${c1} ${y0}, ${c2} ${y1}, ${rightX} ${y1} L ${rightX} ${y1 + h} C ${c2} ${y1 + h}, ${c1} ${y0 + h}, ${leftX + nodeW} ${y0 + h} Z" fill="${colors[f.purpose]}" fill-opacity="0.58"><title>${f.purpose} → ${f.destination}\n${fmt(f.trips)} overnight trips</title></path>`);
    }
    const leftRects = purposes.map(p => {
      const n = leftNodes[p], cy = n.y + n.h / 2;
      return `<rect x="${leftX}" y="${n.y}" width="${nodeW}" height="${Math.max(1, n.h)}" rx="2" fill="${colors[p]}"/><text x="${leftX - 12}" y="${cy - 4}" text-anchor="end" class="sankey-label">${p}</text><text x="${leftX - 12}" y="${cy + 12}" text-anchor="end" class="sankey-value">${fmt(n.total)}</text>`;
    }).join('');
    // Labels are laid out in a dedicated column with minimum vertical spacing.
    const labelTop = margin.top + 8, labelBottom = height - margin.bottom - 8;
    const step = (labelBottom - labelTop) / (destinations.length - 1);
    const rightRects = destinations.map((d, i) => {
      const n = rightNodes[d], nodeCy = n.y + n.h / 2;
      const labelY = labelTop + i * step;
      return `<rect x="${rightX}" y="${n.y}" width="${nodeW}" height="${Math.max(1, n.h)}" rx="2" fill="#294653"/><path d="M ${rightX + nodeW} ${nodeCy} L ${rightX + nodeW + 8} ${labelY}" stroke="#C3CDCF" stroke-width="1" fill="none"/><text x="${rightX + nodeW + 13}" y="${labelY - 2}" class="sankey-label">${d}</text><text x="${rightX + nodeW + 13}" y="${labelY + 13}" class="sankey-value">${fmt(n.total)}</text>`;
    }).join('');
    host.innerHTML = `<svg class="sankey-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Sankey diagram showing overnight trips by stopover purpose and destination state, year ending December 2024"><text x="${leftX}" y="24" class="sankey-heading">TRIP PURPOSE</text><text x="${rightX}" y="24" class="sankey-heading">DESTINATION</text>${paths.join('')}${leftRects}${rightRects}</svg><p class="sankey-hint">Hover over a ribbon to highlight its flow and inspect the estimated trip count. Values are estimated overnight trips, rounded for display.</p>`;
    host.querySelectorAll('.sankey-link').forEach(path => {
      path.addEventListener('mouseenter', () => { host.querySelectorAll('.sankey-link').forEach(p => p.classList.add('muted')); path.classList.remove('muted'); path.classList.add('active'); });
      path.addEventListener('mouseleave', () => { host.querySelectorAll('.sankey-link').forEach(p => p.classList.remove('muted', 'active')); });
    });
  };
  draw();
  if (window.ResizeObserver) { const ro = new ResizeObserver(() => draw()); ro.observe(host); }
}
async function initMetrics() {
  const rows = await loadData("data/national-activity.json");
  const val = (name) =>
    rows.find((d) => d.activity === name)?.participation_rate_pct;
  document.querySelector("#metric-bush").textContent = pct(val("Bushwalking"));
  document.querySelector("#metric-cycle").textContent = pct(val("Cycling"));
  document.querySelector("#metric-kayak").textContent = pct(
    val("Canoeing / kayaking"),
  );
}
(async () => {
  try {
    await initMetrics();
    const results = await Promise.allSettled([
      ...chartSpecs.map(([id, name]) => renderChart(id, name)),
      renderSankey(),
    ]);
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        const el = document.getElementById(chartSpecs[i]?.[0] || "chart-10");
        if (el)
          el.innerHTML =
            '<p class="chart-error">This chart could not load. Check that the site is being served over HTTP and the data files are present.</p>';
        console.error(r.reason);
      }
    });
  } catch (err) {
    console.error(err);
  }
})();
