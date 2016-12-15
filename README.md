# gulp-css-usage

[![Build Status](https://travis-ci.org/zivl/gulp-css-usage.svg?branch=master)](https://travis-ci.org/zivl/gulp-css-usage)

A Gulp task which scans your JavaScript classes, including React JSX files support ( `.jsx` / `.js`  ) as well as HTML files, your CSS files, and gives you a report of CSS coverage.<br>
.i.e how many class names are needless and which are those class names.

In this way, you can tremendously accelerate the rendering time of your app by reducing network latency, loading and parsing time,
as the CSS file is smaller with less properties to process and etc.


# Install
```
npm install gulp-css-usage --save-dev
```

# Usage
###### include the plug-in
```javascript
// ECMAScript 5 code, using require()
var gulp = require('gulp');
var gulpCssUsage = require('gulp-css-usage').default;
```
```javascript
// ECMAScript 6 code, using module import
import gulp from 'gulp';
import gulpCssUsage from 'gulp-css-usage';
```
###### using the plug-in
```javascript
gulp.task('check-css-usage', function () {
  return gulp.src('/.../path/to/your/jsx/files/**/*.{jsx,js}')
    .pipe(gulpCssUsage({css: '/.../path/to/your/css/file/style.css', babylon:[]}));
});
```
###### console output
```
// selectors that matched complete strings in js files
needless selectors:
.myClass
#myId

// selectors that partialy matched an ES6 template string in js files
probably needless selectors:
.myClassTemplate
#myIdTemplate
```
## options
### css
**mandatory** Type: `String` || `Array`

The file path/pattern to the CSS file which this plug-in will test.<br>
Supports multiple files either via glob pattern or via array of paths/patterns.

e.g.
```javascript
gulpCssUsage({css: '/.../path/to/css/*.css'});
gulpCssUsage({css: ['/.../path/to/css/*.css', '/.../another/path/*.css', '/.../just/a/file/style.css']});
```

### threshold
Type: `Number`, (between 0-100)

If set, `gulp-css-usage` will check the amount of unused selectors, and if the amount of it is above the threshold then it fails the task.


### babylon
Type: `Array:String` Default: `['jsx', 'flow', 'classProperties']`

Array containing the plugins that you want to enable.<br>
Since we're using `babel 6.4+` and `babylon` to parse and extract the class names from the `jsx` files,
you might need to add which plug-ins to enable to parse your code if you're using more `ES6` or `ES7` features.

**Example:** if you're using `objectRestSpread` capability which is not in `ECMAScript2015` standards - you'll need to add it

For more available plug-ins, go to [babel-babylon](https://github.com/babel/babel/tree/master/packages/babylon)

### outputFile
Type: `String`

A Path to a report file. If set, `gulp-css-usage` will write it's analysis both to console and to the file specified with a `.txt` extension.



# Having some trouble? Have an issue?
For bugs and issues, please use the [Issues](https://github.com/zivl/gulp-css-usage/issues) page.

For trouble in usage or unclear stuff, please use the awesome [StackOverflow](http://stackoverflow.com/) and tag your question with `gulp-css-usage`, as well as other tags as you see fit


# Road map
* support of more CSS selectors
* support of precompiled SCSS files as well

# Contribute
Sure! just fork this repository and join in!
