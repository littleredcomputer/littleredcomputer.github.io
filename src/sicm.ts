/**
  * Created by colin on 6/14/16.
  * http://littleredcomputer.github.io
  */

import {Solver, Derivative} from 'odex/src/odex'

interface HamiltonMap {
  generateSection(initialData: number[], n: number, callback: (x: number, y: number) => void): void
}

interface DifferentialEquation {
  evolve(params: {}, initialData: number[], t1: number, dt: number, callback: (t: number, y: number[]) => void): void
}

const twoPi = Math.PI * 2

export class StandardMap implements HamiltonMap {
  K: number
  PV: (x: number) => number
  static twoPi = 2 * Math.PI

  constructor(K: number) {
    this.K = K
    this.PV = StandardMap.principal_value(twoPi)
  }

  static principal_value(cutHigh: number): (v: number) => number {
    const cutLow = cutHigh - twoPi
    return function (x: number) {
      if (cutLow <= x && x < cutHigh) {
        return x
      }
      const y = x - twoPi * Math.floor(x / twoPi)
      return y < cutHigh ? y : y - twoPi
    }
  }

  generateSection(initialData: number[], n: number, callback: (x: number, y: number) => void) {
    let [theta, I] = initialData
    for (let i = 0; i < n; ++i) {
      callback(theta, I)
      let nI = I + (this.K * Math.sin(theta))
      theta = this.PV(theta + nI)
      I = this.PV(nI)
    }
  }
}

export class DrivenPendulumMap implements HamiltonMap, DifferentialEquation {

  paramfn: () => {a: number, omega: number}
  S: Solver
  PV: (x: number) => number

  HamiltonSysder(m: number, l: number, omega: number, a: number, g: number): Derivative {
    return (x, [t, theta, p_theta]) => {
       let _0002 = Math.pow(l, 2)
       let _0003 = omega * t
       let _0004 = Math.sin(theta)
       let _0005 = Math.cos(theta)
       let _0006 = Math.sin(_0003)
       return [1, (a * l * m * omega * _0006 * _0004 + p_theta) / (_0002 * m), (- Math.pow(a, 2) * l * m * Math.pow(omega, 2) * Math.pow(_0006, 2) * _0005 * _0004 - a * omega * p_theta * _0006 * _0005 - g * _0002 * m * _0004) / l]
    }
  }

  LagrangeSysder(l: number, omega: number, a: number, g: number): Derivative {
    return (x, [t, theta, thetadot]) => {
      let _0001 = Math.sin(theta)
      return [1, thetadot, (a * Math.pow(omega, 2) * _0001 * Math.cos(omega * t) - g * _0001) / l]
    }
  }

  constructor(paramfn: () => {a: number, omega: number}) {
    this.paramfn = paramfn
    this.S = new Solver(3)
    this.S.denseOutput = true
    this.S.absoluteTolerance = 1e-8
    this.PV = StandardMap.principal_value(Math.PI)
  }

  generateSection(initialData: number[], n: number, callback: (x: number, y: number) => void) {
    let params = this.paramfn()
    let period = 2 * Math.PI / params.omega
    let t1 = 1000 * period
    let H = this.HamiltonSysder(1, 1, params.omega, params.a, 9.8)
    this.S.solve(H, 0, [0].concat(initialData), t1, this.S.grid(period, (t, ys) => callback(this.PV(ys[1]), ys[2])))
  }

  evolve(params: {omega: number, a: number}, initialData: number[], t1: number, dt: number, callback: (x: number, ys: number[]) => void) {
    let L = this.LagrangeSysder(1, params.omega, params.a, 9.8)
    let p0 = performance.now()
    this.S.solve(L, 0, [0].concat(initialData), t1, this.S.grid(dt, callback))
    console.log('evolution took', (performance.now() - p0).toFixed(2), 'msec')
  }
}

export class ExploreMap {
  canvas: HTMLCanvasElement
  M: HamiltonMap
  context: CanvasRenderingContext2D
  onExplore: (x: number, y: number) => void

