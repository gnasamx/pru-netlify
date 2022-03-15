// Plugins
const gulp = require("gulp");
const browserSync = require("browser-sync").create();
const del = require("del");
const plumber = require("gulp-plumber");
const htmlmin = require("gulp-htmlmin");
const nunjucksRender = require("gulp-nunjucks-render");
const autoprefixer = require("gulp-autoprefixer");
const cleanCSS = require("gulp-clean-css");
const sass = require("gulp-sass")(require("sass"));
const uglify = require("gulp-uglify");
const imagemin = require("gulp-imagemin");
const sourcemaps = require("gulp-sourcemaps");
const data = require("gulp-data");
const path = require("path");
const merge = require("gulp-merge-json");

const config = {
  global: {
    input: "src",
    output: "dist",
  },
  html: {
    input: "src/pages/*.html",
    output: "dist",
  },
  uiKit: {
    input: "src/ui-kit/*.html",
    output: "dist",
  },
  components: {
    input: "src/components/*.html",
    output: "dist/components",
  },
  styles: {
    input: "src/styles/index.scss",
    output: "dist/css",
    components: "src/styles/**/*.scss",
  },
  scripts: {
    input: "src/scripts/main.js",
    output: "dist/js",
  },
  images: {
    input: "src/assets/**/*.+(png|jpg|gif|svg|mp3|pdf)",
    output: "dist/assets",
  },
  fonts: {
    input: "src/fonts/*.*",
    output: "dist/fonts",
  },
  content: {
    componentInput: "src/content/components/*.json",
    pageInput: "src/content/pages/*.json",
    output: "dist/content",
  },
  vendor: {
    input: ["node_modules/bootstrap/dist/js/bootstrap.bundle.min.js"],
    output: "dist/js/vendor",
  },
};

function browserSyncDev() {
  browserSync.init({
    server: {
      baseDir: config.global.output,
    },
    port: 3000,
  });
}

function clear() {
  return del([config.global.output]);
}

function html() {
  return gulp
    .src(config.html.input)
    .pipe(plumber())
    .pipe(
      data(function () {
        return require("./dist/content/site.json");
      })
    )
    .pipe(
      nunjucksRender({
        path: ["src"],
      })
    )
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest(config.html.output))
    .pipe(browserSync.stream());
}

function uiKit() {
  return gulp
    .src(config.uiKit.input)
    .pipe(plumber())
    .pipe(
      data(function () {
        return require("./dist/content/site.json");
      })
    )
    .pipe(
      nunjucksRender({
        path: ["src"],
      })
    )
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest(config.html.output))
    .pipe(browserSync.stream());
}

function components() {
  return gulp
    .src(config.components.input)
    .pipe(plumber())
    .pipe(
      data(function () {
        return require("./dist/content/site.json");
      })
    )
    .pipe(
      nunjucksRender({
        path: ["src"],
      })
    )
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest(config.components.output))
    .pipe(browserSync.stream());
}

function titleCase(phrase = "") {
  return phrase.replace(/-([a-z0-9])/g, (g) => g[1].toUpperCase());
}

function componentJsonOutput() {
  return gulp
    .src(config.content.componentInput)
    .pipe(
      merge({
        fileName: "components.json",
        edit: (parsedJson, file) => {
          let fileName = titleCase(path.parse(file.path).name);
          return { [fileName]: parsedJson };
        },
      })
    )
    .pipe(gulp.dest(config.content.output))
    .pipe(browserSync.stream());
}

function pageJsonOutput() {
  return gulp
    .src(config.content.pageInput)
    .pipe(
      merge({
        fileName: "pages.json",
        edit: (parsedJson, file) => {
          let fileName = titleCase(path.parse(file.path).name);
          return { [fileName]: parsedJson };
        },
      })
    )
    .pipe(gulp.dest(config.content.output))
    .pipe(browserSync.stream());
}

function siteJsonOutput() {
  return gulp
    .src(config.content.output + "/*.json")
    .pipe(
      merge({
        fileName: "site.json",
        edit: (parsedJson, file) => {
          return { [path.parse(file.path).name]: parsedJson };
        },
      })
    )
    .pipe(gulp.dest(config.content.output))
    .pipe(browserSync.stream());
}

function styles() {
  return gulp
    .src(config.styles.input)
    .pipe(plumber())
    .pipe(sass().on("error", sass.logError))
    .pipe(autoprefixer("last 2 versions"))
    .pipe(cleanCSS())
    .pipe(gulp.dest(config.styles.output))
    .pipe(browserSync.stream());
}

function scripts() {
  return gulp
    .src(config.scripts.input)
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(uglify().on("error", console.error))
    .pipe(sourcemaps.write("./"))
    .pipe(gulp.dest(config.scripts.output))
    .pipe(browserSync.stream());
}

function images() {
  return gulp
    .src(config.images.input)
    .pipe(plumber())
    .pipe(imagemin())
    .pipe(gulp.dest(config.images.output))
    .pipe(browserSync.stream());
}

function fonts() {
  return gulp
    .src(config.fonts.input, { since: gulp.lastRun(fonts) })
    .pipe(gulp.dest(config.fonts.output))
    .pipe(browserSync.stream());
}

function vendor() {
  return gulp.src(config.vendor.input).pipe(gulp.dest(config.vendor.output));
}

function watch() {
  gulp.watch(config.html.input, html);
  gulp.watch(config.uiKit.input, uiKit);
  gulp.watch(config.components.input, components);
  gulp.watch([config.styles.input, config.styles.components], styles);
  gulp.watch(config.scripts.input, scripts);
  gulp.watch(config.images.input, images);
}

const dev = gulp.series(
  clear,
  componentJsonOutput,
  pageJsonOutput,
  siteJsonOutput,
  styles,
  fonts,
  images,
  components,
  uiKit,
  html,
  scripts,
  vendor,
  gulp.parallel(browserSyncDev, watch)
);

const build = gulp.series(
  clear,
  fonts,
  content,
  assets,
  html,
  components,
  styles,
  scripts,
  vendor,
);

exports.default = dev;
exports.dev = dev;
exports.build = build;
exports.clear = clear;
