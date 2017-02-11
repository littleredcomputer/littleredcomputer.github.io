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

},{"odex/src/odex":1}]},{},[2])(2)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvb2RleC9zcmMvb2RleC50cyIsInN0YW5kYXJkLW1hcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNrQ0EsSUFBWSxPQUlYO0FBSkQsV0FBWSxPQUFPO0lBQ2pCLCtDQUFTLENBQUE7SUFDVCw2REFBZ0IsQ0FBQTtJQUNoQixtREFBVyxDQUFBO0FBQ2IsQ0FBQyxFQUpXLE9BQU8sR0FBUCxlQUFPLEtBQVAsZUFBTyxRQUlsQjtBQUVEO0lBeUJFLGdCQUFZLENBQVM7UUFDbkIsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDVixJQUFJLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQTtRQUNyQixJQUFJLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQTtRQUNyQixJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQTtRQUMzQixJQUFJLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQTtRQUNwQixJQUFJLENBQUMsdUJBQXVCLEdBQUcsQ0FBQyxDQUFBO1FBQ2hDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxDQUFDLENBQUE7UUFDekIsSUFBSSxDQUFDLG1CQUFtQixHQUFHLENBQUMsQ0FBQTtRQUM1QixJQUFJLENBQUMsd0JBQXdCLEdBQUcsQ0FBQyxDQUFBO1FBQ2pDLElBQUksQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFBO1FBQ3hCLElBQUksQ0FBQyx5QkFBeUIsR0FBRyxJQUFJLENBQUE7UUFDckMsSUFBSSxDQUFDLGVBQWUsR0FBRyxTQUFTLENBQUE7UUFDaEMsSUFBSSxDQUFDLDBCQUEwQixHQUFHLENBQUMsQ0FBQTtRQUNuQyxJQUFJLENBQUMsdUJBQXVCLEdBQUcsR0FBRyxDQUFBO1FBQ2xDLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFBO1FBQ3hCLElBQUksQ0FBQyxZQUFZLEdBQUcsR0FBRyxDQUFBO1FBQ3ZCLElBQUksQ0FBQyxZ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QUFDLENBQUE7b0JBQ1AsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxHQUFHLEVBQUUsRUFBRSxDQUFDO3dCQUFFLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtvQkFDOUQsSUFBSSxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQTtvQkFDakIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxHQUFHLEVBQUUsRUFBRSxDQUFDO3dCQUFFLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO29CQUU1RCxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDO3dCQUM3QixJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7d0JBQ2xCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7NEJBQzVCLElBQUksTUFBTSxHQUFHLFNBQUEsQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFJLENBQUMsQ0FBQSxHQUFHLENBQUMsQ0FBQTs0QkFDMUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxHQUFHLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQztnQ0FDOUIsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQTs0QkFDMUUsQ0FBQzt3QkFDSCxDQUFDO29CQUNILENBQUM7b0JBQ0QsSUFBSSxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQTtvQkFDakIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxHQUFHLEVBQUUsRUFBRSxDQUFDO3dCQUFFLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO29CQUUxRCxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUM7d0JBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtvQkFDN0MsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUE7b0JBQ2QsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUE7b0JBQ2IsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxHQUFHLEVBQUUsRUFBRSxDQUFDO3dCQUFFLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtvQkFFL0QsR0FBRyxDQUFDLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxFQUFFLEdBQUcsSUFBSSxJQUFJLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQzt3QkFFckMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQTt3QkFDNUIsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEdBQUcsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQzs0QkFDbkMsSUFBSSxLQUFLLEdBQUcsU0FBQSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQSxDQUFBOzRCQUNyQyxHQUFHLEdBQUcsTUFBTSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLEdBQUcsQ0FBQTs0QkFDbkMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxHQUFHLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQztnQ0FDOUIsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUE7NEJBQ3RDLENBQUM7d0JBQ0gsQ0FBQzt3QkFDRCxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQzs0QkFDcEMsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFBOzRCQUNsQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQztnQ0FDbkMsSUFBSSxNQUFNLEdBQUcsU0FBQSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUksQ0FBQyxDQUFBLEdBQUcsQ0FBQyxDQUFBO2dDQUMxQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEdBQUcs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LENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEtBQUksQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQzt3QkFDakMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQTtvQkFDdkQsQ0FBQztnQkFDSCxDQUFDO2dCQUNELEdBQUcsR0FBRyxDQUFDLENBQUE7Z0JBRVAsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxLQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7b0JBQ2pDLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7b0JBQ3JELElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQTtvQkFDakMsR0FBRyxJQUFJLFNBQUEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBSSxDQUFDLENBQUEsQ0FBQTtnQkFDN0MsQ0FBQztnQkFDRCxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsS0FB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Q0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUE7Z0NBQzFFLENBQUM7NEJBQ0gsQ0FBQzt3QkFDSCxDQUFDO29CQUNILENBQUM7b0JBQ0QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFBO29CQUNoQyxFQUFFLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDZCxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFBO3dCQUN2QyxFQUFFLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFDZCxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRSxJQUFJLElBQUksRUFBRSxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUM7Z0NBQ3JDLElBQUksSUFBSSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7Z0NBQzVCLElBQUksSUFBSSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQTtnQ0FDOUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVB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V0FBVyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsVUFBQyxDQUFDLEVBQUUsRUFBRSxJQUFNLEtBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUEsQ0FBQSxDQUFDLENBQUMsQ0FBQTtZQUN6RSxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixFQUFFLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQTtZQUMzRSxLQUFJLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQTtZQUNuQixLQUFJLENBQUMsVUFBVSxHQUFHLFdBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtZQUNuQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO2dCQUNwQixLQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQTtnQkFDckIscUJBQXFCLENBQUMsS0FBSSxDQUFDLEtBQUssQ0FBQyxDQUFBO1lBQ25DLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQTtJQUNKLENBQUM7SUE4QkgsOEJBQUM7QUFBRCxDQWpHQSxBQWlHQyxJQUFBO0FBakdZLDBEQUF1QiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIEFuIGltcGxlbWVudGF0aW9uIG9mIE9ERVgsIGJ5IEUuIEhhaXJlciBhbmQgRy4gV2FubmVyLCBwb3J0ZWQgZnJvbSB0aGUgRm9ydHJhbiBPREVYLkYuXG4gKiBUaGUgb3JpZ2luYWwgd29yayBjYXJyaWVzIHRoZSBCU0QgMi1jbGF1c2UgbGljZW5zZSwgYW5kIHNvIGRvZXMgdGhpcy5cbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTYgQ29saW4gU21pdGguXG4gKiAxLiBSZWRpc3RyaWJ1dGlvbnMgb2Ygc291cmNlIGNvZGUgbXVzdCByZXRhaW4gdGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UsIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nXG4gKiBkaXNjbGFpbWVyLlxuICogMi4gUmVkaXN0cmlidXRpb25zIGluIGJpbmFyeSBmb3JtIG11c3QgcmVwcm9kdWNlIHRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlLCB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlXG4gKiBmb2xsb3dpbmcgZGlzY2xhaW1lciBpbiB0aGUgZG9jdW1lbnRhdGlvbiBhbmQvb3Igb3RoZXIgbWF0ZXJpYWxzIHByb3ZpZGVkIHdpdGggdGhlIGRpc3RyaWJ1dGlvbi5cbiAqXG4gKiBUSElTIFNPRlRXQVJFIElTIFBST1ZJREVEIEJZIFRIRSBDT1BZUklHSFQgSE9MREVSUyBBTkQgQ09OVFJJQlVUT1JTIFwiQVMgSVNcIiBBTkQgQU5ZIEVYUFJFU1MgT1IgSU1QTElFRCBXQVJSQU5USUVTLFxuICogSU5DTFVESU5HLCBCVVQgTk9UIExJTUlURUQgVE8sIFRIRSBJTVBMSUVEIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZIEFORCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRVxuICogQVJFIERJU0NMQUlNRUQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBDT1BZUklHSFQgSE9MREVSIE9SIENPTlRSSUJVVE9SUyBCRSBMSUFCTEUgRk9SIEFOWSBESVJFQ1QsIElORElSRUNULFxuICogSU5DSURFTlRBTCwgU1BFQ0lBTCwgRVhFTVBMQVJZLCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVMgKElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBQUk9DVVJFTUVOVCBPRiBTVUJTVElUVVRFXG4gKiBHT09EUyBPUiBTRVJWSUNFUzsgTE9TUyBPRiBVU0UsIERBVEEsIE9SIFBST0ZJVFM7IE9SIEJVU0lORVNTIElOVEVSUlVQVElPTikgSE9XRVZFUiBDQVVTRUQgQU5EIE9OIEFOWSBUSEVPUlkgT0ZcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBDT05UUkFDVCwgU1RSSUNUIExJQUJJTElUWSwgT1IgVE9SVCAoSU5DTFVESU5HIE5FR0xJR0VOQ0UgT1IgT1RIRVJXSVNFKSBBUklTSU5HIElOIEFOWSBXQVlcbiAqIE9VVCBPRiBUSEUgVVNFIE9GIFRISVMgU09GVFdBUkUsIEVWRU4gSUYgQURWSVNFRCBPRiBUSEUgUE9TU0lCSUxJVFkgT0YgU1VDSCBEQU1BR0UuXG4gKi9cblxuZXhwb3J0IGludGVyZmFjZSBEZXJpdmF0aXZlIHsgIC8vIGZ1bmN0aW9uIGNvbXB1dGluZyB0aGUgdmFsdWUgb2YgWScgPSBGKHgsWSlcbiAgKHg6IG51bWJlciwgICAgICAgICAgIC8vIGlucHV0IHggdmFsdWVcbiAgIHk6IG51bWJlcltdKSAgICAgICAgIC8vIGlucHV0IHkgdmFsdWUpXG4gICAgOiBudW1iZXJbXSAgICAgICAgICAvLyBvdXRwdXQgeScgdmFsdWVzIChBcnJheSBvZiBsZW5ndGggbilcbn1cblxuZXhwb3J0IGludGVyZmFjZSBPdXRwdXRGdW5jdGlvbiB7ICAgICAgICAgICAgICAgICAgICAvLyB2YWx1ZSBjYWxsYmFja1xuICAobnI6IG51bWJlciwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHN0ZXAgbnVtYmVyXG4gICB4b2xkOiBudW1iZXIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbGVmdCBlZGdlIG9mIHNvbHV0aW9uIGludGVydmFsXG4gICB4OiBudW1iZXIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmlnaHQgZWRnZSBvZiBzb2x1dGlvbiBpbnRlcnZhbCAoeSA9IEYoeCkpXG4gICB5OiBudW1iZXJbXSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRih4KVxuICAgZGVuc2U/OiAoYzogbnVtYmVyLCB4OiBudW1iZXIpID0+IG51bWJlcikgIC8vIGRlbnNlIGludGVycG9sYXRvci4gVmFsaWQgaW4gdGhlIHJhbmdlIFt4LCB4b2xkKS5cbiAgICA6IGJvb2xlYW58dm9pZCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyByZXR1cm4gZmFsc2UgdG8gaGFsdCBpbnRlZ3JhdGlvblxufVxuXG5leHBvcnQgZW51bSBPdXRjb21lIHtcbiAgQ29udmVyZ2VkLFxuICBNYXhTdGVwc0V4Y2VlZGVkLFxuICBFYXJseVJldHVyblxufVxuXG5leHBvcnQgY2xhc3MgU29sdmVyIHtcbiAgbjogbnVtYmVyICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZGltZW5zaW9uIG9mIHRoZSBzeXN0ZW1cbiAgdVJvdW5kOiBudW1iZXIgICAgICAgICAgICAgICAgICAgICAgLy8gV09SSygxKSwgbWFjaGluZSBlcHNpbG9uLiAoV09SSywgSVdPUksgYXJlIHJlZmVyZW5jZXMgdG8gb2RleC5mKVxuICBtYXhTdGVwczogbnVtYmVyICAgICAgICAgICAgICAgICAgICAvLyBJV09SSygxKSwgcG9zaXRpdmUgaW50ZWdlclxuICBpbml0aWFsU3RlcFNpemU6IG51bWJlciAgICAgICAgICAgICAvLyBIXG4gIG1heFN0ZXBTaXplOiBudW1iZXIgICAgICAgICAgICAgICAgIC8vIFdPUksoMiksIG1heGltYWwgc3RlcCBzaXplLCBkZWZhdWx0IHhFbmQgLSB4XG4gIG1heEV4dHJhcG9sYXRpb25Db2x1bW5zOiBudW1iZXIgICAgIC8vIElXT1JLKDIpLCBLTSwgcG9zaXRpdmUgaW50ZWdlclxuICBzdGVwU2l6ZVNlcXVlbmNlOiBudW1iZXIgICAgICAgICAgICAvLyBJV09SSygzKSwgaW4gWzEuLjVdXG4gIHN0YWJpbGl0eUNoZWNrQ291bnQ6IG51bWJlciAgICAgICAgIC8vIElXT1JLKDQpLCBpblxuICBzdGFiaWxpdHlDaGVja1RhYmxlTGluZXM6IG51bWJlciAgICAvLyBJV09SSyg1KSwgcG9zaXRpdmUgaW50ZWdlclxuICBkZW5zZU91dHB1dDogYm9vbGVhbiAgICAgICAgICAgICAgICAvLyBJT1VUID49IDIsIHRydWUgbWVhbnMgZGVuc2Ugb3V0cHV0IGludGVycG9sYXRvciBwcm92aWRlZCB0byBzb2xPdXRcbiAgZGVuc2VPdXRwdXRFcnJvckVzdGltYXRvcjogYm9vbGVhbiAgLy8gSVdPUksoNiksIHJldmVyc2VkIHNlbnNlIGZyb20gdGhlIEZPUlRSQU4gY29kZVxuICBkZW5zZUNvbXBvbmVudHM6IG51bWJlcltdICAgICAgICAgICAvLyBJV09SSyg4KSAmIElXT1JLKDIxLC4uLiksIGNvbXBvbmVudHMgZm9yIHdoaWNoIGRlbnNlIG91dHB1dCBpcyByZXF1aXJlZFxuICBpbnRlcnBvbGF0aW9uRm9ybXVsYURlZ3JlZTogbnVtYmVyICAvLyBJV09SSyg3KSwgwrUgPSAyICogayAtIGludGVycG9sYXRpb25Gb3JtdWxhRGVncmVlICsgMSBbMS4uNl0sIGRlZmF1bHQgNFxuICBzdGVwU2l6ZVJlZHVjdGlvbkZhY3RvcjogbnVtYmVyICAgICAvLyBXT1JLKDMpLCBkZWZhdWx0IDAuNVxuICBzdGVwU2l6ZUZhYzE6IG51bWJlciAgICAgICAgICAgICAgICAvLyBXT1JLKDQpXG4gIHN0ZXBTaXplRmFjMjogbnVtYmVyICAgICAgICAgICAgICAgIC8vIFdPUksoNSlcbiAgc3RlcFNpemVGYWMzOiBudW1iZXIgICAgICAgICAgICAgICAgLy8gV09SSyg2KVxuICBzdGVwU2l6ZUZhYzQ6IG51bWJlciAgICAgICAgICAgICAgICAvLyBXT1JLKDcpXG4gIHN0ZXBTYWZldHlGYWN0b3IxOiBudW1iZXIgICAgICAgICAgIC8vIFdPUksoOClcbiAgc3RlcFNhZmV0eUZhY3RvcjI6IG51bWJlciAgICAgICAgICAgLy8gV09SSyg5KVxuICByZWxhdGl2ZVRvbGVyYW5jZTogbnVtYmVyfG51bWJlcltdICAvLyBSVE9MLiBDYW4gYmUgYSBzY2FsYXIgb3IgdmVjdG9yIG9mIGxlbmd0aCBOLlxuICBhYnNvbHV0ZVRvbGVyYW5jZTogbnVtYmVyfG51bWJlcltdICAvLyBBVE9MLiBDYW4gYmUgYSBzY2FsYXIgb3IgdmVjdG9yIG9mIGxlbmd0aCBOLlxuICBkZWJ1ZzogYm9vbGVhblxuXG4gIGNvbnN0cnVjdG9yKG46IG51bWJlcikge1xuICAgIHRoaXMubiA9IG5cbiAgICB0aGlzLnVSb3VuZCA9IDIuM2UtMTZcbiAgICB0aGlzLm1heFN0ZXBzID0gMTAwMDBcbiAgICB0aGlzLmluaXRpYWxTdGVwU2l6ZSA9IDFlLTRcbiAgICB0aGlzLm1heFN0ZXBTaXplID0gMFxuICAgIHRoaXMubWF4RXh0cmFwb2xhdGlvbkNvbHVtbnMgPSA5XG4gICAgdGhpcy5zdGVwU2l6ZVNlcXVlbmNlID0gMFxuICAgIHRoaXMuc3RhYmlsaXR5Q2hlY2tDb3VudCA9IDFcbiAgICB0aGlzLnN0YWJpbGl0eUNoZWNrVGFibGVMaW5lcyA9IDJcbiAgICB0aGlzLmRlbnNlT3V0cHV0ID0gZmFsc2VcbiAgICB0aGlzLmRlbnNlT3V0cHV0RXJyb3JFc3RpbWF0b3IgPSB0cnVlXG4gICAgdGhpcy5kZW5zZUNvbXBvbmVudHMgPSB1bmRlZmluZWRcbiAgICB0aGlzLmludGVycG9sYXRpb25Gb3JtdWxhRGVncmVlID0gNFxuICAgIHRoaXMuc3RlcFNpemVSZWR1Y3Rpb25GYWN0b3IgPSAwLjVcbiAgICB0aGlzLnN0ZXBTaXplRmFjMSA9IDAuMDJcbiAgICB0aGlzLnN0ZXBTaXplRmFjMiA9IDQuMFxuICAgIHRoaXMuc3RlcFNpemVGYWMzID0gMC44XG4gICAgdGhpcy5zdGVwU2l6ZUZhYzQgPSAwLjlcbiAgICB0aGlzLnN0ZXBTYWZldHlGYWN0b3IxID0gMC42NVxuICAgIHRoaXMuc3RlcFNhZmV0eUZhY3RvcjIgPSAwLjk0XG4gICAgdGhpcy5yZWxhdGl2ZVRvbGVyYW5jZSA9IDFlLTVcbiAgICB0aGlzLmFic29sdXRlVG9sZXJhbmNlID0gMWUtNVxuICAgIHRoaXMuZGVidWcgPSBmYWxzZVxuICB9XG5cbiAgZ3JpZChkdDogbnVtYmVyLCBvdXQ6ICh4T3V0OiBudW1iZXIsIHlPdXQ6IG51bWJlcltdKSA9PiBhbnkpOiBPdXRwdXRGdW5jdGlvbiB7XG4gICAgbGV0IGNvbXBvbmVudHM6IG51bWJlcltdID0gdGhpcy5kZW5zZUNvbXBvbmVudHNcbiAgICBpZiAoIWNvbXBvbmVudHMpIHtcbiAgICAgIGNvbXBvbmVudHMgPSBbXVxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm47ICsraSkgY29tcG9uZW50cy5wdXNoKGkpXG4gICAgfVxuICAgIGxldCB0OiBudW1iZXJcbiAgICByZXR1cm4gKG46IG51bWJlciwgeE9sZDogbnVtYmVyLCB4OiBudW1iZXIsIHk6IG51bWJlcltdLCBpbnRlcnBvbGF0ZTogKGk6IG51bWJlciwgeDogbnVtYmVyKSA9PiBudW1iZXIpID0+IHtcbiAgICAgIGlmIChuID09PSAxKSB7XG4gICAgICAgIG91dCh4LCB5KVxuICAgICAgICB0ID0geCArIGR0XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgd2hpbGUgKHQgPD0geCkge1xuICAgICAgICBsZXQgeWY6IG51bWJlcltdID0gW11cbiAgICAgICAgZm9yIChsZXQgaSBvZiBjb21wb25lbnRzKSB7XG4gICAgICAgICAgeWYucHVzaChpbnRlcnBvbGF0ZShpLCB0KSlcbiAgICAgICAgfVxuICAgICAgICBvdXQodCwgeWYpXG4gICAgICAgIHQgKz0gZHRcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyByZXR1cm4gYSAxLWJhc2VkIGFycmF5IG9mIGxlbmd0aCBuLiBJbml0aWFsIHZhbHVlcyB1bmRlZmluZWQuXG4gIHByaXZhdGUgc3RhdGljIGRpbSA9IChuOiBudW1iZXIpID0+IEFycmF5KG4gKyAxKVxuICBwcml2YXRlIHN0YXRpYyBsb2cxMCA9ICh4OiBudW1iZXIpID0+IE1hdGgubG9nKHgpIC8gTWF0aC5MTjEwXG5cbiAgLy8gTWFrZSBhIDEtYmFzZWQgMkQgYXJyYXksIHdpdGggciByb3dzIGFuZCBjIGNvbHVtbnMuIFRoZSBpbml0aWFsIHZhbHVlcyBhcmUgdW5kZWZpbmVkLlxuICBwcml2YXRlIHN0YXRpYyBkaW0yKHI6IG51bWJlciwgYzogbnVtYmVyKTogbnVtYmVyW11bXSB7XG4gICAgbGV0IGEgPSBuZXcgQXJyYXkociArIDEpXG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gcjsgKytpKSBhW2ldID0gU29sdmVyLmRpbShjKVxuICAgIHJldHVybiBhXG4gIH1cblxuICAvLyBHZW5lcmF0ZSBzdGVwIHNpemUgc2VxdWVuY2UgYW5kIHJldHVybiBhcyBhIDEtYmFzZWQgYXJyYXkgb2YgbGVuZ3RoIG4uXG4gIHN0YXRpYyBzdGVwU2l6ZVNlcXVlbmNlKG5TZXE6IG51bWJlciwgbjogbnVtYmVyKTogbnVtYmVyW10ge1xuICAgIGNvbnN0IGEgPSBuZXcgQXJyYXkobiArIDEpXG4gICAgYVswXSA9IDBcbiAgICBzd2l0Y2ggKG5TZXEpIHtcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbjsgKytpKSBhW2ldID0gMiAqIGlcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgYVsxXSA9IDJcbiAgICAgICAgZm9yIChsZXQgaSA9IDI7IGkgPD0gbjsgKytpKSBhW2ldID0gNCAqIGkgLSA0XG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlIDM6XG4gICAgICAgIGFbMV0gPSAyXG4gICAgICAgIGFbMl0gPSA0XG4gICAgICAgIGFbM10gPSA2XG4gICAgICAgIGZvciAobGV0IGkgPSA0OyBpIDw9IG47ICsraSkgYVtpXSA9IDIgKiBhW2kgLSAyXVxuICAgICAgICBicmVha1xuICAgICAgY2FzZSA0OlxuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBuOyArK2kpIGFbaV0gPSA0ICogaSAtIDJcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgNTpcbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbjsgKytpKSBhW2ldID0gNCAqIGlcbiAgICAgICAgYnJlYWtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignaW52YWxpZCBzdGVwU2l6ZVNlcXVlbmNlIHNlbGVjdGVkJylcbiAgICB9XG4gICAgcmV0dXJuIGFcbiAgfVxuXG4gIC8vIEludGVncmF0ZSB0aGUgZGlmZmVyZW50aWFsIHN5c3RlbSByZXByZXNlbnRlZCBieSBmLCBmcm9tIHggdG8geEVuZCwgd2l0aCBpbml0aWFsIGRhdGEgeS5cbiAgLy8gc29sT3V0LCBpZiBwcm92aWRlZCwgaXMgY2FsbGVkIGF0IGVhY2ggaW50ZWdyYXRpb24gc3RlcC5cbiAgc29sdmUoZjogRGVyaXZhdGl2ZSxcbiAgICAgICAgeDogbnVtYmVyLFxuICAgICAgICB5MDogbnVtYmVyW10sXG4gICAgICAgIHhFbmQ6IG51bWJlcixcbiAgICAgICAgc29sT3V0PzogT3V0cHV0RnVuY3Rpb24pIHtcblxuICAgIC8vIE1ha2UgYSBjb3B5IG9mIHkwLCAxLWJhc2VkLiBXZSBsZWF2ZSB0aGUgdXNlcidzIHBhcmFtZXRlcnMgYWxvbmUgc28gdGhhdCB0aGV5IG1heSBiZSByZXVzZWQgaWYgZGVzaXJlZC5cbiAgICBsZXQgeSA9IFswXS5jb25jYXQoeTApXG4gICAgbGV0IGR6ID0gU29sdmVyLmRpbSh0aGlzLm4pXG4gICAgbGV0IHloMSA9IFNvbHZlci5kaW0odGhpcy5uKVxuICAgIGxldCB5aDIgPSBTb2x2ZXIuZGltKHRoaXMubilcbiAgICBpZiAodGhpcy5tYXhTdGVwcyA8PSAwKSB0aHJvdyBuZXcgRXJyb3IoJ21heFN0ZXBzIG11c3QgYmUgcG9zaXRpdmUnKVxuICAgIGNvbnN0IGttID0gdGhpcy5tYXhFeHRyYXBvbGF0aW9uQ29sdW1uc1xuICAgIGlmIChrbSA8PSAyKSB0aHJvdyBuZXcgRXJyb3IoJ21heEV4dHJhcG9sYXRpb25Db2x1bW5zIG11c3QgYmUgPiAyJylcbiAgICBjb25zdCBuU2VxID0gdGhpcy5zdGVwU2l6ZVNlcXVlbmNlIHx8ICh0aGlzLmRlbnNlT3V0cHV0ID8gNCA6IDEpXG4gICAgaWYgKG5TZXEgPD0gMyAmJiB0aGlzLmRlbnNlT3V0cHV0KSB0aHJvdyBuZXcgRXJyb3IoJ3N0ZXBTaXplU2VxdWVuY2UgaW5jb21wYXRpYmxlIHdpdGggZGVuc2VPdXRwdXQnKVxuICAgIGlmICh0aGlzLmRlbnNlT3V0cHV0ICYmICFzb2xPdXQpIHRocm93IG5ldyBFcnJvcignZGVuc2VPdXRwdXQgcmVxdWlyZXMgYSBzb2x1dGlvbiBvYnNlcnZlciBmdW5jdGlvbicpXG4gICAgaWYgKHRoaXMuaW50ZXJwb2xhdGlvbkZvcm11bGFEZWdyZWUgPD0gMCB8fCB0aGlzLmludGVycG9sYXRpb25Gb3JtdWxhRGVncmVlID49IDcpIHRocm93IG5ldyBFcnJvcignYmFkIGludGVycG9sYXRpb25Gb3JtdWxhRGVncmVlJylcbiAgICBsZXQgaWNvbSA9IFswXSAgLy8gaWNvbSB3aWxsIGJlIDEtYmFzZWQsIHNvIHN0YXJ0IHdpdGggYSBwYWQgZW50cnkuXG4gICAgbGV0IG5yZGVucyA9IDBcbiAgICBpZiAodGhpcy5kZW5zZU91dHB1dCkge1xuICAgICAgaWYgKHRoaXMuZGVuc2VDb21wb25lbnRzKSB7XG4gICAgICAgIGZvciAobGV0IGMgb2YgdGhpcy5kZW5zZUNvbXBvbmVudHMpIHtcbiAgICAgICAgICAvLyBjb252ZXJ0IGRlbnNlIGNvbXBvbmVudHMgcmVxdWVzdGVkIGludG8gb25lLWJhc2VkIGluZGV4aW5nLlxuICAgICAgICAgIGlmIChjIDwgMCB8fCBjID4gdGhpcy5uKSB0aHJvdyBuZXcgRXJyb3IoJ2JhZCBkZW5zZSBjb21wb25lbnQ6ICcgKyBjKVxuICAgICAgICAgIGljb20ucHVzaChjICsgMSlcbiAgICAgICAgICArK25yZGVuc1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBpZiB1c2VyIGFza2VkIGZvciBkZW5zZSBvdXRwdXQgYnV0IGRpZCBub3Qgc3BlY2lmeSBhbnkgZGVuc2VDb21wb25lbnRzLFxuICAgICAgICAvLyByZXF1ZXN0IGFsbCBvZiB0aGVtLlxuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSB0aGlzLm47ICsraSkge1xuICAgICAgICAgIGljb20ucHVzaChpKVxuICAgICAgICB9XG4gICAgICAgIG5yZGVucyA9IHRoaXMublxuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGhpcy51Um91bmQgPD0gMWUtMzUgfHwgdGhpcy51Um91bmQgPiAxKSB0aHJvdyBuZXcgRXJyb3IoJ3N1c3BpY2lvdXMgdmFsdWUgb2YgdVJvdW5kJylcbiAgICBjb25zdCBoTWF4ID0gTWF0aC5hYnModGhpcy5tYXhTdGVwU2l6ZSB8fCB4RW5kIC0geClcbiAgICBjb25zdCBsZlNhZmUgPSAyICoga20gKiBrbSArIGttXG5cbiAgICBmdW5jdGlvbiBleHBhbmRUb0FycmF5KHg6IG51bWJlcnxudW1iZXJbXSwgbjogbnVtYmVyKTogbnVtYmVyW10ge1xuICAgICAgLy8gSWYgeCBpcyBhbiBhcnJheSwgcmV0dXJuIGEgMS1iYXNlZCBjb3B5IG9mIGl0LiBJZiB4IGlzIGEgbnVtYmVyLCByZXR1cm4gYSBuZXcgMS1iYXNlZCBhcnJheVxuICAgICAgLy8gY29uc2lzdGluZyBvZiBuIGNvcGllcyBvZiB0aGUgbnVtYmVyLlxuICAgICAgY29uc3QgdG9sQXJyYXkgPSBbMF1cbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHgpKSB7XG4gICAgICAgIHJldHVybiB0b2xBcnJheS5jb25jYXQoeClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbjsgKytpKSB0b2xBcnJheS5wdXNoKHgpXG4gICAgICAgIHJldHVybiB0b2xBcnJheVxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGFUb2wgPSBleHBhbmRUb0FycmF5KHRoaXMuYWJzb2x1dGVUb2xlcmFuY2UsIHRoaXMubilcbiAgICBjb25zdCByVG9sID0gZXhwYW5kVG9BcnJheSh0aGlzLnJlbGF0aXZlVG9sZXJhbmNlLCB0aGlzLm4pXG4gICAgbGV0IFtuRXZhbCwgblN0ZXAsIG5BY2NlcHQsIG5SZWplY3RdID0gWzAsIDAsIDAsIDBdXG5cbiAgICAvLyBjYWxsIHRvIGNvcmUgaW50ZWdyYXRvclxuICAgIGNvbnN0IG5yZCA9IE1hdGgubWF4KDEsIG5yZGVucylcbiAgICBjb25zdCBuY29tID0gTWF0aC5tYXgoMSwgKDIgKiBrbSArIDUpICogbnJkZW5zKVxuICAgIGNvbnN0IGRlbnMgPSBTb2x2ZXIuZGltKG5jb20pXG4gICAgY29uc3QgZlNhZmUgPSBTb2x2ZXIuZGltMihsZlNhZmUsIG5yZClcblxuICAgIC8vIFdyYXAgZiBpbiBhIGZ1bmN0aW9uIEYgd2hpY2ggaGlkZXMgdGhlIG9uZS1iYXNlZCBpbmRleGluZyBmcm9tIHRoZSBjdXN0b21lcnMuXG4gICAgY29uc3QgRiA9ICh4OiBudW1iZXIsIHk6IG51bWJlcltdLCB5cDogbnVtYmVyW10pID0+IHtcbiAgICAgIGxldCByZXQgPSBmKHgsIHkuc2xpY2UoMSkpXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJldC5sZW5ndGg7ICsraSkgeXBbaSArIDFdID0gcmV0W2ldXG4gICAgfVxuXG4gICAgbGV0IG9keGNvciA9ICgpOiBPdXRjb21lID0+IHtcbiAgICAgIC8vIFRoZSBmb2xsb3dpbmcgdGhyZWUgdmFyaWFibGVzIGFyZSBDT01NT04vQ09OVEVYL1xuICAgICAgbGV0IHhPbGRkOiBudW1iZXJcbiAgICAgIGxldCBoaGg6IG51bWJlclxuICAgICAgbGV0IGttaXQ6IG51bWJlclxuXG4gICAgICBsZXQgYWNjZXB0U3RlcCA9IChuOiBudW1iZXIpOiBib29sZWFuID0+IHsgICAvLyBsYWJlbCA2MFxuICAgICAgICAvLyBSZXR1cm5zIHRydWUgaWYgd2Ugc2hvdWxkIGNvbnRpbnVlIHRoZSBpbnRlZ3JhdGlvbi4gVGhlIG9ubHkgdGltZSBmYWxzZVxuICAgICAgICAvLyBpcyByZXR1cm5lZCBpcyB3aGVuIHRoZSB1c2VyJ3Mgc29sdXRpb24gb2JzZXJ2YXRpb24gZnVuY3Rpb24gaGFzIHJldHVybmVkIGZhbHNlLFxuICAgICAgICAvLyBpbmRpY2F0aW5nIHRoYXQgc2hlIGRvZXMgbm90IHdpc2ggdG8gY29udGludWUgdGhlIGNvbXB1dGF0aW9uLlxuICAgICAgICB4T2xkID0geFxuICAgICAgICB4ICs9IGhcbiAgICAgICAgaWYgKHRoaXMuZGVuc2VPdXRwdXQpIHtcbiAgICAgICAgICAvLyBrbWl0ID0gbXUgb2YgdGhlIHBhcGVyXG4gICAgICAgICAga21pdCA9IDIgKiBrYyAtIHRoaXMuaW50ZXJwb2xhdGlvbkZvcm11bGFEZWdyZWUgKyAxXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbnJkOyArK2kpIGRlbnNbaV0gPSB5W2ljb21baV1dXG4gICAgICAgICAgeE9sZGQgPSB4T2xkXG4gICAgICAgICAgaGhoID0gaCAgLy8gbm90ZTogeE9sZGQgYW5kIGhoaCBhcmUgcGFydCBvZiAvQ09OT0RYL1xuICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG5yZDsgKytpKSBkZW5zW25yZCArIGldID0gaCAqIGR6W2ljb21baV1dXG4gICAgICAgICAgbGV0IGtsbiA9IDIgKiBucmRcbiAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBucmQ7ICsraSkgZGVuc1trbG4gKyBpXSA9IHRbMV1baWNvbVtpXV1cbiAgICAgICAgICAvLyBjb21wdXRlIHNvbHV0aW9uIGF0IG1pZC1wb2ludFxuICAgICAgICAgIGZvciAobGV0IGogPSAyOyBqIDw9IGtjOyArK2opIHtcbiAgICAgICAgICAgIGxldCBkYmxlbmogPSBualtqXVxuICAgICAgICAgICAgZm9yIChsZXQgbCA9IGo7IGwgPj0gMjsgLS1sKSB7XG4gICAgICAgICAgICAgIGxldCBmYWN0b3IgPSAoZGJsZW5qIC8gbmpbbCAtIDFdKSAqKiAyIC0gMVxuICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBucmQ7ICsraSkge1xuICAgICAgICAgICAgICAgIHlTYWZlW2wgLSAxXVtpXSA9IHlTYWZlW2xdW2ldICsgKHlTYWZlW2xdW2ldIC0geVNhZmVbbCAtIDFdW2ldKSAvIGZhY3RvclxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGxldCBrcm4gPSA0ICogbnJkXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbnJkOyArK2kpIGRlbnNba3JuICsgaV0gPSB5U2FmZVsxXVtpXVxuICAgICAgICAgIC8vIGNvbXB1dGUgZmlyc3QgZGVyaXZhdGl2ZSBhdCByaWdodCBlbmRcbiAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBuOyArK2kpIHloMVtpXSA9IHRbMV1baV1cbiAgICAgICAgICBGKHgsIHloMSwgeWgyKVxuICAgICAgICAgIGtybiA9IDMgKiBucmRcbiAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBucmQ7ICsraSkgZGVuc1trcm4gKyBpXSA9IHloMltpY29tW2ldXSAqIGhcbiAgICAgICAgICAvLyBUSEUgTE9PUFxuICAgICAgICAgIGZvciAobGV0IGttaSA9IDE7IGttaSA8PSBrbWl0OyArK2ttaSkge1xuICAgICAgICAgICAgLy8gY29tcHV0ZSBrbWktdGggZGVyaXZhdGl2ZSBhdCBtaWQtcG9pbnRcbiAgICAgICAgICAgIGxldCBrYmVnID0gKGttaSArIDEpIC8gMiB8IDBcbiAgICAgICAgICAgIGZvciAobGV0IGtrID0ga2JlZzsga2sgPD0ga2M7ICsra2spIHtcbiAgICAgICAgICAgICAgbGV0IGZhY25qID0gKG5qW2trXSAvIDIpICoqIChrbWkgLSAxKVxuICAgICAgICAgICAgICBpUHQgPSBpUG9pbnRba2sgKyAxXSAtIDIgKiBrayArIGttaVxuICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBucmQ7ICsraSkge1xuICAgICAgICAgICAgICAgIHlTYWZlW2trXVtpXSA9IGZTYWZlW2lQdF1baV0gKiBmYWNualxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGxldCBqID0ga2JlZyArIDE7IGogPD0ga2M7ICsraikge1xuICAgICAgICAgICAgICBsZXQgZGJsZW5qID0gbmpbal1cbiAgICAgICAgICAgICAgZm9yIChsZXQgbCA9IGo7IGwgPj0ga2JlZyArIDE7IC0tbCkge1xuICAgICAgICAgICAgICAgIGxldCBmYWN0b3IgPSAoZGJsZW5qIC8gbmpbbCAtIDFdKSAqKiAyIC0gMVxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG5yZDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICB5U2FmZVtsIC0gMV1baV0gPSB5U2FmZVtsXVtpXSArICh5U2FmZVtsXVtpXSAtIHlTYWZlW2wgLSAxXVtpXSkgLyBmYWN0b3JcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGtybiA9IChrbWkgKyA0KSAqIG5yZFxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbnJkOyArK2kpIGRlbnNba3JuICsgaV0gPSB5U2FmZVtrYmVnXVtpXSAqIGhcbiAgICAgICAgICAgIGlmIChrbWkgPT09IGttaXQpIGNvbnRpbnVlXG4gICAgICAgICAgICAvLyBjb21wdXRlIGRpZmZlcmVuY2VzXG4gICAgICAgICAgICBmb3IgKGxldCBrayA9IChrbWkgKyAyKSAvIDIgfCAwOyBrayA8PSBrYzsgKytraykge1xuICAgICAgICAgICAgICBsZXQgbGJlZyA9IGlQb2ludFtrayArIDFdXG4gICAgICAgICAgICAgIGxldCBsZW5kID0gaVBvaW50W2trXSArIGttaSArIDFcbiAgICAgICAgICAgICAgaWYgKGttaSA9PT0gMSAmJiBuU2VxID09PSA0KSBsZW5kICs9IDJcbiAgICAgICAgICAgICAgbGV0IGw6IG51bWJlclxuICAgICAgICAgICAgICBmb3IgKGwgPSBsYmVnOyBsID49IGxlbmQ7IGwgLT0gMikge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG5yZDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICBmU2FmZVtsXVtpXSAtPSBmU2FmZVtsIC0gMl1baV1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKGttaSA9PT0gMSAmJiBuU2VxID09PSA0KSB7XG4gICAgICAgICAgICAgICAgbCA9IGxlbmQgLSAyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbnJkOyArK2kpIGZTYWZlW2xdW2ldIC09IGR6W2ljb21baV1dXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGNvbXB1dGUgZGlmZmVyZW5jZXNcbiAgICAgICAgICAgIGZvciAobGV0IGtrID0gKGttaSArIDIpIC8gMiB8IDA7IGtrIDw9IGtjOyArK2trKSB7XG4gICAgICAgICAgICAgIGxldCBsYmVnID0gaVBvaW50W2trICsgMV0gLSAxXG4gICAgICAgICAgICAgIGxldCBsZW5kID0gaVBvaW50W2trXSArIGttaSArIDJcbiAgICAgICAgICAgICAgZm9yIChsZXQgbCA9IGxiZWc7IGwgPj0gbGVuZDsgbCAtPSAyKSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbnJkOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgIGZTYWZlW2xdW2ldIC09IGZTYWZlW2wgLSAyXVtpXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpbnRlcnAobnJkLCBkZW5zLCBrbWl0KVxuICAgICAgICAgIC8vIGVzdGltYXRpb24gb2YgaW50ZXJwb2xhdGlvbiBlcnJvclxuICAgICAgICAgIGlmICh0aGlzLmRlbnNlT3V0cHV0RXJyb3JFc3RpbWF0b3IgJiYga21pdCA+PSAxKSB7XG4gICAgICAgICAgICBsZXQgZXJyaW50ID0gMFxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbnJkOyArK2kpIGVycmludCArPSAoZGVuc1soa21pdCArIDQpICogbnJkICsgaV0gLyBzY2FsW2ljb21baV1dKSAqKiAyXG4gICAgICAgICAgICBlcnJpbnQgPSBNYXRoLnNxcnQoZXJyaW50IC8gbnJkKSAqIGVycmZhY1trbWl0XVxuICAgICAgICAgICAgaG9wdGRlID0gaCAvIE1hdGgubWF4KGVycmludCAqKiAoMSAvIChrbWl0ICsgNCkpLCAwLjAxKVxuICAgICAgICAgICAgaWYgKGVycmludCA+IDEwKSB7XG4gICAgICAgICAgICAgIGggPSBob3B0ZGVcbiAgICAgICAgICAgICAgeCA9IHhPbGRcbiAgICAgICAgICAgICAgKytuUmVqZWN0XG4gICAgICAgICAgICAgIHJlamVjdCA9IHRydWVcbiAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbjsgKytpKSBkeltpXSA9IHloMltpXVxuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG47ICsraSkgeVtpXSA9IHRbMV1baV1cbiAgICAgICAgKytuQWNjZXB0XG4gICAgICAgIGlmIChzb2xPdXQpIHtcbiAgICAgICAgICAvLyBJZiBkZW5zZU91dHB1dCwgd2UgYWxzbyB3YW50IHRvIHN1cHBseSB0aGUgZGVuc2UgY2xvc3VyZS5cbiAgICAgICAgICBpZiAoc29sT3V0KG5BY2NlcHQgKyAxLCB4T2xkLCB4LCB5LnNsaWNlKDEpLFxuICAgICAgICAgICAgICB0aGlzLmRlbnNlT3V0cHV0ICYmIGNvbnRleCh4T2xkZCwgaGhoLCBrbWl0LCBkZW5zLCBpY29tKSkgPT09IGZhbHNlKSByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuICAgICAgICAvLyBjb21wdXRlIG9wdGltYWwgb3JkZXJcbiAgICAgICAgbGV0IGtvcHQ6IG51bWJlclxuICAgICAgICBpZiAoa2MgPT09IDIpIHtcbiAgICAgICAgICBrb3B0ID0gTWF0aC5taW4oMywga20gLSAxKVxuICAgICAgICAgIGlmIChyZWplY3QpIGtvcHQgPSAyXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKGtjIDw9IGspIHtcbiAgICAgICAgICAgIGtvcHQgPSBrY1xuICAgICAgICAgICAgaWYgKHdba2MgLSAxXSA8IHdba2NdICogdGhpcy5zdGVwU2l6ZUZhYzMpIGtvcHQgPSBrYyAtIDFcbiAgICAgICAgICAgIGlmICh3W2tjXSA8IHdba2MgLSAxXSAqIHRoaXMuc3RlcFNpemVGYWM0KSBrb3B0ID0gTWF0aC5taW4oa2MgKyAxLCBrbSAtIDEpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGtvcHQgPSBrYyAtIDFcbiAgICAgICAgICAgIGlmIChrYyA+IDMgJiYgd1trYyAtIDJdIDwgd1trYyAtIDFdICogdGhpcy5zdGVwU2l6ZUZhYzMpIGtvcHQgPSBrYyAtIDJcbiAgICAgICAgICAgIGlmICh3W2tjXSA8IHdba29wdF0gKiB0aGlzLnN0ZXBTaXplRmFjNCkga29wdCA9IE1hdGgubWluKGtjLCBrbSAtIDEpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIGFmdGVyIGEgcmVqZWN0ZWQgc3RlcFxuICAgICAgICBpZiAocmVqZWN0KSB7XG4gICAgICAgICAgayA9IE1hdGgubWluKGtvcHQsIGtjKVxuICAgICAgICAgIGggPSBwb3NuZWcgKiBNYXRoLm1pbihNYXRoLmFicyhoKSwgTWF0aC5hYnMoaGhba10pKVxuICAgICAgICAgIHJlamVjdCA9IGZhbHNlXG4gICAgICAgICAgcmV0dXJuIHRydWUgIC8vIGdvdG8gMTBcbiAgICAgICAgfVxuICAgICAgICBpZiAoa29wdCA8PSBrYykge1xuICAgICAgICAgIGggPSBoaFtrb3B0XVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChrYyA8IGsgJiYgd1trY10gPCB3W2tjIC0gMV0gKiB0aGlzLnN0ZXBTaXplRmFjNCkge1xuICAgICAgICAgICAgaCA9IGhoW2tjXSAqIGFba29wdCArIDFdIC8gYVtrY11cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaCA9IGhoW2tjXSAqIGFba29wdF0gLyBhW2tjXVxuICAgICAgICAgIH1cblxuXG4gICAgICAgIH1cbiAgICAgICAgLy8gY29tcHV0ZSBzdGVwc2l6ZSBmb3IgbmV4dCBzdGVwXG4gICAgICAgIGsgPSBrb3B0XG4gICAgICAgIGggPSBwb3NuZWcgKiBNYXRoLmFicyhoKVxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgfVxuXG4gICAgICBsZXQgbWlkZXggPSAoajogbnVtYmVyKTogdm9pZCA9PiB7XG4gICAgICAgIGNvbnN0IGR5ID0gU29sdmVyLmRpbSh0aGlzLm4pXG4gICAgICAgIC8vIENvbXB1dGVzIHRoZSBqdGggbGluZSBvZiB0aGUgZXh0cmFwb2xhdGlvbiB0YWJsZSBhbmRcbiAgICAgICAgLy8gcHJvdmlkZXMgYW4gZXN0aW1hdGlvbiBvZiB0aGUgb3B0aW9uYWwgc3RlcHNpemVcbiAgICAgICAgY29uc3QgaGogPSBoIC8gbmpbal1cbiAgICAgICAgLy8gRXVsZXIgc3RhcnRpbmcgc3RlcFxuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSB0aGlzLm47ICsraSkge1xuICAgICAgICAgIHloMVtpXSA9IHlbaV1cbiAgICAgICAgICB5aDJbaV0gPSB5W2ldICsgaGogKiBkeltpXVxuICAgICAgICB9XG4gICAgICAgIC8vIEV4cGxpY2l0IG1pZHBvaW50IHJ1bGVcbiAgICAgICAgY29uc3QgbSA9IG5qW2pdIC0gMVxuICAgICAgICBjb25zdCBuak1pZCA9IChualtqXSAvIDIpIHwgMFxuICAgICAgICBmb3IgKGxldCBtbSA9IDE7IG1tIDw9IG07ICsrbW0pIHtcbiAgICAgICAgICBpZiAodGhpcy5kZW5zZU91dHB1dCAmJiBtbSA9PT0gbmpNaWQpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG5yZDsgKytpKSB7XG4gICAgICAgICAgICAgIHlTYWZlW2pdW2ldID0geWgyW2ljb21baV1dXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIEYoeCArIGhqICogbW0sIHloMiwgZHkpXG4gICAgICAgICAgaWYgKHRoaXMuZGVuc2VPdXRwdXQgJiYgTWF0aC5hYnMobW0gLSBuak1pZCkgPD0gMiAqIGogLSAxKSB7XG4gICAgICAgICAgICArK2lQdFxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbnJkOyArK2kpIHtcbiAgICAgICAgICAgICAgZlNhZmVbaVB0XVtpXSA9IGR5W2ljb21baV1dXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IHRoaXMubjsgKytpKSB7XG4gICAgICAgICAgICBsZXQgeXMgPSB5aDFbaV1cbiAgICAgICAgICAgIHloMVtpXSA9IHloMltpXVxuICAgICAgICAgICAgeWgyW2ldID0geXMgKyAyICogaGogKiBkeVtpXVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAobW0gPD0gdGhpcy5zdGFiaWxpdHlDaGVja0NvdW50ICYmIGogPD0gdGhpcy5zdGFiaWxpdHlDaGVja1RhYmxlTGluZXMpIHtcbiAgICAgICAgICAgIC8vIHN0YWJpbGl0eSBjaGVja1xuICAgICAgICAgICAgbGV0IGRlbDEgPSAwXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSB0aGlzLm47ICsraSkge1xuICAgICAgICAgICAgICBkZWwxICs9IChkeltpXSAvIHNjYWxbaV0pICoqIDJcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBkZWwyID0gMFxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gdGhpcy5uOyArK2kpIHtcbiAgICAgICAgICAgICAgZGVsMiArPSAoKGR5W2ldIC0gZHpbaV0pIC8gc2NhbFtpXSkgKiogMlxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgcXVvdCA9IGRlbDIgLyBNYXRoLm1heCh0aGlzLnVSb3VuZCwgZGVsMSlcbiAgICAgICAgICAgIGlmIChxdW90ID4gNCkge1xuICAgICAgICAgICAgICArK25FdmFsXG4gICAgICAgICAgICAgIGF0b3YgPSB0cnVlXG4gICAgICAgICAgICAgIGggKj0gdGhpcy5zdGVwU2l6ZVJlZHVjdGlvbkZhY3RvclxuICAgICAgICAgICAgICByZWplY3QgPSB0cnVlXG4gICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBmaW5hbCBzbW9vdGhpbmcgc3RlcFxuICAgICAgICBGKHggKyBoLCB5aDIsIGR5KVxuICAgICAgICBpZiAodGhpcy5kZW5zZU91dHB1dCAmJiBuak1pZCA8PSAyICogaiAtIDEpIHtcbiAgICAgICAgICArK2lQdFxuICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG5yZDsgKytpKSB7XG4gICAgICAgICAgICBmU2FmZVtpUHRdW2ldID0gZHlbaWNvbVtpXV1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gdGhpcy5uOyArK2kpIHtcbiAgICAgICAgICB0W2pdW2ldID0gKHloMVtpXSArIHloMltpXSArIGhqICogZHlbaV0pIC8gMlxuICAgICAgICB9XG4gICAgICAgIG5FdmFsICs9IG5qW2pdXG4gICAgICAgIC8vIHBvbHlub21pYWwgZXh0cmFwb2xhdGlvblxuICAgICAgICBpZiAoaiA9PT0gMSkgcmV0dXJuICAvLyB3YXMgai5lcS4xXG4gICAgICAgIGNvbnN0IGRibGVuaiA9IG5qW2pdXG4gICAgICAgIGxldCBmYWM6IG51bWJlclxuICAgICAgICBmb3IgKGxldCBsID0gajsgbCA+IDE7IC0tbCkge1xuICAgICAgICAgIGZhYyA9IChkYmxlbmogLyBualtsIC0gMV0pICoqIDIgLSAxXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gdGhpcy5uOyArK2kpIHtcbiAgICAgICAgICAgIHRbbCAtIDFdW2ldID0gdFtsXVtpXSArICh0W2xdW2ldIC0gdFtsIC0gMV1baV0pIC8gZmFjXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVyciA9IDBcbiAgICAgICAgLy8gc2NhbGluZ1xuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSB0aGlzLm47ICsraSkge1xuICAgICAgICAgIGxldCB0MWkgPSBNYXRoLm1heChNYXRoLmFicyh5W2ldKSwgTWF0aC5hYnModFsxXVtpXSkpXG4gICAgICAgICAgc2NhbFtpXSA9IGFUb2xbaV0gKyByVG9sW2ldICogdDFpXG4gICAgICAgICAgZXJyICs9ICgodFsxXVtpXSAtIHRbMl1baV0pIC8gc2NhbFtpXSkgKiogMlxuICAgICAgICB9XG4gICAgICAgIGVyciA9IE1hdGguc3FydChlcnIgLyB0aGlzLm4pXG4gICAgICAgIGlmIChlcnIgKiB0aGlzLnVSb3VuZCA+PSAxIHx8IChqID4gMiAmJiBlcnIgPj0gZXJyT2xkKSkge1xuICAgICAgICAgIGF0b3YgPSB0cnVlXG4gICAgICAgICAgaCAqPSB0aGlzLnN0ZXBTaXplUmVkdWN0aW9uRmFjdG9yXG4gICAgICAgICAgcmVqZWN0ID0gdHJ1ZVxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIGVyck9sZCA9IE1hdGgubWF4KDQgKiBlcnIsIDEpXG4gICAgICAgIC8vIGNvbXB1dGUgb3B0aW1hbCBzdGVwc2l6ZXNcbiAgICAgICAgbGV0IGV4cDAgPSAxIC8gKDIgKiBqIC0gMSlcbiAgICAgICAgbGV0IGZhY01pbiA9IHRoaXMuc3RlcFNpemVGYWMxICoqIGV4cDBcbiAgICAgICAgZmFjID0gTWF0aC5taW4odGhpcy5zdGVwU2l6ZUZhYzIgLyBmYWNNaW4sXG4gICAgICAgICAgTWF0aC5tYXgoZmFjTWluLCAoZXJyIC8gdGhpcy5zdGVwU2FmZXR5RmFjdG9yMSkgKiogZXhwMCAvIHRoaXMuc3RlcFNhZmV0eUZhY3RvcjIpKVxuICAgICAgICBmYWMgPSAxIC8gZmFjXG4gICAgICAgIGhoW2pdID0gTWF0aC5taW4oTWF0aC5hYnMoaCkgKiBmYWMsIGhNYXgpXG4gICAgICAgIHdbal0gPSBhW2pdIC8gaGhbal1cbiAgICAgIH1cblxuICAgICAgY29uc3QgaW50ZXJwID0gKG46IG51bWJlciwgeTogbnVtYmVyW10sIGltaXQ6IG51bWJlcikgPT4ge1xuICAgICAgICAvLyBjb21wdXRlcyB0aGUgY29lZmZpY2llbnRzIG9mIHRoZSBpbnRlcnBvbGF0aW9uIGZvcm11bGFcbiAgICAgICAgbGV0IGEgPSBuZXcgQXJyYXkoMzEpICAvLyB6ZXJvLWJhc2VkOiAwOjMwXG4gICAgICAgIC8vIGJlZ2luIHdpdGggSGVybWl0ZSBpbnRlcnBvbGF0aW9uXG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG47ICsraSkge1xuICAgICAgICAgIGxldCB5MCA9IHlbaV1cbiAgICAgICAgICBsZXQgeTEgPSB5WzIgKiBuICsgaV1cbiAgICAgICAgICBsZXQgeXAwID0geVtuICsgaV1cbiAgICAgICAgICBsZXQgeXAxID0geVszICogbiArIGldXG4gICAgICAgICAgbGV0IHlEaWZmID0geTEgLSB5MFxuICAgICAgICAgIGxldCBhc3BsID0gLXlwMSArIHlEaWZmXG4gICAgICAgICAgbGV0IGJzcGwgPSB5cDAgLSB5RGlmZlxuICAgICAgICAgIHlbbiArIGldID0geURpZmZcbiAgICAgICAgICB5WzIgKiBuICsgaV0gPSBhc3BsXG4gICAgICAgICAgeVszICogbiArIGldID0gYnNwbFxuICAgICAgICAgIGlmIChpbWl0IDwgMCkgY29udGludWVcbiAgICAgICAgICAvLyBjb21wdXRlIHRoZSBkZXJpdmF0aXZlcyBvZiBIZXJtaXRlIGF0IG1pZHBvaW50XG4gICAgICAgICAgbGV0IHBoMCA9ICh5MCArIHkxKSAqIDAuNSArIDAuMTI1ICogKGFzcGwgKyBic3BsKVxuICAgICAgICAgIGxldCBwaDEgPSB5RGlmZiArIChhc3BsIC0gYnNwbCkgKiAwLjI1XG4gICAgICAgICAgbGV0IHBoMiA9IC0oeXAwIC0geXAxKVxuICAgICAgICAgIGxldCBwaDMgPSA2ICogKGJzcGwgLSBhc3BsKVxuICAgICAgICAgIC8vIGNvbXB1dGUgdGhlIGZ1cnRoZXIgY29lZmZpY2llbnRzXG4gICAgICAgICAgaWYgKGltaXQgPj0gMSkge1xuICAgICAgICAgICAgYVsxXSA9IDE2ICogKHlbNSAqIG4gKyBpXSAtIHBoMSlcbiAgICAgICAgICAgIGlmIChpbWl0ID49IDMpIHtcbiAgICAgICAgICAgICAgYVszXSA9IDE2ICogKHlbNyAqIG4gKyBpXSAtIHBoMyArIDMgKiBhWzFdKVxuICAgICAgICAgICAgICBpZiAoaW1pdCA+PSA1KSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaW0gPSA1OyBpbSA8PSBpbWl0OyBpbSArPSAyKSB7XG4gICAgICAgICAgICAgICAgICBsZXQgZmFjMSA9IGltICogKGltIC0gMSkgLyAyXG4gICAgICAgICAgICAgICAgICBsZXQgZmFjMiA9IGZhYzEgKiAoaW0gLSAyKSAqIChpbSAtIDMpICogMlxuICAgICAgICAgICAgICAgICAgYVtpbV0gPSAxNiAqICh5WyhpbSArIDQpICogbiArIGldICsgZmFjMSAqIGFbaW0gLSAyXSAtIGZhYzIgKiBhW2ltIC0gNF0pXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGFbMF0gPSAoeVs0ICogbiArIGldIC0gcGgwKSAqIDE2XG4gICAgICAgICAgaWYgKGltaXQgPj0gMikge1xuICAgICAgICAgICAgYVsyXSA9ICh5W24gKiA2ICsgaV0gLSBwaDIgKyBhWzBdKSAqIDE2XG4gICAgICAgICAgICBpZiAoaW1pdCA+PSA0KSB7XG4gICAgICAgICAgICAgIGZvciAobGV0IGltID0gNDsgaW0gPD0gaW1pdDsgaW0gKz0gMikge1xuICAgICAgICAgICAgICAgIGxldCBmYWMxID0gaW0gKiAoaW0gLSAxKSAvIDJcbiAgICAgICAgICAgICAgICBsZXQgZmFjMiA9IGltICogKGltIC0gMSkgKiAoaW0gLSAyKSAqIChpbSAtIDMpXG4gICAgICAgICAgICAgICAgYVtpbV0gPSAoeVtuICogKGltICsgNCkgKyBpXSArIGFbaW0gLSAyXSAqIGZhYzEgLSBhW2ltIC0gNF0gKiBmYWMyKSAqIDE2XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgZm9yIChsZXQgaW0gPSAwOyBpbSA8PSBpbWl0OyArK2ltKSB5W24gKiAoaW0gKyA0KSArIGldID0gYVtpbV1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCBjb250ZXggPSAoeE9sZDogbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgIGg6IG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICBpbWl0OiBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgeTogbnVtYmVyW10sXG4gICAgICAgICAgICAgICAgICAgICAgaWNvbTogbnVtYmVyW10pID0+IHtcbiAgICAgICAgcmV0dXJuIChjOiBudW1iZXIsIHg6IG51bWJlcikgPT4ge1xuICAgICAgICAgIGxldCBpID0gMFxuICAgICAgICAgIGZvciAobGV0IGogPSAxOyBqIDw9IG5yZDsgKytqKSB7XG4gICAgICAgICAgICAvLyBjYXJlZnVsOiBjdXN0b21lcnMgZGVzY3JpYmUgY29tcG9uZW50cyAwLWJhc2VkLiBXZSByZWNvcmQgaW5kaWNlcyAxLWJhc2VkLlxuICAgICAgICAgICAgaWYgKGljb21bal0gPT09IGMgKyAxKSBpID0galxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoaSA9PT0gMCkgdGhyb3cgbmV3IEVycm9yKCdubyBkZW5zZSBvdXRwdXQgYXZhaWxhYmxlIGZvciBjb21wb25lbnQgJyArIGMpXG4gICAgICAgICAgY29uc3QgdGhldGEgPSAoeCAtIHhPbGQpIC8gaFxuICAgICAgICAgIGNvbnN0IHRoZXRhMSA9IDEgLSB0aGV0YVxuICAgICAgICAgIGNvbnN0IHBodGhldCA9IHlbaV0gKyB0aGV0YSAqICh5W25yZCArIGldICsgdGhldGExICogKHlbMiAqIG5yZCArIGldICogdGhldGEgKyB5WzMgKiBucmQgKyBpXSAqIHRoZXRhMSkpXG4gICAgICAgICAgaWYgKGltaXQgPCAwKSByZXR1cm4gcGh0aGV0XG4gICAgICAgICAgY29uc3QgdGhldGFoID0gdGhldGEgLSAwLjVcbiAgICAgICAgICBsZXQgcmV0ID0geVtucmQgKiAoaW1pdCArIDQpICsgaV1cbiAgICAgICAgICBmb3IgKGxldCBpbSA9IGltaXQ7IGltID49IDE7IC0taW0pIHtcbiAgICAgICAgICAgIHJldCA9IHlbbnJkICogKGltICsgMykgKyBpXSArIHJldCAqIHRoZXRhaCAvIGltXG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBwaHRoZXQgKyAodGhldGEgKiB0aGV0YTEpICoqIDIgKiByZXRcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBwcmVwYXJhdGlvblxuICAgICAgY29uc3QgeVNhZmUgPSBTb2x2ZXIuZGltMihrbSwgbnJkKVxuICAgICAgY29uc3QgaGggPSBTb2x2ZXIuZGltKGttKVxuICAgICAgY29uc3QgdCA9IFNvbHZlci5kaW0yKGttLCB0aGlzLm4pXG4gICAgICAvLyBEZWZpbmUgdGhlIHN0ZXAgc2l6ZSBzZXF1ZW5jZVxuICAgICAgY29uc3QgbmogPSBTb2x2ZXIuc3RlcFNpemVTZXF1ZW5jZShuU2VxLCBrbSlcbiAgICAgIC8vIERlZmluZSB0aGUgYVtpXSBmb3Igb3JkZXIgc2VsZWN0aW9uXG4gICAgICBjb25zdCBhID0gU29sdmVyLmRpbShrbSlcbiAgICAgIGFbMV0gPSAxICsgbmpbMV1cbiAgICAgIGZvciAobGV0IGkgPSAyOyBpIDw9IGttOyArK2kpIHtcbiAgICAgICAgYVtpXSA9IGFbaSAtIDFdICsgbmpbaV1cbiAgICAgIH1cbiAgICAgIC8vIEluaXRpYWwgU2NhbGluZ1xuICAgICAgY29uc3Qgc2NhbCA9IFNvbHZlci5kaW0odGhpcy5uKVxuICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gdGhpcy5uOyArK2kpIHtcbiAgICAgICAgc2NhbFtpXSA9IGFUb2xbaV0gKyByVG9sW2ldICsgTWF0aC5hYnMoeVtpXSlcbiAgICAgIH1cbiAgICAgIC8vIEluaXRpYWwgcHJlcGFyYXRpb25zXG4gICAgICBjb25zdCBwb3NuZWcgPSB4RW5kIC0geCA+PSAwID8gMSA6IC0xXG4gICAgICBsZXQgayA9IE1hdGgubWF4KDIsIE1hdGgubWluKGttIC0gMSwgTWF0aC5mbG9vcigtU29sdmVyLmxvZzEwKHJUb2xbMV0gKyAxZS00MCkgKiAwLjYgKyAxLjUpKSlcbiAgICAgIGxldCBoID0gTWF0aC5tYXgoTWF0aC5hYnModGhpcy5pbml0aWFsU3RlcFNpemUpLCAxZS00KVxuICAgICAgaCA9IHBvc25lZyAqIE1hdGgubWluKGgsIGhNYXgsIE1hdGguYWJzKHhFbmQgLSB4KSAvIDIpXG4gICAgICBjb25zdCBpUG9pbnQgPSBTb2x2ZXIuZGltKGttICsgMSlcbiAgICAgIGNvbnN0IGVycmZhYyA9IFNvbHZlci5kaW0oMiAqIGttKVxuICAgICAgbGV0IHhPbGQgPSB4XG4gICAgICBsZXQgaVB0ID0gMFxuICAgICAgaWYgKHNvbE91dCkge1xuICAgICAgICBpZiAodGhpcy5kZW5zZU91dHB1dCkge1xuICAgICAgICAgIGlQb2ludFsxXSA9IDBcbiAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBrbTsgKytpKSB7XG4gICAgICAgICAgICBsZXQgbmpBZGQgPSA0ICogaSAtIDJcbiAgICAgICAgICAgIGlmIChualtpXSA+IG5qQWRkKSArK25qQWRkXG4gICAgICAgICAgICBpUG9pbnRbaSArIDFdID0gaVBvaW50W2ldICsgbmpBZGRcbiAgICAgICAgICB9XG4gICAgICAgICAgZm9yIChsZXQgbXUgPSAxOyBtdSA8PSAyICoga207ICsrbXUpIHtcbiAgICAgICAgICAgIGxldCBlcnJ4ID0gTWF0aC5zcXJ0KG11IC8gKG11ICsgNCkpICogMC41XG4gICAgICAgICAgICBsZXQgcHJvZCA9ICgxIC8gKG11ICsgNCkpICoqIDJcbiAgICAgICAgICAgIGZvciAobGV0IGogPSAxOyBqIDw9IG11OyArK2opIHByb2QgKj0gZXJyeCAvIGpcbiAgICAgICAgICAgIGVycmZhY1ttdV0gPSBwcm9kXG4gICAgICAgICAgfVxuICAgICAgICAgIGlQdCA9IDBcbiAgICAgICAgfVxuICAgICAgICAvLyBjaGVjayByZXR1cm4gdmFsdWUgYW5kIGFiYW5kb24gaW50ZWdyYXRpb24gaWYgY2FsbGVkIGZvclxuICAgICAgICBpZiAoZmFsc2UgPT09IHNvbE91dChuQWNjZXB0ICsgMSwgeE9sZCwgeCwgeS5zbGljZSgxKSkpIHtcbiAgICAgICAgICByZXR1cm4gT3V0Y29tZS5FYXJseVJldHVyblxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBsZXQgZXJyID0gMFxuICAgICAgbGV0IGVyck9sZCA9IDFlMTBcbiAgICAgIGxldCBob3B0ZGUgPSBwb3NuZWcgKiBoTWF4XG4gICAgICBjb25zdCB3ID0gU29sdmVyLmRpbShrbSlcbiAgICAgIHdbMV0gPSAwXG4gICAgICBsZXQgcmVqZWN0ID0gZmFsc2VcbiAgICAgIGxldCBsYXN0ID0gZmFsc2VcbiAgICAgIGxldCBhdG92OiBib29sZWFuXG4gICAgICBsZXQga2MgPSAwXG5cbiAgICAgIGVudW0gU1RBVEUge1xuICAgICAgICBTdGFydCwgQmFzaWNJbnRlZ3JhdGlvblN0ZXAsIENvbnZlcmdlbmNlU3RlcCwgSG9wZUZvckNvbnZlcmdlbmNlLCBBY2NlcHQsIFJlamVjdFxuICAgICAgfVxuICAgICAgbGV0IHN0YXRlOiBTVEFURSA9IFNUQVRFLlN0YXJ0XG5cbiAgICAgIGxvb3A6IHdoaWxlICh0cnVlKSB7XG4gICAgICAgIHRoaXMuZGVidWcgJiYgY29uc29sZS5sb2coJ1NUQVRFJywgU1RBVEVbc3RhdGVdLCBuU3RlcCwgeE9sZCwgeCwgaCwgaywga2MsIGhvcHRkZSlcbiAgICAgICAgc3dpdGNoIChzdGF0ZSkge1xuICAgICAgICAgIGNhc2UgU1RBVEUuU3RhcnQ6XG4gICAgICAgICAgICBhdG92ID0gZmFsc2VcbiAgICAgICAgICAgIC8vIElzIHhFbmQgcmVhY2hlZCBpbiB0aGUgbmV4dCBzdGVwP1xuICAgICAgICAgICAgaWYgKDAuMSAqIE1hdGguYWJzKHhFbmQgLSB4KSA8PSBNYXRoLmFicyh4KSAqIHRoaXMudVJvdW5kKSBicmVhayBsb29wXG4gICAgICAgICAgICBoID0gcG9zbmVnICogTWF0aC5taW4oTWF0aC5hYnMoaCksIE1hdGguYWJzKHhFbmQgLSB4KSwgaE1heCwgTWF0aC5hYnMoaG9wdGRlKSlcbiAgICAgICAgICAgIGlmICgoeCArIDEuMDEgKiBoIC0geEVuZCkgKiBwb3NuZWcgPiAwKSB7XG4gICAgICAgICAgICAgIGggPSB4RW5kIC0geFxuICAgICAgICAgICAgICBsYXN0ID0gdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG5TdGVwID09PSAwIHx8ICF0aGlzLmRlbnNlT3V0cHV0KSB7XG4gICAgICAgICAgICAgIEYoeCwgeSwgZHopXG4gICAgICAgICAgICAgICsrbkV2YWxcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFRoZSBmaXJzdCBhbmQgbGFzdCBzdGVwXG4gICAgICAgICAgICBpZiAoblN0ZXAgPT09IDAgfHwgbGFzdCkge1xuICAgICAgICAgICAgICBpUHQgPSAwXG4gICAgICAgICAgICAgICsrblN0ZXBcbiAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IDE7IGogPD0gazsgKytqKSB7XG4gICAgICAgICAgICAgICAga2MgPSBqXG4gICAgICAgICAgICAgICAgbWlkZXgoailcbiAgICAgICAgICAgICAgICBpZiAoYXRvdikgY29udGludWUgbG9vcFxuICAgICAgICAgICAgICAgIGlmIChqID4gMSAmJiBlcnIgPD0gMSkge1xuICAgICAgICAgICAgICAgICAgc3RhdGUgPSBTVEFURS5BY2NlcHRcbiAgICAgICAgICAgICAgICAgIGNvbnRpbnVlIGxvb3BcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgc3RhdGUgPSBTVEFURS5Ib3BlRm9yQ29udmVyZ2VuY2VcbiAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN0YXRlID0gU1RBVEUuQmFzaWNJbnRlZ3JhdGlvblN0ZXBcbiAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICBjYXNlIFNUQVRFLkJhc2ljSW50ZWdyYXRpb25TdGVwOlxuICAgICAgICAgICAgLy8gYmFzaWMgaW50ZWdyYXRpb24gc3RlcFxuICAgICAgICAgICAgaVB0ID0gMFxuICAgICAgICAgICAgKytuU3RlcFxuICAgICAgICAgICAgaWYgKG5TdGVwID49IHRoaXMubWF4U3RlcHMpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIE91dGNvbWUuTWF4U3RlcHNFeGNlZWRlZFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAga2MgPSBrIC0gMVxuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDE7IGogPD0ga2M7ICsraikge1xuICAgICAgICAgICAgICBtaWRleChqKVxuICAgICAgICAgICAgICBpZiAoYXRvdikge1xuICAgICAgICAgICAgICAgIHN0YXRlID0gU1RBVEUuU3RhcnRcbiAgICAgICAgICAgICAgICBjb250aW51ZSBsb29wXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGNvbnZlcmdlbmNlIG1vbml0b3JcbiAgICAgICAgICAgIGlmIChrID09PSAyIHx8IHJlamVjdCkge1xuICAgICAgICAgICAgICBzdGF0ZSA9IFNUQVRFLkNvbnZlcmdlbmNlU3RlcFxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgaWYgKGVyciA8PSAxKSB7XG4gICAgICAgICAgICAgICAgc3RhdGUgPSBTVEFURS5BY2NlcHRcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChlcnIgPiAoKG5qW2sgKyAxXSAqIG5qW2tdKSAvIDQpICoqIDIpIHtcbiAgICAgICAgICAgICAgICBzdGF0ZSA9IFNUQVRFLlJlamVjdFxuICAgICAgICAgICAgICB9IGVsc2Ugc3RhdGUgPSBTVEFURS5Db252ZXJnZW5jZVN0ZXBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICBjYXNlIFNUQVRFLkNvbnZlcmdlbmNlU3RlcDogIC8vIGxhYmVsIDUwXG4gICAgICAgICAgICBtaWRleChrKVxuICAgICAgICAgICAgaWYgKGF0b3YpIHtcbiAgICAgICAgICAgICAgc3RhdGUgPSBTVEFURS5TdGFydFxuICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAga2MgPSBrXG4gICAgICAgICAgICBpZiAoZXJyIDw9IDEpIHtcbiAgICAgICAgICAgICAgc3RhdGUgPSBTVEFURS5BY2NlcHRcbiAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN0YXRlID0gU1RBVEUuSG9wZUZvckNvbnZlcmdlbmNlXG4gICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgY2FzZSBTVEFURS5Ib3BlRm9yQ29udmVyZ2VuY2U6XG4gICAgICAgICAgICAvLyBob3BlIGZvciBjb252ZXJnZW5jZSBpbiBsaW5lIGsgKyAxXG4gICAgICAgICAgICBpZiAoZXJyID4gKG5qW2sgKyAxXSAvIDIpICoqIDIpIHtcbiAgICAgICAgICAgICAgc3RhdGUgPSBTVEFURS5SZWplY3RcbiAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGtjID0gayArIDFcbiAgICAgICAgICAgIG1pZGV4KGtjKVxuICAgICAgICAgICAgaWYgKGF0b3YpIHN0YXRlID0gU1RBVEUuU3RhcnRcbiAgICAgICAgICAgIGVsc2UgaWYgKGVyciA+IDEpIHN0YXRlID0gU1RBVEUuUmVqZWN0XG4gICAgICAgICAgICBlbHNlIHN0YXRlID0gU1RBVEUuQWNjZXB0XG4gICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgY2FzZSBTVEFURS5BY2NlcHQ6XG4gICAgICAgICAgICBpZiAoIWFjY2VwdFN0ZXAodGhpcy5uKSkgcmV0dXJuIE91dGNvbWUuRWFybHlSZXR1cm5cbiAgICAgICAgICAgIHN0YXRlID0gU1RBVEUuU3RhcnRcbiAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICBjYXNlIFNUQVRFLlJlamVjdDpcbiAgICAgICAgICAgIGsgPSBNYXRoLm1pbihrLCBrYywga20gLSAxKVxuICAgICAgICAgICAgaWYgKGsgPiAyICYmIHdbayAtIDFdIDwgd1trXSAqIHRoaXMuc3RlcFNpemVGYWMzKSBrIC09IDFcbiAgICAgICAgICAgICsrblJlamVjdFxuICAgICAgICAgICAgaCA9IHBvc25lZyAqIGhoW2tdXG4gICAgICAgICAgICByZWplY3QgPSB0cnVlXG4gICAgICAgICAgICBzdGF0ZSA9IFNUQVRFLkJhc2ljSW50ZWdyYXRpb25TdGVwXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBPdXRjb21lLkNvbnZlcmdlZFxuICAgIH1cblxuICAgIGNvbnN0IG91dGNvbWUgPSBvZHhjb3IoKVxuICAgIHJldHVybiB7XG4gICAgICB5OiB5LnNsaWNlKDEpLFxuICAgICAgb3V0Y29tZTogb3V0Y29tZSxcbiAgICAgIG5TdGVwOiBuU3RlcCxcbiAgICAgIHhFbmQ6IHhFbmQsXG4gICAgICBuQWNjZXB0OiBuQWNjZXB0LFxuICAgICAgblJlamVjdDogblJlamVjdCxcbiAgICAgIG5FdmFsOiBuRXZhbFxuICAgIH1cbiAgfVxufVxuIiwiLyoqXG4gICogQ3JlYXRlZCBieSBjb2xpbiBvbiA2LzE0LzE2LlxuICAqIGh0dHA6Ly9saXR0bGVyZWRjb21wdXRlci5naXRodWIuaW9cbiAgKi9cblxuaW1wb3J0IHtTb2x2ZXIsIERlcml2YXRpdmV9IGZyb20gJ29kZXgvc3JjL29kZXgnXG5cbmludGVyZmFjZSBIYW1pbHRvbk1hcCB7XG4gIGdlbmVyYXRlU2VjdGlvbihpbml0aWFsRGF0YTogbnVtYmVyW10sIG46IG51bWJlciwgY2FsbGJhY2s6ICh4OiBudW1iZXIsIHk6IG51bWJlcikgPT4gdm9pZCk6IHZvaWRcbn1cblxuaW50ZXJmYWNlIERpZmZlcmVudGlhbEVxdWF0aW9uIHtcbiAgZXZvbHZlKGluaXRpYWxEYXRhOiBudW1iZXJbXSwgdDE6IG51bWJlciwgZHQ6IG51bWJlciwgY2FsbGJhY2s6ICh0OiBudW1iZXIsIHk6IG51bWJlcltdKSA9PiB2b2lkKTogdm9pZFxufVxuXG5jb25zdCB0d29QaSA9IE1hdGguUEkgKiAyXG5cbmV4cG9ydCBjbGFzcyBTdGFuZGFyZE1hcCBpbXBsZW1lbnRzIEhhbWlsdG9uTWFwIHtcbiAgSzogbnVtYmVyXG4gIFBWOiAoeDogbnVtYmVyKSA9PiBudW1iZXJcbiAgc3RhdGljIHR3b1BpID0gMiAqIE1hdGguUElcblxuICBjb25zdHJ1Y3RvcihLOiBudW1iZXIpIHtcbiAgICB0aGlzLksgPSBLXG4gICAgdGhpcy5QViA9IFN0YW5kYXJkTWFwLnByaW5jaXBhbF92YWx1ZSh0d29QaSlcbiAgfVxuXG4gIHN0YXRpYyBwcmluY2lwYWxfdmFsdWUoY3V0SGlnaDogbnVtYmVyKTogKHY6IG51bWJlcikgPT4gbnVtYmVyIHtcbiAgICBjb25zdCBjdXRMb3cgPSBjdXRIaWdoIC0gdHdvUGlcbiAgICByZXR1cm4gZnVuY3Rpb24gKHg6IG51bWJlcikge1xuICAgICAgaWYgKGN1dExvdyA8PSB4ICYmIHggPCBjdXRIaWdoKSB7XG4gICAgICAgIHJldHVybiB4XG4gICAgICB9XG4gICAgICBjb25zdCB5ID0geCAtIHR3b1BpICogTWF0aC5mbG9vcih4IC8gdHdvUGkpXG4gICAgICByZXR1cm4geSA8IGN1dEhpZ2ggPyB5IDogeSAtIHR3b1BpXG4gICAgfVxuICB9XG5cbiAgZ2VuZXJhdGVTZWN0aW9uKGluaXRpYWxEYXRhOiBudW1iZXJbXSwgbjogbnVtYmVyLCBjYWxsYmFjazogKHg6IG51bWJlciwgeTogbnVtYmVyKSA9PiB2b2lkKSB7XG4gICAgbGV0IFt0aGV0YSwgSV0gPSBpbml0aWFsRGF0YVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICBjYWxsYmFjayh0aGV0YSwgSSlcbiAgICAgIGxldCBuSSA9IEkgKyAodGhpcy5LICogTWF0aC5zaW4odGhldGEpKVxuICAgICAgdGhldGEgPSB0aGlzLlBWKHRoZXRhICsgbkkpXG4gICAgICBJID0gdGhpcy5QVihuSSlcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIERyaXZlblBlbmR1bHVtTWFwIGltcGxlbWVudHMgSGFtaWx0b25NYXAsIERpZmZlcmVudGlhbEVxdWF0aW9uIHtcblxuICBwYXJhbWZuOiAoKSA9PiB7YTogbnVtYmVyLCBvbWVnYTogbnVtYmVyfVxuICBTOiBTb2x2ZXJcbiAgUFY6ICh4OiBudW1iZXIpID0+IG51bWJlclxuXG4gIEhhbWlsdG9uU3lzZGVyKG06IG51bWJlciwgbDogbnVtYmVyLCBvbWVnYTogbnVtYmVyLCBhOiBudW1iZXIsIGc6IG51bWJlcik6IERlcml2YXRpdmUge1xuICAgIHJldHVybiAoeCwgW3QsIHRoZXRhLCBwX3RoZXRhXSkgPT4ge1xuICAgICAgLy8gbGV0IF8xID0gTWF0aC5zaW4ob21lZ2EgKiB0KVxuICAgICAgbGV0IF8yID0gTWF0aC5wb3cobCwgMilcbiAgICAgIGxldCBfMyA9IG9tZWdhICogdFxuICAgICAgbGV0IF80ID0gTWF0aC5zaW4odGhldGEpXG4gICAgICBsZXQgXzUgPSBNYXRoLmNvcyh0aGV0YSlcbiAgICAgIHJldHVybiBbMSxcbiAgICAgICAgKE1hdGguc2luKF8zKSAqIF80ICogYSAqIGwgKiBtICogb21lZ2EgKyBwX3RoZXRhKSAvIChfMiAqIG0pLFxuICAgICAgICAoLSBNYXRoLnBvdyhNYXRoLnNpbihfMyksIDIpICogXzUgKiBfNCAqIE1hdGgucG93KGEsIDIpICogbCAqIG0gKiBNYXRoLnBvdyhvbWVnYSwgMikgLSBNYXRoLnNpbihfMykgKiBfNSAqIGEgKiBvbWVnYSAqIHBfdGhldGEgLSBfNCAqIGcgKiBfMiAqIG0pIC8gbF1cbiAgICB9XG4gIH1cblxuICBMYWdyYW5nZVN5c2RlcihsOiBudW1iZXIsIG9tZWdhOiBudW1iZXIsIGE6IG51bWJlciwgZzogbnVtYmVyKTogRGVyaXZhdGl2ZSB7XG4gICAgcmV0dXJuICh4LCBbdCwgdGhldGEsIHRoZXRhZG90XSkgPT4ge1xuICAgICAgbGV0IF8xID0gTWF0aC5zaW4odGhldGEpXG4gICAgICByZXR1cm4gWzEsIHRoZXRhZG90LCAoXzEgKiBNYXRoLmNvcyhvbWVnYSAqIHQpICogYSAqIE1hdGgucG93KG9tZWdhLCAyKSAtIF8xICogZykgLyBsXVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0cnVjdG9yKHBhcmFtZm46ICgpID0+IHthOiBudW1iZXIsIG9tZWdhOiBudW1iZXJ9KSB7XG4gICAgdGhpcy5wYXJhbWZuID0gcGFyYW1mblxuICAgIHRoaXMuUyA9IG5ldyBTb2x2ZXIoMylcbiAgICB0aGlzLlMuZGVuc2VPdXRwdXQgPSB0cnVlXG4gICAgdGhpcy5TLmFic29sdXRlVG9sZXJhbmNlID0gMWUtOFxuICAgIHRoaXMuUFYgPSBTdGFuZGFyZE1hcC5wcmluY2lwYWxfdmFsdWUoTWF0aC5QSSlcbiAgfVxuXG4gIGdlbmVyYXRlU2VjdGlvbihpbml0aWFsRGF0YTogbnVtYmVyW10sIG46IG51bWJlciwgY2FsbGJhY2s6ICh4OiBudW1iZXIsIHk6IG51bWJlcikgPT4gdm9pZCkge1xuICAgIGxldCBwYXJhbXMgPSB0aGlzLnBhcmFtZm4oKVxuICAgIGxldCBwZXJpb2QgPSAyICogTWF0aC5QSSAvIHBhcmFtcy5vbWVnYVxuICAgIGxldCB0MSA9IDEwMDAgKiBwZXJpb2RcbiAgICBsZXQgSCA9IHRoaXMuSGFtaWx0b25TeXNkZXIoMSwgMSwgcGFyYW1zLm9tZWdhLCBwYXJhbXMuYSwgOS44KVxuICAgIHRoaXMuUy5zb2x2ZShILCAwLCBbMF0uY29uY2F0KGluaXRpYWxEYXRhKSwgdDEsIHRoaXMuUy5ncmlkKHBlcmlvZCwgKHQsIHlzKSA9PiBjYWxsYmFjayh0aGlzLlBWKHlzWzFdKSwgeXNbMl0pKSlcbiAgfVxuXG4gIGV2b2x2ZShpbml0aWFsRGF0YTogbnVtYmVyW10sIHQxOiBudW1iZXIsIGR0OiBudW1iZXIsIGNhbGxiYWNrOiAoeDogbnVtYmVyLCB5czogbnVtYmVyW10pID0+IHZvaWQpIHtcbiAgICBsZXQgcGFyYW1zID0gdGhpcy5wYXJhbWZuKClcbiAgICBjb25zb2xlLmxvZygncGFyYW1zJywgcGFyYW1zKVxuICAgIGxldCBMID0gdGhpcy5MYWdyYW5nZVN5c2RlcigxLCBwYXJhbXMub21lZ2EsIHBhcmFtcy5hLCA5LjgpXG4gICAgbGV0IHAwID0gcGVyZm9ybWFuY2Uubm93KClcbiAgICB0aGlzLlMuc29sdmUoTCwgMCwgWzBdLmNvbmNhdChpbml0aWFsRGF0YSksIHQxLCB0aGlzLlMuZ3JpZChkdCwgY2FsbGJhY2spKVxuICAgIGNvbnNvbGUubG9nKCdldm9sdXRpb24gdG9vaycsIChwZXJmb3JtYW5jZS5ub3coKSAtIHAwKS50b0ZpeGVkKDIpLCAnbXNlYycpXG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEV4cGxvcmVNYXAge1xuICBjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50XG4gIE06IEhhbWlsdG9uTWFwXG4gIGNvbnRleHQ6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRFxuICBvbkV4cGxvcmU6ICh4OiBudW1iZXIsIHk6IG51bWJlcikgPT4gdm9pZFxuXG4gIGNvbnN0cnVjdG9yKGNhbnZhczogc3RyaW5nLCBNOiBIYW1pbHRvbk1hcCwgeFJhbmdlOiBudW1iZXJbXSwgeVJhbmdlOiBudW1iZXJbXSkge1xuICAgIHRoaXMuY2FudmFzID0gPEhUTUxDYW52YXNFbGVtZW50PiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChjYW52YXMpXG4gICAgdGhpcy5NID0gTVxuICAgIHRoaXMuY29udGV4dCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJylcbiAgICBsZXQgW3csIGhdID0gW3hSYW5nZVsxXSAtIHhSYW5nZVswXSwgeVJhbmdlWzFdIC0geVJhbmdlWzBdXVxuICAgIHRoaXMuY2FudmFzLm9ubW91c2Vkb3duID0gKGU6IE1vdXNlRXZlbnQpID0+IHtcbiAgICAgIGxldCBbY3gsIGN5XSA9IFtlLm9mZnNldFggLyB0aGlzLmNvbnRleHQuY2FudmFzLndpZHRoICogdyArIHhSYW5nZVswXSxcbiAgICAgICAgeVJhbmdlWzFdIC0gZS5vZmZzZXRZIC8gdGhpcy5jb250ZXh0LmNhbnZhcy5oZWlnaHQgKiBoXVxuICAgICAgbGV0IHAwID0gcGVyZm9ybWFuY2Uubm93KClcbiAgICAgIHRoaXMuRXhwbG9yZShjeCwgY3kpXG4gICAgICBjb25zb2xlLmxvZygnZXhwbG9yYXRpb24nLCAocGVyZm9ybWFuY2Uubm93KCkgLSBwMCkudG9GaXhlZCgyKSwgJ21zZWMnKVxuICAgICAgdGhpcy5vbkV4cGxvcmUgJiYgdGhpcy5vbkV4cGxvcmUoY3gsIGN5KVxuICAgIH1cbiAgICB0aGlzLmNvbnRleHQuc2NhbGUodGhpcy5jb250ZXh0LmNhbnZhcy53aWR0aCAvIHcsIC10aGlzLmNvbnRleHQuY2FudmFzLmhlaWdodCAvIGgpXG4gICAgdGhpcy5jb250ZXh0LnRyYW5zbGF0ZSgteFJhbmdlWzBdLCAteVJhbmdlWzFdKVxuICAgIHRoaXMuY29udGV4dC5maWxsU3R5bGUgPSAncmdiYSgyMyw2NCwxNzAsMC41KSdcbiAgfVxuICBpOiBudW1iZXIgPSAwXG5cbiAgLy8gc2luY2UgcHQgaXMgaW52b2tlZCBpbiBjYWxsYmFjayBwb3NpdGlvbiwgd2Ugd2FudCB0byBkZWZpbmUgaXQgYXMgYW4gaW5zdGFuY2UgYXJyb3cgZnVuY3Rpb25cbiAgcHQgPSAoeDogbnVtYmVyLCB5OiBudW1iZXIpID0+IHtcbiAgICAvLyBpZiAodGhpcy5pICUgMTAwID09PSAwKSBjb25zb2xlLmxvZyh0aGlzLmksICdwdHMnKVxuICAgIHRoaXMuY29udGV4dC5iZWdpblBhdGgoKVxuICAgIHRoaXMuY29udGV4dC5hcmMoeCwgeSwgMC4wMSwgMCwgMiAqIE1hdGguUEkpXG4gICAgdGhpcy5jb250ZXh0LmZpbGwoKVxuICAgIHRoaXMuY29udGV4dC5jbG9zZVBhdGgoKVxuICAgICsrdGhpcy5pXG4gIH1cblxuICBFeHBsb3JlKHg6IG51bWJlciwgeTogbnVtYmVyKSB7XG4gICAgdGhpcy5NLmdlbmVyYXRlU2VjdGlvbihbeCwgeV0sIDEwMDAsIHRoaXMucHQpXG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIERyaXZlblBlbmR1bHVtQW5pbWF0aW9uIHtcbiAgYW1wbGl0dWRlID0gMC4xXG4gIGFuaW1Mb2dpY2FsU2l6ZSA9IDEuM1xuICBjdHg6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRFxuICBpbml0aWFsRGF0YTogbnVtYmVyW11cbiAgZGF0YTogbnVtYmVyW11bXVxuICBmcmFtZUluZGV4OiBudW1iZXJcbiAgZnJhbWVTdGFydDogbnVtYmVyXG4gIG9tZWdhOiBudW1iZXJcbiAgYW5pbWF0aW5nOiBib29sZWFuXG5cbiAgY29uc3RydWN0b3Iobzoge1xuICAgIG9tZWdhVmFsdWVJZDogc3RyaW5nXG4gICAgb21lZ2FSYW5nZUlkOiBzdHJpbmdcbiAgICB0VmFsdWVJZDogc3RyaW5nXG4gICAgdFJhbmdlSWQ6IHN0cmluZ1xuICAgIGFuaW1JZDogc3RyaW5nXG4gICAgZXhwbG9yZUlkOiBzdHJpbmdcbiAgICB0aGV0YTBJZDogc3RyaW5nXG4gICAgdGhldGFEb3QwSWQ6IHN0cmluZ1xuICAgIGdvQnV0dG9uSWQ6IHN0cmluZ1xuICB9KSB7XG4gICAgbGV0IG9tZWdhUmFuZ2UgPSA8SFRNTElucHV0RWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChvLm9tZWdhUmFuZ2VJZClcbiAgICBsZXQgdFJhbmdlID0gPEhUTUxJbnB1dEVsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoby50UmFuZ2VJZClcbiAgICBsZXQgZGlmZkVxID0gbmV3IERyaXZlblBlbmR1bHVtTWFwKCgpID0+ICh7XG4gICAgICBhOiB0aGlzLmFtcGxpdHVkZSxcbiAgICAgIG9tZWdhOiArb21lZ2FSYW5nZS52YWx1ZVxuICAgIH0pKVxuICAgIGxldCBhbmltID0gPEhUTUxDYW52YXNFbGVtZW50PmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG8uYW5pbUlkKVxuICAgIHRoaXMuY3R4ID0gYW5pbS5nZXRDb250ZXh0KCcyZCcpXG4gICAgdGhpcy5jdHguc2NhbGUoYW5pbS53aWR0aCAvICgyICogdGhpcy5hbmltTG9naWNhbFNpemUpLCAtYW5pbS5oZWlnaHQgLyAoMiAqIHRoaXMuYW5pbUxvZ2ljYWxTaXplKSlcbiAgICB0aGlzLmN0eC50cmFuc2xhdGUodGhpcy5hbmltTG9naWNhbFNpemUsIC10aGlzLmFuaW1Mb2dpY2FsU2l6ZSlcbiAgICBsZXQgeE1hcCA9IG5ldyBFeHBsb3JlTWFwKCdwJywgZGlmZkVxLCBbLU1hdGguUEksIE1hdGguUEldLCBbLTEwLCAxMF0pXG4gICAgeE1hcC5vbkV4cGxvcmUgPSAodGhldGEwOiBudW1iZXIsIHRoZXRhRG90MDogbnVtYmVyKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZygnb25FeHBsb3JlJywgdGhldGEwLCB0aGV0YURvdDApXG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChvLnRoZXRhMElkKS50ZXh0Q29udGVudCA9IHRoZXRhMC50b0ZpeGVkKDMpXG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChvLnRoZXRhRG90MElkKS50ZXh0Q29udGVudCA9IHRoZXRhRG90MC50b0ZpeGVkKDMpXG4gICAgICB0aGlzLmluaXRpYWxEYXRhID0gW3RoZXRhMCwgdGhldGFEb3QwXVxuICAgIH1cbiAgICBsZXQgZXhwbG9yZSA9IDxIVE1MQ2FudmFzRWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChvLmV4cGxvcmVJZClcbiAgICBvbWVnYVJhbmdlLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIChlOiBFdmVudCkgPT4ge1xuICAgICAgZXhwbG9yZS5nZXRDb250ZXh0KCcyZCcpLmNsZWFyUmVjdCgtTWF0aC5QSSwgLTEwLCAyICogTWF0aC5QSSwgMjApXG4gICAgICBsZXQgdCA9IDxIVE1MSW5wdXRFbGVtZW50PmUudGFyZ2V0XG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChvLm9tZWdhVmFsdWVJZCkudGV4dENvbnRlbnQgPSAoK3QudmFsdWUpLnRvRml4ZWQoMSlcbiAgICB9KVxuICAgIHRSYW5nZS5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoZTogRXZlbnQpID0+IHtcbiAgICAgIGxldCB0ID0gPEhUTUxJbnB1dEVsZW1lbnQ+ZS50YXJnZXRcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG8udFZhbHVlSWQpLnRleHRDb250ZW50ID0gdC52YWx1ZVxuICAgIH0pXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoby5nb0J1dHRvbklkKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgIC8vIChyZSlzb2x2ZSB0aGUgZGlmZmVyZW50aWFsIGVxdWF0aW9uIGFuZCB1cGRhdGUgdGhlIGRhdGEuIEtpY2sgb2ZmIHRoZSBhbmltYXRpb24uXG4gICAgICBsZXQgZHQgPSAxIC8gNjBcbiAgICAgIGxldCB0MSA9ICt0UmFuZ2UudmFsdWVcbiAgICAgIGxldCBuID0gTWF0aC5jZWlsKHQxIC8gZHQpXG4gICAgICB0aGlzLmRhdGEgPSBuZXcgQXJyYXkobilcbiAgICAgIGxldCBpID0gMFxuICAgICAgdGhpcy5vbWVnYSA9ICtvbWVnYVJhbmdlLnZhbHVlXG4gICAgICBsZXQgcDAgPSBwZXJmb3JtYW5jZS5ub3coKVxuICAgICAgZGlmZkVxLmV2b2x2ZSh0aGlzLmluaXRpYWxEYXRhLCB0MSwgZHQsICh4LCB5cykgPT4ge3RoaXMuZGF0YVtpKytdID0geXN9KVxuICAgICAgY29uc29sZS5sb2coJ0RFIGV2b2x1dGlvbiBpbicsIChwZXJmb3JtYW5jZS5ub3coKSAtIHAwKS50b0ZpeGVkKDEpLCAnbXNlYycpXG4gICAgICB0aGlzLmZyYW1lSW5kZXggPSAwXG4gICAgICB0aGlzLmZyYW1lU3RhcnQgPSBwZXJmb3JtYW5jZS5ub3coKVxuICAgICAgaWYgKCF0aGlzLmFuaW1hdGluZykge1xuICAgICAgICB0aGlzLmFuaW1hdGluZyA9IHRydWVcbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMuZnJhbWUpXG4gICAgICB9XG4gICAgfSlcbiAgfVxuICBmcmFtZSA9ICgpID0+IHtcbiAgICBsZXQgYm9iID0gKHQ6IG51bWJlcikgPT4gdGhpcy5hbXBsaXR1ZGUgKiBNYXRoLmNvcyh0aGlzLm9tZWdhICogdClcbiAgICB0aGlzLmN0eC5jbGVhclJlY3QoLXRoaXMuYW5pbUxvZ2ljYWxTaXplLCAtdGhpcy5hbmltTG9naWNhbFNpemUsIDIgKiB0aGlzLmFuaW1Mb2dpY2FsU2l6ZSwgMiAqIHRoaXMuYW5pbUxvZ2ljYWxTaXplKVxuICAgIGxldCBkID0gdGhpcy5kYXRhW3RoaXMuZnJhbWVJbmRleF1cbiAgICBsZXQgeTAgPSBib2IoZFswXSlcbiAgICBsZXQgdGhldGEgPSBkWzFdXG4gICAgY29uc3QgYyA9IHRoaXMuY3R4XG4gICAgYy5saW5lV2lkdGggPSAwLjAyXG4gICAgYy5iZWdpblBhdGgoKVxuICAgIGMuZmlsbFN0eWxlID0gJyMwMDAnXG4gICAgYy5hcmMoMCwgeTAsIDAuMDUsIDAsIE1hdGguUEkgKiAyKVxuICAgIGMuZmlsbFN0eWxlID0gJyNmMDAnXG4gICAgYy5hcmMoTWF0aC5zaW4odGhldGEpLCB5MCAtIE1hdGguY29zKHRoZXRhKSwgMC4xLCAwLCBNYXRoLlBJICogMilcbiAgICBjLmZpbGwoKVxuICAgIGMuZmlsbFN0eWxlID0gJyMwMDAnXG4gICAgYy5iZWdpblBhdGgoKVxuICAgIGMubW92ZVRvKDAsIHkwKVxuICAgIGMubGluZVRvKE1hdGguc2luKHRoZXRhKSwgeTAgLSBNYXRoLmNvcyh0aGV0YSkpXG4gICAgYy5zdHJva2UoKVxuXG4gICAgKyt0aGlzLmZyYW1lSW5kZXhcbiAgICBpZiAodGhpcy5mcmFtZUluZGV4IDwgdGhpcy5kYXRhLmxlbmd0aCkge1xuICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLmZyYW1lKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmFuaW1hdGluZyA9IGZhbHNlXG4gICAgICBsZXQgZXQgPSAocGVyZm9ybWFuY2Uubm93KCkgLSB0aGlzLmZyYW1lU3RhcnQpIC8gMWUzXG4gICAgICBjb25zb2xlLmxvZygnYW5pbWF0aW9uIGRvbmUnLCAodGhpcy5kYXRhLmxlbmd0aCAvIGV0KS50b0ZpeGVkKDIpLCAnZnBzJylcbiAgICB9XG4gIH1cbn1cbiJdfQ==
