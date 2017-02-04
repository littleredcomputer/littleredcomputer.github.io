(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.s = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
var odex_1 = require("../../odex/src/odex");
var twoPi = Math.PI * 2;
var StandardMap = (function () {
    function StandardMap(K) {
        this.evolve = function (initialData, n, callback) {
            var theta = initialData[0], I = initialData[1];
            for (var i = 0; i < n; ++i) {
                callback(theta, I);
                var nI = I + (this.K * Math.sin(theta));
                theta = this.PV(theta + nI);
                I = this.PV(nI);
            }
        };
        this.K = K;
        this.PV = StandardMap.principal_value(twoPi);
    }
    StandardMap.principal_value = function (cutHigh) {
        var cutLow = cutHigh - twoPi;
        return function (x) {
            if (cutLow <= x && x < cutHigh) {
                return x;
            }
            var y = x - twoPi * Math.floor(x / twoPi);
            return y < cutHigh ? y : y - twoPi;
        };
    };
    return StandardMap;
}());
StandardMap.twoPi = 2 * Math.PI;
exports.StandardMap = StandardMap;
var DrivenPendulumMap = (function () {
    function DrivenPendulumMap() {
        this.S = new odex_1.Solver(3);
        this.S.denseOutput = true;
        var l = 1;
        var g = 9.8;
        var w0 = Math.sqrt(g / l);
        var w = 2 * w0;
        this.T = 2 * Math.PI / w;
        var a = 0.1;
        this.d = DrivenPendulumMap.F(1, l, a, w, g);
        this.PV = StandardMap.principal_value(Math.PI);
    }
    DrivenPendulumMap.prototype.evolve = function (initialData, n, callback) {
        var _this = this;
        this.S.solve(this.d, 0, [0].concat(initialData), 1000 * this.T, this.S.grid(this.T, function (x, ys) {
            callback(_this.PV(ys[1]), ys[2]);
        }));
    };
    return DrivenPendulumMap;
}());
DrivenPendulumMap.F = function (m, l, a, omega, g) { return function (x, _a) {
    var t = _a[0], theta = _a[1], p_theta = _a[2];
    var _2 = Math.pow(l, 2);
    var _3 = omega * t;
    var _4 = Math.sin(theta);
    var _5 = Math.cos(theta);
    return [1,
        (Math.sin(_3) * _4 * a * l * m * omega + p_theta) / _2 * m,
        (-Math.pow(Math.sin(_3), 2) * _4 * _5 * Math.pow(a, 2) * l * m * Math.pow(omega, 2) - Math.sin(_3) * _5 * a * omega * p_theta - _4 * g * _2 * m) / l];
}; };
exports.DrivenPendulumMap = DrivenPendulumMap;
var ExploreMap = (function () {
    function ExploreMap(canvas, M, xRange, yRange) {
        var _this = this;
        this.i = 0;
        this.pt = function (x, y) {
            _this.context.beginPath();
            _this.context.arc(x, y, 0.01, 0, 2 * Math.PI);
            _this.context.fill();
            _this.context.closePath();
            ++_this.i;
        };
        this.canvas = document.getElementById(canvas);
        this.M = M;
        this.context = this.canvas.getContext('2d');
        var _a = [xRange[1] - xRange[0], yRange[1] - yRange[0]], w = _a[0], h = _a[1];
        this.canvas.onmousedown = function (e) {
            var _a = [e.offsetX / _this.context.canvas.width * w + xRange[0],
                yRange[1] - e.offsetY / _this.context.canvas.height * h], cx = _a[0], cy = _a[1];
            _this.Explore(cx, cy);
        };
        this.context.scale(this.context.canvas.width / w, -this.context.canvas.height / h);
        this.context.translate(-xRange[0], -yRange[1]);
        this.context.fillStyle = 'rgba(23,64,170,0.3)';
    }
    ExploreMap.prototype.Explore = function (x, y) {
        this.M.evolve([x, y], 1000, this.pt);
    };
    return ExploreMap;
}());
exports.ExploreMap = ExploreMap;

},{"../../odex/src/odex":2}],2:[function(require,module,exports){
"use strict";
var Outcome;
(function (Outcome) {
    Outcome[Outcome["Converged"] = 0] = "Converged";
    Outcome[Outcome["MaxStepsExceeded"] = 1] = "MaxStepsExceeded";
    Outcome[Outcome["EarlyReturn"] = 2] = "EarlyReturn";
})(Outcome = exports.Outcome || (exports.Outcome = {}));
var Solver = (function () {
    function Solver(n) {
        this.n = n;
        this.uRound = 2.3e-16;
        this.maxSteps = 10000;
        this.initialStepSize = 1e-4;
        this.maxStepSize = 0;
        this.maxExtrapolationColumns = 9;
        this.stepSizeSequence = 0;
        this.stabilityCheckCount = 1;
        this.stabilityCheckTableLines = 2;
        this.denseOutput = false;
        this.denseOutputErrorEstimator = true;
        this.denseComponents = undefined;
        this.interpolationFormulaDegree = 4;
        this.stepSizeReductionFactor = 0.5;
        this.stepSizeFac1 = 0.02;
        this.stepSizeFac2 = 4.0;
        this.stepSizeFac3 = 0.8;
        this.stepSizeFac4 = 0.9;
        this.stepSafetyFactor1 = 0.65;
        this.stepSafetyFactor2 = 0.94;
        this.relativeTolerance = 1e-5;
        this.absoluteTolerance = 1e-5;
        this.debug = false;
    }
    Solver.prototype.grid = function (dt, out) {
        var components = this.denseComponents;
        if (!components) {
            components = [];
            for (var i = 0; i < this.n; ++i)
                components.push(i);
        }
        var t;
        return function (n, xOld, x, y, interpolate) {
            if (n === 1) {
                out(x, y);
                t = x + dt;
                return;
            }
            while (t <= x) {
                var yf = [];
                for (var _i = 0, components_1 = components; _i < components_1.length; _i++) {
                    var i = components_1[_i];
                    yf.push(interpolate(i, t));
                }
                out(t, yf);
                t += dt;
            }
        };
    };
    Solver.dim2 = function (r, c) {
        var a = new Array(r + 1);
        for (var i = 1; i <= r; ++i)
            a[i] = Solver.dim(c);
        return a;
    };
    Solver.stepSizeSequence = function (nSeq, n) {
        var a = new Array(n + 1);
        a[0] = 0;
        switch (nSeq) {
            case 1:
                for (var i = 1; i <= n; ++i)
                    a[i] = 2 * i;
                break;
            case 2:
                a[1] = 2;
                for (var i = 2; i <= n; ++i)
                    a[i] = 4 * i - 4;
                break;
            case 3:
                a[1] = 2;
                a[2] = 4;
                a[3] = 6;
                for (var i = 4; i <= n; ++i)
                    a[i] = 2 * a[i - 2];
                break;
            case 4:
                for (var i = 1; i <= n; ++i)
                    a[i] = 4 * i - 2;
                break;
            case 5:
                for (var i = 1; i <= n; ++i)
                    a[i] = 4 * i;
                break;
            default:
                throw new Error('invalid stepSizeSequence selected');
        }
        return a;
    };
    Solver.prototype.solve = function (f, x, y0, xEnd, solOut) {
        var _this = this;
        var y = [0].concat(y0);
        var dz = Solver.dim(this.n);
        var yh1 = Solver.dim(this.n);
        var yh2 = Solver.dim(this.n);
        if (this.maxSteps <= 0)
            throw new Error('maxSteps must be positive');
        var km = this.maxExtrapolationColumns;
        if (km <= 2)
            throw new Error('maxExtrapolationColumns must be > 2');
        var nSeq = this.stepSizeSequence || (this.denseOutput ? 4 : 1);
        if (nSeq <= 3 && this.denseOutput)
            throw new Error('stepSizeSequence incompatible with denseOutput');
        if (this.denseOutput && !solOut)
            throw new Error('denseOutput requires a solution observer function');
        if (this.interpolationFormulaDegree <= 0 || this.interpolationFormulaDegree >= 7)
            throw new Error('bad interpolationFormulaDegree');
        var icom = [0];
        var nrdens = 0;
        if (this.denseOutput) {
            if (this.denseComponents) {
                for (var _i = 0, _a = this.denseComponents; _i < _a.length; _i++) {
                    var c = _a[_i];
                    if (c < 0 || c > this.n)
                        throw new Error('bad dense component: ' + c);
                    icom.push(c + 1);
                    ++nrdens;
                }
            }
            else {
                for (var i = 1; i <= this.n; ++i) {
                    icom.push(i);
                }
                nrdens = this.n;
            }
        }
        if (this.uRound <= 1e-35 || this.uRound > 1)
            throw new Error('suspicious value of uRound');
        var hMax = Math.abs(this.maxStepSize || xEnd - x);
        var lfSafe = 2 * km * km + km;
        function expandToArray(x, n) {
            var tolArray = [0];
            if (Array.isArray(x)) {
                return tolArray.concat(x);
            }
            else {
                for (var i = 0; i < n; ++i)
                    tolArray.push(x);
                return tolArray;
            }
        }
        var aTol = expandToArray(this.absoluteTolerance, this.n);
        var rTol = expandToArray(this.relativeTolerance, this.n);
        var _b = [0, 0, 0, 0], nEval = _b[0], nStep = _b[1], nAccept = _b[2], nReject = _b[3];
        var nrd = Math.max(1, nrdens);
        var ncom = Math.max(1, (2 * km + 5) * nrdens);
        var dens = Solver.dim(ncom);
        var fSafe = Solver.dim2(lfSafe, nrd);
        var F = function (x, y, yp) {
            var ret = f(x, y.slice(1));
            for (var i = 0; i < ret.length; ++i)
                yp[i + 1] = ret[i];
        };
        var odxcor = function () {
            var xOldd;
            var hhh;
            var kmit;
            var acceptStep = function (n) {
                xOld = x;
                x += h;
                if (_this.denseOutput) {
                    kmit = 2 * kc - _this.interpolationFormulaDegree + 1;
                    for (var i = 1; i <= nrd; ++i)
                        dens[i] = y[icom[i]];
                    xOldd = xOld;
                    hhh = h;
                    for (var i = 1; i <= nrd; ++i)
                        dens[nrd + i] = h * dz[icom[i]];
                    var kln = 2 * nrd;
                    for (var i = 1; i <= nrd; ++i)
                        dens[kln + i] = t[1][icom[i]];
                    for (var j = 2; j <= kc; ++j) {
                        var dblenj = nj[j];
                        for (var l = j; l >= 2; --l) {
                            var factor = Math.pow((dblenj / nj[l - 1]), 2) - 1;
                            for (var i = 1; i <= nrd; ++i) {
                                ySafe[l - 1][i] = ySafe[l][i] + (ySafe[l][i] - ySafe[l - 1][i]) / factor;
                            }
                        }
                    }
                    var krn = 4 * nrd;
                    for (var i = 1; i <= nrd; ++i)
                        dens[krn + i] = ySafe[1][i];
                    for (var i = 1; i <= n; ++i)
                        yh1[i] = t[1][i];
                    F(x, yh1, yh2);
                    krn = 3 * nrd;
                    for (var i = 1; i <= nrd; ++i)
                        dens[krn + i] = yh2[icom[i]] * h;
                    for (var kmi = 1; kmi <= kmit; ++kmi) {
                        var kbeg = (kmi + 1) / 2 | 0;
                        for (var kk = kbeg; kk <= kc; ++kk) {
                            var facnj = Math.pow((nj[kk] / 2), (kmi - 1));
                            iPt = iPoint[kk + 1] - 2 * kk + kmi;
                            for (var i = 1; i <= nrd; ++i) {
                                ySafe[kk][i] = fSafe[iPt][i] * facnj;
                            }
                        }
                        for (var j = kbeg + 1; j <= kc; ++j) {
                            var dblenj = nj[j];
                            for (var l = j; l >= kbeg + 1; --l) {
                                var factor = Math.pow((dblenj / nj[l - 1]), 2) - 1;
                                for (var i = 1; i <= nrd; ++i) {
                                    ySafe[l - 1][i] = ySafe[l][i] + (ySafe[l][i] - ySafe[l - 1][i]) / factor;
                                }
                            }
                        }
                        krn = (kmi + 4) * nrd;
                        for (var i = 1; i <= nrd; ++i)
                            dens[krn + i] = ySafe[kbeg][i] * h;
                        if (kmi === kmit)
                            continue;
                        for (var kk = (kmi + 2) / 2 | 0; kk <= kc; ++kk) {
                            var lbeg = iPoint[kk + 1];
                            var lend = iPoint[kk] + kmi + 1;
                            if (kmi === 1 && nSeq === 4)
                                lend += 2;
                            var l = void 0;
                            for (l = lbeg; l >= lend; l -= 2) {
                                for (var i = 1; i <= nrd; ++i) {
                                    fSafe[l][i] -= fSafe[l - 2][i];
                                }
                            }
                            if (kmi === 1 && nSeq === 4) {
                                l = lend - 2;
                                for (var i = 1; i <= nrd; ++i)
                                    fSafe[l][i] -= dz[icom[i]];
                            }
                        }
                        for (var kk = (kmi + 2) / 2 | 0; kk <= kc; ++kk) {
                            var lbeg = iPoint[kk + 1] - 1;
                            var lend = iPoint[kk] + kmi + 2;
                            for (var l = lbeg; l >= lend; l -= 2) {
                                for (var i = 1; i <= nrd; ++i) {
                                    fSafe[l][i] -= fSafe[l - 2][i];
                                }
                            }
                        }
                    }
                    interp(nrd, dens, kmit);
                    if (_this.denseOutputErrorEstimator && kmit >= 1) {
                        var errint = 0;
                        for (var i = 1; i <= nrd; ++i)
                            errint += Math.pow((dens[(kmit + 4) * nrd + i] / scal[icom[i]]), 2);
                        errint = Math.sqrt(errint / nrd) * errfac[kmit];
                        hoptde = h / Math.max(Math.pow(errint, (1 / (kmit + 4))), 0.01);
                        if (errint > 10) {
                            h = hoptde;
                            x = xOld;
                            ++nReject;
                            reject = true;
                            return true;
                        }
                    }
                    for (var i = 1; i <= n; ++i)
                        dz[i] = yh2[i];
                }
                for (var i = 1; i <= n; ++i)
                    y[i] = t[1][i];
                ++nAccept;
                if (solOut) {
                    if (solOut(nAccept + 1, xOld, x, y.slice(1), _this.denseOutput && contex(xOldd, hhh, kmit, dens, icom)) === false)
                        return false;
                }
                var kopt;
                if (kc === 2) {
                    kopt = Math.min(3, km - 1);
                    if (reject)
                        kopt = 2;
                }
                else {
                    if (kc <= k) {
                        kopt = kc;
                        if (w[kc - 1] < w[kc] * _this.stepSizeFac3)
                            kopt = kc - 1;
                        if (w[kc] < w[kc - 1] * _this.stepSizeFac4)
                            kopt = Math.min(kc + 1, km - 1);
                    }
                    else {
                        kopt = kc - 1;
                        if (kc > 3 && w[kc - 2] < w[kc - 1] * _this.stepSizeFac3)
                            kopt = kc - 2;
                        if (w[kc] < w[kopt] * _this.stepSizeFac4)
                            kopt = Math.min(kc, km - 1);
                    }
                }
                if (reject) {
                    k = Math.min(kopt, kc);
                    h = posneg * Math.min(Math.abs(h), Math.abs(hh[k]));
                    reject = false;
                    return true;
                }
                if (kopt <= kc) {
                    h = hh[kopt];
                }
                else {
                    if (kc < k && w[kc] < w[kc - 1] * _this.stepSizeFac4) {
                        h = hh[kc] * a[kopt + 1] / a[kc];
                    }
                    else {
                        h = hh[kc] * a[kopt] / a[kc];
                    }
                }
                k = kopt;
                h = posneg * Math.abs(h);
                return true;
            };
            var midex = function (j) {
                var dy = Solver.dim(_this.n);
                var hj = h / nj[j];
                for (var i = 1; i <= _this.n; ++i) {
                    yh1[i] = y[i];
                    yh2[i] = y[i] + hj * dz[i];
                }
                var m = nj[j] - 1;
                var njMid = (nj[j] / 2) | 0;
                for (var mm = 1; mm <= m; ++mm) {
                    if (_this.denseOutput && mm === njMid) {
                        for (var i = 1; i <= nrd; ++i) {
                            ySafe[j][i] = yh2[icom[i]];
                        }
                    }
                    F(x + hj * mm, yh2, dy);
                    if (_this.denseOutput && Math.abs(mm - njMid) <= 2 * j - 1) {
                        ++iPt;
                        for (var i = 1; i <= nrd; ++i) {
                            fSafe[iPt][i] = dy[icom[i]];
                        }
                    }
                    for (var i = 1; i <= _this.n; ++i) {
                        var ys = yh1[i];
                        yh1[i] = yh2[i];
                        yh2[i] = ys + 2 * hj * dy[i];
                    }
                    if (mm <= _this.stabilityCheckCount && j <= _this.stabilityCheckTableLines) {
                        var del1 = 0;
                        for (var i = 1; i <= _this.n; ++i) {
                            del1 += Math.pow((dz[i] / scal[i]), 2);
                        }
                        var del2 = 0;
                        for (var i = 1; i <= _this.n; ++i) {
                            del2 += Math.pow(((dy[i] - dz[i]) / scal[i]), 2);
                        }
                        var quot = del2 / Math.max(_this.uRound, del1);
                        if (quot > 4) {
                            ++nEval;
                            atov = true;
                            h *= _this.stepSizeReductionFactor;
                            reject = true;
                            return;
                        }
                    }
                }
                F(x + h, yh2, dy);
                if (_this.denseOutput && njMid <= 2 * j - 1) {
                    ++iPt;
                    for (var i = 1; i <= nrd; ++i) {
                        fSafe[iPt][i] = dy[icom[i]];
                    }
                }
                for (var i = 1; i <= _this.n; ++i) {
                    t[j][i] = (yh1[i] + yh2[i] + hj * dy[i]) / 2;
                }
                nEval += nj[j];
                if (j === 1)
                    return;
                var dblenj = nj[j];
                var fac;
                for (var l = j; l > 1; --l) {
                    fac = Math.pow((dblenj / nj[l - 1]), 2) - 1;
                    for (var i = 1; i <= _this.n; ++i) {
                        t[l - 1][i] = t[l][i] + (t[l][i] - t[l - 1][i]) / fac;
                    }
                }
                err = 0;
                for (var i = 1; i <= _this.n; ++i) {
                    var t1i = Math.max(Math.abs(y[i]), Math.abs(t[1][i]));
                    scal[i] = aTol[i] + rTol[i] * t1i;
                    err += Math.pow(((t[1][i] - t[2][i]) / scal[i]), 2);
                }
                err = Math.sqrt(err / _this.n);
                if (err * _this.uRound >= 1 || (j > 2 && err >= errOld)) {
                    atov = true;
                    h *= _this.stepSizeReductionFactor;
                    reject = true;
                    return;
                }
                errOld = Math.max(4 * err, 1);
                var exp0 = 1 / (2 * j - 1);
                var facMin = Math.pow(_this.stepSizeFac1, exp0);
                fac = Math.min(_this.stepSizeFac2 / facMin, Math.max(facMin, Math.pow((err / _this.stepSafetyFactor1), exp0) / _this.stepSafetyFactor2));
                fac = 1 / fac;
                hh[j] = Math.min(Math.abs(h) * fac, hMax);
                w[j] = a[j] / hh[j];
            };
            var interp = function (n, y, imit) {
                var a = new Array(31);
                for (var i = 1; i <= n; ++i) {
                    var y0_1 = y[i];
                    var y1 = y[2 * n + i];
                    var yp0 = y[n + i];
                    var yp1 = y[3 * n + i];
                    var yDiff = y1 - y0_1;
                    var aspl = -yp1 + yDiff;
                    var bspl = yp0 - yDiff;
                    y[n + i] = yDiff;
                    y[2 * n + i] = aspl;
                    y[3 * n + i] = bspl;
                    if (imit < 0)
                        continue;
                    var ph0 = (y0_1 + y1) * 0.5 + 0.125 * (aspl + bspl);
                    var ph1 = yDiff + (aspl - bspl) * 0.25;
                    var ph2 = -(yp0 - yp1);
                    var ph3 = 6 * (bspl - aspl);
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
                            for (var im = 4; im <= imit; im += 2) {
                                var fac1 = im * (im - 1) / 2;
                                var fac2 = im * (im - 1) * (im - 2) * (im - 3);
                                a[im] = (y[n * (im + 4) + i] + a[im - 2] * fac1 - a[im - 4] * fac2) * 16;
                            }
                        }
                    }
                    for (var im = 0; im <= imit; ++im)
                        y[n * (im + 4) + i] = a[im];
                }
            };
            var contex = function (xOld, h, imit, y, icom) {
                return function (c, x) {
                    var i = 0;
                    for (var j = 1; j <= nrd; ++j) {
                        if (icom[j] === c + 1)
                            i = j;
                    }
                    if (i === 0)
                        throw new Error('no dense output available for component ' + c);
                    var theta = (x - xOld) / h;
                    var theta1 = 1 - theta;
                    var phthet = y[i] + theta * (y[nrd + i] + theta1 * (y[2 * nrd + i] * theta + y[3 * nrd + i] * theta1));
                    if (imit < 0)
                        return phthet;
                    var thetah = theta - 0.5;
                    var ret = y[nrd * (imit + 4) + i];
                    for (var im = imit; im >= 1; --im) {
                        ret = y[nrd * (im + 3) + i] + ret * thetah / im;
                    }
                    return phthet + Math.pow((theta * theta1), 2) * ret;
                };
            };
            var ySafe = Solver.dim2(km, nrd);
            var hh = Solver.dim(km);
            var t = Solver.dim2(km, _this.n);
            var nj = Solver.stepSizeSequence(nSeq, km);
            var a = Solver.dim(km);
            a[1] = 1 + nj[1];
            for (var i = 2; i <= km; ++i) {
                a[i] = a[i - 1] + nj[i];
            }
            var scal = Solver.dim(_this.n);
            for (var i = 1; i <= _this.n; ++i) {
                scal[i] = aTol[i] + rTol[i] + Math.abs(y[i]);
            }
            var posneg = xEnd - x >= 0 ? 1 : -1;
            var k = Math.max(2, Math.min(km - 1, Math.floor(-Solver.log10(rTol[1] + 1e-40) * 0.6 + 1.5)));
            var h = Math.max(Math.abs(_this.initialStepSize), 1e-4);
            h = posneg * Math.min(h, hMax, Math.abs(xEnd - x) / 2);
            var iPoint = Solver.dim(km + 1);
            var errfac = Solver.dim(2 * km);
            var xOld = x;
            var iPt = 0;
            if (solOut) {
                if (_this.denseOutput) {
                    iPoint[1] = 0;
                    for (var i = 1; i <= km; ++i) {
                        var njAdd = 4 * i - 2;
                        if (nj[i] > njAdd)
                            ++njAdd;
                        iPoint[i + 1] = iPoint[i] + njAdd;
                    }
                    for (var mu = 1; mu <= 2 * km; ++mu) {
                        var errx = Math.sqrt(mu / (mu + 4)) * 0.5;
                        var prod = Math.pow((1 / (mu + 4)), 2);
                        for (var j = 1; j <= mu; ++j)
                            prod *= errx / j;
                        errfac[mu] = prod;
                    }
                    iPt = 0;
                }
                if (false === solOut(nAccept + 1, xOld, x, y.slice(1))) {
                    return Outcome.EarlyReturn;
                }
            }
            var err = 0;
            var errOld = 1e10;
            var hoptde = posneg * hMax;
            var w = Solver.dim(km);
            w[1] = 0;
            var reject = false;
            var last = false;
            var atov;
            var kc = 0;
            var STATE;
            (function (STATE) {
                STATE[STATE["Start"] = 0] = "Start";
                STATE[STATE["BasicIntegrationStep"] = 1] = "BasicIntegrationStep";
                STATE[STATE["ConvergenceStep"] = 2] = "ConvergenceStep";
                STATE[STATE["HopeForConvergence"] = 3] = "HopeForConvergence";
                STATE[STATE["Accept"] = 4] = "Accept";
                STATE[STATE["Reject"] = 5] = "Reject";
            })(STATE || (STATE = {}));
            var state = STATE.Start;
            loop: while (true) {
                _this.debug && console.log('STATE', STATE[state], nStep, xOld, x, h, k, kc, hoptde);
                switch (state) {
                    case STATE.Start:
                        atov = false;
                        if (0.1 * Math.abs(xEnd - x) <= Math.abs(x) * _this.uRound)
                            break loop;
                        h = posneg * Math.min(Math.abs(h), Math.abs(xEnd - x), hMax, Math.abs(hoptde));
                        if ((x + 1.01 * h - xEnd) * posneg > 0) {
                            h = xEnd - x;
                            last = true;
                        }
                        if (nStep === 0 || !_this.denseOutput) {
                            F(x, y, dz);
                            ++nEval;
                        }
                        if (nStep === 0 || last) {
                            iPt = 0;
                            ++nStep;
                            for (var j = 1; j <= k; ++j) {
                                kc = j;
                                midex(j);
                                if (atov)
                                    continue loop;
                                if (j > 1 && err <= 1) {
                                    state = STATE.Accept;
                                    continue loop;
                                }
                            }
                            state = STATE.HopeForConvergence;
                            continue;
                        }
                        state = STATE.BasicIntegrationStep;
                        continue;
                    case STATE.BasicIntegrationStep:
                        iPt = 0;
                        ++nStep;
                        if (nStep >= _this.maxSteps) {
                            return Outcome.MaxStepsExceeded;
                        }
                        kc = k - 1;
                        for (var j = 1; j <= kc; ++j) {
                            midex(j);
                            if (atov) {
                                state = STATE.Start;
                                continue loop;
                            }
                        }
                        if (k === 2 || reject) {
                            state = STATE.ConvergenceStep;
                        }
                        else {
                            if (err <= 1) {
                                state = STATE.Accept;
                            }
                            else if (err > Math.pow(((nj[k + 1] * nj[k]) / 4), 2)) {
                                state = STATE.Reject;
                            }
                            else
                                state = STATE.ConvergenceStep;
                        }
                        continue;
                    case STATE.ConvergenceStep:
                        midex(k);
                        if (atov) {
                            state = STATE.Start;
                            continue;
                        }
                        kc = k;
                        if (err <= 1) {
                            state = STATE.Accept;
                            continue;
                        }
                        state = STATE.HopeForConvergence;
                        continue;
                    case STATE.HopeForConvergence:
                        if (err > Math.pow((nj[k + 1] / 2), 2)) {
                            state = STATE.Reject;
                            continue;
                        }
                        kc = k + 1;
                        midex(kc);
                        if (atov)
                            state = STATE.Start;
                        else if (err > 1)
                            state = STATE.Reject;
                        else
                            state = STATE.Accept;
                        continue;
                    case STATE.Accept:
                        if (!acceptStep(_this.n))
                            return Outcome.EarlyReturn;
                        state = STATE.Start;
                        continue;
                    case STATE.Reject:
                        k = Math.min(k, kc, km - 1);
                        if (k > 2 && w[k - 1] < w[k] * _this.stepSizeFac3)
                            k -= 1;
                        ++nReject;
                        h = posneg * hh[k];
                        reject = true;
                        state = STATE.BasicIntegrationStep;
                }
            }
            return Outcome.Converged;
        };
        var outcome = odxcor();
        return {
            y: y.slice(1),
            outcome: outcome,
            nStep: nStep,
            xEnd: xEnd,
            nAccept: nAccept,
            nReject: nReject,
            nEval: nEval
        };
    };
    return Solver;
}());
Solver.dim = function (n) { return Array(n + 1); };
Solver.log10 = function (x) { return Math.log(x) / Math.LN10; };
exports.Solver = Solver;

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzdGFuZGFyZC1tYXAudHMiLCIuLi8uLi9vZGV4L3NyYy9vZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQ0lBLDRDQUFzRDtBQU10RCxJQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQTtBQUV6QjtJQUtFLHFCQUFZLENBQVM7UUFnQnJCLFdBQU0sR0FBRyxVQUFTLFdBQXFCLEVBQUUsQ0FBUyxFQUFFLFFBQXdDO1lBQ3JGLElBQUEsc0JBQUssRUFBRSxrQkFBQyxDQUFlO1lBQzVCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQzNCLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUE7Z0JBQ2xCLElBQUksRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFBO2dCQUN2QyxLQUFLLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDLENBQUE7Z0JBQzNCLENBQUMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFBO1lBQ2pCLENBQUM7UUFDSCxDQUFDLENBQUE7UUF2QkMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDVixJQUFJLENBQUMsRUFBRSxHQUFHLFdBQVcsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUE7SUFDOUMsQ0FBQztJQUVNLDJCQUFlLEdBQXRCLFVBQXVCLE9BQWU7UUFDcEMsSUFBTSxNQUFNLEdBQUcsT0FBTyxHQUFHLEtBQUssQ0FBQTtRQUM5QixNQUFNLENBQUMsVUFBVSxDQUFTO1lBQ3hCLEVBQUUsQ0FBQyxDQUFDLE1BQU0sSUFB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QyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEdBQUcsRUFBRSxFQUFFLENBQUM7d0JBQUUsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7b0JBRTVELEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7d0JBQzdCLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQTt3QkFDbEIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQzs0QkFDNUIsSUFBSSxNQUFNLEdBQUcsU0FBQSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUksQ0FBQyxDQUFBLEdBQUcsQ0FBQyxDQUFBOzRCQUMxQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEdBQUcsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDO2dDQUM5QixLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFBOzRCQUMxRSxDQUFDO3dCQUNILENBQUM7b0JBQ0gsQ0FBQztvQkFDRCxJQUFJLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFBO29CQUNqQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEdBQUcsRUFBRSxFQUFFLENBQUM7d0JBQUUsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7b0JBRTFELEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQzt3QkFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO29CQUM3QyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQTtvQkFDZCxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQTtvQkFDYixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEdBQUcsRUFBRSxFQUFFLENBQUM7d0JBQUUsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO29CQUUvRCxHQUFHLENBQUMsQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDLEVBQUUsR0FBRyxJQUFJLElBQUksRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDO3dCQUVyQyxJQUFJLElBQUksR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFBO3dCQUM1QixHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDOzRCQUNuQyxJQUFJLEtBQUssR0FBRyxTQUFBLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFBLENBQUE7NEJBQ3JDLEdBQUcsR0FBRyxNQUFNLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsR0FBRyxDQUFBOzRCQUNuQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEdBQUcsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDO2dDQUM5QixLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQTs0QkFDdEMsQ0FBQzt3QkFDSCxDQUFDO3dCQUNELEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDOzRCQUNwQyxJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7NEJBQ2xCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksSUFBSSxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDO2dDQUNuQyxJQUFJLE1BQU0sR0FBRyxTQUFBLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBSSxDQUFDLENBQUEsR0FBRyxDQUFDLENBQUE7Z0NBQzFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7b0NBQzlCLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUE7Z0NBQzFF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QUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFJLENBQUMsWUFBWSxDQUFDOzRCQUFDLElBQUksR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFBO3dCQUN4RCxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxLQUFJLENBQUMsWUFBWSxDQUFDOzRCQUFDLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFBO29CQUM1RSxDQUFDO29CQUFDLElBQUksQ0FBQyxDQUFDO3dCQUNOLElBQUksR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFBO3dCQUNiLEVBQUUsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLEtBQUksQ0FBQyxZQUFZLENBQUM7NEJBQUMsSUFBSSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUE7d0JBQ3RFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSSxDQUFDLFlBQVksQ0FBQzs0QkFBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFBO29CQUN0RSxDQUFDO2dCQUNILENBQUM7Z0JBRUQsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztvQkFDWCxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUE7b0JBQ3RCLENBQUMsR0FBRyxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENB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QUNiLE1BQU0sQ0FBQTtnQkFDUixDQUFDO2dCQUNELE1BQU0sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUE7Z0JBRTdCLElBQUksSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUE7Z0JBQzFCLElBQUksTUFBTSxHQUFHLFNBQUEsS0FBSSxDQUFDLFlBQVksRUFBSSxJQUFJLENBQUEsQ0FBQTtnQkFDdEMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSSxDQUFDLFlBQVksR0FBRyxNQUFNLEVBQ3ZDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLFNBQUEsQ0FBQyxHQUFHLEdBQUcsS0FBSSxDQUFDLGlCQUFpQixDQUFDLEVBQUksSUFBSSxDQUFBLEdBQUcsS0FBSSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQTtnQkFDcEYsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUE7Z0JBQ2IsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUE7Z0JBQ3pDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBQ3JCLENBQUMsQ0FBQTtZQUVELElBQU0sTUFBTSxHQUFHLFVBQUMsQ0FBUyxFQUFFLENBQVcsRUFBRSxJQUFZO2dCQUVsRCxJQUFJLENBQUMsR0FBRyxJQUFJLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQTtnQkFFckIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQztvQkFDNUIsSUFBSSxJQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO29CQUNiLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBO29CQUNyQixJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBO29CQUNsQixJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQTtvQkFDdEIsSUFBSSxLQUFLLEdBQUcsRUFBRSxHQUFHLElBQUUsQ0FBQTtvQkFDbkIsSUFBSSxJQUFJLEdBQUcsQ0FBQyxHQUFHLEdBQUcsS0FBSyxDQUFBO29CQUN2QixJQUFJLElBQUksR0FBRyxHQUFHLEdBQUcsS0FBSyxDQUFBO29CQUN0QixDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQTtvQkFDaEIsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFBO29CQUNuQixDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUE7b0JBQ25CLEVBQUUsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUM7d0JBQUMsUUFBUSxDQUFBO29CQUV0QixJQUFJLEdBQUcsR0FBRyxDQUFDLElBQUUsR0FBRyxFQUFFLENBQUMsR0FBRyxHQUFHLEdBQUcsS0FBSyxHQUFHLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFBO29CQUNqRCxJQUFJLEdBQUcsR0FBRyxLQUFLLEdBQUcsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFBO29CQUN0QyxJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFBO29CQUN0QixJQUFJLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLENBQUE7b0JBRTNCLEVBQUUsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUNkLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQTt3QkFDaEMsRUFBRSxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7NEJBQ2QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7NEJBQzNDLEVBQUUsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dDQUNkLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLElBQUksSUFBSSxFQUFFLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQztvQ0FDckMsSUFBSSxJQUFJLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtvQ0FDNUIsSUFBSSxJQUFJLEdBQUcsSUFBSSxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtvQ0FDekMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQTtnQ0FDMUUsQ0FBQzs0QkFDSCxDQUFDO3dCQUNILENBQUM7b0JBQ0gsQ0FBQztvQkFDRCxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUE7b0JBQ2hDLEVBQUUsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUNkLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUE7d0JBQ3ZDLEVBQUUsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDOzRCQUNkLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLElBQUksSUFBSSxFQUFFLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQ0FDckMsSUFBSSxJQUFJLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtnQ0FDNUIsSUFBSSxJQUFJLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFBO2dDQUM5QyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFBOzRCQUMxRSxDQUFDO3dCQUNILENBQUM7b0JBQ0gsQ0FBQztvQkFDRCxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRSxJQUFJLElBQUks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RyxDQUFDLENBQUMsRUFBWixDQUFZLENBQUE7QUFDakMsWUFBSyxHQUFHLFVBQUMsQ0FBUyxJQUFLLE9BQUEsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxFQUF2QixDQUF1QixDQUFBO0FBN0VsRCx3QkFBTSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIENyZWF0ZWQgYnkgY29saW4gb24gNi8xNC8xNi5cbiAqL1xuXG5pbXBvcnQge1NvbHZlciwgRGVyaXZhdGl2ZX0gZnJvbSAnLi4vLi4vb2RleC9zcmMvb2RleCdcblxuaW50ZXJmYWNlIEhhbWlsdG9uTWFwIHtcbiAgZXZvbHZlOiAoaW5pdGlhbERhdGE6IG51bWJlcltdLCBuOiBudW1iZXIsIGNhbGxiYWNrOiAoeDogbnVtYmVyLCB5OiBudW1iZXIpID0+IHZvaWQpID0+IHZvaWRcbn1cblxuY29uc3QgdHdvUGkgPSBNYXRoLlBJICogMlxuXG5leHBvcnQgY2xhc3MgU3RhbmRhcmRNYXAgaW1wbGVtZW50cyBIYW1pbHRvbk1hcCB7XG4gIEs6IG51bWJlclxuICBQVjogKHg6IG51bWJlcikgPT4gbnVtYmVyXG4gIHN0YXRpYyB0d29QaSA9IDIgKiBNYXRoLlBJXG5cbiAgY29uc3RydWN0b3IoSzogbnVtYmVyKSB7XG4gICAgdGhpcy5LID0gS1xuICAgIHRoaXMuUFYgPSBTdGFuZGFyZE1hcC5wcmluY2lwYWxfdmFsdWUodHdvUGkpXG4gIH1cblxuICBzdGF0aWMgcHJpbmNpcGFsX3ZhbHVlKGN1dEhpZ2g6IG51bWJlcik6ICh2OiBudW1iZXIpID0+IG51bWJlciB7XG4gICAgY29uc3QgY3V0TG93ID0gY3V0SGlnaCAtIHR3b1BpXG4gICAgcmV0dXJuIGZ1bmN0aW9uICh4OiBudW1iZXIpIHtcbiAgICAgIGlmIChjdXRMb3cgPD0geCAmJiB4IDwgY3V0SGlnaCkge1xuICAgICAgICByZXR1cm4geFxuICAgICAgfVxuICAgICAgY29uc3QgeSA9IHggLSB0d29QaSAqIE1hdGguZmxvb3IoeCAvIHR3b1BpKVxuICAgICAgcmV0dXJuIHkgPCBjdXRIaWdoID8geSA6IHkgLSB0d29QaVxuICAgIH1cbiAgfVxuXG4gIGV2b2x2ZSA9IGZ1bmN0aW9uKGluaXRpYWxEYXRhOiBudW1iZXJbXSwgbjogbnVtYmVyLCBjYWxsYmFjazogKHg6IG51bWJlciwgeTogbnVtYmVyKSA9PiB2b2lkKSB7XG4gICAgbGV0IFt0aGV0YSwgSV0gPSBpbml0aWFsRGF0YVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICBjYWxsYmFjayh0aGV0YSwgSSlcbiAgICAgIGxldCBuSSA9IEkgKyAodGhpcy5LICogTWF0aC5zaW4odGhldGEpKVxuICAgICAgdGhldGEgPSB0aGlzLlBWKHRoZXRhICsgbkkpXG4gICAgICBJID0gdGhpcy5QVihuSSlcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIERyaXZlblBlbmR1bHVtTWFwIGltcGxlbWVudHMgSGFtaWx0b25NYXAge1xuICBkOiBEZXJpdmF0aXZlXG4gIFQ6IG51bWJlclxuICBTOiBTb2x2ZXJcbiAgUFY6ICh4OiBudW1iZXIpID0+IG51bWJlclxuXG4gIHN0YXRpYyBGOiAobTogbnVtYmVyLCBsOiBudW1iZXIsIGE6IG51bWJlciwgb21lZ2E6IG51bWJlciwgZzogbnVtYmVyKSA9PiBEZXJpdmF0aXZlID1cbiAgICAobSwgbCwgYSwgb21lZ2EsIGcpID0+ICh4LCBbdCwgdGhldGEsIHBfdGhldGFdKSA9PiB7XG4gICAgICAvLyBsZXQgXzEgPSBNYXRoLnNpbihvbWVnYSAqIHQpOiB0aGlzIGNvbWVzIGFib3V0IGZyb20gYSBidWcgaW4gb3VyIENTRVxuICAgICAgbGV0IF8yID0gTWF0aC5wb3cobCwgMilcbiAgICAgIGxldCBfMyA9IG9tZWdhICogdFxuICAgICAgbGV0IF80ID0gTWF0aC5zaW4odGhldGEpXG4gICAgICBsZXQgXzUgPSBNYXRoLmNvcyh0aGV0YSlcbiAgICAgIHJldHVybiBbMSxcbiAgICAgICAgKE1hdGguc2luKF8zKSAqIF80ICogYSAqIGwgKiBtICogb21lZ2EgKyBwX3RoZXRhKSAvIF8yICogbSxcbiAgICAgICAgKC0gTWF0aC5wb3coTWF0aC5zaW4oXzMpLCAyKSAqIF80ICogXzUgKiBNYXRoLnBvdyhhLCAyKSAqIGwgKiBtICogTWF0aC5wb3cob21lZ2EsIDIpIC0gTWF0aC5zaW4oXzMpICogXzUgKiBhICogb21lZ2EgKiBwX3RoZXRhIC0gXzQgKiBnICogXzIgKiBtKSAvIGxdXG4gICAgfVxuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuUyA9IG5ldyBTb2x2ZXIoMylcbiAgICB0aGlzLlMuZGVuc2VPdXRwdXQgPSB0cnVlXG4gICAgLy8gdGhpcy5TLmFic29sdXRlVG9sZXJhbmNlID0gMWUtOVxuICAgIC8vIHRoaXMuUy5yZWxhdGl2ZVRvbGVyYW5jZSA9IDFlLTlcbiAgICBjb25zdCBsID0gMVxuICAgIGNvbnN0IGcgPSA5LjhcbiAgICBjb25zdCB3MCA9IE1hdGguc3FydChnIC8gbClcbiAgICBjb25zdCB3ID0gMiAqIHcwXG4gICAgdGhpcy5UID0gMiAqIE1hdGguUEkgLyB3XG4gICAgY29uc3QgYSA9IDAuMVxuICAgIHRoaXMuZCA9IERyaXZlblBlbmR1bHVtTWFwLkYoMSwgbCwgYSwgdywgZylcbiAgICB0aGlzLlBWID0gU3RhbmRhcmRNYXAucHJpbmNpcGFsX3ZhbHVlKE1hdGguUEkpXG4gIH1cblxuICBldm9sdmUoaW5pdGlhbERhdGE6IG51bWJlcltdLCBuOiBudW1iZXIsIGNhbGxiYWNrOiAoeDogbnVtYmVyLCB5OiBudW1iZXIpID0+IHZvaWQpIHtcbiAgICB0aGlzLlMuc29sdmUodGhpcy5kLCAwLCBbMF0uY29uY2F0KGluaXRpYWxEYXRhKSwgMTAwMCAqIHRoaXMuVCwgdGhpcy5TLmdyaWQodGhpcy5ULCAoeCwgeXMpID0+IHtcbiAgICAgIGNhbGxiYWNrKHRoaXMuUFYoeXNbMV0pLCB5c1syXSlcbiAgICB9KSlcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRXhwbG9yZU1hcCB7XG4gIGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnRcbiAgTTogSGFtaWx0b25NYXBcbiAgY29udGV4dDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEXG5cbiAgY29uc3RydWN0b3IoY2FudmFzOiBzdHJpbmcsIE06IFN0YW5kYXJkTWFwLCB4UmFuZ2U6IG51bWJlcltdLCB5UmFuZ2U6IG51bWJlcltdKSB7XG4gICAgdGhpcy5jYW52YXMgPSA8SFRNTENhbnZhc0VsZW1lbnQ+IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGNhbnZhcylcbiAgICB0aGlzLk0gPSBNXG4gICAgdGhpcy5jb250ZXh0ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKVxuICAgIGxldCBbdywgaF0gPSBbeFJhbmdlWzFdIC0geFJhbmdlWzBdLCB5UmFuZ2VbMV0gLSB5UmFuZ2VbMF1dXG4gICAgdGhpcy5jYW52YXMub25tb3VzZWRvd24gPSAoZTogTW91c2VFdmVudCkgPT4ge1xuICAgICAgbGV0IFtjeCwgY3ldID0gW2Uub2Zmc2V0WCAvIHRoaXMuY29udGV4dC5jYW52YXMud2lkdGggKiB3ICsgeFJhbmdlWzBdLFxuICAgICAgICB5UmFuZ2VbMV0gLSBlLm9mZnNldFkgLyB0aGlzLmNvbnRleHQuY2FudmFzLmhlaWdodCAqIGhdXG4gICAgICB0aGlzLkV4cGxvcmUoY3gsIGN5KVxuICAgIH1cbiAgICB0aGlzLmNvbnRleHQuc2NhbGUodGhpcy5jb250ZXh0LmNhbnZhcy53aWR0aCAvIHcsIC10aGlzLmNvbnRleHQuY2FudmFzLmhlaWdodCAvIGgpXG4gICAgdGhpcy5jb250ZXh0LnRyYW5zbGF0ZSgteFJhbmdlWzBdLCAteVJhbmdlWzFdKVxuICAgIHRoaXMuY29udGV4dC5maWxsU3R5bGUgPSAncmdiYSgyMyw2NCwxNzAsMC4zKSdcbiAgfVxuXG4gIGk6IG51bWJlciA9IDBcblxuICBwdCA9ICh4OiBudW1iZXIsIHk6IG51bWJlcikgPT4ge1xuICAgIC8vIGlmICh0aGlzLmkgJSAxMDAgPT09IDApIGNvbnNvbGUubG9nKHRoaXMuaSwgJ3B0cycpXG4gICAgdGhpcy5jb250ZXh0LmJlZ2luUGF0aCgpXG4gICAgdGhpcy5jb250ZXh0LmFyYyh4LCB5LCAwLjAxLCAwLCAyICogTWF0aC5QSSlcbiAgICB0aGlzLmNvbnRleHQuZmlsbCgpXG4gICAgdGhpcy5jb250ZXh0LmNsb3NlUGF0aCgpXG4gICAgKyt0aGlzLmlcbiAgfVxuXG4gIEV4cGxvcmUoeDogbnVtYmVyLCB5OiBudW1iZXIpIHtcbiAgICB0aGlzLk0uZXZvbHZlKFt4LCB5XSwgMTAwMCwgdGhpcy5wdClcbiAgfVxuXG4gIC8vIFdlIHdlcmUgY29uc2lkZXJpbmcgc29tZSBhbHRlcm5hdGl2ZXM6IHRoZSBDUFMgb2YgU0lDTSwgYW5kIGdlbmVyYXRvcnMuXG4gIC8vIEZvciBzaW1wbGljaXR5IGluIEpTLCB0aG91Z2gsIHRoZSBjYWxsYmFjayBmb3JtIGNhbid0IHJlYWxseSBiZSBiZWF0LlxuXG4gIC8vIEV4cGxvcmUwKHg6IG51bWJlciwgeTogbnVtYmVyKSB7XG4gIC8vICAgZm9yIChsZXQgaSA9IDA7IGkgPCAxMDAwOyArK2kpIHtcbiAgLy8gICAgIHRoaXMuTS5ydW4oeCwgeSwgKHhwOiBudW1iZXIsIHlwOiBudW1iZXIpID0+IHtcbiAgLy8gICAgICAgdGhpcy5wdCh4cCwgeXApXG4gIC8vICAgICAgIHggPSB4cFxuICAvLyAgICAgICB5ID0geXBcbiAgLy8gICAgIH0sICgpID0+IHtcbiAgLy8gICAgICAgY29uc29sZS5sb2coJ0ZBSUwnKVxuICAvLyAgICAgfSlcbiAgLy8gICB9XG4gIC8vIH1cblxuICAvLyBFeHBsb3JlMSh4OiBudW1iZXIsIHk6IG51bWJlcikge1xuICAvLyAgIGZvciAoW3gsIHldIG9mIHRoaXMuTS5nZW5lcmF0ZSh4LCB5LCAxMDAwKSkge1xuICAvLyAgICAgdGhpcy5wdCh4LCB5KVxuICAvLyAgIH1cbiAgLy8gfVxufVxuIiwiLyoqXG4gKiBBbiBpbXBsZW1lbnRhdGlvbiBvZiBPREVYLCBieSBFLiBIYWlyZXIgYW5kIEcuIFdhbm5lciwgcG9ydGVkIGZyb20gdGhlIEZvcnRyYW4gT0RFWC5GLlxuICogVGhlIG9yaWdpbmFsIHdvcmsgY2FycmllcyB0aGUgQlNEIDItY2xhdXNlIGxpY2Vuc2UsIGFuZCBzbyBkb2VzIHRoaXMuXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE2IENvbGluIFNtaXRoLlxuICogMS4gUmVkaXN0cmlidXRpb25zIG9mIHNvdXJjZSBjb2RlIG11c3QgcmV0YWluIHRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlLCB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZ1xuICogZGlzY2xhaW1lci5cbiAqIDIuIFJlZGlzdHJpYnV0aW9ucyBpbiBiaW5hcnkgZm9ybSBtdXN0IHJlcHJvZHVjZSB0aGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSwgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZVxuICogZm9sbG93aW5nIGRpc2NsYWltZXIgaW4gdGhlIGRvY3VtZW50YXRpb24gYW5kL29yIG90aGVyIG1hdGVyaWFscyBwcm92aWRlZCB3aXRoIHRoZSBkaXN0cmlidXRpb24uXG4gKlxuICogVEhJUyBTT0ZUV0FSRSBJUyBQUk9WSURFRCBCWSBUSEUgQ09QWVJJR0hUIEhPTERFUlMgQU5EIENPTlRSSUJVVE9SUyBcIkFTIElTXCIgQU5EIEFOWSBFWFBSRVNTIE9SIElNUExJRUQgV0FSUkFOVElFUyxcbiAqIElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBUSEUgSU1QTElFRCBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSBBTkQgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0VcbiAqIEFSRSBESVNDTEFJTUVELiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQ09QWVJJR0hUIEhPTERFUiBPUiBDT05UUklCVVRPUlMgQkUgTElBQkxFIEZPUiBBTlkgRElSRUNULCBJTkRJUkVDVCxcbiAqIElOQ0lERU5UQUwsIFNQRUNJQUwsIEVYRU1QTEFSWSwgT1IgQ09OU0VRVUVOVElBTCBEQU1BR0VTIChJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgUFJPQ1VSRU1FTlQgT0YgU1VCU1RJVFVURVxuICogR09PRFMgT1IgU0VSVklDRVM7IExPU1MgT0YgVVNFLCBEQVRBLCBPUiBQUk9GSVRTOyBPUiBCVVNJTkVTUyBJTlRFUlJVUFRJT04pIEhPV0VWRVIgQ0FVU0VEIEFORCBPTiBBTlkgVEhFT1JZIE9GXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQ09OVFJBQ1QsIFNUUklDVCBMSUFCSUxJVFksIE9SIFRPUlQgKElOQ0xVRElORyBORUdMSUdFTkNFIE9SIE9USEVSV0lTRSkgQVJJU0lORyBJTiBBTlkgV0FZXG4gKiBPVVQgT0YgVEhFIFVTRSBPRiBUSElTIFNPRlRXQVJFLCBFVkVOIElGIEFEVklTRUQgT0YgVEhFIFBPU1NJQklMSVRZIE9GIFNVQ0ggREFNQUdFLlxuICovXG5cbmV4cG9ydCBpbnRlcmZhY2UgRGVyaXZhdGl2ZSB7ICAvLyBmdW5jdGlvbiBjb21wdXRpbmcgdGhlIHZhbHVlIG9mIFknID0gRih4LFkpXG4gICh4OiBudW1iZXIsICAgICAgICAgICAvLyBpbnB1dCB4IHZhbHVlXG4gICB5OiBudW1iZXJbXSkgICAgICAgICAvLyBpbnB1dCB5IHZhbHVlKVxuICAgIDogbnVtYmVyW10gICAgICAgICAgLy8gb3V0cHV0IHknIHZhbHVlcyAoQXJyYXkgb2YgbGVuZ3RoIG4pXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3V0cHV0RnVuY3Rpb24geyAgICAgICAgICAgICAgICAgICAgLy8gdmFsdWUgY2FsbGJhY2tcbiAgKG5yOiBudW1iZXIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBzdGVwIG51bWJlclxuICAgeG9sZDogbnVtYmVyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGxlZnQgZWRnZSBvZiBzb2x1dGlvbiBpbnRlcnZhbFxuICAgeDogbnVtYmVyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJpZ2h0IGVkZ2Ugb2Ygc29sdXRpb24gaW50ZXJ2YWwgKHkgPSBGKHgpKVxuICAgeTogbnVtYmVyW10sICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEYoeClcbiAgIGRlbnNlPzogKGM6IG51bWJlciwgeDogbnVtYmVyKSA9PiBudW1iZXIpICAvLyBkZW5zZSBpbnRlcnBvbGF0b3IuIFZhbGlkIGluIHRoZSByYW5nZSBbeCwgeG9sZCkuXG4gICAgOiBib29sZWFufHZvaWQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmV0dXJuIGZhbHNlIHRvIGhhbHQgaW50ZWdyYXRpb25cbn1cblxuZXhwb3J0IGVudW0gT3V0Y29tZSB7XG4gIENvbnZlcmdlZCxcbiAgTWF4U3RlcHNFeGNlZWRlZCxcbiAgRWFybHlSZXR1cm5cbn1cblxuZXhwb3J0IGNsYXNzIFNvbHZlciB7XG4gIG46IG51bWJlciAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGRpbWVuc2lvbiBvZiB0aGUgc3lzdGVtXG4gIHVSb3VuZDogbnVtYmVyICAgICAgICAgICAgICAgICAgICAgIC8vIFdPUksoMSksIG1hY2hpbmUgZXBzaWxvbi4gKFdPUkssIElXT1JLIGFyZSByZWZlcmVuY2VzIHRvIG9kZXguZilcbiAgbWF4U3RlcHM6IG51bWJlciAgICAgICAgICAgICAgICAgICAgLy8gSVdPUksoMSksIHBvc2l0aXZlIGludGVnZXJcbiAgaW5pdGlhbFN0ZXBTaXplOiBudW1iZXIgICAgICAgICAgICAgLy8gSFxuICBtYXhTdGVwU2l6ZTogbnVtYmVyICAgICAgICAgICAgICAgICAvLyBXT1JLKDIpLCBtYXhpbWFsIHN0ZXAgc2l6ZSwgZGVmYXVsdCB4RW5kIC0geFxuICBtYXhFeHRyYXBvbGF0aW9uQ29sdW1uczogbnVtYmVyICAgICAvLyBJV09SSygyKSwgS00sIHBvc2l0aXZlIGludGVnZXJcbiAgc3RlcFNpemVTZXF1ZW5jZTogbnVtYmVyICAgICAgICAgICAgLy8gSVdPUksoMyksIGluIFsxLi41XVxuICBzdGFiaWxpdHlDaGVja0NvdW50OiBudW1iZXIgICAgICAgICAvLyBJV09SSyg0KSwgaW5cbiAgc3RhYmlsaXR5Q2hlY2tUYWJsZUxpbmVzOiBudW1iZXIgICAgLy8gSVdPUksoNSksIHBvc2l0aXZlIGludGVnZXJcbiAgZGVuc2VPdXRwdXQ6IGJvb2xlYW4gICAgICAgICAgICAgICAgLy8gSU9VVCA+PSAyLCB0cnVlIG1lYW5zIGRlbnNlIG91dHB1dCBpbnRlcnBvbGF0b3IgcHJvdmlkZWQgdG8gc29sT3V0XG4gIGRlbnNlT3V0cHV0RXJyb3JFc3RpbWF0b3I6IGJvb2xlYW4gIC8vIElXT1JLKDYpLCByZXZlcnNlZCBzZW5zZSBmcm9tIHRoZSBGT1JUUkFOIGNvZGVcbiAgZGVuc2VDb21wb25lbnRzOiBudW1iZXJbXSAgICAgICAgICAgLy8gSVdPUksoOCkgJiBJV09SSygyMSwuLi4pLCBjb21wb25lbnRzIGZvciB3aGljaCBkZW5zZSBvdXRwdXQgaXMgcmVxdWlyZWRcbiAgaW50ZXJwb2xhdGlvbkZvcm11bGFEZWdyZWU6IG51bWJlciAgLy8gSVdPUksoNyksIMK1ID0gMiAqIGsgLSBpbnRlcnBvbGF0aW9uRm9ybXVsYURlZ3JlZSArIDEgWzEuLjZdLCBkZWZhdWx0IDRcbiAgc3RlcFNpemVSZWR1Y3Rpb25GYWN0b3I6IG51bWJlciAgICAgLy8gV09SSygzKSwgZGVmYXVsdCAwLjVcbiAgc3RlcFNpemVGYWMxOiBudW1iZXIgICAgICAgICAgICAgICAgLy8gV09SSyg0KVxuICBzdGVwU2l6ZUZhYzI6IG51bWJlciAgICAgICAgICAgICAgICAvLyBXT1JLKDUpXG4gIHN0ZXBTaXplRmFjMzogbnVtYmVyICAgICAgICAgICAgICAgIC8vIFdPUksoNilcbiAgc3RlcFNpemVGYWM0OiBudW1iZXIgICAgICAgICAgICAgICAgLy8gV09SSyg3KVxuICBzdGVwU2FmZXR5RmFjdG9yMTogbnVtYmVyICAgICAgICAgICAvLyBXT1JLKDgpXG4gIHN0ZXBTYWZldHlGYWN0b3IyOiBudW1iZXIgICAgICAgICAgIC8vIFdPUksoOSlcbiAgcmVsYXRpdmVUb2xlcmFuY2U6IG51bWJlcnxudW1iZXJbXSAgLy8gUlRPTC4gQ2FuIGJlIGEgc2NhbGFyIG9yIHZlY3RvciBvZiBsZW5ndGggTi5cbiAgYWJzb2x1dGVUb2xlcmFuY2U6IG51bWJlcnxudW1iZXJbXSAgLy8gQVRPTC4gQ2FuIGJlIGEgc2NhbGFyIG9yIHZlY3RvciBvZiBsZW5ndGggTi5cbiAgZGVidWc6IGJvb2xlYW5cblxuICBjb25zdHJ1Y3RvcihuOiBudW1iZXIpIHtcbiAgICB0aGlzLm4gPSBuXG4gICAgdGhpcy51Um91bmQgPSAyLjNlLTE2XG4gICAgdGhpcy5tYXhTdGVwcyA9IDEwMDAwXG4gICAgdGhpcy5pbml0aWFsU3RlcFNpemUgPSAxZS00XG4gICAgdGhpcy5tYXhTdGVwU2l6ZSA9IDBcbiAgICB0aGlzLm1heEV4dHJhcG9sYXRpb25Db2x1bW5zID0gOVxuICAgIHRoaXMuc3RlcFNpemVTZXF1ZW5jZSA9IDBcbiAgICB0aGlzLnN0YWJpbGl0eUNoZWNrQ291bnQgPSAxXG4gICAgdGhpcy5zdGFiaWxpdHlDaGVja1RhYmxlTGluZXMgPSAyXG4gICAgdGhpcy5kZW5zZU91dHB1dCA9IGZhbHNlXG4gICAgdGhpcy5kZW5zZU91dHB1dEVycm9yRXN0aW1hdG9yID0gdHJ1ZVxuICAgIHRoaXMuZGVuc2VDb21wb25lbnRzID0gdW5kZWZpbmVkXG4gICAgdGhpcy5pbnRlcnBvbGF0aW9uRm9ybXVsYURlZ3JlZSA9IDRcbiAgICB0aGlzLnN0ZXBTaXplUmVkdWN0aW9uRmFjdG9yID0gMC41XG4gICAgdGhpcy5zdGVwU2l6ZUZhYzEgPSAwLjAyXG4gICAgdGhpcy5zdGVwU2l6ZUZhYzIgPSA0LjBcbiAgICB0aGlzLnN0ZXBTaXplRmFjMyA9IDAuOFxuICAgIHRoaXMuc3RlcFNpemVGYWM0ID0gMC45XG4gICAgdGhpcy5zdGVwU2FmZXR5RmFjdG9yMSA9IDAuNjVcbiAgICB0aGlzLnN0ZXBTYWZldHlGYWN0b3IyID0gMC45NFxuICAgIHRoaXMucmVsYXRpdmVUb2xlcmFuY2UgPSAxZS01XG4gICAgdGhpcy5hYnNvbHV0ZVRvbGVyYW5jZSA9IDFlLTVcbiAgICB0aGlzLmRlYnVnID0gZmFsc2VcbiAgfVxuXG4gIGdyaWQoZHQ6IG51bWJlciwgb3V0OiAoeE91dDogbnVtYmVyLCB5T3V0OiBudW1iZXJbXSkgPT4gYW55KTogT3V0cHV0RnVuY3Rpb24ge1xuICAgIGxldCBjb21wb25lbnRzOiBudW1iZXJbXSA9IHRoaXMuZGVuc2VDb21wb25lbnRzXG4gICAgaWYgKCFjb21wb25lbnRzKSB7XG4gICAgICBjb21wb25lbnRzID0gW11cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uOyArK2kpIGNvbXBvbmVudHMucHVzaChpKVxuICAgIH1cbiAgICBsZXQgdDogbnVtYmVyXG4gICAgcmV0dXJuIChuOiBudW1iZXIsIHhPbGQ6IG51bWJlciwgeDogbnVtYmVyLCB5OiBudW1iZXJbXSwgaW50ZXJwb2xhdGU6IChpOiBudW1iZXIsIHg6IG51bWJlcikgPT4gbnVtYmVyKSA9PiB7XG4gICAgICBpZiAobiA9PT0gMSkge1xuICAgICAgICBvdXQoeCwgeSlcbiAgICAgICAgdCA9IHggKyBkdFxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIHdoaWxlICh0IDw9IHgpIHtcbiAgICAgICAgbGV0IHlmOiBudW1iZXJbXSA9IFtdXG4gICAgICAgIGZvciAobGV0IGkgb2YgY29tcG9uZW50cykge1xuICAgICAgICAgIHlmLnB1c2goaW50ZXJwb2xhdGUoaSwgdCkpXG4gICAgICAgIH1cbiAgICAgICAgb3V0KHQsIHlmKVxuICAgICAgICB0ICs9IGR0XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gcmV0dXJuIGEgMS1iYXNlZCBhcnJheSBvZiBsZW5ndGggbi4gSW5pdGlhbCB2YWx1ZXMgdW5kZWZpbmVkLlxuICBwcml2YXRlIHN0YXRpYyBkaW0gPSAobjogbnVtYmVyKSA9PiBBcnJheShuICsgMSlcbiAgcHJpdmF0ZSBzdGF0aWMgbG9nMTAgPSAoeDogbnVtYmVyKSA9PiBNYXRoLmxvZyh4KSAvIE1hdGguTE4xMFxuXG4gIC8vIE1ha2UgYSAxLWJhc2VkIDJEIGFycmF5LCB3aXRoIHIgcm93cyBhbmQgYyBjb2x1bW5zLiBUaGUgaW5pdGlhbCB2YWx1ZXMgYXJlIHVuZGVmaW5lZC5cbiAgcHJpdmF0ZSBzdGF0aWMgZGltMihyOiBudW1iZXIsIGM6IG51bWJlcik6IG51bWJlcltdW10ge1xuICAgIGxldCBhID0gbmV3IEFycmF5KHIgKyAxKVxuICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IHI7ICsraSkgYVtpXSA9IFNvbHZlci5kaW0oYylcbiAgICByZXR1cm4gYVxuICB9XG5cbiAgLy8gR2VuZXJhdGUgc3RlcCBzaXplIHNlcXVlbmNlIGFuZCByZXR1cm4gYXMgYSAxLWJhc2VkIGFycmF5IG9mIGxlbmd0aCBuLlxuICBzdGF0aWMgc3RlcFNpemVTZXF1ZW5jZShuU2VxOiBudW1iZXIsIG46IG51bWJlcik6IG51bWJlcltdIHtcbiAgICBjb25zdCBhID0gbmV3IEFycmF5KG4gKyAxKVxuICAgIGFbMF0gPSAwXG4gICAgc3dpdGNoIChuU2VxKSB7XG4gICAgICBjYXNlIDE6XG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG47ICsraSkgYVtpXSA9IDIgKiBpXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlIDI6XG4gICAgICAgIGFbMV0gPSAyXG4gICAgICAgIGZvciAobGV0IGkgPSAyOyBpIDw9IG47ICsraSkgYVtpXSA9IDQgKiBpIC0gNFxuICAgICAgICBicmVha1xuICAgICAgY2FzZSAzOlxuICAgICAgICBhWzFdID0gMlxuICAgICAgICBhWzJdID0gNFxuICAgICAgICBhWzNdID0gNlxuICAgICAgICBmb3IgKGxldCBpID0gNDsgaSA8PSBuOyArK2kpIGFbaV0gPSAyICogYVtpIC0gMl1cbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgNDpcbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbjsgKytpKSBhW2ldID0gNCAqIGkgLSAyXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlIDU6XG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG47ICsraSkgYVtpXSA9IDQgKiBpXG4gICAgICAgIGJyZWFrXG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2ludmFsaWQgc3RlcFNpemVTZXF1ZW5jZSBzZWxlY3RlZCcpXG4gICAgfVxuICAgIHJldHVybiBhXG4gIH1cblxuICAvLyBJbnRlZ3JhdGUgdGhlIGRpZmZlcmVudGlhbCBzeXN0ZW0gcmVwcmVzZW50ZWQgYnkgZiwgZnJvbSB4IHRvIHhFbmQsIHdpdGggaW5pdGlhbCBkYXRhIHkuXG4gIC8vIHNvbE91dCwgaWYgcHJvdmlkZWQsIGlzIGNhbGxlZCBhdCBlYWNoIGludGVncmF0aW9uIHN0ZXAuXG4gIHNvbHZlKGY6IERlcml2YXRpdmUsXG4gICAgICAgIHg6IG51bWJlcixcbiAgICAgICAgeTA6IG51bWJlcltdLFxuICAgICAgICB4RW5kOiBudW1iZXIsXG4gICAgICAgIHNvbE91dD86IE91dHB1dEZ1bmN0aW9uKSB7XG5cbiAgICAvLyBNYWtlIGEgY29weSBvZiB5MCwgMS1iYXNlZC4gV2UgbGVhdmUgdGhlIHVzZXIncyBwYXJhbWV0ZXJzIGFsb25lIHNvIHRoYXQgdGhleSBtYXkgYmUgcmV1c2VkIGlmIGRlc2lyZWQuXG4gICAgbGV0IHkgPSBbMF0uY29uY2F0KHkwKVxuICAgIGxldCBkeiA9IFNvbHZlci5kaW0odGhpcy5uKVxuICAgIGxldCB5aDEgPSBTb2x2ZXIuZGltKHRoaXMubilcbiAgICBsZXQgeWgyID0gU29sdmVyLmRpbSh0aGlzLm4pXG4gICAgaWYgKHRoaXMubWF4U3RlcHMgPD0gMCkgdGhyb3cgbmV3IEVycm9yKCdtYXhTdGVwcyBtdXN0IGJlIHBvc2l0aXZlJylcbiAgICBjb25zdCBrbSA9IHRoaXMubWF4RXh0cmFwb2xhdGlvbkNvbHVtbnNcbiAgICBpZiAoa20gPD0gMikgdGhyb3cgbmV3IEVycm9yKCdtYXhFeHRyYXBvbGF0aW9uQ29sdW1ucyBtdXN0IGJlID4gMicpXG4gICAgY29uc3QgblNlcSA9IHRoaXMuc3RlcFNpemVTZXF1ZW5jZSB8fCAodGhpcy5kZW5zZU91dHB1dCA/IDQgOiAxKVxuICAgIGlmIChuU2VxIDw9IDMgJiYgdGhpcy5kZW5zZU91dHB1dCkgdGhyb3cgbmV3IEVycm9yKCdzdGVwU2l6ZVNlcXVlbmNlIGluY29tcGF0aWJsZSB3aXRoIGRlbnNlT3V0cHV0JylcbiAgICBpZiAodGhpcy5kZW5zZU91dHB1dCAmJiAhc29sT3V0KSB0aHJvdyBuZXcgRXJyb3IoJ2RlbnNlT3V0cHV0IHJlcXVpcmVzIGEgc29sdXRpb24gb2JzZXJ2ZXIgZnVuY3Rpb24nKVxuICAgIGlmICh0aGlzLmludGVycG9sYXRpb25Gb3JtdWxhRGVncmVlIDw9IDAgfHwgdGhpcy5pbnRlcnBvbGF0aW9uRm9ybXVsYURlZ3JlZSA+PSA3KSB0aHJvdyBuZXcgRXJyb3IoJ2JhZCBpbnRlcnBvbGF0aW9uRm9ybXVsYURlZ3JlZScpXG4gICAgbGV0IGljb20gPSBbMF0gIC8vIGljb20gd2lsbCBiZSAxLWJhc2VkLCBzbyBzdGFydCB3aXRoIGEgcGFkIGVudHJ5LlxuICAgIGxldCBucmRlbnMgPSAwXG4gICAgaWYgKHRoaXMuZGVuc2VPdXRwdXQpIHtcbiAgICAgIGlmICh0aGlzLmRlbnNlQ29tcG9uZW50cykge1xuICAgICAgICBmb3IgKGxldCBjIG9mIHRoaXMuZGVuc2VDb21wb25lbnRzKSB7XG4gICAgICAgICAgLy8gY29udmVydCBkZW5zZSBjb21wb25lbnRzIHJlcXVlc3RlZCBpbnRvIG9uZS1iYXNlZCBpbmRleGluZy5cbiAgICAgICAgICBpZiAoYyA8IDAgfHwgYyA+IHRoaXMubikgdGhyb3cgbmV3IEVycm9yKCdiYWQgZGVuc2UgY29tcG9uZW50OiAnICsgYylcbiAgICAgICAgICBpY29tLnB1c2goYyArIDEpXG4gICAgICAgICAgKytucmRlbnNcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gaWYgdXNlciBhc2tlZCBmb3IgZGVuc2Ugb3V0cHV0IGJ1dCBkaWQgbm90IHNwZWNpZnkgYW55IGRlbnNlQ29tcG9uZW50cyxcbiAgICAgICAgLy8gcmVxdWVzdCBhbGwgb2YgdGhlbS5cbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gdGhpcy5uOyArK2kpIHtcbiAgICAgICAgICBpY29tLnB1c2goaSlcbiAgICAgICAgfVxuICAgICAgICBucmRlbnMgPSB0aGlzLm5cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRoaXMudVJvdW5kIDw9IDFlLTM1IHx8IHRoaXMudVJvdW5kID4gMSkgdGhyb3cgbmV3IEVycm9yKCdzdXNwaWNpb3VzIHZhbHVlIG9mIHVSb3VuZCcpXG4gICAgY29uc3QgaE1heCA9IE1hdGguYWJzKHRoaXMubWF4U3RlcFNpemUgfHwgeEVuZCAtIHgpXG4gICAgY29uc3QgbGZTYWZlID0gMiAqIGttICoga20gKyBrbVxuXG4gICAgZnVuY3Rpb24gZXhwYW5kVG9BcnJheSh4OiBudW1iZXJ8bnVtYmVyW10sIG46IG51bWJlcik6IG51bWJlcltdIHtcbiAgICAgIC8vIElmIHggaXMgYW4gYXJyYXksIHJldHVybiBhIDEtYmFzZWQgY29weSBvZiBpdC4gSWYgeCBpcyBhIG51bWJlciwgcmV0dXJuIGEgbmV3IDEtYmFzZWQgYXJyYXlcbiAgICAgIC8vIGNvbnNpc3Rpbmcgb2YgbiBjb3BpZXMgb2YgdGhlIG51bWJlci5cbiAgICAgIGNvbnN0IHRvbEFycmF5ID0gWzBdXG4gICAgICBpZiAoQXJyYXkuaXNBcnJheSh4KSkge1xuICAgICAgICByZXR1cm4gdG9sQXJyYXkuY29uY2F0KHgpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG47ICsraSkgdG9sQXJyYXkucHVzaCh4KVxuICAgICAgICByZXR1cm4gdG9sQXJyYXlcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBhVG9sID0gZXhwYW5kVG9BcnJheSh0aGlzLmFic29sdXRlVG9sZXJhbmNlLCB0aGlzLm4pXG4gICAgY29uc3QgclRvbCA9IGV4cGFuZFRvQXJyYXkodGhpcy5yZWxhdGl2ZVRvbGVyYW5jZSwgdGhpcy5uKVxuICAgIGxldCBbbkV2YWwsIG5TdGVwLCBuQWNjZXB0LCBuUmVqZWN0XSA9IFswLCAwLCAwLCAwXVxuXG4gICAgLy8gY2FsbCB0byBjb3JlIGludGVncmF0b3JcbiAgICBjb25zdCBucmQgPSBNYXRoLm1heCgxLCBucmRlbnMpXG4gICAgY29uc3QgbmNvbSA9IE1hdGgubWF4KDEsICgyICoga20gKyA1KSAqIG5yZGVucylcbiAgICBjb25zdCBkZW5zID0gU29sdmVyLmRpbShuY29tKVxuICAgIGNvbnN0IGZTYWZlID0gU29sdmVyLmRpbTIobGZTYWZlLCBucmQpXG5cbiAgICAvLyBXcmFwIGYgaW4gYSBmdW5jdGlvbiBGIHdoaWNoIGhpZGVzIHRoZSBvbmUtYmFzZWQgaW5kZXhpbmcgZnJvbSB0aGUgY3VzdG9tZXJzLlxuICAgIGNvbnN0IEYgPSAoeDogbnVtYmVyLCB5OiBudW1iZXJbXSwgeXA6IG51bWJlcltdKSA9PiB7XG4gICAgICBsZXQgcmV0ID0gZih4LCB5LnNsaWNlKDEpKVxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZXQubGVuZ3RoOyArK2kpIHlwW2kgKyAxXSA9IHJldFtpXVxuICAgIH1cblxuICAgIGxldCBvZHhjb3IgPSAoKTogT3V0Y29tZSA9PiB7XG4gICAgICAvLyBUaGUgZm9sbG93aW5nIHRocmVlIHZhcmlhYmxlcyBhcmUgQ09NTU9OL0NPTlRFWC9cbiAgICAgIGxldCB4T2xkZDogbnVtYmVyXG4gICAgICBsZXQgaGhoOiBudW1iZXJcbiAgICAgIGxldCBrbWl0OiBudW1iZXJcblxuICAgICAgbGV0IGFjY2VwdFN0ZXAgPSAobjogbnVtYmVyKTogYm9vbGVhbiA9PiB7ICAgLy8gbGFiZWwgNjBcbiAgICAgICAgLy8gUmV0dXJucyB0cnVlIGlmIHdlIHNob3VsZCBjb250aW51ZSB0aGUgaW50ZWdyYXRpb24uIFRoZSBvbmx5IHRpbWUgZmFsc2VcbiAgICAgICAgLy8gaXMgcmV0dXJuZWQgaXMgd2hlbiB0aGUgdXNlcidzIHNvbHV0aW9uIG9ic2VydmF0aW9uIGZ1bmN0aW9uIGhhcyByZXR1cm5lZCBmYWxzZSxcbiAgICAgICAgLy8gaW5kaWNhdGluZyB0aGF0IHNoZSBkb2VzIG5vdCB3aXNoIHRvIGNvbnRpbnVlIHRoZSBjb21wdXRhdGlvbi5cbiAgICAgICAgeE9sZCA9IHhcbiAgICAgICAgeCArPSBoXG4gICAgICAgIGlmICh0aGlzLmRlbnNlT3V0cHV0KSB7XG4gICAgICAgICAgLy8ga21pdCA9IG11IG9mIHRoZSBwYXBlclxuICAgICAgICAgIGttaXQgPSAyICoga2MgLSB0aGlzLmludGVycG9sYXRpb25Gb3JtdWxhRGVncmVlICsgMVxuICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG5yZDsgKytpKSBkZW5zW2ldID0geVtpY29tW2ldXVxuICAgICAgICAgIHhPbGRkID0geE9sZFxuICAgICAgICAgIGhoaCA9IGggIC8vIG5vdGU6IHhPbGRkIGFuZCBoaGggYXJlIHBhcnQgb2YgL0NPTk9EWC9cbiAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBucmQ7ICsraSkgZGVuc1tucmQgKyBpXSA9IGggKiBkeltpY29tW2ldXVxuICAgICAgICAgIGxldCBrbG4gPSAyICogbnJkXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbnJkOyArK2kpIGRlbnNba2xuICsgaV0gPSB0WzFdW2ljb21baV1dXG4gICAgICAgICAgLy8gY29tcHV0ZSBzb2x1dGlvbiBhdCBtaWQtcG9pbnRcbiAgICAgICAgICBmb3IgKGxldCBqID0gMjsgaiA8PSBrYzsgKytqKSB7XG4gICAgICAgICAgICBsZXQgZGJsZW5qID0gbmpbal1cbiAgICAgICAgICAgIGZvciAobGV0IGwgPSBqOyBsID49IDI7IC0tbCkge1xuICAgICAgICAgICAgICBsZXQgZmFjdG9yID0gKGRibGVuaiAvIG5qW2wgLSAxXSkgKiogMiAtIDFcbiAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbnJkOyArK2kpIHtcbiAgICAgICAgICAgICAgICB5U2FmZVtsIC0gMV1baV0gPSB5U2FmZVtsXVtpXSArICh5U2FmZVtsXVtpXSAtIHlTYWZlW2wgLSAxXVtpXSkgLyBmYWN0b3JcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBsZXQga3JuID0gNCAqIG5yZFxuICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG5yZDsgKytpKSBkZW5zW2tybiArIGldID0geVNhZmVbMV1baV1cbiAgICAgICAgICAvLyBjb21wdXRlIGZpcnN0IGRlcml2YXRpdmUgYXQgcmlnaHQgZW5kXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbjsgKytpKSB5aDFbaV0gPSB0WzFdW2ldXG4gICAgICAgICAgRih4LCB5aDEsIHloMilcbiAgICAgICAgICBrcm4gPSAzICogbnJkXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbnJkOyArK2kpIGRlbnNba3JuICsgaV0gPSB5aDJbaWNvbVtpXV0gKiBoXG4gICAgICAgICAgLy8gVEhFIExPT1BcbiAgICAgICAgICBmb3IgKGxldCBrbWkgPSAxOyBrbWkgPD0ga21pdDsgKytrbWkpIHtcbiAgICAgICAgICAgIC8vIGNvbXB1dGUga21pLXRoIGRlcml2YXRpdmUgYXQgbWlkLXBvaW50XG4gICAgICAgICAgICBsZXQga2JlZyA9IChrbWkgKyAxKSAvIDIgfCAwXG4gICAgICAgICAgICBmb3IgKGxldCBrayA9IGtiZWc7IGtrIDw9IGtjOyArK2trKSB7XG4gICAgICAgICAgICAgIGxldCBmYWNuaiA9IChualtra10gLyAyKSAqKiAoa21pIC0gMSlcbiAgICAgICAgICAgICAgaVB0ID0gaVBvaW50W2trICsgMV0gLSAyICoga2sgKyBrbWlcbiAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbnJkOyArK2kpIHtcbiAgICAgICAgICAgICAgICB5U2FmZVtra11baV0gPSBmU2FmZVtpUHRdW2ldICogZmFjbmpcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChsZXQgaiA9IGtiZWcgKyAxOyBqIDw9IGtjOyArK2opIHtcbiAgICAgICAgICAgICAgbGV0IGRibGVuaiA9IG5qW2pdXG4gICAgICAgICAgICAgIGZvciAobGV0IGwgPSBqOyBsID49IGtiZWcgKyAxOyAtLWwpIHtcbiAgICAgICAgICAgICAgICBsZXQgZmFjdG9yID0gKGRibGVuaiAvIG5qW2wgLSAxXSkgKiogMiAtIDFcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBucmQ7ICsraSkge1xuICAgICAgICAgICAgICAgICAgeVNhZmVbbCAtIDFdW2ldID0geVNhZmVbbF1baV0gKyAoeVNhZmVbbF1baV0gLSB5U2FmZVtsIC0gMV1baV0pIC8gZmFjdG9yXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBrcm4gPSAoa21pICsgNCkgKiBucmRcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG5yZDsgKytpKSBkZW5zW2tybiArIGldID0geVNhZmVba2JlZ11baV0gKiBoXG4gICAgICAgICAgICBpZiAoa21pID09PSBrbWl0KSBjb250aW51ZVxuICAgICAgICAgICAgLy8gY29tcHV0ZSBkaWZmZXJlbmNlc1xuICAgICAgICAgICAgZm9yIChsZXQga2sgPSAoa21pICsgMikgLyAyIHwgMDsga2sgPD0ga2M7ICsra2spIHtcbiAgICAgICAgICAgICAgbGV0IGxiZWcgPSBpUG9pbnRba2sgKyAxXVxuICAgICAgICAgICAgICBsZXQgbGVuZCA9IGlQb2ludFtra10gKyBrbWkgKyAxXG4gICAgICAgICAgICAgIGlmIChrbWkgPT09IDEgJiYgblNlcSA9PT0gNCkgbGVuZCArPSAyXG4gICAgICAgICAgICAgIGxldCBsOiBudW1iZXJcbiAgICAgICAgICAgICAgZm9yIChsID0gbGJlZzsgbCA+PSBsZW5kOyBsIC09IDIpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBucmQ7ICsraSkge1xuICAgICAgICAgICAgICAgICAgZlNhZmVbbF1baV0gLT0gZlNhZmVbbCAtIDJdW2ldXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChrbWkgPT09IDEgJiYgblNlcSA9PT0gNCkge1xuICAgICAgICAgICAgICAgIGwgPSBsZW5kIC0gMlxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG5yZDsgKytpKSBmU2FmZVtsXVtpXSAtPSBkeltpY29tW2ldXVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBjb21wdXRlIGRpZmZlcmVuY2VzXG4gICAgICAgICAgICBmb3IgKGxldCBrayA9IChrbWkgKyAyKSAvIDIgfCAwOyBrayA8PSBrYzsgKytraykge1xuICAgICAgICAgICAgICBsZXQgbGJlZyA9IGlQb2ludFtrayArIDFdIC0gMVxuICAgICAgICAgICAgICBsZXQgbGVuZCA9IGlQb2ludFtra10gKyBrbWkgKyAyXG4gICAgICAgICAgICAgIGZvciAobGV0IGwgPSBsYmVnOyBsID49IGxlbmQ7IGwgLT0gMikge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG5yZDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICBmU2FmZVtsXVtpXSAtPSBmU2FmZVtsIC0gMl1baV1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaW50ZXJwKG5yZCwgZGVucywga21pdClcbiAgICAgICAgICAvLyBlc3RpbWF0aW9uIG9mIGludGVycG9sYXRpb24gZXJyb3JcbiAgICAgICAgICBpZiAodGhpcy5kZW5zZU91dHB1dEVycm9yRXN0aW1hdG9yICYmIGttaXQgPj0gMSkge1xuICAgICAgICAgICAgbGV0IGVycmludCA9IDBcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG5yZDsgKytpKSBlcnJpbnQgKz0gKGRlbnNbKGttaXQgKyA0KSAqIG5yZCArIGldIC8gc2NhbFtpY29tW2ldXSkgKiogMlxuICAgICAgICAgICAgZXJyaW50ID0gTWF0aC5zcXJ0KGVycmludCAvIG5yZCkgKiBlcnJmYWNba21pdF1cbiAgICAgICAgICAgIGhvcHRkZSA9IGggLyBNYXRoLm1heChlcnJpbnQgKiogKDEgLyAoa21pdCArIDQpKSwgMC4wMSlcbiAgICAgICAgICAgIGlmIChlcnJpbnQgPiAxMCkge1xuICAgICAgICAgICAgICBoID0gaG9wdGRlXG4gICAgICAgICAgICAgIHggPSB4T2xkXG4gICAgICAgICAgICAgICsrblJlamVjdFxuICAgICAgICAgICAgICByZWplY3QgPSB0cnVlXG4gICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG47ICsraSkgZHpbaV0gPSB5aDJbaV1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBuOyArK2kpIHlbaV0gPSB0WzFdW2ldXG4gICAgICAgICsrbkFjY2VwdFxuICAgICAgICBpZiAoc29sT3V0KSB7XG4gICAgICAgICAgLy8gSWYgZGVuc2VPdXRwdXQsIHdlIGFsc28gd2FudCB0byBzdXBwbHkgdGhlIGRlbnNlIGNsb3N1cmUuXG4gICAgICAgICAgaWYgKHNvbE91dChuQWNjZXB0ICsgMSwgeE9sZCwgeCwgeS5zbGljZSgxKSxcbiAgICAgICAgICAgICAgdGhpcy5kZW5zZU91dHB1dCAmJiBjb250ZXgoeE9sZGQsIGhoaCwga21pdCwgZGVucywgaWNvbSkpID09PSBmYWxzZSkgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cbiAgICAgICAgLy8gY29tcHV0ZSBvcHRpbWFsIG9yZGVyXG4gICAgICAgIGxldCBrb3B0OiBudW1iZXJcbiAgICAgICAgaWYgKGtjID09PSAyKSB7XG4gICAgICAgICAga29wdCA9IE1hdGgubWluKDMsIGttIC0gMSlcbiAgICAgICAgICBpZiAocmVqZWN0KSBrb3B0ID0gMlxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChrYyA8PSBrKSB7XG4gICAgICAgICAgICBrb3B0ID0ga2NcbiAgICAgICAgICAgIGlmICh3W2tjIC0gMV0gPCB3W2tjXSAqIHRoaXMuc3RlcFNpemVGYWMzKSBrb3B0ID0ga2MgLSAxXG4gICAgICAgICAgICBpZiAod1trY10gPCB3W2tjIC0gMV0gKiB0aGlzLnN0ZXBTaXplRmFjNCkga29wdCA9IE1hdGgubWluKGtjICsgMSwga20gLSAxKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBrb3B0ID0ga2MgLSAxXG4gICAgICAgICAgICBpZiAoa2MgPiAzICYmIHdba2MgLSAyXSA8IHdba2MgLSAxXSAqIHRoaXMuc3RlcFNpemVGYWMzKSBrb3B0ID0ga2MgLSAyXG4gICAgICAgICAgICBpZiAod1trY10gPCB3W2tvcHRdICogdGhpcy5zdGVwU2l6ZUZhYzQpIGtvcHQgPSBNYXRoLm1pbihrYywga20gLSAxKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBhZnRlciBhIHJlamVjdGVkIHN0ZXBcbiAgICAgICAgaWYgKHJlamVjdCkge1xuICAgICAgICAgIGsgPSBNYXRoLm1pbihrb3B0LCBrYylcbiAgICAgICAgICBoID0gcG9zbmVnICogTWF0aC5taW4oTWF0aC5hYnMoaCksIE1hdGguYWJzKGhoW2tdKSlcbiAgICAgICAgICByZWplY3QgPSBmYWxzZVxuICAgICAgICAgIHJldHVybiB0cnVlICAvLyBnb3RvIDEwXG4gICAgICAgIH1cbiAgICAgICAgaWYgKGtvcHQgPD0ga2MpIHtcbiAgICAgICAgICBoID0gaGhba29wdF1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoa2MgPCBrICYmIHdba2NdIDwgd1trYyAtIDFdICogdGhpcy5zdGVwU2l6ZUZhYzQpIHtcbiAgICAgICAgICAgIGggPSBoaFtrY10gKiBhW2tvcHQgKyAxXSAvIGFba2NdXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGggPSBoaFtrY10gKiBhW2tvcHRdIC8gYVtrY11cbiAgICAgICAgICB9XG5cblxuICAgICAgICB9XG4gICAgICAgIC8vIGNvbXB1dGUgc3RlcHNpemUgZm9yIG5leHQgc3RlcFxuICAgICAgICBrID0ga29wdFxuICAgICAgICBoID0gcG9zbmVnICogTWF0aC5hYnMoaClcbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgIH1cblxuICAgICAgbGV0IG1pZGV4ID0gKGo6IG51bWJlcik6IHZvaWQgPT4ge1xuICAgICAgICBjb25zdCBkeSA9IFNvbHZlci5kaW0odGhpcy5uKVxuICAgICAgICAvLyBDb21wdXRlcyB0aGUganRoIGxpbmUgb2YgdGhlIGV4dHJhcG9sYXRpb24gdGFibGUgYW5kXG4gICAgICAgIC8vIHByb3ZpZGVzIGFuIGVzdGltYXRpb24gb2YgdGhlIG9wdGlvbmFsIHN0ZXBzaXplXG4gICAgICAgIGNvbnN0IGhqID0gaCAvIG5qW2pdXG4gICAgICAgIC8vIEV1bGVyIHN0YXJ0aW5nIHN0ZXBcbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gdGhpcy5uOyArK2kpIHtcbiAgICAgICAgICB5aDFbaV0gPSB5W2ldXG4gICAgICAgICAgeWgyW2ldID0geVtpXSArIGhqICogZHpbaV1cbiAgICAgICAgfVxuICAgICAgICAvLyBFeHBsaWNpdCBtaWRwb2ludCBydWxlXG4gICAgICAgIGNvbnN0IG0gPSBualtqXSAtIDFcbiAgICAgICAgY29uc3QgbmpNaWQgPSAobmpbal0gLyAyKSB8IDBcbiAgICAgICAgZm9yIChsZXQgbW0gPSAxOyBtbSA8PSBtOyArK21tKSB7XG4gICAgICAgICAgaWYgKHRoaXMuZGVuc2VPdXRwdXQgJiYgbW0gPT09IG5qTWlkKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBucmQ7ICsraSkge1xuICAgICAgICAgICAgICB5U2FmZVtqXVtpXSA9IHloMltpY29tW2ldXVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBGKHggKyBoaiAqIG1tLCB5aDIsIGR5KVxuICAgICAgICAgIGlmICh0aGlzLmRlbnNlT3V0cHV0ICYmIE1hdGguYWJzKG1tIC0gbmpNaWQpIDw9IDIgKiBqIC0gMSkge1xuICAgICAgICAgICAgKytpUHRcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG5yZDsgKytpKSB7XG4gICAgICAgICAgICAgIGZTYWZlW2lQdF1baV0gPSBkeVtpY29tW2ldXVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSB0aGlzLm47ICsraSkge1xuICAgICAgICAgICAgbGV0IHlzID0geWgxW2ldXG4gICAgICAgICAgICB5aDFbaV0gPSB5aDJbaV1cbiAgICAgICAgICAgIHloMltpXSA9IHlzICsgMiAqIGhqICogZHlbaV1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG1tIDw9IHRoaXMuc3RhYmlsaXR5Q2hlY2tDb3VudCAmJiBqIDw9IHRoaXMuc3RhYmlsaXR5Q2hlY2tUYWJsZUxpbmVzKSB7XG4gICAgICAgICAgICAvLyBzdGFiaWxpdHkgY2hlY2tcbiAgICAgICAgICAgIGxldCBkZWwxID0gMFxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gdGhpcy5uOyArK2kpIHtcbiAgICAgICAgICAgICAgZGVsMSArPSAoZHpbaV0gLyBzY2FsW2ldKSAqKiAyXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgZGVsMiA9IDBcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IHRoaXMubjsgKytpKSB7XG4gICAgICAgICAgICAgIGRlbDIgKz0gKChkeVtpXSAtIGR6W2ldKSAvIHNjYWxbaV0pICoqIDJcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHF1b3QgPSBkZWwyIC8gTWF0aC5tYXgodGhpcy51Um91bmQsIGRlbDEpXG4gICAgICAgICAgICBpZiAocXVvdCA+IDQpIHtcbiAgICAgICAgICAgICAgKytuRXZhbFxuICAgICAgICAgICAgICBhdG92ID0gdHJ1ZVxuICAgICAgICAgICAgICBoICo9IHRoaXMuc3RlcFNpemVSZWR1Y3Rpb25GYWN0b3JcbiAgICAgICAgICAgICAgcmVqZWN0ID0gdHJ1ZVxuICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gZmluYWwgc21vb3RoaW5nIHN0ZXBcbiAgICAgICAgRih4ICsgaCwgeWgyLCBkeSlcbiAgICAgICAgaWYgKHRoaXMuZGVuc2VPdXRwdXQgJiYgbmpNaWQgPD0gMiAqIGogLSAxKSB7XG4gICAgICAgICAgKytpUHRcbiAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBucmQ7ICsraSkge1xuICAgICAgICAgICAgZlNhZmVbaVB0XVtpXSA9IGR5W2ljb21baV1dXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IHRoaXMubjsgKytpKSB7XG4gICAgICAgICAgdFtqXVtpXSA9ICh5aDFbaV0gKyB5aDJbaV0gKyBoaiAqIGR5W2ldKSAvIDJcbiAgICAgICAgfVxuICAgICAgICBuRXZhbCArPSBualtqXVxuICAgICAgICAvLyBwb2x5bm9taWFsIGV4dHJhcG9sYXRpb25cbiAgICAgICAgaWYgKGogPT09IDEpIHJldHVybiAgLy8gd2FzIGouZXEuMVxuICAgICAgICBjb25zdCBkYmxlbmogPSBualtqXVxuICAgICAgICBsZXQgZmFjOiBudW1iZXJcbiAgICAgICAgZm9yIChsZXQgbCA9IGo7IGwgPiAxOyAtLWwpIHtcbiAgICAgICAgICBmYWMgPSAoZGJsZW5qIC8gbmpbbCAtIDFdKSAqKiAyIC0gMVxuICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IHRoaXMubjsgKytpKSB7XG4gICAgICAgICAgICB0W2wgLSAxXVtpXSA9IHRbbF1baV0gKyAodFtsXVtpXSAtIHRbbCAtIDFdW2ldKSAvIGZhY1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlcnIgPSAwXG4gICAgICAgIC8vIHNjYWxpbmdcbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gdGhpcy5uOyArK2kpIHtcbiAgICAgICAgICBsZXQgdDFpID0gTWF0aC5tYXgoTWF0aC5hYnMoeVtpXSksIE1hdGguYWJzKHRbMV1baV0pKVxuICAgICAgICAgIHNjYWxbaV0gPSBhVG9sW2ldICsgclRvbFtpXSAqIHQxaVxuICAgICAgICAgIGVyciArPSAoKHRbMV1baV0gLSB0WzJdW2ldKSAvIHNjYWxbaV0pICoqIDJcbiAgICAgICAgfVxuICAgICAgICBlcnIgPSBNYXRoLnNxcnQoZXJyIC8gdGhpcy5uKVxuICAgICAgICBpZiAoZXJyICogdGhpcy51Um91bmQgPj0gMSB8fCAoaiA+IDIgJiYgZXJyID49IGVyck9sZCkpIHtcbiAgICAgICAgICBhdG92ID0gdHJ1ZVxuICAgICAgICAgIGggKj0gdGhpcy5zdGVwU2l6ZVJlZHVjdGlvbkZhY3RvclxuICAgICAgICAgIHJlamVjdCA9IHRydWVcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBlcnJPbGQgPSBNYXRoLm1heCg0ICogZXJyLCAxKVxuICAgICAgICAvLyBjb21wdXRlIG9wdGltYWwgc3RlcHNpemVzXG4gICAgICAgIGxldCBleHAwID0gMSAvICgyICogaiAtIDEpXG4gICAgICAgIGxldCBmYWNNaW4gPSB0aGlzLnN0ZXBTaXplRmFjMSAqKiBleHAwXG4gICAgICAgIGZhYyA9IE1hdGgubWluKHRoaXMuc3RlcFNpemVGYWMyIC8gZmFjTWluLFxuICAgICAgICAgIE1hdGgubWF4KGZhY01pbiwgKGVyciAvIHRoaXMuc3RlcFNhZmV0eUZhY3RvcjEpICoqIGV4cDAgLyB0aGlzLnN0ZXBTYWZldHlGYWN0b3IyKSlcbiAgICAgICAgZmFjID0gMSAvIGZhY1xuICAgICAgICBoaFtqXSA9IE1hdGgubWluKE1hdGguYWJzKGgpICogZmFjLCBoTWF4KVxuICAgICAgICB3W2pdID0gYVtqXSAvIGhoW2pdXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGludGVycCA9IChuOiBudW1iZXIsIHk6IG51bWJlcltdLCBpbWl0OiBudW1iZXIpID0+IHtcbiAgICAgICAgLy8gY29tcHV0ZXMgdGhlIGNvZWZmaWNpZW50cyBvZiB0aGUgaW50ZXJwb2xhdGlvbiBmb3JtdWxhXG4gICAgICAgIGxldCBhID0gbmV3IEFycmF5KDMxKSAgLy8gemVyby1iYXNlZDogMDozMFxuICAgICAgICAvLyBiZWdpbiB3aXRoIEhlcm1pdGUgaW50ZXJwb2xhdGlvblxuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBuOyArK2kpIHtcbiAgICAgICAgICBsZXQgeTAgPSB5W2ldXG4gICAgICAgICAgbGV0IHkxID0geVsyICogbiArIGldXG4gICAgICAgICAgbGV0IHlwMCA9IHlbbiArIGldXG4gICAgICAgICAgbGV0IHlwMSA9IHlbMyAqIG4gKyBpXVxuICAgICAgICAgIGxldCB5RGlmZiA9IHkxIC0geTBcbiAgICAgICAgICBsZXQgYXNwbCA9IC15cDEgKyB5RGlmZlxuICAgICAgICAgIGxldCBic3BsID0geXAwIC0geURpZmZcbiAgICAgICAgICB5W24gKyBpXSA9IHlEaWZmXG4gICAgICAgICAgeVsyICogbiArIGldID0gYXNwbFxuICAgICAgICAgIHlbMyAqIG4gKyBpXSA9IGJzcGxcbiAgICAgICAgICBpZiAoaW1pdCA8IDApIGNvbnRpbnVlXG4gICAgICAgICAgLy8gY29tcHV0ZSB0aGUgZGVyaXZhdGl2ZXMgb2YgSGVybWl0ZSBhdCBtaWRwb2ludFxuICAgICAgICAgIGxldCBwaDAgPSAoeTAgKyB5MSkgKiAwLjUgKyAwLjEyNSAqIChhc3BsICsgYnNwbClcbiAgICAgICAgICBsZXQgcGgxID0geURpZmYgKyAoYXNwbCAtIGJzcGwpICogMC4yNVxuICAgICAgICAgIGxldCBwaDIgPSAtKHlwMCAtIHlwMSlcbiAgICAgICAgICBsZXQgcGgzID0gNiAqIChic3BsIC0gYXNwbClcbiAgICAgICAgICAvLyBjb21wdXRlIHRoZSBmdXJ0aGVyIGNvZWZmaWNpZW50c1xuICAgICAgICAgIGlmIChpbWl0ID49IDEpIHtcbiAgICAgICAgICAgIGFbMV0gPSAxNiAqICh5WzUgKiBuICsgaV0gLSBwaDEpXG4gICAgICAgICAgICBpZiAoaW1pdCA+PSAzKSB7XG4gICAgICAgICAgICAgIGFbM10gPSAxNiAqICh5WzcgKiBuICsgaV0gLSBwaDMgKyAzICogYVsxXSlcbiAgICAgICAgICAgICAgaWYgKGltaXQgPj0gNSkge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGltID0gNTsgaW0gPD0gaW1pdDsgaW0gKz0gMikge1xuICAgICAgICAgICAgICAgICAgbGV0IGZhYzEgPSBpbSAqIChpbSAtIDEpIC8gMlxuICAgICAgICAgICAgICAgICAgbGV0IGZhYzIgPSBmYWMxICogKGltIC0gMikgKiAoaW0gLSAzKSAqIDJcbiAgICAgICAgICAgICAgICAgIGFbaW1dID0gMTYgKiAoeVsoaW0gKyA0KSAqIG4gKyBpXSArIGZhYzEgKiBhW2ltIC0gMl0gLSBmYWMyICogYVtpbSAtIDRdKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBhWzBdID0gKHlbNCAqIG4gKyBpXSAtIHBoMCkgKiAxNlxuICAgICAgICAgIGlmIChpbWl0ID49IDIpIHtcbiAgICAgICAgICAgIGFbMl0gPSAoeVtuICogNiArIGldIC0gcGgyICsgYVswXSkgKiAxNlxuICAgICAgICAgICAgaWYgKGltaXQgPj0gNCkge1xuICAgICAgICAgICAgICBmb3IgKGxldCBpbSA9IDQ7IGltIDw9IGltaXQ7IGltICs9IDIpIHtcbiAgICAgICAgICAgICAgICBsZXQgZmFjMSA9IGltICogKGltIC0gMSkgLyAyXG4gICAgICAgICAgICAgICAgbGV0IGZhYzIgPSBpbSAqIChpbSAtIDEpICogKGltIC0gMikgKiAoaW0gLSAzKVxuICAgICAgICAgICAgICAgIGFbaW1dID0gKHlbbiAqIChpbSArIDQpICsgaV0gKyBhW2ltIC0gMl0gKiBmYWMxIC0gYVtpbSAtIDRdICogZmFjMikgKiAxNlxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGZvciAobGV0IGltID0gMDsgaW0gPD0gaW1pdDsgKytpbSkgeVtuICogKGltICsgNCkgKyBpXSA9IGFbaW1dXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgY29udGV4ID0gKHhPbGQ6IG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICBoOiBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgaW1pdDogbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgIHk6IG51bWJlcltdLFxuICAgICAgICAgICAgICAgICAgICAgIGljb206IG51bWJlcltdKSA9PiB7XG4gICAgICAgIHJldHVybiAoYzogbnVtYmVyLCB4OiBudW1iZXIpID0+IHtcbiAgICAgICAgICBsZXQgaSA9IDBcbiAgICAgICAgICBmb3IgKGxldCBqID0gMTsgaiA8PSBucmQ7ICsraikge1xuICAgICAgICAgICAgLy8gY2FyZWZ1bDogY3VzdG9tZXJzIGRlc2NyaWJlIGNvbXBvbmVudHMgMC1iYXNlZC4gV2UgcmVjb3JkIGluZGljZXMgMS1iYXNlZC5cbiAgICAgICAgICAgIGlmIChpY29tW2pdID09PSBjICsgMSkgaSA9IGpcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGkgPT09IDApIHRocm93IG5ldyBFcnJvcignbm8gZGVuc2Ugb3V0cHV0IGF2YWlsYWJsZSBmb3IgY29tcG9uZW50ICcgKyBjKVxuICAgICAgICAgIGNvbnN0IHRoZXRhID0gKHggLSB4T2xkKSAvIGhcbiAgICAgICAgICBjb25zdCB0aGV0YTEgPSAxIC0gdGhldGFcbiAgICAgICAgICBjb25zdCBwaHRoZXQgPSB5W2ldICsgdGhldGEgKiAoeVtucmQgKyBpXSArIHRoZXRhMSAqICh5WzIgKiBucmQgKyBpXSAqIHRoZXRhICsgeVszICogbnJkICsgaV0gKiB0aGV0YTEpKVxuICAgICAgICAgIGlmIChpbWl0IDwgMCkgcmV0dXJuIHBodGhldFxuICAgICAgICAgIGNvbnN0IHRoZXRhaCA9IHRoZXRhIC0gMC41XG4gICAgICAgICAgbGV0IHJldCA9IHlbbnJkICogKGltaXQgKyA0KSArIGldXG4gICAgICAgICAgZm9yIChsZXQgaW0gPSBpbWl0OyBpbSA+PSAxOyAtLWltKSB7XG4gICAgICAgICAgICByZXQgPSB5W25yZCAqIChpbSArIDMpICsgaV0gKyByZXQgKiB0aGV0YWggLyBpbVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcGh0aGV0ICsgKHRoZXRhICogdGhldGExKSAqKiAyICogcmV0XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gcHJlcGFyYXRpb25cbiAgICAgIGNvbnN0IHlTYWZlID0gU29sdmVyLmRpbTIoa20sIG5yZClcbiAgICAgIGNvbnN0IGhoID0gU29sdmVyLmRpbShrbSlcbiAgICAgIGNvbnN0IHQgPSBTb2x2ZXIuZGltMihrbSwgdGhpcy5uKVxuICAgICAgLy8gRGVmaW5lIHRoZSBzdGVwIHNpemUgc2VxdWVuY2VcbiAgICAgIGNvbnN0IG5qID0gU29sdmVyLnN0ZXBTaXplU2VxdWVuY2UoblNlcSwga20pXG4gICAgICAvLyBEZWZpbmUgdGhlIGFbaV0gZm9yIG9yZGVyIHNlbGVjdGlvblxuICAgICAgY29uc3QgYSA9IFNvbHZlci5kaW0oa20pXG4gICAgICBhWzFdID0gMSArIG5qWzFdXG4gICAgICBmb3IgKGxldCBpID0gMjsgaSA8PSBrbTsgKytpKSB7XG4gICAgICAgIGFbaV0gPSBhW2kgLSAxXSArIG5qW2ldXG4gICAgICB9XG4gICAgICAvLyBJbml0aWFsIFNjYWxpbmdcbiAgICAgIGNvbnN0IHNjYWwgPSBTb2x2ZXIuZGltKHRoaXMubilcbiAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IHRoaXMubjsgKytpKSB7XG4gICAgICAgIHNjYWxbaV0gPSBhVG9sW2ldICsgclRvbFtpXSArIE1hdGguYWJzKHlbaV0pXG4gICAgICB9XG4gICAgICAvLyBJbml0aWFsIHByZXBhcmF0aW9uc1xuICAgICAgY29uc3QgcG9zbmVnID0geEVuZCAtIHggPj0gMCA/IDEgOiAtMVxuICAgICAgbGV0IGsgPSBNYXRoLm1heCgyLCBNYXRoLm1pbihrbSAtIDEsIE1hdGguZmxvb3IoLVNvbHZlci5sb2cxMChyVG9sWzFdICsgMWUtNDApICogMC42ICsgMS41KSkpXG4gICAgICBsZXQgaCA9IE1hdGgubWF4KE1hdGguYWJzKHRoaXMuaW5pdGlhbFN0ZXBTaXplKSwgMWUtNClcbiAgICAgIGggPSBwb3NuZWcgKiBNYXRoLm1pbihoLCBoTWF4LCBNYXRoLmFicyh4RW5kIC0geCkgLyAyKVxuICAgICAgY29uc3QgaVBvaW50ID0gU29sdmVyLmRpbShrbSArIDEpXG4gICAgICBjb25zdCBlcnJmYWMgPSBTb2x2ZXIuZGltKDIgKiBrbSlcbiAgICAgIGxldCB4T2xkID0geFxuICAgICAgbGV0IGlQdCA9IDBcbiAgICAgIGlmIChzb2xPdXQpIHtcbiAgICAgICAgaWYgKHRoaXMuZGVuc2VPdXRwdXQpIHtcbiAgICAgICAgICBpUG9pbnRbMV0gPSAwXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0ga207ICsraSkge1xuICAgICAgICAgICAgbGV0IG5qQWRkID0gNCAqIGkgLSAyXG4gICAgICAgICAgICBpZiAobmpbaV0gPiBuakFkZCkgKytuakFkZFxuICAgICAgICAgICAgaVBvaW50W2kgKyAxXSA9IGlQb2ludFtpXSArIG5qQWRkXG4gICAgICAgICAgfVxuICAgICAgICAgIGZvciAobGV0IG11ID0gMTsgbXUgPD0gMiAqIGttOyArK211KSB7XG4gICAgICAgICAgICBsZXQgZXJyeCA9IE1hdGguc3FydChtdSAvIChtdSArIDQpKSAqIDAuNVxuICAgICAgICAgICAgbGV0IHByb2QgPSAoMSAvIChtdSArIDQpKSAqKiAyXG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMTsgaiA8PSBtdTsgKytqKSBwcm9kICo9IGVycnggLyBqXG4gICAgICAgICAgICBlcnJmYWNbbXVdID0gcHJvZFxuICAgICAgICAgIH1cbiAgICAgICAgICBpUHQgPSAwXG4gICAgICAgIH1cbiAgICAgICAgLy8gY2hlY2sgcmV0dXJuIHZhbHVlIGFuZCBhYmFuZG9uIGludGVncmF0aW9uIGlmIGNhbGxlZCBmb3JcbiAgICAgICAgaWYgKGZhbHNlID09PSBzb2xPdXQobkFjY2VwdCArIDEsIHhPbGQsIHgsIHkuc2xpY2UoMSkpKSB7XG4gICAgICAgICAgcmV0dXJuIE91dGNvbWUuRWFybHlSZXR1cm5cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgbGV0IGVyciA9IDBcbiAgICAgIGxldCBlcnJPbGQgPSAxZTEwXG4gICAgICBsZXQgaG9wdGRlID0gcG9zbmVnICogaE1heFxuICAgICAgY29uc3QgdyA9IFNvbHZlci5kaW0oa20pXG4gICAgICB3WzFdID0gMFxuICAgICAgbGV0IHJlamVjdCA9IGZhbHNlXG4gICAgICBsZXQgbGFzdCA9IGZhbHNlXG4gICAgICBsZXQgYXRvdjogYm9vbGVhblxuICAgICAgbGV0IGtjID0gMFxuXG4gICAgICBlbnVtIFNUQVRFIHtcbiAgICAgICAgU3RhcnQsIEJhc2ljSW50ZWdyYXRpb25TdGVwLCBDb252ZXJnZW5jZVN0ZXAsIEhvcGVGb3JDb252ZXJnZW5jZSwgQWNjZXB0LCBSZWplY3RcbiAgICAgIH1cbiAgICAgIGxldCBzdGF0ZTogU1RBVEUgPSBTVEFURS5TdGFydFxuXG4gICAgICBsb29wOiB3aGlsZSAodHJ1ZSkge1xuICAgICAgICB0aGlzLmRlYnVnICYmIGNvbnNvbGUubG9nKCdTVEFURScsIFNUQVRFW3N0YXRlXSwgblN0ZXAsIHhPbGQsIHgsIGgsIGssIGtjLCBob3B0ZGUpXG4gICAgICAgIHN3aXRjaCAoc3RhdGUpIHtcbiAgICAgICAgICBjYXNlIFNUQVRFLlN0YXJ0OlxuICAgICAgICAgICAgYXRvdiA9IGZhbHNlXG4gICAgICAgICAgICAvLyBJcyB4RW5kIHJlYWNoZWQgaW4gdGhlIG5leHQgc3RlcD9cbiAgICAgICAgICAgIGlmICgwLjEgKiBNYXRoLmFicyh4RW5kIC0geCkgPD0gTWF0aC5hYnMoeCkgKiB0aGlzLnVSb3VuZCkgYnJlYWsgbG9vcFxuICAgICAgICAgICAgaCA9IHBvc25lZyAqIE1hdGgubWluKE1hdGguYWJzKGgpLCBNYXRoLmFicyh4RW5kIC0geCksIGhNYXgsIE1hdGguYWJzKGhvcHRkZSkpXG4gICAgICAgICAgICBpZiAoKHggKyAxLjAxICogaCAtIHhFbmQpICogcG9zbmVnID4gMCkge1xuICAgICAgICAgICAgICBoID0geEVuZCAtIHhcbiAgICAgICAgICAgICAgbGFzdCA9IHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChuU3RlcCA9PT0gMCB8fCAhdGhpcy5kZW5zZU91dHB1dCkge1xuICAgICAgICAgICAgICBGKHgsIHksIGR6KVxuICAgICAgICAgICAgICArK25FdmFsXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBUaGUgZmlyc3QgYW5kIGxhc3Qgc3RlcFxuICAgICAgICAgICAgaWYgKG5TdGVwID09PSAwIHx8IGxhc3QpIHtcbiAgICAgICAgICAgICAgaVB0ID0gMFxuICAgICAgICAgICAgICArK25TdGVwXG4gICAgICAgICAgICAgIGZvciAobGV0IGogPSAxOyBqIDw9IGs7ICsraikge1xuICAgICAgICAgICAgICAgIGtjID0galxuICAgICAgICAgICAgICAgIG1pZGV4KGopXG4gICAgICAgICAgICAgICAgaWYgKGF0b3YpIGNvbnRpbnVlIGxvb3BcbiAgICAgICAgICAgICAgICBpZiAoaiA+IDEgJiYgZXJyIDw9IDEpIHtcbiAgICAgICAgICAgICAgICAgIHN0YXRlID0gU1RBVEUuQWNjZXB0XG4gICAgICAgICAgICAgICAgICBjb250aW51ZSBsb29wXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHN0YXRlID0gU1RBVEUuSG9wZUZvckNvbnZlcmdlbmNlXG4gICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdGF0ZSA9IFNUQVRFLkJhc2ljSW50ZWdyYXRpb25TdGVwXG4gICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgY2FzZSBTVEFURS5CYXNpY0ludGVncmF0aW9uU3RlcDpcbiAgICAgICAgICAgIC8vIGJhc2ljIGludGVncmF0aW9uIHN0ZXBcbiAgICAgICAgICAgIGlQdCA9IDBcbiAgICAgICAgICAgICsrblN0ZXBcbiAgICAgICAgICAgIGlmIChuU3RlcCA+PSB0aGlzLm1heFN0ZXBzKSB7XG4gICAgICAgICAgICAgIHJldHVybiBPdXRjb21lLk1heFN0ZXBzRXhjZWVkZWRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGtjID0gayAtIDFcbiAgICAgICAgICAgIGZvciAobGV0IGogPSAxOyBqIDw9IGtjOyArK2opIHtcbiAgICAgICAgICAgICAgbWlkZXgoailcbiAgICAgICAgICAgICAgaWYgKGF0b3YpIHtcbiAgICAgICAgICAgICAgICBzdGF0ZSA9IFNUQVRFLlN0YXJ0XG4gICAgICAgICAgICAgICAgY29udGludWUgbG9vcFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBjb252ZXJnZW5jZSBtb25pdG9yXG4gICAgICAgICAgICBpZiAoayA9PT0gMiB8fCByZWplY3QpIHtcbiAgICAgICAgICAgICAgc3RhdGUgPSBTVEFURS5Db252ZXJnZW5jZVN0ZXBcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGlmIChlcnIgPD0gMSkge1xuICAgICAgICAgICAgICAgIHN0YXRlID0gU1RBVEUuQWNjZXB0XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAoZXJyID4gKChualtrICsgMV0gKiBualtrXSkgLyA0KSAqKiAyKSB7XG4gICAgICAgICAgICAgICAgc3RhdGUgPSBTVEFURS5SZWplY3RcbiAgICAgICAgICAgICAgfSBlbHNlIHN0YXRlID0gU1RBVEUuQ29udmVyZ2VuY2VTdGVwXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgY2FzZSBTVEFURS5Db252ZXJnZW5jZVN0ZXA6ICAvLyBsYWJlbCA1MFxuICAgICAgICAgICAgbWlkZXgoaylcbiAgICAgICAgICAgIGlmIChhdG92KSB7XG4gICAgICAgICAgICAgIHN0YXRlID0gU1RBVEUuU3RhcnRcbiAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGtjID0ga1xuICAgICAgICAgICAgaWYgKGVyciA8PSAxKSB7XG4gICAgICAgICAgICAgIHN0YXRlID0gU1RBVEUuQWNjZXB0XG4gICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdGF0ZSA9IFNUQVRFLkhvcGVGb3JDb252ZXJnZW5jZVxuICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgIGNhc2UgU1RBVEUuSG9wZUZvckNvbnZlcmdlbmNlOlxuICAgICAgICAgICAgLy8gaG9wZSBmb3IgY29udmVyZ2VuY2UgaW4gbGluZSBrICsgMVxuICAgICAgICAgICAgaWYgKGVyciA+IChualtrICsgMV0gLyAyKSAqKiAyKSB7XG4gICAgICAgICAgICAgIHN0YXRlID0gU1RBVEUuUmVqZWN0XG4gICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBrYyA9IGsgKyAxXG4gICAgICAgICAgICBtaWRleChrYylcbiAgICAgICAgICAgIGlmIChhdG92KSBzdGF0ZSA9IFNUQVRFLlN0YXJ0XG4gICAgICAgICAgICBlbHNlIGlmIChlcnIgPiAxKSBzdGF0ZSA9IFNUQVRFLlJlamVjdFxuICAgICAgICAgICAgZWxzZSBzdGF0ZSA9IFNUQVRFLkFjY2VwdFxuICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgIGNhc2UgU1RBVEUuQWNjZXB0OlxuICAgICAgICAgICAgaWYgKCFhY2NlcHRTdGVwKHRoaXMubikpIHJldHVybiBPdXRjb21lLkVhcmx5UmV0dXJuXG4gICAgICAgICAgICBzdGF0ZSA9IFNUQVRFLlN0YXJ0XG4gICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgY2FzZSBTVEFURS5SZWplY3Q6XG4gICAgICAgICAgICBrID0gTWF0aC5taW4oaywga2MsIGttIC0gMSlcbiAgICAgICAgICAgIGlmIChrID4gMiAmJiB3W2sgLSAxXSA8IHdba10gKiB0aGlzLnN0ZXBTaXplRmFjMykgayAtPSAxXG4gICAgICAgICAgICArK25SZWplY3RcbiAgICAgICAgICAgIGggPSBwb3NuZWcgKiBoaFtrXVxuICAgICAgICAgICAgcmVqZWN0ID0gdHJ1ZVxuICAgICAgICAgICAgc3RhdGUgPSBTVEFURS5CYXNpY0ludGVncmF0aW9uU3RlcFxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gT3V0Y29tZS5Db252ZXJnZWRcbiAgICB9XG5cbiAgICBjb25zdCBvdXRjb21lID0gb2R4Y29yKClcbiAgICByZXR1cm4ge1xuICAgICAgeTogeS5zbGljZSgxKSxcbiAgICAgIG91dGNvbWU6IG91dGNvbWUsXG4gICAgICBuU3RlcDogblN0ZXAsXG4gICAgICB4RW5kOiB4RW5kLFxuICAgICAgbkFjY2VwdDogbkFjY2VwdCxcbiAgICAgIG5SZWplY3Q6IG5SZWplY3QsXG4gICAgICBuRXZhbDogbkV2YWxcbiAgICB9XG4gIH1cbn1cbiJdfQ==
