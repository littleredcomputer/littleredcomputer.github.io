---
layout: post
title:  "Lorenz equation in JavaScript"
date:   2016-04-03 13:15:00
categories: math odex js
using: katex
---

Let's try the [odex][odex] JavaScript library in the browser to
explore the [Lorenz strange attractor][lor]:

<div class="equation" data-expr="\displaystyle x' = \sigma(y-x)"></div>
<div class="equation" data-expr="\displaystyle y' = x(\rho-z)-y"></div>
<div class="equation" data-expr="\displaystyle z'=xy-\beta z"></div>

Move the mouse around the graph to perturb the initial conditions a
bit. (Slower is better, to watch the dynamics shift.)
You can see the sensitive dependence on initial conditions as
the imaginary point decides which of the two lobes to hang around in
and how long to stay there!

These solutions of the Lorenz equations are projected into the
<span class="equation" data-expr="yz"></span>-plane.

Solution:
<div id='graph1'></div>

<script src="/public/js/odex-demo-bundle.js"></script>
<script>
  var l = new odexdemo.Lorenz('graph1').draw();
</script>

[odex]: https://www.npmjs.com/package/odex
[lor]: https://en.wikipedia.org/wiki/Lorenz_system
