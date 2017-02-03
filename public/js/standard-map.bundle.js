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
        console.log('l', l, 'a', a, 'w', w, 'g', g);
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
        console.log('w', w, 'h', h);
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
        console.log('evolution start');
        this.M.evolve([x, y], 1000, this.pt);
        console.log('evolution end');
    };
    return ExploreMap;
}());
exports.ExploreMap = ExploreMap;

},{"odex/src/odex":1}]},{},[2])(2)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9ub2RlX21vZHVsZXMvb2RleC9zcmMvb2RleC50cyIsImpzL3N0YW5kYXJkLW1hcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBOzs7Ozs7Ozs7Ozs7Ozs7OztHQWlCRzs7QUFpQkgsSUFBWSxPQUlYO0FBSkQsV0FBWSxPQUFPO0lBQ2pCLCtDQUFTLENBQUE7SUFDVCw2REFBZ0IsQ0FBQTtJQUNoQixtREFBVyxDQUFBO0FBQ2IsQ0FBQyxFQUpXLE9BQU8sR0FBUCxlQUFPLEtBQVAsZUFBTyxRQUlsQjtBQUVEO0lBeUJFLGdCQUFZLENBQVM7UUFDbkIsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDVixJQUFJLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQTtRQUNyQixJQUFJLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQTtRQUNyQixJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQTtRQUMzQixJQUFJLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQTtRQUNwQixJQUFJLENBQUMsdUJBQXVCLEdBQUcsQ0FBQyxDQUFBO1FBQ2hDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxDQUFDLENBQUE7UUFDekIsSUFBSSxDQUFDLG1CQUFtQixHQUFHLENBQUMsQ0FBQTtRQUM1QixJQUFJLENBQUMsd0JBQXdCLEdBQUcsQ0FBQyxDQUFBO1FBQ2pDLElBQUksQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFBO1FBQ3hCLElBQUksQ0FBQyx5QkFBeUIsR0FBRyxJQUFJLENBQUE7UUFDckMsSUFBSSxDQUFDLGVBQWUsR0FBRyxTQUFTLENBQUE7UUFDaEMsSUFBSSxDQUFDLDBCQUEwQixHQUFHLENBQUMsQ0FBQTtRQUNuQyxJQUFJLENBQUMsdUJBQXVCLEdBQUcsR0FBRyxDQUFBO1FBQ2xDLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFBO1FBQ3hCLElBQUksQ0FBQyxZQUFZ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Q2IsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxHQUFHLEVBQUUsRUFBRSxDQUFDO3dCQUFFLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtvQkFDL0QsV0FBVztvQkFDWCxHQUFHLENBQUMsQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDLEVBQUUsR0FBRyxJQUFJLElBQUksRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDO3dCQUNyQyx5Q0FBeUM7d0JBQ3pDLElBQUksSUFBSSxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUE7d0JBQzVCLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7NEJBQ25DLElBQUksS0FBSyxHQUFHLFNBQUEsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUEsQ0FBQTs0QkFDckMsR0FBRyxHQUFHLE1BQU0sQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxHQUFHLENBQUE7NEJBQ25DLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0NBQzlCLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFBOzRCQUN0QyxDQUFDO3dCQUNILENBQUM7d0JBQ0QsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7NEJBQ3BDLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQTs0QkFDbEIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0NBQ25DLElBQUksTUFBTSxHQUFHLFNBQUEsQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFJLENBQUMsQ0FBQSxHQUFHLENBQUMsQ0FBQTtnQ0FDMUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxHQUFHLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQztvQ0FDOUIsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQTtnQ0FDMUUsQ0FBQzs0QkFDSCxDQUFDO3dCQUNILENBQUM7d0JBQ0QsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQTt3QkFDckIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxHQUFHLEVBQUUsRUFBRSxDQUFDOzRCQUFFLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTt3QkFDakUsRUFBRSxDQUFDLENBQUMsR0FBRyxLQUFLLElBQUksQ0FBQzs0QkFBQyxRQUFRLENBQUE7d0JBQzFCLHNCQUFzQjt3QkFDdEIsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7NEJBQ2hELElBQUksSUFBSSxHQUFHLE1BQU0sQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUE7NEJBQ3pCLElBQUksSUFBSSxHQUFHLE1BQU0sQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFBOzRCQUMvQixFQUFFLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxJQUFJLElBQUksS0FBSyxDQUFDLENBQUM7Z0NBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQTs0QkFDdEMsSUFBSSxDQUFDLFNBQVEsQ0FBQTs0QkFDYixHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxFQUFFLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dDQUNqQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEdBQUcsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDO29DQUM5QixLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtnQ0FDaEMsQ0FBQzs0QkFDSCxDQUFDOzRCQUNELEVBQUUsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLElBQUksSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0NBQzVCLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFBO2dDQUNaLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxFQUFFLEVBQUUsQ0FBQztvQ0FBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBOzRCQUMzRCxDQUFDO3dCQUNILENBQUM7d0JBQ0Qsc0JBQXNCO3dCQUN0QixHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQzs0QkFDaEQsSUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7NEJBQzdCLElBQUksSUFBSSxHQUFHLE1BQU0sQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFBOzRCQUMvQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLEVBQUUsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0NBQ3JDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7b0NBQzlCLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO2dDQUNoQyxDQUFDOzRCQUNILENBQUM7d0JBQ0gsQ0FBQztvQkFDSCxDQUFDO29CQUNELE1BQU0sQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFBO29CQUN2QixvQ0FBb0M7b0JBQ3BDLEVBQUUsQ0FBQyxDQUFDLEtBQUksQ0FBQyx5QkFBeUIsSUFBSSxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDaEQsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFBO3dCQUNkLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxFQUFFLEVBQUUsQ0FBQzs0QkFBRSxNQUFNLElBQUksU0FBQSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUksQ0FBQyxDQUFBLENBQUE7d0JBQzFGLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUMsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUE7d0JBQy9DLE1BQU0sR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFBLE1BQU0sRUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFBLEVBQUUsSUFBSSxDQUFDLENBQUE7d0JBQ3ZELEVBQUUsQ0FBQyxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDOzRCQUNoQixDQUFDLEdBQUcsTUFBTSxDQUFBOzRCQUNWLENBQUMsR0FBRyxJQUFJLENBQUE7NEJBQ1IsRUFBRSxPQUFPLENBQUE7NEJBQ1QsTUFBTSxHQUFHLElBQUksQ0FBQTs0QkFDYixNQUFNLENBQUMsSUFBSSxDQUFBO3dCQUNiLENBQUM7b0JBQ0gsQ0FBQztvQkFDRCxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUM7d0JBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQTtnQkFDN0MsQ0FBQztnQkFDRCxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtnQkFDM0MsRUFBRSxPQUFPLENBQUE7Z0JBQ1QsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztvQkFDWCw0REFBNEQ7b0JBQzVELEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFDdkMsS0FBSSxDQUFDLFdBQVcsSUFBSSxNQUFNLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLEtBQUssS0FBSyxDQUFDO3dCQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUE7Z0JBQ3ZGLENBQUM7Z0JBQ0Qsd0JBQXdCO2dCQUN4QixJQUFJLElBQVksQ0FBQTtnQkFDaEIsRUFBRSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ2IsSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQTtvQkFDMUIsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDO3dCQUFDLElBQUksR0FBRyxDQUFDLENBQUE7Z0JBQ3RCLENBQUM7Z0JBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ04sRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ1osSUFBSSxHQUFHLEVBQUUsQ0FBQTt3QkFDVCxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFJLENBQUMsWUFBWSxDQUFDOzRCQUFDLElBQUksR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFBO3dCQUN4RCxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxLQUFJLENBQUMsWUFBWSxDQUFDOzRCQUFDLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFBO29CQUM1RSxDQUFDO29CQUFDLElBQUksQ0FBQyxDQUFDO3dCQUNOLElBQUksR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFBO3dCQUNiLEVBQUUsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLEtBQUksQ0FBQyxZQUFZLENBQUM7NEJBQUMsSUFBSSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUE7d0JBQ3RFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSSxDQUFDLFlBQVksQ0FBQzs0QkFBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFBO29CQUN0RSxDQUFDO2dCQUNILENBQUM7Z0JBQ0Qsd0JBQXdCO2dCQUN4QixFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO29CQUNYLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQTtvQkFDdEIsQ0FBQyxHQUFHLE1BQU0sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO29CQUNuRCxNQUFNLEdBQUcsS0FBSyxDQUFBO29CQUNkLE1BQU0sQ0FBQyxJQUFJLENBQUEsQ0FBRSxVQUFVO2dCQUN6QixDQUFDO2dCQUNELEVBQUUsQ0FBQyxDQUFDLElBQUksSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUNmLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUE7Z0JBQ2QsQ0FBQztnQkFBQyxJQUFJLENBQUMsQ0FBQztvQkFDTixFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLEtBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO3dCQUNwRCxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFBO29CQUNsQyxDQUFDO29CQUFDLElBQUksQ0FBQyxDQUFDO3dCQUNOLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQTtvQkFDOUIsQ0FBQztnQkFHSCxDQUFDO2dCQUNELGlDQUFpQztnQkFDakMsQ0FBQyxHQUFHLElBQUksQ0FBQTtnQkFDUixDQUFDLEdBQUcsTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUE7Z0JBQ3hCLE1BQU0sQ0FBQyxJQUFJLENBQUE7WUFDYixDQUFDLENBQUE7WUFFRCxJQUFJLEtBQUssR0FBRyxVQUFDLENBQVM7Z0JBQ3BCLElBQU0sRUFBRSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSSxDQUFDLENBQUMsQ0FBQyxDQUFBO2dCQUM3Qix1REFBdUQ7Z0JBQ3ZELGtEQUFrRDtnQkFDbEQsSUFBTSxFQUFFLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQTtnQkFDcEIsc0JBQXNCO2dCQUN0QixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEtBQUksQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQztvQkFDakMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtvQkFDYixHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7Z0JBQzVCLENBQUM7Z0JBQ0QseUJBQXlCO2dCQUN6QixJQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO2dCQUNuQixJQUFNLEtBQUssR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7Z0JBQzdCLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7b0JBQy9CLEVBQUUsQ0FBQyxDQUFDLEtBQUksQ0FBQyxXQUFXLElBQUksRUFBRSxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUM7d0JBQ3JDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7NEJBQzlCLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7d0JBQzVCLENBQUM7b0JBQ0gsQ0FBQztvQkFDRCxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFBO29CQUN2QixFQUFFLENBQUMsQ0FBQyxLQUFJLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDMUQsRUFBRSxHQUFHLENBQUE7d0JBQ0wsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxHQUFHLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQzs0QkFDOUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTt3QkFDN0IsQ0FBQztvQkFDSCxDQUFDO29CQUNELEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksS0FBSSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDO3dCQUNqQyxJQUFJLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUE7d0JBQ2YsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQTt3QkFDZixHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFBO29CQUM5QixDQUFDO29CQUNELEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxLQUFJLENBQUMsbUJBQW1CLElBQUksQ0FBQyxJQUFJLEtBQUksQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUM7d0JBQ3pFLGtCQUFrQjt3QkFDbEIsSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFBO3dCQUNaLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksS0FBSSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDOzRCQUNqQyxJQUFJLElBQUksU0FBQSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBSSxDQUFDLENBQUEsQ0FBQTt3QkFDaEMsQ0FBQzt3QkFDRCxJQUFJLElBQUksR0FBRyxDQUFDLENBQUE7d0JBQ1osR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxLQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7NEJBQ2pDLElBQUksSUFBSSxTQUFBLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUksQ0FBQyxDQUFBLENBQUE7d0JBQzFDLENBQUM7d0JBQ0QsSUFBTSxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQTt3QkFDL0MsRUFBRSxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7NEJBQ2IsRUFBRSxLQUFLLENBQUE7NEJBQ1AsSUFBSSxHQUFHLElBQUksQ0FBQTs0QkFDWCxDQUFDLElBQUksS0FBSSxDQUFDLHVCQUF1QixDQUFBOzRCQUNqQyxNQUFNLEdBQUcsSUFBSSxDQUFBOzRCQUNiLE1BQU0sQ0FBQTt3QkFDUixDQUFDO29CQUNILENBQUM7Z0JBQ0gsQ0FBQztnQkFDRCx1QkFBdUI7Z0JBQ3ZCLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQTtnQkFDakIsRUFBRSxDQUFDLENBQUMsS0FBSSxDQUFDLFdBQVcsSUFBSSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUMzQyxFQUFFLEdBQUcsQ0FBQTtvQkFDTCxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEdBQUcsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDO3dCQUM5QixLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO29CQUM3QixDQUFDO2dCQUNILENBQUM7Z0JBQ0QsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxLQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7b0JBQ2pDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtnQkFDOUMsQ0FBQztnQkFDRCxLQUFLLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFBO2dCQUNkLDJCQUEyQjtnQkFDM0IsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFBQyxNQUFNLENBQUEsQ0FBRSxhQUFhO2dCQUNsQyxJQUFNLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7Z0JBQ3BCLElBQUksR0FBVyxDQUFBO2dCQUNmLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7b0JBQzNCLEdBQUcsR0FBRyxTQUFBLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBSSxDQUFDLENBQUEsR0FBRyxDQUFDLENBQUE7b0JBQ25DLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksS0FBSSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDO3dCQUNqQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFBO29CQUN2RCxDQUFDO2dCQUNILENBQUM7Z0JBQ0QsR0FBRyxHQUFHLENBQUMsQ0FBQTtnQkFDUCxVQUFVO2dCQUNWLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksS0FBSSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDO29CQUNqQyxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO29CQUNyRCxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUE7b0JBQ2pDLEdBQUcsSUFBSSxTQUFBLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUksQ0FBQyxDQUFBLENBQUE7Z0JBQzdDLENBQUM7Z0JBQ0QsR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLEtBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQTtnQkFDN0IsRUFBRSxDQUFDLENBQUMsR0FBRyxHQUFHLEtBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUN2RCxJQUFJLEdBQUcsSUFBSSxDQUFBO29CQUNYLENBQUMsSUFBSSxLQUFJLENBQUMsdUJBQXVCLENBQUE7b0JBQ2pDLE1BQU0sR0FBRyxJQUFJLENBQUE7b0JBQ2IsTUFBTSxDQUFBO2dCQUNSLENBQUM7Z0JBQ0QsTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FB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QUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQTt3QkFDaEMsRUFBRSxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7NEJBQ2QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7NEJBQzNDLEVBQUUsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dDQUNkLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLElBQUksSUFBSSxFQUFFLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQztvQ0FDckMsSUFBSSxJQUFJLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtvQ0FDNUIsSUFBSSxJQUFJLEdBQUcsSUFBSSxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtvQ0FDekMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQTtnQ0FDMUUsQ0FBQzs0QkFDSCxDQUFDO3dCQUNILENBQUM7b0JBQ0gsQ0FBQztvQkFDRCxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUE7b0JBQ2hDLEVBQUUsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUNkLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUE7d0JBQ3ZDLEVBQUUsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDOzRCQUNkLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLElBQUksSUFBSSxFQUFFLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQ0FDckMsSUFBSSxJQUFJLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtnQ0FDNUIsSUFBSSxJQUFJLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFBO2dDQUM5QyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFBOzRCQUMxRSxDQUFDO3dCQUNILENBQUM7b0JBQ0gsQ0FBQztvQkFDRCxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRSxJQUFJLElBQUksRUFBRSxFQUFFLEVB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Q0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUM5QyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsR0FBRyxxQkFBcUIsQ0FBQTtJQUNoRCxDQUFDO0lBYUQsNEJBQU8sR0FBUCxVQUFRLENBQVMsRUFBRSxDQUFTO1FBQzFCLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsQ0FBQTtRQUM5QixJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQ3BDLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLENBQUE7SUFDOUIsQ0FBQztJQXNCSCxpQkFBQztBQUFELENBMURBLEFBMERDLElBQUE7QUExRFksZ0NBQVUiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBBbiBpbXBsZW1lbnRhdGlvbiBvZiBPREVYLCBieSBFLiBIYWlyZXIgYW5kIEcuIFdhbm5lciwgcG9ydGVkIGZyb20gdGhlIEZvcnRyYW4gT0RFWC5GLlxuICogVGhlIG9yaWdpbmFsIHdvcmsgY2FycmllcyB0aGUgQlNEIDItY2xhdXNlIGxpY2Vuc2UsIGFuZCBzbyBkb2VzIHRoaXMuXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE2IENvbGluIFNtaXRoLlxuICogMS4gUmVkaXN0cmlidXRpb25zIG9mIHNvdXJjZSBjb2RlIG11c3QgcmV0YWluIHRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlLCB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZ1xuICogZGlzY2xhaW1lci5cbiAqIDIuIFJlZGlzdHJpYnV0aW9ucyBpbiBiaW5hcnkgZm9ybSBtdXN0IHJlcHJvZHVjZSB0aGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSwgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZVxuICogZm9sbG93aW5nIGRpc2NsYWltZXIgaW4gdGhlIGRvY3VtZW50YXRpb24gYW5kL29yIG90aGVyIG1hdGVyaWFscyBwcm92aWRlZCB3aXRoIHRoZSBkaXN0cmlidXRpb24uXG4gKlxuICogVEhJUyBTT0ZUV0FSRSBJUyBQUk9WSURFRCBCWSBUSEUgQ09QWVJJR0hUIEhPTERFUlMgQU5EIENPTlRSSUJVVE9SUyBcIkFTIElTXCIgQU5EIEFOWSBFWFBSRVNTIE9SIElNUExJRUQgV0FSUkFOVElFUyxcbiAqIElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBUSEUgSU1QTElFRCBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSBBTkQgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0VcbiAqIEFSRSBESVNDTEFJTUVELiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQ09QWVJJR0hUIEhPTERFUiBPUiBDT05UUklCVVRPUlMgQkUgTElBQkxFIEZPUiBBTlkgRElSRUNULCBJTkRJUkVDVCxcbiAqIElOQ0lERU5UQUwsIFNQRUNJQUwsIEVYRU1QTEFSWSwgT1IgQ09OU0VRVUVOVElBTCBEQU1BR0VTIChJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgUFJPQ1VSRU1FTlQgT0YgU1VCU1RJVFVURVxuICogR09PRFMgT1IgU0VSVklDRVM7IExPU1MgT0YgVVNFLCBEQVRBLCBPUiBQUk9GSVRTOyBPUiBCVVNJTkVTUyBJTlRFUlJVUFRJT04pIEhPV0VWRVIgQ0FVU0VEIEFORCBPTiBBTlkgVEhFT1JZIE9GXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQ09OVFJBQ1QsIFNUUklDVCBMSUFCSUxJVFksIE9SIFRPUlQgKElOQ0xVRElORyBORUdMSUdFTkNFIE9SIE9USEVSV0lTRSkgQVJJU0lORyBJTiBBTlkgV0FZXG4gKiBPVVQgT0YgVEhFIFVTRSBPRiBUSElTIFNPRlRXQVJFLCBFVkVOIElGIEFEVklTRUQgT0YgVEhFIFBPU1NJQklMSVRZIE9GIFNVQ0ggREFNQUdFLlxuICovXG5cbmV4cG9ydCBpbnRlcmZhY2UgRGVyaXZhdGl2ZSB7ICAvLyBmdW5jdGlvbiBjb21wdXRpbmcgdGhlIHZhbHVlIG9mIFknID0gRih4LFkpXG4gICh4OiBudW1iZXIsICAgICAgICAgICAvLyBpbnB1dCB4IHZhbHVlXG4gICB5OiBudW1iZXJbXSkgICAgICAgICAvLyBpbnB1dCB5IHZhbHVlKVxuICAgIDogbnVtYmVyW10gICAgICAgICAgLy8gb3V0cHV0IHknIHZhbHVlcyAoQXJyYXkgb2YgbGVuZ3RoIG4pXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3V0cHV0RnVuY3Rpb24geyAgICAgICAgICAgICAgICAgICAgLy8gdmFsdWUgY2FsbGJhY2tcbiAgKG5yOiBudW1iZXIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBzdGVwIG51bWJlclxuICAgeG9sZDogbnVtYmVyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGxlZnQgZWRnZSBvZiBzb2x1dGlvbiBpbnRlcnZhbFxuICAgeDogbnVtYmVyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJpZ2h0IGVkZ2Ugb2Ygc29sdXRpb24gaW50ZXJ2YWwgKHkgPSBGKHgpKVxuICAgeTogbnVtYmVyW10sICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEYoeClcbiAgIGRlbnNlPzogKGM6IG51bWJlciwgeDogbnVtYmVyKSA9PiBudW1iZXIpICAvLyBkZW5zZSBpbnRlcnBvbGF0b3IuIFZhbGlkIGluIHRoZSByYW5nZSBbeCwgeG9sZCkuXG4gICAgOiBib29sZWFufHZvaWQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmV0dXJuIGZhbHNlIHRvIGhhbHQgaW50ZWdyYXRpb25cbn1cblxuZXhwb3J0IGVudW0gT3V0Y29tZSB7XG4gIENvbnZlcmdlZCxcbiAgTWF4U3RlcHNFeGNlZWRlZCxcbiAgRWFybHlSZXR1cm5cbn1cblxuZXhwb3J0IGNsYXNzIFNvbHZlciB7XG4gIG46IG51bWJlciAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGRpbWVuc2lvbiBvZiB0aGUgc3lzdGVtXG4gIHVSb3VuZDogbnVtYmVyICAgICAgICAgICAgICAgICAgICAgIC8vIFdPUksoMSksIG1hY2hpbmUgZXBzaWxvbi4gKFdPUkssIElXT1JLIGFyZSByZWZlcmVuY2VzIHRvIG9kZXguZilcbiAgbWF4U3RlcHM6IG51bWJlciAgICAgICAgICAgICAgICAgICAgLy8gSVdPUksoMSksIHBvc2l0aXZlIGludGVnZXJcbiAgaW5pdGlhbFN0ZXBTaXplOiBudW1iZXIgICAgICAgICAgICAgLy8gSFxuICBtYXhTdGVwU2l6ZTogbnVtYmVyICAgICAgICAgICAgICAgICAvLyBXT1JLKDIpLCBtYXhpbWFsIHN0ZXAgc2l6ZSwgZGVmYXVsdCB4RW5kIC0geFxuICBtYXhFeHRyYXBvbGF0aW9uQ29sdW1uczogbnVtYmVyICAgICAvLyBJV09SSygyKSwgS00sIHBvc2l0aXZlIGludGVnZXJcbiAgc3RlcFNpemVTZXF1ZW5jZTogbnVtYmVyICAgICAgICAgICAgLy8gSVdPUksoMyksIGluIFsxLi41XVxuICBzdGFiaWxpdHlDaGVja0NvdW50OiBudW1iZXIgICAgICAgICAvLyBJV09SSyg0KSwgaW5cbiAgc3RhYmlsaXR5Q2hlY2tUYWJsZUxpbmVzOiBudW1iZXIgICAgLy8gSVdPUksoNSksIHBvc2l0aXZlIGludGVnZXJcbiAgZGVuc2VPdXRwdXQ6IGJvb2xlYW4gICAgICAgICAgICAgICAgLy8gSU9VVCA+PSAyLCB0cnVlIG1lYW5zIGRlbnNlIG91dHB1dCBpbnRlcnBvbGF0b3IgcHJvdmlkZWQgdG8gc29sT3V0XG4gIGRlbnNlT3V0cHV0RXJyb3JFc3RpbWF0b3I6IGJvb2xlYW4gIC8vIElXT1JLKDYpLCByZXZlcnNlZCBzZW5zZSBmcm9tIHRoZSBGT1JUUkFOIGNvZGVcbiAgZGVuc2VDb21wb25lbnRzOiBudW1iZXJbXSAgICAgICAgICAgLy8gSVdPUksoOCkgJiBJV09SSygyMSwuLi4pLCBjb21wb25lbnRzIGZvciB3aGljaCBkZW5zZSBvdXRwdXQgaXMgcmVxdWlyZWRcbiAgaW50ZXJwb2xhdGlvbkZvcm11bGFEZWdyZWU6IG51bWJlciAgLy8gSVdPUksoNyksIMK1ID0gMiAqIGsgLSBpbnRlcnBvbGF0aW9uRm9ybXVsYURlZ3JlZSArIDEgWzEuLjZdLCBkZWZhdWx0IDRcbiAgc3RlcFNpemVSZWR1Y3Rpb25GYWN0b3I6IG51bWJlciAgICAgLy8gV09SSygzKSwgZGVmYXVsdCAwLjVcbiAgc3RlcFNpemVGYWMxOiBudW1iZXIgICAgICAgICAgICAgICAgLy8gV09SSyg0KVxuICBzdGVwU2l6ZUZhYzI6IG51bWJlciAgICAgICAgICAgICAgICAvLyBXT1JLKDUpXG4gIHN0ZXBTaXplRmFjMzogbnVtYmVyICAgICAgICAgICAgICAgIC8vIFdPUksoNilcbiAgc3RlcFNpemVGYWM0OiBudW1iZXIgICAgICAgICAgICAgICAgLy8gV09SSyg3KVxuICBzdGVwU2FmZXR5RmFjdG9yMTogbnVtYmVyICAgICAgICAgICAvLyBXT1JLKDgpXG4gIHN0ZXBTYWZldHlGYWN0b3IyOiBudW1iZXIgICAgICAgICAgIC8vIFdPUksoOSlcbiAgcmVsYXRpdmVUb2xlcmFuY2U6IG51bWJlcnxudW1iZXJbXSAgLy8gUlRPTC4gQ2FuIGJlIGEgc2NhbGFyIG9yIHZlY3RvciBvZiBsZW5ndGggTi5cbiAgYWJzb2x1dGVUb2xlcmFuY2U6IG51bWJlcnxudW1iZXJbXSAgLy8gQVRPTC4gQ2FuIGJlIGEgc2NhbGFyIG9yIHZlY3RvciBvZiBsZW5ndGggTi5cbiAgZGVidWc6IGJvb2xlYW5cblxuICBjb25zdHJ1Y3RvcihuOiBudW1iZXIpIHtcbiAgICB0aGlzLm4gPSBuXG4gICAgdGhpcy51Um91bmQgPSAyLjNlLTE2XG4gICAgdGhpcy5tYXhTdGVwcyA9IDEwMDAwXG4gICAgdGhpcy5pbml0aWFsU3RlcFNpemUgPSAxZS00XG4gICAgdGhpcy5tYXhTdGVwU2l6ZSA9IDBcbiAgICB0aGlzLm1heEV4dHJhcG9sYXRpb25Db2x1bW5zID0gOVxuICAgIHRoaXMuc3RlcFNpemVTZXF1ZW5jZSA9IDBcbiAgICB0aGlzLnN0YWJpbGl0eUNoZWNrQ291bnQgPSAxXG4gICAgdGhpcy5zdGFiaWxpdHlDaGVja1RhYmxlTGluZXMgPSAyXG4gICAgdGhpcy5kZW5zZU91dHB1dCA9IGZhbHNlXG4gICAgdGhpcy5kZW5zZU91dHB1dEVycm9yRXN0aW1hdG9yID0gdHJ1ZVxuICAgIHRoaXMuZGVuc2VDb21wb25lbnRzID0gdW5kZWZpbmVkXG4gICAgdGhpcy5pbnRlcnBvbGF0aW9uRm9ybXVsYURlZ3JlZSA9IDRcbiAgICB0aGlzLnN0ZXBTaXplUmVkdWN0aW9uRmFjdG9yID0gMC41XG4gICAgdGhpcy5zdGVwU2l6ZUZhYzEgPSAwLjAyXG4gICAgdGhpcy5zdGVwU2l6ZUZhYzIgPSA0LjBcbiAgICB0aGlzLnN0ZXBTaXplRmFjMyA9IDAuOFxuICAgIHRoaXMuc3RlcFNpemVGYWM0ID0gMC45XG4gICAgdGhpcy5zdGVwU2FmZXR5RmFjdG9yMSA9IDAuNjVcbiAgICB0aGlzLnN0ZXBTYWZldHlGYWN0b3IyID0gMC45NFxuICAgIHRoaXMucmVsYXRpdmVUb2xlcmFuY2UgPSAxZS01XG4gICAgdGhpcy5hYnNvbHV0ZVRvbGVyYW5jZSA9IDFlLTVcbiAgICB0aGlzLmRlYnVnID0gZmFsc2VcbiAgfVxuXG4gIGdyaWQoZHQ6IG51bWJlciwgb3V0OiAoeE91dDogbnVtYmVyLCB5T3V0OiBudW1iZXJbXSkgPT4gYW55KTogT3V0cHV0RnVuY3Rpb24ge1xuICAgIGxldCBjb21wb25lbnRzOiBudW1iZXJbXSA9IHRoaXMuZGVuc2VDb21wb25lbnRzXG4gICAgaWYgKCFjb21wb25lbnRzKSB7XG4gICAgICBjb21wb25lbnRzID0gW11cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uOyArK2kpIGNvbXBvbmVudHMucHVzaChpKVxuICAgIH1cbiAgICBsZXQgdDogbnVtYmVyXG4gICAgcmV0dXJuIChuOiBudW1iZXIsIHhPbGQ6IG51bWJlciwgeDogbnVtYmVyLCB5OiBudW1iZXJbXSwgaW50ZXJwb2xhdGU6IChpOiBudW1iZXIsIHg6IG51bWJlcikgPT4gbnVtYmVyKSA9PiB7XG4gICAgICBpZiAobiA9PT0gMSkge1xuICAgICAgICBvdXQoeCwgeSlcbiAgICAgICAgdCA9IHggKyBkdFxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIHdoaWxlICh0IDw9IHgpIHtcbiAgICAgICAgbGV0IHlmOiBudW1iZXJbXSA9IFtdXG4gICAgICAgIGZvciAobGV0IGkgb2YgY29tcG9uZW50cykge1xuICAgICAgICAgIHlmLnB1c2goaW50ZXJwb2xhdGUoaSwgdCkpXG4gICAgICAgIH1cbiAgICAgICAgb3V0KHQsIHlmKVxuICAgICAgICB0ICs9IGR0XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gcmV0dXJuIGEgMS1iYXNlZCBhcnJheSBvZiBsZW5ndGggbi4gSW5pdGlhbCB2YWx1ZXMgdW5kZWZpbmVkLlxuICBwcml2YXRlIHN0YXRpYyBkaW0gPSAobjogbnVtYmVyKSA9PiBBcnJheShuICsgMSlcbiAgcHJpdmF0ZSBzdGF0aWMgbG9nMTAgPSAoeDogbnVtYmVyKSA9PiBNYXRoLmxvZyh4KSAvIE1hdGguTE4xMFxuXG4gIC8vIE1ha2UgYSAxLWJhc2VkIDJEIGFycmF5LCB3aXRoIHIgcm93cyBhbmQgYyBjb2x1bW5zLiBUaGUgaW5pdGlhbCB2YWx1ZXMgYXJlIHVuZGVmaW5lZC5cbiAgcHJpdmF0ZSBzdGF0aWMgZGltMihyOiBudW1iZXIsIGM6IG51bWJlcik6IG51bWJlcltdW10ge1xuICAgIGxldCBhID0gbmV3IEFycmF5KHIgKyAxKVxuICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IHI7ICsraSkgYVtpXSA9IFNvbHZlci5kaW0oYylcbiAgICByZXR1cm4gYVxuICB9XG5cbiAgLy8gR2VuZXJhdGUgc3RlcCBzaXplIHNlcXVlbmNlIGFuZCByZXR1cm4gYXMgYSAxLWJhc2VkIGFycmF5IG9mIGxlbmd0aCBuLlxuICBzdGF0aWMgc3RlcFNpemVTZXF1ZW5jZShuU2VxOiBudW1iZXIsIG46IG51bWJlcik6IG51bWJlcltdIHtcbiAgICBjb25zdCBhID0gbmV3IEFycmF5KG4gKyAxKVxuICAgIGFbMF0gPSAwXG4gICAgc3dpdGNoIChuU2VxKSB7XG4gICAgICBjYXNlIDE6XG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG47ICsraSkgYVtpXSA9IDIgKiBpXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlIDI6XG4gICAgICAgIGFbMV0gPSAyXG4gICAgICAgIGZvciAobGV0IGkgPSAyOyBpIDw9IG47ICsraSkgYVtpXSA9IDQgKiBpIC0gNFxuICAgICAgICBicmVha1xuICAgICAgY2FzZSAzOlxuICAgICAgICBhWzFdID0gMlxuICAgICAgICBhWzJdID0gNFxuICAgICAgICBhWzNdID0gNlxuICAgICAgICBmb3IgKGxldCBpID0gNDsgaSA8PSBuOyArK2kpIGFbaV0gPSAyICogYVtpIC0gMl1cbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgNDpcbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbjsgKytpKSBhW2ldID0gNCAqIGkgLSAyXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlIDU6XG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG47ICsraSkgYVtpXSA9IDQgKiBpXG4gICAgICAgIGJyZWFrXG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2ludmFsaWQgc3RlcFNpemVTZXF1ZW5jZSBzZWxlY3RlZCcpXG4gICAgfVxuICAgIHJldHVybiBhXG4gIH1cblxuICAvLyBJbnRlZ3JhdGUgdGhlIGRpZmZlcmVudGlhbCBzeXN0ZW0gcmVwcmVzZW50ZWQgYnkgZiwgZnJvbSB4IHRvIHhFbmQsIHdpdGggaW5pdGlhbCBkYXRhIHkuXG4gIC8vIHNvbE91dCwgaWYgcHJvdmlkZWQsIGlzIGNhbGxlZCBhdCBlYWNoIGludGVncmF0aW9uIHN0ZXAuXG4gIHNvbHZlKGY6IERlcml2YXRpdmUsXG4gICAgICAgIHg6IG51bWJlcixcbiAgICAgICAgeTA6IG51bWJlcltdLFxuICAgICAgICB4RW5kOiBudW1iZXIsXG4gICAgICAgIHNvbE91dD86IE91dHB1dEZ1bmN0aW9uKSB7XG5cbiAgICAvLyBNYWtlIGEgY29weSBvZiB5MCwgMS1iYXNlZC4gV2UgbGVhdmUgdGhlIHVzZXIncyBwYXJhbWV0ZXJzIGFsb25lIHNvIHRoYXQgdGhleSBtYXkgYmUgcmV1c2VkIGlmIGRlc2lyZWQuXG4gICAgbGV0IHkgPSBbMF0uY29uY2F0KHkwKVxuICAgIGxldCBkeiA9IFNvbHZlci5kaW0odGhpcy5uKVxuICAgIGxldCB5aDEgPSBTb2x2ZXIuZGltKHRoaXMubilcbiAgICBsZXQgeWgyID0gU29sdmVyLmRpbSh0aGlzLm4pXG4gICAgaWYgKHRoaXMubWF4U3RlcHMgPD0gMCkgdGhyb3cgbmV3IEVycm9yKCdtYXhTdGVwcyBtdXN0IGJlIHBvc2l0aXZlJylcbiAgICBjb25zdCBrbSA9IHRoaXMubWF4RXh0cmFwb2xhdGlvbkNvbHVtbnNcbiAgICBpZiAoa20gPD0gMikgdGhyb3cgbmV3IEVycm9yKCdtYXhFeHRyYXBvbGF0aW9uQ29sdW1ucyBtdXN0IGJlID4gMicpXG4gICAgY29uc3QgblNlcSA9IHRoaXMuc3RlcFNpemVTZXF1ZW5jZSB8fCAodGhpcy5kZW5zZU91dHB1dCA/IDQgOiAxKVxuICAgIGlmIChuU2VxIDw9IDMgJiYgdGhpcy5kZW5zZU91dHB1dCkgdGhyb3cgbmV3IEVycm9yKCdzdGVwU2l6ZVNlcXVlbmNlIGluY29tcGF0aWJsZSB3aXRoIGRlbnNlT3V0cHV0JylcbiAgICBpZiAodGhpcy5kZW5zZU91dHB1dCAmJiAhc29sT3V0KSB0aHJvdyBuZXcgRXJyb3IoJ2RlbnNlT3V0cHV0IHJlcXVpcmVzIGEgc29sdXRpb24gb2JzZXJ2ZXIgZnVuY3Rpb24nKVxuICAgIGlmICh0aGlzLmludGVycG9sYXRpb25Gb3JtdWxhRGVncmVlIDw9IDAgfHwgdGhpcy5pbnRlcnBvbGF0aW9uRm9ybXVsYURlZ3JlZSA+PSA3KSB0aHJvdyBuZXcgRXJyb3IoJ2JhZCBpbnRlcnBvbGF0aW9uRm9ybXVsYURlZ3JlZScpXG4gICAgbGV0IGljb20gPSBbMF0gIC8vIGljb20gd2lsbCBiZSAxLWJhc2VkLCBzbyBzdGFydCB3aXRoIGEgcGFkIGVudHJ5LlxuICAgIGxldCBucmRlbnMgPSAwXG4gICAgaWYgKHRoaXMuZGVuc2VPdXRwdXQpIHtcbiAgICAgIGlmICh0aGlzLmRlbnNlQ29tcG9uZW50cykge1xuICAgICAgICBmb3IgKGxldCBjIG9mIHRoaXMuZGVuc2VDb21wb25lbnRzKSB7XG4gICAgICAgICAgLy8gY29udmVydCBkZW5zZSBjb21wb25lbnRzIHJlcXVlc3RlZCBpbnRvIG9uZS1iYXNlZCBpbmRleGluZy5cbiAgICAgICAgICBpZiAoYyA8IDAgfHwgYyA+IHRoaXMubikgdGhyb3cgbmV3IEVycm9yKCdiYWQgZGVuc2UgY29tcG9uZW50OiAnICsgYylcbiAgICAgICAgICBpY29tLnB1c2goYyArIDEpXG4gICAgICAgICAgKytucmRlbnNcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gaWYgdXNlciBhc2tlZCBmb3IgZGVuc2Ugb3V0cHV0IGJ1dCBkaWQgbm90IHNwZWNpZnkgYW55IGRlbnNlQ29tcG9uZW50cyxcbiAgICAgICAgLy8gcmVxdWVzdCBhbGwgb2YgdGhlbS5cbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gdGhpcy5uOyArK2kpIHtcbiAgICAgICAgICBpY29tLnB1c2goaSlcbiAgICAgICAgfVxuICAgICAgICBucmRlbnMgPSB0aGlzLm5cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRoaXMudVJvdW5kIDw9IDFlLTM1IHx8IHRoaXMudVJvdW5kID4gMSkgdGhyb3cgbmV3IEVycm9yKCdzdXNwaWNpb3VzIHZhbHVlIG9mIHVSb3VuZCcpXG4gICAgY29uc3QgaE1heCA9IE1hdGguYWJzKHRoaXMubWF4U3RlcFNpemUgfHwgeEVuZCAtIHgpXG4gICAgY29uc3QgbGZTYWZlID0gMiAqIGttICoga20gKyBrbVxuXG4gICAgZnVuY3Rpb24gZXhwYW5kVG9BcnJheSh4OiBudW1iZXJ8bnVtYmVyW10sIG46IG51bWJlcik6IG51bWJlcltdIHtcbiAgICAgIC8vIElmIHggaXMgYW4gYXJyYXksIHJldHVybiBhIDEtYmFzZWQgY29weSBvZiBpdC4gSWYgeCBpcyBhIG51bWJlciwgcmV0dXJuIGEgbmV3IDEtYmFzZWQgYXJyYXlcbiAgICAgIC8vIGNvbnNpc3Rpbmcgb2YgbiBjb3BpZXMgb2YgdGhlIG51bWJlci5cbiAgICAgIGNvbnN0IHRvbEFycmF5ID0gWzBdXG4gICAgICBpZiAoQXJyYXkuaXNBcnJheSh4KSkge1xuICAgICAgICByZXR1cm4gdG9sQXJyYXkuY29uY2F0KHgpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG47ICsraSkgdG9sQXJyYXkucHVzaCh4KVxuICAgICAgICByZXR1cm4gdG9sQXJyYXlcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBhVG9sID0gZXhwYW5kVG9BcnJheSh0aGlzLmFic29sdXRlVG9sZXJhbmNlLCB0aGlzLm4pXG4gICAgY29uc3QgclRvbCA9IGV4cGFuZFRvQXJyYXkodGhpcy5yZWxhdGl2ZVRvbGVyYW5jZSwgdGhpcy5uKVxuICAgIGxldCBbbkV2YWwsIG5TdGVwLCBuQWNjZXB0LCBuUmVqZWN0XSA9IFswLCAwLCAwLCAwXVxuXG4gICAgLy8gY2FsbCB0byBjb3JlIGludGVncmF0b3JcbiAgICBjb25zdCBucmQgPSBNYXRoLm1heCgxLCBucmRlbnMpXG4gICAgY29uc3QgbmNvbSA9IE1hdGgubWF4KDEsICgyICoga20gKyA1KSAqIG5yZGVucylcbiAgICBjb25zdCBkZW5zID0gU29sdmVyLmRpbShuY29tKVxuICAgIGNvbnN0IGZTYWZlID0gU29sdmVyLmRpbTIobGZTYWZlLCBucmQpXG5cbiAgICAvLyBXcmFwIGYgaW4gYSBmdW5jdGlvbiBGIHdoaWNoIGhpZGVzIHRoZSBvbmUtYmFzZWQgaW5kZXhpbmcgZnJvbSB0aGUgY3VzdG9tZXJzLlxuICAgIGNvbnN0IEYgPSAoeDogbnVtYmVyLCB5OiBudW1iZXJbXSwgeXA6IG51bWJlcltdKSA9PiB7XG4gICAgICBsZXQgcmV0ID0gZih4LCB5LnNsaWNlKDEpKVxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZXQubGVuZ3RoOyArK2kpIHlwW2kgKyAxXSA9IHJldFtpXVxuICAgIH1cblxuICAgIGxldCBvZHhjb3IgPSAoKTogT3V0Y29tZSA9PiB7XG4gICAgICAvLyBUaGUgZm9sbG93aW5nIHRocmVlIHZhcmlhYmxlcyBhcmUgQ09NTU9OL0NPTlRFWC9cbiAgICAgIGxldCB4T2xkZDogbnVtYmVyXG4gICAgICBsZXQgaGhoOiBudW1iZXJcbiAgICAgIGxldCBrbWl0OiBudW1iZXJcblxuICAgICAgbGV0IGFjY2VwdFN0ZXAgPSAobjogbnVtYmVyKTogYm9vbGVhbiA9PiB7ICAgLy8gbGFiZWwgNjBcbiAgICAgICAgLy8gUmV0dXJucyB0cnVlIGlmIHdlIHNob3VsZCBjb250aW51ZSB0aGUgaW50ZWdyYXRpb24uIFRoZSBvbmx5IHRpbWUgZmFsc2VcbiAgICAgICAgLy8gaXMgcmV0dXJuZWQgaXMgd2hlbiB0aGUgdXNlcidzIHNvbHV0aW9uIG9ic2VydmF0aW9uIGZ1bmN0aW9uIGhhcyByZXR1cm5lZCBmYWxzZSxcbiAgICAgICAgLy8gaW5kaWNhdGluZyB0aGF0IHNoZSBkb2VzIG5vdCB3aXNoIHRvIGNvbnRpbnVlIHRoZSBjb21wdXRhdGlvbi5cbiAgICAgICAgeE9sZCA9IHhcbiAgICAgICAgeCArPSBoXG4gICAgICAgIGlmICh0aGlzLmRlbnNlT3V0cHV0KSB7XG4gICAgICAgICAgLy8ga21pdCA9IG11IG9mIHRoZSBwYXBlclxuICAgICAgICAgIGttaXQgPSAyICoga2MgLSB0aGlzLmludGVycG9sYXRpb25Gb3JtdWxhRGVncmVlICsgMVxuICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG5yZDsgKytpKSBkZW5zW2ldID0geVtpY29tW2ldXVxuICAgICAgICAgIHhPbGRkID0geE9sZFxuICAgICAgICAgIGhoaCA9IGggIC8vIG5vdGU6IHhPbGRkIGFuZCBoaGggYXJlIHBhcnQgb2YgL0NPTk9EWC9cbiAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBucmQ7ICsraSkgZGVuc1tucmQgKyBpXSA9IGggKiBkeltpY29tW2ldXVxuICAgICAgICAgIGxldCBrbG4gPSAyICogbnJkXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbnJkOyArK2kpIGRlbnNba2xuICsgaV0gPSB0WzFdW2ljb21baV1dXG4gICAgICAgICAgLy8gY29tcHV0ZSBzb2x1dGlvbiBhdCBtaWQtcG9pbnRcbiAgICAgICAgICBmb3IgKGxldCBqID0gMjsgaiA8PSBrYzsgKytqKSB7XG4gICAgICAgICAgICBsZXQgZGJsZW5qID0gbmpbal1cbiAgICAgICAgICAgIGZvciAobGV0IGwgPSBqOyBsID49IDI7IC0tbCkge1xuICAgICAgICAgICAgICBsZXQgZmFjdG9yID0gKGRibGVuaiAvIG5qW2wgLSAxXSkgKiogMiAtIDFcbiAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbnJkOyArK2kpIHtcbiAgICAgICAgICAgICAgICB5U2FmZVtsIC0gMV1baV0gPSB5U2FmZVtsXVtpXSArICh5U2FmZVtsXVtpXSAtIHlTYWZlW2wgLSAxXVtpXSkgLyBmYWN0b3JcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBsZXQga3JuID0gNCAqIG5yZFxuICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG5yZDsgKytpKSBkZW5zW2tybiArIGldID0geVNhZmVbMV1baV1cbiAgICAgICAgICAvLyBjb21wdXRlIGZpcnN0IGRlcml2YXRpdmUgYXQgcmlnaHQgZW5kXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbjsgKytpKSB5aDFbaV0gPSB0WzFdW2ldXG4gICAgICAgICAgRih4LCB5aDEsIHloMilcbiAgICAgICAgICBrcm4gPSAzICogbnJkXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbnJkOyArK2kpIGRlbnNba3JuICsgaV0gPSB5aDJbaWNvbVtpXV0gKiBoXG4gICAgICAgICAgLy8gVEhFIExPT1BcbiAgICAgICAgICBmb3IgKGxldCBrbWkgPSAxOyBrbWkgPD0ga21pdDsgKytrbWkpIHtcbiAgICAgICAgICAgIC8vIGNvbXB1dGUga21pLXRoIGRlcml2YXRpdmUgYXQgbWlkLXBvaW50XG4gICAgICAgICAgICBsZXQga2JlZyA9IChrbWkgKyAxKSAvIDIgfCAwXG4gICAgICAgICAgICBmb3IgKGxldCBrayA9IGtiZWc7IGtrIDw9IGtjOyArK2trKSB7XG4gICAgICAgICAgICAgIGxldCBmYWNuaiA9IChualtra10gLyAyKSAqKiAoa21pIC0gMSlcbiAgICAgICAgICAgICAgaVB0ID0gaVBvaW50W2trICsgMV0gLSAyICoga2sgKyBrbWlcbiAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbnJkOyArK2kpIHtcbiAgICAgICAgICAgICAgICB5U2FmZVtra11baV0gPSBmU2FmZVtpUHRdW2ldICogZmFjbmpcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChsZXQgaiA9IGtiZWcgKyAxOyBqIDw9IGtjOyArK2opIHtcbiAgICAgICAgICAgICAgbGV0IGRibGVuaiA9IG5qW2pdXG4gICAgICAgICAgICAgIGZvciAobGV0IGwgPSBqOyBsID49IGtiZWcgKyAxOyAtLWwpIHtcbiAgICAgICAgICAgICAgICBsZXQgZmFjdG9yID0gKGRibGVuaiAvIG5qW2wgLSAxXSkgKiogMiAtIDFcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBucmQ7ICsraSkge1xuICAgICAgICAgICAgICAgICAgeVNhZmVbbCAtIDFdW2ldID0geVNhZmVbbF1baV0gKyAoeVNhZmVbbF1baV0gLSB5U2FmZVtsIC0gMV1baV0pIC8gZmFjdG9yXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBrcm4gPSAoa21pICsgNCkgKiBucmRcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG5yZDsgKytpKSBkZW5zW2tybiArIGldID0geVNhZmVba2JlZ11baV0gKiBoXG4gICAgICAgICAgICBpZiAoa21pID09PSBrbWl0KSBjb250aW51ZVxuICAgICAgICAgICAgLy8gY29tcHV0ZSBkaWZmZXJlbmNlc1xuICAgICAgICAgICAgZm9yIChsZXQga2sgPSAoa21pICsgMikgLyAyIHwgMDsga2sgPD0ga2M7ICsra2spIHtcbiAgICAgICAgICAgICAgbGV0IGxiZWcgPSBpUG9pbnRba2sgKyAxXVxuICAgICAgICAgICAgICBsZXQgbGVuZCA9IGlQb2ludFtra10gKyBrbWkgKyAxXG4gICAgICAgICAgICAgIGlmIChrbWkgPT09IDEgJiYgblNlcSA9PT0gNCkgbGVuZCArPSAyXG4gICAgICAgICAgICAgIGxldCBsOiBudW1iZXJcbiAgICAgICAgICAgICAgZm9yIChsID0gbGJlZzsgbCA+PSBsZW5kOyBsIC09IDIpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBucmQ7ICsraSkge1xuICAgICAgICAgICAgICAgICAgZlNhZmVbbF1baV0gLT0gZlNhZmVbbCAtIDJdW2ldXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChrbWkgPT09IDEgJiYgblNlcSA9PT0gNCkge1xuICAgICAgICAgICAgICAgIGwgPSBsZW5kIC0gMlxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG5yZDsgKytpKSBmU2FmZVtsXVtpXSAtPSBkeltpY29tW2ldXVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBjb21wdXRlIGRpZmZlcmVuY2VzXG4gICAgICAgICAgICBmb3IgKGxldCBrayA9IChrbWkgKyAyKSAvIDIgfCAwOyBrayA8PSBrYzsgKytraykge1xuICAgICAgICAgICAgICBsZXQgbGJlZyA9IGlQb2ludFtrayArIDFdIC0gMVxuICAgICAgICAgICAgICBsZXQgbGVuZCA9IGlQb2ludFtra10gKyBrbWkgKyAyXG4gICAgICAgICAgICAgIGZvciAobGV0IGwgPSBsYmVnOyBsID49IGxlbmQ7IGwgLT0gMikge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG5yZDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICBmU2FmZVtsXVtpXSAtPSBmU2FmZVtsIC0gMl1baV1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaW50ZXJwKG5yZCwgZGVucywga21pdClcbiAgICAgICAgICAvLyBlc3RpbWF0aW9uIG9mIGludGVycG9sYXRpb24gZXJyb3JcbiAgICAgICAgICBpZiAodGhpcy5kZW5zZU91dHB1dEVycm9yRXN0aW1hdG9yICYmIGttaXQgPj0gMSkge1xuICAgICAgICAgICAgbGV0IGVycmludCA9IDBcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG5yZDsgKytpKSBlcnJpbnQgKz0gKGRlbnNbKGttaXQgKyA0KSAqIG5yZCArIGldIC8gc2NhbFtpY29tW2ldXSkgKiogMlxuICAgICAgICAgICAgZXJyaW50ID0gTWF0aC5zcXJ0KGVycmludCAvIG5yZCkgKiBlcnJmYWNba21pdF1cbiAgICAgICAgICAgIGhvcHRkZSA9IGggLyBNYXRoLm1heChlcnJpbnQgKiogKDEgLyAoa21pdCArIDQpKSwgMC4wMSlcbiAgICAgICAgICAgIGlmIChlcnJpbnQgPiAxMCkge1xuICAgICAgICAgICAgICBoID0gaG9wdGRlXG4gICAgICAgICAgICAgIHggPSB4T2xkXG4gICAgICAgICAgICAgICsrblJlamVjdFxuICAgICAgICAgICAgICByZWplY3QgPSB0cnVlXG4gICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG47ICsraSkgZHpbaV0gPSB5aDJbaV1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBuOyArK2kpIHlbaV0gPSB0WzFdW2ldXG4gICAgICAgICsrbkFjY2VwdFxuICAgICAgICBpZiAoc29sT3V0KSB7XG4gICAgICAgICAgLy8gSWYgZGVuc2VPdXRwdXQsIHdlIGFsc28gd2FudCB0byBzdXBwbHkgdGhlIGRlbnNlIGNsb3N1cmUuXG4gICAgICAgICAgaWYgKHNvbE91dChuQWNjZXB0ICsgMSwgeE9sZCwgeCwgeS5zbGljZSgxKSxcbiAgICAgICAgICAgICAgdGhpcy5kZW5zZU91dHB1dCAmJiBjb250ZXgoeE9sZGQsIGhoaCwga21pdCwgZGVucywgaWNvbSkpID09PSBmYWxzZSkgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cbiAgICAgICAgLy8gY29tcHV0ZSBvcHRpbWFsIG9yZGVyXG4gICAgICAgIGxldCBrb3B0OiBudW1iZXJcbiAgICAgICAgaWYgKGtjID09PSAyKSB7XG4gICAgICAgICAga29wdCA9IE1hdGgubWluKDMsIGttIC0gMSlcbiAgICAgICAgICBpZiAocmVqZWN0KSBrb3B0ID0gMlxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChrYyA8PSBrKSB7XG4gICAgICAgICAgICBrb3B0ID0ga2NcbiAgICAgICAgICAgIGlmICh3W2tjIC0gMV0gPCB3W2tjXSAqIHRoaXMuc3RlcFNpemVGYWMzKSBrb3B0ID0ga2MgLSAxXG4gICAgICAgICAgICBpZiAod1trY10gPCB3W2tjIC0gMV0gKiB0aGlzLnN0ZXBTaXplRmFjNCkga29wdCA9IE1hdGgubWluKGtjICsgMSwga20gLSAxKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBrb3B0ID0ga2MgLSAxXG4gICAgICAgICAgICBpZiAoa2MgPiAzICYmIHdba2MgLSAyXSA8IHdba2MgLSAxXSAqIHRoaXMuc3RlcFNpemVGYWMzKSBrb3B0ID0ga2MgLSAyXG4gICAgICAgICAgICBpZiAod1trY10gPCB3W2tvcHRdICogdGhpcy5zdGVwU2l6ZUZhYzQpIGtvcHQgPSBNYXRoLm1pbihrYywga20gLSAxKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBhZnRlciBhIHJlamVjdGVkIHN0ZXBcbiAgICAgICAgaWYgKHJlamVjdCkge1xuICAgICAgICAgIGsgPSBNYXRoLm1pbihrb3B0LCBrYylcbiAgICAgICAgICBoID0gcG9zbmVnICogTWF0aC5taW4oTWF0aC5hYnMoaCksIE1hdGguYWJzKGhoW2tdKSlcbiAgICAgICAgICByZWplY3QgPSBmYWxzZVxuICAgICAgICAgIHJldHVybiB0cnVlICAvLyBnb3RvIDEwXG4gICAgICAgIH1cbiAgICAgICAgaWYgKGtvcHQgPD0ga2MpIHtcbiAgICAgICAgICBoID0gaGhba29wdF1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoa2MgPCBrICYmIHdba2NdIDwgd1trYyAtIDFdICogdGhpcy5zdGVwU2l6ZUZhYzQpIHtcbiAgICAgICAgICAgIGggPSBoaFtrY10gKiBhW2tvcHQgKyAxXSAvIGFba2NdXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGggPSBoaFtrY10gKiBhW2tvcHRdIC8gYVtrY11cbiAgICAgICAgICB9XG5cblxuICAgICAgICB9XG4gICAgICAgIC8vIGNvbXB1dGUgc3RlcHNpemUgZm9yIG5leHQgc3RlcFxuICAgICAgICBrID0ga29wdFxuICAgICAgICBoID0gcG9zbmVnICogTWF0aC5hYnMoaClcbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgIH1cblxuICAgICAgbGV0IG1pZGV4ID0gKGo6IG51bWJlcik6IHZvaWQgPT4ge1xuICAgICAgICBjb25zdCBkeSA9IFNvbHZlci5kaW0odGhpcy5uKVxuICAgICAgICAvLyBDb21wdXRlcyB0aGUganRoIGxpbmUgb2YgdGhlIGV4dHJhcG9sYXRpb24gdGFibGUgYW5kXG4gICAgICAgIC8vIHByb3ZpZGVzIGFuIGVzdGltYXRpb24gb2YgdGhlIG9wdGlvbmFsIHN0ZXBzaXplXG4gICAgICAgIGNvbnN0IGhqID0gaCAvIG5qW2pdXG4gICAgICAgIC8vIEV1bGVyIHN0YXJ0aW5nIHN0ZXBcbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gdGhpcy5uOyArK2kpIHtcbiAgICAgICAgICB5aDFbaV0gPSB5W2ldXG4gICAgICAgICAgeWgyW2ldID0geVtpXSArIGhqICogZHpbaV1cbiAgICAgICAgfVxuICAgICAgICAvLyBFeHBsaWNpdCBtaWRwb2ludCBydWxlXG4gICAgICAgIGNvbnN0IG0gPSBualtqXSAtIDFcbiAgICAgICAgY29uc3QgbmpNaWQgPSAobmpbal0gLyAyKSB8IDBcbiAgICAgICAgZm9yIChsZXQgbW0gPSAxOyBtbSA8PSBtOyArK21tKSB7XG4gICAgICAgICAgaWYgKHRoaXMuZGVuc2VPdXRwdXQgJiYgbW0gPT09IG5qTWlkKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBucmQ7ICsraSkge1xuICAgICAgICAgICAgICB5U2FmZVtqXVtpXSA9IHloMltpY29tW2ldXVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBGKHggKyBoaiAqIG1tLCB5aDIsIGR5KVxuICAgICAgICAgIGlmICh0aGlzLmRlbnNlT3V0cHV0ICYmIE1hdGguYWJzKG1tIC0gbmpNaWQpIDw9IDIgKiBqIC0gMSkge1xuICAgICAgICAgICAgKytpUHRcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG5yZDsgKytpKSB7XG4gICAgICAgICAgICAgIGZTYWZlW2lQdF1baV0gPSBkeVtpY29tW2ldXVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSB0aGlzLm47ICsraSkge1xuICAgICAgICAgICAgbGV0IHlzID0geWgxW2ldXG4gICAgICAgICAgICB5aDFbaV0gPSB5aDJbaV1cbiAgICAgICAgICAgIHloMltpXSA9IHlzICsgMiAqIGhqICogZHlbaV1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG1tIDw9IHRoaXMuc3RhYmlsaXR5Q2hlY2tDb3VudCAmJiBqIDw9IHRoaXMuc3RhYmlsaXR5Q2hlY2tUYWJsZUxpbmVzKSB7XG4gICAgICAgICAgICAvLyBzdGFiaWxpdHkgY2hlY2tcbiAgICAgICAgICAgIGxldCBkZWwxID0gMFxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gdGhpcy5uOyArK2kpIHtcbiAgICAgICAgICAgICAgZGVsMSArPSAoZHpbaV0gLyBzY2FsW2ldKSAqKiAyXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgZGVsMiA9IDBcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IHRoaXMubjsgKytpKSB7XG4gICAgICAgICAgICAgIGRlbDIgKz0gKChkeVtpXSAtIGR6W2ldKSAvIHNjYWxbaV0pICoqIDJcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHF1b3QgPSBkZWwyIC8gTWF0aC5tYXgodGhpcy51Um91bmQsIGRlbDEpXG4gICAgICAgICAgICBpZiAocXVvdCA+IDQpIHtcbiAgICAgICAgICAgICAgKytuRXZhbFxuICAgICAgICAgICAgICBhdG92ID0gdHJ1ZVxuICAgICAgICAgICAgICBoICo9IHRoaXMuc3RlcFNpemVSZWR1Y3Rpb25GYWN0b3JcbiAgICAgICAgICAgICAgcmVqZWN0ID0gdHJ1ZVxuICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gZmluYWwgc21vb3RoaW5nIHN0ZXBcbiAgICAgICAgRih4ICsgaCwgeWgyLCBkeSlcbiAgICAgICAgaWYgKHRoaXMuZGVuc2VPdXRwdXQgJiYgbmpNaWQgPD0gMiAqIGogLSAxKSB7XG4gICAgICAgICAgKytpUHRcbiAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBucmQ7ICsraSkge1xuICAgICAgICAgICAgZlNhZmVbaVB0XVtpXSA9IGR5W2ljb21baV1dXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IHRoaXMubjsgKytpKSB7XG4gICAgICAgICAgdFtqXVtpXSA9ICh5aDFbaV0gKyB5aDJbaV0gKyBoaiAqIGR5W2ldKSAvIDJcbiAgICAgICAgfVxuICAgICAgICBuRXZhbCArPSBualtqXVxuICAgICAgICAvLyBwb2x5bm9taWFsIGV4dHJhcG9sYXRpb25cbiAgICAgICAgaWYgKGogPT09IDEpIHJldHVybiAgLy8gd2FzIGouZXEuMVxuICAgICAgICBjb25zdCBkYmxlbmogPSBualtqXVxuICAgICAgICBsZXQgZmFjOiBudW1iZXJcbiAgICAgICAgZm9yIChsZXQgbCA9IGo7IGwgPiAxOyAtLWwpIHtcbiAgICAgICAgICBmYWMgPSAoZGJsZW5qIC8gbmpbbCAtIDFdKSAqKiAyIC0gMVxuICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IHRoaXMubjsgKytpKSB7XG4gICAgICAgICAgICB0W2wgLSAxXVtpXSA9IHRbbF1baV0gKyAodFtsXVtpXSAtIHRbbCAtIDFdW2ldKSAvIGZhY1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlcnIgPSAwXG4gICAgICAgIC8vIHNjYWxpbmdcbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gdGhpcy5uOyArK2kpIHtcbiAgICAgICAgICBsZXQgdDFpID0gTWF0aC5tYXgoTWF0aC5hYnMoeVtpXSksIE1hdGguYWJzKHRbMV1baV0pKVxuICAgICAgICAgIHNjYWxbaV0gPSBhVG9sW2ldICsgclRvbFtpXSAqIHQxaVxuICAgICAgICAgIGVyciArPSAoKHRbMV1baV0gLSB0WzJdW2ldKSAvIHNjYWxbaV0pICoqIDJcbiAgICAgICAgfVxuICAgICAgICBlcnIgPSBNYXRoLnNxcnQoZXJyIC8gdGhpcy5uKVxuICAgICAgICBpZiAoZXJyICogdGhpcy51Um91bmQgPj0gMSB8fCAoaiA+IDIgJiYgZXJyID49IGVyck9sZCkpIHtcbiAgICAgICAgICBhdG92ID0gdHJ1ZVxuICAgICAgICAgIGggKj0gdGhpcy5zdGVwU2l6ZVJlZHVjdGlvbkZhY3RvclxuICAgICAgICAgIHJlamVjdCA9IHRydWVcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBlcnJPbGQgPSBNYXRoLm1heCg0ICogZXJyLCAxKVxuICAgICAgICAvLyBjb21wdXRlIG9wdGltYWwgc3RlcHNpemVzXG4gICAgICAgIGxldCBleHAwID0gMSAvICgyICogaiAtIDEpXG4gICAgICAgIGxldCBmYWNNaW4gPSB0aGlzLnN0ZXBTaXplRmFjMSAqKiBleHAwXG4gICAgICAgIGZhYyA9IE1hdGgubWluKHRoaXMuc3RlcFNpemVGYWMyIC8gZmFjTWluLFxuICAgICAgICAgIE1hdGgubWF4KGZhY01pbiwgKGVyciAvIHRoaXMuc3RlcFNhZmV0eUZhY3RvcjEpICoqIGV4cDAgLyB0aGlzLnN0ZXBTYWZldHlGYWN0b3IyKSlcbiAgICAgICAgZmFjID0gMSAvIGZhY1xuICAgICAgICBoaFtqXSA9IE1hdGgubWluKE1hdGguYWJzKGgpICogZmFjLCBoTWF4KVxuICAgICAgICB3W2pdID0gYVtqXSAvIGhoW2pdXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGludGVycCA9IChuOiBudW1iZXIsIHk6IG51bWJlcltdLCBpbWl0OiBudW1iZXIpID0+IHtcbiAgICAgICAgLy8gY29tcHV0ZXMgdGhlIGNvZWZmaWNpZW50cyBvZiB0aGUgaW50ZXJwb2xhdGlvbiBmb3JtdWxhXG4gICAgICAgIGxldCBhID0gbmV3IEFycmF5KDMxKSAgLy8gemVyby1iYXNlZDogMDozMFxuICAgICAgICAvLyBiZWdpbiB3aXRoIEhlcm1pdGUgaW50ZXJwb2xhdGlvblxuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBuOyArK2kpIHtcbiAgICAgICAgICBsZXQgeTAgPSB5W2ldXG4gICAgICAgICAgbGV0IHkxID0geVsyICogbiArIGldXG4gICAgICAgICAgbGV0IHlwMCA9IHlbbiArIGldXG4gICAgICAgICAgbGV0IHlwMSA9IHlbMyAqIG4gKyBpXVxuICAgICAgICAgIGxldCB5RGlmZiA9IHkxIC0geTBcbiAgICAgICAgICBsZXQgYXNwbCA9IC15cDEgKyB5RGlmZlxuICAgICAgICAgIGxldCBic3BsID0geXAwIC0geURpZmZcbiAgICAgICAgICB5W24gKyBpXSA9IHlEaWZmXG4gICAgICAgICAgeVsyICogbiArIGldID0gYXNwbFxuICAgICAgICAgIHlbMyAqIG4gKyBpXSA9IGJzcGxcbiAgICAgICAgICBpZiAoaW1pdCA8IDApIGNvbnRpbnVlXG4gICAgICAgICAgLy8gY29tcHV0ZSB0aGUgZGVyaXZhdGl2ZXMgb2YgSGVybWl0ZSBhdCBtaWRwb2ludFxuICAgICAgICAgIGxldCBwaDAgPSAoeTAgKyB5MSkgKiAwLjUgKyAwLjEyNSAqIChhc3BsICsgYnNwbClcbiAgICAgICAgICBsZXQgcGgxID0geURpZmYgKyAoYXNwbCAtIGJzcGwpICogMC4yNVxuICAgICAgICAgIGxldCBwaDIgPSAtKHlwMCAtIHlwMSlcbiAgICAgICAgICBsZXQgcGgzID0gNiAqIChic3BsIC0gYXNwbClcbiAgICAgICAgICAvLyBjb21wdXRlIHRoZSBmdXJ0aGVyIGNvZWZmaWNpZW50c1xuICAgICAgICAgIGlmIChpbWl0ID49IDEpIHtcbiAgICAgICAgICAgIGFbMV0gPSAxNiAqICh5WzUgKiBuICsgaV0gLSBwaDEpXG4gICAgICAgICAgICBpZiAoaW1pdCA+PSAzKSB7XG4gICAgICAgICAgICAgIGFbM10gPSAxNiAqICh5WzcgKiBuICsgaV0gLSBwaDMgKyAzICogYVsxXSlcbiAgICAgICAgICAgICAgaWYgKGltaXQgPj0gNSkge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGltID0gNTsgaW0gPD0gaW1pdDsgaW0gKz0gMikge1xuICAgICAgICAgICAgICAgICAgbGV0IGZhYzEgPSBpbSAqIChpbSAtIDEpIC8gMlxuICAgICAgICAgICAgICAgICAgbGV0IGZhYzIgPSBmYWMxICogKGltIC0gMikgKiAoaW0gLSAzKSAqIDJcbiAgICAgICAgICAgICAgICAgIGFbaW1dID0gMTYgKiAoeVsoaW0gKyA0KSAqIG4gKyBpXSArIGZhYzEgKiBhW2ltIC0gMl0gLSBmYWMyICogYVtpbSAtIDRdKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBhWzBdID0gKHlbNCAqIG4gKyBpXSAtIHBoMCkgKiAxNlxuICAgICAgICAgIGlmIChpbWl0ID49IDIpIHtcbiAgICAgICAgICAgIGFbMl0gPSAoeVtuICogNiArIGldIC0gcGgyICsgYVswXSkgKiAxNlxuICAgICAgICAgICAgaWYgKGltaXQgPj0gNCkge1xuICAgICAgICAgICAgICBmb3IgKGxldCBpbSA9IDQ7IGltIDw9IGltaXQ7IGltICs9IDIpIHtcbiAgICAgICAgICAgICAgICBsZXQgZmFjMSA9IGltICogKGltIC0gMSkgLyAyXG4gICAgICAgICAgICAgICAgbGV0IGZhYzIgPSBpbSAqIChpbSAtIDEpICogKGltIC0gMikgKiAoaW0gLSAzKVxuICAgICAgICAgICAgICAgIGFbaW1dID0gKHlbbiAqIChpbSArIDQpICsgaV0gKyBhW2ltIC0gMl0gKiBmYWMxIC0gYVtpbSAtIDRdICogZmFjMikgKiAxNlxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGZvciAobGV0IGltID0gMDsgaW0gPD0gaW1pdDsgKytpbSkgeVtuICogKGltICsgNCkgKyBpXSA9IGFbaW1dXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgY29udGV4ID0gKHhPbGQ6IG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICBoOiBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgaW1pdDogbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgIHk6IG51bWJlcltdLFxuICAgICAgICAgICAgICAgICAgICAgIGljb206IG51bWJlcltdKSA9PiB7XG4gICAgICAgIHJldHVybiAoYzogbnVtYmVyLCB4OiBudW1iZXIpID0+IHtcbiAgICAgICAgICBsZXQgaSA9IDBcbiAgICAgICAgICBmb3IgKGxldCBqID0gMTsgaiA8PSBucmQ7ICsraikge1xuICAgICAgICAgICAgLy8gY2FyZWZ1bDogY3VzdG9tZXJzIGRlc2NyaWJlIGNvbXBvbmVudHMgMC1iYXNlZC4gV2UgcmVjb3JkIGluZGljZXMgMS1iYXNlZC5cbiAgICAgICAgICAgIGlmIChpY29tW2pdID09PSBjICsgMSkgaSA9IGpcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGkgPT09IDApIHRocm93IG5ldyBFcnJvcignbm8gZGVuc2Ugb3V0cHV0IGF2YWlsYWJsZSBmb3IgY29tcG9uZW50ICcgKyBjKVxuICAgICAgICAgIGNvbnN0IHRoZXRhID0gKHggLSB4T2xkKSAvIGhcbiAgICAgICAgICBjb25zdCB0aGV0YTEgPSAxIC0gdGhldGFcbiAgICAgICAgICBjb25zdCBwaHRoZXQgPSB5W2ldICsgdGhldGEgKiAoeVtucmQgKyBpXSArIHRoZXRhMSAqICh5WzIgKiBucmQgKyBpXSAqIHRoZXRhICsgeVszICogbnJkICsgaV0gKiB0aGV0YTEpKVxuICAgICAgICAgIGlmIChpbWl0IDwgMCkgcmV0dXJuIHBodGhldFxuICAgICAgICAgIGNvbnN0IHRoZXRhaCA9IHRoZXRhIC0gMC41XG4gICAgICAgICAgbGV0IHJldCA9IHlbbnJkICogKGltaXQgKyA0KSArIGldXG4gICAgICAgICAgZm9yIChsZXQgaW0gPSBpbWl0OyBpbSA+PSAxOyAtLWltKSB7XG4gICAgICAgICAgICByZXQgPSB5W25yZCAqIChpbSArIDMpICsgaV0gKyByZXQgKiB0aGV0YWggLyBpbVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcGh0aGV0ICsgKHRoZXRhICogdGhldGExKSAqKiAyICogcmV0XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gcHJlcGFyYXRpb25cbiAgICAgIGNvbnN0IHlTYWZlID0gU29sdmVyLmRpbTIoa20sIG5yZClcbiAgICAgIGNvbnN0IGhoID0gU29sdmVyLmRpbShrbSlcbiAgICAgIGNvbnN0IHQgPSBTb2x2ZXIuZGltMihrbSwgdGhpcy5uKVxuICAgICAgLy8gRGVmaW5lIHRoZSBzdGVwIHNpemUgc2VxdWVuY2VcbiAgICAgIGNvbnN0IG5qID0gU29sdmVyLnN0ZXBTaXplU2VxdWVuY2UoblNlcSwga20pXG4gICAgICAvLyBEZWZpbmUgdGhlIGFbaV0gZm9yIG9yZGVyIHNlbGVjdGlvblxuICAgICAgY29uc3QgYSA9IFNvbHZlci5kaW0oa20pXG4gICAgICBhWzFdID0gMSArIG5qWzFdXG4gICAgICBmb3IgKGxldCBpID0gMjsgaSA8PSBrbTsgKytpKSB7XG4gICAgICAgIGFbaV0gPSBhW2kgLSAxXSArIG5qW2ldXG4gICAgICB9XG4gICAgICAvLyBJbml0aWFsIFNjYWxpbmdcbiAgICAgIGNvbnN0IHNjYWwgPSBTb2x2ZXIuZGltKHRoaXMubilcbiAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IHRoaXMubjsgKytpKSB7XG4gICAgICAgIHNjYWxbaV0gPSBhVG9sW2ldICsgclRvbFtpXSArIE1hdGguYWJzKHlbaV0pXG4gICAgICB9XG4gICAgICAvLyBJbml0aWFsIHByZXBhcmF0aW9uc1xuICAgICAgY29uc3QgcG9zbmVnID0geEVuZCAtIHggPj0gMCA/IDEgOiAtMVxuICAgICAgbGV0IGsgPSBNYXRoLm1heCgyLCBNYXRoLm1pbihrbSAtIDEsIE1hdGguZmxvb3IoLVNvbHZlci5sb2cxMChyVG9sWzFdICsgMWUtNDApICogMC42ICsgMS41KSkpXG4gICAgICBsZXQgaCA9IE1hdGgubWF4KE1hdGguYWJzKHRoaXMuaW5pdGlhbFN0ZXBTaXplKSwgMWUtNClcbiAgICAgIGggPSBwb3NuZWcgKiBNYXRoLm1pbihoLCBoTWF4LCBNYXRoLmFicyh4RW5kIC0geCkgLyAyKVxuICAgICAgY29uc3QgaVBvaW50ID0gU29sdmVyLmRpbShrbSArIDEpXG4gICAgICBjb25zdCBlcnJmYWMgPSBTb2x2ZXIuZGltKDIgKiBrbSlcbiAgICAgIGxldCB4T2xkID0geFxuICAgICAgbGV0IGlQdCA9IDBcbiAgICAgIGlmIChzb2xPdXQpIHtcbiAgICAgICAgaWYgKHRoaXMuZGVuc2VPdXRwdXQpIHtcbiAgICAgICAgICBpUG9pbnRbMV0gPSAwXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0ga207ICsraSkge1xuICAgICAgICAgICAgbGV0IG5qQWRkID0gNCAqIGkgLSAyXG4gICAgICAgICAgICBpZiAobmpbaV0gPiBuakFkZCkgKytuakFkZFxuICAgICAgICAgICAgaVBvaW50W2kgKyAxXSA9IGlQb2ludFtpXSArIG5qQWRkXG4gICAgICAgICAgfVxuICAgICAgICAgIGZvciAobGV0IG11ID0gMTsgbXUgPD0gMiAqIGttOyArK211KSB7XG4gICAgICAgICAgICBsZXQgZXJyeCA9IE1hdGguc3FydChtdSAvIChtdSArIDQpKSAqIDAuNVxuICAgICAgICAgICAgbGV0IHByb2QgPSAoMSAvIChtdSArIDQpKSAqKiAyXG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMTsgaiA8PSBtdTsgKytqKSBwcm9kICo9IGVycnggLyBqXG4gICAgICAgICAgICBlcnJmYWNbbXVdID0gcHJvZFxuICAgICAgICAgIH1cbiAgICAgICAgICBpUHQgPSAwXG4gICAgICAgIH1cbiAgICAgICAgLy8gY2hlY2sgcmV0dXJuIHZhbHVlIGFuZCBhYmFuZG9uIGludGVncmF0aW9uIGlmIGNhbGxlZCBmb3JcbiAgICAgICAgaWYgKGZhbHNlID09PSBzb2xPdXQobkFjY2VwdCArIDEsIHhPbGQsIHgsIHkuc2xpY2UoMSkpKSB7XG4gICAgICAgICAgcmV0dXJuIE91dGNvbWUuRWFybHlSZXR1cm5cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgbGV0IGVyciA9IDBcbiAgICAgIGxldCBlcnJPbGQgPSAxZTEwXG4gICAgICBsZXQgaG9wdGRlID0gcG9zbmVnICogaE1heFxuICAgICAgY29uc3QgdyA9IFNvbHZlci5kaW0oa20pXG4gICAgICB3WzFdID0gMFxuICAgICAgbGV0IHJlamVjdCA9IGZhbHNlXG4gICAgICBsZXQgbGFzdCA9IGZhbHNlXG4gICAgICBsZXQgYXRvdjogYm9vbGVhblxuICAgICAgbGV0IGtjID0gMFxuXG4gICAgICBlbnVtIFNUQVRFIHtcbiAgICAgICAgU3RhcnQsIEJhc2ljSW50ZWdyYXRpb25TdGVwLCBDb252ZXJnZW5jZVN0ZXAsIEhvcGVGb3JDb252ZXJnZW5jZSwgQWNjZXB0LCBSZWplY3RcbiAgICAgIH1cbiAgICAgIGxldCBzdGF0ZTogU1RBVEUgPSBTVEFURS5TdGFydFxuXG4gICAgICBsb29wOiB3aGlsZSAodHJ1ZSkge1xuICAgICAgICB0aGlzLmRlYnVnICYmIGNvbnNvbGUubG9nKCdTVEFURScsIFNUQVRFW3N0YXRlXSwgblN0ZXAsIHhPbGQsIHgsIGgsIGssIGtjLCBob3B0ZGUpXG4gICAgICAgIHN3aXRjaCAoc3RhdGUpIHtcbiAgICAgICAgICBjYXNlIFNUQVRFLlN0YXJ0OlxuICAgICAgICAgICAgYXRvdiA9IGZhbHNlXG4gICAgICAgICAgICAvLyBJcyB4RW5kIHJlYWNoZWQgaW4gdGhlIG5leHQgc3RlcD9cbiAgICAgICAgICAgIGlmICgwLjEgKiBNYXRoLmFicyh4RW5kIC0geCkgPD0gTWF0aC5hYnMoeCkgKiB0aGlzLnVSb3VuZCkgYnJlYWsgbG9vcFxuICAgICAgICAgICAgaCA9IHBvc25lZyAqIE1hdGgubWluKE1hdGguYWJzKGgpLCBNYXRoLmFicyh4RW5kIC0geCksIGhNYXgsIE1hdGguYWJzKGhvcHRkZSkpXG4gICAgICAgICAgICBpZiAoKHggKyAxLjAxICogaCAtIHhFbmQpICogcG9zbmVnID4gMCkge1xuICAgICAgICAgICAgICBoID0geEVuZCAtIHhcbiAgICAgICAgICAgICAgbGFzdCA9IHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChuU3RlcCA9PT0gMCB8fCAhdGhpcy5kZW5zZU91dHB1dCkge1xuICAgICAgICAgICAgICBGKHgsIHksIGR6KVxuICAgICAgICAgICAgICArK25FdmFsXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBUaGUgZmlyc3QgYW5kIGxhc3Qgc3RlcFxuICAgICAgICAgICAgaWYgKG5TdGVwID09PSAwIHx8IGxhc3QpIHtcbiAgICAgICAgICAgICAgaVB0ID0gMFxuICAgICAgICAgICAgICArK25TdGVwXG4gICAgICAgICAgICAgIGZvciAobGV0IGogPSAxOyBqIDw9IGs7ICsraikge1xuICAgICAgICAgICAgICAgIGtjID0galxuICAgICAgICAgICAgICAgIG1pZGV4KGopXG4gICAgICAgICAgICAgICAgaWYgKGF0b3YpIGNvbnRpbnVlIGxvb3BcbiAgICAgICAgICAgICAgICBpZiAoaiA+IDEgJiYgZXJyIDw9IDEpIHtcbiAgICAgICAgICAgICAgICAgIHN0YXRlID0gU1RBVEUuQWNjZXB0XG4gICAgICAgICAgICAgICAgICBjb250aW51ZSBsb29wXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHN0YXRlID0gU1RBVEUuSG9wZUZvckNvbnZlcmdlbmNlXG4gICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdGF0ZSA9IFNUQVRFLkJhc2ljSW50ZWdyYXRpb25TdGVwXG4gICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgY2FzZSBTVEFURS5CYXNpY0ludGVncmF0aW9uU3RlcDpcbiAgICAgICAgICAgIC8vIGJhc2ljIGludGVncmF0aW9uIHN0ZXBcbiAgICAgICAgICAgIGlQdCA9IDBcbiAgICAgICAgICAgICsrblN0ZXBcbiAgICAgICAgICAgIGlmIChuU3RlcCA+PSB0aGlzLm1heFN0ZXBzKSB7XG4gICAgICAgICAgICAgIHJldHVybiBPdXRjb21lLk1heFN0ZXBzRXhjZWVkZWRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGtjID0gayAtIDFcbiAgICAgICAgICAgIGZvciAobGV0IGogPSAxOyBqIDw9IGtjOyArK2opIHtcbiAgICAgICAgICAgICAgbWlkZXgoailcbiAgICAgICAgICAgICAgaWYgKGF0b3YpIHtcbiAgICAgICAgICAgICAgICBzdGF0ZSA9IFNUQVRFLlN0YXJ0XG4gICAgICAgICAgICAgICAgY29udGludWUgbG9vcFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBjb252ZXJnZW5jZSBtb25pdG9yXG4gICAgICAgICAgICBpZiAoayA9PT0gMiB8fCByZWplY3QpIHtcbiAgICAgICAgICAgICAgc3RhdGUgPSBTVEFURS5Db252ZXJnZW5jZVN0ZXBcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGlmIChlcnIgPD0gMSkge1xuICAgICAgICAgICAgICAgIHN0YXRlID0gU1RBVEUuQWNjZXB0XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAoZXJyID4gKChualtrICsgMV0gKiBualtrXSkgLyA0KSAqKiAyKSB7XG4gICAgICAgICAgICAgICAgc3RhdGUgPSBTVEFURS5SZWplY3RcbiAgICAgICAgICAgICAgfSBlbHNlIHN0YXRlID0gU1RBVEUuQ29udmVyZ2VuY2VTdGVwXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgY2FzZSBTVEFURS5Db252ZXJnZW5jZVN0ZXA6ICAvLyBsYWJlbCA1MFxuICAgICAgICAgICAgbWlkZXgoaylcbiAgICAgICAgICAgIGlmIChhdG92KSB7XG4gICAgICAgICAgICAgIHN0YXRlID0gU1RBVEUuU3RhcnRcbiAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGtjID0ga1xuICAgICAgICAgICAgaWYgKGVyciA8PSAxKSB7XG4gICAgICAgICAgICAgIHN0YXRlID0gU1RBVEUuQWNjZXB0XG4gICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdGF0ZSA9IFNUQVRFLkhvcGVGb3JDb252ZXJnZW5jZVxuICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgIGNhc2UgU1RBVEUuSG9wZUZvckNvbnZlcmdlbmNlOlxuICAgICAgICAgICAgLy8gaG9wZSBmb3IgY29udmVyZ2VuY2UgaW4gbGluZSBrICsgMVxuICAgICAgICAgICAgaWYgKGVyciA+IChualtrICsgMV0gLyAyKSAqKiAyKSB7XG4gICAgICAgICAgICAgIHN0YXRlID0gU1RBVEUuUmVqZWN0XG4gICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBrYyA9IGsgKyAxXG4gICAgICAgICAgICBtaWRleChrYylcbiAgICAgICAgICAgIGlmIChhdG92KSBzdGF0ZSA9IFNUQVRFLlN0YXJ0XG4gICAgICAgICAgICBlbHNlIGlmIChlcnIgPiAxKSBzdGF0ZSA9IFNUQVRFLlJlamVjdFxuICAgICAgICAgICAgZWxzZSBzdGF0ZSA9IFNUQVRFLkFjY2VwdFxuICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgIGNhc2UgU1RBVEUuQWNjZXB0OlxuICAgICAgICAgICAgaWYgKCFhY2NlcHRTdGVwKHRoaXMubikpIHJldHVybiBPdXRjb21lLkVhcmx5UmV0dXJuXG4gICAgICAgICAgICBzdGF0ZSA9IFNUQVRFLlN0YXJ0XG4gICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgY2FzZSBTVEFURS5SZWplY3Q6XG4gICAgICAgICAgICBrID0gTWF0aC5taW4oaywga2MsIGttIC0gMSlcbiAgICAgICAgICAgIGlmIChrID4gMiAmJiB3W2sgLSAxXSA8IHdba10gKiB0aGlzLnN0ZXBTaXplRmFjMykgayAtPSAxXG4gICAgICAgICAgICArK25SZWplY3RcbiAgICAgICAgICAgIGggPSBwb3NuZWcgKiBoaFtrXVxuICAgICAgICAgICAgcmVqZWN0ID0gdHJ1ZVxuICAgICAgICAgICAgc3RhdGUgPSBTVEFURS5CYXNpY0ludGVncmF0aW9uU3RlcFxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gT3V0Y29tZS5Db252ZXJnZWRcbiAgICB9XG5cbiAgICBjb25zdCBvdXRjb21lID0gb2R4Y29yKClcbiAgICByZXR1cm4ge1xuICAgICAgeTogeS5zbGljZSgxKSxcbiAgICAgIG91dGNvbWU6IG91dGNvbWUsXG4gICAgICBuU3RlcDogblN0ZXAsXG4gICAgICB4RW5kOiB4RW5kLFxuICAgICAgbkFjY2VwdDogbkFjY2VwdCxcbiAgICAgIG5SZWplY3Q6IG5SZWplY3QsXG4gICAgICBuRXZhbDogbkV2YWxcbiAgICB9XG4gIH1cbn1cbiIsIi8qKlxuICogQ3JlYXRlZCBieSBjb2xpbiBvbiA2LzE0LzE2LlxuICovXG5cbmltcG9ydCB7U29sdmVyLCBEZXJpdmF0aXZlfSBmcm9tICdvZGV4L3NyYy9vZGV4J1xuXG5pbnRlcmZhY2UgSGFtaWx0b25NYXAge1xuICBldm9sdmU6IChpbml0aWFsRGF0YTogbnVtYmVyW10sIG46IG51bWJlciwgY2FsbGJhY2s6ICh4OiBudW1iZXIsIHk6IG51bWJlcikgPT4gdm9pZCkgPT4gdm9pZFxufVxuXG5jb25zdCB0d29QaSA9IE1hdGguUEkgKiAyXG5cbmV4cG9ydCBjbGFzcyBTdGFuZGFyZE1hcCBpbXBsZW1lbnRzIEhhbWlsdG9uTWFwIHtcbiAgSzogbnVtYmVyXG4gIFBWOiAoeDogbnVtYmVyKSA9PiBudW1iZXJcbiAgc3RhdGljIHR3b1BpID0gMiAqIE1hdGguUElcblxuICBjb25zdHJ1Y3RvcihLOiBudW1iZXIpIHtcbiAgICB0aGlzLksgPSBLXG4gICAgdGhpcy5QViA9IFN0YW5kYXJkTWFwLnByaW5jaXBhbF92YWx1ZSh0d29QaSlcbiAgfVxuXG4gIHN0YXRpYyBwcmluY2lwYWxfdmFsdWUoY3V0SGlnaDogbnVtYmVyKTogKHY6IG51bWJlcikgPT4gbnVtYmVyIHtcbiAgICBjb25zdCBjdXRMb3cgPSBjdXRIaWdoIC0gdHdvUGlcbiAgICByZXR1cm4gZnVuY3Rpb24gKHg6IG51bWJlcikge1xuICAgICAgaWYgKGN1dExvdyA8PSB4ICYmIHggPCBjdXRIaWdoKSB7XG4gICAgICAgIHJldHVybiB4XG4gICAgICB9XG4gICAgICBjb25zdCB5ID0geCAtIHR3b1BpICogTWF0aC5mbG9vcih4IC8gdHdvUGkpXG4gICAgICByZXR1cm4geSA8IGN1dEhpZ2ggPyB5IDogeSAtIHR3b1BpXG4gICAgfVxuICB9XG5cbiAgZXZvbHZlID0gZnVuY3Rpb24oaW5pdGlhbERhdGE6IG51bWJlcltdLCBuOiBudW1iZXIsIGNhbGxiYWNrOiAoeDogbnVtYmVyLCB5OiBudW1iZXIpID0+IHZvaWQpIHtcbiAgICBsZXQgW3RoZXRhLCBJXSA9IGluaXRpYWxEYXRhXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgIGNhbGxiYWNrKHRoZXRhLCBJKVxuICAgICAgbGV0IG5JID0gSSArICh0aGlzLksgKiBNYXRoLnNpbih0aGV0YSkpXG4gICAgICB0aGV0YSA9IHRoaXMuUFYodGhldGEgKyBuSSlcbiAgICAgIEkgPSB0aGlzLlBWKG5JKVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRHJpdmVuUGVuZHVsdW1NYXAgaW1wbGVtZW50cyBIYW1pbHRvbk1hcCB7XG4gIGQ6IERlcml2YXRpdmVcbiAgVDogbnVtYmVyXG4gIFM6IFNvbHZlclxuICBQVjogKHg6IG51bWJlcikgPT4gbnVtYmVyXG5cbiAgc3RhdGljIEY6IChtOiBudW1iZXIsIGw6IG51bWJlciwgYTogbnVtYmVyLCBvbWVnYTogbnVtYmVyLCBnOiBudW1iZXIpID0+IERlcml2YXRpdmUgPVxuICAgIChtLCBsLCBhLCBvbWVnYSwgZykgPT4gKHgsIFt0LCB0aGV0YSwgcF90aGV0YV0pID0+IHtcbiAgICAgIC8vIGxldCBfMSA9IE1hdGguc2luKG9tZWdhICogdCk6IHRoaXMgY29tZXMgYWJvdXQgZnJvbSBhIGJ1ZyBpbiBvdXIgQ1NFXG4gICAgICBsZXQgXzIgPSBNYXRoLnBvdyhsLCAyKVxuICAgICAgbGV0IF8zID0gb21lZ2EgKiB0XG4gICAgICBsZXQgXzQgPSBNYXRoLnNpbih0aGV0YSlcbiAgICAgIGxldCBfNSA9IE1hdGguY29zKHRoZXRhKVxuICAgICAgcmV0dXJuIFsxLFxuICAgICAgICAoTWF0aC5zaW4oXzMpICogXzQgKiBhICogbCAqIG0gKiBvbWVnYSArIHBfdGhldGEpIC8gXzIgKiBtLFxuICAgICAgICAoLSBNYXRoLnBvdyhNYXRoLnNpbihfMyksIDIpICogXzQgKiBfNSAqIE1hdGgucG93KGEsIDIpICogbCAqIG0gKiBNYXRoLnBvdyhvbWVnYSwgMikgLSBNYXRoLnNpbihfMykgKiBfNSAqIGEgKiBvbWVnYSAqIHBfdGhldGEgLSBfNCAqIGcgKiBfMiAqIG0pIC8gbF1cbiAgICB9XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5TID0gbmV3IFNvbHZlcigzKVxuICAgIHRoaXMuUy5kZW5zZU91dHB1dCA9IHRydWVcbiAgICAvLyB0aGlzLlMuYWJzb2x1dGVUb2xlcmFuY2UgPSAxZS05XG4gICAgLy8gdGhpcy5TLnJlbGF0aXZlVG9sZXJhbmNlID0gMWUtOVxuICAgIGNvbnN0IGwgPSAxXG4gICAgY29uc3QgZyA9IDkuOFxuICAgIGNvbnN0IHcwID0gTWF0aC5zcXJ0KGcgLyBsKVxuICAgIGNvbnN0IHcgPSAyICogdzBcbiAgICB0aGlzLlQgPSAyICogTWF0aC5QSSAvIHdcbiAgICBjb25zdCBhID0gMC4xXG4gICAgY29uc29sZS5sb2coJ2wnLCBsLCAnYScsIGEsICd3JywgdywgJ2cnLCBnKVxuICAgIHRoaXMuZCA9IERyaXZlblBlbmR1bHVtTWFwLkYoMSwgbCwgYSwgdywgZylcbiAgICB0aGlzLlBWID0gU3RhbmRhcmRNYXAucHJpbmNpcGFsX3ZhbHVlKE1hdGguUEkpXG4gIH1cblxuICBldm9sdmUoaW5pdGlhbERhdGE6IG51bWJlcltdLCBuOiBudW1iZXIsIGNhbGxiYWNrOiAoeDogbnVtYmVyLCB5OiBudW1iZXIpID0+IHZvaWQpIHtcbiAgICB0aGlzLlMuc29sdmUodGhpcy5kLCAwLCBbMF0uY29uY2F0KGluaXRpYWxEYXRhKSwgMTAwMCAqIHRoaXMuVCwgdGhpcy5TLmdyaWQodGhpcy5ULCAoeCwgeXMpID0+IHtcbiAgICAgIGNhbGxiYWNrKHRoaXMuUFYoeXNbMV0pLCB5c1syXSlcbiAgICB9KSlcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRXhwbG9yZU1hcCB7XG4gIGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnRcbiAgTTogSGFtaWx0b25NYXBcbiAgY29udGV4dDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEXG5cbiAgY29uc3RydWN0b3IoY2FudmFzOiBzdHJpbmcsIE06IFN0YW5kYXJkTWFwLCB4UmFuZ2U6IG51bWJlcltdLCB5UmFuZ2U6IG51bWJlcltdKSB7XG4gICAgdGhpcy5jYW52YXMgPSA8SFRNTENhbnZhc0VsZW1lbnQ+IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGNhbnZhcylcbiAgICB0aGlzLk0gPSBNXG4gICAgdGhpcy5jb250ZXh0ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKVxuICAgIGxldCBbdywgaF0gPSBbeFJhbmdlWzFdIC0geFJhbmdlWzBdLCB5UmFuZ2VbMV0gLSB5UmFuZ2VbMF1dXG4gICAgY29uc29sZS5sb2coJ3cnLCB3LCAnaCcsIGgpXG4gICAgdGhpcy5jYW52YXMub25tb3VzZWRvd24gPSAoZTogTW91c2VFdmVudCkgPT4ge1xuICAgICAgbGV0IFtjeCwgY3ldID0gW2Uub2Zmc2V0WCAvIHRoaXMuY29udGV4dC5jYW52YXMud2lkdGggKiB3ICsgeFJhbmdlWzBdLFxuICAgICAgICB5UmFuZ2VbMV0gLSBlLm9mZnNldFkgLyB0aGlzLmNvbnRleHQuY2FudmFzLmhlaWdodCAqIGhdXG4gICAgICB0aGlzLkV4cGxvcmUoY3gsIGN5KVxuICAgIH1cbiAgICB0aGlzLmNvbnRleHQuc2NhbGUodGhpcy5jb250ZXh0LmNhbnZhcy53aWR0aCAvIHcsIC10aGlzLmNvbnRleHQuY2FudmFzLmhlaWdodCAvIGgpXG4gICAgdGhpcy5jb250ZXh0LnRyYW5zbGF0ZSgteFJhbmdlWzBdLCAteVJhbmdlWzFdKVxuICAgIHRoaXMuY29udGV4dC5maWxsU3R5bGUgPSAncmdiYSgyMyw2NCwxNzAsMC4zKSdcbiAgfVxuXG4gIGk6IG51bWJlciA9IDBcblxuICBwdCA9ICh4OiBudW1iZXIsIHk6IG51bWJlcikgPT4ge1xuICAgIC8vIGlmICh0aGlzLmkgJSAxMDAgPT09IDApIGNvbnNvbGUubG9nKHRoaXMuaSwgJ3B0cycpXG4gICAgdGhpcy5jb250ZXh0LmJlZ2luUGF0aCgpXG4gICAgdGhpcy5jb250ZXh0LmFyYyh4LCB5LCAwLjAxLCAwLCAyICogTWF0aC5QSSlcbiAgICB0aGlzLmNvbnRleHQuZmlsbCgpXG4gICAgdGhpcy5jb250ZXh0LmNsb3NlUGF0aCgpXG4gICAgKyt0aGlzLmlcbiAgfVxuXG4gIEV4cGxvcmUoeDogbnVtYmVyLCB5OiBudW1iZXIpIHtcbiAgICBjb25zb2xlLmxvZygnZXZvbHV0aW9uIHN0YXJ0JylcbiAgICB0aGlzLk0uZXZvbHZlKFt4LCB5XSwgMTAwMCwgdGhpcy5wdClcbiAgICBjb25zb2xlLmxvZygnZXZvbHV0aW9uIGVuZCcpXG4gIH1cblxuICAvLyBXZSB3ZXJlIGNvbnNpZGVyaW5nIHNvbWUgYWx0ZXJuYXRpdmVzOiB0aGUgQ1BTIG9mIFNJQ00sIGFuZCBnZW5lcmF0b3JzLlxuICAvLyBGb3Igc2ltcGxpY2l0eSBpbiBKUywgdGhvdWdoLCB0aGUgY2FsbGJhY2sgZm9ybSBjYW4ndCByZWFsbHkgYmUgYmVhdC5cblxuICAvLyBFeHBsb3JlMCh4OiBudW1iZXIsIHk6IG51bWJlcikge1xuICAvLyAgIGZvciAobGV0IGkgPSAwOyBpIDwgMTAwMDsgKytpKSB7XG4gIC8vICAgICB0aGlzLk0ucnVuKHgsIHksICh4cDogbnVtYmVyLCB5cDogbnVtYmVyKSA9PiB7XG4gIC8vICAgICAgIHRoaXMucHQoeHAsIHlwKVxuICAvLyAgICAgICB4ID0geHBcbiAgLy8gICAgICAgeSA9IHlwXG4gIC8vICAgICB9LCAoKSA9PiB7XG4gIC8vICAgICAgIGNvbnNvbGUubG9nKCdGQUlMJylcbiAgLy8gICAgIH0pXG4gIC8vICAgfVxuICAvLyB9XG5cbiAgLy8gRXhwbG9yZTEoeDogbnVtYmVyLCB5OiBudW1iZXIpIHtcbiAgLy8gICBmb3IgKFt4LCB5XSBvZiB0aGlzLk0uZ2VuZXJhdGUoeCwgeSwgMTAwMCkpIHtcbiAgLy8gICAgIHRoaXMucHQoeCwgeSlcbiAgLy8gICB9XG4gIC8vIH1cbn1cbiJdfQ==
