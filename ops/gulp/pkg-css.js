const gulp = require('gulp');
const sass = require('gulp-sass');
const rename = require("gulp-rename");
const gulpif = require('gulp-if');
const sourcemaps = require('gulp-sourcemaps');
const cleanCSS = require('gulp-clean-css');
const autoprefixer = require('gulp-autoprefixer');
const debug = require('gulp-debug');
const gulpSequence = require('gulp-sequence');
const replace = require('gulp-replace');
const config = require('../config');

let environment = require('../lib/environment');

const paths = {
	src: config.root.css,
	dest: environment.production ? config.root.dest : config.root.tmp
}

//compile top-level files
var sassTask = (cb) => {
    let prefix = config.tasks.css.prefix;
    let files = environment.production ?  `${paths.src}/*.${config.tasks.css.extensions}` : `!${paths.src}/all.scss`;

    var isAllCss = function (file) {
      return file.path.includes('all') ;
    }
    return gulp.src(files)
        .pipe(gulpif(environment.development, sourcemaps.init()))
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer(config.tasks.css.autoprefixer))
        .pipe(gulpif(environment.production, cleanCSS(config.tasks.css.cleanCSS)))
        // .pipe(rename({
        //     prefix: `${prefix}-`
        // }))
        .pipe(gulpif(isAllCss, rename({
            basename: prefix
        })))
        .pipe(gulpif(environment.development, sourcemaps.write()))
        .pipe(gulp.dest(paths.dest))
}
gulp.task('pkg-sass', sassTask);

//compile individual component files
var componentsTask = (cb) => {
    var files = [
        `${paths.src}/components/*.${config.tasks.css.extensions}`,
        `!${paths.src}/components/_*.${config.tasks.css.extensions}`
    ];
    return gulp.src(files)
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer(config.tasks.css.autoprefixer))
        .pipe(gulpif(environment.production, cleanCSS(config.tasks.css.cleanCSS)))
        .pipe(gulp.dest(`${paths.dest}/components`))
}
gulp.task('pkg-css-components', componentsTask);

//create minify versions
var minifyTask = (cb) => {
    return gulp.src([`${paths.dest}/**/*.css`])
        .pipe(cleanCSS({
            level: {
                1: {
                    specialComments: false
                }
            }
        }))
        .pipe(rename({
            suffix: `.min`
        }))
        .pipe(gulp.dest(paths.dest))
}
gulp.task('pkg-css-minify', minifyTask);


//main css task
module.exports = cssTask = (cb) => {
    if (environment.production) {
        gulpSequence('pkg-sass', 'pkg-css-components', 'pkg-css-minify', cb)
    } else {
        gulpSequence('pkg-sass', cb)
    }

}
gulp.task('pkg-css', cssTask);