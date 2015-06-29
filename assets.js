'use strict'

var pg = require('pg')
var fs = require('fs')
var path = require('path')
var fastfall = require('fastfall')
var createTable = readQuery('create.sql')
var dropTable = readQuery('drop.sql')
var insertAsset = readQuery('insert.sql')
var updateAsset = readQuery('update.sql')
var getOne = readQuery('get_one.sql')

function readQuery (file) {
  return fs.readFileSync(path.join(__dirname, 'sql', file), 'utf8')
}

function assets (connString) {

  var fall = fastfall()

  return {
    createSchema: withConn(createSchema),
    dropSchema: withConn(dropSchema),
    put: withConn(fastfall([
      execPut,
      returnFirst
    ])),
    get: withConn(fastfall([
      execGet,
      returnFirst
    ]))
  }

  function Holder () {
    this.args = []
    this.func = null
    this.conn = null
  }

  function withConn (func) {
    return function () {
      var holder = new Holder()
      holder.func = func
      holder.callback = arguments[arguments.length - 1]

      for (var i = 0; i < arguments.length - 1; i++) {
        holder.args[i] = arguments[i]
      }

      fall(holder, [
        getConn,
        execute
      ], release)
    }
  }

  function getConn (next) {
    pg.connect(connString, next)
  }

  function execute (conn, done, next) {
    this.done = done
    this.args.push(next)
    this.func.apply(conn, this.args)
  }

  function release () {
    this.done()
    this.callback.apply(null, arguments)
  }

  function createSchema (callback) {
    this.query(createTable, callback)
  }

  function dropSchema (callback) {
    this.query(dropTable, callback)
  }

  function execPut (asset, callback) {
    var toExec = asset.id ? updateAsset : insertAsset
    var args = [
      asset.name,
      asset.status
    ]

    if (asset.id) {
      args.unshift(asset.id)
    }

    this.query(toExec, args, callback)
  }

  function returnFirst (result, callback) {
    callback(null, result.rows[0])
  }

  function execGet (id, callback) {
    this.query(getOne, [id], callback)
  }
}

module.exports = assets
