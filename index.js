var logger = require('./logger')
  , config = require('iol_conf')
  , _ = require('underscore');


module.exports.checkchecksum = function(s) {
  var csMethod = config.checksums[config.checksums.inUse];

  var timestamp = s.slice(3, 13);
  var bytesum = _.reduce(s, function(m, c){ return m + c.charCodeAt()}, 0);

  return "" + timestamp + csMethod.filler + bytesum;
};

module.exports.verifyData = function(checksum, s) {
  return checksum === module.exports.checkchecksum(s);
};

// parseConfig: an Object holding regular expressions for
//  - getting each chunk out of the string
//  - getting an arbitrary amount of datapoints out of each chunk holding
//    name, timestamp and values
//
// dataDefs: once a series name is found, its expected format will be looked
//           up here:
//  {
//    <seriesName>: {
//      dataType: <String|parseInt|parseFloat> // optional, default: parseInt
//      columns: [<columName>, ..] // optional, default: ['time', 'line']
//    }
//  }
//
// output format:
// [
//  {
//    name: <name>,
//    points: [
//      [<timestamp>, <value1>, .., <valueN>],
//      ..
//    ]
//  },
//  ..
// ]
module.exports.parseData = function(dataString, parseConfig, dataDefs) {
  var chunks = dataString.match(parseConfig.chunk);

  function parseChunk(s) {
    var series = {};
    var dataPoints = s.match(parseConfig.dataPoints);
    dataPoints.forEach(function(p) {
      var elems = p.split(' ');
      elems = elems.map(function(s){ return s.replace(/[^\w\.-]/g, '')});
      var sName = dataDefs.sensorMap[elems[0]];
      var points = elems.slice(1, elems.length);
      series[sName] = series[sName] || { name: sName, points: [] };
      series[sName].points.push(points);
    });
    return series;
  }

  var defaults = dataDefs['defaultSeries']; // defaults for all series

  function validateChunk(series) {
    sNames = Object.keys(series);
    for (var name in sNames) {
      var seriesName = sNames[name];
      var dataDef = dataDefs[seriesName] || defaults;
      series[seriesName].columns = dataDef.columns || defaults.columns;
      var dataTypes = dataDef.dataTypes || defaults.dataTypes;
      if (series[seriesName].columns.length !== dataTypes.length) {
        throw new Error("Configuration error for series " + seriesName + " (different length of columns and dataTypes)");
      }
      _.each(series[seriesName].points, function(point) {
        if (point.length != series[seriesName].columns.length) {
          throw new Error("Validation error for datapoint " + point + "(different length of point and columns in config)");
        }
        for (var e=0;e<point.length;e++) {
          point[e] = dataTypes[e](point[e]);
        }
      });
    }
    return _.map(sNames, function(x){ return series[x] });
  }

  function convert(s) {
    var series = parseChunk(s);
    return validateChunk(series, defaults);
  }

  return _.reduce(chunks, function(m, v) { return m.concat(convert(v)); }, []);
};



// Adds a <`prefix` + '_'> to the values of all `keys` for each object in the
// provided `objArray`.
//
// NOTE: creates prototype children of the objects, but shadows the `keys`
// properties with their namespaced counterparts.
module.exports.namespace = function(keys, prefix, objArray) {
  return _.map(objArray, function(obj) {
    newObj = Object.create(obj);
    var allProperties = Object.keys(obj);
    for (var i in allProperties) {
      var propName = allProperties[i];
      var propValue = obj[propName];
      if (_.contains(keys, propName)) propValue =  prefix + "_" + propValue;
      newObj[propName] = propValue;
    }
    return newObj;
  });
};