  constructor(canvas: string, M: HamiltonMap, xRange: number[], yRange: number[]) {
    this.canvas = <HTMLCanvasElement> document.getElementById(canvas)
    this.M = M
    this.context = this.canvas.getContext('2d')
    let [w, h] = [xRange[1] - xRange[0], yRange[1] - yRange[0]]
    this.canvas.onmousedown = (e: MouseEvent) => {
      let [cx, cy] = [e.offsetX / this.context.canvas.width * w + xRange[0],
        yRange[1] - e.offsetY / this.context.canvas.height * h]
      let p0 = performance.now()
      this.Explore(cx, cy)
      console.log('exploration', (performance.now() - p0).toFixed(2), 'msec')
      this.onExplore && this.onExplore(cx, cy)
    }
    this.context.scale(this.context.canvas.width / w, -this.context.canvas.height / h)
    this.context.translate(-xRange[0], -yRange[1])
    this.context.fillStyle = 'rgba(23,64,170,0.5)'
  }
  i: number = 0

  // since pt is invoked in callback position, we want to define it as an instance arrow function
  pt = (x: number, y: number) => {
    this.context.beginPath()
    this.context.arc(x, y, 0.01, 0, 2 * Math.PI)
    this.context.fill()
    this.context.closePath()
    ++this.i
  }

  Explore(x: number, y: number) {
    this.M.generateSection([x, y], 1000, this.pt)
  }
}

export class DrivenPendulumAnimation {
  amplitude = 0.1
  animLogicalSize = 1.3
  ctx: CanvasRenderingContext2D
  initialData: number[]
  data: number[][]
  frameIndex: number
  frameStart: number
  omega: number
  animating: boolean

  constructor(o: {
    omegaValueId: string
    omegaRangeId: string
    tValueId: string
    tRangeId: string
    animId: string
    exploreId: string
    theta0Id: string
    thetaDot0Id: string
    goButtonId: string
  }) {
    let omegaRange = <HTMLInputElement>document.getElementById(o.omegaRangeId)
    let omegaRadSec = () => +omegaRange.value * 2 * Math.PI
    let tRange = <HTMLInputElement>document.getElementById(o.tRangeId)
    let diffEq = new DrivenPendulumMap(() => ({omega: omegaRadSec(), a: this.amplitude}))
    let anim = <HTMLCanvasElement>document.getElementById(o.animId)
    this.ctx = anim.getContext('2d')
    this.ctx.scale(anim.width / (2 * this.animLogicalSize), -anim.height / (2 * this.animLogicalSize))
    this.ctx.translate(this.animLogicalSize, -this.animLogicalSize)
    let xMap = new ExploreMap('p', diffEq, [-Math.PI, Math.PI], [-10, 10])
    let goButton = document.getElementById(o.goButtonId)
    xMap.onExplore = (theta0: number, thetaDot0: number) => {
      console.log('onExplore', theta0, thetaDot0)
      document.getElementById(o.theta0Id).textContent = theta0.toFixed(3)
      document.getElementById(o.thetaDot0Id).textContent = thetaDot0.toFixed(3)
      this.initialData = [theta0, thetaDot0]
      goButton.removeAttribute('disabled')
    }
    let explore = <HTMLCanvasElement>document.getElementById(o.exploreId)
    omegaRange.addEventListener('change', (e: Event) => {
      explore.getContext('2d').clearRect(-Math.PI, -10, 2 * Math.PI, 20)
      let t = <HTMLInputElement>e.target
      document.getElementById(o.omegaValueId).textContent = (+t.value).toFixed(1)
    })
    document.getElementById(o.omegaValueId).textContent = omegaRange.value
    tRange.addEventListener('change', (e: Event) => {
      let t = <HTMLInputElement>e.target
      document.getElementById(o.tValueId).textContent = t.value
    })
    document.getElementById(o.tValueId).textContent = tRange.value
    goButton.setAttribute('disabled', 'disabled')
    goButton.addEventListener('click', () => {
      // (re)solve the differential equation and update the data. Kick off the animation.
      let dt = 1 / 60
      let t1 = +tRange.value
      let n = Math.ceil(t1 / dt)
      this.data = new Array(n)
      let i = 0
      this.omega = omegaRadSec()
      let p0 = performance.now()
      diffEq.evolve({omega: this.omega, a: this.amplitude}, this.initialData, t1, dt, (x, ys) => {this.data[i++] = ys})
      console.log('DE evolution in', (performance.now() - p0).toFixed(1), 'msec')
      this.frameIndex = 0
      this.frameStart = performance.now()
      if (!this.animating) {
        this.animating = true
        requestAnimationFrame(this.frame)
      }
    })
  }
  timestring = (t: number) => {
    let s = t.toFixed(2)
    if (s.match(/\.[0-9]$/)) {
      s += '0'
    }
    return 't: ' + s + ' s'
  }

