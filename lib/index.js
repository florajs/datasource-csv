'use strict';

var csvParse = require('csv-parse');

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

    function proceed() {
        // TODO: handle request, pagination, filter, etc.
        callback(null, {
            totalCount: null,
            data: self._parsed[request._queryIndex]
        });
    }

    if (!this._parsed[request._queryIndex]) {
        self._log.trace('Parsing CSV');
        csvParse(this._queries[request._queryIndex], this._parserOptions, function (err, output) {
            if (err) callback(err);
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
