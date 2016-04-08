'use strict'
var d3 = require('d3')
var Graph = function (options) {
  var self = this
  this.options = options
  var margin = { left: 30, right: 10, top: 5, bottom: 30 }
  this.width = options.width - margin.left - margin.right
  this.height = options.height - margin.top - margin.bottom
  this.x = d3.scale.linear().range([0, this.width])
  this.y = d3.scale.linear().range([this.height, 0])
  this.xAxis = d3.svg.axis().scale(this.x).orient('bottom')
  this.yAxis = d3.svg.axis().scale(this.y).orient('left')
  this.svg = d3.select(options.element).append('svg')
    .attr('width', options.width)
    .attr('height', options.height)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
  this.line = d3.svg.line()
    .x(function (d) { return self.x(d[0]) })
    .y(function (d) { return self.y(d[1]) })
}

Graph.prototype.wrap_pi = function (angle) {
  var pi = Math.PI
  var a = angle
  if (-pi > angle || angle >= pi) {
    a = angle - 2 * pi * Math.floor(angle / 2.0 / pi)
    a = a < pi ? a : a - 2 * pi
  }
  return a
}

Graph.prototype.d0 = function (d) { return d[0] }
Graph.prototype.d1 = function (d) { return d[1] }

Graph.prototype.axesFromData = function (data) {
  this.x.domain(d3.extent(data, this.d0))
  if (this.options.wrap_pi) {
    this.y.domain([-Math.PI, Math.PI])
  } else {
    this.y.domain(d3.extent(data, this.d1))
  }
  this.drawAxes()
}

Graph.prototype.axes = function (xDomain, yDomain) {
  this.x.domain(xDomain)
  this.y.domain(yDomain)
  this.drawAxes()
}

Graph.prototype.drawAxes = function () {
  this.svg.append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,' + this.height + ')')
    .call(this.xAxis)
  this.svg.append('g')
    .attr('class', 'y axis')
    .call(this.yAxis)
}

Graph.prototype.draw = function (data, cls) {
  cls = cls || 'default'
  var xf = this.options.wrap_pi ? this.wrap_pi : function (x) { return x }
  var self = this
  if (this.options.points) {
    this.svg.selectAll('circle.graph-point')
    .data(data)
    .enter()
    .append('circle')
    .attr('cx', function (d) { return self.x(d[0]) })
    .attr('cy', function (d) { return self.y(xf(d[1])) })
    .attr('r', 1)
  } else {
    this.svg.selectAll('path.' + cls).remove()
    this.svg.append('path').attr('class', cls)
      .datum(data)
      .classed({line: true, cls: true})
      .attr('d', this.line)
  }
}
exports.Graph = Graph
