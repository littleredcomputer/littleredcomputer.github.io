var Graph = function(options) {
  this.options = options;
  var margin = { left: 30, right: 10, top: 5, bottom: 30 };
  this.width = options.width - margin.left - margin.right;
  this.height = options.height - margin.top - margin.bottom;
  this.x = d3.scale.linear().range([0, this.width]);
  this.y = d3.scale.linear().range([this.height, 0]);
  this.xAxis = d3.svg.axis().scale(this.x).orient('bottom');
  this.yAxis = d3.svg.axis().scale(this.y).orient('left');
  this.svg = d3.select(options.element).append('svg')
    .attr('width', options.width)
    .attr('height', options.height)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
};

Graph.prototype.wrap_pi = function(angle) {
  var pi = Math.PI;
  var a = angle;
  if (-pi > angle || angle >= pi) {
    a = angle - 2 * pi * Math.floor(angle / 2.0 / pi);
    a = a < pi ? a : a - 2 * pi;
  }
  return a;
};

Graph.prototype.draw = function(data) {
  var that = this;
  this.x.domain(d3.extent(data, function(d) { return d[0]; }));
  //this.y.domain(d3.extent(data, function(d) { return d[1]; }));
  this.y.domain([-Math.PI,Math.PI]);
  this.svg.append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,' + this.height + ')')
    .call(this.xAxis);
  this.svg.append('g')
    .attr('class', 'y axis')
    .call(this.yAxis);
  this.svg.selectAll('circle.graph-point')
    .data(data)
    .enter()
    .append('circle')
    .attr('cx', function(d) {
      return that.x(d[0]);
    })
    .attr('cy', function(d) {
      return that.y(that.wrap_pi(d[1]));
    })
    .attr('r', 1);
};
