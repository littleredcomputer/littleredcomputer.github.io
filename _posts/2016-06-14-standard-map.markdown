---
layout: post
title:  "Standard Map (explorer)"
date:   2016-06-14 10:16:00
categories: math js
using: katex
---

<canvas id="c" width="400" height="400"></canvas>
<script src="/public/js/standard-map.bundle.js"></script>
<script>
  console.log('the-poast')
  var S = new standardmap.StandardMap(0.6)
  var M = new standardmap.ExploreMap('c', S)
</script>
