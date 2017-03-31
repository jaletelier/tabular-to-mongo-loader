const TabularData = require('../lib/ExcelTabularData');
const CSVTabularData = require('../lib/CsvTabularData');
const async = require('async');
const assert = require('assert');

var tbcsv= new CSVTabularData({hasHeader:true, delimiter:';'});
var tb = new TabularData({hasHeader:true});
tbcsv.loadFromFile('files/test-file.csv', afterLoadCsv);
tb.loadFromFile('files/test-file.xls', afterLoad);

function afterLoad() {
  assert.equal(tb.originType,'excel');
  assert.ok(tb.workbook.SheetNames[0]=='S1' && tb.workbook.SheetNames[1]=='S2', 'Excel SheetNames not read properly:'+tb.workbook.SheetNames);
  assert.throws(function(){tb.getCurrentRow()},/First you need to call getNextRow/);
  assert.deepEqual(tb.getHeader(),[ 'Codigo', 'Descripcion' ]);

  async.whilst(function(){return tb.hasNext();},function(cb){
    tb.getNextRow(function(row){
      cb();
    });
  },function(err){
      assert(!err,'Whilst error');
      console.log('TEST SUCCESS');
  });
}


function afterLoadCsv(){
  assert.equal(tbcsv.originType,'csv');
  assert.deepEqual(tbcsv.getHeader(),['Codigo', 'Descripcion']);
  async.whilst(function(){return tbcsv.hasNext();},function(cb){
    tbcsv.getNextRow(function(row){
      console.log(row);
      cb();
    });
  },function(err){
    assert(!err,'Whilst CSV error');
    console.log('TEST SUCCESS CSV');
  });

}