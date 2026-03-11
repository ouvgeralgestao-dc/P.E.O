const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

console.log("[>>] Compilando Backend TypeScript para Producao...");

// Limpa pasta de saida
const outputDir = path.join(__dirname, "../P.E.O-Install/bundled-backend");
try {
  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
  fs.mkdirSync(outputDir, { recursive: true });
} catch (e) {
  console.error("[X] Erro ao preparar pasta de saida:", e.message);
  process.exit(1);
}

// Compila o backend TypeScript em um unico arquivo JavaScript
esbuild
  .build({
    entryPoints: [path.join(__dirname, "server.ts")],
    bundle: true,
    platform: "node",
    target: "node18",
    outfile: path.join(outputDir, "server.js"),
    external: ["better-sqlite3", "sqlite3"],
    format: "cjs",
    sourcemap: false,
    minify: true,
    logLevel: "info",
    // Injeta shims para import.meta que estao vazios em CJS
    define: {
      "import.meta.url": '""',
    },
  })
  .then(() => {
    console.log("[OK] Backend compilado com sucesso!");

    // Copia dependencias e dados
    try {
      console.log("[>>] Copiando dependencias nativas...");

      // Cria pasta node_modules
      const nodeModulesDir = path.join(outputDir, "node_modules");
      fs.mkdirSync(nodeModulesDir, { recursive: true });

      // Copia better-sqlite3 (modulo nativo)
      const sqliteSource = path.join(
        __dirname,
        "node_modules",
        "better-sqlite3",
      );
      const sqliteDest = path.join(nodeModulesDir, "better-sqlite3");

      if (fs.existsSync(sqliteSource)) {
        console.log("[>>] Copiando better-sqlite3...");
        copyFolderRecursiveSync(sqliteSource, nodeModulesDir);
        console.log("[OK] better-sqlite3 copiado!");
      } else {
        console.log(
          "[!] AVISO: better-sqlite3 nao encontrado em:",
          sqliteSource,
        );
      }

      // Copia bindings (dependencia do better-sqlite3)
      const bindingsSource = path.join(__dirname, "node_modules", "bindings");
      if (fs.existsSync(bindingsSource)) {
        console.log("[>>] Copiando bindings...");
        copyFolderRecursiveSync(bindingsSource, nodeModulesDir);
        console.log("[OK] bindings copiado!");
      }

      // Copia file-uri-to-path (dependencia do bindings)
      const fileUriSource = path.join(
        __dirname,
        "node_modules",
        "file-uri-to-path",
      );
      if (fs.existsSync(fileUriSource)) {
        console.log("[>>] Copiando file-uri-to-path...");
        copyFolderRecursiveSync(fileUriSource, nodeModulesDir);
        console.log("[OK] file-uri-to-path copiado!");
      }

      // Copia arquivos de dados (seed)
      const dataSource = path.join(__dirname, "data");
      if (fs.existsSync(dataSource)) {
        console.log("[>>] Copiando dados de seed...");
        const dataDest = path.join(outputDir, "data");
        fs.mkdirSync(dataDest, { recursive: true });
        copyFolderRecursiveSync(dataSource, outputDir);
        console.log("[OK] Dados de seed copiados!");
      }

      console.log("[OK] Backend pronto para empacotamento!");
      process.exit(0);
    } catch (copyError) {
      console.error("[X] Erro durante copia:", copyError.message);
      console.error("[X] Stack:", copyError.stack);
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("[X] Erro ao compilar backend:", error.message);
    process.exit(1);
  });

// Funcao auxiliar para copiar pasta recursivamente
function copyFolderRecursiveSync(source, targetParent) {
  const targetFolder = path.join(targetParent, path.basename(source));

  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
  }

  if (fs.lstatSync(source).isDirectory()) {
    const files = fs.readdirSync(source);
    files.forEach(function (file) {
      const curSource = path.join(source, file);
      if (fs.lstatSync(curSource).isDirectory()) {
        copyFolderRecursiveSync(curSource, targetFolder);
      } else {
        const targetFile = path.join(targetFolder, file);
        fs.copyFileSync(curSource, targetFile);
      }
    });
  }
}
