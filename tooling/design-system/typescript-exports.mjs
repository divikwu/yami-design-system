import ts from "typescript";

function collectBindingNames(name, exports) {
  if (ts.isIdentifier(name)) exports.add(name.text);
  else for (const element of name.elements) if (!ts.isOmittedExpression(element)) collectBindingNames(element.name, exports);
}

function hasExportModifier(statement) {
  return ts.canHaveModifiers(statement) && (ts.getModifiers(statement) ?? []).some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
}

export function collectNamedExports(source, fileName = "source.ts") {
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    fileName.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const exports = new Set();

  for (const statement of sourceFile.statements) {
    if (ts.isExportDeclaration(statement)) {
      if (statement.exportClause && ts.isNamedExports(statement.exportClause)) {
        for (const element of statement.exportClause.elements) exports.add(element.name.text);
      }
      continue;
    }
    if (!hasExportModifier(statement)) continue;
    if ((ts.getModifiers(statement) ?? []).some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword)) exports.add("default");
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) collectBindingNames(declaration.name, exports);
    } else if (statement.name && ts.isIdentifier(statement.name)) {
      exports.add(statement.name.text);
    }
  }

  return exports;
}
