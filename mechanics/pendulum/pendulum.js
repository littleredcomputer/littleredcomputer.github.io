angular.module('DrivenPendulum', ['ngMaterial', 'ngSanitize'])
.controller('PendulumCtrl', ['$q', function($q) {
  this.go = function() {
    console.log('go!');
  };
  console.log($q);
  this.parameters = [{nameHtml: 'ω<sub>0</sub>',
                      min: -3.1416,
                      max: 3.1416,
                      step: 0.1,
                      value: 1},
                     {nameHtml: 'ω&#x307;<sub>0</sub>',
                      min: -3,
                      max: 3,
                      step: 0.1,
                      value: 0},
                     {nameHtml: 'g',
                      min: -2,
                      max: 15,
                      step: 0.1,
                      value: 9.8},
                     {nameHtml: 'A',
                      min: 0,
                      max: 1,
                      step: 0.05,
                      value: 0.1}];
}])
.directive('valueSliders', function() {
  console.log('valuesliders');
  return {
    restrict: 'E',
    templateUrl: 'value-sliders.html'
  };
});
