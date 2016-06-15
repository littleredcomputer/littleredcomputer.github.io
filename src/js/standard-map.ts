/**
  * Created by colin on 6/14/16.
  */

export class StandardMap {
  K: number
  PV: (x: number) => number
  twoPi = 2 * Math.PI

  constructor(K: number) {
    this.K = K
    this.PV = this.principal_value(this.twoPi)
    console.log('SM constructor')
  }

  principal_value(cuthigh: number): (v: number) => number {
    const cutlow = cuthigh - this.twoPi
    return function (x: number) {
      if (cutlow <= x && x < cuthigh) {
        return x
      }
      const y = x - this.twoPi * Math.floor(x / this.twoPi)
      return y < cuthigh ? y : y - this.twoPi
    }
  }

  run(theta: number, I: number, point: (x: number, y: number) => void, fail: () => void) {
    let nI = I + (this.K * Math.sin(theta))
    point(this.PV(theta + nI), this.PV(nI))
  }

  generate = function*(theta: number, I: number, n: number) {
    for (let i = 0; i < n; ++i) {
      yield [theta, I]
      let nI = I + (this.K * Math.sin(theta))
      theta = this.PV(theta + nI)
      I = this.PV(nI)
    }
  }

  callback = function(theta: number, I: number, n: number, callback: (x: number, y: number) => void) {
    for (let i = 0; i < n; ++i) {
      callback(theta, I)
      let nI = I + (this.K * Math.sin(theta))
      theta = this.PV(theta + nI)
      I = this.PV(nI)
    }
  }
}

export class ExploreMap {
  canvas: HTMLCanvasElement
  M: StandardMap
  context: CanvasRenderingContext2D

  constructor(canvas: string, M: StandardMap) {
    this.canvas = <HTMLCanvasElement> document.getElementById(canvas)
    this.M = M
    this.context = this.canvas.getContext('2d')
    let [w, h] = [2 * Math.PI, 2 * Math.PI]
    this.canvas.onmousedown = (e: MouseEvent) => {
      console.log(e)
      let [cx, cy] = [e.offsetX / this.context.canvas.width * w,
        h - e.offsetY / this.context.canvas.height * h]
      this.Explore(cx, cy)
    }
    this.context.fillStyle = 'red'
    this.context.scale(this.context.canvas.width / w, -this.context.canvas.height / h)
    this.context.translate(0, -h)
    this.context.fillStyle = 'green'
    this.context.fillRect(Math.PI, Math.PI, 0.05, 0.1)
  }

  pt(x: number, y: number) {
    this.context.fillStyle = 'rgba(0,0,255,0.3)'
    this.context.beginPath()
    this.context.arc(x, y, 0.01, 0, 2 * Math.PI)
    this.context.fill()
    this.context.closePath()
  }

  Explore0(x: number, y: number) {
    for (let i = 0; i < 1000; ++i) {
      this.M.run(x, y, (xp: number, yp: number) => {
        this.pt(xp, yp)
        x = xp
        y = yp
      }, () => {
        console.log('FAIL')
      })
    }
  }

  Explore1(x: number, y: number) {
    for ([x, y] of this.M.generate(x, y, 1000)) {
      this.pt(x, y)
    }
  }

  Explore(x: number, y: number) {
    this.M.callback(x, y, 1000, this.pt.bind(this))
  }
}
