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
            c.font = '10pt sans-serif';
            c.fillStyle = '#bbb';
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvb2RleC9zcmMvb2RleC50cyIsInNpY20udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FDa0NBLElBQVksT0FJWDtBQUpELFdBQVksT0FBTztJQUNqQiwrQ0FBUyxDQUFBO0lBQ1QsNkRBQWdCLENBQUE7SUFDaEIsbURBQVcsQ0FBQTtBQUNiLENBQUMsRUFKVyxPQUFPLEdBQVAsZUFBTyxLQUFQLGVBQU8sUUFJbEI7QUFFRDtJQXlCRSxnQkFBWSxDQUFTO1FBQ25CLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBQ1YsSUFBSSxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUE7UUFDckIsSUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUE7UUFDckIsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUE7UUFDM0IsSUFBSSxDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUE7UUFDcEIsSUFBSSxDQUFDLHVCQUF1QixHQUFHLENBQUMsQ0FBQTtRQUNoQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQyxDQUFBO1FBQ3pCLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxDQUFDLENBQUE7UUFDNUIsSUFBSSxDQUFDLHdCQUF3QixHQUFHLENBQUMsQ0FBQTtRQUNqQyxJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQTtRQUN4QixJQUFJLENBQUMseUJBQXlCLEdBQUcsSUFBSSxDQUFBO1FBQ3JDLElBQUksQ0FBQyxlQUFlLEdBQUcsU0FBUyxDQUFBO1FBQ2hDLElBQUksQ0FBQywwQkFBMEIsR0FBRyxDQUFDLENBQUE7UUFDbkMsSUFBSSxDQUFDLHVCQUF1QixHQUFHLEdBQUcsQ0FBQTtRQUNsQyxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQTtRQUN4QixJQUFJLENBQUMsWUFBWSxHQUFHLEdBQUcsQ0FBQTtRQUN2QixJQUFJLENBQUMsWUFBWSxHQUFH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O29CQUNQLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxFQUFFLEVBQUUsQ0FBQzt3QkFBRSxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7b0JBQzlELElBQUksR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUE7b0JBQ2pCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxFQUFFLEVBQUUsQ0FBQzt3QkFBRSxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtvQkFFNUQsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQzt3QkFDN0IsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFBO3dCQUNsQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDOzRCQUM1QixJQUFJLE1BQU0sR0FBRyxTQUFBLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBSSxDQUFDLENBQUEsR0FBRyxDQUFDLENBQUE7NEJBQzFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0NBQzlCLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUE7NEJBQzFFLENBQUM7d0JBQ0gsQ0FBQztvQkFDSCxDQUFDO29CQUNELElBQUksR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUE7b0JBQ2pCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxFQUFFLEVBQUUsQ0FBQzt3QkFBRSxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtvQkFFMUQsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDO3dCQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7b0JBQzdDLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFBO29CQUNkLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFBO29CQUNiLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxFQUFFLEVBQUUsQ0FBQzt3QkFBRSxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7b0JBRS9ELEdBQUcsQ0FBQyxDQUFDLElBQUksR0FBRyxHQUFHLENBQUMsRUFBRSxHQUFHLElBQUksSUFBSSxFQUFFLEVBQUUsR0FBRyxFQUFFLENBQUM7d0JBRXJDLElBQUksSUFBSSxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUE7d0JBQzVCLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7NEJBQ25DLElBQUksS0FBSyxHQUFHLFNBQUEsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUEsQ0FBQTs0QkFDckMsR0FBRyxHQUFHLE1BQU0sQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxHQUFHLENBQUE7NEJBQ25DLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0NBQzlCLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFBOzRCQUN0QyxDQUFDO3dCQUNILENBQUM7d0JBQ0QsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7NEJBQ3BDLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQTs0QkFDbEIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0NBQ25DLElBQUksTUFBTSxHQUFHLFNBQUEsQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFJLENBQUMsQ0FBQSxHQUFHLENBQUMsQ0FBQTtnQ0FDMUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxHQUFHLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQztvQ0FDOUIsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQTtnQ0FDMUUsQ0FBQzs0QkFDSCxDQUFDO3dCQUNILENBQUM7d0JBQ0QsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQTt3QkFDckIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxHQUFHLEVBQUUsRUFBRSxDQUFDOzRCQUFFLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTt3QkFDakUsRUFBRSxDQUFDLENBQUMsR0FBRyxLQUFLLElBQUksQ0FBQzs0QkFBQyxRQUFRLENBQUE7d0JBRTFCLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDOzRCQUNoRCxJQUFJLElBQUksR0FBRyxNQUFNLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFBOzRCQUN6QixJQUFJLElBQUksR0FBRyxNQUFNLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQTs0QkFDL0IsRUFBRSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsSUFBSSxJQUFJLEtBQUssQ0FBQyxDQUFDO2dDQUFDLElBQUksSUFBSSxDQUFDLENBQUE7NEJBQ3RDLElBQUksQ0FBQyxTQUFR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QUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxLQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7d0JBQ2pDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUE7b0JBQ3ZELENBQUM7Z0JBQ0gsQ0FBQztnQkFDRCxHQUFHLEdBQUcsQ0FBQyxDQUFBO2dCQUVQLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksS0FBSSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDO29CQUNqQyxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO29CQUNyRCxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUE7b0JBQ2pDLEdBQUcsSUFBSSxTQUFBLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUksQ0FBQyxDQUFBLENBQUE7Z0JBQzdDLENBQUM7Z0JBQ0QsR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLEtBQUksQ0FBQyxD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QUksR0FBRyxHQUFHLEtBQUssR0FBRyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUE7b0JBQ3RDLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUE7b0JBQ3RCLElBQUksR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsQ0FBQTtvQkFFM0IsRUFBRSxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ2QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFBO3dCQUNoQyxFQUFFLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFDZCxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTs0QkFDM0MsRUFBRSxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0NBQ2QsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsSUFBSSxJQUFJLEVBQUUsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDO29DQUNyQyxJQUFJLElBQUksR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO29DQUM1QixJQUFJLElBQUksR0FBRyxJQUFJLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO29DQUN6QyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFBO2dDQUMxRSxDQUFDOzRCQUNILENBQUM7d0JBQ0gsQ0FBQztvQkFDSCxDQUFDO29CQUNELENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtvQkFDaEMsRUFBRSxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ2QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQTt3QkFDdkMsRUFBRSxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7NEJBQ2QsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsSUFBSSxJQUFJLEVBQUUsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDO2dDQUNyQyxJQUFJLElBQUksR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO2dDQUM1QixJQUFJLElBQUksR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUE7Z0NBQzlDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcs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SUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUE7WUFDN0YsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUksQ0FBQyxlQUFlLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQTtZQUN0RCxDQUFDLEdBQUcsTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQTtZQUN0RCxJQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQTtZQUNqQyxJQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQTtZQUNqQyxJQUFJLElBQUksR0FBRyxDQUFDLENBQUE7WUFDWixJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUE7WUFDWCxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUNYLEVBQUUsQ0FBQyxDQUFDLEtBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO29CQUNyQixNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO29CQUNiLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7d0JBQzdCLElBQUksS0FBSyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFBO3dCQUNyQixFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDOzRCQUFDLEVBQUUsS0FBSyxDQUFBO3dCQUMxQixNQUFN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LEVBQUUsQ0FBQyxLQUFJLENBQUMsZUFBZSxFQUFFLENBQUMsR0FBRyxLQUFJLENBQUMsZUFBZSxFQUFFLENBQUMsR0FBRyxLQUFJLENBQUMsZUFBZSxDQUFDLENBQUE7WUFDcEgsSUFBSSxDQUFDLEdBQUcsS0FBSSxDQUFDLElBQUksQ0FBQyxLQUFJLENBQUMsVUFBVSxDQUFDLENBQUE7WUFDbEMsSUFBSSxFQUFFLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBQ2xCLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtZQUNoQixJQUFNLENBQUMsR0FBRyxLQUFJLENBQUMsR0FBRyxDQUFBO1lBQ2xCLENBQUMsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFBO1lBQ2xCLENBQUMsQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFBO1lBQ3BCLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQTtZQUNiLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFBO1lBQ2YsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUE7WUFDL0MsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFBO1lBQ1YsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFBO1lBQ2IsQ0FBQyxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUE7WUFDcEIsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQTtZQUNsQyxDQUFDLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQTtZQUNwQixDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FB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RyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQTtZQUMvQixJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBQ3pCLElBQUksS0FBSyxHQUFHLENBQUUsR0FBRyxDQUFBO1lBQ2pCLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUE7WUFDM0IsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUE7WUFDakMsSUFBSSxLQUFLLEdBQUcsS0FBSyxHQUFHLEtBQUssQ0FBQTtZQUN6QixJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFBO1lBQzNCLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUE7WUFDM0IsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUE7WUFDOUIsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsS0FBSyxHQUFHLEtBQUssR0FBRyxLQUFLLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxLQUFLLEdBQUcsS0FBSyxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsS0FBSyxHQUFHLEtBQUssR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLEtBQUssR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEVBQUUsR0FBRyxLQUFLLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsR0FBRyxLQUFLLEdBQUcsS0FBSyxHQUFHLEtBQUssR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEtBQUssR0FBRyxLQUFLLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxLQUFLLEdBQUcsS0FBSyxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsS0FBSyxHQUFHLEtBQUssR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLEtBQUssR0FBRyxLQUFLLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxLQUFLLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsS0FBSyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFBO1FBQy9YLENBQUMsQ0FBQTtJQUNILENBQUM7SUFRRCxrQ0FBTSxHQUFOLFVBQU8sQ0FBZSxFQUFFLFdBQXFCLEVBQUUsRUFBVSxFQUFFLEVBQVUsRUFBRSxRQUEwQztRQUMvRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFBO0lBQ3RILENBQUM7SUFDSCx3QkFBQztBQUFELENBNUJBLEFBNEJDLElBQUE7QUFFRDtJQVlFLGlDQUFZLENBYVg7UUFiRCxpQkFxREM7UUFoRUQsb0JBQWUsR0FBRyxHQUFHLENBQUE7UUFpRXJCLFVBQUssR0FBRztZQUNOLEtBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsS0FBSSxDQUFDLGVBQWUsRUFBRSxDQUFDLEtBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxHQUFHLEtBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxHQUFHLEtBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQTtZQUNwSCxJQUFJLENBQUMsR0FBRyxLQUFJLENBQUMsSUFBSSxDQUFDLEtBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQTtZQUNsQyxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtZQUM1QixJQUFNLENBQUMsR0FBRyxLQUFJLENBQUMsR0FBRyxDQUFBO1lBQ2xCLElBQU0sQ0FBQyxHQUFHLEtBQUksQ0FBQyxNQUFNLENBQUE7WUFDckIsSUFBSSxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUE7WUFDbEIsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQTtZQUM3RCxJQUFJLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBQ2xFLENBQUMsQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFBO1lBQ25CLENBQUMsQ0FBQyxXQUFXLEdBQUcsTUFBTSxDQUFBO1lBQ3RCLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQTtZQUNiLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFBO1lBQ2hCLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFBO1lBQ2hCLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFBO1lBQ2hCLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQTtZQUNWLENBQUMsQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFBO1lBQ3BCLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQTtZQUNiLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFBO1lBQ2hCLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUE7WUFDbkMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUE7WUFDaEIsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFBO1lBQ3hELENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFBO1lBQ2hCLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQTtZQUN4RCxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUE7WUFFUixFQUFFLEtBQUksQ0FBQyxVQUFVLENBQUE7WUFDakIsRUFBRSxDQUFDLENBQUMsS0FBSSxDQUFDLFVBQVUsR0FBRyxLQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZDLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxLQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7WUFDMUMsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNOLEtBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFBO2dCQUN0QixJQUFJLEVBQUUsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxLQUFJ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QUFDLEtBQUssQ0FBQyxDQUFBO1lBQ25DLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQTtJQUNKLENBQUM7SUF6REQsOENBQVksR0FBWixVQUFhLElBQVk7UUFDdkIsTUFBTSxDQUFDLFVBQUMsQ0FBUSxJQUFLLE9BQUEsUUFBUSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFXLEdBQXNCLENBQUMsQ0FBQyxNQUFPLENBQUMsS0FBSyxFQUE5RSxDQUE4RSxDQUFBO0lBQ3JHLENBQUM7SUEyRkgsOEJBQUM7QUFBRCxDQXJHQSxBQXFHQyxJQUFBO0FBckdZLDBEQUF1QiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIEFuIGltcGxlbWVudGF0aW9uIG9mIE9ERVgsIGJ5IEUuIEhhaXJlciBhbmQgRy4gV2FubmVyLCBwb3J0ZWQgZnJvbSB0aGUgRm9ydHJhbiBPREVYLkYuXG4gKiBUaGUgb3JpZ2luYWwgd29yayBjYXJyaWVzIHRoZSBCU0QgMi1jbGF1c2UgbGljZW5zZSwgYW5kIHNvIGRvZXMgdGhpcy5cbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTYgQ29saW4gU21pdGguXG4gKiAxLiBSZWRpc3RyaWJ1dGlvbnMgb2Ygc291cmNlIGNvZGUgbXVzdCByZXRhaW4gdGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UsIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nXG4gKiBkaXNjbGFpbWVyLlxuICogMi4gUmVkaXN0cmlidXRpb25zIGluIGJpbmFyeSBmb3JtIG11c3QgcmVwcm9kdWNlIHRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlLCB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlXG4gKiBmb2xsb3dpbmcgZGlzY2xhaW1lciBpbiB0aGUgZG9jdW1lbnRhdGlvbiBhbmQvb3Igb3RoZXIgbWF0ZXJpYWxzIHByb3ZpZGVkIHdpdGggdGhlIGRpc3RyaWJ1dGlvbi5cbiAqXG4gKiBUSElTIFNPRlRXQVJFIElTIFBST1ZJREVEIEJZIFRIRSBDT1BZUklHSFQgSE9MREVSUyBBTkQgQ09OVFJJQlVUT1JTIFwiQVMgSVNcIiBBTkQgQU5ZIEVYUFJFU1MgT1IgSU1QTElFRCBXQVJSQU5USUVTLFxuICogSU5DTFVESU5HLCBCVVQgTk9UIExJTUlURUQgVE8sIFRIRSBJTVBMSUVEIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZIEFORCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRVxuICogQVJFIERJU0NMQUlNRUQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBDT1BZUklHSFQgSE9MREVSIE9SIENPTlRSSUJVVE9SUyBCRSBMSUFCTEUgRk9SIEFOWSBESVJFQ1QsIElORElSRUNULFxuICogSU5DSURFTlRBTCwgU1BFQ0lBTCwgRVhFTVBMQVJZLCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVMgKElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBQUk9DVVJFTUVOVCBPRiBTVUJTVElUVVRFXG4gKiBHT09EUyBPUiBTRVJWSUNFUzsgTE9TUyBPRiBVU0UsIERBVEEsIE9SIFBST0ZJVFM7IE9SIEJVU0lORVNTIElOVEVSUlVQVElPTikgSE9XRVZFUiBDQVVTRUQgQU5EIE9OIEFOWSBUSEVPUlkgT0ZcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBDT05UUkFDVCwgU1RSSUNUIExJQUJJTElUWSwgT1IgVE9SVCAoSU5DTFVESU5HIE5FR0xJR0VOQ0UgT1IgT1RIRVJXSVNFKSBBUklTSU5HIElOIEFOWSBXQVlcbiAqIE9VVCBPRiBUSEUgVVNFIE9GIFRISVMgU09GVFdBUkUsIEVWRU4gSUYgQURWSVNFRCBPRiBUSEUgUE9TU0lCSUxJVFkgT0YgU1VDSCBEQU1BR0UuXG4gKi9cblxuZXhwb3J0IGludGVyZmFjZSBEZXJpdmF0aXZlIHsgIC8vIGZ1bmN0aW9uIGNvbXB1dGluZyB0aGUgdmFsdWUgb2YgWScgPSBGKHgsWSlcbiAgKHg6IG51bWJlciwgICAgICAgICAgIC8vIGlucHV0IHggdmFsdWVcbiAgIHk6IG51bWJlcltdKSAgICAgICAgIC8vIGlucHV0IHkgdmFsdWUpXG4gICAgOiBudW1iZXJbXSAgICAgICAgICAvLyBvdXRwdXQgeScgdmFsdWVzIChBcnJheSBvZiBsZW5ndGggbilcbn1cblxuZXhwb3J0IGludGVyZmFjZSBPdXRwdXRGdW5jdGlvbiB7ICAgICAgICAgICAgICAgICAgICAvLyB2YWx1ZSBjYWxsYmFja1xuICAobnI6IG51bWJlciwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHN0ZXAgbnVtYmVyXG4gICB4b2xkOiBudW1iZXIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbGVmdCBlZGdlIG9mIHNvbHV0aW9uIGludGVydmFsXG4gICB4OiBudW1iZXIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmlnaHQgZWRnZSBvZiBzb2x1dGlvbiBpbnRlcnZhbCAoeSA9IEYoeCkpXG4gICB5OiBudW1iZXJbXSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRih4KVxuICAgZGVuc2U/OiAoYzogbnVtYmVyLCB4OiBudW1iZXIpID0+IG51bWJlcikgIC8vIGRlbnNlIGludGVycG9sYXRvci4gVmFsaWQgaW4gdGhlIHJhbmdlIFt4LCB4b2xkKS5cbiAgICA6IGJvb2xlYW58dm9pZCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyByZXR1cm4gZmFsc2UgdG8gaGFsdCBpbnRlZ3JhdGlvblxufVxuXG5leHBvcnQgZW51bSBPdXRjb21lIHtcbiAgQ29udmVyZ2VkLFxuICBNYXhTdGVwc0V4Y2VlZGVkLFxuICBFYXJseVJldHVyblxufVxuXG5leHBvcnQgY2xhc3MgU29sdmVyIHtcbiAgbjogbnVtYmVyICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZGltZW5zaW9uIG9mIHRoZSBzeXN0ZW1cbiAgdVJvdW5kOiBudW1iZXIgICAgICAgICAgICAgICAgICAgICAgLy8gV09SSygxKSwgbWFjaGluZSBlcHNpbG9uLiAoV09SSywgSVdPUksgYXJlIHJlZmVyZW5jZXMgdG8gb2RleC5mKVxuICBtYXhTdGVwczogbnVtYmVyICAgICAgICAgICAgICAgICAgICAvLyBJV09SSygxKSwgcG9zaXRpdmUgaW50ZWdlclxuICBpbml0aWFsU3RlcFNpemU6IG51bWJlciAgICAgICAgICAgICAvLyBIXG4gIG1heFN0ZXBTaXplOiBudW1iZXIgICAgICAgICAgICAgICAgIC8vIFdPUksoMiksIG1heGltYWwgc3RlcCBzaXplLCBkZWZhdWx0IHhFbmQgLSB4XG4gIG1heEV4dHJhcG9sYXRpb25Db2x1bW5zOiBudW1iZXIgICAgIC8vIElXT1JLKDIpLCBLTSwgcG9zaXRpdmUgaW50ZWdlclxuICBzdGVwU2l6ZVNlcXVlbmNlOiBudW1iZXIgICAgICAgICAgICAvLyBJV09SSygzKSwgaW4gWzEuLjVdXG4gIHN0YWJpbGl0eUNoZWNrQ291bnQ6IG51bWJlciAgICAgICAgIC8vIElXT1JLKDQpLCBpblxuICBzdGFiaWxpdHlDaGVja1RhYmxlTGluZXM6IG51bWJlciAgICAvLyBJV09SSyg1KSwgcG9zaXRpdmUgaW50ZWdlclxuICBkZW5zZU91dHB1dDogYm9vbGVhbiAgICAgICAgICAgICAgICAvLyBJT1VUID49IDIsIHRydWUgbWVhbnMgZGVuc2Ugb3V0cHV0IGludGVycG9sYXRvciBwcm92aWRlZCB0byBzb2xPdXRcbiAgZGVuc2VPdXRwdXRFcnJvckVzdGltYXRvcjogYm9vbGVhbiAgLy8gSVdPUksoNiksIHJldmVyc2VkIHNlbnNlIGZyb20gdGhlIEZPUlRSQU4gY29kZVxuICBkZW5zZUNvbXBvbmVudHM6IG51bWJlcltdICAgICAgICAgICAvLyBJV09SSyg4KSAmIElXT1JLKDIxLC4uLiksIGNvbXBvbmVudHMgZm9yIHdoaWNoIGRlbnNlIG91dHB1dCBpcyByZXF1aXJlZFxuICBpbnRlcnBvbGF0aW9uRm9ybXVsYURlZ3JlZTogbnVtYmVyICAvLyBJV09SSyg3KSwgwrUgPSAyICogayAtIGludGVycG9sYXRpb25Gb3JtdWxhRGVncmVlICsgMSBbMS4uNl0sIGRlZmF1bHQgNFxuICBzdGVwU2l6ZVJlZHVjdGlvbkZhY3RvcjogbnVtYmVyICAgICAvLyBXT1JLKDMpLCBkZWZhdWx0IDAuNVxuICBzdGVwU2l6ZUZhYzE6IG51bWJlciAgICAgICAgICAgICAgICAvLyBXT1JLKDQpXG4gIHN0ZXBTaXplRmFjMjogbnVtYmVyICAgICAgICAgICAgICAgIC8vIFdPUksoNSlcbiAgc3RlcFNpemVGYWMzOiBudW1iZXIgICAgICAgICAgICAgICAgLy8gV09SSyg2KVxuICBzdGVwU2l6ZUZhYzQ6IG51bWJlciAgICAgICAgICAgICAgICAvLyBXT1JLKDcpXG4gIHN0ZXBTYWZldHlGYWN0b3IxOiBudW1iZXIgICAgICAgICAgIC8vIFdPUksoOClcbiAgc3RlcFNhZmV0eUZhY3RvcjI6IG51bWJlciAgICAgICAgICAgLy8gV09SSyg5KVxuICByZWxhdGl2ZVRvbGVyYW5jZTogbnVtYmVyfG51bWJlcltdICAvLyBSVE9MLiBDYW4gYmUgYSBzY2FsYXIgb3IgdmVjdG9yIG9mIGxlbmd0aCBOLlxuICBhYnNvbHV0ZVRvbGVyYW5jZTogbnVtYmVyfG51bWJlcltdICAvLyBBVE9MLiBDYW4gYmUgYSBzY2FsYXIgb3IgdmVjdG9yIG9mIGxlbmd0aCBOLlxuICBkZWJ1ZzogYm9vbGVhblxuXG4gIGNvbnN0cnVjdG9yKG46IG51bWJlcikge1xuICAgIHRoaXMubiA9IG5cbiAgICB0aGlzLnVSb3VuZCA9IDIuM2UtMTZcbiAgICB0aGlzLm1heFN0ZXBzID0gMTAwMDBcbiAgICB0aGlzLmluaXRpYWxTdGVwU2l6ZSA9IDFlLTRcbiAgICB0aGlzLm1heFN0ZXBTaXplID0gMFxuICAgIHRoaXMubWF4RXh0cmFwb2xhdGlvbkNvbHVtbnMgPSA5XG4gICAgdGhpcy5zdGVwU2l6ZVNlcXVlbmNlID0gMFxuICAgIHRoaXMuc3RhYmlsaXR5Q2hlY2tDb3VudCA9IDFcbiAgICB0aGlzLnN0YWJpbGl0eUNoZWNrVGFibGVMaW5lcyA9IDJcbiAgICB0aGlzLmRlbnNlT3V0cHV0ID0gZmFsc2VcbiAgICB0aGlzLmRlbnNlT3V0cHV0RXJyb3JFc3RpbWF0b3IgPSB0cnVlXG4gICAgdGhpcy5kZW5zZUNvbXBvbmVudHMgPSB1bmRlZmluZWRcbiAgICB0aGlzLmludGVycG9sYXRpb25Gb3JtdWxhRGVncmVlID0gNFxuICAgIHRoaXMuc3RlcFNpemVSZWR1Y3Rpb25GYWN0b3IgPSAwLjVcbiAgICB0aGlzLnN0ZXBTaXplRmFjMSA9IDAuMDJcbiAgICB0aGlzLnN0ZXBTaXplRmFjMiA9IDQuMFxuICAgIHRoaXMuc3RlcFNpemVGYWMzID0gMC44XG4gICAgdGhpcy5zdGVwU2l6ZUZhYzQgPSAwLjlcbiAgICB0aGlzLnN0ZXBTYWZldHlGYWN0b3IxID0gMC42NVxuICAgIHRoaXMuc3RlcFNhZmV0eUZhY3RvcjIgPSAwLjk0XG4gICAgdGhpcy5yZWxhdGl2ZVRvbGVyYW5jZSA9IDFlLTVcbiAgICB0aGlzLmFic29sdXRlVG9sZXJhbmNlID0gMWUtNVxuICAgIHRoaXMuZGVidWcgPSBmYWxzZVxuICB9XG5cbiAgZ3JpZChkdDogbnVtYmVyLCBvdXQ6ICh4T3V0OiBudW1iZXIsIHlPdXQ6IG51bWJlcltdKSA9PiBhbnkpOiBPdXRwdXRGdW5jdGlvbiB7XG4gICAgbGV0IGNvbXBvbmVudHM6IG51bWJlcltdID0gdGhpcy5kZW5zZUNvbXBvbmVudHNcbiAgICBpZiAoIWNvbXBvbmVudHMpIHtcbiAgICAgIGNvbXBvbmVudHMgPSBbXVxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm47ICsraSkgY29tcG9uZW50cy5wdXNoKGkpXG4gICAgfVxuICAgIGxldCB0OiBudW1iZXJcbiAgICByZXR1cm4gKG46IG51bWJlciwgeE9sZDogbnVtYmVyLCB4OiBudW1iZXIsIHk6IG51bWJlcltdLCBpbnRlcnBvbGF0ZTogKGk6IG51bWJlciwgeDogbnVtYmVyKSA9PiBudW1iZXIpID0+IHtcbiAgICAgIGlmIChuID09PSAxKSB7XG4gICAgICAgIG91dCh4LCB5KVxuICAgICAgICB0ID0geCArIGR0XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgd2hpbGUgKHQgPD0geCkge1xuICAgICAgICBsZXQgeWY6IG51bWJlcltdID0gW11cbiAgICAgICAgZm9yIChsZXQgaSBvZiBjb21wb25lbnRzKSB7XG4gICAgICAgICAgeWYucHVzaChpbnRlcnBvbGF0ZShpLCB0KSlcbiAgICAgICAgfVxuICAgICAgICBvdXQodCwgeWYpXG4gICAgICAgIHQgKz0gZHRcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyByZXR1cm4gYSAxLWJhc2VkIGFycmF5IG9mIGxlbmd0aCBuLiBJbml0aWFsIHZhbHVlcyB1bmRlZmluZWQuXG4gIHByaXZhdGUgc3RhdGljIGRpbSA9IChuOiBudW1iZXIpID0+IEFycmF5KG4gKyAxKVxuICBwcml2YXRlIHN0YXRpYyBsb2cxMCA9ICh4OiBudW1iZXIpID0+IE1hdGgubG9nKHgpIC8gTWF0aC5MTjEwXG5cbiAgLy8gTWFrZSBhIDEtYmFzZWQgMkQgYXJyYXksIHdpdGggciByb3dzIGFuZCBjIGNvbHVtbnMuIFRoZSBpbml0aWFsIHZhbHVlcyBhcmUgdW5kZWZpbmVkLlxuICBwcml2YXRlIHN0YXRpYyBkaW0yKHI6IG51bWJlciwgYzogbnVtYmVyKTogbnVtYmVyW11bXSB7XG4gICAgbGV0IGEgPSBuZXcgQXJyYXkociArIDEpXG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gcjsgKytpKSBhW2ldID0gU29sdmVyLmRpbShjKVxuICAgIHJldHVybiBhXG4gIH1cblxuICAvLyBHZW5lcmF0ZSBzdGVwIHNpemUgc2VxdWVuY2UgYW5kIHJldHVybiBhcyBhIDEtYmFzZWQgYXJyYXkgb2YgbGVuZ3RoIG4uXG4gIHN0YXRpYyBzdGVwU2l6ZVNlcXVlbmNlKG5TZXE6IG51bWJlciwgbjogbnVtYmVyKTogbnVtYmVyW10ge1xuICAgIGNvbnN0IGEgPSBuZXcgQXJyYXkobiArIDEpXG4gICAgYVswXSA9IDBcbiAgICBzd2l0Y2ggKG5TZXEpIHtcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbjsgKytpKSBhW2ldID0gMiAqIGlcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgYVsxXSA9IDJcbiAgICAgICAgZm9yIChsZXQgaSA9IDI7IGkgPD0gbjsgKytpKSBhW2ldID0gNCAqIGkgLSA0XG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlIDM6XG4gICAgICAgIGFbMV0gPSAyXG4gICAgICAgIGFbMl0gPSA0XG4gICAgICAgIGFbM10gPSA2XG4gICAgICAgIGZvciAobGV0IGkgPSA0OyBpIDw9IG47ICsraSkgYVtpXSA9IDIgKiBhW2kgLSAyXVxuICAgICAgICBicmVha1xuICAgICAgY2FzZSA0OlxuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBuOyArK2kpIGFbaV0gPSA0ICogaSAtIDJcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgNTpcbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbjsgKytpKSBhW2ldID0gNCAqIGlcbiAgICAgICAgYnJlYWtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignaW52YWxpZCBzdGVwU2l6ZVNlcXVlbmNlIHNlbGVjdGVkJylcbiAgICB9XG4gICAgcmV0dXJuIGFcbiAgfVxuXG4gIC8vIEludGVncmF0ZSB0aGUgZGlmZmVyZW50aWFsIHN5c3RlbSByZXByZXNlbnRlZCBieSBmLCBmcm9tIHggdG8geEVuZCwgd2l0aCBpbml0aWFsIGRhdGEgeS5cbiAgLy8gc29sT3V0LCBpZiBwcm92aWRlZCwgaXMgY2FsbGVkIGF0IGVhY2ggaW50ZWdyYXRpb24gc3RlcC5cbiAgc29sdmUoZjogRGVyaXZhdGl2ZSxcbiAgICAgICAgeDogbnVtYmVyLFxuICAgICAgICB5MDogbnVtYmVyW10sXG4gICAgICAgIHhFbmQ6IG51bWJlcixcbiAgICAgICAgc29sT3V0PzogT3V0cHV0RnVuY3Rpb24pIHtcblxuICAgIC8vIE1ha2UgYSBjb3B5IG9mIHkwLCAxLWJhc2VkLiBXZSBsZWF2ZSB0aGUgdXNlcidzIHBhcmFtZXRlcnMgYWxvbmUgc28gdGhhdCB0aGV5IG1heSBiZSByZXVzZWQgaWYgZGVzaXJlZC5cbiAgICBsZXQgeSA9IFswXS5jb25jYXQoeTApXG4gICAgbGV0IGR6ID0gU29sdmVyLmRpbSh0aGlzLm4pXG4gICAgbGV0IHloMSA9IFNvbHZlci5kaW0odGhpcy5uKVxuICAgIGxldCB5aDIgPSBTb2x2ZXIuZGltKHRoaXMubilcbiAgICBpZiAodGhpcy5tYXhTdGVwcyA8PSAwKSB0aHJvdyBuZXcgRXJyb3IoJ21heFN0ZXBzIG11c3QgYmUgcG9zaXRpdmUnKVxuICAgIGNvbnN0IGttID0gdGhpcy5tYXhFeHRyYXBvbGF0aW9uQ29sdW1uc1xuICAgIGlmIChrbSA8PSAyKSB0aHJvdyBuZXcgRXJyb3IoJ21heEV4dHJhcG9sYXRpb25Db2x1bW5zIG11c3QgYmUgPiAyJylcbiAgICBjb25zdCBuU2VxID0gdGhpcy5zdGVwU2l6ZVNlcXVlbmNlIHx8ICh0aGlzLmRlbnNlT3V0cHV0ID8gNCA6IDEpXG4gICAgaWYgKG5TZXEgPD0gMyAmJiB0aGlzLmRlbnNlT3V0cHV0KSB0aHJvdyBuZXcgRXJyb3IoJ3N0ZXBTaXplU2VxdWVuY2UgaW5jb21wYXRpYmxlIHdpdGggZGVuc2VPdXRwdXQnKVxuICAgIGlmICh0aGlzLmRlbnNlT3V0cHV0ICYmICFzb2xPdXQpIHRocm93IG5ldyBFcnJvcignZGVuc2VPdXRwdXQgcmVxdWlyZXMgYSBzb2x1dGlvbiBvYnNlcnZlciBmdW5jdGlvbicpXG4gICAgaWYgKHRoaXMuaW50ZXJwb2xhdGlvbkZvcm11bGFEZWdyZWUgPD0gMCB8fCB0aGlzLmludGVycG9sYXRpb25Gb3JtdWxhRGVncmVlID49IDcpIHRocm93IG5ldyBFcnJvcignYmFkIGludGVycG9sYXRpb25Gb3JtdWxhRGVncmVlJylcbiAgICBsZXQgaWNvbSA9IFswXSAgLy8gaWNvbSB3aWxsIGJlIDEtYmFzZWQsIHNvIHN0YXJ0IHdpdGggYSBwYWQgZW50cnkuXG4gICAgbGV0IG5yZGVucyA9IDBcbiAgICBpZiAodGhpcy5kZW5zZU91dHB1dCkge1xuICAgICAgaWYgKHRoaXMuZGVuc2VDb21wb25lbnRzKSB7XG4gICAgICAgIGZvciAobGV0IGMgb2YgdGhpcy5kZW5zZUNvbXBvbmVudHMpIHtcbiAgICAgICAgICAvLyBjb252ZXJ0IGRlbnNlIGNvbXBvbmVudHMgcmVxdWVzdGVkIGludG8gb25lLWJhc2VkIGluZGV4aW5nLlxuICAgICAgICAgIGlmIChjIDwgMCB8fCBjID4gdGhpcy5uKSB0aHJvdyBuZXcgRXJyb3IoJ2JhZCBkZW5zZSBjb21wb25lbnQ6ICcgKyBjKVxuICAgICAgICAgIGljb20ucHVzaChjICsgMSlcbiAgICAgICAgICArK25yZGVuc1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBpZiB1c2VyIGFza2VkIGZvciBkZW5zZSBvdXRwdXQgYnV0IGRpZCBub3Qgc3BlY2lmeSBhbnkgZGVuc2VDb21wb25lbnRzLFxuICAgICAgICAvLyByZXF1ZXN0IGFsbCBvZiB0aGVtLlxuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSB0aGlzLm47ICsraSkge1xuICAgICAgICAgIGljb20ucHVzaChpKVxuICAgICAgICB9XG4gICAgICAgIG5yZGVucyA9IHRoaXMublxuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGhpcy51Um91bmQgPD0gMWUtMzUgfHwgdGhpcy51Um91bmQgPiAxKSB0aHJvdyBuZXcgRXJyb3IoJ3N1c3BpY2lvdXMgdmFsdWUgb2YgdVJvdW5kJylcbiAgICBjb25zdCBoTWF4ID0gTWF0aC5hYnModGhpcy5tYXhTdGVwU2l6ZSB8fCB4RW5kIC0geClcbiAgICBjb25zdCBsZlNhZmUgPSAyICoga20gKiBrbSArIGttXG5cbiAgICBmdW5jdGlvbiBleHBhbmRUb0FycmF5KHg6IG51bWJlcnxudW1iZXJbXSwgbjogbnVtYmVyKTogbnVtYmVyW10ge1xuICAgICAgLy8gSWYgeCBpcyBhbiBhcnJheSwgcmV0dXJuIGEgMS1iYXNlZCBjb3B5IG9mIGl0LiBJZiB4IGlzIGEgbnVtYmVyLCByZXR1cm4gYSBuZXcgMS1iYXNlZCBhcnJheVxuICAgICAgLy8gY29uc2lzdGluZyBvZiBuIGNvcGllcyBvZiB0aGUgbnVtYmVyLlxuICAgICAgY29uc3QgdG9sQXJyYXkgPSBbMF1cbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHgpKSB7XG4gICAgICAgIHJldHVybiB0b2xBcnJheS5jb25jYXQoeClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbjsgKytpKSB0b2xBcnJheS5wdXNoKHgpXG4gICAgICAgIHJldHVybiB0b2xBcnJheVxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGFUb2wgPSBleHBhbmRUb0FycmF5KHRoaXMuYWJzb2x1dGVUb2xlcmFuY2UsIHRoaXMubilcbiAgICBjb25zdCByVG9sID0gZXhwYW5kVG9BcnJheSh0aGlzLnJlbGF0aXZlVG9sZXJhbmNlLCB0aGlzLm4pXG4gICAgbGV0IFtuRXZhbCwgblN0ZXAsIG5BY2NlcHQsIG5SZWplY3RdID0gWzAsIDAsIDAsIDBdXG5cbiAgICAvLyBjYWxsIHRvIGNvcmUgaW50ZWdyYXRvclxuICAgIGNvbnN0IG5yZCA9IE1hdGgubWF4KDEsIG5yZGVucylcbiAgICBjb25zdCBuY29tID0gTWF0aC5tYXgoMSwgKDIgKiBrbSArIDUpICogbnJkZW5zKVxuICAgIGNvbnN0IGRlbnMgPSBTb2x2ZXIuZGltKG5jb20pXG4gICAgY29uc3QgZlNhZmUgPSBTb2x2ZXIuZGltMihsZlNhZmUsIG5yZClcblxuICAgIC8vIFdyYXAgZiBpbiBhIGZ1bmN0aW9uIEYgd2hpY2ggaGlkZXMgdGhlIG9uZS1iYXNlZCBpbmRleGluZyBmcm9tIHRoZSBjdXN0b21lcnMuXG4gICAgY29uc3QgRiA9ICh4OiBudW1iZXIsIHk6IG51bWJlcltdLCB5cDogbnVtYmVyW10pID0+IHtcbiAgICAgIGxldCByZXQgPSBmKHgsIHkuc2xpY2UoMSkpXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJldC5sZW5ndGg7ICsraSkgeXBbaSArIDFdID0gcmV0W2ldXG4gICAgfVxuXG4gICAgbGV0IG9keGNvciA9ICgpOiBPdXRjb21lID0+IHtcbiAgICAgIC8vIFRoZSBmb2xsb3dpbmcgdGhyZWUgdmFyaWFibGVzIGFyZSBDT01NT04vQ09OVEVYL1xuICAgICAgbGV0IHhPbGRkOiBudW1iZXJcbiAgICAgIGxldCBoaGg6IG51bWJlclxuICAgICAgbGV0IGttaXQ6IG51bWJlclxuXG4gICAgICBsZXQgYWNjZXB0U3RlcCA9IChuOiBudW1iZXIpOiBib29sZWFuID0+IHsgICAvLyBsYWJlbCA2MFxuICAgICAgICAvLyBSZXR1cm5zIHRydWUgaWYgd2Ugc2hvdWxkIGNvbnRpbnVlIHRoZSBpbnRlZ3JhdGlvbi4gVGhlIG9ubHkgdGltZSBmYWxzZVxuICAgICAgICAvLyBpcyByZXR1cm5lZCBpcyB3aGVuIHRoZSB1c2VyJ3Mgc29sdXRpb24gb2JzZXJ2YXRpb24gZnVuY3Rpb24gaGFzIHJldHVybmVkIGZhbHNlLFxuICAgICAgICAvLyBpbmRpY2F0aW5nIHRoYXQgc2hlIGRvZXMgbm90IHdpc2ggdG8gY29udGludWUgdGhlIGNvbXB1dGF0aW9uLlxuICAgICAgICB4T2xkID0geFxuICAgICAgICB4ICs9IGhcbiAgICAgICAgaWYgKHRoaXMuZGVuc2VPdXRwdXQpIHtcbiAgICAgICAgICAvLyBrbWl0ID0gbXUgb2YgdGhlIHBhcGVyXG4gICAgICAgICAga21pdCA9IDIgKiBrYyAtIHRoaXMuaW50ZXJwb2xhdGlvbkZvcm11bGFEZWdyZWUgKyAxXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbnJkOyArK2kpIGRlbnNbaV0gPSB5W2ljb21baV1dXG4gICAgICAgICAgeE9sZGQgPSB4T2xkXG4gICAgICAgICAgaGhoID0gaCAgLy8gbm90ZTogeE9sZGQgYW5kIGhoaCBhcmUgcGFydCBvZiAvQ09OT0RYL1xuICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG5yZDsgKytpKSBkZW5zW25yZCArIGldID0gaCAqIGR6W2ljb21baV1dXG4gICAgICAgICAgbGV0IGtsbiA9IDIgKiBucmRcbiAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBucmQ7ICsraSkgZGVuc1trbG4gKyBpXSA9IHRbMV1baWNvbVtpXV1cbiAgICAgICAgICAvLyBjb21wdXRlIHNvbHV0aW9uIGF0IG1pZC1wb2ludFxuICAgICAgICAgIGZvciAobGV0IGogPSAyOyBqIDw9IGtjOyArK2opIHtcbiAgICAgICAgICAgIGxldCBkYmxlbmogPSBualtqXVxuICAgICAgICAgICAgZm9yIChsZXQgbCA9IGo7IGwgPj0gMjsgLS1sKSB7XG4gICAgICAgICAgICAgIGxldCBmYWN0b3IgPSAoZGJsZW5qIC8gbmpbbCAtIDFdKSAqKiAyIC0gMVxuICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBucmQ7ICsraSkge1xuICAgICAgICAgICAgICAgIHlTYWZlW2wgLSAxXVtpXSA9IHlTYWZlW2xdW2ldICsgKHlTYWZlW2xdW2ldIC0geVNhZmVbbCAtIDFdW2ldKSAvIGZhY3RvclxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGxldCBrcm4gPSA0ICogbnJkXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbnJkOyArK2kpIGRlbnNba3JuICsgaV0gPSB5U2FmZVsxXVtpXVxuICAgICAgICAgIC8vIGNvbXB1dGUgZmlyc3QgZGVyaXZhdGl2ZSBhdCByaWdodCBlbmRcbiAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBuOyArK2kpIHloMVtpXSA9IHRbMV1baV1cbiAgICAgICAgICBGKHgsIHloMSwgeWgyKVxuICAgICAgICAgIGtybiA9IDMgKiBucmRcbiAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBucmQ7ICsraSkgZGVuc1trcm4gKyBpXSA9IHloMltpY29tW2ldXSAqIGhcbiAgICAgICAgICAvLyBUSEUgTE9PUFxuICAgICAgICAgIGZvciAobGV0IGttaSA9IDE7IGttaSA8PSBrbWl0OyArK2ttaSkge1xuICAgICAgICAgICAgLy8gY29tcHV0ZSBrbWktdGggZGVyaXZhdGl2ZSBhdCBtaWQtcG9pbnRcbiAgICAgICAgICAgIGxldCBrYmVnID0gKGttaSArIDEpIC8gMiB8IDBcbiAgICAgICAgICAgIGZvciAobGV0IGtrID0ga2JlZzsga2sgPD0ga2M7ICsra2spIHtcbiAgICAgICAgICAgICAgbGV0IGZhY25qID0gKG5qW2trXSAvIDIpICoqIChrbWkgLSAxKVxuICAgICAgICAgICAgICBpUHQgPSBpUG9pbnRba2sgKyAxXSAtIDIgKiBrayArIGttaVxuICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBucmQ7ICsraSkge1xuICAgICAgICAgICAgICAgIHlTYWZlW2trXVtpXSA9IGZTYWZlW2lQdF1baV0gKiBmYWNualxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGxldCBqID0ga2JlZyArIDE7IGogPD0ga2M7ICsraikge1xuICAgICAgICAgICAgICBsZXQgZGJsZW5qID0gbmpbal1cbiAgICAgICAgICAgICAgZm9yIChsZXQgbCA9IGo7IGwgPj0ga2JlZyArIDE7IC0tbCkge1xuICAgICAgICAgICAgICAgIGxldCBmYWN0b3IgPSAoZGJsZW5qIC8gbmpbbCAtIDFdKSAqKiAyIC0gMVxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG5yZDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICB5U2FmZVtsIC0gMV1baV0gPSB5U2FmZVtsXVtpXSArICh5U2FmZVtsXVtpXSAtIHlTYWZlW2wgLSAxXVtpXSkgLyBmYWN0b3JcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGtybiA9IChrbWkgKyA0KSAqIG5yZFxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbnJkOyArK2kpIGRlbnNba3JuICsgaV0gPSB5U2FmZVtrYmVnXVtpXSAqIGhcbiAgICAgICAgICAgIGlmIChrbWkgPT09IGttaXQpIGNvbnRpbnVlXG4gICAgICAgICAgICAvLyBjb21wdXRlIGRpZmZlcmVuY2VzXG4gICAgICAgICAgICBmb3IgKGxldCBrayA9IChrbWkgKyAyKSAvIDIgfCAwOyBrayA8PSBrYzsgKytraykge1xuICAgICAgICAgICAgICBsZXQgbGJlZyA9IGlQb2ludFtrayArIDFdXG4gICAgICAgICAgICAgIGxldCBsZW5kID0gaVBvaW50W2trXSArIGttaSArIDFcbiAgICAgICAgICAgICAgaWYgKGttaSA9PT0gMSAmJiBuU2VxID09PSA0KSBsZW5kICs9IDJcbiAgICAgICAgICAgICAgbGV0IGw6IG51bWJlclxuICAgICAgICAgICAgICBmb3IgKGwgPSBsYmVnOyBsID49IGxlbmQ7IGwgLT0gMikge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG5yZDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICBmU2FmZVtsXVtpXSAtPSBmU2FmZVtsIC0gMl1baV1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKGttaSA9PT0gMSAmJiBuU2VxID09PSA0KSB7XG4gICAgICAgICAgICAgICAgbCA9IGxlbmQgLSAyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbnJkOyArK2kpIGZTYWZlW2xdW2ldIC09IGR6W2ljb21baV1dXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGNvbXB1dGUgZGlmZmVyZW5jZXNcbiAgICAgICAgICAgIGZvciAobGV0IGtrID0gKGttaSArIDIpIC8gMiB8IDA7IGtrIDw9IGtjOyArK2trKSB7XG4gICAgICAgICAgICAgIGxldCBsYmVnID0gaVBvaW50W2trICsgMV0gLSAxXG4gICAgICAgICAgICAgIGxldCBsZW5kID0gaVBvaW50W2trXSArIGttaSArIDJcbiAgICAgICAgICAgICAgZm9yIChsZXQgbCA9IGxiZWc7IGwgPj0gbGVuZDsgbCAtPSAyKSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbnJkOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgIGZTYWZlW2xdW2ldIC09IGZTYWZlW2wgLSAyXVtpXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpbnRlcnAobnJkLCBkZW5zLCBrbWl0KVxuICAgICAgICAgIC8vIGVzdGltYXRpb24gb2YgaW50ZXJwb2xhdGlvbiBlcnJvclxuICAgICAgICAgIGlmICh0aGlzLmRlbnNlT3V0cHV0RXJyb3JFc3RpbWF0b3IgJiYga21pdCA+PSAxKSB7XG4gICAgICAgICAgICBsZXQgZXJyaW50ID0gMFxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbnJkOyArK2kpIGVycmludCArPSAoZGVuc1soa21pdCArIDQpICogbnJkICsgaV0gLyBzY2FsW2ljb21baV1dKSAqKiAyXG4gICAgICAgICAgICBlcnJpbnQgPSBNYXRoLnNxcnQoZXJyaW50IC8gbnJkKSAqIGVycmZhY1trbWl0XVxuICAgICAgICAgICAgaG9wdGRlID0gaCAvIE1hdGgubWF4KGVycmludCAqKiAoMSAvIChrbWl0ICsgNCkpLCAwLjAxKVxuICAgICAgICAgICAgaWYgKGVycmludCA+IDEwKSB7XG4gICAgICAgICAgICAgIGggPSBob3B0ZGVcbiAgICAgICAgICAgICAgeCA9IHhPbGRcbiAgICAgICAgICAgICAgKytuUmVqZWN0XG4gICAgICAgICAgICAgIHJlamVjdCA9IHRydWVcbiAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbjsgKytpKSBkeltpXSA9IHloMltpXVxuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG47ICsraSkgeVtpXSA9IHRbMV1baV1cbiAgICAgICAgKytuQWNjZXB0XG4gICAgICAgIGlmIChzb2xPdXQpIHtcbiAgICAgICAgICAvLyBJZiBkZW5zZU91dHB1dCwgd2UgYWxzbyB3YW50IHRvIHN1cHBseSB0aGUgZGVuc2UgY2xvc3VyZS5cbiAgICAgICAgICBpZiAoc29sT3V0KG5BY2NlcHQgKyAxLCB4T2xkLCB4LCB5LnNsaWNlKDEpLFxuICAgICAgICAgICAgICB0aGlzLmRlbnNlT3V0cHV0ICYmIGNvbnRleCh4T2xkZCwgaGhoLCBrbWl0LCBkZW5zLCBpY29tKSkgPT09IGZhbHNlKSByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuICAgICAgICAvLyBjb21wdXRlIG9wdGltYWwgb3JkZXJcbiAgICAgICAgbGV0IGtvcHQ6IG51bWJlclxuICAgICAgICBpZiAoa2MgPT09IDIpIHtcbiAgICAgICAgICBrb3B0ID0gTWF0aC5taW4oMywga20gLSAxKVxuICAgICAgICAgIGlmIChyZWplY3QpIGtvcHQgPSAyXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKGtjIDw9IGspIHtcbiAgICAgICAgICAgIGtvcHQgPSBrY1xuICAgICAgICAgICAgaWYgKHdba2MgLSAxXSA8IHdba2NdICogdGhpcy5zdGVwU2l6ZUZhYzMpIGtvcHQgPSBrYyAtIDFcbiAgICAgICAgICAgIGlmICh3W2tjXSA8IHdba2MgLSAxXSAqIHRoaXMuc3RlcFNpemVGYWM0KSBrb3B0ID0gTWF0aC5taW4oa2MgKyAxLCBrbSAtIDEpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGtvcHQgPSBrYyAtIDFcbiAgICAgICAgICAgIGlmIChrYyA+IDMgJiYgd1trYyAtIDJdIDwgd1trYyAtIDFdICogdGhpcy5zdGVwU2l6ZUZhYzMpIGtvcHQgPSBrYyAtIDJcbiAgICAgICAgICAgIGlmICh3W2tjXSA8IHdba29wdF0gKiB0aGlzLnN0ZXBTaXplRmFjNCkga29wdCA9IE1hdGgubWluKGtjLCBrbSAtIDEpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIGFmdGVyIGEgcmVqZWN0ZWQgc3RlcFxuICAgICAgICBpZiAocmVqZWN0KSB7XG4gICAgICAgICAgayA9IE1hdGgubWluKGtvcHQsIGtjKVxuICAgICAgICAgIGggPSBwb3NuZWcgKiBNYXRoLm1pbihNYXRoLmFicyhoKSwgTWF0aC5hYnMoaGhba10pKVxuICAgICAgICAgIHJlamVjdCA9IGZhbHNlXG4gICAgICAgICAgcmV0dXJuIHRydWUgIC8vIGdvdG8gMTBcbiAgICAgICAgfVxuICAgICAgICBpZiAoa29wdCA8PSBrYykge1xuICAgICAgICAgIGggPSBoaFtrb3B0XVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChrYyA8IGsgJiYgd1trY10gPCB3W2tjIC0gMV0gKiB0aGlzLnN0ZXBTaXplRmFjNCkge1xuICAgICAgICAgICAgaCA9IGhoW2tjXSAqIGFba29wdCArIDFdIC8gYVtrY11cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaCA9IGhoW2tjXSAqIGFba29wdF0gLyBhW2tjXVxuICAgICAgICAgIH1cblxuXG4gICAgICAgIH1cbiAgICAgICAgLy8gY29tcHV0ZSBzdGVwc2l6ZSBmb3IgbmV4dCBzdGVwXG4gICAgICAgIGsgPSBrb3B0XG4gICAgICAgIGggPSBwb3NuZWcgKiBNYXRoLmFicyhoKVxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgfVxuXG4gICAgICBsZXQgbWlkZXggPSAoajogbnVtYmVyKTogdm9pZCA9PiB7XG4gICAgICAgIGNvbnN0IGR5ID0gU29sdmVyLmRpbSh0aGlzLm4pXG4gICAgICAgIC8vIENvbXB1dGVzIHRoZSBqdGggbGluZSBvZiB0aGUgZXh0cmFwb2xhdGlvbiB0YWJsZSBhbmRcbiAgICAgICAgLy8gcHJvdmlkZXMgYW4gZXN0aW1hdGlvbiBvZiB0aGUgb3B0aW9uYWwgc3RlcHNpemVcbiAgICAgICAgY29uc3QgaGogPSBoIC8gbmpbal1cbiAgICAgICAgLy8gRXVsZXIgc3RhcnRpbmcgc3RlcFxuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSB0aGlzLm47ICsraSkge1xuICAgICAgICAgIHloMVtpXSA9IHlbaV1cbiAgICAgICAgICB5aDJbaV0gPSB5W2ldICsgaGogKiBkeltpXVxuICAgICAgICB9XG4gICAgICAgIC8vIEV4cGxpY2l0IG1pZHBvaW50IHJ1bGVcbiAgICAgICAgY29uc3QgbSA9IG5qW2pdIC0gMVxuICAgICAgICBjb25zdCBuak1pZCA9IChualtqXSAvIDIpIHwgMFxuICAgICAgICBmb3IgKGxldCBtbSA9IDE7IG1tIDw9IG07ICsrbW0pIHtcbiAgICAgICAgICBpZiAodGhpcy5kZW5zZU91dHB1dCAmJiBtbSA9PT0gbmpNaWQpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG5yZDsgKytpKSB7XG4gICAgICAgICAgICAgIHlTYWZlW2pdW2ldID0geWgyW2ljb21baV1dXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIEYoeCArIGhqICogbW0sIHloMiwgZHkpXG4gICAgICAgICAgaWYgKHRoaXMuZGVuc2VPdXRwdXQgJiYgTWF0aC5hYnMobW0gLSBuak1pZCkgPD0gMiAqIGogLSAxKSB7XG4gICAgICAgICAgICArK2lQdFxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbnJkOyArK2kpIHtcbiAgICAgICAgICAgICAgZlNhZmVbaVB0XVtpXSA9IGR5W2ljb21baV1dXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IHRoaXMubjsgKytpKSB7XG4gICAgICAgICAgICBsZXQgeXMgPSB5aDFbaV1cbiAgICAgICAgICAgIHloMVtpXSA9IHloMltpXVxuICAgICAgICAgICAgeWgyW2ldID0geXMgKyAyICogaGogKiBkeVtpXVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAobW0gPD0gdGhpcy5zdGFiaWxpdHlDaGVja0NvdW50ICYmIGogPD0gdGhpcy5zdGFiaWxpdHlDaGVja1RhYmxlTGluZXMpIHtcbiAgICAgICAgICAgIC8vIHN0YWJpbGl0eSBjaGVja1xuICAgICAgICAgICAgbGV0IGRlbDEgPSAwXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSB0aGlzLm47ICsraSkge1xuICAgICAgICAgICAgICBkZWwxICs9IChkeltpXSAvIHNjYWxbaV0pICoqIDJcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBkZWwyID0gMFxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gdGhpcy5uOyArK2kpIHtcbiAgICAgICAgICAgICAgZGVsMiArPSAoKGR5W2ldIC0gZHpbaV0pIC8gc2NhbFtpXSkgKiogMlxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgcXVvdCA9IGRlbDIgLyBNYXRoLm1heCh0aGlzLnVSb3VuZCwgZGVsMSlcbiAgICAgICAgICAgIGlmIChxdW90ID4gNCkge1xuICAgICAgICAgICAgICArK25FdmFsXG4gICAgICAgICAgICAgIGF0b3YgPSB0cnVlXG4gICAgICAgICAgICAgIGggKj0gdGhpcy5zdGVwU2l6ZVJlZHVjdGlvbkZhY3RvclxuICAgICAgICAgICAgICByZWplY3QgPSB0cnVlXG4gICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBmaW5hbCBzbW9vdGhpbmcgc3RlcFxuICAgICAgICBGKHggKyBoLCB5aDIsIGR5KVxuICAgICAgICBpZiAodGhpcy5kZW5zZU91dHB1dCAmJiBuak1pZCA8PSAyICogaiAtIDEpIHtcbiAgICAgICAgICArK2lQdFxuICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG5yZDsgKytpKSB7XG4gICAgICAgICAgICBmU2FmZVtpUHRdW2ldID0gZHlbaWNvbVtpXV1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gdGhpcy5uOyArK2kpIHtcbiAgICAgICAgICB0W2pdW2ldID0gKHloMVtpXSArIHloMltpXSArIGhqICogZHlbaV0pIC8gMlxuICAgICAgICB9XG4gICAgICAgIG5FdmFsICs9IG5qW2pdXG4gICAgICAgIC8vIHBvbHlub21pYWwgZXh0cmFwb2xhdGlvblxuICAgICAgICBpZiAoaiA9PT0gMSkgcmV0dXJuICAvLyB3YXMgai5lcS4xXG4gICAgICAgIGNvbnN0IGRibGVuaiA9IG5qW2pdXG4gICAgICAgIGxldCBmYWM6IG51bWJlclxuICAgICAgICBmb3IgKGxldCBsID0gajsgbCA+IDE7IC0tbCkge1xuICAgICAgICAgIGZhYyA9IChkYmxlbmogLyBualtsIC0gMV0pICoqIDIgLSAxXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gdGhpcy5uOyArK2kpIHtcbiAgICAgICAgICAgIHRbbCAtIDFdW2ldID0gdFtsXVtpXSArICh0W2xdW2ldIC0gdFtsIC0gMV1baV0pIC8gZmFjXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVyciA9IDBcbiAgICAgICAgLy8gc2NhbGluZ1xuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSB0aGlzLm47ICsraSkge1xuICAgICAgICAgIGxldCB0MWkgPSBNYXRoLm1heChNYXRoLmFicyh5W2ldKSwgTWF0aC5hYnModFsxXVtpXSkpXG4gICAgICAgICAgc2NhbFtpXSA9IGFUb2xbaV0gKyByVG9sW2ldICogdDFpXG4gICAgICAgICAgZXJyICs9ICgodFsxXVtpXSAtIHRbMl1baV0pIC8gc2NhbFtpXSkgKiogMlxuICAgICAgICB9XG4gICAgICAgIGVyciA9IE1hdGguc3FydChlcnIgLyB0aGlzLm4pXG4gICAgICAgIGlmIChlcnIgKiB0aGlzLnVSb3VuZCA+PSAxIHx8IChqID4gMiAmJiBlcnIgPj0gZXJyT2xkKSkge1xuICAgICAgICAgIGF0b3YgPSB0cnVlXG4gICAgICAgICAgaCAqPSB0aGlzLnN0ZXBTaXplUmVkdWN0aW9uRmFjdG9yXG4gICAgICAgICAgcmVqZWN0ID0gdHJ1ZVxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIGVyck9sZCA9IE1hdGgubWF4KDQgKiBlcnIsIDEpXG4gICAgICAgIC8vIGNvbXB1dGUgb3B0aW1hbCBzdGVwc2l6ZXNcbiAgICAgICAgbGV0IGV4cDAgPSAxIC8gKDIgKiBqIC0gMSlcbiAgICAgICAgbGV0IGZhY01pbiA9IHRoaXMuc3RlcFNpemVGYWMxICoqIGV4cDBcbiAgICAgICAgZmFjID0gTWF0aC5taW4odGhpcy5zdGVwU2l6ZUZhYzIgLyBmYWNNaW4sXG4gICAgICAgICAgTWF0aC5tYXgoZmFjTWluLCAoZXJyIC8gdGhpcy5zdGVwU2FmZXR5RmFjdG9yMSkgKiogZXhwMCAvIHRoaXMuc3RlcFNhZmV0eUZhY3RvcjIpKVxuICAgICAgICBmYWMgPSAxIC8gZmFjXG4gICAgICAgIGhoW2pdID0gTWF0aC5taW4oTWF0aC5hYnMoaCkgKiBmYWMsIGhNYXgpXG4gICAgICAgIHdbal0gPSBhW2pdIC8gaGhbal1cbiAgICAgIH1cblxuICAgICAgY29uc3QgaW50ZXJwID0gKG46IG51bWJlciwgeTogbnVtYmVyW10sIGltaXQ6IG51bWJlcikgPT4ge1xuICAgICAgICAvLyBjb21wdXRlcyB0aGUgY29lZmZpY2llbnRzIG9mIHRoZSBpbnRlcnBvbGF0aW9uIGZvcm11bGFcbiAgICAgICAgbGV0IGEgPSBuZXcgQXJyYXkoMzEpICAvLyB6ZXJvLWJhc2VkOiAwOjMwXG4gICAgICAgIC8vIGJlZ2luIHdpdGggSGVybWl0ZSBpbnRlcnBvbGF0aW9uXG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG47ICsraSkge1xuICAgICAgICAgIGxldCB5MCA9IHlbaV1cbiAgICAgICAgICBsZXQgeTEgPSB5WzIgKiBuICsgaV1cbiAgICAgICAgICBsZXQgeXAwID0geVtuICsgaV1cbiAgICAgICAgICBsZXQgeXAxID0geVszICogbiArIGldXG4gICAgICAgICAgbGV0IHlEaWZmID0geTEgLSB5MFxuICAgICAgICAgIGxldCBhc3BsID0gLXlwMSArIHlEaWZmXG4gICAgICAgICAgbGV0IGJzcGwgPSB5cDAgLSB5RGlmZlxuICAgICAgICAgIHlbbiArIGldID0geURpZmZcbiAgICAgICAgICB5WzIgKiBuICsgaV0gPSBhc3BsXG4gICAgICAgICAgeVszICogbiArIGldID0gYnNwbFxuICAgICAgICAgIGlmIChpbWl0IDwgMCkgY29udGludWVcbiAgICAgICAgICAvLyBjb21wdXRlIHRoZSBkZXJpdmF0aXZlcyBvZiBIZXJtaXRlIGF0IG1pZHBvaW50XG4gICAgICAgICAgbGV0IHBoMCA9ICh5MCArIHkxKSAqIDAuNSArIDAuMTI1ICogKGFzcGwgKyBic3BsKVxuICAgICAgICAgIGxldCBwaDEgPSB5RGlmZiArIChhc3BsIC0gYnNwbCkgKiAwLjI1XG4gICAgICAgICAgbGV0IHBoMiA9IC0oeXAwIC0geXAxKVxuICAgICAgICAgIGxldCBwaDMgPSA2ICogKGJzcGwgLSBhc3BsKVxuICAgICAgICAgIC8vIGNvbXB1dGUgdGhlIGZ1cnRoZXIgY29lZmZpY2llbnRzXG4gICAgICAgICAgaWYgKGltaXQgPj0gMSkge1xuICAgICAgICAgICAgYVsxXSA9IDE2ICogKHlbNSAqIG4gKyBpXSAtIHBoMSlcbiAgICAgICAgICAgIGlmIChpbWl0ID49IDMpIHtcbiAgICAgICAgICAgICAgYVszXSA9IDE2ICogKHlbNyAqIG4gKyBpXSAtIHBoMyArIDMgKiBhWzFdKVxuICAgICAgICAgICAgICBpZiAoaW1pdCA+PSA1KSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaW0gPSA1OyBpbSA8PSBpbWl0OyBpbSArPSAyKSB7XG4gICAgICAgICAgICAgICAgICBsZXQgZmFjMSA9IGltICogKGltIC0gMSkgLyAyXG4gICAgICAgICAgICAgICAgICBsZXQgZmFjMiA9IGZhYzEgKiAoaW0gLSAyKSAqIChpbSAtIDMpICogMlxuICAgICAgICAgICAgICAgICAgYVtpbV0gPSAxNiAqICh5WyhpbSArIDQpICogbiArIGldICsgZmFjMSAqIGFbaW0gLSAyXSAtIGZhYzIgKiBhW2ltIC0gNF0pXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGFbMF0gPSAoeVs0ICogbiArIGldIC0gcGgwKSAqIDE2XG4gICAgICAgICAgaWYgKGltaXQgPj0gMikge1xuICAgICAgICAgICAgYVsyXSA9ICh5W24gKiA2ICsgaV0gLSBwaDIgKyBhWzBdKSAqIDE2XG4gICAgICAgICAgICBpZiAoaW1pdCA+PSA0KSB7XG4gICAgICAgICAgICAgIGZvciAobGV0IGltID0gNDsgaW0gPD0gaW1pdDsgaW0gKz0gMikge1xuICAgICAgICAgICAgICAgIGxldCBmYWMxID0gaW0gKiAoaW0gLSAxKSAvIDJcbiAgICAgICAgICAgICAgICBsZXQgZmFjMiA9IGltICogKGltIC0gMSkgKiAoaW0gLSAyKSAqIChpbSAtIDMpXG4gICAgICAgICAgICAgICAgYVtpbV0gPSAoeVtuICogKGltICsgNCkgKyBpXSArIGFbaW0gLSAyXSAqIGZhYzEgLSBhW2ltIC0gNF0gKiBmYWMyKSAqIDE2XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgZm9yIChsZXQgaW0gPSAwOyBpbSA8PSBpbWl0OyArK2ltKSB5W24gKiAoaW0gKyA0KSArIGldID0gYVtpbV1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCBjb250ZXggPSAoeE9sZDogbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgIGg6IG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICBpbWl0OiBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgeTogbnVtYmVyW10sXG4gICAgICAgICAgICAgICAgICAgICAgaWNvbTogbnVtYmVyW10pID0+IHtcbiAgICAgICAgcmV0dXJuIChjOiBudW1iZXIsIHg6IG51bWJlcikgPT4ge1xuICAgICAgICAgIGxldCBpID0gMFxuICAgICAgICAgIGZvciAobGV0IGogPSAxOyBqIDw9IG5yZDsgKytqKSB7XG4gICAgICAgICAgICAvLyBjYXJlZnVsOiBjdXN0b21lcnMgZGVzY3JpYmUgY29tcG9uZW50cyAwLWJhc2VkLiBXZSByZWNvcmQgaW5kaWNlcyAxLWJhc2VkLlxuICAgICAgICAgICAgaWYgKGljb21bal0gPT09IGMgKyAxKSBpID0galxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoaSA9PT0gMCkgdGhyb3cgbmV3IEVycm9yKCdubyBkZW5zZSBvdXRwdXQgYXZhaWxhYmxlIGZvciBjb21wb25lbnQgJyArIGMpXG4gICAgICAgICAgY29uc3QgdGhldGEgPSAoeCAtIHhPbGQpIC8gaFxuICAgICAgICAgIGNvbnN0IHRoZXRhMSA9IDEgLSB0aGV0YVxuICAgICAgICAgIGNvbnN0IHBodGhldCA9IHlbaV0gKyB0aGV0YSAqICh5W25yZCArIGldICsgdGhldGExICogKHlbMiAqIG5yZCArIGldICogdGhldGEgKyB5WzMgKiBucmQgKyBpXSAqIHRoZXRhMSkpXG4gICAgICAgICAgaWYgKGltaXQgPCAwKSByZXR1cm4gcGh0aGV0XG4gICAgICAgICAgY29uc3QgdGhldGFoID0gdGhldGEgLSAwLjVcbiAgICAgICAgICBsZXQgcmV0ID0geVtucmQgKiAoaW1pdCArIDQpICsgaV1cbiAgICAgICAgICBmb3IgKGxldCBpbSA9IGltaXQ7IGltID49IDE7IC0taW0pIHtcbiAgICAgICAgICAgIHJldCA9IHlbbnJkICogKGltICsgMykgKyBpXSArIHJldCAqIHRoZXRhaCAvIGltXG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBwaHRoZXQgKyAodGhldGEgKiB0aGV0YTEpICoqIDIgKiByZXRcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBwcmVwYXJhdGlvblxuICAgICAgY29uc3QgeVNhZmUgPSBTb2x2ZXIuZGltMihrbSwgbnJkKVxuICAgICAgY29uc3QgaGggPSBTb2x2ZXIuZGltKGttKVxuICAgICAgY29uc3QgdCA9IFNvbHZlci5kaW0yKGttLCB0aGlzLm4pXG4gICAgICAvLyBEZWZpbmUgdGhlIHN0ZXAgc2l6ZSBzZXF1ZW5jZVxuICAgICAgY29uc3QgbmogPSBTb2x2ZXIuc3RlcFNpemVTZXF1ZW5jZShuU2VxLCBrbSlcbiAgICAgIC8vIERlZmluZSB0aGUgYVtpXSBmb3Igb3JkZXIgc2VsZWN0aW9uXG4gICAgICBjb25zdCBhID0gU29sdmVyLmRpbShrbSlcbiAgICAgIGFbMV0gPSAxICsgbmpbMV1cbiAgICAgIGZvciAobGV0IGkgPSAyOyBpIDw9IGttOyArK2kpIHtcbiAgICAgICAgYVtpXSA9IGFbaSAtIDFdICsgbmpbaV1cbiAgICAgIH1cbiAgICAgIC8vIEluaXRpYWwgU2NhbGluZ1xuICAgICAgY29uc3Qgc2NhbCA9IFNvbHZlci5kaW0odGhpcy5uKVxuICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gdGhpcy5uOyArK2kpIHtcbiAgICAgICAgc2NhbFtpXSA9IGFUb2xbaV0gKyByVG9sW2ldICsgTWF0aC5hYnMoeVtpXSlcbiAgICAgIH1cbiAgICAgIC8vIEluaXRpYWwgcHJlcGFyYXRpb25zXG4gICAgICBjb25zdCBwb3NuZWcgPSB4RW5kIC0geCA+PSAwID8gMSA6IC0xXG4gICAgICBsZXQgayA9IE1hdGgubWF4KDIsIE1hdGgubWluKGttIC0gMSwgTWF0aC5mbG9vcigtU29sdmVyLmxvZzEwKHJUb2xbMV0gKyAxZS00MCkgKiAwLjYgKyAxLjUpKSlcbiAgICAgIGxldCBoID0gTWF0aC5tYXgoTWF0aC5hYnModGhpcy5pbml0aWFsU3RlcFNpemUpLCAxZS00KVxuICAgICAgaCA9IHBvc25lZyAqIE1hdGgubWluKGgsIGhNYXgsIE1hdGguYWJzKHhFbmQgLSB4KSAvIDIpXG4gICAgICBjb25zdCBpUG9pbnQgPSBTb2x2ZXIuZGltKGttICsgMSlcbiAgICAgIGNvbnN0IGVycmZhYyA9IFNvbHZlci5kaW0oMiAqIGttKVxuICAgICAgbGV0IHhPbGQgPSB4XG4gICAgICBsZXQgaVB0ID0gMFxuICAgICAgaWYgKHNvbE91dCkge1xuICAgICAgICBpZiAodGhpcy5kZW5zZU91dHB1dCkge1xuICAgICAgICAgIGlQb2ludFsxXSA9IDBcbiAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBrbTsgKytpKSB7XG4gICAgICAgICAgICBsZXQgbmpBZGQgPSA0ICogaSAtIDJcbiAgICAgICAgICAgIGlmIChualtpXSA+IG5qQWRkKSArK25qQWRkXG4gICAgICAgICAgICBpUG9pbnRbaSArIDFdID0gaVBvaW50W2ldICsgbmpBZGRcbiAgICAgICAgICB9XG4gICAgICAgICAgZm9yIChsZXQgbXUgPSAxOyBtdSA8PSAyICoga207ICsrbXUpIHtcbiAgICAgICAgICAgIGxldCBlcnJ4ID0gTWF0aC5zcXJ0KG11IC8gKG11ICsgNCkpICogMC41XG4gICAgICAgICAgICBsZXQgcHJvZCA9ICgxIC8gKG11ICsgNCkpICoqIDJcbiAgICAgICAgICAgIGZvciAobGV0IGogPSAxOyBqIDw9IG11OyArK2opIHByb2QgKj0gZXJyeCAvIGpcbiAgICAgICAgICAgIGVycmZhY1ttdV0gPSBwcm9kXG4gICAgICAgICAgfVxuICAgICAgICAgIGlQdCA9IDBcbiAgICAgICAgfVxuICAgICAgICAvLyBjaGVjayByZXR1cm4gdmFsdWUgYW5kIGFiYW5kb24gaW50ZWdyYXRpb24gaWYgY2FsbGVkIGZvclxuICAgICAgICBpZiAoZmFsc2UgPT09IHNvbE91dChuQWNjZXB0ICsgMSwgeE9sZCwgeCwgeS5zbGljZSgxKSkpIHtcbiAgICAgICAgICByZXR1cm4gT3V0Y29tZS5FYXJseVJldHVyblxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBsZXQgZXJyID0gMFxuICAgICAgbGV0IGVyck9sZCA9IDFlMTBcbiAgICAgIGxldCBob3B0ZGUgPSBwb3NuZWcgKiBoTWF4XG4gICAgICBjb25zdCB3ID0gU29sdmVyLmRpbShrbSlcbiAgICAgIHdbMV0gPSAwXG4gICAgICBsZXQgcmVqZWN0ID0gZmFsc2VcbiAgICAgIGxldCBsYXN0ID0gZmFsc2VcbiAgICAgIGxldCBhdG92OiBib29sZWFuXG4gICAgICBsZXQga2MgPSAwXG5cbiAgICAgIGVudW0gU1RBVEUge1xuICAgICAgICBTdGFydCwgQmFzaWNJbnRlZ3JhdGlvblN0ZXAsIENvbnZlcmdlbmNlU3RlcCwgSG9wZUZvckNvbnZlcmdlbmNlLCBBY2NlcHQsIFJlamVjdFxuICAgICAgfVxuICAgICAgbGV0IHN0YXRlOiBTVEFURSA9IFNUQVRFLlN0YXJ0XG5cbiAgICAgIGxvb3A6IHdoaWxlICh0cnVlKSB7XG4gICAgICAgIHRoaXMuZGVidWcgJiYgY29uc29sZS5sb2coJ1NUQVRFJywgU1RBVEVbc3RhdGVdLCBuU3RlcCwgeE9sZCwgeCwgaCwgaywga2MsIGhvcHRkZSlcbiAgICAgICAgc3dpdGNoIChzdGF0ZSkge1xuICAgICAgICAgIGNhc2UgU1RBVEUuU3RhcnQ6XG4gICAgICAgICAgICBhdG92ID0gZmFsc2VcbiAgICAgICAgICAgIC8vIElzIHhFbmQgcmVhY2hlZCBpbiB0aGUgbmV4dCBzdGVwP1xuICAgICAgICAgICAgaWYgKDAuMSAqIE1hdGguYWJzKHhFbmQgLSB4KSA8PSBNYXRoLmFicyh4KSAqIHRoaXMudVJvdW5kKSBicmVhayBsb29wXG4gICAgICAgICAgICBoID0gcG9zbmVnICogTWF0aC5taW4oTWF0aC5hYnMoaCksIE1hdGguYWJzKHhFbmQgLSB4KSwgaE1heCwgTWF0aC5hYnMoaG9wdGRlKSlcbiAgICAgICAgICAgIGlmICgoeCArIDEuMDEgKiBoIC0geEVuZCkgKiBwb3NuZWcgPiAwKSB7XG4gICAgICAgICAgICAgIGggPSB4RW5kIC0geFxuICAgICAgICAgICAgICBsYXN0ID0gdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG5TdGVwID09PSAwIHx8ICF0aGlzLmRlbnNlT3V0cHV0KSB7XG4gICAgICAgICAgICAgIEYoeCwgeSwgZHopXG4gICAgICAgICAgICAgICsrbkV2YWxcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFRoZSBmaXJzdCBhbmQgbGFzdCBzdGVwXG4gICAgICAgICAgICBpZiAoblN0ZXAgPT09IDAgfHwgbGFzdCkge1xuICAgICAgICAgICAgICBpUHQgPSAwXG4gICAgICAgICAgICAgICsrblN0ZXBcbiAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IDE7IGogPD0gazsgKytqKSB7XG4gICAgICAgICAgICAgICAga2MgPSBqXG4gICAgICAgICAgICAgICAgbWlkZXgoailcbiAgICAgICAgICAgICAgICBpZiAoYXRvdikgY29udGludWUgbG9vcFxuICAgICAgICAgICAgICAgIGlmIChqID4gMSAmJiBlcnIgPD0gMSkge1xuICAgICAgICAgICAgICAgICAgc3RhdGUgPSBTVEFURS5BY2NlcHRcbiAgICAgICAgICAgICAgICAgIGNvbnRpbnVlIGxvb3BcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgc3RhdGUgPSBTVEFURS5Ib3BlRm9yQ29udmVyZ2VuY2VcbiAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN0YXRlID0gU1RBVEUuQmFzaWNJbnRlZ3JhdGlvblN0ZXBcbiAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICBjYXNlIFNUQVRFLkJhc2ljSW50ZWdyYXRpb25TdGVwOlxuICAgICAgICAgICAgLy8gYmFzaWMgaW50ZWdyYXRpb24gc3RlcFxuICAgICAgICAgICAgaVB0ID0gMFxuICAgICAgICAgICAgKytuU3RlcFxuICAgICAgICAgICAgaWYgKG5TdGVwID49IHRoaXMubWF4U3RlcHMpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIE91dGNvbWUuTWF4U3RlcHNFeGNlZWRlZFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAga2MgPSBrIC0gMVxuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDE7IGogPD0ga2M7ICsraikge1xuICAgICAgICAgICAgICBtaWRleChqKVxuICAgICAgICAgICAgICBpZiAoYXRvdikge1xuICAgICAgICAgICAgICAgIHN0YXRlID0gU1RBVEUuU3RhcnRcbiAgICAgICAgICAgICAgICBjb250aW51ZSBsb29wXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGNvbnZlcmdlbmNlIG1vbml0b3JcbiAgICAgICAgICAgIGlmIChrID09PSAyIHx8IHJlamVjdCkge1xuICAgICAgICAgICAgICBzdGF0ZSA9IFNUQVRFLkNvbnZlcmdlbmNlU3RlcFxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgaWYgKGVyciA8PSAxKSB7XG4gICAgICAgICAgICAgICAgc3RhdGUgPSBTVEFURS5BY2NlcHRcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChlcnIgPiAoKG5qW2sgKyAxXSAqIG5qW2tdKSAvIDQpICoqIDIpIHtcbiAgICAgICAgICAgICAgICBzdGF0ZSA9IFNUQVRFLlJlamVjdFxuICAgICAgICAgICAgICB9IGVsc2Ugc3RhdGUgPSBTVEFURS5Db252ZXJnZW5jZVN0ZXBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICBjYXNlIFNUQVRFLkNvbnZlcmdlbmNlU3RlcDogIC8vIGxhYmVsIDUwXG4gICAgICAgICAgICBtaWRleChrKVxuICAgICAgICAgICAgaWYgKGF0b3YpIHtcbiAgICAgICAgICAgICAgc3RhdGUgPSBTVEFURS5TdGFydFxuICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAga2MgPSBrXG4gICAgICAgICAgICBpZiAoZXJyIDw9IDEpIHtcbiAgICAgICAgICAgICAgc3RhdGUgPSBTVEFURS5BY2NlcHRcbiAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN0YXRlID0gU1RBVEUuSG9wZUZvckNvbnZlcmdlbmNlXG4gICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgY2FzZSBTVEFURS5Ib3BlRm9yQ29udmVyZ2VuY2U6XG4gICAgICAgICAgICAvLyBob3BlIGZvciBjb252ZXJnZW5jZSBpbiBsaW5lIGsgKyAxXG4gICAgICAgICAgICBpZiAoZXJyID4gKG5qW2sgKyAxXSAvIDIpICoqIDIpIHtcbiAgICAgICAgICAgICAgc3RhdGUgPSBTVEFURS5SZWplY3RcbiAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGtjID0gayArIDFcbiAgICAgICAgICAgIG1pZGV4KGtjKVxuICAgICAgICAgICAgaWYgKGF0b3YpIHN0YXRlID0gU1RBVEUuU3RhcnRcbiAgICAgICAgICAgIGVsc2UgaWYgKGVyciA+IDEpIHN0YXRlID0gU1RBVEUuUmVqZWN0XG4gICAgICAgICAgICBlbHNlIHN0YXRlID0gU1RBVEUuQWNjZXB0XG4gICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgY2FzZSBTVEFURS5BY2NlcHQ6XG4gICAgICAgICAgICBpZiAoIWFjY2VwdFN0ZXAodGhpcy5uKSkgcmV0dXJuIE91dGNvbWUuRWFybHlSZXR1cm5cbiAgICAgICAgICAgIHN0YXRlID0gU1RBVEUuU3RhcnRcbiAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICBjYXNlIFNUQVRFLlJlamVjdDpcbiAgICAgICAgICAgIGsgPSBNYXRoLm1pbihrLCBrYywga20gLSAxKVxuICAgICAgICAgICAgaWYgKGsgPiAyICYmIHdbayAtIDFdIDwgd1trXSAqIHRoaXMuc3RlcFNpemVGYWMzKSBrIC09IDFcbiAgICAgICAgICAgICsrblJlamVjdFxuICAgICAgICAgICAgaCA9IHBvc25lZyAqIGhoW2tdXG4gICAgICAgICAgICByZWplY3QgPSB0cnVlXG4gICAgICAgICAgICBzdGF0ZSA9IFNUQVRFLkJhc2ljSW50ZWdyYXRpb25TdGVwXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBPdXRjb21lLkNvbnZlcmdlZFxuICAgIH1cblxuICAgIGNvbnN0IG91dGNvbWUgPSBvZHhjb3IoKVxuICAgIHJldHVybiB7XG4gICAgICB5OiB5LnNsaWNlKDEpLFxuICAgICAgb3V0Y29tZTogb3V0Y29tZSxcbiAgICAgIG5TdGVwOiBuU3RlcCxcbiAgICAgIHhFbmQ6IHhFbmQsXG4gICAgICBuQWNjZXB0OiBuQWNjZXB0LFxuICAgICAgblJlamVjdDogblJlamVjdCxcbiAgICAgIG5FdmFsOiBuRXZhbFxuICAgIH1cbiAgfVxufVxuIiwiLyoqXG4gICogQ3JlYXRlZCBieSBjb2xpbiBvbiA2LzE0LzE2LlxuICAqIGh0dHA6Ly9saXR0bGVyZWRjb21wdXRlci5naXRodWIuaW9cbiAgKi9cblxuaW1wb3J0IHtTb2x2ZXIsIERlcml2YXRpdmV9IGZyb20gJ29kZXgvc3JjL29kZXgnXG5cbmludGVyZmFjZSBIYW1pbHRvbk1hcCB7XG4gIGdlbmVyYXRlU2VjdGlvbihpbml0aWFsRGF0YTogbnVtYmVyW10sIG46IG51bWJlciwgY2FsbGJhY2s6ICh4OiBudW1iZXIsIHk6IG51bWJlcikgPT4gdm9pZCk6IHZvaWRcbn1cblxuaW50ZXJmYWNlIERpZmZlcmVudGlhbEVxdWF0aW9uIHtcbiAgZXZvbHZlKHBhcmFtczoge30sIGluaXRpYWxEYXRhOiBudW1iZXJbXSwgdDE6IG51bWJlciwgZHQ6IG51bWJlciwgY2FsbGJhY2s6ICh0OiBudW1iZXIsIHk6IG51bWJlcltdKSA9PiB2b2lkKTogdm9pZFxufVxuXG5jb25zdCB0d29QaSA9IE1hdGguUEkgKiAyXG5cbmV4cG9ydCBjbGFzcyBTdGFuZGFyZE1hcCBpbXBsZW1lbnRzIEhhbWlsdG9uTWFwIHtcbiAgSzogbnVtYmVyXG4gIFBWOiAoeDogbnVtYmVyKSA9PiBudW1iZXJcbiAgc3RhdGljIHR3b1BpID0gMiAqIE1hdGguUElcblxuICBjb25zdHJ1Y3RvcihLOiBudW1iZXIpIHtcbiAgICB0aGlzLksgPSBLXG4gICAgdGhpcy5QViA9IFN0YW5kYXJkTWFwLnByaW5jaXBhbF92YWx1ZSh0d29QaSlcbiAgfVxuXG4gIHN0YXRpYyBwcmluY2lwYWxfdmFsdWUoY3V0SGlnaDogbnVtYmVyKTogKHY6IG51bWJlcikgPT4gbnVtYmVyIHtcbiAgICBjb25zdCBjdXRMb3cgPSBjdXRIaWdoIC0gdHdvUGlcbiAgICByZXR1cm4gZnVuY3Rpb24gKHg6IG51bWJlcikge1xuICAgICAgaWYgKGN1dExvdyA8PSB4ICYmIHggPCBjdXRIaWdoKSB7XG4gICAgICAgIHJldHVybiB4XG4gICAgICB9XG4gICAgICBjb25zdCB5ID0geCAtIHR3b1BpICogTWF0aC5mbG9vcih4IC8gdHdvUGkpXG4gICAgICByZXR1cm4geSA8IGN1dEhpZ2ggPyB5IDogeSAtIHR3b1BpXG4gICAgfVxuICB9XG5cbiAgZ2VuZXJhdGVTZWN0aW9uKGluaXRpYWxEYXRhOiBudW1iZXJbXSwgbjogbnVtYmVyLCBjYWxsYmFjazogKHg6IG51bWJlciwgeTogbnVtYmVyKSA9PiB2b2lkKSB7XG4gICAgbGV0IFt0aGV0YSwgSV0gPSBpbml0aWFsRGF0YVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICBjYWxsYmFjayh0aGV0YSwgSSlcbiAgICAgIGxldCBuSSA9IEkgKyAodGhpcy5LICogTWF0aC5zaW4odGhldGEpKVxuICAgICAgdGhldGEgPSB0aGlzLlBWKHRoZXRhICsgbkkpXG4gICAgICBJID0gdGhpcy5QVihuSSlcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIERyaXZlblBlbmR1bHVtTWFwIGltcGxlbWVudHMgSGFtaWx0b25NYXAsIERpZmZlcmVudGlhbEVxdWF0aW9uIHtcblxuICBwYXJhbWZuOiAoKSA9PiB7YTogbnVtYmVyLCBvbWVnYTogbnVtYmVyfVxuICBTOiBTb2x2ZXJcbiAgUFY6ICh4OiBudW1iZXIpID0+IG51bWJlclxuXG4gIEhhbWlsdG9uU3lzZGVyKG06IG51bWJlciwgbDogbnVtYmVyLCBvbWVnYTogbnVtYmVyLCBhOiBudW1iZXIsIGc6IG51bWJlcik6IERlcml2YXRpdmUge1xuICAgIHJldHVybiAoeCwgW3QsIHRoZXRhLCBwX3RoZXRhXSkgPT4ge1xuICAgICAgIGxldCBfMDAwMiA9IE1hdGgucG93KGwsIDIpXG4gICAgICAgbGV0IF8wMDAzID0gb21lZ2EgKiB0XG4gICAgICAgbGV0IF8wMDA0ID0gTWF0aC5zaW4odGhldGEpXG4gICAgICAgbGV0IF8wMDA1ID0gTWF0aC5jb3ModGhldGEpXG4gICAgICAgbGV0IF8wMDA2ID0gTWF0aC5zaW4oXzAwMDMpXG4gICAgICAgcmV0dXJuIFsxLCAoYSAqIGwgKiBtICogb21lZ2EgKiBfMDAwNiAqIF8wMDA0ICsgcF90aGV0YSkgLyAoXzAwMDIgKiBtKSwgKC0gTWF0aC5wb3coYSwgMikgKiBsICogbSAqIE1hdGgucG93KG9tZWdhLCAyKSAqIE1hdGgucG93KF8wMDA2LCAyKSAqIF8wMDA1ICogXzAwMDQgLSBhICogb21lZ2EgKiBwX3RoZXRhICogXzAwMDYgKiBfMDAwNSAtIGcgKiBfMDAwMiAqIG0gKiBfMDAwNCkgLyBsXVxuICAgIH1cbiAgfVxuXG4gIExhZ3JhbmdlU3lzZGVyKGw6IG51bWJlciwgb21lZ2E6IG51bWJlciwgYTogbnVtYmVyLCBnOiBudW1iZXIpOiBEZXJpdmF0aXZlIHtcbiAgICByZXR1cm4gKHgsIFt0LCB0aGV0YSwgdGhldGFkb3RdKSA9PiB7XG4gICAgICBsZXQgXzAwMDEgPSBNYXRoLnNpbih0aGV0YSlcbiAgICAgIHJldHVybiBbMSwgdGhldGFkb3QsIChhICogTWF0aC5wb3cob21lZ2EsIDIpICogXzAwMDEgKiBNYXRoLmNvcyhvbWVnYSAqIHQpIC0gZyAqIF8wMDAxKSAvIGxdXG4gICAgfVxuICB9XG5cbiAgY29uc3RydWN0b3IocGFyYW1mbjogKCkgPT4ge2E6IG51bWJlciwgb21lZ2E6IG51bWJlcn0pIHtcbiAgICB0aGlzLnBhcmFtZm4gPSBwYXJhbWZuXG4gICAgdGhpcy5TID0gbmV3IFNvbHZlcigzKVxuICAgIHRoaXMuUy5kZW5zZU91dHB1dCA9IHRydWVcbiAgICB0aGlzLlMuYWJzb2x1dGVUb2xlcmFuY2UgPSAxZS04XG4gICAgdGhpcy5QViA9IFN0YW5kYXJkTWFwLnByaW5jaXBhbF92YWx1ZShNYXRoLlBJKVxuICB9XG5cbiAgZ2VuZXJhdGVTZWN0aW9uKGluaXRpYWxEYXRhOiBudW1iZXJbXSwgbjogbnVtYmVyLCBjYWxsYmFjazogKHg6IG51bWJlciwgeTogbnVtYmVyKSA9PiB2b2lkKSB7XG4gICAgbGV0IHBhcmFtcyA9IHRoaXMucGFyYW1mbigpXG4gICAgbGV0IHBlcmlvZCA9IDIgKiBNYXRoLlBJIC8gcGFyYW1zLm9tZWdhXG4gICAgbGV0IHQxID0gMTAwMCAqIHBlcmlvZFxuICAgIGxldCBIID0gdGhpcy5IYW1pbHRvblN5c2RlcigxLCAxLCBwYXJhbXMub21lZ2EsIHBhcmFtcy5hLCA5LjgpXG4gICAgdGhpcy5TLnNvbHZlKEgsIDAsIFswXS5jb25jYXQoaW5pdGlhbERhdGEpLCB0MSwgdGhpcy5TLmdyaWQocGVyaW9kLCAodCwgeXMpID0+IGNhbGxiYWNrKHRoaXMuUFYoeXNbMV0pLCB5c1syXSkpKVxuICB9XG5cbiAgZXZvbHZlKHBhcmFtczoge29tZWdhOiBudW1iZXIsIGE6IG51bWJlcn0sIGluaXRpYWxEYXRhOiBudW1iZXJbXSwgdDE6IG51bWJlciwgZHQ6IG51bWJlciwgY2FsbGJhY2s6ICh4OiBudW1iZXIsIHlzOiBudW1iZXJbXSkgPT4gdm9pZCkge1xuICAgIGxldCBMID0gdGhpcy5MYWdyYW5nZVN5c2RlcigxLCBwYXJhbXMub21lZ2EsIHBhcmFtcy5hLCA5LjgpXG4gICAgbGV0IHAwID0gcGVyZm9ybWFuY2Uubm93KClcbiAgICB0aGlzLlMuc29sdmUoTCwgMCwgWzBdLmNvbmNhdChpbml0aWFsRGF0YSksIHQxLCB0aGlzLlMuZ3JpZChkdCwgY2FsbGJhY2spKVxuICAgIGNvbnNvbGUubG9nKCdldm9sdXRpb24gdG9vaycsIChwZXJmb3JtYW5jZS5ub3coKSAtIHAwKS50b0ZpeGVkKDIpLCAnbXNlYycpXG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEV4cGxvcmVNYXAge1xuICBjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50XG4gIE06IEhhbWlsdG9uTWFwXG4gIGNvbnRleHQ6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRFxuICBvbkV4cGxvcmU6ICh4OiBudW1iZXIsIHk6IG51bWJlcikgPT4gdm9pZFxuXG4gIGNvbnN0cnVjdG9yKGNhbnZhczogc3RyaW5nLCBNOiBIYW1pbHRvbk1hcCwgeFJhbmdlOiBudW1iZXJbXSwgeVJhbmdlOiBudW1iZXJbXSkge1xuICAgIHRoaXMuY2FudmFzID0gPEhUTUxDYW52YXNFbGVtZW50PiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChjYW52YXMpXG4gICAgdGhpcy5NID0gTVxuICAgIHRoaXMuY29udGV4dCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJylcbiAgICBsZXQgW3csIGhdID0gW3hSYW5nZVsxXSAtIHhSYW5nZVswXSwgeVJhbmdlWzFdIC0geVJhbmdlWzBdXVxuICAgIHRoaXMuY2FudmFzLm9ubW91c2Vkb3duID0gKGU6IE1vdXNlRXZlbnQpID0+IHtcbiAgICAgIGxldCBbY3gsIGN5XSA9IFtlLm9mZnNldFggLyB0aGlzLmNvbnRleHQuY2FudmFzLndpZHRoICogdyArIHhSYW5nZVswXSxcbiAgICAgICAgeVJhbmdlWzFdIC0gZS5vZmZzZXRZIC8gdGhpcy5jb250ZXh0LmNhbnZhcy5oZWlnaHQgKiBoXVxuICAgICAgbGV0IHAwID0gcGVyZm9ybWFuY2Uubm93KClcbiAgICAgIHRoaXMuRXhwbG9yZShjeCwgY3kpXG4gICAgICBjb25zb2xlLmxvZygnZXhwbG9yYXRpb24nLCAocGVyZm9ybWFuY2Uubm93KCkgLSBwMCkudG9GaXhlZCgyKSwgJ21zZWMnKVxuICAgICAgdGhpcy5vbkV4cGxvcmUgJiYgdGhpcy5vbkV4cGxvcmUoY3gsIGN5KVxuICAgIH1cbiAgICB0aGlzLmNvbnRleHQuc2NhbGUodGhpcy5jb250ZXh0LmNhbnZhcy53aWR0aCAvIHcsIC10aGlzLmNvbnRleHQuY2FudmFzLmhlaWdodCAvIGgpXG4gICAgdGhpcy5jb250ZXh0LnRyYW5zbGF0ZSgteFJhbmdlWzBdLCAteVJhbmdlWzFdKVxuICAgIHRoaXMuY29udGV4dC5maWxsU3R5bGUgPSAncmdiYSgyMyw2NCwxNzAsMC41KSdcbiAgfVxuICBpOiBudW1iZXIgPSAwXG5cbiAgLy8gc2luY2UgcHQgaXMgaW52b2tlZCBpbiBjYWxsYmFjayBwb3NpdGlvbiwgd2Ugd2FudCB0byBkZWZpbmUgaXQgYXMgYW4gaW5zdGFuY2UgYXJyb3cgZnVuY3Rpb25cbiAgcHQgPSAoeDogbnVtYmVyLCB5OiBudW1iZXIpID0+IHtcbiAgICB0aGlzLmNvbnRleHQuYmVnaW5QYXRoKClcbiAgICB0aGlzLmNvbnRleHQuYXJjKHgsIHksIDAuMDEsIDAsIDIgKiBNYXRoLlBJKVxuICAgIHRoaXMuY29udGV4dC5maWxsKClcbiAgICB0aGlzLmNvbnRleHQuY2xvc2VQYXRoKClcbiAgICArK3RoaXMuaVxuICB9XG5cbiAgRXhwbG9yZSh4OiBudW1iZXIsIHk6IG51bWJlcikge1xuICAgIHRoaXMuTS5nZW5lcmF0ZVNlY3Rpb24oW3gsIHldLCAxMDAwLCB0aGlzLnB0KVxuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBEcml2ZW5QZW5kdWx1bUFuaW1hdGlvbiB7XG4gIGFtcGxpdHVkZSA9IDAuMVxuICBhbmltTG9naWNhbFNpemUgPSAxLjNcbiAgY3R4OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkRcbiAgaW5pdGlhbERhdGE6IG51bWJlcltdXG4gIGRhdGE6IG51bWJlcltdW11cbiAgZnJhbWVJbmRleDogbnVtYmVyXG4gIGZyYW1lU3RhcnQ6IG51bWJlclxuICBvbWVnYTogbnVtYmVyXG4gIGFuaW1hdGluZzogYm9vbGVhblxuXG4gIGNvbnN0cnVjdG9yKG86IHtcbiAgICBvbWVnYVZhbHVlSWQ6IHN0cmluZ1xuICAgIG9tZWdhUmFuZ2VJZDogc3RyaW5nXG4gICAgdFZhbHVlSWQ6IHN0cmluZ1xuICAgIHRSYW5nZUlkOiBzdHJpbmdcbiAgICBhbmltSWQ6IHN0cmluZ1xuICAgIGV4cGxvcmVJZDogc3RyaW5nXG4gICAgdGhldGEwSWQ6IHN0cmluZ1xuICAgIHRoZXRhRG90MElkOiBzdHJpbmdcbiAgICBnb0J1dHRvbklkOiBzdHJpbmdcbiAgfSkge1xuICAgIGxldCBvbWVnYVJhbmdlID0gPEhUTUxJbnB1dEVsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoby5vbWVnYVJhbmdlSWQpXG4gICAgbGV0IG9tZWdhUmFkU2VjID0gKCkgPT4gK29tZWdhUmFuZ2UudmFsdWUgKiAyICogTWF0aC5QSVxuICAgIGxldCB0UmFuZ2UgPSA8SFRNTElucHV0RWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChvLnRSYW5nZUlkKVxuICAgIGxldCBkaWZmRXEgPSBuZXcgRHJpdmVuUGVuZHVsdW1NYXAoKCkgPT4gKHtvbWVnYTogb21lZ2FSYWRTZWMoKSwgYTogdGhpcy5hbXBsaXR1ZGV9KSlcbiAgICBsZXQgYW5pbSA9IDxIVE1MQ2FudmFzRWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChvLmFuaW1JZClcbiAgICB0aGlzLmN0eCA9IGFuaW0uZ2V0Q29udGV4dCgnMmQnKVxuICAgIHRoaXMuY3R4LnNjYWxlKGFuaW0ud2lkdGggLyAoMiAqIHRoaXMuYW5pbUxvZ2ljYWxTaXplKSwgLWFuaW0uaGVpZ2h0IC8gKDIgKiB0aGlzLmFuaW1Mb2dpY2FsU2l6ZSkpXG4gICAgdGhpcy5jdHgudHJhbnNsYXRlKHRoaXMuYW5pbUxvZ2ljYWxTaXplLCAtdGhpcy5hbmltTG9naWNhbFNpemUpXG4gICAgbGV0IHhNYXAgPSBuZXcgRXhwbG9yZU1hcCgncCcsIGRpZmZFcSwgWy1NYXRoLlBJLCBNYXRoLlBJXSwgWy0xMCwgMTBdKVxuICAgIGxldCBnb0J1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG8uZ29CdXR0b25JZClcbiAgICB4TWFwLm9uRXhwbG9yZSA9ICh0aGV0YTA6IG51bWJlciwgdGhldGFEb3QwOiBudW1iZXIpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKCdvbkV4cGxvcmUnLCB0aGV0YTAsIHRoZXRhRG90MClcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG8udGhldGEwSWQpLnRleHRDb250ZW50ID0gdGhldGEwLnRvRml4ZWQoMylcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG8udGhldGFEb3QwSWQpLnRleHRDb250ZW50ID0gdGhldGFEb3QwLnRvRml4ZWQoMylcbiAgICAgIHRoaXMuaW5pdGlhbERhdGEgPSBbdGhldGEwLCB0aGV0YURvdDBdXG4gICAgICBnb0J1dHRvbi5yZW1vdmVBdHRyaWJ1dGUoJ2Rpc2FibGVkJylcbiAgICB9XG4gICAgbGV0IGV4cGxvcmUgPSA8SFRNTENhbnZhc0VsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoby5leHBsb3JlSWQpXG4gICAgb21lZ2FSYW5nZS5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoZTogRXZlbnQpID0+IHtcbiAgICAgIGV4cGxvcmUuZ2V0Q29udGV4dCgnMmQnKS5jbGVhclJlY3QoLU1hdGguUEksIC0xMCwgMiAqIE1hdGguUEksIDIwKVxuICAgICAgbGV0IHQgPSA8SFRNTElucHV0RWxlbWVudD5lLnRhcmdldFxuICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoby5vbWVnYVZhbHVlSWQpLnRleHRDb250ZW50ID0gKCt0LnZhbHVlKS50b0ZpeGVkKDEpXG4gICAgfSlcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChvLm9tZWdhVmFsdWVJZCkudGV4dENvbnRlbnQgPSBvbWVnYVJhbmdlLnZhbHVlXG4gICAgdFJhbmdlLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIChlOiBFdmVudCkgPT4ge1xuICAgICAgbGV0IHQgPSA8SFRNTElucHV0RWxlbWVudD5lLnRhcmdldFxuICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoby50VmFsdWVJZCkudGV4dENvbnRlbnQgPSB0LnZhbHVlXG4gICAgfSlcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChvLnRWYWx1ZUlkKS50ZXh0Q29udGVudCA9IHRSYW5nZS52YWx1ZVxuICAgIGdvQnV0dG9uLnNldEF0dHJpYnV0ZSgnZGlzYWJsZWQnLCAnZGlzYWJsZWQnKVxuICAgIGdvQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgLy8gKHJlKXNvbHZlIHRoZSBkaWZmZXJlbnRpYWwgZXF1YXRpb24gYW5kIHVwZGF0ZSB0aGUgZGF0YS4gS2ljayBvZmYgdGhlIGFuaW1hdGlvbi5cbiAgICAgIGxldCBkdCA9IDEgLyA2MFxuICAgICAgbGV0IHQxID0gK3RSYW5nZS52YWx1ZVxuICAgICAgbGV0IG4gPSBNYXRoLmNlaWwodDEgLyBkdClcbiAgICAgIHRoaXMuZGF0YSA9IG5ldyBBcnJheShuKVxuICAgICAgbGV0IGkgPSAwXG4gICAgICB0aGlzLm9tZWdhID0gb21lZ2FSYWRTZWMoKVxuICAgICAgbGV0IHAwID0gcGVyZm9ybWFuY2Uubm93KClcbiAgICAgIGRpZmZFcS5ldm9sdmUoe29tZWdhOiB0aGlzLm9tZWdhLCBhOiB0aGlzLmFtcGxpdHVkZX0sIHRoaXMuaW5pdGlhbERhdGEsIHQxLCBkdCwgKHgsIHlzKSA9PiB7dGhpcy5kYXRhW2krK10gPSB5c30pXG4gICAgICBjb25zb2xlLmxvZygnREUgZXZvbHV0aW9uIGluJywgKHBlcmZvcm1hbmNlLm5vdygpIC0gcDApLnRvRml4ZWQoMSksICdtc2VjJylcbiAgICAgIHRoaXMuZnJhbWVJbmRleCA9IDBcbiAgICAgIHRoaXMuZnJhbWVTdGFydCA9IHBlcmZvcm1hbmNlLm5vdygpXG4gICAgICBpZiAoIXRoaXMuYW5pbWF0aW5nKSB7XG4gICAgICAgIHRoaXMuYW5pbWF0aW5nID0gdHJ1ZVxuICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy5mcmFtZSlcbiAgICAgIH1cbiAgICB9KVxuICB9XG4gIHRpbWVzdHJpbmcgPSAodDogbnVtYmVyKSA9PiB7XG4gICAgbGV0IHMgPSB0LnRvRml4ZWQoMilcbiAgICBpZiAocy5tYXRjaCgvXFwuWzAtOV0kLykpIHtcbiAgICAgIHMgKz0gJzAnXG4gICAgfVxuICAgIHJldHVybiAndDogJyArIHMgKyAnIHMnXG4gIH1cblxuICBmcmFtZSA9ICgpID0+IHtcbiAgICBsZXQgYm9iID0gKHQ6IG51bWJlcikgPT4gdGhpcy5hbXBsaXR1ZGUgKiBNYXRoLmNvcyh0aGlzLm9tZWdhICogdClcbiAgICB0aGlzLmN0eC5jbGVhclJlY3QoLXRoaXMuYW5pbUxvZ2ljYWxTaXplLCAtdGhpcy5hbmltTG9naWNhbFNpemUsIDIgKiB0aGlzLmFuaW1Mb2dpY2FsU2l6ZSwgMiAqIHRoaXMuYW5pbUxvZ2ljYWxTaXplKVxuICAgIGxldCBkID0gdGhpcy5kYXRhW3RoaXMuZnJhbWVJbmRleF1cbiAgICBsZXQgeTAgPSBib2IoZFswXSlcbiAgICBsZXQgdGhldGEgPSBkWzFdXG4gICAgY29uc3QgYyA9IHRoaXMuY3R4XG4gICAgYy5saW5lV2lkdGggPSAwLjAyXG4gICAgYy5maWxsU3R5bGUgPSAnIzAwMCdcbiAgICBjLmJlZ2luUGF0aCgpXG4gICAgYy5tb3ZlVG8oMCwgeTApXG4gICAgYy5saW5lVG8oTWF0aC5zaW4odGhldGEpLCB5MCAtIE1hdGguY29zKHRoZXRhKSlcbiAgICBjLnN0cm9rZSgpXG4gICAgYy5iZWdpblBhdGgoKVxuICAgIGMuZmlsbFN0eWxlID0gJyMwMDAnXG4gICAgYy5hcmMoMCwgeTAsIDAuMDUsIDAsIE1hdGguUEkgKiAyKVxuICAgIGMuZmlsbFN0eWxlID0gJyNmMDAnXG4gICAgYy5hcmMoTWF0aC5zaW4odGhldGEpLCB5MCAtIE1hdGguY29zKHRoZXRhKSwgMC4xLCAwLCBNYXRoLlBJICogMilcbiAgICBjLmZpbGwoKVxuICAgIGMuc2F2ZSgpXG4gICAgYy5zY2FsZSgwLjAxLCAtMC4wMSlcbiAgICBjLmZvbnQgPSAnMTBwdCBzYW5zLXNlcmlmJ1xuICAgIGMuZmlsbFN0eWxlID0gJyNiYmInXG4gICAgYy5maWxsVGV4dCh0aGlzLnRpbWVzdHJpbmcoZFswXSksIC0xMTUsIDExNSlcbiAgICBjLnJlc3RvcmUoKVxuXG4gICAgKyt0aGlzLmZyYW1lSW5kZXhcbiAgICBpZiAodGhpcy5mcmFtZUluZGV4IDwgdGhpcy5kYXRhLmxlbmd0aCkge1xuICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLmZyYW1lKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmFuaW1hdGluZyA9IGZhbHNlXG4gICAgICBsZXQgZXQgPSAocGVyZm9ybWFuY2Uubm93KCkgLSB0aGlzLmZyYW1lU3RhcnQpIC8gMWUzXG4gICAgICBjb25zb2xlLmxvZygnYW5pbWF0aW9uIGRvbmUnLCAodGhpcy5kYXRhLmxlbmd0aCAvIGV0KS50b0ZpeGVkKDIpLCAnZnBzJylcbiAgICB9XG4gIH1cbn1cblxuaW50ZXJmYWNlIERvdWJsZVBhcmFtcyB7XG4gIGwxOiBudW1iZXJcbiAgbTE6IG51bWJlclxuICBsMjogbnVtYmVyXG4gIG0yOiBudW1iZXJcbn1cblxuY2xhc3MgRG91YmxlUGVuZHVsdW1NYXAgaW1wbGVtZW50cyBEaWZmZXJlbnRpYWxFcXVhdGlvbiB7XG4gIFM6IFNvbHZlclxuXG4gIExhZ3JhbmdlU3lzZGVyKGwxOiBudW1iZXIsIG0xOiBudW1iZXIsIGwyOiBudW1iZXIsIG0yOiBudW1iZXIpOiBEZXJpdmF0aXZlIHtcbiAgICBjb25zdCBnID0gOS44XG4gICAgcmV0dXJuICh4LCBbdCwgdGhldGEsIHBoaSwgdGhldGFkb3QsIHBoaWRvdF0pID0+IHtcbiAgICAgIGxldCBfMDAwMiA9IE1hdGgucG93KHBoaWRvdCwgMilcbiAgICAgIGxldCBfMDAwMyA9IE1hdGguc2luKHBoaSlcbiAgICAgIGxldCBfMDAwNSA9IC0gcGhpXG4gICAgICBsZXQgXzAwMDcgPSBNYXRoLnNpbih0aGV0YSlcbiAgICAgIGxldCBfMDAwOCA9IE1hdGgucG93KHRoZXRhZG90LCAyKVxuICAgICAgbGV0IF8wMDBiID0gXzAwMDUgKyB0aGV0YVxuICAgICAgbGV0IF8wMDBlID0gTWF0aC5jb3MoXzAwMGIpXG4gICAgICBsZXQgXzAwMGYgPSBNYXRoLnNpbihfMDAwYilcbiAgICAgIGxldCBfMDAxMSA9IE1hdGgucG93KF8wMDBmLCAyKVxuICAgICAgcmV0dXJuIFsxLCB0aGV0YWRvdCwgcGhpZG90LCAoLSBsMSAqIG0yICogXzAwMDggKiBfMDAwZiAqIF8wMDBlIC0gbDIgKiBtMiAqIF8wMDAyICogXzAwMGYgKyBnICogbTIgKiBfMDAwZSAqIF8wMDAzIC0gZyAqIG0xICogXzAwMDcgLSBnICogbTIgKiBfMDAwNykgLyAobDEgKiBtMiAqIF8wMDExICsgbDEgKiBtMSksIChsMiAqIG0yICogXzAwMDIgKiBfMDAwZiAqIF8wMDBlICsgbDEgKiBtMSAqIF8wMDA4ICogXzAwMGYgKyBsMSAqIG0yICogXzAwMDggKiBfMDAwZiArIGcgKiBtMSAqIF8wMDA3ICogXzAwMGUgKyBnICogbTIgKiBfMDAwNyAqIF8wMDBlIC0gZyAqIG0xICogXzAwMDMgLSBnICogbTIgKiBfMDAwMykgLyAobDIgKiBtMiAqIF8wMDExICsgbDIgKiBtMSldXG4gICAgfVxuICB9XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5TID0gbmV3IFNvbHZlcig1KSAgLy8gdCwgdGhldGEsIHBoaSwgdGhldGFkb3QsIHBoaWRvdFxuICAgIHRoaXMuUy5kZW5zZU91dHB1dCA9IHRydWVcbiAgICB0aGlzLlMuYWJzb2x1dGVUb2xlcmFuY2UgPSAxZS04XG4gIH1cblxuICBldm9sdmUocDogRG91YmxlUGFyYW1zLCBpbml0aWFsRGF0YTogbnVtYmVyW10sIHQxOiBudW1iZXIsIGR0OiBudW1iZXIsIGNhbGxiYWNrOiAodDogbnVtYmVyLCB5OiBudW1iZXJbXSkgPT4gdm9pZCk6IHZvaWQge1xuICAgIHRoaXMuUy5zb2x2ZSh0aGlzLkxhZ3JhbmdlU3lzZGVyKHAubDEsIHAubTEsIHAubDIsIHAubTIpLCAwLCBbMF0uY29uY2F0KGluaXRpYWxEYXRhKSwgdDEsIHRoaXMuUy5ncmlkKGR0LCBjYWxsYmFjaykpXG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIERvdWJsZVBlbmR1bHVtQW5pbWF0aW9uIHtcbiAgYW5pbUxvZ2ljYWxTaXplID0gMS4zXG4gIGN0eDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEXG4gIGRhdGE6IG51bWJlcltdW11cbiAgZnJhbWVTdGFydDogbnVtYmVyXG4gIGZyYW1lSW5kZXg6IG51bWJlclxuICBhbmltYXRpbmc6IGJvb2xlYW5cbiAgcGFyYW1zOiBEb3VibGVQYXJhbXNcbiAgdmFsdWVVcGRhdGVyKHRvSWQ6IHN0cmluZykge1xuICAgIHJldHVybiAoZTogRXZlbnQpID0+IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRvSWQpLnRleHRDb250ZW50ID0gKDxIVE1MSW5wdXRFbGVtZW50PmUudGFyZ2V0KS52YWx1ZVxuICB9XG5cbiAgY29uc3RydWN0b3Iobzoge1xuICAgIHRoZXRhMFJhbmdlSWQ6IHN0cmluZyxcbiAgICB0aGV0YTBWYWx1ZUlkOiBzdHJpbmcsXG4gICAgcGhpMFJhbmdlSWQ6IHN0cmluZyxcbiAgICBwaGkwVmFsdWVJZDogc3RyaW5nLFxuICAgIHRSYW5nZUlkOiBzdHJpbmcsXG4gICAgdFZhbHVlSWQ6IHN0cmluZyxcbiAgICBtUmFuZ2VJZDogc3RyaW5nLFxuICAgIG1WYWx1ZUlkOiBzdHJpbmcsXG4gICAgbFJhbmdlSWQ6IHN0cmluZyxcbiAgICBsVmFsdWVJZDogc3RyaW5nLFxuICAgIGFuaW1JZDogc3RyaW5nLFxuICAgIGdvQnV0dG9uSWQ6IHN0cmluZ1xuICB9KSB7XG4gICAgdGhpcy5hbmltYXRpbmcgPSBmYWxzZVxuICAgIGxldCBkZWcycmFkID0gKGQ6IG51bWJlcikgPT4gZCAqIDIgKiBNYXRoLlBJIC8gMzYwXG4gICAgbGV0IHRoZXRhMFJhbmdlID0gPEhUTUxJbnB1dEVsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoby50aGV0YTBSYW5nZUlkKVxuICAgIHRoZXRhMFJhbmdlLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIHRoaXMudmFsdWVVcGRhdGVyKG8udGhldGEwVmFsdWVJZCkpXG4gICAgbGV0IHBoaTBSYW5nZSA9IDxIVE1MSW5wdXRFbGVtZW50PmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG8ucGhpMFJhbmdlSWQpXG4gICAgcGhpMFJhbmdlLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIHRoaXMudmFsdWVVcGRhdGVyKG8ucGhpMFZhbHVlSWQpKVxuICAgIGxldCB0UmFuZ2UgPSA8SFRNTElucHV0RWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChvLnRSYW5nZUlkKVxuICAgIHRSYW5nZS5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCB0aGlzLnZhbHVlVXBkYXRlcihvLnRWYWx1ZUlkKSlcbiAgICBsZXQgbVJhbmdlID0gPEhUTUxJbnB1dEVsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoby5tUmFuZ2VJZClcbiAgICBtUmFuZ2UuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgdGhpcy52YWx1ZVVwZGF0ZXIoby5tVmFsdWVJZCkpXG4gICAgbGV0IGxSYW5nZSA9IDxIVE1MSW5wdXRFbGVtZW50PmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG8ubFJhbmdlSWQpXG4gICAgbFJhbmdlLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIHRoaXMudmFsdWVVcGRhdGVyKG8ubFZhbHVlSWQpKVxuICAgIGxldCBhbmltID0gPEhUTUxDYW52YXNFbGVtZW50PmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG8uYW5pbUlkKVxuICAgIHRoaXMuY3R4ID0gYW5pbS5nZXRDb250ZXh0KCcyZCcpXG4gICAgdGhpcy5jdHguc2NhbGUoYW5pbS53aWR0aCAvICgyICogdGhpcy5hbmltTG9naWNhbFNpemUpLCAtYW5pbS5oZWlnaHQgLyAoMiAqIHRoaXMuYW5pbUxvZ2ljYWxTaXplKSlcbiAgICB0aGlzLmN0eC50cmFuc2xhdGUodGhpcy5hbmltTG9naWNhbFNpemUsIC10aGlzLmFuaW1Mb2dpY2FsU2l6ZSlcbiAgICBsZXQgZGlmZkVxID0gbmV3IERvdWJsZVBlbmR1bHVtTWFwKClcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChvLmdvQnV0dG9uSWQpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gIHtcbiAgICAgIGxldCBkdCA9IDEgLyA2MFxuICAgICAgbGV0IHQxID0gK3RSYW5nZS52YWx1ZVxuICAgICAgbGV0IG4gPSBNYXRoLmNlaWwodDEgLyBkdClcbiAgICAgIHRoaXMuZGF0YSA9IG5ldyBBcnJheShuKVxuICAgICAgbGV0IGkgPSAwXG4gICAgICBsZXQgcDAgPSBwZXJmb3JtYW5jZS5ub3coKVxuICAgICAgdGhpcy5wYXJhbXMgPSB7XG4gICAgICAgIGwxOiArbFJhbmdlLnZhbHVlLFxuICAgICAgICBtMTogK21SYW5nZS52YWx1ZSxcbiAgICAgICAgbDI6IDEgLSBOdW1iZXIobFJhbmdlLnZhbHVlKSxcbiAgICAgICAgbTI6IDEgLSBOdW1iZXIobVJhbmdlLnZhbHVlKVxuICAgICAgfVxuICAgICAgZGlmZkVxLmV2b2x2ZSh0aGlzLnBhcmFtcywgW2RlZzJyYWQoK3RoZXRhMFJhbmdlLnZhbHVlKSwgZGVnMnJhZCgrcGhpMFJhbmdlLnZhbHVlKSwgMCwgMF0sIHQxLCBkdCwgKHgsIHlzKSA9PiB7dGhpcy5kYXRhW2krK10gPSB5c30pXG4gICAgICBjb25zb2xlLmxvZygnZXZvbHV0aW9uIGluJywgKHBlcmZvcm1hbmNlLm5vdygpIC0gcDApLnRvRml4ZWQoMiksICdtc2VjICcpXG4gICAgICB0aGlzLmZyYW1lSW5kZXggPSAwXG4gICAgICB0aGlzLmZyYW1lU3RhcnQgPSBwZXJmb3JtYW5jZS5ub3coKVxuICAgICAgaWYgKCF0aGlzLmFuaW1hdGluZykge1xuICAgICAgICB0aGlzLmFuaW1hdGluZyA9IHRydWVcbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMuZnJhbWUpXG4gICAgICB9XG4gICAgfSlcbiAgfVxuICBmcmFtZSA9ICgpID0+IHtcbiAgICB0aGlzLmN0eC5jbGVhclJlY3QoLXRoaXMuYW5pbUxvZ2ljYWxTaXplLCAtdGhpcy5hbmltTG9naWNhbFNpemUsIDIgKiB0aGlzLmFuaW1Mb2dpY2FsU2l6ZSwgMiAqIHRoaXMuYW5pbUxvZ2ljYWxTaXplKVxuICAgIGxldCBkID0gdGhpcy5kYXRhW3RoaXMuZnJhbWVJbmRleF1cbiAgICBsZXQgdGhldGEgPSBkWzFdLCBwaGkgPSBkWzJdXG4gICAgY29uc3QgYyA9IHRoaXMuY3R4XG4gICAgY29uc3QgcCA9IHRoaXMucGFyYW1zXG4gICAgbGV0IHgwID0gMCwgeTAgPSAwXG4gICAgbGV0IHgxID0gcC5sMSAqIE1hdGguc2luKHRoZXRhKSwgeTEgPSAtcC5sMSAqIE1hdGguY29zKHRoZXRhKVxuICAgIGxldCB4MiA9IHgxICsgcC5sMiAqIE1hdGguc2luKHBoaSksIHkyID0geTEgLSBwLmwyICogTWF0aC5jb3MocGhpKVxuICAgIGMubGluZVdpZHRoID0gMC4wMjVcbiAgICBjLnN0cm9rZVN0eWxlID0gJyM4ODgnXG4gICAgYy5iZWdpblBhdGgoKVxuICAgIGMubW92ZVRvKHgwLCB5MClcbiAgICBjLmxpbmVUbyh4MSwgeTEpXG4gICAgYy5saW5lVG8oeDIsIHkyKVxuICAgIGMuc3Ryb2tlKClcbiAgICBjLmZpbGxTdHlsZSA9ICcjZjAwJ1xuICAgIGMuYmVnaW5QYXRoKClcbiAgICBjLm1vdmVUbyh4MCwgeTApXG4gICAgYy5hcmMoeDAsIHkwLCAwLjA1LCAwLCBNYXRoLlBJICogMilcbiAgICBjLm1vdmVUbyh4MSwgeTEpXG4gICAgYy5hcmMoeDEsIHkxLCBNYXRoLnBvdyhwLm0xLCAxIC8gMykgLyA3LCAwLCBNYXRoLlBJICogMilcbiAgICBjLm1vdmVUbyh4MiwgeTIpXG4gICAgYy5hcmMoeDIsIHkyLCBNYXRoLnBvdyhwLm0yLCAxIC8gMykgLyA3LCAwLCBNYXRoLlBJICogMilcbiAgICBjLmZpbGwoKVxuXG4gICAgKyt0aGlzLmZyYW1lSW5kZXhcbiAgICBpZiAodGhpcy5mcmFtZUluZGV4IDwgdGhpcy5kYXRhLmxlbmd0aCkge1xuICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLmZyYW1lKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmFuaW1hdGluZyA9IGZhbHNlXG4gICAgICBsZXQgZXQgPSAocGVyZm9ybWFuY2Uubm93KCkgLSB0aGlzLmZyYW1lU3RhcnQpIC8gMWUzXG4gICAgICBjb25zb2xlLmxvZygnYW5pbWF0aW9uIGRvbmUnLCAodGhpcy5kYXRhLmxlbmd0aCAvIGV0KS50b0ZpeGVkKDIpLCAnZnBzJylcbiAgICB9XG4gIH1cbn1cbiJdfQ==
