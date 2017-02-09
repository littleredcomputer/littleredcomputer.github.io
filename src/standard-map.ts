/**
 * Created by colin on 6/14/16.
 */

import {Solver, Derivative} from '../../odex/src/odex'

interface HamiltonMap {
  evolve: (initialData: number[], n: number, callback: (x: number, y: number) => void) => void
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

  evolve = function(initialData: number[], n: number, callback: (x: number, y: number) => void) {
    let [theta, I] = initialData
    for (let i = 0; i < n; ++i) {
      callback(theta, I)
      let nI = I + (this.K * Math.sin(theta))
      theta = this.PV(theta + nI)
      I = this.PV(nI)
    }
  }
}

export class DrivenPendulumMap implements HamiltonMap {
  d: Derivative
  T: number
  S: Solver
  PV: (x: number) => number

  static F: (m: number, l: number, a: number, omega: number, g: number) => Derivative =
    (m, l, a, omega, g) => (x, [t, theta, p_theta]) => {
      // let _1 = Math.sin(omega * t): this comes about from a bug in our CSE
      let _2 = Math.pow(l, 2)
      let _3 = omega * t
      let _4 = Math.sin(theta)
      let _5 = Math.cos(theta)
      return [1,
        (Math.sin(_3) * _4 * a * l * m * omega + p_theta) / _2 * m,
        (- Math.pow(Math.sin(_3), 2) * _4 * _5 * Math.pow(a, 2) * l * m * Math.pow(omega, 2) - Math.sin(_3) * _5 * a * omega * p_theta - _4 * g * _2 * m) / l]
    }

  constructor() {
    this.S = new Solver(3)
    this.S.denseOutput = true
    // this.S.absoluteTolerance = 1e-9
    // this.S.relativeTolerance = 1e-9
    const l = 1
    const g = 9.8
    const w0 = Math.sqrt(g / l)
    const w = 2 * w0
    this.T = 2 * Math.PI / w
    const a = 0.1
    this.d = DrivenPendulumMap.F(1, l, a, w, g)
    this.PV = StandardMap.principal_value(Math.PI)
  }

  evolve(initialData: number[], n: number, callback: (x: number, y: number) => void) {
    this.S.solve(this.d, 0, [0].concat(initialData), 1000 * this.T, this.S.grid(this.T, (x, ys) => {
      callback(this.PV(ys[1]), ys[2])
    }))
  }
}

export class ExploreMap {
  canvas: HTMLCanvasElement
  M: HamiltonMap
  context: CanvasRenderingContext2D

  constructor(canvas: string, M: StandardMap, xRange: number[], yRange: number[]) {
    this.canvas = <HTMLCanvasElement> document.getElementById(canvas)
    this.M = M
    this.context = this.canvas.getContext('2d')
    let [w, h] = [xRange[1] - xRange[0], yRange[1] - yRange[0]]
    this.canvas.onmousedown = (e: MouseEvent) => {
      let [cx, cy] = [e.offsetX / this.context.canvas.width * w + xRange[0],
        yRange[1] - e.offsetY / this.context.canvas.height * h]
      this.Explore(cx, cy)
    }
    this.context.scale(this.context.canvas.width / w, -this.context.canvas.height / h)
    this.context.translate(-xRange[0], -yRange[1])
    this.context.fillStyle = 'rgba(23,64,170,0.3)'
  }

  i: number = 0

  pt = (x: number, y: number) => {
    // if (this.i % 100 === 0) console.log(this.i, 'pts')
    this.context.beginPath()
    this.context.arc(x, y, 0.01, 0, 2 * Math.PI)
    this.context.fill()
    this.context.closePath()
    ++this.i
  }

  Explore(x: number, y: number) {
    this.M.evolve([x, y], 1000, this.pt)
  }
}
