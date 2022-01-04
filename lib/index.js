'use strict';

const { promisify } = require('util');

const { parse } = require('csv-parse');
const { ImplementationError } = require('@florajs/errors');

function filterFn(requestFilter) {
    if (!requestFilter) return () => true;

    return (row) => {
        let matches = false;
        for (let i = 0; i < requestFilter.length; i++) {
            matches = true;
            for (let j = 0; j < requestFilter[i].length; j++) {
                const filter = requestFilter[i][j];
                switch (filter.operator) {
                    case 'equal':
                        // eslint-disable-next-line eqeqeq
                        if (row[filter.attribute] != filter.value) matches = false;
                        break;
                    default:
                        throw new ImplementationError('DataSource "csv" supports only "equal" filter-operator');
                }
            }
            if (matches) return true;
        }
        return false;
    };
}

const parsePromise = promisify(parse);

class DataSource {
    /**
     * @param {Api} api
     * @param {Object} config
     */
    constructor(api, config) {
        this._log = api.log.child({ component: 'datasource-csv' });
        this._config = config;
        this._queryIndex = 0;
        this._queries = {};
        this._parsed = {};

        this._parserOptions = {
            columns: true, // use first line as columns
            trim: true,
            auto_parse: false,
            skip_empty_lines: true
        };
    }

    /**
     * @param {Object} [dsConfig] DataSource config object
     */
    prepare(dsConfig = {}) {
        this._queries[++this._queryIndex] = dsConfig.data;
        dsConfig._queryIndex = this._queryIndex;

        ['delimiter', 'quote', 'escape', 'comment'].forEach((opt) => {
            if (dsConfig[opt]) this._parserOptions[opt] = dsConfig[opt];
        });
    }

    /**
     * @param {Object} request
     * @return {Promise<Object>}
     */
    async process(request) {
        if (request.order) {
            throw new ImplementationError('DataSource "csv" does not support "order"');
        }

        if (!this._parsed[request._queryIndex]) {
            this._log.trace('Parsing CSV');

            this._parsed[request._queryIndex] = await parsePromise(
                this._queries[request._queryIndex],
                this._parserOptions
            );
        }

        // request.page
        const offset = request.page && request.limit ? (request.page - 1) * request.limit : 0;
        const limit = request.limit || null;

        let result = this._parsed[request._queryIndex]
            // request.filter
            .filter(filterFn(request.filter))

            // request.attributes
            .map((row) => {
                const newRow = {};
                request.attributes.forEach((attribute) => {
                    newRow[attribute] = row[attribute];
                });
                return newRow;
            });

        // request.limit
        if (limit) result = result.slice(offset, limit + offset);

        return {
            totalCount: null,
            data: result
        };
    }

    /**
     * @return {Promise}
     */
    async close() {
        this._log.trace('Close');
    }
}

module.exports = DataSource;
