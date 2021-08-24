import ts from "rollup-plugin-ts";
import pkg from "./package.json";


export default {
    external: [
        "path",
        "ts-morph" 
    ],
    input: "src/index.ts",
    output: [
        {
            file: pkg.module,
            format: "esm",
            name: "Xrm.Ceg"
        },
        {
            file: pkg.main,
            format: "cjs",
            name: "Xrm.Ceg",
            sourcemap: true
        }
    ],
    plugins: [
        ts({
            exclude: [
                "node_modules/**/*.*",
            ]
        })
    ]
};
