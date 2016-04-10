"use strict";
var odex_1 = require('./node_modules/odex/src/odex');
var graph_1 = require('./graph');
var Airy = (function () {
    function Airy(elt1, elt2) {
        var _this = this;
        this.initialData = [0.2782174909, 0.2723742043];
        this.draw = function () {
            var apts = [];
            var bpts = [];
            _this.solver.solve(function (x, y) { return [y[1], x * y[0]]; }, -15, _this.id, 5, _this.solver.grid(0.05, function (x, y) {
                apts.push([x, y[0]]);
                bpts.push([y[0], y[1]]);
            }));
            _this.g1.draw(apts, 'Ai');
            _this.g2.draw(bpts);
        };
        this.tweak = function (e) {
            var x = e.offsetX - 500;
            var p = x / 2000;
            _this.id[0] = _this.initialData[0] + p;
            var y = e.offsetY - 200;
            var q = y / 2000;
            _this.id[1] = _this.initialData[1] + q;
            _this.draw();
        };
        this.id = this.initialData.slice();
        this.solver = new odex_1.Solver(2);
        this.solver.denseOutput = true;
        this.g1 = new graph_1.Graph('#' + elt1, 500, 350);
        this.g2 = new graph_1.Graph('#' + elt2, 500, 350);
        document.getElementById(elt1).onmousemove = this.tweak;
        document.getElementById(elt2).onmousemove = this.tweak;
        this.g1.axes([-15, 5], [-0.5, 0.75]);
        this.g2.axes([-0.5, 0.5], [-1.5, 1.5]);
    }
    return Airy;
}());
exports.Airy = Airy;
var Lorenz = (function () {
    function Lorenz(elt) {
        var _this = this;
        this.initialData = [1, 1, 1];
        this.tweak = function (e) {
            var xt = (e.offsetX - 500) / 2000;
            var yt = (e.offsetY - 500) / 2000;
            _this.id[0] = _this.initialData[0] + xt;
            _this.id[1] = _this.initialData[1] + yt;
            _this.draw();
        };
        this.draw = function () {
            var xpts = [];
            _this.solver.solve(Lorenz.L(10, 28, 8 / 3), 0, _this.id, 20, _this.solver.grid(0.005, function (x, y) {
                xpts.push([y[1], y[2]]);
            }));
            _this.g1.draw(xpts, 'Lo');
        };
        this.g1 = new graph_1.Graph('#' + elt, 500, 500);
        this.solver = new odex_1.Solver(3);
        this.solver.denseOutput = true;
        this.id = this.initialData.slice();
        document.getElementById(elt).onmousemove = this.tweak;
        this.g1.axes([-30, 30], [0, 50]);
        this.id = this.initialData.slice();
    }
    Lorenz.L = function (sigma, rho, beta) { return function (x, y) { return [
        sigma * (y[1] - y[0]),
        y[0] * (rho - y[2]) - y[1],
        y[0] * y[1] - beta * y[2]
    ]; }; };
    return Lorenz;
}());
exports.Lorenz = Lorenz;
var PredatorPrey = (function () {
    function PredatorPrey(elt1, elt2) {
        var _this = this;
        this.sz = 400;
        this.initialData = [1, 1];
        this.solver = new odex_1.Solver(2);
        this.tweak = function (e) {
            var x = e.offsetX;
            var y = e.offsetY;
            _this.initialData[0] = 3 * x / _this.sz;
            _this.initialData[1] = 2 - 2 * y / _this.sz;
            _this.draw();
        };
        this.draw = function () {
            var xpts = [];
            var ypts = [];
            var tpts = [];
            _this.solver.solve(PredatorPrey.LV(2 / 3, 4 / 3, 1, 1), 0, _this.initialData, 25, _this.solver.grid(0.01, function (x, y) {
                xpts.push([x, y[0]]);
                ypts.push([x, y[1]]);
                tpts.push([y[0], y[1]]);
            }));
            _this.g.draw(xpts, 'Pred');
            _this.g.draw(ypts, 'Prey');
            _this.phase.draw(tpts, 'Phase');
        };
        this.solver.denseOutput = true;
        this.g = new graph_1.Graph('#' + elt1, this.sz, this.sz);
        this.phase = new graph_1.Graph('#' + elt2, this.sz, this.sz);
        this.g.axes([0, 25], [0, 4]);
        this.phase.axes([0, 3], [0, 2]);
        document.querySelector('#' + elt1 + ' svg').onmousemove = this.tweak;
        document.querySelector('#' + elt2 + ' svg').onmousemove = this.tweak;
    }
    PredatorPrey.LV = function (a, b, c, d) { return function (x, y) { return [
        a * y[0] - b * y[0] * y[1],
        c * y[0] * y[1] - d * y[1]
    ]; }; };
    return PredatorPrey;
}());
exports.PredatorPrey = PredatorPrey;
