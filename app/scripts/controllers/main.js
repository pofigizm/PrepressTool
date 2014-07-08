'use strict';

function cleartoarray(string) {
  var array = string.replace(/[^0-9,-]/g, '').split(',');
  var returnarray = [];
  angular.forEach(array, function(value) {
    var spl = value.split('-');
    if (spl.length === 1) {returnarray.push(value);}
    if (spl.length > 1) {
      if (spl[0] > 0) {
        spl[0] = +spl[0];
        if (spl[spl.length-1] > 0) {
          spl[spl.length-1] = +spl[spl.length-1];
          if (spl[0] > spl[spl.length-1]) {spl.reverse();}
          for (var i = spl[0]; i <= spl[spl.length-1]; i++) {
            returnarray.push(i);
          }
        }
      }
    }
  });
  return returnarray;
}

function divide(number, divider) {
  return Math.ceil(+number / +divider) * +divider;
}

function unique(arr, all) {
  var obj = {};
  for(var i = 0; i < arr.length; i++) {
    var str = arr[i];
    if (+str >= 1 && +str <= all) {
      obj[str] = true;
    }
  }
  return Object.keys(obj);
}

function signjoin(sign, rev) {
  if (rev) {sign.reverse();}
  for (var i = 1; i < sign.length; i++) {
    if (sign[i].color === sign[i-1].color) {
      if (sign[i].pagearr.length === sign[i-1].pagearr.length) {
        if (sign[i].pagearr.length < sign[i].maxSign) {
          var newelement = new Object(sign[i]);
          newelement.pagearr = unique(sign[i-1].pagearr.concat(sign[i].pagearr), sign[i].allSign);
          sign.splice(i-1, 2, newelement);
        }
      }
    }
  }
  if (rev) {sign.reverse();}
  return sign;
}

function signtosheet(sign) {
  var sheet = [];
  angular.forEach(sign, function(value) {
    var findsheet = 0;
    for (var i = 1; i <= sheet.length; i++) {
      if (value.maxSign - sheet[i-1].pages >= value.pages) {
        findsheet = i;
        break;
      }
    }
    if (findsheet === 0) {
      findsheet = sheet.length + 1;
      sheet[findsheet-1] = {
        pages: 0,
        signatures: []
      };
    }
    sheet[findsheet-1].signatures.push(value);
    sheet[findsheet-1].pages += value.pages;
  });
  return sheet;
}

/**
 * @ngdoc function
 * @name prepresstoolApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the prepresstoolApp
 */

angular.module('prepresstoolApp')
  .controller('MainCtrl', ['$scope',
    function ($scope) {

      $scope.awesomeThings = [
        'HTML5 Boilerplate',
        'AngularJS',
        'Karma'
      ];

      $scope.pages = {
        bind: 'PerfectBound',
        all: 48,
        color: '2, 6, 21, 45',
        min: 4,
        maxGray: 8,
        maxColor: 8,
        rev: true
      };

      $scope.rebuild = function() {

        var bind = ($scope.pages.bind === 'PerfectBound') ? 1 : 2;
        var min = divide($scope.pages.min, 2*bind);
        var maxGray = divide($scope.pages.maxGray, min);
        var maxColor = divide($scope.pages.maxColor, min);
        var max = maxColor>maxGray ? maxColor : maxGray;
        var all = divide($scope.pages.all, min);
        var color = unique(cleartoarray($scope.pages.color), all);
        var rev = $scope.pages.rev;

        // Insert start signatures (min pages) 

        var sign = [];

        for (var i = 0; i < all/bind; i++) {
          if (i >= sign.length*min/bind) {
            sign.push({
              allSign: all,
              maxSign: maxGray,
              color: false,
              pagearr: []
            });
          }
          sign[sign.length-1].pagearr.push(i+1);
        }
        if (bind === 2) {
          for (var i = all/bind; i < all; i++) {
            sign[Math.ceil((all-i)/(min/bind))-1].pagearr.push(i+1);
          }
        }
             
        // setup colored 

        angular.forEach(sign, function(valueS) {
          angular.forEach(valueS.pagearr, function(valueP) {
            angular.forEach(color, function(value) {
              if (value == valueP) {
                valueS.maxSign = maxColor;
                valueS.color = true;
              }
            });
          });
        });

        // join signatures

        for (var count = min; count < max; count = count*2 ) {
          sign = signjoin(sign, rev);
        }

        // renumber joined signatures

        angular.forEach(sign, function(value, key) {
          value.number = key + 1;
          value.pages = value.pagearr.length;
          value.colspan = value.pages / 2;
          value.colorstyle = value.color ? 'color' : 'gray';
        });

        // split colored and uncolored signatures

        var signColor = [];
        var signBlack = [];

        angular.forEach(sign, function(value) {
          if (value.color) {
            signColor.push(value);
          } else {
            signBlack.push(value);
          }
        });

        // put signatures on sheets

        var pressSheet = [].concat(signtosheet(signColor)).concat(signtosheet(signBlack));

        // renumber sheets

        angular.forEach(pressSheet, function(value, key) {
          value.number = ('00' + (key + 1)).slice(-3);
        });

        var head = {};
        head.number = 'number:';
        head.signatures = [];
        for (var i = 0; i < max/2; i++) {
          head.signatures.push({
            allSign: all,
            pages: 2,
            colspan: 1,
            colorstyle: 'notback',
            pagearr: []
          });
        }

        pressSheet.splice(0, 0, head);

        // return data to page

        $scope.clearpages = {
          bind: bind === 1 ? 'PerfectBound' : 'SaddleStich',
          all: all,
          color: color.join(', '),
          min: min,
          maxGray: maxGray,
          maxColor: maxColor,
          rev: rev
        };
        $scope.signatures = sign;
        $scope.sheets = pressSheet;
        console.log(pressSheet);
      };

      // first build

      $scope.rebuild();

    }
  ]);