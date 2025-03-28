import gulp from "gulp";
import del from "del";
import gulpTs from "gulp-typescript";
import eslint from "gulp-eslint";
import typescript from "typescript";
import shell from "gulp-shell";


const tsProject = gulpTs.createProject("tsconfig.json", { typescript: typescript });

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

export async function buildScripts() {
    return shell.task("rollup -c");
}

const build = gulp.series(
    check,
    lint,
    clean,
    buildScripts
);

export default build;
