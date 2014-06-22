var gulp = require('gulp');
var rjs = require('gulp-requirejs');
var imagemin = require('gulp-imagemin');
var stripDebug = require('gulp-strip-debug');
var uglify = require('gulp-uglify');
var autoprefix = require('gulp-autoprefixer');
var minifyCSS = require('gulp-minify-css');
var rimraf = require('gulp-rimraf');
var jshint = require('gulp-jshint');
var rev = require('gulp-rev');
var override = require('gulp-rev-css-url');
var fingerprint = require('gulp-fingerprint');
var clean = require('gulp-clean');
var replace = require('gulp-replace');

var paths = {
    js: './public/assets/js/**/*.js',
    images: './public/assets/image/**/*.{jpg}',
    css: './public/assets/css/**/*.css',
    html: './public/*.html',
    public: './public/**/*'
};

gulp.task('setUp', ['cleanDist', 'removeTmp'], function(){});
gulp.task('tearDown', ['removeTmp'], function(){});

gulp.task('cleanDist', function(){
    return gulp.src('./dist', { read: false })
            .pipe(rimraf());
});

gulp.task('removeTmp', function(){
    return gulp.src('./tmp', { read: false })
            .pipe(rimraf());
});

gulp.task('copyHtml', function(){
    return gulp.src(paths.html)
            .pipe(gulp.dest('./dist/public/'));
});

// JS hint task
gulp.task('jshint', function() {
    return gulp.src('./public/assets/js/**/*.js')
            .pipe(jshint('.jshintrc'))
            .pipe(jshint.reporter('jshint-stylish'))
            .pipe(jshint.reporter('fail'));
});

// require JS
gulp.task('requirejsBuild', function() {
    return rjs({
        baseUrl: './public/assets/js/',
        out: 'main.js',
        shim: {},
        paths: {
            requireLib: 'require'
        },
        name: 'main',
        include: 'requireLib'
    })
        .pipe(stripDebug())
        .pipe(uglify())
        .pipe(gulp.dest('./tmp/public/assets/js')); // pipe it to the output DIR
});

// minify new images
gulp.task('imagemin', function() {
    return gulp.src('./public/assets/image/*')
            .pipe(imagemin())
            .pipe(gulp.dest('./tmp/public/assets/image/'));
});

// CSS concat, auto-prefix and minify
gulp.task('styles', function() {
    return gulp.src(['./public/assets/css/*.css'])
        .pipe(autoprefix('last 3 versions'))
        .pipe(minifyCSS())
        .pipe(gulp.dest('./tmp/public/assets/css/'));
});

/**
 * rev files (mainly in the main html file)
 */
gulp.task('rev', ['copyHtml', 'styles', 'imagemin'], function(){
    var stream = gulp.src('./tmp/**/*', {base: './tmp/public/assets'})
        .pipe(gulp.dest('./dist/public/')) // copy original assets to build dir
        .pipe(clean({force: true}))
        .pipe(rev())
        .pipe(override())
        .pipe(gulp.dest('./dist/public/')) // write rev'd assets to build dir
        .pipe(rev.manifest())
        .pipe(gulp.dest('./tmp/')); // write manifest to tmp dir

    return stream;
});

/**
 * rev assets within css files
 */
gulp.task('revCss', function(){
    var stream = gulp.src([
        './tmp/public/assets/css/*.css',
        './tmp/public/assets/image/*'
    ], {base: './tmp/public/assets/'})
        .pipe(gulp.dest('./dist/public/assets')) // copy original assets to build dir
        .pipe(clean({force: true}))
        .pipe(rev())
        .pipe(override())
        .pipe(gulp.dest('./dist/public/assets')) // write rev'd assets to build dir
        .pipe(rev.manifest())
        .pipe(gulp.dest('./tmp/')); // write manifest to tmp dir

    return stream;
});

/**
 * replace revd versions of files
 */
gulp.task('fingerprint', ['rev'], function () {

    var stream = gulp.src('./dist/public/*.html')
        .pipe(fingerprint(require('./tmp/rev-manifest')))
        .pipe(gulp.dest('./dist/public/'));

    //gulp.start('revCss');
    //gulp.start('tearDown');

    return stream;
});




/**
 * NOT USING CURRENTLY
 * replace image references in css (this is all there is for this at the moment) maybe abstract this into a plugin
 */
gulp.task('replaceImagesInCss', function(){

    var manifest = require('./tmp/rev-manifest');

    gulp.src('./dist/public/assets/css/*.css')
        .pipe(replace(/url\(\.\.\/(.*)\.[jpg|png|gif|jpeg]+\)/g, function(string, $1){

            for (var revRef in manifest) {

                var pattern = new RegExp('\/' + $1 + '-[0-9A-Za-z]{8}\.[jpg|png|gif|jpeg]+', 'g');

                if(pattern.test(manifest[revRef])){
                    var revNumber = manifest[revRef].split('-')[1];
                    var revImageUrl = 'url(../' + $1 + '-' + revNumber + ')';

                    return revImageUrl;
                }
            }
        }))
        .pipe(gulp.dest('./dist/public/assets/css'));
});






// default gulp task
gulp.task('default', [
    'setUp',
], function() {
    gulp.start(
        'jshint',
        'requirejsBuild',
        'fingerprint'
    );
});