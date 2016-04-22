"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var odex_1 = require('./node_modules/odex/src/odex');
var graph_1 = require('./graph');
var DifferentialEquationView = (function () {
    function DifferentialEquationView(dim, elements, width, height) {
        var _this = this;
        this.g = [];
        this.tweak = function (e) { return console.log('tweak unimplemented'); };
        elements.map(function (e) {
            _this.solver = new odex_1.Solver(dim);
            _this.solver.denseOutput = true;
            _this.g.push(new graph_1.Graph('#' + e, width, height));
            document.querySelector('#' + e + ' svg').onmousemove = function (e) { return _this.tweak(e); };
        });
    }
    return DifferentialEquationView;
}());
var Airy = (function (_super) {
    __extends(Airy, _super);
    function Airy(elt0, elt1) {
        var _this = this;
        _super.call(this, 2, [elt0, elt1], 500, 350);
        this.initialData = [0.2782174909, 0.2723742043];
        this.eq = function (x, y) { return [y[1], x * y[0]]; };
        this.tweak = function (e) {
            var x = e.offsetX - 500;
            var p = x / 2000;
            var y = e.offsetY - 200;
            var q = y / 2000;
            _this.draw([_this.initialData[0] + p, _this.initialData[1] + q]);
        };
        this.g[0].axes([-15, 5], [-0.5, 0.75]);
        this.g[1].axes([-0.5, 0.5], [-1.5, 1.5]);
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
        var _this = this;
        _super.call(this, 3, [elt], 500, 500);
        this.initialData = [1, 1, 1];
        this.eq = Lorenz.L(10, 28, 8 / 3);
        this.tweak = function (e) {
            var xt = (e.offsetX - 500) / 2000;
            var yt = (e.offsetY - 500) / 2000;
            _this.draw([_this.initialData[0] + xt, _this.initialData[1] + yt]);
        };
        this.g[0].axes([-30, 30], [0, 50]);
    }
    Lorenz.prototype.draw = function (initialData) {
        if (initialData === void 0) { initialData = this.initialData; }
        var xpts = [];
        this.solver.solve(this.eq, 0, initialData, 20, this.solver.grid(0.005, function (x, y) {
            xpts.push([y[1], y[2]]);
        }));
        this.g[0].draw(xpts, 'Lo');
    };
    Lorenz.L = function (sigma, rho, beta) { return function (x, y) { return [
        sigma * (y[1] - y[0]),
        y[0] * (rho - y[2]) - y[1],
        y[0] * y[1] - beta * y[2]
    ]; }; };
    return Lorenz;
}(DifferentialEquationView));
exports.Lorenz = Lorenz;
var PredatorPrey = (function (_super) {
    __extends(PredatorPrey, _super);
    function PredatorPrey(elt0, elt1) {
        var _this = this;
        _super.call(this, 2, [elt0, elt1], PredatorPrey.sz, PredatorPrey.sz);
        this.initialData = [1, 1];
        this.eq = PredatorPrey.LV(2 / 3, 4 / 3, 1, 1);
        this.tweak = function (e) {
            var x = e.offsetX;
            var y = e.offsetY;
            _this.draw([3 * x / PredatorPrey.sz, 2 - 2 * y / PredatorPrey.sz]);
        };
        this.g[0].axes([0, 25], [0, 4]);
        this.g[1].axes([0, 3], [0, 2]);
    }
    PredatorPrey.prototype.draw = function (initialData) {
        if (initialData === void 0) { initialData = this.initialData; }
        var xpts = [];
        var ypts = [];
        var tpts = [];
        this.solver.solve(this.eq, 0, initialData, 25, this.solver.grid(0.01, function (x, y) {
            xpts.push([x, y[0]]);
            ypts.push([x, y[1]]);
            tpts.push([y[0], y[1]]);
        }));
        this.g[0].draw(xpts, 'Pred');
        this.g[0].draw(ypts, 'Prey');
        this.g[1].draw(tpts, 'Phase');
    };
    PredatorPrey.sz = 400;
    PredatorPrey.LV = function (a, b, c, d) { return function (x, y) { return [
        a * y[0] - b * y[0] * y[1],
        c * y[0] * y[1] - d * y[1]
    ]; }; };
    return PredatorPrey;
}(DifferentialEquationView));
exports.PredatorPrey = PredatorPrey;
var VanDerPol = (function (_super) {
    __extends(VanDerPol, _super);
    function VanDerPol(elt1, elt2) {
        var _this = this;
        _super.call(this, 2, [elt1, elt2], VanDerPol.sz, VanDerPol.sz);
        this.initialData = [1, 1];
        this.end = 25;
        this.eq = VanDerPol.V(3);
        this.tweak = function (e) {
            var x = e.offsetX;
            var y = e.offsetY;
            _this.draw([_this.g[1].x.invert(x), _this.g[1].y.invert(y)]);
        };
        this.g[0].axes([0, this.end], [-3, 3]);
        this.g[1].axes([-3, 3], [-3, 3]);
    }
    VanDerPol.prototype.draw = function (initialData) {
        if (initialData === void 0) { initialData = this.initialData; }
        var xpts = [];
        var ypts = [];
        var tpts = [];
        this.solver.solve(this.eq, 0, initialData, this.end, this.solver.grid(0.1, function (x, y) {
            xpts.push([x, y[0]]);
            ypts.push([x, y[1]]);
            tpts.push([y[0], y[1]]);
        }));
        this.g[0].draw(xpts, 'Pred');
        this.g[0].draw(ypts, 'Prey');
        this.g[1].draw(tpts);
    };
    VanDerPol.sz = 400;
    VanDerPol.V = function (e) { return function (x, y) { return [
        y[1],
        ((1 - Math.pow(y[0], 2)) * y[1] - y[0]) / e
    ]; }; };
    return VanDerPol;
}(DifferentialEquationView));
exports.VanDerPol = VanDerPol;