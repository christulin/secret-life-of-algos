# Secret Life of Algorithms

A toy JavaScript simulation where array elements sort *themselves*. There is
no top-down controller — each element is an autonomous agent that can only see
its immediate neighbors, negotiate swaps, get stuck, and reroute. The array
reaches a sorted state (or doesn't) through purely local, emergent
coordination.

## Philosophy

This project is inspired by the work of **Michael Levin** and collaborators
(Taining Zhang, Adam Goldstein) on diverse intelligence and basal cognition.
Their paper — *"Classical Sorting Algorithms as a Model of Morphogenesis:
Self-sorting arrays reveal unexpected competencies in a minimal model of basal
intelligence"* ([arXiv:2401.05375](https://arxiv.org/abs/2401.05375),
published in *Adaptive Behavior*, 2025) — broke two foundational assumptions
of traditional sorting:

1. **No top-down control.** Instead of a program counter marching through
   comparisons, each array element is given minimal agency and implements
   sorting policy from the bottom up.
2. **No reliable hardware.** Elements can refuse swaps, get jammed, and
   exhibit stubbornness — modeling the kind of noisy, failure-prone substrate
   that biological systems operate on every day.

Their findings showed that arrays of autonomous elements sort themselves
**more reliably and robustly** than traditional implementations in the presence
of errors. They observed the ability to *temporarily reduce progress* in order
to navigate around a defect — a hallmark of goal-directed problem-solving at
even the simplest level.

As covered in the Forbes article *"Study Reveals Hidden Agency In Algorithms
With Implications For AI"* by Andréa Morris
([Forbes, November 2025](https://www.forbes.com/sites/andreamorris/2025/11/13/the-secret-life-of-algorithms/)),
this work sits within Levin's broader program of recognizing intelligence and
agency in substrates we don't traditionally consider cognitive — from
bioelectric networks in embryos to sorting algorithms. The question isn't
whether a system has a brain, but whether it has a *goal* and *competency* to
reach that goal despite perturbation.

This toy model distills those ideas into something you can watch in a browser.

## How It Works

Each array element is an **Agent** with:

- **A goal** — the index it needs to reach for the array to be sorted.
- **Local perception** — it can only see its left and right neighbors.
- **Stubbornness** — a probability of refusing a swap that would move it
  further from its goal.
- **Jam detection** — a counter of consecutive refusals.
- **Rerouting** — after repeated jams, the agent *voluntarily moves the wrong
  direction* to break the deadlock. This is the key behavior: local sacrifice
  for global resolution, with no awareness that a "global" even exists.

The simulation runs in discrete ticks. Each tick:

1. Agents are evaluated in **random order** (no positional privilege).
2. Each agent decides: move toward goal, wait (cooling off), or reroute.
3. Swaps require **neighbor consent** — a neighbor that would be hurt by the
   swap may refuse, causing a jam.
4. Reroute "pushes" force through regardless, modeling an agent that has
   learned to try a different strategy.

## How to Run

No build step. Plain ES modules served from any static file server.

```bash
# Option 1: Python
python3 -m http.server 8000

# Option 2: Node (npx)
npx serve .

# Option 3: PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## What to Observe

### Stubbornness and deadlock

Set the **Stubbornness** slider to 0% and hit Run. The array sorts smoothly —
agents always cooperate, so it behaves like a noisy bubble sort. Now crank
stubbornness to 60-80%. Watch what happens:

- **Red bars** (jammed agents) appear in clusters. Agents refuse each other
  and the system stalls locally.
- **Amber bars** (rerouting agents) emerge shortly after — these are agents
  that gave up on their preferred direction and moved *away* from their goal
  to shake things loose.
- The jam and reroute counters in the stats bar climb. The system still
  converges, but through a messier, more interesting path.

### Emergent rerouting

No agent knows the global state of the array. The reroute behavior is
triggered by purely local frustration (too many consecutive jams). Yet the
*effect* is system-level deadlock resolution. This is the core Levin insight:
competent global behavior arising from agents with only local information and
simple rules.

### Path diversity

Click **New Array** several times and run with the same settings. Because
agents are evaluated in random order each tick, the sequence of swaps, jams,
and reroutes differs every time. Same initial disorder, different emergent
trajectory to the same goal. Compare the total jams and reroutes between runs.

### Failure modes

At very high stubbornness (90%+), the system may take dramatically longer or
exhibit long plateaus where nothing productive happens. This mirrors biological
systems under extreme stress — the collective intelligence degrades but
doesn't necessarily vanish.

## Project Structure

```
index.html       — UI shell and controls
style.css        — Dark theme, agent state colors
agent.js         — Agent class: perception, decision, memory
simulation.js    — Tick loop, swap resolution, statistics
main.js          — DOM wiring and rendering
```

## Further Reading

- Zhang, Goldstein & Levin — [*Classical Sorting Algorithms as a Model of Morphogenesis*](https://arxiv.org/abs/2401.05375) (2025)
- Morris, Andréa — [*Study Reveals Hidden Agency In Algorithms With Implications For AI*](https://www.forbes.com/sites/andreamorris/2025/11/13/the-secret-life-of-algorithms/) (Forbes, November 2025)
- Levin Lab — [Publications](https://drmichaellevin.org/publications/)