  frame = () => {
    let bob = (t: number) => this.amplitude * Math.cos(this.omega * t)
    this.ctx.clearRect(-this.animLogicalSize, -this.animLogicalSize, 2 * this.animLogicalSize, 2 * this.animLogicalSize)
    let d = this.data[this.frameIndex]
    let y0 = bob(d[0])
    let theta = d[1]
    const c = this.ctx
    c.lineWidth = 0.02
    c.fillStyle = '#000'
    c.beginPath()
    c.moveTo(0, y0)
    c.lineTo(Math.sin(theta), y0 - Math.cos(theta))
    c.stroke()
    c.beginPath()
    c.fillStyle = '#000'
    c.arc(0, y0, 0.05, 0, Math.PI * 2)
    c.fillStyle = '#f00'
    c.arc(Math.sin(theta), y0 - Math.cos(theta), 0.1, 0, Math.PI * 2)
    c.fill()
    c.save()
    c.scale(0.01, -0.01)
    c.font = '10pt sans-serif3'
    c.fillStyle = '#bbb'
    c.fillText(this.timestring(d[0]), -115, 115)
    c.restore()

    ++this.frameIndex
    if (this.frameIndex < this.data.length) {
      window.requestAnimationFrame(this.frame)
    } else {
      this.animating = false
      let et = (performance.now() - this.frameStart) / 1e3
      console.log('animation done', (this.data.length / et).toFixed(2), 'fps')
    }
  }
}

interface DoubleParams {
  l1: number
  m1: number
  l2: number
  m2: number
}

class DoublePendulumMap implements DifferentialEquation {
  S: Solver

  LagrangeSysder(l1: number, m1: number, l2: number, m2: number): Derivative {
    const g = 9.8
    return (x, [t, theta, phi, thetadot, phidot]) => {
      let _0002 = Math.pow(phidot, 2)
      let _0003 = Math.sin(phi)
      let _0005 = - phi
      let _0007 = Math.sin(theta)
      let _0008 = Math.pow(thetadot, 2)
      let _000b = _0005 + theta
      let _000e = Math.cos(_000b)
      let _000f = Math.sin(_000b)
      let _0011 = Math.pow(_000f, 2)
      return [1, thetadot, phidot, (- l1 * m2 * _0008 * _000f * _000e - l2 * m2 * _0002 * _000f + g * m2 * _000e * _0003 - g * m1 * _0007 - g * m2 * _0007) / (l1 * m2 * _0011 + l1 * m1), (l2 * m2 * _0002 * _000f * _000e + l1 * m1 * _0008 * _000f + l1 * m2 * _0008 * _000f + g * m1 * _0007 * _000e + g * m2 * _0007 * _000e - g * m1 * _0003 - g * m2 * _0003) / (l2 * m2 * _0011 + l2 * m1)]
    }
  }

  constructor() {
    this.S = new Solver(5)  // t, theta, phi, thetadot, phidot
    this.S.denseOutput = true
    this.S.absoluteTolerance = 1e-8
  }

  evolve(p: DoubleParams, initialData: number[], t1: number, dt: number, callback: (t: number, y: number[]) => void): void {
    this.S.solve(this.LagrangeSysder(p.l1, p.m1, p.l2, p.m2), 0, [0].concat(initialData), t1, this.S.grid(dt, callback))
  }
}

export class DoublePendulumAnimation {
  animLogicalSize = 1.3
  ctx: CanvasRenderingContext2D
  data: number[][]
  frameStart: number
  frameIndex: number
  animating: boolean
  params: DoubleParams
  valueUpdater(toId: string) {
    return (e: Event) => document.getElementById(toId).textContent = (<HTMLInputElement>e.target).value
  }

