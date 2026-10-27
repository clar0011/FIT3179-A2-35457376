# Source-data verification log

Verification date: 27 October 2026. This project uses the uploaded AusPlay January–December 2025 workbooks (released 30 April 2026), Tourism Research Australia (TRA) June-quarter 2026 domestic tourism workbook, and TRA *Cycle Tourism in Australia* report.

## Rechecked and corrected
- `state-activity.json`: each of the six activity measures in each of the eight states/territories is taken from the first activity occurrence (adult participation rate) and the later occurrence (estimated participant count) in that state's Table 16. Rates are converted from proportions to percentages; estimates are rounded to whole people.
- `national-activity.json`: national adult participation rates use the first occurrence of each activity in national Table 1.
- `age-profile.json`: age-group rates use the seven age columns (15–17, 18–24, 25–34, 35–44, 45–54, 55–64, 65+) on the first occurrence/participation-rate row in national Table 1. Later participant-estimate rows are not used as percentages.
- State-derived charts/data (`state-bushwalking.json`, `state-cycling-participation.json`, `state-tile-map.json`, `activity-rank-bump.json`, `activity-state-ranges.json`, `state-parallel-coordinates.json`, `participation-tourism-scatter.json`) are recalculated from corrected source values. Parallel-coordinates values and normalized values are now recomputed consistently.
- `domestic-tourism-quarterly.json`: values match Table 10b, converting trips and visitor nights from thousands to millions, and expenditure from $M to $B. These are total domestic trips/nights/expenditure (not overnight-only measures). Source rows are total trips row 8, visitor nights row 12, expenditure row 16.
- `domestic-tourism-annual.json`: state/territory totals and year-on-year changes match Table 9c. Trip and night figures in the table are in thousands and are converted to millions; expenditure is in $M. State visits can overlap because a trip can visit more than one state, as TRA notes.
- `expenditure-mosaic.json`: 19 expenditure categories across five quarters were taken from Table 12a rows 6–24; category shares and within-quarter coordinates were recalculated. The category sum may not exactly equal TRA's total due to rounding and the source's note about trips with 21 or more stops.
- `expenditure-categories.json`: category amounts match Table 12a for June quarter 2026.
- `cycling-tourism-state.json` and dependent charts use state-level cycling-tourism figures displayed in the TRA report. The report's state graphic rounds figures (for example, trips/nights to thousands or rounded millions and expenditure to whole millions/billions); the project must not present those as more precise than the publication.

## Limits that remain
- The TRA cycling report's state map presents rounded labels. These numbers are verified to the published graphic, not to unpublished unrounded microdata. QLD nights are retained as 8.8 million as displayed in the report.
- AusPlay estimates for small jurisdictions/rare activities can be zero or unstable due to sampling. A zero is the published estimate, not proof that no one participates.
- The GeoJSON state boundaries were preserved from the supplied project and not independently reconciled against the original Geoscape download.
- The treemap chart's geometry/layout is retained to avoid changing the visual design; a treemap is not inherently justified by the state comparison data. This is a chart-design issue, not a numerical-source issue.
- The quarterly domestic tourism chart intentionally shows total domestic trips and total visitor nights together. They are different measures and the chart labels/description should retain that distinction.


## Visualisation idiom changes (27 October 2026)
- Chart 01 changed from a ranked bar chart to a lollipop chart, using the same national AusPlay participation-rate data.
- Chart 08 changed from a treemap to a waffle chart because state expenditure is a flat list, not a parent-child hierarchy. The 100 squares approximate each state/territory's share of the sum of the listed reported expenditure values; source amounts are unchanged.
- Chart 14 changed from a one-period bar chart to a slope chart comparing the same domestic-trip measure for YE June 2025 and YE June 2026 by state/territory. This is general domestic tourism context, not adventure-specific data.
- The resulting distinct advanced idioms include three different map idioms (choropleth, proportional-symbol map, tile cartogram), heatmap, connected-dot plot, bump chart, lollipop chart, waffle chart, parallel coordinates, mosaic plot, and slope chart. The final count remains subject to instructor judgement of appropriateness and execution.


## Waffle chart correction
Chart 8 now uses a 10×10 waffle: 100 tiles represent 100% of the combined reported cycling-inclusive tourism expenditure across the listed states and territories. Tile allocation uses largest-remainder rounding, so the displayed whole-tile shares sum to 100. State/territory maps were restored from the earlier polished-layout version.


## Chart idiom update (27 October 2026)
- Chart 8 replaces the waffle with a ranked lollipop using the existing TRA state-level cycling-inclusive expenditure figures. Reported values remain rounded as published.
- Chart 10 replaces the crowded five-quarter mosaic with a sunburst-style nested radial chart for the latest available quarter (June Qtr 2026). Outer segments retain the original TRA categories. Inner-ring groupings are transparent analytical groupings created for readability, not an official TRA hierarchy.
- The expenditure source describes general domestic overnight-trip expenditure, not adventure-tourism-specific spending.


## Sankey diagram added (27 October 2026)
- Source: Tourism Research Australia, *National Visitor Survey Results*, workbook updated March 2025, tab `Overnight trips ... by stopover purpose ... by destination state or region`, year ending December 2024.
- The Sankey links stopover purpose (Holiday or leisure; Visiting friends and relatives; Business; Other and not asked) to destination state/territory using reported overnight-trip estimates in thousands.
- State totals are read from the first `Overnight trips ('000)` block on each purpose sheet. ACT is the `ACT` destination row; NT under `Other and Not Asked` is `np` (not published) and is omitted rather than replaced with zero.
- This is purpose-to-destination, not traveller home-state-to-destination. It is a different relationship from the reference Sankey.


## Layout correction (2026-10-27)
- Compact responsive Sankey layout with destination labels placed in a dedicated evenly-spaced label column to prevent overlap.
- Corrected trip-value formatting to display estimated counts in K/M units.
- Reduced map chart heights for the choropleth, proportional-symbol map, and tile cartogram; source values and geometries unchanged.
