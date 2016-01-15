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

    it('should process simple correctly', function(done) {
        var filename = 'file.simple';
        testHelper.processAndCheck(filename)
            .then(function() {
                done();
            })
            .catch(done);
    });

});
