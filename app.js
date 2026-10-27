const chartSpecs = [
  ["chart-01", "01-national-activity-ranking"],
  ["chart-02", "02-bushwalking-choropleth"],
  ["chart-03", "03-cycling-tourism-symbol-map"],
  ["chart-04", "04-tile-cartogram"],
  ["chart-05", "05-activity-state-butterfly"],
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
  const fmt = v => v >= 1e6 ? `${(v/1e6).toPrecision(3)}M` : `${Math.round(v/1e3)}k`;
  const draw = () => {
    const width = Math.max(760, Math.min(host.clientWidth || 900, 1120));
    const height = Math.max(540, Math.min(640, width * 0.52 + 40));
    // Wide side margins keep each name and its value beside the narrower ribbon area.
    const margin = {top: 72, right: Math.max(250, Math.round(width * 0.26)), bottom: 30, left: Math.max(215, Math.round(width * 0.24))};
    const plotH = height - margin.top - margin.bottom;
    const nodeW = 13;
    const leftX = margin.left;
    const rightX = width - margin.right;
    const gapL = 18, gapR = 10;
    const leftTotals = purposes.map(p => flows.filter(f=>f.purpose===p).reduce((a,f)=>a+f.trips,0));
    const rightTotals = destinations.map(d => flows.filter(f=>f.destination===d).reduce((a,f)=>a+f.trips,0));
    const total = Math.max(...leftTotals, ...rightTotals);
    const scale = Math.min((plotH - gapL*(purposes.length-1))/leftTotals.reduce((a,b)=>a+b,0), (plotH-gapR*(destinations.length-1))/rightTotals.reduce((a,b)=>a+b,0));
    const leftUsed = leftTotals.reduce((a,b)=>a+b,0)*scale + gapL*(purposes.length-1);
    const rightUsed = rightTotals.reduce((a,b)=>a+b,0)*scale + gapR*(destinations.length-1);
    let y = margin.top + (plotH-leftUsed)/2;
    const leftNodes = {};
    purposes.forEach((p,i)=>{const h=leftTotals[i]*scale; leftNodes[p]={x:leftX,y,h,total:leftTotals[i]}; y+=h+gapL;});
    y = margin.top + (plotH-rightUsed)/2;
    const rightNodes = {};
    destinations.forEach((d,i)=>{const h=rightTotals[i]*scale; rightNodes[d]={x:rightX,y,h,total:rightTotals[i]}; y+=h+gapR;});
    const leftOffsets = Object.fromEntries(purposes.map(p=>[p,0]));
    const rightOffsets = Object.fromEntries(destinations.map(d=>[d,0]));
    const paths=[];
    for (const f of flows) {
      const ln=leftNodes[f.purpose], rn=rightNodes[f.destination], h=f.trips*scale;
      const y0=ln.y+leftOffsets[f.purpose], y1=rn.y+rightOffsets[f.destination];
      leftOffsets[f.purpose]+=h; rightOffsets[f.destination]+=h;
      const c1=leftX+(rightX-leftX)*0.48, c2=rightX-(rightX-leftX)*0.48;
      paths.push(`<path class="sankey-link" data-purpose="${f.purpose}" data-destination="${f.destination}" d="M ${leftX+nodeW} ${y0} C ${c1} ${y0}, ${c2} ${y1}, ${rightX} ${y1} L ${rightX} ${y1+h} C ${c2} ${y1+h}, ${c1} ${y0+h}, ${leftX+nodeW} ${y0+h} Z" fill="${colors[f.purpose]}" fill-opacity="0.58"><title>${f.purpose} → ${f.destination}\n${f.trips_thousands.toLocaleString(undefined,{maximumFractionDigits:3})} thousand overnight trips</title></path>`);
    }
    // Single-line labels are ~16px tall; nudge label centres apart so small nodes (e.g. TAS / NT / ACT) don't collide.
    const spreadLabels = (names, nodes) => {
      const minGap = 19, lo = margin.top + 6, hi = height - margin.bottom - 6;
      const pos = names.map(k => nodes[k].y + nodes[k].h / 2);
      pos[0] = Math.max(pos[0], lo);
      for (let i = 1; i < pos.length; i++) pos[i] = Math.max(pos[i], pos[i-1] + minGap);
      pos[pos.length-1] = Math.min(pos[pos.length-1], hi);
      for (let i = pos.length - 2; i >= 0; i--) pos[i] = Math.min(pos[i], pos[i+1] - minGap);
      return Object.fromEntries(names.map((k, i) => [k, pos[i]]));
    };
    const leftLabelY = spreadLabels(purposes, leftNodes);
    const rightLabelY = spreadLabels(destinations, rightNodes);
    const leader = (x1, y1, x2, y2) => Math.abs(y2 - y1) > 4 ? `<path d="M ${x1} ${y1} L ${x2} ${y2}" stroke="#9aa7ad" stroke-width="1" fill="none"/>` : '';
    const leftRects=purposes.map(p=>{const n=leftNodes[p];const ly=leftLabelY[p];return `<rect x="${leftX}" y="${n.y}" width="${nodeW}" height="${Math.max(1,n.h)}" rx="2" fill="${colors[p]}"/>${leader(leftX-1,n.y+n.h/2,leftX-9,ly)}<text x="0" y="${ly+4}" class="sankey-label">${p}</text><text x="${leftX-12}" y="${ly+4}" text-anchor="end" class="sankey-value">${fmt(n.total)}</text>`;}).join('');
    const rightRects=destinations.map(d=>{const n=rightNodes[d];const ly=rightLabelY[d];return `<rect x="${rightX}" y="${n.y}" width="${nodeW}" height="${Math.max(1,n.h)}" rx="2" fill="#294653"/>${leader(rightX+nodeW+1,n.y+n.h/2,rightX+nodeW+9,ly)}<text x="${rightX+nodeW+12}" y="${ly+4}" class="sankey-label">${d}</text><text x="${width}" y="${ly+4}" text-anchor="end" class="sankey-value">${fmt(n.total)}</text>`;}).join('');
    // Legend sits on its own row above the column headings; items are spaced by label length and kept inside the SVG.
    const legW = purposes.map(p => 16 + p.length * 4.3);
    const legGap = 26;
    const legTotal = legW.reduce((a,b)=>a+b,0) + legGap * (purposes.length - 1);
    let legX = 0;
    const legend=purposes.map((p,i)=>{const x=legX;legX+=legW[i]+legGap;return `<g transform="translate(${x},10)"><rect width="10" height="10" rx="2" fill="${colors[p]}"/><text x="16" y="9" class="sankey-legend">${p}</text></g>`;}).join('');
    host.innerHTML=`<svg class="sankey-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Sankey diagram showing overnight trips by stopover purpose and destination state, year ending December 2024"><text x="0" y="${margin.top-14}" class="sankey-heading">TRIP PURPOSE</text><text x="${rightX+nodeW+12}" y="${margin.top-14}" class="sankey-heading">DESTINATION</text>${legend}${paths.join('')}${leftRects}${rightRects}</svg><p class="sankey-hint">Hover over a ribbon to highlight its flow and inspect the estimated trip count.</p>`;
    host.querySelectorAll('.sankey-link').forEach(path=>{
      path.addEventListener('mouseenter',()=>{host.querySelectorAll('.sankey-link').forEach(p=>p.classList.add('muted'));path.classList.remove('muted');path.classList.add('active');});
      path.addEventListener('mouseleave',()=>{host.querySelectorAll('.sankey-link').forEach(p=>p.classList.remove('muted','active'));});
    });
  };
  draw();
  if (window.ResizeObserver) { const ro = new ResizeObserver(()=>draw()); ro.observe(host); }
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
