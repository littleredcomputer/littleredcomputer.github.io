/**
 * Created by colin on 6/14/16.
 */

import {Solver, Derivative} from 'odex/src/odex'

interface HamiltonMap {
  generateSection(initialData: number[], n: number, callback: (x: number, y: number) => void): void
}

interface DE {
  evolve(initialData: number[], t1: number, dt: number, callback: (t: number, y: number[]) => void): void
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

export class DrivenPendulumMap implements HamiltonMap, DE {

  paramfn: () => {a: number, omega: number}
  S: Solver
  PV: (x: number) => number

  HamiltonSysder(m: number, l: number, omega: number, a: number, g: number): Derivative {
    return (x, [t, theta, p_theta]) => {
      let _1 = Math.sin(omega * t)
      let _2 = Math.pow(l, 2)
      let _3 = omega * t
      let _4 = Math.sin(theta)
      let _5 = Math.cos(theta)
      return [1,
        (Math.sin(_3) * _4 * a * l * m * omega + p_theta) / (_2 * m),
        (- Math.pow(Math.sin(_3), 2) * _5 * _4 * Math.pow(a, 2) * l * m * Math.pow(omega, 2) - Math.sin(_3) * _5 * a * omega * p_theta - _4 * g * _2 * m) / l]
    }
  }

  LagrangeSysder(m: number, l: number, omega: number, a: number, g: number): Derivative {
    return (x, [t, theta, thetadot]) => {
      let _1 = Math.sin(theta)
      return [1, thetadot, (_1 * Math.cos(omega * t) * a * Math.pow(omega, 2) - _1 * g) / l]
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
    console.log('params', params)
    let period = 2 * Math.PI / params.omega
    let t1 = 1000 * period
    let H = this.HamiltonSysder(1, 1, params.omega, params.a, 9.8)
    this.S.solve(H, 0, [0].concat(initialData), t1, this.S.grid(period, (t: number, ys: number[]) => callback(this.PV(ys[1]), ys[2])))
  }

  evolve(initialData: number[], t1: number, dt: number, callback: (x: number, ys: number[]) => void) {
    let params = this.paramfn()
    console.log('params', params)
    let L = this.LagrangeSysder(1, 1, params.omega, params.a, 9.8)
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
    // if (this.i % 100 === 0) console.log(this.i, 'pts')
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
    let tRange = <HTMLInputElement>document.getElementById(o.tRangeId)
    let diffEq = new DrivenPendulumMap(() => ({
      a: this.amplitude,
      omega: +omegaRange.value
    }))
    let anim = <HTMLCanvasElement>document.getElementById(o.animId)
    this.ctx = anim.getContext('2d')
    this.ctx.scale(anim.width / (2 * this.animLogicalSize), -anim.height / (2 * this.animLogicalSize))
    this.ctx.translate(this.animLogicalSize, -this.animLogicalSize)
    let xMap = new ExploreMap('p', diffEq, [-Math.PI, Math.PI], [-10, 10])
    xMap.onExplore = (theta0: number, thetaDot0: number) => {
      console.log('onExplore', theta0, thetaDot0)
      document.getElementById(o.theta0Id).textContent = theta0.toFixed(3)
      document.getElementById(o.thetaDot0Id).textContent = thetaDot0.toFixed(3)
      this.initialData = [theta0, thetaDot0]
    }
    let explore = <HTMLCanvasElement>document.getElementById(o.exploreId)
    omegaRange.addEventListener('change', (e: Event) => {
      explore.getContext('2d').clearRect(-Math.PI, -10, 2 * Math.PI, 20)
      let t = <HTMLInputElement>e.target
      document.getElementById(o.omegaValueId).textContent = (+t.value).toFixed(1)
    })
    tRange.addEventListener('change', (e: Event) => {
      let t = <HTMLInputElement>e.target
      document.getElementById(o.tValueId).textContent = t.value
    })
    document.getElementById(o.goButtonId).addEventListener('click', (e: MouseEvent) => {
      // (re)solve the differential equation and update the data. Kick off the animation.
      let dt = 1 / 60
      let t1 = +tRange.value
      let n = Math.ceil(t1 / dt)
      this.data = new Array(n)
      let i = 0
      this.omega = +omegaRange.value
      let p0 = performance.now()
      diffEq.evolve(this.initialData, t1, dt, (x, ys) => {this.data[i++] = ys})
      console.log('DE evolution in', (performance.now() - p0).toFixed(1), 'msec')
      this.frameIndex = 0
      this.frameStart = performance.now()
      if (!this.animating) {
        this.animating = true
        requestAnimationFrame(this.frame)
      }
    })
  }
  frame = () => {
    let bob = (t: number) => this.amplitude * Math.cos(this.omega * t)
    this.ctx.clearRect(-this.animLogicalSize, -this.animLogicalSize, 2 * this.animLogicalSize, 2 * this.animLogicalSize)
    let d = this.data[this.frameIndex]
    let y0 = bob(d[0])
    let theta = d[1]
    const c = this.ctx
    c.lineWidth = 0.02
    c.beginPath()
    c.fillStyle = '#000'
    c.arc(0, y0, 0.05, 0, Math.PI * 2)
    c.fillStyle = '#f00'
    c.arc(Math.sin(theta), y0 - Math.cos(theta), 0.1, 0, Math.PI * 2)
    c.fill()
    c.fillStyle = '#000'
    c.beginPath()
    c.moveTo(0, y0)
    c.lineTo(Math.sin(theta), y0 - Math.cos(theta))
    c.stroke()

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
