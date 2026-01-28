/**
 * Agent — a single array element with autonomy.
 *
 * Each agent knows its *value* and its *goal* (the index it needs to
 * reach for the array to be sorted).  On every tick it perceives its
 * local neighborhood and decides what to do:
 *
 *  - MOVE   : request a swap toward the goal.
 *  - WAIT   : do nothing this tick (cooling off after a jam).
 *  - PUSH   : force a swap even when the neighbor is reluctant —
 *             a "reroute" strategy tried after repeated jams.
 *  - YIELD  : voluntarily move away from goal to unblock a neighbor.
 *
 * Jams happen when two agents both refuse to swap because each thinks
 * it would move further from its own goal.  After enough consecutive
 * jams an agent switches strategy (reroute).
 */

export const State = Object.freeze({
  IDLE:       "idle",
  MOVING:     "moving",
  JAMMED:     "jammed",
  REROUTING:  "rerouting",
  SATISFIED:  "satisfied",
});

let _id = 0;

export class Agent {
  constructor(value) {
    this.id = _id++;
    this.value = value;

    // assigned later once the sorted order is known
    this.goalIndex = null;

    // current position in the array — updated externally
    this.pos = null;

    this.state = State.IDLE;

    // --- internal cognitive state ---
    this.energy     = 100;           // motivation / fatigue
    this.patience   = 3;             // jams before rerouting
    this.jamCount   = 0;             // consecutive jams
    this.totalJams  = 0;
    this.totalSwaps = 0;
    this.waitTicks  = 0;             // remaining ticks to wait
    this.stubbornness = 0.3;         // 0‑1, chance of refusing a swap request

    // memory: recent interactions
    this.memory = [];                // last N events
  }

  /* ---------- public api ---------- */

  get atGoal() {
    return this.pos === this.goalIndex;
  }

  get distanceToGoal() {
    return this.goalIndex - this.pos; // negative ⇒ need to go left
  }

  /**
   * Called every simulation tick.
   * Returns an *intent* object: { action, direction }
   *   direction: -1 (swap left), +1 (swap right), 0 (stay)
   */
  decide(leftNeighbor, rightNeighbor) {
    // Already home?
    if (this.atGoal) {
      this.state = State.SATISFIED;
      return { action: "stay", direction: 0 };
    }

    // Cooling off after a jam?
    if (this.waitTicks > 0) {
      this.waitTicks--;
      this.state = State.JAMMED;
      return { action: "wait", direction: 0 };
    }

    const dist = this.distanceToGoal;
    const wantDir = dist > 0 ? 1 : -1;            // direction toward goal
    const neighbor = wantDir === -1 ? leftNeighbor : rightNeighbor;

    // No neighbor on that side (edge of array) — try the other side as yield
    if (!neighbor) {
      // Can't move toward goal — sit tight
      this.state = State.IDLE;
      return { action: "stay", direction: 0 };
    }

    // Rerouting mode: after repeated jams, volunteer to move the *wrong*
    // way to shake things loose (Levin‑style: sacrifice local goal for
    // global resolution).
    if (this.jamCount >= this.patience) {
      this.jamCount = 0;
      this.state = State.REROUTING;
      const yieldDir = -wantDir;
      return { action: "push", direction: yieldDir };
    }

    this.state = State.MOVING;
    return { action: "move", direction: wantDir };
  }

  /**
   * Called by the simulation when a requested swap is refused by the
   * neighbor (they were stubborn).
   */
  notifyJam() {
    this.jamCount++;
    this.totalJams++;
    this.waitTicks = Math.min(this.jamCount, 3); // back-off
    this.state = State.JAMMED;
    this._remember("jam");
  }

  /**
   * Called when a swap actually happens.
   */
  notifySwap(newPos) {
    this.pos = newPos;
    this.totalSwaps++;
    this.jamCount = Math.max(0, this.jamCount - 1);
    this._remember("swap");
  }

  /**
   * Decide whether to *accept* a swap request from a neighbor.
   * Returns true (accept) or false (refuse).
   *
   * An agent refuses when the swap would push it further from its goal
   * AND a random roll beats its stubbornness threshold.  Even stubborn
   * agents occasionally yield — without this, deadlocks are permanent.
   */
  considerSwap(requesterDir) {
    // Where would we end up?
    const hypotheticalPos = this.pos + requesterDir;
    const currentDist = Math.abs(this.distanceToGoal);
    const newDist = Math.abs(this.goalIndex - hypotheticalPos);

    // If swap helps us too, always accept.
    if (newDist < currentDist) return true;

    // If neutral, lean toward accepting.
    if (newDist === currentDist) return Math.random() > 0.3;

    // Swap hurts us — refuse with probability = stubbornness.
    return Math.random() > this.stubbornness;
  }

  /* ---------- internals ---------- */

  _remember(event) {
    this.memory.push(event);
    if (this.memory.length > 12) this.memory.shift();
  }

  toJSON() {
    return {
      id: this.id,
      value: this.value,
      pos: this.pos,
      goal: this.goalIndex,
      state: this.state,
      jams: this.totalJams,
      swaps: this.totalSwaps,
    };
  }
}
