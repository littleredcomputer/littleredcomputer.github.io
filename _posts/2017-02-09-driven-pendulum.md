---
layout: post
title:  "The Driven Pendulum"
categories: math js
using: katex
---

<div><input type="range" id="wRange" min="0" max="60" value="6.2" style="width:200px" step="0.2"/></div>
<canvas id="p" width="320" height="320" style="border-style: solid; border-color: #ccc; border-width: 4px"></canvas>
<canvas id="a" width="320" height="320" style="border-style: solid; border-color: #ccc; border-width: 4px"></canvas>
<div>θ<sub>0</sub>: <span id="theta0"></span>, θ&#x0307;<sub>0</sub>: <span id="thetadot0"></span></div>
<br/>
<button id="go">go</button>


<script src="/public/js/standard-map.bundle.min.js"></script>
<script>
  var amplitude = 0.1
  var omega = document.getElementById('wRange')
  var ic = new Array(2)
  var P = new s.DrivenPendulumMap(function() {
    return {a: amplitude, omega: +omega.value}
  })
  var aw = 1.3 // animation logical half-width
  var anim = document.getElementById('a')
  var actx = anim.getContext('2d')
  actx.scale(anim.width / (2*aw), -anim.height / (2*aw))
  actx.translate(aw, -aw)
  
  
  var N = new s.ExploreMap('p', P, [-Math.PI, Math.PI], [-10, 10])
  N.onExplore = function(x, y) {
    console.log("onExplore", x, y)
    document.getElementById('theta0').textContent = x.toFixed(3)
    document.getElementById('thetadot0').textContent = y.toFixed(3)
    ic[0] = x
    ic[1] = y
  }
  omega.addEventListener('change', function(e) {
    document.getElementById('p')
      .getContext('2d')
      .clearRect(-Math.PI, -10, 2*Math.PI, 20)
    console.log('value is now', e.target.value)
    
  })
  document.getElementById('go').addEventListener('click', function(c) {
    var dt = 1/60
    var T = 10
    var n = Math.ceil(T/dt)
    var A = new Array(n)
    var i = 0
    P.evolve(ic, T, dt, function(x, ys) {
      A[i++] = ys
    })
    actx.lineWidth=0.02
    i = 0
    var p0 = performance.now()
    var w = omega.value
    function bob(t) {
      return amplitude * Math.cos(w*t)
    }    
    function pt() {
      actx.clearRect(-aw, -aw, 2*aw, 2*aw)
      var theta = A[i][1]
      var y0 = bob(A[i][0])
      actx.beginPath()
      actx.fillStyle = '#000'
      actx.arc(0, y0, 0.05, 0, Math.PI*2)
      actx.fillStyle = '#f00'
      actx.arc(Math.sin(theta), y0 - Math.cos(theta), 0.1, 0, Math.PI*2)
      actx.fill()
      actx.fillStyle = '#000'
      actx.beginPath()
      actx.moveTo(0, y0)
      actx.lineTo(Math.sin(theta),y0 - Math.cos(theta))
      actx.stroke()
      
      i++
      if (i < n) {
        window.requestAnimationFrame(pt)
      } else {
        var et = (performance.now() - p0)/1e3
        console.log('animation done', (n/et).toFixed(2), 'fps')
      }
    }
    window.requestAnimationFrame(pt)
  }, false)
  
    
  //N.context.fillStyle = 'red'
  //N.context.fillRect(0,0,2,2);
</script>
