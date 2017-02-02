'use strict'

var fs = require('fs')
var path = require('path')
var withConn = require('with-conn-pg')
var Joi = require('joi')
var boom = require('boom')
var createTable = readQuery('create.sql')
var dropTable = readQuery('drop.sql')
var insertAsset = readQuery('insert.sql')
var updateAsset = readQuery('update.sql')
var getOne = readQuery('get_one.sql')

var schema = {
  id: Joi.number().positive(),
  name: Joi.string().required(),
  status: Joi
    .string()
    .default('wait')
    .valid(['wait', 'operational', 'error'])
}

function readQuery (file) {
  return fs.readFileSync(path.join(__dirname, 'sql', file), 'utf8')
}

function assets (connString) {
  var conn = withConn(connString)

  return {
    joiSchema: schema,
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
    var valResult = Joi.validate(asset, schema)

    if (valResult.error) {
      return callback(valResult.error)
    }

    asset = valResult.value

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
      err = boom.notFound('asset not found')

      // connect compatibility
      err.notFound = true
      err.status = 404
    }

    callback(err, result.rows[0])
  }

  function execGet (conn, id, callback) {
    conn.query(getOne, [id], callback)
  }
}

module.exports = assets
