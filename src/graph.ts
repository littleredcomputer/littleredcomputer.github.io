import {ScaleLinear, scaleLinear} from 'd3-scale'
import {BaseType, select} from 'd3-selection'
import {axisBottom, axisLeft} from 'd3-axis'
import {line} from 'd3-shape'

export class Graph {
  width: number
  height: number
  x: ScaleLinear<number, number>
  y: ScaleLinear<number, number>
  xAxis: d3.Axis<number>
  yAxis: d3.Axis<number>
  svg: d3.Selection<BaseType, {}, HTMLElement, any>
  line: d3.Line<[number, number]>
  wrap_pi: boolean = false
  points: boolean = false
  margin = { left: 30, right: 10, top: 5, bottom: 30 }
  constructor(element: string, width: number, height: number) {
    this.width = width - this.margin.left - this.margin.right
    this.height = height - this.margin.top - this.margin.bottom
    this.x = scaleLinear().range([0, this.width])
    this.y = scaleLinear().range([this.height, 0])

    this.xAxis = <d3.Axis<number>>axisBottom(this.x) // d3.svg.axis().scale(this.x).orient('bottom')
    this.yAxis = <d3.Axis<number>>axisLeft(this.y) // svg.axis().scale(this.y).orient('left')
    this.svg = select(element).append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')')
    this.line = line()
      .x(d => this.x(d[0]))
      .y(d => this.y(this.wrap_pi ? Graph.wrap_pi(d[1]) : d[1]))
  }

  static wrap_pi(a0: number) {
    const PI = Math.PI
    let a = a0
    if (-PI > a || a >= PI) {
      a = a - 2 * PI * Math.floor(a / 2 / PI)
      a = a < PI ? a : a - 2 * PI
    }
    return a
  }

  axes(xDomain: Array<number>, yDomain: number[]) {
    this.x.domain(xDomain)
    this.y.domain(yDomain)
    this.drawAxes()
  }

  drawAxes() {
    this.svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + this.height + ')')
      .call(this.xAxis)
    this.svg.append('g')
      .attr('class', 'y axis')
      .call(this.yAxis)
  }

  draw(data: [number, number][], cls?: string) {
    cls = cls || 'default'
    let xf: (a: number) => number = this.wrap_pi ? Graph.wrap_pi : x => x
    if (this.points) {
      this.svg.selectAll('circle.graph-point.' + cls).remove()
      this.svg.selectAll('circle.graph-point.' + cls)
        .data(data)
        .enter()
        .append('circle')
        .attr('cx', (d: number[]) => this.x(d[0]))
        .attr('cy', (d: number[]) => this.y(xf(d[1])))
        .attr('r', 1)
        .classed(cls + ' graph-point', true)
        .attr('class', 'graph-point ' + cls)
    } else {
      this.svg.selectAll('path.' + cls).remove()
      this.svg.append('path').attr('class', cls)
        .datum(data)
        .classed(cls + ' line', true)
        .attr('d', this.line)
    }
  }
}
