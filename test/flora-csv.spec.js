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

    describe('csv parsing', function () {
        var ds;
        var request;
        var csv = [
            'id;name;birthday',
            '1;Alice;1979-12-31',
            '2;Bob;1977-06-11',
            '3;Horst;1990-01-02'
        ].join('\n');

        beforeEach(function () {
            ds = new FloraCsv(api);
            request = {
                delimiter: ';',
                query: csv,
                attributes: ['id', 'name', 'birthday']
            };
        });

        it('should return the parsed CSV data', function (done) {
            ds.prepare(request);
            ds.process(request, function (err, results) {
                if (err) return done(err);
                expect(results).to.be.an('object');
                expect(results.data).to.be.an('array');
                expect(results.data).to.eql([
                    { id: '1', name: 'Alice', birthday: '1979-12-31' },
                    { id: '2', name: 'Bob', birthday: '1977-06-11' },
                    { id: '3', name: 'Horst', birthday: '1990-01-02' }
                ]);
                done();
            });
        });
        
        describe('attributes', function () {
            it('should return only selected attributes', function (done) {
                request.attributes = ['id', 'birthday']
                ds.prepare(request);
                ds.process(request, function (err, results) {
                    if (err) return done(err);
                    expect(results.data).to.eql([
                        { id: '1', birthday: '1979-12-31' },
                        { id: '2', birthday: '1977-06-11' },
                        { id: '3', birthday: '1990-01-02' }
                    ]);
                    done();
                });
            });
        });

        describe('limit', function () {
            it('should implement "limit"', function (done) {
                request.limit = 2;
                ds.prepare(request);
                ds.process(request, function (err, results) {
                    if (err) return done(err);
                    expect(results.data).to.eql([
                        { id: '1', name: 'Alice', birthday: '1979-12-31' },
                        { id: '2', name: 'Bob', birthday: '1977-06-11' }
                    ]);
                    done();
                });
            });

            it('should implement "page"', function (done) {
                request.limit = 2;
                request.page = 2;
                ds.prepare(request);
                ds.process(request, function (err, results) {
                    if (err) return done(err);
                    expect(results.data).to.eql([
                        { id: '3', name: 'Horst', birthday: '1990-01-02' }
                    ]);
                    done();
                });
            });
        });

        describe('filter', function () {
            it('should work for "equal"', function (done) {
                request.filter = [[
                    {attribute: 'id', value: '2', operator: 'equal'}
                ]];
                ds.prepare(request);
                ds.process(request, function (err, results) {
                    if (err) return done(err);
                    expect(results).to.be.an('object');
                    expect(results.data).to.be.an('array');
                    expect(results.data).to.eql([
                        { id: '2', name: 'Bob', birthday: '1977-06-11' }
                    ]);
                    done();
                });
            });

            it('should implement AND', function (done) {
                request.filter = [[
                    {attribute: 'id', value: '2', operator: 'equal'},
                    {attribute: 'name', value: 'Bob', operator: 'equal'},
                ]];
                ds.prepare(request);
                ds.process(request, function (err, results) {
                    if (err) return done(err);
                    expect(results).to.be.an('object');
                    expect(results.data).to.be.an('array');
                    expect(results.data).to.eql([
                        { id: '2', name: 'Bob', birthday: '1977-06-11' }
                    ]);
                    done();
                });
            });

            it('should implement AND (empty result)', function (done) {
                request.filter = [[
                    {attribute: 'id', value: '2', operator: 'equal'},
                    {attribute: 'name', value: 'Alice', operator: 'equal'},
                ]];
                ds.prepare(request);
                ds.process(request, function (err, results) {
                    if (err) return done(err);
                    expect(results).to.be.an('object');
                    expect(results.data).to.be.an('array');
                    expect(results.data).to.eql([]);
                    done();
                });
            });

            it('should implement OR', function (done) {
                request.filter = [
                    [{attribute: 'id', value: '2', operator: 'equal'}],
                    [{attribute: 'name', value: 'Alice', operator: 'equal'}],
                ];
                ds.prepare(request);
                ds.process(request, function (err, results) {
                    if (err) return done(err);
                    expect(results).to.be.an('object');
                    expect(results.data).to.be.an('array');
                    expect(results.data).to.eql([
                        { id: '1', name: 'Alice', birthday: '1979-12-31' },
                        { id: '2', name: 'Bob', birthday: '1977-06-11' }
                    ]);
                    done();
                });
            });

            it('should throw on invalid filter', function (done) {
                request.filter = [[
                    {attribute: 'id', value: '2', operator: 'greater'}
                ]];
                ds.prepare(request);
                ds.process(request, function (err, results) {
                    expect(err).to.be.an('object');
                    done();
                });
            });
        });
    });
});
