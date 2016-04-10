/// <referencexx path="../typings/main/definitions/d3/index.d.ts" />

import {Solver} from './node_modules/odex/src/odex';
import {Graph} from './graph'

export class Airy {
  initialData: number[] = [0.2782174909, 0.2723742043]
  g1: Graph
  g2: Graph
  solver: Solver
  id: number[]

  constructor (elt1: string, elt2: string) {
    this.id = this.initialData.slice()
    this.solver = new Solver(2)
    this.solver.denseOutput = true
    this.g1 = new Graph('#' + elt1, 500, 350)
    this.g2 = new Graph('#' + elt2, 500, 350)
    document.getElementById(elt1).onmousemove = this.tweak
    document.getElementById(elt2).onmousemove = this.tweak
    this.g1.axes([-15, 5], [-0.5, 0.75])
    this.g2.axes([-0.5, 0.5], [-1.5, 1.5])
  }

  draw = () => {
    var apts: [number, number][] = []
    let bpts: [number, number][] = []
    this.solver.solve((x, y) => [y[1], x * y[0]], -15, this.id, 5, this.solver.grid(0.05, (x: number, y: number[]) => {
      apts.push([x, y[0]])
      bpts.push([y[0], y[1]])
    }))
    this.g1.draw(apts, 'Ai')
    this.g2.draw(bpts)
  }

  tweak = (e: MouseEvent) => {
    let x = e.offsetX - 500
    let p = x / 2000
    this.id[0] = this.initialData[0] + p
    let y = e.offsetY - 200
    let q = y / 2000
    this.id[1] = this.initialData[1] + q
    this.draw()
  }
}

export class Lorenz {
  initialData: number[] = [1, 1, 1]
  g1: Graph
  solver: Solver
  id: number[]

  static L = (sigma: number, rho: number, beta: number) => (x: number, y: number[]) => [
    sigma * (y[1] - y[0]),
    y[0] * (rho - y[2]) - y[1],
    y[0] * y[1] - beta * y[2] 
  ]

  constructor(elt: string) {
    this.g1 = new Graph('#' + elt, 500, 500)
    this.solver = new Solver(3)
    this.solver.denseOutput = true
    this.id = this.initialData.slice()
    document.getElementById(elt).onmousemove = this.tweak
    this.g1.axes([-30, 30], [0, 50])
    this.id = this.initialData.slice()
  }

  tweak = (e: MouseEvent) => {
    let xt = (e.offsetX - 500) / 2000
    let yt = (e.offsetY - 500) / 2000
    this.id[0] = this.initialData[0] + xt
    this.id[1] = this.initialData[1] + yt
    this.draw()
  }

  draw = () => {
    let xpts: [number, number][] = []
    this.solver.solve(Lorenz.L(10, 28, 8 / 3), 0, this.id, 20, this.solver.grid(0.005, (x, y) => {
      xpts.push([y[1], y[2]])
    }))
    this.g1.draw(xpts, 'Lo')
  }
}

export class PredatorPrey {
  sz = 400
  initialData = [1, 1]
  g: Graph
  phase: Graph
  solver = new Solver(2)

  static LV = (a: number, b: number, c: number, d: number) => (x: number, y: number[]) => [
    a * y[0] - b*y[0] * y[1],
    c * y[0] * y[1] - d * y[1]
  ]

  constructor(elt1: string, elt2: string) {
    this.solver.denseOutput = true
    this.g = new Graph('#' + elt1, this.sz, this.sz)
    this.phase = new Graph('#' + elt2, this.sz, this.sz)
    this.g.axes([0, 25],  [0, 4])
    this.phase.axes([0, 3], [0, 2])
    ; (<SVGElement> document.querySelector('#' + elt1 + ' svg')).onmousemove = this.tweak
    ; (<SVGElement> document.querySelector('#' + elt2 + ' svg')).onmousemove = this.tweak
  }

  tweak = (e: MouseEvent) => {
    let x = e.offsetX
    let y = e.offsetY
    this.initialData[0] = 3*x / this.sz
    this.initialData[1] = 2 - 2 * y / this.sz
    this.draw()
  }

  draw = () => {
    let xpts: [number, number][] = []
    let ypts: [number, number][] = []
    let tpts: [number, number][] = []
    this.solver.solve(PredatorPrey.LV(2 / 3, 4 / 3, 1, 1), 0, this.initialData, 25, this.solver.grid(0.01, (x, y) => {
      xpts.push([x, y[0]])
      ypts.push([x, y[1]])
      tpts.push([y[0], y[1]])
    }))
    this.g.draw(xpts, 'Pred')
    this.g.draw(ypts, 'Prey')
    this.phase.draw(tpts, 'Phase')
  }
}
