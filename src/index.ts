import path from "path";
import { Project, SourceFile, Scope, JSDocableNode, VariableDeclarationKind } from "ts-morph";

import { EntityMetadata, AttributeTypeCode, Metadata, AttributeMetadata, EntityMetadataModule } from "./model/metadata";
import { Config } from "./model/config";


export async function generate(config: Config): Promise<void> {
    const inputPath = path.resolve(config.input);
    const entityMeta: EntityMetadata[] = await retrieveMetadata(inputPath);

    const project = new Project();
    const outputPath = path.resolve(config.outputFolder);
    entityMeta.forEach(meta => generateForEntity(project, meta, outputPath));
    await project.save();
}


async function retrieveMetadata(metadataFilePath: string): Promise<EntityMetadata[]> {    
    const metadata = await import(metadataFilePath) as EntityMetadataModule;
    return metadata.default;
}

function generateForEntity(project: Project, entityMeta: EntityMetadata, outputFolder: string): void {
    console.log("Generating code for:", entityMeta.DisplayName, "(" + entityMeta.LogicalName + ")...");

    const entityName = normalizeLabel(entityMeta.DisplayName, entityMeta.LogicalName);

    let outPath = path.join(outputFolder, "constants", entityName + ".ts");
    const constantsSourceFile = project.createSourceFile(outPath, {}, { overwrite: true });
    generateConstants(constantsSourceFile, entityMeta);

    outPath = path.join(outputFolder, "enums", entityName + ".ts");
    const enumsSourceFile = project.createSourceFile(outPath, {}, { overwrite: true });
    generateEnums(enumsSourceFile, entityMeta);

    console.log("Code generation finished for:", entityMeta.DisplayName, "(" + entityMeta.LogicalName + ").");
}

function generateConstants(sourceFile: SourceFile, entityMeta: EntityMetadata): void {
    console.log("Generating constants for:", entityMeta.DisplayName, "(" + entityMeta.LogicalName + ")...");

    const fieldType = entityMeta.Attributes
        .map(a => a.LogicalName)
        .join("\" |\n\"");
    const typeDef = sourceFile.addTypeAlias({
        isExported: true,
        name: "Field",
        type: "\"" + fieldType + "\""
    });

    addJsDoc(typeDef, entityMeta);

    for (const attr of entityMeta.Attributes) {
        const propDef = sourceFile.addVariableStatement({
            isExported: true,
            declarationKind: VariableDeclarationKind.Const,
            declarations: [{
                name: attr.VariableName,
                initializer: "\"" + attr.LogicalName + "\""
            }]
        });

        addJsDoc(propDef, attr);
    }

    console.log("Done.");
}

function generateEnums(sourceFile: SourceFile, entityMeta: EntityMetadata): void {
    console.log("Generating enums for:", entityMeta.DisplayName, "(" + entityMeta.LogicalName + ")...");

    for (const attr of entityMeta.Attributes) {
        if (attr.Options == null) {
            continue;
        }

        console.log("Processing", attr.DisplayName, "(" + attr.LogicalName + ")...");

        const displayName = attr.DisplayName || "";
        const className = normalizeLabel(attr.DisplayName, attr.LogicalName);

        switch (attr.Type) {
            case AttributeTypeCode.Picklist:
                generateEnum(sourceFile, className, attr);
                break;

            case AttributeTypeCode.State:
                generateEnum(sourceFile, "StateCode", attr);
                break;

            case AttributeTypeCode.Status:
                generateEnum(sourceFile, "StatusCode", attr);
                break;

            case AttributeTypeCode.Boolean:
                let prefix = "";
                if (!className.startsWith("_") &&
                    !displayName.startsWith("Is ") &&
                    !displayName.startsWith("Are ") &&
                    !displayName.startsWith("Has ") &&
                    !displayName.startsWith("Have ") &&
                    !displayName.startsWith("Do ") &&
                    !displayName.startsWith("Does ")) {
                    prefix = "Is";
                }

                const classDef = sourceFile.addClass({
                    isExported: true,
                    name: prefix + className
                });

                addJsDoc(classDef, attr);

                for (const option of attr.Options) {
                    const propDef = classDef.addProperty({
                        scope: Scope.Public,
                        isStatic: true,
                        isReadonly: true,
                        name: normalizeLabel(option.Label, option.Value === 1 ? "Yes" : "No"),
                        initializer: option.Value === 1 ? "true" : "false"
                    });

                    propDef.addJsDoc({
                        description: option.Label
                    });
                }
                break;
        }
    }

    console.log("Done.");
}

