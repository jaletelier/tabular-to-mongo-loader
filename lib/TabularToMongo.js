/**
 * Created by javierletelier on 31-03-17.
 */
const async = require('async');
/*
 @param (CsvTabularData) tabularData
 @param (mongoose.model) params.model
 */
module.exports = TabularToMongo;

function TabularToMongo(tabularData, params, map) {
  this.td = tabularData;
  this.map = map;
  this.params = params;
  var attributes = [];
  var attributesByColumn={};
  var hasKey=false;
  if (Object.prototype.toString.call(map) == '[object Array]') {
    for (var i = 0; i < map.length; i++) {
      var info = map[i];
      hasKey=info.key || hasKey;
      var attrInfo={
        name: info.attribute,
        filter: info.filter,
        column: i,
        key: info.key
      };
      attributes.push(attrInfo);
      attributesByColumn[i]=attrInfo;
    }
  } else {
    Object.keys(map).forEach(function (attribute) {
      var info = map[attribute];
      if (tabularData.getHeader() && info.header && tabularData.getHeader().indexOf(info.header) >= 0) {
        info.column = tabularData.getHeader().indexOf(info.header);
      }
      hasKey=info.key || hasKey;
      var attrInfo={
        name: attribute,
        filter: info.filter,
        column: info.column,
        key: info.key
      };
      attributes.push(attrInfo);
      attributesByColumn[i]=attrInfo;
    });
  }
  this.attributes = attributes;
  this.attributesByColumn= attributesByColumn;
  this.td.attributesByColumn=this.attributesByColumn;
  this.hasKey= hasKey;
}

TabularToMongo.prototype.loadRow = function (cb) {
  var map = this.map;
  var attributes = this.attributes;
  var params = this.params;
  var hasKey = this.hasKey;
  var doc = {};
  var query = {};
  return this.td.getNextRow(function (row) {
    async.eachSeries(attributes, function (attribute, eachSeriesCb) {
      if (attribute.filter) {
        attribute.filter(row[attribute.column], function (value) {
          doc[attribute.name] = value;
          preEachSeriesCb();
        }, row);
      }
      else {
        doc[attribute.name] = row[attribute.column];
        preEachSeriesCb();
      }
      function preEachSeriesCb() {
        if (attribute.key) {
          query[attribute.name] = doc[attribute.name];
        }
        return eachSeriesCb();
      }
    }, function (errEachSeries) {
      if (errEachSeries) {
        console.log('TabularToMongo Error - errEachSeries: ' + errEachSeries);
      }
      if (params.presave) {
        params.presave(doc, saveDoc);
      } else {
        saveDoc(doc);
      }
      function saveDoc(presaveDoc) {
        if (!presaveDoc) postSave(undefined);
        params.model.findOne(query).exec(function (errFind, queryDoc) {
          if (errFind) {
            return postSave(undefined); // error ? :S
          }
          else if (!queryDoc || !hasKey) {
            if (params.ignoreNew) {
              return postSave(undefined);
            }
            params.model.create(presaveDoc, function (errCreate, createdDoc) {
              if (errCreate) return postSave(undefined);
              return postSave(createdDoc);
            });
          }
          else {
            if (params.ignoreIfExists) {
              return postSave(undefined);
            }
            Object.keys(presaveDoc).forEach(function (key) {
              queryDoc[key] = presaveDoc[key];
            });
            queryDoc.save(function (errSave, savedDoc) {
              if (errSave) return postSave(undefined);
              return postSave(savedDoc);
            });
          }
        });
      }

      function postSave(postSaveDoc) {
        if (params.postsave) {
          return params.postsave(postSaveDoc, cb);
        }
        return cb();
      }
    });
  });
};

TabularToMongo.prototype.loadAll = function (cb) {
  var instance = this;
  async.whilst(function () {
    return instance.td.hasNext();
  }, function (whilstCb) {
    instance.loadRow(whilstCb);
  }, cb);
};


// Methods.
// Set a TabularData
//Set params (??) Only - TabularData related Set model
//Asign mapping with Array: [
// {mongooseAtribute: bla bla
//  filter: (or assing) With Calback!
//  Model -> In case this belong to diferent model? (something like)
// }
// ]
// Option two: {header:{the same}}

//OPTIONS LIKE: REEPLACE, UPDATE (SET), IGNORE_DUPLICATES. ONLY_UPDATES, ONLY_REPLACES, IGNORE_CREATIONS ??
// Extra options like:
//PreSave, PostSave (to cancel a save)

//
// [{attribute:'sdfdsf'},{},{atribute:'dfsdfsd',filtr}]
//
// atribute:{
//   column:0 (header:'')
//   filter:{}
// }
//
// attribute2:{
//   filter:{} //if no column is asignewd the full row is given?
// }

//Posibility to check, not load.
//Timestamp or something to identify


//posible params:
//params.model REQUIRED
//params.map ???
// ignoreNew
// ignoreIfExists
//preSave method -> exectud before saving pass doc, and should return the doc again.
//postave method -> Executed after saviing, pass the created Doc or updated (with ID)
