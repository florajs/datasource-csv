'use strict';

var csvParse = require('csv-parse');
var ImplementationError = require('flora-errors').ImplementationError;

/**
 * @constructor
 * @param {Api} api
 * @param {Object} config
 */
var DataSource = module.exports = function (api, config) {
    this._log = api.log.child({component: 'flora-csv'});
    this._config = config;
    this._queryIndex = 0;
    this._queries = {};
    this._parsed = {};

    this._parserOptions = {
        columns: true, // use first line as columns
        trim: true,
        'auto_parse': false,
        'skip_empty_lines': true
    };
};

/**
 * @param {Object} dsConfig DataSource config object
 */
DataSource.prototype.prepare = function (dsConfig) {
    var self = this;
    dsConfig = dsConfig || {};
    this._queries[++this._queryIndex] = dsConfig.query;
    dsConfig._queryIndex = this._queryIndex;

    ['delimiter', 'quote', 'escape', 'comment'].forEach(function (opt) {
        if (dsConfig[opt]) self._parserOptions[opt] = dsConfig[opt];
    });
};

/**
 * @param {Object} request
 * @param {Function} callback
 */
DataSource.prototype.process = function (request, callback) {
    var self = this;

    if (request.order) {
        return callback(new ImplementationError('DataSource "flora-csv" does not support "order"'));
    }

    function proceed() {
        var result;

        // request.page
        var offset = (request.page && request.limit) ? ((request.page - 1) * request.limit) : 0;
        var limit = request.limit || null;

        try {
            result = self._parsed[request._queryIndex]
                // request.filter
                .filter(filterFn(request.filter))

                // request.attributes
                .map(function (row) {
                    var newRow = {};
                    request.attributes.forEach(function (attribute) {
                        newRow[attribute] = row[attribute];
                    });
                    return newRow;
                });

            // request.limit
            if (limit) result = result.slice(offset, limit + offset);
        } catch (e) {
            return callback(e);
        }

        callback(null, {
            totalCount: null,
            data: result
        });
    }

    if (!this._parsed[request._queryIndex]) {
        self._log.trace('Parsing CSV');
        csvParse(this._queries[request._queryIndex], this._parserOptions, function (err, output) {
            if (err) return callback(err);
            self._parsed[request._queryIndex] = output;
            proceed();
        });
    } else {
        proceed();
    }
};

/**
 * @param {Function} callback
 */
DataSource.prototype.close = function (callback) {
    callback();
};

function filterFn(requestFilter) {
    if (!requestFilter) {
        return function () {
            return true;
        };
    }

    return function (row) {
        var matches = false;
        for (var i = 0; i < requestFilter.length; i++) {
            matches = true;
            for (var j = 0; j < requestFilter[i].length; j++) {
                var filter = requestFilter[i][j];
                switch (filter.operator) {
                case 'equal':
                    if (row[filter.attribute] != filter.value) matches = false; // eslint-disable-line eqeqeq
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
