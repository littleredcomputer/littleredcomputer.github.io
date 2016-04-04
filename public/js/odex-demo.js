// watchify odex-demo.js --s odexdemo -o odex-demo-bundle.js
var odex = require('odex')
var graph = require('./graph')

function airy () {
  var initialData = [0.2782174909, 0.2723742043]
  var id = initialData.slice()
  var g1 = new graph.Graph({element: '#graph1', width: 500, height: 350, points: false})
  var g2 = new graph.Graph({element: '#graph2', width: 500, height: 350, points: false})
  var s2 = new odex.Solver(2)
  s2.denseOutput = true
  s2.absoluteTolerance = s2.relativeTolerance = 1e-10
  var airy = function (x, y) { return [y[1], x * y[0]] }

  function setup () {
    g1.axes([-15, 5], [-0.5, 0.75])
    g2.axes([-0.5, 0.5], [-1.5, 1.5])
    id = initialData.slice()

    document.getElementById('graph1').onmousemove = tweak
    document.getElementById('graph2').onmousemove = tweak
  }

  function tweak (event) {
    var x = event.offsetX - 500
    var p = x / 2000
    id[0] = initialData[0] + p
    var y = event.offsetY - 200
    var q = y / 2000
    id[1] = initialData[1] + q
    draw()
  }

  function draw () {
    var apts = []
    var bpts = []
    s2.solve(airy, -15, id, 5, s2.grid(0.05, function (x, y) {
      apts.push([x, y[0]])
      bpts.push([y[0], y[1]])
    }))
    g1.draw(apts, 'Ai')
    g2.draw(bpts)
  }

  return {setup: setup, draw: draw}
}

function lorenz () {
  var initialData = [1, 1, 1]
  var id = initialData.slice
  var g1 = new graph.Graph({element: '#graph1', width: 500, height: 500, points: false})
  var s = new odex.Solver(3)
  s.denseOutput = true
  s.absoluteTolerance = s.relativeTolerance = 1e-10
  function L (sigma, rho, beta) {
    return function (x, y) {
      return [
        sigma * (y[1] - y[0]),
        y[0] * (rho - y[2]) - y[1],
        y[0] * y[1] - beta * y[2]
      ]
    }
  };
  function setup () {
    g1.axes([-30, 30], [0, 50])
    id = initialData.slice()
    document.getElementById('graph1').onmousemove = tweak
  }
  function tweak (event) {
    var xt = (event.offsetX - 500) / 2000
    var yt = (event.offsetY - 500) / 2000
    id[0] = initialData[0] + xt
    id[1] = initialData[1] + yt
    draw()
  }
  function draw () {
    var xpts = []
    s.solve(L(10, 28, 8 / 3), 0, id, 20, s.grid(0.005, function (x, y) {
      xpts.push([y[1], y[2]])
    }))
    g1.draw(xpts, 'Lo')
  }
  return {setup: setup, draw: draw}
}

function predatorPrey () {
  var sz = 400
  var initialData = [1, 1]
  var g = new graph.Graph({element: '#graph', width: sz, height: sz, points: false})
  var phase = new graph.Graph({element: '#phase', width: sz, height: sz, poitns: false})
  var s = new odex.Solver(2)
  s.denseOutput = true
  s.absoluteTolerance = s.relativeTolerance = 1e-6
  function LV (a, b, c, d) {
    return function (x, y) {
      return [
        a * y[0] - b * y[0] * y[1],
        c * y[0] * y[1] - d * y[1] ] } }
  function tweak (event) {
    var x = event.offsetX
    var y = event.offsetY
    initialData[0] = 3 * x / sz
    initialData[1] = 2 - 2 * y / sz
    console.log(initialData)
    draw()
  }
  function setup () {
    g.axes([0, 25], [0, 4])
    phase.axes([0, 3], [0, 2])
    document.querySelector('#graph svg').onmousemove = tweak
    document.querySelector('#phase svg').onmousemove = tweak
  }
  function draw () {
    var xpts = []
    var ypts = []
    var tpts = []
    s.solve(LV(2 / 3, 4 / 3, 1, 1), 0, initialData, 25, s.grid(0.01, function (x, y) {
      xpts.push([x, y[0]])
      ypts.push([x, y[1]])
      tpts.push([y[0], y[1]])
    }))
    g.draw(xpts, 'Pred')
    g.draw(ypts, 'Prey')
    phase.draw(tpts, 'Phase')
  }
  return {setup: setup, draw: draw}
}

module.exports = {
  airy: airy,
  lorenz: lorenz,
  predatorPrey: predatorPrey
}
