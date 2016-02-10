import {expect} from 'chai';
import should from 'should';
import path from 'path';
import fs from 'fs';
import gulp from 'gulp';
import gutil from 'gulp-util';
import gulpCssUsage from '../dist/index.js';

let loadFileBuffer = (filename) => {
	var base = path.join(__dirname, 'jsx');
	var filePath = path.join(base, filename);

	return new gutil.File({
		cwd: __dirname,
		base: base,
		path: filePath,
		contents: fs.readFileSync(filePath)
	});
};

let loadFileStream = (filename) => {
	var base = path.join(__dirname, 'jsx');
	var filePath = path.join(base, filename);

	return new gutil.File({
		cwd: __dirname,
		base: base,
		path: filePath,
		contents: fs.createReadStream(filePath)
	});
};

describe('main plug-in test', () => {

	describe('health check', () => {
		it('plug-in does exist', () => {
			expect(gulpCssUsage).to.exist;
		});

		it('plug-in is a function', () => {
			expect(gulpCssUsage).to.be.a('function');
		});
	});

	describe('processing files - unit tests', () => {

		it('single css, single simple jsx - as buffer', done => {
			let jsxFile = loadFileBuffer('TestReactClass.jsx');
			let cssFolder = path.join(__dirname, 'css');
			var filePath = path.join(cssFolder, 'test.css');
			let stream = gulpCssUsage({css: filePath});
			stream.on('data', () => {
			});
			stream.on('end', () => done());
			stream.write(jsxFile);
			stream.end();
		});

		it('single css, single simple jsx - as stream', done => {
			let jsxFile = loadFileStream('TestReactClass.jsx');
			let cssFolder = path.join(__dirname, 'css');
			var filePath = path.join(cssFolder, 'test.css');
			let stream = gulpCssUsage({css: filePath});
			stream.on('data', () => {
			});
			stream.on('end', () => done());
			stream.write(jsxFile);
			stream.end();
		});

		it('single css, multiple jsx files - as buffer', done => {
			var files = [
				loadFileBuffer('TestReactClass.jsx'),
				loadFileBuffer('TestReactClass2.jsx')
			];
			let mustSee = files.length;
			let cssFolder = path.join(__dirname, 'css');
			var filePath = path.join(cssFolder, 'test.css');
			let stream = gulpCssUsage({css: filePath});
			stream.on('data', () => mustSee--);
			stream.on('end', () => {
				if (mustSee <= 0) {
					done();
				}
			});
			files.forEach(file => stream.write(file));
			stream.end();
		});

		it('single css, multiple jsx files - as stream', done => {
			var files = [
				loadFileStream('TestReactClass.jsx'),
				loadFileStream('TestReactClass2.jsx')
			];
			let mustSee = files.length;
			let cssFolder = path.join(__dirname, 'css');
			var filePath = path.join(cssFolder, 'test.css');
			let stream = gulpCssUsage({css: filePath});
			stream.on('data', () => mustSee--);
			stream.on('end', () => {
				if (mustSee <= 0) {
					done();
				}
			});
			files.forEach(file => stream.write(file));
			stream.end();
		});
	});

	describe('use cases as real gulp plug-in', () => {
		it('single css, multiple simple jsx', done => {
			let cssFolder = path.join(__dirname, 'css');
			let jsxFolder = path.join(__dirname, 'jsx/**/*');
			var cssFilePath = path.join(cssFolder, 'test.css');
			gulp.src(jsxFolder).pipe(gulpCssUsage({css: cssFilePath})).on('data', () => {
			}).on('end', done);
		});
	});

	describe('some negative tests', () => {
		let jsxFolder = path.join(__dirname, 'jsx/**/*');
		it('should throw missing field - no options', done => {
			(() => gulp.src(jsxFolder).pipe(gulpCssUsage())).should.throw('Missing css field!');
			done();
		});

		it('should throw missing field - empty options object', done => {
			(() => gulp.src(jsxFolder).pipe(gulpCssUsage({}))).should.throw('Missing css field!');
			done();
		});

		it('should throw type checked exception - wrong options.css type', done => {
			(() => gulp.src(jsxFolder).pipe(gulpCssUsage({css:{}}))).should.throw('css field must be a string!');
			done();
		});
	});

});
