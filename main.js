import { Simulation } from "./simulation.js";

/* ---------- DOM refs ---------- */
const arena        = document.getElementById("arena");
const log          = document.getElementById("log");
const btnReset     = document.getElementById("btn-reset");
const btnRun       = document.getElementById("btn-run");
const btnStep      = document.getElementById("btn-step");
const btnPause     = document.getElementById("btn-pause");
const speedInput   = document.getElementById("speed");
const countInput   = document.getElementById("count");
const stubInput    = document.getElementById("stubbornness");
const stubVal      = document.getElementById("stubbornness-val");
const statStep     = document.getElementById("stat-step");
const statSwaps    = document.getElementById("stat-swaps");
const statJams     = document.getElementById("stat-jams");
const statReroutes = document.getElementById("stat-reroutes");
const statSorted   = document.getElementById("stat-sorted");

/* ---------- rendering ---------- */

function render(snapshot) {
  const { agents } = snapshot;
  const maxVal = agents.length;

  // Build or reuse bars
  while (arena.children.length < agents.length) {
    const bar = document.createElement("div");
    bar.className = "bar idle";
    const label = document.createElement("span");
    label.className = "label";
    bar.appendChild(label);
    arena.appendChild(bar);
  }
  while (arena.children.length > agents.length) {
    arena.removeChild(arena.lastChild);
  }

  for (let i = 0; i < agents.length; i++) {
    const a = agents[i];
    const bar = arena.children[i];
    const pct = (a.value / maxVal) * 100;
    bar.style.height = `${pct}%`;
    bar.className = `bar ${a.state}`;
    bar.firstChild.textContent = a.value;
    bar.title = `val=${a.value}  pos=${i}  goal=${a.goal}  state=${a.state}  jams=${a.totalJams}`;
  }

  statStep.textContent     = snapshot.step;
  statSwaps.textContent    = snapshot.swaps;
  statJams.textContent     = snapshot.jams;
  statReroutes.textContent = snapshot.reroutes;
  statSorted.textContent   = snapshot.sorted ? "YES" : "no";
  if (snapshot.sorted) statSorted.style.color = "#10b981";
  else statSorted.style.color = "";
}

const MAX_LOG = 200;
function appendLog(msg, cls) {
  const line = document.createElement("div");
  line.className = cls ? `log-${cls}` : "";
  line.textContent = `[${sim.step}] ${msg}`;
  log.appendChild(line);
  if (log.children.length > MAX_LOG) log.removeChild(log.firstChild);
  log.scrollTop = log.scrollHeight;
}

/* ---------- simulation ---------- */

let sim = createSim();

function createSim() {
  return new Simulation({
    count: parseInt(countInput.value, 10),
    stubbornness: parseInt(stubInput.value, 10) / 100,
    onTick: render,
    onLog: appendLog,
  });
}

/* ---------- controls ---------- */

btnReset.addEventListener("click", () => {
  sim.stop();
  log.innerHTML = "";
  sim = createSim();
});

btnRun.addEventListener("click", () => sim.run());
btnStep.addEventListener("click", () => sim.stepOnce());
btnPause.addEventListener("click", () => sim.stop());

speedInput.addEventListener("input", () => {
  sim.speed = parseInt(speedInput.value, 10);
});

stubInput.addEventListener("input", () => {
  const v = parseInt(stubInput.value, 10);
  stubVal.textContent = `${v}%`;
  sim.stubbornness = v / 100;
  sim.agents.forEach(a => (a.stubbornness = v / 100));
});
