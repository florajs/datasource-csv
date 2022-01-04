# @florajs/datasource-csv

![](https://github.com/florajs/datasource-csv/workflows/ci/badge.svg)
[![NPM version](https://img.shields.io/npm/v/@florajs/datasource-csv.svg?style=flat)](https://www.npmjs.com/package/@florajs/datasource-csv)
[![NPM downloads](https://img.shields.io/npm/dm/@florajs/datasource-csv.svg?style=flat)](https://www.npmjs.com/package/@florajs/datasource-csv)

Simple CSV data source for [Flora](https://github.com/florajs/flora).

## Usage

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

## License

[MIT](LICENSE)
