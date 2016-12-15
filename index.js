import through from 'through2';
import gutil from 'gulp-util';
import fs from 'fs';
import glob from 'glob';
import postcss from 'postcss';
import {parse} from 'babylon';
import traverse from 'babel-traverse';

const PluginError = gutil.PluginError;
const PLUGIN_NAME = 'gulp-css-usage';
const htmlAttrRegex = /[="](-?[_a-zA-Z]+[_a-zA-Z0-9-]*)["]/gm;

let error = undefined;

let getAllSelectorsFromCSSFile = (cssFile) => {
	let contents = cssFile.contents.toString();
	let selectors = {};
	const ast = postcss.parse(contents, {from: cssFile.path});
	ast.walkRules(rule => {
		let seperatedSelectors = rule.selector.split(/(\s|>|\[|,|(?=\.))/);
		seperatedSelectors.forEach(selector => {
			if (selector.startsWith('.') || selector.startsWith('#')) {
				selectors[selector] = selector;
			}
		});
	})
	return selectors;
};

let makeDiff = (cssSelectors, attributes, templates) => {
	let needless = [];
	let probablyNeedless = [];
	let cssSelectorKeys = Object.keys(cssSelectors);
	cssSelectorKeys.forEach(selector => {
		if (!attributes[selector.substring(1)]) {
			needless.push(selector);
		}
	});
	let templatesKeys = Object.keys(templates);
	if (templatesKeys && templatesKeys.length) {
		let newNeedless = [];
		let isProbablyNeedless;
		needless.forEach(selector => {
			isProbablyNeedless = false;
			templatesKeys.forEach(template => {
				if (selector.indexOf(template) > -1) {
					isProbablyNeedless = true;
				}
			})
			if (isProbablyNeedless) {
				probablyNeedless.push(selector)
			} else {
				newNeedless.push(selector)
			}
		});
		needless = newNeedless;
	}
	let statistics = (((needless.length + probablyNeedless.length) / cssSelectorKeys.length) * 100).toFixed(0);
	return {needless, probablyNeedless, statistics};
};

let printNeedlessSelectorList = ({needless, probablyNeedless, statistics, outputFile}) => {
	const summaryTextTitle = `${PLUGIN_NAME}: ${statistics}% of your css selectors are not in use!`;
	const summaryTextSubtitle = `${PLUGIN_NAME}: The needles selectors are:`;
	const summaryTextProbablySubtitle = `${PLUGIN_NAME}: The probably needles selectors are:`;

	gutil.log('');
	gutil.log(gutil.colors.yellow(summaryTextTitle));
	gutil.log(gutil.colors.yellow(summaryTextSubtitle));
	needless.forEach(selector => {
		gutil.log(selector);
	});
	gutil.log('');
	gutil.log(gutil.colors.yellow(summaryTextProbablySubtitle));
	probablyNeedless.forEach(selector => {
		gutil.log(selector);
	});
	gutil.log('');

	if (outputFile) {
		const fileName = outputFile.indexOf('.txt') > -1 ? outputFile : `${outputFile}.txt`;
		const file = fs.createWriteStream(fileName);
		file.write(`${summaryTextTitle}\n`);
		file.write(`${summaryTextSubtitle}\n`);
		needless.forEach(selector => {
			file.write(`${selector}\n`)
		});
		file.write(summaryTextProbablySubtitle);
		probablyNeedless.forEach(selector => {
			file.write(selector);
		});
		file.end('');
		gutil.log(`report was written to a file: ${outputFile}`);
	}
};

let parseAndExtractJsxAttributes = (jsxFileContents, babylonPlugins = []) => {
	let jsxAttributes = {};
	let jsxTemplates = {};
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
			} else if (type === 'TemplateElement' && value.raw) {
				jsxTemplates[value.raw] = value.raw;
			}
		}
	});

	return {jsxAttributes, jsxTemplates};
};

let parseAndExtractHTMLAttributes = (htmlFile) => {
	let contents = htmlFile.contents.toString();
	let htmlAttributes = {};
	let matches = htmlAttrRegex.exec(contents);
	while (matches != null) {
		let selector = matches[1];
		htmlAttributes[selector] = selector;
		matches = htmlAttrRegex.exec(contents);
	}

	return htmlAttributes;
};

let validateInput = (css, threshold) => {
	if (!css) {
		throw new PluginError(PLUGIN_NAME, 'Missing css field!');
	}
	if (!Array.isArray(css) && typeof css !== 'string') {
		throw new PluginError(PLUGIN_NAME, 'css must be an array or a string!');
	}
	if (threshold && (typeof threshold !== 'number' || threshold > 100 || threshold < 0)) {
		throw new PluginError(PLUGIN_NAME, 'threshold value should be a number between 0-100!');
	}
};

let getFileExtension = file => file.path.split('.').pop();

let isHTMLFile = (file) => {
	return getFileExtension(file) === 'html';
};

let isJSXFile = (file) => {
	return getFileExtension(file) === 'jsx';
};

let gulpCssUsage = (options = {}) => {
	let {css, babylon, threshold, outputFile} = options;

	validateInput(css, threshold);
	let cssSelectors = {}
	let cssFile;

	// Backwards compatibility
	if (typeof css === 'string') {
		css = [css];
	}

	css.forEach(pattern => {
		let paths = glob.sync(pattern);
		paths.forEach(path => {
			cssFile = new gutil.File({path: path, contents: fs.readFileSync(path)});
			cssSelectors = Object.assign(cssSelectors, getAllSelectorsFromCSSFile(cssFile));
		});
	});

	let allAttributes = {};
	let templates = {};

	let transformers = (file, enc, cb) => {
		let currentJsxAttributes;
		if (file.isNull()) {
			return cb(error, file);
		}
		if (file.isStream()) {
			return cb(new PluginError(PLUGIN_NAME, 'Streaming not supported'));
		}

		// file is buffer
		if (isJSXFile(file)) {
			let {jsxAttributes, jsxTemplates} = parseAndExtractJsxAttributes(file.contents.toString(), babylon);
			Object.assign(allAttributes, jsxAttributes);
			Object.assign(templates, jsxTemplates);

		}
		else if (isHTMLFile(file)) {
			var htmlAttributes = parseAndExtractHTMLAttributes(file);
			Object.assign(allAttributes, htmlAttributes);
		}

		cb(error, file);
	};

	let flush = (cb) => {
		let {needless, probablyNeedless, statistics} = makeDiff(cssSelectors, allAttributes, templates);
		printNeedlessSelectorList({needless, probablyNeedless, statistics, outputFile});
		if (threshold && statistics >= threshold) {
			return cb(new PluginError(PLUGIN_NAME, 'too many unused css selectors!'));
		}
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
