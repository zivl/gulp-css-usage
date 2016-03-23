# gulp-css-usage

A Gulp task which scans your JavaScript classes, including React JSX files support ( `.jsx` / `.js`  ), your CSS files, and gives you a report of CSS coverage.<br>
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
var cssusage = require('gulp-css-usage').default;
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
## options
### css
**mandatory** Type: `String`

The file path to the CSS file which this plug-in will test.<br>
**Note:** at the moment, supports only one CSS file so it is prefer to give here the compiled/concatenated styling file)

### threshold
Type: 'Number', (between 0-100)

If set, `gulp-css-usage` will check the amount of unused selectors, and if the amount of it is above the threshold then it fails the task.



### babylon
Type: `Array:String` Default: `['jsx', 'flow', 'classProperties']`

Array containing the plugins that you want to enable.<br>
Since we're using `babel 6.4+` and `babylon` to parse and extract the class names from the `jsx` files,
you might need to add which plug-ins to enable to parse your code if you're using more `ES6` or `ES7` features.

**Example:** if you're using `objectRestSpread` capability which is not in `ECMAScript2015` standards - you'll need to add it

For more available plug-ins, go to [babel-babylon](https://github.com/babel/babel/tree/master/packages/babylon)


# Having some trouble? Have an issue?
For bugs and issues, please use the [Issues](https://github.com/zivl/gulp-css-usage/issues) page.

For trouble in usage or unclear stuff, please use the awesome [StackOverflow](http://stackoverflow.com/) and tag your question with `gulp-css-usage`, as well as other tags as you see fit


# Road map
* write results to file
* support of more CSS selectors
* support multiple CSS files
* support of precompiled SCSS files as well

# Contribute
Sure! just fork this repository and join in!


