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
            var _2 = Math.pow(l, 2);
            var _3 = omega * t;
            var _4 = Math.sin(theta);
            var _5 = Math.cos(theta);
            return [1,
                (Math.sin(_3) * _4 * a * l * m * omega + p_theta) / (_2 * m),
                (-Math.pow(Math.sin(_3), 2) * _5 * _4 * Math.pow(a, 2) * l * m * Math.pow(omega, 2) - Math.sin(_3) * _5 * a * omega * p_theta - _4 * g * _2 * m) / l];
        };
    };
    DrivenPendulumMap.prototype.LagrangeSysder = function (l, omega, a, g) {
        return function (x, _a) {
            var t = _a[0], theta = _a[1], thetadot = _a[2];
            var _1 = Math.sin(theta);
            return [1, thetadot, (_1 * Math.cos(omega * t) * a * Math.pow(omega, 2) - _1 * g) / l];
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
    DrivenPendulumMap.prototype.evolve = function (initialData, t1, dt, callback) {
        var params = this.paramfn();
        console.log('params', params);
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
        this.frame = function () {
            var bob = function (t) { return _this.amplitude * Math.cos(_this.omega * t); };
            _this.ctx.clearRect(-_this.animLogicalSize, -_this.animLogicalSize, 2 * _this.animLogicalSize, 2 * _this.animLogicalSize);
            var d = _this.data[_this.frameIndex];
            var y0 = bob(d[0]);
            var theta = d[1];
            var c = _this.ctx;
            c.lineWidth = 0.02;
            c.beginPath();
            c.fillStyle = '#000';
            c.arc(0, y0, 0.05, 0, Math.PI * 2);
            c.fillStyle = '#f00';
            c.arc(Math.sin(theta), y0 - Math.cos(theta), 0.1, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = '#000';
            c.beginPath();
            c.moveTo(0, y0);
            c.lineTo(Math.sin(theta), y0 - Math.cos(theta));
            c.stroke();
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
        var tRange = document.getElementById(o.tRangeId);
        var diffEq = new DrivenPendulumMap(function () { return ({
            a: _this.amplitude,
            omega: +omegaRange.value
        }); });
        var anim = document.getElementById(o.animId);
        this.ctx = anim.getContext('2d');
        this.ctx.scale(anim.width / (2 * this.animLogicalSize), -anim.height / (2 * this.animLogicalSize));
        this.ctx.translate(this.animLogicalSize, -this.animLogicalSize);
        var xMap = new ExploreMap('p', diffEq, [-Math.PI, Math.PI], [-10, 10]);
        xMap.onExplore = function (theta0, thetaDot0) {
            console.log('onExplore', theta0, thetaDot0);
            document.getElementById(o.theta0Id).textContent = theta0.toFixed(3);
            document.getElementById(o.thetaDot0Id).textContent = thetaDot0.toFixed(3);
            _this.initialData = [theta0, thetaDot0];
        };
        var explore = document.getElementById(o.exploreId);
        omegaRange.addEventListener('change', function (e) {
            explore.getContext('2d').clearRect(-Math.PI, -10, 2 * Math.PI, 20);
            var t = e.target;
            document.getElementById(o.omegaValueId).textContent = (+t.value).toFixed(1);
        });
        tRange.addEventListener('change', function (e) {
            var t = e.target;
            document.getElementById(o.tValueId).textContent = t.value;
        });
        document.getElementById(o.goButtonId).addEventListener('click', function () {
            var dt = 1 / 60;
            var t1 = +tRange.value;
            var n = Math.ceil(t1 / dt);
            _this.data = new Array(n);
            var i = 0;
            _this.omega = +omegaRange.value;
            var p0 = performance.now();
            diffEq.evolve(_this.initialData, t1, dt, function (x, ys) { _this.data[i++] = ys; });
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
    function DoublePendulumMap(paramfn) {
        this.paramfn = paramfn;
        this.S = new odex_1.Solver(5);
        this.S.denseOutput = true;
        this.S.absoluteTolerance = 1e-8;
    }
    DoublePendulumMap.prototype.LagrangeSysder = function (l1, m1, l2, m2) {
        var g = 9.8;
        return function (x, _a) {
            var t = _a[0], theta = _a[1], phi = _a[2], thetadot = _a[3], phidot = _a[4];
            var _2 = Math.pow(phidot, 2);
            var _3 = Math.sin(phi);
            var _5 = -phi;
            var _7 = Math.sin(theta);
            var _8 = Math.pow(thetadot, 2);
            return [1,
                thetadot,
                phidot,
                (-Math.sin(_5 + theta) * Math.cos(_5 + theta) * l1 * m2 * _8 - Math.sin(_5 + theta) * l2 * m2 * _2 + Math.cos(_5 + theta) * _3 * g * m2 - _7 * g * m1 - _7 * g * m2) / (Math.pow(Math.sin(_5 + theta), 2) * l1 * m2 + l1 * m1),
                (Math.sin(_5 + theta) * Math.cos(_5 + theta) * l2 * m2 * _2 + Math.sin(_5 + theta) * l1 * m1 * _8 + Math.sin(_5 + theta) * l1 * m2 * _8 + _7 * Math.cos(_5 + theta) * g * m1 + _7 * Math.cos(_5 + theta) * g * m2 - _3 * g * m1 - _3 * g * m2) / (Math.pow(Math.sin(_5 + theta), 2) * l2 * m2 + l2 * m1)];
        };
    };
    DoublePendulumMap.prototype.evolve = function (initialData, t1, dt, callback) {
        var p = this.paramfn();
        console.log('params', this.params);
        var L = this.LagrangeSysder(p.l1, p.m1, p.l2, p.m2);
        this.params = p;
        this.S.solve(L, 0, [0].concat(initialData), t1, this.S.grid(dt, callback));
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
            console.log('frameIndex', _this.frameIndex, 'd', _this.data[_this.frameIndex]);
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
            c.arc(x1, y1, 0.1, 0, Math.PI * 2);
            c.moveTo(x2, y2);
            c.arc(x2, y2, 0.1, 0, Math.PI * 2);
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
        var anim = document.getElementById(o.animId);
        this.ctx = anim.getContext('2d');
        this.ctx.scale(anim.width / (2 * this.animLogicalSize), -anim.height / (2 * this.animLogicalSize));
        this.ctx.translate(this.animLogicalSize, -this.animLogicalSize);
        var paramfn = function () { return ({ l1: 0.5, m1: 0.5, l2: 0.5, m2: 0.5 }); };
        var diffEq = new DoublePendulumMap(paramfn);
        document.getElementById(o.goButtonId).addEventListener('click', function () {
            var dt = 1 / 60;
            var t1 = +tRange.value;
            var n = Math.ceil(t1 / dt);
            _this.data = new Array(n);
            var i = 0;
            var p0 = performance.now();
            _this.params = paramfn();
            diffEq.evolve([deg2rad(+theta0Range.value), deg2rad(+phi0Range.value), 0, 0], t1, dt, function (x, ys) { _this.data[i++] = ys; });
            console.log('evolution in', (performance.now() - p0).toFixed(2), 'msec');
            _this.frameIndex = 0;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvb2RleC9zcmMvb2RleC50cyIsInN0YW5kYXJkLW1hcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNrQ0EsSUFBWSxPQUlYO0FBSkQsV0FBWSxPQUFPO0lBQ2pCLCtDQUFTLENBQUE7SUFDVCw2REFBZ0IsQ0FBQTtJQUNoQixtREFBVyxDQUFBO0FBQ2IsQ0FBQyxFQUpXLE9BQU8sR0FBUCxlQUFPLEtBQVAsZUFBTyxRQUlsQjtBQUVEO0lBeUJFLGdCQUFZLENBQVM7UUFDbkIsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDVixJQUFJLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQTtRQUNyQixJQUFJLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQTtRQUNyQixJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQTtRQUMzQixJQUFJLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQTtRQUNwQixJQUFJLENBQUMsdUJBQXVCLEdBQUcsQ0FBQyxDQUFBO1FBQ2hDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxDQUFDLENBQUE7UUFDekIsSUFBSSxDQUFDLG1CQUFtQixHQUFHLENBQUMsQ0FBQTtRQUM1QixJQUFJLENBQUMsd0JBQXdCLEdBQUcsQ0FBQyxDQUFBO1FBQ2pDLElBQUksQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFBO1FBQ3hCLElBQUksQ0FBQyx5QkFBeUIsR0FBRyxJQUFJLENBQUE7UUFDckMsSUFBSSxDQUFDLGVBQWUsR0FBRyxTQUFTLENBQUE7UUFDaEMsSUFBSSxDQUFDLDBCQUEwQixHQUFHLENBQUMsQ0FBQTtRQUNuQyxJQUFJLENBQUMsdUJBQXVCLEdBQUcsR0FBRyxDQUFBO1FBQ2xDLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFBO1FBQ3hCLElBQUksQ0FBQyxZQUFZLEdBQUcsR0FBRyxDQUFBO1FBQ3ZCLElBQUksQ0FBQyxZ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QUFDLENBQUE7b0JBQ1AsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxHQUFHLEVBQUUsRUFBRSxDQUFDO3dCQUFFLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtvQkFDOUQsSUFBSSxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQTtvQkFDakIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxHQUFHLEVBQUUsRUFBRSxDQUFDO3dCQUFFLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO29CQUU1RCxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDO3dCQUM3QixJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7d0JBQ2xCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7NEJBQzVCLElBQUksTUFBTSxHQUFHLFNBQUEsQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFJLENBQUMsQ0FBQSxHQUFHLENBQUMsQ0FBQTs0QkFDMUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxHQUFHLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQztnQ0FDOUIsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQTs0QkFDMUUsQ0FBQzt3QkFDSCxDQUFDO29CQUNILENBQUM7b0JBQ0QsSUFBSSxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQTtvQkFDakIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxHQUFHLEVBQUUsRUFBRSxDQUFDO3dCQUFFLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO29CQUUxRCxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUM7d0JBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtvQkFDN0MsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUE7b0JBQ2QsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUE7b0JBQ2IsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxHQUFHLEVBQUUsRUFBRSxDQUFDO3dCQUFFLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtvQkFFL0QsR0FBRyxDQUFDLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxFQUFFLEdBQUcsSUFBSSxJQUFJLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQzt3QkFFckMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQTt3QkFDNUIsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEdBQUcsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQzs0QkFDbkMsSUFBSSxLQUFLLEdBQUcsU0FBQSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQSxDQUFBOzRCQUNyQyxHQUFHLEdBQUcsTUFBTSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLEdBQUcsQ0FBQTs0QkFDbkMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxHQUFHLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQztnQ0FDOUIsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUE7NEJBQ3RDLENBQUM7d0JBQ0gsQ0FBQzt3QkFDRCxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQzs0QkFDcEMsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFBOzRCQUNsQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQztnQ0FDbkMsSUFBSSxNQUFNLEdBQUcsU0FBQSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUksQ0FBQyxDQUFBLEdBQUcsQ0FBQyxDQUFBO2dDQUMxQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEdBQUcs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LENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEtBQUksQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQzt3QkFDakMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQTtvQkFDdkQsQ0FBQztnQkFDSCxDQUFDO2dCQUNELEdBQUcsR0FBRyxDQUFDLENBQUE7Z0JBRVAsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxLQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7b0JBQ2pDLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7b0JBQ3JELElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQTtvQkFDakMsR0FBRyxJQUFJLFNBQUEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBSSxDQUFDLENBQUEsQ0FBQTtnQkFDN0MsQ0FBQztnQkFDRCxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsS0FB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Q0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUE7Z0NBQzFFLENBQUM7NEJBQ0gsQ0FBQzt3QkFDSCxDQUFDO29CQUNILENBQUM7b0JBQ0QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFBO29CQUNoQyxFQUFFLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDZCxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFBO3dCQUN2QyxFQUFFLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFDZCxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRSxJQUFJLElBQUksRUFBRSxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUM7Z0NBQ3JDLElBQUksSUFBSSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7Z0NBQzVCLElBQUksSUFBSSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQTtnQ0FDOUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVB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QUFHLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEtBQUssQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEtBQUssQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEtBQUssQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUE7UUFDN1MsQ0FBQyxDQUFBO0lBQ0gsQ0FBQztJQVNELGtDQUFNLEdBQU4sVUFBTyxXQUFxQixFQUFFLEVBQVUsRUFBRSxFQUFVLEVBQUUsUUFBMEM7UUFDOUYsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFBO1FBQ3RCLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUNsQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUNuRCxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQTtRQUNmLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFBO0lBQzVFLENBQUM7SUFDSCx3QkFBQztBQUFELENBdkNBLEFBdUNDLElBQUE7QUFFRDtJQVlFLGlDQUFZLENBU1g7UUFURCxpQkF3Q0M7UUFuREQsb0JBQWUsR0FBRyxHQUFHLENBQUE7UUFvRHJCLFVBQUssR0FBRztZQUNOLEtBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsS0FBSSxDQUFDLGVBQWUsRUFBRSxDQUFDLEtBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxHQUFHLEtBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxHQUFHLEtBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQTtZQUNwSCxJQUFJLENBQUMsR0FBRyxLQUFJLENBQUMsSUFBSSxDQUFDLEtBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQTtZQUNsQyxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxLQUFJLENBQUMsVUFBVSxFQUFFLEdBQUcsRUFBRSxLQUFJLENBQUMsSUFBSSxDQUFDLEtBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFBO1lBQzNFLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBQzVCLElBQU0sQ0FBQyxHQUFHLEtBQUksQ0FBQyxHQUFHLENBQUE7WUFDbEIsSUFBTSxDQUFDLEdBQUcsS0FBSSxDQUFDLE1BQU0sQ0FBQTtZQUNyQixJQUFJLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQTtZQUNsQixJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFBO1lBQzdELElBQUksRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUE7WUFDbEUsQ0FBQyxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUE7WUFDbkIsQ0FBQyxDQUFDLFdBQVcsR0FBRyxNQUFNLENBQUE7WUFDdEIsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFBO1lBQ2IsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUE7WUFDaEIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUE7WUFDaEIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUE7WUFDaEIsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFBO1lBQ1YsQ0FBQyxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUE7WUFDcEIsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFBO1lBQ2IsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUE7WUFDaEIsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQTtZQUNuQyxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQTtZQUNoQixDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFF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Q0FBQyxDQUFDLENBQUMsS0FBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BCLEtBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFBO2dCQUNyQixxQkFBcUIsQ0FBQyxLQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7WUFDbkMsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQTVDRCw4Q0FBWSxHQUFaLFVBQWEsSUFBWTtRQUN2QixNQUFNLENBQUMsVUFBQyxDQUFRLElBQUssT0FBQSxRQUFRLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLFdBQVcsR0FBc0IsQ0FBQyxDQUFDLE1BQU8sQ0FBQyxLQUFLLEVBQTlFLENBQThFLENBQUE7SUFDckcsQ0FBQztJQStFSCw4QkFBQztBQUFELENBekZBLEFBeUZDLElBQUE7QUF6RlksMERBQXVCIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogQW4gaW1wbGVtZW50YXRpb24gb2YgT0RFWCwgYnkgRS4gSGFpcmVyIGFuZCBHLiBXYW5uZXIsIHBvcnRlZCBmcm9tIHRoZSBGb3J0cmFuIE9ERVguRi5cbiAqIFRoZSBvcmlnaW5hbCB3b3JrIGNhcnJpZXMgdGhlIEJTRCAyLWNsYXVzZSBsaWNlbnNlLCBhbmQgc28gZG9lcyB0aGlzLlxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNiBDb2xpbiBTbWl0aC5cbiAqIDEuIFJlZGlzdHJpYnV0aW9ucyBvZiBzb3VyY2UgY29kZSBtdXN0IHJldGFpbiB0aGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSwgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmdcbiAqIGRpc2NsYWltZXIuXG4gKiAyLiBSZWRpc3RyaWJ1dGlvbnMgaW4gYmluYXJ5IGZvcm0gbXVzdCByZXByb2R1Y2UgdGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UsIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGVcbiAqIGZvbGxvd2luZyBkaXNjbGFpbWVyIGluIHRoZSBkb2N1bWVudGF0aW9uIGFuZC9vciBvdGhlciBtYXRlcmlhbHMgcHJvdmlkZWQgd2l0aCB0aGUgZGlzdHJpYnV0aW9uLlxuICpcbiAqIFRISVMgU09GVFdBUkUgSVMgUFJPVklERUQgQlkgVEhFIENPUFlSSUdIVCBIT0xERVJTIEFORCBDT05UUklCVVRPUlMgXCJBUyBJU1wiIEFORCBBTlkgRVhQUkVTUyBPUiBJTVBMSUVEIFdBUlJBTlRJRVMsXG4gKiBJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgVEhFIElNUExJRUQgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFkgQU5EIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFXG4gKiBBUkUgRElTQ0xBSU1FRC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIENPUFlSSUdIVCBIT0xERVIgT1IgQ09OVFJJQlVUT1JTIEJFIExJQUJMRSBGT1IgQU5ZIERJUkVDVCwgSU5ESVJFQ1QsXG4gKiBJTkNJREVOVEFMLCBTUEVDSUFMLCBFWEVNUExBUlksIE9SIENPTlNFUVVFTlRJQUwgREFNQUdFUyAoSU5DTFVESU5HLCBCVVQgTk9UIExJTUlURUQgVE8sIFBST0NVUkVNRU5UIE9GIFNVQlNUSVRVVEVcbiAqIEdPT0RTIE9SIFNFUlZJQ0VTOyBMT1NTIE9GIFVTRSwgREFUQSwgT1IgUFJPRklUUzsgT1IgQlVTSU5FU1MgSU5URVJSVVBUSU9OKSBIT1dFVkVSIENBVVNFRCBBTkQgT04gQU5ZIFRIRU9SWSBPRlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIENPTlRSQUNULCBTVFJJQ1QgTElBQklMSVRZLCBPUiBUT1JUIChJTkNMVURJTkcgTkVHTElHRU5DRSBPUiBPVEhFUldJU0UpIEFSSVNJTkcgSU4gQU5ZIFdBWVxuICogT1VUIE9GIFRIRSBVU0UgT0YgVEhJUyBTT0ZUV0FSRSwgRVZFTiBJRiBBRFZJU0VEIE9GIFRIRSBQT1NTSUJJTElUWSBPRiBTVUNIIERBTUFHRS5cbiAqL1xuXG5leHBvcnQgaW50ZXJmYWNlIERlcml2YXRpdmUgeyAgLy8gZnVuY3Rpb24gY29tcHV0aW5nIHRoZSB2YWx1ZSBvZiBZJyA9IEYoeCxZKVxuICAoeDogbnVtYmVyLCAgICAgICAgICAgLy8gaW5wdXQgeCB2YWx1ZVxuICAgeTogbnVtYmVyW10pICAgICAgICAgLy8gaW5wdXQgeSB2YWx1ZSlcbiAgICA6IG51bWJlcltdICAgICAgICAgIC8vIG91dHB1dCB5JyB2YWx1ZXMgKEFycmF5IG9mIGxlbmd0aCBuKVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIE91dHB1dEZ1bmN0aW9uIHsgICAgICAgICAgICAgICAgICAgIC8vIHZhbHVlIGNhbGxiYWNrXG4gIChucjogbnVtYmVyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc3RlcCBudW1iZXJcbiAgIHhvbGQ6IG51bWJlciwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBsZWZ0IGVkZ2Ugb2Ygc29sdXRpb24gaW50ZXJ2YWxcbiAgIHg6IG51bWJlciwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyByaWdodCBlZGdlIG9mIHNvbHV0aW9uIGludGVydmFsICh5ID0gRih4KSlcbiAgIHk6IG51bWJlcltdLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBGKHgpXG4gICBkZW5zZT86IChjOiBudW1iZXIsIHg6IG51bWJlcikgPT4gbnVtYmVyKSAgLy8gZGVuc2UgaW50ZXJwb2xhdG9yLiBWYWxpZCBpbiB0aGUgcmFuZ2UgW3gsIHhvbGQpLlxuICAgIDogYm9vbGVhbnx2b2lkICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJldHVybiBmYWxzZSB0byBoYWx0IGludGVncmF0aW9uXG59XG5cbmV4cG9ydCBlbnVtIE91dGNvbWUge1xuICBDb252ZXJnZWQsXG4gIE1heFN0ZXBzRXhjZWVkZWQsXG4gIEVhcmx5UmV0dXJuXG59XG5cbmV4cG9ydCBjbGFzcyBTb2x2ZXIge1xuICBuOiBudW1iZXIgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBkaW1lbnNpb24gb2YgdGhlIHN5c3RlbVxuICB1Um91bmQ6IG51bWJlciAgICAgICAgICAgICAgICAgICAgICAvLyBXT1JLKDEpLCBtYWNoaW5lIGVwc2lsb24uIChXT1JLLCBJV09SSyBhcmUgcmVmZXJlbmNlcyB0byBvZGV4LmYpXG4gIG1heFN0ZXBzOiBudW1iZXIgICAgICAgICAgICAgICAgICAgIC8vIElXT1JLKDEpLCBwb3NpdGl2ZSBpbnRlZ2VyXG4gIGluaXRpYWxTdGVwU2l6ZTogbnVtYmVyICAgICAgICAgICAgIC8vIEhcbiAgbWF4U3RlcFNpemU6IG51bWJlciAgICAgICAgICAgICAgICAgLy8gV09SSygyKSwgbWF4aW1hbCBzdGVwIHNpemUsIGRlZmF1bHQgeEVuZCAtIHhcbiAgbWF4RXh0cmFwb2xhdGlvbkNvbHVtbnM6IG51bWJlciAgICAgLy8gSVdPUksoMiksIEtNLCBwb3NpdGl2ZSBpbnRlZ2VyXG4gIHN0ZXBTaXplU2VxdWVuY2U6IG51bWJlciAgICAgICAgICAgIC8vIElXT1JLKDMpLCBpbiBbMS4uNV1cbiAgc3RhYmlsaXR5Q2hlY2tDb3VudDogbnVtYmVyICAgICAgICAgLy8gSVdPUksoNCksIGluXG4gIHN0YWJpbGl0eUNoZWNrVGFibGVMaW5lczogbnVtYmVyICAgIC8vIElXT1JLKDUpLCBwb3NpdGl2ZSBpbnRlZ2VyXG4gIGRlbnNlT3V0cHV0OiBib29sZWFuICAgICAgICAgICAgICAgIC8vIElPVVQgPj0gMiwgdHJ1ZSBtZWFucyBkZW5zZSBvdXRwdXQgaW50ZXJwb2xhdG9yIHByb3ZpZGVkIHRvIHNvbE91dFxuICBkZW5zZU91dHB1dEVycm9yRXN0aW1hdG9yOiBib29sZWFuICAvLyBJV09SSyg2KSwgcmV2ZXJzZWQgc2Vuc2UgZnJvbSB0aGUgRk9SVFJBTiBjb2RlXG4gIGRlbnNlQ29tcG9uZW50czogbnVtYmVyW10gICAgICAgICAgIC8vIElXT1JLKDgpICYgSVdPUksoMjEsLi4uKSwgY29tcG9uZW50cyBmb3Igd2hpY2ggZGVuc2Ugb3V0cHV0IGlzIHJlcXVpcmVkXG4gIGludGVycG9sYXRpb25Gb3JtdWxhRGVncmVlOiBudW1iZXIgIC8vIElXT1JLKDcpLCDCtSA9IDIgKiBrIC0gaW50ZXJwb2xhdGlvbkZvcm11bGFEZWdyZWUgKyAxIFsxLi42XSwgZGVmYXVsdCA0XG4gIHN0ZXBTaXplUmVkdWN0aW9uRmFjdG9yOiBudW1iZXIgICAgIC8vIFdPUksoMyksIGRlZmF1bHQgMC41XG4gIHN0ZXBTaXplRmFjMTogbnVtYmVyICAgICAgICAgICAgICAgIC8vIFdPUksoNClcbiAgc3RlcFNpemVGYWMyOiBudW1iZXIgICAgICAgICAgICAgICAgLy8gV09SSyg1KVxuICBzdGVwU2l6ZUZhYzM6IG51bWJlciAgICAgICAgICAgICAgICAvLyBXT1JLKDYpXG4gIHN0ZXBTaXplRmFjNDogbnVtYmVyICAgICAgICAgICAgICAgIC8vIFdPUksoNylcbiAgc3RlcFNhZmV0eUZhY3RvcjE6IG51bWJlciAgICAgICAgICAgLy8gV09SSyg4KVxuICBzdGVwU2FmZXR5RmFjdG9yMjogbnVtYmVyICAgICAgICAgICAvLyBXT1JLKDkpXG4gIHJlbGF0aXZlVG9sZXJhbmNlOiBudW1iZXJ8bnVtYmVyW10gIC8vIFJUT0wuIENhbiBiZSBhIHNjYWxhciBvciB2ZWN0b3Igb2YgbGVuZ3RoIE4uXG4gIGFic29sdXRlVG9sZXJhbmNlOiBudW1iZXJ8bnVtYmVyW10gIC8vIEFUT0wuIENhbiBiZSBhIHNjYWxhciBvciB2ZWN0b3Igb2YgbGVuZ3RoIE4uXG4gIGRlYnVnOiBib29sZWFuXG5cbiAgY29uc3RydWN0b3IobjogbnVtYmVyKSB7XG4gICAgdGhpcy5uID0gblxuICAgIHRoaXMudVJvdW5kID0gMi4zZS0xNlxuICAgIHRoaXMubWF4U3RlcHMgPSAxMDAwMFxuICAgIHRoaXMuaW5pdGlhbFN0ZXBTaXplID0gMWUtNFxuICAgIHRoaXMubWF4U3RlcFNpemUgPSAwXG4gICAgdGhpcy5tYXhFeHRyYXBvbGF0aW9uQ29sdW1ucyA9IDlcbiAgICB0aGlzLnN0ZXBTaXplU2VxdWVuY2UgPSAwXG4gICAgdGhpcy5zdGFiaWxpdHlDaGVja0NvdW50ID0gMVxuICAgIHRoaXMuc3RhYmlsaXR5Q2hlY2tUYWJsZUxpbmVzID0gMlxuICAgIHRoaXMuZGVuc2VPdXRwdXQgPSBmYWxzZVxuICAgIHRoaXMuZGVuc2VPdXRwdXRFcnJvckVzdGltYXRvciA9IHRydWVcbiAgICB0aGlzLmRlbnNlQ29tcG9uZW50cyA9IHVuZGVmaW5lZFxuICAgIHRoaXMuaW50ZXJwb2xhdGlvbkZvcm11bGFEZWdyZWUgPSA0XG4gICAgdGhpcy5zdGVwU2l6ZVJlZHVjdGlvbkZhY3RvciA9IDAuNVxuICAgIHRoaXMuc3RlcFNpemVGYWMxID0gMC4wMlxuICAgIHRoaXMuc3RlcFNpemVGYWMyID0gNC4wXG4gICAgdGhpcy5zdGVwU2l6ZUZhYzMgPSAwLjhcbiAgICB0aGlzLnN0ZXBTaXplRmFjNCA9IDAuOVxuICAgIHRoaXMuc3RlcFNhZmV0eUZhY3RvcjEgPSAwLjY1XG4gICAgdGhpcy5zdGVwU2FmZXR5RmFjdG9yMiA9IDAuOTRcbiAgICB0aGlzLnJlbGF0aXZlVG9sZXJhbmNlID0gMWUtNVxuICAgIHRoaXMuYWJzb2x1dGVUb2xlcmFuY2UgPSAxZS01XG4gICAgdGhpcy5kZWJ1ZyA9IGZhbHNlXG4gIH1cblxuICBncmlkKGR0OiBudW1iZXIsIG91dDogKHhPdXQ6IG51bWJlciwgeU91dDogbnVtYmVyW10pID0+IGFueSk6IE91dHB1dEZ1bmN0aW9uIHtcbiAgICBsZXQgY29tcG9uZW50czogbnVtYmVyW10gPSB0aGlzLmRlbnNlQ29tcG9uZW50c1xuICAgIGlmICghY29tcG9uZW50cykge1xuICAgICAgY29tcG9uZW50cyA9IFtdXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubjsgKytpKSBjb21wb25lbnRzLnB1c2goaSlcbiAgICB9XG4gICAgbGV0IHQ6IG51bWJlclxuICAgIHJldHVybiAobjogbnVtYmVyLCB4T2xkOiBudW1iZXIsIHg6IG51bWJlciwgeTogbnVtYmVyW10sIGludGVycG9sYXRlOiAoaTogbnVtYmVyLCB4OiBudW1iZXIpID0+IG51bWJlcikgPT4ge1xuICAgICAgaWYgKG4gPT09IDEpIHtcbiAgICAgICAgb3V0KHgsIHkpXG4gICAgICAgIHQgPSB4ICsgZHRcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICB3aGlsZSAodCA8PSB4KSB7XG4gICAgICAgIGxldCB5ZjogbnVtYmVyW10gPSBbXVxuICAgICAgICBmb3IgKGxldCBpIG9mIGNvbXBvbmVudHMpIHtcbiAgICAgICAgICB5Zi5wdXNoKGludGVycG9sYXRlKGksIHQpKVxuICAgICAgICB9XG4gICAgICAgIG91dCh0LCB5ZilcbiAgICAgICAgdCArPSBkdFxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIHJldHVybiBhIDEtYmFzZWQgYXJyYXkgb2YgbGVuZ3RoIG4uIEluaXRpYWwgdmFsdWVzIHVuZGVmaW5lZC5cbiAgcHJpdmF0ZSBzdGF0aWMgZGltID0gKG46IG51bWJlcikgPT4gQXJyYXkobiArIDEpXG4gIHByaXZhdGUgc3RhdGljIGxvZzEwID0gKHg6IG51bWJlcikgPT4gTWF0aC5sb2coeCkgLyBNYXRoLkxOMTBcblxuICAvLyBNYWtlIGEgMS1iYXNlZCAyRCBhcnJheSwgd2l0aCByIHJvd3MgYW5kIGMgY29sdW1ucy4gVGhlIGluaXRpYWwgdmFsdWVzIGFyZSB1bmRlZmluZWQuXG4gIHByaXZhdGUgc3RhdGljIGRpbTIocjogbnVtYmVyLCBjOiBudW1iZXIpOiBudW1iZXJbXVtdIHtcbiAgICBsZXQgYSA9IG5ldyBBcnJheShyICsgMSlcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8PSByOyArK2kpIGFbaV0gPSBTb2x2ZXIuZGltKGMpXG4gICAgcmV0dXJuIGFcbiAgfVxuXG4gIC8vIEdlbmVyYXRlIHN0ZXAgc2l6ZSBzZXF1ZW5jZSBhbmQgcmV0dXJuIGFzIGEgMS1iYXNlZCBhcnJheSBvZiBsZW5ndGggbi5cbiAgc3RhdGljIHN0ZXBTaXplU2VxdWVuY2UoblNlcTogbnVtYmVyLCBuOiBudW1iZXIpOiBudW1iZXJbXSB7XG4gICAgY29uc3QgYSA9IG5ldyBBcnJheShuICsgMSlcbiAgICBhWzBdID0gMFxuICAgIHN3aXRjaCAoblNlcSkge1xuICAgICAgY2FzZSAxOlxuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBuOyArK2kpIGFbaV0gPSAyICogaVxuICAgICAgICBicmVha1xuICAgICAgY2FzZSAyOlxuICAgICAgICBhWzFdID0gMlxuICAgICAgICBmb3IgKGxldCBpID0gMjsgaSA8PSBuOyArK2kpIGFbaV0gPSA0ICogaSAtIDRcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgYVsxXSA9IDJcbiAgICAgICAgYVsyXSA9IDRcbiAgICAgICAgYVszXSA9IDZcbiAgICAgICAgZm9yIChsZXQgaSA9IDQ7IGkgPD0gbjsgKytpKSBhW2ldID0gMiAqIGFbaSAtIDJdXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlIDQ6XG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG47ICsraSkgYVtpXSA9IDQgKiBpIC0gMlxuICAgICAgICBicmVha1xuICAgICAgY2FzZSA1OlxuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBuOyArK2kpIGFbaV0gPSA0ICogaVxuICAgICAgICBicmVha1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbnZhbGlkIHN0ZXBTaXplU2VxdWVuY2Ugc2VsZWN0ZWQnKVxuICAgIH1cbiAgICByZXR1cm4gYVxuICB9XG5cbiAgLy8gSW50ZWdyYXRlIHRoZSBkaWZmZXJlbnRpYWwgc3lzdGVtIHJlcHJlc2VudGVkIGJ5IGYsIGZyb20geCB0byB4RW5kLCB3aXRoIGluaXRpYWwgZGF0YSB5LlxuICAvLyBzb2xPdXQsIGlmIHByb3ZpZGVkLCBpcyBjYWxsZWQgYXQgZWFjaCBpbnRlZ3JhdGlvbiBzdGVwLlxuICBzb2x2ZShmOiBEZXJpdmF0aXZlLFxuICAgICAgICB4OiBudW1iZXIsXG4gICAgICAgIHkwOiBudW1iZXJbXSxcbiAgICAgICAgeEVuZDogbnVtYmVyLFxuICAgICAgICBzb2xPdXQ/OiBPdXRwdXRGdW5jdGlvbikge1xuXG4gICAgLy8gTWFrZSBhIGNvcHkgb2YgeTAsIDEtYmFzZWQuIFdlIGxlYXZlIHRoZSB1c2VyJ3MgcGFyYW1ldGVycyBhbG9uZSBzbyB0aGF0IHRoZXkgbWF5IGJlIHJldXNlZCBpZiBkZXNpcmVkLlxuICAgIGxldCB5ID0gWzBdLmNvbmNhdCh5MClcbiAgICBsZXQgZHogPSBTb2x2ZXIuZGltKHRoaXMubilcbiAgICBsZXQgeWgxID0gU29sdmVyLmRpbSh0aGlzLm4pXG4gICAgbGV0IHloMiA9IFNvbHZlci5kaW0odGhpcy5uKVxuICAgIGlmICh0aGlzLm1heFN0ZXBzIDw9IDApIHRocm93IG5ldyBFcnJvcignbWF4U3RlcHMgbXVzdCBiZSBwb3NpdGl2ZScpXG4gICAgY29uc3Qga20gPSB0aGlzLm1heEV4dHJhcG9sYXRpb25Db2x1bW5zXG4gICAgaWYgKGttIDw9IDIpIHRocm93IG5ldyBFcnJvcignbWF4RXh0cmFwb2xhdGlvbkNvbHVtbnMgbXVzdCBiZSA+IDInKVxuICAgIGNvbnN0IG5TZXEgPSB0aGlzLnN0ZXBTaXplU2VxdWVuY2UgfHwgKHRoaXMuZGVuc2VPdXRwdXQgPyA0IDogMSlcbiAgICBpZiAoblNlcSA8PSAzICYmIHRoaXMuZGVuc2VPdXRwdXQpIHRocm93IG5ldyBFcnJvcignc3RlcFNpemVTZXF1ZW5jZSBpbmNvbXBhdGlibGUgd2l0aCBkZW5zZU91dHB1dCcpXG4gICAgaWYgKHRoaXMuZGVuc2VPdXRwdXQgJiYgIXNvbE91dCkgdGhyb3cgbmV3IEVycm9yKCdkZW5zZU91dHB1dCByZXF1aXJlcyBhIHNvbHV0aW9uIG9ic2VydmVyIGZ1bmN0aW9uJylcbiAgICBpZiAodGhpcy5pbnRlcnBvbGF0aW9uRm9ybXVsYURlZ3JlZSA8PSAwIHx8IHRoaXMuaW50ZXJwb2xhdGlvbkZvcm11bGFEZWdyZWUgPj0gNykgdGhyb3cgbmV3IEVycm9yKCdiYWQgaW50ZXJwb2xhdGlvbkZvcm11bGFEZWdyZWUnKVxuICAgIGxldCBpY29tID0gWzBdICAvLyBpY29tIHdpbGwgYmUgMS1iYXNlZCwgc28gc3RhcnQgd2l0aCBhIHBhZCBlbnRyeS5cbiAgICBsZXQgbnJkZW5zID0gMFxuICAgIGlmICh0aGlzLmRlbnNlT3V0cHV0KSB7XG4gICAgICBpZiAodGhpcy5kZW5zZUNvbXBvbmVudHMpIHtcbiAgICAgICAgZm9yIChsZXQgYyBvZiB0aGlzLmRlbnNlQ29tcG9uZW50cykge1xuICAgICAgICAgIC8vIGNvbnZlcnQgZGVuc2UgY29tcG9uZW50cyByZXF1ZXN0ZWQgaW50byBvbmUtYmFzZWQgaW5kZXhpbmcuXG4gICAgICAgICAgaWYgKGMgPCAwIHx8IGMgPiB0aGlzLm4pIHRocm93IG5ldyBFcnJvcignYmFkIGRlbnNlIGNvbXBvbmVudDogJyArIGMpXG4gICAgICAgICAgaWNvbS5wdXNoKGMgKyAxKVxuICAgICAgICAgICsrbnJkZW5zXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGlmIHVzZXIgYXNrZWQgZm9yIGRlbnNlIG91dHB1dCBidXQgZGlkIG5vdCBzcGVjaWZ5IGFueSBkZW5zZUNvbXBvbmVudHMsXG4gICAgICAgIC8vIHJlcXVlc3QgYWxsIG9mIHRoZW0uXG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IHRoaXMubjsgKytpKSB7XG4gICAgICAgICAgaWNvbS5wdXNoKGkpXG4gICAgICAgIH1cbiAgICAgICAgbnJkZW5zID0gdGhpcy5uXG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0aGlzLnVSb3VuZCA8PSAxZS0zNSB8fCB0aGlzLnVSb3VuZCA+IDEpIHRocm93IG5ldyBFcnJvcignc3VzcGljaW91cyB2YWx1ZSBvZiB1Um91bmQnKVxuICAgIGNvbnN0IGhNYXggPSBNYXRoLmFicyh0aGlzLm1heFN0ZXBTaXplIHx8IHhFbmQgLSB4KVxuICAgIGNvbnN0IGxmU2FmZSA9IDIgKiBrbSAqIGttICsga21cblxuICAgIGZ1bmN0aW9uIGV4cGFuZFRvQXJyYXkoeDogbnVtYmVyfG51bWJlcltdLCBuOiBudW1iZXIpOiBudW1iZXJbXSB7XG4gICAgICAvLyBJZiB4IGlzIGFuIGFycmF5LCByZXR1cm4gYSAxLWJhc2VkIGNvcHkgb2YgaXQuIElmIHggaXMgYSBudW1iZXIsIHJldHVybiBhIG5ldyAxLWJhc2VkIGFycmF5XG4gICAgICAvLyBjb25zaXN0aW5nIG9mIG4gY29waWVzIG9mIHRoZSBudW1iZXIuXG4gICAgICBjb25zdCB0b2xBcnJheSA9IFswXVxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoeCkpIHtcbiAgICAgICAgcmV0dXJuIHRvbEFycmF5LmNvbmNhdCh4KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuOyArK2kpIHRvbEFycmF5LnB1c2goeClcbiAgICAgICAgcmV0dXJuIHRvbEFycmF5XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgYVRvbCA9IGV4cGFuZFRvQXJyYXkodGhpcy5hYnNvbHV0ZVRvbGVyYW5jZSwgdGhpcy5uKVxuICAgIGNvbnN0IHJUb2wgPSBleHBhbmRUb0FycmF5KHRoaXMucmVsYXRpdmVUb2xlcmFuY2UsIHRoaXMubilcbiAgICBsZXQgW25FdmFsLCBuU3RlcCwgbkFjY2VwdCwgblJlamVjdF0gPSBbMCwgMCwgMCwgMF1cblxuICAgIC8vIGNhbGwgdG8gY29yZSBpbnRlZ3JhdG9yXG4gICAgY29uc3QgbnJkID0gTWF0aC5tYXgoMSwgbnJkZW5zKVxuICAgIGNvbnN0IG5jb20gPSBNYXRoLm1heCgxLCAoMiAqIGttICsgNSkgKiBucmRlbnMpXG4gICAgY29uc3QgZGVucyA9IFNvbHZlci5kaW0obmNvbSlcbiAgICBjb25zdCBmU2FmZSA9IFNvbHZlci5kaW0yKGxmU2FmZSwgbnJkKVxuXG4gICAgLy8gV3JhcCBmIGluIGEgZnVuY3Rpb24gRiB3aGljaCBoaWRlcyB0aGUgb25lLWJhc2VkIGluZGV4aW5nIGZyb20gdGhlIGN1c3RvbWVycy5cbiAgICBjb25zdCBGID0gKHg6IG51bWJlciwgeTogbnVtYmVyW10sIHlwOiBudW1iZXJbXSkgPT4ge1xuICAgICAgbGV0IHJldCA9IGYoeCwgeS5zbGljZSgxKSlcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmV0Lmxlbmd0aDsgKytpKSB5cFtpICsgMV0gPSByZXRbaV1cbiAgICB9XG5cbiAgICBsZXQgb2R4Y29yID0gKCk6IE91dGNvbWUgPT4ge1xuICAgICAgLy8gVGhlIGZvbGxvd2luZyB0aHJlZSB2YXJpYWJsZXMgYXJlIENPTU1PTi9DT05URVgvXG4gICAgICBsZXQgeE9sZGQ6IG51bWJlclxuICAgICAgbGV0IGhoaDogbnVtYmVyXG4gICAgICBsZXQga21pdDogbnVtYmVyXG5cbiAgICAgIGxldCBhY2NlcHRTdGVwID0gKG46IG51bWJlcik6IGJvb2xlYW4gPT4geyAgIC8vIGxhYmVsIDYwXG4gICAgICAgIC8vIFJldHVybnMgdHJ1ZSBpZiB3ZSBzaG91bGQgY29udGludWUgdGhlIGludGVncmF0aW9uLiBUaGUgb25seSB0aW1lIGZhbHNlXG4gICAgICAgIC8vIGlzIHJldHVybmVkIGlzIHdoZW4gdGhlIHVzZXIncyBzb2x1dGlvbiBvYnNlcnZhdGlvbiBmdW5jdGlvbiBoYXMgcmV0dXJuZWQgZmFsc2UsXG4gICAgICAgIC8vIGluZGljYXRpbmcgdGhhdCBzaGUgZG9lcyBub3Qgd2lzaCB0byBjb250aW51ZSB0aGUgY29tcHV0YXRpb24uXG4gICAgICAgIHhPbGQgPSB4XG4gICAgICAgIHggKz0gaFxuICAgICAgICBpZiAodGhpcy5kZW5zZU91dHB1dCkge1xuICAgICAgICAgIC8vIGttaXQgPSBtdSBvZiB0aGUgcGFwZXJcbiAgICAgICAgICBrbWl0ID0gMiAqIGtjIC0gdGhpcy5pbnRlcnBvbGF0aW9uRm9ybXVsYURlZ3JlZSArIDFcbiAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBucmQ7ICsraSkgZGVuc1tpXSA9IHlbaWNvbVtpXV1cbiAgICAgICAgICB4T2xkZCA9IHhPbGRcbiAgICAgICAgICBoaGggPSBoICAvLyBub3RlOiB4T2xkZCBhbmQgaGhoIGFyZSBwYXJ0IG9mIC9DT05PRFgvXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbnJkOyArK2kpIGRlbnNbbnJkICsgaV0gPSBoICogZHpbaWNvbVtpXV1cbiAgICAgICAgICBsZXQga2xuID0gMiAqIG5yZFxuICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG5yZDsgKytpKSBkZW5zW2tsbiArIGldID0gdFsxXVtpY29tW2ldXVxuICAgICAgICAgIC8vIGNvbXB1dGUgc29sdXRpb24gYXQgbWlkLXBvaW50XG4gICAgICAgICAgZm9yIChsZXQgaiA9IDI7IGogPD0ga2M7ICsraikge1xuICAgICAgICAgICAgbGV0IGRibGVuaiA9IG5qW2pdXG4gICAgICAgICAgICBmb3IgKGxldCBsID0gajsgbCA+PSAyOyAtLWwpIHtcbiAgICAgICAgICAgICAgbGV0IGZhY3RvciA9IChkYmxlbmogLyBualtsIC0gMV0pICoqIDIgLSAxXG4gICAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG5yZDsgKytpKSB7XG4gICAgICAgICAgICAgICAgeVNhZmVbbCAtIDFdW2ldID0geVNhZmVbbF1baV0gKyAoeVNhZmVbbF1baV0gLSB5U2FmZVtsIC0gMV1baV0pIC8gZmFjdG9yXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgbGV0IGtybiA9IDQgKiBucmRcbiAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBucmQ7ICsraSkgZGVuc1trcm4gKyBpXSA9IHlTYWZlWzFdW2ldXG4gICAgICAgICAgLy8gY29tcHV0ZSBmaXJzdCBkZXJpdmF0aXZlIGF0IHJpZ2h0IGVuZFxuICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG47ICsraSkgeWgxW2ldID0gdFsxXVtpXVxuICAgICAgICAgIEYoeCwgeWgxLCB5aDIpXG4gICAgICAgICAga3JuID0gMyAqIG5yZFxuICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG5yZDsgKytpKSBkZW5zW2tybiArIGldID0geWgyW2ljb21baV1dICogaFxuICAgICAgICAgIC8vIFRIRSBMT09QXG4gICAgICAgICAgZm9yIChsZXQga21pID0gMTsga21pIDw9IGttaXQ7ICsra21pKSB7XG4gICAgICAgICAgICAvLyBjb21wdXRlIGttaS10aCBkZXJpdmF0aXZlIGF0IG1pZC1wb2ludFxuICAgICAgICAgICAgbGV0IGtiZWcgPSAoa21pICsgMSkgLyAyIHwgMFxuICAgICAgICAgICAgZm9yIChsZXQga2sgPSBrYmVnOyBrayA8PSBrYzsgKytraykge1xuICAgICAgICAgICAgICBsZXQgZmFjbmogPSAobmpba2tdIC8gMikgKiogKGttaSAtIDEpXG4gICAgICAgICAgICAgIGlQdCA9IGlQb2ludFtrayArIDFdIC0gMiAqIGtrICsga21pXG4gICAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG5yZDsgKytpKSB7XG4gICAgICAgICAgICAgICAgeVNhZmVba2tdW2ldID0gZlNhZmVbaVB0XVtpXSAqIGZhY25qXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAobGV0IGogPSBrYmVnICsgMTsgaiA8PSBrYzsgKytqKSB7XG4gICAgICAgICAgICAgIGxldCBkYmxlbmogPSBualtqXVxuICAgICAgICAgICAgICBmb3IgKGxldCBsID0gajsgbCA+PSBrYmVnICsgMTsgLS1sKSB7XG4gICAgICAgICAgICAgICAgbGV0IGZhY3RvciA9IChkYmxlbmogLyBualtsIC0gMV0pICoqIDIgLSAxXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbnJkOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgIHlTYWZlW2wgLSAxXVtpXSA9IHlTYWZlW2xdW2ldICsgKHlTYWZlW2xdW2ldIC0geVNhZmVbbCAtIDFdW2ldKSAvIGZhY3RvclxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAga3JuID0gKGttaSArIDQpICogbnJkXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBucmQ7ICsraSkgZGVuc1trcm4gKyBpXSA9IHlTYWZlW2tiZWddW2ldICogaFxuICAgICAgICAgICAgaWYgKGttaSA9PT0ga21pdCkgY29udGludWVcbiAgICAgICAgICAgIC8vIGNvbXB1dGUgZGlmZmVyZW5jZXNcbiAgICAgICAgICAgIGZvciAobGV0IGtrID0gKGttaSArIDIpIC8gMiB8IDA7IGtrIDw9IGtjOyArK2trKSB7XG4gICAgICAgICAgICAgIGxldCBsYmVnID0gaVBvaW50W2trICsgMV1cbiAgICAgICAgICAgICAgbGV0IGxlbmQgPSBpUG9pbnRba2tdICsga21pICsgMVxuICAgICAgICAgICAgICBpZiAoa21pID09PSAxICYmIG5TZXEgPT09IDQpIGxlbmQgKz0gMlxuICAgICAgICAgICAgICBsZXQgbDogbnVtYmVyXG4gICAgICAgICAgICAgIGZvciAobCA9IGxiZWc7IGwgPj0gbGVuZDsgbCAtPSAyKSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbnJkOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgIGZTYWZlW2xdW2ldIC09IGZTYWZlW2wgLSAyXVtpXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoa21pID09PSAxICYmIG5TZXEgPT09IDQpIHtcbiAgICAgICAgICAgICAgICBsID0gbGVuZCAtIDJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBucmQ7ICsraSkgZlNhZmVbbF1baV0gLT0gZHpbaWNvbVtpXV1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gY29tcHV0ZSBkaWZmZXJlbmNlc1xuICAgICAgICAgICAgZm9yIChsZXQga2sgPSAoa21pICsgMikgLyAyIHwgMDsga2sgPD0ga2M7ICsra2spIHtcbiAgICAgICAgICAgICAgbGV0IGxiZWcgPSBpUG9pbnRba2sgKyAxXSAtIDFcbiAgICAgICAgICAgICAgbGV0IGxlbmQgPSBpUG9pbnRba2tdICsga21pICsgMlxuICAgICAgICAgICAgICBmb3IgKGxldCBsID0gbGJlZzsgbCA+PSBsZW5kOyBsIC09IDIpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBucmQ7ICsraSkge1xuICAgICAgICAgICAgICAgICAgZlNhZmVbbF1baV0gLT0gZlNhZmVbbCAtIDJdW2ldXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGludGVycChucmQsIGRlbnMsIGttaXQpXG4gICAgICAgICAgLy8gZXN0aW1hdGlvbiBvZiBpbnRlcnBvbGF0aW9uIGVycm9yXG4gICAgICAgICAgaWYgKHRoaXMuZGVuc2VPdXRwdXRFcnJvckVzdGltYXRvciAmJiBrbWl0ID49IDEpIHtcbiAgICAgICAgICAgIGxldCBlcnJpbnQgPSAwXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBucmQ7ICsraSkgZXJyaW50ICs9IChkZW5zWyhrbWl0ICsgNCkgKiBucmQgKyBpXSAvIHNjYWxbaWNvbVtpXV0pICoqIDJcbiAgICAgICAgICAgIGVycmludCA9IE1hdGguc3FydChlcnJpbnQgLyBucmQpICogZXJyZmFjW2ttaXRdXG4gICAgICAgICAgICBob3B0ZGUgPSBoIC8gTWF0aC5tYXgoZXJyaW50ICoqICgxIC8gKGttaXQgKyA0KSksIDAuMDEpXG4gICAgICAgICAgICBpZiAoZXJyaW50ID4gMTApIHtcbiAgICAgICAgICAgICAgaCA9IGhvcHRkZVxuICAgICAgICAgICAgICB4ID0geE9sZFxuICAgICAgICAgICAgICArK25SZWplY3RcbiAgICAgICAgICAgICAgcmVqZWN0ID0gdHJ1ZVxuICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBuOyArK2kpIGR6W2ldID0geWgyW2ldXG4gICAgICAgIH1cbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbjsgKytpKSB5W2ldID0gdFsxXVtpXVxuICAgICAgICArK25BY2NlcHRcbiAgICAgICAgaWYgKHNvbE91dCkge1xuICAgICAgICAgIC8vIElmIGRlbnNlT3V0cHV0LCB3ZSBhbHNvIHdhbnQgdG8gc3VwcGx5IHRoZSBkZW5zZSBjbG9zdXJlLlxuICAgICAgICAgIGlmIChzb2xPdXQobkFjY2VwdCArIDEsIHhPbGQsIHgsIHkuc2xpY2UoMSksXG4gICAgICAgICAgICAgIHRoaXMuZGVuc2VPdXRwdXQgJiYgY29udGV4KHhPbGRkLCBoaGgsIGttaXQsIGRlbnMsIGljb20pKSA9PT0gZmFsc2UpIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgICAgIC8vIGNvbXB1dGUgb3B0aW1hbCBvcmRlclxuICAgICAgICBsZXQga29wdDogbnVtYmVyXG4gICAgICAgIGlmIChrYyA9PT0gMikge1xuICAgICAgICAgIGtvcHQgPSBNYXRoLm1pbigzLCBrbSAtIDEpXG4gICAgICAgICAgaWYgKHJlamVjdCkga29wdCA9IDJcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoa2MgPD0gaykge1xuICAgICAgICAgICAga29wdCA9IGtjXG4gICAgICAgICAgICBpZiAod1trYyAtIDFdIDwgd1trY10gKiB0aGlzLnN0ZXBTaXplRmFjMykga29wdCA9IGtjIC0gMVxuICAgICAgICAgICAgaWYgKHdba2NdIDwgd1trYyAtIDFdICogdGhpcy5zdGVwU2l6ZUZhYzQpIGtvcHQgPSBNYXRoLm1pbihrYyArIDEsIGttIC0gMSlcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAga29wdCA9IGtjIC0gMVxuICAgICAgICAgICAgaWYgKGtjID4gMyAmJiB3W2tjIC0gMl0gPCB3W2tjIC0gMV0gKiB0aGlzLnN0ZXBTaXplRmFjMykga29wdCA9IGtjIC0gMlxuICAgICAgICAgICAgaWYgKHdba2NdIDwgd1trb3B0XSAqIHRoaXMuc3RlcFNpemVGYWM0KSBrb3B0ID0gTWF0aC5taW4oa2MsIGttIC0gMSlcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gYWZ0ZXIgYSByZWplY3RlZCBzdGVwXG4gICAgICAgIGlmIChyZWplY3QpIHtcbiAgICAgICAgICBrID0gTWF0aC5taW4oa29wdCwga2MpXG4gICAgICAgICAgaCA9IHBvc25lZyAqIE1hdGgubWluKE1hdGguYWJzKGgpLCBNYXRoLmFicyhoaFtrXSkpXG4gICAgICAgICAgcmVqZWN0ID0gZmFsc2VcbiAgICAgICAgICByZXR1cm4gdHJ1ZSAgLy8gZ290byAxMFxuICAgICAgICB9XG4gICAgICAgIGlmIChrb3B0IDw9IGtjKSB7XG4gICAgICAgICAgaCA9IGhoW2tvcHRdXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKGtjIDwgayAmJiB3W2tjXSA8IHdba2MgLSAxXSAqIHRoaXMuc3RlcFNpemVGYWM0KSB7XG4gICAgICAgICAgICBoID0gaGhba2NdICogYVtrb3B0ICsgMV0gLyBhW2tjXVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBoID0gaGhba2NdICogYVtrb3B0XSAvIGFba2NdXG4gICAgICAgICAgfVxuXG5cbiAgICAgICAgfVxuICAgICAgICAvLyBjb21wdXRlIHN0ZXBzaXplIGZvciBuZXh0IHN0ZXBcbiAgICAgICAgayA9IGtvcHRcbiAgICAgICAgaCA9IHBvc25lZyAqIE1hdGguYWJzKGgpXG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICB9XG5cbiAgICAgIGxldCBtaWRleCA9IChqOiBudW1iZXIpOiB2b2lkID0+IHtcbiAgICAgICAgY29uc3QgZHkgPSBTb2x2ZXIuZGltKHRoaXMubilcbiAgICAgICAgLy8gQ29tcHV0ZXMgdGhlIGp0aCBsaW5lIG9mIHRoZSBleHRyYXBvbGF0aW9uIHRhYmxlIGFuZFxuICAgICAgICAvLyBwcm92aWRlcyBhbiBlc3RpbWF0aW9uIG9mIHRoZSBvcHRpb25hbCBzdGVwc2l6ZVxuICAgICAgICBjb25zdCBoaiA9IGggLyBualtqXVxuICAgICAgICAvLyBFdWxlciBzdGFydGluZyBzdGVwXG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IHRoaXMubjsgKytpKSB7XG4gICAgICAgICAgeWgxW2ldID0geVtpXVxuICAgICAgICAgIHloMltpXSA9IHlbaV0gKyBoaiAqIGR6W2ldXG4gICAgICAgIH1cbiAgICAgICAgLy8gRXhwbGljaXQgbWlkcG9pbnQgcnVsZVxuICAgICAgICBjb25zdCBtID0gbmpbal0gLSAxXG4gICAgICAgIGNvbnN0IG5qTWlkID0gKG5qW2pdIC8gMikgfCAwXG4gICAgICAgIGZvciAobGV0IG1tID0gMTsgbW0gPD0gbTsgKyttbSkge1xuICAgICAgICAgIGlmICh0aGlzLmRlbnNlT3V0cHV0ICYmIG1tID09PSBuak1pZCkge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbnJkOyArK2kpIHtcbiAgICAgICAgICAgICAgeVNhZmVbal1baV0gPSB5aDJbaWNvbVtpXV1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgRih4ICsgaGogKiBtbSwgeWgyLCBkeSlcbiAgICAgICAgICBpZiAodGhpcy5kZW5zZU91dHB1dCAmJiBNYXRoLmFicyhtbSAtIG5qTWlkKSA8PSAyICogaiAtIDEpIHtcbiAgICAgICAgICAgICsraVB0XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBucmQ7ICsraSkge1xuICAgICAgICAgICAgICBmU2FmZVtpUHRdW2ldID0gZHlbaWNvbVtpXV1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gdGhpcy5uOyArK2kpIHtcbiAgICAgICAgICAgIGxldCB5cyA9IHloMVtpXVxuICAgICAgICAgICAgeWgxW2ldID0geWgyW2ldXG4gICAgICAgICAgICB5aDJbaV0gPSB5cyArIDIgKiBoaiAqIGR5W2ldXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChtbSA8PSB0aGlzLnN0YWJpbGl0eUNoZWNrQ291bnQgJiYgaiA8PSB0aGlzLnN0YWJpbGl0eUNoZWNrVGFibGVMaW5lcykge1xuICAgICAgICAgICAgLy8gc3RhYmlsaXR5IGNoZWNrXG4gICAgICAgICAgICBsZXQgZGVsMSA9IDBcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IHRoaXMubjsgKytpKSB7XG4gICAgICAgICAgICAgIGRlbDEgKz0gKGR6W2ldIC8gc2NhbFtpXSkgKiogMlxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IGRlbDIgPSAwXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSB0aGlzLm47ICsraSkge1xuICAgICAgICAgICAgICBkZWwyICs9ICgoZHlbaV0gLSBkeltpXSkgLyBzY2FsW2ldKSAqKiAyXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBxdW90ID0gZGVsMiAvIE1hdGgubWF4KHRoaXMudVJvdW5kLCBkZWwxKVxuICAgICAgICAgICAgaWYgKHF1b3QgPiA0KSB7XG4gICAgICAgICAgICAgICsrbkV2YWxcbiAgICAgICAgICAgICAgYXRvdiA9IHRydWVcbiAgICAgICAgICAgICAgaCAqPSB0aGlzLnN0ZXBTaXplUmVkdWN0aW9uRmFjdG9yXG4gICAgICAgICAgICAgIHJlamVjdCA9IHRydWVcbiAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIGZpbmFsIHNtb290aGluZyBzdGVwXG4gICAgICAgIEYoeCArIGgsIHloMiwgZHkpXG4gICAgICAgIGlmICh0aGlzLmRlbnNlT3V0cHV0ICYmIG5qTWlkIDw9IDIgKiBqIC0gMSkge1xuICAgICAgICAgICsraVB0XG4gICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbnJkOyArK2kpIHtcbiAgICAgICAgICAgIGZTYWZlW2lQdF1baV0gPSBkeVtpY29tW2ldXVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSB0aGlzLm47ICsraSkge1xuICAgICAgICAgIHRbal1baV0gPSAoeWgxW2ldICsgeWgyW2ldICsgaGogKiBkeVtpXSkgLyAyXG4gICAgICAgIH1cbiAgICAgICAgbkV2YWwgKz0gbmpbal1cbiAgICAgICAgLy8gcG9seW5vbWlhbCBleHRyYXBvbGF0aW9uXG4gICAgICAgIGlmIChqID09PSAxKSByZXR1cm4gIC8vIHdhcyBqLmVxLjFcbiAgICAgICAgY29uc3QgZGJsZW5qID0gbmpbal1cbiAgICAgICAgbGV0IGZhYzogbnVtYmVyXG4gICAgICAgIGZvciAobGV0IGwgPSBqOyBsID4gMTsgLS1sKSB7XG4gICAgICAgICAgZmFjID0gKGRibGVuaiAvIG5qW2wgLSAxXSkgKiogMiAtIDFcbiAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSB0aGlzLm47ICsraSkge1xuICAgICAgICAgICAgdFtsIC0gMV1baV0gPSB0W2xdW2ldICsgKHRbbF1baV0gLSB0W2wgLSAxXVtpXSkgLyBmYWNcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZXJyID0gMFxuICAgICAgICAvLyBzY2FsaW5nXG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IHRoaXMubjsgKytpKSB7XG4gICAgICAgICAgbGV0IHQxaSA9IE1hdGgubWF4KE1hdGguYWJzKHlbaV0pLCBNYXRoLmFicyh0WzFdW2ldKSlcbiAgICAgICAgICBzY2FsW2ldID0gYVRvbFtpXSArIHJUb2xbaV0gKiB0MWlcbiAgICAgICAgICBlcnIgKz0gKCh0WzFdW2ldIC0gdFsyXVtpXSkgLyBzY2FsW2ldKSAqKiAyXG4gICAgICAgIH1cbiAgICAgICAgZXJyID0gTWF0aC5zcXJ0KGVyciAvIHRoaXMubilcbiAgICAgICAgaWYgKGVyciAqIHRoaXMudVJvdW5kID49IDEgfHwgKGogPiAyICYmIGVyciA+PSBlcnJPbGQpKSB7XG4gICAgICAgICAgYXRvdiA9IHRydWVcbiAgICAgICAgICBoICo9IHRoaXMuc3RlcFNpemVSZWR1Y3Rpb25GYWN0b3JcbiAgICAgICAgICByZWplY3QgPSB0cnVlXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgZXJyT2xkID0gTWF0aC5tYXgoNCAqIGVyciwgMSlcbiAgICAgICAgLy8gY29tcHV0ZSBvcHRpbWFsIHN0ZXBzaXplc1xuICAgICAgICBsZXQgZXhwMCA9IDEgLyAoMiAqIGogLSAxKVxuICAgICAgICBsZXQgZmFjTWluID0gdGhpcy5zdGVwU2l6ZUZhYzEgKiogZXhwMFxuICAgICAgICBmYWMgPSBNYXRoLm1pbih0aGlzLnN0ZXBTaXplRmFjMiAvIGZhY01pbixcbiAgICAgICAgICBNYXRoLm1heChmYWNNaW4sIChlcnIgLyB0aGlzLnN0ZXBTYWZldHlGYWN0b3IxKSAqKiBleHAwIC8gdGhpcy5zdGVwU2FmZXR5RmFjdG9yMikpXG4gICAgICAgIGZhYyA9IDEgLyBmYWNcbiAgICAgICAgaGhbal0gPSBNYXRoLm1pbihNYXRoLmFicyhoKSAqIGZhYywgaE1heClcbiAgICAgICAgd1tqXSA9IGFbal0gLyBoaFtqXVxuICAgICAgfVxuXG4gICAgICBjb25zdCBpbnRlcnAgPSAobjogbnVtYmVyLCB5OiBudW1iZXJbXSwgaW1pdDogbnVtYmVyKSA9PiB7XG4gICAgICAgIC8vIGNvbXB1dGVzIHRoZSBjb2VmZmljaWVudHMgb2YgdGhlIGludGVycG9sYXRpb24gZm9ybXVsYVxuICAgICAgICBsZXQgYSA9IG5ldyBBcnJheSgzMSkgIC8vIHplcm8tYmFzZWQ6IDA6MzBcbiAgICAgICAgLy8gYmVnaW4gd2l0aCBIZXJtaXRlIGludGVycG9sYXRpb25cbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbjsgKytpKSB7XG4gICAgICAgICAgbGV0IHkwID0geVtpXVxuICAgICAgICAgIGxldCB5MSA9IHlbMiAqIG4gKyBpXVxuICAgICAgICAgIGxldCB5cDAgPSB5W24gKyBpXVxuICAgICAgICAgIGxldCB5cDEgPSB5WzMgKiBuICsgaV1cbiAgICAgICAgICBsZXQgeURpZmYgPSB5MSAtIHkwXG4gICAgICAgICAgbGV0IGFzcGwgPSAteXAxICsgeURpZmZcbiAgICAgICAgICBsZXQgYnNwbCA9IHlwMCAtIHlEaWZmXG4gICAgICAgICAgeVtuICsgaV0gPSB5RGlmZlxuICAgICAgICAgIHlbMiAqIG4gKyBpXSA9IGFzcGxcbiAgICAgICAgICB5WzMgKiBuICsgaV0gPSBic3BsXG4gICAgICAgICAgaWYgKGltaXQgPCAwKSBjb250aW51ZVxuICAgICAgICAgIC8vIGNvbXB1dGUgdGhlIGRlcml2YXRpdmVzIG9mIEhlcm1pdGUgYXQgbWlkcG9pbnRcbiAgICAgICAgICBsZXQgcGgwID0gKHkwICsgeTEpICogMC41ICsgMC4xMjUgKiAoYXNwbCArIGJzcGwpXG4gICAgICAgICAgbGV0IHBoMSA9IHlEaWZmICsgKGFzcGwgLSBic3BsKSAqIDAuMjVcbiAgICAgICAgICBsZXQgcGgyID0gLSh5cDAgLSB5cDEpXG4gICAgICAgICAgbGV0IHBoMyA9IDYgKiAoYnNwbCAtIGFzcGwpXG4gICAgICAgICAgLy8gY29tcHV0ZSB0aGUgZnVydGhlciBjb2VmZmljaWVudHNcbiAgICAgICAgICBpZiAoaW1pdCA+PSAxKSB7XG4gICAgICAgICAgICBhWzFdID0gMTYgKiAoeVs1ICogbiArIGldIC0gcGgxKVxuICAgICAgICAgICAgaWYgKGltaXQgPj0gMykge1xuICAgICAgICAgICAgICBhWzNdID0gMTYgKiAoeVs3ICogbiArIGldIC0gcGgzICsgMyAqIGFbMV0pXG4gICAgICAgICAgICAgIGlmIChpbWl0ID49IDUpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpbSA9IDU7IGltIDw9IGltaXQ7IGltICs9IDIpIHtcbiAgICAgICAgICAgICAgICAgIGxldCBmYWMxID0gaW0gKiAoaW0gLSAxKSAvIDJcbiAgICAgICAgICAgICAgICAgIGxldCBmYWMyID0gZmFjMSAqIChpbSAtIDIpICogKGltIC0gMykgKiAyXG4gICAgICAgICAgICAgICAgICBhW2ltXSA9IDE2ICogKHlbKGltICsgNCkgKiBuICsgaV0gKyBmYWMxICogYVtpbSAtIDJdIC0gZmFjMiAqIGFbaW0gLSA0XSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYVswXSA9ICh5WzQgKiBuICsgaV0gLSBwaDApICogMTZcbiAgICAgICAgICBpZiAoaW1pdCA+PSAyKSB7XG4gICAgICAgICAgICBhWzJdID0gKHlbbiAqIDYgKyBpXSAtIHBoMiArIGFbMF0pICogMTZcbiAgICAgICAgICAgIGlmIChpbWl0ID49IDQpIHtcbiAgICAgICAgICAgICAgZm9yIChsZXQgaW0gPSA0OyBpbSA8PSBpbWl0OyBpbSArPSAyKSB7XG4gICAgICAgICAgICAgICAgbGV0IGZhYzEgPSBpbSAqIChpbSAtIDEpIC8gMlxuICAgICAgICAgICAgICAgIGxldCBmYWMyID0gaW0gKiAoaW0gLSAxKSAqIChpbSAtIDIpICogKGltIC0gMylcbiAgICAgICAgICAgICAgICBhW2ltXSA9ICh5W24gKiAoaW0gKyA0KSArIGldICsgYVtpbSAtIDJdICogZmFjMSAtIGFbaW0gLSA0XSAqIGZhYzIpICogMTZcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBmb3IgKGxldCBpbSA9IDA7IGltIDw9IGltaXQ7ICsraW0pIHlbbiAqIChpbSArIDQpICsgaV0gPSBhW2ltXVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNvbnRleCA9ICh4T2xkOiBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgaDogbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgIGltaXQ6IG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICB5OiBudW1iZXJbXSxcbiAgICAgICAgICAgICAgICAgICAgICBpY29tOiBudW1iZXJbXSkgPT4ge1xuICAgICAgICByZXR1cm4gKGM6IG51bWJlciwgeDogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgbGV0IGkgPSAwXG4gICAgICAgICAgZm9yIChsZXQgaiA9IDE7IGogPD0gbnJkOyArK2opIHtcbiAgICAgICAgICAgIC8vIGNhcmVmdWw6IGN1c3RvbWVycyBkZXNjcmliZSBjb21wb25lbnRzIDAtYmFzZWQuIFdlIHJlY29yZCBpbmRpY2VzIDEtYmFzZWQuXG4gICAgICAgICAgICBpZiAoaWNvbVtqXSA9PT0gYyArIDEpIGkgPSBqXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChpID09PSAwKSB0aHJvdyBuZXcgRXJyb3IoJ25vIGRlbnNlIG91dHB1dCBhdmFpbGFibGUgZm9yIGNvbXBvbmVudCAnICsgYylcbiAgICAgICAgICBjb25zdCB0aGV0YSA9ICh4IC0geE9sZCkgLyBoXG4gICAgICAgICAgY29uc3QgdGhldGExID0gMSAtIHRoZXRhXG4gICAgICAgICAgY29uc3QgcGh0aGV0ID0geVtpXSArIHRoZXRhICogKHlbbnJkICsgaV0gKyB0aGV0YTEgKiAoeVsyICogbnJkICsgaV0gKiB0aGV0YSArIHlbMyAqIG5yZCArIGldICogdGhldGExKSlcbiAgICAgICAgICBpZiAoaW1pdCA8IDApIHJldHVybiBwaHRoZXRcbiAgICAgICAgICBjb25zdCB0aGV0YWggPSB0aGV0YSAtIDAuNVxuICAgICAgICAgIGxldCByZXQgPSB5W25yZCAqIChpbWl0ICsgNCkgKyBpXVxuICAgICAgICAgIGZvciAobGV0IGltID0gaW1pdDsgaW0gPj0gMTsgLS1pbSkge1xuICAgICAgICAgICAgcmV0ID0geVtucmQgKiAoaW0gKyAzKSArIGldICsgcmV0ICogdGhldGFoIC8gaW1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHBodGhldCArICh0aGV0YSAqIHRoZXRhMSkgKiogMiAqIHJldFxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIHByZXBhcmF0aW9uXG4gICAgICBjb25zdCB5U2FmZSA9IFNvbHZlci5kaW0yKGttLCBucmQpXG4gICAgICBjb25zdCBoaCA9IFNvbHZlci5kaW0oa20pXG4gICAgICBjb25zdCB0ID0gU29sdmVyLmRpbTIoa20sIHRoaXMubilcbiAgICAgIC8vIERlZmluZSB0aGUgc3RlcCBzaXplIHNlcXVlbmNlXG4gICAgICBjb25zdCBuaiA9IFNvbHZlci5zdGVwU2l6ZVNlcXVlbmNlKG5TZXEsIGttKVxuICAgICAgLy8gRGVmaW5lIHRoZSBhW2ldIGZvciBvcmRlciBzZWxlY3Rpb25cbiAgICAgIGNvbnN0IGEgPSBTb2x2ZXIuZGltKGttKVxuICAgICAgYVsxXSA9IDEgKyBualsxXVxuICAgICAgZm9yIChsZXQgaSA9IDI7IGkgPD0ga207ICsraSkge1xuICAgICAgICBhW2ldID0gYVtpIC0gMV0gKyBualtpXVxuICAgICAgfVxuICAgICAgLy8gSW5pdGlhbCBTY2FsaW5nXG4gICAgICBjb25zdCBzY2FsID0gU29sdmVyLmRpbSh0aGlzLm4pXG4gICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSB0aGlzLm47ICsraSkge1xuICAgICAgICBzY2FsW2ldID0gYVRvbFtpXSArIHJUb2xbaV0gKyBNYXRoLmFicyh5W2ldKVxuICAgICAgfVxuICAgICAgLy8gSW5pdGlhbCBwcmVwYXJhdGlvbnNcbiAgICAgIGNvbnN0IHBvc25lZyA9IHhFbmQgLSB4ID49IDAgPyAxIDogLTFcbiAgICAgIGxldCBrID0gTWF0aC5tYXgoMiwgTWF0aC5taW4oa20gLSAxLCBNYXRoLmZsb29yKC1Tb2x2ZXIubG9nMTAoclRvbFsxXSArIDFlLTQwKSAqIDAuNiArIDEuNSkpKVxuICAgICAgbGV0IGggPSBNYXRoLm1heChNYXRoLmFicyh0aGlzLmluaXRpYWxTdGVwU2l6ZSksIDFlLTQpXG4gICAgICBoID0gcG9zbmVnICogTWF0aC5taW4oaCwgaE1heCwgTWF0aC5hYnMoeEVuZCAtIHgpIC8gMilcbiAgICAgIGNvbnN0IGlQb2ludCA9IFNvbHZlci5kaW0oa20gKyAxKVxuICAgICAgY29uc3QgZXJyZmFjID0gU29sdmVyLmRpbSgyICoga20pXG4gICAgICBsZXQgeE9sZCA9IHhcbiAgICAgIGxldCBpUHQgPSAwXG4gICAgICBpZiAoc29sT3V0KSB7XG4gICAgICAgIGlmICh0aGlzLmRlbnNlT3V0cHV0KSB7XG4gICAgICAgICAgaVBvaW50WzFdID0gMFxuICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IGttOyArK2kpIHtcbiAgICAgICAgICAgIGxldCBuakFkZCA9IDQgKiBpIC0gMlxuICAgICAgICAgICAgaWYgKG5qW2ldID4gbmpBZGQpICsrbmpBZGRcbiAgICAgICAgICAgIGlQb2ludFtpICsgMV0gPSBpUG9pbnRbaV0gKyBuakFkZFxuICAgICAgICAgIH1cbiAgICAgICAgICBmb3IgKGxldCBtdSA9IDE7IG11IDw9IDIgKiBrbTsgKyttdSkge1xuICAgICAgICAgICAgbGV0IGVycnggPSBNYXRoLnNxcnQobXUgLyAobXUgKyA0KSkgKiAwLjVcbiAgICAgICAgICAgIGxldCBwcm9kID0gKDEgLyAobXUgKyA0KSkgKiogMlxuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDE7IGogPD0gbXU7ICsraikgcHJvZCAqPSBlcnJ4IC8galxuICAgICAgICAgICAgZXJyZmFjW211XSA9IHByb2RcbiAgICAgICAgICB9XG4gICAgICAgICAgaVB0ID0gMFxuICAgICAgICB9XG4gICAgICAgIC8vIGNoZWNrIHJldHVybiB2YWx1ZSBhbmQgYWJhbmRvbiBpbnRlZ3JhdGlvbiBpZiBjYWxsZWQgZm9yXG4gICAgICAgIGlmIChmYWxzZSA9PT0gc29sT3V0KG5BY2NlcHQgKyAxLCB4T2xkLCB4LCB5LnNsaWNlKDEpKSkge1xuICAgICAgICAgIHJldHVybiBPdXRjb21lLkVhcmx5UmV0dXJuXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGxldCBlcnIgPSAwXG4gICAgICBsZXQgZXJyT2xkID0gMWUxMFxuICAgICAgbGV0IGhvcHRkZSA9IHBvc25lZyAqIGhNYXhcbiAgICAgIGNvbnN0IHcgPSBTb2x2ZXIuZGltKGttKVxuICAgICAgd1sxXSA9IDBcbiAgICAgIGxldCByZWplY3QgPSBmYWxzZVxuICAgICAgbGV0IGxhc3QgPSBmYWxzZVxuICAgICAgbGV0IGF0b3Y6IGJvb2xlYW5cbiAgICAgIGxldCBrYyA9IDBcblxuICAgICAgZW51bSBTVEFURSB7XG4gICAgICAgIFN0YXJ0LCBCYXNpY0ludGVncmF0aW9uU3RlcCwgQ29udmVyZ2VuY2VTdGVwLCBIb3BlRm9yQ29udmVyZ2VuY2UsIEFjY2VwdCwgUmVqZWN0XG4gICAgICB9XG4gICAgICBsZXQgc3RhdGU6IFNUQVRFID0gU1RBVEUuU3RhcnRcblxuICAgICAgbG9vcDogd2hpbGUgKHRydWUpIHtcbiAgICAgICAgdGhpcy5kZWJ1ZyAmJiBjb25zb2xlLmxvZygnU1RBVEUnLCBTVEFURVtzdGF0ZV0sIG5TdGVwLCB4T2xkLCB4LCBoLCBrLCBrYywgaG9wdGRlKVxuICAgICAgICBzd2l0Y2ggKHN0YXRlKSB7XG4gICAgICAgICAgY2FzZSBTVEFURS5TdGFydDpcbiAgICAgICAgICAgIGF0b3YgPSBmYWxzZVxuICAgICAgICAgICAgLy8gSXMgeEVuZCByZWFjaGVkIGluIHRoZSBuZXh0IHN0ZXA/XG4gICAgICAgICAgICBpZiAoMC4xICogTWF0aC5hYnMoeEVuZCAtIHgpIDw9IE1hdGguYWJzKHgpICogdGhpcy51Um91bmQpIGJyZWFrIGxvb3BcbiAgICAgICAgICAgIGggPSBwb3NuZWcgKiBNYXRoLm1pbihNYXRoLmFicyhoKSwgTWF0aC5hYnMoeEVuZCAtIHgpLCBoTWF4LCBNYXRoLmFicyhob3B0ZGUpKVxuICAgICAgICAgICAgaWYgKCh4ICsgMS4wMSAqIGggLSB4RW5kKSAqIHBvc25lZyA+IDApIHtcbiAgICAgICAgICAgICAgaCA9IHhFbmQgLSB4XG4gICAgICAgICAgICAgIGxhc3QgPSB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoblN0ZXAgPT09IDAgfHwgIXRoaXMuZGVuc2VPdXRwdXQpIHtcbiAgICAgICAgICAgICAgRih4LCB5LCBkeilcbiAgICAgICAgICAgICAgKytuRXZhbFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gVGhlIGZpcnN0IGFuZCBsYXN0IHN0ZXBcbiAgICAgICAgICAgIGlmIChuU3RlcCA9PT0gMCB8fCBsYXN0KSB7XG4gICAgICAgICAgICAgIGlQdCA9IDBcbiAgICAgICAgICAgICAgKytuU3RlcFxuICAgICAgICAgICAgICBmb3IgKGxldCBqID0gMTsgaiA8PSBrOyArK2opIHtcbiAgICAgICAgICAgICAgICBrYyA9IGpcbiAgICAgICAgICAgICAgICBtaWRleChqKVxuICAgICAgICAgICAgICAgIGlmIChhdG92KSBjb250aW51ZSBsb29wXG4gICAgICAgICAgICAgICAgaWYgKGogPiAxICYmIGVyciA8PSAxKSB7XG4gICAgICAgICAgICAgICAgICBzdGF0ZSA9IFNUQVRFLkFjY2VwdFxuICAgICAgICAgICAgICAgICAgY29udGludWUgbG9vcFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBzdGF0ZSA9IFNUQVRFLkhvcGVGb3JDb252ZXJnZW5jZVxuICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3RhdGUgPSBTVEFURS5CYXNpY0ludGVncmF0aW9uU3RlcFxuICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgIGNhc2UgU1RBVEUuQmFzaWNJbnRlZ3JhdGlvblN0ZXA6XG4gICAgICAgICAgICAvLyBiYXNpYyBpbnRlZ3JhdGlvbiBzdGVwXG4gICAgICAgICAgICBpUHQgPSAwXG4gICAgICAgICAgICArK25TdGVwXG4gICAgICAgICAgICBpZiAoblN0ZXAgPj0gdGhpcy5tYXhTdGVwcykge1xuICAgICAgICAgICAgICByZXR1cm4gT3V0Y29tZS5NYXhTdGVwc0V4Y2VlZGVkXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBrYyA9IGsgLSAxXG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMTsgaiA8PSBrYzsgKytqKSB7XG4gICAgICAgICAgICAgIG1pZGV4KGopXG4gICAgICAgICAgICAgIGlmIChhdG92KSB7XG4gICAgICAgICAgICAgICAgc3RhdGUgPSBTVEFURS5TdGFydFxuICAgICAgICAgICAgICAgIGNvbnRpbnVlIGxvb3BcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gY29udmVyZ2VuY2UgbW9uaXRvclxuICAgICAgICAgICAgaWYgKGsgPT09IDIgfHwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgIHN0YXRlID0gU1RBVEUuQ29udmVyZ2VuY2VTdGVwXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBpZiAoZXJyIDw9IDEpIHtcbiAgICAgICAgICAgICAgICBzdGF0ZSA9IFNUQVRFLkFjY2VwdFxuICAgICAgICAgICAgICB9IGVsc2UgaWYgKGVyciA+ICgobmpbayArIDFdICogbmpba10pIC8gNCkgKiogMikge1xuICAgICAgICAgICAgICAgIHN0YXRlID0gU1RBVEUuUmVqZWN0XG4gICAgICAgICAgICAgIH0gZWxzZSBzdGF0ZSA9IFNUQVRFLkNvbnZlcmdlbmNlU3RlcFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgIGNhc2UgU1RBVEUuQ29udmVyZ2VuY2VTdGVwOiAgLy8gbGFiZWwgNTBcbiAgICAgICAgICAgIG1pZGV4KGspXG4gICAgICAgICAgICBpZiAoYXRvdikge1xuICAgICAgICAgICAgICBzdGF0ZSA9IFNUQVRFLlN0YXJ0XG4gICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBrYyA9IGtcbiAgICAgICAgICAgIGlmIChlcnIgPD0gMSkge1xuICAgICAgICAgICAgICBzdGF0ZSA9IFNUQVRFLkFjY2VwdFxuICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3RhdGUgPSBTVEFURS5Ib3BlRm9yQ29udmVyZ2VuY2VcbiAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICBjYXNlIFNUQVRFLkhvcGVGb3JDb252ZXJnZW5jZTpcbiAgICAgICAgICAgIC8vIGhvcGUgZm9yIGNvbnZlcmdlbmNlIGluIGxpbmUgayArIDFcbiAgICAgICAgICAgIGlmIChlcnIgPiAobmpbayArIDFdIC8gMikgKiogMikge1xuICAgICAgICAgICAgICBzdGF0ZSA9IFNUQVRFLlJlamVjdFxuICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAga2MgPSBrICsgMVxuICAgICAgICAgICAgbWlkZXgoa2MpXG4gICAgICAgICAgICBpZiAoYXRvdikgc3RhdGUgPSBTVEFURS5TdGFydFxuICAgICAgICAgICAgZWxzZSBpZiAoZXJyID4gMSkgc3RhdGUgPSBTVEFURS5SZWplY3RcbiAgICAgICAgICAgIGVsc2Ugc3RhdGUgPSBTVEFURS5BY2NlcHRcbiAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICBjYXNlIFNUQVRFLkFjY2VwdDpcbiAgICAgICAgICAgIGlmICghYWNjZXB0U3RlcCh0aGlzLm4pKSByZXR1cm4gT3V0Y29tZS5FYXJseVJldHVyblxuICAgICAgICAgICAgc3RhdGUgPSBTVEFURS5TdGFydFxuICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgIGNhc2UgU1RBVEUuUmVqZWN0OlxuICAgICAgICAgICAgayA9IE1hdGgubWluKGssIGtjLCBrbSAtIDEpXG4gICAgICAgICAgICBpZiAoayA+IDIgJiYgd1trIC0gMV0gPCB3W2tdICogdGhpcy5zdGVwU2l6ZUZhYzMpIGsgLT0gMVxuICAgICAgICAgICAgKytuUmVqZWN0XG4gICAgICAgICAgICBoID0gcG9zbmVnICogaGhba11cbiAgICAgICAgICAgIHJlamVjdCA9IHRydWVcbiAgICAgICAgICAgIHN0YXRlID0gU1RBVEUuQmFzaWNJbnRlZ3JhdGlvblN0ZXBcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIE91dGNvbWUuQ29udmVyZ2VkXG4gICAgfVxuXG4gICAgY29uc3Qgb3V0Y29tZSA9IG9keGNvcigpXG4gICAgcmV0dXJuIHtcbiAgICAgIHk6IHkuc2xpY2UoMSksXG4gICAgICBvdXRjb21lOiBvdXRjb21lLFxuICAgICAgblN0ZXA6IG5TdGVwLFxuICAgICAgeEVuZDogeEVuZCxcbiAgICAgIG5BY2NlcHQ6IG5BY2NlcHQsXG4gICAgICBuUmVqZWN0OiBuUmVqZWN0LFxuICAgICAgbkV2YWw6IG5FdmFsXG4gICAgfVxuICB9XG59XG4iLCIvKipcbiAgKiBDcmVhdGVkIGJ5IGNvbGluIG9uIDYvMTQvMTYuXG4gICogaHR0cDovL2xpdHRsZXJlZGNvbXB1dGVyLmdpdGh1Yi5pb1xuICAqL1xuXG5pbXBvcnQge1NvbHZlciwgRGVyaXZhdGl2ZX0gZnJvbSAnb2RleC9zcmMvb2RleCdcblxuaW50ZXJmYWNlIEhhbWlsdG9uTWFwIHtcbiAgZ2VuZXJhdGVTZWN0aW9uKGluaXRpYWxEYXRhOiBudW1iZXJbXSwgbjogbnVtYmVyLCBjYWxsYmFjazogKHg6IG51bWJlciwgeTogbnVtYmVyKSA9PiB2b2lkKTogdm9pZFxufVxuXG5pbnRlcmZhY2UgRGlmZmVyZW50aWFsRXF1YXRpb24ge1xuICBldm9sdmUoaW5pdGlhbERhdGE6IG51bWJlcltdLCB0MTogbnVtYmVyLCBkdDogbnVtYmVyLCBjYWxsYmFjazogKHQ6IG51bWJlciwgeTogbnVtYmVyW10pID0+IHZvaWQpOiB2b2lkXG59XG5cbmNvbnN0IHR3b1BpID0gTWF0aC5QSSAqIDJcblxuZXhwb3J0IGNsYXNzIFN0YW5kYXJkTWFwIGltcGxlbWVudHMgSGFtaWx0b25NYXAge1xuICBLOiBudW1iZXJcbiAgUFY6ICh4OiBudW1iZXIpID0+IG51bWJlclxuICBzdGF0aWMgdHdvUGkgPSAyICogTWF0aC5QSVxuXG4gIGNvbnN0cnVjdG9yKEs6IG51bWJlcikge1xuICAgIHRoaXMuSyA9IEtcbiAgICB0aGlzLlBWID0gU3RhbmRhcmRNYXAucHJpbmNpcGFsX3ZhbHVlKHR3b1BpKVxuICB9XG5cbiAgc3RhdGljIHByaW5jaXBhbF92YWx1ZShjdXRIaWdoOiBudW1iZXIpOiAodjogbnVtYmVyKSA9PiBudW1iZXIge1xuICAgIGNvbnN0IGN1dExvdyA9IGN1dEhpZ2ggLSB0d29QaVxuICAgIHJldHVybiBmdW5jdGlvbiAoeDogbnVtYmVyKSB7XG4gICAgICBpZiAoY3V0TG93IDw9IHggJiYgeCA8IGN1dEhpZ2gpIHtcbiAgICAgICAgcmV0dXJuIHhcbiAgICAgIH1cbiAgICAgIGNvbnN0IHkgPSB4IC0gdHdvUGkgKiBNYXRoLmZsb29yKHggLyB0d29QaSlcbiAgICAgIHJldHVybiB5IDwgY3V0SGlnaCA/IHkgOiB5IC0gdHdvUGlcbiAgICB9XG4gIH1cblxuICBnZW5lcmF0ZVNlY3Rpb24oaW5pdGlhbERhdGE6IG51bWJlcltdLCBuOiBudW1iZXIsIGNhbGxiYWNrOiAoeDogbnVtYmVyLCB5OiBudW1iZXIpID0+IHZvaWQpIHtcbiAgICBsZXQgW3RoZXRhLCBJXSA9IGluaXRpYWxEYXRhXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgIGNhbGxiYWNrKHRoZXRhLCBJKVxuICAgICAgbGV0IG5JID0gSSArICh0aGlzLksgKiBNYXRoLnNpbih0aGV0YSkpXG4gICAgICB0aGV0YSA9IHRoaXMuUFYodGhldGEgKyBuSSlcbiAgICAgIEkgPSB0aGlzLlBWKG5JKVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRHJpdmVuUGVuZHVsdW1NYXAgaW1wbGVtZW50cyBIYW1pbHRvbk1hcCwgRGlmZmVyZW50aWFsRXF1YXRpb24ge1xuXG4gIHBhcmFtZm46ICgpID0+IHthOiBudW1iZXIsIG9tZWdhOiBudW1iZXJ9XG4gIFM6IFNvbHZlclxuICBQVjogKHg6IG51bWJlcikgPT4gbnVtYmVyXG5cbiAgSGFtaWx0b25TeXNkZXIobTogbnVtYmVyLCBsOiBudW1iZXIsIG9tZWdhOiBudW1iZXIsIGE6IG51bWJlciwgZzogbnVtYmVyKTogRGVyaXZhdGl2ZSB7XG4gICAgcmV0dXJuICh4LCBbdCwgdGhldGEsIHBfdGhldGFdKSA9PiB7XG4gICAgICAvLyBsZXQgXzEgPSBNYXRoLnNpbihvbWVnYSAqIHQpXG4gICAgICBsZXQgXzIgPSBNYXRoLnBvdyhsLCAyKVxuICAgICAgbGV0IF8zID0gb21lZ2EgKiB0XG4gICAgICBsZXQgXzQgPSBNYXRoLnNpbih0aGV0YSlcbiAgICAgIGxldCBfNSA9IE1hdGguY29zKHRoZXRhKVxuICAgICAgcmV0dXJuIFsxLFxuICAgICAgICAoTWF0aC5zaW4oXzMpICogXzQgKiBhICogbCAqIG0gKiBvbWVnYSArIHBfdGhldGEpIC8gKF8yICogbSksXG4gICAgICAgICgtIE1hdGgucG93KE1hdGguc2luKF8zKSwgMikgKiBfNSAqIF80ICogTWF0aC5wb3coYSwgMikgKiBsICogbSAqIE1hdGgucG93KG9tZWdhLCAyKSAtIE1hdGguc2luKF8zKSAqIF81ICogYSAqIG9tZWdhICogcF90aGV0YSAtIF80ICogZyAqIF8yICogbSkgLyBsXVxuICAgIH1cbiAgfVxuXG4gIExhZ3JhbmdlU3lzZGVyKGw6IG51bWJlciwgb21lZ2E6IG51bWJlciwgYTogbnVtYmVyLCBnOiBudW1iZXIpOiBEZXJpdmF0aXZlIHtcbiAgICByZXR1cm4gKHgsIFt0LCB0aGV0YSwgdGhldGFkb3RdKSA9PiB7XG4gICAgICBsZXQgXzEgPSBNYXRoLnNpbih0aGV0YSlcbiAgICAgIHJldHVybiBbMSwgdGhldGFkb3QsIChfMSAqIE1hdGguY29zKG9tZWdhICogdCkgKiBhICogTWF0aC5wb3cob21lZ2EsIDIpIC0gXzEgKiBnKSAvIGxdXG4gICAgfVxuICB9XG5cbiAgY29uc3RydWN0b3IocGFyYW1mbjogKCkgPT4ge2E6IG51bWJlciwgb21lZ2E6IG51bWJlcn0pIHtcbiAgICB0aGlzLnBhcmFtZm4gPSBwYXJhbWZuXG4gICAgdGhpcy5TID0gbmV3IFNvbHZlcigzKVxuICAgIHRoaXMuUy5kZW5zZU91dHB1dCA9IHRydWVcbiAgICB0aGlzLlMuYWJzb2x1dGVUb2xlcmFuY2UgPSAxZS04XG4gICAgdGhpcy5QViA9IFN0YW5kYXJkTWFwLnByaW5jaXBhbF92YWx1ZShNYXRoLlBJKVxuICB9XG5cbiAgZ2VuZXJhdGVTZWN0aW9uKGluaXRpYWxEYXRhOiBudW1iZXJbXSwgbjogbnVtYmVyLCBjYWxsYmFjazogKHg6IG51bWJlciwgeTogbnVtYmVyKSA9PiB2b2lkKSB7XG4gICAgbGV0IHBhcmFtcyA9IHRoaXMucGFyYW1mbigpXG4gICAgbGV0IHBlcmlvZCA9IDIgKiBNYXRoLlBJIC8gcGFyYW1zLm9tZWdhXG4gICAgbGV0IHQxID0gMTAwMCAqIHBlcmlvZFxuICAgIGxldCBIID0gdGhpcy5IYW1pbHRvblN5c2RlcigxLCAxLCBwYXJhbXMub21lZ2EsIHBhcmFtcy5hLCA5LjgpXG4gICAgdGhpcy5TLnNvbHZlKEgsIDAsIFswXS5jb25jYXQoaW5pdGlhbERhdGEpLCB0MSwgdGhpcy5TLmdyaWQocGVyaW9kLCAodCwgeXMpID0+IGNhbGxiYWNrKHRoaXMuUFYoeXNbMV0pLCB5c1syXSkpKVxuICB9XG5cbiAgZXZvbHZlKGluaXRpYWxEYXRhOiBudW1iZXJbXSwgdDE6IG51bWJlciwgZHQ6IG51bWJlciwgY2FsbGJhY2s6ICh4OiBudW1iZXIsIHlzOiBudW1iZXJbXSkgPT4gdm9pZCkge1xuICAgIGxldCBwYXJhbXMgPSB0aGlzLnBhcmFtZm4oKVxuICAgIGNvbnNvbGUubG9nKCdwYXJhbXMnLCBwYXJhbXMpXG4gICAgbGV0IEwgPSB0aGlzLkxhZ3JhbmdlU3lzZGVyKDEsIHBhcmFtcy5vbWVnYSwgcGFyYW1zLmEsIDkuOClcbiAgICBsZXQgcDAgPSBwZXJmb3JtYW5jZS5ub3coKVxuICAgIHRoaXMuUy5zb2x2ZShMLCAwLCBbMF0uY29uY2F0KGluaXRpYWxEYXRhKSwgdDEsIHRoaXMuUy5ncmlkKGR0LCBjYWxsYmFjaykpXG4gICAgY29uc29sZS5sb2coJ2V2b2x1dGlvbiB0b29rJywgKHBlcmZvcm1hbmNlLm5vdygpIC0gcDApLnRvRml4ZWQoMiksICdtc2VjJylcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRXhwbG9yZU1hcCB7XG4gIGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnRcbiAgTTogSGFtaWx0b25NYXBcbiAgY29udGV4dDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEXG4gIG9uRXhwbG9yZTogKHg6IG51bWJlciwgeTogbnVtYmVyKSA9PiB2b2lkXG5cbiAgY29uc3RydWN0b3IoY2FudmFzOiBzdHJpbmcsIE06IEhhbWlsdG9uTWFwLCB4UmFuZ2U6IG51bWJlcltdLCB5UmFuZ2U6IG51bWJlcltdKSB7XG4gICAgdGhpcy5jYW52YXMgPSA8SFRNTENhbnZhc0VsZW1lbnQ+IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGNhbnZhcylcbiAgICB0aGlzLk0gPSBNXG4gICAgdGhpcy5jb250ZXh0ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKVxuICAgIGxldCBbdywgaF0gPSBbeFJhbmdlWzFdIC0geFJhbmdlWzBdLCB5UmFuZ2VbMV0gLSB5UmFuZ2VbMF1dXG4gICAgdGhpcy5jYW52YXMub25tb3VzZWRvd24gPSAoZTogTW91c2VFdmVudCkgPT4ge1xuICAgICAgbGV0IFtjeCwgY3ldID0gW2Uub2Zmc2V0WCAvIHRoaXMuY29udGV4dC5jYW52YXMud2lkdGggKiB3ICsgeFJhbmdlWzBdLFxuICAgICAgICB5UmFuZ2VbMV0gLSBlLm9mZnNldFkgLyB0aGlzLmNvbnRleHQuY2FudmFzLmhlaWdodCAqIGhdXG4gICAgICBsZXQgcDAgPSBwZXJmb3JtYW5jZS5ub3coKVxuICAgICAgdGhpcy5FeHBsb3JlKGN4LCBjeSlcbiAgICAgIGNvbnNvbGUubG9nKCdleHBsb3JhdGlvbicsIChwZXJmb3JtYW5jZS5ub3coKSAtIHAwKS50b0ZpeGVkKDIpLCAnbXNlYycpXG4gICAgICB0aGlzLm9uRXhwbG9yZSAmJiB0aGlzLm9uRXhwbG9yZShjeCwgY3kpXG4gICAgfVxuICAgIHRoaXMuY29udGV4dC5zY2FsZSh0aGlzLmNvbnRleHQuY2FudmFzLndpZHRoIC8gdywgLXRoaXMuY29udGV4dC5jYW52YXMuaGVpZ2h0IC8gaClcbiAgICB0aGlzLmNvbnRleHQudHJhbnNsYXRlKC14UmFuZ2VbMF0sIC15UmFuZ2VbMV0pXG4gICAgdGhpcy5jb250ZXh0LmZpbGxTdHlsZSA9ICdyZ2JhKDIzLDY0LDE3MCwwLjUpJ1xuICB9XG4gIGk6IG51bWJlciA9IDBcblxuICAvLyBzaW5jZSBwdCBpcyBpbnZva2VkIGluIGNhbGxiYWNrIHBvc2l0aW9uLCB3ZSB3YW50IHRvIGRlZmluZSBpdCBhcyBhbiBpbnN0YW5jZSBhcnJvdyBmdW5jdGlvblxuICBwdCA9ICh4OiBudW1iZXIsIHk6IG51bWJlcikgPT4ge1xuICAgIC8vIGlmICh0aGlzLmkgJSAxMDAgPT09IDApIGNvbnNvbGUubG9nKHRoaXMuaSwgJ3B0cycpXG4gICAgdGhpcy5jb250ZXh0LmJlZ2luUGF0aCgpXG4gICAgdGhpcy5jb250ZXh0LmFyYyh4LCB5LCAwLjAxLCAwLCAyICogTWF0aC5QSSlcbiAgICB0aGlzLmNvbnRleHQuZmlsbCgpXG4gICAgdGhpcy5jb250ZXh0LmNsb3NlUGF0aCgpXG4gICAgKyt0aGlzLmlcbiAgfVxuXG4gIEV4cGxvcmUoeDogbnVtYmVyLCB5OiBudW1iZXIpIHtcbiAgICB0aGlzLk0uZ2VuZXJhdGVTZWN0aW9uKFt4LCB5XSwgMTAwMCwgdGhpcy5wdClcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRHJpdmVuUGVuZHVsdW1BbmltYXRpb24ge1xuICBhbXBsaXR1ZGUgPSAwLjFcbiAgYW5pbUxvZ2ljYWxTaXplID0gMS4zXG4gIGN0eDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEXG4gIGluaXRpYWxEYXRhOiBudW1iZXJbXVxuICBkYXRhOiBudW1iZXJbXVtdXG4gIGZyYW1lSW5kZXg6IG51bWJlclxuICBmcmFtZVN0YXJ0OiBudW1iZXJcbiAgb21lZ2E6IG51bWJlclxuICBhbmltYXRpbmc6IGJvb2xlYW5cblxuICBjb25zdHJ1Y3RvcihvOiB7XG4gICAgb21lZ2FWYWx1ZUlkOiBzdHJpbmdcbiAgICBvbWVnYVJhbmdlSWQ6IHN0cmluZ1xuICAgIHRWYWx1ZUlkOiBzdHJpbmdcbiAgICB0UmFuZ2VJZDogc3RyaW5nXG4gICAgYW5pbUlkOiBzdHJpbmdcbiAgICBleHBsb3JlSWQ6IHN0cmluZ1xuICAgIHRoZXRhMElkOiBzdHJpbmdcbiAgICB0aGV0YURvdDBJZDogc3RyaW5nXG4gICAgZ29CdXR0b25JZDogc3RyaW5nXG4gIH0pIHtcbiAgICBsZXQgb21lZ2FSYW5nZSA9IDxIVE1MSW5wdXRFbGVtZW50PmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG8ub21lZ2FSYW5nZUlkKVxuICAgIGxldCB0UmFuZ2UgPSA8SFRNTElucHV0RWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChvLnRSYW5nZUlkKVxuICAgIGxldCBkaWZmRXEgPSBuZXcgRHJpdmVuUGVuZHVsdW1NYXAoKCkgPT4gKHtcbiAgICAgIGE6IHRoaXMuYW1wbGl0dWRlLFxuICAgICAgb21lZ2E6ICtvbWVnYVJhbmdlLnZhbHVlXG4gICAgfSkpXG4gICAgbGV0IGFuaW0gPSA8SFRNTENhbnZhc0VsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoby5hbmltSWQpXG4gICAgdGhpcy5jdHggPSBhbmltLmdldENvbnRleHQoJzJkJylcbiAgICB0aGlzLmN0eC5zY2FsZShhbmltLndpZHRoIC8gKDIgKiB0aGlzLmFuaW1Mb2dpY2FsU2l6ZSksIC1hbmltLmhlaWdodCAvICgyICogdGhpcy5hbmltTG9naWNhbFNpemUpKVxuICAgIHRoaXMuY3R4LnRyYW5zbGF0ZSh0aGlzLmFuaW1Mb2dpY2FsU2l6ZSwgLXRoaXMuYW5pbUxvZ2ljYWxTaXplKVxuICAgIGxldCB4TWFwID0gbmV3IEV4cGxvcmVNYXAoJ3AnLCBkaWZmRXEsIFstTWF0aC5QSSwgTWF0aC5QSV0sIFstMTAsIDEwXSlcbiAgICB4TWFwLm9uRXhwbG9yZSA9ICh0aGV0YTA6IG51bWJlciwgdGhldGFEb3QwOiBudW1iZXIpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKCdvbkV4cGxvcmUnLCB0aGV0YTAsIHRoZXRhRG90MClcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG8udGhldGEwSWQpLnRleHRDb250ZW50ID0gdGhldGEwLnRvRml4ZWQoMylcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG8udGhldGFEb3QwSWQpLnRleHRDb250ZW50ID0gdGhldGFEb3QwLnRvRml4ZWQoMylcbiAgICAgIHRoaXMuaW5pdGlhbERhdGEgPSBbdGhldGEwLCB0aGV0YURvdDBdXG4gICAgfVxuICAgIGxldCBleHBsb3JlID0gPEhUTUxDYW52YXNFbGVtZW50PmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG8uZXhwbG9yZUlkKVxuICAgIG9tZWdhUmFuZ2UuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKGU6IEV2ZW50KSA9PiB7XG4gICAgICBleHBsb3JlLmdldENvbnRleHQoJzJkJykuY2xlYXJSZWN0KC1NYXRoLlBJLCAtMTAsIDIgKiBNYXRoLlBJLCAyMClcbiAgICAgIGxldCB0ID0gPEhUTUxJbnB1dEVsZW1lbnQ+ZS50YXJnZXRcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG8ub21lZ2FWYWx1ZUlkKS50ZXh0Q29udGVudCA9ICgrdC52YWx1ZSkudG9GaXhlZCgxKVxuICAgIH0pXG4gICAgdFJhbmdlLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIChlOiBFdmVudCkgPT4ge1xuICAgICAgbGV0IHQgPSA8SFRNTElucHV0RWxlbWVudD5lLnRhcmdldFxuICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoby50VmFsdWVJZCkudGV4dENvbnRlbnQgPSB0LnZhbHVlXG4gICAgfSlcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChvLmdvQnV0dG9uSWQpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgLy8gKHJlKXNvbHZlIHRoZSBkaWZmZXJlbnRpYWwgZXF1YXRpb24gYW5kIHVwZGF0ZSB0aGUgZGF0YS4gS2ljayBvZmYgdGhlIGFuaW1hdGlvbi5cbiAgICAgIGxldCBkdCA9IDEgLyA2MFxuICAgICAgbGV0IHQxID0gK3RSYW5nZS52YWx1ZVxuICAgICAgbGV0IG4gPSBNYXRoLmNlaWwodDEgLyBkdClcbiAgICAgIHRoaXMuZGF0YSA9IG5ldyBBcnJheShuKVxuICAgICAgbGV0IGkgPSAwXG4gICAgICB0aGlzLm9tZWdhID0gK29tZWdhUmFuZ2UudmFsdWVcbiAgICAgIGxldCBwMCA9IHBlcmZvcm1hbmNlLm5vdygpXG4gICAgICBkaWZmRXEuZXZvbHZlKHRoaXMuaW5pdGlhbERhdGEsIHQxLCBkdCwgKHgsIHlzKSA9PiB7dGhpcy5kYXRhW2krK10gPSB5c30pXG4gICAgICBjb25zb2xlLmxvZygnREUgZXZvbHV0aW9uIGluJywgKHBlcmZvcm1hbmNlLm5vdygpIC0gcDApLnRvRml4ZWQoMSksICdtc2VjJylcbiAgICAgIHRoaXMuZnJhbWVJbmRleCA9IDBcbiAgICAgIHRoaXMuZnJhbWVTdGFydCA9IHBlcmZvcm1hbmNlLm5vdygpXG4gICAgICBpZiAoIXRoaXMuYW5pbWF0aW5nKSB7XG4gICAgICAgIHRoaXMuYW5pbWF0aW5nID0gdHJ1ZVxuICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy5mcmFtZSlcbiAgICAgIH1cbiAgICB9KVxuICB9XG4gIGZyYW1lID0gKCkgPT4ge1xuICAgIGxldCBib2IgPSAodDogbnVtYmVyKSA9PiB0aGlzLmFtcGxpdHVkZSAqIE1hdGguY29zKHRoaXMub21lZ2EgKiB0KVxuICAgIHRoaXMuY3R4LmNsZWFyUmVjdCgtdGhpcy5hbmltTG9naWNhbFNpemUsIC10aGlzLmFuaW1Mb2dpY2FsU2l6ZSwgMiAqIHRoaXMuYW5pbUxvZ2ljYWxTaXplLCAyICogdGhpcy5hbmltTG9naWNhbFNpemUpXG4gICAgbGV0IGQgPSB0aGlzLmRhdGFbdGhpcy5mcmFtZUluZGV4XVxuICAgIGxldCB5MCA9IGJvYihkWzBdKVxuICAgIGxldCB0aGV0YSA9IGRbMV1cbiAgICBjb25zdCBjID0gdGhpcy5jdHhcbiAgICBjLmxpbmVXaWR0aCA9IDAuMDJcbiAgICBjLmJlZ2luUGF0aCgpXG4gICAgYy5maWxsU3R5bGUgPSAnIzAwMCdcbiAgICBjLmFyYygwLCB5MCwgMC4wNSwgMCwgTWF0aC5QSSAqIDIpXG4gICAgYy5maWxsU3R5bGUgPSAnI2YwMCdcbiAgICBjLmFyYyhNYXRoLnNpbih0aGV0YSksIHkwIC0gTWF0aC5jb3ModGhldGEpLCAwLjEsIDAsIE1hdGguUEkgKiAyKVxuICAgIGMuZmlsbCgpXG4gICAgYy5maWxsU3R5bGUgPSAnIzAwMCdcbiAgICBjLmJlZ2luUGF0aCgpXG4gICAgYy5tb3ZlVG8oMCwgeTApXG4gICAgYy5saW5lVG8oTWF0aC5zaW4odGhldGEpLCB5MCAtIE1hdGguY29zKHRoZXRhKSlcbiAgICBjLnN0cm9rZSgpXG5cbiAgICArK3RoaXMuZnJhbWVJbmRleFxuICAgIGlmICh0aGlzLmZyYW1lSW5kZXggPCB0aGlzLmRhdGEubGVuZ3RoKSB7XG4gICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMuZnJhbWUpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuYW5pbWF0aW5nID0gZmFsc2VcbiAgICAgIGxldCBldCA9IChwZXJmb3JtYW5jZS5ub3coKSAtIHRoaXMuZnJhbWVTdGFydCkgLyAxZTNcbiAgICAgIGNvbnNvbGUubG9nKCdhbmltYXRpb24gZG9uZScsICh0aGlzLmRhdGEubGVuZ3RoIC8gZXQpLnRvRml4ZWQoMiksICdmcHMnKVxuICAgIH1cbiAgfVxufVxuXG5pbnRlcmZhY2UgRG91YmxlUGFyYW1zIHtcbiAgbDE6IG51bWJlclxuICBtMTogbnVtYmVyXG4gIGwyOiBudW1iZXJcbiAgbTI6IG51bWJlclxufVxuXG5jbGFzcyBEb3VibGVQZW5kdWx1bU1hcCBpbXBsZW1lbnRzIERpZmZlcmVudGlhbEVxdWF0aW9uIHtcbiAgcGFyYW1mbjogKCkgPT4gRG91YmxlUGFyYW1zXG4gIHBhcmFtczogRG91YmxlUGFyYW1zXG4gIFM6IFNvbHZlclxuXG4gIExhZ3JhbmdlU3lzZGVyKGwxOiBudW1iZXIsIG0xOiBudW1iZXIsIGwyOiBudW1iZXIsIG0yOiBudW1iZXIpOiBEZXJpdmF0aXZlIHtcbiAgICBjb25zdCBnID0gOS44XG4gICAgcmV0dXJuICh4LCBbdCwgdGhldGEsIHBoaSwgdGhldGFkb3QsIHBoaWRvdF0pID0+IHtcbiAgICAgIC8vIGxldCBfMSA9IE1hdGguY29zKC0gcGhpICsgdGhldGEpXG4gICAgICBsZXQgXzIgPSBNYXRoLnBvdyhwaGlkb3QsIDIpXG4gICAgICBsZXQgXzMgPSBNYXRoLnNpbihwaGkpXG4gICAgICAvLyBsZXQgXzQgPSBNYXRoLnNpbigtIHBoaSArIHRoZXRhKVxuICAgICAgbGV0IF81ID0gLSBwaGlcbiAgICAgIC8vIGxldCBfNiA9IE1hdGgucG93KE1hdGguc2luKC0gcGhpICsgdGhldGEpLCAyKVxuICAgICAgbGV0IF83ID0gTWF0aC5zaW4odGhldGEpXG4gICAgICBsZXQgXzggPSBNYXRoLnBvdyh0aGV0YWRvdCwgMilcbiAgICAgIC8vIGxldCBfOSA9IC0gcGhpICsgdGhldGFcbiAgICAgIHJldHVybiBbMSxcbiAgICAgICAgdGhldGFkb3QsXG4gICAgICAgIHBoaWRvdCxcbiAgICAgICAgKC0gTWF0aC5zaW4oXzUgKyB0aGV0YSkgKiBNYXRoLmNvcyhfNSArIHRoZXRhKSAqIGwxICogbTIgKiBfOCAtIE1hdGguc2luKF81ICsgdGhldGEpICogbDIgKiBtMiAqIF8yICsgTWF0aC5jb3MoXzUgKyB0aGV0YSkgKiBfMyAqIGcgKiBtMiAtIF83ICogZyAqIG0xIC0gXzcgKiBnICogbTIpIC8gKE1hdGgucG93KE1hdGguc2luKF81ICsgdGhldGEpLCAyKSAqIGwxICogbTIgKyBsMSAqIG0xKSxcbiAgICAgICAgKE1hdGguc2luKF81ICsgdGhldGEpICogTWF0aC5jb3MoXzUgKyB0aGV0YSkgKiBsMiAqIG0yICogXzIgKyBNYXRoLnNpbihfNSArIHRoZXRhKSAqIGwxICogbTEgKiBfOCArIE1hdGguc2luKF81ICsgdGhldGEpICogbDEgKiBtMiAqIF84ICsgXzcgKiBNYXRoLmNvcyhfNSArIHRoZXRhKSAqIGcgKiBtMSArIF83ICogTWF0aC5jb3MoXzUgKyB0aGV0YSkgKiBnICogbTIgLSBfMyAqIGcgKiBtMSAtIF8zICogZyAqIG0yKSAvIChNYXRoLnBvdyhNYXRoLnNpbihfNSArIHRoZXRhKSwgMikgKiBsMiAqIG0yICsgbDIgKiBtMSldXG4gICAgfVxuICB9XG5cbiAgY29uc3RydWN0b3IocGFyYW1mbjogKCkgPT4ge2wxOiBudW1iZXIsIG0xOiBudW1iZXIsIGwyOiBudW1iZXIsIG0yOiBudW1iZXJ9KSB7XG4gICAgdGhpcy5wYXJhbWZuID0gcGFyYW1mblxuICAgIHRoaXMuUyA9IG5ldyBTb2x2ZXIoNSlcbiAgICB0aGlzLlMuZGVuc2VPdXRwdXQgPSB0cnVlXG4gICAgdGhpcy5TLmFic29sdXRlVG9sZXJhbmNlID0gMWUtOFxuICB9XG5cbiAgZXZvbHZlKGluaXRpYWxEYXRhOiBudW1iZXJbXSwgdDE6IG51bWJlciwgZHQ6IG51bWJlciwgY2FsbGJhY2s6ICh0OiBudW1iZXIsIHk6IG51bWJlcltdKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgbGV0IHAgPSB0aGlzLnBhcmFtZm4oKVxuICAgIGNvbnNvbGUubG9nKCdwYXJhbXMnLCB0aGlzLnBhcmFtcylcbiAgICBsZXQgTCA9IHRoaXMuTGFncmFuZ2VTeXNkZXIocC5sMSwgcC5tMSwgcC5sMiwgcC5tMilcbiAgICB0aGlzLnBhcmFtcyA9IHBcbiAgICB0aGlzLlMuc29sdmUoTCwgMCwgWzBdLmNvbmNhdChpbml0aWFsRGF0YSksIHQxLCB0aGlzLlMuZ3JpZChkdCwgY2FsbGJhY2spKVxuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBEb3VibGVQZW5kdWx1bUFuaW1hdGlvbiB7XG4gIGFuaW1Mb2dpY2FsU2l6ZSA9IDEuM1xuICBjdHg6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRFxuICBkYXRhOiBudW1iZXJbXVtdXG4gIGZyYW1lU3RhcnQ6IG51bWJlclxuICBmcmFtZUluZGV4OiBudW1iZXJcbiAgYW5pbWF0aW5nOiBib29sZWFuXG4gIHBhcmFtczogRG91YmxlUGFyYW1zXG4gIHZhbHVlVXBkYXRlcih0b0lkOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gKGU6IEV2ZW50KSA9PiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0b0lkKS50ZXh0Q29udGVudCA9ICg8SFRNTElucHV0RWxlbWVudD5lLnRhcmdldCkudmFsdWVcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKG86IHtcbiAgICB0aGV0YTBSYW5nZUlkOiBzdHJpbmcsXG4gICAgdGhldGEwVmFsdWVJZDogc3RyaW5nLFxuICAgIHBoaTBSYW5nZUlkOiBzdHJpbmcsXG4gICAgcGhpMFZhbHVlSWQ6IHN0cmluZyxcbiAgICB0UmFuZ2VJZDogc3RyaW5nLFxuICAgIHRWYWx1ZUlkOiBzdHJpbmcsXG4gICAgYW5pbUlkOiBzdHJpbmcsXG4gICAgZ29CdXR0b25JZDogc3RyaW5nXG4gIH0pIHtcbiAgICB0aGlzLmFuaW1hdGluZyA9IGZhbHNlXG4gICAgbGV0IGRlZzJyYWQgPSAoZDogbnVtYmVyKSA9PiBkICogMiAqIE1hdGguUEkgLyAzNjBcbiAgICBsZXQgdGhldGEwUmFuZ2UgPSA8SFRNTElucHV0RWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChvLnRoZXRhMFJhbmdlSWQpXG4gICAgdGhldGEwUmFuZ2UuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgdGhpcy52YWx1ZVVwZGF0ZXIoby50aGV0YTBWYWx1ZUlkKSlcbiAgICBsZXQgcGhpMFJhbmdlID0gPEhUTUxJbnB1dEVsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoby5waGkwUmFuZ2VJZClcbiAgICBwaGkwUmFuZ2UuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgdGhpcy52YWx1ZVVwZGF0ZXIoby5waGkwVmFsdWVJZCkpXG4gICAgbGV0IHRSYW5nZSA9IDxIVE1MSW5wdXRFbGVtZW50PmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG8udFJhbmdlSWQpXG4gICAgdFJhbmdlLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIHRoaXMudmFsdWVVcGRhdGVyKG8udFZhbHVlSWQpKVxuICAgIGxldCBhbmltID0gPEhUTUxDYW52YXNFbGVtZW50PmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG8uYW5pbUlkKVxuICAgIHRoaXMuY3R4ID0gYW5pbS5nZXRDb250ZXh0KCcyZCcpXG4gICAgdGhpcy5jdHguc2NhbGUoYW5pbS53aWR0aCAvICgyICogdGhpcy5hbmltTG9naWNhbFNpemUpLCAtYW5pbS5oZWlnaHQgLyAoMiAqIHRoaXMuYW5pbUxvZ2ljYWxTaXplKSlcbiAgICB0aGlzLmN0eC50cmFuc2xhdGUodGhpcy5hbmltTG9naWNhbFNpemUsIC10aGlzLmFuaW1Mb2dpY2FsU2l6ZSlcbiAgICBsZXQgcGFyYW1mbiA9ICgpID0+ICh7bDE6IDAuNSwgbTE6IDAuNSwgbDI6IDAuNSwgbTI6IDAuNX0pXG4gICAgbGV0IGRpZmZFcSA9IG5ldyBEb3VibGVQZW5kdWx1bU1hcChwYXJhbWZuKVxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG8uZ29CdXR0b25JZCkuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiAge1xuICAgICAgbGV0IGR0ID0gMSAvIDYwXG4gICAgICBsZXQgdDEgPSArdFJhbmdlLnZhbHVlXG4gICAgICBsZXQgbiA9IE1hdGguY2VpbCh0MSAvIGR0KVxuICAgICAgdGhpcy5kYXRhID0gbmV3IEFycmF5KG4pXG4gICAgICBsZXQgaSA9IDBcbiAgICAgIGxldCBwMCA9IHBlcmZvcm1hbmNlLm5vdygpXG4gICAgICB0aGlzLnBhcmFtcyA9IHBhcmFtZm4oKVxuICAgICAgZGlmZkVxLmV2b2x2ZShbZGVnMnJhZCgrdGhldGEwUmFuZ2UudmFsdWUpLCBkZWcycmFkKCtwaGkwUmFuZ2UudmFsdWUpLCAwLCAwXSwgdDEsIGR0LCAoeCwgeXMpID0+IHt0aGlzLmRhdGFbaSsrXSA9IHlzfSlcbiAgICAgIGNvbnNvbGUubG9nKCdldm9sdXRpb24gaW4nLCAocGVyZm9ybWFuY2Uubm93KCkgLSBwMCkudG9GaXhlZCgyKSwgJ21zZWMnKVxuICAgICAgdGhpcy5mcmFtZUluZGV4ID0gMFxuICAgICAgaWYgKCF0aGlzLmFuaW1hdGluZykge1xuICAgICAgICB0aGlzLmFuaW1hdGluZyA9IHRydWVcbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMuZnJhbWUpXG4gICAgICB9XG4gICAgfSlcbiAgfVxuICBmcmFtZSA9ICgpID0+IHtcbiAgICB0aGlzLmN0eC5jbGVhclJlY3QoLXRoaXMuYW5pbUxvZ2ljYWxTaXplLCAtdGhpcy5hbmltTG9naWNhbFNpemUsIDIgKiB0aGlzLmFuaW1Mb2dpY2FsU2l6ZSwgMiAqIHRoaXMuYW5pbUxvZ2ljYWxTaXplKVxuICAgIGxldCBkID0gdGhpcy5kYXRhW3RoaXMuZnJhbWVJbmRleF1cbiAgICBjb25zb2xlLmxvZygnZnJhbWVJbmRleCcsIHRoaXMuZnJhbWVJbmRleCwgJ2QnLCB0aGlzLmRhdGFbdGhpcy5mcmFtZUluZGV4XSlcbiAgICBsZXQgdGhldGEgPSBkWzFdLCBwaGkgPSBkWzJdXG4gICAgY29uc3QgYyA9IHRoaXMuY3R4XG4gICAgY29uc3QgcCA9IHRoaXMucGFyYW1zXG4gICAgbGV0IHgwID0gMCwgeTAgPSAwXG4gICAgbGV0IHgxID0gcC5sMSAqIE1hdGguc2luKHRoZXRhKSwgeTEgPSAtcC5sMSAqIE1hdGguY29zKHRoZXRhKVxuICAgIGxldCB4MiA9IHgxICsgcC5sMiAqIE1hdGguc2luKHBoaSksIHkyID0geTEgLSBwLmwyICogTWF0aC5jb3MocGhpKVxuICAgIGMubGluZVdpZHRoID0gMC4wMjVcbiAgICBjLnN0cm9rZVN0eWxlID0gJyM4ODgnXG4gICAgYy5iZWdpblBhdGgoKVxuICAgIGMubW92ZVRvKHgwLCB5MClcbiAgICBjLmxpbmVUbyh4MSwgeTEpXG4gICAgYy5saW5lVG8oeDIsIHkyKVxuICAgIGMuc3Ryb2tlKClcbiAgICBjLmZpbGxTdHlsZSA9ICcjZjAwJ1xuICAgIGMuYmVnaW5QYXRoKClcbiAgICBjLm1vdmVUbyh4MCwgeTApXG4gICAgYy5hcmMoeDAsIHkwLCAwLjA1LCAwLCBNYXRoLlBJICogMilcbiAgICBjLm1vdmVUbyh4MSwgeTEpXG4gICAgYy5hcmMoeDEsIHkxLCAwLjEsIDAsIE1hdGguUEkgKiAyKVxuICAgIGMubW92ZVRvKHgyLCB5MilcbiAgICBjLmFyYyh4MiwgeTIsIDAuMSwgMCwgTWF0aC5QSSAqIDIpXG4gICAgYy5maWxsKClcblxuICAgICsrdGhpcy5mcmFtZUluZGV4XG4gICAgaWYgKHRoaXMuZnJhbWVJbmRleCA8IHRoaXMuZGF0YS5sZW5ndGgpIHtcbiAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy5mcmFtZSlcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5hbmltYXRpbmcgPSBmYWxzZVxuICAgICAgbGV0IGV0ID0gKHBlcmZvcm1hbmNlLm5vdygpIC0gdGhpcy5mcmFtZVN0YXJ0KSAvIDFlM1xuICAgICAgY29uc29sZS5sb2coJ2FuaW1hdGlvbiBkb25lJywgKHRoaXMuZGF0YS5sZW5ndGggLyBldCkudG9GaXhlZCgyKSwgJ2ZwcycpXG4gICAgfVxuICB9XG59XG4iXX0=
