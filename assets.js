'use strict'

var fs = require('fs')
var path = require('path')
var withConn = require('with-conn-pg')
var Ajv = require('ajv')
var ajv = new Ajv({ useDefaults: true })
var createError = require('http-errors')
var createTable = readQuery('create.sql')
var dropTable = readQuery('drop.sql')
var insertAsset = readQuery('insert.sql')
var updateAsset = readQuery('update.sql')
var getOne = readQuery('get_one.sql')

var schema = {
  type: 'object',
  required: ['name'],
  properties: {
    id: {
      type: 'number'
    },
    name: {
      type: 'string',
      minLength: 1
    },
    status: {
      type: 'string',
      enum: ['wait', 'operational', 'error'],
      default: 'wait'
    }
  }
}

var validate = ajv.compile(schema)

function readQuery (file) {
  return fs.readFileSync(path.join(__dirname, 'sql', file), 'utf8')
}

function assets (connString) {
  var conn = withConn(connString)

  return {
    jsonSchema: schema,
    createSchema: conn(createSchema),
    dropSchema: conn(dropSchema),
    put: conn([
      execPut,
      returnFirst
    ]),
    get: conn([
      execGet,
      returnFirst
    ]),
    end: conn.end.bind(conn)
  }

  function createSchema (conn, callback) {
    conn.query(createTable, callback)
  }

  function dropSchema (conn, callback) {
    conn.query(dropTable, callback)
  }

  function execPut (conn, asset, callback) {
    var valid = validate(asset)
    if (!valid) {
      var err = new createError.UnprocessableEntity()
      err.details = validate.errors
      return callback(err)
    }

    var toExec = asset.id ? updateAsset : insertAsset
    var args = [
      asset.name,
      asset.status
    ]

    if (asset.id) {
      args.unshift(asset.id)
    }

    conn.query(toExec, args, callback)
  }

  function returnFirst (result, callback) {
    var err = null

    if (result.rows.length === 0) {
      err = new createError.NotFound()
      err.notFound = true
    }

    callback(err, result.rows[0])
  }

  function execGet (conn, id, callback) {
    conn.query(getOne, [id], callback)
  }
}

module.exports = assets
