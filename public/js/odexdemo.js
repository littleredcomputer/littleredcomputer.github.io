(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.s = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Graph = void 0;
var d3_scale_1 = require("d3-scale");
var d3_selection_1 = require("d3-selection");
var d3_axis_1 = require("d3-axis");
var d3_shape_1 = require("d3-shape");
var Graph = /*#__PURE__*/function () {
  function Graph(element, width, height) {
    var _this = this;
    _classCallCheck(this, Graph);
    this.wrap_pi = false;
    this.points = false;
    this.margin = {
      left: 30,
      right: 10,
      top: 5,
      bottom: 30
    };
    this.width = width - this.margin.left - this.margin.right;
    this.height = height - this.margin.top - this.margin.bottom;
    this.x = (0, d3_scale_1.scaleLinear)().range([0, this.width]);
    this.y = (0, d3_scale_1.scaleLinear)().range([this.height, 0]);
    this.xAxis = (0, d3_axis_1.axisBottom)(this.x); // d3.svg.axis().scale(this.x).orient('bottom')
    this.yAxis = (0, d3_axis_1.axisLeft)(this.y); // svg.axis().scale(this.y).orient('left')
    this.svg = (0, d3_selection_1.select)(element).append('svg').attr('width', width).attr('height', height).append('g').attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');
    this.line = (0, d3_shape_1.line)().x(function (d) {
      return _this.x(d[0]);
    }).y(function (d) {
      return _this.y(_this.wrap_pi ? Graph.wrap_pi(d[1]) : d[1]);
    });
  }
  _createClass(Graph, [{
    key: "axes",
    value: function axes(xDomain, yDomain) {
      this.x.domain(xDomain);
      this.y.domain(yDomain);
      this.drawAxes();
    }
  }, {
    key: "drawAxes",
    value: function drawAxes() {
      this.svg.append('g').attr('class', 'x axis').attr('transform', 'translate(0,' + this.height + ')').call(this.xAxis);
      this.svg.append('g').attr('class', 'y axis').call(this.yAxis);
    }
  }, {
    key: "draw",
    value: function draw(data, cls) {
      var _this2 = this;
      cls = cls || 'default';
      var xf = this.wrap_pi ? Graph.wrap_pi : function (x) {
        return x;
      };
      if (this.points) {
        this.svg.selectAll('circle.graph-point.' + cls).remove();
        this.svg.selectAll('circle.graph-point.' + cls).data(data).enter().append('circle').attr('cx', function (d) {
          return _this2.x(d[0]);
        }).attr('cy', function (d) {
          return _this2.y(xf(d[1]));
        }).attr('r', 1).classed(cls + ' graph-point', true).attr('class', 'graph-point ' + cls);
      } else {
        this.svg.selectAll('path.' + cls).remove();
        this.svg.append('path').attr('class', cls).datum(data).classed(cls + ' line', true).attr('d', this.line);
      }
    }
  }], [{
    key: "wrap_pi",
    value: function wrap_pi(a0) {
      var PI = Math.PI;
      var a = a0;
      if (-PI > a || a >= PI) {
        a = a - 2 * PI * Math.floor(a / 2 / PI);
        a = a < PI ? a : a - 2 * PI;
      }
      return a;
    }
  }]);
  return Graph;
}();
exports.Graph = Graph;

},{"d3-axis":66,"d3-scale":122,"d3-selection":144,"d3-shape":217}],2:[function(require,module,exports){
"use strict";

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _iterableToArrayLimit(arr, i) { var _i = null == arr ? null : "undefined" != typeof Symbol && arr[Symbol.iterator] || arr["@@iterator"]; if (null != _i) { var _s, _e, _x, _r, _arr = [], _n = !0, _d = !1; try { if (_x = (_i = _i.call(arr)).next, 0 === i) { if (Object(_i) !== _i) return; _n = !1; } else for (; !(_n = (_s = _x.call(_i)).done) && (_arr.push(_s.value), _arr.length !== i); _n = !0); } catch (err) { _d = !0, _e = err; } finally { try { if (!_n && null != _i["return"] && (_r = _i["return"](), Object(_r) !== _r)) return; } finally { if (_d) throw _e; } } return _arr; } }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }
function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }
function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }
function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }
function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DrivenPendulum = exports.VanDerPol = exports.PredatorPrey = exports.Lorenz = exports.Airy = void 0;
var graph_1 = require("./graph");
var odex_1 = require("odex/src/odex");
var DifferentialEquationView = /*#__PURE__*/function () {
  // WHERE I LEFT OFF
  // now need something like getEq, which is applied to the result
  // of getParameters, to yield the equation to integrate
  function DifferentialEquationView(dy, dim, elements, width, height) {
    var _this = this;
    _classCallCheck(this, DifferentialEquationView);
    this.g = [];
    // eq: Derivative
    this.dt = 0.1;
    this.getParameters = function () {
      return [];
    };
    this.tweak = function (e) {
      return console.log('tweak unimplemented');
    };
    elements.map(function (e) {
      _this.solver = new odex_1.Solver(dy, dim);
      _this.g.push(new graph_1.Graph('#' + e, width, height));
      document.querySelector('#' + e + ' svg').onmousemove = function (e) {
        return _this.tweak(e);
      };
    });
  }
  _createClass(DifferentialEquationView, [{
    key: "phaseDraw",
    value: function phaseDraw(initialData, start, end, transform) {
      var xpts = [];
      var ypts = [];
      var tpts = [];
      var f = this.solver.integrate(start, initialData);
      for (var x = start; x <= end; x += this.dt) {
        var y = f(x);
        var ys = transform ? transform(y) : y;
        xpts.push([x, ys[0]]);
        ypts.push([x, ys[1]]);
        tpts.push([ys[0], ys[1]]);
      }
      this.g[0].draw(xpts, 'Predator');
      this.g[0].draw(ypts, 'Prey');
      this.g[1].draw(tpts, 'Phase');
    }
  }]);
  return DifferentialEquationView;
}();
var Airy = /*#__PURE__*/function (_DifferentialEquation) {
  _inherits(Airy, _DifferentialEquation);
  var _super = _createSuper(Airy);
  function Airy(elt0, elt1) {
    var _this2;
    _classCallCheck(this, Airy);
    _this2 = _super.call(this, function (x, y) {
      return [y[1], x * y[0]];
    }, 2, [elt0, elt1], 500, 350);
    _this2.initialData = [0.2782174909, 0.2723742043];
    _this2.tweak = function (e) {
      var x = e.offsetX - 500;
      var p = x / 2000;
      var y = e.offsetY - 200;
      var q = y / 2000;
      _this2.draw([_this2.initialData[0] + p, _this2.initialData[1] + q]);
    };
    _this2.g[0].axes([-15, 5], [-0.5, 0.75]);
    _this2.g[1].axes([-0.5, 0.5], [-1.5, 1.5]);
    return _this2;
  }
  _createClass(Airy, [{
    key: "draw",
    value: function draw() {
      var initialData = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.initialData;
      var apts = [];
      var bpts = [];
      var f = this.solver.integrate(-15, initialData);
      for (var x = -15; x < 5; x += 0.05) {
        var y = f(x);
        apts.push([x, y[0]]);
        bpts.push([y[0], y[1]]);
      }
      this.g[0].draw(apts, 'Ai');
      this.g[1].draw(bpts);
    }
  }]);
  return Airy;
}(DifferentialEquationView);
exports.Airy = Airy;
var Lorenz = /*#__PURE__*/function (_DifferentialEquation2) {
  _inherits(Lorenz, _DifferentialEquation2);
  var _super2 = _createSuper(Lorenz);
  function Lorenz(elt) {
    var _this3;
    _classCallCheck(this, Lorenz);
    _this3 = _super2.call(this, Lorenz.L(10, 28, 8 / 3), 3, [elt], 500, 500);
    _this3.initialData = [1, 1, 1];
    _this3.tweak = function (e) {
      var xt = (e.offsetX - 500) / 2000;
      var yt = (e.offsetY - 500) / 2000;
      _this3.draw([_this3.initialData[0] + xt, _this3.initialData[1] + yt, 1]);
    };
    _this3.g[0].axes([-30, 30], [0, 50]);
    return _this3;
  }
  _createClass(Lorenz, [{
    key: "draw",
    value: function draw() {
      var initialData = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.initialData;
      var xpts = [];
      var f = this.solver.integrate(0, initialData);
      for (var x = 0; x <= 20; x += 0.005) {
        var y = f(x);
        xpts.push([y[1], y[2]]);
      }
      this.g[0].draw(xpts, 'Lo');
    }
  }]);
  return Lorenz;
}(DifferentialEquationView);
exports.Lorenz = Lorenz;
Lorenz.L = function (sigma, rho, beta) {
  return function (x, y) {
    return [sigma * (y[1] - y[0]), y[0] * (rho - y[2]) - y[1], y[0] * y[1] - beta * y[2]];
  };
};
var PredatorPrey = /*#__PURE__*/function (_DifferentialEquation3) {
  _inherits(PredatorPrey, _DifferentialEquation3);
  var _super3 = _createSuper(PredatorPrey);
  function PredatorPrey(elt0, elt1) {
    var _this4;
    _classCallCheck(this, PredatorPrey);
    _this4 = _super3.call(this, PredatorPrey.LV(2 / 3, 4 / 3, 1, 1), 2, [elt0, elt1], PredatorPrey.sz, PredatorPrey.sz);
    _this4.end = 25;
    _this4.initialData = [1, 1];
    _this4.tweak = function (e) {
      var x = e.offsetX;
      var y = e.offsetY;
      _this4.draw([3 * x / PredatorPrey.sz, 2 - 2 * y / PredatorPrey.sz]);
    };
    _this4.g[0].axes([0, _this4.end], [0, 4]);
    _this4.g[1].axes([0, 3], [0, 2]);
    return _this4;
  }
  _createClass(PredatorPrey, [{
    key: "draw",
    value: function draw() {
      var initialData = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.initialData;
      this.phaseDraw(initialData, 0, this.end);
    }
  }]);
  return PredatorPrey;
}(DifferentialEquationView);
exports.PredatorPrey = PredatorPrey;
PredatorPrey.sz = 400;
PredatorPrey.LV = function (a, b, c, d) {
  return function (x, y) {
    return [a * y[0] - b * y[0] * y[1], c * y[0] * y[1] - d * y[1]];
  };
};
var VanDerPol = /*#__PURE__*/function (_DifferentialEquation4) {
  _inherits(VanDerPol, _DifferentialEquation4);
  var _super4 = _createSuper(VanDerPol);
  function VanDerPol(elt1, elt2) {
    var _this5;
    _classCallCheck(this, VanDerPol);
    _this5 = _super4.call(this, VanDerPol.V(3), 2, [elt1, elt2], VanDerPol.sz, VanDerPol.sz);
    _this5.initialData = [1, 1];
    _this5.end = 25;
    _this5.tweak = function (e) {
      var x = e.offsetX;
      var y = e.offsetY;
      _this5.draw([_this5.g[1].x.invert(x), _this5.g[1].y.invert(y)]);
    };
    _this5.g[0].axes([0, _this5.end], [-3, 3]);
    _this5.g[1].axes([-3, 3], [-3, 3]);
    return _this5;
  }
  _createClass(VanDerPol, [{
    key: "draw",
    value: function draw() {
      var initialData = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.initialData;
      this.phaseDraw(initialData, 0, this.end);
    }
  }]);
  return VanDerPol;
}(DifferentialEquationView);
exports.VanDerPol = VanDerPol;
VanDerPol.sz = 400;
VanDerPol.V = function (e) {
  return function (x, y) {
    return [y[1], ((1 - Math.pow(y[0], 2)) * y[1] - y[0]) / e];
  };
};
var DrivenPendulum = /*#__PURE__*/function (_DifferentialEquation5) {
  _inherits(DrivenPendulum, _DifferentialEquation5);
  var _super5 = _createSuper(DrivenPendulum);
  function DrivenPendulum(elt1, elt2) {
    var _this6;
    _classCallCheck(this, DrivenPendulum);
    _this6 = _super5.call(this, DrivenPendulum.F(1, 0.01, 2 * Math.sqrt(9.8), 0, 9.8), 3, [elt1, elt2], 2 * DrivenPendulum.sz, DrivenPendulum.sz);
    _this6.end = 30;
    _this6.dt = 0.04;
    _this6.initialData = [0, 1, 0];
    _this6.tweak = function (e) {
      var x = e.offsetX;
      var y = e.offsetY;
      _this6.draw([0, _this6.g[1].x.invert(x), _this6.g[1].y.invert(y)]);
    };
    _this6.g[0].axes([0, _this6.end], [-Math.PI, Math.PI]);
    _this6.g[0].wrap_pi = true;
    _this6.g[0].points = true;
    // this.g[1].axes([-Math.PI, Math.PI], [-Math.PI, Math.PI])
    _this6.g[1].axes([-10, 10], [-10, 10]);
    return _this6;
  }
  _createClass(DrivenPendulum, [{
    key: "draw",
    value: function draw() {
      var initialData = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.initialData;
      this.phaseDraw(initialData, 0, this.end, function (a) {
        return a.slice(1);
      });
    }
  }]);
  return DrivenPendulum;
}(DifferentialEquationView);
exports.DrivenPendulum = DrivenPendulum;
DrivenPendulum.sz = 400;
DrivenPendulum.F = function (l, a, omega, phi, g) {
  return function (x, _ref) {
    var _ref2 = _slicedToArray(_ref, 3),
      t = _ref2[0],
      theta = _ref2[1],
      thetadot = _ref2[2];
    var _1 = Math.sin(theta);
    return [1, thetadot, (_1 * Math.cos(omega * t + phi) * a * Math.pow(omega, 2) - _1 * g) / l];
  };
};
// export class AxisymmetricTop extends DifferentialEquationView {
// }

},{"./graph":1,"odex/src/odex":271}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.slice = exports.map = void 0;
var array = Array.prototype;
var slice = array.slice;
exports.slice = slice;
var map = array.map;
exports.map = map;

},{}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = ascending;
function ascending(a, b) {
  return a == null || b == null ? NaN : a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

},{}],5:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = bin;
var _array = require("./array.js");
var _bisect = _interopRequireDefault(require("./bisect.js"));
var _constant = _interopRequireDefault(require("./constant.js"));
var _extent = _interopRequireDefault(require("./extent.js"));
var _identity = _interopRequireDefault(require("./identity.js"));
var _nice3 = _interopRequireDefault(require("./nice.js"));
var _ticks = _interopRequireWildcard(require("./ticks.js"));
var _sturges = _interopRequireDefault(require("./threshold/sturges.js"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _iterableToArrayLimit(arr, i) { var _i = null == arr ? null : "undefined" != typeof Symbol && arr[Symbol.iterator] || arr["@@iterator"]; if (null != _i) { var _s, _e, _x, _r, _arr = [], _n = !0, _d = !1; try { if (_x = (_i = _i.call(arr)).next, 0 === i) { if (Object(_i) !== _i) return; _n = !1; } else for (; !(_n = (_s = _x.call(_i)).done) && (_arr.push(_s.value), _arr.length !== i); _n = !0); } catch (err) { _d = !0, _e = err; } finally { try { if (!_n && null != _i["return"] && (_r = _i["return"](), Object(_r) !== _r)) return; } finally { if (_d) throw _e; } } return _arr; } }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }
function bin() {
  var value = _identity["default"],
    domain = _extent["default"],
    threshold = _sturges["default"];
  function histogram(data) {
    if (!Array.isArray(data)) data = Array.from(data);
    var i,
      n = data.length,
      x,
      step,
      values = new Array(n);
    for (i = 0; i < n; ++i) {
      values[i] = value(data[i], i, data);
    }
    var xz = domain(values),
      x0 = xz[0],
      x1 = xz[1],
      tz = threshold(values, x0, x1);

    // Convert number of thresholds into uniform thresholds, and nice the
    // default domain accordingly.
    if (!Array.isArray(tz)) {
      var max = x1,
        tn = +tz;
      if (domain === _extent["default"]) {
        var _nice = (0, _nice3["default"])(x0, x1, tn);
        var _nice2 = _slicedToArray(_nice, 2);
        x0 = _nice2[0];
        x1 = _nice2[1];
      }
      tz = (0, _ticks["default"])(x0, x1, tn);

      // If the domain is aligned with the first tick (which it will by
      // default), then we can use quantization rather than bisection to bin
      // values, which is substantially faster.
      if (tz[0] <= x0) step = (0, _ticks.tickIncrement)(x0, x1, tn);

      // If the last threshold is coincident with the domain’s upper bound, the
      // last bin will be zero-width. If the default domain is used, and this
      // last threshold is coincident with the maximum input value, we can
      // extend the niced upper bound by one tick to ensure uniform bin widths;
      // otherwise, we simply remove the last threshold. Note that we don’t
      // coerce values or the domain to numbers, and thus must be careful to
      // compare order (>=) rather than strict equality (===)!
      if (tz[tz.length - 1] >= x1) {
        if (max >= x1 && domain === _extent["default"]) {
          var _step = (0, _ticks.tickIncrement)(x0, x1, tn);
          if (isFinite(_step)) {
            if (_step > 0) {
              x1 = (Math.floor(x1 / _step) + 1) * _step;
            } else if (_step < 0) {
              x1 = (Math.ceil(x1 * -_step) + 1) / -_step;
            }
          }
        } else {
          tz.pop();
        }
      }
    }

    // Remove any thresholds outside the domain.
    // Be careful not to mutate an array owned by the user!
    var m = tz.length,
      a = 0,
      b = m;
    while (tz[a] <= x0) ++a;
    while (tz[b - 1] > x1) --b;
    if (a || b < m) tz = tz.slice(a, b), m = b - a;
    var bins = new Array(m + 1),
      bin;

    // Initialize bins.
    for (i = 0; i <= m; ++i) {
      bin = bins[i] = [];
      bin.x0 = i > 0 ? tz[i - 1] : x0;
      bin.x1 = i < m ? tz[i] : x1;
    }

    // Assign data to bins by value, ignoring any outside the domain.
    if (isFinite(step)) {
      if (step > 0) {
        for (i = 0; i < n; ++i) {
          if ((x = values[i]) != null && x0 <= x && x <= x1) {
            bins[Math.min(m, Math.floor((x - x0) / step))].push(data[i]);
          }
        }
      } else if (step < 0) {
        for (i = 0; i < n; ++i) {
          if ((x = values[i]) != null && x0 <= x && x <= x1) {
            var j = Math.floor((x0 - x) * step);
            bins[Math.min(m, j + (tz[j] <= x))].push(data[i]); // handle off-by-one due to rounding
          }
        }
      }
    } else {
      for (i = 0; i < n; ++i) {
        if ((x = values[i]) != null && x0 <= x && x <= x1) {
          bins[(0, _bisect["default"])(tz, x, 0, m)].push(data[i]);
        }
      }
    }
    return bins;
  }
  histogram.value = function (_) {
    return arguments.length ? (value = typeof _ === "function" ? _ : (0, _constant["default"])(_), histogram) : value;
  };
  histogram.domain = function (_) {
    return arguments.length ? (domain = typeof _ === "function" ? _ : (0, _constant["default"])([_[0], _[1]]), histogram) : domain;
  };
  histogram.thresholds = function (_) {
    return arguments.length ? (threshold = typeof _ === "function" ? _ : (0, _constant["default"])(Array.isArray(_) ? _array.slice.call(_) : _), histogram) : threshold;
  };
  return histogram;
}

},{"./array.js":3,"./bisect.js":6,"./constant.js":9,"./extent.js":18,"./identity.js":25,"./nice.js":39,"./threshold/sturges.js":58,"./ticks.js":59}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.bisectRight = exports.bisectLeft = exports.bisectCenter = void 0;
var _ascending = _interopRequireDefault(require("./ascending.js"));
var _bisector = _interopRequireDefault(require("./bisector.js"));
var _number = _interopRequireDefault(require("./number.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
var ascendingBisect = (0, _bisector["default"])(_ascending["default"]);
var bisectRight = ascendingBisect.right;
exports.bisectRight = bisectRight;
var bisectLeft = ascendingBisect.left;
exports.bisectLeft = bisectLeft;
var bisectCenter = (0, _bisector["default"])(_number["default"]).center;
exports.bisectCenter = bisectCenter;
var _default = bisectRight;
exports["default"] = _default;

},{"./ascending.js":4,"./bisector.js":7,"./number.js":40}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = bisector;
var _ascending = _interopRequireDefault(require("./ascending.js"));
var _descending = _interopRequireDefault(require("./descending.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function bisector(f) {
  var compare1, compare2, delta;

  // If an accessor is specified, promote it to a comparator. In this case we
  // can test whether the search value is (self-) comparable. We can’t do this
  // for a comparator (except for specific, known comparators) because we can’t
  // tell if the comparator is symmetric, and an asymmetric comparator can’t be
  // used to test whether a single value is comparable.
  if (f.length !== 2) {
    compare1 = _ascending["default"];
    compare2 = function compare2(d, x) {
      return (0, _ascending["default"])(f(d), x);
    };
    delta = function delta(d, x) {
      return f(d) - x;
    };
  } else {
    compare1 = f === _ascending["default"] || f === _descending["default"] ? f : zero;
    compare2 = f;
    delta = f;
  }
  function left(a, x) {
    var lo = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    var hi = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : a.length;
    if (lo < hi) {
      if (compare1(x, x) !== 0) return hi;
      do {
        var mid = lo + hi >>> 1;
        if (compare2(a[mid], x) < 0) lo = mid + 1;else hi = mid;
      } while (lo < hi);
    }
    return lo;
  }
  function right(a, x) {
    var lo = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    var hi = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : a.length;
    if (lo < hi) {
      if (compare1(x, x) !== 0) return hi;
      do {
        var mid = lo + hi >>> 1;
        if (compare2(a[mid], x) <= 0) lo = mid + 1;else hi = mid;
      } while (lo < hi);
    }
    return lo;
  }
  function center(a, x) {
    var lo = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    var hi = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : a.length;
    var i = left(a, x, lo, hi - 1);
    return i > lo && delta(a[i - 1], x) > -delta(a[i], x) ? i - 1 : i;
  }
  return {
    left: left,
    center: center,
    right: right
  };
}
function zero() {
  return 0;
}

},{"./ascending.js":4,"./descending.js":13}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.blur = blur;
exports.blurImage = exports.blur2 = void 0;
function blur(values, r) {
  if (!((r = +r) >= 0)) throw new RangeError("invalid r");
  var length = values.length;
  if (!((length = Math.floor(length)) >= 0)) throw new RangeError("invalid length");
  if (!length || !r) return values;
  var blur = blurf(r);
  var temp = values.slice();
  blur(values, temp, 0, length, 1);
  blur(temp, values, 0, length, 1);
  blur(values, temp, 0, length, 1);
  return values;
}
var blur2 = Blur2(blurf);
exports.blur2 = blur2;
var blurImage = Blur2(blurfImage);
exports.blurImage = blurImage;
function Blur2(blur) {
  return function (data, rx) {
    var ry = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : rx;
    if (!((rx = +rx) >= 0)) throw new RangeError("invalid rx");
    if (!((ry = +ry) >= 0)) throw new RangeError("invalid ry");
    var values = data.data,
      width = data.width,
      height = data.height;
    if (!((width = Math.floor(width)) >= 0)) throw new RangeError("invalid width");
    if (!((height = Math.floor(height !== undefined ? height : values.length / width)) >= 0)) throw new RangeError("invalid height");
    if (!width || !height || !rx && !ry) return data;
    var blurx = rx && blur(rx);
    var blury = ry && blur(ry);
    var temp = values.slice();
    if (blurx && blury) {
      blurh(blurx, temp, values, width, height);
      blurh(blurx, values, temp, width, height);
      blurh(blurx, temp, values, width, height);
      blurv(blury, values, temp, width, height);
      blurv(blury, temp, values, width, height);
      blurv(blury, values, temp, width, height);
    } else if (blurx) {
      blurh(blurx, values, temp, width, height);
      blurh(blurx, temp, values, width, height);
      blurh(blurx, values, temp, width, height);
    } else if (blury) {
      blurv(blury, values, temp, width, height);
      blurv(blury, temp, values, width, height);
      blurv(blury, values, temp, width, height);
    }
    return data;
  };
}
function blurh(blur, T, S, w, h) {
  for (var y = 0, n = w * h; y < n;) {
    blur(T, S, y, y += w, 1);
  }
}
function blurv(blur, T, S, w, h) {
  for (var x = 0, n = w * h; x < w; ++x) {
    blur(T, S, x, x + n, w);
  }
}
function blurfImage(radius) {
  var blur = blurf(radius);
  return function (T, S, start, stop, step) {
    start <<= 2, stop <<= 2, step <<= 2;
    blur(T, S, start + 0, stop + 0, step);
    blur(T, S, start + 1, stop + 1, step);
    blur(T, S, start + 2, stop + 2, step);
    blur(T, S, start + 3, stop + 3, step);
  };
}

// Given a target array T, a source array S, sets each value T[i] to the average
// of {S[i - r], …, S[i], …, S[i + r]}, where r = ⌊radius⌋, start <= i < stop,
// for each i, i + step, i + 2 * step, etc., and where S[j] is clamped between
// S[start] (inclusive) and S[stop] (exclusive). If the given radius is not an
// integer, S[i - r - 1] and S[i + r + 1] are added to the sum, each weighted
// according to r - ⌊radius⌋.
function blurf(radius) {
  var radius0 = Math.floor(radius);
  if (radius0 === radius) return bluri(radius);
  var t = radius - radius0;
  var w = 2 * radius + 1;
  return function (T, S, start, stop, step) {
    // stop must be aligned!
    if (!((stop -= step) >= start)) return; // inclusive stop
    var sum = radius0 * S[start];
    var s0 = step * radius0;
    var s1 = s0 + step;
    for (var i = start, j = start + s0; i < j; i += step) {
      sum += S[Math.min(stop, i)];
    }
    for (var _i = start, _j = stop; _i <= _j; _i += step) {
      sum += S[Math.min(stop, _i + s0)];
      T[_i] = (sum + t * (S[Math.max(start, _i - s1)] + S[Math.min(stop, _i + s1)])) / w;
      sum -= S[Math.max(start, _i - s0)];
    }
  };
}

// Like blurf, but optimized for integer radius.
function bluri(radius) {
  var w = 2 * radius + 1;
  return function (T, S, start, stop, step) {
    // stop must be aligned!
    if (!((stop -= step) >= start)) return; // inclusive stop
    var sum = radius * S[start];
    var s = step * radius;
    for (var i = start, j = start + s; i < j; i += step) {
      sum += S[Math.min(stop, i)];
    }
    for (var _i2 = start, _j2 = stop; _i2 <= _j2; _i2 += step) {
      sum += S[Math.min(stop, _i2 + s)];
      T[_i2] = sum / w;
      sum -= S[Math.max(start, _i2 - s)];
    }
  };
}

},{}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = constant;
function constant(x) {
  return function () {
    return x;
  };
}

},{}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = count;
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function count(values, valueof) {
  var count = 0;
  if (valueof === undefined) {
    var _iterator = _createForOfIteratorHelper(values),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var value = _step.value;
        if (value != null && (value = +value) >= value) {
          ++count;
        }
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  } else {
    var index = -1;
    var _iterator2 = _createForOfIteratorHelper(values),
      _step2;
    try {
      for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
        var _value = _step2.value;
        if ((_value = valueof(_value, ++index, values)) != null && (_value = +_value) >= _value) {
          ++count;
        }
      }
    } catch (err) {
      _iterator2.e(err);
    } finally {
      _iterator2.f();
    }
  }
  return count;
}

},{}],11:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = cross;
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function length(array) {
  return array.length | 0;
}
function empty(length) {
  return !(length > 0);
}
function arrayify(values) {
  return _typeof(values) !== "object" || "length" in values ? values : Array.from(values);
}
function reducer(reduce) {
  return function (values) {
    return reduce.apply(void 0, _toConsumableArray(values));
  };
}
function cross() {
  for (var _len = arguments.length, values = new Array(_len), _key = 0; _key < _len; _key++) {
    values[_key] = arguments[_key];
  }
  var reduce = typeof values[values.length - 1] === "function" && reducer(values.pop());
  values = values.map(arrayify);
  var lengths = values.map(length);
  var j = values.length - 1;
  var index = new Array(j + 1).fill(0);
  var product = [];
  if (j < 0 || lengths.some(empty)) return product;
  while (true) {
    product.push(index.map(function (j, i) {
      return values[i][j];
    }));
    var i = j;
    while (++index[i] === lengths[i]) {
      if (i === 0) return reduce ? product.map(reduce) : product;
      index[i--] = 0;
    }
  }
}

},{}],12:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = cumsum;
function cumsum(values, valueof) {
  var sum = 0,
    index = 0;
  return Float64Array.from(values, valueof === undefined ? function (v) {
    return sum += +v || 0;
  } : function (v) {
    return sum += +valueof(v, index++, values) || 0;
  });
}

},{}],13:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = descending;
function descending(a, b) {
  return a == null || b == null ? NaN : b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
}

},{}],14:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = deviation;
var _variance = _interopRequireDefault(require("./variance.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function deviation(values, valueof) {
  var v = (0, _variance["default"])(values, valueof);
  return v ? Math.sqrt(v) : v;
}

},{"./variance.js":62}],15:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = difference;
var _internmap = require("internmap");
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function difference(values) {
  values = new _internmap.InternSet(values);
  for (var _len = arguments.length, others = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    others[_key - 1] = arguments[_key];
  }
  for (var _i = 0, _others = others; _i < _others.length; _i++) {
    var other = _others[_i];
    var _iterator = _createForOfIteratorHelper(other),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var value = _step.value;
        values["delete"](value);
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  }
  return values;
}

},{"internmap":270}],16:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = disjoint;
var _internmap = require("internmap");
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function disjoint(values, other) {
  var iterator = other[Symbol.iterator](),
    set = new _internmap.InternSet();
  var _iterator = _createForOfIteratorHelper(values),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var v = _step.value;
      if (set.has(v)) return false;
      var value = void 0,
        done = void 0;
      while (_iterator$next = iterator.next(), value = _iterator$next.value, done = _iterator$next.done, _iterator$next) {
        var _iterator$next;
        if (done) break;
        if (Object.is(v, value)) return false;
        set.add(value);
      }
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  return true;
}

},{"internmap":270}],17:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = every;
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function every(values, test) {
  if (typeof test !== "function") throw new TypeError("test is not a function");
  var index = -1;
  var _iterator = _createForOfIteratorHelper(values),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var value = _step.value;
      if (!test(value, ++index, values)) {
        return false;
      }
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  return true;
}

},{}],18:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = extent;
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function extent(values, valueof) {
  var min;
  var max;
  if (valueof === undefined) {
    var _iterator = _createForOfIteratorHelper(values),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var value = _step.value;
        if (value != null) {
          if (min === undefined) {
            if (value >= value) min = max = value;
          } else {
            if (min > value) min = value;
            if (max < value) max = value;
          }
        }
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  } else {
    var index = -1;
    var _iterator2 = _createForOfIteratorHelper(values),
      _step2;
    try {
      for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
        var _value = _step2.value;
        if ((_value = valueof(_value, ++index, values)) != null) {
          if (min === undefined) {
            if (_value >= _value) min = max = _value;
          } else {
            if (min > _value) min = _value;
            if (max < _value) max = _value;
          }
        }
      }
    } catch (err) {
      _iterator2.e(err);
    } finally {
      _iterator2.f();
    }
  }
  return [min, max];
}

},{}],19:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = filter;
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function filter(values, test) {
  if (typeof test !== "function") throw new TypeError("test is not a function");
  var array = [];
  var index = -1;
  var _iterator = _createForOfIteratorHelper(values),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var value = _step.value;
      if (test(value, ++index, values)) {
        array.push(value);
      }
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  return array;
}

},{}],20:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Adder = void 0;
exports.fcumsum = fcumsum;
exports.fsum = fsum;
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
// https://github.com/python/cpython/blob/a74eea238f5baba15797e2e8b570d153bc8690a7/Modules/mathmodule.c#L1423
var Adder = /*#__PURE__*/function () {
  function Adder() {
    _classCallCheck(this, Adder);
    this._partials = new Float64Array(32);
    this._n = 0;
  }
  _createClass(Adder, [{
    key: "add",
    value: function add(x) {
      var p = this._partials;
      var i = 0;
      for (var j = 0; j < this._n && j < 32; j++) {
        var y = p[j],
          hi = x + y,
          lo = Math.abs(x) < Math.abs(y) ? x - (hi - y) : y - (hi - x);
        if (lo) p[i++] = lo;
        x = hi;
      }
      p[i] = x;
      this._n = i + 1;
      return this;
    }
  }, {
    key: "valueOf",
    value: function valueOf() {
      var p = this._partials;
      var n = this._n,
        x,
        y,
        lo,
        hi = 0;
      if (n > 0) {
        hi = p[--n];
        while (n > 0) {
          x = hi;
          y = p[--n];
          hi = x + y;
          lo = y - (hi - x);
          if (lo) break;
        }
        if (n > 0 && (lo < 0 && p[n - 1] < 0 || lo > 0 && p[n - 1] > 0)) {
          y = lo * 2;
          x = hi + y;
          if (y == x - hi) hi = x;
        }
      }
      return hi;
    }
  }]);
  return Adder;
}();
exports.Adder = Adder;
function fsum(values, valueof) {
  var adder = new Adder();
  if (valueof === undefined) {
    var _iterator = _createForOfIteratorHelper(values),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var value = _step.value;
        if (value = +value) {
          adder.add(value);
        }
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  } else {
    var index = -1;
    var _iterator2 = _createForOfIteratorHelper(values),
      _step2;
    try {
      for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
        var _value = _step2.value;
        if (_value = +valueof(_value, ++index, values)) {
          adder.add(_value);
        }
      }
    } catch (err) {
      _iterator2.e(err);
    } finally {
      _iterator2.f();
    }
  }
  return +adder;
}
function fcumsum(values, valueof) {
  var adder = new Adder();
  var index = -1;
  return Float64Array.from(values, valueof === undefined ? function (v) {
    return adder.add(+v || 0);
  } : function (v) {
    return adder.add(+valueof(v, ++index, values) || 0);
  });
}

},{}],21:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = greatest;
var _ascending = _interopRequireDefault(require("./ascending.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function greatest(values) {
  var compare = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _ascending["default"];
  var max;
  var defined = false;
  if (compare.length === 1) {
    var maxValue;
    var _iterator = _createForOfIteratorHelper(values),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var element = _step.value;
        var value = compare(element);
        if (defined ? (0, _ascending["default"])(value, maxValue) > 0 : (0, _ascending["default"])(value, value) === 0) {
          max = element;
          maxValue = value;
          defined = true;
        }
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  } else {
    var _iterator2 = _createForOfIteratorHelper(values),
      _step2;
    try {
      for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
        var _value = _step2.value;
        if (defined ? compare(_value, max) > 0 : compare(_value, _value) === 0) {
          max = _value;
          defined = true;
        }
      }
    } catch (err) {
      _iterator2.e(err);
    } finally {
      _iterator2.f();
    }
  }
  return max;
}

},{"./ascending.js":4}],22:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = greatestIndex;
var _ascending = _interopRequireDefault(require("./ascending.js"));
var _maxIndex = _interopRequireDefault(require("./maxIndex.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function greatestIndex(values) {
  var compare = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _ascending["default"];
  if (compare.length === 1) return (0, _maxIndex["default"])(values, compare);
  var maxValue;
  var max = -1;
  var index = -1;
  var _iterator = _createForOfIteratorHelper(values),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var value = _step.value;
      ++index;
      if (max < 0 ? compare(value, value) === 0 : compare(value, maxValue) > 0) {
        maxValue = value;
        max = index;
      }
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  return max;
}

},{"./ascending.js":4,"./maxIndex.js":32}],23:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = group;
exports.flatGroup = flatGroup;
exports.flatRollup = flatRollup;
exports.groups = groups;
exports.index = index;
exports.indexes = indexes;
exports.rollup = rollup;
exports.rollups = rollups;
var _internmap = require("internmap");
var _identity = _interopRequireDefault(require("./identity.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e2) { throw _e2; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e3) { didErr = true; err = _e3; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _iterableToArrayLimit(arr, i) { var _i = null == arr ? null : "undefined" != typeof Symbol && arr[Symbol.iterator] || arr["@@iterator"]; if (null != _i) { var _s, _e, _x, _r, _arr = [], _n = !0, _d = !1; try { if (_x = (_i = _i.call(arr)).next, 0 === i) { if (Object(_i) !== _i) return; _n = !1; } else for (; !(_n = (_s = _x.call(_i)).done) && (_arr.push(_s.value), _arr.length !== i); _n = !0); } catch (err) { _d = !0, _e = err; } finally { try { if (!_n && null != _i["return"] && (_r = _i["return"](), Object(_r) !== _r)) return; } finally { if (_d) throw _e; } } return _arr; } }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }
function group(values) {
  for (var _len = arguments.length, keys = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    keys[_key - 1] = arguments[_key];
  }
  return nest(values, _identity["default"], _identity["default"], keys);
}
function groups(values) {
  for (var _len2 = arguments.length, keys = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    keys[_key2 - 1] = arguments[_key2];
  }
  return nest(values, Array.from, _identity["default"], keys);
}
function flatten(groups, keys) {
  for (var i = 1, n = keys.length; i < n; ++i) {
    groups = groups.flatMap(function (g) {
      return g.pop().map(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
          key = _ref2[0],
          value = _ref2[1];
        return [].concat(_toConsumableArray(g), [key, value]);
      });
    });
  }
  return groups;
}
function flatGroup(values) {
  for (var _len3 = arguments.length, keys = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
    keys[_key3 - 1] = arguments[_key3];
  }
  return flatten(groups.apply(void 0, [values].concat(keys)), keys);
}
function flatRollup(values, reduce) {
  for (var _len4 = arguments.length, keys = new Array(_len4 > 2 ? _len4 - 2 : 0), _key4 = 2; _key4 < _len4; _key4++) {
    keys[_key4 - 2] = arguments[_key4];
  }
  return flatten(rollups.apply(void 0, [values, reduce].concat(keys)), keys);
}
function rollup(values, reduce) {
  for (var _len5 = arguments.length, keys = new Array(_len5 > 2 ? _len5 - 2 : 0), _key5 = 2; _key5 < _len5; _key5++) {
    keys[_key5 - 2] = arguments[_key5];
  }
  return nest(values, _identity["default"], reduce, keys);
}
function rollups(values, reduce) {
  for (var _len6 = arguments.length, keys = new Array(_len6 > 2 ? _len6 - 2 : 0), _key6 = 2; _key6 < _len6; _key6++) {
    keys[_key6 - 2] = arguments[_key6];
  }
  return nest(values, Array.from, reduce, keys);
}
function index(values) {
  for (var _len7 = arguments.length, keys = new Array(_len7 > 1 ? _len7 - 1 : 0), _key7 = 1; _key7 < _len7; _key7++) {
    keys[_key7 - 1] = arguments[_key7];
  }
  return nest(values, _identity["default"], unique, keys);
}
function indexes(values) {
  for (var _len8 = arguments.length, keys = new Array(_len8 > 1 ? _len8 - 1 : 0), _key8 = 1; _key8 < _len8; _key8++) {
    keys[_key8 - 1] = arguments[_key8];
  }
  return nest(values, Array.from, unique, keys);
}
function unique(values) {
  if (values.length !== 1) throw new Error("duplicate key");
  return values[0];
}
function nest(values, map, reduce, keys) {
  return function regroup(values, i) {
    if (i >= keys.length) return reduce(values);
    var groups = new _internmap.InternMap();
    var keyof = keys[i++];
    var index = -1;
    var _iterator = _createForOfIteratorHelper(values),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var value = _step.value;
        var key = keyof(value, ++index, values);
        var _group = groups.get(key);
        if (_group) _group.push(value);else groups.set(key, [value]);
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
    var _iterator2 = _createForOfIteratorHelper(groups),
      _step2;
    try {
      for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
        var _step2$value = _slicedToArray(_step2.value, 2),
          _key9 = _step2$value[0],
          _values = _step2$value[1];
        groups.set(_key9, regroup(_values, i));
      }
    } catch (err) {
      _iterator2.e(err);
    } finally {
      _iterator2.f();
    }
    return map(groups);
  }(values, 0);
}

},{"./identity.js":25,"internmap":270}],24:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = groupSort;
var _ascending = _interopRequireDefault(require("./ascending.js"));
var _group = _interopRequireWildcard(require("./group.js"));
var _sort = _interopRequireDefault(require("./sort.js"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _iterableToArrayLimit(arr, i) { var _i = null == arr ? null : "undefined" != typeof Symbol && arr[Symbol.iterator] || arr["@@iterator"]; if (null != _i) { var _s, _e, _x, _r, _arr = [], _n = !0, _d = !1; try { if (_x = (_i = _i.call(arr)).next, 0 === i) { if (Object(_i) !== _i) return; _n = !1; } else for (; !(_n = (_s = _x.call(_i)).done) && (_arr.push(_s.value), _arr.length !== i); _n = !0); } catch (err) { _d = !0, _e = err; } finally { try { if (!_n && null != _i["return"] && (_r = _i["return"](), Object(_r) !== _r)) return; } finally { if (_d) throw _e; } } return _arr; } }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }
function groupSort(values, reduce, key) {
  return (reduce.length !== 2 ? (0, _sort["default"])((0, _group.rollup)(values, reduce, key), function (_ref, _ref2) {
    var _ref3 = _slicedToArray(_ref, 2),
      ak = _ref3[0],
      av = _ref3[1];
    var _ref4 = _slicedToArray(_ref2, 2),
      bk = _ref4[0],
      bv = _ref4[1];
    return (0, _ascending["default"])(av, bv) || (0, _ascending["default"])(ak, bk);
  }) : (0, _sort["default"])((0, _group["default"])(values, key), function (_ref5, _ref6) {
    var _ref7 = _slicedToArray(_ref5, 2),
      ak = _ref7[0],
      av = _ref7[1];
    var _ref8 = _slicedToArray(_ref6, 2),
      bk = _ref8[0],
      bv = _ref8[1];
    return reduce(av, bv) || (0, _ascending["default"])(ak, bk);
  })).map(function (_ref9) {
    var _ref10 = _slicedToArray(_ref9, 1),
      key = _ref10[0];
    return key;
  });
}

},{"./ascending.js":4,"./group.js":23,"./sort.js":52}],25:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = identity;
function identity(x) {
  return x;
}

},{}],26:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "Adder", {
  enumerable: true,
  get: function get() {
    return _fsum.Adder;
  }
});
Object.defineProperty(exports, "InternMap", {
  enumerable: true,
  get: function get() {
    return _internmap.InternMap;
  }
});
Object.defineProperty(exports, "InternSet", {
  enumerable: true,
  get: function get() {
    return _internmap.InternSet;
  }
});
Object.defineProperty(exports, "ascending", {
  enumerable: true,
  get: function get() {
    return _ascending["default"];
  }
});
Object.defineProperty(exports, "bin", {
  enumerable: true,
  get: function get() {
    return _bin["default"];
  }
});
Object.defineProperty(exports, "bisect", {
  enumerable: true,
  get: function get() {
    return _bisect["default"];
  }
});
Object.defineProperty(exports, "bisectCenter", {
  enumerable: true,
  get: function get() {
    return _bisect.bisectCenter;
  }
});
Object.defineProperty(exports, "bisectLeft", {
  enumerable: true,
  get: function get() {
    return _bisect.bisectLeft;
  }
});
Object.defineProperty(exports, "bisectRight", {
  enumerable: true,
  get: function get() {
    return _bisect.bisectRight;
  }
});
Object.defineProperty(exports, "bisector", {
  enumerable: true,
  get: function get() {
    return _bisector["default"];
  }
});
Object.defineProperty(exports, "blur", {
  enumerable: true,
  get: function get() {
    return _blur.blur;
  }
});
Object.defineProperty(exports, "blur2", {
  enumerable: true,
  get: function get() {
    return _blur.blur2;
  }
});
Object.defineProperty(exports, "blurImage", {
  enumerable: true,
  get: function get() {
    return _blur.blurImage;
  }
});
Object.defineProperty(exports, "count", {
  enumerable: true,
  get: function get() {
    return _count["default"];
  }
});
Object.defineProperty(exports, "cross", {
  enumerable: true,
  get: function get() {
    return _cross["default"];
  }
});
Object.defineProperty(exports, "cumsum", {
  enumerable: true,
  get: function get() {
    return _cumsum["default"];
  }
});
Object.defineProperty(exports, "descending", {
  enumerable: true,
  get: function get() {
    return _descending["default"];
  }
});
Object.defineProperty(exports, "deviation", {
  enumerable: true,
  get: function get() {
    return _deviation["default"];
  }
});
Object.defineProperty(exports, "difference", {
  enumerable: true,
  get: function get() {
    return _difference["default"];
  }
});
Object.defineProperty(exports, "disjoint", {
  enumerable: true,
  get: function get() {
    return _disjoint["default"];
  }
});
Object.defineProperty(exports, "every", {
  enumerable: true,
  get: function get() {
    return _every["default"];
  }
});
Object.defineProperty(exports, "extent", {
  enumerable: true,
  get: function get() {
    return _extent["default"];
  }
});
Object.defineProperty(exports, "fcumsum", {
  enumerable: true,
  get: function get() {
    return _fsum.fcumsum;
  }
});
Object.defineProperty(exports, "filter", {
  enumerable: true,
  get: function get() {
    return _filter["default"];
  }
});
Object.defineProperty(exports, "flatGroup", {
  enumerable: true,
  get: function get() {
    return _group.flatGroup;
  }
});
Object.defineProperty(exports, "flatRollup", {
  enumerable: true,
  get: function get() {
    return _group.flatRollup;
  }
});
Object.defineProperty(exports, "fsum", {
  enumerable: true,
  get: function get() {
    return _fsum.fsum;
  }
});
Object.defineProperty(exports, "greatest", {
  enumerable: true,
  get: function get() {
    return _greatest["default"];
  }
});
Object.defineProperty(exports, "greatestIndex", {
  enumerable: true,
  get: function get() {
    return _greatestIndex["default"];
  }
});
Object.defineProperty(exports, "group", {
  enumerable: true,
  get: function get() {
    return _group["default"];
  }
});
Object.defineProperty(exports, "groupSort", {
  enumerable: true,
  get: function get() {
    return _groupSort["default"];
  }
});
Object.defineProperty(exports, "groups", {
  enumerable: true,
  get: function get() {
    return _group.groups;
  }
});
Object.defineProperty(exports, "histogram", {
  enumerable: true,
  get: function get() {
    return _bin["default"];
  }
});
Object.defineProperty(exports, "index", {
  enumerable: true,
  get: function get() {
    return _group.index;
  }
});
Object.defineProperty(exports, "indexes", {
  enumerable: true,
  get: function get() {
    return _group.indexes;
  }
});
Object.defineProperty(exports, "intersection", {
  enumerable: true,
  get: function get() {
    return _intersection["default"];
  }
});
Object.defineProperty(exports, "least", {
  enumerable: true,
  get: function get() {
    return _least["default"];
  }
});
Object.defineProperty(exports, "leastIndex", {
  enumerable: true,
  get: function get() {
    return _leastIndex["default"];
  }
});
Object.defineProperty(exports, "map", {
  enumerable: true,
  get: function get() {
    return _map["default"];
  }
});
Object.defineProperty(exports, "max", {
  enumerable: true,
  get: function get() {
    return _max["default"];
  }
});
Object.defineProperty(exports, "maxIndex", {
  enumerable: true,
  get: function get() {
    return _maxIndex["default"];
  }
});
Object.defineProperty(exports, "mean", {
  enumerable: true,
  get: function get() {
    return _mean["default"];
  }
});
Object.defineProperty(exports, "median", {
  enumerable: true,
  get: function get() {
    return _median["default"];
  }
});
Object.defineProperty(exports, "medianIndex", {
  enumerable: true,
  get: function get() {
    return _median.medianIndex;
  }
});
Object.defineProperty(exports, "merge", {
  enumerable: true,
  get: function get() {
    return _merge["default"];
  }
});
Object.defineProperty(exports, "min", {
  enumerable: true,
  get: function get() {
    return _min["default"];
  }
});
Object.defineProperty(exports, "minIndex", {
  enumerable: true,
  get: function get() {
    return _minIndex["default"];
  }
});
Object.defineProperty(exports, "mode", {
  enumerable: true,
  get: function get() {
    return _mode["default"];
  }
});
Object.defineProperty(exports, "nice", {
  enumerable: true,
  get: function get() {
    return _nice["default"];
  }
});
Object.defineProperty(exports, "pairs", {
  enumerable: true,
  get: function get() {
    return _pairs["default"];
  }
});
Object.defineProperty(exports, "permute", {
  enumerable: true,
  get: function get() {
    return _permute["default"];
  }
});
Object.defineProperty(exports, "quantile", {
  enumerable: true,
  get: function get() {
    return _quantile["default"];
  }
});
Object.defineProperty(exports, "quantileIndex", {
  enumerable: true,
  get: function get() {
    return _quantile.quantileIndex;
  }
});
Object.defineProperty(exports, "quantileSorted", {
  enumerable: true,
  get: function get() {
    return _quantile.quantileSorted;
  }
});
Object.defineProperty(exports, "quickselect", {
  enumerable: true,
  get: function get() {
    return _quickselect["default"];
  }
});
Object.defineProperty(exports, "range", {
  enumerable: true,
  get: function get() {
    return _range["default"];
  }
});
Object.defineProperty(exports, "rank", {
  enumerable: true,
  get: function get() {
    return _rank["default"];
  }
});
Object.defineProperty(exports, "reduce", {
  enumerable: true,
  get: function get() {
    return _reduce["default"];
  }
});
Object.defineProperty(exports, "reverse", {
  enumerable: true,
  get: function get() {
    return _reverse["default"];
  }
});
Object.defineProperty(exports, "rollup", {
  enumerable: true,
  get: function get() {
    return _group.rollup;
  }
});
Object.defineProperty(exports, "rollups", {
  enumerable: true,
  get: function get() {
    return _group.rollups;
  }
});
Object.defineProperty(exports, "scan", {
  enumerable: true,
  get: function get() {
    return _scan["default"];
  }
});
Object.defineProperty(exports, "shuffle", {
  enumerable: true,
  get: function get() {
    return _shuffle["default"];
  }
});
Object.defineProperty(exports, "shuffler", {
  enumerable: true,
  get: function get() {
    return _shuffle.shuffler;
  }
});
Object.defineProperty(exports, "some", {
  enumerable: true,
  get: function get() {
    return _some["default"];
  }
});
Object.defineProperty(exports, "sort", {
  enumerable: true,
  get: function get() {
    return _sort["default"];
  }
});
Object.defineProperty(exports, "subset", {
  enumerable: true,
  get: function get() {
    return _subset["default"];
  }
});
Object.defineProperty(exports, "sum", {
  enumerable: true,
  get: function get() {
    return _sum["default"];
  }
});
Object.defineProperty(exports, "superset", {
  enumerable: true,
  get: function get() {
    return _superset["default"];
  }
});
Object.defineProperty(exports, "thresholdFreedmanDiaconis", {
  enumerable: true,
  get: function get() {
    return _freedmanDiaconis["default"];
  }
});
Object.defineProperty(exports, "thresholdScott", {
  enumerable: true,
  get: function get() {
    return _scott["default"];
  }
});
Object.defineProperty(exports, "thresholdSturges", {
  enumerable: true,
  get: function get() {
    return _sturges["default"];
  }
});
Object.defineProperty(exports, "tickIncrement", {
  enumerable: true,
  get: function get() {
    return _ticks.tickIncrement;
  }
});
Object.defineProperty(exports, "tickStep", {
  enumerable: true,
  get: function get() {
    return _ticks.tickStep;
  }
});
Object.defineProperty(exports, "ticks", {
  enumerable: true,
  get: function get() {
    return _ticks["default"];
  }
});
Object.defineProperty(exports, "transpose", {
  enumerable: true,
  get: function get() {
    return _transpose["default"];
  }
});
Object.defineProperty(exports, "union", {
  enumerable: true,
  get: function get() {
    return _union["default"];
  }
});
Object.defineProperty(exports, "variance", {
  enumerable: true,
  get: function get() {
    return _variance["default"];
  }
});
Object.defineProperty(exports, "zip", {
  enumerable: true,
  get: function get() {
    return _zip["default"];
  }
});
var _bisect = _interopRequireWildcard(require("./bisect.js"));
var _ascending = _interopRequireDefault(require("./ascending.js"));
var _bisector = _interopRequireDefault(require("./bisector.js"));
var _blur = require("./blur.js");
var _count = _interopRequireDefault(require("./count.js"));
var _cross = _interopRequireDefault(require("./cross.js"));
var _cumsum = _interopRequireDefault(require("./cumsum.js"));
var _descending = _interopRequireDefault(require("./descending.js"));
var _deviation = _interopRequireDefault(require("./deviation.js"));
var _extent = _interopRequireDefault(require("./extent.js"));
var _fsum = require("./fsum.js");
var _group = _interopRequireWildcard(require("./group.js"));
var _groupSort = _interopRequireDefault(require("./groupSort.js"));
var _bin = _interopRequireDefault(require("./bin.js"));
var _freedmanDiaconis = _interopRequireDefault(require("./threshold/freedmanDiaconis.js"));
var _scott = _interopRequireDefault(require("./threshold/scott.js"));
var _sturges = _interopRequireDefault(require("./threshold/sturges.js"));
var _max = _interopRequireDefault(require("./max.js"));
var _maxIndex = _interopRequireDefault(require("./maxIndex.js"));
var _mean = _interopRequireDefault(require("./mean.js"));
var _median = _interopRequireWildcard(require("./median.js"));
var _merge = _interopRequireDefault(require("./merge.js"));
var _min = _interopRequireDefault(require("./min.js"));
var _minIndex = _interopRequireDefault(require("./minIndex.js"));
var _mode = _interopRequireDefault(require("./mode.js"));
var _nice = _interopRequireDefault(require("./nice.js"));
var _pairs = _interopRequireDefault(require("./pairs.js"));
var _permute = _interopRequireDefault(require("./permute.js"));
var _quantile = _interopRequireWildcard(require("./quantile.js"));
var _quickselect = _interopRequireDefault(require("./quickselect.js"));
var _range = _interopRequireDefault(require("./range.js"));
var _rank = _interopRequireDefault(require("./rank.js"));
var _least = _interopRequireDefault(require("./least.js"));
var _leastIndex = _interopRequireDefault(require("./leastIndex.js"));
var _greatest = _interopRequireDefault(require("./greatest.js"));
var _greatestIndex = _interopRequireDefault(require("./greatestIndex.js"));
var _scan = _interopRequireDefault(require("./scan.js"));
var _shuffle = _interopRequireWildcard(require("./shuffle.js"));
var _sum = _interopRequireDefault(require("./sum.js"));
var _ticks = _interopRequireWildcard(require("./ticks.js"));
var _transpose = _interopRequireDefault(require("./transpose.js"));
var _variance = _interopRequireDefault(require("./variance.js"));
var _zip = _interopRequireDefault(require("./zip.js"));
var _every = _interopRequireDefault(require("./every.js"));
var _some = _interopRequireDefault(require("./some.js"));
var _filter = _interopRequireDefault(require("./filter.js"));
var _map = _interopRequireDefault(require("./map.js"));
var _reduce = _interopRequireDefault(require("./reduce.js"));
var _reverse = _interopRequireDefault(require("./reverse.js"));
var _sort = _interopRequireDefault(require("./sort.js"));
var _difference = _interopRequireDefault(require("./difference.js"));
var _disjoint = _interopRequireDefault(require("./disjoint.js"));
var _intersection = _interopRequireDefault(require("./intersection.js"));
var _subset = _interopRequireDefault(require("./subset.js"));
var _superset = _interopRequireDefault(require("./superset.js"));
var _union = _interopRequireDefault(require("./union.js"));
var _internmap = require("internmap");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

},{"./ascending.js":4,"./bin.js":5,"./bisect.js":6,"./bisector.js":7,"./blur.js":8,"./count.js":10,"./cross.js":11,"./cumsum.js":12,"./descending.js":13,"./deviation.js":14,"./difference.js":15,"./disjoint.js":16,"./every.js":17,"./extent.js":18,"./filter.js":19,"./fsum.js":20,"./greatest.js":21,"./greatestIndex.js":22,"./group.js":23,"./groupSort.js":24,"./intersection.js":27,"./least.js":28,"./leastIndex.js":29,"./map.js":30,"./max.js":31,"./maxIndex.js":32,"./mean.js":33,"./median.js":34,"./merge.js":35,"./min.js":36,"./minIndex.js":37,"./mode.js":38,"./nice.js":39,"./pairs.js":41,"./permute.js":42,"./quantile.js":43,"./quickselect.js":44,"./range.js":45,"./rank.js":46,"./reduce.js":47,"./reverse.js":48,"./scan.js":49,"./shuffle.js":50,"./some.js":51,"./sort.js":52,"./subset.js":53,"./sum.js":54,"./superset.js":55,"./threshold/freedmanDiaconis.js":56,"./threshold/scott.js":57,"./threshold/sturges.js":58,"./ticks.js":59,"./transpose.js":60,"./union.js":61,"./variance.js":62,"./zip.js":63,"internmap":270}],27:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = intersection;
var _internmap = require("internmap");
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function intersection(values) {
  for (var _len = arguments.length, others = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    others[_key - 1] = arguments[_key];
  }
  values = new _internmap.InternSet(values);
  others = others.map(set);
  var _iterator = _createForOfIteratorHelper(values),
    _step;
  try {
    out: for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var value = _step.value;
      var _iterator2 = _createForOfIteratorHelper(others),
        _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var other = _step2.value;
          if (!other.has(value)) {
            values["delete"](value);
            continue out;
          }
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  return values;
}
function set(values) {
  return values instanceof _internmap.InternSet ? values : new _internmap.InternSet(values);
}

},{"internmap":270}],28:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = least;
var _ascending = _interopRequireDefault(require("./ascending.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function least(values) {
  var compare = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _ascending["default"];
  var min;
  var defined = false;
  if (compare.length === 1) {
    var minValue;
    var _iterator = _createForOfIteratorHelper(values),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var element = _step.value;
        var value = compare(element);
        if (defined ? (0, _ascending["default"])(value, minValue) < 0 : (0, _ascending["default"])(value, value) === 0) {
          min = element;
          minValue = value;
          defined = true;
        }
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  } else {
    var _iterator2 = _createForOfIteratorHelper(values),
      _step2;
    try {
      for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
        var _value = _step2.value;
        if (defined ? compare(_value, min) < 0 : compare(_value, _value) === 0) {
          min = _value;
          defined = true;
        }
      }
    } catch (err) {
      _iterator2.e(err);
    } finally {
      _iterator2.f();
    }
  }
  return min;
}

},{"./ascending.js":4}],29:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = leastIndex;
var _ascending = _interopRequireDefault(require("./ascending.js"));
var _minIndex = _interopRequireDefault(require("./minIndex.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function leastIndex(values) {
  var compare = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _ascending["default"];
  if (compare.length === 1) return (0, _minIndex["default"])(values, compare);
  var minValue;
  var min = -1;
  var index = -1;
  var _iterator = _createForOfIteratorHelper(values),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var value = _step.value;
      ++index;
      if (min < 0 ? compare(value, value) === 0 : compare(value, minValue) < 0) {
        minValue = value;
        min = index;
      }
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  return min;
}

},{"./ascending.js":4,"./minIndex.js":37}],30:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = map;
function map(values, mapper) {
  if (typeof values[Symbol.iterator] !== "function") throw new TypeError("values is not iterable");
  if (typeof mapper !== "function") throw new TypeError("mapper is not a function");
  return Array.from(values, function (value, index) {
    return mapper(value, index, values);
  });
}

},{}],31:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = max;
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function max(values, valueof) {
  var max;
  if (valueof === undefined) {
    var _iterator = _createForOfIteratorHelper(values),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var value = _step.value;
        if (value != null && (max < value || max === undefined && value >= value)) {
          max = value;
        }
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  } else {
    var index = -1;
    var _iterator2 = _createForOfIteratorHelper(values),
      _step2;
    try {
      for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
        var _value = _step2.value;
        if ((_value = valueof(_value, ++index, values)) != null && (max < _value || max === undefined && _value >= _value)) {
          max = _value;
        }
      }
    } catch (err) {
      _iterator2.e(err);
    } finally {
      _iterator2.f();
    }
  }
  return max;
}

},{}],32:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = maxIndex;
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function maxIndex(values, valueof) {
  var max;
  var maxIndex = -1;
  var index = -1;
  if (valueof === undefined) {
    var _iterator = _createForOfIteratorHelper(values),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var value = _step.value;
        ++index;
        if (value != null && (max < value || max === undefined && value >= value)) {
          max = value, maxIndex = index;
        }
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  } else {
    var _iterator2 = _createForOfIteratorHelper(values),
      _step2;
    try {
      for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
        var _value = _step2.value;
        if ((_value = valueof(_value, ++index, values)) != null && (max < _value || max === undefined && _value >= _value)) {
          max = _value, maxIndex = index;
        }
      }
    } catch (err) {
      _iterator2.e(err);
    } finally {
      _iterator2.f();
    }
  }
  return maxIndex;
}

},{}],33:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = mean;
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function mean(values, valueof) {
  var count = 0;
  var sum = 0;
  if (valueof === undefined) {
    var _iterator = _createForOfIteratorHelper(values),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var value = _step.value;
        if (value != null && (value = +value) >= value) {
          ++count, sum += value;
        }
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  } else {
    var index = -1;
    var _iterator2 = _createForOfIteratorHelper(values),
      _step2;
    try {
      for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
        var _value = _step2.value;
        if ((_value = valueof(_value, ++index, values)) != null && (_value = +_value) >= _value) {
          ++count, sum += _value;
        }
      }
    } catch (err) {
      _iterator2.e(err);
    } finally {
      _iterator2.f();
    }
  }
  if (count) return sum / count;
}

},{}],34:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = median;
exports.medianIndex = medianIndex;
var _quantile = _interopRequireWildcard(require("./quantile.js"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function median(values, valueof) {
  return (0, _quantile["default"])(values, 0.5, valueof);
}
function medianIndex(values, valueof) {
  return (0, _quantile.quantileIndex)(values, 0.5, valueof);
}

},{"./quantile.js":43}],35:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = merge;
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, defineProperty = Object.defineProperty || function (obj, key, desc) { obj[key] = desc.value; }, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return defineProperty(generator, "_invoke", { value: makeInvokeMethod(innerFn, self, context) }), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == _typeof(value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; defineProperty(this, "_invoke", { value: function value(method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; } function maybeInvokeDelegate(delegate, context) { var methodName = context.method, method = delegate.iterator[methodName]; if (undefined === method) return context.delegate = null, "throw" === methodName && delegate.iterator["return"] && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method) || "return" !== methodName && (context.method = "throw", context.arg = new TypeError("The iterator does not provide a '" + methodName + "' method")), ContinueSentinel; var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), defineProperty(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (val) { var object = Object(val), keys = []; for (var key in object) keys.push(key); return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, "catch": function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }
var _marked = /*#__PURE__*/_regeneratorRuntime().mark(flatten);
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function flatten(arrays) {
  var _iterator, _step, array;
  return _regeneratorRuntime().wrap(function flatten$(_context) {
    while (1) switch (_context.prev = _context.next) {
      case 0:
        _iterator = _createForOfIteratorHelper(arrays);
        _context.prev = 1;
        _iterator.s();
      case 3:
        if ((_step = _iterator.n()).done) {
          _context.next = 8;
          break;
        }
        array = _step.value;
        return _context.delegateYield(array, "t0", 6);
      case 6:
        _context.next = 3;
        break;
      case 8:
        _context.next = 13;
        break;
      case 10:
        _context.prev = 10;
        _context.t1 = _context["catch"](1);
        _iterator.e(_context.t1);
      case 13:
        _context.prev = 13;
        _iterator.f();
        return _context.finish(13);
      case 16:
      case "end":
        return _context.stop();
    }
  }, _marked, null, [[1, 10, 13, 16]]);
}
function merge(arrays) {
  return Array.from(flatten(arrays));
}

},{}],36:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = min;
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function min(values, valueof) {
  var min;
  if (valueof === undefined) {
    var _iterator = _createForOfIteratorHelper(values),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var value = _step.value;
        if (value != null && (min > value || min === undefined && value >= value)) {
          min = value;
        }
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  } else {
    var index = -1;
    var _iterator2 = _createForOfIteratorHelper(values),
      _step2;
    try {
      for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
        var _value = _step2.value;
        if ((_value = valueof(_value, ++index, values)) != null && (min > _value || min === undefined && _value >= _value)) {
          min = _value;
        }
      }
    } catch (err) {
      _iterator2.e(err);
    } finally {
      _iterator2.f();
    }
  }
  return min;
}

},{}],37:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = minIndex;
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function minIndex(values, valueof) {
  var min;
  var minIndex = -1;
  var index = -1;
  if (valueof === undefined) {
    var _iterator = _createForOfIteratorHelper(values),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var value = _step.value;
        ++index;
        if (value != null && (min > value || min === undefined && value >= value)) {
          min = value, minIndex = index;
        }
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  } else {
    var _iterator2 = _createForOfIteratorHelper(values),
      _step2;
    try {
      for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
        var _value = _step2.value;
        if ((_value = valueof(_value, ++index, values)) != null && (min > _value || min === undefined && _value >= _value)) {
          min = _value, minIndex = index;
        }
      }
    } catch (err) {
      _iterator2.e(err);
    } finally {
      _iterator2.f();
    }
  }
  return minIndex;
}

},{}],38:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = mode;
var _internmap = require("internmap");
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArrayLimit(arr, i) { var _i = null == arr ? null : "undefined" != typeof Symbol && arr[Symbol.iterator] || arr["@@iterator"]; if (null != _i) { var _s, _e, _x, _r, _arr = [], _n = !0, _d = !1; try { if (_x = (_i = _i.call(arr)).next, 0 === i) { if (Object(_i) !== _i) return; _n = !1; } else for (; !(_n = (_s = _x.call(_i)).done) && (_arr.push(_s.value), _arr.length !== i); _n = !0); } catch (err) { _d = !0, _e = err; } finally { try { if (!_n && null != _i["return"] && (_r = _i["return"](), Object(_r) !== _r)) return; } finally { if (_d) throw _e; } } return _arr; } }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e2) { throw _e2; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e3) { didErr = true; err = _e3; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function mode(values, valueof) {
  var counts = new _internmap.InternMap();
  if (valueof === undefined) {
    var _iterator = _createForOfIteratorHelper(values),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var value = _step.value;
        if (value != null && value >= value) {
          counts.set(value, (counts.get(value) || 0) + 1);
        }
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  } else {
    var index = -1;
    var _iterator2 = _createForOfIteratorHelper(values),
      _step2;
    try {
      for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
        var _value = _step2.value;
        if ((_value = valueof(_value, ++index, values)) != null && _value >= _value) {
          counts.set(_value, (counts.get(_value) || 0) + 1);
        }
      }
    } catch (err) {
      _iterator2.e(err);
    } finally {
      _iterator2.f();
    }
  }
  var modeValue;
  var modeCount = 0;
  var _iterator3 = _createForOfIteratorHelper(counts),
    _step3;
  try {
    for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
      var _step3$value = _slicedToArray(_step3.value, 2),
        _value2 = _step3$value[0],
        count = _step3$value[1];
      if (count > modeCount) {
        modeCount = count;
        modeValue = _value2;
      }
    }
  } catch (err) {
    _iterator3.e(err);
  } finally {
    _iterator3.f();
  }
  return modeValue;
}

},{"internmap":270}],39:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = nice;
var _ticks = require("./ticks.js");
function nice(start, stop, count) {
  var prestep;
  while (true) {
    var step = (0, _ticks.tickIncrement)(start, stop, count);
    if (step === prestep || step === 0 || !isFinite(step)) {
      return [start, stop];
    } else if (step > 0) {
      start = Math.floor(start / step) * step;
      stop = Math.ceil(stop / step) * step;
    } else if (step < 0) {
      start = Math.ceil(start * step) / step;
      stop = Math.floor(stop * step) / step;
    }
    prestep = step;
  }
}

},{"./ticks.js":59}],40:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = number;
exports.numbers = numbers;
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, defineProperty = Object.defineProperty || function (obj, key, desc) { obj[key] = desc.value; }, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return defineProperty(generator, "_invoke", { value: makeInvokeMethod(innerFn, self, context) }), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == _typeof(value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; defineProperty(this, "_invoke", { value: function value(method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; } function maybeInvokeDelegate(delegate, context) { var methodName = context.method, method = delegate.iterator[methodName]; if (undefined === method) return context.delegate = null, "throw" === methodName && delegate.iterator["return"] && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method) || "return" !== methodName && (context.method = "throw", context.arg = new TypeError("The iterator does not provide a '" + methodName + "' method")), ContinueSentinel; var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), defineProperty(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (val) { var object = Object(val), keys = []; for (var key in object) keys.push(key); return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, "catch": function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }
var _marked = /*#__PURE__*/_regeneratorRuntime().mark(numbers);
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function number(x) {
  return x === null ? NaN : +x;
}
function numbers(values, valueof) {
  var _iterator, _step, value, index, _iterator2, _step2, _value;
  return _regeneratorRuntime().wrap(function numbers$(_context) {
    while (1) switch (_context.prev = _context.next) {
      case 0:
        if (!(valueof === undefined)) {
          _context.next = 21;
          break;
        }
        _iterator = _createForOfIteratorHelper(values);
        _context.prev = 2;
        _iterator.s();
      case 4:
        if ((_step = _iterator.n()).done) {
          _context.next = 11;
          break;
        }
        value = _step.value;
        if (!(value != null && (value = +value) >= value)) {
          _context.next = 9;
          break;
        }
        _context.next = 9;
        return value;
      case 9:
        _context.next = 4;
        break;
      case 11:
        _context.next = 16;
        break;
      case 13:
        _context.prev = 13;
        _context.t0 = _context["catch"](2);
        _iterator.e(_context.t0);
      case 16:
        _context.prev = 16;
        _iterator.f();
        return _context.finish(16);
      case 19:
        _context.next = 40;
        break;
      case 21:
        index = -1;
        _iterator2 = _createForOfIteratorHelper(values);
        _context.prev = 23;
        _iterator2.s();
      case 25:
        if ((_step2 = _iterator2.n()).done) {
          _context.next = 32;
          break;
        }
        _value = _step2.value;
        if (!((_value = valueof(_value, ++index, values)) != null && (_value = +_value) >= _value)) {
          _context.next = 30;
          break;
        }
        _context.next = 30;
        return _value;
      case 30:
        _context.next = 25;
        break;
      case 32:
        _context.next = 37;
        break;
      case 34:
        _context.prev = 34;
        _context.t1 = _context["catch"](23);
        _iterator2.e(_context.t1);
      case 37:
        _context.prev = 37;
        _iterator2.f();
        return _context.finish(37);
      case 40:
      case "end":
        return _context.stop();
    }
  }, _marked, null, [[2, 13, 16, 19], [23, 34, 37, 40]]);
}

},{}],41:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = pairs;
exports.pair = pair;
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function pairs(values) {
  var pairof = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : pair;
  var pairs = [];
  var previous;
  var first = false;
  var _iterator = _createForOfIteratorHelper(values),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var value = _step.value;
      if (first) pairs.push(pairof(previous, value));
      previous = value;
      first = true;
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  return pairs;
}
function pair(a, b) {
  return [a, b];
}

},{}],42:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = permute;
function permute(source, keys) {
  return Array.from(keys, function (key) {
    return source[key];
  });
}

},{}],43:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = quantile;
exports.quantileIndex = quantileIndex;
exports.quantileSorted = quantileSorted;
var _max = _interopRequireDefault(require("./max.js"));
var _maxIndex = _interopRequireDefault(require("./maxIndex.js"));
var _min = _interopRequireDefault(require("./min.js"));
var _minIndex = _interopRequireDefault(require("./minIndex.js"));
var _quickselect = _interopRequireDefault(require("./quickselect.js"));
var _number = _interopRequireWildcard(require("./number.js"));
var _sort = require("./sort.js");
var _greatest = _interopRequireDefault(require("./greatest.js"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function quantile(values, p, valueof) {
  values = Float64Array.from((0, _number.numbers)(values, valueof));
  if (!(n = values.length) || isNaN(p = +p)) return;
  if (p <= 0 || n < 2) return (0, _min["default"])(values);
  if (p >= 1) return (0, _max["default"])(values);
  var n,
    i = (n - 1) * p,
    i0 = Math.floor(i),
    value0 = (0, _max["default"])((0, _quickselect["default"])(values, i0).subarray(0, i0 + 1)),
    value1 = (0, _min["default"])(values.subarray(i0 + 1));
  return value0 + (value1 - value0) * (i - i0);
}
function quantileSorted(values, p) {
  var valueof = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _number["default"];
  if (!(n = values.length) || isNaN(p = +p)) return;
  if (p <= 0 || n < 2) return +valueof(values[0], 0, values);
  if (p >= 1) return +valueof(values[n - 1], n - 1, values);
  var n,
    i = (n - 1) * p,
    i0 = Math.floor(i),
    value0 = +valueof(values[i0], i0, values),
    value1 = +valueof(values[i0 + 1], i0 + 1, values);
  return value0 + (value1 - value0) * (i - i0);
}
function quantileIndex(values, p, valueof) {
  values = Float64Array.from((0, _number.numbers)(values, valueof));
  if (!(n = values.length) || isNaN(p = +p)) return;
  if (p <= 0 || n < 2) return (0, _minIndex["default"])(values);
  if (p >= 1) return (0, _maxIndex["default"])(values);
  var n,
    i = Math.floor((n - 1) * p),
    order = function order(i, j) {
      return (0, _sort.ascendingDefined)(values[i], values[j]);
    },
    index = (0, _quickselect["default"])(Uint32Array.from(values, function (_, i) {
      return i;
    }), i, 0, n - 1, order);
  return (0, _greatest["default"])(index.subarray(0, i + 1), function (i) {
    return values[i];
  });
}

},{"./greatest.js":21,"./max.js":31,"./maxIndex.js":32,"./min.js":36,"./minIndex.js":37,"./number.js":40,"./quickselect.js":44,"./sort.js":52}],44:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = quickselect;
var _sort = require("./sort.js");
// Based on https://github.com/mourner/quickselect
// ISC license, Copyright 2018 Vladimir Agafonkin.
function quickselect(array, k) {
  var left = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
  var right = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : Infinity;
  var compare = arguments.length > 4 ? arguments[4] : undefined;
  k = Math.floor(k);
  left = Math.floor(Math.max(0, left));
  right = Math.floor(Math.min(array.length - 1, right));
  if (!(left <= k && k <= right)) return array;
  compare = compare === undefined ? _sort.ascendingDefined : (0, _sort.compareDefined)(compare);
  while (right > left) {
    if (right - left > 600) {
      var n = right - left + 1;
      var m = k - left + 1;
      var z = Math.log(n);
      var s = 0.5 * Math.exp(2 * z / 3);
      var sd = 0.5 * Math.sqrt(z * s * (n - s) / n) * (m - n / 2 < 0 ? -1 : 1);
      var newLeft = Math.max(left, Math.floor(k - m * s / n + sd));
      var newRight = Math.min(right, Math.floor(k + (n - m) * s / n + sd));
      quickselect(array, k, newLeft, newRight, compare);
    }
    var t = array[k];
    var i = left;
    var j = right;
    swap(array, left, k);
    if (compare(array[right], t) > 0) swap(array, left, right);
    while (i < j) {
      swap(array, i, j), ++i, --j;
      while (compare(array[i], t) < 0) ++i;
      while (compare(array[j], t) > 0) --j;
    }
    if (compare(array[left], t) === 0) swap(array, left, j);else ++j, swap(array, j, right);
    if (j <= k) left = j + 1;
    if (k <= j) right = j - 1;
  }
  return array;
}
function swap(array, i, j) {
  var t = array[i];
  array[i] = array[j];
  array[j] = t;
}

},{"./sort.js":52}],45:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = range;
function range(start, stop, step) {
  start = +start, stop = +stop, step = (n = arguments.length) < 2 ? (stop = start, start = 0, 1) : n < 3 ? 1 : +step;
  var i = -1,
    n = Math.max(0, Math.ceil((stop - start) / step)) | 0,
    range = new Array(n);
  while (++i < n) {
    range[i] = start + i * step;
  }
  return range;
}

},{}],46:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = rank;
var _ascending = _interopRequireDefault(require("./ascending.js"));
var _sort = require("./sort.js");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function rank(values) {
  var valueof = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _ascending["default"];
  if (typeof values[Symbol.iterator] !== "function") throw new TypeError("values is not iterable");
  var V = Array.from(values);
  var R = new Float64Array(V.length);
  if (valueof.length !== 2) V = V.map(valueof), valueof = _ascending["default"];
  var compareIndex = function compareIndex(i, j) {
    return valueof(V[i], V[j]);
  };
  var k, r;
  Uint32Array.from(V, function (_, i) {
    return i;
  }).sort(valueof === _ascending["default"] ? function (i, j) {
    return (0, _sort.ascendingDefined)(V[i], V[j]);
  } : (0, _sort.compareDefined)(compareIndex)).forEach(function (j, i) {
    var c = compareIndex(j, k === undefined ? j : k);
    if (c >= 0) {
      if (k === undefined || c > 0) k = j, r = i;
      R[j] = r;
    } else {
      R[j] = NaN;
    }
  });
  return R;
}

},{"./ascending.js":4,"./sort.js":52}],47:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = reduce;
function reduce(values, reducer, value) {
  if (typeof reducer !== "function") throw new TypeError("reducer is not a function");
  var iterator = values[Symbol.iterator]();
  var done,
    next,
    index = -1;
  if (arguments.length < 3) {
    var _iterator$next = iterator.next();
    done = _iterator$next.done;
    value = _iterator$next.value;
    if (done) return;
    ++index;
  }
  while ((_iterator$next2 = iterator.next(), done = _iterator$next2.done, next = _iterator$next2.value), !done) {
    var _iterator$next2;
    value = reducer(value, next, ++index, values);
  }
  return value;
}

},{}],48:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = reverse;
function reverse(values) {
  if (typeof values[Symbol.iterator] !== "function") throw new TypeError("values is not iterable");
  return Array.from(values).reverse();
}

},{}],49:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = scan;
var _leastIndex = _interopRequireDefault(require("./leastIndex.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function scan(values, compare) {
  var index = (0, _leastIndex["default"])(values, compare);
  return index < 0 ? undefined : index;
}

},{"./leastIndex.js":29}],50:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
exports.shuffler = shuffler;
var _default = shuffler(Math.random);
exports["default"] = _default;
function shuffler(random) {
  return function shuffle(array) {
    var i0 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var i1 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : array.length;
    var m = i1 - (i0 = +i0);
    while (m) {
      var i = random() * m-- | 0,
        t = array[m + i0];
      array[m + i0] = array[i + i0];
      array[i + i0] = t;
    }
    return array;
  };
}

},{}],51:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = some;
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function some(values, test) {
  if (typeof test !== "function") throw new TypeError("test is not a function");
  var index = -1;
  var _iterator = _createForOfIteratorHelper(values),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var value = _step.value;
      if (test(value, ++index, values)) {
        return true;
      }
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  return false;
}

},{}],52:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ascendingDefined = ascendingDefined;
exports.compareDefined = compareDefined;
exports["default"] = sort;
var _ascending = _interopRequireDefault(require("./ascending.js"));
var _permute = _interopRequireDefault(require("./permute.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e2) { throw _e2; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e3) { didErr = true; err = _e3; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _iterableToArrayLimit(arr, i) { var _i = null == arr ? null : "undefined" != typeof Symbol && arr[Symbol.iterator] || arr["@@iterator"]; if (null != _i) { var _s, _e, _x, _r, _arr = [], _n = !0, _d = !1; try { if (_x = (_i = _i.call(arr)).next, 0 === i) { if (Object(_i) !== _i) return; _n = !1; } else for (; !(_n = (_s = _x.call(_i)).done) && (_arr.push(_s.value), _arr.length !== i); _n = !0); } catch (err) { _d = !0, _e = err; } finally { try { if (!_n && null != _i["return"] && (_r = _i["return"](), Object(_r) !== _r)) return; } finally { if (_d) throw _e; } } return _arr; } }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }
function sort(values) {
  for (var _len = arguments.length, F = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    F[_key - 1] = arguments[_key];
  }
  if (typeof values[Symbol.iterator] !== "function") throw new TypeError("values is not iterable");
  values = Array.from(values);
  var _F = F,
    _F2 = _slicedToArray(_F, 1),
    f = _F2[0];
  if (f && f.length !== 2 || F.length > 1) {
    var index = Uint32Array.from(values, function (d, i) {
      return i;
    });
    if (F.length > 1) {
      F = F.map(function (f) {
        return values.map(f);
      });
      index.sort(function (i, j) {
        var _iterator = _createForOfIteratorHelper(F),
          _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var _f = _step.value;
            var c = ascendingDefined(_f[i], _f[j]);
            if (c) return c;
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      });
    } else {
      f = values.map(f);
      index.sort(function (i, j) {
        return ascendingDefined(f[i], f[j]);
      });
    }
    return (0, _permute["default"])(values, index);
  }
  return values.sort(compareDefined(f));
}
function compareDefined() {
  var compare = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _ascending["default"];
  if (compare === _ascending["default"]) return ascendingDefined;
  if (typeof compare !== "function") throw new TypeError("compare is not a function");
  return function (a, b) {
    var x = compare(a, b);
    if (x || x === 0) return x;
    return (compare(b, b) === 0) - (compare(a, a) === 0);
  };
}
function ascendingDefined(a, b) {
  return (a == null || !(a >= a)) - (b == null || !(b >= b)) || (a < b ? -1 : a > b ? 1 : 0);
}

},{"./ascending.js":4,"./permute.js":42}],53:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = subset;
var _superset = _interopRequireDefault(require("./superset.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function subset(values, other) {
  return (0, _superset["default"])(other, values);
}

},{"./superset.js":55}],54:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = sum;
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function sum(values, valueof) {
  var sum = 0;
  if (valueof === undefined) {
    var _iterator = _createForOfIteratorHelper(values),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var value = _step.value;
        if (value = +value) {
          sum += value;
        }
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  } else {
    var index = -1;
    var _iterator2 = _createForOfIteratorHelper(values),
      _step2;
    try {
      for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
        var _value = _step2.value;
        if (_value = +valueof(_value, ++index, values)) {
          sum += _value;
        }
      }
    } catch (err) {
      _iterator2.e(err);
    } finally {
      _iterator2.f();
    }
  }
  return sum;
}

},{}],55:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = superset;
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function superset(values, other) {
  var iterator = values[Symbol.iterator](),
    set = new Set();
  var _iterator = _createForOfIteratorHelper(other),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var o = _step.value;
      var io = intern(o);
      if (set.has(io)) continue;
      var value = void 0,
        done = void 0;
      while (_iterator$next = iterator.next(), value = _iterator$next.value, done = _iterator$next.done, _iterator$next) {
        var _iterator$next;
        if (done) return false;
        var ivalue = intern(value);
        set.add(ivalue);
        if (Object.is(io, ivalue)) break;
      }
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  return true;
}
function intern(value) {
  return value !== null && _typeof(value) === "object" ? value.valueOf() : value;
}

},{}],56:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = thresholdFreedmanDiaconis;
var _count = _interopRequireDefault(require("../count.js"));
var _quantile = _interopRequireDefault(require("../quantile.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function thresholdFreedmanDiaconis(values, min, max) {
  return Math.ceil((max - min) / (2 * ((0, _quantile["default"])(values, 0.75) - (0, _quantile["default"])(values, 0.25)) * Math.pow((0, _count["default"])(values), -1 / 3)));
}

},{"../count.js":10,"../quantile.js":43}],57:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = thresholdScott;
var _count = _interopRequireDefault(require("../count.js"));
var _deviation = _interopRequireDefault(require("../deviation.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function thresholdScott(values, min, max) {
  return Math.ceil((max - min) * Math.cbrt((0, _count["default"])(values)) / (3.49 * (0, _deviation["default"])(values)));
}

},{"../count.js":10,"../deviation.js":14}],58:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = thresholdSturges;
var _count = _interopRequireDefault(require("../count.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function thresholdSturges(values) {
  return Math.ceil(Math.log((0, _count["default"])(values)) / Math.LN2) + 1;
}

},{"../count.js":10}],59:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = ticks;
exports.tickIncrement = tickIncrement;
exports.tickStep = tickStep;
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _iterableToArrayLimit(arr, i) { var _i = null == arr ? null : "undefined" != typeof Symbol && arr[Symbol.iterator] || arr["@@iterator"]; if (null != _i) { var _s, _e, _x, _r, _arr = [], _n = !0, _d = !1; try { if (_x = (_i = _i.call(arr)).next, 0 === i) { if (Object(_i) !== _i) return; _n = !1; } else for (; !(_n = (_s = _x.call(_i)).done) && (_arr.push(_s.value), _arr.length !== i); _n = !0); } catch (err) { _d = !0, _e = err; } finally { try { if (!_n && null != _i["return"] && (_r = _i["return"](), Object(_r) !== _r)) return; } finally { if (_d) throw _e; } } return _arr; } }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }
var e10 = Math.sqrt(50),
  e5 = Math.sqrt(10),
  e2 = Math.sqrt(2);
function tickSpec(start, stop, count) {
  var step = (stop - start) / Math.max(0, count),
    power = Math.floor(Math.log10(step)),
    error = step / Math.pow(10, power),
    factor = error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1;
  var i1, i2, inc;
  if (power < 0) {
    inc = Math.pow(10, -power) / factor;
    i1 = Math.round(start * inc);
    i2 = Math.round(stop * inc);
    if (i1 / inc < start) ++i1;
    if (i2 / inc > stop) --i2;
    inc = -inc;
  } else {
    inc = Math.pow(10, power) * factor;
    i1 = Math.round(start / inc);
    i2 = Math.round(stop / inc);
    if (i1 * inc < start) ++i1;
    if (i2 * inc > stop) --i2;
  }
  if (i2 < i1 && 0.5 <= count && count < 2) return tickSpec(start, stop, count * 2);
  return [i1, i2, inc];
}
function ticks(start, stop, count) {
  stop = +stop, start = +start, count = +count;
  if (!(count > 0)) return [];
  if (start === stop) return [start];
  var reverse = stop < start,
    _ref = reverse ? tickSpec(stop, start, count) : tickSpec(start, stop, count),
    _ref2 = _slicedToArray(_ref, 3),
    i1 = _ref2[0],
    i2 = _ref2[1],
    inc = _ref2[2];
  if (!(i2 >= i1)) return [];
  var n = i2 - i1 + 1,
    ticks = new Array(n);
  if (reverse) {
    if (inc < 0) for (var i = 0; i < n; ++i) ticks[i] = (i2 - i) / -inc;else for (var _i2 = 0; _i2 < n; ++_i2) ticks[_i2] = (i2 - _i2) * inc;
  } else {
    if (inc < 0) for (var _i3 = 0; _i3 < n; ++_i3) ticks[_i3] = (i1 + _i3) / -inc;else for (var _i4 = 0; _i4 < n; ++_i4) ticks[_i4] = (i1 + _i4) * inc;
  }
  return ticks;
}
function tickIncrement(start, stop, count) {
  stop = +stop, start = +start, count = +count;
  return tickSpec(start, stop, count)[2];
}
function tickStep(start, stop, count) {
  stop = +stop, start = +start, count = +count;
  var reverse = stop < start,
    inc = reverse ? tickIncrement(stop, start, count) : tickIncrement(start, stop, count);
  return (reverse ? -1 : 1) * (inc < 0 ? 1 / -inc : inc);
}

},{}],60:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = transpose;
var _min = _interopRequireDefault(require("./min.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function transpose(matrix) {
  if (!(n = matrix.length)) return [];
  for (var i = -1, m = (0, _min["default"])(matrix, length), transpose = new Array(m); ++i < m;) {
    for (var j = -1, n, row = transpose[i] = new Array(n); ++j < n;) {
      row[j] = matrix[j][i];
    }
  }
  return transpose;
}
function length(d) {
  return d.length;
}

},{"./min.js":36}],61:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = union;
var _internmap = require("internmap");
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function union() {
  var set = new _internmap.InternSet();
  for (var _len = arguments.length, others = new Array(_len), _key = 0; _key < _len; _key++) {
    others[_key] = arguments[_key];
  }
  for (var _i = 0, _others = others; _i < _others.length; _i++) {
    var other = _others[_i];
    var _iterator = _createForOfIteratorHelper(other),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var o = _step.value;
        set.add(o);
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  }
  return set;
}

},{"internmap":270}],62:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = variance;
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function variance(values, valueof) {
  var count = 0;
  var delta;
  var mean = 0;
  var sum = 0;
  if (valueof === undefined) {
    var _iterator = _createForOfIteratorHelper(values),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var value = _step.value;
        if (value != null && (value = +value) >= value) {
          delta = value - mean;
          mean += delta / ++count;
          sum += delta * (value - mean);
        }
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  } else {
    var index = -1;
    var _iterator2 = _createForOfIteratorHelper(values),
      _step2;
    try {
      for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
        var _value = _step2.value;
        if ((_value = valueof(_value, ++index, values)) != null && (_value = +_value) >= _value) {
          delta = _value - mean;
          mean += delta / ++count;
          sum += delta * (_value - mean);
        }
      }
    } catch (err) {
      _iterator2.e(err);
    } finally {
      _iterator2.f();
    }
  }
  if (count > 1) return sum / (count - 1);
}

},{}],63:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = zip;
var _transpose = _interopRequireDefault(require("./transpose.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function zip() {
  return (0, _transpose["default"])(arguments);
}

},{"./transpose.js":60}],64:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.axisBottom = axisBottom;
exports.axisLeft = axisLeft;
exports.axisRight = axisRight;
exports.axisTop = axisTop;
var _identity = _interopRequireDefault(require("./identity.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
var top = 1,
  right = 2,
  bottom = 3,
  left = 4,
  epsilon = 1e-6;
function translateX(x) {
  return "translate(" + x + ",0)";
}
function translateY(y) {
  return "translate(0," + y + ")";
}
function number(scale) {
  return function (d) {
    return +scale(d);
  };
}
function center(scale, offset) {
  offset = Math.max(0, scale.bandwidth() - offset * 2) / 2;
  if (scale.round()) offset = Math.round(offset);
  return function (d) {
    return +scale(d) + offset;
  };
}
function entering() {
  return !this.__axis;
}
function axis(orient, scale) {
  var tickArguments = [],
    tickValues = null,
    tickFormat = null,
    tickSizeInner = 6,
    tickSizeOuter = 6,
    tickPadding = 3,
    offset = typeof window !== "undefined" && window.devicePixelRatio > 1 ? 0 : 0.5,
    k = orient === top || orient === left ? -1 : 1,
    x = orient === left || orient === right ? "x" : "y",
    transform = orient === top || orient === bottom ? translateX : translateY;
  function axis(context) {
    var values = tickValues == null ? scale.ticks ? scale.ticks.apply(scale, tickArguments) : scale.domain() : tickValues,
      format = tickFormat == null ? scale.tickFormat ? scale.tickFormat.apply(scale, tickArguments) : _identity["default"] : tickFormat,
      spacing = Math.max(tickSizeInner, 0) + tickPadding,
      range = scale.range(),
      range0 = +range[0] + offset,
      range1 = +range[range.length - 1] + offset,
      position = (scale.bandwidth ? center : number)(scale.copy(), offset),
      selection = context.selection ? context.selection() : context,
      path = selection.selectAll(".domain").data([null]),
      tick = selection.selectAll(".tick").data(values, scale).order(),
      tickExit = tick.exit(),
      tickEnter = tick.enter().append("g").attr("class", "tick"),
      line = tick.select("line"),
      text = tick.select("text");
    path = path.merge(path.enter().insert("path", ".tick").attr("class", "domain").attr("stroke", "currentColor"));
    tick = tick.merge(tickEnter);
    line = line.merge(tickEnter.append("line").attr("stroke", "currentColor").attr(x + "2", k * tickSizeInner));
    text = text.merge(tickEnter.append("text").attr("fill", "currentColor").attr(x, k * spacing).attr("dy", orient === top ? "0em" : orient === bottom ? "0.71em" : "0.32em"));
    if (context !== selection) {
      path = path.transition(context);
      tick = tick.transition(context);
      line = line.transition(context);
      text = text.transition(context);
      tickExit = tickExit.transition(context).attr("opacity", epsilon).attr("transform", function (d) {
        return isFinite(d = position(d)) ? transform(d + offset) : this.getAttribute("transform");
      });
      tickEnter.attr("opacity", epsilon).attr("transform", function (d) {
        var p = this.parentNode.__axis;
        return transform((p && isFinite(p = p(d)) ? p : position(d)) + offset);
      });
    }
    tickExit.remove();
    path.attr("d", orient === left || orient === right ? tickSizeOuter ? "M" + k * tickSizeOuter + "," + range0 + "H" + offset + "V" + range1 + "H" + k * tickSizeOuter : "M" + offset + "," + range0 + "V" + range1 : tickSizeOuter ? "M" + range0 + "," + k * tickSizeOuter + "V" + offset + "H" + range1 + "V" + k * tickSizeOuter : "M" + range0 + "," + offset + "H" + range1);
    tick.attr("opacity", 1).attr("transform", function (d) {
      return transform(position(d) + offset);
    });
    line.attr(x + "2", k * tickSizeInner);
    text.attr(x, k * spacing).text(format);
    selection.filter(entering).attr("fill", "none").attr("font-size", 10).attr("font-family", "sans-serif").attr("text-anchor", orient === right ? "start" : orient === left ? "end" : "middle");
    selection.each(function () {
      this.__axis = position;
    });
  }
  axis.scale = function (_) {
    return arguments.length ? (scale = _, axis) : scale;
  };
  axis.ticks = function () {
    return tickArguments = Array.from(arguments), axis;
  };
  axis.tickArguments = function (_) {
    return arguments.length ? (tickArguments = _ == null ? [] : Array.from(_), axis) : tickArguments.slice();
  };
  axis.tickValues = function (_) {
    return arguments.length ? (tickValues = _ == null ? null : Array.from(_), axis) : tickValues && tickValues.slice();
  };
  axis.tickFormat = function (_) {
    return arguments.length ? (tickFormat = _, axis) : tickFormat;
  };
  axis.tickSize = function (_) {
    return arguments.length ? (tickSizeInner = tickSizeOuter = +_, axis) : tickSizeInner;
  };
  axis.tickSizeInner = function (_) {
    return arguments.length ? (tickSizeInner = +_, axis) : tickSizeInner;
  };
  axis.tickSizeOuter = function (_) {
    return arguments.length ? (tickSizeOuter = +_, axis) : tickSizeOuter;
  };
  axis.tickPadding = function (_) {
    return arguments.length ? (tickPadding = +_, axis) : tickPadding;
  };
  axis.offset = function (_) {
    return arguments.length ? (offset = +_, axis) : offset;
  };
  return axis;
}
function axisTop(scale) {
  return axis(top, scale);
}
function axisRight(scale) {
  return axis(right, scale);
}
function axisBottom(scale) {
  return axis(bottom, scale);
}
function axisLeft(scale) {
  return axis(left, scale);
}

},{"./identity.js":65}],65:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
function _default(x) {
  return x;
}

},{}],66:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "axisBottom", {
  enumerable: true,
  get: function get() {
    return _axis.axisBottom;
  }
});
Object.defineProperty(exports, "axisLeft", {
  enumerable: true,
  get: function get() {
    return _axis.axisLeft;
  }
});
Object.defineProperty(exports, "axisRight", {
  enumerable: true,
  get: function get() {
    return _axis.axisRight;
  }
});
Object.defineProperty(exports, "axisTop", {
  enumerable: true,
  get: function get() {
    return _axis.axisTop;
  }
});
var _axis = require("./axis.js");

},{"./axis.js":64}],67:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Color = Color;
exports.Rgb = Rgb;
exports.darker = exports.brighter = void 0;
exports["default"] = color;
exports.hsl = hsl;
exports.hslConvert = hslConvert;
exports.rgb = rgb;
exports.rgbConvert = rgbConvert;
var _define = _interopRequireWildcard(require("./define.js"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function Color() {}
var _darker = 0.7;
exports.darker = _darker;
var _brighter = 1 / _darker;
exports.brighter = _brighter;
var reI = "\\s*([+-]?\\d+)\\s*",
  reN = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*",
  reP = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*",
  reHex = /^#([0-9a-f]{3,8})$/,
  reRgbInteger = new RegExp("^rgb\\(".concat(reI, ",").concat(reI, ",").concat(reI, "\\)$")),
  reRgbPercent = new RegExp("^rgb\\(".concat(reP, ",").concat(reP, ",").concat(reP, "\\)$")),
  reRgbaInteger = new RegExp("^rgba\\(".concat(reI, ",").concat(reI, ",").concat(reI, ",").concat(reN, "\\)$")),
  reRgbaPercent = new RegExp("^rgba\\(".concat(reP, ",").concat(reP, ",").concat(reP, ",").concat(reN, "\\)$")),
  reHslPercent = new RegExp("^hsl\\(".concat(reN, ",").concat(reP, ",").concat(reP, "\\)$")),
  reHslaPercent = new RegExp("^hsla\\(".concat(reN, ",").concat(reP, ",").concat(reP, ",").concat(reN, "\\)$"));
var named = {
  aliceblue: 0xf0f8ff,
  antiquewhite: 0xfaebd7,
  aqua: 0x00ffff,
  aquamarine: 0x7fffd4,
  azure: 0xf0ffff,
  beige: 0xf5f5dc,
  bisque: 0xffe4c4,
  black: 0x000000,
  blanchedalmond: 0xffebcd,
  blue: 0x0000ff,
  blueviolet: 0x8a2be2,
  brown: 0xa52a2a,
  burlywood: 0xdeb887,
  cadetblue: 0x5f9ea0,
  chartreuse: 0x7fff00,
  chocolate: 0xd2691e,
  coral: 0xff7f50,
  cornflowerblue: 0x6495ed,
  cornsilk: 0xfff8dc,
  crimson: 0xdc143c,
  cyan: 0x00ffff,
  darkblue: 0x00008b,
  darkcyan: 0x008b8b,
  darkgoldenrod: 0xb8860b,
  darkgray: 0xa9a9a9,
  darkgreen: 0x006400,
  darkgrey: 0xa9a9a9,
  darkkhaki: 0xbdb76b,
  darkmagenta: 0x8b008b,
  darkolivegreen: 0x556b2f,
  darkorange: 0xff8c00,
  darkorchid: 0x9932cc,
  darkred: 0x8b0000,
  darksalmon: 0xe9967a,
  darkseagreen: 0x8fbc8f,
  darkslateblue: 0x483d8b,
  darkslategray: 0x2f4f4f,
  darkslategrey: 0x2f4f4f,
  darkturquoise: 0x00ced1,
  darkviolet: 0x9400d3,
  deeppink: 0xff1493,
  deepskyblue: 0x00bfff,
  dimgray: 0x696969,
  dimgrey: 0x696969,
  dodgerblue: 0x1e90ff,
  firebrick: 0xb22222,
  floralwhite: 0xfffaf0,
  forestgreen: 0x228b22,
  fuchsia: 0xff00ff,
  gainsboro: 0xdcdcdc,
  ghostwhite: 0xf8f8ff,
  gold: 0xffd700,
  goldenrod: 0xdaa520,
  gray: 0x808080,
  green: 0x008000,
  greenyellow: 0xadff2f,
  grey: 0x808080,
  honeydew: 0xf0fff0,
  hotpink: 0xff69b4,
  indianred: 0xcd5c5c,
  indigo: 0x4b0082,
  ivory: 0xfffff0,
  khaki: 0xf0e68c,
  lavender: 0xe6e6fa,
  lavenderblush: 0xfff0f5,
  lawngreen: 0x7cfc00,
  lemonchiffon: 0xfffacd,
  lightblue: 0xadd8e6,
  lightcoral: 0xf08080,
  lightcyan: 0xe0ffff,
  lightgoldenrodyellow: 0xfafad2,
  lightgray: 0xd3d3d3,
  lightgreen: 0x90ee90,
  lightgrey: 0xd3d3d3,
  lightpink: 0xffb6c1,
  lightsalmon: 0xffa07a,
  lightseagreen: 0x20b2aa,
  lightskyblue: 0x87cefa,
  lightslategray: 0x778899,
  lightslategrey: 0x778899,
  lightsteelblue: 0xb0c4de,
  lightyellow: 0xffffe0,
  lime: 0x00ff00,
  limegreen: 0x32cd32,
  linen: 0xfaf0e6,
  magenta: 0xff00ff,
  maroon: 0x800000,
  mediumaquamarine: 0x66cdaa,
  mediumblue: 0x0000cd,
  mediumorchid: 0xba55d3,
  mediumpurple: 0x9370db,
  mediumseagreen: 0x3cb371,
  mediumslateblue: 0x7b68ee,
  mediumspringgreen: 0x00fa9a,
  mediumturquoise: 0x48d1cc,
  mediumvioletred: 0xc71585,
  midnightblue: 0x191970,
  mintcream: 0xf5fffa,
  mistyrose: 0xffe4e1,
  moccasin: 0xffe4b5,
  navajowhite: 0xffdead,
  navy: 0x000080,
  oldlace: 0xfdf5e6,
  olive: 0x808000,
  olivedrab: 0x6b8e23,
  orange: 0xffa500,
  orangered: 0xff4500,
  orchid: 0xda70d6,
  palegoldenrod: 0xeee8aa,
  palegreen: 0x98fb98,
  paleturquoise: 0xafeeee,
  palevioletred: 0xdb7093,
  papayawhip: 0xffefd5,
  peachpuff: 0xffdab9,
  peru: 0xcd853f,
  pink: 0xffc0cb,
  plum: 0xdda0dd,
  powderblue: 0xb0e0e6,
  purple: 0x800080,
  rebeccapurple: 0x663399,
  red: 0xff0000,
  rosybrown: 0xbc8f8f,
  royalblue: 0x4169e1,
  saddlebrown: 0x8b4513,
  salmon: 0xfa8072,
  sandybrown: 0xf4a460,
  seagreen: 0x2e8b57,
  seashell: 0xfff5ee,
  sienna: 0xa0522d,
  silver: 0xc0c0c0,
  skyblue: 0x87ceeb,
  slateblue: 0x6a5acd,
  slategray: 0x708090,
  slategrey: 0x708090,
  snow: 0xfffafa,
  springgreen: 0x00ff7f,
  steelblue: 0x4682b4,
  tan: 0xd2b48c,
  teal: 0x008080,
  thistle: 0xd8bfd8,
  tomato: 0xff6347,
  turquoise: 0x40e0d0,
  violet: 0xee82ee,
  wheat: 0xf5deb3,
  white: 0xffffff,
  whitesmoke: 0xf5f5f5,
  yellow: 0xffff00,
  yellowgreen: 0x9acd32
};
(0, _define["default"])(Color, color, {
  copy: function copy(channels) {
    return Object.assign(new this.constructor(), this, channels);
  },
  displayable: function displayable() {
    return this.rgb().displayable();
  },
  hex: color_formatHex,
  // Deprecated! Use color.formatHex.
  formatHex: color_formatHex,
  formatHex8: color_formatHex8,
  formatHsl: color_formatHsl,
  formatRgb: color_formatRgb,
  toString: color_formatRgb
});
function color_formatHex() {
  return this.rgb().formatHex();
}
function color_formatHex8() {
  return this.rgb().formatHex8();
}
function color_formatHsl() {
  return hslConvert(this).formatHsl();
}
function color_formatRgb() {
  return this.rgb().formatRgb();
}
function color(format) {
  var m, l;
  format = (format + "").trim().toLowerCase();
  return (m = reHex.exec(format)) ? (l = m[1].length, m = parseInt(m[1], 16), l === 6 ? rgbn(m) // #ff0000
  : l === 3 ? new Rgb(m >> 8 & 0xf | m >> 4 & 0xf0, m >> 4 & 0xf | m & 0xf0, (m & 0xf) << 4 | m & 0xf, 1) // #f00
  : l === 8 ? rgba(m >> 24 & 0xff, m >> 16 & 0xff, m >> 8 & 0xff, (m & 0xff) / 0xff) // #ff000000
  : l === 4 ? rgba(m >> 12 & 0xf | m >> 8 & 0xf0, m >> 8 & 0xf | m >> 4 & 0xf0, m >> 4 & 0xf | m & 0xf0, ((m & 0xf) << 4 | m & 0xf) / 0xff) // #f000
  : null // invalid hex
  ) : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
  : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
  : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
  : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
  : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
  : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
  : named.hasOwnProperty(format) ? rgbn(named[format]) // eslint-disable-line no-prototype-builtins
  : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0) : null;
}
function rgbn(n) {
  return new Rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
}
function rgba(r, g, b, a) {
  if (a <= 0) r = g = b = NaN;
  return new Rgb(r, g, b, a);
}
function rgbConvert(o) {
  if (!(o instanceof Color)) o = color(o);
  if (!o) return new Rgb();
  o = o.rgb();
  return new Rgb(o.r, o.g, o.b, o.opacity);
}
function rgb(r, g, b, opacity) {
  return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
}
function Rgb(r, g, b, opacity) {
  this.r = +r;
  this.g = +g;
  this.b = +b;
  this.opacity = +opacity;
}
(0, _define["default"])(Rgb, rgb, (0, _define.extend)(Color, {
  brighter: function brighter(k) {
    k = k == null ? _brighter : Math.pow(_brighter, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  darker: function darker(k) {
    k = k == null ? _darker : Math.pow(_darker, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  rgb: function rgb() {
    return this;
  },
  clamp: function clamp() {
    return new Rgb(clampi(this.r), clampi(this.g), clampi(this.b), clampa(this.opacity));
  },
  displayable: function displayable() {
    return -0.5 <= this.r && this.r < 255.5 && -0.5 <= this.g && this.g < 255.5 && -0.5 <= this.b && this.b < 255.5 && 0 <= this.opacity && this.opacity <= 1;
  },
  hex: rgb_formatHex,
  // Deprecated! Use color.formatHex.
  formatHex: rgb_formatHex,
  formatHex8: rgb_formatHex8,
  formatRgb: rgb_formatRgb,
  toString: rgb_formatRgb
}));
function rgb_formatHex() {
  return "#".concat(hex(this.r)).concat(hex(this.g)).concat(hex(this.b));
}
function rgb_formatHex8() {
  return "#".concat(hex(this.r)).concat(hex(this.g)).concat(hex(this.b)).concat(hex((isNaN(this.opacity) ? 1 : this.opacity) * 255));
}
function rgb_formatRgb() {
  var a = clampa(this.opacity);
  return "".concat(a === 1 ? "rgb(" : "rgba(").concat(clampi(this.r), ", ").concat(clampi(this.g), ", ").concat(clampi(this.b)).concat(a === 1 ? ")" : ", ".concat(a, ")"));
}
function clampa(opacity) {
  return isNaN(opacity) ? 1 : Math.max(0, Math.min(1, opacity));
}
function clampi(value) {
  return Math.max(0, Math.min(255, Math.round(value) || 0));
}
function hex(value) {
  value = clampi(value);
  return (value < 16 ? "0" : "") + value.toString(16);
}
function hsla(h, s, l, a) {
  if (a <= 0) h = s = l = NaN;else if (l <= 0 || l >= 1) h = s = NaN;else if (s <= 0) h = NaN;
  return new Hsl(h, s, l, a);
}
function hslConvert(o) {
  if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Color)) o = color(o);
  if (!o) return new Hsl();
  if (o instanceof Hsl) return o;
  o = o.rgb();
  var r = o.r / 255,
    g = o.g / 255,
    b = o.b / 255,
    min = Math.min(r, g, b),
    max = Math.max(r, g, b),
    h = NaN,
    s = max - min,
    l = (max + min) / 2;
  if (s) {
    if (r === max) h = (g - b) / s + (g < b) * 6;else if (g === max) h = (b - r) / s + 2;else h = (r - g) / s + 4;
    s /= l < 0.5 ? max + min : 2 - max - min;
    h *= 60;
  } else {
    s = l > 0 && l < 1 ? 0 : h;
  }
  return new Hsl(h, s, l, o.opacity);
}
function hsl(h, s, l, opacity) {
  return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
}
function Hsl(h, s, l, opacity) {
  this.h = +h;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}
(0, _define["default"])(Hsl, hsl, (0, _define.extend)(Color, {
  brighter: function brighter(k) {
    k = k == null ? _brighter : Math.pow(_brighter, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  darker: function darker(k) {
    k = k == null ? _darker : Math.pow(_darker, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  rgb: function rgb() {
    var h = this.h % 360 + (this.h < 0) * 360,
      s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
      l = this.l,
      m2 = l + (l < 0.5 ? l : 1 - l) * s,
      m1 = 2 * l - m2;
    return new Rgb(hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2), hsl2rgb(h, m1, m2), hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2), this.opacity);
  },
  clamp: function clamp() {
    return new Hsl(clamph(this.h), clampt(this.s), clampt(this.l), clampa(this.opacity));
  },
  displayable: function displayable() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && 0 <= this.l && this.l <= 1 && 0 <= this.opacity && this.opacity <= 1;
  },
  formatHsl: function formatHsl() {
    var a = clampa(this.opacity);
    return "".concat(a === 1 ? "hsl(" : "hsla(").concat(clamph(this.h), ", ").concat(clampt(this.s) * 100, "%, ").concat(clampt(this.l) * 100, "%").concat(a === 1 ? ")" : ", ".concat(a, ")"));
  }
}));
function clamph(value) {
  value = (value || 0) % 360;
  return value < 0 ? value + 360 : value;
}
function clampt(value) {
  return Math.max(0, Math.min(1, value || 0));
}

/* From FvD 13.37, CSS Color Module Level 3 */
function hsl2rgb(h, m1, m2) {
  return (h < 60 ? m1 + (m2 - m1) * h / 60 : h < 180 ? m2 : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60 : m1) * 255;
}

},{"./define.js":69}],68:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Cubehelix = Cubehelix;
exports["default"] = cubehelix;
var _define = _interopRequireWildcard(require("./define.js"));
var _color = require("./color.js");
var _math = require("./math.js");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var A = -0.14861,
  B = +1.78277,
  C = -0.29227,
  D = -0.90649,
  E = +1.97294,
  ED = E * D,
  EB = E * B,
  BC_DA = B * C - D * A;
function cubehelixConvert(o) {
  if (o instanceof Cubehelix) return new Cubehelix(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof _color.Rgb)) o = (0, _color.rgbConvert)(o);
  var r = o.r / 255,
    g = o.g / 255,
    b = o.b / 255,
    l = (BC_DA * b + ED * r - EB * g) / (BC_DA + ED - EB),
    bl = b - l,
    k = (E * (g - l) - C * bl) / D,
    s = Math.sqrt(k * k + bl * bl) / (E * l * (1 - l)),
    // NaN if l=0 or l=1
    h = s ? Math.atan2(k, bl) * _math.degrees - 120 : NaN;
  return new Cubehelix(h < 0 ? h + 360 : h, s, l, o.opacity);
}
function cubehelix(h, s, l, opacity) {
  return arguments.length === 1 ? cubehelixConvert(h) : new Cubehelix(h, s, l, opacity == null ? 1 : opacity);
}
function Cubehelix(h, s, l, opacity) {
  this.h = +h;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}
(0, _define["default"])(Cubehelix, cubehelix, (0, _define.extend)(_color.Color, {
  brighter: function brighter(k) {
    k = k == null ? _color.brighter : Math.pow(_color.brighter, k);
    return new Cubehelix(this.h, this.s, this.l * k, this.opacity);
  },
  darker: function darker(k) {
    k = k == null ? _color.darker : Math.pow(_color.darker, k);
    return new Cubehelix(this.h, this.s, this.l * k, this.opacity);
  },
  rgb: function rgb() {
    var h = isNaN(this.h) ? 0 : (this.h + 120) * _math.radians,
      l = +this.l,
      a = isNaN(this.s) ? 0 : this.s * l * (1 - l),
      cosh = Math.cos(h),
      sinh = Math.sin(h);
    return new _color.Rgb(255 * (l + a * (A * cosh + B * sinh)), 255 * (l + a * (C * cosh + D * sinh)), 255 * (l + a * (E * cosh)), this.opacity);
  }
}));

},{"./color.js":67,"./define.js":69,"./math.js":72}],69:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
exports.extend = extend;
function _default(constructor, factory, prototype) {
  constructor.prototype = factory.prototype = prototype;
  prototype.constructor = constructor;
}
function extend(parent, definition) {
  var prototype = Object.create(parent.prototype);
  for (var key in definition) prototype[key] = definition[key];
  return prototype;
}

},{}],70:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "color", {
  enumerable: true,
  get: function get() {
    return _color["default"];
  }
});
Object.defineProperty(exports, "cubehelix", {
  enumerable: true,
  get: function get() {
    return _cubehelix["default"];
  }
});
Object.defineProperty(exports, "gray", {
  enumerable: true,
  get: function get() {
    return _lab.gray;
  }
});
Object.defineProperty(exports, "hcl", {
  enumerable: true,
  get: function get() {
    return _lab.hcl;
  }
});
Object.defineProperty(exports, "hsl", {
  enumerable: true,
  get: function get() {
    return _color.hsl;
  }
});
Object.defineProperty(exports, "lab", {
  enumerable: true,
  get: function get() {
    return _lab["default"];
  }
});
Object.defineProperty(exports, "lch", {
  enumerable: true,
  get: function get() {
    return _lab.lch;
  }
});
Object.defineProperty(exports, "rgb", {
  enumerable: true,
  get: function get() {
    return _color.rgb;
  }
});
var _color = _interopRequireWildcard(require("./color.js"));
var _lab = _interopRequireWildcard(require("./lab.js"));
var _cubehelix = _interopRequireDefault(require("./cubehelix.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

},{"./color.js":67,"./cubehelix.js":68,"./lab.js":71}],71:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Hcl = Hcl;
exports.Lab = Lab;
exports["default"] = lab;
exports.gray = gray;
exports.hcl = hcl;
exports.lch = lch;
var _define = _interopRequireWildcard(require("./define.js"));
var _color = require("./color.js");
var _math = require("./math.js");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
// https://observablehq.com/@mbostock/lab-and-rgb
var K = 18,
  Xn = 0.96422,
  Yn = 1,
  Zn = 0.82521,
  t0 = 4 / 29,
  t1 = 6 / 29,
  t2 = 3 * t1 * t1,
  t3 = t1 * t1 * t1;
function labConvert(o) {
  if (o instanceof Lab) return new Lab(o.l, o.a, o.b, o.opacity);
  if (o instanceof Hcl) return hcl2lab(o);
  if (!(o instanceof _color.Rgb)) o = (0, _color.rgbConvert)(o);
  var r = rgb2lrgb(o.r),
    g = rgb2lrgb(o.g),
    b = rgb2lrgb(o.b),
    y = xyz2lab((0.2225045 * r + 0.7168786 * g + 0.0606169 * b) / Yn),
    x,
    z;
  if (r === g && g === b) x = z = y;else {
    x = xyz2lab((0.4360747 * r + 0.3850649 * g + 0.1430804 * b) / Xn);
    z = xyz2lab((0.0139322 * r + 0.0971045 * g + 0.7141733 * b) / Zn);
  }
  return new Lab(116 * y - 16, 500 * (x - y), 200 * (y - z), o.opacity);
}
function gray(l, opacity) {
  return new Lab(l, 0, 0, opacity == null ? 1 : opacity);
}
function lab(l, a, b, opacity) {
  return arguments.length === 1 ? labConvert(l) : new Lab(l, a, b, opacity == null ? 1 : opacity);
}
function Lab(l, a, b, opacity) {
  this.l = +l;
  this.a = +a;
  this.b = +b;
  this.opacity = +opacity;
}
(0, _define["default"])(Lab, lab, (0, _define.extend)(_color.Color, {
  brighter: function brighter(k) {
    return new Lab(this.l + K * (k == null ? 1 : k), this.a, this.b, this.opacity);
  },
  darker: function darker(k) {
    return new Lab(this.l - K * (k == null ? 1 : k), this.a, this.b, this.opacity);
  },
  rgb: function rgb() {
    var y = (this.l + 16) / 116,
      x = isNaN(this.a) ? y : y + this.a / 500,
      z = isNaN(this.b) ? y : y - this.b / 200;
    x = Xn * lab2xyz(x);
    y = Yn * lab2xyz(y);
    z = Zn * lab2xyz(z);
    return new _color.Rgb(lrgb2rgb(3.1338561 * x - 1.6168667 * y - 0.4906146 * z), lrgb2rgb(-0.9787684 * x + 1.9161415 * y + 0.0334540 * z), lrgb2rgb(0.0719453 * x - 0.2289914 * y + 1.4052427 * z), this.opacity);
  }
}));
function xyz2lab(t) {
  return t > t3 ? Math.pow(t, 1 / 3) : t / t2 + t0;
}
function lab2xyz(t) {
  return t > t1 ? t * t * t : t2 * (t - t0);
}
function lrgb2rgb(x) {
  return 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
}
function rgb2lrgb(x) {
  return (x /= 255) <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}
function hclConvert(o) {
  if (o instanceof Hcl) return new Hcl(o.h, o.c, o.l, o.opacity);
  if (!(o instanceof Lab)) o = labConvert(o);
  if (o.a === 0 && o.b === 0) return new Hcl(NaN, 0 < o.l && o.l < 100 ? 0 : NaN, o.l, o.opacity);
  var h = Math.atan2(o.b, o.a) * _math.degrees;
  return new Hcl(h < 0 ? h + 360 : h, Math.sqrt(o.a * o.a + o.b * o.b), o.l, o.opacity);
}
function lch(l, c, h, opacity) {
  return arguments.length === 1 ? hclConvert(l) : new Hcl(h, c, l, opacity == null ? 1 : opacity);
}
function hcl(h, c, l, opacity) {
  return arguments.length === 1 ? hclConvert(h) : new Hcl(h, c, l, opacity == null ? 1 : opacity);
}
function Hcl(h, c, l, opacity) {
  this.h = +h;
  this.c = +c;
  this.l = +l;
  this.opacity = +opacity;
}
function hcl2lab(o) {
  if (isNaN(o.h)) return new Lab(o.l, 0, 0, o.opacity);
  var h = o.h * _math.radians;
  return new Lab(o.l, Math.cos(h) * o.c, Math.sin(h) * o.c, o.opacity);
}
(0, _define["default"])(Hcl, hcl, (0, _define.extend)(_color.Color, {
  brighter: function brighter(k) {
    return new Hcl(this.h, this.c, this.l + K * (k == null ? 1 : k), this.opacity);
  },
  darker: function darker(k) {
    return new Hcl(this.h, this.c, this.l - K * (k == null ? 1 : k), this.opacity);
  },
  rgb: function rgb() {
    return hcl2lab(this).rgb();
  }
}));

},{"./color.js":67,"./define.js":69,"./math.js":72}],72:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.radians = exports.degrees = void 0;
var radians = Math.PI / 180;
exports.radians = radians;
var degrees = 180 / Math.PI;
exports.degrees = degrees;

},{}],73:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = defaultLocale;
exports.formatPrefix = exports.format = void 0;
var _locale = _interopRequireDefault(require("./locale.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
var locale;
var format;
exports.format = format;
var formatPrefix;
exports.formatPrefix = formatPrefix;
defaultLocale({
  thousands: ",",
  grouping: [3],
  currency: ["$", ""]
});
function defaultLocale(definition) {
  locale = (0, _locale["default"])(definition);
  exports.format = format = locale.format;
  exports.formatPrefix = formatPrefix = locale.formatPrefix;
  return locale;
}

},{"./locale.js":85}],74:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _formatDecimal = require("./formatDecimal.js");
function _default(x) {
  return x = (0, _formatDecimal.formatDecimalParts)(Math.abs(x)), x ? x[1] : NaN;
}

},{"./formatDecimal.js":75}],75:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
exports.formatDecimalParts = formatDecimalParts;
function _default(x) {
  return Math.abs(x = Math.round(x)) >= 1e21 ? x.toLocaleString("en").replace(/,/g, "") : x.toString(10);
}

// Computes the decimal coefficient and exponent of the specified number x with
// significant digits p, where x is positive and p is in [1, 21] or undefined.
// For example, formatDecimalParts(1.23) returns ["123", 0].
function formatDecimalParts(x, p) {
  if ((i = (x = p ? x.toExponential(p - 1) : x.toExponential()).indexOf("e")) < 0) return null; // NaN, ±Infinity
  var i,
    coefficient = x.slice(0, i);

  // The string returned by toExponential either has the form \d\.\d+e[-+]\d+
  // (e.g., 1.2e+3) or the form \de[-+]\d+ (e.g., 1e+3).
  return [coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient, +x.slice(i + 1)];
}

},{}],76:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
function _default(grouping, thousands) {
  return function (value, width) {
    var i = value.length,
      t = [],
      j = 0,
      g = grouping[0],
      length = 0;
    while (i > 0 && g > 0) {
      if (length + g + 1 > width) g = Math.max(1, width - length);
      t.push(value.substring(i -= g, i + g));
      if ((length += g + 1) > width) break;
      g = grouping[j = (j + 1) % grouping.length];
    }
    return t.reverse().join(thousands);
  };
}

},{}],77:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
function _default(numerals) {
  return function (value) {
    return value.replace(/[0-9]/g, function (i) {
      return numerals[+i];
    });
  };
}

},{}],78:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
exports.prefixExponent = void 0;
var _formatDecimal = require("./formatDecimal.js");
var prefixExponent;
exports.prefixExponent = prefixExponent;
function _default(x, p) {
  var d = (0, _formatDecimal.formatDecimalParts)(x, p);
  if (!d) return x + "";
  var coefficient = d[0],
    exponent = d[1],
    i = exponent - (exports.prefixExponent = prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1,
    n = coefficient.length;
  return i === n ? coefficient : i > n ? coefficient + new Array(i - n + 1).join("0") : i > 0 ? coefficient.slice(0, i) + "." + coefficient.slice(i) : "0." + new Array(1 - i).join("0") + (0, _formatDecimal.formatDecimalParts)(x, Math.max(0, p + i - 1))[0]; // less than 1y!
}

},{"./formatDecimal.js":75}],79:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _formatDecimal = require("./formatDecimal.js");
function _default(x, p) {
  var d = (0, _formatDecimal.formatDecimalParts)(x, p);
  if (!d) return x + "";
  var coefficient = d[0],
    exponent = d[1];
  return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1) : coefficient + new Array(exponent - coefficient.length + 2).join("0");
}

},{"./formatDecimal.js":75}],80:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FormatSpecifier = FormatSpecifier;
exports["default"] = formatSpecifier;
// [[fill]align][sign][symbol][0][width][,][.precision][~][type]
var re = /^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i;
function formatSpecifier(specifier) {
  if (!(match = re.exec(specifier))) throw new Error("invalid format: " + specifier);
  var match;
  return new FormatSpecifier({
    fill: match[1],
    align: match[2],
    sign: match[3],
    symbol: match[4],
    zero: match[5],
    width: match[6],
    comma: match[7],
    precision: match[8] && match[8].slice(1),
    trim: match[9],
    type: match[10]
  });
}
formatSpecifier.prototype = FormatSpecifier.prototype; // instanceof

function FormatSpecifier(specifier) {
  this.fill = specifier.fill === undefined ? " " : specifier.fill + "";
  this.align = specifier.align === undefined ? ">" : specifier.align + "";
  this.sign = specifier.sign === undefined ? "-" : specifier.sign + "";
  this.symbol = specifier.symbol === undefined ? "" : specifier.symbol + "";
  this.zero = !!specifier.zero;
  this.width = specifier.width === undefined ? undefined : +specifier.width;
  this.comma = !!specifier.comma;
  this.precision = specifier.precision === undefined ? undefined : +specifier.precision;
  this.trim = !!specifier.trim;
  this.type = specifier.type === undefined ? "" : specifier.type + "";
}
FormatSpecifier.prototype.toString = function () {
  return this.fill + this.align + this.sign + this.symbol + (this.zero ? "0" : "") + (this.width === undefined ? "" : Math.max(1, this.width | 0)) + (this.comma ? "," : "") + (this.precision === undefined ? "" : "." + Math.max(0, this.precision | 0)) + (this.trim ? "~" : "") + this.type;
};

},{}],81:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
// Trims insignificant zeros, e.g., replaces 1.2000k with 1.2k.
function _default(s) {
  out: for (var n = s.length, i = 1, i0 = -1, i1; i < n; ++i) {
    switch (s[i]) {
      case ".":
        i0 = i1 = i;
        break;
      case "0":
        if (i0 === 0) i0 = i;
        i1 = i;
        break;
      default:
        if (!+s[i]) break out;
        if (i0 > 0) i0 = 0;
        break;
    }
  }
  return i0 > 0 ? s.slice(0, i0) + s.slice(i1 + 1) : s;
}

},{}],82:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _formatDecimal = _interopRequireDefault(require("./formatDecimal.js"));
var _formatPrefixAuto = _interopRequireDefault(require("./formatPrefixAuto.js"));
var _formatRounded = _interopRequireDefault(require("./formatRounded.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
var _default = {
  "%": function _(x, p) {
    return (x * 100).toFixed(p);
  },
  "b": function b(x) {
    return Math.round(x).toString(2);
  },
  "c": function c(x) {
    return x + "";
  },
  "d": _formatDecimal["default"],
  "e": function e(x, p) {
    return x.toExponential(p);
  },
  "f": function f(x, p) {
    return x.toFixed(p);
  },
  "g": function g(x, p) {
    return x.toPrecision(p);
  },
  "o": function o(x) {
    return Math.round(x).toString(8);
  },
  "p": function p(x, _p) {
    return (0, _formatRounded["default"])(x * 100, _p);
  },
  "r": _formatRounded["default"],
  "s": _formatPrefixAuto["default"],
  "X": function X(x) {
    return Math.round(x).toString(16).toUpperCase();
  },
  "x": function x(_x) {
    return Math.round(_x).toString(16);
  }
};
exports["default"] = _default;

},{"./formatDecimal.js":75,"./formatPrefixAuto.js":78,"./formatRounded.js":79}],83:[function(require,module,exports){
arguments[4][65][0].apply(exports,arguments)
},{"dup":65}],84:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "FormatSpecifier", {
  enumerable: true,
  get: function get() {
    return _formatSpecifier.FormatSpecifier;
  }
});
Object.defineProperty(exports, "format", {
  enumerable: true,
  get: function get() {
    return _defaultLocale.format;
  }
});
Object.defineProperty(exports, "formatDefaultLocale", {
  enumerable: true,
  get: function get() {
    return _defaultLocale["default"];
  }
});
Object.defineProperty(exports, "formatLocale", {
  enumerable: true,
  get: function get() {
    return _locale["default"];
  }
});
Object.defineProperty(exports, "formatPrefix", {
  enumerable: true,
  get: function get() {
    return _defaultLocale.formatPrefix;
  }
});
Object.defineProperty(exports, "formatSpecifier", {
  enumerable: true,
  get: function get() {
    return _formatSpecifier["default"];
  }
});
Object.defineProperty(exports, "precisionFixed", {
  enumerable: true,
  get: function get() {
    return _precisionFixed["default"];
  }
});
Object.defineProperty(exports, "precisionPrefix", {
  enumerable: true,
  get: function get() {
    return _precisionPrefix["default"];
  }
});
Object.defineProperty(exports, "precisionRound", {
  enumerable: true,
  get: function get() {
    return _precisionRound["default"];
  }
});
var _defaultLocale = _interopRequireWildcard(require("./defaultLocale.js"));
var _locale = _interopRequireDefault(require("./locale.js"));
var _formatSpecifier = _interopRequireWildcard(require("./formatSpecifier.js"));
var _precisionFixed = _interopRequireDefault(require("./precisionFixed.js"));
var _precisionPrefix = _interopRequireDefault(require("./precisionPrefix.js"));
var _precisionRound = _interopRequireDefault(require("./precisionRound.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

},{"./defaultLocale.js":73,"./formatSpecifier.js":80,"./locale.js":85,"./precisionFixed.js":86,"./precisionPrefix.js":87,"./precisionRound.js":88}],85:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _exponent = _interopRequireDefault(require("./exponent.js"));
var _formatGroup = _interopRequireDefault(require("./formatGroup.js"));
var _formatNumerals = _interopRequireDefault(require("./formatNumerals.js"));
var _formatSpecifier = _interopRequireDefault(require("./formatSpecifier.js"));
var _formatTrim = _interopRequireDefault(require("./formatTrim.js"));
var _formatTypes = _interopRequireDefault(require("./formatTypes.js"));
var _formatPrefixAuto = require("./formatPrefixAuto.js");
var _identity = _interopRequireDefault(require("./identity.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
var map = Array.prototype.map,
  prefixes = ["y", "z", "a", "f", "p", "n", "µ", "m", "", "k", "M", "G", "T", "P", "E", "Z", "Y"];
function _default(locale) {
  var group = locale.grouping === undefined || locale.thousands === undefined ? _identity["default"] : (0, _formatGroup["default"])(map.call(locale.grouping, Number), locale.thousands + ""),
    currencyPrefix = locale.currency === undefined ? "" : locale.currency[0] + "",
    currencySuffix = locale.currency === undefined ? "" : locale.currency[1] + "",
    decimal = locale.decimal === undefined ? "." : locale.decimal + "",
    numerals = locale.numerals === undefined ? _identity["default"] : (0, _formatNumerals["default"])(map.call(locale.numerals, String)),
    percent = locale.percent === undefined ? "%" : locale.percent + "",
    minus = locale.minus === undefined ? "−" : locale.minus + "",
    nan = locale.nan === undefined ? "NaN" : locale.nan + "";
  function newFormat(specifier) {
    specifier = (0, _formatSpecifier["default"])(specifier);
    var fill = specifier.fill,
      align = specifier.align,
      sign = specifier.sign,
      symbol = specifier.symbol,
      zero = specifier.zero,
      width = specifier.width,
      comma = specifier.comma,
      precision = specifier.precision,
      trim = specifier.trim,
      type = specifier.type;

    // The "n" type is an alias for ",g".
    if (type === "n") comma = true, type = "g";

    // The "" type, and any invalid type, is an alias for ".12~g".
    else if (!_formatTypes["default"][type]) precision === undefined && (precision = 12), trim = true, type = "g";

    // If zero fill is specified, padding goes after sign and before digits.
    if (zero || fill === "0" && align === "=") zero = true, fill = "0", align = "=";

    // Compute the prefix and suffix.
    // For SI-prefix, the suffix is lazily computed.
    var prefix = symbol === "$" ? currencyPrefix : symbol === "#" && /[boxX]/.test(type) ? "0" + type.toLowerCase() : "",
      suffix = symbol === "$" ? currencySuffix : /[%p]/.test(type) ? percent : "";

    // What format function should we use?
    // Is this an integer type?
    // Can this type generate exponential notation?
    var formatType = _formatTypes["default"][type],
      maybeSuffix = /[defgprs%]/.test(type);

    // Set the default precision if not specified,
    // or clamp the specified precision to the supported range.
    // For significant precision, it must be in [1, 21].
    // For fixed precision, it must be in [0, 20].
    precision = precision === undefined ? 6 : /[gprs]/.test(type) ? Math.max(1, Math.min(21, precision)) : Math.max(0, Math.min(20, precision));
    function format(value) {
      var valuePrefix = prefix,
        valueSuffix = suffix,
        i,
        n,
        c;
      if (type === "c") {
        valueSuffix = formatType(value) + valueSuffix;
        value = "";
      } else {
        value = +value;

        // Determine the sign. -0 is not less than 0, but 1 / -0 is!
        var valueNegative = value < 0 || 1 / value < 0;

        // Perform the initial formatting.
        value = isNaN(value) ? nan : formatType(Math.abs(value), precision);

        // Trim insignificant zeros.
        if (trim) value = (0, _formatTrim["default"])(value);

        // If a negative value rounds to zero after formatting, and no explicit positive sign is requested, hide the sign.
        if (valueNegative && +value === 0 && sign !== "+") valueNegative = false;

        // Compute the prefix and suffix.
        valuePrefix = (valueNegative ? sign === "(" ? sign : minus : sign === "-" || sign === "(" ? "" : sign) + valuePrefix;
        valueSuffix = (type === "s" ? prefixes[8 + _formatPrefixAuto.prefixExponent / 3] : "") + valueSuffix + (valueNegative && sign === "(" ? ")" : "");

        // Break the formatted value into the integer “value” part that can be
        // grouped, and fractional or exponential “suffix” part that is not.
        if (maybeSuffix) {
          i = -1, n = value.length;
          while (++i < n) {
            if (c = value.charCodeAt(i), 48 > c || c > 57) {
              valueSuffix = (c === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix;
              value = value.slice(0, i);
              break;
            }
          }
        }
      }

      // If the fill character is not "0", grouping is applied before padding.
      if (comma && !zero) value = group(value, Infinity);

      // Compute the padding.
      var length = valuePrefix.length + value.length + valueSuffix.length,
        padding = length < width ? new Array(width - length + 1).join(fill) : "";

      // If the fill character is "0", grouping is applied after padding.
      if (comma && zero) value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";

      // Reconstruct the final output based on the desired alignment.
      switch (align) {
        case "<":
          value = valuePrefix + value + valueSuffix + padding;
          break;
        case "=":
          value = valuePrefix + padding + value + valueSuffix;
          break;
        case "^":
          value = padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length);
          break;
        default:
          value = padding + valuePrefix + value + valueSuffix;
          break;
      }
      return numerals(value);
    }
    format.toString = function () {
      return specifier + "";
    };
    return format;
  }
  function formatPrefix(specifier, value) {
    var f = newFormat((specifier = (0, _formatSpecifier["default"])(specifier), specifier.type = "f", specifier)),
      e = Math.max(-8, Math.min(8, Math.floor((0, _exponent["default"])(value) / 3))) * 3,
      k = Math.pow(10, -e),
      prefix = prefixes[8 + e / 3];
    return function (value) {
      return f(k * value) + prefix;
    };
  }
  return {
    format: newFormat,
    formatPrefix: formatPrefix
  };
}

},{"./exponent.js":74,"./formatGroup.js":76,"./formatNumerals.js":77,"./formatPrefixAuto.js":78,"./formatSpecifier.js":80,"./formatTrim.js":81,"./formatTypes.js":82,"./identity.js":83}],86:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _exponent = _interopRequireDefault(require("./exponent.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _default(step) {
  return Math.max(0, -(0, _exponent["default"])(Math.abs(step)));
}

},{"./exponent.js":74}],87:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _exponent = _interopRequireDefault(require("./exponent.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _default(step, value) {
  return Math.max(0, Math.max(-8, Math.min(8, Math.floor((0, _exponent["default"])(value) / 3))) * 3 - (0, _exponent["default"])(Math.abs(step)));
}

},{"./exponent.js":74}],88:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _exponent = _interopRequireDefault(require("./exponent.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _default(step, max) {
  step = Math.abs(step), max = Math.abs(max) - step;
  return Math.max(0, (0, _exponent["default"])(max) - (0, _exponent["default"])(step)) + 1;
}

},{"./exponent.js":74}],89:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
exports.genericArray = genericArray;
var _value = _interopRequireDefault(require("./value.js"));
var _numberArray = _interopRequireWildcard(require("./numberArray.js"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _default(a, b) {
  return ((0, _numberArray.isNumberArray)(b) ? _numberArray["default"] : genericArray)(a, b);
}
function genericArray(a, b) {
  var nb = b ? b.length : 0,
    na = a ? Math.min(nb, a.length) : 0,
    x = new Array(na),
    c = new Array(nb),
    i;
  for (i = 0; i < na; ++i) x[i] = (0, _value["default"])(a[i], b[i]);
  for (; i < nb; ++i) c[i] = b[i];
  return function (t) {
    for (i = 0; i < na; ++i) c[i] = x[i](t);
    return c;
  };
}

},{"./numberArray.js":103,"./value.js":113}],90:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.basis = basis;
exports["default"] = _default;
function basis(t1, v0, v1, v2, v3) {
  var t2 = t1 * t1,
    t3 = t2 * t1;
  return ((1 - 3 * t1 + 3 * t2 - t3) * v0 + (4 - 6 * t2 + 3 * t3) * v1 + (1 + 3 * t1 + 3 * t2 - 3 * t3) * v2 + t3 * v3) / 6;
}
function _default(values) {
  var n = values.length - 1;
  return function (t) {
    var i = t <= 0 ? t = 0 : t >= 1 ? (t = 1, n - 1) : Math.floor(t * n),
      v1 = values[i],
      v2 = values[i + 1],
      v0 = i > 0 ? values[i - 1] : 2 * v1 - v2,
      v3 = i < n - 1 ? values[i + 2] : 2 * v2 - v1;
    return basis((t - i / n) * n, v0, v1, v2, v3);
  };
}

},{}],91:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _basis = require("./basis.js");
function _default(values) {
  var n = values.length;
  return function (t) {
    var i = Math.floor(((t %= 1) < 0 ? ++t : t) * n),
      v0 = values[(i + n - 1) % n],
      v1 = values[i % n],
      v2 = values[(i + 1) % n],
      v3 = values[(i + 2) % n];
    return (0, _basis.basis)((t - i / n) * n, v0, v1, v2, v3);
  };
}

},{"./basis.js":90}],92:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = nogamma;
exports.gamma = gamma;
exports.hue = hue;
var _constant = _interopRequireDefault(require("./constant.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function linear(a, d) {
  return function (t) {
    return a + t * d;
  };
}
function exponential(a, b, y) {
  return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function (t) {
    return Math.pow(a + t * b, y);
  };
}
function hue(a, b) {
  var d = b - a;
  return d ? linear(a, d > 180 || d < -180 ? d - 360 * Math.round(d / 360) : d) : (0, _constant["default"])(isNaN(a) ? b : a);
}
function gamma(y) {
  return (y = +y) === 1 ? nogamma : function (a, b) {
    return b - a ? exponential(a, b, y) : (0, _constant["default"])(isNaN(a) ? b : a);
  };
}
function nogamma(a, b) {
  var d = b - a;
  return d ? linear(a, d) : (0, _constant["default"])(isNaN(a) ? b : a);
}

},{"./constant.js":93}],93:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _default = function _default(x) {
  return function () {
    return x;
  };
};
exports["default"] = _default;

},{}],94:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.cubehelixLong = void 0;
var _d3Color = require("d3-color");
var _color = _interopRequireWildcard(require("./color.js"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function cubehelix(hue) {
  return function cubehelixGamma(y) {
    y = +y;
    function cubehelix(start, end) {
      var h = hue((start = (0, _d3Color.cubehelix)(start)).h, (end = (0, _d3Color.cubehelix)(end)).h),
        s = (0, _color["default"])(start.s, end.s),
        l = (0, _color["default"])(start.l, end.l),
        opacity = (0, _color["default"])(start.opacity, end.opacity);
      return function (t) {
        start.h = h(t);
        start.s = s(t);
        start.l = l(Math.pow(t, y));
        start.opacity = opacity(t);
        return start + "";
      };
    }
    cubehelix.gamma = cubehelixGamma;
    return cubehelix;
  }(1);
}
var _default = cubehelix(_color.hue);
exports["default"] = _default;
var cubehelixLong = cubehelix(_color["default"]);
exports.cubehelixLong = cubehelixLong;

},{"./color.js":92,"d3-color":70}],95:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
function _default(a, b) {
  var d = new Date();
  return a = +a, b = +b, function (t) {
    return d.setTime(a * (1 - t) + b * t), d;
  };
}

},{}],96:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
function _default(range) {
  var n = range.length;
  return function (t) {
    return range[Math.max(0, Math.min(n - 1, Math.floor(t * n)))];
  };
}

},{}],97:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.hclLong = exports["default"] = void 0;
var _d3Color = require("d3-color");
var _color = _interopRequireWildcard(require("./color.js"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function hcl(hue) {
  return function (start, end) {
    var h = hue((start = (0, _d3Color.hcl)(start)).h, (end = (0, _d3Color.hcl)(end)).h),
      c = (0, _color["default"])(start.c, end.c),
      l = (0, _color["default"])(start.l, end.l),
      opacity = (0, _color["default"])(start.opacity, end.opacity);
    return function (t) {
      start.h = h(t);
      start.c = c(t);
      start.l = l(t);
      start.opacity = opacity(t);
      return start + "";
    };
  };
}
var _default = hcl(_color.hue);
exports["default"] = _default;
var hclLong = hcl(_color["default"]);
exports.hclLong = hclLong;

},{"./color.js":92,"d3-color":70}],98:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.hslLong = exports["default"] = void 0;
var _d3Color = require("d3-color");
var _color = _interopRequireWildcard(require("./color.js"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function hsl(hue) {
  return function (start, end) {
    var h = hue((start = (0, _d3Color.hsl)(start)).h, (end = (0, _d3Color.hsl)(end)).h),
      s = (0, _color["default"])(start.s, end.s),
      l = (0, _color["default"])(start.l, end.l),
      opacity = (0, _color["default"])(start.opacity, end.opacity);
    return function (t) {
      start.h = h(t);
      start.s = s(t);
      start.l = l(t);
      start.opacity = opacity(t);
      return start + "";
    };
  };
}
var _default = hsl(_color.hue);
exports["default"] = _default;
var hslLong = hsl(_color["default"]);
exports.hslLong = hslLong;

},{"./color.js":92,"d3-color":70}],99:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _color = require("./color.js");
function _default(a, b) {
  var i = (0, _color.hue)(+a, +b);
  return function (t) {
    var x = i(t);
    return x - 360 * Math.floor(x / 360);
  };
}

},{"./color.js":92}],100:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "interpolate", {
  enumerable: true,
  get: function get() {
    return _value["default"];
  }
});
Object.defineProperty(exports, "interpolateArray", {
  enumerable: true,
  get: function get() {
    return _array["default"];
  }
});
Object.defineProperty(exports, "interpolateBasis", {
  enumerable: true,
  get: function get() {
    return _basis["default"];
  }
});
Object.defineProperty(exports, "interpolateBasisClosed", {
  enumerable: true,
  get: function get() {
    return _basisClosed["default"];
  }
});
Object.defineProperty(exports, "interpolateCubehelix", {
  enumerable: true,
  get: function get() {
    return _cubehelix["default"];
  }
});
Object.defineProperty(exports, "interpolateCubehelixLong", {
  enumerable: true,
  get: function get() {
    return _cubehelix.cubehelixLong;
  }
});
Object.defineProperty(exports, "interpolateDate", {
  enumerable: true,
  get: function get() {
    return _date["default"];
  }
});
Object.defineProperty(exports, "interpolateDiscrete", {
  enumerable: true,
  get: function get() {
    return _discrete["default"];
  }
});
Object.defineProperty(exports, "interpolateHcl", {
  enumerable: true,
  get: function get() {
    return _hcl["default"];
  }
});
Object.defineProperty(exports, "interpolateHclLong", {
  enumerable: true,
  get: function get() {
    return _hcl.hclLong;
  }
});
Object.defineProperty(exports, "interpolateHsl", {
  enumerable: true,
  get: function get() {
    return _hsl["default"];
  }
});
Object.defineProperty(exports, "interpolateHslLong", {
  enumerable: true,
  get: function get() {
    return _hsl.hslLong;
  }
});
Object.defineProperty(exports, "interpolateHue", {
  enumerable: true,
  get: function get() {
    return _hue["default"];
  }
});
Object.defineProperty(exports, "interpolateLab", {
  enumerable: true,
  get: function get() {
    return _lab["default"];
  }
});
Object.defineProperty(exports, "interpolateNumber", {
  enumerable: true,
  get: function get() {
    return _number["default"];
  }
});
Object.defineProperty(exports, "interpolateNumberArray", {
  enumerable: true,
  get: function get() {
    return _numberArray["default"];
  }
});
Object.defineProperty(exports, "interpolateObject", {
  enumerable: true,
  get: function get() {
    return _object["default"];
  }
});
Object.defineProperty(exports, "interpolateRgb", {
  enumerable: true,
  get: function get() {
    return _rgb["default"];
  }
});
Object.defineProperty(exports, "interpolateRgbBasis", {
  enumerable: true,
  get: function get() {
    return _rgb.rgbBasis;
  }
});
Object.defineProperty(exports, "interpolateRgbBasisClosed", {
  enumerable: true,
  get: function get() {
    return _rgb.rgbBasisClosed;
  }
});
Object.defineProperty(exports, "interpolateRound", {
  enumerable: true,
  get: function get() {
    return _round["default"];
  }
});
Object.defineProperty(exports, "interpolateString", {
  enumerable: true,
  get: function get() {
    return _string["default"];
  }
});
Object.defineProperty(exports, "interpolateTransformCss", {
  enumerable: true,
  get: function get() {
    return _index.interpolateTransformCss;
  }
});
Object.defineProperty(exports, "interpolateTransformSvg", {
  enumerable: true,
  get: function get() {
    return _index.interpolateTransformSvg;
  }
});
Object.defineProperty(exports, "interpolateZoom", {
  enumerable: true,
  get: function get() {
    return _zoom["default"];
  }
});
Object.defineProperty(exports, "piecewise", {
  enumerable: true,
  get: function get() {
    return _piecewise["default"];
  }
});
Object.defineProperty(exports, "quantize", {
  enumerable: true,
  get: function get() {
    return _quantize["default"];
  }
});
var _value = _interopRequireDefault(require("./value.js"));
var _array = _interopRequireDefault(require("./array.js"));
var _basis = _interopRequireDefault(require("./basis.js"));
var _basisClosed = _interopRequireDefault(require("./basisClosed.js"));
var _date = _interopRequireDefault(require("./date.js"));
var _discrete = _interopRequireDefault(require("./discrete.js"));
var _hue = _interopRequireDefault(require("./hue.js"));
var _number = _interopRequireDefault(require("./number.js"));
var _numberArray = _interopRequireDefault(require("./numberArray.js"));
var _object = _interopRequireDefault(require("./object.js"));
var _round = _interopRequireDefault(require("./round.js"));
var _string = _interopRequireDefault(require("./string.js"));
var _index = require("./transform/index.js");
var _zoom = _interopRequireDefault(require("./zoom.js"));
var _rgb = _interopRequireWildcard(require("./rgb.js"));
var _hsl = _interopRequireWildcard(require("./hsl.js"));
var _lab = _interopRequireDefault(require("./lab.js"));
var _hcl = _interopRequireWildcard(require("./hcl.js"));
var _cubehelix = _interopRequireWildcard(require("./cubehelix.js"));
var _piecewise = _interopRequireDefault(require("./piecewise.js"));
var _quantize = _interopRequireDefault(require("./quantize.js"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

},{"./array.js":89,"./basis.js":90,"./basisClosed.js":91,"./cubehelix.js":94,"./date.js":95,"./discrete.js":96,"./hcl.js":97,"./hsl.js":98,"./hue.js":99,"./lab.js":101,"./number.js":102,"./numberArray.js":103,"./object.js":104,"./piecewise.js":105,"./quantize.js":106,"./rgb.js":107,"./round.js":108,"./string.js":109,"./transform/index.js":111,"./value.js":113,"./zoom.js":114}],101:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = lab;
var _d3Color = require("d3-color");
var _color = _interopRequireDefault(require("./color.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function lab(start, end) {
  var l = (0, _color["default"])((start = (0, _d3Color.lab)(start)).l, (end = (0, _d3Color.lab)(end)).l),
    a = (0, _color["default"])(start.a, end.a),
    b = (0, _color["default"])(start.b, end.b),
    opacity = (0, _color["default"])(start.opacity, end.opacity);
  return function (t) {
    start.l = l(t);
    start.a = a(t);
    start.b = b(t);
    start.opacity = opacity(t);
    return start + "";
  };
}

},{"./color.js":92,"d3-color":70}],102:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
function _default(a, b) {
  return a = +a, b = +b, function (t) {
    return a * (1 - t) + b * t;
  };
}

},{}],103:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
exports.isNumberArray = isNumberArray;
function _default(a, b) {
  if (!b) b = [];
  var n = a ? Math.min(b.length, a.length) : 0,
    c = b.slice(),
    i;
  return function (t) {
    for (i = 0; i < n; ++i) c[i] = a[i] * (1 - t) + b[i] * t;
    return c;
  };
}
function isNumberArray(x) {
  return ArrayBuffer.isView(x) && !(x instanceof DataView);
}

},{}],104:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _value = _interopRequireDefault(require("./value.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _default(a, b) {
  var i = {},
    c = {},
    k;
  if (a === null || _typeof(a) !== "object") a = {};
  if (b === null || _typeof(b) !== "object") b = {};
  for (k in b) {
    if (k in a) {
      i[k] = (0, _value["default"])(a[k], b[k]);
    } else {
      c[k] = b[k];
    }
  }
  return function (t) {
    for (k in i) c[k] = i[k](t);
    return c;
  };
}

},{"./value.js":113}],105:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = piecewise;
var _value = _interopRequireDefault(require("./value.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function piecewise(interpolate, values) {
  if (values === undefined) values = interpolate, interpolate = _value["default"];
  var i = 0,
    n = values.length - 1,
    v = values[0],
    I = new Array(n < 0 ? 0 : n);
  while (i < n) I[i] = interpolate(v, v = values[++i]);
  return function (t) {
    var i = Math.max(0, Math.min(n - 1, Math.floor(t *= n)));
    return I[i](t - i);
  };
}

},{"./value.js":113}],106:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
function _default(interpolator, n) {
  var samples = new Array(n);
  for (var i = 0; i < n; ++i) samples[i] = interpolator(i / (n - 1));
  return samples;
}

},{}],107:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.rgbBasisClosed = exports.rgbBasis = exports["default"] = void 0;
var _d3Color = require("d3-color");
var _basis = _interopRequireDefault(require("./basis.js"));
var _basisClosed = _interopRequireDefault(require("./basisClosed.js"));
var _color = _interopRequireWildcard(require("./color.js"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
var _default = function rgbGamma(y) {
  var color = (0, _color.gamma)(y);
  function rgb(start, end) {
    var r = color((start = (0, _d3Color.rgb)(start)).r, (end = (0, _d3Color.rgb)(end)).r),
      g = color(start.g, end.g),
      b = color(start.b, end.b),
      opacity = (0, _color["default"])(start.opacity, end.opacity);
    return function (t) {
      start.r = r(t);
      start.g = g(t);
      start.b = b(t);
      start.opacity = opacity(t);
      return start + "";
    };
  }
  rgb.gamma = rgbGamma;
  return rgb;
}(1);
exports["default"] = _default;
function rgbSpline(spline) {
  return function (colors) {
    var n = colors.length,
      r = new Array(n),
      g = new Array(n),
      b = new Array(n),
      i,
      color;
    for (i = 0; i < n; ++i) {
      color = (0, _d3Color.rgb)(colors[i]);
      r[i] = color.r || 0;
      g[i] = color.g || 0;
      b[i] = color.b || 0;
    }
    r = spline(r);
    g = spline(g);
    b = spline(b);
    color.opacity = 1;
    return function (t) {
      color.r = r(t);
      color.g = g(t);
      color.b = b(t);
      return color + "";
    };
  };
}
var rgbBasis = rgbSpline(_basis["default"]);
exports.rgbBasis = rgbBasis;
var rgbBasisClosed = rgbSpline(_basisClosed["default"]);
exports.rgbBasisClosed = rgbBasisClosed;

},{"./basis.js":90,"./basisClosed.js":91,"./color.js":92,"d3-color":70}],108:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
function _default(a, b) {
  return a = +a, b = +b, function (t) {
    return Math.round(a * (1 - t) + b * t);
  };
}

},{}],109:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _number = _interopRequireDefault(require("./number.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,
  reB = new RegExp(reA.source, "g");
function zero(b) {
  return function () {
    return b;
  };
}
function one(b) {
  return function (t) {
    return b(t) + "";
  };
}
function _default(a, b) {
  var bi = reA.lastIndex = reB.lastIndex = 0,
    // scan index for next number in b
    am,
    // current match in a
    bm,
    // current match in b
    bs,
    // string preceding current number in b, if any
    i = -1,
    // index in s
    s = [],
    // string constants and placeholders
    q = []; // number interpolators

  // Coerce inputs to strings.
  a = a + "", b = b + "";

  // Interpolate pairs of numbers in a & b.
  while ((am = reA.exec(a)) && (bm = reB.exec(b))) {
    if ((bs = bm.index) > bi) {
      // a string precedes the next number in b
      bs = b.slice(bi, bs);
      if (s[i]) s[i] += bs; // coalesce with previous string
      else s[++i] = bs;
    }
    if ((am = am[0]) === (bm = bm[0])) {
      // numbers in a & b match
      if (s[i]) s[i] += bm; // coalesce with previous string
      else s[++i] = bm;
    } else {
      // interpolate non-matching numbers
      s[++i] = null;
      q.push({
        i: i,
        x: (0, _number["default"])(am, bm)
      });
    }
    bi = reB.lastIndex;
  }

  // Add remains of b.
  if (bi < b.length) {
    bs = b.slice(bi);
    if (s[i]) s[i] += bs; // coalesce with previous string
    else s[++i] = bs;
  }

  // Special optimization for only a single match.
  // Otherwise, interpolate each of the numbers and rejoin the string.
  return s.length < 2 ? q[0] ? one(q[0].x) : zero(b) : (b = q.length, function (t) {
    for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
    return s.join("");
  });
}

},{"./number.js":102}],110:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
exports.identity = void 0;
var degrees = 180 / Math.PI;
var identity = {
  translateX: 0,
  translateY: 0,
  rotate: 0,
  skewX: 0,
  scaleX: 1,
  scaleY: 1
};
exports.identity = identity;
function _default(a, b, c, d, e, f) {
  var scaleX, scaleY, skewX;
  if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
  if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
  if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
  if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
  return {
    translateX: e,
    translateY: f,
    rotate: Math.atan2(b, a) * degrees,
    skewX: Math.atan(skewX) * degrees,
    scaleX: scaleX,
    scaleY: scaleY
  };
}

},{}],111:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.interpolateTransformSvg = exports.interpolateTransformCss = void 0;
var _number = _interopRequireDefault(require("../number.js"));
var _parse = require("./parse.js");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function interpolateTransform(parse, pxComma, pxParen, degParen) {
  function pop(s) {
    return s.length ? s.pop() + " " : "";
  }
  function translate(xa, ya, xb, yb, s, q) {
    if (xa !== xb || ya !== yb) {
      var i = s.push("translate(", null, pxComma, null, pxParen);
      q.push({
        i: i - 4,
        x: (0, _number["default"])(xa, xb)
      }, {
        i: i - 2,
        x: (0, _number["default"])(ya, yb)
      });
    } else if (xb || yb) {
      s.push("translate(" + xb + pxComma + yb + pxParen);
    }
  }
  function rotate(a, b, s, q) {
    if (a !== b) {
      if (a - b > 180) b += 360;else if (b - a > 180) a += 360; // shortest path
      q.push({
        i: s.push(pop(s) + "rotate(", null, degParen) - 2,
        x: (0, _number["default"])(a, b)
      });
    } else if (b) {
      s.push(pop(s) + "rotate(" + b + degParen);
    }
  }
  function skewX(a, b, s, q) {
    if (a !== b) {
      q.push({
        i: s.push(pop(s) + "skewX(", null, degParen) - 2,
        x: (0, _number["default"])(a, b)
      });
    } else if (b) {
      s.push(pop(s) + "skewX(" + b + degParen);
    }
  }
  function scale(xa, ya, xb, yb, s, q) {
    if (xa !== xb || ya !== yb) {
      var i = s.push(pop(s) + "scale(", null, ",", null, ")");
      q.push({
        i: i - 4,
        x: (0, _number["default"])(xa, xb)
      }, {
        i: i - 2,
        x: (0, _number["default"])(ya, yb)
      });
    } else if (xb !== 1 || yb !== 1) {
      s.push(pop(s) + "scale(" + xb + "," + yb + ")");
    }
  }
  return function (a, b) {
    var s = [],
      // string constants and placeholders
      q = []; // number interpolators
    a = parse(a), b = parse(b);
    translate(a.translateX, a.translateY, b.translateX, b.translateY, s, q);
    rotate(a.rotate, b.rotate, s, q);
    skewX(a.skewX, b.skewX, s, q);
    scale(a.scaleX, a.scaleY, b.scaleX, b.scaleY, s, q);
    a = b = null; // gc
    return function (t) {
      var i = -1,
        n = q.length,
        o;
      while (++i < n) s[(o = q[i]).i] = o.x(t);
      return s.join("");
    };
  };
}
var interpolateTransformCss = interpolateTransform(_parse.parseCss, "px, ", "px)", "deg)");
exports.interpolateTransformCss = interpolateTransformCss;
var interpolateTransformSvg = interpolateTransform(_parse.parseSvg, ", ", ")", ")");
exports.interpolateTransformSvg = interpolateTransformSvg;

},{"../number.js":102,"./parse.js":112}],112:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parseCss = parseCss;
exports.parseSvg = parseSvg;
var _decompose = _interopRequireWildcard(require("./decompose.js"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var svgNode;

/* eslint-disable no-undef */
function parseCss(value) {
  var m = new (typeof DOMMatrix === "function" ? DOMMatrix : WebKitCSSMatrix)(value + "");
  return m.isIdentity ? _decompose.identity : (0, _decompose["default"])(m.a, m.b, m.c, m.d, m.e, m.f);
}
function parseSvg(value) {
  if (value == null) return _decompose.identity;
  if (!svgNode) svgNode = document.createElementNS("http://www.w3.org/2000/svg", "g");
  svgNode.setAttribute("transform", value);
  if (!(value = svgNode.transform.baseVal.consolidate())) return _decompose.identity;
  value = value.matrix;
  return (0, _decompose["default"])(value.a, value.b, value.c, value.d, value.e, value.f);
}

},{"./decompose.js":110}],113:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _d3Color = require("d3-color");
var _rgb = _interopRequireDefault(require("./rgb.js"));
var _array = require("./array.js");
var _date = _interopRequireDefault(require("./date.js"));
var _number = _interopRequireDefault(require("./number.js"));
var _object = _interopRequireDefault(require("./object.js"));
var _string = _interopRequireDefault(require("./string.js"));
var _constant = _interopRequireDefault(require("./constant.js"));
var _numberArray = _interopRequireWildcard(require("./numberArray.js"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _default(a, b) {
  var t = _typeof(b),
    c;
  return b == null || t === "boolean" ? (0, _constant["default"])(b) : (t === "number" ? _number["default"] : t === "string" ? (c = (0, _d3Color.color)(b)) ? (b = c, _rgb["default"]) : _string["default"] : b instanceof _d3Color.color ? _rgb["default"] : b instanceof Date ? _date["default"] : (0, _numberArray.isNumberArray)(b) ? _numberArray["default"] : Array.isArray(b) ? _array.genericArray : typeof b.valueOf !== "function" && typeof b.toString !== "function" || isNaN(b) ? _object["default"] : _number["default"])(a, b);
}

},{"./array.js":89,"./constant.js":93,"./date.js":95,"./number.js":102,"./numberArray.js":103,"./object.js":104,"./rgb.js":107,"./string.js":109,"d3-color":70}],114:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var epsilon2 = 1e-12;
function cosh(x) {
  return ((x = Math.exp(x)) + 1 / x) / 2;
}
function sinh(x) {
  return ((x = Math.exp(x)) - 1 / x) / 2;
}
function tanh(x) {
  return ((x = Math.exp(2 * x)) - 1) / (x + 1);
}
var _default = function zoomRho(rho, rho2, rho4) {
  // p0 = [ux0, uy0, w0]
  // p1 = [ux1, uy1, w1]
  function zoom(p0, p1) {
    var ux0 = p0[0],
      uy0 = p0[1],
      w0 = p0[2],
      ux1 = p1[0],
      uy1 = p1[1],
      w1 = p1[2],
      dx = ux1 - ux0,
      dy = uy1 - uy0,
      d2 = dx * dx + dy * dy,
      i,
      S;

    // Special case for u0 ≅ u1.
    if (d2 < epsilon2) {
      S = Math.log(w1 / w0) / rho;
      i = function i(t) {
        return [ux0 + t * dx, uy0 + t * dy, w0 * Math.exp(rho * t * S)];
      };
    }

    // General case.
    else {
      var d1 = Math.sqrt(d2),
        b0 = (w1 * w1 - w0 * w0 + rho4 * d2) / (2 * w0 * rho2 * d1),
        b1 = (w1 * w1 - w0 * w0 - rho4 * d2) / (2 * w1 * rho2 * d1),
        r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0),
        r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
      S = (r1 - r0) / rho;
      i = function i(t) {
        var s = t * S,
          coshr0 = cosh(r0),
          u = w0 / (rho2 * d1) * (coshr0 * tanh(rho * s + r0) - sinh(r0));
        return [ux0 + u * dx, uy0 + u * dy, w0 * coshr0 / cosh(rho * s + r0)];
      };
    }
    i.duration = S * 1000 * rho / Math.SQRT2;
    return i;
  }
  zoom.rho = function (_) {
    var _1 = Math.max(1e-3, +_),
      _2 = _1 * _1,
      _4 = _2 * _2;
    return zoomRho(_1, _2, _4);
  };
  return zoom;
}(Math.SQRT2, 2, 4);
exports["default"] = _default;

},{}],115:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "Path", {
  enumerable: true,
  get: function get() {
    return _path.Path;
  }
});
Object.defineProperty(exports, "path", {
  enumerable: true,
  get: function get() {
    return _path.path;
  }
});
Object.defineProperty(exports, "pathRound", {
  enumerable: true,
  get: function get() {
    return _path.pathRound;
  }
});
var _path = require("./path.js");

},{"./path.js":116}],116:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Path = void 0;
exports.path = path;
exports.pathRound = pathRound;
var _templateObject, _templateObject2, _templateObject3, _templateObject4, _templateObject5, _templateObject6, _templateObject7, _templateObject8, _templateObject9, _templateObject10, _templateObject11, _templateObject12, _templateObject13, _templateObject14;
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
var pi = Math.PI,
  tau = 2 * pi,
  epsilon = 1e-6,
  tauEpsilon = tau - epsilon;
function append(strings) {
  this._ += strings[0];
  for (var i = 1, n = strings.length; i < n; ++i) {
    this._ += arguments[i] + strings[i];
  }
}
function appendRound(digits) {
  var d = Math.floor(digits);
  if (!(d >= 0)) throw new Error("invalid digits: ".concat(digits));
  if (d > 15) return append;
  var k = Math.pow(10, d);
  return function (strings) {
    this._ += strings[0];
    for (var i = 1, n = strings.length; i < n; ++i) {
      this._ += Math.round(arguments[i] * k) / k + strings[i];
    }
  };
}
var Path = /*#__PURE__*/function () {
  function Path(digits) {
    _classCallCheck(this, Path);
    this._x0 = this._y0 =
    // start of current subpath
    this._x1 = this._y1 = null; // end of current subpath
    this._ = "";
    this._append = digits == null ? append : appendRound(digits);
  }
  _createClass(Path, [{
    key: "moveTo",
    value: function moveTo(x, y) {
      this._append(_templateObject || (_templateObject = _taggedTemplateLiteral(["M", ",", ""])), this._x0 = this._x1 = +x, this._y0 = this._y1 = +y);
    }
  }, {
    key: "closePath",
    value: function closePath() {
      if (this._x1 !== null) {
        this._x1 = this._x0, this._y1 = this._y0;
        this._append(_templateObject2 || (_templateObject2 = _taggedTemplateLiteral(["Z"])));
      }
    }
  }, {
    key: "lineTo",
    value: function lineTo(x, y) {
      this._append(_templateObject3 || (_templateObject3 = _taggedTemplateLiteral(["L", ",", ""])), this._x1 = +x, this._y1 = +y);
    }
  }, {
    key: "quadraticCurveTo",
    value: function quadraticCurveTo(x1, y1, x, y) {
      this._append(_templateObject4 || (_templateObject4 = _taggedTemplateLiteral(["Q", ",", ",", ",", ""])), +x1, +y1, this._x1 = +x, this._y1 = +y);
    }
  }, {
    key: "bezierCurveTo",
    value: function bezierCurveTo(x1, y1, x2, y2, x, y) {
      this._append(_templateObject5 || (_templateObject5 = _taggedTemplateLiteral(["C", ",", ",", ",", ",", ",", ""])), +x1, +y1, +x2, +y2, this._x1 = +x, this._y1 = +y);
    }
  }, {
    key: "arcTo",
    value: function arcTo(x1, y1, x2, y2, r) {
      x1 = +x1, y1 = +y1, x2 = +x2, y2 = +y2, r = +r;

      // Is the radius negative? Error.
      if (r < 0) throw new Error("negative radius: ".concat(r));
      var x0 = this._x1,
        y0 = this._y1,
        x21 = x2 - x1,
        y21 = y2 - y1,
        x01 = x0 - x1,
        y01 = y0 - y1,
        l01_2 = x01 * x01 + y01 * y01;

      // Is this path empty? Move to (x1,y1).
      if (this._x1 === null) {
        this._append(_templateObject6 || (_templateObject6 = _taggedTemplateLiteral(["M", ",", ""])), this._x1 = x1, this._y1 = y1);
      }

      // Or, is (x1,y1) coincident with (x0,y0)? Do nothing.
      else if (!(l01_2 > epsilon)) ;

      // Or, are (x0,y0), (x1,y1) and (x2,y2) collinear?
      // Equivalently, is (x1,y1) coincident with (x2,y2)?
      // Or, is the radius zero? Line to (x1,y1).
      else if (!(Math.abs(y01 * x21 - y21 * x01) > epsilon) || !r) {
        this._append(_templateObject7 || (_templateObject7 = _taggedTemplateLiteral(["L", ",", ""])), this._x1 = x1, this._y1 = y1);
      }

      // Otherwise, draw an arc!
      else {
        var x20 = x2 - x0,
          y20 = y2 - y0,
          l21_2 = x21 * x21 + y21 * y21,
          l20_2 = x20 * x20 + y20 * y20,
          l21 = Math.sqrt(l21_2),
          l01 = Math.sqrt(l01_2),
          l = r * Math.tan((pi - Math.acos((l21_2 + l01_2 - l20_2) / (2 * l21 * l01))) / 2),
          t01 = l / l01,
          t21 = l / l21;

        // If the start tangent is not coincident with (x0,y0), line to.
        if (Math.abs(t01 - 1) > epsilon) {
          this._append(_templateObject8 || (_templateObject8 = _taggedTemplateLiteral(["L", ",", ""])), x1 + t01 * x01, y1 + t01 * y01);
        }
        this._append(_templateObject9 || (_templateObject9 = _taggedTemplateLiteral(["A", ",", ",0,0,", ",", ",", ""])), r, r, +(y01 * x20 > x01 * y20), this._x1 = x1 + t21 * x21, this._y1 = y1 + t21 * y21);
      }
    }
  }, {
    key: "arc",
    value: function arc(x, y, r, a0, a1, ccw) {
      x = +x, y = +y, r = +r, ccw = !!ccw;

      // Is the radius negative? Error.
      if (r < 0) throw new Error("negative radius: ".concat(r));
      var dx = r * Math.cos(a0),
        dy = r * Math.sin(a0),
        x0 = x + dx,
        y0 = y + dy,
        cw = 1 ^ ccw,
        da = ccw ? a0 - a1 : a1 - a0;

      // Is this path empty? Move to (x0,y0).
      if (this._x1 === null) {
        this._append(_templateObject10 || (_templateObject10 = _taggedTemplateLiteral(["M", ",", ""])), x0, y0);
      }

      // Or, is (x0,y0) not coincident with the previous point? Line to (x0,y0).
      else if (Math.abs(this._x1 - x0) > epsilon || Math.abs(this._y1 - y0) > epsilon) {
        this._append(_templateObject11 || (_templateObject11 = _taggedTemplateLiteral(["L", ",", ""])), x0, y0);
      }

      // Is this arc empty? We’re done.
      if (!r) return;

      // Does the angle go the wrong way? Flip the direction.
      if (da < 0) da = da % tau + tau;

      // Is this a complete circle? Draw two arcs to complete the circle.
      if (da > tauEpsilon) {
        this._append(_templateObject12 || (_templateObject12 = _taggedTemplateLiteral(["A", ",", ",0,1,", ",", ",", "A", ",", ",0,1,", ",", ",", ""])), r, r, cw, x - dx, y - dy, r, r, cw, this._x1 = x0, this._y1 = y0);
      }

      // Is this arc non-empty? Draw an arc!
      else if (da > epsilon) {
        this._append(_templateObject13 || (_templateObject13 = _taggedTemplateLiteral(["A", ",", ",0,", ",", ",", ",", ""])), r, r, +(da >= pi), cw, this._x1 = x + r * Math.cos(a1), this._y1 = y + r * Math.sin(a1));
      }
    }
  }, {
    key: "rect",
    value: function rect(x, y, w, h) {
      this._append(_templateObject14 || (_templateObject14 = _taggedTemplateLiteral(["M", ",", "h", "v", "h", "Z"])), this._x0 = this._x1 = +x, this._y0 = this._y1 = +y, w = +w, +h, -w);
    }
  }, {
    key: "toString",
    value: function toString() {
      return this._;
    }
  }]);
  return Path;
}();
exports.Path = Path;
function path() {
  return new Path();
}

// Allow instanceof d3.path
path.prototype = Path.prototype;
function pathRound() {
  var digits = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 3;
  return new Path(+digits);
}

},{}],117:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = band;
exports.point = point;
var _d3Array = require("d3-array");
var _init = require("./init.js");
var _ordinal = _interopRequireDefault(require("./ordinal.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _iterableToArrayLimit(arr, i) { var _i = null == arr ? null : "undefined" != typeof Symbol && arr[Symbol.iterator] || arr["@@iterator"]; if (null != _i) { var _s, _e, _x, _r, _arr = [], _n = !0, _d = !1; try { if (_x = (_i = _i.call(arr)).next, 0 === i) { if (Object(_i) !== _i) return; _n = !1; } else for (; !(_n = (_s = _x.call(_i)).done) && (_arr.push(_s.value), _arr.length !== i); _n = !0); } catch (err) { _d = !0, _e = err; } finally { try { if (!_n && null != _i["return"] && (_r = _i["return"](), Object(_r) !== _r)) return; } finally { if (_d) throw _e; } } return _arr; } }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }
function band() {
  var scale = (0, _ordinal["default"])().unknown(undefined),
    domain = scale.domain,
    ordinalRange = scale.range,
    r0 = 0,
    r1 = 1,
    step,
    bandwidth,
    round = false,
    paddingInner = 0,
    paddingOuter = 0,
    align = 0.5;
  delete scale.unknown;
  function rescale() {
    var n = domain().length,
      reverse = r1 < r0,
      start = reverse ? r1 : r0,
      stop = reverse ? r0 : r1;
    step = (stop - start) / Math.max(1, n - paddingInner + paddingOuter * 2);
    if (round) step = Math.floor(step);
    start += (stop - start - step * (n - paddingInner)) * align;
    bandwidth = step * (1 - paddingInner);
    if (round) start = Math.round(start), bandwidth = Math.round(bandwidth);
    var values = (0, _d3Array.range)(n).map(function (i) {
      return start + step * i;
    });
    return ordinalRange(reverse ? values.reverse() : values);
  }
  scale.domain = function (_) {
    return arguments.length ? (domain(_), rescale()) : domain();
  };
  scale.range = function (_) {
    var _ref;
    return arguments.length ? ((_ref = _slicedToArray(_, 2), r0 = _ref[0], r1 = _ref[1]), r0 = +r0, r1 = +r1, rescale()) : [r0, r1];
  };
  scale.rangeRound = function (_) {
    var _ref2;
    return (_ref2 = _slicedToArray(_, 2), r0 = _ref2[0], r1 = _ref2[1]), r0 = +r0, r1 = +r1, round = true, rescale();
  };
  scale.bandwidth = function () {
    return bandwidth;
  };
  scale.step = function () {
    return step;
  };
  scale.round = function (_) {
    return arguments.length ? (round = !!_, rescale()) : round;
  };
  scale.padding = function (_) {
    return arguments.length ? (paddingInner = Math.min(1, paddingOuter = +_), rescale()) : paddingInner;
  };
  scale.paddingInner = function (_) {
    return arguments.length ? (paddingInner = Math.min(1, _), rescale()) : paddingInner;
  };
  scale.paddingOuter = function (_) {
    return arguments.length ? (paddingOuter = +_, rescale()) : paddingOuter;
  };
  scale.align = function (_) {
    return arguments.length ? (align = Math.max(0, Math.min(1, _)), rescale()) : align;
  };
  scale.copy = function () {
    return band(domain(), [r0, r1]).round(round).paddingInner(paddingInner).paddingOuter(paddingOuter).align(align);
  };
  return _init.initRange.apply(rescale(), arguments);
}
function pointish(scale) {
  var copy = scale.copy;
  scale.padding = scale.paddingOuter;
  delete scale.paddingInner;
  delete scale.paddingOuter;
  scale.copy = function () {
    return pointish(copy());
  };
  return scale;
}
function point() {
  return pointish(band.apply(null, arguments).paddingInner(1));
}

},{"./init.js":123,"./ordinal.js":128,"d3-array":26}],118:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = constants;
function constants(x) {
  return function () {
    return x;
  };
}

},{}],119:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.copy = copy;
exports["default"] = continuous;
exports.identity = identity;
exports.transformer = transformer;
var _d3Array = require("d3-array");
var _d3Interpolate = require("d3-interpolate");
var _constant = _interopRequireDefault(require("./constant.js"));
var _number = _interopRequireDefault(require("./number.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
var unit = [0, 1];
function identity(x) {
  return x;
}
function normalize(a, b) {
  return (b -= a = +a) ? function (x) {
    return (x - a) / b;
  } : (0, _constant["default"])(isNaN(b) ? NaN : 0.5);
}
function clamper(a, b) {
  var t;
  if (a > b) t = a, a = b, b = t;
  return function (x) {
    return Math.max(a, Math.min(b, x));
  };
}

// normalize(a, b)(x) takes a domain value x in [a,b] and returns the corresponding parameter t in [0,1].
// interpolate(a, b)(t) takes a parameter t in [0,1] and returns the corresponding range value x in [a,b].
function bimap(domain, range, interpolate) {
  var d0 = domain[0],
    d1 = domain[1],
    r0 = range[0],
    r1 = range[1];
  if (d1 < d0) d0 = normalize(d1, d0), r0 = interpolate(r1, r0);else d0 = normalize(d0, d1), r0 = interpolate(r0, r1);
  return function (x) {
    return r0(d0(x));
  };
}
function polymap(domain, range, interpolate) {
  var j = Math.min(domain.length, range.length) - 1,
    d = new Array(j),
    r = new Array(j),
    i = -1;

  // Reverse descending domains.
  if (domain[j] < domain[0]) {
    domain = domain.slice().reverse();
    range = range.slice().reverse();
  }
  while (++i < j) {
    d[i] = normalize(domain[i], domain[i + 1]);
    r[i] = interpolate(range[i], range[i + 1]);
  }
  return function (x) {
    var i = (0, _d3Array.bisect)(domain, x, 1, j) - 1;
    return r[i](d[i](x));
  };
}
function copy(source, target) {
  return target.domain(source.domain()).range(source.range()).interpolate(source.interpolate()).clamp(source.clamp()).unknown(source.unknown());
}
function transformer() {
  var domain = unit,
    range = unit,
    interpolate = _d3Interpolate.interpolate,
    transform,
    untransform,
    unknown,
    clamp = identity,
    piecewise,
    output,
    input;
  function rescale() {
    var n = Math.min(domain.length, range.length);
    if (clamp !== identity) clamp = clamper(domain[0], domain[n - 1]);
    piecewise = n > 2 ? polymap : bimap;
    output = input = null;
    return scale;
  }
  function scale(x) {
    return x == null || isNaN(x = +x) ? unknown : (output || (output = piecewise(domain.map(transform), range, interpolate)))(transform(clamp(x)));
  }
  scale.invert = function (y) {
    return clamp(untransform((input || (input = piecewise(range, domain.map(transform), _d3Interpolate.interpolateNumber)))(y)));
  };
  scale.domain = function (_) {
    return arguments.length ? (domain = Array.from(_, _number["default"]), rescale()) : domain.slice();
  };
  scale.range = function (_) {
    return arguments.length ? (range = Array.from(_), rescale()) : range.slice();
  };
  scale.rangeRound = function (_) {
    return range = Array.from(_), interpolate = _d3Interpolate.interpolateRound, rescale();
  };
  scale.clamp = function (_) {
    return arguments.length ? (clamp = _ ? true : identity, rescale()) : clamp !== identity;
  };
  scale.interpolate = function (_) {
    return arguments.length ? (interpolate = _, rescale()) : interpolate;
  };
  scale.unknown = function (_) {
    return arguments.length ? (unknown = _, scale) : unknown;
  };
  return function (t, u) {
    transform = t, untransform = u;
    return rescale();
  };
}
function continuous() {
  return transformer()(identity, identity);
}

},{"./constant.js":118,"./number.js":127,"d3-array":26,"d3-interpolate":100}],120:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = diverging;
exports.divergingLog = divergingLog;
exports.divergingPow = divergingPow;
exports.divergingSqrt = divergingSqrt;
exports.divergingSymlog = divergingSymlog;
var _d3Interpolate = require("d3-interpolate");
var _continuous = require("./continuous.js");
var _init = require("./init.js");
var _linear = require("./linear.js");
var _log = require("./log.js");
var _sequential = require("./sequential.js");
var _symlog = require("./symlog.js");
var _pow = require("./pow.js");
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _iterableToArrayLimit(arr, i) { var _i = null == arr ? null : "undefined" != typeof Symbol && arr[Symbol.iterator] || arr["@@iterator"]; if (null != _i) { var _s, _e, _x, _r, _arr = [], _n = !0, _d = !1; try { if (_x = (_i = _i.call(arr)).next, 0 === i) { if (Object(_i) !== _i) return; _n = !1; } else for (; !(_n = (_s = _x.call(_i)).done) && (_arr.push(_s.value), _arr.length !== i); _n = !0); } catch (err) { _d = !0, _e = err; } finally { try { if (!_n && null != _i["return"] && (_r = _i["return"](), Object(_r) !== _r)) return; } finally { if (_d) throw _e; } } return _arr; } }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }
function transformer() {
  var x0 = 0,
    x1 = 0.5,
    x2 = 1,
    s = 1,
    t0,
    t1,
    t2,
    k10,
    k21,
    interpolator = _continuous.identity,
    transform,
    clamp = false,
    unknown;
  function scale(x) {
    return isNaN(x = +x) ? unknown : (x = 0.5 + ((x = +transform(x)) - t1) * (s * x < s * t1 ? k10 : k21), interpolator(clamp ? Math.max(0, Math.min(1, x)) : x));
  }
  scale.domain = function (_) {
    var _ref;
    return arguments.length ? ((_ref = _slicedToArray(_, 3), x0 = _ref[0], x1 = _ref[1], x2 = _ref[2]), t0 = transform(x0 = +x0), t1 = transform(x1 = +x1), t2 = transform(x2 = +x2), k10 = t0 === t1 ? 0 : 0.5 / (t1 - t0), k21 = t1 === t2 ? 0 : 0.5 / (t2 - t1), s = t1 < t0 ? -1 : 1, scale) : [x0, x1, x2];
  };
  scale.clamp = function (_) {
    return arguments.length ? (clamp = !!_, scale) : clamp;
  };
  scale.interpolator = function (_) {
    return arguments.length ? (interpolator = _, scale) : interpolator;
  };
  function range(interpolate) {
    return function (_) {
      var _ref2;
      var r0, r1, r2;
      return arguments.length ? ((_ref2 = _slicedToArray(_, 3), r0 = _ref2[0], r1 = _ref2[1], r2 = _ref2[2]), interpolator = (0, _d3Interpolate.piecewise)(interpolate, [r0, r1, r2]), scale) : [interpolator(0), interpolator(0.5), interpolator(1)];
    };
  }
  scale.range = range(_d3Interpolate.interpolate);
  scale.rangeRound = range(_d3Interpolate.interpolateRound);
  scale.unknown = function (_) {
    return arguments.length ? (unknown = _, scale) : unknown;
  };
  return function (t) {
    transform = t, t0 = t(x0), t1 = t(x1), t2 = t(x2), k10 = t0 === t1 ? 0 : 0.5 / (t1 - t0), k21 = t1 === t2 ? 0 : 0.5 / (t2 - t1), s = t1 < t0 ? -1 : 1;
    return scale;
  };
}
function diverging() {
  var scale = (0, _linear.linearish)(transformer()(_continuous.identity));
  scale.copy = function () {
    return (0, _sequential.copy)(scale, diverging());
  };
  return _init.initInterpolator.apply(scale, arguments);
}
function divergingLog() {
  var scale = (0, _log.loggish)(transformer()).domain([0.1, 1, 10]);
  scale.copy = function () {
    return (0, _sequential.copy)(scale, divergingLog()).base(scale.base());
  };
  return _init.initInterpolator.apply(scale, arguments);
}
function divergingSymlog() {
  var scale = (0, _symlog.symlogish)(transformer());
  scale.copy = function () {
    return (0, _sequential.copy)(scale, divergingSymlog()).constant(scale.constant());
  };
  return _init.initInterpolator.apply(scale, arguments);
}
function divergingPow() {
  var scale = (0, _pow.powish)(transformer());
  scale.copy = function () {
    return (0, _sequential.copy)(scale, divergingPow()).exponent(scale.exponent());
  };
  return _init.initInterpolator.apply(scale, arguments);
}
function divergingSqrt() {
  return divergingPow.apply(null, arguments).exponent(0.5);
}

},{"./continuous.js":119,"./init.js":123,"./linear.js":124,"./log.js":125,"./pow.js":129,"./sequential.js":133,"./symlog.js":135,"d3-interpolate":100}],121:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = identity;
var _linear = require("./linear.js");
var _number = _interopRequireDefault(require("./number.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function identity(domain) {
  var unknown;
  function scale(x) {
    return x == null || isNaN(x = +x) ? unknown : x;
  }
  scale.invert = scale;
  scale.domain = scale.range = function (_) {
    return arguments.length ? (domain = Array.from(_, _number["default"]), scale) : domain.slice();
  };
  scale.unknown = function (_) {
    return arguments.length ? (unknown = _, scale) : unknown;
  };
  scale.copy = function () {
    return identity(domain).unknown(unknown);
  };
  domain = arguments.length ? Array.from(domain, _number["default"]) : [0, 1];
  return (0, _linear.linearish)(scale);
}

},{"./linear.js":124,"./number.js":127}],122:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "scaleBand", {
  enumerable: true,
  get: function get() {
    return _band["default"];
  }
});
Object.defineProperty(exports, "scaleDiverging", {
  enumerable: true,
  get: function get() {
    return _diverging["default"];
  }
});
Object.defineProperty(exports, "scaleDivergingLog", {
  enumerable: true,
  get: function get() {
    return _diverging.divergingLog;
  }
});
Object.defineProperty(exports, "scaleDivergingPow", {
  enumerable: true,
  get: function get() {
    return _diverging.divergingPow;
  }
});
Object.defineProperty(exports, "scaleDivergingSqrt", {
  enumerable: true,
  get: function get() {
    return _diverging.divergingSqrt;
  }
});
Object.defineProperty(exports, "scaleDivergingSymlog", {
  enumerable: true,
  get: function get() {
    return _diverging.divergingSymlog;
  }
});
Object.defineProperty(exports, "scaleIdentity", {
  enumerable: true,
  get: function get() {
    return _identity["default"];
  }
});
Object.defineProperty(exports, "scaleImplicit", {
  enumerable: true,
  get: function get() {
    return _ordinal.implicit;
  }
});
Object.defineProperty(exports, "scaleLinear", {
  enumerable: true,
  get: function get() {
    return _linear["default"];
  }
});
Object.defineProperty(exports, "scaleLog", {
  enumerable: true,
  get: function get() {
    return _log["default"];
  }
});
Object.defineProperty(exports, "scaleOrdinal", {
  enumerable: true,
  get: function get() {
    return _ordinal["default"];
  }
});
Object.defineProperty(exports, "scalePoint", {
  enumerable: true,
  get: function get() {
    return _band.point;
  }
});
Object.defineProperty(exports, "scalePow", {
  enumerable: true,
  get: function get() {
    return _pow["default"];
  }
});
Object.defineProperty(exports, "scaleQuantile", {
  enumerable: true,
  get: function get() {
    return _quantile["default"];
  }
});
Object.defineProperty(exports, "scaleQuantize", {
  enumerable: true,
  get: function get() {
    return _quantize["default"];
  }
});
Object.defineProperty(exports, "scaleRadial", {
  enumerable: true,
  get: function get() {
    return _radial["default"];
  }
});
Object.defineProperty(exports, "scaleSequential", {
  enumerable: true,
  get: function get() {
    return _sequential["default"];
  }
});
Object.defineProperty(exports, "scaleSequentialLog", {
  enumerable: true,
  get: function get() {
    return _sequential.sequentialLog;
  }
});
Object.defineProperty(exports, "scaleSequentialPow", {
  enumerable: true,
  get: function get() {
    return _sequential.sequentialPow;
  }
});
Object.defineProperty(exports, "scaleSequentialQuantile", {
  enumerable: true,
  get: function get() {
    return _sequentialQuantile["default"];
  }
});
Object.defineProperty(exports, "scaleSequentialSqrt", {
  enumerable: true,
  get: function get() {
    return _sequential.sequentialSqrt;
  }
});
Object.defineProperty(exports, "scaleSequentialSymlog", {
  enumerable: true,
  get: function get() {
    return _sequential.sequentialSymlog;
  }
});
Object.defineProperty(exports, "scaleSqrt", {
  enumerable: true,
  get: function get() {
    return _pow.sqrt;
  }
});
Object.defineProperty(exports, "scaleSymlog", {
  enumerable: true,
  get: function get() {
    return _symlog["default"];
  }
});
Object.defineProperty(exports, "scaleThreshold", {
  enumerable: true,
  get: function get() {
    return _threshold["default"];
  }
});
Object.defineProperty(exports, "scaleTime", {
  enumerable: true,
  get: function get() {
    return _time["default"];
  }
});
Object.defineProperty(exports, "scaleUtc", {
  enumerable: true,
  get: function get() {
    return _utcTime["default"];
  }
});
Object.defineProperty(exports, "tickFormat", {
  enumerable: true,
  get: function get() {
    return _tickFormat["default"];
  }
});
var _band = _interopRequireWildcard(require("./band.js"));
var _identity = _interopRequireDefault(require("./identity.js"));
var _linear = _interopRequireDefault(require("./linear.js"));
var _log = _interopRequireDefault(require("./log.js"));
var _symlog = _interopRequireDefault(require("./symlog.js"));
var _ordinal = _interopRequireWildcard(require("./ordinal.js"));
var _pow = _interopRequireWildcard(require("./pow.js"));
var _radial = _interopRequireDefault(require("./radial.js"));
var _quantile = _interopRequireDefault(require("./quantile.js"));
var _quantize = _interopRequireDefault(require("./quantize.js"));
var _threshold = _interopRequireDefault(require("./threshold.js"));
var _time = _interopRequireDefault(require("./time.js"));
var _utcTime = _interopRequireDefault(require("./utcTime.js"));
var _sequential = _interopRequireWildcard(require("./sequential.js"));
var _sequentialQuantile = _interopRequireDefault(require("./sequentialQuantile.js"));
var _diverging = _interopRequireWildcard(require("./diverging.js"));
var _tickFormat = _interopRequireDefault(require("./tickFormat.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

},{"./band.js":117,"./diverging.js":120,"./identity.js":121,"./linear.js":124,"./log.js":125,"./ordinal.js":128,"./pow.js":129,"./quantile.js":130,"./quantize.js":131,"./radial.js":132,"./sequential.js":133,"./sequentialQuantile.js":134,"./symlog.js":135,"./threshold.js":136,"./tickFormat.js":137,"./time.js":138,"./utcTime.js":139}],123:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.initInterpolator = initInterpolator;
exports.initRange = initRange;
function initRange(domain, range) {
  switch (arguments.length) {
    case 0:
      break;
    case 1:
      this.range(domain);
      break;
    default:
      this.range(range).domain(domain);
      break;
  }
  return this;
}
function initInterpolator(domain, interpolator) {
  switch (arguments.length) {
    case 0:
      break;
    case 1:
      {
        if (typeof domain === "function") this.interpolator(domain);else this.range(domain);
        break;
      }
    default:
      {
        this.domain(domain);
        if (typeof interpolator === "function") this.interpolator(interpolator);else this.range(interpolator);
        break;
      }
  }
  return this;
}

},{}],124:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = linear;
exports.linearish = linearish;
var _d3Array = require("d3-array");
var _continuous = _interopRequireWildcard(require("./continuous.js"));
var _init = require("./init.js");
var _tickFormat = _interopRequireDefault(require("./tickFormat.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function linearish(scale) {
  var domain = scale.domain;
  scale.ticks = function (count) {
    var d = domain();
    return (0, _d3Array.ticks)(d[0], d[d.length - 1], count == null ? 10 : count);
  };
  scale.tickFormat = function (count, specifier) {
    var d = domain();
    return (0, _tickFormat["default"])(d[0], d[d.length - 1], count == null ? 10 : count, specifier);
  };
  scale.nice = function (count) {
    if (count == null) count = 10;
    var d = domain();
    var i0 = 0;
    var i1 = d.length - 1;
    var start = d[i0];
    var stop = d[i1];
    var prestep;
    var step;
    var maxIter = 10;
    if (stop < start) {
      step = start, start = stop, stop = step;
      step = i0, i0 = i1, i1 = step;
    }
    while (maxIter-- > 0) {
      step = (0, _d3Array.tickIncrement)(start, stop, count);
      if (step === prestep) {
        d[i0] = start;
        d[i1] = stop;
        return domain(d);
      } else if (step > 0) {
        start = Math.floor(start / step) * step;
        stop = Math.ceil(stop / step) * step;
      } else if (step < 0) {
        start = Math.ceil(start * step) / step;
        stop = Math.floor(stop * step) / step;
      } else {
        break;
      }
      prestep = step;
    }
    return scale;
  };
  return scale;
}
function linear() {
  var scale = (0, _continuous["default"])();
  scale.copy = function () {
    return (0, _continuous.copy)(scale, linear());
  };
  _init.initRange.apply(scale, arguments);
  return linearish(scale);
}

},{"./continuous.js":119,"./init.js":123,"./tickFormat.js":137,"d3-array":26}],125:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = log;
exports.loggish = loggish;
var _d3Array = require("d3-array");
var _d3Format = require("d3-format");
var _nice = _interopRequireDefault(require("./nice.js"));
var _continuous = require("./continuous.js");
var _init = require("./init.js");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function transformLog(x) {
  return Math.log(x);
}
function transformExp(x) {
  return Math.exp(x);
}
function transformLogn(x) {
  return -Math.log(-x);
}
function transformExpn(x) {
  return -Math.exp(-x);
}
function pow10(x) {
  return isFinite(x) ? +("1e" + x) : x < 0 ? 0 : x;
}
function powp(base) {
  return base === 10 ? pow10 : base === Math.E ? Math.exp : function (x) {
    return Math.pow(base, x);
  };
}
function logp(base) {
  return base === Math.E ? Math.log : base === 10 && Math.log10 || base === 2 && Math.log2 || (base = Math.log(base), function (x) {
    return Math.log(x) / base;
  });
}
function reflect(f) {
  return function (x, k) {
    return -f(-x, k);
  };
}
function loggish(transform) {
  var scale = transform(transformLog, transformExp);
  var domain = scale.domain;
  var base = 10;
  var logs;
  var pows;
  function rescale() {
    logs = logp(base), pows = powp(base);
    if (domain()[0] < 0) {
      logs = reflect(logs), pows = reflect(pows);
      transform(transformLogn, transformExpn);
    } else {
      transform(transformLog, transformExp);
    }
    return scale;
  }
  scale.base = function (_) {
    return arguments.length ? (base = +_, rescale()) : base;
  };
  scale.domain = function (_) {
    return arguments.length ? (domain(_), rescale()) : domain();
  };
  scale.ticks = function (count) {
    var d = domain();
    var u = d[0];
    var v = d[d.length - 1];
    var r = v < u;
    if (r) {
      var _ref = [v, u];
      u = _ref[0];
      v = _ref[1];
    }
    var i = logs(u);
    var j = logs(v);
    var k;
    var t;
    var n = count == null ? 10 : +count;
    var z = [];
    if (!(base % 1) && j - i < n) {
      i = Math.floor(i), j = Math.ceil(j);
      if (u > 0) for (; i <= j; ++i) {
        for (k = 1; k < base; ++k) {
          t = i < 0 ? k / pows(-i) : k * pows(i);
          if (t < u) continue;
          if (t > v) break;
          z.push(t);
        }
      } else for (; i <= j; ++i) {
        for (k = base - 1; k >= 1; --k) {
          t = i > 0 ? k / pows(-i) : k * pows(i);
          if (t < u) continue;
          if (t > v) break;
          z.push(t);
        }
      }
      if (z.length * 2 < n) z = (0, _d3Array.ticks)(u, v, n);
    } else {
      z = (0, _d3Array.ticks)(i, j, Math.min(j - i, n)).map(pows);
    }
    return r ? z.reverse() : z;
  };
  scale.tickFormat = function (count, specifier) {
    if (count == null) count = 10;
    if (specifier == null) specifier = base === 10 ? "s" : ",";
    if (typeof specifier !== "function") {
      if (!(base % 1) && (specifier = (0, _d3Format.formatSpecifier)(specifier)).precision == null) specifier.trim = true;
      specifier = (0, _d3Format.format)(specifier);
    }
    if (count === Infinity) return specifier;
    var k = Math.max(1, base * count / scale.ticks().length); // TODO fast estimate?
    return function (d) {
      var i = d / pows(Math.round(logs(d)));
      if (i * base < base - 0.5) i *= base;
      return i <= k ? specifier(d) : "";
    };
  };
  scale.nice = function () {
    return domain((0, _nice["default"])(domain(), {
      floor: function floor(x) {
        return pows(Math.floor(logs(x)));
      },
      ceil: function ceil(x) {
        return pows(Math.ceil(logs(x)));
      }
    }));
  };
  return scale;
}
function log() {
  var scale = loggish((0, _continuous.transformer)()).domain([1, 10]);
  scale.copy = function () {
    return (0, _continuous.copy)(scale, log()).base(scale.base());
  };
  _init.initRange.apply(scale, arguments);
  return scale;
}

},{"./continuous.js":119,"./init.js":123,"./nice.js":126,"d3-array":26,"d3-format":84}],126:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = nice;
function nice(domain, interval) {
  domain = domain.slice();
  var i0 = 0,
    i1 = domain.length - 1,
    x0 = domain[i0],
    x1 = domain[i1],
    t;
  if (x1 < x0) {
    t = i0, i0 = i1, i1 = t;
    t = x0, x0 = x1, x1 = t;
  }
  domain[i0] = interval.floor(x0);
  domain[i1] = interval.ceil(x1);
  return domain;
}

},{}],127:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = number;
function number(x) {
  return +x;
}

},{}],128:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = ordinal;
exports.implicit = void 0;
var _d3Array = require("d3-array");
var _init = require("./init.js");
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
var implicit = Symbol("implicit");
exports.implicit = implicit;
function ordinal() {
  var index = new _d3Array.InternMap(),
    domain = [],
    range = [],
    unknown = implicit;
  function scale(d) {
    var i = index.get(d);
    if (i === undefined) {
      if (unknown !== implicit) return unknown;
      index.set(d, i = domain.push(d) - 1);
    }
    return range[i % range.length];
  }
  scale.domain = function (_) {
    if (!arguments.length) return domain.slice();
    domain = [], index = new _d3Array.InternMap();
    var _iterator = _createForOfIteratorHelper(_),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var value = _step.value;
        if (index.has(value)) continue;
        index.set(value, domain.push(value) - 1);
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
    return scale;
  };
  scale.range = function (_) {
    return arguments.length ? (range = Array.from(_), scale) : range.slice();
  };
  scale.unknown = function (_) {
    return arguments.length ? (unknown = _, scale) : unknown;
  };
  scale.copy = function () {
    return ordinal(domain, range).unknown(unknown);
  };
  _init.initRange.apply(scale, arguments);
  return scale;
}

},{"./init.js":123,"d3-array":26}],129:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = pow;
exports.powish = powish;
exports.sqrt = sqrt;
var _linear = require("./linear.js");
var _continuous = require("./continuous.js");
var _init = require("./init.js");
function transformPow(exponent) {
  return function (x) {
    return x < 0 ? -Math.pow(-x, exponent) : Math.pow(x, exponent);
  };
}
function transformSqrt(x) {
  return x < 0 ? -Math.sqrt(-x) : Math.sqrt(x);
}
function transformSquare(x) {
  return x < 0 ? -x * x : x * x;
}
function powish(transform) {
  var scale = transform(_continuous.identity, _continuous.identity),
    exponent = 1;
  function rescale() {
    return exponent === 1 ? transform(_continuous.identity, _continuous.identity) : exponent === 0.5 ? transform(transformSqrt, transformSquare) : transform(transformPow(exponent), transformPow(1 / exponent));
  }
  scale.exponent = function (_) {
    return arguments.length ? (exponent = +_, rescale()) : exponent;
  };
  return (0, _linear.linearish)(scale);
}
function pow() {
  var scale = powish((0, _continuous.transformer)());
  scale.copy = function () {
    return (0, _continuous.copy)(scale, pow()).exponent(scale.exponent());
  };
  _init.initRange.apply(scale, arguments);
  return scale;
}
function sqrt() {
  return pow.apply(null, arguments).exponent(0.5);
}

},{"./continuous.js":119,"./init.js":123,"./linear.js":124}],130:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = quantile;
var _d3Array = require("d3-array");
var _init = require("./init.js");
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function quantile() {
  var domain = [],
    range = [],
    thresholds = [],
    unknown;
  function rescale() {
    var i = 0,
      n = Math.max(1, range.length);
    thresholds = new Array(n - 1);
    while (++i < n) thresholds[i - 1] = (0, _d3Array.quantileSorted)(domain, i / n);
    return scale;
  }
  function scale(x) {
    return x == null || isNaN(x = +x) ? unknown : range[(0, _d3Array.bisect)(thresholds, x)];
  }
  scale.invertExtent = function (y) {
    var i = range.indexOf(y);
    return i < 0 ? [NaN, NaN] : [i > 0 ? thresholds[i - 1] : domain[0], i < thresholds.length ? thresholds[i] : domain[domain.length - 1]];
  };
  scale.domain = function (_) {
    if (!arguments.length) return domain.slice();
    domain = [];
    var _iterator = _createForOfIteratorHelper(_),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var d = _step.value;
        if (d != null && !isNaN(d = +d)) domain.push(d);
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
    domain.sort(_d3Array.ascending);
    return rescale();
  };
  scale.range = function (_) {
    return arguments.length ? (range = Array.from(_), rescale()) : range.slice();
  };
  scale.unknown = function (_) {
    return arguments.length ? (unknown = _, scale) : unknown;
  };
  scale.quantiles = function () {
    return thresholds.slice();
  };
  scale.copy = function () {
    return quantile().domain(domain).range(range).unknown(unknown);
  };
  return _init.initRange.apply(scale, arguments);
}

},{"./init.js":123,"d3-array":26}],131:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = quantize;
var _d3Array = require("d3-array");
var _linear = require("./linear.js");
var _init = require("./init.js");
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _iterableToArrayLimit(arr, i) { var _i = null == arr ? null : "undefined" != typeof Symbol && arr[Symbol.iterator] || arr["@@iterator"]; if (null != _i) { var _s, _e, _x, _r, _arr = [], _n = !0, _d = !1; try { if (_x = (_i = _i.call(arr)).next, 0 === i) { if (Object(_i) !== _i) return; _n = !1; } else for (; !(_n = (_s = _x.call(_i)).done) && (_arr.push(_s.value), _arr.length !== i); _n = !0); } catch (err) { _d = !0, _e = err; } finally { try { if (!_n && null != _i["return"] && (_r = _i["return"](), Object(_r) !== _r)) return; } finally { if (_d) throw _e; } } return _arr; } }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }
function quantize() {
  var x0 = 0,
    x1 = 1,
    n = 1,
    domain = [0.5],
    range = [0, 1],
    unknown;
  function scale(x) {
    return x != null && x <= x ? range[(0, _d3Array.bisect)(domain, x, 0, n)] : unknown;
  }
  function rescale() {
    var i = -1;
    domain = new Array(n);
    while (++i < n) domain[i] = ((i + 1) * x1 - (i - n) * x0) / (n + 1);
    return scale;
  }
  scale.domain = function (_) {
    var _ref;
    return arguments.length ? ((_ref = _slicedToArray(_, 2), x0 = _ref[0], x1 = _ref[1]), x0 = +x0, x1 = +x1, rescale()) : [x0, x1];
  };
  scale.range = function (_) {
    return arguments.length ? (n = (range = Array.from(_)).length - 1, rescale()) : range.slice();
  };
  scale.invertExtent = function (y) {
    var i = range.indexOf(y);
    return i < 0 ? [NaN, NaN] : i < 1 ? [x0, domain[0]] : i >= n ? [domain[n - 1], x1] : [domain[i - 1], domain[i]];
  };
  scale.unknown = function (_) {
    return arguments.length ? (unknown = _, scale) : scale;
  };
  scale.thresholds = function () {
    return domain.slice();
  };
  scale.copy = function () {
    return quantize().domain([x0, x1]).range(range).unknown(unknown);
  };
  return _init.initRange.apply((0, _linear.linearish)(scale), arguments);
}

},{"./init.js":123,"./linear.js":124,"d3-array":26}],132:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = radial;
var _continuous = _interopRequireDefault(require("./continuous.js"));
var _init = require("./init.js");
var _linear = require("./linear.js");
var _number = _interopRequireDefault(require("./number.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function square(x) {
  return Math.sign(x) * x * x;
}
function unsquare(x) {
  return Math.sign(x) * Math.sqrt(Math.abs(x));
}
function radial() {
  var squared = (0, _continuous["default"])(),
    range = [0, 1],
    round = false,
    unknown;
  function scale(x) {
    var y = unsquare(squared(x));
    return isNaN(y) ? unknown : round ? Math.round(y) : y;
  }
  scale.invert = function (y) {
    return squared.invert(square(y));
  };
  scale.domain = function (_) {
    return arguments.length ? (squared.domain(_), scale) : squared.domain();
  };
  scale.range = function (_) {
    return arguments.length ? (squared.range((range = Array.from(_, _number["default"])).map(square)), scale) : range.slice();
  };
  scale.rangeRound = function (_) {
    return scale.range(_).round(true);
  };
  scale.round = function (_) {
    return arguments.length ? (round = !!_, scale) : round;
  };
  scale.clamp = function (_) {
    return arguments.length ? (squared.clamp(_), scale) : squared.clamp();
  };
  scale.unknown = function (_) {
    return arguments.length ? (unknown = _, scale) : unknown;
  };
  scale.copy = function () {
    return radial(squared.domain(), range).round(round).clamp(squared.clamp()).unknown(unknown);
  };
  _init.initRange.apply(scale, arguments);
  return (0, _linear.linearish)(scale);
}

},{"./continuous.js":119,"./init.js":123,"./linear.js":124,"./number.js":127}],133:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.copy = copy;
exports["default"] = sequential;
exports.sequentialLog = sequentialLog;
exports.sequentialPow = sequentialPow;
exports.sequentialSqrt = sequentialSqrt;
exports.sequentialSymlog = sequentialSymlog;
var _d3Interpolate = require("d3-interpolate");
var _continuous = require("./continuous.js");
var _init = require("./init.js");
var _linear = require("./linear.js");
var _log = require("./log.js");
var _symlog = require("./symlog.js");
var _pow = require("./pow.js");
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _iterableToArrayLimit(arr, i) { var _i = null == arr ? null : "undefined" != typeof Symbol && arr[Symbol.iterator] || arr["@@iterator"]; if (null != _i) { var _s, _e, _x, _r, _arr = [], _n = !0, _d = !1; try { if (_x = (_i = _i.call(arr)).next, 0 === i) { if (Object(_i) !== _i) return; _n = !1; } else for (; !(_n = (_s = _x.call(_i)).done) && (_arr.push(_s.value), _arr.length !== i); _n = !0); } catch (err) { _d = !0, _e = err; } finally { try { if (!_n && null != _i["return"] && (_r = _i["return"](), Object(_r) !== _r)) return; } finally { if (_d) throw _e; } } return _arr; } }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }
function transformer() {
  var x0 = 0,
    x1 = 1,
    t0,
    t1,
    k10,
    transform,
    interpolator = _continuous.identity,
    clamp = false,
    unknown;
  function scale(x) {
    return x == null || isNaN(x = +x) ? unknown : interpolator(k10 === 0 ? 0.5 : (x = (transform(x) - t0) * k10, clamp ? Math.max(0, Math.min(1, x)) : x));
  }
  scale.domain = function (_) {
    var _ref;
    return arguments.length ? ((_ref = _slicedToArray(_, 2), x0 = _ref[0], x1 = _ref[1]), t0 = transform(x0 = +x0), t1 = transform(x1 = +x1), k10 = t0 === t1 ? 0 : 1 / (t1 - t0), scale) : [x0, x1];
  };
  scale.clamp = function (_) {
    return arguments.length ? (clamp = !!_, scale) : clamp;
  };
  scale.interpolator = function (_) {
    return arguments.length ? (interpolator = _, scale) : interpolator;
  };
  function range(interpolate) {
    return function (_) {
      var _ref2;
      var r0, r1;
      return arguments.length ? ((_ref2 = _slicedToArray(_, 2), r0 = _ref2[0], r1 = _ref2[1]), interpolator = interpolate(r0, r1), scale) : [interpolator(0), interpolator(1)];
    };
  }
  scale.range = range(_d3Interpolate.interpolate);
  scale.rangeRound = range(_d3Interpolate.interpolateRound);
  scale.unknown = function (_) {
    return arguments.length ? (unknown = _, scale) : unknown;
  };
  return function (t) {
    transform = t, t0 = t(x0), t1 = t(x1), k10 = t0 === t1 ? 0 : 1 / (t1 - t0);
    return scale;
  };
}
function copy(source, target) {
  return target.domain(source.domain()).interpolator(source.interpolator()).clamp(source.clamp()).unknown(source.unknown());
}
function sequential() {
  var scale = (0, _linear.linearish)(transformer()(_continuous.identity));
  scale.copy = function () {
    return copy(scale, sequential());
  };
  return _init.initInterpolator.apply(scale, arguments);
}
function sequentialLog() {
  var scale = (0, _log.loggish)(transformer()).domain([1, 10]);
  scale.copy = function () {
    return copy(scale, sequentialLog()).base(scale.base());
  };
  return _init.initInterpolator.apply(scale, arguments);
}
function sequentialSymlog() {
  var scale = (0, _symlog.symlogish)(transformer());
  scale.copy = function () {
    return copy(scale, sequentialSymlog()).constant(scale.constant());
  };
  return _init.initInterpolator.apply(scale, arguments);
}
function sequentialPow() {
  var scale = (0, _pow.powish)(transformer());
  scale.copy = function () {
    return copy(scale, sequentialPow()).exponent(scale.exponent());
  };
  return _init.initInterpolator.apply(scale, arguments);
}
function sequentialSqrt() {
  return sequentialPow.apply(null, arguments).exponent(0.5);
}

},{"./continuous.js":119,"./init.js":123,"./linear.js":124,"./log.js":125,"./pow.js":129,"./symlog.js":135,"d3-interpolate":100}],134:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = sequentialQuantile;
var _d3Array = require("d3-array");
var _continuous = require("./continuous.js");
var _init = require("./init.js");
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function sequentialQuantile() {
  var domain = [],
    interpolator = _continuous.identity;
  function scale(x) {
    if (x != null && !isNaN(x = +x)) return interpolator(((0, _d3Array.bisect)(domain, x, 1) - 1) / (domain.length - 1));
  }
  scale.domain = function (_) {
    if (!arguments.length) return domain.slice();
    domain = [];
    var _iterator = _createForOfIteratorHelper(_),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var d = _step.value;
        if (d != null && !isNaN(d = +d)) domain.push(d);
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
    domain.sort(_d3Array.ascending);
    return scale;
  };
  scale.interpolator = function (_) {
    return arguments.length ? (interpolator = _, scale) : interpolator;
  };
  scale.range = function () {
    return domain.map(function (d, i) {
      return interpolator(i / (domain.length - 1));
    });
  };
  scale.quantiles = function (n) {
    return Array.from({
      length: n + 1
    }, function (_, i) {
      return (0, _d3Array.quantile)(domain, i / n);
    });
  };
  scale.copy = function () {
    return sequentialQuantile(interpolator).domain(domain);
  };
  return _init.initInterpolator.apply(scale, arguments);
}

},{"./continuous.js":119,"./init.js":123,"d3-array":26}],135:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = symlog;
exports.symlogish = symlogish;
var _linear = require("./linear.js");
var _continuous = require("./continuous.js");
var _init = require("./init.js");
function transformSymlog(c) {
  return function (x) {
    return Math.sign(x) * Math.log1p(Math.abs(x / c));
  };
}
function transformSymexp(c) {
  return function (x) {
    return Math.sign(x) * Math.expm1(Math.abs(x)) * c;
  };
}
function symlogish(transform) {
  var c = 1,
    scale = transform(transformSymlog(c), transformSymexp(c));
  scale.constant = function (_) {
    return arguments.length ? transform(transformSymlog(c = +_), transformSymexp(c)) : c;
  };
  return (0, _linear.linearish)(scale);
}
function symlog() {
  var scale = symlogish((0, _continuous.transformer)());
  scale.copy = function () {
    return (0, _continuous.copy)(scale, symlog()).constant(scale.constant());
  };
  return _init.initRange.apply(scale, arguments);
}

},{"./continuous.js":119,"./init.js":123,"./linear.js":124}],136:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = threshold;
var _d3Array = require("d3-array");
var _init = require("./init.js");
function threshold() {
  var domain = [0.5],
    range = [0, 1],
    unknown,
    n = 1;
  function scale(x) {
    return x != null && x <= x ? range[(0, _d3Array.bisect)(domain, x, 0, n)] : unknown;
  }
  scale.domain = function (_) {
    return arguments.length ? (domain = Array.from(_), n = Math.min(domain.length, range.length - 1), scale) : domain.slice();
  };
  scale.range = function (_) {
    return arguments.length ? (range = Array.from(_), n = Math.min(domain.length, range.length - 1), scale) : range.slice();
  };
  scale.invertExtent = function (y) {
    var i = range.indexOf(y);
    return [domain[i - 1], domain[i]];
  };
  scale.unknown = function (_) {
    return arguments.length ? (unknown = _, scale) : unknown;
  };
  scale.copy = function () {
    return threshold().domain(domain).range(range).unknown(unknown);
  };
  return _init.initRange.apply(scale, arguments);
}

},{"./init.js":123,"d3-array":26}],137:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = tickFormat;
var _d3Array = require("d3-array");
var _d3Format = require("d3-format");
function tickFormat(start, stop, count, specifier) {
  var step = (0, _d3Array.tickStep)(start, stop, count),
    precision;
  specifier = (0, _d3Format.formatSpecifier)(specifier == null ? ",f" : specifier);
  switch (specifier.type) {
    case "s":
      {
        var value = Math.max(Math.abs(start), Math.abs(stop));
        if (specifier.precision == null && !isNaN(precision = (0, _d3Format.precisionPrefix)(step, value))) specifier.precision = precision;
        return (0, _d3Format.formatPrefix)(specifier, value);
      }
    case "":
    case "e":
    case "g":
    case "p":
    case "r":
      {
        if (specifier.precision == null && !isNaN(precision = (0, _d3Format.precisionRound)(step, Math.max(Math.abs(start), Math.abs(stop))))) specifier.precision = precision - (specifier.type === "e");
        break;
      }
    case "f":
    case "%":
      {
        if (specifier.precision == null && !isNaN(precision = (0, _d3Format.precisionFixed)(step))) specifier.precision = precision - (specifier.type === "%") * 2;
        break;
      }
  }
  return (0, _d3Format.format)(specifier);
}

},{"d3-array":26,"d3-format":84}],138:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.calendar = calendar;
exports["default"] = time;
var _d3Time = require("d3-time");
var _d3TimeFormat = require("d3-time-format");
var _continuous = _interopRequireWildcard(require("./continuous.js"));
var _init = require("./init.js");
var _nice = _interopRequireDefault(require("./nice.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function date(t) {
  return new Date(t);
}
function number(t) {
  return t instanceof Date ? +t : +new Date(+t);
}
function calendar(ticks, tickInterval, year, month, week, day, hour, minute, second, format) {
  var scale = (0, _continuous["default"])(),
    invert = scale.invert,
    domain = scale.domain;
  var formatMillisecond = format(".%L"),
    formatSecond = format(":%S"),
    formatMinute = format("%I:%M"),
    formatHour = format("%I %p"),
    formatDay = format("%a %d"),
    formatWeek = format("%b %d"),
    formatMonth = format("%B"),
    formatYear = format("%Y");
  function tickFormat(date) {
    return (second(date) < date ? formatMillisecond : minute(date) < date ? formatSecond : hour(date) < date ? formatMinute : day(date) < date ? formatHour : month(date) < date ? week(date) < date ? formatDay : formatWeek : year(date) < date ? formatMonth : formatYear)(date);
  }
  scale.invert = function (y) {
    return new Date(invert(y));
  };
  scale.domain = function (_) {
    return arguments.length ? domain(Array.from(_, number)) : domain().map(date);
  };
  scale.ticks = function (interval) {
    var d = domain();
    return ticks(d[0], d[d.length - 1], interval == null ? 10 : interval);
  };
  scale.tickFormat = function (count, specifier) {
    return specifier == null ? tickFormat : format(specifier);
  };
  scale.nice = function (interval) {
    var d = domain();
    if (!interval || typeof interval.range !== "function") interval = tickInterval(d[0], d[d.length - 1], interval == null ? 10 : interval);
    return interval ? domain((0, _nice["default"])(d, interval)) : scale;
  };
  scale.copy = function () {
    return (0, _continuous.copy)(scale, calendar(ticks, tickInterval, year, month, week, day, hour, minute, second, format));
  };
  return scale;
}
function time() {
  return _init.initRange.apply(calendar(_d3Time.timeTicks, _d3Time.timeTickInterval, _d3Time.timeYear, _d3Time.timeMonth, _d3Time.timeWeek, _d3Time.timeDay, _d3Time.timeHour, _d3Time.timeMinute, _d3Time.timeSecond, _d3TimeFormat.timeFormat).domain([new Date(2000, 0, 1), new Date(2000, 0, 2)]), arguments);
}

},{"./continuous.js":119,"./init.js":123,"./nice.js":126,"d3-time":261,"d3-time-format":254}],139:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = utcTime;
var _d3Time = require("d3-time");
var _d3TimeFormat = require("d3-time-format");
var _time = require("./time.js");
var _init = require("./init.js");
function utcTime() {
  return _init.initRange.apply((0, _time.calendar)(_d3Time.utcTicks, _d3Time.utcTickInterval, _d3Time.utcYear, _d3Time.utcMonth, _d3Time.utcWeek, _d3Time.utcDay, _d3Time.utcHour, _d3Time.utcMinute, _d3Time.utcSecond, _d3TimeFormat.utcFormat).domain([Date.UTC(2000, 0, 1), Date.UTC(2000, 0, 2)]), arguments);
}

},{"./init.js":123,"./time.js":138,"d3-time":261,"d3-time-format":254}],140:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = array;
// Given something array like (or null), returns something that is strictly an
// array. This is used to ensure that array-like objects passed to d3.selectAll
// or selection.selectAll are converted into proper arrays when creating a
// selection; we don’t ever want to create a selection backed by a live
// HTMLCollection or NodeList. However, note that selection.selectAll will use a
// static NodeList as a group, since it safely derived from querySelectorAll.
function array(x) {
  return x == null ? [] : Array.isArray(x) ? x : Array.from(x);
}

},{}],141:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
function _default(x) {
  return function () {
    return x;
  };
}

},{}],142:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _creator = _interopRequireDefault(require("./creator.js"));
var _select = _interopRequireDefault(require("./select.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _default(name) {
  return (0, _select["default"])((0, _creator["default"])(name).call(document.documentElement));
}

},{"./creator.js":143,"./select.js":151}],143:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _namespace = _interopRequireDefault(require("./namespace.js"));
var _namespaces = require("./namespaces.js");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function creatorInherit(name) {
  return function () {
    var document = this.ownerDocument,
      uri = this.namespaceURI;
    return uri === _namespaces.xhtml && document.documentElement.namespaceURI === _namespaces.xhtml ? document.createElement(name) : document.createElementNS(uri, name);
  };
}
function creatorFixed(fullname) {
  return function () {
    return this.ownerDocument.createElementNS(fullname.space, fullname.local);
  };
}
function _default(name) {
  var fullname = (0, _namespace["default"])(name);
  return (fullname.local ? creatorFixed : creatorInherit)(fullname);
}

},{"./namespace.js":147,"./namespaces.js":148}],144:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "create", {
  enumerable: true,
  get: function get() {
    return _create["default"];
  }
});
Object.defineProperty(exports, "creator", {
  enumerable: true,
  get: function get() {
    return _creator["default"];
  }
});
Object.defineProperty(exports, "local", {
  enumerable: true,
  get: function get() {
    return _local["default"];
  }
});
Object.defineProperty(exports, "matcher", {
  enumerable: true,
  get: function get() {
    return _matcher["default"];
  }
});
Object.defineProperty(exports, "namespace", {
  enumerable: true,
  get: function get() {
    return _namespace["default"];
  }
});
Object.defineProperty(exports, "namespaces", {
  enumerable: true,
  get: function get() {
    return _namespaces["default"];
  }
});
Object.defineProperty(exports, "pointer", {
  enumerable: true,
  get: function get() {
    return _pointer["default"];
  }
});
Object.defineProperty(exports, "pointers", {
  enumerable: true,
  get: function get() {
    return _pointers["default"];
  }
});
Object.defineProperty(exports, "select", {
  enumerable: true,
  get: function get() {
    return _select["default"];
  }
});
Object.defineProperty(exports, "selectAll", {
  enumerable: true,
  get: function get() {
    return _selectAll["default"];
  }
});
Object.defineProperty(exports, "selection", {
  enumerable: true,
  get: function get() {
    return _index["default"];
  }
});
Object.defineProperty(exports, "selector", {
  enumerable: true,
  get: function get() {
    return _selector["default"];
  }
});
Object.defineProperty(exports, "selectorAll", {
  enumerable: true,
  get: function get() {
    return _selectorAll["default"];
  }
});
Object.defineProperty(exports, "style", {
  enumerable: true,
  get: function get() {
    return _style.styleValue;
  }
});
Object.defineProperty(exports, "window", {
  enumerable: true,
  get: function get() {
    return _window["default"];
  }
});
var _create = _interopRequireDefault(require("./create.js"));
var _creator = _interopRequireDefault(require("./creator.js"));
var _local = _interopRequireDefault(require("./local.js"));
var _matcher = _interopRequireDefault(require("./matcher.js"));
var _namespace = _interopRequireDefault(require("./namespace.js"));
var _namespaces = _interopRequireDefault(require("./namespaces.js"));
var _pointer = _interopRequireDefault(require("./pointer.js"));
var _pointers = _interopRequireDefault(require("./pointers.js"));
var _select = _interopRequireDefault(require("./select.js"));
var _selectAll = _interopRequireDefault(require("./selectAll.js"));
var _index = _interopRequireDefault(require("./selection/index.js"));
var _selector = _interopRequireDefault(require("./selector.js"));
var _selectorAll = _interopRequireDefault(require("./selectorAll.js"));
var _style = require("./selection/style.js");
var _window = _interopRequireDefault(require("./window.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

},{"./create.js":142,"./creator.js":143,"./local.js":145,"./matcher.js":146,"./namespace.js":147,"./namespaces.js":148,"./pointer.js":149,"./pointers.js":150,"./select.js":151,"./selectAll.js":152,"./selection/index.js":167,"./selection/style.js":187,"./selector.js":189,"./selectorAll.js":190,"./window.js":192}],145:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = local;
var nextId = 0;
function local() {
  return new Local();
}
function Local() {
  this._ = "@" + (++nextId).toString(36);
}
Local.prototype = local.prototype = {
  constructor: Local,
  get: function get(node) {
    var id = this._;
    while (!(id in node)) if (!(node = node.parentNode)) return;
    return node[id];
  },
  set: function set(node, value) {
    return node[this._] = value;
  },
  remove: function remove(node) {
    return this._ in node && delete node[this._];
  },
  toString: function toString() {
    return this._;
  }
};

},{}],146:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.childMatcher = childMatcher;
exports["default"] = _default;
function _default(selector) {
  return function () {
    return this.matches(selector);
  };
}
function childMatcher(selector) {
  return function (node) {
    return node.matches(selector);
  };
}

},{}],147:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _namespaces = _interopRequireDefault(require("./namespaces.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _default(name) {
  var prefix = name += "",
    i = prefix.indexOf(":");
  if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
  return _namespaces["default"].hasOwnProperty(prefix) ? {
    space: _namespaces["default"][prefix],
    local: name
  } : name; // eslint-disable-line no-prototype-builtins
}

},{"./namespaces.js":148}],148:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.xhtml = exports["default"] = void 0;
var xhtml = "http://www.w3.org/1999/xhtml";
exports.xhtml = xhtml;
var _default = {
  svg: "http://www.w3.org/2000/svg",
  xhtml: xhtml,
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/"
};
exports["default"] = _default;

},{}],149:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _sourceEvent = _interopRequireDefault(require("./sourceEvent.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _default(event, node) {
  event = (0, _sourceEvent["default"])(event);
  if (node === undefined) node = event.currentTarget;
  if (node) {
    var svg = node.ownerSVGElement || node;
    if (svg.createSVGPoint) {
      var point = svg.createSVGPoint();
      point.x = event.clientX, point.y = event.clientY;
      point = point.matrixTransform(node.getScreenCTM().inverse());
      return [point.x, point.y];
    }
    if (node.getBoundingClientRect) {
      var rect = node.getBoundingClientRect();
      return [event.clientX - rect.left - node.clientLeft, event.clientY - rect.top - node.clientTop];
    }
  }
  return [event.pageX, event.pageY];
}

},{"./sourceEvent.js":191}],150:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _pointer = _interopRequireDefault(require("./pointer.js"));
var _sourceEvent = _interopRequireDefault(require("./sourceEvent.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _default(events, node) {
  if (events.target) {
    // i.e., instanceof Event, not TouchList or iterable
    events = (0, _sourceEvent["default"])(events);
    if (node === undefined) node = events.currentTarget;
    events = events.touches || [events];
  }
  return Array.from(events, function (event) {
    return (0, _pointer["default"])(event, node);
  });
}

},{"./pointer.js":149,"./sourceEvent.js":191}],151:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _index = require("./selection/index.js");
function _default(selector) {
  return typeof selector === "string" ? new _index.Selection([[document.querySelector(selector)]], [document.documentElement]) : new _index.Selection([[selector]], _index.root);
}

},{"./selection/index.js":167}],152:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _array = _interopRequireDefault(require("./array.js"));
var _index = require("./selection/index.js");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _default(selector) {
  return typeof selector === "string" ? new _index.Selection([document.querySelectorAll(selector)], [document.documentElement]) : new _index.Selection([(0, _array["default"])(selector)], _index.root);
}

},{"./array.js":140,"./selection/index.js":167}],153:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _creator = _interopRequireDefault(require("../creator.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _default(name) {
  var create = typeof name === "function" ? name : (0, _creator["default"])(name);
  return this.select(function () {
    return this.appendChild(create.apply(this, arguments));
  });
}

},{"../creator.js":143}],154:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _namespace = _interopRequireDefault(require("../namespace.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function attrRemove(name) {
  return function () {
    this.removeAttribute(name);
  };
}
function attrRemoveNS(fullname) {
  return function () {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}
function attrConstant(name, value) {
  return function () {
    this.setAttribute(name, value);
  };
}
function attrConstantNS(fullname, value) {
  return function () {
    this.setAttributeNS(fullname.space, fullname.local, value);
  };
}
function attrFunction(name, value) {
  return function () {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttribute(name);else this.setAttribute(name, v);
  };
}
function attrFunctionNS(fullname, value) {
  return function () {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttributeNS(fullname.space, fullname.local);else this.setAttributeNS(fullname.space, fullname.local, v);
  };
}
function _default(name, value) {
  var fullname = (0, _namespace["default"])(name);
  if (arguments.length < 2) {
    var node = this.node();
    return fullname.local ? node.getAttributeNS(fullname.space, fullname.local) : node.getAttribute(fullname);
  }
  return this.each((value == null ? fullname.local ? attrRemoveNS : attrRemove : typeof value === "function" ? fullname.local ? attrFunctionNS : attrFunction : fullname.local ? attrConstantNS : attrConstant)(fullname, value));
}

},{"../namespace.js":147}],155:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
function _default() {
  var callback = arguments[0];
  arguments[0] = this;
  callback.apply(null, arguments);
  return this;
}

},{}],156:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
function classArray(string) {
  return string.trim().split(/^|\s+/);
}
function classList(node) {
  return node.classList || new ClassList(node);
}
function ClassList(node) {
  this._node = node;
  this._names = classArray(node.getAttribute("class") || "");
}
ClassList.prototype = {
  add: function add(name) {
    var i = this._names.indexOf(name);
    if (i < 0) {
      this._names.push(name);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  remove: function remove(name) {
    var i = this._names.indexOf(name);
    if (i >= 0) {
      this._names.splice(i, 1);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  contains: function contains(name) {
    return this._names.indexOf(name) >= 0;
  }
};
function classedAdd(node, names) {
  var list = classList(node),
    i = -1,
    n = names.length;
  while (++i < n) list.add(names[i]);
}
function classedRemove(node, names) {
  var list = classList(node),
    i = -1,
    n = names.length;
  while (++i < n) list.remove(names[i]);
}
function classedTrue(names) {
  return function () {
    classedAdd(this, names);
  };
}
function classedFalse(names) {
  return function () {
    classedRemove(this, names);
  };
}
function classedFunction(names, value) {
  return function () {
    (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
  };
}
function _default(name, value) {
  var names = classArray(name + "");
  if (arguments.length < 2) {
    var list = classList(this.node()),
      i = -1,
      n = names.length;
    while (++i < n) if (!list.contains(names[i])) return false;
    return true;
  }
  return this.each((typeof value === "function" ? classedFunction : value ? classedTrue : classedFalse)(names, value));
}

},{}],157:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
function selection_cloneShallow() {
  var clone = this.cloneNode(false),
    parent = this.parentNode;
  return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
}
function selection_cloneDeep() {
  var clone = this.cloneNode(true),
    parent = this.parentNode;
  return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
}
function _default(deep) {
  return this.select(deep ? selection_cloneDeep : selection_cloneShallow);
}

},{}],158:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _index = require("./index.js");
var _enter = require("./enter.js");
var _constant = _interopRequireDefault(require("../constant.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function bindIndex(parent, group, enter, update, exit, data) {
  var i = 0,
    node,
    groupLength = group.length,
    dataLength = data.length;

  // Put any non-null nodes that fit into update.
  // Put any null nodes into enter.
  // Put any remaining data into enter.
  for (; i < dataLength; ++i) {
    if (node = group[i]) {
      node.__data__ = data[i];
      update[i] = node;
    } else {
      enter[i] = new _enter.EnterNode(parent, data[i]);
    }
  }

  // Put any non-null nodes that don’t fit into exit.
  for (; i < groupLength; ++i) {
    if (node = group[i]) {
      exit[i] = node;
    }
  }
}
function bindKey(parent, group, enter, update, exit, data, key) {
  var i,
    node,
    nodeByKeyValue = new Map(),
    groupLength = group.length,
    dataLength = data.length,
    keyValues = new Array(groupLength),
    keyValue;

  // Compute the key for each node.
  // If multiple nodes have the same key, the duplicates are added to exit.
  for (i = 0; i < groupLength; ++i) {
    if (node = group[i]) {
      keyValues[i] = keyValue = key.call(node, node.__data__, i, group) + "";
      if (nodeByKeyValue.has(keyValue)) {
        exit[i] = node;
      } else {
        nodeByKeyValue.set(keyValue, node);
      }
    }
  }

  // Compute the key for each datum.
  // If there a node associated with this key, join and add it to update.
  // If there is not (or the key is a duplicate), add it to enter.
  for (i = 0; i < dataLength; ++i) {
    keyValue = key.call(parent, data[i], i, data) + "";
    if (node = nodeByKeyValue.get(keyValue)) {
      update[i] = node;
      node.__data__ = data[i];
      nodeByKeyValue["delete"](keyValue);
    } else {
      enter[i] = new _enter.EnterNode(parent, data[i]);
    }
  }

  // Add any remaining nodes that were not bound to data to exit.
  for (i = 0; i < groupLength; ++i) {
    if ((node = group[i]) && nodeByKeyValue.get(keyValues[i]) === node) {
      exit[i] = node;
    }
  }
}
function datum(node) {
  return node.__data__;
}
function _default(value, key) {
  if (!arguments.length) return Array.from(this, datum);
  var bind = key ? bindKey : bindIndex,
    parents = this._parents,
    groups = this._groups;
  if (typeof value !== "function") value = (0, _constant["default"])(value);
  for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
    var parent = parents[j],
      group = groups[j],
      groupLength = group.length,
      data = arraylike(value.call(parent, parent && parent.__data__, j, parents)),
      dataLength = data.length,
      enterGroup = enter[j] = new Array(dataLength),
      updateGroup = update[j] = new Array(dataLength),
      exitGroup = exit[j] = new Array(groupLength);
    bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);

    // Now connect the enter nodes to their following update node, such that
    // appendChild can insert the materialized enter node before this node,
    // rather than at the end of the parent node.
    for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
      if (previous = enterGroup[i0]) {
        if (i0 >= i1) i1 = i0 + 1;
        while (!(next = updateGroup[i1]) && ++i1 < dataLength);
        previous._next = next || null;
      }
    }
  }
  update = new _index.Selection(update, parents);
  update._enter = enter;
  update._exit = exit;
  return update;
}

// Given some data, this returns an array-like view of it: an object that
// exposes a length property and allows numeric indexing. Note that unlike
// selectAll, this isn’t worried about “live” collections because the resulting
// array will only be used briefly while data is being bound. (It is possible to
// cause the data to change while iterating by using a key function, but please
// don’t; we’d rather avoid a gratuitous copy.)
function arraylike(data) {
  return _typeof(data) === "object" && "length" in data ? data // Array, TypedArray, NodeList, array-like
  : Array.from(data); // Map, Set, iterable, string, or anything else
}

},{"../constant.js":141,"./enter.js":163,"./index.js":167}],159:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
function _default(value) {
  return arguments.length ? this.property("__data__", value) : this.node().__data__;
}

},{}],160:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _window = _interopRequireDefault(require("../window.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function dispatchEvent(node, type, params) {
  var window = (0, _window["default"])(node),
    event = window.CustomEvent;
  if (typeof event === "function") {
    event = new event(type, params);
  } else {
    event = window.document.createEvent("Event");
    if (params) event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;else event.initEvent(type, false, false);
  }
  node.dispatchEvent(event);
}
function dispatchConstant(type, params) {
  return function () {
    return dispatchEvent(this, type, params);
  };
}
function dispatchFunction(type, params) {
  return function () {
    return dispatchEvent(this, type, params.apply(this, arguments));
  };
}
function _default(type, params) {
  return this.each((typeof params === "function" ? dispatchFunction : dispatchConstant)(type, params));
}

},{"../window.js":192}],161:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
function _default(callback) {
  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
      if (node = group[i]) callback.call(node, node.__data__, i, group);
    }
  }
  return this;
}

},{}],162:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
function _default() {
  return !this.node();
}

},{}],163:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.EnterNode = EnterNode;
exports["default"] = _default;
var _sparse = _interopRequireDefault(require("./sparse.js"));
var _index = require("./index.js");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _default() {
  return new _index.Selection(this._enter || this._groups.map(_sparse["default"]), this._parents);
}
function EnterNode(parent, datum) {
  this.ownerDocument = parent.ownerDocument;
  this.namespaceURI = parent.namespaceURI;
  this._next = null;
  this._parent = parent;
  this.__data__ = datum;
}
EnterNode.prototype = {
  constructor: EnterNode,
  appendChild: function appendChild(child) {
    return this._parent.insertBefore(child, this._next);
  },
  insertBefore: function insertBefore(child, next) {
    return this._parent.insertBefore(child, next);
  },
  querySelector: function querySelector(selector) {
    return this._parent.querySelector(selector);
  },
  querySelectorAll: function querySelectorAll(selector) {
    return this._parent.querySelectorAll(selector);
  }
};

},{"./index.js":167,"./sparse.js":186}],164:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _sparse = _interopRequireDefault(require("./sparse.js"));
var _index = require("./index.js");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _default() {
  return new _index.Selection(this._exit || this._groups.map(_sparse["default"]), this._parents);
}

},{"./index.js":167,"./sparse.js":186}],165:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _index = require("./index.js");
var _matcher = _interopRequireDefault(require("../matcher.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _default(match) {
  if (typeof match !== "function") match = (0, _matcher["default"])(match);
  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node);
      }
    }
  }
  return new _index.Selection(subgroups, this._parents);
}

},{"../matcher.js":146,"./index.js":167}],166:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
function htmlRemove() {
  this.innerHTML = "";
}
function htmlConstant(value) {
  return function () {
    this.innerHTML = value;
  };
}
function htmlFunction(value) {
  return function () {
    var v = value.apply(this, arguments);
    this.innerHTML = v == null ? "" : v;
  };
}
function _default(value) {
  return arguments.length ? this.each(value == null ? htmlRemove : (typeof value === "function" ? htmlFunction : htmlConstant)(value)) : this.node().innerHTML;
}

},{}],167:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Selection = Selection;
exports.root = exports["default"] = void 0;
var _select = _interopRequireDefault(require("./select.js"));
var _selectAll = _interopRequireDefault(require("./selectAll.js"));
var _selectChild = _interopRequireDefault(require("./selectChild.js"));
var _selectChildren = _interopRequireDefault(require("./selectChildren.js"));
var _filter = _interopRequireDefault(require("./filter.js"));
var _data = _interopRequireDefault(require("./data.js"));
var _enter = _interopRequireDefault(require("./enter.js"));
var _exit = _interopRequireDefault(require("./exit.js"));
var _join = _interopRequireDefault(require("./join.js"));
var _merge = _interopRequireDefault(require("./merge.js"));
var _order = _interopRequireDefault(require("./order.js"));
var _sort = _interopRequireDefault(require("./sort.js"));
var _call = _interopRequireDefault(require("./call.js"));
var _nodes = _interopRequireDefault(require("./nodes.js"));
var _node = _interopRequireDefault(require("./node.js"));
var _size = _interopRequireDefault(require("./size.js"));
var _empty = _interopRequireDefault(require("./empty.js"));
var _each = _interopRequireDefault(require("./each.js"));
var _attr = _interopRequireDefault(require("./attr.js"));
var _style = _interopRequireDefault(require("./style.js"));
var _property = _interopRequireDefault(require("./property.js"));
var _classed = _interopRequireDefault(require("./classed.js"));
var _text = _interopRequireDefault(require("./text.js"));
var _html = _interopRequireDefault(require("./html.js"));
var _raise = _interopRequireDefault(require("./raise.js"));
var _lower = _interopRequireDefault(require("./lower.js"));
var _append = _interopRequireDefault(require("./append.js"));
var _insert = _interopRequireDefault(require("./insert.js"));
var _remove = _interopRequireDefault(require("./remove.js"));
var _clone = _interopRequireDefault(require("./clone.js"));
var _datum = _interopRequireDefault(require("./datum.js"));
var _on = _interopRequireDefault(require("./on.js"));
var _dispatch = _interopRequireDefault(require("./dispatch.js"));
var _iterator = _interopRequireDefault(require("./iterator.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
var root = [null];
exports.root = root;
function Selection(groups, parents) {
  this._groups = groups;
  this._parents = parents;
}
function selection() {
  return new Selection([[document.documentElement]], root);
}
function selection_selection() {
  return this;
}
Selection.prototype = selection.prototype = _defineProperty({
  constructor: Selection,
  select: _select["default"],
  selectAll: _selectAll["default"],
  selectChild: _selectChild["default"],
  selectChildren: _selectChildren["default"],
  filter: _filter["default"],
  data: _data["default"],
  enter: _enter["default"],
  exit: _exit["default"],
  join: _join["default"],
  merge: _merge["default"],
  selection: selection_selection,
  order: _order["default"],
  sort: _sort["default"],
  call: _call["default"],
  nodes: _nodes["default"],
  node: _node["default"],
  size: _size["default"],
  empty: _empty["default"],
  each: _each["default"],
  attr: _attr["default"],
  style: _style["default"],
  property: _property["default"],
  classed: _classed["default"],
  text: _text["default"],
  html: _html["default"],
  raise: _raise["default"],
  lower: _lower["default"],
  append: _append["default"],
  insert: _insert["default"],
  remove: _remove["default"],
  clone: _clone["default"],
  datum: _datum["default"],
  on: _on["default"],
  dispatch: _dispatch["default"]
}, Symbol.iterator, _iterator["default"]);
var _default = selection;
exports["default"] = _default;

},{"./append.js":153,"./attr.js":154,"./call.js":155,"./classed.js":156,"./clone.js":157,"./data.js":158,"./datum.js":159,"./dispatch.js":160,"./each.js":161,"./empty.js":162,"./enter.js":163,"./exit.js":164,"./filter.js":165,"./html.js":166,"./insert.js":168,"./iterator.js":169,"./join.js":170,"./lower.js":171,"./merge.js":172,"./node.js":173,"./nodes.js":174,"./on.js":175,"./order.js":176,"./property.js":177,"./raise.js":178,"./remove.js":179,"./select.js":180,"./selectAll.js":181,"./selectChild.js":182,"./selectChildren.js":183,"./size.js":184,"./sort.js":185,"./style.js":187,"./text.js":188}],168:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _creator = _interopRequireDefault(require("../creator.js"));
var _selector = _interopRequireDefault(require("../selector.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function constantNull() {
  return null;
}
function _default(name, before) {
  var create = typeof name === "function" ? name : (0, _creator["default"])(name),
    select = before == null ? constantNull : typeof before === "function" ? before : (0, _selector["default"])(before);
  return this.select(function () {
    return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
  });
}

},{"../creator.js":143,"../selector.js":189}],169:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _callee;
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, defineProperty = Object.defineProperty || function (obj, key, desc) { obj[key] = desc.value; }, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return defineProperty(generator, "_invoke", { value: makeInvokeMethod(innerFn, self, context) }), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == _typeof(value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; defineProperty(this, "_invoke", { value: function value(method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; } function maybeInvokeDelegate(delegate, context) { var methodName = context.method, method = delegate.iterator[methodName]; if (undefined === method) return context.delegate = null, "throw" === methodName && delegate.iterator["return"] && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method) || "return" !== methodName && (context.method = "throw", context.arg = new TypeError("The iterator does not provide a '" + methodName + "' method")), ContinueSentinel; var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), defineProperty(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (val) { var object = Object(val), keys = []; for (var key in object) keys.push(key); return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, "catch": function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }
var _marked = /*#__PURE__*/_regeneratorRuntime().mark(_callee);
function _callee() {
  var groups, j, m, group, i, n, node;
  return _regeneratorRuntime().wrap(function _callee$(_context) {
    while (1) switch (_context.prev = _context.next) {
      case 0:
        groups = this._groups, j = 0, m = groups.length;
      case 1:
        if (!(j < m)) {
          _context.next = 13;
          break;
        }
        group = groups[j], i = 0, n = group.length;
      case 3:
        if (!(i < n)) {
          _context.next = 10;
          break;
        }
        if (!(node = group[i])) {
          _context.next = 7;
          break;
        }
        _context.next = 7;
        return node;
      case 7:
        ++i;
        _context.next = 3;
        break;
      case 10:
        ++j;
        _context.next = 1;
        break;
      case 13:
      case "end":
        return _context.stop();
    }
  }, _marked, this);
}

},{}],170:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
function _default(onenter, onupdate, onexit) {
  var enter = this.enter(),
    update = this,
    exit = this.exit();
  if (typeof onenter === "function") {
    enter = onenter(enter);
    if (enter) enter = enter.selection();
  } else {
    enter = enter.append(onenter + "");
  }
  if (onupdate != null) {
    update = onupdate(update);
    if (update) update = update.selection();
  }
  if (onexit == null) exit.remove();else onexit(exit);
  return enter && update ? enter.merge(update).order() : update;
}

},{}],171:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
function lower() {
  if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
}
function _default() {
  return this.each(lower);
}

},{}],172:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _index = require("./index.js");
function _default(context) {
  var selection = context.selection ? context.selection() : context;
  for (var groups0 = this._groups, groups1 = selection._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge[i] = node;
      }
    }
  }
  for (; j < m0; ++j) {
    merges[j] = groups0[j];
  }
  return new _index.Selection(merges, this._parents);
}

},{"./index.js":167}],173:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
function _default() {
  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
      var node = group[i];
      if (node) return node;
    }
  }
  return null;
}

},{}],174:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
function _default() {
  return Array.from(this);
}

},{}],175:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
function contextListener(listener) {
  return function (event) {
    listener.call(this, event, this.__data__);
  };
}
function parseTypenames(typenames) {
  return typenames.trim().split(/^|\s+/).map(function (t) {
    var name = "",
      i = t.indexOf(".");
    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
    return {
      type: t,
      name: name
    };
  });
}
function onRemove(typename) {
  return function () {
    var on = this.__on;
    if (!on) return;
    for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
      if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.options);
      } else {
        on[++i] = o;
      }
    }
    if (++i) on.length = i;else delete this.__on;
  };
}
function onAdd(typename, value, options) {
  return function () {
    var on = this.__on,
      o,
      listener = contextListener(value);
    if (on) for (var j = 0, m = on.length; j < m; ++j) {
      if ((o = on[j]).type === typename.type && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.options);
        this.addEventListener(o.type, o.listener = listener, o.options = options);
        o.value = value;
        return;
      }
    }
    this.addEventListener(typename.type, listener, options);
    o = {
      type: typename.type,
      name: typename.name,
      value: value,
      listener: listener,
      options: options
    };
    if (!on) this.__on = [o];else on.push(o);
  };
}
function _default(typename, value, options) {
  var typenames = parseTypenames(typename + ""),
    i,
    n = typenames.length,
    t;
  if (arguments.length < 2) {
    var on = this.node().__on;
    if (on) for (var j = 0, m = on.length, o; j < m; ++j) {
      for (i = 0, o = on[j]; i < n; ++i) {
        if ((t = typenames[i]).type === o.type && t.name === o.name) {
          return o.value;
        }
      }
    }
    return;
  }
  on = value ? onAdd : onRemove;
  for (i = 0; i < n; ++i) this.each(on(typenames[i], value, options));
  return this;
}

},{}],176:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
function _default() {
  for (var groups = this._groups, j = -1, m = groups.length; ++j < m;) {
    for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
      if (node = group[i]) {
        if (next && node.compareDocumentPosition(next) ^ 4) next.parentNode.insertBefore(node, next);
        next = node;
      }
    }
  }
  return this;
}

},{}],177:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
function propertyRemove(name) {
  return function () {
    delete this[name];
  };
}
function propertyConstant(name, value) {
  return function () {
    this[name] = value;
  };
}
function propertyFunction(name, value) {
  return function () {
    var v = value.apply(this, arguments);
    if (v == null) delete this[name];else this[name] = v;
  };
}
function _default(name, value) {
  return arguments.length > 1 ? this.each((value == null ? propertyRemove : typeof value === "function" ? propertyFunction : propertyConstant)(name, value)) : this.node()[name];
}

},{}],178:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
function raise() {
  if (this.nextSibling) this.parentNode.appendChild(this);
}
function _default() {
  return this.each(raise);
}

},{}],179:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
function remove() {
  var parent = this.parentNode;
  if (parent) parent.removeChild(this);
}
function _default() {
  return this.each(remove);
}

},{}],180:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _index = require("./index.js");
var _selector = _interopRequireDefault(require("../selector.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _default(select) {
  if (typeof select !== "function") select = (0, _selector["default"])(select);
  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
      if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
        if ("__data__" in node) subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
      }
    }
  }
  return new _index.Selection(subgroups, this._parents);
}

},{"../selector.js":189,"./index.js":167}],181:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _index = require("./index.js");
var _array = _interopRequireDefault(require("../array.js"));
var _selectorAll = _interopRequireDefault(require("../selectorAll.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function arrayAll(select) {
  return function () {
    return (0, _array["default"])(select.apply(this, arguments));
  };
}
function _default(select) {
  if (typeof select === "function") select = arrayAll(select);else select = (0, _selectorAll["default"])(select);
  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        subgroups.push(select.call(node, node.__data__, i, group));
        parents.push(node);
      }
    }
  }
  return new _index.Selection(subgroups, parents);
}

},{"../array.js":140,"../selectorAll.js":190,"./index.js":167}],182:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _matcher = require("../matcher.js");
var find = Array.prototype.find;
function childFind(match) {
  return function () {
    return find.call(this.children, match);
  };
}
function childFirst() {
  return this.firstElementChild;
}
function _default(match) {
  return this.select(match == null ? childFirst : childFind(typeof match === "function" ? match : (0, _matcher.childMatcher)(match)));
}

},{"../matcher.js":146}],183:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _matcher = require("../matcher.js");
var filter = Array.prototype.filter;
function children() {
  return Array.from(this.children);
}
function childrenFilter(match) {
  return function () {
    return filter.call(this.children, match);
  };
}
function _default(match) {
  return this.selectAll(match == null ? children : childrenFilter(typeof match === "function" ? match : (0, _matcher.childMatcher)(match)));
}

},{"../matcher.js":146}],184:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _default() {
  var size = 0;
  var _iterator = _createForOfIteratorHelper(this),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var node = _step.value;
      ++size;
    } // eslint-disable-line no-unused-vars
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  return size;
}

},{}],185:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _index = require("./index.js");
function _default(compare) {
  if (!compare) compare = ascending;
  function compareNode(a, b) {
    return a && b ? compare(a.__data__, b.__data__) : !a - !b;
  }
  for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        sortgroup[i] = node;
      }
    }
    sortgroup.sort(compareNode);
  }
  return new _index.Selection(sortgroups, this._parents).order();
}
function ascending(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

},{"./index.js":167}],186:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
function _default(update) {
  return new Array(update.length);
}

},{}],187:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
exports.styleValue = styleValue;
var _window = _interopRequireDefault(require("../window.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function styleRemove(name) {
  return function () {
    this.style.removeProperty(name);
  };
}
function styleConstant(name, value, priority) {
  return function () {
    this.style.setProperty(name, value, priority);
  };
}
function styleFunction(name, value, priority) {
  return function () {
    var v = value.apply(this, arguments);
    if (v == null) this.style.removeProperty(name);else this.style.setProperty(name, v, priority);
  };
}
function _default(name, value, priority) {
  return arguments.length > 1 ? this.each((value == null ? styleRemove : typeof value === "function" ? styleFunction : styleConstant)(name, value, priority == null ? "" : priority)) : styleValue(this.node(), name);
}
function styleValue(node, name) {
  return node.style.getPropertyValue(name) || (0, _window["default"])(node).getComputedStyle(node, null).getPropertyValue(name);
}

},{"../window.js":192}],188:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
function textRemove() {
  this.textContent = "";
}
function textConstant(value) {
  return function () {
    this.textContent = value;
  };
}
function textFunction(value) {
  return function () {
    var v = value.apply(this, arguments);
    this.textContent = v == null ? "" : v;
  };
}
function _default(value) {
  return arguments.length ? this.each(value == null ? textRemove : (typeof value === "function" ? textFunction : textConstant)(value)) : this.node().textContent;
}

},{}],189:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
function none() {}
function _default(selector) {
  return selector == null ? none : function () {
    return this.querySelector(selector);
  };
}

},{}],190:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
function empty() {
  return [];
}
function _default(selector) {
  return selector == null ? empty : function () {
    return this.querySelectorAll(selector);
  };
}

},{}],191:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
function _default(event) {
  var sourceEvent;
  while (sourceEvent = event.sourceEvent) event = sourceEvent;
  return event;
}

},{}],192:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
function _default(node) {
  return node.ownerDocument && node.ownerDocument.defaultView // node is a Node
  || node.document && node // node is a Window
  || node.defaultView; // node is a Document
}

},{}],193:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _constant = _interopRequireDefault(require("./constant.js"));
var _math = require("./math.js");
var _path = require("./path.js");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function arcInnerRadius(d) {
  return d.innerRadius;
}
function arcOuterRadius(d) {
  return d.outerRadius;
}
function arcStartAngle(d) {
  return d.startAngle;
}
function arcEndAngle(d) {
  return d.endAngle;
}
function arcPadAngle(d) {
  return d && d.padAngle; // Note: optional!
}

function intersect(x0, y0, x1, y1, x2, y2, x3, y3) {
  var x10 = x1 - x0,
    y10 = y1 - y0,
    x32 = x3 - x2,
    y32 = y3 - y2,
    t = y32 * x10 - x32 * y10;
  if (t * t < _math.epsilon) return;
  t = (x32 * (y0 - y2) - y32 * (x0 - x2)) / t;
  return [x0 + t * x10, y0 + t * y10];
}

// Compute perpendicular offset line of length rc.
// http://mathworld.wolfram.com/Circle-LineIntersection.html
function cornerTangents(x0, y0, x1, y1, r1, rc, cw) {
  var x01 = x0 - x1,
    y01 = y0 - y1,
    lo = (cw ? rc : -rc) / (0, _math.sqrt)(x01 * x01 + y01 * y01),
    ox = lo * y01,
    oy = -lo * x01,
    x11 = x0 + ox,
    y11 = y0 + oy,
    x10 = x1 + ox,
    y10 = y1 + oy,
    x00 = (x11 + x10) / 2,
    y00 = (y11 + y10) / 2,
    dx = x10 - x11,
    dy = y10 - y11,
    d2 = dx * dx + dy * dy,
    r = r1 - rc,
    D = x11 * y10 - x10 * y11,
    d = (dy < 0 ? -1 : 1) * (0, _math.sqrt)((0, _math.max)(0, r * r * d2 - D * D)),
    cx0 = (D * dy - dx * d) / d2,
    cy0 = (-D * dx - dy * d) / d2,
    cx1 = (D * dy + dx * d) / d2,
    cy1 = (-D * dx + dy * d) / d2,
    dx0 = cx0 - x00,
    dy0 = cy0 - y00,
    dx1 = cx1 - x00,
    dy1 = cy1 - y00;

  // Pick the closer of the two intersection points.
  // TODO Is there a faster way to determine which intersection to use?
  if (dx0 * dx0 + dy0 * dy0 > dx1 * dx1 + dy1 * dy1) cx0 = cx1, cy0 = cy1;
  return {
    cx: cx0,
    cy: cy0,
    x01: -ox,
    y01: -oy,
    x11: cx0 * (r1 / r - 1),
    y11: cy0 * (r1 / r - 1)
  };
}
function _default() {
  var innerRadius = arcInnerRadius,
    outerRadius = arcOuterRadius,
    cornerRadius = (0, _constant["default"])(0),
    padRadius = null,
    startAngle = arcStartAngle,
    endAngle = arcEndAngle,
    padAngle = arcPadAngle,
    context = null,
    path = (0, _path.withPath)(arc);
  function arc() {
    var buffer,
      r,
      r0 = +innerRadius.apply(this, arguments),
      r1 = +outerRadius.apply(this, arguments),
      a0 = startAngle.apply(this, arguments) - _math.halfPi,
      a1 = endAngle.apply(this, arguments) - _math.halfPi,
      da = (0, _math.abs)(a1 - a0),
      cw = a1 > a0;
    if (!context) context = buffer = path();

    // Ensure that the outer radius is always larger than the inner radius.
    if (r1 < r0) r = r1, r1 = r0, r0 = r;

    // Is it a point?
    if (!(r1 > _math.epsilon)) context.moveTo(0, 0);

    // Or is it a circle or annulus?
    else if (da > _math.tau - _math.epsilon) {
      context.moveTo(r1 * (0, _math.cos)(a0), r1 * (0, _math.sin)(a0));
      context.arc(0, 0, r1, a0, a1, !cw);
      if (r0 > _math.epsilon) {
        context.moveTo(r0 * (0, _math.cos)(a1), r0 * (0, _math.sin)(a1));
        context.arc(0, 0, r0, a1, a0, cw);
      }
    }

    // Or is it a circular or annular sector?
    else {
      var a01 = a0,
        a11 = a1,
        a00 = a0,
        a10 = a1,
        da0 = da,
        da1 = da,
        ap = padAngle.apply(this, arguments) / 2,
        rp = ap > _math.epsilon && (padRadius ? +padRadius.apply(this, arguments) : (0, _math.sqrt)(r0 * r0 + r1 * r1)),
        rc = (0, _math.min)((0, _math.abs)(r1 - r0) / 2, +cornerRadius.apply(this, arguments)),
        rc0 = rc,
        rc1 = rc,
        t0,
        t1;

      // Apply padding? Note that since r1 ≥ r0, da1 ≥ da0.
      if (rp > _math.epsilon) {
        var p0 = (0, _math.asin)(rp / r0 * (0, _math.sin)(ap)),
          p1 = (0, _math.asin)(rp / r1 * (0, _math.sin)(ap));
        if ((da0 -= p0 * 2) > _math.epsilon) p0 *= cw ? 1 : -1, a00 += p0, a10 -= p0;else da0 = 0, a00 = a10 = (a0 + a1) / 2;
        if ((da1 -= p1 * 2) > _math.epsilon) p1 *= cw ? 1 : -1, a01 += p1, a11 -= p1;else da1 = 0, a01 = a11 = (a0 + a1) / 2;
      }
      var x01 = r1 * (0, _math.cos)(a01),
        y01 = r1 * (0, _math.sin)(a01),
        x10 = r0 * (0, _math.cos)(a10),
        y10 = r0 * (0, _math.sin)(a10);

      // Apply rounded corners?
      if (rc > _math.epsilon) {
        var x11 = r1 * (0, _math.cos)(a11),
          y11 = r1 * (0, _math.sin)(a11),
          x00 = r0 * (0, _math.cos)(a00),
          y00 = r0 * (0, _math.sin)(a00),
          oc;

        // Restrict the corner radius according to the sector angle. If this
        // intersection fails, it’s probably because the arc is too small, so
        // disable the corner radius entirely.
        if (da < _math.pi) {
          if (oc = intersect(x01, y01, x00, y00, x11, y11, x10, y10)) {
            var ax = x01 - oc[0],
              ay = y01 - oc[1],
              bx = x11 - oc[0],
              by = y11 - oc[1],
              kc = 1 / (0, _math.sin)((0, _math.acos)((ax * bx + ay * by) / ((0, _math.sqrt)(ax * ax + ay * ay) * (0, _math.sqrt)(bx * bx + by * by))) / 2),
              lc = (0, _math.sqrt)(oc[0] * oc[0] + oc[1] * oc[1]);
            rc0 = (0, _math.min)(rc, (r0 - lc) / (kc - 1));
            rc1 = (0, _math.min)(rc, (r1 - lc) / (kc + 1));
          } else {
            rc0 = rc1 = 0;
          }
        }
      }

      // Is the sector collapsed to a line?
      if (!(da1 > _math.epsilon)) context.moveTo(x01, y01);

      // Does the sector’s outer ring have rounded corners?
      else if (rc1 > _math.epsilon) {
        t0 = cornerTangents(x00, y00, x01, y01, r1, rc1, cw);
        t1 = cornerTangents(x11, y11, x10, y10, r1, rc1, cw);
        context.moveTo(t0.cx + t0.x01, t0.cy + t0.y01);

        // Have the corners merged?
        if (rc1 < rc) context.arc(t0.cx, t0.cy, rc1, (0, _math.atan2)(t0.y01, t0.x01), (0, _math.atan2)(t1.y01, t1.x01), !cw);

        // Otherwise, draw the two corners and the ring.
        else {
          context.arc(t0.cx, t0.cy, rc1, (0, _math.atan2)(t0.y01, t0.x01), (0, _math.atan2)(t0.y11, t0.x11), !cw);
          context.arc(0, 0, r1, (0, _math.atan2)(t0.cy + t0.y11, t0.cx + t0.x11), (0, _math.atan2)(t1.cy + t1.y11, t1.cx + t1.x11), !cw);
          context.arc(t1.cx, t1.cy, rc1, (0, _math.atan2)(t1.y11, t1.x11), (0, _math.atan2)(t1.y01, t1.x01), !cw);
        }
      }

      // Or is the outer ring just a circular arc?
      else context.moveTo(x01, y01), context.arc(0, 0, r1, a01, a11, !cw);

      // Is there no inner ring, and it’s a circular sector?
      // Or perhaps it’s an annular sector collapsed due to padding?
      if (!(r0 > _math.epsilon) || !(da0 > _math.epsilon)) context.lineTo(x10, y10);

      // Does the sector’s inner ring (or point) have rounded corners?
      else if (rc0 > _math.epsilon) {
        t0 = cornerTangents(x10, y10, x11, y11, r0, -rc0, cw);
        t1 = cornerTangents(x01, y01, x00, y00, r0, -rc0, cw);
        context.lineTo(t0.cx + t0.x01, t0.cy + t0.y01);

        // Have the corners merged?
        if (rc0 < rc) context.arc(t0.cx, t0.cy, rc0, (0, _math.atan2)(t0.y01, t0.x01), (0, _math.atan2)(t1.y01, t1.x01), !cw);

        // Otherwise, draw the two corners and the ring.
        else {
          context.arc(t0.cx, t0.cy, rc0, (0, _math.atan2)(t0.y01, t0.x01), (0, _math.atan2)(t0.y11, t0.x11), !cw);
          context.arc(0, 0, r0, (0, _math.atan2)(t0.cy + t0.y11, t0.cx + t0.x11), (0, _math.atan2)(t1.cy + t1.y11, t1.cx + t1.x11), cw);
          context.arc(t1.cx, t1.cy, rc0, (0, _math.atan2)(t1.y11, t1.x11), (0, _math.atan2)(t1.y01, t1.x01), !cw);
        }
      }

      // Or is the inner ring just a circular arc?
      else context.arc(0, 0, r0, a10, a00, cw);
    }
    context.closePath();
    if (buffer) return context = null, buffer + "" || null;
  }
  arc.centroid = function () {
    var r = (+innerRadius.apply(this, arguments) + +outerRadius.apply(this, arguments)) / 2,
      a = (+startAngle.apply(this, arguments) + +endAngle.apply(this, arguments)) / 2 - _math.pi / 2;
    return [(0, _math.cos)(a) * r, (0, _math.sin)(a) * r];
  };
  arc.innerRadius = function (_) {
    return arguments.length ? (innerRadius = typeof _ === "function" ? _ : (0, _constant["default"])(+_), arc) : innerRadius;
  };
  arc.outerRadius = function (_) {
    return arguments.length ? (outerRadius = typeof _ === "function" ? _ : (0, _constant["default"])(+_), arc) : outerRadius;
  };
  arc.cornerRadius = function (_) {
    return arguments.length ? (cornerRadius = typeof _ === "function" ? _ : (0, _constant["default"])(+_), arc) : cornerRadius;
  };
  arc.padRadius = function (_) {
    return arguments.length ? (padRadius = _ == null ? null : typeof _ === "function" ? _ : (0, _constant["default"])(+_), arc) : padRadius;
  };
  arc.startAngle = function (_) {
    return arguments.length ? (startAngle = typeof _ === "function" ? _ : (0, _constant["default"])(+_), arc) : startAngle;
  };
  arc.endAngle = function (_) {
    return arguments.length ? (endAngle = typeof _ === "function" ? _ : (0, _constant["default"])(+_), arc) : endAngle;
  };
  arc.padAngle = function (_) {
    return arguments.length ? (padAngle = typeof _ === "function" ? _ : (0, _constant["default"])(+_), arc) : padAngle;
  };
  arc.context = function (_) {
    return arguments.length ? (context = _ == null ? null : _, arc) : context;
  };
  return arc;
}

},{"./constant.js":197,"./math.js":221,"./path.js":234}],194:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _array = _interopRequireDefault(require("./array.js"));
var _constant = _interopRequireDefault(require("./constant.js"));
var _linear = _interopRequireDefault(require("./curve/linear.js"));
var _line = _interopRequireDefault(require("./line.js"));
var _path = require("./path.js");
var _point = require("./point.js");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _default(x0, y0, y1) {
  var x1 = null,
    defined = (0, _constant["default"])(true),
    context = null,
    curve = _linear["default"],
    output = null,
    path = (0, _path.withPath)(area);
  x0 = typeof x0 === "function" ? x0 : x0 === undefined ? _point.x : (0, _constant["default"])(+x0);
  y0 = typeof y0 === "function" ? y0 : y0 === undefined ? (0, _constant["default"])(0) : (0, _constant["default"])(+y0);
  y1 = typeof y1 === "function" ? y1 : y1 === undefined ? _point.y : (0, _constant["default"])(+y1);
  function area(data) {
    var i,
      j,
      k,
      n = (data = (0, _array["default"])(data)).length,
      d,
      defined0 = false,
      buffer,
      x0z = new Array(n),
      y0z = new Array(n);
    if (context == null) output = curve(buffer = path());
    for (i = 0; i <= n; ++i) {
      if (!(i < n && defined(d = data[i], i, data)) === defined0) {
        if (defined0 = !defined0) {
          j = i;
          output.areaStart();
          output.lineStart();
        } else {
          output.lineEnd();
          output.lineStart();
          for (k = i - 1; k >= j; --k) {
            output.point(x0z[k], y0z[k]);
          }
          output.lineEnd();
          output.areaEnd();
        }
      }
      if (defined0) {
        x0z[i] = +x0(d, i, data), y0z[i] = +y0(d, i, data);
        output.point(x1 ? +x1(d, i, data) : x0z[i], y1 ? +y1(d, i, data) : y0z[i]);
      }
    }
    if (buffer) return output = null, buffer + "" || null;
  }
  function arealine() {
    return (0, _line["default"])().defined(defined).curve(curve).context(context);
  }
  area.x = function (_) {
    return arguments.length ? (x0 = typeof _ === "function" ? _ : (0, _constant["default"])(+_), x1 = null, area) : x0;
  };
  area.x0 = function (_) {
    return arguments.length ? (x0 = typeof _ === "function" ? _ : (0, _constant["default"])(+_), area) : x0;
  };
  area.x1 = function (_) {
    return arguments.length ? (x1 = _ == null ? null : typeof _ === "function" ? _ : (0, _constant["default"])(+_), area) : x1;
  };
  area.y = function (_) {
    return arguments.length ? (y0 = typeof _ === "function" ? _ : (0, _constant["default"])(+_), y1 = null, area) : y0;
  };
  area.y0 = function (_) {
    return arguments.length ? (y0 = typeof _ === "function" ? _ : (0, _constant["default"])(+_), area) : y0;
  };
  area.y1 = function (_) {
    return arguments.length ? (y1 = _ == null ? null : typeof _ === "function" ? _ : (0, _constant["default"])(+_), area) : y1;
  };
  area.lineX0 = area.lineY0 = function () {
    return arealine().x(x0).y(y0);
  };
  area.lineY1 = function () {
    return arealine().x(x0).y(y1);
  };
  area.lineX1 = function () {
    return arealine().x(x1).y(y0);
  };
  area.defined = function (_) {
    return arguments.length ? (defined = typeof _ === "function" ? _ : (0, _constant["default"])(!!_), area) : defined;
  };
  area.curve = function (_) {
    return arguments.length ? (curve = _, context != null && (output = curve(context)), area) : curve;
  };
  area.context = function (_) {
    return arguments.length ? (_ == null ? context = output = null : output = curve(context = _), area) : context;
  };
  return area;
}

},{"./array.js":196,"./constant.js":197,"./curve/linear.js":209,"./line.js":218,"./path.js":234,"./point.js":236}],195:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _radial = _interopRequireWildcard(require("./curve/radial.js"));
var _area = _interopRequireDefault(require("./area.js"));
var _lineRadial = require("./lineRadial.js");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _default() {
  var a = (0, _area["default"])().curve(_radial.curveRadialLinear),
    c = a.curve,
    x0 = a.lineX0,
    x1 = a.lineX1,
    y0 = a.lineY0,
    y1 = a.lineY1;
  a.angle = a.x, delete a.x;
  a.startAngle = a.x0, delete a.x0;
  a.endAngle = a.x1, delete a.x1;
  a.radius = a.y, delete a.y;
  a.innerRadius = a.y0, delete a.y0;
  a.outerRadius = a.y1, delete a.y1;
  a.lineStartAngle = function () {
    return (0, _lineRadial.lineRadial)(x0());
  }, delete a.lineX0;
  a.lineEndAngle = function () {
    return (0, _lineRadial.lineRadial)(x1());
  }, delete a.lineX1;
  a.lineInnerRadius = function () {
    return (0, _lineRadial.lineRadial)(y0());
  }, delete a.lineY0;
  a.lineOuterRadius = function () {
    return (0, _lineRadial.lineRadial)(y1());
  }, delete a.lineY1;
  a.curve = function (_) {
    return arguments.length ? c((0, _radial["default"])(_)) : c()._curve;
  };
  return a;
}

},{"./area.js":194,"./curve/radial.js":213,"./lineRadial.js":219}],196:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
exports.slice = void 0;
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
var slice = Array.prototype.slice;
exports.slice = slice;
function _default(x) {
  return _typeof(x) === "object" && "length" in x ? x // Array, TypedArray, NodeList, array-like
  : Array.from(x); // Map, Set, iterable, string, or anything else
}

},{}],197:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
function _default(x) {
  return function constant() {
    return x;
  };
}

},{}],198:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Basis = Basis;
exports["default"] = _default;
exports.point = _point;
function _point(that, x, y) {
  that._context.bezierCurveTo((2 * that._x0 + that._x1) / 3, (2 * that._y0 + that._y1) / 3, (that._x0 + 2 * that._x1) / 3, (that._y0 + 2 * that._y1) / 3, (that._x0 + 4 * that._x1 + x) / 6, (that._y0 + 4 * that._y1 + y) / 6);
}
function Basis(context) {
  this._context = context;
}
Basis.prototype = {
  areaStart: function areaStart() {
    this._line = 0;
  },
  areaEnd: function areaEnd() {
    this._line = NaN;
  },
  lineStart: function lineStart() {
    this._x0 = this._x1 = this._y0 = this._y1 = NaN;
    this._point = 0;
  },
  lineEnd: function lineEnd() {
    switch (this._point) {
      case 3:
        _point(this, this._x1, this._y1);
      // falls through
      case 2:
        this._context.lineTo(this._x1, this._y1);
        break;
    }
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function point(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0:
        this._point = 1;
        this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);
        break;
      case 1:
        this._point = 2;
        break;
      case 2:
        this._point = 3;
        this._context.lineTo((5 * this._x0 + this._x1) / 6, (5 * this._y0 + this._y1) / 6);
      // falls through
      default:
        _point(this, x, y);
        break;
    }
    this._x0 = this._x1, this._x1 = x;
    this._y0 = this._y1, this._y1 = y;
  }
};
function _default(context) {
  return new Basis(context);
}

},{}],199:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _noop = _interopRequireDefault(require("../noop.js"));
var _basis = require("./basis.js");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function BasisClosed(context) {
  this._context = context;
}
BasisClosed.prototype = {
  areaStart: _noop["default"],
  areaEnd: _noop["default"],
  lineStart: function lineStart() {
    this._x0 = this._x1 = this._x2 = this._x3 = this._x4 = this._y0 = this._y1 = this._y2 = this._y3 = this._y4 = NaN;
    this._point = 0;
  },
  lineEnd: function lineEnd() {
    switch (this._point) {
      case 1:
        {
          this._context.moveTo(this._x2, this._y2);
          this._context.closePath();
          break;
        }
      case 2:
        {
          this._context.moveTo((this._x2 + 2 * this._x3) / 3, (this._y2 + 2 * this._y3) / 3);
          this._context.lineTo((this._x3 + 2 * this._x2) / 3, (this._y3 + 2 * this._y2) / 3);
          this._context.closePath();
          break;
        }
      case 3:
        {
          this.point(this._x2, this._y2);
          this.point(this._x3, this._y3);
          this.point(this._x4, this._y4);
          break;
        }
    }
  },
  point: function point(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0:
        this._point = 1;
        this._x2 = x, this._y2 = y;
        break;
      case 1:
        this._point = 2;
        this._x3 = x, this._y3 = y;
        break;
      case 2:
        this._point = 3;
        this._x4 = x, this._y4 = y;
        this._context.moveTo((this._x0 + 4 * this._x1 + x) / 6, (this._y0 + 4 * this._y1 + y) / 6);
        break;
      default:
        (0, _basis.point)(this, x, y);
        break;
    }
    this._x0 = this._x1, this._x1 = x;
    this._y0 = this._y1, this._y1 = y;
  }
};
function _default(context) {
  return new BasisClosed(context);
}

},{"../noop.js":222,"./basis.js":198}],200:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _basis = require("./basis.js");
function BasisOpen(context) {
  this._context = context;
}
BasisOpen.prototype = {
  areaStart: function areaStart() {
    this._line = 0;
  },
  areaEnd: function areaEnd() {
    this._line = NaN;
  },
  lineStart: function lineStart() {
    this._x0 = this._x1 = this._y0 = this._y1 = NaN;
    this._point = 0;
  },
  lineEnd: function lineEnd() {
    if (this._line || this._line !== 0 && this._point === 3) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function point(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0:
        this._point = 1;
        break;
      case 1:
        this._point = 2;
        break;
      case 2:
        this._point = 3;
        var x0 = (this._x0 + 4 * this._x1 + x) / 6,
          y0 = (this._y0 + 4 * this._y1 + y) / 6;
        this._line ? this._context.lineTo(x0, y0) : this._context.moveTo(x0, y0);
        break;
      case 3:
        this._point = 4;
      // falls through
      default:
        (0, _basis.point)(this, x, y);
        break;
    }
    this._x0 = this._x1, this._x1 = x;
    this._y0 = this._y1, this._y1 = y;
  }
};
function _default(context) {
  return new BasisOpen(context);
}

},{"./basis.js":198}],201:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.bumpRadial = bumpRadial;
exports.bumpX = bumpX;
exports.bumpY = bumpY;
var _pointRadial = _interopRequireDefault(require("../pointRadial.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
var Bump = /*#__PURE__*/function () {
  function Bump(context, x) {
    _classCallCheck(this, Bump);
    this._context = context;
    this._x = x;
  }
  _createClass(Bump, [{
    key: "areaStart",
    value: function areaStart() {
      this._line = 0;
    }
  }, {
    key: "areaEnd",
    value: function areaEnd() {
      this._line = NaN;
    }
  }, {
    key: "lineStart",
    value: function lineStart() {
      this._point = 0;
    }
  }, {
    key: "lineEnd",
    value: function lineEnd() {
      if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
      this._line = 1 - this._line;
    }
  }, {
    key: "point",
    value: function point(x, y) {
      x = +x, y = +y;
      switch (this._point) {
        case 0:
          {
            this._point = 1;
            if (this._line) this._context.lineTo(x, y);else this._context.moveTo(x, y);
            break;
          }
        case 1:
          this._point = 2;
        // falls through
        default:
          {
            if (this._x) this._context.bezierCurveTo(this._x0 = (this._x0 + x) / 2, this._y0, this._x0, y, x, y);else this._context.bezierCurveTo(this._x0, this._y0 = (this._y0 + y) / 2, x, this._y0, x, y);
            break;
          }
      }
      this._x0 = x, this._y0 = y;
    }
  }]);
  return Bump;
}();
var BumpRadial = /*#__PURE__*/function () {
  function BumpRadial(context) {
    _classCallCheck(this, BumpRadial);
    this._context = context;
  }
  _createClass(BumpRadial, [{
    key: "lineStart",
    value: function lineStart() {
      this._point = 0;
    }
  }, {
    key: "lineEnd",
    value: function lineEnd() {}
  }, {
    key: "point",
    value: function point(x, y) {
      x = +x, y = +y;
      if (this._point === 0) {
        this._point = 1;
      } else {
        var _this$_context, _this$_context2;
        var p0 = (0, _pointRadial["default"])(this._x0, this._y0);
        var p1 = (0, _pointRadial["default"])(this._x0, this._y0 = (this._y0 + y) / 2);
        var p2 = (0, _pointRadial["default"])(x, this._y0);
        var p3 = (0, _pointRadial["default"])(x, y);
        (_this$_context = this._context).moveTo.apply(_this$_context, _toConsumableArray(p0));
        (_this$_context2 = this._context).bezierCurveTo.apply(_this$_context2, _toConsumableArray(p1).concat(_toConsumableArray(p2), _toConsumableArray(p3)));
      }
      this._x0 = x, this._y0 = y;
    }
  }]);
  return BumpRadial;
}();
function bumpX(context) {
  return new Bump(context, true);
}
function bumpY(context) {
  return new Bump(context, false);
}
function bumpRadial(context) {
  return new BumpRadial(context);
}

},{"../pointRadial.js":237}],202:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _basis = require("./basis.js");
function Bundle(context, beta) {
  this._basis = new _basis.Basis(context);
  this._beta = beta;
}
Bundle.prototype = {
  lineStart: function lineStart() {
    this._x = [];
    this._y = [];
    this._basis.lineStart();
  },
  lineEnd: function lineEnd() {
    var x = this._x,
      y = this._y,
      j = x.length - 1;
    if (j > 0) {
      var x0 = x[0],
        y0 = y[0],
        dx = x[j] - x0,
        dy = y[j] - y0,
        i = -1,
        t;
      while (++i <= j) {
        t = i / j;
        this._basis.point(this._beta * x[i] + (1 - this._beta) * (x0 + t * dx), this._beta * y[i] + (1 - this._beta) * (y0 + t * dy));
      }
    }
    this._x = this._y = null;
    this._basis.lineEnd();
  },
  point: function point(x, y) {
    this._x.push(+x);
    this._y.push(+y);
  }
};
var _default = function custom(beta) {
  function bundle(context) {
    return beta === 1 ? new _basis.Basis(context) : new Bundle(context, beta);
  }
  bundle.beta = function (beta) {
    return custom(+beta);
  };
  return bundle;
}(0.85);
exports["default"] = _default;

},{"./basis.js":198}],203:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Cardinal = Cardinal;
exports["default"] = void 0;
exports.point = _point;
function _point(that, x, y) {
  that._context.bezierCurveTo(that._x1 + that._k * (that._x2 - that._x0), that._y1 + that._k * (that._y2 - that._y0), that._x2 + that._k * (that._x1 - x), that._y2 + that._k * (that._y1 - y), that._x2, that._y2);
}
function Cardinal(context, tension) {
  this._context = context;
  this._k = (1 - tension) / 6;
}
Cardinal.prototype = {
  areaStart: function areaStart() {
    this._line = 0;
  },
  areaEnd: function areaEnd() {
    this._line = NaN;
  },
  lineStart: function lineStart() {
    this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
    this._point = 0;
  },
  lineEnd: function lineEnd() {
    switch (this._point) {
      case 2:
        this._context.lineTo(this._x2, this._y2);
        break;
      case 3:
        _point(this, this._x1, this._y1);
        break;
    }
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function point(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0:
        this._point = 1;
        this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);
        break;
      case 1:
        this._point = 2;
        this._x1 = x, this._y1 = y;
        break;
      case 2:
        this._point = 3;
      // falls through
      default:
        _point(this, x, y);
        break;
    }
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
  }
};
var _default = function custom(tension) {
  function cardinal(context) {
    return new Cardinal(context, tension);
  }
  cardinal.tension = function (tension) {
    return custom(+tension);
  };
  return cardinal;
}(0);
exports["default"] = _default;

},{}],204:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CardinalClosed = CardinalClosed;
exports["default"] = void 0;
var _noop = _interopRequireDefault(require("../noop.js"));
var _cardinal = require("./cardinal.js");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function CardinalClosed(context, tension) {
  this._context = context;
  this._k = (1 - tension) / 6;
}
CardinalClosed.prototype = {
  areaStart: _noop["default"],
  areaEnd: _noop["default"],
  lineStart: function lineStart() {
    this._x0 = this._x1 = this._x2 = this._x3 = this._x4 = this._x5 = this._y0 = this._y1 = this._y2 = this._y3 = this._y4 = this._y5 = NaN;
    this._point = 0;
  },
  lineEnd: function lineEnd() {
    switch (this._point) {
      case 1:
        {
          this._context.moveTo(this._x3, this._y3);
          this._context.closePath();
          break;
        }
      case 2:
        {
          this._context.lineTo(this._x3, this._y3);
          this._context.closePath();
          break;
        }
      case 3:
        {
          this.point(this._x3, this._y3);
          this.point(this._x4, this._y4);
          this.point(this._x5, this._y5);
          break;
        }
    }
  },
  point: function point(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0:
        this._point = 1;
        this._x3 = x, this._y3 = y;
        break;
      case 1:
        this._point = 2;
        this._context.moveTo(this._x4 = x, this._y4 = y);
        break;
      case 2:
        this._point = 3;
        this._x5 = x, this._y5 = y;
        break;
      default:
        (0, _cardinal.point)(this, x, y);
        break;
    }
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
  }
};
var _default = function custom(tension) {
  function cardinal(context) {
    return new CardinalClosed(context, tension);
  }
  cardinal.tension = function (tension) {
    return custom(+tension);
  };
  return cardinal;
}(0);
exports["default"] = _default;

},{"../noop.js":222,"./cardinal.js":203}],205:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CardinalOpen = CardinalOpen;
exports["default"] = void 0;
var _cardinal = require("./cardinal.js");
function CardinalOpen(context, tension) {
  this._context = context;
  this._k = (1 - tension) / 6;
}
CardinalOpen.prototype = {
  areaStart: function areaStart() {
    this._line = 0;
  },
  areaEnd: function areaEnd() {
    this._line = NaN;
  },
  lineStart: function lineStart() {
    this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
    this._point = 0;
  },
  lineEnd: function lineEnd() {
    if (this._line || this._line !== 0 && this._point === 3) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function point(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0:
        this._point = 1;
        break;
      case 1:
        this._point = 2;
        break;
      case 2:
        this._point = 3;
        this._line ? this._context.lineTo(this._x2, this._y2) : this._context.moveTo(this._x2, this._y2);
        break;
      case 3:
        this._point = 4;
      // falls through
      default:
        (0, _cardinal.point)(this, x, y);
        break;
    }
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
  }
};
var _default = function custom(tension) {
  function cardinal(context) {
    return new CardinalOpen(context, tension);
  }
  cardinal.tension = function (tension) {
    return custom(+tension);
  };
  return cardinal;
}(0);
exports["default"] = _default;

},{"./cardinal.js":203}],206:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
exports.point = _point;
var _math = require("../math.js");
var _cardinal = require("./cardinal.js");
function _point(that, x, y) {
  var x1 = that._x1,
    y1 = that._y1,
    x2 = that._x2,
    y2 = that._y2;
  if (that._l01_a > _math.epsilon) {
    var a = 2 * that._l01_2a + 3 * that._l01_a * that._l12_a + that._l12_2a,
      n = 3 * that._l01_a * (that._l01_a + that._l12_a);
    x1 = (x1 * a - that._x0 * that._l12_2a + that._x2 * that._l01_2a) / n;
    y1 = (y1 * a - that._y0 * that._l12_2a + that._y2 * that._l01_2a) / n;
  }
  if (that._l23_a > _math.epsilon) {
    var b = 2 * that._l23_2a + 3 * that._l23_a * that._l12_a + that._l12_2a,
      m = 3 * that._l23_a * (that._l23_a + that._l12_a);
    x2 = (x2 * b + that._x1 * that._l23_2a - x * that._l12_2a) / m;
    y2 = (y2 * b + that._y1 * that._l23_2a - y * that._l12_2a) / m;
  }
  that._context.bezierCurveTo(x1, y1, x2, y2, that._x2, that._y2);
}
function CatmullRom(context, alpha) {
  this._context = context;
  this._alpha = alpha;
}
CatmullRom.prototype = {
  areaStart: function areaStart() {
    this._line = 0;
  },
  areaEnd: function areaEnd() {
    this._line = NaN;
  },
  lineStart: function lineStart() {
    this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
    this._l01_a = this._l12_a = this._l23_a = this._l01_2a = this._l12_2a = this._l23_2a = this._point = 0;
  },
  lineEnd: function lineEnd() {
    switch (this._point) {
      case 2:
        this._context.lineTo(this._x2, this._y2);
        break;
      case 3:
        this.point(this._x2, this._y2);
        break;
    }
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function point(x, y) {
    x = +x, y = +y;
    if (this._point) {
      var x23 = this._x2 - x,
        y23 = this._y2 - y;
      this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
    }
    switch (this._point) {
      case 0:
        this._point = 1;
        this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);
        break;
      case 1:
        this._point = 2;
        break;
      case 2:
        this._point = 3;
      // falls through
      default:
        _point(this, x, y);
        break;
    }
    this._l01_a = this._l12_a, this._l12_a = this._l23_a;
    this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a;
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
  }
};
var _default = function custom(alpha) {
  function catmullRom(context) {
    return alpha ? new CatmullRom(context, alpha) : new _cardinal.Cardinal(context, 0);
  }
  catmullRom.alpha = function (alpha) {
    return custom(+alpha);
  };
  return catmullRom;
}(0.5);
exports["default"] = _default;

},{"../math.js":221,"./cardinal.js":203}],207:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _cardinalClosed = require("./cardinalClosed.js");
var _noop = _interopRequireDefault(require("../noop.js"));
var _catmullRom = require("./catmullRom.js");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function CatmullRomClosed(context, alpha) {
  this._context = context;
  this._alpha = alpha;
}
CatmullRomClosed.prototype = {
  areaStart: _noop["default"],
  areaEnd: _noop["default"],
  lineStart: function lineStart() {
    this._x0 = this._x1 = this._x2 = this._x3 = this._x4 = this._x5 = this._y0 = this._y1 = this._y2 = this._y3 = this._y4 = this._y5 = NaN;
    this._l01_a = this._l12_a = this._l23_a = this._l01_2a = this._l12_2a = this._l23_2a = this._point = 0;
  },
  lineEnd: function lineEnd() {
    switch (this._point) {
      case 1:
        {
          this._context.moveTo(this._x3, this._y3);
          this._context.closePath();
          break;
        }
      case 2:
        {
          this._context.lineTo(this._x3, this._y3);
          this._context.closePath();
          break;
        }
      case 3:
        {
          this.point(this._x3, this._y3);
          this.point(this._x4, this._y4);
          this.point(this._x5, this._y5);
          break;
        }
    }
  },
  point: function point(x, y) {
    x = +x, y = +y;
    if (this._point) {
      var x23 = this._x2 - x,
        y23 = this._y2 - y;
      this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
    }
    switch (this._point) {
      case 0:
        this._point = 1;
        this._x3 = x, this._y3 = y;
        break;
      case 1:
        this._point = 2;
        this._context.moveTo(this._x4 = x, this._y4 = y);
        break;
      case 2:
        this._point = 3;
        this._x5 = x, this._y5 = y;
        break;
      default:
        (0, _catmullRom.point)(this, x, y);
        break;
    }
    this._l01_a = this._l12_a, this._l12_a = this._l23_a;
    this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a;
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
  }
};
var _default = function custom(alpha) {
  function catmullRom(context) {
    return alpha ? new CatmullRomClosed(context, alpha) : new _cardinalClosed.CardinalClosed(context, 0);
  }
  catmullRom.alpha = function (alpha) {
    return custom(+alpha);
  };
  return catmullRom;
}(0.5);
exports["default"] = _default;

},{"../noop.js":222,"./cardinalClosed.js":204,"./catmullRom.js":206}],208:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _cardinalOpen = require("./cardinalOpen.js");
var _catmullRom = require("./catmullRom.js");
function CatmullRomOpen(context, alpha) {
  this._context = context;
  this._alpha = alpha;
}
CatmullRomOpen.prototype = {
  areaStart: function areaStart() {
    this._line = 0;
  },
  areaEnd: function areaEnd() {
    this._line = NaN;
  },
  lineStart: function lineStart() {
    this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
    this._l01_a = this._l12_a = this._l23_a = this._l01_2a = this._l12_2a = this._l23_2a = this._point = 0;
  },
  lineEnd: function lineEnd() {
    if (this._line || this._line !== 0 && this._point === 3) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function point(x, y) {
    x = +x, y = +y;
    if (this._point) {
      var x23 = this._x2 - x,
        y23 = this._y2 - y;
      this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
    }
    switch (this._point) {
      case 0:
        this._point = 1;
        break;
      case 1:
        this._point = 2;
        break;
      case 2:
        this._point = 3;
        this._line ? this._context.lineTo(this._x2, this._y2) : this._context.moveTo(this._x2, this._y2);
        break;
      case 3:
        this._point = 4;
      // falls through
      default:
        (0, _catmullRom.point)(this, x, y);
        break;
    }
    this._l01_a = this._l12_a, this._l12_a = this._l23_a;
    this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a;
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
  }
};
var _default = function custom(alpha) {
  function catmullRom(context) {
    return alpha ? new CatmullRomOpen(context, alpha) : new _cardinalOpen.CardinalOpen(context, 0);
  }
  catmullRom.alpha = function (alpha) {
    return custom(+alpha);
  };
  return catmullRom;
}(0.5);
exports["default"] = _default;

},{"./cardinalOpen.js":205,"./catmullRom.js":206}],209:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
function Linear(context) {
  this._context = context;
}
Linear.prototype = {
  areaStart: function areaStart() {
    this._line = 0;
  },
  areaEnd: function areaEnd() {
    this._line = NaN;
  },
  lineStart: function lineStart() {
    this._point = 0;
  },
  lineEnd: function lineEnd() {
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function point(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0:
        this._point = 1;
        this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);
        break;
      case 1:
        this._point = 2;
      // falls through
      default:
        this._context.lineTo(x, y);
        break;
    }
  }
};
function _default(context) {
  return new Linear(context);
}

},{}],210:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _noop = _interopRequireDefault(require("../noop.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function LinearClosed(context) {
  this._context = context;
}
LinearClosed.prototype = {
  areaStart: _noop["default"],
  areaEnd: _noop["default"],
  lineStart: function lineStart() {
    this._point = 0;
  },
  lineEnd: function lineEnd() {
    if (this._point) this._context.closePath();
  },
  point: function point(x, y) {
    x = +x, y = +y;
    if (this._point) this._context.lineTo(x, y);else this._point = 1, this._context.moveTo(x, y);
  }
};
function _default(context) {
  return new LinearClosed(context);
}

},{"../noop.js":222}],211:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.monotoneX = monotoneX;
exports.monotoneY = monotoneY;
function sign(x) {
  return x < 0 ? -1 : 1;
}

// Calculate the slopes of the tangents (Hermite-type interpolation) based on
// the following paper: Steffen, M. 1990. A Simple Method for Monotonic
// Interpolation in One Dimension. Astronomy and Astrophysics, Vol. 239, NO.
// NOV(II), P. 443, 1990.
function slope3(that, x2, y2) {
  var h0 = that._x1 - that._x0,
    h1 = x2 - that._x1,
    s0 = (that._y1 - that._y0) / (h0 || h1 < 0 && -0),
    s1 = (y2 - that._y1) / (h1 || h0 < 0 && -0),
    p = (s0 * h1 + s1 * h0) / (h0 + h1);
  return (sign(s0) + sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) || 0;
}

// Calculate a one-sided slope.
function slope2(that, t) {
  var h = that._x1 - that._x0;
  return h ? (3 * (that._y1 - that._y0) / h - t) / 2 : t;
}

// According to https://en.wikipedia.org/wiki/Cubic_Hermite_spline#Representations
// "you can express cubic Hermite interpolation in terms of cubic Bézier curves
// with respect to the four values p0, p0 + m0 / 3, p1 - m1 / 3, p1".
function _point(that, t0, t1) {
  var x0 = that._x0,
    y0 = that._y0,
    x1 = that._x1,
    y1 = that._y1,
    dx = (x1 - x0) / 3;
  that._context.bezierCurveTo(x0 + dx, y0 + dx * t0, x1 - dx, y1 - dx * t1, x1, y1);
}
function MonotoneX(context) {
  this._context = context;
}
MonotoneX.prototype = {
  areaStart: function areaStart() {
    this._line = 0;
  },
  areaEnd: function areaEnd() {
    this._line = NaN;
  },
  lineStart: function lineStart() {
    this._x0 = this._x1 = this._y0 = this._y1 = this._t0 = NaN;
    this._point = 0;
  },
  lineEnd: function lineEnd() {
    switch (this._point) {
      case 2:
        this._context.lineTo(this._x1, this._y1);
        break;
      case 3:
        _point(this, this._t0, slope2(this, this._t0));
        break;
    }
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function point(x, y) {
    var t1 = NaN;
    x = +x, y = +y;
    if (x === this._x1 && y === this._y1) return; // Ignore coincident points.
    switch (this._point) {
      case 0:
        this._point = 1;
        this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);
        break;
      case 1:
        this._point = 2;
        break;
      case 2:
        this._point = 3;
        _point(this, slope2(this, t1 = slope3(this, x, y)), t1);
        break;
      default:
        _point(this, this._t0, t1 = slope3(this, x, y));
        break;
    }
    this._x0 = this._x1, this._x1 = x;
    this._y0 = this._y1, this._y1 = y;
    this._t0 = t1;
  }
};
function MonotoneY(context) {
  this._context = new ReflectContext(context);
}
(MonotoneY.prototype = Object.create(MonotoneX.prototype)).point = function (x, y) {
  MonotoneX.prototype.point.call(this, y, x);
};
function ReflectContext(context) {
  this._context = context;
}
ReflectContext.prototype = {
  moveTo: function moveTo(x, y) {
    this._context.moveTo(y, x);
  },
  closePath: function closePath() {
    this._context.closePath();
  },
  lineTo: function lineTo(x, y) {
    this._context.lineTo(y, x);
  },
  bezierCurveTo: function bezierCurveTo(x1, y1, x2, y2, x, y) {
    this._context.bezierCurveTo(y1, x1, y2, x2, y, x);
  }
};
function monotoneX(context) {
  return new MonotoneX(context);
}
function monotoneY(context) {
  return new MonotoneY(context);
}

},{}],212:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
function Natural(context) {
  this._context = context;
}
Natural.prototype = {
  areaStart: function areaStart() {
    this._line = 0;
  },
  areaEnd: function areaEnd() {
    this._line = NaN;
  },
  lineStart: function lineStart() {
    this._x = [];
    this._y = [];
  },
  lineEnd: function lineEnd() {
    var x = this._x,
      y = this._y,
      n = x.length;
    if (n) {
      this._line ? this._context.lineTo(x[0], y[0]) : this._context.moveTo(x[0], y[0]);
      if (n === 2) {
        this._context.lineTo(x[1], y[1]);
      } else {
        var px = controlPoints(x),
          py = controlPoints(y);
        for (var i0 = 0, i1 = 1; i1 < n; ++i0, ++i1) {
          this._context.bezierCurveTo(px[0][i0], py[0][i0], px[1][i0], py[1][i0], x[i1], y[i1]);
        }
      }
    }
    if (this._line || this._line !== 0 && n === 1) this._context.closePath();
    this._line = 1 - this._line;
    this._x = this._y = null;
  },
  point: function point(x, y) {
    this._x.push(+x);
    this._y.push(+y);
  }
};

// See https://www.particleincell.com/2012/bezier-splines/ for derivation.
function controlPoints(x) {
  var i,
    n = x.length - 1,
    m,
    a = new Array(n),
    b = new Array(n),
    r = new Array(n);
  a[0] = 0, b[0] = 2, r[0] = x[0] + 2 * x[1];
  for (i = 1; i < n - 1; ++i) a[i] = 1, b[i] = 4, r[i] = 4 * x[i] + 2 * x[i + 1];
  a[n - 1] = 2, b[n - 1] = 7, r[n - 1] = 8 * x[n - 1] + x[n];
  for (i = 1; i < n; ++i) m = a[i] / b[i - 1], b[i] -= m, r[i] -= m * r[i - 1];
  a[n - 1] = r[n - 1] / b[n - 1];
  for (i = n - 2; i >= 0; --i) a[i] = (r[i] - a[i + 1]) / b[i];
  b[n - 1] = (x[n] + a[n - 1]) / 2;
  for (i = 0; i < n - 1; ++i) b[i] = 2 * x[i + 1] - a[i + 1];
  return [a, b];
}
function _default(context) {
  return new Natural(context);
}

},{}],213:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.curveRadialLinear = void 0;
exports["default"] = curveRadial;
var _linear = _interopRequireDefault(require("./linear.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
var curveRadialLinear = curveRadial(_linear["default"]);
exports.curveRadialLinear = curveRadialLinear;
function Radial(curve) {
  this._curve = curve;
}
Radial.prototype = {
  areaStart: function areaStart() {
    this._curve.areaStart();
  },
  areaEnd: function areaEnd() {
    this._curve.areaEnd();
  },
  lineStart: function lineStart() {
    this._curve.lineStart();
  },
  lineEnd: function lineEnd() {
    this._curve.lineEnd();
  },
  point: function point(a, r) {
    this._curve.point(r * Math.sin(a), r * -Math.cos(a));
  }
};
function curveRadial(curve) {
  function radial(context) {
    return new Radial(curve(context));
  }
  radial._curve = curve;
  return radial;
}

},{"./linear.js":209}],214:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
exports.stepAfter = stepAfter;
exports.stepBefore = stepBefore;
function Step(context, t) {
  this._context = context;
  this._t = t;
}
Step.prototype = {
  areaStart: function areaStart() {
    this._line = 0;
  },
  areaEnd: function areaEnd() {
    this._line = NaN;
  },
  lineStart: function lineStart() {
    this._x = this._y = NaN;
    this._point = 0;
  },
  lineEnd: function lineEnd() {
    if (0 < this._t && this._t < 1 && this._point === 2) this._context.lineTo(this._x, this._y);
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    if (this._line >= 0) this._t = 1 - this._t, this._line = 1 - this._line;
  },
  point: function point(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0:
        this._point = 1;
        this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);
        break;
      case 1:
        this._point = 2;
      // falls through
      default:
        {
          if (this._t <= 0) {
            this._context.lineTo(this._x, y);
            this._context.lineTo(x, y);
          } else {
            var x1 = this._x * (1 - this._t) + x * this._t;
            this._context.lineTo(x1, this._y);
            this._context.lineTo(x1, y);
          }
          break;
        }
    }
    this._x = x, this._y = y;
  }
};
function _default(context) {
  return new Step(context, 0.5);
}
function stepBefore(context) {
  return new Step(context, 0);
}
function stepAfter(context) {
  return new Step(context, 1);
}

},{}],215:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
function _default(a, b) {
  return b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
}

},{}],216:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
function _default(d) {
  return d;
}

},{}],217:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "arc", {
  enumerable: true,
  get: function get() {
    return _arc["default"];
  }
});
Object.defineProperty(exports, "area", {
  enumerable: true,
  get: function get() {
    return _area["default"];
  }
});
Object.defineProperty(exports, "areaRadial", {
  enumerable: true,
  get: function get() {
    return _areaRadial["default"];
  }
});
Object.defineProperty(exports, "curveBasis", {
  enumerable: true,
  get: function get() {
    return _basis["default"];
  }
});
Object.defineProperty(exports, "curveBasisClosed", {
  enumerable: true,
  get: function get() {
    return _basisClosed["default"];
  }
});
Object.defineProperty(exports, "curveBasisOpen", {
  enumerable: true,
  get: function get() {
    return _basisOpen["default"];
  }
});
Object.defineProperty(exports, "curveBumpX", {
  enumerable: true,
  get: function get() {
    return _bump.bumpX;
  }
});
Object.defineProperty(exports, "curveBumpY", {
  enumerable: true,
  get: function get() {
    return _bump.bumpY;
  }
});
Object.defineProperty(exports, "curveBundle", {
  enumerable: true,
  get: function get() {
    return _bundle["default"];
  }
});
Object.defineProperty(exports, "curveCardinal", {
  enumerable: true,
  get: function get() {
    return _cardinal["default"];
  }
});
Object.defineProperty(exports, "curveCardinalClosed", {
  enumerable: true,
  get: function get() {
    return _cardinalClosed["default"];
  }
});
Object.defineProperty(exports, "curveCardinalOpen", {
  enumerable: true,
  get: function get() {
    return _cardinalOpen["default"];
  }
});
Object.defineProperty(exports, "curveCatmullRom", {
  enumerable: true,
  get: function get() {
    return _catmullRom["default"];
  }
});
Object.defineProperty(exports, "curveCatmullRomClosed", {
  enumerable: true,
  get: function get() {
    return _catmullRomClosed["default"];
  }
});
Object.defineProperty(exports, "curveCatmullRomOpen", {
  enumerable: true,
  get: function get() {
    return _catmullRomOpen["default"];
  }
});
Object.defineProperty(exports, "curveLinear", {
  enumerable: true,
  get: function get() {
    return _linear["default"];
  }
});
Object.defineProperty(exports, "curveLinearClosed", {
  enumerable: true,
  get: function get() {
    return _linearClosed["default"];
  }
});
Object.defineProperty(exports, "curveMonotoneX", {
  enumerable: true,
  get: function get() {
    return _monotone.monotoneX;
  }
});
Object.defineProperty(exports, "curveMonotoneY", {
  enumerable: true,
  get: function get() {
    return _monotone.monotoneY;
  }
});
Object.defineProperty(exports, "curveNatural", {
  enumerable: true,
  get: function get() {
    return _natural["default"];
  }
});
Object.defineProperty(exports, "curveStep", {
  enumerable: true,
  get: function get() {
    return _step["default"];
  }
});
Object.defineProperty(exports, "curveStepAfter", {
  enumerable: true,
  get: function get() {
    return _step.stepAfter;
  }
});
Object.defineProperty(exports, "curveStepBefore", {
  enumerable: true,
  get: function get() {
    return _step.stepBefore;
  }
});
Object.defineProperty(exports, "line", {
  enumerable: true,
  get: function get() {
    return _line["default"];
  }
});
Object.defineProperty(exports, "lineRadial", {
  enumerable: true,
  get: function get() {
    return _lineRadial["default"];
  }
});
Object.defineProperty(exports, "link", {
  enumerable: true,
  get: function get() {
    return _link.link;
  }
});
Object.defineProperty(exports, "linkHorizontal", {
  enumerable: true,
  get: function get() {
    return _link.linkHorizontal;
  }
});
Object.defineProperty(exports, "linkRadial", {
  enumerable: true,
  get: function get() {
    return _link.linkRadial;
  }
});
Object.defineProperty(exports, "linkVertical", {
  enumerable: true,
  get: function get() {
    return _link.linkVertical;
  }
});
Object.defineProperty(exports, "pie", {
  enumerable: true,
  get: function get() {
    return _pie["default"];
  }
});
Object.defineProperty(exports, "pointRadial", {
  enumerable: true,
  get: function get() {
    return _pointRadial["default"];
  }
});
Object.defineProperty(exports, "radialArea", {
  enumerable: true,
  get: function get() {
    return _areaRadial["default"];
  }
});
Object.defineProperty(exports, "radialLine", {
  enumerable: true,
  get: function get() {
    return _lineRadial["default"];
  }
});
Object.defineProperty(exports, "stack", {
  enumerable: true,
  get: function get() {
    return _stack["default"];
  }
});
Object.defineProperty(exports, "stackOffsetDiverging", {
  enumerable: true,
  get: function get() {
    return _diverging["default"];
  }
});
Object.defineProperty(exports, "stackOffsetExpand", {
  enumerable: true,
  get: function get() {
    return _expand["default"];
  }
});
Object.defineProperty(exports, "stackOffsetNone", {
  enumerable: true,
  get: function get() {
    return _none["default"];
  }
});
Object.defineProperty(exports, "stackOffsetSilhouette", {
  enumerable: true,
  get: function get() {
    return _silhouette["default"];
  }
});
Object.defineProperty(exports, "stackOffsetWiggle", {
  enumerable: true,
  get: function get() {
    return _wiggle["default"];
  }
});
Object.defineProperty(exports, "stackOrderAppearance", {
  enumerable: true,
  get: function get() {
    return _appearance["default"];
  }
});
Object.defineProperty(exports, "stackOrderAscending", {
  enumerable: true,
  get: function get() {
    return _ascending["default"];
  }
});
Object.defineProperty(exports, "stackOrderDescending", {
  enumerable: true,
  get: function get() {
    return _descending["default"];
  }
});
Object.defineProperty(exports, "stackOrderInsideOut", {
  enumerable: true,
  get: function get() {
    return _insideOut["default"];
  }
});
Object.defineProperty(exports, "stackOrderNone", {
  enumerable: true,
  get: function get() {
    return _none2["default"];
  }
});
Object.defineProperty(exports, "stackOrderReverse", {
  enumerable: true,
  get: function get() {
    return _reverse["default"];
  }
});
Object.defineProperty(exports, "symbol", {
  enumerable: true,
  get: function get() {
    return _symbol["default"];
  }
});
Object.defineProperty(exports, "symbolAsterisk", {
  enumerable: true,
  get: function get() {
    return _asterisk["default"];
  }
});
Object.defineProperty(exports, "symbolCircle", {
  enumerable: true,
  get: function get() {
    return _circle["default"];
  }
});
Object.defineProperty(exports, "symbolCross", {
  enumerable: true,
  get: function get() {
    return _cross["default"];
  }
});
Object.defineProperty(exports, "symbolDiamond", {
  enumerable: true,
  get: function get() {
    return _diamond["default"];
  }
});
Object.defineProperty(exports, "symbolDiamond2", {
  enumerable: true,
  get: function get() {
    return _diamond2["default"];
  }
});
Object.defineProperty(exports, "symbolPlus", {
  enumerable: true,
  get: function get() {
    return _plus["default"];
  }
});
Object.defineProperty(exports, "symbolSquare", {
  enumerable: true,
  get: function get() {
    return _square["default"];
  }
});
Object.defineProperty(exports, "symbolSquare2", {
  enumerable: true,
  get: function get() {
    return _square2["default"];
  }
});
Object.defineProperty(exports, "symbolStar", {
  enumerable: true,
  get: function get() {
    return _star["default"];
  }
});
Object.defineProperty(exports, "symbolTimes", {
  enumerable: true,
  get: function get() {
    return _times["default"];
  }
});
Object.defineProperty(exports, "symbolTriangle", {
  enumerable: true,
  get: function get() {
    return _triangle["default"];
  }
});
Object.defineProperty(exports, "symbolTriangle2", {
  enumerable: true,
  get: function get() {
    return _triangle2["default"];
  }
});
Object.defineProperty(exports, "symbolWye", {
  enumerable: true,
  get: function get() {
    return _wye["default"];
  }
});
Object.defineProperty(exports, "symbolX", {
  enumerable: true,
  get: function get() {
    return _times["default"];
  }
});
Object.defineProperty(exports, "symbols", {
  enumerable: true,
  get: function get() {
    return _symbol.symbolsFill;
  }
});
Object.defineProperty(exports, "symbolsFill", {
  enumerable: true,
  get: function get() {
    return _symbol.symbolsFill;
  }
});
Object.defineProperty(exports, "symbolsStroke", {
  enumerable: true,
  get: function get() {
    return _symbol.symbolsStroke;
  }
});
var _arc = _interopRequireDefault(require("./arc.js"));
var _area = _interopRequireDefault(require("./area.js"));
var _line = _interopRequireDefault(require("./line.js"));
var _pie = _interopRequireDefault(require("./pie.js"));
var _areaRadial = _interopRequireDefault(require("./areaRadial.js"));
var _lineRadial = _interopRequireDefault(require("./lineRadial.js"));
var _pointRadial = _interopRequireDefault(require("./pointRadial.js"));
var _link = require("./link.js");
var _symbol = _interopRequireWildcard(require("./symbol.js"));
var _asterisk = _interopRequireDefault(require("./symbol/asterisk.js"));
var _circle = _interopRequireDefault(require("./symbol/circle.js"));
var _cross = _interopRequireDefault(require("./symbol/cross.js"));
var _diamond = _interopRequireDefault(require("./symbol/diamond.js"));
var _diamond2 = _interopRequireDefault(require("./symbol/diamond2.js"));
var _plus = _interopRequireDefault(require("./symbol/plus.js"));
var _square = _interopRequireDefault(require("./symbol/square.js"));
var _square2 = _interopRequireDefault(require("./symbol/square2.js"));
var _star = _interopRequireDefault(require("./symbol/star.js"));
var _triangle = _interopRequireDefault(require("./symbol/triangle.js"));
var _triangle2 = _interopRequireDefault(require("./symbol/triangle2.js"));
var _wye = _interopRequireDefault(require("./symbol/wye.js"));
var _times = _interopRequireDefault(require("./symbol/times.js"));
var _basisClosed = _interopRequireDefault(require("./curve/basisClosed.js"));
var _basisOpen = _interopRequireDefault(require("./curve/basisOpen.js"));
var _basis = _interopRequireDefault(require("./curve/basis.js"));
var _bump = require("./curve/bump.js");
var _bundle = _interopRequireDefault(require("./curve/bundle.js"));
var _cardinalClosed = _interopRequireDefault(require("./curve/cardinalClosed.js"));
var _cardinalOpen = _interopRequireDefault(require("./curve/cardinalOpen.js"));
var _cardinal = _interopRequireDefault(require("./curve/cardinal.js"));
var _catmullRomClosed = _interopRequireDefault(require("./curve/catmullRomClosed.js"));
var _catmullRomOpen = _interopRequireDefault(require("./curve/catmullRomOpen.js"));
var _catmullRom = _interopRequireDefault(require("./curve/catmullRom.js"));
var _linearClosed = _interopRequireDefault(require("./curve/linearClosed.js"));
var _linear = _interopRequireDefault(require("./curve/linear.js"));
var _monotone = require("./curve/monotone.js");
var _natural = _interopRequireDefault(require("./curve/natural.js"));
var _step = _interopRequireWildcard(require("./curve/step.js"));
var _stack = _interopRequireDefault(require("./stack.js"));
var _expand = _interopRequireDefault(require("./offset/expand.js"));
var _diverging = _interopRequireDefault(require("./offset/diverging.js"));
var _none = _interopRequireDefault(require("./offset/none.js"));
var _silhouette = _interopRequireDefault(require("./offset/silhouette.js"));
var _wiggle = _interopRequireDefault(require("./offset/wiggle.js"));
var _appearance = _interopRequireDefault(require("./order/appearance.js"));
var _ascending = _interopRequireDefault(require("./order/ascending.js"));
var _descending = _interopRequireDefault(require("./order/descending.js"));
var _insideOut = _interopRequireDefault(require("./order/insideOut.js"));
var _none2 = _interopRequireDefault(require("./order/none.js"));
var _reverse = _interopRequireDefault(require("./order/reverse.js"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

},{"./arc.js":193,"./area.js":194,"./areaRadial.js":195,"./curve/basis.js":198,"./curve/basisClosed.js":199,"./curve/basisOpen.js":200,"./curve/bump.js":201,"./curve/bundle.js":202,"./curve/cardinal.js":203,"./curve/cardinalClosed.js":204,"./curve/cardinalOpen.js":205,"./curve/catmullRom.js":206,"./curve/catmullRomClosed.js":207,"./curve/catmullRomOpen.js":208,"./curve/linear.js":209,"./curve/linearClosed.js":210,"./curve/monotone.js":211,"./curve/natural.js":212,"./curve/step.js":214,"./line.js":218,"./lineRadial.js":219,"./link.js":220,"./offset/diverging.js":223,"./offset/expand.js":224,"./offset/none.js":225,"./offset/silhouette.js":226,"./offset/wiggle.js":227,"./order/appearance.js":228,"./order/ascending.js":229,"./order/descending.js":230,"./order/insideOut.js":231,"./order/none.js":232,"./order/reverse.js":233,"./pie.js":235,"./pointRadial.js":237,"./stack.js":238,"./symbol.js":239,"./symbol/asterisk.js":240,"./symbol/circle.js":241,"./symbol/cross.js":242,"./symbol/diamond.js":243,"./symbol/diamond2.js":244,"./symbol/plus.js":245,"./symbol/square.js":246,"./symbol/square2.js":247,"./symbol/star.js":248,"./symbol/times.js":249,"./symbol/triangle.js":250,"./symbol/triangle2.js":251,"./symbol/wye.js":252}],218:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _array = _interopRequireDefault(require("./array.js"));
var _constant = _interopRequireDefault(require("./constant.js"));
var _linear = _interopRequireDefault(require("./curve/linear.js"));
var _path = require("./path.js");
var _point = require("./point.js");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _default(x, y) {
  var defined = (0, _constant["default"])(true),
    context = null,
    curve = _linear["default"],
    output = null,
    path = (0, _path.withPath)(line);
  x = typeof x === "function" ? x : x === undefined ? _point.x : (0, _constant["default"])(x);
  y = typeof y === "function" ? y : y === undefined ? _point.y : (0, _constant["default"])(y);
  function line(data) {
    var i,
      n = (data = (0, _array["default"])(data)).length,
      d,
      defined0 = false,
      buffer;
    if (context == null) output = curve(buffer = path());
    for (i = 0; i <= n; ++i) {
      if (!(i < n && defined(d = data[i], i, data)) === defined0) {
        if (defined0 = !defined0) output.lineStart();else output.lineEnd();
      }
      if (defined0) output.point(+x(d, i, data), +y(d, i, data));
    }
    if (buffer) return output = null, buffer + "" || null;
  }
  line.x = function (_) {
    return arguments.length ? (x = typeof _ === "function" ? _ : (0, _constant["default"])(+_), line) : x;
  };
  line.y = function (_) {
    return arguments.length ? (y = typeof _ === "function" ? _ : (0, _constant["default"])(+_), line) : y;
  };
  line.defined = function (_) {
    return arguments.length ? (defined = typeof _ === "function" ? _ : (0, _constant["default"])(!!_), line) : defined;
  };
  line.curve = function (_) {
    return arguments.length ? (curve = _, context != null && (output = curve(context)), line) : curve;
  };
  line.context = function (_) {
    return arguments.length ? (_ == null ? context = output = null : output = curve(context = _), line) : context;
  };
  return line;
}

},{"./array.js":196,"./constant.js":197,"./curve/linear.js":209,"./path.js":234,"./point.js":236}],219:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
exports.lineRadial = lineRadial;
var _radial = _interopRequireWildcard(require("./curve/radial.js"));
var _line = _interopRequireDefault(require("./line.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function lineRadial(l) {
  var c = l.curve;
  l.angle = l.x, delete l.x;
  l.radius = l.y, delete l.y;
  l.curve = function (_) {
    return arguments.length ? c((0, _radial["default"])(_)) : c()._curve;
  };
  return l;
}
function _default() {
  return lineRadial((0, _line["default"])().curve(_radial.curveRadialLinear));
}

},{"./curve/radial.js":213,"./line.js":218}],220:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.link = link;
exports.linkHorizontal = linkHorizontal;
exports.linkRadial = linkRadial;
exports.linkVertical = linkVertical;
var _array = require("./array.js");
var _constant = _interopRequireDefault(require("./constant.js"));
var _bump = require("./curve/bump.js");
var _path = require("./path.js");
var _point = require("./point.js");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function linkSource(d) {
  return d.source;
}
function linkTarget(d) {
  return d.target;
}
function link(curve) {
  var source = linkSource,
    target = linkTarget,
    x = _point.x,
    y = _point.y,
    context = null,
    output = null,
    path = (0, _path.withPath)(link);
  function link() {
    var buffer;
    var argv = _array.slice.call(arguments);
    var s = source.apply(this, argv);
    var t = target.apply(this, argv);
    if (context == null) output = curve(buffer = path());
    output.lineStart();
    argv[0] = s, output.point(+x.apply(this, argv), +y.apply(this, argv));
    argv[0] = t, output.point(+x.apply(this, argv), +y.apply(this, argv));
    output.lineEnd();
    if (buffer) return output = null, buffer + "" || null;
  }
  link.source = function (_) {
    return arguments.length ? (source = _, link) : source;
  };
  link.target = function (_) {
    return arguments.length ? (target = _, link) : target;
  };
  link.x = function (_) {
    return arguments.length ? (x = typeof _ === "function" ? _ : (0, _constant["default"])(+_), link) : x;
  };
  link.y = function (_) {
    return arguments.length ? (y = typeof _ === "function" ? _ : (0, _constant["default"])(+_), link) : y;
  };
  link.context = function (_) {
    return arguments.length ? (_ == null ? context = output = null : output = curve(context = _), link) : context;
  };
  return link;
}
function linkHorizontal() {
  return link(_bump.bumpX);
}
function linkVertical() {
  return link(_bump.bumpY);
}
function linkRadial() {
  var l = link(_bump.bumpRadial);
  l.angle = l.x, delete l.x;
  l.radius = l.y, delete l.y;
  return l;
}

},{"./array.js":196,"./constant.js":197,"./curve/bump.js":201,"./path.js":234,"./point.js":236}],221:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.abs = void 0;
exports.acos = acos;
exports.asin = asin;
exports.tau = exports.sqrt = exports.sin = exports.pi = exports.min = exports.max = exports.halfPi = exports.epsilon = exports.cos = exports.atan2 = void 0;
var abs = Math.abs;
exports.abs = abs;
var atan2 = Math.atan2;
exports.atan2 = atan2;
var cos = Math.cos;
exports.cos = cos;
var max = Math.max;
exports.max = max;
var min = Math.min;
exports.min = min;
var sin = Math.sin;
exports.sin = sin;
var sqrt = Math.sqrt;
exports.sqrt = sqrt;
var epsilon = 1e-12;
exports.epsilon = epsilon;
var pi = Math.PI;
exports.pi = pi;
var halfPi = pi / 2;
exports.halfPi = halfPi;
var tau = 2 * pi;
exports.tau = tau;
function acos(x) {
  return x > 1 ? 0 : x < -1 ? pi : Math.acos(x);
}
function asin(x) {
  return x >= 1 ? halfPi : x <= -1 ? -halfPi : Math.asin(x);
}

},{}],222:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
function _default() {}

},{}],223:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
function _default(series, order) {
  if (!((n = series.length) > 0)) return;
  for (var i, j = 0, d, dy, yp, yn, n, m = series[order[0]].length; j < m; ++j) {
    for (yp = yn = 0, i = 0; i < n; ++i) {
      if ((dy = (d = series[order[i]][j])[1] - d[0]) > 0) {
        d[0] = yp, d[1] = yp += dy;
      } else if (dy < 0) {
        d[1] = yn, d[0] = yn += dy;
      } else {
        d[0] = 0, d[1] = dy;
      }
    }
  }
}

},{}],224:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _none = _interopRequireDefault(require("./none.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _default(series, order) {
  if (!((n = series.length) > 0)) return;
  for (var i, n, j = 0, m = series[0].length, y; j < m; ++j) {
    for (y = i = 0; i < n; ++i) y += series[i][j][1] || 0;
    if (y) for (i = 0; i < n; ++i) series[i][j][1] /= y;
  }
  (0, _none["default"])(series, order);
}

},{"./none.js":225}],225:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
function _default(series, order) {
  if (!((n = series.length) > 1)) return;
  for (var i = 1, j, s0, s1 = series[order[0]], n, m = s1.length; i < n; ++i) {
    s0 = s1, s1 = series[order[i]];
    for (j = 0; j < m; ++j) {
      s1[j][1] += s1[j][0] = isNaN(s0[j][1]) ? s0[j][0] : s0[j][1];
    }
  }
}

},{}],226:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _none = _interopRequireDefault(require("./none.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _default(series, order) {
  if (!((n = series.length) > 0)) return;
  for (var j = 0, s0 = series[order[0]], n, m = s0.length; j < m; ++j) {
    for (var i = 0, y = 0; i < n; ++i) y += series[i][j][1] || 0;
    s0[j][1] += s0[j][0] = -y / 2;
  }
  (0, _none["default"])(series, order);
}

},{"./none.js":225}],227:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _none = _interopRequireDefault(require("./none.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _default(series, order) {
  if (!((n = series.length) > 0) || !((m = (s0 = series[order[0]]).length) > 0)) return;
  for (var y = 0, j = 1, s0, m, n; j < m; ++j) {
    for (var i = 0, s1 = 0, s2 = 0; i < n; ++i) {
      var si = series[order[i]],
        sij0 = si[j][1] || 0,
        sij1 = si[j - 1][1] || 0,
        s3 = (sij0 - sij1) / 2;
      for (var k = 0; k < i; ++k) {
        var sk = series[order[k]],
          skj0 = sk[j][1] || 0,
          skj1 = sk[j - 1][1] || 0;
        s3 += skj0 - skj1;
      }
      s1 += sij0, s2 += s3 * sij0;
    }
    s0[j - 1][1] += s0[j - 1][0] = y;
    if (s1) y -= s2 / s1;
  }
  s0[j - 1][1] += s0[j - 1][0] = y;
  (0, _none["default"])(series, order);
}

},{"./none.js":225}],228:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _none = _interopRequireDefault(require("./none.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _default(series) {
  var peaks = series.map(peak);
  return (0, _none["default"])(series).sort(function (a, b) {
    return peaks[a] - peaks[b];
  });
}
function peak(series) {
  var i = -1,
    j = 0,
    n = series.length,
    vi,
    vj = -Infinity;
  while (++i < n) if ((vi = +series[i][1]) > vj) vj = vi, j = i;
  return j;
}

},{"./none.js":232}],229:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
exports.sum = sum;
var _none = _interopRequireDefault(require("./none.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _default(series) {
  var sums = series.map(sum);
  return (0, _none["default"])(series).sort(function (a, b) {
    return sums[a] - sums[b];
  });
}
function sum(series) {
  var s = 0,
    i = -1,
    n = series.length,
    v;
  while (++i < n) if (v = +series[i][1]) s += v;
  return s;
}

},{"./none.js":232}],230:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _ascending = _interopRequireDefault(require("./ascending.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _default(series) {
  return (0, _ascending["default"])(series).reverse();
}

},{"./ascending.js":229}],231:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _appearance = _interopRequireDefault(require("./appearance.js"));
var _ascending = require("./ascending.js");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _default(series) {
  var n = series.length,
    i,
    j,
    sums = series.map(_ascending.sum),
    order = (0, _appearance["default"])(series),
    top = 0,
    bottom = 0,
    tops = [],
    bottoms = [];
  for (i = 0; i < n; ++i) {
    j = order[i];
    if (top < bottom) {
      top += sums[j];
      tops.push(j);
    } else {
      bottom += sums[j];
      bottoms.push(j);
    }
  }
  return bottoms.reverse().concat(tops);
}

},{"./appearance.js":228,"./ascending.js":229}],232:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
function _default(series) {
  var n = series.length,
    o = new Array(n);
  while (--n >= 0) o[n] = n;
  return o;
}

},{}],233:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _none = _interopRequireDefault(require("./none.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _default(series) {
  return (0, _none["default"])(series).reverse();
}

},{"./none.js":232}],234:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withPath = withPath;
var _d3Path = require("d3-path");
function withPath(shape) {
  var digits = 3;
  shape.digits = function (_) {
    if (!arguments.length) return digits;
    if (_ == null) {
      digits = null;
    } else {
      var d = Math.floor(_);
      if (!(d >= 0)) throw new RangeError("invalid digits: ".concat(_));
      digits = d;
    }
    return shape;
  };
  return function () {
    return new _d3Path.Path(digits);
  };
}

},{"d3-path":115}],235:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _array = _interopRequireDefault(require("./array.js"));
var _constant = _interopRequireDefault(require("./constant.js"));
var _descending = _interopRequireDefault(require("./descending.js"));
var _identity = _interopRequireDefault(require("./identity.js"));
var _math = require("./math.js");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _default() {
  var value = _identity["default"],
    sortValues = _descending["default"],
    sort = null,
    startAngle = (0, _constant["default"])(0),
    endAngle = (0, _constant["default"])(_math.tau),
    padAngle = (0, _constant["default"])(0);
  function pie(data) {
    var i,
      n = (data = (0, _array["default"])(data)).length,
      j,
      k,
      sum = 0,
      index = new Array(n),
      arcs = new Array(n),
      a0 = +startAngle.apply(this, arguments),
      da = Math.min(_math.tau, Math.max(-_math.tau, endAngle.apply(this, arguments) - a0)),
      a1,
      p = Math.min(Math.abs(da) / n, padAngle.apply(this, arguments)),
      pa = p * (da < 0 ? -1 : 1),
      v;
    for (i = 0; i < n; ++i) {
      if ((v = arcs[index[i] = i] = +value(data[i], i, data)) > 0) {
        sum += v;
      }
    }

    // Optionally sort the arcs by previously-computed values or by data.
    if (sortValues != null) index.sort(function (i, j) {
      return sortValues(arcs[i], arcs[j]);
    });else if (sort != null) index.sort(function (i, j) {
      return sort(data[i], data[j]);
    });

    // Compute the arcs! They are stored in the original data's order.
    for (i = 0, k = sum ? (da - n * pa) / sum : 0; i < n; ++i, a0 = a1) {
      j = index[i], v = arcs[j], a1 = a0 + (v > 0 ? v * k : 0) + pa, arcs[j] = {
        data: data[j],
        index: i,
        value: v,
        startAngle: a0,
        endAngle: a1,
        padAngle: p
      };
    }
    return arcs;
  }
  pie.value = function (_) {
    return arguments.length ? (value = typeof _ === "function" ? _ : (0, _constant["default"])(+_), pie) : value;
  };
  pie.sortValues = function (_) {
    return arguments.length ? (sortValues = _, sort = null, pie) : sortValues;
  };
  pie.sort = function (_) {
    return arguments.length ? (sort = _, sortValues = null, pie) : sort;
  };
  pie.startAngle = function (_) {
    return arguments.length ? (startAngle = typeof _ === "function" ? _ : (0, _constant["default"])(+_), pie) : startAngle;
  };
  pie.endAngle = function (_) {
    return arguments.length ? (endAngle = typeof _ === "function" ? _ : (0, _constant["default"])(+_), pie) : endAngle;
  };
  pie.padAngle = function (_) {
    return arguments.length ? (padAngle = typeof _ === "function" ? _ : (0, _constant["default"])(+_), pie) : padAngle;
  };
  return pie;
}

},{"./array.js":196,"./constant.js":197,"./descending.js":215,"./identity.js":216,"./math.js":221}],236:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.x = x;
exports.y = y;
function x(p) {
  return p[0];
}
function y(p) {
  return p[1];
}

},{}],237:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
function _default(x, y) {
  return [(y = +y) * Math.cos(x -= Math.PI / 2), y * Math.sin(x)];
}

},{}],238:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _array = _interopRequireDefault(require("./array.js"));
var _constant = _interopRequireDefault(require("./constant.js"));
var _none = _interopRequireDefault(require("./offset/none.js"));
var _none2 = _interopRequireDefault(require("./order/none.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function stackValue(d, key) {
  return d[key];
}
function stackSeries(key) {
  var series = [];
  series.key = key;
  return series;
}
function _default() {
  var keys = (0, _constant["default"])([]),
    order = _none2["default"],
    offset = _none["default"],
    value = stackValue;
  function stack(data) {
    var sz = Array.from(keys.apply(this, arguments), stackSeries),
      i,
      n = sz.length,
      j = -1,
      oz;
    var _iterator = _createForOfIteratorHelper(data),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var d = _step.value;
        for (i = 0, ++j; i < n; ++i) {
          (sz[i][j] = [0, +value(d, sz[i].key, j, data)]).data = d;
        }
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
    for (i = 0, oz = (0, _array["default"])(order(sz)); i < n; ++i) {
      sz[oz[i]].index = i;
    }
    offset(sz, oz);
    return sz;
  }
  stack.keys = function (_) {
    return arguments.length ? (keys = typeof _ === "function" ? _ : (0, _constant["default"])(Array.from(_)), stack) : keys;
  };
  stack.value = function (_) {
    return arguments.length ? (value = typeof _ === "function" ? _ : (0, _constant["default"])(+_), stack) : value;
  };
  stack.order = function (_) {
    return arguments.length ? (order = _ == null ? _none2["default"] : typeof _ === "function" ? _ : (0, _constant["default"])(Array.from(_)), stack) : order;
  };
  stack.offset = function (_) {
    return arguments.length ? (offset = _ == null ? _none["default"] : _, stack) : offset;
  };
  return stack;
}

},{"./array.js":196,"./constant.js":197,"./offset/none.js":225,"./order/none.js":232}],239:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _Symbol;
exports.symbolsStroke = exports.symbolsFill = void 0;
var _constant = _interopRequireDefault(require("./constant.js"));
var _path = require("./path.js");
var _asterisk = _interopRequireDefault(require("./symbol/asterisk.js"));
var _circle = _interopRequireDefault(require("./symbol/circle.js"));
var _cross = _interopRequireDefault(require("./symbol/cross.js"));
var _diamond = _interopRequireDefault(require("./symbol/diamond.js"));
var _diamond2 = _interopRequireDefault(require("./symbol/diamond2.js"));
var _plus = _interopRequireDefault(require("./symbol/plus.js"));
var _square = _interopRequireDefault(require("./symbol/square.js"));
var _square2 = _interopRequireDefault(require("./symbol/square2.js"));
var _star = _interopRequireDefault(require("./symbol/star.js"));
var _triangle = _interopRequireDefault(require("./symbol/triangle.js"));
var _triangle2 = _interopRequireDefault(require("./symbol/triangle2.js"));
var _wye = _interopRequireDefault(require("./symbol/wye.js"));
var _times = _interopRequireDefault(require("./symbol/times.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
// These symbols are designed to be filled.
var symbolsFill = [_circle["default"], _cross["default"], _diamond["default"], _square["default"], _star["default"], _triangle["default"], _wye["default"]];

// These symbols are designed to be stroked (with a width of 1.5px and round caps).
exports.symbolsFill = symbolsFill;
var symbolsStroke = [_circle["default"], _plus["default"], _times["default"], _triangle2["default"], _asterisk["default"], _square2["default"], _diamond2["default"]];
exports.symbolsStroke = symbolsStroke;
function _Symbol(type, size) {
  var context = null,
    path = (0, _path.withPath)(symbol);
  type = typeof type === "function" ? type : (0, _constant["default"])(type || _circle["default"]);
  size = typeof size === "function" ? size : (0, _constant["default"])(size === undefined ? 64 : +size);
  function symbol() {
    var buffer;
    if (!context) context = buffer = path();
    type.apply(this, arguments).draw(context, +size.apply(this, arguments));
    if (buffer) return context = null, buffer + "" || null;
  }
  symbol.type = function (_) {
    return arguments.length ? (type = typeof _ === "function" ? _ : (0, _constant["default"])(_), symbol) : type;
  };
  symbol.size = function (_) {
    return arguments.length ? (size = typeof _ === "function" ? _ : (0, _constant["default"])(+_), symbol) : size;
  };
  symbol.context = function (_) {
    return arguments.length ? (context = _ == null ? null : _, symbol) : context;
  };
  return symbol;
}

},{"./constant.js":197,"./path.js":234,"./symbol/asterisk.js":240,"./symbol/circle.js":241,"./symbol/cross.js":242,"./symbol/diamond.js":243,"./symbol/diamond2.js":244,"./symbol/plus.js":245,"./symbol/square.js":246,"./symbol/square2.js":247,"./symbol/star.js":248,"./symbol/times.js":249,"./symbol/triangle.js":250,"./symbol/triangle2.js":251,"./symbol/wye.js":252}],240:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _math = require("../math.js");
var sqrt3 = (0, _math.sqrt)(3);
var _default = {
  draw: function draw(context, size) {
    var r = (0, _math.sqrt)(size + (0, _math.min)(size / 28, 0.75)) * 0.59436;
    var t = r / 2;
    var u = t * sqrt3;
    context.moveTo(0, r);
    context.lineTo(0, -r);
    context.moveTo(-u, -t);
    context.lineTo(u, t);
    context.moveTo(-u, t);
    context.lineTo(u, -t);
  }
};
exports["default"] = _default;

},{"../math.js":221}],241:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _math = require("../math.js");
var _default = {
  draw: function draw(context, size) {
    var r = (0, _math.sqrt)(size / _math.pi);
    context.moveTo(r, 0);
    context.arc(0, 0, r, 0, _math.tau);
  }
};
exports["default"] = _default;

},{"../math.js":221}],242:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _math = require("../math.js");
var _default = {
  draw: function draw(context, size) {
    var r = (0, _math.sqrt)(size / 5) / 2;
    context.moveTo(-3 * r, -r);
    context.lineTo(-r, -r);
    context.lineTo(-r, -3 * r);
    context.lineTo(r, -3 * r);
    context.lineTo(r, -r);
    context.lineTo(3 * r, -r);
    context.lineTo(3 * r, r);
    context.lineTo(r, r);
    context.lineTo(r, 3 * r);
    context.lineTo(-r, 3 * r);
    context.lineTo(-r, r);
    context.lineTo(-3 * r, r);
    context.closePath();
  }
};
exports["default"] = _default;

},{"../math.js":221}],243:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _math = require("../math.js");
var tan30 = (0, _math.sqrt)(1 / 3);
var tan30_2 = tan30 * 2;
var _default = {
  draw: function draw(context, size) {
    var y = (0, _math.sqrt)(size / tan30_2);
    var x = y * tan30;
    context.moveTo(0, -y);
    context.lineTo(x, 0);
    context.lineTo(0, y);
    context.lineTo(-x, 0);
    context.closePath();
  }
};
exports["default"] = _default;

},{"../math.js":221}],244:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _math = require("../math.js");
var _default = {
  draw: function draw(context, size) {
    var r = (0, _math.sqrt)(size) * 0.62625;
    context.moveTo(0, -r);
    context.lineTo(r, 0);
    context.lineTo(0, r);
    context.lineTo(-r, 0);
    context.closePath();
  }
};
exports["default"] = _default;

},{"../math.js":221}],245:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _math = require("../math.js");
var _default = {
  draw: function draw(context, size) {
    var r = (0, _math.sqrt)(size - (0, _math.min)(size / 7, 2)) * 0.87559;
    context.moveTo(-r, 0);
    context.lineTo(r, 0);
    context.moveTo(0, r);
    context.lineTo(0, -r);
  }
};
exports["default"] = _default;

},{"../math.js":221}],246:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _math = require("../math.js");
var _default = {
  draw: function draw(context, size) {
    var w = (0, _math.sqrt)(size);
    var x = -w / 2;
    context.rect(x, x, w, w);
  }
};
exports["default"] = _default;

},{"../math.js":221}],247:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _math = require("../math.js");
var _default = {
  draw: function draw(context, size) {
    var r = (0, _math.sqrt)(size) * 0.4431;
    context.moveTo(r, r);
    context.lineTo(r, -r);
    context.lineTo(-r, -r);
    context.lineTo(-r, r);
    context.closePath();
  }
};
exports["default"] = _default;

},{"../math.js":221}],248:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _math = require("../math.js");
var ka = 0.89081309152928522810;
var kr = (0, _math.sin)(_math.pi / 10) / (0, _math.sin)(7 * _math.pi / 10);
var kx = (0, _math.sin)(_math.tau / 10) * kr;
var ky = -(0, _math.cos)(_math.tau / 10) * kr;
var _default = {
  draw: function draw(context, size) {
    var r = (0, _math.sqrt)(size * ka);
    var x = kx * r;
    var y = ky * r;
    context.moveTo(0, -r);
    context.lineTo(x, y);
    for (var i = 1; i < 5; ++i) {
      var a = _math.tau * i / 5;
      var c = (0, _math.cos)(a);
      var s = (0, _math.sin)(a);
      context.lineTo(s * r, -c * r);
      context.lineTo(c * x - s * y, s * x + c * y);
    }
    context.closePath();
  }
};
exports["default"] = _default;

},{"../math.js":221}],249:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _math = require("../math.js");
var _default = {
  draw: function draw(context, size) {
    var r = (0, _math.sqrt)(size - (0, _math.min)(size / 6, 1.7)) * 0.6189;
    context.moveTo(-r, -r);
    context.lineTo(r, r);
    context.moveTo(-r, r);
    context.lineTo(r, -r);
  }
};
exports["default"] = _default;

},{"../math.js":221}],250:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _math = require("../math.js");
var sqrt3 = (0, _math.sqrt)(3);
var _default = {
  draw: function draw(context, size) {
    var y = -(0, _math.sqrt)(size / (sqrt3 * 3));
    context.moveTo(0, y * 2);
    context.lineTo(-sqrt3 * y, -y);
    context.lineTo(sqrt3 * y, -y);
    context.closePath();
  }
};
exports["default"] = _default;

},{"../math.js":221}],251:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _math = require("../math.js");
var sqrt3 = (0, _math.sqrt)(3);
var _default = {
  draw: function draw(context, size) {
    var s = (0, _math.sqrt)(size) * 0.6824;
    var t = s / 2;
    var u = s * sqrt3 / 2; // cos(Math.PI / 6)
    context.moveTo(0, -s);
    context.lineTo(u, t);
    context.lineTo(-u, t);
    context.closePath();
  }
};
exports["default"] = _default;

},{"../math.js":221}],252:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _math = require("../math.js");
var c = -0.5;
var s = (0, _math.sqrt)(3) / 2;
var k = 1 / (0, _math.sqrt)(12);
var a = (k / 2 + 1) * 3;
var _default = {
  draw: function draw(context, size) {
    var r = (0, _math.sqrt)(size / a);
    var x0 = r / 2,
      y0 = r * k;
    var x1 = x0,
      y1 = r * k + r;
    var x2 = -x1,
      y2 = y1;
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.lineTo(x2, y2);
    context.lineTo(c * x0 - s * y0, s * x0 + c * y0);
    context.lineTo(c * x1 - s * y1, s * x1 + c * y1);
    context.lineTo(c * x2 - s * y2, s * x2 + c * y2);
    context.lineTo(c * x0 + s * y0, c * y0 - s * x0);
    context.lineTo(c * x1 + s * y1, c * y1 - s * x1);
    context.lineTo(c * x2 + s * y2, c * y2 - s * x2);
    context.closePath();
  }
};
exports["default"] = _default;

},{"../math.js":221}],253:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = defaultLocale;
exports.utcParse = exports.utcFormat = exports.timeParse = exports.timeFormat = void 0;
var _locale = _interopRequireDefault(require("./locale.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
var locale;
var timeFormat;
exports.timeFormat = timeFormat;
var timeParse;
exports.timeParse = timeParse;
var utcFormat;
exports.utcFormat = utcFormat;
var utcParse;
exports.utcParse = utcParse;
defaultLocale({
  dateTime: "%x, %X",
  date: "%-m/%-d/%Y",
  time: "%-I:%M:%S %p",
  periods: ["AM", "PM"],
  days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  shortDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
});
function defaultLocale(definition) {
  locale = (0, _locale["default"])(definition);
  exports.timeFormat = timeFormat = locale.format;
  exports.timeParse = timeParse = locale.parse;
  exports.utcFormat = utcFormat = locale.utcFormat;
  exports.utcParse = utcParse = locale.utcParse;
  return locale;
}

},{"./locale.js":257}],254:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "isoFormat", {
  enumerable: true,
  get: function get() {
    return _isoFormat["default"];
  }
});
Object.defineProperty(exports, "isoParse", {
  enumerable: true,
  get: function get() {
    return _isoParse["default"];
  }
});
Object.defineProperty(exports, "timeFormat", {
  enumerable: true,
  get: function get() {
    return _defaultLocale.timeFormat;
  }
});
Object.defineProperty(exports, "timeFormatDefaultLocale", {
  enumerable: true,
  get: function get() {
    return _defaultLocale["default"];
  }
});
Object.defineProperty(exports, "timeFormatLocale", {
  enumerable: true,
  get: function get() {
    return _locale["default"];
  }
});
Object.defineProperty(exports, "timeParse", {
  enumerable: true,
  get: function get() {
    return _defaultLocale.timeParse;
  }
});
Object.defineProperty(exports, "utcFormat", {
  enumerable: true,
  get: function get() {
    return _defaultLocale.utcFormat;
  }
});
Object.defineProperty(exports, "utcParse", {
  enumerable: true,
  get: function get() {
    return _defaultLocale.utcParse;
  }
});
var _defaultLocale = _interopRequireWildcard(require("./defaultLocale.js"));
var _locale = _interopRequireDefault(require("./locale.js"));
var _isoFormat = _interopRequireDefault(require("./isoFormat.js"));
var _isoParse = _interopRequireDefault(require("./isoParse.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

},{"./defaultLocale.js":253,"./isoFormat.js":255,"./isoParse.js":256,"./locale.js":257}],255:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isoSpecifier = exports["default"] = void 0;
var _defaultLocale = require("./defaultLocale.js");
var isoSpecifier = "%Y-%m-%dT%H:%M:%S.%LZ";
exports.isoSpecifier = isoSpecifier;
function formatIsoNative(date) {
  return date.toISOString();
}
var formatIso = Date.prototype.toISOString ? formatIsoNative : (0, _defaultLocale.utcFormat)(isoSpecifier);
var _default = formatIso;
exports["default"] = _default;

},{"./defaultLocale.js":253}],256:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _isoFormat = require("./isoFormat.js");
var _defaultLocale = require("./defaultLocale.js");
function parseIsoNative(string) {
  var date = new Date(string);
  return isNaN(date) ? null : date;
}
var parseIso = +new Date("2000-01-01T00:00:00.000Z") ? parseIsoNative : (0, _defaultLocale.utcParse)(_isoFormat.isoSpecifier);
var _default = parseIso;
exports["default"] = _default;

},{"./defaultLocale.js":253,"./isoFormat.js":255}],257:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = formatLocale;
var _d3Time = require("d3-time");
function localDate(d) {
  if (0 <= d.y && d.y < 100) {
    var date = new Date(-1, d.m, d.d, d.H, d.M, d.S, d.L);
    date.setFullYear(d.y);
    return date;
  }
  return new Date(d.y, d.m, d.d, d.H, d.M, d.S, d.L);
}
function utcDate(d) {
  if (0 <= d.y && d.y < 100) {
    var date = new Date(Date.UTC(-1, d.m, d.d, d.H, d.M, d.S, d.L));
    date.setUTCFullYear(d.y);
    return date;
  }
  return new Date(Date.UTC(d.y, d.m, d.d, d.H, d.M, d.S, d.L));
}
function newDate(y, m, d) {
  return {
    y: y,
    m: m,
    d: d,
    H: 0,
    M: 0,
    S: 0,
    L: 0
  };
}
function formatLocale(locale) {
  var locale_dateTime = locale.dateTime,
    locale_date = locale.date,
    locale_time = locale.time,
    locale_periods = locale.periods,
    locale_weekdays = locale.days,
    locale_shortWeekdays = locale.shortDays,
    locale_months = locale.months,
    locale_shortMonths = locale.shortMonths;
  var periodRe = formatRe(locale_periods),
    periodLookup = formatLookup(locale_periods),
    weekdayRe = formatRe(locale_weekdays),
    weekdayLookup = formatLookup(locale_weekdays),
    shortWeekdayRe = formatRe(locale_shortWeekdays),
    shortWeekdayLookup = formatLookup(locale_shortWeekdays),
    monthRe = formatRe(locale_months),
    monthLookup = formatLookup(locale_months),
    shortMonthRe = formatRe(locale_shortMonths),
    shortMonthLookup = formatLookup(locale_shortMonths);
  var formats = {
    "a": formatShortWeekday,
    "A": formatWeekday,
    "b": formatShortMonth,
    "B": formatMonth,
    "c": null,
    "d": formatDayOfMonth,
    "e": formatDayOfMonth,
    "f": formatMicroseconds,
    "g": formatYearISO,
    "G": formatFullYearISO,
    "H": formatHour24,
    "I": formatHour12,
    "j": formatDayOfYear,
    "L": formatMilliseconds,
    "m": formatMonthNumber,
    "M": formatMinutes,
    "p": formatPeriod,
    "q": formatQuarter,
    "Q": formatUnixTimestamp,
    "s": formatUnixTimestampSeconds,
    "S": formatSeconds,
    "u": formatWeekdayNumberMonday,
    "U": formatWeekNumberSunday,
    "V": formatWeekNumberISO,
    "w": formatWeekdayNumberSunday,
    "W": formatWeekNumberMonday,
    "x": null,
    "X": null,
    "y": formatYear,
    "Y": formatFullYear,
    "Z": formatZone,
    "%": formatLiteralPercent
  };
  var utcFormats = {
    "a": formatUTCShortWeekday,
    "A": formatUTCWeekday,
    "b": formatUTCShortMonth,
    "B": formatUTCMonth,
    "c": null,
    "d": formatUTCDayOfMonth,
    "e": formatUTCDayOfMonth,
    "f": formatUTCMicroseconds,
    "g": formatUTCYearISO,
    "G": formatUTCFullYearISO,
    "H": formatUTCHour24,
    "I": formatUTCHour12,
    "j": formatUTCDayOfYear,
    "L": formatUTCMilliseconds,
    "m": formatUTCMonthNumber,
    "M": formatUTCMinutes,
    "p": formatUTCPeriod,
    "q": formatUTCQuarter,
    "Q": formatUnixTimestamp,
    "s": formatUnixTimestampSeconds,
    "S": formatUTCSeconds,
    "u": formatUTCWeekdayNumberMonday,
    "U": formatUTCWeekNumberSunday,
    "V": formatUTCWeekNumberISO,
    "w": formatUTCWeekdayNumberSunday,
    "W": formatUTCWeekNumberMonday,
    "x": null,
    "X": null,
    "y": formatUTCYear,
    "Y": formatUTCFullYear,
    "Z": formatUTCZone,
    "%": formatLiteralPercent
  };
  var parses = {
    "a": parseShortWeekday,
    "A": parseWeekday,
    "b": parseShortMonth,
    "B": parseMonth,
    "c": parseLocaleDateTime,
    "d": parseDayOfMonth,
    "e": parseDayOfMonth,
    "f": parseMicroseconds,
    "g": parseYear,
    "G": parseFullYear,
    "H": parseHour24,
    "I": parseHour24,
    "j": parseDayOfYear,
    "L": parseMilliseconds,
    "m": parseMonthNumber,
    "M": parseMinutes,
    "p": parsePeriod,
    "q": parseQuarter,
    "Q": parseUnixTimestamp,
    "s": parseUnixTimestampSeconds,
    "S": parseSeconds,
    "u": parseWeekdayNumberMonday,
    "U": parseWeekNumberSunday,
    "V": parseWeekNumberISO,
    "w": parseWeekdayNumberSunday,
    "W": parseWeekNumberMonday,
    "x": parseLocaleDate,
    "X": parseLocaleTime,
    "y": parseYear,
    "Y": parseFullYear,
    "Z": parseZone,
    "%": parseLiteralPercent
  };

  // These recursive directive definitions must be deferred.
  formats.x = newFormat(locale_date, formats);
  formats.X = newFormat(locale_time, formats);
  formats.c = newFormat(locale_dateTime, formats);
  utcFormats.x = newFormat(locale_date, utcFormats);
  utcFormats.X = newFormat(locale_time, utcFormats);
  utcFormats.c = newFormat(locale_dateTime, utcFormats);
  function newFormat(specifier, formats) {
    return function (date) {
      var string = [],
        i = -1,
        j = 0,
        n = specifier.length,
        c,
        pad,
        format;
      if (!(date instanceof Date)) date = new Date(+date);
      while (++i < n) {
        if (specifier.charCodeAt(i) === 37) {
          string.push(specifier.slice(j, i));
          if ((pad = pads[c = specifier.charAt(++i)]) != null) c = specifier.charAt(++i);else pad = c === "e" ? " " : "0";
          if (format = formats[c]) c = format(date, pad);
          string.push(c);
          j = i + 1;
        }
      }
      string.push(specifier.slice(j, i));
      return string.join("");
    };
  }
  function newParse(specifier, Z) {
    return function (string) {
      var d = newDate(1900, undefined, 1),
        i = parseSpecifier(d, specifier, string += "", 0),
        week,
        day;
      if (i != string.length) return null;

      // If a UNIX timestamp is specified, return it.
      if ("Q" in d) return new Date(d.Q);
      if ("s" in d) return new Date(d.s * 1000 + ("L" in d ? d.L : 0));

      // If this is utcParse, never use the local timezone.
      if (Z && !("Z" in d)) d.Z = 0;

      // The am-pm flag is 0 for AM, and 1 for PM.
      if ("p" in d) d.H = d.H % 12 + d.p * 12;

      // If the month was not specified, inherit from the quarter.
      if (d.m === undefined) d.m = "q" in d ? d.q : 0;

      // Convert day-of-week and week-of-year to day-of-year.
      if ("V" in d) {
        if (d.V < 1 || d.V > 53) return null;
        if (!("w" in d)) d.w = 1;
        if ("Z" in d) {
          week = utcDate(newDate(d.y, 0, 1)), day = week.getUTCDay();
          week = day > 4 || day === 0 ? _d3Time.utcMonday.ceil(week) : (0, _d3Time.utcMonday)(week);
          week = _d3Time.utcDay.offset(week, (d.V - 1) * 7);
          d.y = week.getUTCFullYear();
          d.m = week.getUTCMonth();
          d.d = week.getUTCDate() + (d.w + 6) % 7;
        } else {
          week = localDate(newDate(d.y, 0, 1)), day = week.getDay();
          week = day > 4 || day === 0 ? _d3Time.timeMonday.ceil(week) : (0, _d3Time.timeMonday)(week);
          week = _d3Time.timeDay.offset(week, (d.V - 1) * 7);
          d.y = week.getFullYear();
          d.m = week.getMonth();
          d.d = week.getDate() + (d.w + 6) % 7;
        }
      } else if ("W" in d || "U" in d) {
        if (!("w" in d)) d.w = "u" in d ? d.u % 7 : "W" in d ? 1 : 0;
        day = "Z" in d ? utcDate(newDate(d.y, 0, 1)).getUTCDay() : localDate(newDate(d.y, 0, 1)).getDay();
        d.m = 0;
        d.d = "W" in d ? (d.w + 6) % 7 + d.W * 7 - (day + 5) % 7 : d.w + d.U * 7 - (day + 6) % 7;
      }

      // If a time zone is specified, all fields are interpreted as UTC and then
      // offset according to the specified time zone.
      if ("Z" in d) {
        d.H += d.Z / 100 | 0;
        d.M += d.Z % 100;
        return utcDate(d);
      }

      // Otherwise, all fields are in local time.
      return localDate(d);
    };
  }
  function parseSpecifier(d, specifier, string, j) {
    var i = 0,
      n = specifier.length,
      m = string.length,
      c,
      parse;
    while (i < n) {
      if (j >= m) return -1;
      c = specifier.charCodeAt(i++);
      if (c === 37) {
        c = specifier.charAt(i++);
        parse = parses[c in pads ? specifier.charAt(i++) : c];
        if (!parse || (j = parse(d, string, j)) < 0) return -1;
      } else if (c != string.charCodeAt(j++)) {
        return -1;
      }
    }
    return j;
  }
  function parsePeriod(d, string, i) {
    var n = periodRe.exec(string.slice(i));
    return n ? (d.p = periodLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
  }
  function parseShortWeekday(d, string, i) {
    var n = shortWeekdayRe.exec(string.slice(i));
    return n ? (d.w = shortWeekdayLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
  }
  function parseWeekday(d, string, i) {
    var n = weekdayRe.exec(string.slice(i));
    return n ? (d.w = weekdayLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
  }
  function parseShortMonth(d, string, i) {
    var n = shortMonthRe.exec(string.slice(i));
    return n ? (d.m = shortMonthLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
  }
  function parseMonth(d, string, i) {
    var n = monthRe.exec(string.slice(i));
    return n ? (d.m = monthLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
  }
  function parseLocaleDateTime(d, string, i) {
    return parseSpecifier(d, locale_dateTime, string, i);
  }
  function parseLocaleDate(d, string, i) {
    return parseSpecifier(d, locale_date, string, i);
  }
  function parseLocaleTime(d, string, i) {
    return parseSpecifier(d, locale_time, string, i);
  }
  function formatShortWeekday(d) {
    return locale_shortWeekdays[d.getDay()];
  }
  function formatWeekday(d) {
    return locale_weekdays[d.getDay()];
  }
  function formatShortMonth(d) {
    return locale_shortMonths[d.getMonth()];
  }
  function formatMonth(d) {
    return locale_months[d.getMonth()];
  }
  function formatPeriod(d) {
    return locale_periods[+(d.getHours() >= 12)];
  }
  function formatQuarter(d) {
    return 1 + ~~(d.getMonth() / 3);
  }
  function formatUTCShortWeekday(d) {
    return locale_shortWeekdays[d.getUTCDay()];
  }
  function formatUTCWeekday(d) {
    return locale_weekdays[d.getUTCDay()];
  }
  function formatUTCShortMonth(d) {
    return locale_shortMonths[d.getUTCMonth()];
  }
  function formatUTCMonth(d) {
    return locale_months[d.getUTCMonth()];
  }
  function formatUTCPeriod(d) {
    return locale_periods[+(d.getUTCHours() >= 12)];
  }
  function formatUTCQuarter(d) {
    return 1 + ~~(d.getUTCMonth() / 3);
  }
  return {
    format: function format(specifier) {
      var f = newFormat(specifier += "", formats);
      f.toString = function () {
        return specifier;
      };
      return f;
    },
    parse: function parse(specifier) {
      var p = newParse(specifier += "", false);
      p.toString = function () {
        return specifier;
      };
      return p;
    },
    utcFormat: function utcFormat(specifier) {
      var f = newFormat(specifier += "", utcFormats);
      f.toString = function () {
        return specifier;
      };
      return f;
    },
    utcParse: function utcParse(specifier) {
      var p = newParse(specifier += "", true);
      p.toString = function () {
        return specifier;
      };
      return p;
    }
  };
}
var pads = {
    "-": "",
    "_": " ",
    "0": "0"
  },
  numberRe = /^\s*\d+/,
  // note: ignores next directive
  percentRe = /^%/,
  requoteRe = /[\\^$*+?|[\]().{}]/g;
function pad(value, fill, width) {
  var sign = value < 0 ? "-" : "",
    string = (sign ? -value : value) + "",
    length = string.length;
  return sign + (length < width ? new Array(width - length + 1).join(fill) + string : string);
}
function requote(s) {
  return s.replace(requoteRe, "\\$&");
}
function formatRe(names) {
  return new RegExp("^(?:" + names.map(requote).join("|") + ")", "i");
}
function formatLookup(names) {
  return new Map(names.map(function (name, i) {
    return [name.toLowerCase(), i];
  }));
}
function parseWeekdayNumberSunday(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 1));
  return n ? (d.w = +n[0], i + n[0].length) : -1;
}
function parseWeekdayNumberMonday(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 1));
  return n ? (d.u = +n[0], i + n[0].length) : -1;
}
function parseWeekNumberSunday(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.U = +n[0], i + n[0].length) : -1;
}
function parseWeekNumberISO(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.V = +n[0], i + n[0].length) : -1;
}
function parseWeekNumberMonday(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.W = +n[0], i + n[0].length) : -1;
}
function parseFullYear(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 4));
  return n ? (d.y = +n[0], i + n[0].length) : -1;
}
function parseYear(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.y = +n[0] + (+n[0] > 68 ? 1900 : 2000), i + n[0].length) : -1;
}
function parseZone(d, string, i) {
  var n = /^(Z)|([+-]\d\d)(?::?(\d\d))?/.exec(string.slice(i, i + 6));
  return n ? (d.Z = n[1] ? 0 : -(n[2] + (n[3] || "00")), i + n[0].length) : -1;
}
function parseQuarter(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 1));
  return n ? (d.q = n[0] * 3 - 3, i + n[0].length) : -1;
}
function parseMonthNumber(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.m = n[0] - 1, i + n[0].length) : -1;
}
function parseDayOfMonth(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.d = +n[0], i + n[0].length) : -1;
}
function parseDayOfYear(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 3));
  return n ? (d.m = 0, d.d = +n[0], i + n[0].length) : -1;
}
function parseHour24(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.H = +n[0], i + n[0].length) : -1;
}
function parseMinutes(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.M = +n[0], i + n[0].length) : -1;
}
function parseSeconds(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.S = +n[0], i + n[0].length) : -1;
}
function parseMilliseconds(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 3));
  return n ? (d.L = +n[0], i + n[0].length) : -1;
}
function parseMicroseconds(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 6));
  return n ? (d.L = Math.floor(n[0] / 1000), i + n[0].length) : -1;
}
function parseLiteralPercent(d, string, i) {
  var n = percentRe.exec(string.slice(i, i + 1));
  return n ? i + n[0].length : -1;
}
function parseUnixTimestamp(d, string, i) {
  var n = numberRe.exec(string.slice(i));
  return n ? (d.Q = +n[0], i + n[0].length) : -1;
}
function parseUnixTimestampSeconds(d, string, i) {
  var n = numberRe.exec(string.slice(i));
  return n ? (d.s = +n[0], i + n[0].length) : -1;
}
function formatDayOfMonth(d, p) {
  return pad(d.getDate(), p, 2);
}
function formatHour24(d, p) {
  return pad(d.getHours(), p, 2);
}
function formatHour12(d, p) {
  return pad(d.getHours() % 12 || 12, p, 2);
}
function formatDayOfYear(d, p) {
  return pad(1 + _d3Time.timeDay.count((0, _d3Time.timeYear)(d), d), p, 3);
}
function formatMilliseconds(d, p) {
  return pad(d.getMilliseconds(), p, 3);
}
function formatMicroseconds(d, p) {
  return formatMilliseconds(d, p) + "000";
}
function formatMonthNumber(d, p) {
  return pad(d.getMonth() + 1, p, 2);
}
function formatMinutes(d, p) {
  return pad(d.getMinutes(), p, 2);
}
function formatSeconds(d, p) {
  return pad(d.getSeconds(), p, 2);
}
function formatWeekdayNumberMonday(d) {
  var day = d.getDay();
  return day === 0 ? 7 : day;
}
function formatWeekNumberSunday(d, p) {
  return pad(_d3Time.timeSunday.count((0, _d3Time.timeYear)(d) - 1, d), p, 2);
}
function dISO(d) {
  var day = d.getDay();
  return day >= 4 || day === 0 ? (0, _d3Time.timeThursday)(d) : _d3Time.timeThursday.ceil(d);
}
function formatWeekNumberISO(d, p) {
  d = dISO(d);
  return pad(_d3Time.timeThursday.count((0, _d3Time.timeYear)(d), d) + ((0, _d3Time.timeYear)(d).getDay() === 4), p, 2);
}
function formatWeekdayNumberSunday(d) {
  return d.getDay();
}
function formatWeekNumberMonday(d, p) {
  return pad(_d3Time.timeMonday.count((0, _d3Time.timeYear)(d) - 1, d), p, 2);
}
function formatYear(d, p) {
  return pad(d.getFullYear() % 100, p, 2);
}
function formatYearISO(d, p) {
  d = dISO(d);
  return pad(d.getFullYear() % 100, p, 2);
}
function formatFullYear(d, p) {
  return pad(d.getFullYear() % 10000, p, 4);
}
function formatFullYearISO(d, p) {
  var day = d.getDay();
  d = day >= 4 || day === 0 ? (0, _d3Time.timeThursday)(d) : _d3Time.timeThursday.ceil(d);
  return pad(d.getFullYear() % 10000, p, 4);
}
function formatZone(d) {
  var z = d.getTimezoneOffset();
  return (z > 0 ? "-" : (z *= -1, "+")) + pad(z / 60 | 0, "0", 2) + pad(z % 60, "0", 2);
}
function formatUTCDayOfMonth(d, p) {
  return pad(d.getUTCDate(), p, 2);
}
function formatUTCHour24(d, p) {
  return pad(d.getUTCHours(), p, 2);
}
function formatUTCHour12(d, p) {
  return pad(d.getUTCHours() % 12 || 12, p, 2);
}
function formatUTCDayOfYear(d, p) {
  return pad(1 + _d3Time.utcDay.count((0, _d3Time.utcYear)(d), d), p, 3);
}
function formatUTCMilliseconds(d, p) {
  return pad(d.getUTCMilliseconds(), p, 3);
}
function formatUTCMicroseconds(d, p) {
  return formatUTCMilliseconds(d, p) + "000";
}
function formatUTCMonthNumber(d, p) {
  return pad(d.getUTCMonth() + 1, p, 2);
}
function formatUTCMinutes(d, p) {
  return pad(d.getUTCMinutes(), p, 2);
}
function formatUTCSeconds(d, p) {
  return pad(d.getUTCSeconds(), p, 2);
}
function formatUTCWeekdayNumberMonday(d) {
  var dow = d.getUTCDay();
  return dow === 0 ? 7 : dow;
}
function formatUTCWeekNumberSunday(d, p) {
  return pad(_d3Time.utcSunday.count((0, _d3Time.utcYear)(d) - 1, d), p, 2);
}
function UTCdISO(d) {
  var day = d.getUTCDay();
  return day >= 4 || day === 0 ? (0, _d3Time.utcThursday)(d) : _d3Time.utcThursday.ceil(d);
}
function formatUTCWeekNumberISO(d, p) {
  d = UTCdISO(d);
  return pad(_d3Time.utcThursday.count((0, _d3Time.utcYear)(d), d) + ((0, _d3Time.utcYear)(d).getUTCDay() === 4), p, 2);
}
function formatUTCWeekdayNumberSunday(d) {
  return d.getUTCDay();
}
function formatUTCWeekNumberMonday(d, p) {
  return pad(_d3Time.utcMonday.count((0, _d3Time.utcYear)(d) - 1, d), p, 2);
}
function formatUTCYear(d, p) {
  return pad(d.getUTCFullYear() % 100, p, 2);
}
function formatUTCYearISO(d, p) {
  d = UTCdISO(d);
  return pad(d.getUTCFullYear() % 100, p, 2);
}
function formatUTCFullYear(d, p) {
  return pad(d.getUTCFullYear() % 10000, p, 4);
}
function formatUTCFullYearISO(d, p) {
  var day = d.getUTCDay();
  d = day >= 4 || day === 0 ? (0, _d3Time.utcThursday)(d) : _d3Time.utcThursday.ceil(d);
  return pad(d.getUTCFullYear() % 10000, p, 4);
}
function formatUTCZone() {
  return "+0000";
}
function formatLiteralPercent() {
  return "%";
}
function formatUnixTimestamp(d) {
  return +d;
}
function formatUnixTimestampSeconds(d) {
  return Math.floor(+d / 1000);
}

},{"d3-time":261}],258:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.utcDays = exports.utcDay = exports.unixDays = exports.unixDay = exports.timeDays = exports.timeDay = void 0;
var _interval = require("./interval.js");
var _duration = require("./duration.js");
var timeDay = (0, _interval.timeInterval)(function (date) {
  return date.setHours(0, 0, 0, 0);
}, function (date, step) {
  return date.setDate(date.getDate() + step);
}, function (start, end) {
  return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * _duration.durationMinute) / _duration.durationDay;
}, function (date) {
  return date.getDate() - 1;
});
exports.timeDay = timeDay;
var timeDays = timeDay.range;
exports.timeDays = timeDays;
var utcDay = (0, _interval.timeInterval)(function (date) {
  date.setUTCHours(0, 0, 0, 0);
}, function (date, step) {
  date.setUTCDate(date.getUTCDate() + step);
}, function (start, end) {
  return (end - start) / _duration.durationDay;
}, function (date) {
  return date.getUTCDate() - 1;
});
exports.utcDay = utcDay;
var utcDays = utcDay.range;
exports.utcDays = utcDays;
var unixDay = (0, _interval.timeInterval)(function (date) {
  date.setUTCHours(0, 0, 0, 0);
}, function (date, step) {
  date.setUTCDate(date.getUTCDate() + step);
}, function (start, end) {
  return (end - start) / _duration.durationDay;
}, function (date) {
  return Math.floor(date / _duration.durationDay);
});
exports.unixDay = unixDay;
var unixDays = unixDay.range;
exports.unixDays = unixDays;

},{"./duration.js":259,"./interval.js":262}],259:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.durationYear = exports.durationWeek = exports.durationSecond = exports.durationMonth = exports.durationMinute = exports.durationHour = exports.durationDay = void 0;
var durationSecond = 1000;
exports.durationSecond = durationSecond;
var durationMinute = durationSecond * 60;
exports.durationMinute = durationMinute;
var durationHour = durationMinute * 60;
exports.durationHour = durationHour;
var durationDay = durationHour * 24;
exports.durationDay = durationDay;
var durationWeek = durationDay * 7;
exports.durationWeek = durationWeek;
var durationMonth = durationDay * 30;
exports.durationMonth = durationMonth;
var durationYear = durationDay * 365;
exports.durationYear = durationYear;

},{}],260:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.utcHours = exports.utcHour = exports.timeHours = exports.timeHour = void 0;
var _interval = require("./interval.js");
var _duration = require("./duration.js");
var timeHour = (0, _interval.timeInterval)(function (date) {
  date.setTime(date - date.getMilliseconds() - date.getSeconds() * _duration.durationSecond - date.getMinutes() * _duration.durationMinute);
}, function (date, step) {
  date.setTime(+date + step * _duration.durationHour);
}, function (start, end) {
  return (end - start) / _duration.durationHour;
}, function (date) {
  return date.getHours();
});
exports.timeHour = timeHour;
var timeHours = timeHour.range;
exports.timeHours = timeHours;
var utcHour = (0, _interval.timeInterval)(function (date) {
  date.setUTCMinutes(0, 0, 0);
}, function (date, step) {
  date.setTime(+date + step * _duration.durationHour);
}, function (start, end) {
  return (end - start) / _duration.durationHour;
}, function (date) {
  return date.getUTCHours();
});
exports.utcHour = utcHour;
var utcHours = utcHour.range;
exports.utcHours = utcHours;

},{"./duration.js":259,"./interval.js":262}],261:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "timeDay", {
  enumerable: true,
  get: function get() {
    return _day.timeDay;
  }
});
Object.defineProperty(exports, "timeDays", {
  enumerable: true,
  get: function get() {
    return _day.timeDays;
  }
});
Object.defineProperty(exports, "timeFriday", {
  enumerable: true,
  get: function get() {
    return _week.timeFriday;
  }
});
Object.defineProperty(exports, "timeFridays", {
  enumerable: true,
  get: function get() {
    return _week.timeFridays;
  }
});
Object.defineProperty(exports, "timeHour", {
  enumerable: true,
  get: function get() {
    return _hour.timeHour;
  }
});
Object.defineProperty(exports, "timeHours", {
  enumerable: true,
  get: function get() {
    return _hour.timeHours;
  }
});
Object.defineProperty(exports, "timeInterval", {
  enumerable: true,
  get: function get() {
    return _interval.timeInterval;
  }
});
Object.defineProperty(exports, "timeMillisecond", {
  enumerable: true,
  get: function get() {
    return _millisecond.millisecond;
  }
});
Object.defineProperty(exports, "timeMilliseconds", {
  enumerable: true,
  get: function get() {
    return _millisecond.milliseconds;
  }
});
Object.defineProperty(exports, "timeMinute", {
  enumerable: true,
  get: function get() {
    return _minute.timeMinute;
  }
});
Object.defineProperty(exports, "timeMinutes", {
  enumerable: true,
  get: function get() {
    return _minute.timeMinutes;
  }
});
Object.defineProperty(exports, "timeMonday", {
  enumerable: true,
  get: function get() {
    return _week.timeMonday;
  }
});
Object.defineProperty(exports, "timeMondays", {
  enumerable: true,
  get: function get() {
    return _week.timeMondays;
  }
});
Object.defineProperty(exports, "timeMonth", {
  enumerable: true,
  get: function get() {
    return _month.timeMonth;
  }
});
Object.defineProperty(exports, "timeMonths", {
  enumerable: true,
  get: function get() {
    return _month.timeMonths;
  }
});
Object.defineProperty(exports, "timeSaturday", {
  enumerable: true,
  get: function get() {
    return _week.timeSaturday;
  }
});
Object.defineProperty(exports, "timeSaturdays", {
  enumerable: true,
  get: function get() {
    return _week.timeSaturdays;
  }
});
Object.defineProperty(exports, "timeSecond", {
  enumerable: true,
  get: function get() {
    return _second.second;
  }
});
Object.defineProperty(exports, "timeSeconds", {
  enumerable: true,
  get: function get() {
    return _second.seconds;
  }
});
Object.defineProperty(exports, "timeSunday", {
  enumerable: true,
  get: function get() {
    return _week.timeSunday;
  }
});
Object.defineProperty(exports, "timeSundays", {
  enumerable: true,
  get: function get() {
    return _week.timeSundays;
  }
});
Object.defineProperty(exports, "timeThursday", {
  enumerable: true,
  get: function get() {
    return _week.timeThursday;
  }
});
Object.defineProperty(exports, "timeThursdays", {
  enumerable: true,
  get: function get() {
    return _week.timeThursdays;
  }
});
Object.defineProperty(exports, "timeTickInterval", {
  enumerable: true,
  get: function get() {
    return _ticks.timeTickInterval;
  }
});
Object.defineProperty(exports, "timeTicks", {
  enumerable: true,
  get: function get() {
    return _ticks.timeTicks;
  }
});
Object.defineProperty(exports, "timeTuesday", {
  enumerable: true,
  get: function get() {
    return _week.timeTuesday;
  }
});
Object.defineProperty(exports, "timeTuesdays", {
  enumerable: true,
  get: function get() {
    return _week.timeTuesdays;
  }
});
Object.defineProperty(exports, "timeWednesday", {
  enumerable: true,
  get: function get() {
    return _week.timeWednesday;
  }
});
Object.defineProperty(exports, "timeWednesdays", {
  enumerable: true,
  get: function get() {
    return _week.timeWednesdays;
  }
});
Object.defineProperty(exports, "timeWeek", {
  enumerable: true,
  get: function get() {
    return _week.timeSunday;
  }
});
Object.defineProperty(exports, "timeWeeks", {
  enumerable: true,
  get: function get() {
    return _week.timeSundays;
  }
});
Object.defineProperty(exports, "timeYear", {
  enumerable: true,
  get: function get() {
    return _year.timeYear;
  }
});
Object.defineProperty(exports, "timeYears", {
  enumerable: true,
  get: function get() {
    return _year.timeYears;
  }
});
Object.defineProperty(exports, "unixDay", {
  enumerable: true,
  get: function get() {
    return _day.unixDay;
  }
});
Object.defineProperty(exports, "unixDays", {
  enumerable: true,
  get: function get() {
    return _day.unixDays;
  }
});
Object.defineProperty(exports, "utcDay", {
  enumerable: true,
  get: function get() {
    return _day.utcDay;
  }
});
Object.defineProperty(exports, "utcDays", {
  enumerable: true,
  get: function get() {
    return _day.utcDays;
  }
});
Object.defineProperty(exports, "utcFriday", {
  enumerable: true,
  get: function get() {
    return _week.utcFriday;
  }
});
Object.defineProperty(exports, "utcFridays", {
  enumerable: true,
  get: function get() {
    return _week.utcFridays;
  }
});
Object.defineProperty(exports, "utcHour", {
  enumerable: true,
  get: function get() {
    return _hour.utcHour;
  }
});
Object.defineProperty(exports, "utcHours", {
  enumerable: true,
  get: function get() {
    return _hour.utcHours;
  }
});
Object.defineProperty(exports, "utcMillisecond", {
  enumerable: true,
  get: function get() {
    return _millisecond.millisecond;
  }
});
Object.defineProperty(exports, "utcMilliseconds", {
  enumerable: true,
  get: function get() {
    return _millisecond.milliseconds;
  }
});
Object.defineProperty(exports, "utcMinute", {
  enumerable: true,
  get: function get() {
    return _minute.utcMinute;
  }
});
Object.defineProperty(exports, "utcMinutes", {
  enumerable: true,
  get: function get() {
    return _minute.utcMinutes;
  }
});
Object.defineProperty(exports, "utcMonday", {
  enumerable: true,
  get: function get() {
    return _week.utcMonday;
  }
});
Object.defineProperty(exports, "utcMondays", {
  enumerable: true,
  get: function get() {
    return _week.utcMondays;
  }
});
Object.defineProperty(exports, "utcMonth", {
  enumerable: true,
  get: function get() {
    return _month.utcMonth;
  }
});
Object.defineProperty(exports, "utcMonths", {
  enumerable: true,
  get: function get() {
    return _month.utcMonths;
  }
});
Object.defineProperty(exports, "utcSaturday", {
  enumerable: true,
  get: function get() {
    return _week.utcSaturday;
  }
});
Object.defineProperty(exports, "utcSaturdays", {
  enumerable: true,
  get: function get() {
    return _week.utcSaturdays;
  }
});
Object.defineProperty(exports, "utcSecond", {
  enumerable: true,
  get: function get() {
    return _second.second;
  }
});
Object.defineProperty(exports, "utcSeconds", {
  enumerable: true,
  get: function get() {
    return _second.seconds;
  }
});
Object.defineProperty(exports, "utcSunday", {
  enumerable: true,
  get: function get() {
    return _week.utcSunday;
  }
});
Object.defineProperty(exports, "utcSundays", {
  enumerable: true,
  get: function get() {
    return _week.utcSundays;
  }
});
Object.defineProperty(exports, "utcThursday", {
  enumerable: true,
  get: function get() {
    return _week.utcThursday;
  }
});
Object.defineProperty(exports, "utcThursdays", {
  enumerable: true,
  get: function get() {
    return _week.utcThursdays;
  }
});
Object.defineProperty(exports, "utcTickInterval", {
  enumerable: true,
  get: function get() {
    return _ticks.utcTickInterval;
  }
});
Object.defineProperty(exports, "utcTicks", {
  enumerable: true,
  get: function get() {
    return _ticks.utcTicks;
  }
});
Object.defineProperty(exports, "utcTuesday", {
  enumerable: true,
  get: function get() {
    return _week.utcTuesday;
  }
});
Object.defineProperty(exports, "utcTuesdays", {
  enumerable: true,
  get: function get() {
    return _week.utcTuesdays;
  }
});
Object.defineProperty(exports, "utcWednesday", {
  enumerable: true,
  get: function get() {
    return _week.utcWednesday;
  }
});
Object.defineProperty(exports, "utcWednesdays", {
  enumerable: true,
  get: function get() {
    return _week.utcWednesdays;
  }
});
Object.defineProperty(exports, "utcWeek", {
  enumerable: true,
  get: function get() {
    return _week.utcSunday;
  }
});
Object.defineProperty(exports, "utcWeeks", {
  enumerable: true,
  get: function get() {
    return _week.utcSundays;
  }
});
Object.defineProperty(exports, "utcYear", {
  enumerable: true,
  get: function get() {
    return _year.utcYear;
  }
});
Object.defineProperty(exports, "utcYears", {
  enumerable: true,
  get: function get() {
    return _year.utcYears;
  }
});
var _interval = require("./interval.js");
var _millisecond = require("./millisecond.js");
var _second = require("./second.js");
var _minute = require("./minute.js");
var _hour = require("./hour.js");
var _day = require("./day.js");
var _week = require("./week.js");
var _month = require("./month.js");
var _year = require("./year.js");
var _ticks = require("./ticks.js");

},{"./day.js":258,"./hour.js":260,"./interval.js":262,"./millisecond.js":263,"./minute.js":264,"./month.js":265,"./second.js":266,"./ticks.js":267,"./week.js":268,"./year.js":269}],262:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.timeInterval = timeInterval;
var t0 = new Date(),
  t1 = new Date();
function timeInterval(floori, offseti, count, field) {
  function interval(date) {
    return floori(date = arguments.length === 0 ? new Date() : new Date(+date)), date;
  }
  interval.floor = function (date) {
    return floori(date = new Date(+date)), date;
  };
  interval.ceil = function (date) {
    return floori(date = new Date(date - 1)), offseti(date, 1), floori(date), date;
  };
  interval.round = function (date) {
    var d0 = interval(date),
      d1 = interval.ceil(date);
    return date - d0 < d1 - date ? d0 : d1;
  };
  interval.offset = function (date, step) {
    return offseti(date = new Date(+date), step == null ? 1 : Math.floor(step)), date;
  };
  interval.range = function (start, stop, step) {
    var range = [];
    start = interval.ceil(start);
    step = step == null ? 1 : Math.floor(step);
    if (!(start < stop) || !(step > 0)) return range; // also handles Invalid Date
    var previous;
    do range.push(previous = new Date(+start)), offseti(start, step), floori(start); while (previous < start && start < stop);
    return range;
  };
  interval.filter = function (test) {
    return timeInterval(function (date) {
      if (date >= date) while (floori(date), !test(date)) date.setTime(date - 1);
    }, function (date, step) {
      if (date >= date) {
        if (step < 0) while (++step <= 0) {
          while (offseti(date, -1), !test(date)) {} // eslint-disable-line no-empty
        } else while (--step >= 0) {
          while (offseti(date, +1), !test(date)) {} // eslint-disable-line no-empty
        }
      }
    });
  };

  if (count) {
    interval.count = function (start, end) {
      t0.setTime(+start), t1.setTime(+end);
      floori(t0), floori(t1);
      return Math.floor(count(t0, t1));
    };
    interval.every = function (step) {
      step = Math.floor(step);
      return !isFinite(step) || !(step > 0) ? null : !(step > 1) ? interval : interval.filter(field ? function (d) {
        return field(d) % step === 0;
      } : function (d) {
        return interval.count(0, d) % step === 0;
      });
    };
  }
  return interval;
}

},{}],263:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.milliseconds = exports.millisecond = void 0;
var _interval = require("./interval.js");
var millisecond = (0, _interval.timeInterval)(function () {
  // noop
}, function (date, step) {
  date.setTime(+date + step);
}, function (start, end) {
  return end - start;
});

// An optimized implementation for this simple case.
exports.millisecond = millisecond;
millisecond.every = function (k) {
  k = Math.floor(k);
  if (!isFinite(k) || !(k > 0)) return null;
  if (!(k > 1)) return millisecond;
  return (0, _interval.timeInterval)(function (date) {
    date.setTime(Math.floor(date / k) * k);
  }, function (date, step) {
    date.setTime(+date + step * k);
  }, function (start, end) {
    return (end - start) / k;
  });
};
var milliseconds = millisecond.range;
exports.milliseconds = milliseconds;

},{"./interval.js":262}],264:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.utcMinutes = exports.utcMinute = exports.timeMinutes = exports.timeMinute = void 0;
var _interval = require("./interval.js");
var _duration = require("./duration.js");
var timeMinute = (0, _interval.timeInterval)(function (date) {
  date.setTime(date - date.getMilliseconds() - date.getSeconds() * _duration.durationSecond);
}, function (date, step) {
  date.setTime(+date + step * _duration.durationMinute);
}, function (start, end) {
  return (end - start) / _duration.durationMinute;
}, function (date) {
  return date.getMinutes();
});
exports.timeMinute = timeMinute;
var timeMinutes = timeMinute.range;
exports.timeMinutes = timeMinutes;
var utcMinute = (0, _interval.timeInterval)(function (date) {
  date.setUTCSeconds(0, 0);
}, function (date, step) {
  date.setTime(+date + step * _duration.durationMinute);
}, function (start, end) {
  return (end - start) / _duration.durationMinute;
}, function (date) {
  return date.getUTCMinutes();
});
exports.utcMinute = utcMinute;
var utcMinutes = utcMinute.range;
exports.utcMinutes = utcMinutes;

},{"./duration.js":259,"./interval.js":262}],265:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.utcMonths = exports.utcMonth = exports.timeMonths = exports.timeMonth = void 0;
var _interval = require("./interval.js");
var timeMonth = (0, _interval.timeInterval)(function (date) {
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
}, function (date, step) {
  date.setMonth(date.getMonth() + step);
}, function (start, end) {
  return end.getMonth() - start.getMonth() + (end.getFullYear() - start.getFullYear()) * 12;
}, function (date) {
  return date.getMonth();
});
exports.timeMonth = timeMonth;
var timeMonths = timeMonth.range;
exports.timeMonths = timeMonths;
var utcMonth = (0, _interval.timeInterval)(function (date) {
  date.setUTCDate(1);
  date.setUTCHours(0, 0, 0, 0);
}, function (date, step) {
  date.setUTCMonth(date.getUTCMonth() + step);
}, function (start, end) {
  return end.getUTCMonth() - start.getUTCMonth() + (end.getUTCFullYear() - start.getUTCFullYear()) * 12;
}, function (date) {
  return date.getUTCMonth();
});
exports.utcMonth = utcMonth;
var utcMonths = utcMonth.range;
exports.utcMonths = utcMonths;

},{"./interval.js":262}],266:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.seconds = exports.second = void 0;
var _interval = require("./interval.js");
var _duration = require("./duration.js");
var second = (0, _interval.timeInterval)(function (date) {
  date.setTime(date - date.getMilliseconds());
}, function (date, step) {
  date.setTime(+date + step * _duration.durationSecond);
}, function (start, end) {
  return (end - start) / _duration.durationSecond;
}, function (date) {
  return date.getUTCSeconds();
});
exports.second = second;
var seconds = second.range;
exports.seconds = seconds;

},{"./duration.js":259,"./interval.js":262}],267:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.utcTicks = exports.utcTickInterval = exports.timeTicks = exports.timeTickInterval = void 0;
var _d3Array = require("d3-array");
var _duration = require("./duration.js");
var _millisecond = require("./millisecond.js");
var _second = require("./second.js");
var _minute = require("./minute.js");
var _hour = require("./hour.js");
var _day = require("./day.js");
var _week = require("./week.js");
var _month = require("./month.js");
var _year = require("./year.js");
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _iterableToArrayLimit(arr, i) { var _i = null == arr ? null : "undefined" != typeof Symbol && arr[Symbol.iterator] || arr["@@iterator"]; if (null != _i) { var _s, _e, _x, _r, _arr = [], _n = !0, _d = !1; try { if (_x = (_i = _i.call(arr)).next, 0 === i) { if (Object(_i) !== _i) return; _n = !1; } else for (; !(_n = (_s = _x.call(_i)).done) && (_arr.push(_s.value), _arr.length !== i); _n = !0); } catch (err) { _d = !0, _e = err; } finally { try { if (!_n && null != _i["return"] && (_r = _i["return"](), Object(_r) !== _r)) return; } finally { if (_d) throw _e; } } return _arr; } }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }
function ticker(year, month, week, day, hour, minute) {
  var tickIntervals = [[_second.second, 1, _duration.durationSecond], [_second.second, 5, 5 * _duration.durationSecond], [_second.second, 15, 15 * _duration.durationSecond], [_second.second, 30, 30 * _duration.durationSecond], [minute, 1, _duration.durationMinute], [minute, 5, 5 * _duration.durationMinute], [minute, 15, 15 * _duration.durationMinute], [minute, 30, 30 * _duration.durationMinute], [hour, 1, _duration.durationHour], [hour, 3, 3 * _duration.durationHour], [hour, 6, 6 * _duration.durationHour], [hour, 12, 12 * _duration.durationHour], [day, 1, _duration.durationDay], [day, 2, 2 * _duration.durationDay], [week, 1, _duration.durationWeek], [month, 1, _duration.durationMonth], [month, 3, 3 * _duration.durationMonth], [year, 1, _duration.durationYear]];
  function ticks(start, stop, count) {
    var reverse = stop < start;
    if (reverse) {
      var _ref = [stop, start];
      start = _ref[0];
      stop = _ref[1];
    }
    var interval = count && typeof count.range === "function" ? count : tickInterval(start, stop, count);
    var ticks = interval ? interval.range(start, +stop + 1) : []; // inclusive stop
    return reverse ? ticks.reverse() : ticks;
  }
  function tickInterval(start, stop, count) {
    var target = Math.abs(stop - start) / count;
    var i = (0, _d3Array.bisector)(function (_ref2) {
      var _ref3 = _slicedToArray(_ref2, 3),
        step = _ref3[2];
      return step;
    }).right(tickIntervals, target);
    if (i === tickIntervals.length) return year.every((0, _d3Array.tickStep)(start / _duration.durationYear, stop / _duration.durationYear, count));
    if (i === 0) return _millisecond.millisecond.every(Math.max((0, _d3Array.tickStep)(start, stop, count), 1));
    var _tickIntervals = _slicedToArray(tickIntervals[target / tickIntervals[i - 1][2] < tickIntervals[i][2] / target ? i - 1 : i], 2),
      t = _tickIntervals[0],
      step = _tickIntervals[1];
    return t.every(step);
  }
  return [ticks, tickInterval];
}
var _ticker = ticker(_year.utcYear, _month.utcMonth, _week.utcSunday, _day.unixDay, _hour.utcHour, _minute.utcMinute),
  _ticker2 = _slicedToArray(_ticker, 2),
  utcTicks = _ticker2[0],
  utcTickInterval = _ticker2[1];
exports.utcTickInterval = utcTickInterval;
exports.utcTicks = utcTicks;
var _ticker3 = ticker(_year.timeYear, _month.timeMonth, _week.timeSunday, _day.timeDay, _hour.timeHour, _minute.timeMinute),
  _ticker4 = _slicedToArray(_ticker3, 2),
  timeTicks = _ticker4[0],
  timeTickInterval = _ticker4[1];
exports.timeTickInterval = timeTickInterval;
exports.timeTicks = timeTicks;

},{"./day.js":258,"./duration.js":259,"./hour.js":260,"./millisecond.js":263,"./minute.js":264,"./month.js":265,"./second.js":266,"./week.js":268,"./year.js":269,"d3-array":26}],268:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.utcWednesdays = exports.utcWednesday = exports.utcTuesdays = exports.utcTuesday = exports.utcThursdays = exports.utcThursday = exports.utcSundays = exports.utcSunday = exports.utcSaturdays = exports.utcSaturday = exports.utcMondays = exports.utcMonday = exports.utcFridays = exports.utcFriday = exports.timeWednesdays = exports.timeWednesday = exports.timeTuesdays = exports.timeTuesday = exports.timeThursdays = exports.timeThursday = exports.timeSundays = exports.timeSunday = exports.timeSaturdays = exports.timeSaturday = exports.timeMondays = exports.timeMonday = exports.timeFridays = exports.timeFriday = void 0;
var _interval = require("./interval.js");
var _duration = require("./duration.js");
function timeWeekday(i) {
  return (0, _interval.timeInterval)(function (date) {
    date.setDate(date.getDate() - (date.getDay() + 7 - i) % 7);
    date.setHours(0, 0, 0, 0);
  }, function (date, step) {
    date.setDate(date.getDate() + step * 7);
  }, function (start, end) {
    return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * _duration.durationMinute) / _duration.durationWeek;
  });
}
var timeSunday = timeWeekday(0);
exports.timeSunday = timeSunday;
var timeMonday = timeWeekday(1);
exports.timeMonday = timeMonday;
var timeTuesday = timeWeekday(2);
exports.timeTuesday = timeTuesday;
var timeWednesday = timeWeekday(3);
exports.timeWednesday = timeWednesday;
var timeThursday = timeWeekday(4);
exports.timeThursday = timeThursday;
var timeFriday = timeWeekday(5);
exports.timeFriday = timeFriday;
var timeSaturday = timeWeekday(6);
exports.timeSaturday = timeSaturday;
var timeSundays = timeSunday.range;
exports.timeSundays = timeSundays;
var timeMondays = timeMonday.range;
exports.timeMondays = timeMondays;
var timeTuesdays = timeTuesday.range;
exports.timeTuesdays = timeTuesdays;
var timeWednesdays = timeWednesday.range;
exports.timeWednesdays = timeWednesdays;
var timeThursdays = timeThursday.range;
exports.timeThursdays = timeThursdays;
var timeFridays = timeFriday.range;
exports.timeFridays = timeFridays;
var timeSaturdays = timeSaturday.range;
exports.timeSaturdays = timeSaturdays;
function utcWeekday(i) {
  return (0, _interval.timeInterval)(function (date) {
    date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 7 - i) % 7);
    date.setUTCHours(0, 0, 0, 0);
  }, function (date, step) {
    date.setUTCDate(date.getUTCDate() + step * 7);
  }, function (start, end) {
    return (end - start) / _duration.durationWeek;
  });
}
var utcSunday = utcWeekday(0);
exports.utcSunday = utcSunday;
var utcMonday = utcWeekday(1);
exports.utcMonday = utcMonday;
var utcTuesday = utcWeekday(2);
exports.utcTuesday = utcTuesday;
var utcWednesday = utcWeekday(3);
exports.utcWednesday = utcWednesday;
var utcThursday = utcWeekday(4);
exports.utcThursday = utcThursday;
var utcFriday = utcWeekday(5);
exports.utcFriday = utcFriday;
var utcSaturday = utcWeekday(6);
exports.utcSaturday = utcSaturday;
var utcSundays = utcSunday.range;
exports.utcSundays = utcSundays;
var utcMondays = utcMonday.range;
exports.utcMondays = utcMondays;
var utcTuesdays = utcTuesday.range;
exports.utcTuesdays = utcTuesdays;
var utcWednesdays = utcWednesday.range;
exports.utcWednesdays = utcWednesdays;
var utcThursdays = utcThursday.range;
exports.utcThursdays = utcThursdays;
var utcFridays = utcFriday.range;
exports.utcFridays = utcFridays;
var utcSaturdays = utcSaturday.range;
exports.utcSaturdays = utcSaturdays;

},{"./duration.js":259,"./interval.js":262}],269:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.utcYears = exports.utcYear = exports.timeYears = exports.timeYear = void 0;
var _interval = require("./interval.js");
var timeYear = (0, _interval.timeInterval)(function (date) {
  date.setMonth(0, 1);
  date.setHours(0, 0, 0, 0);
}, function (date, step) {
  date.setFullYear(date.getFullYear() + step);
}, function (start, end) {
  return end.getFullYear() - start.getFullYear();
}, function (date) {
  return date.getFullYear();
});

// An optimized implementation for this simple case.
exports.timeYear = timeYear;
timeYear.every = function (k) {
  return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : (0, _interval.timeInterval)(function (date) {
    date.setFullYear(Math.floor(date.getFullYear() / k) * k);
    date.setMonth(0, 1);
    date.setHours(0, 0, 0, 0);
  }, function (date, step) {
    date.setFullYear(date.getFullYear() + step * k);
  });
};
var timeYears = timeYear.range;
exports.timeYears = timeYears;
var utcYear = (0, _interval.timeInterval)(function (date) {
  date.setUTCMonth(0, 1);
  date.setUTCHours(0, 0, 0, 0);
}, function (date, step) {
  date.setUTCFullYear(date.getUTCFullYear() + step);
}, function (start, end) {
  return end.getUTCFullYear() - start.getUTCFullYear();
}, function (date) {
  return date.getUTCFullYear();
});

// An optimized implementation for this simple case.
exports.utcYear = utcYear;
utcYear.every = function (k) {
  return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : (0, _interval.timeInterval)(function (date) {
    date.setUTCFullYear(Math.floor(date.getUTCFullYear() / k) * k);
    date.setUTCMonth(0, 1);
    date.setUTCHours(0, 0, 0, 0);
  }, function (date, step) {
    date.setUTCFullYear(date.getUTCFullYear() + step * k);
  });
};
var utcYears = utcYear.range;
exports.utcYears = utcYears;

},{"./interval.js":262}],270:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.InternSet = exports.InternMap = void 0;
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArrayLimit(arr, i) { var _i = null == arr ? null : "undefined" != typeof Symbol && arr[Symbol.iterator] || arr["@@iterator"]; if (null != _i) { var _s, _e, _x, _r, _arr = [], _n = !0, _d = !1; try { if (_x = (_i = _i.call(arr)).next, 0 === i) { if (Object(_i) !== _i) return; _n = !1; } else for (; !(_n = (_s = _x.call(_i)).done) && (_arr.push(_s.value), _arr.length !== i); _n = !0); } catch (err) { _d = !0, _e = err; } finally { try { if (!_n && null != _i["return"] && (_r = _i["return"](), Object(_r) !== _r)) return; } finally { if (_d) throw _e; } } return _arr; } }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e2) { throw _e2; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e3) { didErr = true; err = _e3; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
function _get() { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get.bind(); } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(arguments.length < 3 ? target : receiver); } return desc.value; }; } return _get.apply(this, arguments); }
function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }
function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }
function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }
function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
function _wrapNativeSuper(Class) { var _cache = typeof Map === "function" ? new Map() : undefined; _wrapNativeSuper = function _wrapNativeSuper(Class) { if (Class === null || !_isNativeFunction(Class)) return Class; if (typeof Class !== "function") { throw new TypeError("Super expression must either be null or a function"); } if (typeof _cache !== "undefined") { if (_cache.has(Class)) return _cache.get(Class); _cache.set(Class, Wrapper); } function Wrapper() { return _construct(Class, arguments, _getPrototypeOf(this).constructor); } Wrapper.prototype = Object.create(Class.prototype, { constructor: { value: Wrapper, enumerable: false, writable: true, configurable: true } }); return _setPrototypeOf(Wrapper, Class); }; return _wrapNativeSuper(Class); }
function _construct(Parent, args, Class) { if (_isNativeReflectConstruct()) { _construct = Reflect.construct.bind(); } else { _construct = function _construct(Parent, args, Class) { var a = [null]; a.push.apply(a, args); var Constructor = Function.bind.apply(Parent, a); var instance = new Constructor(); if (Class) _setPrototypeOf(instance, Class.prototype); return instance; }; } return _construct.apply(null, arguments); }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
function _isNativeFunction(fn) { return Function.toString.call(fn).indexOf("[native code]") !== -1; }
function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }
var InternMap = /*#__PURE__*/function (_Map) {
  _inherits(InternMap, _Map);
  var _super = _createSuper(InternMap);
  function InternMap(entries) {
    var _this;
    var key = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : keyof;
    _classCallCheck(this, InternMap);
    _this = _super.call(this);
    Object.defineProperties(_assertThisInitialized(_this), {
      _intern: {
        value: new Map()
      },
      _key: {
        value: key
      }
    });
    if (entries != null) {
      var _iterator = _createForOfIteratorHelper(entries),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var _step$value = _slicedToArray(_step.value, 2),
            _key2 = _step$value[0],
            value = _step$value[1];
          _this.set(_key2, value);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    }
    return _this;
  }
  _createClass(InternMap, [{
    key: "get",
    value: function get(key) {
      return _get(_getPrototypeOf(InternMap.prototype), "get", this).call(this, intern_get(this, key));
    }
  }, {
    key: "has",
    value: function has(key) {
      return _get(_getPrototypeOf(InternMap.prototype), "has", this).call(this, intern_get(this, key));
    }
  }, {
    key: "set",
    value: function set(key, value) {
      return _get(_getPrototypeOf(InternMap.prototype), "set", this).call(this, intern_set(this, key), value);
    }
  }, {
    key: "delete",
    value: function _delete(key) {
      return _get(_getPrototypeOf(InternMap.prototype), "delete", this).call(this, intern_delete(this, key));
    }
  }]);
  return InternMap;
}( /*#__PURE__*/_wrapNativeSuper(Map));
exports.InternMap = InternMap;
var InternSet = /*#__PURE__*/function (_Set) {
  _inherits(InternSet, _Set);
  var _super2 = _createSuper(InternSet);
  function InternSet(values) {
    var _this2;
    var key = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : keyof;
    _classCallCheck(this, InternSet);
    _this2 = _super2.call(this);
    Object.defineProperties(_assertThisInitialized(_this2), {
      _intern: {
        value: new Map()
      },
      _key: {
        value: key
      }
    });
    if (values != null) {
      var _iterator2 = _createForOfIteratorHelper(values),
        _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var value = _step2.value;
          _this2.add(value);
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
    }
    return _this2;
  }
  _createClass(InternSet, [{
    key: "has",
    value: function has(value) {
      return _get(_getPrototypeOf(InternSet.prototype), "has", this).call(this, intern_get(this, value));
    }
  }, {
    key: "add",
    value: function add(value) {
      return _get(_getPrototypeOf(InternSet.prototype), "add", this).call(this, intern_set(this, value));
    }
  }, {
    key: "delete",
    value: function _delete(value) {
      return _get(_getPrototypeOf(InternSet.prototype), "delete", this).call(this, intern_delete(this, value));
    }
  }]);
  return InternSet;
}( /*#__PURE__*/_wrapNativeSuper(Set));
exports.InternSet = InternSet;
function intern_get(_ref, value) {
  var _intern = _ref._intern,
    _key = _ref._key;
  var key = _key(value);
  return _intern.has(key) ? _intern.get(key) : value;
}
function intern_set(_ref2, value) {
  var _intern = _ref2._intern,
    _key = _ref2._key;
  var key = _key(value);
  if (_intern.has(key)) return _intern.get(key);
  _intern.set(key, value);
  return value;
}
function intern_delete(_ref3, value) {
  var _intern = _ref3._intern,
    _key = _ref3._key;
  var key = _key(value);
  if (_intern.has(key)) {
    value = _intern.get(key);
    _intern["delete"](key);
  }
  return value;
}
function keyof(value) {
  return value !== null && _typeof(value) === "object" ? value.valueOf() : value;
}

},{}],271:[function(require,module,exports){
"use strict";

/**
 * An implementation of ODEX, by E. Hairer and G. Wanner, ported from the Fortran ODEX.F.
 * The original work carries the BSD 2-clause license, and so does this.
 *
 * Copyright (c) 2016-2023 Colin Smith.
 * 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following
 * disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the
 * following disclaimer in the documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
 * INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
 * INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 * GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
 * OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, defineProperty = Object.defineProperty || function (obj, key, desc) { obj[key] = desc.value; }, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return defineProperty(generator, "_invoke", { value: makeInvokeMethod(innerFn, self, context) }), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == _typeof(value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; defineProperty(this, "_invoke", { value: function value(method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; } function maybeInvokeDelegate(delegate, context) { var methodName = context.method, method = delegate.iterator[methodName]; if (undefined === method) return context.delegate = null, "throw" === methodName && delegate.iterator["return"] && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method) || "return" !== methodName && (context.method = "throw", context.arg = new TypeError("The iterator does not provide a '" + methodName + "' method")), ContinueSentinel; var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), defineProperty(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (val) { var object = Object(val), keys = []; for (var key in object) keys.push(key); return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, "catch": function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Solver = void 0;
var Solver = /*#__PURE__*/function () {
  /**
   * Construct an integrator for the differential system f (which is a function
   * expected to take a number and return a vector of numbers $Y = f(x)$.), where
   * Y is a vector of length `n`.
   *
   * Updates to the default options for the integrator may also be given.
   * Options cannot be changed after the solver is constructed.
   *
   * @param f function to integrate
   * @param n dimension of f's return value
   * @param options dictionary of option updates
   */
  function Solver(f, n) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    _classCallCheck(this, Solver);
    this.hMax = 0; // maximum step size chosen for this problem
    this.nEval = 0; // number of function evaluations done
    this.t = [];
    this.err = 0;
    this.errOld = 1e10;
    // Step counters
    this.nStep = 0;
    this.nAccept = 0;
    this.nReject = 0;
    this.iPt = 0;
    this.f = f;
    this.n = n;
    this.options = Object.assign({}, Solver.defaults, options);
    if (this.options.maxSteps <= 0) throw new Error('maxSteps must be positive');
    if (this.options.maxExtrapolationColumns <= 2) throw new Error('maxExtrapolationColumns must be > 2');
    var maxK = this.options.maxExtrapolationColumns;
    this.options.stepSizeSequence = this.options.stepSizeSequence || (this.options.denseOutput ? 4 : 1);
    if (this.options.stepSizeSequence <= 3 && this.options.denseOutput) throw new Error('stepSizeSequence incompatible with denseOutput');
    if (this.options.interpolationFormulaDegree <= 0 || this.options.interpolationFormulaDegree >= 7) throw new Error('bad interpolationFormulaDegree');
    if (this.options.denseOutput) {
      if (!Array.isArray(this.options.denseComponents) || this.options.denseComponents.length == 0) {
        // if user does not specify any denseComponents, request all of them.
        // Create a new array so that we do not re-use the default empty array.
        this.options.denseComponents = [];
        for (var i = 0; i < this.n; ++i) {
          this.options.denseComponents.push(i);
        }
      }
      var _iterator = _createForOfIteratorHelper(this.options.denseComponents),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var c = _step.value;
          if (c < 0 || c >= this.n) throw new Error('illegal dense component index ' + c);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    }
    if (this.options.uRound <= 1e-35 || this.options.uRound > 1) throw new Error('suspicious value of uRound');
    var lfSafe = 2 * maxK * maxK + maxK;
    this.aTol = this.expandToArray(this.options.absoluteTolerance);
    this.rTol = this.expandToArray(this.options.relativeTolerance);
    // call to core integrator
    this.ySafe = Array(maxK);
    this.fSafe = Array(lfSafe);
    for (var _i = 0; _i < this.fSafe.length; ++_i) this.fSafe[_i] = Array(this.options.denseComponents.length);
    for (var _i2 = 0; _i2 < this.ySafe.length; ++_i2) this.ySafe[_i2] = Array(this.options.denseComponents.length);
    this.hh = Array(maxK);
    this.t = Array(maxK);
    for (var _i3 = 0; _i3 < this.t.length; ++_i3) this.t[_i3] = Array(this.n);
    // Define the step size sequence
    this.nj = Solver.stepSizeSequence(this.options.stepSizeSequence, maxK);
    // Define the a[i] for order selection
    this.a = Array(maxK);
    this.a[0] = 1 + this.nj[0];
    for (var _i4 = 1; _i4 < maxK; ++_i4) {
      this.a[_i4] = this.a[_i4 - 1] + this.nj[_i4];
    }
    this.w = Array(maxK);
    this.w[0] = 0;
    this.scal = Array(this.n);
    this.iPoint = Array(maxK + 1);
    this.errfac = Array(2 * maxK);
    this.posneg = 1;
  }
  /**
   * Grid is supplied as a ready-made integration callback that manages
   * the delivery of uniformly-spaced integration points. Essentially it
   * is transforms the step callback (which is invoked at irregular
   * intervals due to the adaptive step size of the underlying algorithm
   * and) into a callback that is invoked at predictable coordinates.
   * The callback produced by grid also takes care of assembling a solution
   * vector for each component, rather than leaving it up to the client
   * to call the interpolating function for each component of the solution.
   *
   * All of this is easier to do with the new `integrate` interface.
   *
   * @param dt interval between points
   * @param out user callback function, invoked at uniform intervals
   * @returns a callback for use with the solve interface
   */
  _createClass(Solver, [{
    key: "grid",
    value: function grid(dt, out) {
      if (!this.options.denseOutput) throw new Error('Must set .denseOutput to true when using grid');
      var components = this.options.denseComponents;
      var t;
      return function (xOld, x, y, interpolate) {
        t !== null && t !== void 0 ? t : t = xOld;
        while (t <= x) {
          var yf = [];
          var _iterator2 = _createForOfIteratorHelper(components),
            _step2;
          try {
            for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
              var i = _step2.value;
              yf.push(interpolate(i, t));
            }
          } catch (err) {
            _iterator2.e(err);
          } finally {
            _iterator2.f();
          }
          var v = out(t, yf);
          if (v === false) return false;
          t += dt;
        }
      };
    }
    /**
     * Possibly converts a number to an array sized to the dimension of the
     * integration problem, containing the supplied number in every slot.
     *
     * @param x value
     * @returns An array [x, x, ...]
     */
  }, {
    key: "expandToArray",
    value: function expandToArray(x) {
      // If x is an array, return it. If x is a number, return a new array, sized
      // to the dimension of the problem, filled with the number@.
      if (Array.isArray(x)) {
        return x;
      } else {
        return Array(this.n).fill(x, 0);
      }
    }
  }, {
    key: "copy",
    value: function copy(a, b) {
      // Copy the elements of b into a
      if (a.length !== b.length) {
        throw new Error('copy used on arrays of differing size');
      }
      for (var i = 0; i < a.length; ++i) a[i] = b[i];
    }
    /**
     * This is a dummy function used to fill the dense output function field
     * of a `SolutionSegment` when dense output is switched off. Throws when
     * invoked with any arguments.
     *
     * @param c component number
     * @param x independent coordinate value
     */
  }, {
    key: "noDenseOutput",
    value: function noDenseOutput(c, x) {
      throw new Error('denseOutput not enabled for this problem');
    }
    // Generate step size sequence and return as an array of length n.
  }, {
    key: "interp",
    value:
    // Generate interpolation data
    function interp(y, imit) {
      // computes the coefficients of the interpolation formula
      var n = this.options.denseComponents.length;
      var a = new Array(31);
      // begin with Hermite interpolation
      for (var i = 0; i < this.options.denseComponents.length; ++i) {
        var y0 = y[i];
        var y1 = y[2 * n + i];
        var yp0 = y[n + i];
        var yp1 = y[3 * n + i];
        var yDiff = y1 - y0;
        var aspl = -yp1 + yDiff;
        var bspl = yp0 - yDiff;
        y[n + i] = yDiff;
        y[2 * n + i] = aspl;
        y[3 * n + i] = bspl;
        if (imit < 0) continue;
        // compute the derivatives of Hermite at midpoint
        var ph0 = (y0 + y1) * 0.5 + 0.125 * (aspl + bspl);
        var ph1 = yDiff + (aspl - bspl) * 0.25;
        var ph2 = -(yp0 - yp1);
        var ph3 = 6 * (bspl - aspl);
        // compute the further coefficients
        if (imit >= 1) {
          a[1] = 16 * (y[5 * n + i] - ph1);
          if (imit >= 3) {
            a[3] = 16 * (y[7 * n + i] - ph3 + 3 * a[1]);
            if (imit >= 5) {
              for (var im = 5; im <= imit; im += 2) {
                var fac1 = im * (im - 1) / 2;
                var fac2 = fac1 * (im - 2) * (im - 3) * 2;
                a[im] = 16 * (y[(im + 4) * n + i] + fac1 * a[im - 2] - fac2 * a[im - 4]);
              }
            }
          }
        }
        a[0] = (y[4 * n + i] - ph0) * 16;
        if (imit >= 2) {
          a[2] = (y[n * 6 + i] - ph2 + a[0]) * 16;
          if (imit >= 4) {
            for (var _im = 4; _im <= imit; _im += 2) {
              var _fac = _im * (_im - 1) / 2;
              var _fac2 = _im * (_im - 1) * (_im - 2) * (_im - 3);
              a[_im] = (y[n * (_im + 4) + i] + a[_im - 2] * _fac - a[_im - 4] * _fac2) * 16;
            }
          }
        }
        for (var _im2 = 0; _im2 <= imit; ++_im2) y[n * (_im2 + 4) + i] = a[_im2];
      }
    }
    // Given interpolation data, produce the dense output function over the solution
    // segment [xOld, xOld+h].
  }, {
    key: "contex",
    value: function contex(xOld, h, imit, y) {
      var _this = this;
      return function (c, x) {
        var nrd = _this.options.denseComponents.length;
        var i = _this.options.denseComponents.indexOf(c);
        if (i < 0) throw new Error('no dense output available for component ' + c);
        var theta = (x - xOld) / h;
        var theta1 = 1 - theta;
        var phthet = y[i] + theta * (y[nrd + i] + theta1 * (y[2 * nrd + i] * theta + y[3 * nrd + i] * theta1));
        if (imit < 0) return phthet;
        var thetah = theta - 0.5;
        var ret = y[nrd * (imit + 4) + i];
        for (var im = imit; im >= 1; --im) {
          ret = y[nrd * (im + 3) + i] + ret * thetah / im;
        }
        return phthet + Math.pow(theta * theta1, 2) * ret;
      };
    }
    /**
     * Computes the jth line of the extrapolation table (0-based) and
     * provides an estimation of the optional stepsize. Returns
     * false if the Fortran condition "ATOV" is true. Not quite
     * sure what that stands for as of this writing.
     * @param j
     * @param h
     * @param x
     * @param y
     * @param yprime
     * @returns
     */
  }, {
    key: "midex",
    value: function midex(j, h, x, y, yprime) {
      var dy = Array(this.n);
      var yh1 = Array(this.n);
      var yh2 = Array(this.n);
      var hj = h / this.nj[j];
      // Euler starting step
      for (var i = 0; i < this.n; ++i) {
        yh1[i] = y[i];
        yh2[i] = y[i] + hj * yprime[i];
      }
      // Explicit midpoint rule
      var m = this.nj[j] - 1;
      var njMid = this.nj[j] / 2 | 0;
      for (var mm = 1; mm <= m; ++mm) {
        if (this.options.denseOutput && mm === njMid) {
          for (var _i5 = 0; _i5 < this.options.denseComponents.length; ++_i5) {
            this.ySafe[j][_i5] = yh2[this.options.denseComponents[_i5]];
          }
        }
        this.copy(dy, this.f(x + hj * mm, yh2));
        if (this.options.denseOutput && Math.abs(mm - njMid) <= 2 * j + 1) {
          ++this.iPt;
          for (var _i6 = 0; _i6 < this.options.denseComponents.length; ++_i6) {
            this.fSafe[this.iPt - 1][_i6] = dy[this.options.denseComponents[_i6]];
          }
        }
        for (var _i7 = 0; _i7 < this.n; ++_i7) {
          var ys = yh1[_i7];
          yh1[_i7] = yh2[_i7];
          yh2[_i7] = ys + 2 * hj * dy[_i7];
        }
        if (mm <= this.options.stabilityCheckCount && j < this.options.stabilityCheckTableLines) {
          // stability check
          var del1 = 0;
          for (var _i8 = 0; _i8 < this.n; ++_i8) {
            del1 += Math.pow(yprime[_i8] / this.scal[_i8], 2);
          }
          var del2 = 0;
          for (var _i9 = 0; _i9 < this.n; ++_i9) {
            del2 += Math.pow((dy[_i9] - yprime[_i9]) / this.scal[_i9], 2);
          }
          var quot = del2 / Math.max(this.options.uRound, del1);
          if (quot > 4) {
            ++this.nEval;
            return false;
          }
        }
      }
      // final smoothing step
      this.copy(dy, this.f(x + h, yh2));
      if (this.options.denseOutput && njMid <= 2 * j + 1) {
        ++this.iPt;
        for (var _i10 = 0; _i10 < this.options.denseComponents.length; ++_i10) {
          this.fSafe[this.iPt - 1][_i10] = dy[this.options.denseComponents[_i10]];
        }
      }
      for (var _i11 = 0; _i11 < this.n; ++_i11) {
        this.t[j][_i11] = (yh1[_i11] + yh2[_i11] + hj * dy[_i11]) / 2;
      }
      this.nEval += this.nj[j];
      // polynomial extrapolation
      if (j === 0) return true;
      var fac;
      for (var l = j; l > 0; --l) {
        fac = Math.pow(this.nj[j] / this.nj[l - 1], 2) - 1;
        for (var _i12 = 0; _i12 < this.n; ++_i12) {
          this.t[l - 1][_i12] = this.t[l][_i12] + (this.t[l][_i12] - this.t[l - 1][_i12]) / fac;
        }
      }
      this.err = 0;
      // scaling
      for (var _i13 = 0; _i13 < this.n; ++_i13) {
        var t0i = Math.max(Math.abs(y[_i13]), Math.abs(this.t[0][_i13]));
        this.scal[_i13] = this.aTol[_i13] + this.rTol[_i13] * t0i;
        this.err += Math.pow((this.t[0][_i13] - this.t[1][_i13]) / this.scal[_i13], 2);
      }
      this.err = Math.sqrt(this.err / this.n);
      if (this.err * this.options.uRound >= 1 || j > 1 && this.err >= this.errOld) {
        return false;
      }
      this.errOld = Math.max(4 * this.err, 1);
      // compute optimal stepsizes
      var exp0 = 1 / (2 * j + 1);
      var facMin = Math.pow(this.options.stepSizeFac1, exp0);
      fac = Math.min(this.options.stepSizeFac2 / facMin, Math.max(facMin, Math.pow(this.err / this.options.stepSafetyFactor1, exp0) / this.options.stepSafetyFactor2));
      fac = 1 / fac;
      this.hh[j] = Math.min(Math.abs(h) * fac, this.hMax);
      this.w[j] = this.a[j] / this.hh[j];
      return true;
    }
    /**
     * Considers accepting the current integration step, and, if dense output is
     * requested, prepares the data that will be used by the iterpolating function.
     * If denseOutputErrorEstimator is also switched on, information gathered
     * while preparing the dense output data may be used to tardily decide that
     * the step should be rejected after all.
     *
     * @returns an object with the new optimized step size and either a dense
     *     interpolation function or an indication that the step should be
     *     rejected after all.
     */
  }, {
    key: "acceptStep",
    value: function acceptStep(kc, h, x, y, dz) {
      // label 60
      var ncom = 2 * this.options.maxExtrapolationColumns + 5 + this.options.denseComponents.length;
      var dens = Array(ncom);
      var kmit = 2 * kc - this.options.interpolationFormulaDegree + 1;
      var newHoptde = undefined;
      if (this.options.denseOutput) {
        var nrd = this.options.denseComponents.length;
        // kmit = mu of the paper
        for (var i = 0; i < nrd; ++i) dens[i] = y[this.options.denseComponents[i]];
        for (var _i14 = 0; _i14 < nrd; ++_i14) dens[nrd + _i14] = h * dz[this.options.denseComponents[_i14]];
        var kln = 2 * nrd;
        for (var _i15 = 0; _i15 < nrd; ++_i15) dens[kln + _i15] = this.t[0][this.options.denseComponents[_i15]];
        // compute solution at mid-point
        for (var j = 2; j <= kc; ++j) {
          for (var l = j; l >= 2; --l) {
            var factor = Math.pow(this.nj[j - 1] / this.nj[l - 2], 2) - 1;
            for (var _i16 = 0; _i16 < nrd; ++_i16) {
              this.ySafe[l - 2][_i16] = this.ySafe[l - 1][_i16] + (this.ySafe[l - 1][_i16] - this.ySafe[l - 2][_i16]) / factor;
            }
          }
        }
        var krn = 4 * nrd;
        for (var _i17 = 0; _i17 < nrd; ++_i17) dens[krn + _i17] = this.ySafe[0][_i17];
        // compute first derivative at right end
        var t0i = Array(this.n);
        for (var _i18 = 0; _i18 < this.n; ++_i18) t0i[_i18] = this.t[0][_i18];
        var fx = this.f(x + h, t0i);
        krn = 3 * nrd;
        for (var _i19 = 0; _i19 < nrd; ++_i19) dens[krn + _i19] = fx[this.options.denseComponents[_i19]] * h;
        // THE LOOP
        for (var kmi = 1; kmi <= kmit; ++kmi) {
          // compute kmi-th derivative at mid-point
          var kbeg = (kmi + 1) / 2 | 0;
          for (var kk = kbeg; kk <= kc; ++kk) {
            var facnj = Math.pow(this.nj[kk - 1] / 2, kmi - 1);
            this.iPt = this.iPoint[kk] - 2 * kk + kmi;
            for (var _i20 = 0; _i20 < nrd; ++_i20) {
              this.ySafe[kk - 1][_i20] = this.fSafe[this.iPt - 1][_i20] * facnj; // TODO warning: if we change definition of iPoint, need to fix this
            }
          }

          for (var _j = kbeg + 1; _j <= kc; ++_j) {
            for (var _l = _j; _l >= kbeg + 1; --_l) {
              var _factor = Math.pow(this.nj[_j - 1] / this.nj[_l - 2], 2) - 1;
              for (var _i21 = 0; _i21 < nrd; ++_i21) {
                this.ySafe[_l - 2][_i21] = this.ySafe[_l - 1][_i21] + (this.ySafe[_l - 1][_i21] - this.ySafe[_l - 2][_i21]) / _factor;
              }
            }
          }
          krn = (kmi + 4) * nrd;
          for (var _i22 = 0; _i22 < nrd; ++_i22) dens[krn + _i22] = this.ySafe[kbeg - 1][_i22] * h;
          if (kmi === kmit) continue;
          // compute differences
          for (var _kk = (kmi + 2) / 2 | 0; _kk <= kc; ++_kk) {
            var lbeg = this.iPoint[_kk];
            var lend = this.iPoint[_kk - 1] + kmi + 1;
            if (kmi === 1 && this.options.stepSizeSequence === 4) lend += 2;
            var _l2 = void 0;
            for (_l2 = lbeg; _l2 >= lend; _l2 -= 2) {
              for (var _i23 = 0; _i23 < nrd; ++_i23) {
                this.fSafe[_l2 - 1][_i23] -= this.fSafe[_l2 - 3][_i23];
              }
            }
            if (kmi === 1 && this.options.stepSizeSequence === 4) {
              _l2 = lend - 2;
              for (var _i24 = 0; _i24 < nrd; ++_i24) this.fSafe[_l2 - 1][_i24] -= dz[this.options.denseComponents[_i24]];
            }
          }
          // compute differences
          for (var _kk2 = (kmi + 2) / 2 | 0; _kk2 <= kc; ++_kk2) {
            var _lbeg = this.iPoint[_kk2] - 1;
            var _lend = this.iPoint[_kk2 - 1] + kmi + 2;
            for (var _l3 = _lbeg; _l3 >= _lend; _l3 -= 2) {
              for (var _i25 = 0; _i25 < nrd; ++_i25) {
                this.fSafe[_l3 - 1][_i25] -= this.fSafe[_l3 - 3][_i25];
              }
            }
          }
        }
        this.interp(dens, kmit);
        // estimation of interpolation error
        if (this.options.denseOutputErrorEstimator && kmit >= 1) {
          var errint = 0;
          for (var _i26 = 0; _i26 < nrd; ++_i26) errint += Math.pow(dens[(kmit + 4) * nrd + _i26] / this.scal[this.options.denseComponents[_i26]], 2);
          errint = Math.sqrt(errint / nrd) * this.errfac[kmit - 1];
          newHoptde = h / Math.max(Math.pow(errint, 1 / (kmit + 4)), 0.01);
          if (errint > 10) {
            ++this.nReject;
            return {
              accept: false,
              hoptde: newHoptde
            };
          }
        }
        this.copy(dz, fx);
      }
      this.copy(y, this.t[0]);
      ++this.nAccept;
      return {
        accept: true,
        hoptde: newHoptde,
        densef: this.options.denseOutput ? this.contex(x, h, kmit, dens) : this.noDenseOutput
      };
    }
    /**
     * Compute new "optimal" extrapolation order and step size based on current
     * integration conditions recorded in the work array `w`.
     *
     * @param reject true if the previous integration step was rejected
     * @param kc current extrapolation column
     * @param k extrapolation columns
     * @param h previous step size
     * @returns An object holding new step size and extrapolation order
     */
  }, {
    key: "newOrderAndStepSize",
    value: function newOrderAndStepSize(reject, kc, k, h) {
      // compute optimal interpolation order
      var kopt;
      if (kc === 2) {
        kopt = Math.min(3, this.options.maxExtrapolationColumns - 1);
        if (reject) kopt = 2;
      } else if (kc <= k) {
        kopt = kc;
        if (this.w[kc - 2] < this.w[kc - 1] * this.options.stepSizeFac3) kopt = kc - 1;
        if (this.w[kc - 1] < this.w[kc - 2] * this.options.stepSizeFac4) kopt = Math.min(kc + 1, this.options.maxExtrapolationColumns - 1);
      } else {
        kopt = kc - 1;
        if (kc > 3 && this.w[kc - 3] < this.w[kc - 2] * this.options.stepSizeFac3) kopt = kc - 2;
        if (this.w[kc - 1] < this.w[kopt - 1] * this.options.stepSizeFac4) kopt = Math.min(kc, this.options.maxExtrapolationColumns - 1);
      }
      // after a rejected step
      if (reject) {
        return {
          k: Math.min(kopt, kc),
          h: this.posneg * Math.min(Math.abs(h), Math.abs(this.hh[k - 1]))
        };
      }
      var r = {
        h: 0,
        k: 0
      };
      if (kopt <= kc) {
        r.h = this.hh[kopt - 1];
      } else {
        if (kc < k && this.w[kc - 1] < this.w[kc - 2] * this.options.stepSizeFac4) {
          r.h = this.hh[kc - 1] * this.a[kopt] / this.a[kc - 1];
        } else {
          r.h = this.hh[kc - 1] * this.a[kopt - 1] / this.a[kc - 1];
        }
      }
      r.h = this.posneg * Math.abs(r.h);
      r.k = kopt;
      return r;
    }
    /**
     * Legacy interface, which delivers solution segments via callback.
     * The callback will be invoked with the values `xOld`, `x`, `y`, and
     * `f`. This represents the integration step of the interval `[xOld, x]`,
     * where $y$ is the integrated value of $f(x)$, and (if dense output was
     * requested) `f` can be used to obtain high quality results for $f(x)$
     * anywhere in the interval `[xOld, x]`. It is illegal to use f outside
     * this range.
     *
     * @param x0 initial independent variable
     * @param y0 f(x0)
     * @param xEnd end of integration interval
     * @param solOut optional solution segment callback, or step handler
     * @returns an object containing summary information about the integration
     */
  }, {
    key: "solve",
    value: function solve(x0, y0, xEnd, solOut) {
      if (this.options.denseOutput && !solOut) throw new Error('solve: denseOutput requires a solution observer function');
      var lastY = y0;
      var _iterator3 = _createForOfIteratorHelper(this.solutionSegments(x0, y0, xEnd)),
        _step3;
      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
          var segment = _step3.value;
          if (solOut) {
            solOut(segment.x0, segment.x1, segment.y, segment.f);
          }
          lastY = segment.y;
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
      return {
        y: lastY,
        nStep: this.nStep,
        xEnd: xEnd,
        nAccept: this.nAccept,
        nReject: this.nReject,
        nEval: this.nEval
      };
    }
    /**
     * Integrate the differential equation. This produces a function which will
     * interpolate the solution as far as desired (starting at the point where
     * the initial conditions are provided). The function must be invoked on an
     * increasing sequence of x values: you cannot rewind the integration to an
     * earlier point. (Behind the scenes, a variable step size integration
     * algorithm is generating solution segments valid on finite intervals. As
     * you move into a new interval, older intervals are discarded, allowing the
     * integration to proceed indefinitely without accumulating memory).
     *
     * You can signal that you are through with the integrator by calling the
     * interpolator function with no arguments.
     *
     * @param x0 initial independent variable
     * @param y0 f(x0)
     * @return interpolation function valid on a monotonically increasing
     *     argument sequence
     */
  }, {
    key: "integrate",
    value: function integrate(x0, y0) {
      if (!this.options.denseOutput) throw new Error('integrate interface requires denseOutput');
      var components = this.options.denseComponents;
      var segments = this.solutionSegments(x0, y0);
      var s = segments.next();
      return function (x) {
        if (x === undefined) {
          segments.next(false);
          return [];
        } else if (x < s.value.x0) {
          throw new Error('cannot use interpolation function in backwards direction');
        } else {
          while (!s.done && x > s.value.x1) s = segments.next();
          var v = [];
          var _iterator4 = _createForOfIteratorHelper(components),
            _step4;
          try {
            for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
              var c = _step4.value;
              v.push(s.value.f(c, x));
            }
          } catch (err) {
            _iterator4.e(err);
          } finally {
            _iterator4.f();
          }
          return v;
        }
      };
    }
    /**
     * Integrate the differential system represented by f, given initial
     * values x and y0 = f(x). This generates a contiguous sequence of
     * solution segments. Each segment contains an interval [x0, x1] and
     * the integrated value f(x1). If denseOutput is selected in the options,
     * an interpolation function is provided, valid over the closed interval.
     *
     * Use of this interface switches on the denseOutput flag. You can still
     * use denseComponents to restrict the y components for which dense output
     * data is computed.
     *
     * @param x initial independent coordinate
     * @param y0 initial value
     * @param xEnd optional end of integration interval
     */
  }, {
    key: "solutionSegments",
    value:
    /*#__PURE__*/
    _regeneratorRuntime().mark(function solutionSegments(x, y0, xEnd) {
      var _a, _b, y, dz, i, k, h, xOld, _i27, njAdd, mu, errx, prod, j, hoptde, reject, last, kc, STATE, state, _j2, _j3, result, proceed, _this$newOrderAndStep;
      return _regeneratorRuntime().wrap(function solutionSegments$(_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            if (!(!Array.isArray(y0) || y0.length != this.n)) {
              _context.next = 2;
              break;
            }
            throw new Error('y0 must be an array sized to the dimension of the problem');
          case 2:
            y = y0.slice();
            dz = Array(this.n);
            this.hMax = this.options.maxStepSize;
            if (this.options.maxStepSize) {
              this.hMax = this.options.maxStepSize;
            } else if (xEnd) {
              this.hMax = Math.abs(xEnd - x);
            } else {
              this.hMax = 1;
            }
            this.nStep = this.nAccept = this.nReject = 0;
            this.posneg = xEnd ? xEnd - x >= 0 ? 1 : -1 : 1;
            // Initial Scaling
            for (i = 0; i < this.n; ++i) {
              this.scal[i] = this.aTol[i] + this.rTol[i] + Math.abs(y[i]);
            }
            // Initial preparations
            k = Math.max(2, Math.min(this.options.maxExtrapolationColumns - 1, Math.floor(-Math.log10(this.rTol[0] + 1e-40) * 0.6 + 1.5)));
            h = Math.max(Math.abs(this.options.initialStepSize), 1e-4);
            h = this.posneg * Math.min(h, this.hMax, xEnd ? Math.abs(xEnd - x) / 2 : Infinity);
            xOld = x;
            this.iPt = 0; // TODO: fix
            if (this.options.denseOutput) {
              this.iPoint[0] = 0;
              for (_i27 = 0; _i27 < this.options.maxExtrapolationColumns; ++_i27) {
                njAdd = 4 * (_i27 + 1) - 2;
                if (this.nj[_i27] > njAdd) ++njAdd;
                this.iPoint[_i27 + 1] = this.iPoint[_i27] + njAdd;
              }
              for (mu = 0; mu < 2 * this.options.maxExtrapolationColumns; ++mu) {
                errx = Math.sqrt((mu + 1) / (mu + 5)) * 0.5;
                prod = Math.pow(1 / (mu + 5), 2);
                for (j = 1; j <= mu + 1; ++j) prod *= errx / j;
                this.errfac[mu] = prod;
              }
            }
            this.err = 0;
            this.errOld = 1e10;
            hoptde = this.posneg * this.hMax;
            reject = false;
            last = false;
            kc = 0;
            (function (STATE) {
              STATE[STATE["Start"] = 0] = "Start";
              STATE[STATE["BasicIntegrationStep"] = 1] = "BasicIntegrationStep";
              STATE[STATE["ConvergenceStep"] = 2] = "ConvergenceStep";
              STATE[STATE["HopeForConvergence"] = 3] = "HopeForConvergence";
              STATE[STATE["Accept"] = 4] = "Accept";
              STATE[STATE["Reject"] = 5] = "Reject";
            })(STATE || (STATE = {}));
            state = STATE.Start;
          case 23:
            if (!true) {
              _context.next = 117;
              break;
            }
            this.options.debug && console.log("#".concat(this.nStep, " ").concat(STATE[state], " [").concat(xOld, ",").concat(x, "] h=").concat(h, " k=").concat(k));
            _context.t0 = state;
            _context.next = _context.t0 === STATE.Start ? 28 : _context.t0 === STATE.BasicIntegrationStep ? 57 : _context.t0 === STATE.ConvergenceStep ? 73 : _context.t0 === STATE.HopeForConvergence ? 84 : _context.t0 === STATE.Accept ? 90 : _context.t0 === STATE.Reject ? 109 : 115;
            break;
          case 28:
            if (!(xEnd !== undefined)) {
              _context.next = 35;
              break;
            }
            if (!(0.1 * Math.abs(xEnd - x) <= Math.abs(x) * this.options.uRound)) {
              _context.next = 31;
              break;
            }
            return _context.abrupt("break", 117);
          case 31:
            h = this.posneg * Math.min(Math.abs(h), Math.abs(xEnd - x), this.hMax, Math.abs(hoptde));
            if ((x + 1.01 * h - xEnd) * this.posneg > 0) {
              h = xEnd - x;
              last = true;
            }
            _context.next = 36;
            break;
          case 35:
            h = this.posneg * Math.min(Math.abs(h), this.hMax, Math.abs(hoptde));
          case 36:
            if (this.nStep === 0 || !this.options.denseOutput) {
              this.copy(dz, this.f(x, y));
              ++this.nEval;
            }
            // The first and last step
            if (!(this.nStep === 0 || last)) {
              _context.next = 55;
              break;
            }
            this.iPt = 0;
            ++this.nStep;
            _j2 = 1;
          case 41:
            if (!(_j2 <= k)) {
              _context.next = 53;
              break;
            }
            kc = _j2;
            if (this.midex(_j2 - 1, h, x, y, dz)) {
              _context.next = 47;
              break;
            }
            h *= this.options.stepSizeReductionFactor;
            reject = true;
            return _context.abrupt("continue", 23);
          case 47:
            if (!(_j2 > 1 && this.err <= 1)) {
              _context.next = 50;
              break;
            }
            state = STATE.Accept;
            return _context.abrupt("continue", 23);
          case 50:
            ++_j2;
            _context.next = 41;
            break;
          case 53:
            state = STATE.HopeForConvergence;
            return _context.abrupt("continue", 23);
          case 55:
            state = STATE.BasicIntegrationStep;
            return _context.abrupt("continue", 23);
          case 57:
            // basic integration step
            this.iPt = 0;
            if (!(++this.nStep >= this.options.maxSteps)) {
              _context.next = 60;
              break;
            }
            throw new Error('maximum allowed steps exceeded: ' + this.nStep);
          case 60:
            kc = k - 1;
            _j3 = 0;
          case 62:
            if (!(_j3 < kc)) {
              _context.next = 71;
              break;
            }
            if (this.midex(_j3, h, x, y, dz)) {
              _context.next = 68;
              break;
            }
            h *= this.options.stepSizeReductionFactor;
            reject = true;
            state = STATE.Start;
            return _context.abrupt("continue", 23);
          case 68:
            ++_j3;
            _context.next = 62;
            break;
          case 71:
            // convergence monitor
            if (k === 2 || reject) {
              state = STATE.ConvergenceStep;
            } else {
              if (this.err <= 1) {
                state = STATE.Accept;
              } else if (this.err > Math.pow(this.nj[k] * this.nj[k - 1] / 4, 2)) {
                state = STATE.Reject;
              } else state = STATE.ConvergenceStep;
            }
            return _context.abrupt("continue", 23);
          case 73:
            if (this.midex(k - 1, h, x, y, dz)) {
              _context.next = 78;
              break;
            }
            h *= this.options.stepSizeReductionFactor;
            reject = true;
            state = STATE.Start;
            return _context.abrupt("continue", 23);
          case 78:
            kc = k;
            if (!(this.err <= 1)) {
              _context.next = 82;
              break;
            }
            state = STATE.Accept;
            return _context.abrupt("continue", 23);
          case 82:
            state = STATE.HopeForConvergence;
            return _context.abrupt("continue", 23);
          case 84:
            if (!(this.err > Math.pow(this.nj[k] / 2, 2))) {
              _context.next = 87;
              break;
            }
            state = STATE.Reject;
            return _context.abrupt("continue", 23);
          case 87:
            kc = k + 1;
            if (!this.midex(kc - 1, h, x, y, dz)) {
              h *= this.options.stepSizeReductionFactor;
              reject = true;
              state = STATE.Start;
            } else if (this.err > 1) state = STATE.Reject;else state = STATE.Accept;
            return _context.abrupt("continue", 23);
          case 90:
            result = this.acceptStep(kc, h, x, y, dz);
            state = STATE.Start;
            hoptde = (_a = result.hoptde) !== null && _a !== void 0 ? _a : hoptde;
            if (result.accept) {
              _context.next = 97;
              break;
            }
            h = hoptde;
            reject = true;
            return _context.abrupt("continue", 23);
          case 97:
            // Move forward
            xOld = x;
            x += h;
            _context.next = 101;
            return {
              x0: xOld,
              x1: x,
              y: y,
              f: (_b = result.densef) !== null && _b !== void 0 ? _b : this.noDenseOutput
            };
          case 101:
            proceed = _context.sent;
            if (!(proceed === false)) {
              _context.next = 104;
              break;
            }
            return _context.abrupt("return");
          case 104:
            _this$newOrderAndStep = this.newOrderAndStepSize(reject, kc, k, h);
            k = _this$newOrderAndStep.k;
            h = _this$newOrderAndStep.h;
            reject = false;
            return _context.abrupt("continue", 23);
          case 109:
            k = Math.min(k, kc, this.options.maxExtrapolationColumns - 1);
            if (k > 2 && this.w[k - 1] < this.w[k] * this.options.stepSizeFac3) k -= 1;
            ++this.nReject;
            h = this.posneg * this.hh[k - 1];
            reject = true;
            state = STATE.BasicIntegrationStep;
          case 115:
            _context.next = 23;
            break;
          case 117:
          case "end":
            return _context.stop();
        }
      }, solutionSegments, this);
    })
  }], [{
    key: "stepSizeSequence",
    value: function stepSizeSequence(nSeq, n) {
      var a = Array(n);
      switch (nSeq) {
        case 1:
          for (var i = 0; i < n; ++i) a[i] = 2 * (i + 1);
          break;
        case 2:
          a[0] = 2;
          for (var _i28 = 1; _i28 < n; ++_i28) a[_i28] = 4 * _i28;
          break;
        case 3:
          a[0] = 2;
          a[1] = 4;
          a[2] = 6;
          for (var _i29 = 3; _i29 < n; ++_i29) a[_i29] = 2 * a[_i29 - 2];
          break;
        case 4:
          for (var _i30 = 0; _i30 < n; ++_i30) a[_i30] = 4 * _i30 + 2;
          break;
        case 5:
          for (var _i31 = 0; _i31 < n; ++_i31) a[_i31] = 4 * (_i31 + 1);
          break;
        default:
          throw new Error('invalid stepSizeSequence selected');
      }
      return a;
    }
  }]);
  return Solver;
}();
exports.Solver = Solver;
Solver.defaults = {
  uRound: 2.3e-16,
  maxSteps: 10000,
  initialStepSize: 1e-4,
  maxStepSize: 0,
  maxExtrapolationColumns: 9,
  stepSizeSequence: 0,
  stabilityCheckCount: 1,
  stabilityCheckTableLines: 2,
  denseOutput: true,
  denseOutputErrorEstimator: true,
  denseComponents: [],
  interpolationFormulaDegree: 4,
  stepSizeReductionFactor: 0.5,
  stepSizeFac1: 0.02,
  stepSizeFac2: 4.0,
  stepSizeFac3: 0.8,
  stepSizeFac4: 0.9,
  stepSafetyFactor1: 0.65,
  stepSafetyFactor2: 0.94,
  relativeTolerance: 1e-5,
  absoluteTolerance: 1e-5,
  debug: false
};

},{}]},{},[2,1])(2)
});
