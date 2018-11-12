/* global describe, it, beforeEach */

'use strict';

const { expect } = require('chai');
const bunyan = require('bunyan');

const FloraCsv = require('../lib/index');

const api = {
    log: bunyan.createLogger({ name: 'null', streams: [] })
};

describe('flora-csv DataSource', () => {
    describe('interface', () => {
        const ds = new FloraCsv(api);
        it('should export a query function', () => {
            expect(ds.process).to.be.a('function');
        });

        it('should export a prepare function', () => {
            expect(ds.prepare).to.be.a('function');
        });
    });

    describe('csv parsing', () => {
        let ds;
        let request;
        const csv = [
            'id;name;birthday',
            '1;Alice;1979-12-31',
            '2;Bob;1977-06-11',
            '3;Horst;1990-01-02'
        ].join('\n');

        beforeEach(() => {
            ds = new FloraCsv(api);
            request = {
                delimiter: ';',
                data: csv,
                attributes: ['id', 'name', 'birthday']
            };
        });

        it('should return the parsed CSV data', async () => {
            ds.prepare(request);
            const results = await ds.process(request);
            expect(results).to.be.an('object');
            expect(results.data).to.be.an('array');
            expect(results.data).to.eql([
                { id: '1', name: 'Alice', birthday: '1979-12-31' },
                { id: '2', name: 'Bob', birthday: '1977-06-11' },
                { id: '3', name: 'Horst', birthday: '1990-01-02' }
            ]);
        });

        describe('attributes', () => {
            it('should return only selected attributes', async () => {
                request.attributes = ['id', 'birthday'];
                ds.prepare(request);
                const results = await ds.process(request);
                expect(results.data).to.eql([
                    { id: '1', birthday: '1979-12-31' },
                    { id: '2', birthday: '1977-06-11' },
                    { id: '3', birthday: '1990-01-02' }
                ]);
            });
        });

        describe('limit', () => {
            it('should implement "limit"', async () => {
                request.limit = 2;
                ds.prepare(request);
                const results = await ds.process(request);
                expect(results.data).to.eql([
                    { id: '1', name: 'Alice', birthday: '1979-12-31' },
                    { id: '2', name: 'Bob', birthday: '1977-06-11' }
                ]);
            });

            it('should implement "page"', async () => {
                request.limit = 2;
                request.page = 2;
                ds.prepare(request);
                const results = await ds.process(request);
                expect(results.data).to.eql([
                    { id: '3', name: 'Horst', birthday: '1990-01-02' }
                ]);
            });
        });

        describe('filter', () => {
            it('should work for "equal"', async () => {
                request.filter = [[
                    { attribute: 'id', value: '2', operator: 'equal' }
                ]];
                ds.prepare(request);
                const results = await ds.process(request);
                expect(results).to.be.an('object');
                expect(results.data).to.be.an('array');
                expect(results.data).to.eql([
                    { id: '2', name: 'Bob', birthday: '1977-06-11' }
                ]);
            });

            it('should implement AND', async () => {
                request.filter = [[
                    { attribute: 'id', value: '2', operator: 'equal' },
                    { attribute: 'name', value: 'Bob', operator: 'equal' },
                ]];
                ds.prepare(request);
                const results = await ds.process(request);
                expect(results).to.be.an('object');
                expect(results.data).to.be.an('array');
                expect(results.data).to.eql([
                    { id: '2', name: 'Bob', birthday: '1977-06-11' }
                ]);
            });

            it('should implement AND (empty result)', async () => {
                request.filter = [[
                    { attribute: 'id', value: '2', operator: 'equal' },
                    { attribute: 'name', value: 'Alice', operator: 'equal' },
                ]];
                ds.prepare(request);
                const results = await ds.process(request);
                expect(results).to.be.an('object');
                expect(results.data).to.be.an('array');
                expect(results.data).to.eql([]);
            });

            it('should implement OR', async () => {
                request.filter = [
                    [{ attribute: 'id', value: '2', operator: 'equal' }],
                    [{ attribute: 'name', value: 'Alice', operator: 'equal' }],
                ];
                ds.prepare(request);
                const results = await ds.process(request);
                expect(results).to.be.an('object');
                expect(results.data).to.be.an('array');
                expect(results.data).to.eql([
                    { id: '1', name: 'Alice', birthday: '1979-12-31' },
                    { id: '2', name: 'Bob', birthday: '1977-06-11' }
                ]);
            });

            it('should throw on invalid filter', (done) => {
                request.filter = [[
                    { attribute: 'id', value: '2', operator: 'greater' }
                ]];
                ds.prepare(request);
                ds.process(request)
                    .catch((err) => {
                        expect(err).to.be.an('error');
                        done();
                    });
            });
        });
    });
});
