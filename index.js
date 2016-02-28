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
	Object.keys(cssSelectors).forEach(selector => {
		if (!jsxAttributes[selector.substring(1)]) {
			needless.push(selector);
		}
	});

	return needless;
};

let printNeedlessSelectorList = (list) => {
	gutil.log('');
	gutil.log(gutil.colors.yellow(PLUGIN_NAME + ': The following selectors are not in use'));
	list.forEach(selector => gutil.log(selector));
	gutil.log('');
};

let parseAndExtractJsxAttributes = (jsxFileContents, babylonPlugins = []) => {
	let jsxAttributes = {};
	let plugins = ['jsx', 'flow', 'classProperties'];
	if(babylonPlugins.length) {
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

let gulpCssUsage = (options = {}) => {

	let {css: cssFilePath, babylon} = options;
	if (!cssFilePath) {
		throw new PluginError(PLUGIN_NAME, 'Missing css field!');
	}
	if(typeof cssFilePath !== 'string'){
		throw new PluginError(PLUGIN_NAME, 'css field must be a string!');
	}

	let cssFile = new gutil.File({path: cssFilePath, contents: fs.readFileSync(cssFilePath)});
	let cssSelectors = getAllSelectorsFromCSSFile(cssFile);
	let fileBuffer;
	let allAttributes = {};
	let transformers = (file, enc, cb) => {
		let currentJsxAttributes;
		if (file.isNull()) {
			return cb(error, file);
		}
		if (file.isBuffer()) {
			currentJsxAttributes = parseAndExtractJsxAttributes(file.contents.toString(), babylon);
			Object.assign(allAttributes, currentJsxAttributes);
			cb(error, file);
		}
		if (file.isStream()) {
			gutil.log(gutil.colors.magenta(PLUGIN_NAME + ': streaming is deprecated and will not be supported soon'));
			if (enc !== 'utf8') {
				file.contents.setEncoding('utf8');
			}
			if (!fileBuffer) {
				fileBuffer = new Buffer([]); // utf8 by default
			}

			file.contents.on('data', chunk => fileBuffer = Buffer.concat([new Buffer(chunk), fileBuffer]));
			file.contents.on('end', () => {
				currentJsxAttributes = parseAndExtractJsxAttributes(fileBuffer.toString(), babylon);
				Object.assign(allAttributes, currentJsxAttributes);
				fileBuffer = undefined;
				cb(error, file);
			});
		}
	};

	let flush = (cb) => {
		let needless = makeDiff(cssSelectors, allAttributes);
		printNeedlessSelectorList(needless);
		cb();
	};

	return through.obj({}, transformers, flush);

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
