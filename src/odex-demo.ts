import {Graph} from './graph'
import {Solver, Derivative} from 'odex/src/odex'

class DifferentialEquationView {
  g: Graph[] = []
  solver: Solver
  // eq: Derivative
  dt = 0.1
  getParameters: () => number[] = () => []
  // WHERE I LEFT OFF
  // now need something like getEq, which is applied to the result
  // of getParameters, to yield the equation to integrate

  constructor(dy: Derivative, dim: number, elements: string[], width: number, height: number) {
    elements.map(e => {
      this.solver = new Solver(dy, dim)
      this.g.push(new Graph('#' + e, width, height))
      ; (<SVGElement> document.querySelector('#' + e + ' svg')).onmousemove = e => this.tweak(e)
    })
  }

  phaseDraw(initialData: number[], start: number, end: number, transform?: (xs: number[]) => number[]) {
    const xpts: [number, number][] = []
    const ypts: [number, number][] = []
    const tpts: [number, number][] = []
    const f = this.solver.integrate(start, initialData)
    for (let x = start; x <= end; x += this.dt) {
      let y = f(x)
      let ys = transform ? transform(y) : y
      xpts.push([x, ys[0]])
      ypts.push([x, ys[1]])
      tpts.push([ys[0], ys[1]])
    }
    this.g[0].draw(xpts, 'Predator')
    this.g[0].draw(ypts, 'Prey')
    this.g[1].draw(tpts, 'Phase')
  }

  tweak = (e: MouseEvent) => console.log('tweak unimplemented')
}

export class Airy extends DifferentialEquationView {
  initialData: number[] = [0.2782174909, 0.2723742043]

  constructor(elt0: string, elt1: string) {
    super((x, y) => [y[1], x * y[0]], 2, [elt0, elt1], 500, 350)
    this.g[0].axes([-15, 5], [-0.5, 0.75])
    this.g[1].axes([-0.5, 0.5], [-1.5, 1.5])
  }

  draw(initialData: number[] = this.initialData) {
    const apts: [number, number][] = []
    const bpts: [number, number][] = []
    const f = this.solver.integrate(-15, initialData)
    for (let x = -15; x < 5; x += 0.05) {
      const y = f(x)
      apts.push([x, y[0]])
      bpts.push([y[0], y[1]])
    }
    this.g[0].draw(apts, 'Ai')
    this.g[1].draw(bpts)
  }

  tweak = (e: MouseEvent) => {
    const x = e.offsetX - 500
    const p = x / 2000
    const y = e.offsetY - 200
    const q = y / 2000
    this.draw([this.initialData[0] + p, this.initialData[1] + q])
  }
}

export class Lorenz extends DifferentialEquationView {
  initialData: number[] = [1, 1, 1]

  static L = (sigma: number, rho: number, beta: number) => (x: number, y: number[]) => [
    sigma * (y[1] - y[0]),
    y[0] * (rho - y[2]) - y[1],
    y[0] * y[1] - beta * y[2]
  ]

  constructor(elt: string) {
    super(Lorenz.L(10, 28, 8 / 3), 3, [elt], 500, 500)
    this.g[0].axes([-30, 30], [0, 50])
  }

  tweak = (e: MouseEvent) => {
    const xt = (e.offsetX - 500) / 2000
    const yt = (e.offsetY - 500) / 2000
    this.draw([this.initialData[0] + xt, this.initialData[1] + yt, 1])
  }

  draw(initialData: number[] = this.initialData) {
    const xpts: [number, number][] = []
    const f = this.solver.integrate(0, initialData)
    for (let x = 0; x <= 20; x += 0.005) {
      const y = f(x)
      xpts.push([y[1], y[2]])
    }
    this.g[0].draw(xpts, 'Lo')
  }
}

export class PredatorPrey extends DifferentialEquationView {
  static sz = 400
  end = 25
  initialData = [1, 1]

  static LV = (a: number, b: number, c: number, d: number) => (x: number, y: number[]) => [
    a * y[0] - b * y[0] * y[1],
    c * y[0] * y[1] - d * y[1]
  ]

  constructor(elt0: string, elt1: string) {
    super(PredatorPrey.LV(2 / 3, 4 / 3, 1, 1), 2, [elt0, elt1], PredatorPrey.sz, PredatorPrey.sz)
    this.g[0].axes([0, this.end],  [0, 4])
    this.g[1].axes([0, 3], [0, 2])
  }

  tweak = (e: MouseEvent) => {
    const x = e.offsetX
    const y = e.offsetY
    this.draw([3 * x / PredatorPrey.sz, 2 - 2 * y / PredatorPrey.sz])
  }

  draw(initialData: number[] = this.initialData) {
    this.phaseDraw(initialData, 0, this.end)
  }
}

export class VanDerPol extends DifferentialEquationView {
  initialData = [1, 1]
  end = 25
  static sz = 400

  static V: ((e: number) => Derivative) = e => (x, y) => [
    y[1],
    ((1 - Math.pow(y[0], 2)) * y[1] - y[0]) / e
  ]

  constructor(elt1: string, elt2: string) {
    super(VanDerPol.V(3), 2, [elt1, elt2], VanDerPol.sz, VanDerPol.sz)
    this.g[0].axes([0, this.end], [-3, 3])
    this.g[1].axes([-3, 3], [-3, 3])
  }

  tweak = (e: MouseEvent) => {
    const x = e.offsetX
    const y = e.offsetY
    this.draw([this.g[1].x.invert(x), this.g[1].y.invert(y)])
  }

  draw(initialData: number[] = this.initialData) {
    this.phaseDraw(initialData, 0, this.end)
  }
}

export class DrivenPendulum extends DifferentialEquationView {
  static sz = 400
  end = 30
  dt = 0.04
  initialData = [0, 1, 0]

  static F: (l: number, a: number, omega: number, phi: number, g: number) => Derivative =
    (l, a, omega, phi, g) => (x, [t, theta, thetadot]) => {
      let _1 = Math.sin(theta)
      return [1, thetadot, (_1 * Math.cos(omega * t + phi) * a * Math.pow(omega, 2) - _1 * g) / l]
    }

  constructor(elt1: string, elt2: string) {
    super(DrivenPendulum.F(1, 0.01, 2 * Math.sqrt(9.8), 0, 9.8), 3, [elt1, elt2], 2 * DrivenPendulum.sz, DrivenPendulum.sz)
    this.g[0].axes([0, this.end], [-Math.PI, Math.PI])
    this.g[0].wrap_pi = true
    this.g[0].points = true
    // this.g[1].axes([-Math.PI, Math.PI], [-Math.PI, Math.PI])
    this.g[1].axes([-10, 10], [-10, 10])
  }
  draw(initialData: number[] = this.initialData) {
    this.phaseDraw(initialData, 0, this.end, a => a.slice(1))
  }
  tweak = (e: MouseEvent) => {
    let x = e.offsetX
    let y = e.offsetY
    this.draw([0, this.g[1].x.invert(x), this.g[1].y.invert(y)])
  }
}

// export class AxisymmetricTop extends DifferentialEquationView {
// }
