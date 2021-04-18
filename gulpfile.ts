import gulp from "gulp";
import del from "del";
import gulpTs from "gulp-typescript";
import run from "gulp-run-command";

const eslint = require("gulp-eslint");


const tsProject = gulpTs.createProject("tsconfig.json", { typescript: require("typescript") });

export function check() {
    return tsProject.src()
        .pipe(tsProject());
}

export function lint() {
    return tsProject.src()
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
}

export function clean() {
    return del("dist");
}

export function buildScripts() {
    return run("rollup -c")();
}

const build = gulp.series(
    check,
    lint,
    clean,
    buildScripts
);

export default build;
