'use strict'

var test = require('tape')
var build = require('./')
var pg = require('pg')

var connString = 'postgres://localhost/assets_tests'
var schemaQuery = 'select column_name, data_type, character_maximum_length from INFORMATION_SCHEMA.COLUMNS where table_name = \'assets\''
var assets

test('create schema', function (t) {
  assets = build(connString)
  assets.dropSchema(function () {
    assets.createSchema(function (err) {
      t.error(err, 'no error')
      pg.connect(connString, function (err, conn, done) {
        t.error(err, 'no error')

        conn.query(schemaQuery, function (err, result) {
          t.error(err, 'no error')
          t.equal(result.rows.length, 3, 'has 3 columns')
          t.equal(result.rows[0].column_name, 'id', 'has an id')
          t.equal(result.rows[1].column_name, 'name', 'has a name')
          t.equal(result.rows[2].column_name, 'status', 'has a status')
          done()
          pg.end()
          t.end()
        })
      })
    })
  })
})

test('can put assets', function (t) {
  var expected = {
    name: 'my long asset',
    status: 'wait'
  }
  assets.put(expected, function (err, result) {
    t.error(err, 'no error')
    t.ok(result.id, 'it has an id')
    delete result.id
    t.deepEqual(result, expected, 'matches')
    pg.end()
    t.end()
  })
})
