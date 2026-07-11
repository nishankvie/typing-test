// home.js - Home page controller: renders Personal Best + Dashboard cards.
import { initTheme } from "./theme.js";
import { getAllHistory } from "./history.js";
import { getPersonalBests, getDashboardSummary, formatDuration } from "./stats.js";
import { initTestLauncher } from "./testLauncher.js";

initTheme();
initTestLauncher({
  languageSelector: "#launcher-language",
  durationSelector: "#launcher-duration",
  passageSelector: "#launcher-passage",
  buttonSelector: "#launcher-start-btn"
});

function statCard(label, value) {
  const div = document.createElement("div");
  div.className = "card stat-card";
  div.innerHTML = `<div class="stat-value">${value}</div><div class="stat-label">${label}</div>`;
  return div;
}

function renderPersonalBest(history) {
  const grid = document.getElementById("personal-best-grid");
  grid.innerHTML = "";
  const pb = getPersonalBests(history);
  grid.append(
    statCard("Best Accuracy", `${pb.bestAccuracy}%`),
    statCard("Best DSSSB Speed", pb.bestDsssbSpeed),
    statCard("Best Delhi Police Speed", pb.bestDelhiPoliceSpeed),
    statCard("Best Stroke Speed", pb.bestStrokeSpeed),
    statCard("Best Space Speed", pb.bestSpaceSpeed),
    statCard("Fastest 5 Min Test", pb.fastest5Min),
    statCard("Fastest 10 Min Test", pb.fastest10Min),
    statCard("Fastest 15 Min Test", pb.fastest15Min)
  );
}

function renderDashboard(history) {
  const grid = document.getElementById("dashboard-grid");
  grid.innerHTML = "";
  const d = getDashboardSummary(history);
  grid.append(
    statCard("Total Tests Completed", d.totalTests),
    statCard("Average Accuracy", `${d.averageAccuracy}%`),
    statCard("Average DSSSB Speed", d.averageDsssbSpeed),
    statCard("Average Stroke Speed", d.averageStrokeSpeed),
    statCard("Average Mistakes", d.averageMistakes),
    statCard("Total Practice Time", formatDuration(d.totalPracticeTimeSeconds)),
    statCard("Total Words Typed", d.totalWordsTyped)
  );
}

function render() {
  const history = getAllHistory();
  renderPersonalBest(history);
  renderDashboard(history);
}

render();
