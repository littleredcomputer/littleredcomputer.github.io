(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.standardmap = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
var StandardMap = (function () {
    function StandardMap(K) {
        this.twoPi = 2 * Math.PI;
        this.callback = function (theta, I, n, callback) {
            for (var i = 0; i < n; ++i) {
                callback(theta, I);
                var nI = I + (this.K * Math.sin(theta));
                theta = this.PV(theta + nI);
                I = this.PV(nI);
            }
        };
        this.K = K;
        this.PV = this.principal_value(this.twoPi);
    }
    StandardMap.prototype.principal_value = function (cuthigh) {
        var cutlow = cuthigh - this.twoPi;
        return function (x) {
            if (cutlow <= x && x < cuthigh) {
                return x;
            }
            var y = x - this.twoPi * Math.floor(x / this.twoPi);
            return y < cuthigh ? y : y - this.twoPi;
        };
    };
    StandardMap.prototype.run = function (theta, I, point, fail) {
        var nI = I + (this.K * Math.sin(theta));
        point(this.PV(theta + nI), this.PV(nI));
    };
    return StandardMap;
}());
exports.StandardMap = StandardMap;
var ExploreMap = (function () {
    function ExploreMap(canvas, M) {
        var _this = this;
        this.canvas = document.getElementById(canvas);
        this.M = M;
        this.context = this.canvas.getContext('2d');
        var _a = [2 * Math.PI, 2 * Math.PI], w = _a[0], h = _a[1];
        this.canvas.onmousedown = function (e) {
            var _a = [e.offsetX / _this.context.canvas.width * w,
                h - e.offsetY / _this.context.canvas.height * h], cx = _a[0], cy = _a[1];
            _this.Explore(cx, cy);
        };
        this.context.scale(this.context.canvas.width / w, -this.context.canvas.height / h);
        this.context.translate(0, -h);
    }
    ExploreMap.prototype.pt = function (x, y) {
        this.context.fillStyle = 'rgba(23,64,170,0.3)';
        this.context.beginPath();
        this.context.arc(x, y, 0.01, 0, 2 * Math.PI);
        this.context.fill();
        this.context.closePath();
    };
    ExploreMap.prototype.Explore0 = function (x, y) {
        var _this = this;
        for (var i = 0; i < 1000; ++i) {
            this.M.run(x, y, function (xp, yp) {
                _this.pt(xp, yp);
                x = xp;
                y = yp;
            }, function () {
                console.log('FAIL');
            });
        }
    };
    ExploreMap.prototype.Explore = function (x, y) {
        this.M.callback(x, y, 1000, this.pt.bind(this));
    };
    return ExploreMap;
}());
exports.ExploreMap = ExploreMap;

},{}]},{},[1])(1)
});
//# sourceMappingURL=standard-map.bundle.js.map