function generateEnum(sourceFile: SourceFile, enumName: string, attributeMeta: AttributeMetadata): void {
    if (attributeMeta.Options == null) {
        return;
    }

    const enumDef = sourceFile.addEnum({
        isExported: true,
        isConst: true,
        name: enumName
    });

    addJsDoc(enumDef, attributeMeta);

    for (const option of attributeMeta.Options) {
        const memberDef = enumDef.addMember({
            name: normalizeLabel(option.Label, "_" + option.Value.toString()),
            value: option.Value
        });

        memberDef.addJsDoc({
            description: option.Label
        });
    }
}

function normalizeLabel(label: string | null, fallback: string): string {
    if (fallback.length === 0) {
        throw new Error("'fallback' parameter should be a non-empty string");
    }

    if (!/^[a-zA-Z_$][0-9a-zA-Z_$]*$/g.test(fallback)) {
        console.log(fallback);
        throw new Error("'fallback' parameter should be a valid TypeScript identifier");
    }

    if (label == null || label.length === 0) {
        return fallback;
    }

    const result = label
        .replace(/\[(.+?)\]/g, "_$1_")                      // Replace square brackets with underscores (for [DEPRECATED], [OBSOLETE], etc.)
        .replace(/^\W+/g, "")                               // Remove all non-word symbols in the beginning of the string
        .replace(/[^\w\-+]+$/g, "")                         // Remove all non-word symbols in the end of the string (except '+' and '-')
        .replace(/['""]/g, "")                              // Remove quotes
        .replace(/(-+?)(?!.*\w+)/g, "Minus")                // Replace trailing '-' with word representation
        .replace(/(\++?)(?!.*\w+)/g, "Plus")                // Replace trailing '+' with word representation
        .replace(/[^\w\s]/g, " ")                           // Replace any other non-word symbols with spaces
        .replace(/\b(\w)/g, m => m.toUpperCase())           // Uppercase words
        .replace(/(\d+)(?:\s+)\b/g, "$1_")                  // Replace any non-word symbols after a number with a single underscore, so 'Foo 5,10,20 Bar' will become 'Foo 5_10_20_Bar' and not a 'Foo 51020 Bar'
        .replace(/\b(?:\s+)(\d+)/g, "_$1")                  // Replace any non-word symbols before a number with a single underscore, so 'Foo 5_10_20_Bar' will become 'Foo_5_10_20_Bar'
        .replace(/\s/g, "");                                // Remove spaces

    if (result.length === 0) {
        return fallback;
    }

    if (isDigit(result.charAt(0))) {
        return "_" + result;
    }

    return result;
}

function isDigit(c: string): boolean {
    return /^\d$/.test(c);
}

function addJsDoc(node: JSDocableNode, metadata: Metadata): void {
    if (metadata.DisplayName == null && metadata.LogicalName === metadata.VariableName) {
        return;
    }

    node.addJsDoc({
        description: writer => {
            if (metadata.DisplayName != null) {
                writer.write(metadata.DisplayName + " (" + metadata.LogicalName + ")");
            }
            else {
                writer.write(metadata.LogicalName);
            }

            if (metadata.Description != null && metadata.Description.length > 0) {
                writer
                    .newLine()
                    .write(metadata.Description);
            }
        }
    });
}
