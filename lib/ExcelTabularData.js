/**
 * Created by javierletelier on 29-03-17.
 */
//Excel TabularData interface
var xlsx = require('xlsx');
const request = require('request');

module.exports = ExcelTabularData;
/*
  @param {boolean} params.hasHeader - To allow index by header, and skip first row
  @param {string} params.sheet - Sheet name to read
  @param {boolean} mapping.formattedData - Specify if the data should be read from the formatted field
 */
function ExcelTabularData(params) {
  this.originType = 'excel';
  this.params=params||{};
  this.range=undefined;
  this.currentRow=undefined;
  this.firstRow=undefined;
  this.lastRow=undefined;
  this.workbook=undefined;
  this.sheetName=undefined;
  this.sheet=undefined;
  this.mapping = [];
}

ExcelTabularData.prototype.loadFromFile = function (filePath, cb) {
  this.workbook = xlsx.readFile(filePath);
  prepare(this,cb);
};

ExcelTabularData.prototype.loadFromUri = function (fileUri, cb) {
  const instance = this;
  request.get({
      url: fileUri,
      encoding: null
    }, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        instance.workbook = xlsx.read(body);
        prepare(this,cb);
      }
      if(error) cb(error);
      else{cb('Wrong status code: '+response.statusCode)}
    }
  );
};

ExcelTabularData.prototype.getCurrentRow=function(){
  if(this.currentRow==this.firstRow){
    throw new Error('First you need to call getNextRow');
  }
  var row=[];
  for (var C = this.range.s.c; C <= this.range.e.c; C += 1) {
    var cellKey = xlsx.utils.encode_cell({c: C, r: this.currentRow});
    if (this.sheet[cellKey] !== undefined) {
      if (this.mapping[C] && this.mapping[C].formattedData) {
        row[C] = this.sheet[cellKey].w;
      } else {
        row[C] = this.sheet[cellKey].v;
      }
    }
  }
  return row;
};

ExcelTabularData.prototype.getNextRow=function(cb){
  this.currentRow+=1;
  if(!cb) return this.getCurrentRow();
  return cb(this.getCurrentRow());
};

ExcelTabularData.prototype.hasNext=function () {
  return this.currentRow<this.lastRow;
};

ExcelTabularData.prototype.getHeader=function () {
  var row=[];
  for (var C = this.range.s.c; C <= this.range.e.c; C += 1) {
    var cellKey = xlsx.utils.encode_cell({c: C, r: this.firstRow});
    if (this.sheet[cellKey] !== undefined) {
      if (this.mapping[C] && this.mapping[C].formattedData) {
        row[C] = this.sheet[cellKey].w;
      } else {
        row[C] = this.sheet[cellKey].v;
      }
    }
  }
  return row;
};

function prepare(instance,cb){
  instance.sheetName = instance.workbook.SheetNames[instance.params.sheet?instance.params.sheet:0];
  instance.sheet = instance.workbook.Sheets[instance.sheetName];
  instance.range = instance.sheet["!range"];
  if(!instance.range){ instance.range=xlsx.utils.decode_range(instance.sheet["!ref"]);}
  instance.firstRow = ((instance.params.hasHeader) ? instance.range.s.r + 1 : instance.range.s.r)-1;
  instance.currentRow=instance.firstRow;
  instance.lastRow = instance.range.e.r;
  cb();
}
