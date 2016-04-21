---
layout: post
title:  "Van der Pol equation in JavaScript"
date:   2016-04-20 22:35:00
categories: math odex js
using: katex
---

Part 4 in a series of numerically integrating differential
equations in the browser with [odex][odex].

<div id='graph'></div>
<div id='phase'></div>

<script src="/public/js/odex-demo.bundle.js"></script>
<script>
  new odexdemo.VanDerPol('graph', 'phase').draw();
</script>

[odex]: https://www.npmjs.com/package/
[lv]: https://en.wikipedia.org/wiki/Lotka%E2%80%93Volterra_equations
