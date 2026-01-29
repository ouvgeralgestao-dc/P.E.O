const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow;
let startupErrors = [];

// Previne multiplas instancias
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  startupErrors.push(line);
}

function getUnpackedPath(relativePath) {
  if (app.isPackaged) {
    const asarPath = app.getAppPath();
    const unpackedPath = asarPath.replace("app.asar", "app.asar.unpacked");
    return path.join(unpackedPath, relativePath);
  } else {
    return path.join(__dirname, "..", relativePath);
  }
}

function startBackend() {
  const isDev = !app.isPackaged;
  log(`Modo: ${isDev ? "DESENVOLVIMENTO" : "PRODUCAO"}`);

  if (isDev) {
    const { spawn } = require("child_process");
    const backendPath = path.join(__dirname, "../../backend");
    log(`Backend path (dev): ${backendPath}`);
    spawn("npx", ["tsx", "server.ts"], {
      cwd: backendPath,
      env: { ...process.env, NODE_ENV: "development" },
      stdio: "inherit",
      shell: true,
    });
    return true;
  }

  // PRODUCAO - Configura ambiente
  const frontendPath = getUnpackedPath("bundled-frontend");

  log(`App path: ${app.getAppPath()}`);
  log(`Frontend: ${frontendPath}`);
  log(`Frontend existe? ${fs.existsSync(frontendPath)}`);

  // Define variaveis de ambiente
  process.env.NODE_ENV = "production";
  process.env.DATABASE_PATH = path.join(app.getPath("userData"), "peo.db");
  process.env.PORT = "6001";
  process.env.FRONTEND_PATH = frontendPath;

  log(`DATABASE: ${process.env.DATABASE_PATH}`);
  log(`FRONTEND: ${process.env.FRONTEND_PATH}`);

  // Carrega dependencias nativas ANTES de tudo
  // O better-sqlite3 do node_modules do projeto foi rebuilado pelo electron-builder
  try {
    log("Testando better-sqlite3 do projeto...");
    const Database = require("better-sqlite3");
    log("better-sqlite3 carregado com sucesso!");

    // Cria/abre o banco de dados
    log(`Abrindo banco em: ${process.env.DATABASE_PATH}`);

    // Garante que o diretorio existe
    const dbDir = path.dirname(process.env.DATABASE_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const db = new Database(process.env.DATABASE_PATH);
    log("Banco de dados aberto com sucesso!");

    // Expoe o banco globalmente para o backend usar
    global.peoDatabase = db;
    global.peoDatabaseModule = Database;
  } catch (err) {
    log(`ERRO ao carregar better-sqlite3: ${err.message}`);
    log(`Stack: ${err.stack}`);
    return false;
  }

  // Agora carrega o backend
  const backendBundlePath = getUnpackedPath("bundled-backend/server.js");
  log(`Backend: ${backendBundlePath}`);
  log(`Backend existe? ${fs.existsSync(backendBundlePath)}`);

  if (!fs.existsSync(backendBundlePath)) {
    log("ERRO FATAL: Backend nao encontrado!");
    return false;
  }

  try {
    log("Carregando backend...");

    // Intercepta o require do better-sqlite3 para usar a versao global
    const Module = require("module");
    const originalResolve = Module._resolveFilename;
    Module._resolveFilename = function (request, parent, isMain, options) {
      if (request === "better-sqlite3") {
        // Retorna o modulo ja carregado
        return require.resolve("better-sqlite3");
      }
      return originalResolve.call(this, request, parent, isMain, options);
    };

    require(backendBundlePath);
    log("Backend carregado com SUCESSO!");
    return true;
  } catch (err) {
    log(`ERRO ao carregar backend: ${err.message}`);
    log(`Stack: ${err.stack}`);
    return false;
  }
}

function createWindow(backendOk) {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "P.E.O - Gerador de Organogramas PMDC",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (!backendOk) {
    const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Erro de Inicializacao</title>
        <style>
          body { font-family: Arial; padding: 40px; background: #1a1a1a; color: #fff; }
          h1 { color: #ff6b6b; }
          pre { background: #2d2d2d; padding: 20px; overflow: auto; font-size: 12px; white-space: pre-wrap; }
          code { color: #98c379; }
        </style>
      </head>
      <body>
        <h1>Erro ao iniciar backend</h1>
        <p>O servidor nao conseguiu iniciar. Logs:</p>
        <pre><code>${startupErrors.join("\n")}</code></pre>
      </body>
      </html>
    `;
    mainWindow.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`,
    );
    mainWindow.webContents.openDevTools();
    return;
  }

  const serverUrl = "http://localhost:6001";
  let retries = 0;
  const maxRetries = 15;

  const tryLoad = () => {
    log(`Tentativa ${retries + 1}/${maxRetries}`);
    mainWindow.loadURL(serverUrl).catch((err) => {
      retries++;
      if (retries < maxRetries) {
        setTimeout(tryLoad, 1000);
      } else {
        log("Backend nao respondeu apos 15 tentativas");
        const errorHtml = `
          <!DOCTYPE html>
          <html>
          <head><meta charset="UTF-8"><title>Erro</title>
          <style>body{font-family:Arial;padding:40px;background:#1a1a1a;color:#fff;}pre{background:#2d2d2d;padding:20px;font-size:12px;white-space:pre-wrap;}</style>
          </head>
          <body>
            <h1 style="color:#ff6b6b">Backend nao respondeu</h1>
            <pre>${startupErrors.join("\n")}</pre>
          </body>
          </html>
        `;
        mainWindow.loadURL(
          `data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`,
        );
      }
    });
  };

  tryLoad();
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.on("ready", () => {
  log("App ready");
  const backendOk = startBackend();

  const delay = app.isPackaged ? 3000 : 2000;
  log(`Aguardando ${delay}ms...`);

  setTimeout(() => createWindow(backendOk), delay);
});

app.on("window-all-closed", () => {
  if (global.peoDatabase) {
    global.peoDatabase.close();
  }
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (mainWindow === null) createWindow(true);
});
