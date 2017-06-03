---
layout: post
title:  "Lotka-Volterra equations in JavaScript"
date:   2016-04-03 21:15:00
categories: math odex js
using: katex
---

Part 3 in a series of numerically integrating differential
equations in the browser with [odex][odex].
Here we have the [Lotka-Volterra][lv],
or "predator prey", equations. Move the mouse over the graph
to change the initial conditions. The top graph is the
predator/prey state against time; the bottom graph is the
phase portrait of the system.

<div id='graph'></div>
<div id='phase'></div>

<script src="/public/js/odex-demo.bundle.min.js"></script>
<script>
  new odexdemo.PredatorPrey('graph', 'phase').draw();
</script>

[odex]: https://www.npmjs.com/package/odex
[lv]: https://en.wikipedia.org/wiki/Lotka%E2%80%93Volterra_equations
