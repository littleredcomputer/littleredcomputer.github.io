---
layout: post
title:  "The Double Pendulum"
categories: math js
using: katex
---

Set up the initial conditions, and then click <button id="go">go</button> to see
state evolution.

<div>
  <span class="equation" data-expr="\theta_0:"></span>
  <input type="range" id="theta0Range" min="0" max="360" value="0" style="width:200px" step="10"/>
  <span id="theta0Value"></span>&deg;
</div>
<div>
  <span class="equation" data-expr="\phi_0:"></span>
  <input type="range" id="phi0Range" min="0" max="360" value="0" style="width:200px" step="10"/>
  <span id="phi0Value"></span>&deg;
</div>
<div>
  <span class="equation" data-expr="m_1:"></span>
  <input type="range" id="mRange" min="0.2" max="0.8" value="0.5" step="0.1"/>
  <span id="mValue"></span>; <span class="equation" data-expr="m_1+m_2=1"></span>
</div>
<div>
  <span class="equation" data-expr="l_1:"></span>
  <input type="range" id="lRange" min="0.2" max="0.8" value="0.5" step="0.1"/>
  <span id="lValue"></span>; <span class="equation" data-expr="l_1+l_2=1"></span>
</div>
<div>
  <span class="equation" data-expr="t_1:"></span>
  <input type="range" id="tRange" min="10" max="60" value="10" step="5"/>
  <span id="tValue"></span>
</div>

<canvas id="a" width="320" height="320" style="border-style: solid; border-color: #ccc; border-width: 4px"></canvas>
<br/>



<script src="/public/js/sicmdemo.js"></script>
<script>
var A = new s.DoublePendulumAnimation({
  theta0RangeId: 'theta0Range',
  theta0ValueId: 'theta0Value',
  phi0RangeId: 'phi0Range',
  phi0ValueId: 'phi0Value',
  tRangeId: 'tRange',
  tValueId: 'tValue',
  mRangeId: 'mRange',
  mValueId: 'mValue',
  lRangeId: 'lRange',
  lValueId: 'lValue',
  animId: 'a',
  goButtonId: 'go'
})

</script>
