'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Test = require('../models/test');

const testItems = module.context.collection('test');
const keySchema = joi.string().required()
.description('The key of the test');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('test');


router.get(function (req, res) {
  res.send(testItems.all());
}, 'list')
.response([Test], 'A list of testItems.')
.summary('List all testItems')
.description(dd`
  Retrieves a list of all testItems.
`);


router.post(function (req, res) {
  const test = req.body;
  let meta;
  try {
    meta = testItems.save(test);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(test, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: test._key})
  ));
  res.send(test);
}, 'create')
.body(Test, 'The test to create.')
.response(201, Test, 'The created test.')
.error(HTTP_CONFLICT, 'The test already exists.')
.summary('Create a new test')
.description(dd`
  Creates a new test from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let test
  try {
    test = testItems.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(test);
}, 'detail')
.pathParam('key', keySchema)
.response(Test, 'The test.')
.summary('Fetch a test')
.description(dd`
  Retrieves a test by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const test = req.body;
  let meta;
  try {
    meta = testItems.replace(key, test);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(test, meta);
  res.send(test);
}, 'replace')
.pathParam('key', keySchema)
.body(Test, 'The data to replace the test with.')
.response(Test, 'The new test.')
.summary('Replace a test')
.description(dd`
  Replaces an existing test with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let test;
  try {
    testItems.update(key, patchData);
    test = testItems.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(test);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the test with.'))
.response(Test, 'The updated test.')
.summary('Update a test')
.description(dd`
  Patches a test with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    testItems.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a test')
.description(dd`
  Deletes a test from the database.
`);
