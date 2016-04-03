---
layout: post
title:  "Differential equations in JavaScript"
date:   2015-10-04 11:06:20
categories: jekyll update
using: katex
---

So, I recently ported a Fortran differential equation numerical
integration library to JavaScript, so I thought it would be fun
to see how fast it is in the browser. Here's Airy's differential
equation
<span class="equation" data-expr="y'' - xy = 0"></span>
. Hover the mouse over the graphs to perturb the initial
conditions. For each mouse motion we solve the DE from scratch
and plot it with d3.

Solution:
<div id='graph2'></div>
Phase space (parametric plot of y and y&prime;):
<div id='graph3'></div>

<script src="/public/js/odex-demo-bundle.js"></script>
