'use strict';

//var should = require('should');
var assert = require('assert');
var nguxLoader = require('../');

function run(resourcePath, cb) {
    var content = new Buffer('1234');
    var result = null;
    var context = {
        resourcePath: resourcePath,
        cacheable: function() {},
        async: function() {
            return cb;
        },
        options: {
            outputDir: './test/fixture/results'
        },
        addDependency: function() {

        }
    };
    nguxLoader.call(context, content);
    return result;
}

function test(resourcePath, cb) {
    run(resourcePath, function(err, success) {
        cb(err, success);
    });
}

describe('ngux-loader', function() {
    it('should process file correctly', function(done) {
        test('./test/fixture/file.simple.ngux', function(err, jsContent) {
            if (err) {
                done(err);
                return;
            }

            assert(jsContent !== null);
            //console.log('Error', err);
            //console.log('Success', jsContent);
            done();
        });

    });

});
