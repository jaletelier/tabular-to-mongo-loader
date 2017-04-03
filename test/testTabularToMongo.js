/**
 * Created by javierletelier on 03-04-17.
 */
const TabularData = require('../lib/ExcelTabularData');
const CSVTabularData = require('../lib/CsvTabularData');
const TabularToMongo = require('../lib/TabularToMongo');
const TestModel = require('./model/TestModel');
const async = require('async');
const assert = require('assert');


var excelTD = new TabularData({hasHeader:true});
excelTD.loadFromFile('files/test-file.xls', afterLoad);

function afterLoad() {
  var tbtm = new TabularToMongo(excelTD, {
      model: TestModel
    },
    [
      {attribute: 'codigo'},
      {attribute: 'descripcion', filter:function(value,cb){return cb('-'+value);}}
    ]
  );
  tbtm.loadAll(function () {
    console.log("FINISH");
  })
}


