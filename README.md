# Flora CSV DataSource

![](https://github.com/godmodelabs/flora-csv/workflows/ci/badge.svg)
[![NPM version](https://img.shields.io/npm/v/flora-csv.svg?style=flat)](https://www.npmjs.com/package/flora-csv)
[![NPM downloads](https://img.shields.io/npm/dm/flora-csv.svg?style=flat)](https://www.npmjs.com/package/flora-csv)

Simple CSV data source for [Flora](https://github.com/godmodelabs/flora).

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
