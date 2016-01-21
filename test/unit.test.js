'use strict';

global.Promise = require('bluebird');
var testHelper = require('./testHelper');
var should = require('should');

describe('ngux-loader', function() {

    it('with incorrect path should fail', function(done) {
        var filename = 'file.dummy';
        testHelper.processAndCheck(filename)
            .then(function() {
                done('shoud throw an error');
            })
            .catch(function(err) {
                should.exists(err);
                done();
            });
    });

    it('with simple should succeed', function(done) {
        var filename = 'file.simple';
        testHelper.processAndCheck(filename)
            .then(function() {
                done();
            })
            .catch(done);
    });

    it('with no selector should fail', function(done) {
        var filename = 'noselector.simple';
        testHelper.processAndCheck(filename)
            .then(function() {
                done('should throw an error');
            })
            .catch(function(err) {
                should.exists(err);
                done();
            });
    });

    it('with ux-weather should succeed', function(done) {
        var filename = 'ux-weather';
        testHelper.processAndCheck(filename)
            .then(function() {
                done();
            })
            .catch(done);
    });

    it('with spaces1 should succeed', function(done) {
        var filename = 'spaces1';
        testHelper.processAndCheck(filename)
            .then(function() {
                done();
            })
            .catch(done);
    });

    it('with spaces2 should succeed', function(done) {
        var filename = 'spaces2';
        testHelper.processAndCheck(filename)
            .then(function() {
                done();
            })
            .catch(done);
    });

    it('with comments1 should succeed', function(done) {
        var filename = 'comments1';
        testHelper.processAndCheck(filename)
            .then(function() {
                done();
            })
            .catch(done);
    });

    it('with mutliplerectangles should succeed', function(done) {
        var filename = 'mutliplerectangles';
        testHelper.processAndCheck(filename)
            .then(function() {
                done();
            })
            .catch(done);
    });

    it('with component.in should succeed', function(done) {
        var filename = 'component.in';
        testHelper.processAndCheck(filename)
            .then(function() {
                done();
            })
            .catch(done);
    });
});
