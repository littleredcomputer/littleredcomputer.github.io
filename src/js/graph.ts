import d3 = require('d3')

export class Graph {
  width: number;
  height: number;
  x: d3.scale.Linear<number, number>
  y: d3.scale.Linear<number, number>
  xAxis: d3.svg.Axis
  yAxis: d3.svg.Axis
  svg: d3.Selection<any>
  line: d3.svg.Line<[number, number]>
  wrap_pi: boolean = false
  points: boolean = false

  margin = { left: 30, right: 10, top: 5, bottom: 30 }

  constructor(element: string, width: number, height: number) {
    this.width = width - this.margin.left - this.margin.right
    this.height = height - this.margin.top - this.margin.bottom
    this.x = d3.scale.linear().range([0, this.width])
    this.y = d3.scale.linear().range([this.height, 0])
    this.xAxis = d3.svg.axis().scale(this.x).orient('bottom')
    this.yAxis = d3.svg.axis().scale(this.y).orient('left')
    this.svg = d3.select(element).append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')')
    this.line = d3.svg.line()
      .x(d => this.x(d[0]))
      .y(d => this.y(d[1]))
  }

  static wrap_pi = (a0: number) => {
    const PI = Math.PI
    let a = a0
    if (-PI < a || a >= PI) {
      a = a - 2 * PI * Math.floor(a / 2 / PI)
      a = a < PI ? a : a - 2 * PI
    }
    return a
  }

  axes = (xDomain: [number, number], yDomain: [number, number]) => {
    this.x.domain(xDomain)
    this.y.domain(yDomain)
    this.drawAxes()
  }

  drawAxes = () => {
    this.svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + this.height + ')')
      .call(this.xAxis)
    this.svg.append('g')
      .attr('class', 'y axis')
      .call(this.yAxis)
  }

  draw = (data: [number, number][], cls?: string) => {
    cls = cls || 'default'
    let xf = this.wrap_pi ? Graph.wrap_pi : x => x
    if (this.points) {
      this.svg.selectAll('circle.graph-point')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', d => this.x(d[0]))
      .attr('cy', d => this.y(xf(d[1])))
      .attr('r', 1)
    } else {
      this.svg.selectAll('path.' + cls).remove()
      this.svg.append('path').attr('class', cls)
        .datum(data)
        .classed({line: true, cls: true})
        .attr('d', this.line)
    }
  }
}
