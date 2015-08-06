'use strict';

var chai = require('chai');
var expect = chai.expect;
var FloraCsv = require('../index');
var bunyan = require('bunyan');

var api = {
    log: bunyan.createLogger({name: 'null', streams: []})
};

describe('flora-csv DataSource', function () {
    describe('interface', function () {
        var ds = new FloraCsv(api);
        it('should export a query function', function () {
            expect(ds.process).to.be.a('function');
        });

        it('should export a prepare function', function () {
            expect(ds.prepare).to.be.a('function');
        });
    });
});
