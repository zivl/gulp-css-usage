import through from 'through2';
import gutil from 'gulp-util';
import fs from 'fs';
import {parse} from 'babylon';
import traverse from 'babel-traverse';

const PluginError = gutil.PluginError;
const PLUGIN_NAME = 'gulp-css-usage';
const cssClassRegex = /\.(-?[_a-zA-Z]+[_a-zA-Z0-9-]*)(?![^\{]*\})/gm;

let error = undefined;

let getAllClassNamesFromCSSFile = (cssFile) => {
	let contents = cssFile.contents.toString();
	let classNames = {};
	let matches = cssClassRegex.exec(contents);
	while (matches != null) {
		let className = matches[1];
		classNames[className] = className;
		matches = cssClassRegex.exec(contents);
	}

	return classNames;
};

let makeDiff = (cssClasses, jsxClasses) => {
	let needless = [];
	Object.keys(cssClasses).forEach(className => {
		if (!jsxClasses[className]) {
			needless.push(`.${className}`);
		}
	});

	return needless;
};

let printNeedlessClassList = (list) => {
	gutil.log('');
	gutil.log(gutil.colors.yellow(PLUGIN_NAME + ': The following class names are not in use'));
	list.forEach(clazz => gutil.log(clazz));
	gutil.log('');
};

let parseAndExtractJsxClassNames = (jsxFileContents, babylonPlugins = []) => {
	let jsxClassNames = {};
	let plugins = ['jsx', 'classProperties'];
	if(babylonPlugins.length) {
		plugins = plugins.concat(babylonPlugins);
	}

	// use babylon.parse and then babel traverse for dynamic class names on the jsx code.
	// might come up with a bit more strings but the needless stuff are not here anyway.
	let ast = parse(jsxFileContents, {sourceType: 'module', plugins: plugins});
	traverse(ast, {
		enter: function (path) {
			let {type, value} = path.node;
			if (type === 'StringLiteral') {
				let classNames = value.split(' ');
				classNames.forEach(className => jsxClassNames[className] = className);
			}
		}
	});

	return jsxClassNames;
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
	let cssClasses = getAllClassNamesFromCSSFile(cssFile);
	let fileBuffer;
	let allClassNames = {};
	let transformers = (file, enc, cb) => {
		let currentJsxClassNames;
		if (file.isNull()) {
			return cb(error, file);
		}
		if (file.isBuffer()) {
			currentJsxClassNames = parseAndExtractJsxClassNames(file.contents.toString(), babylon);
			Object.assign(allClassNames, currentJsxClassNames);
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
				currentJsxClassNames = parseAndExtractJsxClassNames(fileBuffer.toString(), babylon);
				Object.assign(allClassNames, currentJsxClassNames);
				fileBuffer = undefined;
				cb(error, file);
			});
		}
	};

	let flush = (cb) => {
		let needless = makeDiff(cssClasses, allClassNames);
		printNeedlessClassList(needless);
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
