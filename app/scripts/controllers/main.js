'use strict';

function comnum(a, b) {  // compare numbers
  return a-b;  //  +a>+b ? 1 : -1;  
}

function dashview(array) {
  array.sort(comnum);
  angular.forEach(array, function(value, key) {
    array[key] = [Number(value)];
  });
  for(var i = array.length-2; i >= 0; i--) {
    if (array[i+1][0] - array[i][array[i].length-1] ===1) {
      array.splice(i, 2, array[i].concat(array[i+1]));
    }
  }
  angular.forEach(array, function(value, key) {
    if (value.length > 1) {
      array[key] = String(value[0] + '-' + value[value.length-1]); 
    } else {
      array[key] = String(value[0]); 
    }
  });
  return array;  
}

function cleartoarray(string) {
  var array = string.replace(/[^0-9,-]/g, '').split(',');
  var returnarray = [];
  angular.forEach(array, function(value) {
    var spl = value.split('-').sort(comnum);
    for (var i = +spl[0]; i <= +spl[spl.length-1]; i++) {
      if (i>0) {
        returnarray.push(i);
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
        var signsize = sign[i].sheetSize<sign[i].maxSign ? sign[i].sheetSize : sign[i].maxSign;
        if (sign[i].pagearr.length < signsize) {
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
      if (value.sheetSize - sheet[i-1].pages >= value.pages) {
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

function spine(mathspine) {
  var spi = mathspine.thinkness * mathspine.pages / 200;
  mathspine.offset = Math.round(1.30 * spi) / 10 + 1;
  mathspine.silk   = Math.round(0.90 * spi) / 10 + 1;
  mathspine.gloss  = Math.round(0.75 * spi) / 10 + 1;

  return mathspine;
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

      $scope.mathspine = {
        thinkness: 115,
        pages: 48
      };

      $scope.pages = {
        bind: 1,
        all: 48,
        color: '1-4, 6, 21, 45',
        min: 4,
        max: 8,
        maxGray: 16,
        maxColor: 8,
        rev: true
      };

      $scope.rebuild = function() {

        var bind = Number($scope.pages.bind);
        var min = divide($scope.pages.min, 2*bind);
        var max = divide($scope.pages.max, min);        
        var maxGray = divide($scope.pages.maxGray, min);
        var maxColor = divide($scope.pages.maxColor, min);
        var maxSheet = maxColor>maxGray ? maxColor : maxGray;
        var all = divide($scope.pages.all, min);
        var color = unique(cleartoarray($scope.pages.color), all);
        var rev = $scope.pages.rev;



        // Insert start signatures (min pages) 

        var sign = [];

        for (var i = 0; i < all/bind; i++) {
          if (i >= sign.length*min/bind) {
            sign.push({
              allSign: all,
              maxSign: max,
              sheetSize: maxGray,
              color: false,
              pagearr: []
            });
          }
          sign[sign.length-1].pagearr.push(i+1);
        }
        if (bind === 2) {
          for (var j = all/bind; j < all; j++) {
            sign[Math.ceil((all-j)/(min/bind))-1].pagearr.push(j+1);
          }
        }
             
        // setup colored 

        angular.forEach(sign, function(valueS) {
          angular.forEach(valueS.pagearr, function(valueP) {
            angular.forEach(color, function(value) {
              if (value == valueP) {
                valueS.sheetSize = maxColor;
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
          value.dashpages = dashview(value.pagearr);
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
        for (var k = 0; k < maxSheet/2; k++) {
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
          bind: bind,
          bindastext: bind===1 ? 'PerfectBound' : 'SaddleStich',
          all: all,
          color: dashview(color).join(', '),
          min: min,
          max: max,
          maxGray: maxGray,
          maxColor: maxColor,
          rev: rev
        };

        $scope.signatures = sign;
        $scope.sheets = pressSheet;

        $scope.mathspine = spine($scope.mathspine);
      };

      // first build

      $scope.rebuild();

    }
  ]);