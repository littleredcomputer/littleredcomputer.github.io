(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.s = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{}],2:[function(require,module,exports){
"use strict";
var odex_1 = require("odex/src/odex");
var twoPi = Math.PI * 2;
var StandardMap = (function () {
    function StandardMap(K) {
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
    StandardMap.prototype.generateSection = function (initialData, n, callback) {
        var theta = initialData[0], I = initialData[1];
        for (var i = 0; i < n; ++i) {
            callback(theta, I);
            var nI = I + (this.K * Math.sin(theta));
            theta = this.PV(theta + nI);
            I = this.PV(nI);
        }
    };
    return StandardMap;
}());
StandardMap.twoPi = 2 * Math.PI;
exports.StandardMap = StandardMap;
var DrivenPendulumMap = (function () {
    function DrivenPendulumMap(paramfn) {
        this.paramfn = paramfn;
        this.S = new odex_1.Solver(3);
        this.S.denseOutput = true;
        this.S.absoluteTolerance = 1e-8;
        this.PV = StandardMap.principal_value(Math.PI);
    }
    DrivenPendulumMap.prototype.HamiltonSysder = function (m, l, omega, a, g) {
        return function (x, _a) {
            var t = _a[0], theta = _a[1], p_theta = _a[2];
            var _0002 = Math.pow(l, 2);
            var _0003 = omega * t;
            var _0004 = Math.sin(theta);
            var _0005 = Math.cos(theta);
            var _0006 = Math.sin(_0003);
            return [1, (a * l * m * omega * _0006 * _0004 + p_theta) / (_0002 * m), (-Math.pow(a, 2) * l * m * Math.pow(omega, 2) * Math.pow(_0006, 2) * _0005 * _0004 - a * omega * p_theta * _0006 * _0005 - g * _0002 * m * _0004) / l];
        };
    };
    DrivenPendulumMap.prototype.LagrangeSysder = function (l, omega, a, g) {
        return function (x, _a) {
            var t = _a[0], theta = _a[1], thetadot = _a[2];
            var _0001 = Math.sin(theta);
            return [1, thetadot, (a * Math.pow(omega, 2) * _0001 * Math.cos(omega * t) - g * _0001) / l];
        };
    };
    DrivenPendulumMap.prototype.generateSection = function (initialData, n, callback) {
        var _this = this;
        var params = this.paramfn();
        var period = 2 * Math.PI / params.omega;
        var t1 = 1000 * period;
        var H = this.HamiltonSysder(1, 1, params.omega, params.a, 9.8);
        this.S.solve(H, 0, [0].concat(initialData), t1, this.S.grid(period, function (t, ys) { return callback(_this.PV(ys[1]), ys[2]); }));
    };
    DrivenPendulumMap.prototype.evolve = function (params, initialData, t1, dt, callback) {
        var L = this.LagrangeSysder(1, params.omega, params.a, 9.8);
        var p0 = performance.now();
        this.S.solve(L, 0, [0].concat(initialData), t1, this.S.grid(dt, callback));
        console.log('evolution took', (performance.now() - p0).toFixed(2), 'msec');
    };
    return DrivenPendulumMap;
}());
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
            var p0 = performance.now();
            _this.Explore(cx, cy);
            console.log('exploration', (performance.now() - p0).toFixed(2), 'msec');
            _this.onExplore && _this.onExplore(cx, cy);
        };
        this.context.scale(this.context.canvas.width / w, -this.context.canvas.height / h);
        this.context.translate(-xRange[0], -yRange[1]);
        this.context.fillStyle = 'rgba(23,64,170,0.5)';
    }
    ExploreMap.prototype.Explore = function (x, y) {
        this.M.generateSection([x, y], 1000, this.pt);
    };
    return ExploreMap;
}());
exports.ExploreMap = ExploreMap;
var DrivenPendulumAnimation = (function () {
    function DrivenPendulumAnimation(o) {
        var _this = this;
        this.amplitude = 0.1;
        this.animLogicalSize = 1.3;
        this.timestring = function (t) {
            var s = t.toFixed(2);
            if (s.match(/\.[0-9]$/)) {
                s += '0';
            }
            return 't: ' + s + ' s';
        };
        this.frame = function () {
            var bob = function (t) { return _this.amplitude * Math.cos(_this.omega * t); };
            _this.ctx.clearRect(-_this.animLogicalSize, -_this.animLogicalSize, 2 * _this.animLogicalSize, 2 * _this.animLogicalSize);
            var d = _this.data[_this.frameIndex];
            var y0 = bob(d[0]);
            var theta = d[1];
            var c = _this.ctx;
            c.lineWidth = 0.02;
            c.fillStyle = '#000';
            c.beginPath();
            c.moveTo(0, y0);
            c.lineTo(Math.sin(theta), y0 - Math.cos(theta));
            c.stroke();
            c.beginPath();
            c.fillStyle = '#000';
            c.arc(0, y0, 0.05, 0, Math.PI * 2);
            c.fillStyle = '#f00';
            c.arc(Math.sin(theta), y0 - Math.cos(theta), 0.1, 0, Math.PI * 2);
            c.fill();
            c.save();
            c.scale(0.01, -0.01);
            c.font = '10pt Futura';
            c.fillStyle = '#888';
            c.fillText(_this.timestring(d[0]), -115, 115);
            c.restore();
            ++_this.frameIndex;
            if (_this.frameIndex < _this.data.length) {
                window.requestAnimationFrame(_this.frame);
            }
            else {
                _this.animating = false;
                var et = (performance.now() - _this.frameStart) / 1e3;
                console.log('animation done', (_this.data.length / et).toFixed(2), 'fps');
            }
        };
        var omegaRange = document.getElementById(o.omegaRangeId);
        var omegaRadSec = function () { return +omegaRange.value * 2 * Math.PI; };
        var tRange = document.getElementById(o.tRangeId);
        var diffEq = new DrivenPendulumMap(function () { return ({ omega: omegaRadSec(), a: _this.amplitude }); });
        var anim = document.getElementById(o.animId);
        this.ctx = anim.getContext('2d');
        this.ctx.scale(anim.width / (2 * this.animLogicalSize), -anim.height / (2 * this.animLogicalSize));
        this.ctx.translate(this.animLogicalSize, -this.animLogicalSize);
        var xMap = new ExploreMap('p', diffEq, [-Math.PI, Math.PI], [-10, 10]);
        var goButton = document.getElementById(o.goButtonId);
        xMap.onExplore = function (theta0, thetaDot0) {
            console.log('onExplore', theta0, thetaDot0);
            document.getElementById(o.theta0Id).textContent = theta0.toFixed(3);
            document.getElementById(o.thetaDot0Id).textContent = thetaDot0.toFixed(3);
            _this.initialData = [theta0, thetaDot0];
            goButton.removeAttribute('disabled');
        };
        var explore = document.getElementById(o.exploreId);
        omegaRange.addEventListener('change', function (e) {
            explore.getContext('2d').clearRect(-Math.PI, -10, 2 * Math.PI, 20);
            var t = e.target;
            document.getElementById(o.omegaValueId).textContent = (+t.value).toFixed(1);
        });
        document.getElementById(o.omegaValueId).textContent = omegaRange.value;
        tRange.addEventListener('change', function (e) {
            var t = e.target;
            document.getElementById(o.tValueId).textContent = t.value;
        });
        document.getElementById(o.tValueId).textContent = tRange.value;
        goButton.setAttribute('disabled', 'disabled');
        goButton.addEventListener('click', function () {
            var dt = 1 / 60;
            var t1 = +tRange.value;
            var n = Math.ceil(t1 / dt);
            _this.data = new Array(n);
            var i = 0;
            _this.omega = omegaRadSec();
            var p0 = performance.now();
            diffEq.evolve({ omega: _this.omega, a: _this.amplitude }, _this.initialData, t1, dt, function (x, ys) { _this.data[i++] = ys; });
            console.log('DE evolution in', (performance.now() - p0).toFixed(1), 'msec');
            _this.frameIndex = 0;
            _this.frameStart = performance.now();
            if (!_this.animating) {
                _this.animating = true;
                requestAnimationFrame(_this.frame);
            }
        });
    }
    return DrivenPendulumAnimation;
}());
exports.DrivenPendulumAnimation = DrivenPendulumAnimation;
var DoublePendulumMap = (function () {
    function DoublePendulumMap() {
        this.S = new odex_1.Solver(5);
        this.S.denseOutput = true;
        this.S.absoluteTolerance = 1e-8;
    }
    DoublePendulumMap.prototype.LagrangeSysder = function (l1, m1, l2, m2) {
        var g = 9.8;
        return function (x, _a) {
            var t = _a[0], theta = _a[1], phi = _a[2], thetadot = _a[3], phidot = _a[4];
            var _0002 = Math.pow(phidot, 2);
            var _0003 = Math.sin(phi);
            var _0005 = -phi;
            var _0007 = Math.sin(theta);
            var _0008 = Math.pow(thetadot, 2);
            var _000b = _0005 + theta;
            var _000e = Math.cos(_000b);
            var _000f = Math.sin(_000b);
            var _0011 = Math.pow(_000f, 2);
            return [1, thetadot, phidot, (-l1 * m2 * _0008 * _000f * _000e - l2 * m2 * _0002 * _000f + g * m2 * _000e * _0003 - g * m1 * _0007 - g * m2 * _0007) / (l1 * m2 * _0011 + l1 * m1), (l2 * m2 * _0002 * _000f * _000e + l1 * m1 * _0008 * _000f + l1 * m2 * _0008 * _000f + g * m1 * _0007 * _000e + g * m2 * _0007 * _000e - g * m1 * _0003 - g * m2 * _0003) / (l2 * m2 * _0011 + l2 * m1)];
        };
    };
    DoublePendulumMap.prototype.evolve = function (p, initialData, t1, dt, callback) {
        this.S.solve(this.LagrangeSysder(p.l1, p.m1, p.l2, p.m2), 0, [0].concat(initialData), t1, this.S.grid(dt, callback));
    };
    return DoublePendulumMap;
}());
var DoublePendulumAnimation = (function () {
    function DoublePendulumAnimation(o) {
        var _this = this;
        this.animLogicalSize = 1.3;
        this.frame = function () {
            _this.ctx.clearRect(-_this.animLogicalSize, -_this.animLogicalSize, 2 * _this.animLogicalSize, 2 * _this.animLogicalSize);
            var d = _this.data[_this.frameIndex];
            var theta = d[1], phi = d[2];
            var c = _this.ctx;
            var p = _this.params;
            var x0 = 0, y0 = 0;
            var x1 = p.l1 * Math.sin(theta), y1 = -p.l1 * Math.cos(theta);
            var x2 = x1 + p.l2 * Math.sin(phi), y2 = y1 - p.l2 * Math.cos(phi);
            c.lineWidth = 0.025;
            c.strokeStyle = '#888';
            c.beginPath();
            c.moveTo(x0, y0);
            c.lineTo(x1, y1);
            c.lineTo(x2, y2);
            c.stroke();
            c.fillStyle = '#f00';
            c.beginPath();
            c.moveTo(x0, y0);
            c.arc(x0, y0, 0.05, 0, Math.PI * 2);
            c.moveTo(x1, y1);
            c.arc(x1, y1, Math.pow(p.m1, 1 / 3) / 7, 0, Math.PI * 2);
            c.moveTo(x2, y2);
            c.arc(x2, y2, Math.pow(p.m2, 1 / 3) / 7, 0, Math.PI * 2);
            c.fill();
            ++_this.frameIndex;
            if (_this.frameIndex < _this.data.length) {
                window.requestAnimationFrame(_this.frame);
            }
            else {
                _this.animating = false;
                var et = (performance.now() - _this.frameStart) / 1e3;
                console.log('animation done', (_this.data.length / et).toFixed(2), 'fps');
            }
        };
        this.animating = false;
        var deg2rad = function (d) { return d * 2 * Math.PI / 360; };
        var theta0Range = document.getElementById(o.theta0RangeId);
        theta0Range.addEventListener('change', this.valueUpdater(o.theta0ValueId));
        var phi0Range = document.getElementById(o.phi0RangeId);
        phi0Range.addEventListener('change', this.valueUpdater(o.phi0ValueId));
        var tRange = document.getElementById(o.tRangeId);
        tRange.addEventListener('change', this.valueUpdater(o.tValueId));
        var mRange = document.getElementById(o.mRangeId);
        mRange.addEventListener('change', this.valueUpdater(o.mValueId));
        var lRange = document.getElementById(o.lRangeId);
        lRange.addEventListener('change', this.valueUpdater(o.lValueId));
        var anim = document.getElementById(o.animId);
        this.ctx = anim.getContext('2d');
        this.ctx.scale(anim.width / (2 * this.animLogicalSize), -anim.height / (2 * this.animLogicalSize));
        this.ctx.translate(this.animLogicalSize, -this.animLogicalSize);
        var diffEq = new DoublePendulumMap();
        document.getElementById(o.goButtonId).addEventListener('click', function () {
            var dt = 1 / 60;
            var t1 = +tRange.value;
            var n = Math.ceil(t1 / dt);
            _this.data = new Array(n);
            var i = 0;
            var p0 = performance.now();
            _this.params = {
                l1: +lRange.value,
                m1: +mRange.value,
                l2: 1 - Number(lRange.value),
                m2: 1 - Number(mRange.value)
            };
            diffEq.evolve(_this.params, [deg2rad(+theta0Range.value), deg2rad(+phi0Range.value), 0, 0], t1, dt, function (x, ys) { _this.data[i++] = ys; });
            console.log('evolution in', (performance.now() - p0).toFixed(2), 'msec ');
            _this.frameIndex = 0;
            _this.frameStart = performance.now();
            if (!_this.animating) {
                _this.animating = true;
                requestAnimationFrame(_this.frame);
            }
        });
    }
    DoublePendulumAnimation.prototype.valueUpdater = function (toId) {
        return function (e) { return document.getElementById(toId).textContent = e.target.value; };
    };
    return DoublePendulumAnimation;
}());
exports.DoublePendulumAnimation = DoublePendulumAnimation;

},{"odex/src/odex":1}]},{},[2])(2)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvb2RleC9zcmMvb2RleC50cyIsInNpY20udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FDa0NBLElBQVksT0FJWDtBQUpELFdBQVksT0FBTztJQUNqQiwrQ0FBUyxDQUFBO0lBQ1QsNkRBQWdCLENBQUE7SUFDaEIsbURBQVcsQ0FBQTtBQUNiLENBQUMsRUFKVyxPQUFPLEdBQVAsZUFBTyxLQUFQLGVBQU8sUUFJbEI7QUFFRDtJQXlCRSxnQkFBWSxDQUFTO1FBQ25CLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBQ1YsSUFBSSxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUE7UUFDckIsSUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUE7UUFDckIsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUE7UUFDM0IsSUFBSSxDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUE7UUFDcEIsSUFBSSxDQUFDLHVCQUF1QixHQUFHLENBQUMsQ0FBQTtRQUNoQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQyxDQUFBO1FBQ3pCLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxDQUFDLENBQUE7UUFDNUIsSUFBSSxDQUFDLHdCQUF3QixHQUFHLENBQUMsQ0FBQTtRQUNqQyxJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQTtRQUN4QixJQUFJLENBQUMseUJBQXlCLEdBQUcsSUFBSSxDQUFBO1FBQ3JDLElBQUksQ0FBQyxlQUFlLEdBQUcsU0FBUyxDQUFBO1FBQ2hDLElBQUksQ0FBQywwQkFBMEIsR0FBRyxDQUFDLENBQUE7UUFDbkMsSUFBSSxDQUFDLHVCQUF1QixHQUFHLEdBQUcsQ0FBQTtRQUNsQyxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQTtRQUN4QixJQUFJLENBQUMsWUFBWSxHQUFHLEdBQUcsQ0FBQTtRQUN2QixJQUFJLENBQUMsWUFBWSxHQUFH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O29CQUNQLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxFQUFFLEVBQUUsQ0FBQzt3QkFBRSxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7b0JBQzlELElBQUksR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUE7b0JBQ2pCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxFQUFFLEVBQUUsQ0FBQzt3QkFBRSxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtvQkFFNUQsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQzt3QkFDN0IsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFBO3dCQUNsQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDOzRCQUM1QixJQUFJLE1BQU0sR0FBRyxTQUFBLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBSSxDQUFDLENBQUEsR0FBRyxDQUFDLENBQUE7NEJBQzFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0NBQzlCLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUE7NEJBQzFFLENBQUM7d0JBQ0gsQ0FBQztvQkFDSCxDQUFDO29CQUNELElBQUksR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUE7b0JBQ2pCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxFQUFFLEVBQUUsQ0FBQzt3QkFBRSxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtvQkFFMUQsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDO3dCQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7b0JBQzdDLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFBO29CQUNkLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFBO29CQUNiLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxFQUFFLEVBQUUsQ0FBQzt3QkFBRSxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7b0JBRS9ELEdBQUcsQ0FBQyxDQUFDLElBQUksR0FBRyxHQUFHLENBQUMsRUFBRSxHQUFHLElBQUksSUFBSSxFQUFFLEVBQUUsR0FBRyxFQUFFLENBQUM7d0JBRXJDLElBQUksSUFBSSxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUE7d0JBQzVCLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7NEJBQ25DLElBQUksS0FBSyxHQUFHLFNBQUEsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUEsQ0FBQTs0QkFDckMsR0FBRyxHQUFHLE1BQU0sQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxHQUFHLENBQUE7NEJBQ25DLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0NBQzlCLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFBOzRCQUN0QyxDQUFDO3dCQUNILENBQUM7d0JBQ0QsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7NEJBQ3BDLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQTs0QkFDbEIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0NBQ25DLElBQUksTUFBTSxHQUFHLFNBQUEsQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFJLENBQUMsQ0FBQSxHQUFHLENBQUMsQ0FBQTtnQ0FDMUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxHQUFHLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQztvQ0FDOUIsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQTtnQ0FDMUUsQ0FBQzs0QkFDSCxDQUFDO3dCQUNILENBQUM7d0JBQ0QsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQTt3QkFDckIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxHQUFHLEVBQUUsRUFBRSxDQUFDOzRCQUFFLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTt3QkFDakUsRUFBRSxDQUFDLENBQUMsR0FBRyxLQUFLLElBQUksQ0FBQzs0QkFBQyxRQUFRLENBQUE7d0JBRTFCLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDOzRCQUNoRCxJQUFJLElBQUksR0FBRyxNQUFNLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFBOzRCQUN6QixJQUFJLElBQUksR0FBRyxNQUFNLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQTs0QkFDL0IsRUFBRSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsSUFBSSxJQUFJLEtBQUssQ0FBQyxDQUFDO2dDQUFDLElBQUksSUFBSSxDQUFDLENBQUE7NEJBQ3RDLElBQUksQ0FBQyxTQUFR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QUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxLQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7d0JBQ2pDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUE7b0JBQ3ZELENBQUM7Z0JBQ0gsQ0FBQztnQkFDRCxHQUFHLEdBQUcsQ0FBQyxDQUFBO2dCQUVQLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksS0FBSSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDO29CQUNqQyxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO29CQUNyRCxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUE7b0JBQ2pDLEdBQUcsSUFBSSxTQUFBLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUksQ0FBQyxDQUFBLENBQUE7Z0JBQzdDLENBQUM7Z0JBQ0QsR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLEtBQUksQ0FBQyxD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QUksR0FBRyxHQUFHLEtBQUssR0FBRyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUE7b0JBQ3RDLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUE7b0JBQ3RCLElBQUksR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsQ0FBQTtvQkFFM0IsRUFBRSxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ2QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFBO3dCQUNoQyxFQUFFLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFDZCxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTs0QkFDM0MsRUFBRSxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0NBQ2QsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsSUFBSSxJQUFJLEVBQUUsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDO29DQUNyQyxJQUFJLElBQUksR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO29DQUM1QixJQUFJLElBQUksR0FBRyxJQUFJLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO29DQUN6QyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFBO2dDQUMxRSxDQUFDOzRCQUNILENBQUM7d0JBQ0gsQ0FBQztvQkFDSCxDQUFDO29CQUNELENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtvQkFDaEMsRUFBRSxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ2QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQTt3QkFDdkMsRUFBRSxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7NEJBQ2QsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsSUFBSSxJQUFJLEVBQUUsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDO2dDQUNyQyxJQUFJLElBQUksR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO2dDQUM1QixJQUFJLElBQUksR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUE7Z0NBQzlDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcs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SUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUE7WUFDN0YsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUksQ0FBQyxlQUFlLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQTtZQUN0RCxDQUFDLEdBQUcsTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQTtZQUN0RCxJQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQTtZQUNqQyxJQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQTtZQUNqQyxJQUFJLElBQUksR0FBRyxDQUFDLENBQUE7WUFDWixJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUE7WUFDWCxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUNYLEVBQUUsQ0FBQyxDQUFDLEtBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO29CQUNyQixNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO29CQUNiLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7d0JBQzdCLElBQUksS0FBSyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFBO3dCQUNyQixFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDOzRCQUFDLEVBQUUsS0FBSyxDQUFBO3dCQUMxQixNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUE7b0JBQ25DLENBQUM7b0JBQ0QsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7d0JBQ3BDLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFBO3dCQUN6QyxJQUFJLElBQUksR0FBRyxTQUFBLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUksQ0FBQyxDQUFBLENBQUE7d0JBQzlCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQzs0QkFBRSxJQUFJLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQTt3QkFDOUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQTtvQkFDbkIsQ0FBQztvQkFDRCxHQUFHLEdBQUcsQ0FBQyxDQUFBO2dCQUNULENBQUM7Z0JBRUQsRUFBRSxDQUFDLENBQUMsS0FBSyxLQUFLLE1BQU0sQ0FBQyxPQUFPLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDdkQsTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUE7Z0JBQzVCLENBQUM7WUFDSCxDQUFDO1lBQ0QsSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFBO1lBQ1gsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFBO1lBQ2pCLElBQUksTUFBTSxHQUFHLE1BQU0sR0FBRyxJQUFJLENBQUE7WUFDMUIsSUFBTSxDQUFDLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQTtZQUN4QixDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBQ1IsSUFBSSxNQUFNLEdBQUcsS0FBSyxDQUFBO1lBQ2xCLElBQUksSUFBSSxHQUFHLEtBQUssQ0FBQTtZQUNoQixJQUFJLElBQWEsQ0FBQTtZQUNqQixJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUE7WUFFVixJQUFLLEtBRUo7WUFGRCxXQUFLLEtBQUs7Z0JBQ1IsbUNBQUssQ0FBQTtnQkFBRSxpRUFBb0IsQ0FBQTtnQkFBRSx1REFBZSxDQUFBO2dCQUFFLDZEQUFrQixDQUFBO2dCQUFFLHFDQUFNLENBQUE7Z0JBQUUscUNBQU0sQ0FBQTtZQUNsRixDQUFDLEVBRkksS0FBSyxLQUFMLEtBQUssUUFFVDtZQUNELElBQUksS0FBSyxHQUFVLEtBQUssQ0FBQyxLQUFLLENBQUE7WUFFOUIsSUFBSSxFQUFFLE9BQU8sSUFBSSxFQUFFLENBQUM7Z0JBQ2xCLEtBQUksQ0FBQyxLQUFLLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFBO2dCQUNsRixNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO29CQUNkLEtBQUssS0FBSyxDQUFDLEtBQUs7d0JBQ2QsSUFBSSxHQUFHLEtBQUssQ0FBQTt3QkFFWixFQUFFLENBQUMsQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFJLENBQUMsTUFBTSxDQUFDOzRCQUFDLEtBQUssQ0FBQyxJQUFJLENBQUE7d0JBQ3JFLENBQUMsR0FBRyxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUE7d0JBQzlFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7NEJBQ3ZDLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFBOzRCQUNaLElBQUksR0FBRyxJQUFJLENBQUE7d0JBQ2IsQ0FBQzt3QkFDRCxFQUFFLENBQUMsQ0FBQyxLQUFLLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7NEJBQ3JDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFBOzRCQUNYLEVBQUUsS0FBSyxDQUFBO3dCQUNULENBQUM7d0JBRUQsRUFBRSxDQUFDLENBQUMsS0FBSyxLQUFLLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDOzRCQUN4QixHQUFHLEdBQUcsQ0FBQyxDQUFBOzRCQUNQLEVBQUUsS0FBSyxDQUFBOzRCQUNQLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0NBQzVCLEVBQUUsR0FBRyxDQUFDLENBQUE7Z0NBQ04sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO2dDQUNSLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQztvQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFBO2dDQUN2QixFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO29DQUN0QixLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQTtvQ0FDcEIsUUFBUSxDQUFDLElBQUksQ0FBQTtnQ0FDZixDQUFDOzRCQUNILENBQUM7NEJBQ0QsS0FBSyxHQUFHLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQTs0QkFDaEMsUUFBUSxDQUFBO3dCQUNWLENBQUM7d0JBQ0QsS0FBSyxHQUFHLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQTt3QkFDbEMsUUFBUSxDQUFBO29CQUVWLEtBQUssS0FBSyxDQUFDLG9CQUFvQjt3QkFFN0IsR0FBRyxHQUFHLENBQUMsQ0FBQTt3QkFDUCxFQUFFLEtBQUssQ0FBQTt3QkFDUCxFQUFFLENBQUMsQ0FBQyxLQUFLLElBQUksS0FBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7NEJBQzNCLE1BQU0sQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUE7d0JBQ2pDLENBQUM7d0JBQ0QsRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUE7d0JBQ1YsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQzs0QkFDN0IsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBOzRCQUNSLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Z0NBQ1QsS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUE7Z0NBQ25CLFFBQVEsQ0FBQyxJQUFJLENBQUE7NEJBQ2YsQ0FBQzt3QkFDSCxDQUFDO3dCQUVELEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQzs0QkFDdEIsS0FBSyxHQUFHLEtBQUssQ0FBQyxlQUFlLENBQUE7d0JBQy9CLENBQUM7d0JBQUMsSUFBSSxDQUFDLENBQUM7NEJBQ04sRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0NBQ2IsS0FBSyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUE7NEJBQ3RCLENBQUM7NEJBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsR0FBRyxTQUFBLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFJLENBQUMsQ0FBQSxDQUFDLENBQUMsQ0FBQztnQ0FDaEQsS0FBSyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUE7NEJBQ3RCLENBQUM7NEJBQUMsSUFBSTtnQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQTt3QkFDdEMsQ0FBQzt3QkFDRCxRQUFRLENBQUE7b0JBRVYsS0FBSyxLQUFLLENBQUMsZUFBZTt3QkFDeEIsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO3dCQUNSLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7NEJBQ1QsS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUE7NEJBQ25CLFFBQVEsQ0FBQTt3QkFDVixDQUFDO3dCQUNELEVBQUUsR0FBRyxDQUFDLENBQUE7d0JBQ04sRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7NEJBQ2IsS0FBSyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUE7NEJBQ3BCLFFBQVEsQ0FBQTt3QkFDVixDQUFDO3dCQUNELEtBQUssR0FBRyxLQUFLLENBQUMsa0JBQWtCLENBQUE7d0JBQ2hDLFFBQVEsQ0FBQTtvQkFFVixLQUFLLEtBQUssQ0FBQyxrQkFBa0I7d0JBRTNCLEVBQUUsQ0FBQyxDQUFDLEdBQUcsR0FBRyxTQUFBLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBSSxDQUFDLENBQUEsQ0FBQyxDQUFDLENBQUM7NEJBQy9CLEtBQUssR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFBOzRCQUNwQixRQUFRLENBQUE7d0JBQ1YsQ0FBQzt3QkFDRCxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQTt3QkFDVixLQUFLLENBQUMsRUFBRSxDQUFDLENBQUE7d0JBQ1QsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDOzRCQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFBO3dCQUM3QixJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQzs0QkFBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQTt3QkFDdEMsSUFBSTs0QkFBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQTt3QkFDekIsUUFBUSxDQUFBO29CQUVWLEtBQUssS0FBSyxDQUFDLE1BQU07d0JBQ2YsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsS0FBSSxDQUFDLENBQUMsQ0FBQyxDQUFDOzRCQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFBO3dCQUNuRCxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQTt3QkFDbkIsUUFBUSxDQUFBO29CQUVWLEtBQUssS0FBSyxDQUFDLE1BQU07d0JBQ2YsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUE7d0JBQzNCLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSSxDQUFDLFlBQVksQ0FBQzs0QkFBQyxDQUFDLElBQUksQ0FBQyxDQUFBO3dCQUN4RCxFQUFFLE9BQU8sQ0FBQTt3QkFDVCxDQUFDLEdBQUcsTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQTt3QkFDbEIsTUFBTSxHQUFHLElBQUksQ0FBQTt3QkFDYixLQUFLLEdBQUcsS0FBSyxDQUFDLG9CQUFvQixDQUFBO2dCQUN0QyxDQUFDO1lBQ0gsQ0FBQztZQUNELE1BQU0sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFBO1FBQzFCLENBQUMsQ0FBQTtRQUVELElBQU0sT0FBTyxHQUFHLE1BQU0sRUFBRSxDQUFBO1FBQ3hCLE1BQU0sQ0FBQztZQUNMLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNiLE9BQU8sRUFBRSxPQUFPO1lBQ2hCLEtBQUssRUFBRSxLQUFLO1lBQ1osSUFBSSxFQUFFLElBQUk7WUFDVixPQUFPLEVBQUUsT0FBTztZQUNoQixPQUFPLEVBQUUsT0FBTztZQUNoQixLQUFLLEVBQUUsS0FBSztTQUNiLENBQUE7SUFDSCxDQUFDO0lBQ0gsYUFBQztBQUFELENBbnJCQSxBQW1yQkM7QUF2bUJnQixVQUFHLEdBQUcsVUFBQyxDQUFTLElBQUssT0FBQSxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFaLENBQVksQ0FBQTtBQUNqQyxZQUFLLEdBQUcsVUFBQyxDQUFTLElBQUssT0FBQSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQXZCLENBQXVCLENBQUE7QUE3RWxELHdCQUFNOzs7O0FDbkNuQixzQ0FBZ0Q7QUFVaEQsSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUE7QUFFekI7SUFLRSxxQkFBWSxDQUFTO1FBQ25CLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBQ1YsSUFBSSxDQUFDLEVBQUUsR0FBRyxXQUFXLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFBO0lBQzlDLENBQUM7SUFFTSwyQkFBZSxHQUF0QixVQUF1QixPQUFlO1FBQ3BDLElBQU0sTUFBTSxHQUFHLE9BQU8sR0FBRyxLQUFLLENBQUE7UUFDOUIsTUFBTSxDQUFDLFVBQVUsQ0FBUztZQUN4QixFQUFFLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUMvQixNQUFNLENBQUMsQ0FBQyxDQUFBO1lBQ1YsQ0FBQztZQUNELElBQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUE7WUFDM0MsTUFBTSxDQUFDLENBQUMsR0FBRyxPQUFPLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUE7UUFDcEMsQ0FBQyxDQUFBO0lBQ0gsQ0FBQztJQUVELHFDQUFlLEdBQWYsVUFBZ0IsV0FBcUIsRUFBRSxDQUFTLEVBQUUsUUFBd0M7UUFDbkYsSUFBQSxzQkFBSyxFQUFFLGtCQUFDLENBQWU7UUFDNUIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQztZQUMzQixRQUFRLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFBO1lBQ2xCLElBQUksRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFBO1lBQ3ZDLEtBQUssR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUMsQ0FBQTtZQUMzQixDQUFDLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUNqQixDQUFDO0lBQ0gsQ0FBQztJQUNILGtCQUFDO0FBQUQsQ0E5QkEsQUE4QkM7QUEzQlEsaUJBQUssR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQTtBQUhmLGtDQUFXO0FBZ0N4QjtJQXdCRSwyQkFBWSxPQUF5QztRQUNuRCxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQTtRQUN0QixJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksYUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ3RCLElBQUksQ0FBQyxDQUFDLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQTtRQUN6QixJQUFJLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQTtRQUMvQixJQUFJLENBQUMsRUFBRSxHQUFHLFdBQVcsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFBO0lBQ2hELENBQUM7SUF4QkQsMENBQWMsR0FBZCxVQUFlLENBQVMsRUFBRSxDQUFTLEVBQUUsS0FBYSxFQUFFLENBQVMsRUFBRSxDQUFTO1FBQ3RFLE1BQU0sQ0FBQyxVQUFDLENBQUMsRUFBRSxFQUFtQjtnQkFBbEIsU0FBQyxFQUFFLGFBQUssRUFBRSxlQUFPO1lBQzFCLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO1lBQzFCLElBQUksS0FBSyxHQUFHLEtBQUssR0FBRyxDQUFDLENBQUE7WUFDckIsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQTtZQUMzQixJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFBO1lBQzNCLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUE7WUFDM0IsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxHQUFHLEtBQUssR0FBRyxLQUFLLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEdBQUcsS0FBSyxHQUFHLEtBQUssR0FBRyxDQUFDLEdBQUcsS0FBSyxHQUFHLE9BQU8sR0FBRyxLQUFLLEdBQUcsS0FBSyxHQUFHLENBQUMsR0FBRyxLQUFLLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBO1FBQ2xPLENBQUMsQ0FBQTtJQUNILENBQUM7SUFFRCwwQ0FBYyxHQUFkLFVBQWUsQ0FBUyxFQUFFLEtBQWEsRUFBRSxDQUFTLEVBQUUsQ0FBUztRQUMzRCxNQUFNLENBQUMsVUFBQyxDQUFDLEVBQUUsRUFBb0I7Z0JBQW5CLFNBQUMsRUFBRSxhQUFLLEVBQUUsZ0JBQVE7WUFDNUIsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQTtZQUMzQixNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxHQUFHLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUE7UUFDOUYsQ0FBQyxDQUFBO0lBQ0gsQ0FBQztJQVVELDJDQUFlLEdBQWYsVUFBZ0IsV0FBcUIsRUFBRSxDQUFTLEVBQUUsUUFBd0M7UUFBMUYsaUJBTUM7UUFMQyxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUE7UUFDM0IsSUFBSSxNQUFNLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxFQUFFLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQTtRQUN2QyxJQUFJLEVBQUUsR0FBRyxJQUFJLEdBQUcsTUFBTSxDQUFBO1FBQ3RCLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxNQUFNLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUE7UUFDOUQsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLFVBQUMsQ0FBQyxFQUFFLEVBQUUsSUFBSyxPQUFBLFFBQVEsQ0FBQyxLQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUEvQixDQUErQixDQUFDLENBQUMsQ0FBQTtJQUNsSCxDQUFDO0lBRUQsa0NBQU0sR0FBTixVQUFPLE1BQWtDLEVBQUUsV0FBcUIsRUFBRSxFQUFVLEVBQUUsRUFBVSxFQUFFLFFBQTJDO1FBQ25JLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQTtRQUMzRCxJQUFJLEVBQUUsR0FBRyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUE7UUFDMUIsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUE7UUFDMUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUE7SUFDNUUsQ0FBQztJQUNILHdCQUFDO0FBQUQsQ0E5Q0EsQUE4Q0MsSUFBQTtBQTlDWSw4Q0FBaUI7QUFnRDlCO0lBTUUsb0JBQVksTUFBYyxFQUFFLENBQWMsRUFBRSxNQUFnQixFQUFFLE1BQWdCO1FBQTlFLGlCQWdCQztRQUNELE1BQUMsR0FBVyxDQUFDLENBQUE7UUFHYixPQUFFLEdBQUcsVUFBQyxDQUFTLEVBQUUsQ0FBUztZQUN4QixLQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxDQUFBO1lBQ3hCLEtBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFBO1lBQzVDLEtBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUE7WUFDbkIsS0FBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQTtZQUN4QixFQUFFLEtBQUksQ0FBQyxDQUFDLENBQUE7UUFDVixDQUFDLENBQUE7UUF6QkMsSUFBSSxDQUFDLE1BQU0sR0FBdUIsUUFBUSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUNqRSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtRQUNWLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDdkMsSUFBQSxtREFBdUQsRUFBdEQsU0FBQyxFQUFFLFNBQUMsQ0FBa0Q7UUFDM0QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEdBQUcsVUFBQyxDQUFhO1lBQ2xDLElBQUE7d0VBQ3FELEVBRHBELFVBQUUsRUFBRSxVQUFFLENBQzhDO1lBQ3pELElBQUksRUFBRSxHQUFHLFdBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtZQUMxQixLQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQTtZQUNwQixPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUE7WUFDdkUsS0FBSSxDQUFDLFNBQVMsSUFBSSxLQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQTtRQUMxQyxDQUFDLENBQUE7UUFDRCxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFBO1FBQ2xGLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDOUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEdBQUcscUJBQXFCLENBQUE7SUFDaEQsQ0FBQztJQVlELDRCQUFPLEdBQVAsVUFBUSxDQUFTLEVBQUUsQ0FBUztRQUMxQixJQUFJLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFBO0lBQy9DLENBQUM7SUFDSCxpQkFBQztBQUFELENBckNBLEFBcUNDLElBQUE7QUFyQ1ksZ0NBQVU7QUF1Q3ZCO0lBV0UsaUNBQVksQ0FVWDtRQVZELGlCQTJEQztRQXJFRCxjQUFTLEdBQUcsR0FBRyxDQUFBO1FBQ2Ysb0JBQWUsR0FBRyxHQUFHLENBQUE7UUFxRXJCLGVBQVUsR0FBRyxVQUFDLENBQVM7WUFDckIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQTtZQUNwQixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDeEIsQ0FBQyxJQUFJLEdBQUcsQ0FBQTtZQUNWLENBQUM7WUFDRCxNQUFNLENBQUMsS0FBSyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUE7UUFDekIsQ0FBQyxDQUFBO1FBRUQsVUFBSyxHQUFHO1lBQ04sSUFBSSxHQUFHLEdBQUcsVUFBQyxDQUFTLElBQUssT0FBQSxLQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsRUFBekMsQ0FBeUMsQ0FBQTtZQUNsRSxLQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEtBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxLQUFJLENBQUMsZUFBZSxFQUFFLENBQUMsR0FBRyxLQUFJLENBQUMsZUFBZSxFQUFFLENBQUMsR0FBRyxLQUFJLENBQUMsZUFBZSxDQUFDLENBQUE7WUFDcEgsSUFBSSxDQUFDLEdBQUcsS0FBSSxDQUFDLElBQUksQ0FBQyxLQUFJLENBQUMsVUFBVSxDQUFDLENBQUE7WUFDbEMsSUFBSSxFQUFFLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBQ2xCLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtZQUNoQixJQUFNLENBQUMsR0FBRyxLQUFJLENBQUMsR0FBRyxDQUFBO1lBQ2xCLENBQUMsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFBO1lBQ2xCLENBQUMsQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFBO1lBQ3BCLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQTtZQUNiLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFBO1lBQ2YsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUE7WUFDL0MsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFBO1lBQ1YsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFBO1lBQ2IsQ0FBQyxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUE7WUFDcEIsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQTtZQUNsQyxDQUFDLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQTtZQUNwQixDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FB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Q0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUE7WUFDL0IsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQTtZQUN6QixJQUFJLEtBQUssR0FBRyxDQUFFLEdBQUcsQ0FBQTtZQUNqQixJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFBO1lBQzNCLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFBO1lBQ2pDLElBQUksS0FBSyxHQUFHLEtBQUssR0FBRyxLQUFLLENBQUE7WUFDekIsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQTtZQUMzQixJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFBO1lBQzNCLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFBO1lBQzlCLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEtBQUssR0FBRyxLQUFLLEdBQUcsS0FBSyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsS0FBSyxHQUFHLEtBQUssR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLEtBQUssR0FBRyxLQUFLLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxLQUFLLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsS0FBSyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsS0FBSyxHQUFHLEtBQUssR0FBRyxLQUFLLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxLQUFLLEdBQUcsS0FBSyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsS0FBSyxHQUFHLEtBQUssR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLEtBQUssR0FBRyxLQUFLLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxLQUFLLEdBQUcsS0FBSyxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsS0FBSyxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEtBQUssR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQTtRQUMvWCxDQUFDLENBQUE7SUFDSCxDQUFDO0lBUUQsa0NBQU0sR0FBTixVQUFPLENBQWUsRUFBRSxXQUFxQixFQUFFLEVBQVUsRUFBRSxFQUFVLEVBQUUsUUFBMEM7UUFDL0csSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQTtJQUN0SCxDQUFDO0lBQ0gsd0JBQUM7QUFBRCxDQTVCQSxBQTRCQyxJQUFBO0FBRUQ7SUFZRSxpQ0FBWSxDQWFYO1FBYkQsaUJBcURDO1FBaEVELG9CQUFlLEdBQUcsR0FBRyxDQUFBO1FBaUVyQixVQUFLLEdBQUc7WUFDTixLQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEtBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxLQUFJLENBQUMsZUFBZSxFQUFFLENBQUMsR0FBRyxLQUFJLENBQUMsZUFBZSxFQUFFLENBQUMsR0FBRyxLQUFJLENBQUMsZUFBZSxDQUFDLENBQUE7WUFDcEgsSUFBSSxDQUFDLEdBQUcsS0FBSSxDQUFDLElBQUksQ0FBQyxLQUFJLENBQUMsVUFBVSxDQUFDLENBQUE7WUFDbEMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7WUFDNUIsSUFBTSxDQUFDLEdBQUcsS0FBSSxDQUFDLEdBQUcsQ0FBQTtZQUNsQixJQUFNLENBQUMsR0FBRyxLQUFJLENBQUMsTUFBTSxDQUFBO1lBQ3JCLElBQUksRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFBO1lBQ2xCLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUE7WUFDN0QsSUFBSSxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQTtZQUNsRSxDQUFDLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQTtZQUNuQixDQUFDLENBQUMsV0FBVyxHQUFHLE1BQU0sQ0FBQTtZQUN0QixDQUFDLENBQUMsU0FBUyxFQUFFLENBQUE7WUFDYixDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQTtZQUNoQixDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQTtZQUNoQixDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQTtZQUNoQixDQUFDLENBQUMsTUFBTSxFQUFFLENBQUE7WUFDVixDQUFDLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQTtZQUNwQixDQUFDLENBQUMsU0FBUyxFQUFFLENBQUE7WUFDYixD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QyxLQUFLLENBQUMsQ0FBQTtZQUNuQyxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDO0lBekRELDhDQUFZLEdBQVosVUFBYSxJQUFZO1FBQ3ZCLE1BQU0sQ0FBQyxVQUFDLENBQVEsSUFBSyxPQUFBLFFBQVEsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsV0FBVyxHQUFzQixDQUFDLENBQUMsTUFBTyxDQUFDLEtBQUssRUFBOUUsQ0FBOEUsQ0FBQTtJQUNyRyxDQUFDO0lBMkZILDhCQUFDO0FBQUQsQ0FyR0EsQUFxR0MsSUFBQTtBQXJHWSwwREFBdUIiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBBbiBpbXBsZW1lbnRhdGlvbiBvZiBPREVYLCBieSBFLiBIYWlyZXIgYW5kIEcuIFdhbm5lciwgcG9ydGVkIGZyb20gdGhlIEZvcnRyYW4gT0RFWC5GLlxuICogVGhlIG9yaWdpbmFsIHdvcmsgY2FycmllcyB0aGUgQlNEIDItY2xhdXNlIGxpY2Vuc2UsIGFuZCBzbyBkb2VzIHRoaXMuXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE2IENvbGluIFNtaXRoLlxuICogMS4gUmVkaXN0cmlidXRpb25zIG9mIHNvdXJjZSBjb2RlIG11c3QgcmV0YWluIHRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlLCB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZ1xuICogZGlzY2xhaW1lci5cbiAqIDIuIFJlZGlzdHJpYnV0aW9ucyBpbiBiaW5hcnkgZm9ybSBtdXN0IHJlcHJvZHVjZSB0aGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSwgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZVxuICogZm9sbG93aW5nIGRpc2NsYWltZXIgaW4gdGhlIGRvY3VtZW50YXRpb24gYW5kL29yIG90aGVyIG1hdGVyaWFscyBwcm92aWRlZCB3aXRoIHRoZSBkaXN0cmlidXRpb24uXG4gKlxuICogVEhJUyBTT0ZUV0FSRSBJUyBQUk9WSURFRCBCWSBUSEUgQ09QWVJJR0hUIEhPTERFUlMgQU5EIENPTlRSSUJVVE9SUyBcIkFTIElTXCIgQU5EIEFOWSBFWFBSRVNTIE9SIElNUExJRUQgV0FSUkFOVElFUyxcbiAqIElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBUSEUgSU1QTElFRCBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSBBTkQgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0VcbiAqIEFSRSBESVNDTEFJTUVELiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQ09QWVJJR0hUIEhPTERFUiBPUiBDT05UUklCVVRPUlMgQkUgTElBQkxFIEZPUiBBTlkgRElSRUNULCBJTkRJUkVDVCxcbiAqIElOQ0lERU5UQUwsIFNQRUNJQUwsIEVYRU1QTEFSWSwgT1IgQ09OU0VRVUVOVElBTCBEQU1BR0VTIChJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgUFJPQ1VSRU1FTlQgT0YgU1VCU1RJVFVURVxuICogR09PRFMgT1IgU0VSVklDRVM7IExPU1MgT0YgVVNFLCBEQVRBLCBPUiBQUk9GSVRTOyBPUiBCVVNJTkVTUyBJTlRFUlJVUFRJT04pIEhPV0VWRVIgQ0FVU0VEIEFORCBPTiBBTlkgVEhFT1JZIE9GXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQ09OVFJBQ1QsIFNUUklDVCBMSUFCSUxJVFksIE9SIFRPUlQgKElOQ0xVRElORyBORUdMSUdFTkNFIE9SIE9USEVSV0lTRSkgQVJJU0lORyBJTiBBTlkgV0FZXG4gKiBPVVQgT0YgVEhFIFVTRSBPRiBUSElTIFNPRlRXQVJFLCBFVkVOIElGIEFEVklTRUQgT0YgVEhFIFBPU1NJQklMSVRZIE9GIFNVQ0ggREFNQUdFLlxuICovXG5cbmV4cG9ydCBpbnRlcmZhY2UgRGVyaXZhdGl2ZSB7ICAvLyBmdW5jdGlvbiBjb21wdXRpbmcgdGhlIHZhbHVlIG9mIFknID0gRih4LFkpXG4gICh4OiBudW1iZXIsICAgICAgICAgICAvLyBpbnB1dCB4IHZhbHVlXG4gICB5OiBudW1iZXJbXSkgICAgICAgICAvLyBpbnB1dCB5IHZhbHVlKVxuICAgIDogbnVtYmVyW10gICAgICAgICAgLy8gb3V0cHV0IHknIHZhbHVlcyAoQXJyYXkgb2YgbGVuZ3RoIG4pXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3V0cHV0RnVuY3Rpb24geyAgICAgICAgICAgICAgICAgICAgLy8gdmFsdWUgY2FsbGJhY2tcbiAgKG5yOiBudW1iZXIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBzdGVwIG51bWJlclxuICAgeG9sZDogbnVtYmVyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGxlZnQgZWRnZSBvZiBzb2x1dGlvbiBpbnRlcnZhbFxuICAgeDogbnVtYmVyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJpZ2h0IGVkZ2Ugb2Ygc29sdXRpb24gaW50ZXJ2YWwgKHkgPSBGKHgpKVxuICAgeTogbnVtYmVyW10sICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEYoeClcbiAgIGRlbnNlPzogKGM6IG51bWJlciwgeDogbnVtYmVyKSA9PiBudW1iZXIpICAvLyBkZW5zZSBpbnRlcnBvbGF0b3IuIFZhbGlkIGluIHRoZSByYW5nZSBbeCwgeG9sZCkuXG4gICAgOiBib29sZWFufHZvaWQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmV0dXJuIGZhbHNlIHRvIGhhbHQgaW50ZWdyYXRpb25cbn1cblxuZXhwb3J0IGVudW0gT3V0Y29tZSB7XG4gIENvbnZlcmdlZCxcbiAgTWF4U3RlcHNFeGNlZWRlZCxcbiAgRWFybHlSZXR1cm5cbn1cblxuZXhwb3J0IGNsYXNzIFNvbHZlciB7XG4gIG46IG51bWJlciAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGRpbWVuc2lvbiBvZiB0aGUgc3lzdGVtXG4gIHVSb3VuZDogbnVtYmVyICAgICAgICAgICAgICAgICAgICAgIC8vIFdPUksoMSksIG1hY2hpbmUgZXBzaWxvbi4gKFdPUkssIElXT1JLIGFyZSByZWZlcmVuY2VzIHRvIG9kZXguZilcbiAgbWF4U3RlcHM6IG51bWJlciAgICAgICAgICAgICAgICAgICAgLy8gSVdPUksoMSksIHBvc2l0aXZlIGludGVnZXJcbiAgaW5pdGlhbFN0ZXBTaXplOiBudW1iZXIgICAgICAgICAgICAgLy8gSFxuICBtYXhTdGVwU2l6ZTogbnVtYmVyICAgICAgICAgICAgICAgICAvLyBXT1JLKDIpLCBtYXhpbWFsIHN0ZXAgc2l6ZSwgZGVmYXVsdCB4RW5kIC0geFxuICBtYXhFeHRyYXBvbGF0aW9uQ29sdW1uczogbnVtYmVyICAgICAvLyBJV09SSygyKSwgS00sIHBvc2l0aXZlIGludGVnZXJcbiAgc3RlcFNpemVTZXF1ZW5jZTogbnVtYmVyICAgICAgICAgICAgLy8gSVdPUksoMyksIGluIFsxLi41XVxuICBzdGFiaWxpdHlDaGVja0NvdW50OiBudW1iZXIgICAgICAgICAvLyBJV09SSyg0KSwgaW5cbiAgc3RhYmlsaXR5Q2hlY2tUYWJsZUxpbmVzOiBudW1iZXIgICAgLy8gSVdPUksoNSksIHBvc2l0aXZlIGludGVnZXJcbiAgZGVuc2VPdXRwdXQ6IGJvb2xlYW4gICAgICAgICAgICAgICAgLy8gSU9VVCA+PSAyLCB0cnVlIG1lYW5zIGRlbnNlIG91dHB1dCBpbnRlcnBvbGF0b3IgcHJvdmlkZWQgdG8gc29sT3V0XG4gIGRlbnNlT3V0cHV0RXJyb3JFc3RpbWF0b3I6IGJvb2xlYW4gIC8vIElXT1JLKDYpLCByZXZlcnNlZCBzZW5zZSBmcm9tIHRoZSBGT1JUUkFOIGNvZGVcbiAgZGVuc2VDb21wb25lbnRzOiBudW1iZXJbXSAgICAgICAgICAgLy8gSVdPUksoOCkgJiBJV09SSygyMSwuLi4pLCBjb21wb25lbnRzIGZvciB3aGljaCBkZW5zZSBvdXRwdXQgaXMgcmVxdWlyZWRcbiAgaW50ZXJwb2xhdGlvbkZvcm11bGFEZWdyZWU6IG51bWJlciAgLy8gSVdPUksoNyksIMK1ID0gMiAqIGsgLSBpbnRlcnBvbGF0aW9uRm9ybXVsYURlZ3JlZSArIDEgWzEuLjZdLCBkZWZhdWx0IDRcbiAgc3RlcFNpemVSZWR1Y3Rpb25GYWN0b3I6IG51bWJlciAgICAgLy8gV09SSygzKSwgZGVmYXVsdCAwLjVcbiAgc3RlcFNpemVGYWMxOiBudW1iZXIgICAgICAgICAgICAgICAgLy8gV09SSyg0KVxuICBzdGVwU2l6ZUZhYzI6IG51bWJlciAgICAgICAgICAgICAgICAvLyBXT1JLKDUpXG4gIHN0ZXBTaXplRmFjMzogbnVtYmVyICAgICAgICAgICAgICAgIC8vIFdPUksoNilcbiAgc3RlcFNpemVGYWM0OiBudW1iZXIgICAgICAgICAgICAgICAgLy8gV09SSyg3KVxuICBzdGVwU2FmZXR5RmFjdG9yMTogbnVtYmVyICAgICAgICAgICAvLyBXT1JLKDgpXG4gIHN0ZXBTYWZldHlGYWN0b3IyOiBudW1iZXIgICAgICAgICAgIC8vIFdPUksoOSlcbiAgcmVsYXRpdmVUb2xlcmFuY2U6IG51bWJlcnxudW1iZXJbXSAgLy8gUlRPTC4gQ2FuIGJlIGEgc2NhbGFyIG9yIHZlY3RvciBvZiBsZW5ndGggTi5cbiAgYWJzb2x1dGVUb2xlcmFuY2U6IG51bWJlcnxudW1iZXJbXSAgLy8gQVRPTC4gQ2FuIGJlIGEgc2NhbGFyIG9yIHZlY3RvciBvZiBsZW5ndGggTi5cbiAgZGVidWc6IGJvb2xlYW5cblxuICBjb25zdHJ1Y3RvcihuOiBudW1iZXIpIHtcbiAgICB0aGlzLm4gPSBuXG4gICAgdGhpcy51Um91bmQgPSAyLjNlLTE2XG4gICAgdGhpcy5tYXhTdGVwcyA9IDEwMDAwXG4gICAgdGhpcy5pbml0aWFsU3RlcFNpemUgPSAxZS00XG4gICAgdGhpcy5tYXhTdGVwU2l6ZSA9IDBcbiAgICB0aGlzLm1heEV4dHJhcG9sYXRpb25Db2x1bW5zID0gOVxuICAgIHRoaXMuc3RlcFNpemVTZXF1ZW5jZSA9IDBcbiAgICB0aGlzLnN0YWJpbGl0eUNoZWNrQ291bnQgPSAxXG4gICAgdGhpcy5zdGFiaWxpdHlDaGVja1RhYmxlTGluZXMgPSAyXG4gICAgdGhpcy5kZW5zZU91dHB1dCA9IGZhbHNlXG4gICAgdGhpcy5kZW5zZU91dHB1dEVycm9yRXN0aW1hdG9yID0gdHJ1ZVxuICAgIHRoaXMuZGVuc2VDb21wb25lbnRzID0gdW5kZWZpbmVkXG4gICAgdGhpcy5pbnRlcnBvbGF0aW9uRm9ybXVsYURlZ3JlZSA9IDRcbiAgICB0aGlzLnN0ZXBTaXplUmVkdWN0aW9uRmFjdG9yID0gMC41XG4gICAgdGhpcy5zdGVwU2l6ZUZhYzEgPSAwLjAyXG4gICAgdGhpcy5zdGVwU2l6ZUZhYzIgPSA0LjBcbiAgICB0aGlzLnN0ZXBTaXplRmFjMyA9IDAuOFxuICAgIHRoaXMuc3RlcFNpemVGYWM0ID0gMC45XG4gICAgdGhpcy5zdGVwU2FmZXR5RmFjdG9yMSA9IDAuNjVcbiAgICB0aGlzLnN0ZXBTYWZldHlGYWN0b3IyID0gMC45NFxuICAgIHRoaXMucmVsYXRpdmVUb2xlcmFuY2UgPSAxZS01XG4gICAgdGhpcy5hYnNvbHV0ZVRvbGVyYW5jZSA9IDFlLTVcbiAgICB0aGlzLmRlYnVnID0gZmFsc2VcbiAgfVxuXG4gIGdyaWQoZHQ6IG51bWJlciwgb3V0OiAoeE91dDogbnVtYmVyLCB5T3V0OiBudW1iZXJbXSkgPT4gYW55KTogT3V0cHV0RnVuY3Rpb24ge1xuICAgIGxldCBjb21wb25lbnRzOiBudW1iZXJbXSA9IHRoaXMuZGVuc2VDb21wb25lbnRzXG4gICAgaWYgKCFjb21wb25lbnRzKSB7XG4gICAgICBjb21wb25lbnRzID0gW11cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uOyArK2kpIGNvbXBvbmVudHMucHVzaChpKVxuICAgIH1cbiAgICBsZXQgdDogbnVtYmVyXG4gICAgcmV0dXJuIChuOiBudW1iZXIsIHhPbGQ6IG51bWJlciwgeDogbnVtYmVyLCB5OiBudW1iZXJbXSwgaW50ZXJwb2xhdGU6IChpOiBudW1iZXIsIHg6IG51bWJlcikgPT4gbnVtYmVyKSA9PiB7XG4gICAgICBpZiAobiA9PT0gMSkge1xuICAgICAgICBvdXQoeCwgeSlcbiAgICAgICAgdCA9IHggKyBkdFxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIHdoaWxlICh0IDw9IHgpIHtcbiAgICAgICAgbGV0IHlmOiBudW1iZXJbXSA9IFtdXG4gICAgICAgIGZvciAobGV0IGkgb2YgY29tcG9uZW50cykge1xuICAgICAgICAgIHlmLnB1c2goaW50ZXJwb2xhdGUoaSwgdCkpXG4gICAgICAgIH1cbiAgICAgICAgb3V0KHQsIHlmKVxuICAgICAgICB0ICs9IGR0XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gcmV0dXJuIGEgMS1iYXNlZCBhcnJheSBvZiBsZW5ndGggbi4gSW5pdGlhbCB2YWx1ZXMgdW5kZWZpbmVkLlxuICBwcml2YXRlIHN0YXRpYyBkaW0gPSAobjogbnVtYmVyKSA9PiBBcnJheShuICsgMSlcbiAgcHJpdmF0ZSBzdGF0aWMgbG9nMTAgPSAoeDogbnVtYmVyKSA9PiBNYXRoLmxvZyh4KSAvIE1hdGguTE4xMFxuXG4gIC8vIE1ha2UgYSAxLWJhc2VkIDJEIGFycmF5LCB3aXRoIHIgcm93cyBhbmQgYyBjb2x1bW5zLiBUaGUgaW5pdGlhbCB2YWx1ZXMgYXJlIHVuZGVmaW5lZC5cbiAgcHJpdmF0ZSBzdGF0aWMgZGltMihyOiBudW1iZXIsIGM6IG51bWJlcik6IG51bWJlcltdW10ge1xuICAgIGxldCBhID0gbmV3IEFycmF5KHIgKyAxKVxuICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IHI7ICsraSkgYVtpXSA9IFNvbHZlci5kaW0oYylcbiAgICByZXR1cm4gYVxuICB9XG5cbiAgLy8gR2VuZXJhdGUgc3RlcCBzaXplIHNlcXVlbmNlIGFuZCByZXR1cm4gYXMgYSAxLWJhc2VkIGFycmF5IG9mIGxlbmd0aCBuLlxuICBzdGF0aWMgc3RlcFNpemVTZXF1ZW5jZShuU2VxOiBudW1iZXIsIG46IG51bWJlcik6IG51bWJlcltdIHtcbiAgICBjb25zdCBhID0gbmV3IEFycmF5KG4gKyAxKVxuICAgIGFbMF0gPSAwXG4gICAgc3dpdGNoIChuU2VxKSB7XG4gICAgICBjYXNlIDE6XG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG47ICsraSkgYVtpXSA9IDIgKiBpXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlIDI6XG4gICAgICAgIGFbMV0gPSAyXG4gICAgICAgIGZvciAobGV0IGkgPSAyOyBpIDw9IG47ICsraSkgYVtpXSA9IDQgKiBpIC0gNFxuICAgICAgICBicmVha1xuICAgICAgY2FzZSAzOlxuICAgICAgICBhWzFdID0gMlxuICAgICAgICBhWzJdID0gNFxuICAgICAgICBhWzNdID0gNlxuICAgICAgICBmb3IgKGxldCBpID0gNDsgaSA8PSBuOyArK2kpIGFbaV0gPSAyICogYVtpIC0gMl1cbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgNDpcbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbjsgKytpKSBhW2ldID0gNCAqIGkgLSAyXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlIDU6XG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG47ICsraSkgYVtpXSA9IDQgKiBpXG4gICAgICAgIGJyZWFrXG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2ludmFsaWQgc3RlcFNpemVTZXF1ZW5jZSBzZWxlY3RlZCcpXG4gICAgfVxuICAgIHJldHVybiBhXG4gIH1cblxuICAvLyBJbnRlZ3JhdGUgdGhlIGRpZmZlcmVudGlhbCBzeXN0ZW0gcmVwcmVzZW50ZWQgYnkgZiwgZnJvbSB4IHRvIHhFbmQsIHdpdGggaW5pdGlhbCBkYXRhIHkuXG4gIC8vIHNvbE91dCwgaWYgcHJvdmlkZWQsIGlzIGNhbGxlZCBhdCBlYWNoIGludGVncmF0aW9uIHN0ZXAuXG4gIHNvbHZlKGY6IERlcml2YXRpdmUsXG4gICAgICAgIHg6IG51bWJlcixcbiAgICAgICAgeTA6IG51bWJlcltdLFxuICAgICAgICB4RW5kOiBudW1iZXIsXG4gICAgICAgIHNvbE91dD86IE91dHB1dEZ1bmN0aW9uKSB7XG5cbiAgICAvLyBNYWtlIGEgY29weSBvZiB5MCwgMS1iYXNlZC4gV2UgbGVhdmUgdGhlIHVzZXIncyBwYXJhbWV0ZXJzIGFsb25lIHNvIHRoYXQgdGhleSBtYXkgYmUgcmV1c2VkIGlmIGRlc2lyZWQuXG4gICAgbGV0IHkgPSBbMF0uY29uY2F0KHkwKVxuICAgIGxldCBkeiA9IFNvbHZlci5kaW0odGhpcy5uKVxuICAgIGxldCB5aDEgPSBTb2x2ZXIuZGltKHRoaXMubilcbiAgICBsZXQgeWgyID0gU29sdmVyLmRpbSh0aGlzLm4pXG4gICAgaWYgKHRoaXMubWF4U3RlcHMgPD0gMCkgdGhyb3cgbmV3IEVycm9yKCdtYXhTdGVwcyBtdXN0IGJlIHBvc2l0aXZlJylcbiAgICBjb25zdCBrbSA9IHRoaXMubWF4RXh0cmFwb2xhdGlvbkNvbHVtbnNcbiAgICBpZiAoa20gPD0gMikgdGhyb3cgbmV3IEVycm9yKCdtYXhFeHRyYXBvbGF0aW9uQ29sdW1ucyBtdXN0IGJlID4gMicpXG4gICAgY29uc3QgblNlcSA9IHRoaXMuc3RlcFNpemVTZXF1ZW5jZSB8fCAodGhpcy5kZW5zZU91dHB1dCA/IDQgOiAxKVxuICAgIGlmIChuU2VxIDw9IDMgJiYgdGhpcy5kZW5zZU91dHB1dCkgdGhyb3cgbmV3IEVycm9yKCdzdGVwU2l6ZVNlcXVlbmNlIGluY29tcGF0aWJsZSB3aXRoIGRlbnNlT3V0cHV0JylcbiAgICBpZiAodGhpcy5kZW5zZU91dHB1dCAmJiAhc29sT3V0KSB0aHJvdyBuZXcgRXJyb3IoJ2RlbnNlT3V0cHV0IHJlcXVpcmVzIGEgc29sdXRpb24gb2JzZXJ2ZXIgZnVuY3Rpb24nKVxuICAgIGlmICh0aGlzLmludGVycG9sYXRpb25Gb3JtdWxhRGVncmVlIDw9IDAgfHwgdGhpcy5pbnRlcnBvbGF0aW9uRm9ybXVsYURlZ3JlZSA+PSA3KSB0aHJvdyBuZXcgRXJyb3IoJ2JhZCBpbnRlcnBvbGF0aW9uRm9ybXVsYURlZ3JlZScpXG4gICAgbGV0IGljb20gPSBbMF0gIC8vIGljb20gd2lsbCBiZSAxLWJhc2VkLCBzbyBzdGFydCB3aXRoIGEgcGFkIGVudHJ5LlxuICAgIGxldCBucmRlbnMgPSAwXG4gICAgaWYgKHRoaXMuZGVuc2VPdXRwdXQpIHtcbiAgICAgIGlmICh0aGlzLmRlbnNlQ29tcG9uZW50cykge1xuICAgICAgICBmb3IgKGxldCBjIG9mIHRoaXMuZGVuc2VDb21wb25lbnRzKSB7XG4gICAgICAgICAgLy8gY29udmVydCBkZW5zZSBjb21wb25lbnRzIHJlcXVlc3RlZCBpbnRvIG9uZS1iYXNlZCBpbmRleGluZy5cbiAgICAgICAgICBpZiAoYyA8IDAgfHwgYyA+IHRoaXMubikgdGhyb3cgbmV3IEVycm9yKCdiYWQgZGVuc2UgY29tcG9uZW50OiAnICsgYylcbiAgICAgICAgICBpY29tLnB1c2goYyArIDEpXG4gICAgICAgICAgKytucmRlbnNcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gaWYgdXNlciBhc2tlZCBmb3IgZGVuc2Ugb3V0cHV0IGJ1dCBkaWQgbm90IHNwZWNpZnkgYW55IGRlbnNlQ29tcG9uZW50cyxcbiAgICAgICAgLy8gcmVxdWVzdCBhbGwgb2YgdGhlbS5cbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gdGhpcy5uOyArK2kpIHtcbiAgICAgICAgICBpY29tLnB1c2goaSlcbiAgICAgICAgfVxuICAgICAgICBucmRlbnMgPSB0aGlzLm5cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRoaXMudVJvdW5kIDw9IDFlLTM1IHx8IHRoaXMudVJvdW5kID4gMSkgdGhyb3cgbmV3IEVycm9yKCdzdXNwaWNpb3VzIHZhbHVlIG9mIHVSb3VuZCcpXG4gICAgY29uc3QgaE1heCA9IE1hdGguYWJzKHRoaXMubWF4U3RlcFNpemUgfHwgeEVuZCAtIHgpXG4gICAgY29uc3QgbGZTYWZlID0gMiAqIGttICoga20gKyBrbVxuXG4gICAgZnVuY3Rpb24gZXhwYW5kVG9BcnJheSh4OiBudW1iZXJ8bnVtYmVyW10sIG46IG51bWJlcik6IG51bWJlcltdIHtcbiAgICAgIC8vIElmIHggaXMgYW4gYXJyYXksIHJldHVybiBhIDEtYmFzZWQgY29weSBvZiBpdC4gSWYgeCBpcyBhIG51bWJlciwgcmV0dXJuIGEgbmV3IDEtYmFzZWQgYXJyYXlcbiAgICAgIC8vIGNvbnNpc3Rpbmcgb2YgbiBjb3BpZXMgb2YgdGhlIG51bWJlci5cbiAgICAgIGNvbnN0IHRvbEFycmF5ID0gWzBdXG4gICAgICBpZiAoQXJyYXkuaXNBcnJheSh4KSkge1xuICAgICAgICByZXR1cm4gdG9sQXJyYXkuY29uY2F0KHgpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG47ICsraSkgdG9sQXJyYXkucHVzaCh4KVxuICAgICAgICByZXR1cm4gdG9sQXJyYXlcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBhVG9sID0gZXhwYW5kVG9BcnJheSh0aGlzLmFic29sdXRlVG9sZXJhbmNlLCB0aGlzLm4pXG4gICAgY29uc3QgclRvbCA9IGV4cGFuZFRvQXJyYXkodGhpcy5yZWxhdGl2ZVRvbGVyYW5jZSwgdGhpcy5uKVxuICAgIGxldCBbbkV2YWwsIG5TdGVwLCBuQWNjZXB0LCBuUmVqZWN0XSA9IFswLCAwLCAwLCAwXVxuXG4gICAgLy8gY2FsbCB0byBjb3JlIGludGVncmF0b3JcbiAgICBjb25zdCBucmQgPSBNYXRoLm1heCgxLCBucmRlbnMpXG4gICAgY29uc3QgbmNvbSA9IE1hdGgubWF4KDEsICgyICoga20gKyA1KSAqIG5yZGVucylcbiAgICBjb25zdCBkZW5zID0gU29sdmVyLmRpbShuY29tKVxuICAgIGNvbnN0IGZTYWZlID0gU29sdmVyLmRpbTIobGZTYWZlLCBucmQpXG5cbiAgICAvLyBXcmFwIGYgaW4gYSBmdW5jdGlvbiBGIHdoaWNoIGhpZGVzIHRoZSBvbmUtYmFzZWQgaW5kZXhpbmcgZnJvbSB0aGUgY3VzdG9tZXJzLlxuICAgIGNvbnN0IEYgPSAoeDogbnVtYmVyLCB5OiBudW1iZXJbXSwgeXA6IG51bWJlcltdKSA9PiB7XG4gICAgICBsZXQgcmV0ID0gZih4LCB5LnNsaWNlKDEpKVxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZXQubGVuZ3RoOyArK2kpIHlwW2kgKyAxXSA9IHJldFtpXVxuICAgIH1cblxuICAgIGxldCBvZHhjb3IgPSAoKTogT3V0Y29tZSA9PiB7XG4gICAgICAvLyBUaGUgZm9sbG93aW5nIHRocmVlIHZhcmlhYmxlcyBhcmUgQ09NTU9OL0NPTlRFWC9cbiAgICAgIGxldCB4T2xkZDogbnVtYmVyXG4gICAgICBsZXQgaGhoOiBudW1iZXJcbiAgICAgIGxldCBrbWl0OiBudW1iZXJcblxuICAgICAgbGV0IGFjY2VwdFN0ZXAgPSAobjogbnVtYmVyKTogYm9vbGVhbiA9PiB7ICAgLy8gbGFiZWwgNjBcbiAgICAgICAgLy8gUmV0dXJucyB0cnVlIGlmIHdlIHNob3VsZCBjb250aW51ZSB0aGUgaW50ZWdyYXRpb24uIFRoZSBvbmx5IHRpbWUgZmFsc2VcbiAgICAgICAgLy8gaXMgcmV0dXJuZWQgaXMgd2hlbiB0aGUgdXNlcidzIHNvbHV0aW9uIG9ic2VydmF0aW9uIGZ1bmN0aW9uIGhhcyByZXR1cm5lZCBmYWxzZSxcbiAgICAgICAgLy8gaW5kaWNhdGluZyB0aGF0IHNoZSBkb2VzIG5vdCB3aXNoIHRvIGNvbnRpbnVlIHRoZSBjb21wdXRhdGlvbi5cbiAgICAgICAgeE9sZCA9IHhcbiAgICAgICAgeCArPSBoXG4gICAgICAgIGlmICh0aGlzLmRlbnNlT3V0cHV0KSB7XG4gICAgICAgICAgLy8ga21pdCA9IG11IG9mIHRoZSBwYXBlclxuICAgICAgICAgIGttaXQgPSAyICoga2MgLSB0aGlzLmludGVycG9sYXRpb25Gb3JtdWxhRGVncmVlICsgMVxuICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG5yZDsgKytpKSBkZW5zW2ldID0geVtpY29tW2ldXVxuICAgICAgICAgIHhPbGRkID0geE9sZFxuICAgICAgICAgIGhoaCA9IGggIC8vIG5vdGU6IHhPbGRkIGFuZCBoaGggYXJlIHBhcnQgb2YgL0NPTk9EWC9cbiAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBucmQ7ICsraSkgZGVuc1tucmQgKyBpXSA9IGggKiBkeltpY29tW2ldXVxuICAgICAgICAgIGxldCBrbG4gPSAyICogbnJkXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbnJkOyArK2kpIGRlbnNba2xuICsgaV0gPSB0WzFdW2ljb21baV1dXG4gICAgICAgICAgLy8gY29tcHV0ZSBzb2x1dGlvbiBhdCBtaWQtcG9pbnRcbiAgICAgICAgICBmb3IgKGxldCBqID0gMjsgaiA8PSBrYzsgKytqKSB7XG4gICAgICAgICAgICBsZXQgZGJsZW5qID0gbmpbal1cbiAgICAgICAgICAgIGZvciAobGV0IGwgPSBqOyBsID49IDI7IC0tbCkge1xuICAgICAgICAgICAgICBsZXQgZmFjdG9yID0gKGRibGVuaiAvIG5qW2wgLSAxXSkgKiogMiAtIDFcbiAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbnJkOyArK2kpIHtcbiAgICAgICAgICAgICAgICB5U2FmZVtsIC0gMV1baV0gPSB5U2FmZVtsXVtpXSArICh5U2FmZVtsXVtpXSAtIHlTYWZlW2wgLSAxXVtpXSkgLyBmYWN0b3JcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBsZXQga3JuID0gNCAqIG5yZFxuICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG5yZDsgKytpKSBkZW5zW2tybiArIGldID0geVNhZmVbMV1baV1cbiAgICAgICAgICAvLyBjb21wdXRlIGZpcnN0IGRlcml2YXRpdmUgYXQgcmlnaHQgZW5kXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbjsgKytpKSB5aDFbaV0gPSB0WzFdW2ldXG4gICAgICAgICAgRih4LCB5aDEsIHloMilcbiAgICAgICAgICBrcm4gPSAzICogbnJkXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbnJkOyArK2kpIGRlbnNba3JuICsgaV0gPSB5aDJbaWNvbVtpXV0gKiBoXG4gICAgICAgICAgLy8gVEhFIExPT1BcbiAgICAgICAgICBmb3IgKGxldCBrbWkgPSAxOyBrbWkgPD0ga21pdDsgKytrbWkpIHtcbiAgICAgICAgICAgIC8vIGNvbXB1dGUga21pLXRoIGRlcml2YXRpdmUgYXQgbWlkLXBvaW50XG4gICAgICAgICAgICBsZXQga2JlZyA9IChrbWkgKyAxKSAvIDIgfCAwXG4gICAgICAgICAgICBmb3IgKGxldCBrayA9IGtiZWc7IGtrIDw9IGtjOyArK2trKSB7XG4gICAgICAgICAgICAgIGxldCBmYWNuaiA9IChualtra10gLyAyKSAqKiAoa21pIC0gMSlcbiAgICAgICAgICAgICAgaVB0ID0gaVBvaW50W2trICsgMV0gLSAyICoga2sgKyBrbWlcbiAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbnJkOyArK2kpIHtcbiAgICAgICAgICAgICAgICB5U2FmZVtra11baV0gPSBmU2FmZVtpUHRdW2ldICogZmFjbmpcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChsZXQgaiA9IGtiZWcgKyAxOyBqIDw9IGtjOyArK2opIHtcbiAgICAgICAgICAgICAgbGV0IGRibGVuaiA9IG5qW2pdXG4gICAgICAgICAgICAgIGZvciAobGV0IGwgPSBqOyBsID49IGtiZWcgKyAxOyAtLWwpIHtcbiAgICAgICAgICAgICAgICBsZXQgZmFjdG9yID0gKGRibGVuaiAvIG5qW2wgLSAxXSkgKiogMiAtIDFcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBucmQ7ICsraSkge1xuICAgICAgICAgICAgICAgICAgeVNhZmVbbCAtIDFdW2ldID0geVNhZmVbbF1baV0gKyAoeVNhZmVbbF1baV0gLSB5U2FmZVtsIC0gMV1baV0pIC8gZmFjdG9yXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBrcm4gPSAoa21pICsgNCkgKiBucmRcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG5yZDsgKytpKSBkZW5zW2tybiArIGldID0geVNhZmVba2JlZ11baV0gKiBoXG4gICAgICAgICAgICBpZiAoa21pID09PSBrbWl0KSBjb250aW51ZVxuICAgICAgICAgICAgLy8gY29tcHV0ZSBkaWZmZXJlbmNlc1xuICAgICAgICAgICAgZm9yIChsZXQga2sgPSAoa21pICsgMikgLyAyIHwgMDsga2sgPD0ga2M7ICsra2spIHtcbiAgICAgICAgICAgICAgbGV0IGxiZWcgPSBpUG9pbnRba2sgKyAxXVxuICAgICAgICAgICAgICBsZXQgbGVuZCA9IGlQb2ludFtra10gKyBrbWkgKyAxXG4gICAgICAgICAgICAgIGlmIChrbWkgPT09IDEgJiYgblNlcSA9PT0gNCkgbGVuZCArPSAyXG4gICAgICAgICAgICAgIGxldCBsOiBudW1iZXJcbiAgICAgICAgICAgICAgZm9yIChsID0gbGJlZzsgbCA+PSBsZW5kOyBsIC09IDIpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBucmQ7ICsraSkge1xuICAgICAgICAgICAgICAgICAgZlNhZmVbbF1baV0gLT0gZlNhZmVbbCAtIDJdW2ldXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChrbWkgPT09IDEgJiYgblNlcSA9PT0gNCkge1xuICAgICAgICAgICAgICAgIGwgPSBsZW5kIC0gMlxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG5yZDsgKytpKSBmU2FmZVtsXVtpXSAtPSBkeltpY29tW2ldXVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBjb21wdXRlIGRpZmZlcmVuY2VzXG4gICAgICAgICAgICBmb3IgKGxldCBrayA9IChrbWkgKyAyKSAvIDIgfCAwOyBrayA8PSBrYzsgKytraykge1xuICAgICAgICAgICAgICBsZXQgbGJlZyA9IGlQb2ludFtrayArIDFdIC0gMVxuICAgICAgICAgICAgICBsZXQgbGVuZCA9IGlQb2ludFtra10gKyBrbWkgKyAyXG4gICAgICAgICAgICAgIGZvciAobGV0IGwgPSBsYmVnOyBsID49IGxlbmQ7IGwgLT0gMikge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG5yZDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICBmU2FmZVtsXVtpXSAtPSBmU2FmZVtsIC0gMl1baV1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaW50ZXJwKG5yZCwgZGVucywga21pdClcbiAgICAgICAgICAvLyBlc3RpbWF0aW9uIG9mIGludGVycG9sYXRpb24gZXJyb3JcbiAgICAgICAgICBpZiAodGhpcy5kZW5zZU91dHB1dEVycm9yRXN0aW1hdG9yICYmIGttaXQgPj0gMSkge1xuICAgICAgICAgICAgbGV0IGVycmludCA9IDBcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG5yZDsgKytpKSBlcnJpbnQgKz0gKGRlbnNbKGttaXQgKyA0KSAqIG5yZCArIGldIC8gc2NhbFtpY29tW2ldXSkgKiogMlxuICAgICAgICAgICAgZXJyaW50ID0gTWF0aC5zcXJ0KGVycmludCAvIG5yZCkgKiBlcnJmYWNba21pdF1cbiAgICAgICAgICAgIGhvcHRkZSA9IGggLyBNYXRoLm1heChlcnJpbnQgKiogKDEgLyAoa21pdCArIDQpKSwgMC4wMSlcbiAgICAgICAgICAgIGlmIChlcnJpbnQgPiAxMCkge1xuICAgICAgICAgICAgICBoID0gaG9wdGRlXG4gICAgICAgICAgICAgIHggPSB4T2xkXG4gICAgICAgICAgICAgICsrblJlamVjdFxuICAgICAgICAgICAgICByZWplY3QgPSB0cnVlXG4gICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG47ICsraSkgZHpbaV0gPSB5aDJbaV1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBuOyArK2kpIHlbaV0gPSB0WzFdW2ldXG4gICAgICAgICsrbkFjY2VwdFxuICAgICAgICBpZiAoc29sT3V0KSB7XG4gICAgICAgICAgLy8gSWYgZGVuc2VPdXRwdXQsIHdlIGFsc28gd2FudCB0byBzdXBwbHkgdGhlIGRlbnNlIGNsb3N1cmUuXG4gICAgICAgICAgaWYgKHNvbE91dChuQWNjZXB0ICsgMSwgeE9sZCwgeCwgeS5zbGljZSgxKSxcbiAgICAgICAgICAgICAgdGhpcy5kZW5zZU91dHB1dCAmJiBjb250ZXgoeE9sZGQsIGhoaCwga21pdCwgZGVucywgaWNvbSkpID09PSBmYWxzZSkgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cbiAgICAgICAgLy8gY29tcHV0ZSBvcHRpbWFsIG9yZGVyXG4gICAgICAgIGxldCBrb3B0OiBudW1iZXJcbiAgICAgICAgaWYgKGtjID09PSAyKSB7XG4gICAgICAgICAga29wdCA9IE1hdGgubWluKDMsIGttIC0gMSlcbiAgICAgICAgICBpZiAocmVqZWN0KSBrb3B0ID0gMlxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChrYyA8PSBrKSB7XG4gICAgICAgICAgICBrb3B0ID0ga2NcbiAgICAgICAgICAgIGlmICh3W2tjIC0gMV0gPCB3W2tjXSAqIHRoaXMuc3RlcFNpemVGYWMzKSBrb3B0ID0ga2MgLSAxXG4gICAgICAgICAgICBpZiAod1trY10gPCB3W2tjIC0gMV0gKiB0aGlzLnN0ZXBTaXplRmFjNCkga29wdCA9IE1hdGgubWluKGtjICsgMSwga20gLSAxKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBrb3B0ID0ga2MgLSAxXG4gICAgICAgICAgICBpZiAoa2MgPiAzICYmIHdba2MgLSAyXSA8IHdba2MgLSAxXSAqIHRoaXMuc3RlcFNpemVGYWMzKSBrb3B0ID0ga2MgLSAyXG4gICAgICAgICAgICBpZiAod1trY10gPCB3W2tvcHRdICogdGhpcy5zdGVwU2l6ZUZhYzQpIGtvcHQgPSBNYXRoLm1pbihrYywga20gLSAxKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBhZnRlciBhIHJlamVjdGVkIHN0ZXBcbiAgICAgICAgaWYgKHJlamVjdCkge1xuICAgICAgICAgIGsgPSBNYXRoLm1pbihrb3B0LCBrYylcbiAgICAgICAgICBoID0gcG9zbmVnICogTWF0aC5taW4oTWF0aC5hYnMoaCksIE1hdGguYWJzKGhoW2tdKSlcbiAgICAgICAgICByZWplY3QgPSBmYWxzZVxuICAgICAgICAgIHJldHVybiB0cnVlICAvLyBnb3RvIDEwXG4gICAgICAgIH1cbiAgICAgICAgaWYgKGtvcHQgPD0ga2MpIHtcbiAgICAgICAgICBoID0gaGhba29wdF1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoa2MgPCBrICYmIHdba2NdIDwgd1trYyAtIDFdICogdGhpcy5zdGVwU2l6ZUZhYzQpIHtcbiAgICAgICAgICAgIGggPSBoaFtrY10gKiBhW2tvcHQgKyAxXSAvIGFba2NdXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGggPSBoaFtrY10gKiBhW2tvcHRdIC8gYVtrY11cbiAgICAgICAgICB9XG5cblxuICAgICAgICB9XG4gICAgICAgIC8vIGNvbXB1dGUgc3RlcHNpemUgZm9yIG5leHQgc3RlcFxuICAgICAgICBrID0ga29wdFxuICAgICAgICBoID0gcG9zbmVnICogTWF0aC5hYnMoaClcbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgIH1cblxuICAgICAgbGV0IG1pZGV4ID0gKGo6IG51bWJlcik6IHZvaWQgPT4ge1xuICAgICAgICBjb25zdCBkeSA9IFNvbHZlci5kaW0odGhpcy5uKVxuICAgICAgICAvLyBDb21wdXRlcyB0aGUganRoIGxpbmUgb2YgdGhlIGV4dHJhcG9sYXRpb24gdGFibGUgYW5kXG4gICAgICAgIC8vIHByb3ZpZGVzIGFuIGVzdGltYXRpb24gb2YgdGhlIG9wdGlvbmFsIHN0ZXBzaXplXG4gICAgICAgIGNvbnN0IGhqID0gaCAvIG5qW2pdXG4gICAgICAgIC8vIEV1bGVyIHN0YXJ0aW5nIHN0ZXBcbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gdGhpcy5uOyArK2kpIHtcbiAgICAgICAgICB5aDFbaV0gPSB5W2ldXG4gICAgICAgICAgeWgyW2ldID0geVtpXSArIGhqICogZHpbaV1cbiAgICAgICAgfVxuICAgICAgICAvLyBFeHBsaWNpdCBtaWRwb2ludCBydWxlXG4gICAgICAgIGNvbnN0IG0gPSBualtqXSAtIDFcbiAgICAgICAgY29uc3QgbmpNaWQgPSAobmpbal0gLyAyKSB8IDBcbiAgICAgICAgZm9yIChsZXQgbW0gPSAxOyBtbSA8PSBtOyArK21tKSB7XG4gICAgICAgICAgaWYgKHRoaXMuZGVuc2VPdXRwdXQgJiYgbW0gPT09IG5qTWlkKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBucmQ7ICsraSkge1xuICAgICAgICAgICAgICB5U2FmZVtqXVtpXSA9IHloMltpY29tW2ldXVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBGKHggKyBoaiAqIG1tLCB5aDIsIGR5KVxuICAgICAgICAgIGlmICh0aGlzLmRlbnNlT3V0cHV0ICYmIE1hdGguYWJzKG1tIC0gbmpNaWQpIDw9IDIgKiBqIC0gMSkge1xuICAgICAgICAgICAgKytpUHRcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG5yZDsgKytpKSB7XG4gICAgICAgICAgICAgIGZTYWZlW2lQdF1baV0gPSBkeVtpY29tW2ldXVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSB0aGlzLm47ICsraSkge1xuICAgICAgICAgICAgbGV0IHlzID0geWgxW2ldXG4gICAgICAgICAgICB5aDFbaV0gPSB5aDJbaV1cbiAgICAgICAgICAgIHloMltpXSA9IHlzICsgMiAqIGhqICogZHlbaV1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG1tIDw9IHRoaXMuc3RhYmlsaXR5Q2hlY2tDb3VudCAmJiBqIDw9IHRoaXMuc3RhYmlsaXR5Q2hlY2tUYWJsZUxpbmVzKSB7XG4gICAgICAgICAgICAvLyBzdGFiaWxpdHkgY2hlY2tcbiAgICAgICAgICAgIGxldCBkZWwxID0gMFxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gdGhpcy5uOyArK2kpIHtcbiAgICAgICAgICAgICAgZGVsMSArPSAoZHpbaV0gLyBzY2FsW2ldKSAqKiAyXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgZGVsMiA9IDBcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IHRoaXMubjsgKytpKSB7XG4gICAgICAgICAgICAgIGRlbDIgKz0gKChkeVtpXSAtIGR6W2ldKSAvIHNjYWxbaV0pICoqIDJcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHF1b3QgPSBkZWwyIC8gTWF0aC5tYXgodGhpcy51Um91bmQsIGRlbDEpXG4gICAgICAgICAgICBpZiAocXVvdCA+IDQpIHtcbiAgICAgICAgICAgICAgKytuRXZhbFxuICAgICAgICAgICAgICBhdG92ID0gdHJ1ZVxuICAgICAgICAgICAgICBoICo9IHRoaXMuc3RlcFNpemVSZWR1Y3Rpb25GYWN0b3JcbiAgICAgICAgICAgICAgcmVqZWN0ID0gdHJ1ZVxuICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gZmluYWwgc21vb3RoaW5nIHN0ZXBcbiAgICAgICAgRih4ICsgaCwgeWgyLCBkeSlcbiAgICAgICAgaWYgKHRoaXMuZGVuc2VPdXRwdXQgJiYgbmpNaWQgPD0gMiAqIGogLSAxKSB7XG4gICAgICAgICAgKytpUHRcbiAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBucmQ7ICsraSkge1xuICAgICAgICAgICAgZlNhZmVbaVB0XVtpXSA9IGR5W2ljb21baV1dXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IHRoaXMubjsgKytpKSB7XG4gICAgICAgICAgdFtqXVtpXSA9ICh5aDFbaV0gKyB5aDJbaV0gKyBoaiAqIGR5W2ldKSAvIDJcbiAgICAgICAgfVxuICAgICAgICBuRXZhbCArPSBualtqXVxuICAgICAgICAvLyBwb2x5bm9taWFsIGV4dHJhcG9sYXRpb25cbiAgICAgICAgaWYgKGogPT09IDEpIHJldHVybiAgLy8gd2FzIGouZXEuMVxuICAgICAgICBjb25zdCBkYmxlbmogPSBualtqXVxuICAgICAgICBsZXQgZmFjOiBudW1iZXJcbiAgICAgICAgZm9yIChsZXQgbCA9IGo7IGwgPiAxOyAtLWwpIHtcbiAgICAgICAgICBmYWMgPSAoZGJsZW5qIC8gbmpbbCAtIDFdKSAqKiAyIC0gMVxuICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IHRoaXMubjsgKytpKSB7XG4gICAgICAgICAgICB0W2wgLSAxXVtpXSA9IHRbbF1baV0gKyAodFtsXVtpXSAtIHRbbCAtIDFdW2ldKSAvIGZhY1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlcnIgPSAwXG4gICAgICAgIC8vIHNjYWxpbmdcbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gdGhpcy5uOyArK2kpIHtcbiAgICAgICAgICBsZXQgdDFpID0gTWF0aC5tYXgoTWF0aC5hYnMoeVtpXSksIE1hdGguYWJzKHRbMV1baV0pKVxuICAgICAgICAgIHNjYWxbaV0gPSBhVG9sW2ldICsgclRvbFtpXSAqIHQxaVxuICAgICAgICAgIGVyciArPSAoKHRbMV1baV0gLSB0WzJdW2ldKSAvIHNjYWxbaV0pICoqIDJcbiAgICAgICAgfVxuICAgICAgICBlcnIgPSBNYXRoLnNxcnQoZXJyIC8gdGhpcy5uKVxuICAgICAgICBpZiAoZXJyICogdGhpcy51Um91bmQgPj0gMSB8fCAoaiA+IDIgJiYgZXJyID49IGVyck9sZCkpIHtcbiAgICAgICAgICBhdG92ID0gdHJ1ZVxuICAgICAgICAgIGggKj0gdGhpcy5zdGVwU2l6ZVJlZHVjdGlvbkZhY3RvclxuICAgICAgICAgIHJlamVjdCA9IHRydWVcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBlcnJPbGQgPSBNYXRoLm1heCg0ICogZXJyLCAxKVxuICAgICAgICAvLyBjb21wdXRlIG9wdGltYWwgc3RlcHNpemVzXG4gICAgICAgIGxldCBleHAwID0gMSAvICgyICogaiAtIDEpXG4gICAgICAgIGxldCBmYWNNaW4gPSB0aGlzLnN0ZXBTaXplRmFjMSAqKiBleHAwXG4gICAgICAgIGZhYyA9IE1hdGgubWluKHRoaXMuc3RlcFNpemVGYWMyIC8gZmFjTWluLFxuICAgICAgICAgIE1hdGgubWF4KGZhY01pbiwgKGVyciAvIHRoaXMuc3RlcFNhZmV0eUZhY3RvcjEpICoqIGV4cDAgLyB0aGlzLnN0ZXBTYWZldHlGYWN0b3IyKSlcbiAgICAgICAgZmFjID0gMSAvIGZhY1xuICAgICAgICBoaFtqXSA9IE1hdGgubWluKE1hdGguYWJzKGgpICogZmFjLCBoTWF4KVxuICAgICAgICB3W2pdID0gYVtqXSAvIGhoW2pdXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGludGVycCA9IChuOiBudW1iZXIsIHk6IG51bWJlcltdLCBpbWl0OiBudW1iZXIpID0+IHtcbiAgICAgICAgLy8gY29tcHV0ZXMgdGhlIGNvZWZmaWNpZW50cyBvZiB0aGUgaW50ZXJwb2xhdGlvbiBmb3JtdWxhXG4gICAgICAgIGxldCBhID0gbmV3IEFycmF5KDMxKSAgLy8gemVyby1iYXNlZDogMDozMFxuICAgICAgICAvLyBiZWdpbiB3aXRoIEhlcm1pdGUgaW50ZXJwb2xhdGlvblxuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBuOyArK2kpIHtcbiAgICAgICAgICBsZXQgeTAgPSB5W2ldXG4gICAgICAgICAgbGV0IHkxID0geVsyICogbiArIGldXG4gICAgICAgICAgbGV0IHlwMCA9IHlbbiArIGldXG4gICAgICAgICAgbGV0IHlwMSA9IHlbMyAqIG4gKyBpXVxuICAgICAgICAgIGxldCB5RGlmZiA9IHkxIC0geTBcbiAgICAgICAgICBsZXQgYXNwbCA9IC15cDEgKyB5RGlmZlxuICAgICAgICAgIGxldCBic3BsID0geXAwIC0geURpZmZcbiAgICAgICAgICB5W24gKyBpXSA9IHlEaWZmXG4gICAgICAgICAgeVsyICogbiArIGldID0gYXNwbFxuICAgICAgICAgIHlbMyAqIG4gKyBpXSA9IGJzcGxcbiAgICAgICAgICBpZiAoaW1pdCA8IDApIGNvbnRpbnVlXG4gICAgICAgICAgLy8gY29tcHV0ZSB0aGUgZGVyaXZhdGl2ZXMgb2YgSGVybWl0ZSBhdCBtaWRwb2ludFxuICAgICAgICAgIGxldCBwaDAgPSAoeTAgKyB5MSkgKiAwLjUgKyAwLjEyNSAqIChhc3BsICsgYnNwbClcbiAgICAgICAgICBsZXQgcGgxID0geURpZmYgKyAoYXNwbCAtIGJzcGwpICogMC4yNVxuICAgICAgICAgIGxldCBwaDIgPSAtKHlwMCAtIHlwMSlcbiAgICAgICAgICBsZXQgcGgzID0gNiAqIChic3BsIC0gYXNwbClcbiAgICAgICAgICAvLyBjb21wdXRlIHRoZSBmdXJ0aGVyIGNvZWZmaWNpZW50c1xuICAgICAgICAgIGlmIChpbWl0ID49IDEpIHtcbiAgICAgICAgICAgIGFbMV0gPSAxNiAqICh5WzUgKiBuICsgaV0gLSBwaDEpXG4gICAgICAgICAgICBpZiAoaW1pdCA+PSAzKSB7XG4gICAgICAgICAgICAgIGFbM10gPSAxNiAqICh5WzcgKiBuICsgaV0gLSBwaDMgKyAzICogYVsxXSlcbiAgICAgICAgICAgICAgaWYgKGltaXQgPj0gNSkge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGltID0gNTsgaW0gPD0gaW1pdDsgaW0gKz0gMikge1xuICAgICAgICAgICAgICAgICAgbGV0IGZhYzEgPSBpbSAqIChpbSAtIDEpIC8gMlxuICAgICAgICAgICAgICAgICAgbGV0IGZhYzIgPSBmYWMxICogKGltIC0gMikgKiAoaW0gLSAzKSAqIDJcbiAgICAgICAgICAgICAgICAgIGFbaW1dID0gMTYgKiAoeVsoaW0gKyA0KSAqIG4gKyBpXSArIGZhYzEgKiBhW2ltIC0gMl0gLSBmYWMyICogYVtpbSAtIDRdKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBhWzBdID0gKHlbNCAqIG4gKyBpXSAtIHBoMCkgKiAxNlxuICAgICAgICAgIGlmIChpbWl0ID49IDIpIHtcbiAgICAgICAgICAgIGFbMl0gPSAoeVtuICogNiArIGldIC0gcGgyICsgYVswXSkgKiAxNlxuICAgICAgICAgICAgaWYgKGltaXQgPj0gNCkge1xuICAgICAgICAgICAgICBmb3IgKGxldCBpbSA9IDQ7IGltIDw9IGltaXQ7IGltICs9IDIpIHtcbiAgICAgICAgICAgICAgICBsZXQgZmFjMSA9IGltICogKGltIC0gMSkgLyAyXG4gICAgICAgICAgICAgICAgbGV0IGZhYzIgPSBpbSAqIChpbSAtIDEpICogKGltIC0gMikgKiAoaW0gLSAzKVxuICAgICAgICAgICAgICAgIGFbaW1dID0gKHlbbiAqIChpbSArIDQpICsgaV0gKyBhW2ltIC0gMl0gKiBmYWMxIC0gYVtpbSAtIDRdICogZmFjMikgKiAxNlxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGZvciAobGV0IGltID0gMDsgaW0gPD0gaW1pdDsgKytpbSkgeVtuICogKGltICsgNCkgKyBpXSA9IGFbaW1dXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgY29udGV4ID0gKHhPbGQ6IG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICBoOiBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgaW1pdDogbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgIHk6IG51bWJlcltdLFxuICAgICAgICAgICAgICAgICAgICAgIGljb206IG51bWJlcltdKSA9PiB7XG4gICAgICAgIHJldHVybiAoYzogbnVtYmVyLCB4OiBudW1iZXIpID0+IHtcbiAgICAgICAgICBsZXQgaSA9IDBcbiAgICAgICAgICBmb3IgKGxldCBqID0gMTsgaiA8PSBucmQ7ICsraikge1xuICAgICAgICAgICAgLy8gY2FyZWZ1bDogY3VzdG9tZXJzIGRlc2NyaWJlIGNvbXBvbmVudHMgMC1iYXNlZC4gV2UgcmVjb3JkIGluZGljZXMgMS1iYXNlZC5cbiAgICAgICAgICAgIGlmIChpY29tW2pdID09PSBjICsgMSkgaSA9IGpcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGkgPT09IDApIHRocm93IG5ldyBFcnJvcignbm8gZGVuc2Ugb3V0cHV0IGF2YWlsYWJsZSBmb3IgY29tcG9uZW50ICcgKyBjKVxuICAgICAgICAgIGNvbnN0IHRoZXRhID0gKHggLSB4T2xkKSAvIGhcbiAgICAgICAgICBjb25zdCB0aGV0YTEgPSAxIC0gdGhldGFcbiAgICAgICAgICBjb25zdCBwaHRoZXQgPSB5W2ldICsgdGhldGEgKiAoeVtucmQgKyBpXSArIHRoZXRhMSAqICh5WzIgKiBucmQgKyBpXSAqIHRoZXRhICsgeVszICogbnJkICsgaV0gKiB0aGV0YTEpKVxuICAgICAgICAgIGlmIChpbWl0IDwgMCkgcmV0dXJuIHBodGhldFxuICAgICAgICAgIGNvbnN0IHRoZXRhaCA9IHRoZXRhIC0gMC41XG4gICAgICAgICAgbGV0IHJldCA9IHlbbnJkICogKGltaXQgKyA0KSArIGldXG4gICAgICAgICAgZm9yIChsZXQgaW0gPSBpbWl0OyBpbSA+PSAxOyAtLWltKSB7XG4gICAgICAgICAgICByZXQgPSB5W25yZCAqIChpbSArIDMpICsgaV0gKyByZXQgKiB0aGV0YWggLyBpbVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcGh0aGV0ICsgKHRoZXRhICogdGhldGExKSAqKiAyICogcmV0XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gcHJlcGFyYXRpb25cbiAgICAgIGNvbnN0IHlTYWZlID0gU29sdmVyLmRpbTIoa20sIG5yZClcbiAgICAgIGNvbnN0IGhoID0gU29sdmVyLmRpbShrbSlcbiAgICAgIGNvbnN0IHQgPSBTb2x2ZXIuZGltMihrbSwgdGhpcy5uKVxuICAgICAgLy8gRGVmaW5lIHRoZSBzdGVwIHNpemUgc2VxdWVuY2VcbiAgICAgIGNvbnN0IG5qID0gU29sdmVyLnN0ZXBTaXplU2VxdWVuY2UoblNlcSwga20pXG4gICAgICAvLyBEZWZpbmUgdGhlIGFbaV0gZm9yIG9yZGVyIHNlbGVjdGlvblxuICAgICAgY29uc3QgYSA9IFNvbHZlci5kaW0oa20pXG4gICAgICBhWzFdID0gMSArIG5qWzFdXG4gICAgICBmb3IgKGxldCBpID0gMjsgaSA8PSBrbTsgKytpKSB7XG4gICAgICAgIGFbaV0gPSBhW2kgLSAxXSArIG5qW2ldXG4gICAgICB9XG4gICAgICAvLyBJbml0aWFsIFNjYWxpbmdcbiAgICAgIGNvbnN0IHNjYWwgPSBTb2x2ZXIuZGltKHRoaXMubilcbiAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IHRoaXMubjsgKytpKSB7XG4gICAgICAgIHNjYWxbaV0gPSBhVG9sW2ldICsgclRvbFtpXSArIE1hdGguYWJzKHlbaV0pXG4gICAgICB9XG4gICAgICAvLyBJbml0aWFsIHByZXBhcmF0aW9uc1xuICAgICAgY29uc3QgcG9zbmVnID0geEVuZCAtIHggPj0gMCA/IDEgOiAtMVxuICAgICAgbGV0IGsgPSBNYXRoLm1heCgyLCBNYXRoLm1pbihrbSAtIDEsIE1hdGguZmxvb3IoLVNvbHZlci5sb2cxMChyVG9sWzFdICsgMWUtNDApICogMC42ICsgMS41KSkpXG4gICAgICBsZXQgaCA9IE1hdGgubWF4KE1hdGguYWJzKHRoaXMuaW5pdGlhbFN0ZXBTaXplKSwgMWUtNClcbiAgICAgIGggPSBwb3NuZWcgKiBNYXRoLm1pbihoLCBoTWF4LCBNYXRoLmFicyh4RW5kIC0geCkgLyAyKVxuICAgICAgY29uc3QgaVBvaW50ID0gU29sdmVyLmRpbShrbSArIDEpXG4gICAgICBjb25zdCBlcnJmYWMgPSBTb2x2ZXIuZGltKDIgKiBrbSlcbiAgICAgIGxldCB4T2xkID0geFxuICAgICAgbGV0IGlQdCA9IDBcbiAgICAgIGlmIChzb2xPdXQpIHtcbiAgICAgICAgaWYgKHRoaXMuZGVuc2VPdXRwdXQpIHtcbiAgICAgICAgICBpUG9pbnRbMV0gPSAwXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0ga207ICsraSkge1xuICAgICAgICAgICAgbGV0IG5qQWRkID0gNCAqIGkgLSAyXG4gICAgICAgICAgICBpZiAobmpbaV0gPiBuakFkZCkgKytuakFkZFxuICAgICAgICAgICAgaVBvaW50W2kgKyAxXSA9IGlQb2ludFtpXSArIG5qQWRkXG4gICAgICAgICAgfVxuICAgICAgICAgIGZvciAobGV0IG11ID0gMTsgbXUgPD0gMiAqIGttOyArK211KSB7XG4gICAgICAgICAgICBsZXQgZXJyeCA9IE1hdGguc3FydChtdSAvIChtdSArIDQpKSAqIDAuNVxuICAgICAgICAgICAgbGV0IHByb2QgPSAoMSAvIChtdSArIDQpKSAqKiAyXG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMTsgaiA8PSBtdTsgKytqKSBwcm9kICo9IGVycnggLyBqXG4gICAgICAgICAgICBlcnJmYWNbbXVdID0gcHJvZFxuICAgICAgICAgIH1cbiAgICAgICAgICBpUHQgPSAwXG4gICAgICAgIH1cbiAgICAgICAgLy8gY2hlY2sgcmV0dXJuIHZhbHVlIGFuZCBhYmFuZG9uIGludGVncmF0aW9uIGlmIGNhbGxlZCBmb3JcbiAgICAgICAgaWYgKGZhbHNlID09PSBzb2xPdXQobkFjY2VwdCArIDEsIHhPbGQsIHgsIHkuc2xpY2UoMSkpKSB7XG4gICAgICAgICAgcmV0dXJuIE91dGNvbWUuRWFybHlSZXR1cm5cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgbGV0IGVyciA9IDBcbiAgICAgIGxldCBlcnJPbGQgPSAxZTEwXG4gICAgICBsZXQgaG9wdGRlID0gcG9zbmVnICogaE1heFxuICAgICAgY29uc3QgdyA9IFNvbHZlci5kaW0oa20pXG4gICAgICB3WzFdID0gMFxuICAgICAgbGV0IHJlamVjdCA9IGZhbHNlXG4gICAgICBsZXQgbGFzdCA9IGZhbHNlXG4gICAgICBsZXQgYXRvdjogYm9vbGVhblxuICAgICAgbGV0IGtjID0gMFxuXG4gICAgICBlbnVtIFNUQVRFIHtcbiAgICAgICAgU3RhcnQsIEJhc2ljSW50ZWdyYXRpb25TdGVwLCBDb252ZXJnZW5jZVN0ZXAsIEhvcGVGb3JDb252ZXJnZW5jZSwgQWNjZXB0LCBSZWplY3RcbiAgICAgIH1cbiAgICAgIGxldCBzdGF0ZTogU1RBVEUgPSBTVEFURS5TdGFydFxuXG4gICAgICBsb29wOiB3aGlsZSAodHJ1ZSkge1xuICAgICAgICB0aGlzLmRlYnVnICYmIGNvbnNvbGUubG9nKCdTVEFURScsIFNUQVRFW3N0YXRlXSwgblN0ZXAsIHhPbGQsIHgsIGgsIGssIGtjLCBob3B0ZGUpXG4gICAgICAgIHN3aXRjaCAoc3RhdGUpIHtcbiAgICAgICAgICBjYXNlIFNUQVRFLlN0YXJ0OlxuICAgICAgICAgICAgYXRvdiA9IGZhbHNlXG4gICAgICAgICAgICAvLyBJcyB4RW5kIHJlYWNoZWQgaW4gdGhlIG5leHQgc3RlcD9cbiAgICAgICAgICAgIGlmICgwLjEgKiBNYXRoLmFicyh4RW5kIC0geCkgPD0gTWF0aC5hYnMoeCkgKiB0aGlzLnVSb3VuZCkgYnJlYWsgbG9vcFxuICAgICAgICAgICAgaCA9IHBvc25lZyAqIE1hdGgubWluKE1hdGguYWJzKGgpLCBNYXRoLmFicyh4RW5kIC0geCksIGhNYXgsIE1hdGguYWJzKGhvcHRkZSkpXG4gICAgICAgICAgICBpZiAoKHggKyAxLjAxICogaCAtIHhFbmQpICogcG9zbmVnID4gMCkge1xuICAgICAgICAgICAgICBoID0geEVuZCAtIHhcbiAgICAgICAgICAgICAgbGFzdCA9IHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChuU3RlcCA9PT0gMCB8fCAhdGhpcy5kZW5zZU91dHB1dCkge1xuICAgICAgICAgICAgICBGKHgsIHksIGR6KVxuICAgICAgICAgICAgICArK25FdmFsXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBUaGUgZmlyc3QgYW5kIGxhc3Qgc3RlcFxuICAgICAgICAgICAgaWYgKG5TdGVwID09PSAwIHx8IGxhc3QpIHtcbiAgICAgICAgICAgICAgaVB0ID0gMFxuICAgICAgICAgICAgICArK25TdGVwXG4gICAgICAgICAgICAgIGZvciAobGV0IGogPSAxOyBqIDw9IGs7ICsraikge1xuICAgICAgICAgICAgICAgIGtjID0galxuICAgICAgICAgICAgICAgIG1pZGV4KGopXG4gICAgICAgICAgICAgICAgaWYgKGF0b3YpIGNvbnRpbnVlIGxvb3BcbiAgICAgICAgICAgICAgICBpZiAoaiA+IDEgJiYgZXJyIDw9IDEpIHtcbiAgICAgICAgICAgICAgICAgIHN0YXRlID0gU1RBVEUuQWNjZXB0XG4gICAgICAgICAgICAgICAgICBjb250aW51ZSBsb29wXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHN0YXRlID0gU1RBVEUuSG9wZUZvckNvbnZlcmdlbmNlXG4gICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdGF0ZSA9IFNUQVRFLkJhc2ljSW50ZWdyYXRpb25TdGVwXG4gICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgY2FzZSBTVEFURS5CYXNpY0ludGVncmF0aW9uU3RlcDpcbiAgICAgICAgICAgIC8vIGJhc2ljIGludGVncmF0aW9uIHN0ZXBcbiAgICAgICAgICAgIGlQdCA9IDBcbiAgICAgICAgICAgICsrblN0ZXBcbiAgICAgICAgICAgIGlmIChuU3RlcCA+PSB0aGlzLm1heFN0ZXBzKSB7XG4gICAgICAgICAgICAgIHJldHVybiBPdXRjb21lLk1heFN0ZXBzRXhjZWVkZWRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGtjID0gayAtIDFcbiAgICAgICAgICAgIGZvciAobGV0IGogPSAxOyBqIDw9IGtjOyArK2opIHtcbiAgICAgICAgICAgICAgbWlkZXgoailcbiAgICAgICAgICAgICAgaWYgKGF0b3YpIHtcbiAgICAgICAgICAgICAgICBzdGF0ZSA9IFNUQVRFLlN0YXJ0XG4gICAgICAgICAgICAgICAgY29udGludWUgbG9vcFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBjb252ZXJnZW5jZSBtb25pdG9yXG4gICAgICAgICAgICBpZiAoayA9PT0gMiB8fCByZWplY3QpIHtcbiAgICAgICAgICAgICAgc3RhdGUgPSBTVEFURS5Db252ZXJnZW5jZVN0ZXBcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGlmIChlcnIgPD0gMSkge1xuICAgICAgICAgICAgICAgIHN0YXRlID0gU1RBVEUuQWNjZXB0XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAoZXJyID4gKChualtrICsgMV0gKiBualtrXSkgLyA0KSAqKiAyKSB7XG4gICAgICAgICAgICAgICAgc3RhdGUgPSBTVEFURS5SZWplY3RcbiAgICAgICAgICAgICAgfSBlbHNlIHN0YXRlID0gU1RBVEUuQ29udmVyZ2VuY2VTdGVwXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgY2FzZSBTVEFURS5Db252ZXJnZW5jZVN0ZXA6ICAvLyBsYWJlbCA1MFxuICAgICAgICAgICAgbWlkZXgoaylcbiAgICAgICAgICAgIGlmIChhdG92KSB7XG4gICAgICAgICAgICAgIHN0YXRlID0gU1RBVEUuU3RhcnRcbiAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGtjID0ga1xuICAgICAgICAgICAgaWYgKGVyciA8PSAxKSB7XG4gICAgICAgICAgICAgIHN0YXRlID0gU1RBVEUuQWNjZXB0XG4gICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdGF0ZSA9IFNUQVRFLkhvcGVGb3JDb252ZXJnZW5jZVxuICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgIGNhc2UgU1RBVEUuSG9wZUZvckNvbnZlcmdlbmNlOlxuICAgICAgICAgICAgLy8gaG9wZSBmb3IgY29udmVyZ2VuY2UgaW4gbGluZSBrICsgMVxuICAgICAgICAgICAgaWYgKGVyciA+IChualtrICsgMV0gLyAyKSAqKiAyKSB7XG4gICAgICAgICAgICAgIHN0YXRlID0gU1RBVEUuUmVqZWN0XG4gICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBrYyA9IGsgKyAxXG4gICAgICAgICAgICBtaWRleChrYylcbiAgICAgICAgICAgIGlmIChhdG92KSBzdGF0ZSA9IFNUQVRFLlN0YXJ0XG4gICAgICAgICAgICBlbHNlIGlmIChlcnIgPiAxKSBzdGF0ZSA9IFNUQVRFLlJlamVjdFxuICAgICAgICAgICAgZWxzZSBzdGF0ZSA9IFNUQVRFLkFjY2VwdFxuICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgIGNhc2UgU1RBVEUuQWNjZXB0OlxuICAgICAgICAgICAgaWYgKCFhY2NlcHRTdGVwKHRoaXMubikpIHJldHVybiBPdXRjb21lLkVhcmx5UmV0dXJuXG4gICAgICAgICAgICBzdGF0ZSA9IFNUQVRFLlN0YXJ0XG4gICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgY2FzZSBTVEFURS5SZWplY3Q6XG4gICAgICAgICAgICBrID0gTWF0aC5taW4oaywga2MsIGttIC0gMSlcbiAgICAgICAgICAgIGlmIChrID4gMiAmJiB3W2sgLSAxXSA8IHdba10gKiB0aGlzLnN0ZXBTaXplRmFjMykgayAtPSAxXG4gICAgICAgICAgICArK25SZWplY3RcbiAgICAgICAgICAgIGggPSBwb3NuZWcgKiBoaFtrXVxuICAgICAgICAgICAgcmVqZWN0ID0gdHJ1ZVxuICAgICAgICAgICAgc3RhdGUgPSBTVEFURS5CYXNpY0ludGVncmF0aW9uU3RlcFxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gT3V0Y29tZS5Db252ZXJnZWRcbiAgICB9XG5cbiAgICBjb25zdCBvdXRjb21lID0gb2R4Y29yKClcbiAgICByZXR1cm4ge1xuICAgICAgeTogeS5zbGljZSgxKSxcbiAgICAgIG91dGNvbWU6IG91dGNvbWUsXG4gICAgICBuU3RlcDogblN0ZXAsXG4gICAgICB4RW5kOiB4RW5kLFxuICAgICAgbkFjY2VwdDogbkFjY2VwdCxcbiAgICAgIG5SZWplY3Q6IG5SZWplY3QsXG4gICAgICBuRXZhbDogbkV2YWxcbiAgICB9XG4gIH1cbn1cbiIsIi8qKlxuICAqIENyZWF0ZWQgYnkgY29saW4gb24gNi8xNC8xNi5cbiAgKiBodHRwOi8vbGl0dGxlcmVkY29tcHV0ZXIuZ2l0aHViLmlvXG4gICovXG5cbmltcG9ydCB7U29sdmVyLCBEZXJpdmF0aXZlfSBmcm9tICdvZGV4L3NyYy9vZGV4J1xuXG5pbnRlcmZhY2UgSGFtaWx0b25NYXAge1xuICBnZW5lcmF0ZVNlY3Rpb24oaW5pdGlhbERhdGE6IG51bWJlcltdLCBuOiBudW1iZXIsIGNhbGxiYWNrOiAoeDogbnVtYmVyLCB5OiBudW1iZXIpID0+IHZvaWQpOiB2b2lkXG59XG5cbmludGVyZmFjZSBEaWZmZXJlbnRpYWxFcXVhdGlvbiB7XG4gIGV2b2x2ZShwYXJhbXM6IHt9LCBpbml0aWFsRGF0YTogbnVtYmVyW10sIHQxOiBudW1iZXIsIGR0OiBudW1iZXIsIGNhbGxiYWNrOiAodDogbnVtYmVyLCB5OiBudW1iZXJbXSkgPT4gdm9pZCk6IHZvaWRcbn1cblxuY29uc3QgdHdvUGkgPSBNYXRoLlBJICogMlxuXG5leHBvcnQgY2xhc3MgU3RhbmRhcmRNYXAgaW1wbGVtZW50cyBIYW1pbHRvbk1hcCB7XG4gIEs6IG51bWJlclxuICBQVjogKHg6IG51bWJlcikgPT4gbnVtYmVyXG4gIHN0YXRpYyB0d29QaSA9IDIgKiBNYXRoLlBJXG5cbiAgY29uc3RydWN0b3IoSzogbnVtYmVyKSB7XG4gICAgdGhpcy5LID0gS1xuICAgIHRoaXMuUFYgPSBTdGFuZGFyZE1hcC5wcmluY2lwYWxfdmFsdWUodHdvUGkpXG4gIH1cblxuICBzdGF0aWMgcHJpbmNpcGFsX3ZhbHVlKGN1dEhpZ2g6IG51bWJlcik6ICh2OiBudW1iZXIpID0+IG51bWJlciB7XG4gICAgY29uc3QgY3V0TG93ID0gY3V0SGlnaCAtIHR3b1BpXG4gICAgcmV0dXJuIGZ1bmN0aW9uICh4OiBudW1iZXIpIHtcbiAgICAgIGlmIChjdXRMb3cgPD0geCAmJiB4IDwgY3V0SGlnaCkge1xuICAgICAgICByZXR1cm4geFxuICAgICAgfVxuICAgICAgY29uc3QgeSA9IHggLSB0d29QaSAqIE1hdGguZmxvb3IoeCAvIHR3b1BpKVxuICAgICAgcmV0dXJuIHkgPCBjdXRIaWdoID8geSA6IHkgLSB0d29QaVxuICAgIH1cbiAgfVxuXG4gIGdlbmVyYXRlU2VjdGlvbihpbml0aWFsRGF0YTogbnVtYmVyW10sIG46IG51bWJlciwgY2FsbGJhY2s6ICh4OiBudW1iZXIsIHk6IG51bWJlcikgPT4gdm9pZCkge1xuICAgIGxldCBbdGhldGEsIEldID0gaW5pdGlhbERhdGFcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgY2FsbGJhY2sodGhldGEsIEkpXG4gICAgICBsZXQgbkkgPSBJICsgKHRoaXMuSyAqIE1hdGguc2luKHRoZXRhKSlcbiAgICAgIHRoZXRhID0gdGhpcy5QVih0aGV0YSArIG5JKVxuICAgICAgSSA9IHRoaXMuUFYobkkpXG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBEcml2ZW5QZW5kdWx1bU1hcCBpbXBsZW1lbnRzIEhhbWlsdG9uTWFwLCBEaWZmZXJlbnRpYWxFcXVhdGlvbiB7XG5cbiAgcGFyYW1mbjogKCkgPT4ge2E6IG51bWJlciwgb21lZ2E6IG51bWJlcn1cbiAgUzogU29sdmVyXG4gIFBWOiAoeDogbnVtYmVyKSA9PiBudW1iZXJcblxuICBIYW1pbHRvblN5c2RlcihtOiBudW1iZXIsIGw6IG51bWJlciwgb21lZ2E6IG51bWJlciwgYTogbnVtYmVyLCBnOiBudW1iZXIpOiBEZXJpdmF0aXZlIHtcbiAgICByZXR1cm4gKHgsIFt0LCB0aGV0YSwgcF90aGV0YV0pID0+IHtcbiAgICAgICBsZXQgXzAwMDIgPSBNYXRoLnBvdyhsLCAyKVxuICAgICAgIGxldCBfMDAwMyA9IG9tZWdhICogdFxuICAgICAgIGxldCBfMDAwNCA9IE1hdGguc2luKHRoZXRhKVxuICAgICAgIGxldCBfMDAwNSA9IE1hdGguY29zKHRoZXRhKVxuICAgICAgIGxldCBfMDAwNiA9IE1hdGguc2luKF8wMDAzKVxuICAgICAgIHJldHVybiBbMSwgKGEgKiBsICogbSAqIG9tZWdhICogXzAwMDYgKiBfMDAwNCArIHBfdGhldGEpIC8gKF8wMDAyICogbSksICgtIE1hdGgucG93KGEsIDIpICogbCAqIG0gKiBNYXRoLnBvdyhvbWVnYSwgMikgKiBNYXRoLnBvdyhfMDAwNiwgMikgKiBfMDAwNSAqIF8wMDA0IC0gYSAqIG9tZWdhICogcF90aGV0YSAqIF8wMDA2ICogXzAwMDUgLSBnICogXzAwMDIgKiBtICogXzAwMDQpIC8gbF1cbiAgICB9XG4gIH1cblxuICBMYWdyYW5nZVN5c2RlcihsOiBudW1iZXIsIG9tZWdhOiBudW1iZXIsIGE6IG51bWJlciwgZzogbnVtYmVyKTogRGVyaXZhdGl2ZSB7XG4gICAgcmV0dXJuICh4LCBbdCwgdGhldGEsIHRoZXRhZG90XSkgPT4ge1xuICAgICAgbGV0IF8wMDAxID0gTWF0aC5zaW4odGhldGEpXG4gICAgICByZXR1cm4gWzEsIHRoZXRhZG90LCAoYSAqIE1hdGgucG93KG9tZWdhLCAyKSAqIF8wMDAxICogTWF0aC5jb3Mob21lZ2EgKiB0KSAtIGcgKiBfMDAwMSkgLyBsXVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0cnVjdG9yKHBhcmFtZm46ICgpID0+IHthOiBudW1iZXIsIG9tZWdhOiBudW1iZXJ9KSB7XG4gICAgdGhpcy5wYXJhbWZuID0gcGFyYW1mblxuICAgIHRoaXMuUyA9IG5ldyBTb2x2ZXIoMylcbiAgICB0aGlzLlMuZGVuc2VPdXRwdXQgPSB0cnVlXG4gICAgdGhpcy5TLmFic29sdXRlVG9sZXJhbmNlID0gMWUtOFxuICAgIHRoaXMuUFYgPSBTdGFuZGFyZE1hcC5wcmluY2lwYWxfdmFsdWUoTWF0aC5QSSlcbiAgfVxuXG4gIGdlbmVyYXRlU2VjdGlvbihpbml0aWFsRGF0YTogbnVtYmVyW10sIG46IG51bWJlciwgY2FsbGJhY2s6ICh4OiBudW1iZXIsIHk6IG51bWJlcikgPT4gdm9pZCkge1xuICAgIGxldCBwYXJhbXMgPSB0aGlzLnBhcmFtZm4oKVxuICAgIGxldCBwZXJpb2QgPSAyICogTWF0aC5QSSAvIHBhcmFtcy5vbWVnYVxuICAgIGxldCB0MSA9IDEwMDAgKiBwZXJpb2RcbiAgICBsZXQgSCA9IHRoaXMuSGFtaWx0b25TeXNkZXIoMSwgMSwgcGFyYW1zLm9tZWdhLCBwYXJhbXMuYSwgOS44KVxuICAgIHRoaXMuUy5zb2x2ZShILCAwLCBbMF0uY29uY2F0KGluaXRpYWxEYXRhKSwgdDEsIHRoaXMuUy5ncmlkKHBlcmlvZCwgKHQsIHlzKSA9PiBjYWxsYmFjayh0aGlzLlBWKHlzWzFdKSwgeXNbMl0pKSlcbiAgfVxuXG4gIGV2b2x2ZShwYXJhbXM6IHtvbWVnYTogbnVtYmVyLCBhOiBudW1iZXJ9LCBpbml0aWFsRGF0YTogbnVtYmVyW10sIHQxOiBudW1iZXIsIGR0OiBudW1iZXIsIGNhbGxiYWNrOiAoeDogbnVtYmVyLCB5czogbnVtYmVyW10pID0+IHZvaWQpIHtcbiAgICBsZXQgTCA9IHRoaXMuTGFncmFuZ2VTeXNkZXIoMSwgcGFyYW1zLm9tZWdhLCBwYXJhbXMuYSwgOS44KVxuICAgIGxldCBwMCA9IHBlcmZvcm1hbmNlLm5vdygpXG4gICAgdGhpcy5TLnNvbHZlKEwsIDAsIFswXS5jb25jYXQoaW5pdGlhbERhdGEpLCB0MSwgdGhpcy5TLmdyaWQoZHQsIGNhbGxiYWNrKSlcbiAgICBjb25zb2xlLmxvZygnZXZvbHV0aW9uIHRvb2snLCAocGVyZm9ybWFuY2Uubm93KCkgLSBwMCkudG9GaXhlZCgyKSwgJ21zZWMnKVxuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFeHBsb3JlTWFwIHtcbiAgY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudFxuICBNOiBIYW1pbHRvbk1hcFxuICBjb250ZXh0OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkRcbiAgb25FeHBsb3JlOiAoeDogbnVtYmVyLCB5OiBudW1iZXIpID0+IHZvaWRcblxuICBjb25zdHJ1Y3RvcihjYW52YXM6IHN0cmluZywgTTogSGFtaWx0b25NYXAsIHhSYW5nZTogbnVtYmVyW10sIHlSYW5nZTogbnVtYmVyW10pIHtcbiAgICB0aGlzLmNhbnZhcyA9IDxIVE1MQ2FudmFzRWxlbWVudD4gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoY2FudmFzKVxuICAgIHRoaXMuTSA9IE1cbiAgICB0aGlzLmNvbnRleHQgPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpXG4gICAgbGV0IFt3LCBoXSA9IFt4UmFuZ2VbMV0gLSB4UmFuZ2VbMF0sIHlSYW5nZVsxXSAtIHlSYW5nZVswXV1cbiAgICB0aGlzLmNhbnZhcy5vbm1vdXNlZG93biA9IChlOiBNb3VzZUV2ZW50KSA9PiB7XG4gICAgICBsZXQgW2N4LCBjeV0gPSBbZS5vZmZzZXRYIC8gdGhpcy5jb250ZXh0LmNhbnZhcy53aWR0aCAqIHcgKyB4UmFuZ2VbMF0sXG4gICAgICAgIHlSYW5nZVsxXSAtIGUub2Zmc2V0WSAvIHRoaXMuY29udGV4dC5jYW52YXMuaGVpZ2h0ICogaF1cbiAgICAgIGxldCBwMCA9IHBlcmZvcm1hbmNlLm5vdygpXG4gICAgICB0aGlzLkV4cGxvcmUoY3gsIGN5KVxuICAgICAgY29uc29sZS5sb2coJ2V4cGxvcmF0aW9uJywgKHBlcmZvcm1hbmNlLm5vdygpIC0gcDApLnRvRml4ZWQoMiksICdtc2VjJylcbiAgICAgIHRoaXMub25FeHBsb3JlICYmIHRoaXMub25FeHBsb3JlKGN4LCBjeSlcbiAgICB9XG4gICAgdGhpcy5jb250ZXh0LnNjYWxlKHRoaXMuY29udGV4dC5jYW52YXMud2lkdGggLyB3LCAtdGhpcy5jb250ZXh0LmNhbnZhcy5oZWlnaHQgLyBoKVxuICAgIHRoaXMuY29udGV4dC50cmFuc2xhdGUoLXhSYW5nZVswXSwgLXlSYW5nZVsxXSlcbiAgICB0aGlzLmNvbnRleHQuZmlsbFN0eWxlID0gJ3JnYmEoMjMsNjQsMTcwLDAuNSknXG4gIH1cbiAgaTogbnVtYmVyID0gMFxuXG4gIC8vIHNpbmNlIHB0IGlzIGludm9rZWQgaW4gY2FsbGJhY2sgcG9zaXRpb24sIHdlIHdhbnQgdG8gZGVmaW5lIGl0IGFzIGFuIGluc3RhbmNlIGFycm93IGZ1bmN0aW9uXG4gIHB0ID0gKHg6IG51bWJlciwgeTogbnVtYmVyKSA9PiB7XG4gICAgdGhpcy5jb250ZXh0LmJlZ2luUGF0aCgpXG4gICAgdGhpcy5jb250ZXh0LmFyYyh4LCB5LCAwLjAxLCAwLCAyICogTWF0aC5QSSlcbiAgICB0aGlzLmNvbnRleHQuZmlsbCgpXG4gICAgdGhpcy5jb250ZXh0LmNsb3NlUGF0aCgpXG4gICAgKyt0aGlzLmlcbiAgfVxuXG4gIEV4cGxvcmUoeDogbnVtYmVyLCB5OiBudW1iZXIpIHtcbiAgICB0aGlzLk0uZ2VuZXJhdGVTZWN0aW9uKFt4LCB5XSwgMTAwMCwgdGhpcy5wdClcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRHJpdmVuUGVuZHVsdW1BbmltYXRpb24ge1xuICBhbXBsaXR1ZGUgPSAwLjFcbiAgYW5pbUxvZ2ljYWxTaXplID0gMS4zXG4gIGN0eDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEXG4gIGluaXRpYWxEYXRhOiBudW1iZXJbXVxuICBkYXRhOiBudW1iZXJbXVtdXG4gIGZyYW1lSW5kZXg6IG51bWJlclxuICBmcmFtZVN0YXJ0OiBudW1iZXJcbiAgb21lZ2E6IG51bWJlclxuICBhbmltYXRpbmc6IGJvb2xlYW5cblxuICBjb25zdHJ1Y3RvcihvOiB7XG4gICAgb21lZ2FWYWx1ZUlkOiBzdHJpbmdcbiAgICBvbWVnYVJhbmdlSWQ6IHN0cmluZ1xuICAgIHRWYWx1ZUlkOiBzdHJpbmdcbiAgICB0UmFuZ2VJZDogc3RyaW5nXG4gICAgYW5pbUlkOiBzdHJpbmdcbiAgICBleHBsb3JlSWQ6IHN0cmluZ1xuICAgIHRoZXRhMElkOiBzdHJpbmdcbiAgICB0aGV0YURvdDBJZDogc3RyaW5nXG4gICAgZ29CdXR0b25JZDogc3RyaW5nXG4gIH0pIHtcbiAgICBsZXQgb21lZ2FSYW5nZSA9IDxIVE1MSW5wdXRFbGVtZW50PmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG8ub21lZ2FSYW5nZUlkKVxuICAgIGxldCBvbWVnYVJhZFNlYyA9ICgpID0+ICtvbWVnYVJhbmdlLnZhbHVlICogMiAqIE1hdGguUElcbiAgICBsZXQgdFJhbmdlID0gPEhUTUxJbnB1dEVsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoby50UmFuZ2VJZClcbiAgICBsZXQgZGlmZkVxID0gbmV3IERyaXZlblBlbmR1bHVtTWFwKCgpID0+ICh7b21lZ2E6IG9tZWdhUmFkU2VjKCksIGE6IHRoaXMuYW1wbGl0dWRlfSkpXG4gICAgbGV0IGFuaW0gPSA8SFRNTENhbnZhc0VsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoby5hbmltSWQpXG4gICAgdGhpcy5jdHggPSBhbmltLmdldENvbnRleHQoJzJkJylcbiAgICB0aGlzLmN0eC5zY2FsZShhbmltLndpZHRoIC8gKDIgKiB0aGlzLmFuaW1Mb2dpY2FsU2l6ZSksIC1hbmltLmhlaWdodCAvICgyICogdGhpcy5hbmltTG9naWNhbFNpemUpKVxuICAgIHRoaXMuY3R4LnRyYW5zbGF0ZSh0aGlzLmFuaW1Mb2dpY2FsU2l6ZSwgLXRoaXMuYW5pbUxvZ2ljYWxTaXplKVxuICAgIGxldCB4TWFwID0gbmV3IEV4cGxvcmVNYXAoJ3AnLCBkaWZmRXEsIFstTWF0aC5QSSwgTWF0aC5QSV0sIFstMTAsIDEwXSlcbiAgICBsZXQgZ29CdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChvLmdvQnV0dG9uSWQpXG4gICAgeE1hcC5vbkV4cGxvcmUgPSAodGhldGEwOiBudW1iZXIsIHRoZXRhRG90MDogbnVtYmVyKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZygnb25FeHBsb3JlJywgdGhldGEwLCB0aGV0YURvdDApXG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChvLnRoZXRhMElkKS50ZXh0Q29udGVudCA9IHRoZXRhMC50b0ZpeGVkKDMpXG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChvLnRoZXRhRG90MElkKS50ZXh0Q29udGVudCA9IHRoZXRhRG90MC50b0ZpeGVkKDMpXG4gICAgICB0aGlzLmluaXRpYWxEYXRhID0gW3RoZXRhMCwgdGhldGFEb3QwXVxuICAgICAgZ29CdXR0b24ucmVtb3ZlQXR0cmlidXRlKCdkaXNhYmxlZCcpXG4gICAgfVxuICAgIGxldCBleHBsb3JlID0gPEhUTUxDYW52YXNFbGVtZW50PmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG8uZXhwbG9yZUlkKVxuICAgIG9tZWdhUmFuZ2UuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKGU6IEV2ZW50KSA9PiB7XG4gICAgICBleHBsb3JlLmdldENvbnRleHQoJzJkJykuY2xlYXJSZWN0KC1NYXRoLlBJLCAtMTAsIDIgKiBNYXRoLlBJLCAyMClcbiAgICAgIGxldCB0ID0gPEhUTUxJbnB1dEVsZW1lbnQ+ZS50YXJnZXRcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG8ub21lZ2FWYWx1ZUlkKS50ZXh0Q29udGVudCA9ICgrdC52YWx1ZSkudG9GaXhlZCgxKVxuICAgIH0pXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoby5vbWVnYVZhbHVlSWQpLnRleHRDb250ZW50ID0gb21lZ2FSYW5nZS52YWx1ZVxuICAgIHRSYW5nZS5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoZTogRXZlbnQpID0+IHtcbiAgICAgIGxldCB0ID0gPEhUTUxJbnB1dEVsZW1lbnQ+ZS50YXJnZXRcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG8udFZhbHVlSWQpLnRleHRDb250ZW50ID0gdC52YWx1ZVxuICAgIH0pXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoby50VmFsdWVJZCkudGV4dENvbnRlbnQgPSB0UmFuZ2UudmFsdWVcbiAgICBnb0J1dHRvbi5zZXRBdHRyaWJ1dGUoJ2Rpc2FibGVkJywgJ2Rpc2FibGVkJylcbiAgICBnb0J1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgIC8vIChyZSlzb2x2ZSB0aGUgZGlmZmVyZW50aWFsIGVxdWF0aW9uIGFuZCB1cGRhdGUgdGhlIGRhdGEuIEtpY2sgb2ZmIHRoZSBhbmltYXRpb24uXG4gICAgICBsZXQgZHQgPSAxIC8gNjBcbiAgICAgIGxldCB0MSA9ICt0UmFuZ2UudmFsdWVcbiAgICAgIGxldCBuID0gTWF0aC5jZWlsKHQxIC8gZHQpXG4gICAgICB0aGlzLmRhdGEgPSBuZXcgQXJyYXkobilcbiAgICAgIGxldCBpID0gMFxuICAgICAgdGhpcy5vbWVnYSA9IG9tZWdhUmFkU2VjKClcbiAgICAgIGxldCBwMCA9IHBlcmZvcm1hbmNlLm5vdygpXG4gICAgICBkaWZmRXEuZXZvbHZlKHtvbWVnYTogdGhpcy5vbWVnYSwgYTogdGhpcy5hbXBsaXR1ZGV9LCB0aGlzLmluaXRpYWxEYXRhLCB0MSwgZHQsICh4LCB5cykgPT4ge3RoaXMuZGF0YVtpKytdID0geXN9KVxuICAgICAgY29uc29sZS5sb2coJ0RFIGV2b2x1dGlvbiBpbicsIChwZXJmb3JtYW5jZS5ub3coKSAtIHAwKS50b0ZpeGVkKDEpLCAnbXNlYycpXG4gICAgICB0aGlzLmZyYW1lSW5kZXggPSAwXG4gICAgICB0aGlzLmZyYW1lU3RhcnQgPSBwZXJmb3JtYW5jZS5ub3coKVxuICAgICAgaWYgKCF0aGlzLmFuaW1hdGluZykge1xuICAgICAgICB0aGlzLmFuaW1hdGluZyA9IHRydWVcbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMuZnJhbWUpXG4gICAgICB9XG4gICAgfSlcbiAgfVxuICB0aW1lc3RyaW5nID0gKHQ6IG51bWJlcikgPT4ge1xuICAgIGxldCBzID0gdC50b0ZpeGVkKDIpXG4gICAgaWYgKHMubWF0Y2goL1xcLlswLTldJC8pKSB7XG4gICAgICBzICs9ICcwJ1xuICAgIH1cbiAgICByZXR1cm4gJ3Q6ICcgKyBzICsgJyBzJ1xuICB9XG5cbiAgZnJhbWUgPSAoKSA9PiB7XG4gICAgbGV0IGJvYiA9ICh0OiBudW1iZXIpID0+IHRoaXMuYW1wbGl0dWRlICogTWF0aC5jb3ModGhpcy5vbWVnYSAqIHQpXG4gICAgdGhpcy5jdHguY2xlYXJSZWN0KC10aGlzLmFuaW1Mb2dpY2FsU2l6ZSwgLXRoaXMuYW5pbUxvZ2ljYWxTaXplLCAyICogdGhpcy5hbmltTG9naWNhbFNpemUsIDIgKiB0aGlzLmFuaW1Mb2dpY2FsU2l6ZSlcbiAgICBsZXQgZCA9IHRoaXMuZGF0YVt0aGlzLmZyYW1lSW5kZXhdXG4gICAgbGV0IHkwID0gYm9iKGRbMF0pXG4gICAgbGV0IHRoZXRhID0gZFsxXVxuICAgIGNvbnN0IGMgPSB0aGlzLmN0eFxuICAgIGMubGluZVdpZHRoID0gMC4wMlxuICAgIGMuZmlsbFN0eWxlID0gJyMwMDAnXG4gICAgYy5iZWdpblBhdGgoKVxuICAgIGMubW92ZVRvKDAsIHkwKVxuICAgIGMubGluZVRvKE1hdGguc2luKHRoZXRhKSwgeTAgLSBNYXRoLmNvcyh0aGV0YSkpXG4gICAgYy5zdHJva2UoKVxuICAgIGMuYmVnaW5QYXRoKClcbiAgICBjLmZpbGxTdHlsZSA9ICcjMDAwJ1xuICAgIGMuYXJjKDAsIHkwLCAwLjA1LCAwLCBNYXRoLlBJICogMilcbiAgICBjLmZpbGxTdHlsZSA9ICcjZjAwJ1xuICAgIGMuYXJjKE1hdGguc2luKHRoZXRhKSwgeTAgLSBNYXRoLmNvcyh0aGV0YSksIDAuMSwgMCwgTWF0aC5QSSAqIDIpXG4gICAgYy5maWxsKClcbiAgICBjLnNhdmUoKVxuICAgIGMuc2NhbGUoMC4wMSwgLTAuMDEpXG4gICAgYy5mb250ID0gJzEwcHQgRnV0dXJhJ1xuICAgIGMuZmlsbFN0eWxlID0gJyM4ODgnXG4gICAgYy5maWxsVGV4dCh0aGlzLnRpbWVzdHJpbmcoZFswXSksIC0xMTUsIDExNSlcbiAgICBjLnJlc3RvcmUoKVxuXG4gICAgKyt0aGlzLmZyYW1lSW5kZXhcbiAgICBpZiAodGhpcy5mcmFtZUluZGV4IDwgdGhpcy5kYXRhLmxlbmd0aCkge1xuICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLmZyYW1lKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmFuaW1hdGluZyA9IGZhbHNlXG4gICAgICBsZXQgZXQgPSAocGVyZm9ybWFuY2Uubm93KCkgLSB0aGlzLmZyYW1lU3RhcnQpIC8gMWUzXG4gICAgICBjb25zb2xlLmxvZygnYW5pbWF0aW9uIGRvbmUnLCAodGhpcy5kYXRhLmxlbmd0aCAvIGV0KS50b0ZpeGVkKDIpLCAnZnBzJylcbiAgICB9XG4gIH1cbn1cblxuaW50ZXJmYWNlIERvdWJsZVBhcmFtcyB7XG4gIGwxOiBudW1iZXJcbiAgbTE6IG51bWJlclxuICBsMjogbnVtYmVyXG4gIG0yOiBudW1iZXJcbn1cblxuY2xhc3MgRG91YmxlUGVuZHVsdW1NYXAgaW1wbGVtZW50cyBEaWZmZXJlbnRpYWxFcXVhdGlvbiB7XG4gIFM6IFNvbHZlclxuXG4gIExhZ3JhbmdlU3lzZGVyKGwxOiBudW1iZXIsIG0xOiBudW1iZXIsIGwyOiBudW1iZXIsIG0yOiBudW1iZXIpOiBEZXJpdmF0aXZlIHtcbiAgICBjb25zdCBnID0gOS44XG4gICAgcmV0dXJuICh4LCBbdCwgdGhldGEsIHBoaSwgdGhldGFkb3QsIHBoaWRvdF0pID0+IHtcbiAgICAgIGxldCBfMDAwMiA9IE1hdGgucG93KHBoaWRvdCwgMilcbiAgICAgIGxldCBfMDAwMyA9IE1hdGguc2luKHBoaSlcbiAgICAgIGxldCBfMDAwNSA9IC0gcGhpXG4gICAgICBsZXQgXzAwMDcgPSBNYXRoLnNpbih0aGV0YSlcbiAgICAgIGxldCBfMDAwOCA9IE1hdGgucG93KHRoZXRhZG90LCAyKVxuICAgICAgbGV0IF8wMDBiID0gXzAwMDUgKyB0aGV0YVxuICAgICAgbGV0IF8wMDBlID0gTWF0aC5jb3MoXzAwMGIpXG4gICAgICBsZXQgXzAwMGYgPSBNYXRoLnNpbihfMDAwYilcbiAgICAgIGxldCBfMDAxMSA9IE1hdGgucG93KF8wMDBmLCAyKVxuICAgICAgcmV0dXJuIFsxLCB0aGV0YWRvdCwgcGhpZG90LCAoLSBsMSAqIG0yICogXzAwMDggKiBfMDAwZiAqIF8wMDBlIC0gbDIgKiBtMiAqIF8wMDAyICogXzAwMGYgKyBnICogbTIgKiBfMDAwZSAqIF8wMDAzIC0gZyAqIG0xICogXzAwMDcgLSBnICogbTIgKiBfMDAwNykgLyAobDEgKiBtMiAqIF8wMDExICsgbDEgKiBtMSksIChsMiAqIG0yICogXzAwMDIgKiBfMDAwZiAqIF8wMDBlICsgbDEgKiBtMSAqIF8wMDA4ICogXzAwMGYgKyBsMSAqIG0yICogXzAwMDggKiBfMDAwZiArIGcgKiBtMSAqIF8wMDA3ICogXzAwMGUgKyBnICogbTIgKiBfMDAwNyAqIF8wMDBlIC0gZyAqIG0xICogXzAwMDMgLSBnICogbTIgKiBfMDAwMykgLyAobDIgKiBtMiAqIF8wMDExICsgbDIgKiBtMSldXG4gICAgfVxuICB9XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5TID0gbmV3IFNvbHZlcig1KSAgLy8gdCwgdGhldGEsIHBoaSwgdGhldGFkb3QsIHBoaWRvdFxuICAgIHRoaXMuUy5kZW5zZU91dHB1dCA9IHRydWVcbiAgICB0aGlzLlMuYWJzb2x1dGVUb2xlcmFuY2UgPSAxZS04XG4gIH1cblxuICBldm9sdmUocDogRG91YmxlUGFyYW1zLCBpbml0aWFsRGF0YTogbnVtYmVyW10sIHQxOiBudW1iZXIsIGR0OiBudW1iZXIsIGNhbGxiYWNrOiAodDogbnVtYmVyLCB5OiBudW1iZXJbXSkgPT4gdm9pZCk6IHZvaWQge1xuICAgIHRoaXMuUy5zb2x2ZSh0aGlzLkxhZ3JhbmdlU3lzZGVyKHAubDEsIHAubTEsIHAubDIsIHAubTIpLCAwLCBbMF0uY29uY2F0KGluaXRpYWxEYXRhKSwgdDEsIHRoaXMuUy5ncmlkKGR0LCBjYWxsYmFjaykpXG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIERvdWJsZVBlbmR1bHVtQW5pbWF0aW9uIHtcbiAgYW5pbUxvZ2ljYWxTaXplID0gMS4zXG4gIGN0eDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEXG4gIGRhdGE6IG51bWJlcltdW11cbiAgZnJhbWVTdGFydDogbnVtYmVyXG4gIGZyYW1lSW5kZXg6IG51bWJlclxuICBhbmltYXRpbmc6IGJvb2xlYW5cbiAgcGFyYW1zOiBEb3VibGVQYXJhbXNcbiAgdmFsdWVVcGRhdGVyKHRvSWQ6IHN0cmluZykge1xuICAgIHJldHVybiAoZTogRXZlbnQpID0+IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRvSWQpLnRleHRDb250ZW50ID0gKDxIVE1MSW5wdXRFbGVtZW50PmUudGFyZ2V0KS52YWx1ZVxuICB9XG5cbiAgY29uc3RydWN0b3Iobzoge1xuICAgIHRoZXRhMFJhbmdlSWQ6IHN0cmluZyxcbiAgICB0aGV0YTBWYWx1ZUlkOiBzdHJpbmcsXG4gICAgcGhpMFJhbmdlSWQ6IHN0cmluZyxcbiAgICBwaGkwVmFsdWVJZDogc3RyaW5nLFxuICAgIHRSYW5nZUlkOiBzdHJpbmcsXG4gICAgdFZhbHVlSWQ6IHN0cmluZyxcbiAgICBtUmFuZ2VJZDogc3RyaW5nLFxuICAgIG1WYWx1ZUlkOiBzdHJpbmcsXG4gICAgbFJhbmdlSWQ6IHN0cmluZyxcbiAgICBsVmFsdWVJZDogc3RyaW5nLFxuICAgIGFuaW1JZDogc3RyaW5nLFxuICAgIGdvQnV0dG9uSWQ6IHN0cmluZ1xuICB9KSB7XG4gICAgdGhpcy5hbmltYXRpbmcgPSBmYWxzZVxuICAgIGxldCBkZWcycmFkID0gKGQ6IG51bWJlcikgPT4gZCAqIDIgKiBNYXRoLlBJIC8gMzYwXG4gICAgbGV0IHRoZXRhMFJhbmdlID0gPEhUTUxJbnB1dEVsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoby50aGV0YTBSYW5nZUlkKVxuICAgIHRoZXRhMFJhbmdlLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIHRoaXMudmFsdWVVcGRhdGVyKG8udGhldGEwVmFsdWVJZCkpXG4gICAgbGV0IHBoaTBSYW5nZSA9IDxIVE1MSW5wdXRFbGVtZW50PmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG8ucGhpMFJhbmdlSWQpXG4gICAgcGhpMFJhbmdlLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIHRoaXMudmFsdWVVcGRhdGVyKG8ucGhpMFZhbHVlSWQpKVxuICAgIGxldCB0UmFuZ2UgPSA8SFRNTElucHV0RWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChvLnRSYW5nZUlkKVxuICAgIHRSYW5nZS5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCB0aGlzLnZhbHVlVXBkYXRlcihvLnRWYWx1ZUlkKSlcbiAgICBsZXQgbVJhbmdlID0gPEhUTUxJbnB1dEVsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoby5tUmFuZ2VJZClcbiAgICBtUmFuZ2UuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgdGhpcy52YWx1ZVVwZGF0ZXIoby5tVmFsdWVJZCkpXG4gICAgbGV0IGxSYW5nZSA9IDxIVE1MSW5wdXRFbGVtZW50PmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG8ubFJhbmdlSWQpXG4gICAgbFJhbmdlLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIHRoaXMudmFsdWVVcGRhdGVyKG8ubFZhbHVlSWQpKVxuICAgIGxldCBhbmltID0gPEhUTUxDYW52YXNFbGVtZW50PmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG8uYW5pbUlkKVxuICAgIHRoaXMuY3R4ID0gYW5pbS5nZXRDb250ZXh0KCcyZCcpXG4gICAgdGhpcy5jdHguc2NhbGUoYW5pbS53aWR0aCAvICgyICogdGhpcy5hbmltTG9naWNhbFNpemUpLCAtYW5pbS5oZWlnaHQgLyAoMiAqIHRoaXMuYW5pbUxvZ2ljYWxTaXplKSlcbiAgICB0aGlzLmN0eC50cmFuc2xhdGUodGhpcy5hbmltTG9naWNhbFNpemUsIC10aGlzLmFuaW1Mb2dpY2FsU2l6ZSlcbiAgICBsZXQgZGlmZkVxID0gbmV3IERvdWJsZVBlbmR1bHVtTWFwKClcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChvLmdvQnV0dG9uSWQpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gIHtcbiAgICAgIGxldCBkdCA9IDEgLyA2MFxuICAgICAgbGV0IHQxID0gK3RSYW5nZS52YWx1ZVxuICAgICAgbGV0IG4gPSBNYXRoLmNlaWwodDEgLyBkdClcbiAgICAgIHRoaXMuZGF0YSA9IG5ldyBBcnJheShuKVxuICAgICAgbGV0IGkgPSAwXG4gICAgICBsZXQgcDAgPSBwZXJmb3JtYW5jZS5ub3coKVxuICAgICAgdGhpcy5wYXJhbXMgPSB7XG4gICAgICAgIGwxOiArbFJhbmdlLnZhbHVlLFxuICAgICAgICBtMTogK21SYW5nZS52YWx1ZSxcbiAgICAgICAgbDI6IDEgLSBOdW1iZXIobFJhbmdlLnZhbHVlKSxcbiAgICAgICAgbTI6IDEgLSBOdW1iZXIobVJhbmdlLnZhbHVlKVxuICAgICAgfVxuICAgICAgZGlmZkVxLmV2b2x2ZSh0aGlzLnBhcmFtcywgW2RlZzJyYWQoK3RoZXRhMFJhbmdlLnZhbHVlKSwgZGVnMnJhZCgrcGhpMFJhbmdlLnZhbHVlKSwgMCwgMF0sIHQxLCBkdCwgKHgsIHlzKSA9PiB7dGhpcy5kYXRhW2krK10gPSB5c30pXG4gICAgICBjb25zb2xlLmxvZygnZXZvbHV0aW9uIGluJywgKHBlcmZvcm1hbmNlLm5vdygpIC0gcDApLnRvRml4ZWQoMiksICdtc2VjICcpXG4gICAgICB0aGlzLmZyYW1lSW5kZXggPSAwXG4gICAgICB0aGlzLmZyYW1lU3RhcnQgPSBwZXJmb3JtYW5jZS5ub3coKVxuICAgICAgaWYgKCF0aGlzLmFuaW1hdGluZykge1xuICAgICAgICB0aGlzLmFuaW1hdGluZyA9IHRydWVcbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMuZnJhbWUpXG4gICAgICB9XG4gICAgfSlcbiAgfVxuICBmcmFtZSA9ICgpID0+IHtcbiAgICB0aGlzLmN0eC5jbGVhclJlY3QoLXRoaXMuYW5pbUxvZ2ljYWxTaXplLCAtdGhpcy5hbmltTG9naWNhbFNpemUsIDIgKiB0aGlzLmFuaW1Mb2dpY2FsU2l6ZSwgMiAqIHRoaXMuYW5pbUxvZ2ljYWxTaXplKVxuICAgIGxldCBkID0gdGhpcy5kYXRhW3RoaXMuZnJhbWVJbmRleF1cbiAgICBsZXQgdGhldGEgPSBkWzFdLCBwaGkgPSBkWzJdXG4gICAgY29uc3QgYyA9IHRoaXMuY3R4XG4gICAgY29uc3QgcCA9IHRoaXMucGFyYW1zXG4gICAgbGV0IHgwID0gMCwgeTAgPSAwXG4gICAgbGV0IHgxID0gcC5sMSAqIE1hdGguc2luKHRoZXRhKSwgeTEgPSAtcC5sMSAqIE1hdGguY29zKHRoZXRhKVxuICAgIGxldCB4MiA9IHgxICsgcC5sMiAqIE1hdGguc2luKHBoaSksIHkyID0geTEgLSBwLmwyICogTWF0aC5jb3MocGhpKVxuICAgIGMubGluZVdpZHRoID0gMC4wMjVcbiAgICBjLnN0cm9rZVN0eWxlID0gJyM4ODgnXG4gICAgYy5iZWdpblBhdGgoKVxuICAgIGMubW92ZVRvKHgwLCB5MClcbiAgICBjLmxpbmVUbyh4MSwgeTEpXG4gICAgYy5saW5lVG8oeDIsIHkyKVxuICAgIGMuc3Ryb2tlKClcbiAgICBjLmZpbGxTdHlsZSA9ICcjZjAwJ1xuICAgIGMuYmVnaW5QYXRoKClcbiAgICBjLm1vdmVUbyh4MCwgeTApXG4gICAgYy5hcmMoeDAsIHkwLCAwLjA1LCAwLCBNYXRoLlBJICogMilcbiAgICBjLm1vdmVUbyh4MSwgeTEpXG4gICAgYy5hcmMoeDEsIHkxLCBNYXRoLnBvdyhwLm0xLCAxIC8gMykgLyA3LCAwLCBNYXRoLlBJICogMilcbiAgICBjLm1vdmVUbyh4MiwgeTIpXG4gICAgYy5hcmMoeDIsIHkyLCBNYXRoLnBvdyhwLm0yLCAxIC8gMykgLyA3LCAwLCBNYXRoLlBJICogMilcbiAgICBjLmZpbGwoKVxuXG4gICAgKyt0aGlzLmZyYW1lSW5kZXhcbiAgICBpZiAodGhpcy5mcmFtZUluZGV4IDwgdGhpcy5kYXRhLmxlbmd0aCkge1xuICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLmZyYW1lKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmFuaW1hdGluZyA9IGZhbHNlXG4gICAgICBsZXQgZXQgPSAocGVyZm9ybWFuY2Uubm93KCkgLSB0aGlzLmZyYW1lU3RhcnQpIC8gMWUzXG4gICAgICBjb25zb2xlLmxvZygnYW5pbWF0aW9uIGRvbmUnLCAodGhpcy5kYXRhLmxlbmd0aCAvIGV0KS50b0ZpeGVkKDIpLCAnZnBzJylcbiAgICB9XG4gIH1cbn1cbiJdfQ==
