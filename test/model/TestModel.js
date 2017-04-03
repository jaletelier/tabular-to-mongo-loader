/**
 * Created by javierletelier on 03-04-17.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
mongoose.connect('mongodb://localhost/test');
var schema = new Schema({codigo: 'string', descripcion: 'string'},{collection: 'test'});

module.exports = mongoose.model('Test', schema);