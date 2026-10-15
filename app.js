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
  ["chart-10", "10-expenditure-mosaic"],
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
    const results = await Promise.allSettled(
      chartSpecs.map(([id, name]) => renderChart(id, name)),
    );
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        const el = document.getElementById(chartSpecs[i][0]);
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
