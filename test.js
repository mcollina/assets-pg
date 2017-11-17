'use strict'

var tap = require('tap')
var test = tap.test
var tearDown = tap.tearDown
var build = require('./')
var WithConn = require('with-conn-pg')
var Ajv = require('ajv')
var ajv = new Ajv({ useDefaults: true })
var connString = 'postgres://localhost/assets_tests'
var schemaQuery = 'select column_name, data_type, character_maximum_length from INFORMATION_SCHEMA.COLUMNS where table_name = \'assets\''
var assets

tearDown(function () {
  assets.end()
})

test('create schema', function (t) {
  assets = build(connString)
  assets.dropSchema(function () {
    assets.createSchema(function (err) {
      t.error(err, 'no error')
      var withConn = WithConn(connString)
      withConn(function (conn, done) {
        t.error(err, 'no error')

        conn.query(schemaQuery, function (err, result) {
          t.error(err, 'no error')
          var columns = result.rows.map((row) => row.column_name).sort()
          t.deepEqual(columns, [
            'id',
            'name',
            'status'
          ], 'columns match')
          done()
        })
      })(function (err) {
        t.error(err, 'no error')
        withConn.end()
        t.end()
      })
    })
  })
})

test('can insert assets', function (t) {
  var expected = {
    name: 'my long asset',
    status: 'wait'
  }
  assets.put(expected, function (err, result) {
    t.error(err, 'no error')
    t.ok(result.id, 'it has an id')
    delete result.id
    t.deepEqual(result, expected, 'matches')
    t.end()
  })
})

test('can update assets', function (t) {
  var toWrite = {
    name: 'my long asset',
    status: 'wait'
  }
  assets.put(toWrite, function (err, result) {
    t.error(err, 'no error')
    result.name = 'another name'
    assets.put(result, function (err, result2) {
      t.error(err, 'no error')
      t.deepEqual(result2, result, 'matches')
      t.end()
    })
  })
})

test('can get assets', function (t) {
  var toWrite = {
    name: 'my long asset',
    status: 'wait'
  }
  assets.put(toWrite, function (err, expected) {
    t.error(err, 'no error')
    assets.get(expected.id, function (err, result) {
      t.error(err, 'no error')
      t.deepEqual(result, expected, 'matches')
      t.end()
    })
  })
})

test('cannot insert an asset without a name', function (t) {
  var expected = {
    name: '',
    status: 'wait'
  }
  assets.put(expected, function (err, result) {
    t.ok(err, 'insert errors')
    t.equal(err.name, 'UnprocessableEntityError', 'error type matches')
    t.equal(err.status, 422, 'status code')
    t.equal(err.details[0].message, 'should NOT be shorter than 1 characters', 'validation error matches')
    t.end()
  })
})

test('mirror test validation', function (t) {
  var expected = {
    name: '',
    status: 'wait'
  }
  assets.put(expected, function (err, result) {
    ajv.validate(assets.jsonSchema, expected)
    t.deepEqual(err.details, ajv.errors, 'error matches')
    t.end()
  })
})

test('status can be operational', function (t) {
  var expected = {
    name: 'a name',
    status: 'operational'
  }
  assets.put(expected, function (err, result) {
    t.error(err, 'no error')
    t.equal(result.status, 'operational', 'status matches')
    t.end()
  })
})

test('status can be error', function (t) {
  var expected = {
    name: 'a name',
    status: 'error'
  }
  assets.put(expected, function (err, result) {
    t.error(err, 'no error')
    t.equal(result.status, 'error', 'status matches')
    t.end()
  })
})

test('status cannot be something else', function (t) {
  var expected = {
    name: 'a name',
    status: 'something else'
  }
  assets.put(expected, function (err, result) {
    t.ok(err, 'errors')
    t.end()
  })
})

test('status defaults to wait', function (t) {
  var expected = {
    name: 'a name'
  }
  assets.put(expected, function (err, result) {
    t.error(err, 'no error')
    t.equal(result.status, 'wait', 'status defaults to "wait"')
    t.end()
  })
})

test('getting an non-existing asset', function (t) {
  assets.get(42, function (err, result) {
    t.ok(err, 'errors')
    t.notOk(result, 'no result')
    t.equal(err.status, 404, 'status code matches')
    t.equal(err.notFound, true, 'notFound property matches')
    t.end()
  })
})
