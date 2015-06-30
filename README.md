# assets-pg

Manage Assets, with node and postgres

An asset can be in three states: `'wait'`, `'operational'` and
`'error'`.

## Install

```
npm install @matteo.collina/assets-pg
```

<a name="api"></a>
## API

  * <a href="#assets"><code><b>buildAssets()</b></code></a>
  * <a href="#put"><code>assets.<b>put()</b></code></a>
  * <a href="#get"><code>assets.<b>get()</b></code></a>
  * <a href="#createSchema"><code>assets.<b>createSchema()</b></code></a>
  * <a href="#dropSchema"><code>assets.<b>dropSchema()</b></code></a>

-------------------------------------------------------

<a name="assets"></a>
### buildAssets(connectionString)

The factory for the assets module, you can just pass through a
[pg](http:/npm.im/pg) connection string.

Example:

```js
var connString = 'postgres://localhost/assets_tests'
var assets = require('@matteo.collina/assets-pg')(connString)
```

-------------------------------------------------------

<a name="put"></a>
### assets.put(object, callback(err, asset))

Adds or updates an asset. An asset can have three properties:

1. the `'id'`, which needs to be set only for existing assets
2. the `'name'`
3. the `'status'`, which can be any of
   `'wait'`, `'operational'` and `'error'`.

Validation is provided by [Joi](http://npm.im/joi), and a Joi error
object will be provided in case of validation errors.

The returned asset includes the `id`, if missing.

-------------------------------------------------------

<a name="get"></a>
### assets.get(id, callback(err, asset))

Fetches an assets, returns a
[`boom.notFound`](https://www.npmjs.com/package/boom#boom-notfound-message-data)
if not present.

-------------------------------------------------------

<a name="createSchema"></a>
### assets.createSchema(callback(err))

Create the schema in PostgreSQL for this module.

-------------------------------------------------------

<a name="dropSchema"></a>
### assets.dropSchema(callback(err))

Drop the schema in PostgreSQL for this module.

## License

MIT
