---
layout: post
title:  "The Driven Pendulum"
categories: math js
using: katex
---

<div>&omega;: <input type="range" id="wRange" min="0" max="60" value="6.2" style="width:200px" step="0.2"/>
  <span id="wValue"></span>
  &nbsp;&nbsp;t<sub>1</sub>: <input type="range" id="tRange" min="10" max="60" value="10" step="5"/>
  <span id="tValue"></span>
</div>
<canvas id="p" width="320" height="320" style="border-style: solid; border-color: #ccc; border-width: 4px"></canvas>
<canvas id="a" width="320" height="320" style="border-style: solid; border-color: #ccc; border-width: 4px"></canvas>
<div>θ<sub>0</sub>: <span id="theta0"></span>, θ&#x0307;<sub>0</sub>: <span id="thetadot0"></span></div>
<br/>
<button id="go">go</button>


<script src="/public/js/standard-map.bundle.min.js"></script>
<script>
var A = new s.DrivenPendulumAnimation({
  omegaValueId: 'wValue',
  omegaRangeId: 'wRange',
  tValueId: 'tValue',
  tRangeId: 'tRange',
  animId: 'a',
  exploreId: 'p',
  theta0Id: 'theta0',
  thetaDot0Id: 'thetadot0',
  goButtonId: 'go'
})

</script>
