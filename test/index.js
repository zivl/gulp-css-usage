import {expect} from 'chai';
import should from 'should';
import path from 'path';
import fs from 'fs';
import gulp from 'gulp';
import gutil from 'gulp-util';
import gulpCssUsage from '../dist/index.js';

let loadFileBuffer = (filename, folder) => {
	var base = path.join(__dirname, folder || 'jsx');
	var filePath = path.join(base, filename);

	return new gutil.File({
		cwd: __dirname,
		base: base,
		path: filePath,
		contents: fs.readFileSync(filePath)
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

		it('single css, single simple html - as buffer', done => {
			let htmlFile = loadFileBuffer('test.html', 'html');
			let cssFolder = path.join(__dirname, 'css');
			var filePath = path.join(cssFolder, 'test.css');
			let stream = gulpCssUsage({css: filePath});
			stream.on('data', () => {
			});
			stream.on('end', () => done());
			stream.write(htmlFile);
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

		it('single css, multiple jsx files - as buffer', done => {
			var files = [
				loadFileBuffer('test.html', 'html'),
				loadFileBuffer('test2.html', 'html'),
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

		it('single css, multiple HTMLs', done => {
			let cssFolder = path.join(__dirname, 'css');
			let jsxFolder = path.join(__dirname, 'html/**/*');
			var cssFilePath = path.join(cssFolder, 'test.css');
			gulp.src(jsxFolder).pipe(gulpCssUsage({css: cssFilePath})).on('data', () => {
			}).on('end', done);
		});

		it('single css, multiple simple jsx, with threshold set', done => {
			let cssFolder = path.join(__dirname, 'css');
			let jsxFolder = path.join(__dirname, 'jsx/**/*');
			var cssFilePath = path.join(cssFolder, 'test.css');
			gulp.src(jsxFolder).pipe(gulpCssUsage({css: cssFilePath, threshold: 100})).on('data', () => {
			}).on('end', done);
		});

		it('single css, multiple HTMLs, with threshold set', done => {
			let cssFolder = path.join(__dirname, 'css');
			let htmlFolder = path.join(__dirname, 'html/**/*');
			var cssFilePath = path.join(cssFolder, 'test.css');
			gulp.src(htmlFolder).pipe(gulpCssUsage({css: cssFilePath, threshold: 100})).on('data', () => {
			}).on('end', done);
		});
	});

	describe('some negative tests', () => {
		let jsxFolder = path.join(__dirname, 'jsx/**/*');
		let cssFolder = path.join(__dirname, 'css');
		var cssFilePath = path.join(cssFolder, 'test.css');

		it('should throw missing field - no options', done => {
			(() => gulp.src(jsxFolder).pipe(gulpCssUsage())).should.throw('Missing css field!');
			done();
		});

		it('should throw missing field - empty options object', done => {
			(() => gulp.src(jsxFolder).pipe(gulpCssUsage({}))).should.throw('Missing css field!');
			done();
		});

		it('should throw type checked exception - wrong options.css type', done => {
			(() => gulp.src(jsxFolder).pipe(gulpCssUsage({css: {}}))).should.throw('css field must be a string!');
			done();
		});

		it('should throw threshold value exception', done => {
			(() => gulp.src(jsxFolder).pipe(gulpCssUsage({
				css: cssFilePath,
				threshold: 200
			}))).should.throw('threshold value should be a number between 0-100!');
			done();
		});

		it('should throw threshold value exception', done => {
			(() => gulp.src(jsxFolder).pipe(gulpCssUsage({
				css: cssFilePath,
				threshold: {}
			}))).should.throw('threshold value should be a number between 0-100!');
			done();
		});

		it('should throw threshold value exception', done => {
			(() => gulp.src(jsxFolder).pipe(gulpCssUsage({
				css: cssFilePath,
				threshold: 'asd'
			}))).should.throw('threshold value should be a number between 0-100!');
			done();
		});

		it('should return error over the threshold value exception', done => {
			gulp.src(jsxFolder).pipe(gulpCssUsage({css: cssFilePath, threshold: 30})).on('error', error => {
				error.message.indexOf('too many unused css selectors!').should.not.equal(-1);
				done();
			});
		});
	});

	describe('file report tests', () => {

		it('should write to given file', done => {
			let jsxFile = loadFileBuffer('TestReactClass.jsx');
			let cssFolder = path.join(__dirname, 'css');
			let filePath = path.join(cssFolder, 'test.css');
			let outputFile = 'dist/report.txt';
			let stream = gulpCssUsage({css: filePath, outputFile});
			stream.on('data', () => {
			});
			stream.on('end', () => {
				expect(fs.existsSync(outputFile)).to.be.true;
				done();
			});
			stream.write(jsxFile);
			stream.end();
		});

		it('should add .txt file extension and write to given file', done => {
			let jsxFile = loadFileBuffer('TestReactClass.jsx');
			let cssFolder = path.join(__dirname, 'css');
			let filePath = path.join(cssFolder, 'test.css');
			let outputFile = 'dist/report';
			let stream = gulpCssUsage({css: filePath, outputFile});
			stream.on('data', () => {
			});
			stream.on('end', () => {
				expect(fs.existsSync(`${outputFile}.txt`)).to.be.true;
				done();
			});
			stream.write(jsxFile);
			stream.end();
		});
	});

});