  constructor(o: {
    theta0RangeId: string,
    theta0ValueId: string,
    phi0RangeId: string,
    phi0ValueId: string,
    tRangeId: string,
    tValueId: string,
    mRangeId: string,
    mValueId: string,
    lRangeId: string,
    lValueId: string,
    animId: string,
    goButtonId: string
  }) {
    this.animating = false
    let deg2rad = (d: number) => d * 2 * Math.PI / 360
    let theta0Range = <HTMLInputElement>document.getElementById(o.theta0RangeId)
    theta0Range.addEventListener('change', this.valueUpdater(o.theta0ValueId))
    let phi0Range = <HTMLInputElement>document.getElementById(o.phi0RangeId)
    phi0Range.addEventListener('change', this.valueUpdater(o.phi0ValueId))
    let tRange = <HTMLInputElement>document.getElementById(o.tRangeId)
    tRange.addEventListener('change', this.valueUpdater(o.tValueId))
    let mRange = <HTMLInputElement>document.getElementById(o.mRangeId)
    mRange.addEventListener('change', this.valueUpdater(o.mValueId))
    let lRange = <HTMLInputElement>document.getElementById(o.lRangeId)
    lRange.addEventListener('change', this.valueUpdater(o.lValueId))
    let anim = <HTMLCanvasElement>document.getElementById(o.animId)
    this.ctx = anim.getContext('2d')
    this.ctx.scale(anim.width / (2 * this.animLogicalSize), -anim.height / (2 * this.animLogicalSize))
    this.ctx.translate(this.animLogicalSize, -this.animLogicalSize)
    let diffEq = new DoublePendulumMap()
    document.getElementById(o.goButtonId).addEventListener('click', () =>  {
      let dt = 1 / 60
      let t1 = +tRange.value
      let n = Math.ceil(t1 / dt)
      this.data = new Array(n)
      let i = 0
      let p0 = performance.now()
      this.params = {
        l1: +lRange.value,
        m1: +mRange.value,
        l2: 1 - Number(lRange.value),
        m2: 1 - Number(mRange.value)
      }
      diffEq.evolve(this.params, [deg2rad(+theta0Range.value), deg2rad(+phi0Range.value), 0, 0], t1, dt, (x, ys) => {this.data[i++] = ys})
      console.log('evolution in', (performance.now() - p0).toFixed(2), 'msec ')
      this.frameIndex = 0
      this.frameStart = performance.now()
      if (!this.animating) {
        this.animating = true
        requestAnimationFrame(this.frame)
      }
    })
  }
  frame = () => {
    this.ctx.clearRect(-this.animLogicalSize, -this.animLogicalSize, 2 * this.animLogicalSize, 2 * this.animLogicalSize)
    let d = this.data[this.frameIndex]
    let theta = d[1], phi = d[2]
    const c = this.ctx
    const p = this.params
    let x0 = 0, y0 = 0
    let x1 = p.l1 * Math.sin(theta), y1 = -p.l1 * Math.cos(theta)
    let x2 = x1 + p.l2 * Math.sin(phi), y2 = y1 - p.l2 * Math.cos(phi)
    c.lineWidth = 0.025
    c.strokeStyle = '#888'
    c.beginPath()
    c.moveTo(x0, y0)
    c.lineTo(x1, y1)
    c.lineTo(x2, y2)
    c.stroke()
    c.fillStyle = '#f00'
    c.beginPath()
    c.moveTo(x0, y0)
    c.arc(x0, y0, 0.05, 0, Math.PI * 2)
    c.moveTo(x1, y1)
    c.arc(x1, y1, Math.pow(p.m1, 1 / 3) / 7, 0, Math.PI * 2)
    c.moveTo(x2, y2)
    c.arc(x2, y2, Math.pow(p.m2, 1 / 3) / 7, 0, Math.PI * 2)
    c.fill()

    ++this.frameIndex
    if (this.frameIndex < this.data.length) {
      window.requestAnimationFrame(this.frame)
    } else {
      this.animating = false
      let et = (performance.now() - this.frameStart) / 1e3
      console.log('animation done', (this.data.length / et).toFixed(2), 'fps')
    }
  }
}
