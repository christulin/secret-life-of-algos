/**
 * Simulation — the "physics" layer.
 *
 * Owns the array of Agents and runs the tick loop.  Each tick:
 *
 *  1. Every agent *decides* what it wants to do (in random order so no
 *     agent has a permanent positional advantage — fairer ecology).
 *  2. The simulation resolves all intents: attempts swaps, handles
 *     refusals (jams), and records reroutes.
 *  3. Stats are updated and a render callback is fired.
 */

import { Agent, State } from "./agent.js";

export class Simulation {
  constructor({ count = 20, stubbornness = 0.3, onTick, onLog }) {
    this.count = count;
    this.stubbornness = stubbornness;
    this.onTick = onTick || (() => {});
    this.onLog = onLog || (() => {});

    this.agents = [];
    this.step = 0;
    this.swaps = 0;
    this.jams = 0;
    this.reroutes = 0;
    this.running = false;
    this._timer = null;
    this.speed = 50;          // ticks per second (adjustable)

    this.reset();
  }

  /* ---------- lifecycle ---------- */

  reset() {
    this.stop();
    this.step = 0;
    this.swaps = 0;
    this.jams = 0;
    this.reroutes = 0;

    // Build a shuffled array of unique values 1..count
    const values = Array.from({ length: this.count }, (_, i) => i + 1);
    shuffle(values);

    // Sorted order tells each agent its goal index
    const sorted = [...values].sort((a, b) => a - b);

    this.agents = values.map((v, i) => {
      const a = new Agent(v);
      a.pos = i;
      a.goalIndex = sorted.indexOf(v);
      a.stubbornness = this.stubbornness;
      return a;
    });

    this.onTick(this.snapshot());
  }

  run() {
    if (this.running) return;
    this.running = true;
    this._schedule();
  }

  stop() {
    this.running = false;
    clearTimeout(this._timer);
  }

  stepOnce() {
    this._tick();
  }

  /* ---------- core tick ---------- */

  _tick() {
    if (this.isSorted()) {
      this.stop();
      this.agents.forEach(a => (a.state = State.SATISFIED));
      this.onTick(this.snapshot());
      this.onLog("All agents reached their goals.", "done");
      return;
    }

    this.step++;

    // Randomize evaluation order each tick
    const order = Array.from({ length: this.agents.length }, (_, i) => i);
    shuffle(order);

    // Collect intents
    const intents = new Array(this.agents.length);
    for (const i of order) {
      const agent = this.agents[i];
      const left = i > 0 ? this.agents[i - 1] : null;
      const right = i < this.agents.length - 1 ? this.agents[i + 1] : null;
      intents[i] = agent.decide(left, right);
    }

    // Resolve — process in random order, skip already-swapped-this-tick
    const swappedThisTick = new Set();

    for (const i of order) {
      if (swappedThisTick.has(i)) continue;

      const agent = this.agents[i];
      const intent = intents[i];
      if (intent.direction === 0) continue;

      const j = i + intent.direction;
      if (j < 0 || j >= this.agents.length) continue;
      if (swappedThisTick.has(j)) continue;

      const neighbor = this.agents[j];

      // "push" (reroute) always forces the swap
      if (intent.action === "push") {
        this._swap(i, j);
        swappedThisTick.add(i).add(j);
        this.reroutes++;
        this.onLog(
          `Agent ${agent.value} rerouted: yielded pos ${i}→${j}`,
          "route"
        );
        continue;
      }

      // Normal move — ask neighbor's permission
      const accepted = neighbor.considerSwap(-intent.direction);
      if (accepted) {
        this._swap(i, j);
        swappedThisTick.add(i).add(j);
      } else {
        agent.notifyJam();
        this.jams++;
        this.onLog(
          `Agent ${agent.value} jammed at pos ${i} (refused by ${neighbor.value})`,
          "jam"
        );
      }
    }

    this.onTick(this.snapshot());

    if (this.running) this._schedule();
  }

  /* ---------- helpers ---------- */

  _swap(i, j) {
    const a = this.agents[i];
    const b = this.agents[j];
    // swap in array
    this.agents[i] = b;
    this.agents[j] = a;
    // notify agents
    a.notifySwap(j);
    b.notifySwap(i);
    this.swaps++;
  }

  _schedule() {
    const ms = Math.max(10, 1000 / this.speed);
    this._timer = setTimeout(() => this._tick(), ms);
  }

  isSorted() {
    return this.agents.every(a => a.atGoal);
  }

  snapshot() {
    return {
      step: this.step,
      swaps: this.swaps,
      jams: this.jams,
      reroutes: this.reroutes,
      sorted: this.isSorted(),
      agents: this.agents.map(a => ({
        id: a.id,
        value: a.value,
        pos: a.pos,
        goal: a.goalIndex,
        state: a.state,
        jamCount: a.jamCount,
        totalJams: a.totalJams,
      })),
    };
  }
}

/* --- util --- */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
