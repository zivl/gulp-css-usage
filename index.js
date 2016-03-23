import through from 'through2';
import gutil from 'gulp-util';
import fs from 'fs';
import {parse} from 'babylon';
import traverse from 'babel-traverse';

const PluginError = gutil.PluginError;
const PLUGIN_NAME = 'gulp-css-usage';
const cssSelectorRegex = /([.#](-?[_a-zA-Z]+[_a-zA-Z0-9-]*)(?![^\{]*\}))/gm;

let error = undefined;

let getAllSelectorsFromCSSFile = (cssFile) => {
    let contents = cssFile.contents.toString();
    let selectors = {};
    let matches = cssSelectorRegex.exec(contents);
    while (matches != null) {
        let selector = matches[1];
        selectors[selector] = selector;
        matches = cssSelectorRegex.exec(contents);
    }

    return selectors;
};

let makeDiff = (cssSelectors, jsxAttributes) => {
    let needless = [];

    let cssSelectorKeys = Object.keys(cssSelectors);
    cssSelectorKeys.forEach(selector => {
        if (!jsxAttributes[selector.substring(1)]) {
            needless.push(selector);
        }
    });

    let statistics = ((needless.length / cssSelectorKeys.length) * 100).toFixed(0);


    return {needless, statistics};
};

let printNeedlessSelectorList = (list, statistics) => {
    gutil.log('');
    gutil.log(gutil.colors.yellow(PLUGIN_NAME + ': ' + statistics + '% of your css selectors are not in use!'));
    gutil.log(gutil.colors.yellow(PLUGIN_NAME + ': The selectors are:'));
    list.forEach(selector => gutil.log(selector));
    gutil.log('');
};

let parseAndExtractJsxAttributes = (jsxFileContents, babylonPlugins = []) => {
    let jsxAttributes = {};
    let plugins = ['jsx', 'flow', 'classProperties'];
    if (babylonPlugins.length) {
        plugins = plugins.concat(babylonPlugins);
    }

    // use babylon.parse and then babel traverse for dynamic class names and other attributes on the jsx code.
    // might come up with a bit more strings but the needless stuff are not here anyway.
    let ast = parse(jsxFileContents, {sourceType: 'module', plugins: plugins});
    traverse(ast, {
        enter: function (path) {
            let {type, value} = path.node;
            if (type === 'StringLiteral') {
                let attributes = value.split(' ');
                attributes.forEach(attr => jsxAttributes[attr] = attr);
            }
        }
    });

    return jsxAttributes;
};

let validateInput = (cssFilePath, threshold) => {
    if (!cssFilePath) {
        throw new PluginError(PLUGIN_NAME, 'Missing css field!');
    }
    if (typeof cssFilePath !== 'string') {
        throw new PluginError(PLUGIN_NAME, 'css field must be a string!');
    }
    if(threshold && (typeof threshold !== 'number' || threshold > 100 || threshold < 0)){
        throw new PluginError(PLUGIN_NAME, 'threshold value should be a number between 0-100!');
    }
};

let gulpCssUsage = (options = {}) => {

    let {css: cssFilePath, babylon, threshold} = options;

    validateInput(cssFilePath, threshold);

    let cssFile = new gutil.File({path: cssFilePath, contents: fs.readFileSync(cssFilePath)});
    let cssSelectors = getAllSelectorsFromCSSFile(cssFile);

    return through.obj((file, enc, cb) => {
        let currentJsxAttributes;
        if (file.isNull()) {
            return cb(error, file);
        }
        if (file.isStream()) {
            return cb(new PluginError(PLUGIN_NAME, 'Streaming not supported'));
        }

        let allAttributes = {};

        // file is buffer
        currentJsxAttributes = parseAndExtractJsxAttributes(file.contents.toString(), babylon);
        Object.assign(allAttributes, currentJsxAttributes);

        let {needless, statistics} = makeDiff(cssSelectors, allAttributes);
        printNeedlessSelectorList(needless, statistics);
        if(threshold && statistics >= threshold){
            return cb(new PluginError(PLUGIN_NAME, 'too many unused css selectors!'));
        }

        cb(error, file);

    });

};

// Object.assign() polyfill
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#Polyfill
if (typeof Object.assign != 'function') {
    (function () {
        Object.assign = function (target) {
            'use strict';
            if (target === undefined || target === null) {
                throw new TypeError('Cannot convert undefined or null to object');
            }

            var output = Object(target);
            for (var index = 1; index < arguments.length; index++) {
                var source = arguments[index];
                if (source !== undefined && source !== null) {
                    for (var nextKey in source) {
                        if (source.hasOwnProperty(nextKey)) {
                            output[nextKey] = source[nextKey];
                        }
                    }
                }
            }
            return output;
        };
    })();
}

export default gulpCssUsage;
