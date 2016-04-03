var odex = require('odex');
var g = require('./graph');
var d3 = require('d3');

var g2 = new g.Graph({element: '#graph2', width: 500, height: 350, points: false});
g2.axes([-15,5], [-.5, .75]);
var g3 = new g.Graph({element: '#graph3', width: 500, height: 350, points: false});
g3.axes([-.5, .5], [-1.5, 1.5]);

var initialData = [0.2782174909, 0.2723742043];
var id = initialData.slice();

function drawAiry() {
  var s2 = new odex.Solver(2);
  s2.denseOutput = true;
  s2.absoluteTolerance = s2.relativeTolerance = 1e-10;
  var airy = function(x,y,yp) { yp[0] = y[1]; yp[1] = x * y[0]; }
  var apts = [];
  var bpts = [];
  s2.solve(airy, -15, id, 5, s2.grid(0.05, function(x, y) {
    apts.push([x,y[0]]);
    bpts.push([y[0],y[1]]);
  }));
  g2.draw(apts, 'Ai');
  //g2.draw(bpts, 'B');
  g3.draw(bpts);
}

function tweak(event) {
  var x = event.offsetX - 500;
  var p = x / 2000;
  id[0] = initialData[0] + p;
  var y = event.offsetY - 200;
  var q = y / 2000;
  id[1] = initialData[1] + q;
  drawAiry();
}

document.getElementById('graph2').onmousemove = tweak;
document.getElementById('graph3').onmousemove = tweak;
drawAiry();
