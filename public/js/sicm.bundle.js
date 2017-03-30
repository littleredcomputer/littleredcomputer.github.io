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
            c.font = '10pt sans-serif3';
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
        var fRange = document.getElementById(o.fRangeId);
        var omegaRadSec = function () { return +fRange.value * 2 * Math.PI; };
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
        fRange.addEventListener('change', function (e) {
            explore.getContext('2d').clearRect(-Math.PI, -10, 2 * Math.PI, 20);
            var t = e.target;
            document.getElementById(o.fValueId).textContent = (+t.value).toFixed(1);
        });
        document.getElementById(o.fValueId).textContent = fRange.value;
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
        theta0Range.addEventListener('input', this.valueUpdater(o.theta0ValueId));
        var phi0Range = document.getElementById(o.phi0RangeId);
        phi0Range.addEventListener('change', this.valueUpdater(o.phi0ValueId));
        phi0Range.addEventListener('input', this.valueUpdater(o.phi0ValueId));
        var tRange = document.getElementById(o.tRangeId);
        tRange.addEventListener('change', this.valueUpdater(o.tValueId));
        tRange.addEventListener('input', this.valueUpdater(o.tValueId));
        var mRange = document.getElementById(o.mRangeId);
        mRange.addEventListener('change', this.valueUpdater(o.mValueId));
        mRange.addEventListener('input', this.valueUpdater(o.mValueId));
        var lRange = document.getElementById(o.lRangeId);
        lRange.addEventListener('change', this.valueUpdater(o.lValueId));
        lRange.addEventListener('input', this.valueUpdater(o.lValueId));
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvb2RleC9zcmMvb2RleC50cyIsInNpY20udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FDa0NBLElBQVksT0FJWDtBQUpELFdBQVksT0FBTztJQUNqQiwrQ0FBUyxDQUFBO0lBQ1QsNkRBQWdCLENBQUE7SUFDaEIsbURBQVcsQ0FBQTtBQUNiLENBQUMsRUFKVyxPQUFPLEdBQVAsZUFBTyxLQUFQLGVBQU8sUUFJbEI7QUFFRDtJQXlCRSxnQkFBWSxDQUFTO1FBQ25CLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBQ1YsSUFBSSxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUE7UUFDckIsSUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUE7UUFDckIsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUE7UUFDM0IsSUFBSSxDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUE7UUFDcEIsSUFBSSxDQUFDLHVCQUF1QixHQUFHLENBQUMsQ0FBQTtRQUNoQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQyxDQUFBO1FBQ3pCLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxDQUFDLENBQUE7UUFDNUIsSUFBSSxDQUFDLHdCQUF3QixHQUFHLENBQUMsQ0FBQTtRQUNqQyxJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQTtRQUN4QixJQUFJLENBQUMseUJBQXlCLEdBQUcsSUFBSSxDQUFBO1FBQ3JDLElBQUksQ0FBQyxlQUFlLEdBQUcsU0FBUyxDQUFBO1FBQ2hDLElBQUksQ0FBQywwQkFBMEIsR0FBRyxDQUFDLENBQUE7UUFDbkMsSUFBSSxDQUFDLHVCQUF1QixHQUFHLEdBQUcsQ0FBQTtRQUNsQyxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQTtRQUN4QixJQUFJLENBQUMsWUFBWSxHQUFHLEdBQUcsQ0FBQTtRQUN2QixJQUFJLENBQUMsWUFBWSxHQUFH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O29CQUNQLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxFQUFFLEVBQUUsQ0FBQzt3QkFBRSxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7b0JBQzlELElBQUksR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUE7b0JBQ2pCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxFQUFFLEVBQUUsQ0FBQzt3QkFBRSxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtvQkFFNUQsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQzt3QkFDN0IsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFBO3dCQUNsQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDOzRCQUM1QixJQUFJLE1BQU0sR0FBRyxTQUFBLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBSSxDQUFDLENBQUEsR0FBRyxDQUFDLENBQUE7NEJBQzFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0NBQzlCLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUE7NEJBQzFFLENBQUM7d0JBQ0gsQ0FBQztvQkFDSCxDQUFDO29CQUNELElBQUksR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUE7b0JBQ2pCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxFQUFFLEVBQUUsQ0FBQzt3QkFBRSxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtvQkFFMUQsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDO3dCQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7b0JBQzdDLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFBO29CQUNkLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFBO29CQUNiLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxFQUFFLEVBQUUsQ0FBQzt3QkFBRSxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7b0JBRS9ELEdBQUcsQ0FBQyxDQUFDLElBQUksR0FBRyxHQUFHLENBQUMsRUFBRSxHQUFHLElBQUksSUFBSSxFQUFFLEVBQUUsR0FBRyxFQUFFLENBQUM7d0JBRXJDLElBQUksSUFBSSxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUE7d0JBQzVCLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7NEJBQ25DLElBQUksS0FBSyxHQUFHLFNBQUEsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUEsQ0FBQTs0QkFDckMsR0FBRyxHQUFHLE1BQU0sQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxHQUFHLENBQUE7NEJBQ25DLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0NBQzlCLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFBOzRCQUN0QyxDQUFDO3dCQUNILENBQUM7d0JBQ0QsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7NEJBQ3BDLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQTs0QkFDbEIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0NBQ25DLElBQUksTUFBTSxHQUFHLFNBQUEsQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFJLENBQUMsQ0FBQSxHQUFHLENBQUMsQ0FBQTtnQ0FDMUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxHQUFHLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQztvQ0FDOUIsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQTtnQ0FDMUUsQ0FBQzs0QkFDSCxDQUFDO3dCQUNILENBQUM7d0JBQ0QsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQTt3QkFDckIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxHQUFHLEVBQUUsRUFBRSxDQUFDOzRCQUFFLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTt3QkFDakUsRUFBRSxDQUFDLENBQUMsR0FBRyxLQUFLLElBQUksQ0FBQzs0QkFBQyxRQUFRLENBQUE7d0JBRTFCLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDOzRCQUNoRCxJQUFJLElBQUksR0FBRyxNQUFNLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFBOzRCQUN6QixJQUFJLElBQUksR0FBRyxNQUFNLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQTs0QkFDL0IsRUFBRSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsSUFBSSxJQUFJLEtBQUssQ0FBQyxDQUFDO2dDQUFDLElBQUksSUFBSSxDQUFDLENBQUE7NEJBQ3RDLElBQUksQ0FBQyxTQUFR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QUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxLQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7d0JBQ2pDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUE7b0JBQ3ZELENBQUM7Z0JBQ0gsQ0FBQztnQkFDRCxHQUFHLEdBQUcsQ0FBQyxDQUFBO2dCQUVQLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksS0FBSSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDO29CQUNqQyxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO29CQUNyRCxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUE7b0JBQ2pDLEdBQUcsSUFBSSxTQUFBLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUksQ0FBQyxDQUFBLENBQUE7Z0JBQzdDLENBQUM7Z0JBQ0QsR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLEtBQUksQ0FBQyxD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QUksR0FBRyxHQUFHLEtBQUssR0FBRyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUE7b0JBQ3RDLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUE7b0JBQ3RCLElBQUksR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsQ0FBQTtvQkFFM0IsRUFBRSxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ2QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFBO3dCQUNoQyxFQUFFLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFDZCxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTs0QkFDM0MsRUFBRSxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0NBQ2QsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsSUFBSSxJQUFJLEVBQUUsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDO29DQUNyQyxJQUFJLElBQUksR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO29DQUM1QixJQUFJLElBQUksR0FBRyxJQUFJLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO29DQUN6QyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFBO2dDQUMxRSxDQUFDOzRCQUNILENBQUM7d0JBQ0gsQ0FBQztvQkFDSCxDQUFDO29CQUNELENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtvQkFDaEMsRUFBRSxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ2QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQTt3QkFDdkMsRUFBRSxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7NEJBQ2QsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsSUFBSSxJQUFJLEVBQUUsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDO2dDQUNyQyxJQUFJLElBQUksR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO2dDQUM1QixJQUFJLElBQUksR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUE7Z0NBQzlDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcs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SUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUE7WUFDN0YsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUksQ0FBQyxlQUFlLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQTtZQUN0RCxDQUFDLEdBQUcsTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQTtZQUN0RCxJQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQTtZQUNqQyxJQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQTtZQUNqQyxJQUFJLElBQUksR0FBRyxDQUFDLENBQUE7WUFDWixJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUE7WUFDWCxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUNYLEVBQUUsQ0FBQyxDQUFDLEtBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO29CQUNyQixNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO29CQUNiLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7d0JBQzdCLElBQUksS0FBSyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFBO3dCQUNyQixFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDOzRCQUFDLEVBQUUsS0FBSyxDQUFBO3dCQUMxQixNQUFN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LEVBQUUsQ0FBQyxLQUFJLENBQUMsZUFBZSxFQUFFLENBQUMsR0FBRyxLQUFJLENBQUMsZUFBZSxFQUFFLENBQUMsR0FBRyxLQUFJLENBQUMsZUFBZSxDQUFDLENBQUE7WUFDcEgsSUFBSSxDQUFDLEdBQUcsS0FBSSxDQUFDLElBQUksQ0FBQyxLQUFJLENBQUMsVUFBVSxDQUFDLENBQUE7WUFDbEMsSUFBSSxFQUFFLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBQ2xCLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtZQUNoQixJQUFNLENBQUMsR0FBRyxLQUFJLENBQUMsR0FBRyxDQUFBO1lBQ2xCLENBQUMsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFBO1lBQ2xCLENBQUMsQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFBO1lBQ3BCLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQTtZQUNiLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFBO1lBQ2YsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUE7WUFDL0MsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFBO1lBQ1YsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFBO1lBQ2IsQ0FBQyxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUE7WUFDcEIsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQTtZQUNsQyxDQUFDLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQTtZQUNwQixDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFBO1lBQ2pFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtZQUNSLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtZQUNSLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUE7WUFDcEIsQ0FBQyxDQUFDLElBQUksR0FBRyxrQkFBa0IsQ0FBQTtZQUMzQixDQUFDLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQTtZQUNwQixDQUFDLENBQUMsUUFBUSxDQUFDLEtBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUE7WUFDNUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFBO1lBRVgsRUFBRSxLQUFJLENBQUMsVUFBVSxDQUFBO1lBQ2pCLEVBQUUsQ0FBQyxDQUFDLEtBQUksQ0FBQyxVQUFVLEdBQUcsS0FBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUN2QyxNQUFNLENBQUMscUJBQXFCLENBQUMsS0FBSSxDQUFDLEtBQUssQ0FBQyxDQUFBO1lBQzFDLENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDTixLQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQTtnQkFDdEIsSUFBSSxFQUFFLEdBQUcsQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLEdBQUcsS0FBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLEdBQUcsQ0FBQTtnQkFDcEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLEtBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQTtZQUMxRSxDQUFDO1FBQ0gsQ0FBQyxDQUFBO1FBM0ZDLElBQUksTUFBTSxHQUFxQixRQUFRLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQTtRQUNsRSxJQUFJLFdBQVcsR0FBRyxjQUFNLE9BQUEsQ0FBQyxNQUFNLENBQUMsS0FBSyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsRUFBRSxFQUEzQixDQUEyQixDQUFBO1FBQ25ELElBQUksTUFBTSxHQUFxQixRQUFRLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQTtRQUNsRSxJQUFJLE1BQU0sR0FBRyxJQUFJLGlCQUFpQixDQUFDLGNBQU0sT0FBQSxDQUFDLEVBQUMsS0FBSyxFQUFFLFdBQVcsRUFBRSxFQUFFLENBQUMsRUFBRSxLQUFJLENBQUMsU0FBUyxFQUFDLENBQUMsRUFBM0MsQ0FBMkMsQ0FBQyxDQUFBO1FBQ3JGLElBQUksSUFBSSxHQUFzQixRQUFRLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUMvRCxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDaEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFBO1FBQ2xHLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUE7UUFDL0QsSUFBSSxJQUFJLEdBQUcsSUFBSSxVQUFVLENBQUMsR0FBRyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFBO1FBQ3RFLElBQUksUUFBUSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFBO1FBQ3BELElBQUksQ0FBQyxTQUFTLEdBQUcsVUFBQyxNQUFjLEVBQUUsU0FBaUI7WUFDakQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFBO1lBQzNDLFFBQVEsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFdBQVcsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBQ25FLFFBQVEsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLFdBQVcsR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBQ3pFLEtBQUksQ0FBQyxXQUFXLEdBQUcsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUE7WUFDdEMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsQ0FBQTtRQUN0QyxDQUFDLENBQUE7UUFDRCxJQUFJLE9BQU8sR0FBc0IsUUFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUE7UUFDckUsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxVQUFDLENBQVE7WUFDekMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFBO1lBQ2xFLElBQUksQ0FBQyxHQUFxQixDQUFDLENBQUMsTUFBTSxDQUFBO1lBQ2xDLFFBQVEsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUN6RSxDQUFDLENBQUMsQ0FBQTtRQUNGLFFBQVEsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFdBQVcsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFBO1FBQzlELE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsVUFBQyxDQUFRO1lBQ3pDLElBQUksQ0FBQyxHQUFxQixDQUFDLENBQUMsTUFBTSxDQUFBO1lBQ2xDLFFBQVEsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFBO1FBQzNELENBQUMsQ0FBQyxDQUFBO1FBQ0YsUUFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsV0FBVyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUE7UUFDOUQsUUFBUSxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLENBQUE7UUFDN0MsUUFBUSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRTtZQUVqQyxJQUFJLEVBQUUsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFBO1lBQ2YsSUFBSSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFBO1lBQ3RCLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFBO1lBQzFCLEtBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUE7WUFDeEIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBQ1QsS0FBSSxDQUFDLEtBQUssR0FBRyxXQUFXLEVBQUUsQ0FBQTtZQUMxQixJQUFJLEVBQUUsR0FBRyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUE7WUFDMUIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFDLEtBQUssRUFBRSxLQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFJLENBQUMsU0FBUyxFQUFDLEVBQUUsS0FBSSxDQUFDLFdBQVcsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLFVBQUMsQ0FBQyxFQUFFLEVBQUUsSUFBTSxLQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFBLENBQUEsQ0FBQyxDQUFDLENBQUE7WUFDakgsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUE7WUFDM0UsS0FBSSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUE7WUFDbkIsS0FBSSxDQUFDLFVBQVUsR0FBRyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUE7WUFDbkMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztnQkFDcEIsS0FBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUE7Z0JBQ3JCLHFCQUFxQixDQUFDLEtBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQTtZQUNuQyxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDO0lBNENILDhCQUFDO0FBQUQsQ0FsSEEsQUFrSEMsSUFBQTtBQWxIWSwwREFBdUI7QUEySHBDO0lBbUJFO1FBQ0UsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLGFBQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUN0QixJQUFJLENBQUMsQ0FBQyxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUE7UUFDekIsSUFBSSxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUE7SUFDakMsQ0FBQztJQXBCRCwwQ0FBYyxHQUFkLFVBQWUsRUFBVSxFQUFFLEVBQVUsRUFBRSxFQUFVLEVBQUUsRUFBVTtRQUMzRCxJQUFNLENBQUMsR0FBRyxHQUFHLENBQUE7UUFDYixNQUFNLENBQUMsVUFBQyxDQUFDLEVBQUUsRUFBaUM7Z0JBQWhDLFNBQUMsRUFBRSxhQUFLLEVBQUUsV0FBRyxFQUFFLGdCQUFRLEVBQUUsY0FBTTtZQUN6QyxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQTtZQUMvQixJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBQ3pCLElBQUksS0FBSyxHQUFHLENBQUUsR0FBRyxDQUFBO1lBQ2pCLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUE7WUFDM0IsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUE7WUFDakMsSUFBSSxLQUFLLEdBQUcsS0FBSyxHQUFHLEtBQUssQ0FBQTtZQUN6QixJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFBO1lBQzNCLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUE7WUFDM0IsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUE7WUFDOUIsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsS0FBSyxHQUFHLEtBQUssR0FBRyxLQUFLLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxLQUFLLEdBQUcsS0FBSyxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsS0FBSyxHQUFHLEtBQUssR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLEtBQUssR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEVBQUUsR0FBRyxLQUFLLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsR0FBRyxLQUFLLEdBQUcsS0FBSyxHQUFHLEtBQUssR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEtBQUssR0FBRyxLQUFLLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxLQUFLLEdBQUcsS0FBSyxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsS0FBSyxHQUFHLEtBQUssR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLEtBQUssR0FBRyxLQUFLLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxLQUFLLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsS0FBSyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFBO1FBQy9YLENBQUMsQ0FBQTtJQUNILENBQUM7SUFRRCxrQ0FBTSxHQUFOLFVBQU8sQ0FBZSxFQUFFLFdBQXFCLEVBQUUsRUFBVSxFQUFFLEVBQVUsRUFBRSxRQUEwQztRQUMvRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFBO0lBQ3RILENBQUM7SUFDSCx3QkFBQztBQUFELENBNUJBLEFBNEJDLElBQUE7QUFFRDtJQVlFLGlDQUFZLENBYVg7UUFiRCxpQkEwREM7UUFyRUQsb0JBQWUsR0FBRyxHQUFHLENBQUE7UUFzRXJCLFVBQUssR0FBRztZQUNOLEtBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsS0FBSSxDQUFDLGVBQWUsRUFBRSxDQUFDLEtBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxHQUFHLEtBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxHQUFHLEtBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQTtZQUNwSCxJQUFJLENBQUMsR0FBRyxLQUFJLENBQUMsSUFBSSxDQUFDLEtBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQTtZQUNsQyxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtZQUM1QixJQUFNLENBQUMsR0FBRyxLQUFJLENBQUMsR0FBRyxDQUFBO1lBQ2xCLElBQU0sQ0FBQyxHQUFHLEtBQUksQ0FBQyxNQUFNLENBQUE7WUFDckIsSUFBSSxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUE7WUFDbEIsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQTtZQUM3RCxJQUFJLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBQ2xFLENBQUMsQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFBO1lBQ25CLENBQUMsQ0FBQyxXQUFXLEdBQUcsTUFBTSxDQUFBO1lBQ3RCLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQTtZQUNiLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFBO1lBQ2hCLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFBO1lBQ2hCLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFBO1lBQ2hCLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQTtZQUNWLENBQUMsQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFBO1lBQ3BCLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQTtZQUNiLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFBO1lBQ2hCLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUE7WUFDbkMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUE7WUFDaEIsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFBO1lBQ3hELENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFBO1lBQ2hCLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQTtZQUN4RCxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUE7WUFFUixFQUFFLEtBQUksQ0FBQyxVQUFVLENBQUE7WUFDakIsRUFBRSxDQUFDLENBQUMsS0FBSSxDQUFDLFVBQVUsR0FBRyxLQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZDLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxLQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7WUFDMUMsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNOLEtBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFBO2dCQUN0QixJQUFJLEVBQUUsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxLQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsR0FBRyxDQUFBO2dCQUNwRCxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixFQUFFLENBQUMsS0FBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFBO1lBQzFFLENBQUM7UUFDSCxDQUFDLENBQUE7UUEvRUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUE7UUFDdEIsSUFBSSxPQUFPLEdBQUcsVUFBQyxDQUFTLElBQUssT0FBQSxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxFQUFFLEdBQUcsR0FBRyxFQUFyQixDQUFxQixDQUFBO1FBQ2xELElBQUksV0FBVyxHQUFxQixRQUFRLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQTtRQUM1RSxXQUFXLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUE7UUFDMUUsV0FBVyxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFBO1FBQ3pFLElBQUksU0FBUyxHQUFxQixRQUFRLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQTtRQUN4RSxTQUFTLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUE7UUFDdEUsU0FBUyxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFBO1FBQ3JFLElBQUksTUFBTSxHQUFxQixRQUFRLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQTtRQUNsRSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUE7UUFDaEUsTUFBTSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFBO1FBQy9ELElBQUksTUFBTSxHQUFxQixRQUFRLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQTtRQUNsRSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUE7UUFDaEUsTUFBTSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFBO1FBQy9ELElBQUksTUFBTSxHQUFxQixRQUFRLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQTtRQUNsRSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUE7UUFDaEUsTUFBTSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFBO1FBQy9ELElBQUksSUFBSSxHQUFzQixRQUFRLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUMvRCxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDaEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFBO1FBQ2xHLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUE7UUFDL0QsSUFBSSxNQUFNLEdBQUcsSUFBSSxpQkFBaUIsRUFBRSxDQUFBO1FBQ3BDLFFBQVEsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRTtZQUM5RCxJQUFJLEVBQUUsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFBO1lBQ2YsSUFBSSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFBO1lBQ3RCLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFBO1lBQzFCLEtBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUE7WUFDeEIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBQ1QsSUFBSSxFQUFFLEdBQUcsV0FBVyxDQUFDLEdBQUcsRUFBRSxDQUFBO1lBQzFCLEtBQUksQ0FBQyxNQUFNLEdBQUc7Z0JBQ1osRUFBRSxFQUFFLENBQUMsTUFBTSxDQUFDLEtBQUs7Z0JBQ2pCLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxLQUFLO2dCQUNqQixFQUFFLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDO2dCQUM1QixFQUFFLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDO2FBQzdCLENBQUE7WUFDRCxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLFVBQUMsQ0FBQyxFQUFFLEVBQUUsSUFBTSxLQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFBLENBQUEsQ0FBQyxDQUFDLENBQUE7WUFDcEksT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFBO1lBQ3pFLEtBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFBO1lBQ25CLEtBQUksQ0FBQyxVQUFVLEdBQUcsV0FBVyxDQUFDLEdBQUcsRUFBRSxDQUFBO1lBQ25DLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BCLEtBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFBO2dCQUNyQixxQkFBcUIsQ0FBQyxLQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7WUFDbkMsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQTlERCw4Q0FBWSxHQUFaLFVBQWEsSUFBWTtRQUN2QixNQUFNLENBQUMsVUFBQyxDQUFRLElBQUssT0FBQSxRQUFRLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLFdBQVcsR0FBc0IsQ0FBQyxDQUFDLE1BQU8sQ0FBQyxLQUFLLEVBQTlFLENBQThFLENBQUE7SUFDckcsQ0FBQztJQWdHSCw4QkFBQztBQUFELENBMUdBLEFBMEdDLElBQUE7QUExR1ksMERBQXVCIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogQW4gaW1wbGVtZW50YXRpb24gb2YgT0RFWCwgYnkgRS4gSGFpcmVyIGFuZCBHLiBXYW5uZXIsIHBvcnRlZCBmcm9tIHRoZSBGb3J0cmFuIE9ERVguRi5cbiAqIFRoZSBvcmlnaW5hbCB3b3JrIGNhcnJpZXMgdGhlIEJTRCAyLWNsYXVzZSBsaWNlbnNlLCBhbmQgc28gZG9lcyB0aGlzLlxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNiBDb2xpbiBTbWl0aC5cbiAqIDEuIFJlZGlzdHJpYnV0aW9ucyBvZiBzb3VyY2UgY29kZSBtdXN0IHJldGFpbiB0aGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSwgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmdcbiAqIGRpc2NsYWltZXIuXG4gKiAyLiBSZWRpc3RyaWJ1dGlvbnMgaW4gYmluYXJ5IGZvcm0gbXVzdCByZXByb2R1Y2UgdGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UsIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGVcbiAqIGZvbGxvd2luZyBkaXNjbGFpbWVyIGluIHRoZSBkb2N1bWVudGF0aW9uIGFuZC9vciBvdGhlciBtYXRlcmlhbHMgcHJvdmlkZWQgd2l0aCB0aGUgZGlzdHJpYnV0aW9uLlxuICpcbiAqIFRISVMgU09GVFdBUkUgSVMgUFJPVklERUQgQlkgVEhFIENPUFlSSUdIVCBIT0xERVJTIEFORCBDT05UUklCVVRPUlMgXCJBUyBJU1wiIEFORCBBTlkgRVhQUkVTUyBPUiBJTVBMSUVEIFdBUlJBTlRJRVMsXG4gKiBJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgVEhFIElNUExJRUQgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFkgQU5EIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFXG4gKiBBUkUgRElTQ0xBSU1FRC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIENPUFlSSUdIVCBIT0xERVIgT1IgQ09OVFJJQlVUT1JTIEJFIExJQUJMRSBGT1IgQU5ZIERJUkVDVCwgSU5ESVJFQ1QsXG4gKiBJTkNJREVOVEFMLCBTUEVDSUFMLCBFWEVNUExBUlksIE9SIENPTlNFUVVFTlRJQUwgREFNQUdFUyAoSU5DTFVESU5HLCBCVVQgTk9UIExJTUlURUQgVE8sIFBST0NVUkVNRU5UIE9GIFNVQlNUSVRVVEVcbiAqIEdPT0RTIE9SIFNFUlZJQ0VTOyBMT1NTIE9GIFVTRSwgREFUQSwgT1IgUFJPRklUUzsgT1IgQlVTSU5FU1MgSU5URVJSVVBUSU9OKSBIT1dFVkVSIENBVVNFRCBBTkQgT04gQU5ZIFRIRU9SWSBPRlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIENPTlRSQUNULCBTVFJJQ1QgTElBQklMSVRZLCBPUiBUT1JUIChJTkNMVURJTkcgTkVHTElHRU5DRSBPUiBPVEhFUldJU0UpIEFSSVNJTkcgSU4gQU5ZIFdBWVxuICogT1VUIE9GIFRIRSBVU0UgT0YgVEhJUyBTT0ZUV0FSRSwgRVZFTiBJRiBBRFZJU0VEIE9GIFRIRSBQT1NTSUJJTElUWSBPRiBTVUNIIERBTUFHRS5cbiAqL1xuXG5leHBvcnQgaW50ZXJmYWNlIERlcml2YXRpdmUgeyAgLy8gZnVuY3Rpb24gY29tcHV0aW5nIHRoZSB2YWx1ZSBvZiBZJyA9IEYoeCxZKVxuICAoeDogbnVtYmVyLCAgICAgICAgICAgLy8gaW5wdXQgeCB2YWx1ZVxuICAgeTogbnVtYmVyW10pICAgICAgICAgLy8gaW5wdXQgeSB2YWx1ZSlcbiAgICA6IG51bWJlcltdICAgICAgICAgIC8vIG91dHB1dCB5JyB2YWx1ZXMgKEFycmF5IG9mIGxlbmd0aCBuKVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIE91dHB1dEZ1bmN0aW9uIHsgICAgICAgICAgICAgICAgICAgIC8vIHZhbHVlIGNhbGxiYWNrXG4gIChucjogbnVtYmVyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc3RlcCBudW1iZXJcbiAgIHhvbGQ6IG51bWJlciwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBsZWZ0IGVkZ2Ugb2Ygc29sdXRpb24gaW50ZXJ2YWxcbiAgIHg6IG51bWJlciwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyByaWdodCBlZGdlIG9mIHNvbHV0aW9uIGludGVydmFsICh5ID0gRih4KSlcbiAgIHk6IG51bWJlcltdLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBGKHgpXG4gICBkZW5zZT86IChjOiBudW1iZXIsIHg6IG51bWJlcikgPT4gbnVtYmVyKSAgLy8gZGVuc2UgaW50ZXJwb2xhdG9yLiBWYWxpZCBpbiB0aGUgcmFuZ2UgW3gsIHhvbGQpLlxuICAgIDogYm9vbGVhbnx2b2lkICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJldHVybiBmYWxzZSB0byBoYWx0IGludGVncmF0aW9uXG59XG5cbmV4cG9ydCBlbnVtIE91dGNvbWUge1xuICBDb252ZXJnZWQsXG4gIE1heFN0ZXBzRXhjZWVkZWQsXG4gIEVhcmx5UmV0dXJuXG59XG5cbmV4cG9ydCBjbGFzcyBTb2x2ZXIge1xuICBuOiBudW1iZXIgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBkaW1lbnNpb24gb2YgdGhlIHN5c3RlbVxuICB1Um91bmQ6IG51bWJlciAgICAgICAgICAgICAgICAgICAgICAvLyBXT1JLKDEpLCBtYWNoaW5lIGVwc2lsb24uIChXT1JLLCBJV09SSyBhcmUgcmVmZXJlbmNlcyB0byBvZGV4LmYpXG4gIG1heFN0ZXBzOiBudW1iZXIgICAgICAgICAgICAgICAgICAgIC8vIElXT1JLKDEpLCBwb3NpdGl2ZSBpbnRlZ2VyXG4gIGluaXRpYWxTdGVwU2l6ZTogbnVtYmVyICAgICAgICAgICAgIC8vIEhcbiAgbWF4U3RlcFNpemU6IG51bWJlciAgICAgICAgICAgICAgICAgLy8gV09SSygyKSwgbWF4aW1hbCBzdGVwIHNpemUsIGRlZmF1bHQgeEVuZCAtIHhcbiAgbWF4RXh0cmFwb2xhdGlvbkNvbHVtbnM6IG51bWJlciAgICAgLy8gSVdPUksoMiksIEtNLCBwb3NpdGl2ZSBpbnRlZ2VyXG4gIHN0ZXBTaXplU2VxdWVuY2U6IG51bWJlciAgICAgICAgICAgIC8vIElXT1JLKDMpLCBpbiBbMS4uNV1cbiAgc3RhYmlsaXR5Q2hlY2tDb3VudDogbnVtYmVyICAgICAgICAgLy8gSVdPUksoNCksIGluXG4gIHN0YWJpbGl0eUNoZWNrVGFibGVMaW5lczogbnVtYmVyICAgIC8vIElXT1JLKDUpLCBwb3NpdGl2ZSBpbnRlZ2VyXG4gIGRlbnNlT3V0cHV0OiBib29sZWFuICAgICAgICAgICAgICAgIC8vIElPVVQgPj0gMiwgdHJ1ZSBtZWFucyBkZW5zZSBvdXRwdXQgaW50ZXJwb2xhdG9yIHByb3ZpZGVkIHRvIHNvbE91dFxuICBkZW5zZU91dHB1dEVycm9yRXN0aW1hdG9yOiBib29sZWFuICAvLyBJV09SSyg2KSwgcmV2ZXJzZWQgc2Vuc2UgZnJvbSB0aGUgRk9SVFJBTiBjb2RlXG4gIGRlbnNlQ29tcG9uZW50czogbnVtYmVyW10gICAgICAgICAgIC8vIElXT1JLKDgpICYgSVdPUksoMjEsLi4uKSwgY29tcG9uZW50cyBmb3Igd2hpY2ggZGVuc2Ugb3V0cHV0IGlzIHJlcXVpcmVkXG4gIGludGVycG9sYXRpb25Gb3JtdWxhRGVncmVlOiBudW1iZXIgIC8vIElXT1JLKDcpLCDCtSA9IDIgKiBrIC0gaW50ZXJwb2xhdGlvbkZvcm11bGFEZWdyZWUgKyAxIFsxLi42XSwgZGVmYXVsdCA0XG4gIHN0ZXBTaXplUmVkdWN0aW9uRmFjdG9yOiBudW1iZXIgICAgIC8vIFdPUksoMyksIGRlZmF1bHQgMC41XG4gIHN0ZXBTaXplRmFjMTogbnVtYmVyICAgICAgICAgICAgICAgIC8vIFdPUksoNClcbiAgc3RlcFNpemVGYWMyOiBudW1iZXIgICAgICAgICAgICAgICAgLy8gV09SSyg1KVxuICBzdGVwU2l6ZUZhYzM6IG51bWJlciAgICAgICAgICAgICAgICAvLyBXT1JLKDYpXG4gIHN0ZXBTaXplRmFjNDogbnVtYmVyICAgICAgICAgICAgICAgIC8vIFdPUksoNylcbiAgc3RlcFNhZmV0eUZhY3RvcjE6IG51bWJlciAgICAgICAgICAgLy8gV09SSyg4KVxuICBzdGVwU2FmZXR5RmFjdG9yMjogbnVtYmVyICAgICAgICAgICAvLyBXT1JLKDkpXG4gIHJlbGF0aXZlVG9sZXJhbmNlOiBudW1iZXJ8bnVtYmVyW10gIC8vIFJUT0wuIENhbiBiZSBhIHNjYWxhciBvciB2ZWN0b3Igb2YgbGVuZ3RoIE4uXG4gIGFic29sdXRlVG9sZXJhbmNlOiBudW1iZXJ8bnVtYmVyW10gIC8vIEFUT0wuIENhbiBiZSBhIHNjYWxhciBvciB2ZWN0b3Igb2YgbGVuZ3RoIE4uXG4gIGRlYnVnOiBib29sZWFuXG5cbiAgY29uc3RydWN0b3IobjogbnVtYmVyKSB7XG4gICAgdGhpcy5uID0gblxuICAgIHRoaXMudVJvdW5kID0gMi4zZS0xNlxuICAgIHRoaXMubWF4U3RlcHMgPSAxMDAwMFxuICAgIHRoaXMuaW5pdGlhbFN0ZXBTaXplID0gMWUtNFxuICAgIHRoaXMubWF4U3RlcFNpemUgPSAwXG4gICAgdGhpcy5tYXhFeHRyYXBvbGF0aW9uQ29sdW1ucyA9IDlcbiAgICB0aGlzLnN0ZXBTaXplU2VxdWVuY2UgPSAwXG4gICAgdGhpcy5zdGFiaWxpdHlDaGVja0NvdW50ID0gMVxuICAgIHRoaXMuc3RhYmlsaXR5Q2hlY2tUYWJsZUxpbmVzID0gMlxuICAgIHRoaXMuZGVuc2VPdXRwdXQgPSBmYWxzZVxuICAgIHRoaXMuZGVuc2VPdXRwdXRFcnJvckVzdGltYXRvciA9IHRydWVcbiAgICB0aGlzLmRlbnNlQ29tcG9uZW50cyA9IHVuZGVmaW5lZFxuICAgIHRoaXMuaW50ZXJwb2xhdGlvbkZvcm11bGFEZWdyZWUgPSA0XG4gICAgdGhpcy5zdGVwU2l6ZVJlZHVjdGlvbkZhY3RvciA9IDAuNVxuICAgIHRoaXMuc3RlcFNpemVGYWMxID0gMC4wMlxuICAgIHRoaXMuc3RlcFNpemVGYWMyID0gNC4wXG4gICAgdGhpcy5zdGVwU2l6ZUZhYzMgPSAwLjhcbiAgICB0aGlzLnN0ZXBTaXplRmFjNCA9IDAuOVxuICAgIHRoaXMuc3RlcFNhZmV0eUZhY3RvcjEgPSAwLjY1XG4gICAgdGhpcy5zdGVwU2FmZXR5RmFjdG9yMiA9IDAuOTRcbiAgICB0aGlzLnJlbGF0aXZlVG9sZXJhbmNlID0gMWUtNVxuICAgIHRoaXMuYWJzb2x1dGVUb2xlcmFuY2UgPSAxZS01XG4gICAgdGhpcy5kZWJ1ZyA9IGZhbHNlXG4gIH1cblxuICBncmlkKGR0OiBudW1iZXIsIG91dDogKHhPdXQ6IG51bWJlciwgeU91dDogbnVtYmVyW10pID0+IGFueSk6IE91dHB1dEZ1bmN0aW9uIHtcbiAgICBsZXQgY29tcG9uZW50czogbnVtYmVyW10gPSB0aGlzLmRlbnNlQ29tcG9uZW50c1xuICAgIGlmICghY29tcG9uZW50cykge1xuICAgICAgY29tcG9uZW50cyA9IFtdXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubjsgKytpKSBjb21wb25lbnRzLnB1c2goaSlcbiAgICB9XG4gICAgbGV0IHQ6IG51bWJlclxuICAgIHJldHVybiAobjogbnVtYmVyLCB4T2xkOiBudW1iZXIsIHg6IG51bWJlciwgeTogbnVtYmVyW10sIGludGVycG9sYXRlOiAoaTogbnVtYmVyLCB4OiBudW1iZXIpID0+IG51bWJlcikgPT4ge1xuICAgICAgaWYgKG4gPT09IDEpIHtcbiAgICAgICAgb3V0KHgsIHkpXG4gICAgICAgIHQgPSB4ICsgZHRcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICB3aGlsZSAodCA8PSB4KSB7XG4gICAgICAgIGxldCB5ZjogbnVtYmVyW10gPSBbXVxuICAgICAgICBmb3IgKGxldCBpIG9mIGNvbXBvbmVudHMpIHtcbiAgICAgICAgICB5Zi5wdXNoKGludGVycG9sYXRlKGksIHQpKVxuICAgICAgICB9XG4gICAgICAgIG91dCh0LCB5ZilcbiAgICAgICAgdCArPSBkdFxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIHJldHVybiBhIDEtYmFzZWQgYXJyYXkgb2YgbGVuZ3RoIG4uIEluaXRpYWwgdmFsdWVzIHVuZGVmaW5lZC5cbiAgcHJpdmF0ZSBzdGF0aWMgZGltID0gKG46IG51bWJlcikgPT4gQXJyYXkobiArIDEpXG4gIHByaXZhdGUgc3RhdGljIGxvZzEwID0gKHg6IG51bWJlcikgPT4gTWF0aC5sb2coeCkgLyBNYXRoLkxOMTBcblxuICAvLyBNYWtlIGEgMS1iYXNlZCAyRCBhcnJheSwgd2l0aCByIHJvd3MgYW5kIGMgY29sdW1ucy4gVGhlIGluaXRpYWwgdmFsdWVzIGFyZSB1bmRlZmluZWQuXG4gIHByaXZhdGUgc3RhdGljIGRpbTIocjogbnVtYmVyLCBjOiBudW1iZXIpOiBudW1iZXJbXVtdIHtcbiAgICBsZXQgYSA9IG5ldyBBcnJheShyICsgMSlcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8PSByOyArK2kpIGFbaV0gPSBTb2x2ZXIuZGltKGMpXG4gICAgcmV0dXJuIGFcbiAgfVxuXG4gIC8vIEdlbmVyYXRlIHN0ZXAgc2l6ZSBzZXF1ZW5jZSBhbmQgcmV0dXJuIGFzIGEgMS1iYXNlZCBhcnJheSBvZiBsZW5ndGggbi5cbiAgc3RhdGljIHN0ZXBTaXplU2VxdWVuY2UoblNlcTogbnVtYmVyLCBuOiBudW1iZXIpOiBudW1iZXJbXSB7XG4gICAgY29uc3QgYSA9IG5ldyBBcnJheShuICsgMSlcbiAgICBhWzBdID0gMFxuICAgIHN3aXRjaCAoblNlcSkge1xuICAgICAgY2FzZSAxOlxuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBuOyArK2kpIGFbaV0gPSAyICogaVxuICAgICAgICBicmVha1xuICAgICAgY2FzZSAyOlxuICAgICAgICBhWzFdID0gMlxuICAgICAgICBmb3IgKGxldCBpID0gMjsgaSA8PSBuOyArK2kpIGFbaV0gPSA0ICogaSAtIDRcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgYVsxXSA9IDJcbiAgICAgICAgYVsyXSA9IDRcbiAgICAgICAgYVszXSA9IDZcbiAgICAgICAgZm9yIChsZXQgaSA9IDQ7IGkgPD0gbjsgKytpKSBhW2ldID0gMiAqIGFbaSAtIDJdXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlIDQ6XG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG47ICsraSkgYVtpXSA9IDQgKiBpIC0gMlxuICAgICAgICBicmVha1xuICAgICAgY2FzZSA1OlxuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBuOyArK2kpIGFbaV0gPSA0ICogaVxuICAgICAgICBicmVha1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbnZhbGlkIHN0ZXBTaXplU2VxdWVuY2Ugc2VsZWN0ZWQnKVxuICAgIH1cbiAgICByZXR1cm4gYVxuICB9XG5cbiAgLy8gSW50ZWdyYXRlIHRoZSBkaWZmZXJlbnRpYWwgc3lzdGVtIHJlcHJlc2VudGVkIGJ5IGYsIGZyb20geCB0byB4RW5kLCB3aXRoIGluaXRpYWwgZGF0YSB5LlxuICAvLyBzb2xPdXQsIGlmIHByb3ZpZGVkLCBpcyBjYWxsZWQgYXQgZWFjaCBpbnRlZ3JhdGlvbiBzdGVwLlxuICBzb2x2ZShmOiBEZXJpdmF0aXZlLFxuICAgICAgICB4OiBudW1iZXIsXG4gICAgICAgIHkwOiBudW1iZXJbXSxcbiAgICAgICAgeEVuZDogbnVtYmVyLFxuICAgICAgICBzb2xPdXQ/OiBPdXRwdXRGdW5jdGlvbikge1xuXG4gICAgLy8gTWFrZSBhIGNvcHkgb2YgeTAsIDEtYmFzZWQuIFdlIGxlYXZlIHRoZSB1c2VyJ3MgcGFyYW1ldGVycyBhbG9uZSBzbyB0aGF0IHRoZXkgbWF5IGJlIHJldXNlZCBpZiBkZXNpcmVkLlxuICAgIGxldCB5ID0gWzBdLmNvbmNhdCh5MClcbiAgICBsZXQgZHogPSBTb2x2ZXIuZGltKHRoaXMubilcbiAgICBsZXQgeWgxID0gU29sdmVyLmRpbSh0aGlzLm4pXG4gICAgbGV0IHloMiA9IFNvbHZlci5kaW0odGhpcy5uKVxuICAgIGlmICh0aGlzLm1heFN0ZXBzIDw9IDApIHRocm93IG5ldyBFcnJvcignbWF4U3RlcHMgbXVzdCBiZSBwb3NpdGl2ZScpXG4gICAgY29uc3Qga20gPSB0aGlzLm1heEV4dHJhcG9sYXRpb25Db2x1bW5zXG4gICAgaWYgKGttIDw9IDIpIHRocm93IG5ldyBFcnJvcignbWF4RXh0cmFwb2xhdGlvbkNvbHVtbnMgbXVzdCBiZSA+IDInKVxuICAgIGNvbnN0IG5TZXEgPSB0aGlzLnN0ZXBTaXplU2VxdWVuY2UgfHwgKHRoaXMuZGVuc2VPdXRwdXQgPyA0IDogMSlcbiAgICBpZiAoblNlcSA8PSAzICYmIHRoaXMuZGVuc2VPdXRwdXQpIHRocm93IG5ldyBFcnJvcignc3RlcFNpemVTZXF1ZW5jZSBpbmNvbXBhdGlibGUgd2l0aCBkZW5zZU91dHB1dCcpXG4gICAgaWYgKHRoaXMuZGVuc2VPdXRwdXQgJiYgIXNvbE91dCkgdGhyb3cgbmV3IEVycm9yKCdkZW5zZU91dHB1dCByZXF1aXJlcyBhIHNvbHV0aW9uIG9ic2VydmVyIGZ1bmN0aW9uJylcbiAgICBpZiAodGhpcy5pbnRlcnBvbGF0aW9uRm9ybXVsYURlZ3JlZSA8PSAwIHx8IHRoaXMuaW50ZXJwb2xhdGlvbkZvcm11bGFEZWdyZWUgPj0gNykgdGhyb3cgbmV3IEVycm9yKCdiYWQgaW50ZXJwb2xhdGlvbkZvcm11bGFEZWdyZWUnKVxuICAgIGxldCBpY29tID0gWzBdICAvLyBpY29tIHdpbGwgYmUgMS1iYXNlZCwgc28gc3RhcnQgd2l0aCBhIHBhZCBlbnRyeS5cbiAgICBsZXQgbnJkZW5zID0gMFxuICAgIGlmICh0aGlzLmRlbnNlT3V0cHV0KSB7XG4gICAgICBpZiAodGhpcy5kZW5zZUNvbXBvbmVudHMpIHtcbiAgICAgICAgZm9yIChsZXQgYyBvZiB0aGlzLmRlbnNlQ29tcG9uZW50cykge1xuICAgICAgICAgIC8vIGNvbnZlcnQgZGVuc2UgY29tcG9uZW50cyByZXF1ZXN0ZWQgaW50byBvbmUtYmFzZWQgaW5kZXhpbmcuXG4gICAgICAgICAgaWYgKGMgPCAwIHx8IGMgPiB0aGlzLm4pIHRocm93IG5ldyBFcnJvcignYmFkIGRlbnNlIGNvbXBvbmVudDogJyArIGMpXG4gICAgICAgICAgaWNvbS5wdXNoKGMgKyAxKVxuICAgICAgICAgICsrbnJkZW5zXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGlmIHVzZXIgYXNrZWQgZm9yIGRlbnNlIG91dHB1dCBidXQgZGlkIG5vdCBzcGVjaWZ5IGFueSBkZW5zZUNvbXBvbmVudHMsXG4gICAgICAgIC8vIHJlcXVlc3QgYWxsIG9mIHRoZW0uXG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IHRoaXMubjsgKytpKSB7XG4gICAgICAgICAgaWNvbS5wdXNoKGkpXG4gICAgICAgIH1cbiAgICAgICAgbnJkZW5zID0gdGhpcy5uXG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0aGlzLnVSb3VuZCA8PSAxZS0zNSB8fCB0aGlzLnVSb3VuZCA+IDEpIHRocm93IG5ldyBFcnJvcignc3VzcGljaW91cyB2YWx1ZSBvZiB1Um91bmQnKVxuICAgIGNvbnN0IGhNYXggPSBNYXRoLmFicyh0aGlzLm1heFN0ZXBTaXplIHx8IHhFbmQgLSB4KVxuICAgIGNvbnN0IGxmU2FmZSA9IDIgKiBrbSAqIGttICsga21cblxuICAgIGZ1bmN0aW9uIGV4cGFuZFRvQXJyYXkoeDogbnVtYmVyfG51bWJlcltdLCBuOiBudW1iZXIpOiBudW1iZXJbXSB7XG4gICAgICAvLyBJZiB4IGlzIGFuIGFycmF5LCByZXR1cm4gYSAxLWJhc2VkIGNvcHkgb2YgaXQuIElmIHggaXMgYSBudW1iZXIsIHJldHVybiBhIG5ldyAxLWJhc2VkIGFycmF5XG4gICAgICAvLyBjb25zaXN0aW5nIG9mIG4gY29waWVzIG9mIHRoZSBudW1iZXIuXG4gICAgICBjb25zdCB0b2xBcnJheSA9IFswXVxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoeCkpIHtcbiAgICAgICAgcmV0dXJuIHRvbEFycmF5LmNvbmNhdCh4KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuOyArK2kpIHRvbEFycmF5LnB1c2goeClcbiAgICAgICAgcmV0dXJuIHRvbEFycmF5XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgYVRvbCA9IGV4cGFuZFRvQXJyYXkodGhpcy5hYnNvbHV0ZVRvbGVyYW5jZSwgdGhpcy5uKVxuICAgIGNvbnN0IHJUb2wgPSBleHBhbmRUb0FycmF5KHRoaXMucmVsYXRpdmVUb2xlcmFuY2UsIHRoaXMubilcbiAgICBsZXQgW25FdmFsLCBuU3RlcCwgbkFjY2VwdCwgblJlamVjdF0gPSBbMCwgMCwgMCwgMF1cblxuICAgIC8vIGNhbGwgdG8gY29yZSBpbnRlZ3JhdG9yXG4gICAgY29uc3QgbnJkID0gTWF0aC5tYXgoMSwgbnJkZW5zKVxuICAgIGNvbnN0IG5jb20gPSBNYXRoLm1heCgxLCAoMiAqIGttICsgNSkgKiBucmRlbnMpXG4gICAgY29uc3QgZGVucyA9IFNvbHZlci5kaW0obmNvbSlcbiAgICBjb25zdCBmU2FmZSA9IFNvbHZlci5kaW0yKGxmU2FmZSwgbnJkKVxuXG4gICAgLy8gV3JhcCBmIGluIGEgZnVuY3Rpb24gRiB3aGljaCBoaWRlcyB0aGUgb25lLWJhc2VkIGluZGV4aW5nIGZyb20gdGhlIGN1c3RvbWVycy5cbiAgICBjb25zdCBGID0gKHg6IG51bWJlciwgeTogbnVtYmVyW10sIHlwOiBudW1iZXJbXSkgPT4ge1xuICAgICAgbGV0IHJldCA9IGYoeCwgeS5zbGljZSgxKSlcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmV0Lmxlbmd0aDsgKytpKSB5cFtpICsgMV0gPSByZXRbaV1cbiAgICB9XG5cbiAgICBsZXQgb2R4Y29yID0gKCk6IE91dGNvbWUgPT4ge1xuICAgICAgLy8gVGhlIGZvbGxvd2luZyB0aHJlZSB2YXJpYWJsZXMgYXJlIENPTU1PTi9DT05URVgvXG4gICAgICBsZXQgeE9sZGQ6IG51bWJlclxuICAgICAgbGV0IGhoaDogbnVtYmVyXG4gICAgICBsZXQga21pdDogbnVtYmVyXG5cbiAgICAgIGxldCBhY2NlcHRTdGVwID0gKG46IG51bWJlcik6IGJvb2xlYW4gPT4geyAgIC8vIGxhYmVsIDYwXG4gICAgICAgIC8vIFJldHVybnMgdHJ1ZSBpZiB3ZSBzaG91bGQgY29udGludWUgdGhlIGludGVncmF0aW9uLiBUaGUgb25seSB0aW1lIGZhbHNlXG4gICAgICAgIC8vIGlzIHJldHVybmVkIGlzIHdoZW4gdGhlIHVzZXIncyBzb2x1dGlvbiBvYnNlcnZhdGlvbiBmdW5jdGlvbiBoYXMgcmV0dXJuZWQgZmFsc2UsXG4gICAgICAgIC8vIGluZGljYXRpbmcgdGhhdCBzaGUgZG9lcyBub3Qgd2lzaCB0byBjb250aW51ZSB0aGUgY29tcHV0YXRpb24uXG4gICAgICAgIHhPbGQgPSB4XG4gICAgICAgIHggKz0gaFxuICAgICAgICBpZiAodGhpcy5kZW5zZU91dHB1dCkge1xuICAgICAgICAgIC8vIGttaXQgPSBtdSBvZiB0aGUgcGFwZXJcbiAgICAgICAgICBrbWl0ID0gMiAqIGtjIC0gdGhpcy5pbnRlcnBvbGF0aW9uRm9ybXVsYURlZ3JlZSArIDFcbiAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBucmQ7ICsraSkgZGVuc1tpXSA9IHlbaWNvbVtpXV1cbiAgICAgICAgICB4T2xkZCA9IHhPbGRcbiAgICAgICAgICBoaGggPSBoICAvLyBub3RlOiB4T2xkZCBhbmQgaGhoIGFyZSBwYXJ0IG9mIC9DT05PRFgvXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbnJkOyArK2kpIGRlbnNbbnJkICsgaV0gPSBoICogZHpbaWNvbVtpXV1cbiAgICAgICAgICBsZXQga2xuID0gMiAqIG5yZFxuICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG5yZDsgKytpKSBkZW5zW2tsbiArIGldID0gdFsxXVtpY29tW2ldXVxuICAgICAgICAgIC8vIGNvbXB1dGUgc29sdXRpb24gYXQgbWlkLXBvaW50XG4gICAgICAgICAgZm9yIChsZXQgaiA9IDI7IGogPD0ga2M7ICsraikge1xuICAgICAgICAgICAgbGV0IGRibGVuaiA9IG5qW2pdXG4gICAgICAgICAgICBmb3IgKGxldCBsID0gajsgbCA+PSAyOyAtLWwpIHtcbiAgICAgICAgICAgICAgbGV0IGZhY3RvciA9IChkYmxlbmogLyBualtsIC0gMV0pICoqIDIgLSAxXG4gICAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG5yZDsgKytpKSB7XG4gICAgICAgICAgICAgICAgeVNhZmVbbCAtIDFdW2ldID0geVNhZmVbbF1baV0gKyAoeVNhZmVbbF1baV0gLSB5U2FmZVtsIC0gMV1baV0pIC8gZmFjdG9yXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgbGV0IGtybiA9IDQgKiBucmRcbiAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBucmQ7ICsraSkgZGVuc1trcm4gKyBpXSA9IHlTYWZlWzFdW2ldXG4gICAgICAgICAgLy8gY29tcHV0ZSBmaXJzdCBkZXJpdmF0aXZlIGF0IHJpZ2h0IGVuZFxuICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG47ICsraSkgeWgxW2ldID0gdFsxXVtpXVxuICAgICAgICAgIEYoeCwgeWgxLCB5aDIpXG4gICAgICAgICAga3JuID0gMyAqIG5yZFxuICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG5yZDsgKytpKSBkZW5zW2tybiArIGldID0geWgyW2ljb21baV1dICogaFxuICAgICAgICAgIC8vIFRIRSBMT09QXG4gICAgICAgICAgZm9yIChsZXQga21pID0gMTsga21pIDw9IGttaXQ7ICsra21pKSB7XG4gICAgICAgICAgICAvLyBjb21wdXRlIGttaS10aCBkZXJpdmF0aXZlIGF0IG1pZC1wb2ludFxuICAgICAgICAgICAgbGV0IGtiZWcgPSAoa21pICsgMSkgLyAyIHwgMFxuICAgICAgICAgICAgZm9yIChsZXQga2sgPSBrYmVnOyBrayA8PSBrYzsgKytraykge1xuICAgICAgICAgICAgICBsZXQgZmFjbmogPSAobmpba2tdIC8gMikgKiogKGttaSAtIDEpXG4gICAgICAgICAgICAgIGlQdCA9IGlQb2ludFtrayArIDFdIC0gMiAqIGtrICsga21pXG4gICAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG5yZDsgKytpKSB7XG4gICAgICAgICAgICAgICAgeVNhZmVba2tdW2ldID0gZlNhZmVbaVB0XVtpXSAqIGZhY25qXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAobGV0IGogPSBrYmVnICsgMTsgaiA8PSBrYzsgKytqKSB7XG4gICAgICAgICAgICAgIGxldCBkYmxlbmogPSBualtqXVxuICAgICAgICAgICAgICBmb3IgKGxldCBsID0gajsgbCA+PSBrYmVnICsgMTsgLS1sKSB7XG4gICAgICAgICAgICAgICAgbGV0IGZhY3RvciA9IChkYmxlbmogLyBualtsIC0gMV0pICoqIDIgLSAxXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbnJkOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgIHlTYWZlW2wgLSAxXVtpXSA9IHlTYWZlW2xdW2ldICsgKHlTYWZlW2xdW2ldIC0geVNhZmVbbCAtIDFdW2ldKSAvIGZhY3RvclxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAga3JuID0gKGttaSArIDQpICogbnJkXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBucmQ7ICsraSkgZGVuc1trcm4gKyBpXSA9IHlTYWZlW2tiZWddW2ldICogaFxuICAgICAgICAgICAgaWYgKGttaSA9PT0ga21pdCkgY29udGludWVcbiAgICAgICAgICAgIC8vIGNvbXB1dGUgZGlmZmVyZW5jZXNcbiAgICAgICAgICAgIGZvciAobGV0IGtrID0gKGttaSArIDIpIC8gMiB8IDA7IGtrIDw9IGtjOyArK2trKSB7XG4gICAgICAgICAgICAgIGxldCBsYmVnID0gaVBvaW50W2trICsgMV1cbiAgICAgICAgICAgICAgbGV0IGxlbmQgPSBpUG9pbnRba2tdICsga21pICsgMVxuICAgICAgICAgICAgICBpZiAoa21pID09PSAxICYmIG5TZXEgPT09IDQpIGxlbmQgKz0gMlxuICAgICAgICAgICAgICBsZXQgbDogbnVtYmVyXG4gICAgICAgICAgICAgIGZvciAobCA9IGxiZWc7IGwgPj0gbGVuZDsgbCAtPSAyKSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbnJkOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgIGZTYWZlW2xdW2ldIC09IGZTYWZlW2wgLSAyXVtpXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoa21pID09PSAxICYmIG5TZXEgPT09IDQpIHtcbiAgICAgICAgICAgICAgICBsID0gbGVuZCAtIDJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBucmQ7ICsraSkgZlNhZmVbbF1baV0gLT0gZHpbaWNvbVtpXV1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gY29tcHV0ZSBkaWZmZXJlbmNlc1xuICAgICAgICAgICAgZm9yIChsZXQga2sgPSAoa21pICsgMikgLyAyIHwgMDsga2sgPD0ga2M7ICsra2spIHtcbiAgICAgICAgICAgICAgbGV0IGxiZWcgPSBpUG9pbnRba2sgKyAxXSAtIDFcbiAgICAgICAgICAgICAgbGV0IGxlbmQgPSBpUG9pbnRba2tdICsga21pICsgMlxuICAgICAgICAgICAgICBmb3IgKGxldCBsID0gbGJlZzsgbCA+PSBsZW5kOyBsIC09IDIpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBucmQ7ICsraSkge1xuICAgICAgICAgICAgICAgICAgZlNhZmVbbF1baV0gLT0gZlNhZmVbbCAtIDJdW2ldXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGludGVycChucmQsIGRlbnMsIGttaXQpXG4gICAgICAgICAgLy8gZXN0aW1hdGlvbiBvZiBpbnRlcnBvbGF0aW9uIGVycm9yXG4gICAgICAgICAgaWYgKHRoaXMuZGVuc2VPdXRwdXRFcnJvckVzdGltYXRvciAmJiBrbWl0ID49IDEpIHtcbiAgICAgICAgICAgIGxldCBlcnJpbnQgPSAwXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBucmQ7ICsraSkgZXJyaW50ICs9IChkZW5zWyhrbWl0ICsgNCkgKiBucmQgKyBpXSAvIHNjYWxbaWNvbVtpXV0pICoqIDJcbiAgICAgICAgICAgIGVycmludCA9IE1hdGguc3FydChlcnJpbnQgLyBucmQpICogZXJyZmFjW2ttaXRdXG4gICAgICAgICAgICBob3B0ZGUgPSBoIC8gTWF0aC5tYXgoZXJyaW50ICoqICgxIC8gKGttaXQgKyA0KSksIDAuMDEpXG4gICAgICAgICAgICBpZiAoZXJyaW50ID4gMTApIHtcbiAgICAgICAgICAgICAgaCA9IGhvcHRkZVxuICAgICAgICAgICAgICB4ID0geE9sZFxuICAgICAgICAgICAgICArK25SZWplY3RcbiAgICAgICAgICAgICAgcmVqZWN0ID0gdHJ1ZVxuICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBuOyArK2kpIGR6W2ldID0geWgyW2ldXG4gICAgICAgIH1cbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbjsgKytpKSB5W2ldID0gdFsxXVtpXVxuICAgICAgICArK25BY2NlcHRcbiAgICAgICAgaWYgKHNvbE91dCkge1xuICAgICAgICAgIC8vIElmIGRlbnNlT3V0cHV0LCB3ZSBhbHNvIHdhbnQgdG8gc3VwcGx5IHRoZSBkZW5zZSBjbG9zdXJlLlxuICAgICAgICAgIGlmIChzb2xPdXQobkFjY2VwdCArIDEsIHhPbGQsIHgsIHkuc2xpY2UoMSksXG4gICAgICAgICAgICAgIHRoaXMuZGVuc2VPdXRwdXQgJiYgY29udGV4KHhPbGRkLCBoaGgsIGttaXQsIGRlbnMsIGljb20pKSA9PT0gZmFsc2UpIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgICAgIC8vIGNvbXB1dGUgb3B0aW1hbCBvcmRlclxuICAgICAgICBsZXQga29wdDogbnVtYmVyXG4gICAgICAgIGlmIChrYyA9PT0gMikge1xuICAgICAgICAgIGtvcHQgPSBNYXRoLm1pbigzLCBrbSAtIDEpXG4gICAgICAgICAgaWYgKHJlamVjdCkga29wdCA9IDJcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoa2MgPD0gaykge1xuICAgICAgICAgICAga29wdCA9IGtjXG4gICAgICAgICAgICBpZiAod1trYyAtIDFdIDwgd1trY10gKiB0aGlzLnN0ZXBTaXplRmFjMykga29wdCA9IGtjIC0gMVxuICAgICAgICAgICAgaWYgKHdba2NdIDwgd1trYyAtIDFdICogdGhpcy5zdGVwU2l6ZUZhYzQpIGtvcHQgPSBNYXRoLm1pbihrYyArIDEsIGttIC0gMSlcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAga29wdCA9IGtjIC0gMVxuICAgICAgICAgICAgaWYgKGtjID4gMyAmJiB3W2tjIC0gMl0gPCB3W2tjIC0gMV0gKiB0aGlzLnN0ZXBTaXplRmFjMykga29wdCA9IGtjIC0gMlxuICAgICAgICAgICAgaWYgKHdba2NdIDwgd1trb3B0XSAqIHRoaXMuc3RlcFNpemVGYWM0KSBrb3B0ID0gTWF0aC5taW4oa2MsIGttIC0gMSlcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gYWZ0ZXIgYSByZWplY3RlZCBzdGVwXG4gICAgICAgIGlmIChyZWplY3QpIHtcbiAgICAgICAgICBrID0gTWF0aC5taW4oa29wdCwga2MpXG4gICAgICAgICAgaCA9IHBvc25lZyAqIE1hdGgubWluKE1hdGguYWJzKGgpLCBNYXRoLmFicyhoaFtrXSkpXG4gICAgICAgICAgcmVqZWN0ID0gZmFsc2VcbiAgICAgICAgICByZXR1cm4gdHJ1ZSAgLy8gZ290byAxMFxuICAgICAgICB9XG4gICAgICAgIGlmIChrb3B0IDw9IGtjKSB7XG4gICAgICAgICAgaCA9IGhoW2tvcHRdXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKGtjIDwgayAmJiB3W2tjXSA8IHdba2MgLSAxXSAqIHRoaXMuc3RlcFNpemVGYWM0KSB7XG4gICAgICAgICAgICBoID0gaGhba2NdICogYVtrb3B0ICsgMV0gLyBhW2tjXVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBoID0gaGhba2NdICogYVtrb3B0XSAvIGFba2NdXG4gICAgICAgICAgfVxuXG5cbiAgICAgICAgfVxuICAgICAgICAvLyBjb21wdXRlIHN0ZXBzaXplIGZvciBuZXh0IHN0ZXBcbiAgICAgICAgayA9IGtvcHRcbiAgICAgICAgaCA9IHBvc25lZyAqIE1hdGguYWJzKGgpXG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICB9XG5cbiAgICAgIGxldCBtaWRleCA9IChqOiBudW1iZXIpOiB2b2lkID0+IHtcbiAgICAgICAgY29uc3QgZHkgPSBTb2x2ZXIuZGltKHRoaXMubilcbiAgICAgICAgLy8gQ29tcHV0ZXMgdGhlIGp0aCBsaW5lIG9mIHRoZSBleHRyYXBvbGF0aW9uIHRhYmxlIGFuZFxuICAgICAgICAvLyBwcm92aWRlcyBhbiBlc3RpbWF0aW9uIG9mIHRoZSBvcHRpb25hbCBzdGVwc2l6ZVxuICAgICAgICBjb25zdCBoaiA9IGggLyBualtqXVxuICAgICAgICAvLyBFdWxlciBzdGFydGluZyBzdGVwXG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IHRoaXMubjsgKytpKSB7XG4gICAgICAgICAgeWgxW2ldID0geVtpXVxuICAgICAgICAgIHloMltpXSA9IHlbaV0gKyBoaiAqIGR6W2ldXG4gICAgICAgIH1cbiAgICAgICAgLy8gRXhwbGljaXQgbWlkcG9pbnQgcnVsZVxuICAgICAgICBjb25zdCBtID0gbmpbal0gLSAxXG4gICAgICAgIGNvbnN0IG5qTWlkID0gKG5qW2pdIC8gMikgfCAwXG4gICAgICAgIGZvciAobGV0IG1tID0gMTsgbW0gPD0gbTsgKyttbSkge1xuICAgICAgICAgIGlmICh0aGlzLmRlbnNlT3V0cHV0ICYmIG1tID09PSBuak1pZCkge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbnJkOyArK2kpIHtcbiAgICAgICAgICAgICAgeVNhZmVbal1baV0gPSB5aDJbaWNvbVtpXV1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgRih4ICsgaGogKiBtbSwgeWgyLCBkeSlcbiAgICAgICAgICBpZiAodGhpcy5kZW5zZU91dHB1dCAmJiBNYXRoLmFicyhtbSAtIG5qTWlkKSA8PSAyICogaiAtIDEpIHtcbiAgICAgICAgICAgICsraVB0XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBucmQ7ICsraSkge1xuICAgICAgICAgICAgICBmU2FmZVtpUHRdW2ldID0gZHlbaWNvbVtpXV1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gdGhpcy5uOyArK2kpIHtcbiAgICAgICAgICAgIGxldCB5cyA9IHloMVtpXVxuICAgICAgICAgICAgeWgxW2ldID0geWgyW2ldXG4gICAgICAgICAgICB5aDJbaV0gPSB5cyArIDIgKiBoaiAqIGR5W2ldXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChtbSA8PSB0aGlzLnN0YWJpbGl0eUNoZWNrQ291bnQgJiYgaiA8PSB0aGlzLnN0YWJpbGl0eUNoZWNrVGFibGVMaW5lcykge1xuICAgICAgICAgICAgLy8gc3RhYmlsaXR5IGNoZWNrXG4gICAgICAgICAgICBsZXQgZGVsMSA9IDBcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IHRoaXMubjsgKytpKSB7XG4gICAgICAgICAgICAgIGRlbDEgKz0gKGR6W2ldIC8gc2NhbFtpXSkgKiogMlxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IGRlbDIgPSAwXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSB0aGlzLm47ICsraSkge1xuICAgICAgICAgICAgICBkZWwyICs9ICgoZHlbaV0gLSBkeltpXSkgLyBzY2FsW2ldKSAqKiAyXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBxdW90ID0gZGVsMiAvIE1hdGgubWF4KHRoaXMudVJvdW5kLCBkZWwxKVxuICAgICAgICAgICAgaWYgKHF1b3QgPiA0KSB7XG4gICAgICAgICAgICAgICsrbkV2YWxcbiAgICAgICAgICAgICAgYXRvdiA9IHRydWVcbiAgICAgICAgICAgICAgaCAqPSB0aGlzLnN0ZXBTaXplUmVkdWN0aW9uRmFjdG9yXG4gICAgICAgICAgICAgIHJlamVjdCA9IHRydWVcbiAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIGZpbmFsIHNtb290aGluZyBzdGVwXG4gICAgICAgIEYoeCArIGgsIHloMiwgZHkpXG4gICAgICAgIGlmICh0aGlzLmRlbnNlT3V0cHV0ICYmIG5qTWlkIDw9IDIgKiBqIC0gMSkge1xuICAgICAgICAgICsraVB0XG4gICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbnJkOyArK2kpIHtcbiAgICAgICAgICAgIGZTYWZlW2lQdF1baV0gPSBkeVtpY29tW2ldXVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSB0aGlzLm47ICsraSkge1xuICAgICAgICAgIHRbal1baV0gPSAoeWgxW2ldICsgeWgyW2ldICsgaGogKiBkeVtpXSkgLyAyXG4gICAgICAgIH1cbiAgICAgICAgbkV2YWwgKz0gbmpbal1cbiAgICAgICAgLy8gcG9seW5vbWlhbCBleHRyYXBvbGF0aW9uXG4gICAgICAgIGlmIChqID09PSAxKSByZXR1cm4gIC8vIHdhcyBqLmVxLjFcbiAgICAgICAgY29uc3QgZGJsZW5qID0gbmpbal1cbiAgICAgICAgbGV0IGZhYzogbnVtYmVyXG4gICAgICAgIGZvciAobGV0IGwgPSBqOyBsID4gMTsgLS1sKSB7XG4gICAgICAgICAgZmFjID0gKGRibGVuaiAvIG5qW2wgLSAxXSkgKiogMiAtIDFcbiAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSB0aGlzLm47ICsraSkge1xuICAgICAgICAgICAgdFtsIC0gMV1baV0gPSB0W2xdW2ldICsgKHRbbF1baV0gLSB0W2wgLSAxXVtpXSkgLyBmYWNcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZXJyID0gMFxuICAgICAgICAvLyBzY2FsaW5nXG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IHRoaXMubjsgKytpKSB7XG4gICAgICAgICAgbGV0IHQxaSA9IE1hdGgubWF4KE1hdGguYWJzKHlbaV0pLCBNYXRoLmFicyh0WzFdW2ldKSlcbiAgICAgICAgICBzY2FsW2ldID0gYVRvbFtpXSArIHJUb2xbaV0gKiB0MWlcbiAgICAgICAgICBlcnIgKz0gKCh0WzFdW2ldIC0gdFsyXVtpXSkgLyBzY2FsW2ldKSAqKiAyXG4gICAgICAgIH1cbiAgICAgICAgZXJyID0gTWF0aC5zcXJ0KGVyciAvIHRoaXMubilcbiAgICAgICAgaWYgKGVyciAqIHRoaXMudVJvdW5kID49IDEgfHwgKGogPiAyICYmIGVyciA+PSBlcnJPbGQpKSB7XG4gICAgICAgICAgYXRvdiA9IHRydWVcbiAgICAgICAgICBoICo9IHRoaXMuc3RlcFNpemVSZWR1Y3Rpb25GYWN0b3JcbiAgICAgICAgICByZWplY3QgPSB0cnVlXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgZXJyT2xkID0gTWF0aC5tYXgoNCAqIGVyciwgMSlcbiAgICAgICAgLy8gY29tcHV0ZSBvcHRpbWFsIHN0ZXBzaXplc1xuICAgICAgICBsZXQgZXhwMCA9IDEgLyAoMiAqIGogLSAxKVxuICAgICAgICBsZXQgZmFjTWluID0gdGhpcy5zdGVwU2l6ZUZhYzEgKiogZXhwMFxuICAgICAgICBmYWMgPSBNYXRoLm1pbih0aGlzLnN0ZXBTaXplRmFjMiAvIGZhY01pbixcbiAgICAgICAgICBNYXRoLm1heChmYWNNaW4sIChlcnIgLyB0aGlzLnN0ZXBTYWZldHlGYWN0b3IxKSAqKiBleHAwIC8gdGhpcy5zdGVwU2FmZXR5RmFjdG9yMikpXG4gICAgICAgIGZhYyA9IDEgLyBmYWNcbiAgICAgICAgaGhbal0gPSBNYXRoLm1pbihNYXRoLmFicyhoKSAqIGZhYywgaE1heClcbiAgICAgICAgd1tqXSA9IGFbal0gLyBoaFtqXVxuICAgICAgfVxuXG4gICAgICBjb25zdCBpbnRlcnAgPSAobjogbnVtYmVyLCB5OiBudW1iZXJbXSwgaW1pdDogbnVtYmVyKSA9PiB7XG4gICAgICAgIC8vIGNvbXB1dGVzIHRoZSBjb2VmZmljaWVudHMgb2YgdGhlIGludGVycG9sYXRpb24gZm9ybXVsYVxuICAgICAgICBsZXQgYSA9IG5ldyBBcnJheSgzMSkgIC8vIHplcm8tYmFzZWQ6IDA6MzBcbiAgICAgICAgLy8gYmVnaW4gd2l0aCBIZXJtaXRlIGludGVycG9sYXRpb25cbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbjsgKytpKSB7XG4gICAgICAgICAgbGV0IHkwID0geVtpXVxuICAgICAgICAgIGxldCB5MSA9IHlbMiAqIG4gKyBpXVxuICAgICAgICAgIGxldCB5cDAgPSB5W24gKyBpXVxuICAgICAgICAgIGxldCB5cDEgPSB5WzMgKiBuICsgaV1cbiAgICAgICAgICBsZXQgeURpZmYgPSB5MSAtIHkwXG4gICAgICAgICAgbGV0IGFzcGwgPSAteXAxICsgeURpZmZcbiAgICAgICAgICBsZXQgYnNwbCA9IHlwMCAtIHlEaWZmXG4gICAgICAgICAgeVtuICsgaV0gPSB5RGlmZlxuICAgICAgICAgIHlbMiAqIG4gKyBpXSA9IGFzcGxcbiAgICAgICAgICB5WzMgKiBuICsgaV0gPSBic3BsXG4gICAgICAgICAgaWYgKGltaXQgPCAwKSBjb250aW51ZVxuICAgICAgICAgIC8vIGNvbXB1dGUgdGhlIGRlcml2YXRpdmVzIG9mIEhlcm1pdGUgYXQgbWlkcG9pbnRcbiAgICAgICAgICBsZXQgcGgwID0gKHkwICsgeTEpICogMC41ICsgMC4xMjUgKiAoYXNwbCArIGJzcGwpXG4gICAgICAgICAgbGV0IHBoMSA9IHlEaWZmICsgKGFzcGwgLSBic3BsKSAqIDAuMjVcbiAgICAgICAgICBsZXQgcGgyID0gLSh5cDAgLSB5cDEpXG4gICAgICAgICAgbGV0IHBoMyA9IDYgKiAoYnNwbCAtIGFzcGwpXG4gICAgICAgICAgLy8gY29tcHV0ZSB0aGUgZnVydGhlciBjb2VmZmljaWVudHNcbiAgICAgICAgICBpZiAoaW1pdCA+PSAxKSB7XG4gICAgICAgICAgICBhWzFdID0gMTYgKiAoeVs1ICogbiArIGldIC0gcGgxKVxuICAgICAgICAgICAgaWYgKGltaXQgPj0gMykge1xuICAgICAgICAgICAgICBhWzNdID0gMTYgKiAoeVs3ICogbiArIGldIC0gcGgzICsgMyAqIGFbMV0pXG4gICAgICAgICAgICAgIGlmIChpbWl0ID49IDUpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpbSA9IDU7IGltIDw9IGltaXQ7IGltICs9IDIpIHtcbiAgICAgICAgICAgICAgICAgIGxldCBmYWMxID0gaW0gKiAoaW0gLSAxKSAvIDJcbiAgICAgICAgICAgICAgICAgIGxldCBmYWMyID0gZmFjMSAqIChpbSAtIDIpICogKGltIC0gMykgKiAyXG4gICAgICAgICAgICAgICAgICBhW2ltXSA9IDE2ICogKHlbKGltICsgNCkgKiBuICsgaV0gKyBmYWMxICogYVtpbSAtIDJdIC0gZmFjMiAqIGFbaW0gLSA0XSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYVswXSA9ICh5WzQgKiBuICsgaV0gLSBwaDApICogMTZcbiAgICAgICAgICBpZiAoaW1pdCA+PSAyKSB7XG4gICAgICAgICAgICBhWzJdID0gKHlbbiAqIDYgKyBpXSAtIHBoMiArIGFbMF0pICogMTZcbiAgICAgICAgICAgIGlmIChpbWl0ID49IDQpIHtcbiAgICAgICAgICAgICAgZm9yIChsZXQgaW0gPSA0OyBpbSA8PSBpbWl0OyBpbSArPSAyKSB7XG4gICAgICAgICAgICAgICAgbGV0IGZhYzEgPSBpbSAqIChpbSAtIDEpIC8gMlxuICAgICAgICAgICAgICAgIGxldCBmYWMyID0gaW0gKiAoaW0gLSAxKSAqIChpbSAtIDIpICogKGltIC0gMylcbiAgICAgICAgICAgICAgICBhW2ltXSA9ICh5W24gKiAoaW0gKyA0KSArIGldICsgYVtpbSAtIDJdICogZmFjMSAtIGFbaW0gLSA0XSAqIGZhYzIpICogMTZcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBmb3IgKGxldCBpbSA9IDA7IGltIDw9IGltaXQ7ICsraW0pIHlbbiAqIChpbSArIDQpICsgaV0gPSBhW2ltXVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNvbnRleCA9ICh4T2xkOiBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgaDogbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgIGltaXQ6IG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICB5OiBudW1iZXJbXSxcbiAgICAgICAgICAgICAgICAgICAgICBpY29tOiBudW1iZXJbXSkgPT4ge1xuICAgICAgICByZXR1cm4gKGM6IG51bWJlciwgeDogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgbGV0IGkgPSAwXG4gICAgICAgICAgZm9yIChsZXQgaiA9IDE7IGogPD0gbnJkOyArK2opIHtcbiAgICAgICAgICAgIC8vIGNhcmVmdWw6IGN1c3RvbWVycyBkZXNjcmliZSBjb21wb25lbnRzIDAtYmFzZWQuIFdlIHJlY29yZCBpbmRpY2VzIDEtYmFzZWQuXG4gICAgICAgICAgICBpZiAoaWNvbVtqXSA9PT0gYyArIDEpIGkgPSBqXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChpID09PSAwKSB0aHJvdyBuZXcgRXJyb3IoJ25vIGRlbnNlIG91dHB1dCBhdmFpbGFibGUgZm9yIGNvbXBvbmVudCAnICsgYylcbiAgICAgICAgICBjb25zdCB0aGV0YSA9ICh4IC0geE9sZCkgLyBoXG4gICAgICAgICAgY29uc3QgdGhldGExID0gMSAtIHRoZXRhXG4gICAgICAgICAgY29uc3QgcGh0aGV0ID0geVtpXSArIHRoZXRhICogKHlbbnJkICsgaV0gKyB0aGV0YTEgKiAoeVsyICogbnJkICsgaV0gKiB0aGV0YSArIHlbMyAqIG5yZCArIGldICogdGhldGExKSlcbiAgICAgICAgICBpZiAoaW1pdCA8IDApIHJldHVybiBwaHRoZXRcbiAgICAgICAgICBjb25zdCB0aGV0YWggPSB0aGV0YSAtIDAuNVxuICAgICAgICAgIGxldCByZXQgPSB5W25yZCAqIChpbWl0ICsgNCkgKyBpXVxuICAgICAgICAgIGZvciAobGV0IGltID0gaW1pdDsgaW0gPj0gMTsgLS1pbSkge1xuICAgICAgICAgICAgcmV0ID0geVtucmQgKiAoaW0gKyAzKSArIGldICsgcmV0ICogdGhldGFoIC8gaW1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHBodGhldCArICh0aGV0YSAqIHRoZXRhMSkgKiogMiAqIHJldFxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIHByZXBhcmF0aW9uXG4gICAgICBjb25zdCB5U2FmZSA9IFNvbHZlci5kaW0yKGttLCBucmQpXG4gICAgICBjb25zdCBoaCA9IFNvbHZlci5kaW0oa20pXG4gICAgICBjb25zdCB0ID0gU29sdmVyLmRpbTIoa20sIHRoaXMubilcbiAgICAgIC8vIERlZmluZSB0aGUgc3RlcCBzaXplIHNlcXVlbmNlXG4gICAgICBjb25zdCBuaiA9IFNvbHZlci5zdGVwU2l6ZVNlcXVlbmNlKG5TZXEsIGttKVxuICAgICAgLy8gRGVmaW5lIHRoZSBhW2ldIGZvciBvcmRlciBzZWxlY3Rpb25cbiAgICAgIGNvbnN0IGEgPSBTb2x2ZXIuZGltKGttKVxuICAgICAgYVsxXSA9IDEgKyBualsxXVxuICAgICAgZm9yIChsZXQgaSA9IDI7IGkgPD0ga207ICsraSkge1xuICAgICAgICBhW2ldID0gYVtpIC0gMV0gKyBualtpXVxuICAgICAgfVxuICAgICAgLy8gSW5pdGlhbCBTY2FsaW5nXG4gICAgICBjb25zdCBzY2FsID0gU29sdmVyLmRpbSh0aGlzLm4pXG4gICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSB0aGlzLm47ICsraSkge1xuICAgICAgICBzY2FsW2ldID0gYVRvbFtpXSArIHJUb2xbaV0gKyBNYXRoLmFicyh5W2ldKVxuICAgICAgfVxuICAgICAgLy8gSW5pdGlhbCBwcmVwYXJhdGlvbnNcbiAgICAgIGNvbnN0IHBvc25lZyA9IHhFbmQgLSB4ID49IDAgPyAxIDogLTFcbiAgICAgIGxldCBrID0gTWF0aC5tYXgoMiwgTWF0aC5taW4oa20gLSAxLCBNYXRoLmZsb29yKC1Tb2x2ZXIubG9nMTAoclRvbFsxXSArIDFlLTQwKSAqIDAuNiArIDEuNSkpKVxuICAgICAgbGV0IGggPSBNYXRoLm1heChNYXRoLmFicyh0aGlzLmluaXRpYWxTdGVwU2l6ZSksIDFlLTQpXG4gICAgICBoID0gcG9zbmVnICogTWF0aC5taW4oaCwgaE1heCwgTWF0aC5hYnMoeEVuZCAtIHgpIC8gMilcbiAgICAgIGNvbnN0IGlQb2ludCA9IFNvbHZlci5kaW0oa20gKyAxKVxuICAgICAgY29uc3QgZXJyZmFjID0gU29sdmVyLmRpbSgyICoga20pXG4gICAgICBsZXQgeE9sZCA9IHhcbiAgICAgIGxldCBpUHQgPSAwXG4gICAgICBpZiAoc29sT3V0KSB7XG4gICAgICAgIGlmICh0aGlzLmRlbnNlT3V0cHV0KSB7XG4gICAgICAgICAgaVBvaW50WzFdID0gMFxuICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IGttOyArK2kpIHtcbiAgICAgICAgICAgIGxldCBuakFkZCA9IDQgKiBpIC0gMlxuICAgICAgICAgICAgaWYgKG5qW2ldID4gbmpBZGQpICsrbmpBZGRcbiAgICAgICAgICAgIGlQb2ludFtpICsgMV0gPSBpUG9pbnRbaV0gKyBuakFkZFxuICAgICAgICAgIH1cbiAgICAgICAgICBmb3IgKGxldCBtdSA9IDE7IG11IDw9IDIgKiBrbTsgKyttdSkge1xuICAgICAgICAgICAgbGV0IGVycnggPSBNYXRoLnNxcnQobXUgLyAobXUgKyA0KSkgKiAwLjVcbiAgICAgICAgICAgIGxldCBwcm9kID0gKDEgLyAobXUgKyA0KSkgKiogMlxuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDE7IGogPD0gbXU7ICsraikgcHJvZCAqPSBlcnJ4IC8galxuICAgICAgICAgICAgZXJyZmFjW211XSA9IHByb2RcbiAgICAgICAgICB9XG4gICAgICAgICAgaVB0ID0gMFxuICAgICAgICB9XG4gICAgICAgIC8vIGNoZWNrIHJldHVybiB2YWx1ZSBhbmQgYWJhbmRvbiBpbnRlZ3JhdGlvbiBpZiBjYWxsZWQgZm9yXG4gICAgICAgIGlmIChmYWxzZSA9PT0gc29sT3V0KG5BY2NlcHQgKyAxLCB4T2xkLCB4LCB5LnNsaWNlKDEpKSkge1xuICAgICAgICAgIHJldHVybiBPdXRjb21lLkVhcmx5UmV0dXJuXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGxldCBlcnIgPSAwXG4gICAgICBsZXQgZXJyT2xkID0gMWUxMFxuICAgICAgbGV0IGhvcHRkZSA9IHBvc25lZyAqIGhNYXhcbiAgICAgIGNvbnN0IHcgPSBTb2x2ZXIuZGltKGttKVxuICAgICAgd1sxXSA9IDBcbiAgICAgIGxldCByZWplY3QgPSBmYWxzZVxuICAgICAgbGV0IGxhc3QgPSBmYWxzZVxuICAgICAgbGV0IGF0b3Y6IGJvb2xlYW5cbiAgICAgIGxldCBrYyA9IDBcblxuICAgICAgZW51bSBTVEFURSB7XG4gICAgICAgIFN0YXJ0LCBCYXNpY0ludGVncmF0aW9uU3RlcCwgQ29udmVyZ2VuY2VTdGVwLCBIb3BlRm9yQ29udmVyZ2VuY2UsIEFjY2VwdCwgUmVqZWN0XG4gICAgICB9XG4gICAgICBsZXQgc3RhdGU6IFNUQVRFID0gU1RBVEUuU3RhcnRcblxuICAgICAgbG9vcDogd2hpbGUgKHRydWUpIHtcbiAgICAgICAgdGhpcy5kZWJ1ZyAmJiBjb25zb2xlLmxvZygnU1RBVEUnLCBTVEFURVtzdGF0ZV0sIG5TdGVwLCB4T2xkLCB4LCBoLCBrLCBrYywgaG9wdGRlKVxuICAgICAgICBzd2l0Y2ggKHN0YXRlKSB7XG4gICAgICAgICAgY2FzZSBTVEFURS5TdGFydDpcbiAgICAgICAgICAgIGF0b3YgPSBmYWxzZVxuICAgICAgICAgICAgLy8gSXMgeEVuZCByZWFjaGVkIGluIHRoZSBuZXh0IHN0ZXA/XG4gICAgICAgICAgICBpZiAoMC4xICogTWF0aC5hYnMoeEVuZCAtIHgpIDw9IE1hdGguYWJzKHgpICogdGhpcy51Um91bmQpIGJyZWFrIGxvb3BcbiAgICAgICAgICAgIGggPSBwb3NuZWcgKiBNYXRoLm1pbihNYXRoLmFicyhoKSwgTWF0aC5hYnMoeEVuZCAtIHgpLCBoTWF4LCBNYXRoLmFicyhob3B0ZGUpKVxuICAgICAgICAgICAgaWYgKCh4ICsgMS4wMSAqIGggLSB4RW5kKSAqIHBvc25lZyA+IDApIHtcbiAgICAgICAgICAgICAgaCA9IHhFbmQgLSB4XG4gICAgICAgICAgICAgIGxhc3QgPSB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoblN0ZXAgPT09IDAgfHwgIXRoaXMuZGVuc2VPdXRwdXQpIHtcbiAgICAgICAgICAgICAgRih4LCB5LCBkeilcbiAgICAgICAgICAgICAgKytuRXZhbFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gVGhlIGZpcnN0IGFuZCBsYXN0IHN0ZXBcbiAgICAgICAgICAgIGlmIChuU3RlcCA9PT0gMCB8fCBsYXN0KSB7XG4gICAgICAgICAgICAgIGlQdCA9IDBcbiAgICAgICAgICAgICAgKytuU3RlcFxuICAgICAgICAgICAgICBmb3IgKGxldCBqID0gMTsgaiA8PSBrOyArK2opIHtcbiAgICAgICAgICAgICAgICBrYyA9IGpcbiAgICAgICAgICAgICAgICBtaWRleChqKVxuICAgICAgICAgICAgICAgIGlmIChhdG92KSBjb250aW51ZSBsb29wXG4gICAgICAgICAgICAgICAgaWYgKGogPiAxICYmIGVyciA8PSAxKSB7XG4gICAgICAgICAgICAgICAgICBzdGF0ZSA9IFNUQVRFLkFjY2VwdFxuICAgICAgICAgICAgICAgICAgY29udGludWUgbG9vcFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBzdGF0ZSA9IFNUQVRFLkhvcGVGb3JDb252ZXJnZW5jZVxuICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3RhdGUgPSBTVEFURS5CYXNpY0ludGVncmF0aW9uU3RlcFxuICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgIGNhc2UgU1RBVEUuQmFzaWNJbnRlZ3JhdGlvblN0ZXA6XG4gICAgICAgICAgICAvLyBiYXNpYyBpbnRlZ3JhdGlvbiBzdGVwXG4gICAgICAgICAgICBpUHQgPSAwXG4gICAgICAgICAgICArK25TdGVwXG4gICAgICAgICAgICBpZiAoblN0ZXAgPj0gdGhpcy5tYXhTdGVwcykge1xuICAgICAgICAgICAgICByZXR1cm4gT3V0Y29tZS5NYXhTdGVwc0V4Y2VlZGVkXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBrYyA9IGsgLSAxXG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMTsgaiA8PSBrYzsgKytqKSB7XG4gICAgICAgICAgICAgIG1pZGV4KGopXG4gICAgICAgICAgICAgIGlmIChhdG92KSB7XG4gICAgICAgICAgICAgICAgc3RhdGUgPSBTVEFURS5TdGFydFxuICAgICAgICAgICAgICAgIGNvbnRpbnVlIGxvb3BcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gY29udmVyZ2VuY2UgbW9uaXRvclxuICAgICAgICAgICAgaWYgKGsgPT09IDIgfHwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgIHN0YXRlID0gU1RBVEUuQ29udmVyZ2VuY2VTdGVwXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBpZiAoZXJyIDw9IDEpIHtcbiAgICAgICAgICAgICAgICBzdGF0ZSA9IFNUQVRFLkFjY2VwdFxuICAgICAgICAgICAgICB9IGVsc2UgaWYgKGVyciA+ICgobmpbayArIDFdICogbmpba10pIC8gNCkgKiogMikge1xuICAgICAgICAgICAgICAgIHN0YXRlID0gU1RBVEUuUmVqZWN0XG4gICAgICAgICAgICAgIH0gZWxzZSBzdGF0ZSA9IFNUQVRFLkNvbnZlcmdlbmNlU3RlcFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgIGNhc2UgU1RBVEUuQ29udmVyZ2VuY2VTdGVwOiAgLy8gbGFiZWwgNTBcbiAgICAgICAgICAgIG1pZGV4KGspXG4gICAgICAgICAgICBpZiAoYXRvdikge1xuICAgICAgICAgICAgICBzdGF0ZSA9IFNUQVRFLlN0YXJ0XG4gICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBrYyA9IGtcbiAgICAgICAgICAgIGlmIChlcnIgPD0gMSkge1xuICAgICAgICAgICAgICBzdGF0ZSA9IFNUQVRFLkFjY2VwdFxuICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3RhdGUgPSBTVEFURS5Ib3BlRm9yQ29udmVyZ2VuY2VcbiAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICBjYXNlIFNUQVRFLkhvcGVGb3JDb252ZXJnZW5jZTpcbiAgICAgICAgICAgIC8vIGhvcGUgZm9yIGNvbnZlcmdlbmNlIGluIGxpbmUgayArIDFcbiAgICAgICAgICAgIGlmIChlcnIgPiAobmpbayArIDFdIC8gMikgKiogMikge1xuICAgICAgICAgICAgICBzdGF0ZSA9IFNUQVRFLlJlamVjdFxuICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAga2MgPSBrICsgMVxuICAgICAgICAgICAgbWlkZXgoa2MpXG4gICAgICAgICAgICBpZiAoYXRvdikgc3RhdGUgPSBTVEFURS5TdGFydFxuICAgICAgICAgICAgZWxzZSBpZiAoZXJyID4gMSkgc3RhdGUgPSBTVEFURS5SZWplY3RcbiAgICAgICAgICAgIGVsc2Ugc3RhdGUgPSBTVEFURS5BY2NlcHRcbiAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICBjYXNlIFNUQVRFLkFjY2VwdDpcbiAgICAgICAgICAgIGlmICghYWNjZXB0U3RlcCh0aGlzLm4pKSByZXR1cm4gT3V0Y29tZS5FYXJseVJldHVyblxuICAgICAgICAgICAgc3RhdGUgPSBTVEFURS5TdGFydFxuICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgIGNhc2UgU1RBVEUuUmVqZWN0OlxuICAgICAgICAgICAgayA9IE1hdGgubWluKGssIGtjLCBrbSAtIDEpXG4gICAgICAgICAgICBpZiAoayA+IDIgJiYgd1trIC0gMV0gPCB3W2tdICogdGhpcy5zdGVwU2l6ZUZhYzMpIGsgLT0gMVxuICAgICAgICAgICAgKytuUmVqZWN0XG4gICAgICAgICAgICBoID0gcG9zbmVnICogaGhba11cbiAgICAgICAgICAgIHJlamVjdCA9IHRydWVcbiAgICAgICAgICAgIHN0YXRlID0gU1RBVEUuQmFzaWNJbnRlZ3JhdGlvblN0ZXBcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIE91dGNvbWUuQ29udmVyZ2VkXG4gICAgfVxuXG4gICAgY29uc3Qgb3V0Y29tZSA9IG9keGNvcigpXG4gICAgcmV0dXJuIHtcbiAgICAgIHk6IHkuc2xpY2UoMSksXG4gICAgICBvdXRjb21lOiBvdXRjb21lLFxuICAgICAgblN0ZXA6IG5TdGVwLFxuICAgICAgeEVuZDogeEVuZCxcbiAgICAgIG5BY2NlcHQ6IG5BY2NlcHQsXG4gICAgICBuUmVqZWN0OiBuUmVqZWN0LFxuICAgICAgbkV2YWw6IG5FdmFsXG4gICAgfVxuICB9XG59XG4iLCIvKipcbiAgKiBDcmVhdGVkIGJ5IGNvbGluIG9uIDYvMTQvMTYuXG4gICogaHR0cDovL2xpdHRsZXJlZGNvbXB1dGVyLmdpdGh1Yi5pb1xuICAqL1xuXG5pbXBvcnQge1NvbHZlciwgRGVyaXZhdGl2ZX0gZnJvbSAnb2RleC9zcmMvb2RleCdcblxuaW50ZXJmYWNlIEhhbWlsdG9uTWFwIHtcbiAgZ2VuZXJhdGVTZWN0aW9uKGluaXRpYWxEYXRhOiBudW1iZXJbXSwgbjogbnVtYmVyLCBjYWxsYmFjazogKHg6IG51bWJlciwgeTogbnVtYmVyKSA9PiB2b2lkKTogdm9pZFxufVxuXG5pbnRlcmZhY2UgRGlmZmVyZW50aWFsRXF1YXRpb24ge1xuICBldm9sdmUocGFyYW1zOiB7fSwgaW5pdGlhbERhdGE6IG51bWJlcltdLCB0MTogbnVtYmVyLCBkdDogbnVtYmVyLCBjYWxsYmFjazogKHQ6IG51bWJlciwgeTogbnVtYmVyW10pID0+IHZvaWQpOiB2b2lkXG59XG5cbmNvbnN0IHR3b1BpID0gTWF0aC5QSSAqIDJcblxuZXhwb3J0IGNsYXNzIFN0YW5kYXJkTWFwIGltcGxlbWVudHMgSGFtaWx0b25NYXAge1xuICBLOiBudW1iZXJcbiAgUFY6ICh4OiBudW1iZXIpID0+IG51bWJlclxuICBzdGF0aWMgdHdvUGkgPSAyICogTWF0aC5QSVxuXG4gIGNvbnN0cnVjdG9yKEs6IG51bWJlcikge1xuICAgIHRoaXMuSyA9IEtcbiAgICB0aGlzLlBWID0gU3RhbmRhcmRNYXAucHJpbmNpcGFsX3ZhbHVlKHR3b1BpKVxuICB9XG5cbiAgc3RhdGljIHByaW5jaXBhbF92YWx1ZShjdXRIaWdoOiBudW1iZXIpOiAodjogbnVtYmVyKSA9PiBudW1iZXIge1xuICAgIGNvbnN0IGN1dExvdyA9IGN1dEhpZ2ggLSB0d29QaVxuICAgIHJldHVybiBmdW5jdGlvbiAoeDogbnVtYmVyKSB7XG4gICAgICBpZiAoY3V0TG93IDw9IHggJiYgeCA8IGN1dEhpZ2gpIHtcbiAgICAgICAgcmV0dXJuIHhcbiAgICAgIH1cbiAgICAgIGNvbnN0IHkgPSB4IC0gdHdvUGkgKiBNYXRoLmZsb29yKHggLyB0d29QaSlcbiAgICAgIHJldHVybiB5IDwgY3V0SGlnaCA/IHkgOiB5IC0gdHdvUGlcbiAgICB9XG4gIH1cblxuICBnZW5lcmF0ZVNlY3Rpb24oaW5pdGlhbERhdGE6IG51bWJlcltdLCBuOiBudW1iZXIsIGNhbGxiYWNrOiAoeDogbnVtYmVyLCB5OiBudW1iZXIpID0+IHZvaWQpIHtcbiAgICBsZXQgW3RoZXRhLCBJXSA9IGluaXRpYWxEYXRhXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgIGNhbGxiYWNrKHRoZXRhLCBJKVxuICAgICAgbGV0IG5JID0gSSArICh0aGlzLksgKiBNYXRoLnNpbih0aGV0YSkpXG4gICAgICB0aGV0YSA9IHRoaXMuUFYodGhldGEgKyBuSSlcbiAgICAgIEkgPSB0aGlzLlBWKG5JKVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRHJpdmVuUGVuZHVsdW1NYXAgaW1wbGVtZW50cyBIYW1pbHRvbk1hcCwgRGlmZmVyZW50aWFsRXF1YXRpb24ge1xuXG4gIHBhcmFtZm46ICgpID0+IHthOiBudW1iZXIsIG9tZWdhOiBudW1iZXJ9XG4gIFM6IFNvbHZlclxuICBQVjogKHg6IG51bWJlcikgPT4gbnVtYmVyXG5cbiAgSGFtaWx0b25TeXNkZXIobTogbnVtYmVyLCBsOiBudW1iZXIsIG9tZWdhOiBudW1iZXIsIGE6IG51bWJlciwgZzogbnVtYmVyKTogRGVyaXZhdGl2ZSB7XG4gICAgcmV0dXJuICh4LCBbdCwgdGhldGEsIHBfdGhldGFdKSA9PiB7XG4gICAgICAgbGV0IF8wMDAyID0gTWF0aC5wb3cobCwgMilcbiAgICAgICBsZXQgXzAwMDMgPSBvbWVnYSAqIHRcbiAgICAgICBsZXQgXzAwMDQgPSBNYXRoLnNpbih0aGV0YSlcbiAgICAgICBsZXQgXzAwMDUgPSBNYXRoLmNvcyh0aGV0YSlcbiAgICAgICBsZXQgXzAwMDYgPSBNYXRoLnNpbihfMDAwMylcbiAgICAgICByZXR1cm4gWzEsIChhICogbCAqIG0gKiBvbWVnYSAqIF8wMDA2ICogXzAwMDQgKyBwX3RoZXRhKSAvIChfMDAwMiAqIG0pLCAoLSBNYXRoLnBvdyhhLCAyKSAqIGwgKiBtICogTWF0aC5wb3cob21lZ2EsIDIpICogTWF0aC5wb3coXzAwMDYsIDIpICogXzAwMDUgKiBfMDAwNCAtIGEgKiBvbWVnYSAqIHBfdGhldGEgKiBfMDAwNiAqIF8wMDA1IC0gZyAqIF8wMDAyICogbSAqIF8wMDA0KSAvIGxdXG4gICAgfVxuICB9XG5cbiAgTGFncmFuZ2VTeXNkZXIobDogbnVtYmVyLCBvbWVnYTogbnVtYmVyLCBhOiBudW1iZXIsIGc6IG51bWJlcik6IERlcml2YXRpdmUge1xuICAgIHJldHVybiAoeCwgW3QsIHRoZXRhLCB0aGV0YWRvdF0pID0+IHtcbiAgICAgIGxldCBfMDAwMSA9IE1hdGguc2luKHRoZXRhKVxuICAgICAgcmV0dXJuIFsxLCB0aGV0YWRvdCwgKGEgKiBNYXRoLnBvdyhvbWVnYSwgMikgKiBfMDAwMSAqIE1hdGguY29zKG9tZWdhICogdCkgLSBnICogXzAwMDEpIC8gbF1cbiAgICB9XG4gIH1cblxuICBjb25zdHJ1Y3RvcihwYXJhbWZuOiAoKSA9PiB7YTogbnVtYmVyLCBvbWVnYTogbnVtYmVyfSkge1xuICAgIHRoaXMucGFyYW1mbiA9IHBhcmFtZm5cbiAgICB0aGlzLlMgPSBuZXcgU29sdmVyKDMpXG4gICAgdGhpcy5TLmRlbnNlT3V0cHV0ID0gdHJ1ZVxuICAgIHRoaXMuUy5hYnNvbHV0ZVRvbGVyYW5jZSA9IDFlLThcbiAgICB0aGlzLlBWID0gU3RhbmRhcmRNYXAucHJpbmNpcGFsX3ZhbHVlKE1hdGguUEkpXG4gIH1cblxuICBnZW5lcmF0ZVNlY3Rpb24oaW5pdGlhbERhdGE6IG51bWJlcltdLCBuOiBudW1iZXIsIGNhbGxiYWNrOiAoeDogbnVtYmVyLCB5OiBudW1iZXIpID0+IHZvaWQpIHtcbiAgICBsZXQgcGFyYW1zID0gdGhpcy5wYXJhbWZuKClcbiAgICBsZXQgcGVyaW9kID0gMiAqIE1hdGguUEkgLyBwYXJhbXMub21lZ2FcbiAgICBsZXQgdDEgPSAxMDAwICogcGVyaW9kXG4gICAgbGV0IEggPSB0aGlzLkhhbWlsdG9uU3lzZGVyKDEsIDEsIHBhcmFtcy5vbWVnYSwgcGFyYW1zLmEsIDkuOClcbiAgICB0aGlzLlMuc29sdmUoSCwgMCwgWzBdLmNvbmNhdChpbml0aWFsRGF0YSksIHQxLCB0aGlzLlMuZ3JpZChwZXJpb2QsICh0LCB5cykgPT4gY2FsbGJhY2sodGhpcy5QVih5c1sxXSksIHlzWzJdKSkpXG4gIH1cblxuICBldm9sdmUocGFyYW1zOiB7b21lZ2E6IG51bWJlciwgYTogbnVtYmVyfSwgaW5pdGlhbERhdGE6IG51bWJlcltdLCB0MTogbnVtYmVyLCBkdDogbnVtYmVyLCBjYWxsYmFjazogKHg6IG51bWJlciwgeXM6IG51bWJlcltdKSA9PiB2b2lkKSB7XG4gICAgbGV0IEwgPSB0aGlzLkxhZ3JhbmdlU3lzZGVyKDEsIHBhcmFtcy5vbWVnYSwgcGFyYW1zLmEsIDkuOClcbiAgICBsZXQgcDAgPSBwZXJmb3JtYW5jZS5ub3coKVxuICAgIHRoaXMuUy5zb2x2ZShMLCAwLCBbMF0uY29uY2F0KGluaXRpYWxEYXRhKSwgdDEsIHRoaXMuUy5ncmlkKGR0LCBjYWxsYmFjaykpXG4gICAgY29uc29sZS5sb2coJ2V2b2x1dGlvbiB0b29rJywgKHBlcmZvcm1hbmNlLm5vdygpIC0gcDApLnRvRml4ZWQoMiksICdtc2VjJylcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRXhwbG9yZU1hcCB7XG4gIGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnRcbiAgTTogSGFtaWx0b25NYXBcbiAgY29udGV4dDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEXG4gIG9uRXhwbG9yZTogKHg6IG51bWJlciwgeTogbnVtYmVyKSA9PiB2b2lkXG5cbiAgY29uc3RydWN0b3IoY2FudmFzOiBzdHJpbmcsIE06IEhhbWlsdG9uTWFwLCB4UmFuZ2U6IG51bWJlcltdLCB5UmFuZ2U6IG51bWJlcltdKSB7XG4gICAgdGhpcy5jYW52YXMgPSA8SFRNTENhbnZhc0VsZW1lbnQ+IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGNhbnZhcylcbiAgICB0aGlzLk0gPSBNXG4gICAgdGhpcy5jb250ZXh0ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKVxuICAgIGxldCBbdywgaF0gPSBbeFJhbmdlWzFdIC0geFJhbmdlWzBdLCB5UmFuZ2VbMV0gLSB5UmFuZ2VbMF1dXG4gICAgdGhpcy5jYW52YXMub25tb3VzZWRvd24gPSAoZTogTW91c2VFdmVudCkgPT4ge1xuICAgICAgbGV0IFtjeCwgY3ldID0gW2Uub2Zmc2V0WCAvIHRoaXMuY29udGV4dC5jYW52YXMud2lkdGggKiB3ICsgeFJhbmdlWzBdLFxuICAgICAgICB5UmFuZ2VbMV0gLSBlLm9mZnNldFkgLyB0aGlzLmNvbnRleHQuY2FudmFzLmhlaWdodCAqIGhdXG4gICAgICBsZXQgcDAgPSBwZXJmb3JtYW5jZS5ub3coKVxuICAgICAgdGhpcy5FeHBsb3JlKGN4LCBjeSlcbiAgICAgIGNvbnNvbGUubG9nKCdleHBsb3JhdGlvbicsIChwZXJmb3JtYW5jZS5ub3coKSAtIHAwKS50b0ZpeGVkKDIpLCAnbXNlYycpXG4gICAgICB0aGlzLm9uRXhwbG9yZSAmJiB0aGlzLm9uRXhwbG9yZShjeCwgY3kpXG4gICAgfVxuICAgIHRoaXMuY29udGV4dC5zY2FsZSh0aGlzLmNvbnRleHQuY2FudmFzLndpZHRoIC8gdywgLXRoaXMuY29udGV4dC5jYW52YXMuaGVpZ2h0IC8gaClcbiAgICB0aGlzLmNvbnRleHQudHJhbnNsYXRlKC14UmFuZ2VbMF0sIC15UmFuZ2VbMV0pXG4gICAgdGhpcy5jb250ZXh0LmZpbGxTdHlsZSA9ICdyZ2JhKDIzLDY0LDE3MCwwLjUpJ1xuICB9XG4gIGk6IG51bWJlciA9IDBcblxuICAvLyBzaW5jZSBwdCBpcyBpbnZva2VkIGluIGNhbGxiYWNrIHBvc2l0aW9uLCB3ZSB3YW50IHRvIGRlZmluZSBpdCBhcyBhbiBpbnN0YW5jZSBhcnJvdyBmdW5jdGlvblxuICBwdCA9ICh4OiBudW1iZXIsIHk6IG51bWJlcikgPT4ge1xuICAgIHRoaXMuY29udGV4dC5iZWdpblBhdGgoKVxuICAgIHRoaXMuY29udGV4dC5hcmMoeCwgeSwgMC4wMSwgMCwgMiAqIE1hdGguUEkpXG4gICAgdGhpcy5jb250ZXh0LmZpbGwoKVxuICAgIHRoaXMuY29udGV4dC5jbG9zZVBhdGgoKVxuICAgICsrdGhpcy5pXG4gIH1cblxuICBFeHBsb3JlKHg6IG51bWJlciwgeTogbnVtYmVyKSB7XG4gICAgdGhpcy5NLmdlbmVyYXRlU2VjdGlvbihbeCwgeV0sIDEwMDAsIHRoaXMucHQpXG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIERyaXZlblBlbmR1bHVtQW5pbWF0aW9uIHtcbiAgYW1wbGl0dWRlID0gMC4xXG4gIGFuaW1Mb2dpY2FsU2l6ZSA9IDEuM1xuICBjdHg6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRFxuICBpbml0aWFsRGF0YTogbnVtYmVyW11cbiAgZGF0YTogbnVtYmVyW11bXVxuICBmcmFtZUluZGV4OiBudW1iZXJcbiAgZnJhbWVTdGFydDogbnVtYmVyXG4gIG9tZWdhOiBudW1iZXJcbiAgYW5pbWF0aW5nOiBib29sZWFuXG5cbiAgY29uc3RydWN0b3Iobzoge1xuICAgIGZWYWx1ZUlkOiBzdHJpbmdcbiAgICBmUmFuZ2VJZDogc3RyaW5nXG4gICAgdFZhbHVlSWQ6IHN0cmluZ1xuICAgIHRSYW5nZUlkOiBzdHJpbmdcbiAgICBhbmltSWQ6IHN0cmluZ1xuICAgIGV4cGxvcmVJZDogc3RyaW5nXG4gICAgdGhldGEwSWQ6IHN0cmluZ1xuICAgIHRoZXRhRG90MElkOiBzdHJpbmdcbiAgICBnb0J1dHRvbklkOiBzdHJpbmdcbiAgfSkge1xuICAgIGxldCBmUmFuZ2UgPSA8SFRNTElucHV0RWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChvLmZSYW5nZUlkKVxuICAgIGxldCBvbWVnYVJhZFNlYyA9ICgpID0+ICtmUmFuZ2UudmFsdWUgKiAyICogTWF0aC5QSVxuICAgIGxldCB0UmFuZ2UgPSA8SFRNTElucHV0RWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChvLnRSYW5nZUlkKVxuICAgIGxldCBkaWZmRXEgPSBuZXcgRHJpdmVuUGVuZHVsdW1NYXAoKCkgPT4gKHtvbWVnYTogb21lZ2FSYWRTZWMoKSwgYTogdGhpcy5hbXBsaXR1ZGV9KSlcbiAgICBsZXQgYW5pbSA9IDxIVE1MQ2FudmFzRWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChvLmFuaW1JZClcbiAgICB0aGlzLmN0eCA9IGFuaW0uZ2V0Q29udGV4dCgnMmQnKVxuICAgIHRoaXMuY3R4LnNjYWxlKGFuaW0ud2lkdGggLyAoMiAqIHRoaXMuYW5pbUxvZ2ljYWxTaXplKSwgLWFuaW0uaGVpZ2h0IC8gKDIgKiB0aGlzLmFuaW1Mb2dpY2FsU2l6ZSkpXG4gICAgdGhpcy5jdHgudHJhbnNsYXRlKHRoaXMuYW5pbUxvZ2ljYWxTaXplLCAtdGhpcy5hbmltTG9naWNhbFNpemUpXG4gICAgbGV0IHhNYXAgPSBuZXcgRXhwbG9yZU1hcCgncCcsIGRpZmZFcSwgWy1NYXRoLlBJLCBNYXRoLlBJXSwgWy0xMCwgMTBdKVxuICAgIGxldCBnb0J1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG8uZ29CdXR0b25JZClcbiAgICB4TWFwLm9uRXhwbG9yZSA9ICh0aGV0YTA6IG51bWJlciwgdGhldGFEb3QwOiBudW1iZXIpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKCdvbkV4cGxvcmUnLCB0aGV0YTAsIHRoZXRhRG90MClcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG8udGhldGEwSWQpLnRleHRDb250ZW50ID0gdGhldGEwLnRvRml4ZWQoMylcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG8udGhldGFEb3QwSWQpLnRleHRDb250ZW50ID0gdGhldGFEb3QwLnRvRml4ZWQoMylcbiAgICAgIHRoaXMuaW5pdGlhbERhdGEgPSBbdGhldGEwLCB0aGV0YURvdDBdXG4gICAgICBnb0J1dHRvbi5yZW1vdmVBdHRyaWJ1dGUoJ2Rpc2FibGVkJylcbiAgICB9XG4gICAgbGV0IGV4cGxvcmUgPSA8SFRNTENhbnZhc0VsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoby5leHBsb3JlSWQpXG4gICAgZlJhbmdlLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIChlOiBFdmVudCkgPT4ge1xuICAgICAgZXhwbG9yZS5nZXRDb250ZXh0KCcyZCcpLmNsZWFyUmVjdCgtTWF0aC5QSSwgLTEwLCAyICogTWF0aC5QSSwgMjApXG4gICAgICBsZXQgdCA9IDxIVE1MSW5wdXRFbGVtZW50PmUudGFyZ2V0XG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChvLmZWYWx1ZUlkKS50ZXh0Q29udGVudCA9ICgrdC52YWx1ZSkudG9GaXhlZCgxKVxuICAgIH0pXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoby5mVmFsdWVJZCkudGV4dENvbnRlbnQgPSBmUmFuZ2UudmFsdWVcbiAgICB0UmFuZ2UuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKGU6IEV2ZW50KSA9PiB7XG4gICAgICBsZXQgdCA9IDxIVE1MSW5wdXRFbGVtZW50PmUudGFyZ2V0XG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChvLnRWYWx1ZUlkKS50ZXh0Q29udGVudCA9IHQudmFsdWVcbiAgICB9KVxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG8udFZhbHVlSWQpLnRleHRDb250ZW50ID0gdFJhbmdlLnZhbHVlXG4gICAgZ29CdXR0b24uc2V0QXR0cmlidXRlKCdkaXNhYmxlZCcsICdkaXNhYmxlZCcpXG4gICAgZ29CdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAvLyAocmUpc29sdmUgdGhlIGRpZmZlcmVudGlhbCBlcXVhdGlvbiBhbmQgdXBkYXRlIHRoZSBkYXRhLiBLaWNrIG9mZiB0aGUgYW5pbWF0aW9uLlxuICAgICAgbGV0IGR0ID0gMSAvIDYwXG4gICAgICBsZXQgdDEgPSArdFJhbmdlLnZhbHVlXG4gICAgICBsZXQgbiA9IE1hdGguY2VpbCh0MSAvIGR0KVxuICAgICAgdGhpcy5kYXRhID0gbmV3IEFycmF5KG4pXG4gICAgICBsZXQgaSA9IDBcbiAgICAgIHRoaXMub21lZ2EgPSBvbWVnYVJhZFNlYygpXG4gICAgICBsZXQgcDAgPSBwZXJmb3JtYW5jZS5ub3coKVxuICAgICAgZGlmZkVxLmV2b2x2ZSh7b21lZ2E6IHRoaXMub21lZ2EsIGE6IHRoaXMuYW1wbGl0dWRlfSwgdGhpcy5pbml0aWFsRGF0YSwgdDEsIGR0LCAoeCwgeXMpID0+IHt0aGlzLmRhdGFbaSsrXSA9IHlzfSlcbiAgICAgIGNvbnNvbGUubG9nKCdERSBldm9sdXRpb24gaW4nLCAocGVyZm9ybWFuY2Uubm93KCkgLSBwMCkudG9GaXhlZCgxKSwgJ21zZWMnKVxuICAgICAgdGhpcy5mcmFtZUluZGV4ID0gMFxuICAgICAgdGhpcy5mcmFtZVN0YXJ0ID0gcGVyZm9ybWFuY2Uubm93KClcbiAgICAgIGlmICghdGhpcy5hbmltYXRpbmcpIHtcbiAgICAgICAgdGhpcy5hbmltYXRpbmcgPSB0cnVlXG4gICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLmZyYW1lKVxuICAgICAgfVxuICAgIH0pXG4gIH1cbiAgdGltZXN0cmluZyA9ICh0OiBudW1iZXIpID0+IHtcbiAgICBsZXQgcyA9IHQudG9GaXhlZCgyKVxuICAgIGlmIChzLm1hdGNoKC9cXC5bMC05XSQvKSkge1xuICAgICAgcyArPSAnMCdcbiAgICB9XG4gICAgcmV0dXJuICd0OiAnICsgcyArICcgcydcbiAgfVxuXG4gIGZyYW1lID0gKCkgPT4ge1xuICAgIGxldCBib2IgPSAodDogbnVtYmVyKSA9PiB0aGlzLmFtcGxpdHVkZSAqIE1hdGguY29zKHRoaXMub21lZ2EgKiB0KVxuICAgIHRoaXMuY3R4LmNsZWFyUmVjdCgtdGhpcy5hbmltTG9naWNhbFNpemUsIC10aGlzLmFuaW1Mb2dpY2FsU2l6ZSwgMiAqIHRoaXMuYW5pbUxvZ2ljYWxTaXplLCAyICogdGhpcy5hbmltTG9naWNhbFNpemUpXG4gICAgbGV0IGQgPSB0aGlzLmRhdGFbdGhpcy5mcmFtZUluZGV4XVxuICAgIGxldCB5MCA9IGJvYihkWzBdKVxuICAgIGxldCB0aGV0YSA9IGRbMV1cbiAgICBjb25zdCBjID0gdGhpcy5jdHhcbiAgICBjLmxpbmVXaWR0aCA9IDAuMDJcbiAgICBjLmZpbGxTdHlsZSA9ICcjMDAwJ1xuICAgIGMuYmVnaW5QYXRoKClcbiAgICBjLm1vdmVUbygwLCB5MClcbiAgICBjLmxpbmVUbyhNYXRoLnNpbih0aGV0YSksIHkwIC0gTWF0aC5jb3ModGhldGEpKVxuICAgIGMuc3Ryb2tlKClcbiAgICBjLmJlZ2luUGF0aCgpXG4gICAgYy5maWxsU3R5bGUgPSAnIzAwMCdcbiAgICBjLmFyYygwLCB5MCwgMC4wNSwgMCwgTWF0aC5QSSAqIDIpXG4gICAgYy5maWxsU3R5bGUgPSAnI2YwMCdcbiAgICBjLmFyYyhNYXRoLnNpbih0aGV0YSksIHkwIC0gTWF0aC5jb3ModGhldGEpLCAwLjEsIDAsIE1hdGguUEkgKiAyKVxuICAgIGMuZmlsbCgpXG4gICAgYy5zYXZlKClcbiAgICBjLnNjYWxlKDAuMDEsIC0wLjAxKVxuICAgIGMuZm9udCA9ICcxMHB0IHNhbnMtc2VyaWYzJ1xuICAgIGMuZmlsbFN0eWxlID0gJyNiYmInXG4gICAgYy5maWxsVGV4dCh0aGlzLnRpbWVzdHJpbmcoZFswXSksIC0xMTUsIDExNSlcbiAgICBjLnJlc3RvcmUoKVxuXG4gICAgKyt0aGlzLmZyYW1lSW5kZXhcbiAgICBpZiAodGhpcy5mcmFtZUluZGV4IDwgdGhpcy5kYXRhLmxlbmd0aCkge1xuICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLmZyYW1lKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmFuaW1hdGluZyA9IGZhbHNlXG4gICAgICBsZXQgZXQgPSAocGVyZm9ybWFuY2Uubm93KCkgLSB0aGlzLmZyYW1lU3RhcnQpIC8gMWUzXG4gICAgICBjb25zb2xlLmxvZygnYW5pbWF0aW9uIGRvbmUnLCAodGhpcy5kYXRhLmxlbmd0aCAvIGV0KS50b0ZpeGVkKDIpLCAnZnBzJylcbiAgICB9XG4gIH1cbn1cblxuaW50ZXJmYWNlIERvdWJsZVBhcmFtcyB7XG4gIGwxOiBudW1iZXJcbiAgbTE6IG51bWJlclxuICBsMjogbnVtYmVyXG4gIG0yOiBudW1iZXJcbn1cblxuY2xhc3MgRG91YmxlUGVuZHVsdW1NYXAgaW1wbGVtZW50cyBEaWZmZXJlbnRpYWxFcXVhdGlvbiB7XG4gIFM6IFNvbHZlclxuXG4gIExhZ3JhbmdlU3lzZGVyKGwxOiBudW1iZXIsIG0xOiBudW1iZXIsIGwyOiBudW1iZXIsIG0yOiBudW1iZXIpOiBEZXJpdmF0aXZlIHtcbiAgICBjb25zdCBnID0gOS44XG4gICAgcmV0dXJuICh4LCBbdCwgdGhldGEsIHBoaSwgdGhldGFkb3QsIHBoaWRvdF0pID0+IHtcbiAgICAgIGxldCBfMDAwMiA9IE1hdGgucG93KHBoaWRvdCwgMilcbiAgICAgIGxldCBfMDAwMyA9IE1hdGguc2luKHBoaSlcbiAgICAgIGxldCBfMDAwNSA9IC0gcGhpXG4gICAgICBsZXQgXzAwMDcgPSBNYXRoLnNpbih0aGV0YSlcbiAgICAgIGxldCBfMDAwOCA9IE1hdGgucG93KHRoZXRhZG90LCAyKVxuICAgICAgbGV0IF8wMDBiID0gXzAwMDUgKyB0aGV0YVxuICAgICAgbGV0IF8wMDBlID0gTWF0aC5jb3MoXzAwMGIpXG4gICAgICBsZXQgXzAwMGYgPSBNYXRoLnNpbihfMDAwYilcbiAgICAgIGxldCBfMDAxMSA9IE1hdGgucG93KF8wMDBmLCAyKVxuICAgICAgcmV0dXJuIFsxLCB0aGV0YWRvdCwgcGhpZG90LCAoLSBsMSAqIG0yICogXzAwMDggKiBfMDAwZiAqIF8wMDBlIC0gbDIgKiBtMiAqIF8wMDAyICogXzAwMGYgKyBnICogbTIgKiBfMDAwZSAqIF8wMDAzIC0gZyAqIG0xICogXzAwMDcgLSBnICogbTIgKiBfMDAwNykgLyAobDEgKiBtMiAqIF8wMDExICsgbDEgKiBtMSksIChsMiAqIG0yICogXzAwMDIgKiBfMDAwZiAqIF8wMDBlICsgbDEgKiBtMSAqIF8wMDA4ICogXzAwMGYgKyBsMSAqIG0yICogXzAwMDggKiBfMDAwZiArIGcgKiBtMSAqIF8wMDA3ICogXzAwMGUgKyBnICogbTIgKiBfMDAwNyAqIF8wMDBlIC0gZyAqIG0xICogXzAwMDMgLSBnICogbTIgKiBfMDAwMykgLyAobDIgKiBtMiAqIF8wMDExICsgbDIgKiBtMSldXG4gICAgfVxuICB9XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5TID0gbmV3IFNvbHZlcig1KSAgLy8gdCwgdGhldGEsIHBoaSwgdGhldGFkb3QsIHBoaWRvdFxuICAgIHRoaXMuUy5kZW5zZU91dHB1dCA9IHRydWVcbiAgICB0aGlzLlMuYWJzb2x1dGVUb2xlcmFuY2UgPSAxZS04XG4gIH1cblxuICBldm9sdmUocDogRG91YmxlUGFyYW1zLCBpbml0aWFsRGF0YTogbnVtYmVyW10sIHQxOiBudW1iZXIsIGR0OiBudW1iZXIsIGNhbGxiYWNrOiAodDogbnVtYmVyLCB5OiBudW1iZXJbXSkgPT4gdm9pZCk6IHZvaWQge1xuICAgIHRoaXMuUy5zb2x2ZSh0aGlzLkxhZ3JhbmdlU3lzZGVyKHAubDEsIHAubTEsIHAubDIsIHAubTIpLCAwLCBbMF0uY29uY2F0KGluaXRpYWxEYXRhKSwgdDEsIHRoaXMuUy5ncmlkKGR0LCBjYWxsYmFjaykpXG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIERvdWJsZVBlbmR1bHVtQW5pbWF0aW9uIHtcbiAgYW5pbUxvZ2ljYWxTaXplID0gMS4zXG4gIGN0eDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEXG4gIGRhdGE6IG51bWJlcltdW11cbiAgZnJhbWVTdGFydDogbnVtYmVyXG4gIGZyYW1lSW5kZXg6IG51bWJlclxuICBhbmltYXRpbmc6IGJvb2xlYW5cbiAgcGFyYW1zOiBEb3VibGVQYXJhbXNcbiAgdmFsdWVVcGRhdGVyKHRvSWQ6IHN0cmluZykge1xuICAgIHJldHVybiAoZTogRXZlbnQpID0+IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRvSWQpLnRleHRDb250ZW50ID0gKDxIVE1MSW5wdXRFbGVtZW50PmUudGFyZ2V0KS52YWx1ZVxuICB9XG5cbiAgY29uc3RydWN0b3Iobzoge1xuICAgIHRoZXRhMFJhbmdlSWQ6IHN0cmluZyxcbiAgICB0aGV0YTBWYWx1ZUlkOiBzdHJpbmcsXG4gICAgcGhpMFJhbmdlSWQ6IHN0cmluZyxcbiAgICBwaGkwVmFsdWVJZDogc3RyaW5nLFxuICAgIHRSYW5nZUlkOiBzdHJpbmcsXG4gICAgdFZhbHVlSWQ6IHN0cmluZyxcbiAgICBtUmFuZ2VJZDogc3RyaW5nLFxuICAgIG1WYWx1ZUlkOiBzdHJpbmcsXG4gICAgbFJhbmdlSWQ6IHN0cmluZyxcbiAgICBsVmFsdWVJZDogc3RyaW5nLFxuICAgIGFuaW1JZDogc3RyaW5nLFxuICAgIGdvQnV0dG9uSWQ6IHN0cmluZ1xuICB9KSB7XG4gICAgdGhpcy5hbmltYXRpbmcgPSBmYWxzZVxuICAgIGxldCBkZWcycmFkID0gKGQ6IG51bWJlcikgPT4gZCAqIDIgKiBNYXRoLlBJIC8gMzYwXG4gICAgbGV0IHRoZXRhMFJhbmdlID0gPEhUTUxJbnB1dEVsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoby50aGV0YTBSYW5nZUlkKVxuICAgIHRoZXRhMFJhbmdlLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIHRoaXMudmFsdWVVcGRhdGVyKG8udGhldGEwVmFsdWVJZCkpXG4gICAgdGhldGEwUmFuZ2UuYWRkRXZlbnRMaXN0ZW5lcignaW5wdXQnLCB0aGlzLnZhbHVlVXBkYXRlcihvLnRoZXRhMFZhbHVlSWQpKVxuICAgIGxldCBwaGkwUmFuZ2UgPSA8SFRNTElucHV0RWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChvLnBoaTBSYW5nZUlkKVxuICAgIHBoaTBSYW5nZS5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCB0aGlzLnZhbHVlVXBkYXRlcihvLnBoaTBWYWx1ZUlkKSlcbiAgICBwaGkwUmFuZ2UuYWRkRXZlbnRMaXN0ZW5lcignaW5wdXQnLCB0aGlzLnZhbHVlVXBkYXRlcihvLnBoaTBWYWx1ZUlkKSlcbiAgICBsZXQgdFJhbmdlID0gPEhUTUxJbnB1dEVsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoby50UmFuZ2VJZClcbiAgICB0UmFuZ2UuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgdGhpcy52YWx1ZVVwZGF0ZXIoby50VmFsdWVJZCkpXG4gICAgdFJhbmdlLmFkZEV2ZW50TGlzdGVuZXIoJ2lucHV0JywgdGhpcy52YWx1ZVVwZGF0ZXIoby50VmFsdWVJZCkpXG4gICAgbGV0IG1SYW5nZSA9IDxIVE1MSW5wdXRFbGVtZW50PmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG8ubVJhbmdlSWQpXG4gICAgbVJhbmdlLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIHRoaXMudmFsdWVVcGRhdGVyKG8ubVZhbHVlSWQpKVxuICAgIG1SYW5nZS5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsIHRoaXMudmFsdWVVcGRhdGVyKG8ubVZhbHVlSWQpKVxuICAgIGxldCBsUmFuZ2UgPSA8SFRNTElucHV0RWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChvLmxSYW5nZUlkKVxuICAgIGxSYW5nZS5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCB0aGlzLnZhbHVlVXBkYXRlcihvLmxWYWx1ZUlkKSlcbiAgICBsUmFuZ2UuYWRkRXZlbnRMaXN0ZW5lcignaW5wdXQnLCB0aGlzLnZhbHVlVXBkYXRlcihvLmxWYWx1ZUlkKSlcbiAgICBsZXQgYW5pbSA9IDxIVE1MQ2FudmFzRWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChvLmFuaW1JZClcbiAgICB0aGlzLmN0eCA9IGFuaW0uZ2V0Q29udGV4dCgnMmQnKVxuICAgIHRoaXMuY3R4LnNjYWxlKGFuaW0ud2lkdGggLyAoMiAqIHRoaXMuYW5pbUxvZ2ljYWxTaXplKSwgLWFuaW0uaGVpZ2h0IC8gKDIgKiB0aGlzLmFuaW1Mb2dpY2FsU2l6ZSkpXG4gICAgdGhpcy5jdHgudHJhbnNsYXRlKHRoaXMuYW5pbUxvZ2ljYWxTaXplLCAtdGhpcy5hbmltTG9naWNhbFNpemUpXG4gICAgbGV0IGRpZmZFcSA9IG5ldyBEb3VibGVQZW5kdWx1bU1hcCgpXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoby5nb0J1dHRvbklkKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+ICB7XG4gICAgICBsZXQgZHQgPSAxIC8gNjBcbiAgICAgIGxldCB0MSA9ICt0UmFuZ2UudmFsdWVcbiAgICAgIGxldCBuID0gTWF0aC5jZWlsKHQxIC8gZHQpXG4gICAgICB0aGlzLmRhdGEgPSBuZXcgQXJyYXkobilcbiAgICAgIGxldCBpID0gMFxuICAgICAgbGV0IHAwID0gcGVyZm9ybWFuY2Uubm93KClcbiAgICAgIHRoaXMucGFyYW1zID0ge1xuICAgICAgICBsMTogK2xSYW5nZS52YWx1ZSxcbiAgICAgICAgbTE6ICttUmFuZ2UudmFsdWUsXG4gICAgICAgIGwyOiAxIC0gTnVtYmVyKGxSYW5nZS52YWx1ZSksXG4gICAgICAgIG0yOiAxIC0gTnVtYmVyKG1SYW5nZS52YWx1ZSlcbiAgICAgIH1cbiAgICAgIGRpZmZFcS5ldm9sdmUodGhpcy5wYXJhbXMsIFtkZWcycmFkKCt0aGV0YTBSYW5nZS52YWx1ZSksIGRlZzJyYWQoK3BoaTBSYW5nZS52YWx1ZSksIDAsIDBdLCB0MSwgZHQsICh4LCB5cykgPT4ge3RoaXMuZGF0YVtpKytdID0geXN9KVxuICAgICAgY29uc29sZS5sb2coJ2V2b2x1dGlvbiBpbicsIChwZXJmb3JtYW5jZS5ub3coKSAtIHAwKS50b0ZpeGVkKDIpLCAnbXNlYyAnKVxuICAgICAgdGhpcy5mcmFtZUluZGV4ID0gMFxuICAgICAgdGhpcy5mcmFtZVN0YXJ0ID0gcGVyZm9ybWFuY2Uubm93KClcbiAgICAgIGlmICghdGhpcy5hbmltYXRpbmcpIHtcbiAgICAgICAgdGhpcy5hbmltYXRpbmcgPSB0cnVlXG4gICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLmZyYW1lKVxuICAgICAgfVxuICAgIH0pXG4gIH1cbiAgZnJhbWUgPSAoKSA9PiB7XG4gICAgdGhpcy5jdHguY2xlYXJSZWN0KC10aGlzLmFuaW1Mb2dpY2FsU2l6ZSwgLXRoaXMuYW5pbUxvZ2ljYWxTaXplLCAyICogdGhpcy5hbmltTG9naWNhbFNpemUsIDIgKiB0aGlzLmFuaW1Mb2dpY2FsU2l6ZSlcbiAgICBsZXQgZCA9IHRoaXMuZGF0YVt0aGlzLmZyYW1lSW5kZXhdXG4gICAgbGV0IHRoZXRhID0gZFsxXSwgcGhpID0gZFsyXVxuICAgIGNvbnN0IGMgPSB0aGlzLmN0eFxuICAgIGNvbnN0IHAgPSB0aGlzLnBhcmFtc1xuICAgIGxldCB4MCA9IDAsIHkwID0gMFxuICAgIGxldCB4MSA9IHAubDEgKiBNYXRoLnNpbih0aGV0YSksIHkxID0gLXAubDEgKiBNYXRoLmNvcyh0aGV0YSlcbiAgICBsZXQgeDIgPSB4MSArIHAubDIgKiBNYXRoLnNpbihwaGkpLCB5MiA9IHkxIC0gcC5sMiAqIE1hdGguY29zKHBoaSlcbiAgICBjLmxpbmVXaWR0aCA9IDAuMDI1XG4gICAgYy5zdHJva2VTdHlsZSA9ICcjODg4J1xuICAgIGMuYmVnaW5QYXRoKClcbiAgICBjLm1vdmVUbyh4MCwgeTApXG4gICAgYy5saW5lVG8oeDEsIHkxKVxuICAgIGMubGluZVRvKHgyLCB5MilcbiAgICBjLnN0cm9rZSgpXG4gICAgYy5maWxsU3R5bGUgPSAnI2YwMCdcbiAgICBjLmJlZ2luUGF0aCgpXG4gICAgYy5tb3ZlVG8oeDAsIHkwKVxuICAgIGMuYXJjKHgwLCB5MCwgMC4wNSwgMCwgTWF0aC5QSSAqIDIpXG4gICAgYy5tb3ZlVG8oeDEsIHkxKVxuICAgIGMuYXJjKHgxLCB5MSwgTWF0aC5wb3cocC5tMSwgMSAvIDMpIC8gNywgMCwgTWF0aC5QSSAqIDIpXG4gICAgYy5tb3ZlVG8oeDIsIHkyKVxuICAgIGMuYXJjKHgyLCB5MiwgTWF0aC5wb3cocC5tMiwgMSAvIDMpIC8gNywgMCwgTWF0aC5QSSAqIDIpXG4gICAgYy5maWxsKClcblxuICAgICsrdGhpcy5mcmFtZUluZGV4XG4gICAgaWYgKHRoaXMuZnJhbWVJbmRleCA8IHRoaXMuZGF0YS5sZW5ndGgpIHtcbiAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy5mcmFtZSlcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5hbmltYXRpbmcgPSBmYWxzZVxuICAgICAgbGV0IGV0ID0gKHBlcmZvcm1hbmNlLm5vdygpIC0gdGhpcy5mcmFtZVN0YXJ0KSAvIDFlM1xuICAgICAgY29uc29sZS5sb2coJ2FuaW1hdGlvbiBkb25lJywgKHRoaXMuZGF0YS5sZW5ndGggLyBldCkudG9GaXhlZCgyKSwgJ2ZwcycpXG4gICAgfVxuICB9XG59XG4iXX0=
