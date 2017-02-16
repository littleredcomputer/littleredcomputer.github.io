"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var graph_1 = require("./graph");
var odex_1 = require("odex/src/odex");
var DifferentialEquationView = (function () {
    function DifferentialEquationView(dim, elements, width, height) {
        var _this = this;
        this.g = [];
        this.dt = 0.1;
        this.getParameters = function () { return []; };
        this.tweak = function (e) { return console.log('tweak unimplemented'); };
        elements.map(function (e) {
            _this.solver = new odex_1.Solver(dim);
            _this.solver.denseOutput = true;
            _this.g.push(new graph_1.Graph('#' + e, width, height));
            document.querySelector('#' + e + ' svg').onmousemove = function (e) { return _this.tweak(e); };
        });
    }
    DifferentialEquationView.prototype.phaseDraw = function (initialData, start, end, transform) {
        var xpts = [];
        var ypts = [];
        var tpts = [];
        this.solver.solve(this.eq, start, initialData, end, this.solver.grid(this.dt, function (x, y) {
            var ys = transform ? transform(y) : y;
            xpts.push([x, ys[0]]);
            ypts.push([x, ys[1]]);
            tpts.push([ys[0], ys[1]]);
        }));
        this.g[0].draw(xpts, 'Predator');
        this.g[0].draw(ypts, 'Prey');
        this.g[1].draw(tpts, 'Phase');
    };
    return DifferentialEquationView;
}());
var Airy = (function (_super) {
    __extends(Airy, _super);
    function Airy(elt0, elt1) {
        var _this = _super.call(this, 2, [elt0, elt1], 500, 350) || this;
        _this.initialData = [0.2782174909, 0.2723742043];
        _this.tweak = function (e) {
            var x = e.offsetX - 500;
            var p = x / 2000;
            var y = e.offsetY - 200;
            var q = y / 2000;
            _this.draw([_this.initialData[0] + p, _this.initialData[1] + q]);
        };
        _this.eq = function (x, y) { return [y[1], x * y[0]]; };
        _this.g[0].axes([-15, 5], [-0.5, 0.75]);
        _this.g[1].axes([-0.5, 0.5], [-1.5, 1.5]);
        return _this;
    }
    Airy.prototype.draw = function (initialData) {
        if (initialData === void 0) { initialData = this.initialData; }
        var apts = [];
        var bpts = [];
        this.solver.solve(this.eq, -15, initialData, 5, this.solver.grid(0.05, function (x, y) {
            apts.push([x, y[0]]);
            bpts.push([y[0], y[1]]);
        }));
        this.g[0].draw(apts, 'Ai');
        this.g[1].draw(bpts);
    };
    return Airy;
}(DifferentialEquationView));
exports.Airy = Airy;
var Lorenz = (function (_super) {
    __extends(Lorenz, _super);
    function Lorenz(elt) {
        var _this = _super.call(this, 3, [elt], 500, 500) || this;
        _this.initialData = [1, 1, 1];
        _this.tweak = function (e) {
            var xt = (e.offsetX - 500) / 2000;
            var yt = (e.offsetY - 500) / 2000;
            _this.draw([_this.initialData[0] + xt, _this.initialData[1] + yt, 1]);
        };
        _this.eq = Lorenz.L(10, 28, 8 / 3);
        _this.g[0].axes([-30, 30], [0, 50]);
        return _this;
    }
    Lorenz.prototype.draw = function (initialData) {
        if (initialData === void 0) { initialData = this.initialData; }
        var xpts = [];
        this.solver.solve(this.eq, 0, initialData, 20, this.solver.grid(0.005, function (x, y) {
            xpts.push([y[1], y[2]]);
        }));
        this.g[0].draw(xpts, 'Lo');
    };
    return Lorenz;
}(DifferentialEquationView));
Lorenz.L = function (sigma, rho, beta) { return function (x, y) { return [
    sigma * (y[1] - y[0]),
    y[0] * (rho - y[2]) - y[1],
    y[0] * y[1] - beta * y[2]
]; }; };
exports.Lorenz = Lorenz;
var PredatorPrey = (function (_super) {
    __extends(PredatorPrey, _super);
    function PredatorPrey(elt0, elt1) {
        var _this = _super.call(this, 2, [elt0, elt1], PredatorPrey.sz, PredatorPrey.sz) || this;
        _this.end = 25;
        _this.initialData = [1, 1];
        _this.tweak = function (e) {
            var x = e.offsetX;
            var y = e.offsetY;
            _this.draw([3 * x / PredatorPrey.sz, 2 - 2 * y / PredatorPrey.sz]);
        };
        _this.eq = PredatorPrey.LV(2 / 3, 4 / 3, 1, 1);
        _this.g[0].axes([0, _this.end], [0, 4]);
        _this.g[1].axes([0, 3], [0, 2]);
        return _this;
    }
    PredatorPrey.prototype.draw = function (initialData) {
        if (initialData === void 0) { initialData = this.initialData; }
        this.phaseDraw(initialData, 0, this.end);
    };
    return PredatorPrey;
}(DifferentialEquationView));
PredatorPrey.sz = 400;
PredatorPrey.LV = function (a, b, c, d) { return function (x, y) { return [
    a * y[0] - b * y[0] * y[1],
    c * y[0] * y[1] - d * y[1]
]; }; };
exports.PredatorPrey = PredatorPrey;
var VanDerPol = (function (_super) {
    __extends(VanDerPol, _super);
    function VanDerPol(elt1, elt2) {
        var _this = _super.call(this, 2, [elt1, elt2], VanDerPol.sz, VanDerPol.sz) || this;
        _this.initialData = [1, 1];
        _this.end = 25;
        _this.tweak = function (e) {
            var x = e.offsetX;
            var y = e.offsetY;
            _this.draw([_this.g[1].x.invert(x), _this.g[1].y.invert(y)]);
        };
        _this.eq = VanDerPol.V(3);
        _this.g[0].axes([0, _this.end], [-3, 3]);
        _this.g[1].axes([-3, 3], [-3, 3]);
        return _this;
    }
    VanDerPol.prototype.draw = function (initialData) {
        if (initialData === void 0) { initialData = this.initialData; }
        this.phaseDraw(initialData, 0, this.end);
    };
    return VanDerPol;
}(DifferentialEquationView));
VanDerPol.sz = 400;
VanDerPol.V = function (e) { return function (x, y) { return [
    y[1],
    ((1 - Math.pow(y[0], 2)) * y[1] - y[0]) / e
]; }; };
exports.VanDerPol = VanDerPol;
var DrivenPendulum = (function (_super) {
    __extends(DrivenPendulum, _super);
    function DrivenPendulum(elt1, elt2) {
        var _this = _super.call(this, 3, [elt1, elt2], 2 * DrivenPendulum.sz, DrivenPendulum.sz) || this;
        _this.end = 30;
        _this.dt = 0.04;
        _this.initialData = [0, 1, 0];
        _this.tweak = function (e) {
            var x = e.offsetX;
            var y = e.offsetY;
            _this.draw([0, _this.g[1].x.invert(x), _this.g[1].y.invert(y)]);
        };
        _this.eq = DrivenPendulum.F(1, 0.01, 2 * Math.sqrt(9.8), 0, 9.8);
        _this.g[0].axes([0, _this.end], [-Math.PI, Math.PI]);
        _this.g[0].wrap_pi = true;
        _this.g[0].points = true;
        _this.g[1].axes([-10, 10], [-10, 10]);
        return _this;
    }
    DrivenPendulum.prototype.draw = function (initialData) {
        if (initialData === void 0) { initialData = this.initialData; }
        this.phaseDraw(initialData, 0, this.end, function (a) { return a.slice(1); });
    };
    return DrivenPendulum;
}(DifferentialEquationView));
DrivenPendulum.sz = 400;
DrivenPendulum.F = function (l, a, omega, phi, g) { return function (x, _a) {
    var t = _a[0], theta = _a[1], thetadot = _a[2];
    var _1 = Math.sin(theta);
    return [1, thetadot, (_1 * Math.cos(omega * t + phi) * a * Math.pow(omega, 2) - _1 * g) / l];
}; };
exports.DrivenPendulum = DrivenPendulum;
