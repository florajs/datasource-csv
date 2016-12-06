'use strict';

const csvParse = require('csv-parse');
const { ImplementationError } = require('flora-errors');

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
                    throw new ImplementationError('DataSource "flora-csv" supports only "equal" filter-operator');
                }
            }
            if (matches) return true;
        }
        return false;
    };
}

class DataSource {
    /**
     * @param {Api} api
     * @param {Object} config
     */
    constructor(api, config) {
        this._log = api.log.child({ component: 'flora-csv' });
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
     * @param {Object} dsConfig DataSource config object
     */
    prepare(dsConfig) {
        dsConfig = dsConfig || {};
        this._queries[++this._queryIndex] = dsConfig.data;
        dsConfig._queryIndex = this._queryIndex;

        ['delimiter', 'quote', 'escape', 'comment'].forEach((opt) => {
            if (dsConfig[opt]) this._parserOptions[opt] = dsConfig[opt];
        });
    }

    /**
     * @param {Object} request
     * @param {Function} callback
     */
    process(request, callback) {
        if (request.order) {
            return callback(new ImplementationError('DataSource "flora-csv" does not support "order"'));
        }

        const proceed = () => {
            let result;

            // request.page
            const offset = (request.page && request.limit)
                ? ((request.page - 1) * request.limit)
                : 0;
            const limit = request.limit || null;

            try {
                result = this._parsed[request._queryIndex]
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
            } catch (e) {
                return callback(e);
            }

            return callback(null, {
                totalCount: null,
                data: result
            });
        };

        if (!this._parsed[request._queryIndex]) {
            this._log.trace('Parsing CSV');
            return csvParse(this._queries[request._queryIndex], this._parserOptions,
            (err, output) => {
                if (err) return callback(err);
                this._parsed[request._queryIndex] = output;
                return proceed();
            });
        }

        return proceed();
    }

    /**
     * @param {Function} callback
     */
    close(callback) {
        this._log.trace('Close');
        callback();
    }
}

module.exports = DataSource;
