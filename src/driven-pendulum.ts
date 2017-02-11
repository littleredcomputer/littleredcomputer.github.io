/**
 * Created by colin on 2/10/17.
 */

import {DrivenPendulumMap, ExploreMap} from './standard-map'
import {xml} from "d3-request";

class DrivenPendulum {
  amplitude = 0.1
  animLogicalSize: number
  omegaRange: HTMLInputElement
  tRange: HTMLInputElement
  diffEq: DrivenPendulumMap
  ctx: CanvasRenderingContext2D
  xMap: ExploreMap
  initialData: number[]

  constructor(o: {
    omegaValueId: string
    omegaRangeId: string
    tValueId: string
    tRangeId: string
    animId: string
    animLogicalSize: number
    exploreId: string
    theta0Id: string
    thetaDot0Id: string
  }) {
    // this.animLogicalSize = o.animLogicalSize
    this.diffEq = new DrivenPendulumMap(() => ({
      a: this.amplitude,
      omega: +this.omegaRange.value,
      T: +this.tRange.value
    }))
    let anim = <HTMLCanvasElement>document.getElementById(o.animId)
    this.ctx = anim.getContext('2d')
    this.ctx.scale(anim.width / (2 * o.animLogicalSize), -anim.height / (2 * o.animLogicalSize))
    this.ctx.translate(o.animLogicalSize, -o.animLogicalSize)
    this.xMap = new ExploreMap('p', this.diffEq, [-Math.PI, Math.PI], [-10, 10])
    this.xMap.onExplore = (theta0: number, thetaDot0: number) => {
      console.log('onExplore', theta0, thetaDot0)
      document.getElementById(o.theta0Id).textContent = theta0.toFixed(3)
      document.getElementById(o.thetaDot0Id).textContent = thetaDot0.toFixed(3)
      this.initialData = [theta0, thetaDot0]
    }
    let explore = <HTMLCanvasElement>document.getElementById(o.exploreId)
    this.omegaRange = <HTMLInputElement>document.getElementById(o.omegaRangeId)
    this.tRange = <HTMLInputElement>document.getElementById(o.tRangeId)
    this.omegaRange.addEventListener('change', (e: Event) => {
      explore.getContext('2d').clearRect(-Math.PI, -10, 2 * Math.PI, 20)
      let t = <HTMLInputElement>e.target
      document.getElementById(o.omegaValueId).textContent = (+t.value).toFixed(1)
    })
    this.tRange.addEventListener('change', (e: Event) => {
      let t = <HTMLInputElement>e.target
      document.getElementById(o.tValueId).textContent = t.value
    })
  }
}

document.getElementById('go').addEventListener('click', function(c) {
  var dt = 1/60
  var T = +tRange.value
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
