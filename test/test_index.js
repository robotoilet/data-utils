var should = require('should')
  , checkchecksum = require('../index').checkchecksum
  , verifyData = require('../index').verifyData
  , parseData = require('../index').parseData
  , namespace = require('../index').namespace;


describe('checkchecksum', function() {
  var data = "(a 1234567890 134 11 whatever blabla";
  it('should return the adquate checksum for a given string', function(done) {
    checkchecksum(data).should.equal("1234567890:2548" );
    done();
  });
});

describe('verify_data', function() {
  it('should verify a given data string correctly', function(done) {
    var data = "(a 1234567890 134 11 whatever blabla";
    verifyData("1234567890:2548", data).should.be.true;
    done()
  });
});

describe('parse_dataString', function() {


  it('should parse a dataString to a javascript object', function(done) {
    var testString = '(a 1415707255 12)(a 1415707255 13)' +
                     '(a 1415707255 15)(b 1415707255 23.356 12)' +
                     '(c 1415707255 400)(c 1415707255 600)';
    var parserConfig = {
      chunk: /[^\n]+/g,
      dataPoints: /\(([^)]+)/g
    };
    var series = {
      defaultSeries: {
        columns: ['time', 'line'],
        dataTypes: [parseInt, parseInt]
      },
      sensorMap: {
        a: 'SensorX',
        b: 'SensorY',
        c: 'SensorZ',
        d: 'sensorschmensor'
      },
      SensorY: {
        columns: ['time', 'x', 'y'],
        dataTypes: [parseInt, parseFloat, parseInt],
      }
    }; 

    parseData(testString, parserConfig, series).should.eql([
      {
        name: 'SensorX',
        columns: ['time', 'line'],
        points: [
          [1415707255, 12],
          [1415707255, 13],
          [1415707255, 15]
        ]
      },
      {
        name: 'SensorY',
        columns: ['time', 'x', 'y'],
        points: [
          [1415707255, 23.356, 12]
        ]
      },
      {
        name: 'SensorZ',
        columns: ['time', 'line'],
        points: [
          [1415707255, 400],
          [1415707255, 600]
        ]
      }
    ]);
    done();
  });
});

describe('namespace_objects', function() {

  var objects = [
    {a: 'b', name: 'bla'},
    {a: 'c', b: 'haha', name: 'blub'}
  ];

  var newObjects = namespace(['name'], 'new', objects);

  it('should return a list of objects with prefixed name property', function(done) {
    newObjects[0].name.should.equal('new_bla');
    newObjects[0].a.should.equal('b');
    newObjects[1].name.should.equal('new_blub');
    newObjects[1].a.should.equal('c');
    newObjects[1].b.should.equal('haha');
    done();
  });
  it('..but should leave the old objects in peace', function(done) {
    objects[0].name.should.equal('bla');
    objects[1].name.should.equal('blub');
    done();
  });
});

