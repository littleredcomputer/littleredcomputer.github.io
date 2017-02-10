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
    let T = 2 * Math.PI / params.omega
    let t1 = 1000 * T
    let H = this.HamiltonSysder(1, 1, params.omega, params.a, 9.8)
    this.S.solve(H, 0, [0].concat(initialData), t1, this.S.grid(T, (t: number, ys: number[]) => callback(this.PV(ys[1]), ys[2])))
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

  constructor(canvas: string, M: StandardMap, xRange: number[], yRange: number[]) {
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
