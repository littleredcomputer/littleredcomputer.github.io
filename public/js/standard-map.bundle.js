(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.s = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * An implementation of ODEX, by E. Hairer and G. Wanner, ported from the Fortran ODEX.F.
 * The original work carries the BSD 2-clause license, and so does this.
 *
 * Copyright (c) 2016 Colin Smith.
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
    // Make a 1-based 2D array, with r rows and c columns. The initial values are undefined.
    Solver.dim2 = function (r, c) {
        var a = new Array(r + 1);
        for (var i = 1; i <= r; ++i)
            a[i] = Solver.dim(c);
        return a;
    };
    // Generate step size sequence and return as a 1-based array of length n.
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
    // Integrate the differential system represented by f, from x to xEnd, with initial data y.
    // solOut, if provided, is called at each integration step.
    Solver.prototype.solve = function (f, x, y0, xEnd, solOut) {
        var _this = this;
        // Make a copy of y0, 1-based. We leave the user's parameters alone so that they may be reused if desired.
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
        var icom = [0]; // icom will be 1-based, so start with a pad entry.
        var nrdens = 0;
        if (this.denseOutput) {
            if (this.denseComponents) {
                for (var _i = 0, _a = this.denseComponents; _i < _a.length; _i++) {
                    var c = _a[_i];
                    // convert dense components requested into one-based indexing.
                    if (c < 0 || c > this.n)
                        throw new Error('bad dense component: ' + c);
                    icom.push(c + 1);
                    ++nrdens;
                }
            }
            else {
                // if user asked for dense output but did not specify any denseComponents,
                // request all of them.
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
            // If x is an array, return a 1-based copy of it. If x is a number, return a new 1-based array
            // consisting of n copies of the number.
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
        // call to core integrator
        var nrd = Math.max(1, nrdens);
        var ncom = Math.max(1, (2 * km + 5) * nrdens);
        var dens = Solver.dim(ncom);
        var fSafe = Solver.dim2(lfSafe, nrd);
        // Wrap f in a function F which hides the one-based indexing from the customers.
        var F = function (x, y, yp) {
            var ret = f(x, y.slice(1));
            for (var i = 0; i < ret.length; ++i)
                yp[i + 1] = ret[i];
        };
        var odxcor = function () {
            // The following three variables are COMMON/CONTEX/
            var xOldd;
            var hhh;
            var kmit;
            var acceptStep = function (n) {
                // Returns true if we should continue the integration. The only time false
                // is returned is when the user's solution observation function has returned false,
                // indicating that she does not wish to continue the computation.
                xOld = x;
                x += h;
                if (_this.denseOutput) {
                    // kmit = mu of the paper
                    kmit = 2 * kc - _this.interpolationFormulaDegree + 1;
                    for (var i = 1; i <= nrd; ++i)
                        dens[i] = y[icom[i]];
                    xOldd = xOld;
                    hhh = h; // note: xOldd and hhh are part of /CONODX/
                    for (var i = 1; i <= nrd; ++i)
                        dens[nrd + i] = h * dz[icom[i]];
                    var kln = 2 * nrd;
                    for (var i = 1; i <= nrd; ++i)
                        dens[kln + i] = t[1][icom[i]];
                    // compute solution at mid-point
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
                    // compute first derivative at right end
                    for (var i = 1; i <= n; ++i)
                        yh1[i] = t[1][i];
                    F(x, yh1, yh2);
                    krn = 3 * nrd;
                    for (var i = 1; i <= nrd; ++i)
                        dens[krn + i] = yh2[icom[i]] * h;
                    // THE LOOP
                    for (var kmi = 1; kmi <= kmit; ++kmi) {
                        // compute kmi-th derivative at mid-point
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
                        // compute differences
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
                        // compute differences
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
                    // estimation of interpolation error
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
                    // If denseOutput, we also want to supply the dense closure.
                    if (solOut(nAccept + 1, xOld, x, y.slice(1), _this.denseOutput && contex(xOldd, hhh, kmit, dens, icom)) === false)
                        return false;
                }
                // compute optimal order
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
                // after a rejected step
                if (reject) {
                    k = Math.min(kopt, kc);
                    h = posneg * Math.min(Math.abs(h), Math.abs(hh[k]));
                    reject = false;
                    return true; // goto 10
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
                // compute stepsize for next step
                k = kopt;
                h = posneg * Math.abs(h);
                return true;
            };
            var midex = function (j) {
                var dy = Solver.dim(_this.n);
                // Computes the jth line of the extrapolation table and
                // provides an estimation of the optional stepsize
                var hj = h / nj[j];
                // Euler starting step
                for (var i = 1; i <= _this.n; ++i) {
                    yh1[i] = y[i];
                    yh2[i] = y[i] + hj * dz[i];
                }
                // Explicit midpoint rule
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
                        // stability check
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
                // final smoothing step
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
                // polynomial extrapolation
                if (j === 1)
                    return; // was j.eq.1
                var dblenj = nj[j];
                var fac;
                for (var l = j; l > 1; --l) {
                    fac = Math.pow((dblenj / nj[l - 1]), 2) - 1;
                    for (var i = 1; i <= _this.n; ++i) {
                        t[l - 1][i] = t[l][i] + (t[l][i] - t[l - 1][i]) / fac;
                    }
                }
                err = 0;
                // scaling
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
                // compute optimal stepsizes
                var exp0 = 1 / (2 * j - 1);
                var facMin = Math.pow(_this.stepSizeFac1, exp0);
                fac = Math.min(_this.stepSizeFac2 / facMin, Math.max(facMin, Math.pow((err / _this.stepSafetyFactor1), exp0) / _this.stepSafetyFactor2));
                fac = 1 / fac;
                hh[j] = Math.min(Math.abs(h) * fac, hMax);
                w[j] = a[j] / hh[j];
            };
            var interp = function (n, y, imit) {
                // computes the coefficients of the interpolation formula
                var a = new Array(31); // zero-based: 0:30
                // begin with Hermite interpolation
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
                    // compute the derivatives of Hermite at midpoint
                    var ph0 = (y0_1 + y1) * 0.5 + 0.125 * (aspl + bspl);
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
                        // careful: customers describe components 0-based. We record indices 1-based.
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
            // preparation
            var ySafe = Solver.dim2(km, nrd);
            var hh = Solver.dim(km);
            var t = Solver.dim2(km, _this.n);
            // Define the step size sequence
            var nj = Solver.stepSizeSequence(nSeq, km);
            // Define the a[i] for order selection
            var a = Solver.dim(km);
            a[1] = 1 + nj[1];
            for (var i = 2; i <= km; ++i) {
                a[i] = a[i - 1] + nj[i];
            }
            // Initial Scaling
            var scal = Solver.dim(_this.n);
            for (var i = 1; i <= _this.n; ++i) {
                scal[i] = aTol[i] + rTol[i] + Math.abs(y[i]);
            }
            // Initial preparations
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
                // check return value and abandon integration if called for
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
                        // Is xEnd reached in the next step?
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
                        // The first and last step
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
                        // basic integration step
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
                        // convergence monitor
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
                        // hope for convergence in line k + 1
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
// return a 1-based array of length n. Initial values undefined.
Solver.dim = function (n) { return Array(n + 1); };
Solver.log10 = function (x) { return Math.log(x) / Math.LN10; };
exports.Solver = Solver;

},{}],2:[function(require,module,exports){
/**
 * Created by colin on 6/14/16.
 */
"use strict";
var odex_1 = require("odex/src/odex");
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
        // this.S.absoluteTolerance = 1e-9
        // this.S.relativeTolerance = 1e-9
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
    // let _1 = Math.sin(omega * t): this comes about from a bug in our CSE
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
            // if (this.i % 100 === 0) console.log(this.i, 'pts')
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

},{"odex/src/odex":1}]},{},[2])(2)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9ub2RlX21vZHVsZXMvb2RleC9zcmMvb2RleC50cyIsImpzL3N0YW5kYXJkLW1hcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBOzs7Ozs7Ozs7Ozs7Ozs7OztHQWlCRzs7QUFpQkgsSUFBWSxPQUlYO0FBSkQsV0FBWSxPQUFPO0lBQ2pCLCtDQUFTLENBQUE7SUFDVCw2REFBZ0IsQ0FBQTtJQUNoQixtREFBVyxDQUFBO0FBQ2IsQ0FBQyxFQUpXLE9BQU8sR0FBUCxlQUFPLEtBQVAsZUFBTyxRQUlsQjtBQUVEO0lBeUJFLGdCQUFZLENBQVM7UUFDbkIsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDVixJQUFJLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQTtRQUNyQixJQUFJLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQTtRQUNyQixJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQTtRQUMzQixJQUFJLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQTtRQUNwQixJQUFJLENBQUMsdUJBQXVCLEdBQUcsQ0FBQyxDQUFBO1FBQ2hDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxDQUFDLENBQUE7UUFDekIsSUFBSSxDQUFDLG1CQUFtQixHQUFHLENBQUMsQ0FBQTtRQUM1QixJQUFJLENBQUMsd0JBQXdCLEdBQUcsQ0FBQyxDQUFBO1FBQ2pDLElBQUksQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFBO1FBQ3hCLElBQUksQ0FBQyx5QkFBeUIsR0FBRyxJQUFJLENBQUE7UUFDckMsSUFBSSxDQUFDLGVBQWUsR0FBRyxTQUFTLENBQUE7UUFDaEMsSUFBSSxDQUFDLDBCQUEwQixHQUFHLENBQUMsQ0FBQTtRQUNuQyxJQUFJLENBQUMsdUJBQXVCLEdBQUcsR0FBRyxDQUFBO1FBQ2xDLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFBO1FBQ3hCLElBQUksQ0FBQyxZQUFZLEdBQUcsR0FBRyxDQUFBO1FBQ3ZCLElBQUksQ0FBQyxZQUFZLEdBQUcsR0FBRyxDQUFBO1FBQ3ZCLElBQUksQ0FBQyxZQUFZLEdBQUcsR0FBRyxDQUFBO1FBQ3ZCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUE7UUFDN0IsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQTtRQUM3QixJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFBO1FBQzdCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUE7UUFDN0IsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUE7SUFDcEIsQ0FBQztJQUVELHFCQUFJLEdBQUosVUFBSyxFQUFVLEVBQUUsR0FBMEM7UUFDekQsSUFBSSxVQUFVLEdBQWEsSUFBSSxDQUFDLGVBQWUsQ0FBQTtRQUMvQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7WUFDaEIsVUFBVSxHQUFHLEVBQUUsQ0FBQTtZQUNmLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUNyRCxDQUFDO1FBQ0QsSUFBSSxDQUFTLENBQUE7UUFDYixNQUFNLENBQUMsVUFBQyxDQUFTLEVBQUUsSUFBWSxFQUFFLENBQVMsRUFBRSxDQUFXLEVBQUUsV0FBNkM7WUFDcEcsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ1osR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQTtnQkFDVCxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtnQkFDVixNQUFNLENBQUE7WUFDUixDQUFDO1lBQ0QsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ2QsSUFBSSxFQUFFLEdBQWEsRUFBRSxDQUFBO2dCQUNyQixHQUFHLENBQUMsQ0FBVSxVQUFVLEVBQVYseUJBQVUsRUFBVix3QkFBVSxFQUFWLElBQVU7b0JBQW5CLElBQUksQ0FBQyxtQkFBQTtvQkFDUixFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQTtpQkFDM0I7Z0JBQ0QsR0FBRyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQTtnQkFDVixDQUFDLElBQUksRUFBRSxDQUFBO1lBQ1QsQ0FBQztRQUNILENBQUMsQ0FBQTtJQUNILENBQUM7SUFNRCx3RkFBd0Y7SUFDekUsV0FBSSxHQUFuQixVQUFvQixDQUFTLEVBQUUsQ0FBUztRQUN0QyxJQUFJLENBQUMsR0FBRyxJQUFJLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUE7UUFDeEIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDakQsTUFBTSxDQUFDLENBQUMsQ0FBQTtJQUNWLENBQUM7SUFFRCx5RUFBeUU7SUFDbEUsdUJBQWdCLEdBQXZCLFVBQXdCLElBQVksRUFBRSxDQUFTO1FBQzdDLElBQU0sQ0FBQyxHQUFHLElBQUksS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQTtRQUMxQixDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBQ1IsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNiLEtBQUssQ0FBQztnQkFDSixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUE7Z0JBQ3pDLEtBQUssQ0FBQTtZQUNQLEtBQUssQ0FBQztnQkFDSixDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO2dCQUNSLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUE7Z0JBQzdDLEtBQUssQ0FBQTtZQUNQLEtBQUssQ0FBQztnQkFDSixDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO2dCQUNSLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7Z0JBQ1IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtnQkFDUixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBO2dCQUNoRCxLQUFLLENBQUE7WUFDUCxLQUFLLENBQUM7Z0JBQ0osR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQTtnQkFDN0MsS0FBSyxDQUFBO1lBQ1AsS0FBSyxDQUFDO2dCQUNKLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQTtnQkFDekMsS0FBSyxDQUFBO1lBQ1A7Z0JBQ0UsTUFBTSxJQUFJLEtBQUssQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFBO1FBQ3hELENBQUM7UUFDRCxNQUFNLENBQUMsQ0FBQyxDQUFBO0lBQ1YsQ0FBQztJQUVELDJGQUEyRjtJQUMzRiwyREFBMkQ7SUFDM0Qsc0JBQUssR0FBTCxVQUFNLENBQWEsRUFDYixDQUFTLEVBQ1QsRUFBWSxFQUNaLElBQVksRUFDWixNQUF1QjtRQUo3QixpQkE0akJDO1FBdGpCQywwR0FBMEc7UUFDMUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUE7UUFDdEIsSUFBSSxFQUFFLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDM0IsSUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDNUIsSUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDNUIsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsSUFBSSxDQUFDLENBQUM7WUFBQyxNQUFNLElBQUksS0FBSyxDQUFDLDJCQUEyQixDQUFDLENBQUE7UUFDcEUsSUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixDQUFBO1FBQ3ZDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFBQyxNQUFNLElBQUksS0FBSyxDQUFDLHFDQUFxQyxDQUFDLENBQUE7UUFDbkUsSUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUE7UUFDaEUsRUFBRSxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDO1lBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxnREFBZ0QsQ0FBQyxDQUFBO1FBQ3BHLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLElBQUksQ0FBQyxNQUFNLENBQUM7WUFBQyxNQUFNLElBQUksS0FBSyxDQUFDLG1EQUFtRCxDQUFDLENBQUE7UUFDckcsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLDBCQUEwQixJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsMEJBQTBCLElBQUksQ0FBQyxDQUFDO1lBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFBO1FBQ25JLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUEsQ0FBRSxtREFBbUQ7UUFDbkUsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFBO1FBQ2QsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7WUFDckIsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pCLEdBQUcsQ0FBQyxDQUFVLFVBQW9CLEVBQXBCLEtBQUEsSUFBSSxDQUFDLGVBQWUsRUFBcEIsY0FBb0IsRUFBcEIsSUFBb0I7b0JBQTdCLElBQUksQ0FBQyxTQUFBO29CQUNSLDhEQUE4RDtvQkFDOUQsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQzt3QkFBQyxNQUFNLElBQUksS0FBSyxDQUFDLHVCQUF1QixHQUFHLENBQUMsQ0FBQyxDQUFBO29CQUNyRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQTtvQkFDaEIsRUFBRSxNQUFNLENBQUE7aUJBQ1Q7WUFDSCxDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ04sMEVBQTBFO2dCQUMxRSx1QkFBdUI7Z0JBQ3ZCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDO29CQUNqQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFBO2dCQUNkLENBQUM7Z0JBQ0QsTUFBTSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUE7WUFDakIsQ0FBQztRQUNILENBQUM7UUFDRCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxJQUFJLEtBQUssSUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztZQUFDLE1BQU0sSUFBSSxLQUFLLENBQUMsNEJBQTRCLENBQUMsQ0FBQTtRQUMxRixJQUFNLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFBO1FBQ25ELElBQU0sTUFBTSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQTtRQUUvQix1QkFBdUIsQ0FBa0IsRUFBRSxDQUFTO1lBQ2xELDhGQUE4RjtZQUM5Rix3Q0FBd0M7WUFDeEMsSUFBTSxRQUFRLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQTtZQUNwQixFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDckIsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUE7WUFDM0IsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNOLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFBRSxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFBO2dCQUM1QyxNQUFNLENBQUMsUUFBUSxDQUFBO1lBQ2pCLENBQUM7UUFDSCxDQUFDO1FBRUQsSUFBTSxJQUFJLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDMUQsSUFBTSxJQUFJLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDdEQsSUFBQSxpQkFBK0MsRUFBOUMsYUFBSyxFQUFFLGFBQUssRUFBRSxlQUFPLEVBQUUsZUFBTyxDQUFnQjtRQUVuRCwwQkFBMEI7UUFDMUIsSUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUE7UUFDL0IsSUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFBO1FBQy9DLElBQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDN0IsSUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUE7UUFFdEMsZ0ZBQWdGO1FBQ2hGLElBQU0sQ0FBQyxHQUFHLFVBQUMsQ0FBUyxFQUFFLENBQVcsRUFBRSxFQUFZO1lBQzdDLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBQzFCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7Z0JBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDekQsQ0FBQyxDQUFBO1FBRUQsSUFBSSxNQUFNLEdBQUc7WUFDWCxtREFBbUQ7WUFDbkQsSUFBSSxLQUFhLENBQUE7WUFDakIsSUFBSSxHQUFXLENBQUE7WUFDZixJQUFJLElBQVksQ0FBQTtZQUVoQixJQUFJLFVBQVUsR0FBRyxVQUFDLENBQVM7Z0JBQ3pCLDBFQUEwRTtnQkFDMUUsbUZBQW1GO2dCQUNuRixpRUFBaUU7Z0JBQ2pFLElBQUksR0FBRyxDQUFDLENBQUE7Z0JBQ1IsQ0FBQyxJQUFJLENBQUMsQ0FBQTtnQkFDTixFQUFFLENBQUMsQ0FBQyxLQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztvQkFDckIseUJBQXlCO29CQUN6QixJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxLQUFJLENBQUMsMEJBQTBCLEdBQUcsQ0FBQyxDQUFBO29CQUNuRCxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEdBQUcsRUFBRSxFQUFFLENBQUM7d0JBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtvQkFDbkQsS0FBSyxHQUFHLElBQUksQ0FBQTtvQkFDWixHQUFHLEdBQUcsQ0FBQyxDQUFBLENBQUUsMkNBQTJDO29CQUNwRCxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEdBQUcsRUFBRSxFQUFFLENBQUM7d0JBQUUsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO29CQUM5RCxJQUFJLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFBO29CQUNqQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEdBQUcsRUFBRSxFQUFFLENBQUM7d0JBQUUsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7b0JBQzVELGdDQUFnQztvQkFDaEMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQzt3QkFDN0IsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFBO3dCQUNsQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDOzRCQUM1QixJQUFJLE1BQU0sR0FBRyxTQUFBLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBSSxDQUFDLENBQUEsR0FBRyxDQUFDLENBQUE7NEJBQzFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0NBQzlCLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUE7NEJBQzFFLENBQUM7d0JBQ0gsQ0FBQztvQkFDSCxDQUFDO29CQUNELElBQUksR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUE7b0JBQ2pCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxFQUFFLEVBQUUsQ0FBQzt3QkFBRSxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtvQkFDMUQsd0NBQXdDO29CQUN4QyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUM7d0JBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtvQkFDN0MsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUE7b0JBQ2QsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUE7b0JBQ2IsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxHQUFHLEVBQUUsRUFBRSxDQUFDO3dCQUFFLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtvQkFDL0QsV0FBVztvQkFDWCxHQUFHLENBQUMsQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDLEVBQUUsR0FBRyxJQUFJLElBQUksRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDO3dCQUNyQyx5Q0FBeUM7d0JBQ3pDLElBQUksSUFBSSxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUE7d0JBQzVCLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7NEJBQ25DLElBQUksS0FBSyxHQUFHLFNBQUEsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUEsQ0FBQTs0QkFDckMsR0FBRyxHQUFHLE1BQU0sQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxHQUFHLENBQUE7NEJBQ25DLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0NBQzlCLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFBOzRCQUN0QyxDQUFDO3dCQUNILENBQUM7d0JBQ0QsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7NEJBQ3BDLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQTs0QkFDbEIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0NBQ25DLElBQUksTUFBTSxHQUFHLFNBQUEsQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFJLENBQUMsQ0FBQSxHQUFHLENBQUMsQ0FBQTtnQ0FDMUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxHQUFHLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQztvQ0FDOUIsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQTtnQ0FDMUUsQ0FBQzs0QkFDSCxDQUFDO3dCQUNILENBQUM7d0JBQ0QsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQTt3QkFDckIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxHQUFHLEVBQUUsRUFBRSxDQUFDOzRCQUFFLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTt3QkFDakUsRUFBRSxDQUFDLENBQUMsR0FBRyxLQUFLLElBQUksQ0FBQzs0QkFBQyxRQUFRLENBQUE7d0JBQzFCLHNCQUFz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LEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksS0FBSSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDO29CQUNqQyxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO29CQUNyRCxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUE7b0JBQ2pDLEdBQUcsSUFBSSxTQUFBLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUksQ0FBQyxDQUFBLENBQUE7Z0JBQzdDLENBQUM7Z0JBQ0QsR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLEtBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQTtnQkFDN0IsRUFBRSxDQUFDLENBQUMsR0FBRyxHQUFHLEtBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUN2RCxJQUFJLEdBQUcsSUFBSSxDQUFBO29CQUNYLENBQUMsSUFBSSxLQUFJLENBQUMsdUJBQXVCLENBQUE7b0JBQ2pDLE1BQU0sR0FBRyxJQUFJLENBQUE7b0JBQ2IsTUFBTSxDQUFBO2dCQUNSLENBQUM7Z0JBQ0QsTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FB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QUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQTt3QkFDaEMsRUFBRSxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7NEJBQ2QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7NEJBQzNDLEVBQUUsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dDQUNkLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLElBQUksSUFBSSxFQUFFLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQztvQ0FDckMsSUFBSSxJQUFJLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtvQ0FDNUIsSUFBSSxJQUFJLEdBQUcsSUFBSSxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtvQ0FDekMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQTtnQ0FDMUUsQ0FBQzs0QkFDSCxDQUFDO3dCQUNILENBQUM7b0JBQ0gsQ0FBQztvQkFDRCxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUE7b0JBQ2hDLEVBQUUsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUNkLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUE7d0JBQ3ZDLEVBQUUsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDOzRCQUNkLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLElBQUksSUFBSSxFQUFFLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQ0FDckMsSUFBSSxJQUFJLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtnQ0FDNUIsSUFBSSxJQUFJLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFBO2dDQUM5QyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFBOzRCQUMxRSxDQUFDO3dCQUNILENBQUM7b0JBQ0gsQ0FBQztvQkFDRCxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRSxJQUFJLElBQUksRUFBRSxFQUFFLEVB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QUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFBO0lBQ3RDLENBQUM7SUFzQkgsaUJBQUM7QUFBRCxDQXZEQSxBQXVEQyxJQUFBO0FBdkRZLGdDQUFVIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogQW4gaW1wbGVtZW50YXRpb24gb2YgT0RFWCwgYnkgRS4gSGFpcmVyIGFuZCBHLiBXYW5uZXIsIHBvcnRlZCBmcm9tIHRoZSBGb3J0cmFuIE9ERVguRi5cbiAqIFRoZSBvcmlnaW5hbCB3b3JrIGNhcnJpZXMgdGhlIEJTRCAyLWNsYXVzZSBsaWNlbnNlLCBhbmQgc28gZG9lcyB0aGlzLlxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNiBDb2xpbiBTbWl0aC5cbiAqIDEuIFJlZGlzdHJpYnV0aW9ucyBvZiBzb3VyY2UgY29kZSBtdXN0IHJldGFpbiB0aGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSwgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmdcbiAqIGRpc2NsYWltZXIuXG4gKiAyLiBSZWRpc3RyaWJ1dGlvbnMgaW4gYmluYXJ5IGZvcm0gbXVzdCByZXByb2R1Y2UgdGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UsIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGVcbiAqIGZvbGxvd2luZyBkaXNjbGFpbWVyIGluIHRoZSBkb2N1bWVudGF0aW9uIGFuZC9vciBvdGhlciBtYXRlcmlhbHMgcHJvdmlkZWQgd2l0aCB0aGUgZGlzdHJpYnV0aW9uLlxuICpcbiAqIFRISVMgU09GVFdBUkUgSVMgUFJPVklERUQgQlkgVEhFIENPUFlSSUdIVCBIT0xERVJTIEFORCBDT05UUklCVVRPUlMgXCJBUyBJU1wiIEFORCBBTlkgRVhQUkVTUyBPUiBJTVBMSUVEIFdBUlJBTlRJRVMsXG4gKiBJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgVEhFIElNUExJRUQgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFkgQU5EIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFXG4gKiBBUkUgRElTQ0xBSU1FRC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIENPUFlSSUdIVCBIT0xERVIgT1IgQ09OVFJJQlVUT1JTIEJFIExJQUJMRSBGT1IgQU5ZIERJUkVDVCwgSU5ESVJFQ1QsXG4gKiBJTkNJREVOVEFMLCBTUEVDSUFMLCBFWEVNUExBUlksIE9SIENPTlNFUVVFTlRJQUwgREFNQUdFUyAoSU5DTFVESU5HLCBCVVQgTk9UIExJTUlURUQgVE8sIFBST0NVUkVNRU5UIE9GIFNVQlNUSVRVVEVcbiAqIEdPT0RTIE9SIFNFUlZJQ0VTOyBMT1NTIE9GIFVTRSwgREFUQSwgT1IgUFJPRklUUzsgT1IgQlVTSU5FU1MgSU5URVJSVVBUSU9OKSBIT1dFVkVSIENBVVNFRCBBTkQgT04gQU5ZIFRIRU9SWSBPRlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIENPTlRSQUNULCBTVFJJQ1QgTElBQklMSVRZLCBPUiBUT1JUIChJTkNMVURJTkcgTkVHTElHRU5DRSBPUiBPVEhFUldJU0UpIEFSSVNJTkcgSU4gQU5ZIFdBWVxuICogT1VUIE9GIFRIRSBVU0UgT0YgVEhJUyBTT0ZUV0FSRSwgRVZFTiBJRiBBRFZJU0VEIE9GIFRIRSBQT1NTSUJJTElUWSBPRiBTVUNIIERBTUFHRS5cbiAqL1xuXG5leHBvcnQgaW50ZXJmYWNlIERlcml2YXRpdmUgeyAgLy8gZnVuY3Rpb24gY29tcHV0aW5nIHRoZSB2YWx1ZSBvZiBZJyA9IEYoeCxZKVxuICAoeDogbnVtYmVyLCAgICAgICAgICAgLy8gaW5wdXQgeCB2YWx1ZVxuICAgeTogbnVtYmVyW10pICAgICAgICAgLy8gaW5wdXQgeSB2YWx1ZSlcbiAgICA6IG51bWJlcltdICAgICAgICAgIC8vIG91dHB1dCB5JyB2YWx1ZXMgKEFycmF5IG9mIGxlbmd0aCBuKVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIE91dHB1dEZ1bmN0aW9uIHsgICAgICAgICAgICAgICAgICAgIC8vIHZhbHVlIGNhbGxiYWNrXG4gIChucjogbnVtYmVyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc3RlcCBudW1iZXJcbiAgIHhvbGQ6IG51bWJlciwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBsZWZ0IGVkZ2Ugb2Ygc29sdXRpb24gaW50ZXJ2YWxcbiAgIHg6IG51bWJlciwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyByaWdodCBlZGdlIG9mIHNvbHV0aW9uIGludGVydmFsICh5ID0gRih4KSlcbiAgIHk6IG51bWJlcltdLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBGKHgpXG4gICBkZW5zZT86IChjOiBudW1iZXIsIHg6IG51bWJlcikgPT4gbnVtYmVyKSAgLy8gZGVuc2UgaW50ZXJwb2xhdG9yLiBWYWxpZCBpbiB0aGUgcmFuZ2UgW3gsIHhvbGQpLlxuICAgIDogYm9vbGVhbnx2b2lkICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJldHVybiBmYWxzZSB0byBoYWx0IGludGVncmF0aW9uXG59XG5cbmV4cG9ydCBlbnVtIE91dGNvbWUge1xuICBDb252ZXJnZWQsXG4gIE1heFN0ZXBzRXhjZWVkZWQsXG4gIEVhcmx5UmV0dXJuXG59XG5cbmV4cG9ydCBjbGFzcyBTb2x2ZXIge1xuICBuOiBudW1iZXIgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBkaW1lbnNpb24gb2YgdGhlIHN5c3RlbVxuICB1Um91bmQ6IG51bWJlciAgICAgICAgICAgICAgICAgICAgICAvLyBXT1JLKDEpLCBtYWNoaW5lIGVwc2lsb24uIChXT1JLLCBJV09SSyBhcmUgcmVmZXJlbmNlcyB0byBvZGV4LmYpXG4gIG1heFN0ZXBzOiBudW1iZXIgICAgICAgICAgICAgICAgICAgIC8vIElXT1JLKDEpLCBwb3NpdGl2ZSBpbnRlZ2VyXG4gIGluaXRpYWxTdGVwU2l6ZTogbnVtYmVyICAgICAgICAgICAgIC8vIEhcbiAgbWF4U3RlcFNpemU6IG51bWJlciAgICAgICAgICAgICAgICAgLy8gV09SSygyKSwgbWF4aW1hbCBzdGVwIHNpemUsIGRlZmF1bHQgeEVuZCAtIHhcbiAgbWF4RXh0cmFwb2xhdGlvbkNvbHVtbnM6IG51bWJlciAgICAgLy8gSVdPUksoMiksIEtNLCBwb3NpdGl2ZSBpbnRlZ2VyXG4gIHN0ZXBTaXplU2VxdWVuY2U6IG51bWJlciAgICAgICAgICAgIC8vIElXT1JLKDMpLCBpbiBbMS4uNV1cbiAgc3RhYmlsaXR5Q2hlY2tDb3VudDogbnVtYmVyICAgICAgICAgLy8gSVdPUksoNCksIGluXG4gIHN0YWJpbGl0eUNoZWNrVGFibGVMaW5lczogbnVtYmVyICAgIC8vIElXT1JLKDUpLCBwb3NpdGl2ZSBpbnRlZ2VyXG4gIGRlbnNlT3V0cHV0OiBib29sZWFuICAgICAgICAgICAgICAgIC8vIElPVVQgPj0gMiwgdHJ1ZSBtZWFucyBkZW5zZSBvdXRwdXQgaW50ZXJwb2xhdG9yIHByb3ZpZGVkIHRvIHNvbE91dFxuICBkZW5zZU91dHB1dEVycm9yRXN0aW1hdG9yOiBib29sZWFuICAvLyBJV09SSyg2KSwgcmV2ZXJzZWQgc2Vuc2UgZnJvbSB0aGUgRk9SVFJBTiBjb2RlXG4gIGRlbnNlQ29tcG9uZW50czogbnVtYmVyW10gICAgICAgICAgIC8vIElXT1JLKDgpICYgSVdPUksoMjEsLi4uKSwgY29tcG9uZW50cyBmb3Igd2hpY2ggZGVuc2Ugb3V0cHV0IGlzIHJlcXVpcmVkXG4gIGludGVycG9sYXRpb25Gb3JtdWxhRGVncmVlOiBudW1iZXIgIC8vIElXT1JLKDcpLCDCtSA9IDIgKiBrIC0gaW50ZXJwb2xhdGlvbkZvcm11bGFEZWdyZWUgKyAxIFsxLi42XSwgZGVmYXVsdCA0XG4gIHN0ZXBTaXplUmVkdWN0aW9uRmFjdG9yOiBudW1iZXIgICAgIC8vIFdPUksoMyksIGRlZmF1bHQgMC41XG4gIHN0ZXBTaXplRmFjMTogbnVtYmVyICAgICAgICAgICAgICAgIC8vIFdPUksoNClcbiAgc3RlcFNpemVGYWMyOiBudW1iZXIgICAgICAgICAgICAgICAgLy8gV09SSyg1KVxuICBzdGVwU2l6ZUZhYzM6IG51bWJlciAgICAgICAgICAgICAgICAvLyBXT1JLKDYpXG4gIHN0ZXBTaXplRmFjNDogbnVtYmVyICAgICAgICAgICAgICAgIC8vIFdPUksoNylcbiAgc3RlcFNhZmV0eUZhY3RvcjE6IG51bWJlciAgICAgICAgICAgLy8gV09SSyg4KVxuICBzdGVwU2FmZXR5RmFjdG9yMjogbnVtYmVyICAgICAgICAgICAvLyBXT1JLKDkpXG4gIHJlbGF0aXZlVG9sZXJhbmNlOiBudW1iZXJ8bnVtYmVyW10gIC8vIFJUT0wuIENhbiBiZSBhIHNjYWxhciBvciB2ZWN0b3Igb2YgbGVuZ3RoIE4uXG4gIGFic29sdXRlVG9sZXJhbmNlOiBudW1iZXJ8bnVtYmVyW10gIC8vIEFUT0wuIENhbiBiZSBhIHNjYWxhciBvciB2ZWN0b3Igb2YgbGVuZ3RoIE4uXG4gIGRlYnVnOiBib29sZWFuXG5cbiAgY29uc3RydWN0b3IobjogbnVtYmVyKSB7XG4gICAgdGhpcy5uID0gblxuICAgIHRoaXMudVJvdW5kID0gMi4zZS0xNlxuICAgIHRoaXMubWF4U3RlcHMgPSAxMDAwMFxuICAgIHRoaXMuaW5pdGlhbFN0ZXBTaXplID0gMWUtNFxuICAgIHRoaXMubWF4U3RlcFNpemUgPSAwXG4gICAgdGhpcy5tYXhFeHRyYXBvbGF0aW9uQ29sdW1ucyA9IDlcbiAgICB0aGlzLnN0ZXBTaXplU2VxdWVuY2UgPSAwXG4gICAgdGhpcy5zdGFiaWxpdHlDaGVja0NvdW50ID0gMVxuICAgIHRoaXMuc3RhYmlsaXR5Q2hlY2tUYWJsZUxpbmVzID0gMlxuICAgIHRoaXMuZGVuc2VPdXRwdXQgPSBmYWxzZVxuICAgIHRoaXMuZGVuc2VPdXRwdXRFcnJvckVzdGltYXRvciA9IHRydWVcbiAgICB0aGlzLmRlbnNlQ29tcG9uZW50cyA9IHVuZGVmaW5lZFxuICAgIHRoaXMuaW50ZXJwb2xhdGlvbkZvcm11bGFEZWdyZWUgPSA0XG4gICAgdGhpcy5zdGVwU2l6ZVJlZHVjdGlvbkZhY3RvciA9IDAuNVxuICAgIHRoaXMuc3RlcFNpemVGYWMxID0gMC4wMlxuICAgIHRoaXMuc3RlcFNpemVGYWMyID0gNC4wXG4gICAgdGhpcy5zdGVwU2l6ZUZhYzMgPSAwLjhcbiAgICB0aGlzLnN0ZXBTaXplRmFjNCA9IDAuOVxuICAgIHRoaXMuc3RlcFNhZmV0eUZhY3RvcjEgPSAwLjY1XG4gICAgdGhpcy5zdGVwU2FmZXR5RmFjdG9yMiA9IDAuOTRcbiAgICB0aGlzLnJlbGF0aXZlVG9sZXJhbmNlID0gMWUtNVxuICAgIHRoaXMuYWJzb2x1dGVUb2xlcmFuY2UgPSAxZS01XG4gICAgdGhpcy5kZWJ1ZyA9IGZhbHNlXG4gIH1cblxuICBncmlkKGR0OiBudW1iZXIsIG91dDogKHhPdXQ6IG51bWJlciwgeU91dDogbnVtYmVyW10pID0+IGFueSk6IE91dHB1dEZ1bmN0aW9uIHtcbiAgICBsZXQgY29tcG9uZW50czogbnVtYmVyW10gPSB0aGlzLmRlbnNlQ29tcG9uZW50c1xuICAgIGlmICghY29tcG9uZW50cykge1xuICAgICAgY29tcG9uZW50cyA9IFtdXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubjsgKytpKSBjb21wb25lbnRzLnB1c2goaSlcbiAgICB9XG4gICAgbGV0IHQ6IG51bWJlclxuICAgIHJldHVybiAobjogbnVtYmVyLCB4T2xkOiBudW1iZXIsIHg6IG51bWJlciwgeTogbnVtYmVyW10sIGludGVycG9sYXRlOiAoaTogbnVtYmVyLCB4OiBudW1iZXIpID0+IG51bWJlcikgPT4ge1xuICAgICAgaWYgKG4gPT09IDEpIHtcbiAgICAgICAgb3V0KHgsIHkpXG4gICAgICAgIHQgPSB4ICsgZHRcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICB3aGlsZSAodCA8PSB4KSB7XG4gICAgICAgIGxldCB5ZjogbnVtYmVyW10gPSBbXVxuICAgICAgICBmb3IgKGxldCBpIG9mIGNvbXBvbmVudHMpIHtcbiAgICAgICAgICB5Zi5wdXNoKGludGVycG9sYXRlKGksIHQpKVxuICAgICAgICB9XG4gICAgICAgIG91dCh0LCB5ZilcbiAgICAgICAgdCArPSBkdFxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIHJldHVybiBhIDEtYmFzZWQgYXJyYXkgb2YgbGVuZ3RoIG4uIEluaXRpYWwgdmFsdWVzIHVuZGVmaW5lZC5cbiAgcHJpdmF0ZSBzdGF0aWMgZGltID0gKG46IG51bWJlcikgPT4gQXJyYXkobiArIDEpXG4gIHByaXZhdGUgc3RhdGljIGxvZzEwID0gKHg6IG51bWJlcikgPT4gTWF0aC5sb2coeCkgLyBNYXRoLkxOMTBcblxuICAvLyBNYWtlIGEgMS1iYXNlZCAyRCBhcnJheSwgd2l0aCByIHJvd3MgYW5kIGMgY29sdW1ucy4gVGhlIGluaXRpYWwgdmFsdWVzIGFyZSB1bmRlZmluZWQuXG4gIHByaXZhdGUgc3RhdGljIGRpbTIocjogbnVtYmVyLCBjOiBudW1iZXIpOiBudW1iZXJbXVtdIHtcbiAgICBsZXQgYSA9IG5ldyBBcnJheShyICsgMSlcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8PSByOyArK2kpIGFbaV0gPSBTb2x2ZXIuZGltKGMpXG4gICAgcmV0dXJuIGFcbiAgfVxuXG4gIC8vIEdlbmVyYXRlIHN0ZXAgc2l6ZSBzZXF1ZW5jZSBhbmQgcmV0dXJuIGFzIGEgMS1iYXNlZCBhcnJheSBvZiBsZW5ndGggbi5cbiAgc3RhdGljIHN0ZXBTaXplU2VxdWVuY2UoblNlcTogbnVtYmVyLCBuOiBudW1iZXIpOiBudW1iZXJbXSB7XG4gICAgY29uc3QgYSA9IG5ldyBBcnJheShuICsgMSlcbiAgICBhWzBdID0gMFxuICAgIHN3aXRjaCAoblNlcSkge1xuICAgICAgY2FzZSAxOlxuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBuOyArK2kpIGFbaV0gPSAyICogaVxuICAgICAgICBicmVha1xuICAgICAgY2FzZSAyOlxuICAgICAgICBhWzFdID0gMlxuICAgICAgICBmb3IgKGxldCBpID0gMjsgaSA8PSBuOyArK2kpIGFbaV0gPSA0ICogaSAtIDRcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgYVsxXSA9IDJcbiAgICAgICAgYVsyXSA9IDRcbiAgICAgICAgYVszXSA9IDZcbiAgICAgICAgZm9yIChsZXQgaSA9IDQ7IGkgPD0gbjsgKytpKSBhW2ldID0gMiAqIGFbaSAtIDJdXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlIDQ6XG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG47ICsraSkgYVtpXSA9IDQgKiBpIC0gMlxuICAgICAgICBicmVha1xuICAgICAgY2FzZSA1OlxuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBuOyArK2kpIGFbaV0gPSA0ICogaVxuICAgICAgICBicmVha1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbnZhbGlkIHN0ZXBTaXplU2VxdWVuY2Ugc2VsZWN0ZWQnKVxuICAgIH1cbiAgICByZXR1cm4gYVxuICB9XG5cbiAgLy8gSW50ZWdyYXRlIHRoZSBkaWZmZXJlbnRpYWwgc3lzdGVtIHJlcHJlc2VudGVkIGJ5IGYsIGZyb20geCB0byB4RW5kLCB3aXRoIGluaXRpYWwgZGF0YSB5LlxuICAvLyBzb2xPdXQsIGlmIHByb3ZpZGVkLCBpcyBjYWxsZWQgYXQgZWFjaCBpbnRlZ3JhdGlvbiBzdGVwLlxuICBzb2x2ZShmOiBEZXJpdmF0aXZlLFxuICAgICAgICB4OiBudW1iZXIsXG4gICAgICAgIHkwOiBudW1iZXJbXSxcbiAgICAgICAgeEVuZDogbnVtYmVyLFxuICAgICAgICBzb2xPdXQ/OiBPdXRwdXRGdW5jdGlvbikge1xuXG4gICAgLy8gTWFrZSBhIGNvcHkgb2YgeTAsIDEtYmFzZWQuIFdlIGxlYXZlIHRoZSB1c2VyJ3MgcGFyYW1ldGVycyBhbG9uZSBzbyB0aGF0IHRoZXkgbWF5IGJlIHJldXNlZCBpZiBkZXNpcmVkLlxuICAgIGxldCB5ID0gWzBdLmNvbmNhdCh5MClcbiAgICBsZXQgZHogPSBTb2x2ZXIuZGltKHRoaXMubilcbiAgICBsZXQgeWgxID0gU29sdmVyLmRpbSh0aGlzLm4pXG4gICAgbGV0IHloMiA9IFNvbHZlci5kaW0odGhpcy5uKVxuICAgIGlmICh0aGlzLm1heFN0ZXBzIDw9IDApIHRocm93IG5ldyBFcnJvcignbWF4U3RlcHMgbXVzdCBiZSBwb3NpdGl2ZScpXG4gICAgY29uc3Qga20gPSB0aGlzLm1heEV4dHJhcG9sYXRpb25Db2x1bW5zXG4gICAgaWYgKGttIDw9IDIpIHRocm93IG5ldyBFcnJvcignbWF4RXh0cmFwb2xhdGlvbkNvbHVtbnMgbXVzdCBiZSA+IDInKVxuICAgIGNvbnN0IG5TZXEgPSB0aGlzLnN0ZXBTaXplU2VxdWVuY2UgfHwgKHRoaXMuZGVuc2VPdXRwdXQgPyA0IDogMSlcbiAgICBpZiAoblNlcSA8PSAzICYmIHRoaXMuZGVuc2VPdXRwdXQpIHRocm93IG5ldyBFcnJvcignc3RlcFNpemVTZXF1ZW5jZSBpbmNvbXBhdGlibGUgd2l0aCBkZW5zZU91dHB1dCcpXG4gICAgaWYgKHRoaXMuZGVuc2VPdXRwdXQgJiYgIXNvbE91dCkgdGhyb3cgbmV3IEVycm9yKCdkZW5zZU91dHB1dCByZXF1aXJlcyBhIHNvbHV0aW9uIG9ic2VydmVyIGZ1bmN0aW9uJylcbiAgICBpZiAodGhpcy5pbnRlcnBvbGF0aW9uRm9ybXVsYURlZ3JlZSA8PSAwIHx8IHRoaXMuaW50ZXJwb2xhdGlvbkZvcm11bGFEZWdyZWUgPj0gNykgdGhyb3cgbmV3IEVycm9yKCdiYWQgaW50ZXJwb2xhdGlvbkZvcm11bGFEZWdyZWUnKVxuICAgIGxldCBpY29tID0gWzBdICAvLyBpY29tIHdpbGwgYmUgMS1iYXNlZCwgc28gc3RhcnQgd2l0aCBhIHBhZCBlbnRyeS5cbiAgICBsZXQgbnJkZW5zID0gMFxuICAgIGlmICh0aGlzLmRlbnNlT3V0cHV0KSB7XG4gICAgICBpZiAodGhpcy5kZW5zZUNvbXBvbmVudHMpIHtcbiAgICAgICAgZm9yIChsZXQgYyBvZiB0aGlzLmRlbnNlQ29tcG9uZW50cykge1xuICAgICAgICAgIC8vIGNvbnZlcnQgZGVuc2UgY29tcG9uZW50cyByZXF1ZXN0ZWQgaW50byBvbmUtYmFzZWQgaW5kZXhpbmcuXG4gICAgICAgICAgaWYgKGMgPCAwIHx8IGMgPiB0aGlzLm4pIHRocm93IG5ldyBFcnJvcignYmFkIGRlbnNlIGNvbXBvbmVudDogJyArIGMpXG4gICAgICAgICAgaWNvbS5wdXNoKGMgKyAxKVxuICAgICAgICAgICsrbnJkZW5zXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGlmIHVzZXIgYXNrZWQgZm9yIGRlbnNlIG91dHB1dCBidXQgZGlkIG5vdCBzcGVjaWZ5IGFueSBkZW5zZUNvbXBvbmVudHMsXG4gICAgICAgIC8vIHJlcXVlc3QgYWxsIG9mIHRoZW0uXG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IHRoaXMubjsgKytpKSB7XG4gICAgICAgICAgaWNvbS5wdXNoKGkpXG4gICAgICAgIH1cbiAgICAgICAgbnJkZW5zID0gdGhpcy5uXG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0aGlzLnVSb3VuZCA8PSAxZS0zNSB8fCB0aGlzLnVSb3VuZCA+IDEpIHRocm93IG5ldyBFcnJvcignc3VzcGljaW91cyB2YWx1ZSBvZiB1Um91bmQnKVxuICAgIGNvbnN0IGhNYXggPSBNYXRoLmFicyh0aGlzLm1heFN0ZXBTaXplIHx8IHhFbmQgLSB4KVxuICAgIGNvbnN0IGxmU2FmZSA9IDIgKiBrbSAqIGttICsga21cblxuICAgIGZ1bmN0aW9uIGV4cGFuZFRvQXJyYXkoeDogbnVtYmVyfG51bWJlcltdLCBuOiBudW1iZXIpOiBudW1iZXJbXSB7XG4gICAgICAvLyBJZiB4IGlzIGFuIGFycmF5LCByZXR1cm4gYSAxLWJhc2VkIGNvcHkgb2YgaXQuIElmIHggaXMgYSBudW1iZXIsIHJldHVybiBhIG5ldyAxLWJhc2VkIGFycmF5XG4gICAgICAvLyBjb25zaXN0aW5nIG9mIG4gY29waWVzIG9mIHRoZSBudW1iZXIuXG4gICAgICBjb25zdCB0b2xBcnJheSA9IFswXVxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoeCkpIHtcbiAgICAgICAgcmV0dXJuIHRvbEFycmF5LmNvbmNhdCh4KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuOyArK2kpIHRvbEFycmF5LnB1c2goeClcbiAgICAgICAgcmV0dXJuIHRvbEFycmF5XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgYVRvbCA9IGV4cGFuZFRvQXJyYXkodGhpcy5hYnNvbHV0ZVRvbGVyYW5jZSwgdGhpcy5uKVxuICAgIGNvbnN0IHJUb2wgPSBleHBhbmRUb0FycmF5KHRoaXMucmVsYXRpdmVUb2xlcmFuY2UsIHRoaXMubilcbiAgICBsZXQgW25FdmFsLCBuU3RlcCwgbkFjY2VwdCwgblJlamVjdF0gPSBbMCwgMCwgMCwgMF1cblxuICAgIC8vIGNhbGwgdG8gY29yZSBpbnRlZ3JhdG9yXG4gICAgY29uc3QgbnJkID0gTWF0aC5tYXgoMSwgbnJkZW5zKVxuICAgIGNvbnN0IG5jb20gPSBNYXRoLm1heCgxLCAoMiAqIGttICsgNSkgKiBucmRlbnMpXG4gICAgY29uc3QgZGVucyA9IFNvbHZlci5kaW0obmNvbSlcbiAgICBjb25zdCBmU2FmZSA9IFNvbHZlci5kaW0yKGxmU2FmZSwgbnJkKVxuXG4gICAgLy8gV3JhcCBmIGluIGEgZnVuY3Rpb24gRiB3aGljaCBoaWRlcyB0aGUgb25lLWJhc2VkIGluZGV4aW5nIGZyb20gdGhlIGN1c3RvbWVycy5cbiAgICBjb25zdCBGID0gKHg6IG51bWJlciwgeTogbnVtYmVyW10sIHlwOiBudW1iZXJbXSkgPT4ge1xuICAgICAgbGV0IHJldCA9IGYoeCwgeS5zbGljZSgxKSlcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmV0Lmxlbmd0aDsgKytpKSB5cFtpICsgMV0gPSByZXRbaV1cbiAgICB9XG5cbiAgICBsZXQgb2R4Y29yID0gKCk6IE91dGNvbWUgPT4ge1xuICAgICAgLy8gVGhlIGZvbGxvd2luZyB0aHJlZSB2YXJpYWJsZXMgYXJlIENPTU1PTi9DT05URVgvXG4gICAgICBsZXQgeE9sZGQ6IG51bWJlclxuICAgICAgbGV0IGhoaDogbnVtYmVyXG4gICAgICBsZXQga21pdDogbnVtYmVyXG5cbiAgICAgIGxldCBhY2NlcHRTdGVwID0gKG46IG51bWJlcik6IGJvb2xlYW4gPT4geyAgIC8vIGxhYmVsIDYwXG4gICAgICAgIC8vIFJldHVybnMgdHJ1ZSBpZiB3ZSBzaG91bGQgY29udGludWUgdGhlIGludGVncmF0aW9uLiBUaGUgb25seSB0aW1lIGZhbHNlXG4gICAgICAgIC8vIGlzIHJldHVybmVkIGlzIHdoZW4gdGhlIHVzZXIncyBzb2x1dGlvbiBvYnNlcnZhdGlvbiBmdW5jdGlvbiBoYXMgcmV0dXJuZWQgZmFsc2UsXG4gICAgICAgIC8vIGluZGljYXRpbmcgdGhhdCBzaGUgZG9lcyBub3Qgd2lzaCB0byBjb250aW51ZSB0aGUgY29tcHV0YXRpb24uXG4gICAgICAgIHhPbGQgPSB4XG4gICAgICAgIHggKz0gaFxuICAgICAgICBpZiAodGhpcy5kZW5zZU91dHB1dCkge1xuICAgICAgICAgIC8vIGttaXQgPSBtdSBvZiB0aGUgcGFwZXJcbiAgICAgICAgICBrbWl0ID0gMiAqIGtjIC0gdGhpcy5pbnRlcnBvbGF0aW9uRm9ybXVsYURlZ3JlZSArIDFcbiAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBucmQ7ICsraSkgZGVuc1tpXSA9IHlbaWNvbVtpXV1cbiAgICAgICAgICB4T2xkZCA9IHhPbGRcbiAgICAgICAgICBoaGggPSBoICAvLyBub3RlOiB4T2xkZCBhbmQgaGhoIGFyZSBwYXJ0IG9mIC9DT05PRFgvXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbnJkOyArK2kpIGRlbnNbbnJkICsgaV0gPSBoICogZHpbaWNvbVtpXV1cbiAgICAgICAgICBsZXQga2xuID0gMiAqIG5yZFxuICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG5yZDsgKytpKSBkZW5zW2tsbiArIGldID0gdFsxXVtpY29tW2ldXVxuICAgICAgICAgIC8vIGNvbXB1dGUgc29sdXRpb24gYXQgbWlkLXBvaW50XG4gICAgICAgICAgZm9yIChsZXQgaiA9IDI7IGogPD0ga2M7ICsraikge1xuICAgICAgICAgICAgbGV0IGRibGVuaiA9IG5qW2pdXG4gICAgICAgICAgICBmb3IgKGxldCBsID0gajsgbCA+PSAyOyAtLWwpIHtcbiAgICAgICAgICAgICAgbGV0IGZhY3RvciA9IChkYmxlbmogLyBualtsIC0gMV0pICoqIDIgLSAxXG4gICAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG5yZDsgKytpKSB7XG4gICAgICAgICAgICAgICAgeVNhZmVbbCAtIDFdW2ldID0geVNhZmVbbF1baV0gKyAoeVNhZmVbbF1baV0gLSB5U2FmZVtsIC0gMV1baV0pIC8gZmFjdG9yXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgbGV0IGtybiA9IDQgKiBucmRcbiAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBucmQ7ICsraSkgZGVuc1trcm4gKyBpXSA9IHlTYWZlWzFdW2ldXG4gICAgICAgICAgLy8gY29tcHV0ZSBmaXJzdCBkZXJpdmF0aXZlIGF0IHJpZ2h0IGVuZFxuICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG47ICsraSkgeWgxW2ldID0gdFsxXVtpXVxuICAgICAgICAgIEYoeCwgeWgxLCB5aDIpXG4gICAgICAgICAga3JuID0gMyAqIG5yZFxuICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG5yZDsgKytpKSBkZW5zW2tybiArIGldID0geWgyW2ljb21baV1dICogaFxuICAgICAgICAgIC8vIFRIRSBMT09QXG4gICAgICAgICAgZm9yIChsZXQga21pID0gMTsga21pIDw9IGttaXQ7ICsra21pKSB7XG4gICAgICAgICAgICAvLyBjb21wdXRlIGttaS10aCBkZXJpdmF0aXZlIGF0IG1pZC1wb2ludFxuICAgICAgICAgICAgbGV0IGtiZWcgPSAoa21pICsgMSkgLyAyIHwgMFxuICAgICAgICAgICAgZm9yIChsZXQga2sgPSBrYmVnOyBrayA8PSBrYzsgKytraykge1xuICAgICAgICAgICAgICBsZXQgZmFjbmogPSAobmpba2tdIC8gMikgKiogKGttaSAtIDEpXG4gICAgICAgICAgICAgIGlQdCA9IGlQb2ludFtrayArIDFdIC0gMiAqIGtrICsga21pXG4gICAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG5yZDsgKytpKSB7XG4gICAgICAgICAgICAgICAgeVNhZmVba2tdW2ldID0gZlNhZmVbaVB0XVtpXSAqIGZhY25qXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAobGV0IGogPSBrYmVnICsgMTsgaiA8PSBrYzsgKytqKSB7XG4gICAgICAgICAgICAgIGxldCBkYmxlbmogPSBualtqXVxuICAgICAgICAgICAgICBmb3IgKGxldCBsID0gajsgbCA+PSBrYmVnICsgMTsgLS1sKSB7XG4gICAgICAgICAgICAgICAgbGV0IGZhY3RvciA9IChkYmxlbmogLyBualtsIC0gMV0pICoqIDIgLSAxXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbnJkOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgIHlTYWZlW2wgLSAxXVtpXSA9IHlTYWZlW2xdW2ldICsgKHlTYWZlW2xdW2ldIC0geVNhZmVbbCAtIDFdW2ldKSAvIGZhY3RvclxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAga3JuID0gKGttaSArIDQpICogbnJkXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBucmQ7ICsraSkgZGVuc1trcm4gKyBpXSA9IHlTYWZlW2tiZWddW2ldICogaFxuICAgICAgICAgICAgaWYgKGttaSA9PT0ga21pdCkgY29udGludWVcbiAgICAgICAgICAgIC8vIGNvbXB1dGUgZGlmZmVyZW5jZXNcbiAgICAgICAgICAgIGZvciAobGV0IGtrID0gKGttaSArIDIpIC8gMiB8IDA7IGtrIDw9IGtjOyArK2trKSB7XG4gICAgICAgICAgICAgIGxldCBsYmVnID0gaVBvaW50W2trICsgMV1cbiAgICAgICAgICAgICAgbGV0IGxlbmQgPSBpUG9pbnRba2tdICsga21pICsgMVxuICAgICAgICAgICAgICBpZiAoa21pID09PSAxICYmIG5TZXEgPT09IDQpIGxlbmQgKz0gMlxuICAgICAgICAgICAgICBsZXQgbDogbnVtYmVyXG4gICAgICAgICAgICAgIGZvciAobCA9IGxiZWc7IGwgPj0gbGVuZDsgbCAtPSAyKSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbnJkOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgIGZTYWZlW2xdW2ldIC09IGZTYWZlW2wgLSAyXVtpXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoa21pID09PSAxICYmIG5TZXEgPT09IDQpIHtcbiAgICAgICAgICAgICAgICBsID0gbGVuZCAtIDJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBucmQ7ICsraSkgZlNhZmVbbF1baV0gLT0gZHpbaWNvbVtpXV1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gY29tcHV0ZSBkaWZmZXJlbmNlc1xuICAgICAgICAgICAgZm9yIChsZXQga2sgPSAoa21pICsgMikgLyAyIHwgMDsga2sgPD0ga2M7ICsra2spIHtcbiAgICAgICAgICAgICAgbGV0IGxiZWcgPSBpUG9pbnRba2sgKyAxXSAtIDFcbiAgICAgICAgICAgICAgbGV0IGxlbmQgPSBpUG9pbnRba2tdICsga21pICsgMlxuICAgICAgICAgICAgICBmb3IgKGxldCBsID0gbGJlZzsgbCA+PSBsZW5kOyBsIC09IDIpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBucmQ7ICsraSkge1xuICAgICAgICAgICAgICAgICAgZlNhZmVbbF1baV0gLT0gZlNhZmVbbCAtIDJdW2ldXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGludGVycChucmQsIGRlbnMsIGttaXQpXG4gICAgICAgICAgLy8gZXN0aW1hdGlvbiBvZiBpbnRlcnBvbGF0aW9uIGVycm9yXG4gICAgICAgICAgaWYgKHRoaXMuZGVuc2VPdXRwdXRFcnJvckVzdGltYXRvciAmJiBrbWl0ID49IDEpIHtcbiAgICAgICAgICAgIGxldCBlcnJpbnQgPSAwXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBucmQ7ICsraSkgZXJyaW50ICs9IChkZW5zWyhrbWl0ICsgNCkgKiBucmQgKyBpXSAvIHNjYWxbaWNvbVtpXV0pICoqIDJcbiAgICAgICAgICAgIGVycmludCA9IE1hdGguc3FydChlcnJpbnQgLyBucmQpICogZXJyZmFjW2ttaXRdXG4gICAgICAgICAgICBob3B0ZGUgPSBoIC8gTWF0aC5tYXgoZXJyaW50ICoqICgxIC8gKGttaXQgKyA0KSksIDAuMDEpXG4gICAgICAgICAgICBpZiAoZXJyaW50ID4gMTApIHtcbiAgICAgICAgICAgICAgaCA9IGhvcHRkZVxuICAgICAgICAgICAgICB4ID0geE9sZFxuICAgICAgICAgICAgICArK25SZWplY3RcbiAgICAgICAgICAgICAgcmVqZWN0ID0gdHJ1ZVxuICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBuOyArK2kpIGR6W2ldID0geWgyW2ldXG4gICAgICAgIH1cbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbjsgKytpKSB5W2ldID0gdFsxXVtpXVxuICAgICAgICArK25BY2NlcHRcbiAgICAgICAgaWYgKHNvbE91dCkge1xuICAgICAgICAgIC8vIElmIGRlbnNlT3V0cHV0LCB3ZSBhbHNvIHdhbnQgdG8gc3VwcGx5IHRoZSBkZW5zZSBjbG9zdXJlLlxuICAgICAgICAgIGlmIChzb2xPdXQobkFjY2VwdCArIDEsIHhPbGQsIHgsIHkuc2xpY2UoMSksXG4gICAgICAgICAgICAgIHRoaXMuZGVuc2VPdXRwdXQgJiYgY29udGV4KHhPbGRkLCBoaGgsIGttaXQsIGRlbnMsIGljb20pKSA9PT0gZmFsc2UpIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgICAgIC8vIGNvbXB1dGUgb3B0aW1hbCBvcmRlclxuICAgICAgICBsZXQga29wdDogbnVtYmVyXG4gICAgICAgIGlmIChrYyA9PT0gMikge1xuICAgICAgICAgIGtvcHQgPSBNYXRoLm1pbigzLCBrbSAtIDEpXG4gICAgICAgICAgaWYgKHJlamVjdCkga29wdCA9IDJcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoa2MgPD0gaykge1xuICAgICAgICAgICAga29wdCA9IGtjXG4gICAgICAgICAgICBpZiAod1trYyAtIDFdIDwgd1trY10gKiB0aGlzLnN0ZXBTaXplRmFjMykga29wdCA9IGtjIC0gMVxuICAgICAgICAgICAgaWYgKHdba2NdIDwgd1trYyAtIDFdICogdGhpcy5zdGVwU2l6ZUZhYzQpIGtvcHQgPSBNYXRoLm1pbihrYyArIDEsIGttIC0gMSlcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAga29wdCA9IGtjIC0gMVxuICAgICAgICAgICAgaWYgKGtjID4gMyAmJiB3W2tjIC0gMl0gPCB3W2tjIC0gMV0gKiB0aGlzLnN0ZXBTaXplRmFjMykga29wdCA9IGtjIC0gMlxuICAgICAgICAgICAgaWYgKHdba2NdIDwgd1trb3B0XSAqIHRoaXMuc3RlcFNpemVGYWM0KSBrb3B0ID0gTWF0aC5taW4oa2MsIGttIC0gMSlcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gYWZ0ZXIgYSByZWplY3RlZCBzdGVwXG4gICAgICAgIGlmIChyZWplY3QpIHtcbiAgICAgICAgICBrID0gTWF0aC5taW4oa29wdCwga2MpXG4gICAgICAgICAgaCA9IHBvc25lZyAqIE1hdGgubWluKE1hdGguYWJzKGgpLCBNYXRoLmFicyhoaFtrXSkpXG4gICAgICAgICAgcmVqZWN0ID0gZmFsc2VcbiAgICAgICAgICByZXR1cm4gdHJ1ZSAgLy8gZ290byAxMFxuICAgICAgICB9XG4gICAgICAgIGlmIChrb3B0IDw9IGtjKSB7XG4gICAgICAgICAgaCA9IGhoW2tvcHRdXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKGtjIDwgayAmJiB3W2tjXSA8IHdba2MgLSAxXSAqIHRoaXMuc3RlcFNpemVGYWM0KSB7XG4gICAgICAgICAgICBoID0gaGhba2NdICogYVtrb3B0ICsgMV0gLyBhW2tjXVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBoID0gaGhba2NdICogYVtrb3B0XSAvIGFba2NdXG4gICAgICAgICAgfVxuXG5cbiAgICAgICAgfVxuICAgICAgICAvLyBjb21wdXRlIHN0ZXBzaXplIGZvciBuZXh0IHN0ZXBcbiAgICAgICAgayA9IGtvcHRcbiAgICAgICAgaCA9IHBvc25lZyAqIE1hdGguYWJzKGgpXG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICB9XG5cbiAgICAgIGxldCBtaWRleCA9IChqOiBudW1iZXIpOiB2b2lkID0+IHtcbiAgICAgICAgY29uc3QgZHkgPSBTb2x2ZXIuZGltKHRoaXMubilcbiAgICAgICAgLy8gQ29tcHV0ZXMgdGhlIGp0aCBsaW5lIG9mIHRoZSBleHRyYXBvbGF0aW9uIHRhYmxlIGFuZFxuICAgICAgICAvLyBwcm92aWRlcyBhbiBlc3RpbWF0aW9uIG9mIHRoZSBvcHRpb25hbCBzdGVwc2l6ZVxuICAgICAgICBjb25zdCBoaiA9IGggLyBualtqXVxuICAgICAgICAvLyBFdWxlciBzdGFydGluZyBzdGVwXG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IHRoaXMubjsgKytpKSB7XG4gICAgICAgICAgeWgxW2ldID0geVtpXVxuICAgICAgICAgIHloMltpXSA9IHlbaV0gKyBoaiAqIGR6W2ldXG4gICAgICAgIH1cbiAgICAgICAgLy8gRXhwbGljaXQgbWlkcG9pbnQgcnVsZVxuICAgICAgICBjb25zdCBtID0gbmpbal0gLSAxXG4gICAgICAgIGNvbnN0IG5qTWlkID0gKG5qW2pdIC8gMikgfCAwXG4gICAgICAgIGZvciAobGV0IG1tID0gMTsgbW0gPD0gbTsgKyttbSkge1xuICAgICAgICAgIGlmICh0aGlzLmRlbnNlT3V0cHV0ICYmIG1tID09PSBuak1pZCkge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbnJkOyArK2kpIHtcbiAgICAgICAgICAgICAgeVNhZmVbal1baV0gPSB5aDJbaWNvbVtpXV1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgRih4ICsgaGogKiBtbSwgeWgyLCBkeSlcbiAgICAgICAgICBpZiAodGhpcy5kZW5zZU91dHB1dCAmJiBNYXRoLmFicyhtbSAtIG5qTWlkKSA8PSAyICogaiAtIDEpIHtcbiAgICAgICAgICAgICsraVB0XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBucmQ7ICsraSkge1xuICAgICAgICAgICAgICBmU2FmZVtpUHRdW2ldID0gZHlbaWNvbVtpXV1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gdGhpcy5uOyArK2kpIHtcbiAgICAgICAgICAgIGxldCB5cyA9IHloMVtpXVxuICAgICAgICAgICAgeWgxW2ldID0geWgyW2ldXG4gICAgICAgICAgICB5aDJbaV0gPSB5cyArIDIgKiBoaiAqIGR5W2ldXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChtbSA8PSB0aGlzLnN0YWJpbGl0eUNoZWNrQ291bnQgJiYgaiA8PSB0aGlzLnN0YWJpbGl0eUNoZWNrVGFibGVMaW5lcykge1xuICAgICAgICAgICAgLy8gc3RhYmlsaXR5IGNoZWNrXG4gICAgICAgICAgICBsZXQgZGVsMSA9IDBcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IHRoaXMubjsgKytpKSB7XG4gICAgICAgICAgICAgIGRlbDEgKz0gKGR6W2ldIC8gc2NhbFtpXSkgKiogMlxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IGRlbDIgPSAwXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSB0aGlzLm47ICsraSkge1xuICAgICAgICAgICAgICBkZWwyICs9ICgoZHlbaV0gLSBkeltpXSkgLyBzY2FsW2ldKSAqKiAyXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBxdW90ID0gZGVsMiAvIE1hdGgubWF4KHRoaXMudVJvdW5kLCBkZWwxKVxuICAgICAgICAgICAgaWYgKHF1b3QgPiA0KSB7XG4gICAgICAgICAgICAgICsrbkV2YWxcbiAgICAgICAgICAgICAgYXRvdiA9IHRydWVcbiAgICAgICAgICAgICAgaCAqPSB0aGlzLnN0ZXBTaXplUmVkdWN0aW9uRmFjdG9yXG4gICAgICAgICAgICAgIHJlamVjdCA9IHRydWVcbiAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIGZpbmFsIHNtb290aGluZyBzdGVwXG4gICAgICAgIEYoeCArIGgsIHloMiwgZHkpXG4gICAgICAgIGlmICh0aGlzLmRlbnNlT3V0cHV0ICYmIG5qTWlkIDw9IDIgKiBqIC0gMSkge1xuICAgICAgICAgICsraVB0XG4gICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbnJkOyArK2kpIHtcbiAgICAgICAgICAgIGZTYWZlW2lQdF1baV0gPSBkeVtpY29tW2ldXVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSB0aGlzLm47ICsraSkge1xuICAgICAgICAgIHRbal1baV0gPSAoeWgxW2ldICsgeWgyW2ldICsgaGogKiBkeVtpXSkgLyAyXG4gICAgICAgIH1cbiAgICAgICAgbkV2YWwgKz0gbmpbal1cbiAgICAgICAgLy8gcG9seW5vbWlhbCBleHRyYXBvbGF0aW9uXG4gICAgICAgIGlmIChqID09PSAxKSByZXR1cm4gIC8vIHdhcyBqLmVxLjFcbiAgICAgICAgY29uc3QgZGJsZW5qID0gbmpbal1cbiAgICAgICAgbGV0IGZhYzogbnVtYmVyXG4gICAgICAgIGZvciAobGV0IGwgPSBqOyBsID4gMTsgLS1sKSB7XG4gICAgICAgICAgZmFjID0gKGRibGVuaiAvIG5qW2wgLSAxXSkgKiogMiAtIDFcbiAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSB0aGlzLm47ICsraSkge1xuICAgICAgICAgICAgdFtsIC0gMV1baV0gPSB0W2xdW2ldICsgKHRbbF1baV0gLSB0W2wgLSAxXVtpXSkgLyBmYWNcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZXJyID0gMFxuICAgICAgICAvLyBzY2FsaW5nXG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IHRoaXMubjsgKytpKSB7XG4gICAgICAgICAgbGV0IHQxaSA9IE1hdGgubWF4KE1hdGguYWJzKHlbaV0pLCBNYXRoLmFicyh0WzFdW2ldKSlcbiAgICAgICAgICBzY2FsW2ldID0gYVRvbFtpXSArIHJUb2xbaV0gKiB0MWlcbiAgICAgICAgICBlcnIgKz0gKCh0WzFdW2ldIC0gdFsyXVtpXSkgLyBzY2FsW2ldKSAqKiAyXG4gICAgICAgIH1cbiAgICAgICAgZXJyID0gTWF0aC5zcXJ0KGVyciAvIHRoaXMubilcbiAgICAgICAgaWYgKGVyciAqIHRoaXMudVJvdW5kID49IDEgfHwgKGogPiAyICYmIGVyciA+PSBlcnJPbGQpKSB7XG4gICAgICAgICAgYXRvdiA9IHRydWVcbiAgICAgICAgICBoICo9IHRoaXMuc3RlcFNpemVSZWR1Y3Rpb25GYWN0b3JcbiAgICAgICAgICByZWplY3QgPSB0cnVlXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgZXJyT2xkID0gTWF0aC5tYXgoNCAqIGVyciwgMSlcbiAgICAgICAgLy8gY29tcHV0ZSBvcHRpbWFsIHN0ZXBzaXplc1xuICAgICAgICBsZXQgZXhwMCA9IDEgLyAoMiAqIGogLSAxKVxuICAgICAgICBsZXQgZmFjTWluID0gdGhpcy5zdGVwU2l6ZUZhYzEgKiogZXhwMFxuICAgICAgICBmYWMgPSBNYXRoLm1pbih0aGlzLnN0ZXBTaXplRmFjMiAvIGZhY01pbixcbiAgICAgICAgICBNYXRoLm1heChmYWNNaW4sIChlcnIgLyB0aGlzLnN0ZXBTYWZldHlGYWN0b3IxKSAqKiBleHAwIC8gdGhpcy5zdGVwU2FmZXR5RmFjdG9yMikpXG4gICAgICAgIGZhYyA9IDEgLyBmYWNcbiAgICAgICAgaGhbal0gPSBNYXRoLm1pbihNYXRoLmFicyhoKSAqIGZhYywgaE1heClcbiAgICAgICAgd1tqXSA9IGFbal0gLyBoaFtqXVxuICAgICAgfVxuXG4gICAgICBjb25zdCBpbnRlcnAgPSAobjogbnVtYmVyLCB5OiBudW1iZXJbXSwgaW1pdDogbnVtYmVyKSA9PiB7XG4gICAgICAgIC8vIGNvbXB1dGVzIHRoZSBjb2VmZmljaWVudHMgb2YgdGhlIGludGVycG9sYXRpb24gZm9ybXVsYVxuICAgICAgICBsZXQgYSA9IG5ldyBBcnJheSgzMSkgIC8vIHplcm8tYmFzZWQ6IDA6MzBcbiAgICAgICAgLy8gYmVnaW4gd2l0aCBIZXJtaXRlIGludGVycG9sYXRpb25cbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbjsgKytpKSB7XG4gICAgICAgICAgbGV0IHkwID0geVtpXVxuICAgICAgICAgIGxldCB5MSA9IHlbMiAqIG4gKyBpXVxuICAgICAgICAgIGxldCB5cDAgPSB5W24gKyBpXVxuICAgICAgICAgIGxldCB5cDEgPSB5WzMgKiBuICsgaV1cbiAgICAgICAgICBsZXQgeURpZmYgPSB5MSAtIHkwXG4gICAgICAgICAgbGV0IGFzcGwgPSAteXAxICsgeURpZmZcbiAgICAgICAgICBsZXQgYnNwbCA9IHlwMCAtIHlEaWZmXG4gICAgICAgICAgeVtuICsgaV0gPSB5RGlmZlxuICAgICAgICAgIHlbMiAqIG4gKyBpXSA9IGFzcGxcbiAgICAgICAgICB5WzMgKiBuICsgaV0gPSBic3BsXG4gICAgICAgICAgaWYgKGltaXQgPCAwKSBjb250aW51ZVxuICAgICAgICAgIC8vIGNvbXB1dGUgdGhlIGRlcml2YXRpdmVzIG9mIEhlcm1pdGUgYXQgbWlkcG9pbnRcbiAgICAgICAgICBsZXQgcGgwID0gKHkwICsgeTEpICogMC41ICsgMC4xMjUgKiAoYXNwbCArIGJzcGwpXG4gICAgICAgICAgbGV0IHBoMSA9IHlEaWZmICsgKGFzcGwgLSBic3BsKSAqIDAuMjVcbiAgICAgICAgICBsZXQgcGgyID0gLSh5cDAgLSB5cDEpXG4gICAgICAgICAgbGV0IHBoMyA9IDYgKiAoYnNwbCAtIGFzcGwpXG4gICAgICAgICAgLy8gY29tcHV0ZSB0aGUgZnVydGhlciBjb2VmZmljaWVudHNcbiAgICAgICAgICBpZiAoaW1pdCA+PSAxKSB7XG4gICAgICAgICAgICBhWzFdID0gMTYgKiAoeVs1ICogbiArIGldIC0gcGgxKVxuICAgICAgICAgICAgaWYgKGltaXQgPj0gMykge1xuICAgICAgICAgICAgICBhWzNdID0gMTYgKiAoeVs3ICogbiArIGldIC0gcGgzICsgMyAqIGFbMV0pXG4gICAgICAgICAgICAgIGlmIChpbWl0ID49IDUpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpbSA9IDU7IGltIDw9IGltaXQ7IGltICs9IDIpIHtcbiAgICAgICAgICAgICAgICAgIGxldCBmYWMxID0gaW0gKiAoaW0gLSAxKSAvIDJcbiAgICAgICAgICAgICAgICAgIGxldCBmYWMyID0gZmFjMSAqIChpbSAtIDIpICogKGltIC0gMykgKiAyXG4gICAgICAgICAgICAgICAgICBhW2ltXSA9IDE2ICogKHlbKGltICsgNCkgKiBuICsgaV0gKyBmYWMxICogYVtpbSAtIDJdIC0gZmFjMiAqIGFbaW0gLSA0XSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYVswXSA9ICh5WzQgKiBuICsgaV0gLSBwaDApICogMTZcbiAgICAgICAgICBpZiAoaW1pdCA+PSAyKSB7XG4gICAgICAgICAgICBhWzJdID0gKHlbbiAqIDYgKyBpXSAtIHBoMiArIGFbMF0pICogMTZcbiAgICAgICAgICAgIGlmIChpbWl0ID49IDQpIHtcbiAgICAgICAgICAgICAgZm9yIChsZXQgaW0gPSA0OyBpbSA8PSBpbWl0OyBpbSArPSAyKSB7XG4gICAgICAgICAgICAgICAgbGV0IGZhYzEgPSBpbSAqIChpbSAtIDEpIC8gMlxuICAgICAgICAgICAgICAgIGxldCBmYWMyID0gaW0gKiAoaW0gLSAxKSAqIChpbSAtIDIpICogKGltIC0gMylcbiAgICAgICAgICAgICAgICBhW2ltXSA9ICh5W24gKiAoaW0gKyA0KSArIGldICsgYVtpbSAtIDJdICogZmFjMSAtIGFbaW0gLSA0XSAqIGZhYzIpICogMTZcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBmb3IgKGxldCBpbSA9IDA7IGltIDw9IGltaXQ7ICsraW0pIHlbbiAqIChpbSArIDQpICsgaV0gPSBhW2ltXVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNvbnRleCA9ICh4T2xkOiBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgaDogbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgIGltaXQ6IG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICB5OiBudW1iZXJbXSxcbiAgICAgICAgICAgICAgICAgICAgICBpY29tOiBudW1iZXJbXSkgPT4ge1xuICAgICAgICByZXR1cm4gKGM6IG51bWJlciwgeDogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgbGV0IGkgPSAwXG4gICAgICAgICAgZm9yIChsZXQgaiA9IDE7IGogPD0gbnJkOyArK2opIHtcbiAgICAgICAgICAgIC8vIGNhcmVmdWw6IGN1c3RvbWVycyBkZXNjcmliZSBjb21wb25lbnRzIDAtYmFzZWQuIFdlIHJlY29yZCBpbmRpY2VzIDEtYmFzZWQuXG4gICAgICAgICAgICBpZiAoaWNvbVtqXSA9PT0gYyArIDEpIGkgPSBqXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChpID09PSAwKSB0aHJvdyBuZXcgRXJyb3IoJ25vIGRlbnNlIG91dHB1dCBhdmFpbGFibGUgZm9yIGNvbXBvbmVudCAnICsgYylcbiAgICAgICAgICBjb25zdCB0aGV0YSA9ICh4IC0geE9sZCkgLyBoXG4gICAgICAgICAgY29uc3QgdGhldGExID0gMSAtIHRoZXRhXG4gICAgICAgICAgY29uc3QgcGh0aGV0ID0geVtpXSArIHRoZXRhICogKHlbbnJkICsgaV0gKyB0aGV0YTEgKiAoeVsyICogbnJkICsgaV0gKiB0aGV0YSArIHlbMyAqIG5yZCArIGldICogdGhldGExKSlcbiAgICAgICAgICBpZiAoaW1pdCA8IDApIHJldHVybiBwaHRoZXRcbiAgICAgICAgICBjb25zdCB0aGV0YWggPSB0aGV0YSAtIDAuNVxuICAgICAgICAgIGxldCByZXQgPSB5W25yZCAqIChpbWl0ICsgNCkgKyBpXVxuICAgICAgICAgIGZvciAobGV0IGltID0gaW1pdDsgaW0gPj0gMTsgLS1pbSkge1xuICAgICAgICAgICAgcmV0ID0geVtucmQgKiAoaW0gKyAzKSArIGldICsgcmV0ICogdGhldGFoIC8gaW1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHBodGhldCArICh0aGV0YSAqIHRoZXRhMSkgKiogMiAqIHJldFxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIHByZXBhcmF0aW9uXG4gICAgICBjb25zdCB5U2FmZSA9IFNvbHZlci5kaW0yKGttLCBucmQpXG4gICAgICBjb25zdCBoaCA9IFNvbHZlci5kaW0oa20pXG4gICAgICBjb25zdCB0ID0gU29sdmVyLmRpbTIoa20sIHRoaXMubilcbiAgICAgIC8vIERlZmluZSB0aGUgc3RlcCBzaXplIHNlcXVlbmNlXG4gICAgICBjb25zdCBuaiA9IFNvbHZlci5zdGVwU2l6ZVNlcXVlbmNlKG5TZXEsIGttKVxuICAgICAgLy8gRGVmaW5lIHRoZSBhW2ldIGZvciBvcmRlciBzZWxlY3Rpb25cbiAgICAgIGNvbnN0IGEgPSBTb2x2ZXIuZGltKGttKVxuICAgICAgYVsxXSA9IDEgKyBualsxXVxuICAgICAgZm9yIChsZXQgaSA9IDI7IGkgPD0ga207ICsraSkge1xuICAgICAgICBhW2ldID0gYVtpIC0gMV0gKyBualtpXVxuICAgICAgfVxuICAgICAgLy8gSW5pdGlhbCBTY2FsaW5nXG4gICAgICBjb25zdCBzY2FsID0gU29sdmVyLmRpbSh0aGlzLm4pXG4gICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSB0aGlzLm47ICsraSkge1xuICAgICAgICBzY2FsW2ldID0gYVRvbFtpXSArIHJUb2xbaV0gKyBNYXRoLmFicyh5W2ldKVxuICAgICAgfVxuICAgICAgLy8gSW5pdGlhbCBwcmVwYXJhdGlvbnNcbiAgICAgIGNvbnN0IHBvc25lZyA9IHhFbmQgLSB4ID49IDAgPyAxIDogLTFcbiAgICAgIGxldCBrID0gTWF0aC5tYXgoMiwgTWF0aC5taW4oa20gLSAxLCBNYXRoLmZsb29yKC1Tb2x2ZXIubG9nMTAoclRvbFsxXSArIDFlLTQwKSAqIDAuNiArIDEuNSkpKVxuICAgICAgbGV0IGggPSBNYXRoLm1heChNYXRoLmFicyh0aGlzLmluaXRpYWxTdGVwU2l6ZSksIDFlLTQpXG4gICAgICBoID0gcG9zbmVnICogTWF0aC5taW4oaCwgaE1heCwgTWF0aC5hYnMoeEVuZCAtIHgpIC8gMilcbiAgICAgIGNvbnN0IGlQb2ludCA9IFNvbHZlci5kaW0oa20gKyAxKVxuICAgICAgY29uc3QgZXJyZmFjID0gU29sdmVyLmRpbSgyICoga20pXG4gICAgICBsZXQgeE9sZCA9IHhcbiAgICAgIGxldCBpUHQgPSAwXG4gICAgICBpZiAoc29sT3V0KSB7XG4gICAgICAgIGlmICh0aGlzLmRlbnNlT3V0cHV0KSB7XG4gICAgICAgICAgaVBvaW50WzFdID0gMFxuICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IGttOyArK2kpIHtcbiAgICAgICAgICAgIGxldCBuakFkZCA9IDQgKiBpIC0gMlxuICAgICAgICAgICAgaWYgKG5qW2ldID4gbmpBZGQpICsrbmpBZGRcbiAgICAgICAgICAgIGlQb2ludFtpICsgMV0gPSBpUG9pbnRbaV0gKyBuakFkZFxuICAgICAgICAgIH1cbiAgICAgICAgICBmb3IgKGxldCBtdSA9IDE7IG11IDw9IDIgKiBrbTsgKyttdSkge1xuICAgICAgICAgICAgbGV0IGVycnggPSBNYXRoLnNxcnQobXUgLyAobXUgKyA0KSkgKiAwLjVcbiAgICAgICAgICAgIGxldCBwcm9kID0gKDEgLyAobXUgKyA0KSkgKiogMlxuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDE7IGogPD0gbXU7ICsraikgcHJvZCAqPSBlcnJ4IC8galxuICAgICAgICAgICAgZXJyZmFjW211XSA9IHByb2RcbiAgICAgICAgICB9XG4gICAgICAgICAgaVB0ID0gMFxuICAgICAgICB9XG4gICAgICAgIC8vIGNoZWNrIHJldHVybiB2YWx1ZSBhbmQgYWJhbmRvbiBpbnRlZ3JhdGlvbiBpZiBjYWxsZWQgZm9yXG4gICAgICAgIGlmIChmYWxzZSA9PT0gc29sT3V0KG5BY2NlcHQgKyAxLCB4T2xkLCB4LCB5LnNsaWNlKDEpKSkge1xuICAgICAgICAgIHJldHVybiBPdXRjb21lLkVhcmx5UmV0dXJuXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGxldCBlcnIgPSAwXG4gICAgICBsZXQgZXJyT2xkID0gMWUxMFxuICAgICAgbGV0IGhvcHRkZSA9IHBvc25lZyAqIGhNYXhcbiAgICAgIGNvbnN0IHcgPSBTb2x2ZXIuZGltKGttKVxuICAgICAgd1sxXSA9IDBcbiAgICAgIGxldCByZWplY3QgPSBmYWxzZVxuICAgICAgbGV0IGxhc3QgPSBmYWxzZVxuICAgICAgbGV0IGF0b3Y6IGJvb2xlYW5cbiAgICAgIGxldCBrYyA9IDBcblxuICAgICAgZW51bSBTVEFURSB7XG4gICAgICAgIFN0YXJ0LCBCYXNpY0ludGVncmF0aW9uU3RlcCwgQ29udmVyZ2VuY2VTdGVwLCBIb3BlRm9yQ29udmVyZ2VuY2UsIEFjY2VwdCwgUmVqZWN0XG4gICAgICB9XG4gICAgICBsZXQgc3RhdGU6IFNUQVRFID0gU1RBVEUuU3RhcnRcblxuICAgICAgbG9vcDogd2hpbGUgKHRydWUpIHtcbiAgICAgICAgdGhpcy5kZWJ1ZyAmJiBjb25zb2xlLmxvZygnU1RBVEUnLCBTVEFURVtzdGF0ZV0sIG5TdGVwLCB4T2xkLCB4LCBoLCBrLCBrYywgaG9wdGRlKVxuICAgICAgICBzd2l0Y2ggKHN0YXRlKSB7XG4gICAgICAgICAgY2FzZSBTVEFURS5TdGFydDpcbiAgICAgICAgICAgIGF0b3YgPSBmYWxzZVxuICAgICAgICAgICAgLy8gSXMgeEVuZCByZWFjaGVkIGluIHRoZSBuZXh0IHN0ZXA/XG4gICAgICAgICAgICBpZiAoMC4xICogTWF0aC5hYnMoeEVuZCAtIHgpIDw9IE1hdGguYWJzKHgpICogdGhpcy51Um91bmQpIGJyZWFrIGxvb3BcbiAgICAgICAgICAgIGggPSBwb3NuZWcgKiBNYXRoLm1pbihNYXRoLmFicyhoKSwgTWF0aC5hYnMoeEVuZCAtIHgpLCBoTWF4LCBNYXRoLmFicyhob3B0ZGUpKVxuICAgICAgICAgICAgaWYgKCh4ICsgMS4wMSAqIGggLSB4RW5kKSAqIHBvc25lZyA+IDApIHtcbiAgICAgICAgICAgICAgaCA9IHhFbmQgLSB4XG4gICAgICAgICAgICAgIGxhc3QgPSB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoblN0ZXAgPT09IDAgfHwgIXRoaXMuZGVuc2VPdXRwdXQpIHtcbiAgICAgICAgICAgICAgRih4LCB5LCBkeilcbiAgICAgICAgICAgICAgKytuRXZhbFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gVGhlIGZpcnN0IGFuZCBsYXN0IHN0ZXBcbiAgICAgICAgICAgIGlmIChuU3RlcCA9PT0gMCB8fCBsYXN0KSB7XG4gICAgICAgICAgICAgIGlQdCA9IDBcbiAgICAgICAgICAgICAgKytuU3RlcFxuICAgICAgICAgICAgICBmb3IgKGxldCBqID0gMTsgaiA8PSBrOyArK2opIHtcbiAgICAgICAgICAgICAgICBrYyA9IGpcbiAgICAgICAgICAgICAgICBtaWRleChqKVxuICAgICAgICAgICAgICAgIGlmIChhdG92KSBjb250aW51ZSBsb29wXG4gICAgICAgICAgICAgICAgaWYgKGogPiAxICYmIGVyciA8PSAxKSB7XG4gICAgICAgICAgICAgICAgICBzdGF0ZSA9IFNUQVRFLkFjY2VwdFxuICAgICAgICAgICAgICAgICAgY29udGludWUgbG9vcFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBzdGF0ZSA9IFNUQVRFLkhvcGVGb3JDb252ZXJnZW5jZVxuICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3RhdGUgPSBTVEFURS5CYXNpY0ludGVncmF0aW9uU3RlcFxuICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgIGNhc2UgU1RBVEUuQmFzaWNJbnRlZ3JhdGlvblN0ZXA6XG4gICAgICAgICAgICAvLyBiYXNpYyBpbnRlZ3JhdGlvbiBzdGVwXG4gICAgICAgICAgICBpUHQgPSAwXG4gICAgICAgICAgICArK25TdGVwXG4gICAgICAgICAgICBpZiAoblN0ZXAgPj0gdGhpcy5tYXhTdGVwcykge1xuICAgICAgICAgICAgICByZXR1cm4gT3V0Y29tZS5NYXhTdGVwc0V4Y2VlZGVkXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBrYyA9IGsgLSAxXG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMTsgaiA8PSBrYzsgKytqKSB7XG4gICAgICAgICAgICAgIG1pZGV4KGopXG4gICAgICAgICAgICAgIGlmIChhdG92KSB7XG4gICAgICAgICAgICAgICAgc3RhdGUgPSBTVEFURS5TdGFydFxuICAgICAgICAgICAgICAgIGNvbnRpbnVlIGxvb3BcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gY29udmVyZ2VuY2UgbW9uaXRvclxuICAgICAgICAgICAgaWYgKGsgPT09IDIgfHwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgIHN0YXRlID0gU1RBVEUuQ29udmVyZ2VuY2VTdGVwXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBpZiAoZXJyIDw9IDEpIHtcbiAgICAgICAgICAgICAgICBzdGF0ZSA9IFNUQVRFLkFjY2VwdFxuICAgICAgICAgICAgICB9IGVsc2UgaWYgKGVyciA+ICgobmpbayArIDFdICogbmpba10pIC8gNCkgKiogMikge1xuICAgICAgICAgICAgICAgIHN0YXRlID0gU1RBVEUuUmVqZWN0XG4gICAgICAgICAgICAgIH0gZWxzZSBzdGF0ZSA9IFNUQVRFLkNvbnZlcmdlbmNlU3RlcFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgIGNhc2UgU1RBVEUuQ29udmVyZ2VuY2VTdGVwOiAgLy8gbGFiZWwgNTBcbiAgICAgICAgICAgIG1pZGV4KGspXG4gICAgICAgICAgICBpZiAoYXRvdikge1xuICAgICAgICAgICAgICBzdGF0ZSA9IFNUQVRFLlN0YXJ0XG4gICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBrYyA9IGtcbiAgICAgICAgICAgIGlmIChlcnIgPD0gMSkge1xuICAgICAgICAgICAgICBzdGF0ZSA9IFNUQVRFLkFjY2VwdFxuICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3RhdGUgPSBTVEFURS5Ib3BlRm9yQ29udmVyZ2VuY2VcbiAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICBjYXNlIFNUQVRFLkhvcGVGb3JDb252ZXJnZW5jZTpcbiAgICAgICAgICAgIC8vIGhvcGUgZm9yIGNvbnZlcmdlbmNlIGluIGxpbmUgayArIDFcbiAgICAgICAgICAgIGlmIChlcnIgPiAobmpbayArIDFdIC8gMikgKiogMikge1xuICAgICAgICAgICAgICBzdGF0ZSA9IFNUQVRFLlJlamVjdFxuICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAga2MgPSBrICsgMVxuICAgICAgICAgICAgbWlkZXgoa2MpXG4gICAgICAgICAgICBpZiAoYXRvdikgc3RhdGUgPSBTVEFURS5TdGFydFxuICAgICAgICAgICAgZWxzZSBpZiAoZXJyID4gMSkgc3RhdGUgPSBTVEFURS5SZWplY3RcbiAgICAgICAgICAgIGVsc2Ugc3RhdGUgPSBTVEFURS5BY2NlcHRcbiAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICBjYXNlIFNUQVRFLkFjY2VwdDpcbiAgICAgICAgICAgIGlmICghYWNjZXB0U3RlcCh0aGlzLm4pKSByZXR1cm4gT3V0Y29tZS5FYXJseVJldHVyblxuICAgICAgICAgICAgc3RhdGUgPSBTVEFURS5TdGFydFxuICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgIGNhc2UgU1RBVEUuUmVqZWN0OlxuICAgICAgICAgICAgayA9IE1hdGgubWluKGssIGtjLCBrbSAtIDEpXG4gICAgICAgICAgICBpZiAoayA+IDIgJiYgd1trIC0gMV0gPCB3W2tdICogdGhpcy5zdGVwU2l6ZUZhYzMpIGsgLT0gMVxuICAgICAgICAgICAgKytuUmVqZWN0XG4gICAgICAgICAgICBoID0gcG9zbmVnICogaGhba11cbiAgICAgICAgICAgIHJlamVjdCA9IHRydWVcbiAgICAgICAgICAgIHN0YXRlID0gU1RBVEUuQmFzaWNJbnRlZ3JhdGlvblN0ZXBcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIE91dGNvbWUuQ29udmVyZ2VkXG4gICAgfVxuXG4gICAgY29uc3Qgb3V0Y29tZSA9IG9keGNvcigpXG4gICAgcmV0dXJuIHtcbiAgICAgIHk6IHkuc2xpY2UoMSksXG4gICAgICBvdXRjb21lOiBvdXRjb21lLFxuICAgICAgblN0ZXA6IG5TdGVwLFxuICAgICAgeEVuZDogeEVuZCxcbiAgICAgIG5BY2NlcHQ6IG5BY2NlcHQsXG4gICAgICBuUmVqZWN0OiBuUmVqZWN0LFxuICAgICAgbkV2YWw6IG5FdmFsXG4gICAgfVxuICB9XG59XG4iLCIvKipcbiAqIENyZWF0ZWQgYnkgY29saW4gb24gNi8xNC8xNi5cbiAqL1xuXG5pbXBvcnQge1NvbHZlciwgRGVyaXZhdGl2ZX0gZnJvbSAnb2RleC9zcmMvb2RleCdcblxuaW50ZXJmYWNlIEhhbWlsdG9uTWFwIHtcbiAgZXZvbHZlOiAoaW5pdGlhbERhdGE6IG51bWJlcltdLCBuOiBudW1iZXIsIGNhbGxiYWNrOiAoeDogbnVtYmVyLCB5OiBudW1iZXIpID0+IHZvaWQpID0+IHZvaWRcbn1cblxuY29uc3QgdHdvUGkgPSBNYXRoLlBJICogMlxuXG5leHBvcnQgY2xhc3MgU3RhbmRhcmRNYXAgaW1wbGVtZW50cyBIYW1pbHRvbk1hcCB7XG4gIEs6IG51bWJlclxuICBQVjogKHg6IG51bWJlcikgPT4gbnVtYmVyXG4gIHN0YXRpYyB0d29QaSA9IDIgKiBNYXRoLlBJXG5cbiAgY29uc3RydWN0b3IoSzogbnVtYmVyKSB7XG4gICAgdGhpcy5LID0gS1xuICAgIHRoaXMuUFYgPSBTdGFuZGFyZE1hcC5wcmluY2lwYWxfdmFsdWUodHdvUGkpXG4gIH1cblxuICBzdGF0aWMgcHJpbmNpcGFsX3ZhbHVlKGN1dEhpZ2g6IG51bWJlcik6ICh2OiBudW1iZXIpID0+IG51bWJlciB7XG4gICAgY29uc3QgY3V0TG93ID0gY3V0SGlnaCAtIHR3b1BpXG4gICAgcmV0dXJuIGZ1bmN0aW9uICh4OiBudW1iZXIpIHtcbiAgICAgIGlmIChjdXRMb3cgPD0geCAmJiB4IDwgY3V0SGlnaCkge1xuICAgICAgICByZXR1cm4geFxuICAgICAgfVxuICAgICAgY29uc3QgeSA9IHggLSB0d29QaSAqIE1hdGguZmxvb3IoeCAvIHR3b1BpKVxuICAgICAgcmV0dXJuIHkgPCBjdXRIaWdoID8geSA6IHkgLSB0d29QaVxuICAgIH1cbiAgfVxuXG4gIGV2b2x2ZSA9IGZ1bmN0aW9uKGluaXRpYWxEYXRhOiBudW1iZXJbXSwgbjogbnVtYmVyLCBjYWxsYmFjazogKHg6IG51bWJlciwgeTogbnVtYmVyKSA9PiB2b2lkKSB7XG4gICAgbGV0IFt0aGV0YSwgSV0gPSBpbml0aWFsRGF0YVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICBjYWxsYmFjayh0aGV0YSwgSSlcbiAgICAgIGxldCBuSSA9IEkgKyAodGhpcy5LICogTWF0aC5zaW4odGhldGEpKVxuICAgICAgdGhldGEgPSB0aGlzLlBWKHRoZXRhICsgbkkpXG4gICAgICBJID0gdGhpcy5QVihuSSlcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIERyaXZlblBlbmR1bHVtTWFwIGltcGxlbWVudHMgSGFtaWx0b25NYXAge1xuICBkOiBEZXJpdmF0aXZlXG4gIFQ6IG51bWJlclxuICBTOiBTb2x2ZXJcbiAgUFY6ICh4OiBudW1iZXIpID0+IG51bWJlclxuXG4gIHN0YXRpYyBGOiAobTogbnVtYmVyLCBsOiBudW1iZXIsIGE6IG51bWJlciwgb21lZ2E6IG51bWJlciwgZzogbnVtYmVyKSA9PiBEZXJpdmF0aXZlID1cbiAgICAobSwgbCwgYSwgb21lZ2EsIGcpID0+ICh4LCBbdCwgdGhldGEsIHBfdGhldGFdKSA9PiB7XG4gICAgICAvLyBsZXQgXzEgPSBNYXRoLnNpbihvbWVnYSAqIHQpOiB0aGlzIGNvbWVzIGFib3V0IGZyb20gYSBidWcgaW4gb3VyIENTRVxuICAgICAgbGV0IF8yID0gTWF0aC5wb3cobCwgMilcbiAgICAgIGxldCBfMyA9IG9tZWdhICogdFxuICAgICAgbGV0IF80ID0gTWF0aC5zaW4odGhldGEpXG4gICAgICBsZXQgXzUgPSBNYXRoLmNvcyh0aGV0YSlcbiAgICAgIHJldHVybiBbMSxcbiAgICAgICAgKE1hdGguc2luKF8zKSAqIF80ICogYSAqIGwgKiBtICogb21lZ2EgKyBwX3RoZXRhKSAvIF8yICogbSxcbiAgICAgICAgKC0gTWF0aC5wb3coTWF0aC5zaW4oXzMpLCAyKSAqIF80ICogXzUgKiBNYXRoLnBvdyhhLCAyKSAqIGwgKiBtICogTWF0aC5wb3cob21lZ2EsIDIpIC0gTWF0aC5zaW4oXzMpICogXzUgKiBhICogb21lZ2EgKiBwX3RoZXRhIC0gXzQgKiBnICogXzIgKiBtKSAvIGxdXG4gICAgfVxuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuUyA9IG5ldyBTb2x2ZXIoMylcbiAgICB0aGlzLlMuZGVuc2VPdXRwdXQgPSB0cnVlXG4gICAgLy8gdGhpcy5TLmFic29sdXRlVG9sZXJhbmNlID0gMWUtOVxuICAgIC8vIHRoaXMuUy5yZWxhdGl2ZVRvbGVyYW5jZSA9IDFlLTlcbiAgICBjb25zdCBsID0gMVxuICAgIGNvbnN0IGcgPSA5LjhcbiAgICBjb25zdCB3MCA9IE1hdGguc3FydChnIC8gbClcbiAgICBjb25zdCB3ID0gMiAqIHcwXG4gICAgdGhpcy5UID0gMiAqIE1hdGguUEkgLyB3XG4gICAgY29uc3QgYSA9IDAuMVxuICAgIHRoaXMuZCA9IERyaXZlblBlbmR1bHVtTWFwLkYoMSwgbCwgYSwgdywgZylcbiAgICB0aGlzLlBWID0gU3RhbmRhcmRNYXAucHJpbmNpcGFsX3ZhbHVlKE1hdGguUEkpXG4gIH1cblxuICBldm9sdmUoaW5pdGlhbERhdGE6IG51bWJlcltdLCBuOiBudW1iZXIsIGNhbGxiYWNrOiAoeDogbnVtYmVyLCB5OiBudW1iZXIpID0+IHZvaWQpIHtcbiAgICB0aGlzLlMuc29sdmUodGhpcy5kLCAwLCBbMF0uY29uY2F0KGluaXRpYWxEYXRhKSwgMTAwMCAqIHRoaXMuVCwgdGhpcy5TLmdyaWQodGhpcy5ULCAoeCwgeXMpID0+IHtcbiAgICAgIGNhbGxiYWNrKHRoaXMuUFYoeXNbMV0pLCB5c1syXSlcbiAgICB9KSlcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRXhwbG9yZU1hcCB7XG4gIGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnRcbiAgTTogSGFtaWx0b25NYXBcbiAgY29udGV4dDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEXG5cbiAgY29uc3RydWN0b3IoY2FudmFzOiBzdHJpbmcsIE06IFN0YW5kYXJkTWFwLCB4UmFuZ2U6IG51bWJlcltdLCB5UmFuZ2U6IG51bWJlcltdKSB7XG4gICAgdGhpcy5jYW52YXMgPSA8SFRNTENhbnZhc0VsZW1lbnQ+IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGNhbnZhcylcbiAgICB0aGlzLk0gPSBNXG4gICAgdGhpcy5jb250ZXh0ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKVxuICAgIGxldCBbdywgaF0gPSBbeFJhbmdlWzFdIC0geFJhbmdlWzBdLCB5UmFuZ2VbMV0gLSB5UmFuZ2VbMF1dXG4gICAgdGhpcy5jYW52YXMub25tb3VzZWRvd24gPSAoZTogTW91c2VFdmVudCkgPT4ge1xuICAgICAgbGV0IFtjeCwgY3ldID0gW2Uub2Zmc2V0WCAvIHRoaXMuY29udGV4dC5jYW52YXMud2lkdGggKiB3ICsgeFJhbmdlWzBdLFxuICAgICAgICB5UmFuZ2VbMV0gLSBlLm9mZnNldFkgLyB0aGlzLmNvbnRleHQuY2FudmFzLmhlaWdodCAqIGhdXG4gICAgICB0aGlzLkV4cGxvcmUoY3gsIGN5KVxuICAgIH1cbiAgICB0aGlzLmNvbnRleHQuc2NhbGUodGhpcy5jb250ZXh0LmNhbnZhcy53aWR0aCAvIHcsIC10aGlzLmNvbnRleHQuY2FudmFzLmhlaWdodCAvIGgpXG4gICAgdGhpcy5jb250ZXh0LnRyYW5zbGF0ZSgteFJhbmdlWzBdLCAteVJhbmdlWzFdKVxuICAgIHRoaXMuY29udGV4dC5maWxsU3R5bGUgPSAncmdiYSgyMyw2NCwxNzAsMC4zKSdcbiAgfVxuXG4gIGk6IG51bWJlciA9IDBcblxuICBwdCA9ICh4OiBudW1iZXIsIHk6IG51bWJlcikgPT4ge1xuICAgIC8vIGlmICh0aGlzLmkgJSAxMDAgPT09IDApIGNvbnNvbGUubG9nKHRoaXMuaSwgJ3B0cycpXG4gICAgdGhpcy5jb250ZXh0LmJlZ2luUGF0aCgpXG4gICAgdGhpcy5jb250ZXh0LmFyYyh4LCB5LCAwLjAxLCAwLCAyICogTWF0aC5QSSlcbiAgICB0aGlzLmNvbnRleHQuZmlsbCgpXG4gICAgdGhpcy5jb250ZXh0LmNsb3NlUGF0aCgpXG4gICAgKyt0aGlzLmlcbiAgfVxuXG4gIEV4cGxvcmUoeDogbnVtYmVyLCB5OiBudW1iZXIpIHtcbiAgICB0aGlzLk0uZXZvbHZlKFt4LCB5XSwgMTAwMCwgdGhpcy5wdClcbiAgfVxuXG4gIC8vIFdlIHdlcmUgY29uc2lkZXJpbmcgc29tZSBhbHRlcm5hdGl2ZXM6IHRoZSBDUFMgb2YgU0lDTSwgYW5kIGdlbmVyYXRvcnMuXG4gIC8vIEZvciBzaW1wbGljaXR5IGluIEpTLCB0aG91Z2gsIHRoZSBjYWxsYmFjayBmb3JtIGNhbid0IHJlYWxseSBiZSBiZWF0LlxuXG4gIC8vIEV4cGxvcmUwKHg6IG51bWJlciwgeTogbnVtYmVyKSB7XG4gIC8vICAgZm9yIChsZXQgaSA9IDA7IGkgPCAxMDAwOyArK2kpIHtcbiAgLy8gICAgIHRoaXMuTS5ydW4oeCwgeSwgKHhwOiBudW1iZXIsIHlwOiBudW1iZXIpID0+IHtcbiAgLy8gICAgICAgdGhpcy5wdCh4cCwgeXApXG4gIC8vICAgICAgIHggPSB4cFxuICAvLyAgICAgICB5ID0geXBcbiAgLy8gICAgIH0sICgpID0+IHtcbiAgLy8gICAgICAgY29uc29sZS5sb2coJ0ZBSUwnKVxuICAvLyAgICAgfSlcbiAgLy8gICB9XG4gIC8vIH1cblxuICAvLyBFeHBsb3JlMSh4OiBudW1iZXIsIHk6IG51bWJlcikge1xuICAvLyAgIGZvciAoW3gsIHldIG9mIHRoaXMuTS5nZW5lcmF0ZSh4LCB5LCAxMDAwKSkge1xuICAvLyAgICAgdGhpcy5wdCh4LCB5KVxuICAvLyAgIH1cbiAgLy8gfVxufVxuIl19
