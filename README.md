Flora CSV DataSource
====================

[![Build Status](https://travis-ci.org/godmodelabs/flora-csv.svg?branch=master)](https://travis-ci.org/godmodelabs/flora-csv)
[![NPM version](https://badge.fury.io/js/flora-csv.svg)](https://www.npmjs.com/package/flora-csv)
[![Dependencies](https://img.shields.io/david/godmodelabs/flora-csv.svg)](https://david-dm.org/godmodelabs/flora-csv)

Simple CSV data source for [Flora](https://github.com/godmodelabs/flora).

Usage
-----

```xml
<?xml version="1.0" encoding="utf-8"?>
<resource primaryKey="id" xmlns:flora="urn:flora:options">
    <flora:dataSource type="csv" delimiter=";" quote="">
        <flora:option name="data">
            id;name;birthday
            1;Alice;1979-12-31
            2;Bob;1977-06-11
        </flora:option>
    </flora:dataSource>
    <id type="int"/>
    <name/>
    <birthday type="date"/>
</resource>
```


License
-------

[MIT](LICENSE)
