/**
 * Created by javierletelier on 30-03-17.
 */
const fs = require('fs');
const csv = require('fast-csv');
const request = require('request');

module.exports=CsvTabularData;

/*
 @param {boolean} params.hasHeader - To allow index by header, and skip first row

 */
function CsvTabularData(params){
  this.originType = 'csv';
  this.params = params || {};
  this.fileStream=undefined;
  this.currentRow=0;
  this.rows=[];
  if(params.hasHeader){
    this.readHeader=true;
  }
}

CsvTabularData.prototype.loadFromFile=function(filePath,cb){
  this.fileStream=fs.createReadStream(filePath);
  process(this,cb);
};

CsvTabularData.prototype.loadFromUri=function(fileUri,cb){
  this.fileStream=request(fileUri);
  process(this,cb);
};

CsvTabularData.prototype.getCurrentRow=function () {
  return this.rows[this.currentRow];
};

CsvTabularData.prototype.getNextRow=function (cb) {
  this.currentRow++;
  if(!cb) return this.rows[this.currentRow];
  return cb(this.rows[this.currentRow]);
};

CsvTabularData.prototype.hasNext=function () {
  return this.currentRow<this.rows.length-1;
};

CsvTabularData.prototype.getHeader=function () {
  return this.rows[0];
};

function process(instance,cb) {
  csv
    .fromStream(instance.fileStream,{delimiter:instance.params.delimiter})
    .on("data", function (row) {
      instance.rows.push(row);
    })
    .on("end", function () {
      cb();
    });
}