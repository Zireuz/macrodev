const { app, BrowserWindow, Tray, Menu, nativeImage, shell } = require('electron');
const { spawn } = require('child_process');
const http   = require('http');
const path   = require('path');

// Instancia única — si ya hay una corriendo, enfocarla y salir
const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized() || !mainWindow.isVisible()) {
                mainWindow.show();
            }
            mainWindow.focus();
        }
    });
}

let mainWindow   = null;
let tray         = null;
let serverProcess = null;

// ── Iniciar servidor Express en segundo plano ──
function iniciarServidor() {
    serverProcess = spawn('node', [path.join(__dirname, 'server.js')], {
        cwd        : __dirname,
        detached   : false,
        stdio      : 'pipe',
        windowsHide: true,
        env        : { ...process.env }
    });
    // Descartar output sin mostrarlo
    serverProcess.stdout.resume();
    serverProcess.stderr.resume();
}

// ── Esperar a que Express responda ──
function esperarServidor(maxIntentos) {
    return new Promise((resolve) => {
        let n = 0;
        const check = () => {
            const req = http.get('http://localhost:4000/api/info', () => resolve(true));
            req.on('error', () => {
                if (++n < maxIntentos) setTimeout(check, 400);
                else resolve(false);
            });
            req.end();
        };
        check();
    });
}

// ── Ventana principal ──
function crearVentana() {
    const { screen } = require('electron');
    const display = screen.getPrimaryDisplay();
    const { width, height } = display.workAreaSize;

    const ww = Math.round(Math.min(width  * 0.78, 1600));
    const wh = Math.round(Math.min(height * 0.84, 1050));

    mainWindow = new BrowserWindow({
        width : 1920,
        height: 1080,
        minWidth: 1280,
        minHeight: 720,
        maxWidth: 3840,
        maxHeight: 2160,
        center: true,
        autoHideMenuBar: true,
        title: 'MacroDev',
        backgroundColor: '#080d14',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    mainWindow.loadURL('http://localhost:4000/bienvenida');

    // Cerrar ventana → minimizar a bandeja (no salir)
    mainWindow.on('close', (e) => {
        if (!app.isQuiting) {
            e.preventDefault();
            mainWindow.hide();
        }
    });
    // Bloquear permisos innecesarios
mainWindow.webContents.session.setPermissionRequestHandler(
    (webContents, permission, callback) => {
        const permitidos = ['notifications'];
        callback(permitidos.includes(permission));
    }
);
}

// ── Icono de bandeja ──
function crearTray() {
    // Icono inline 16x16 (cuadrado azul MacroDev)
    const iconB64 =
        'data:image/png;base64,' +
        'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/' +
        'AP+gvaeTAAAAHUlEQVQ4y2NgGAU0BgwMDAxUMWAAAADAAACFMAABdDYFMAAA' +
        'AABJRU5ErkJggg==';

    const icon = nativeImage.createFromDataURL(iconB64);

    tray = new Tray(icon);
    tray.setToolTip('MacroDev — Activo en :4000');

    const menu = Menu.buildFromTemplate([
        {
            label: 'Abrir MacroDev',
            click: () => { mainWindow.show(); mainWindow.focus(); }
        },
        {
            label: 'Ir al Panel (navegador)',
            click: () => shell.openExternal('http://localhost:4000/panel')
        },
        { type: 'separator' },
        {
            label: 'Cerrar MacroDev',
            click: () => {
                app.isQuiting = true;
                if (serverProcess) {
                    try { serverProcess.kill(); } catch (_) {}
                }
                app.quit();
            }
        }
    ]);

    tray.setContextMenu(menu);
    tray.on('double-click', () => { mainWindow.show(); mainWindow.focus(); });
}

// ── Arranque ──
app.whenReady().then(async () => {
    iniciarServidor();

    const ok = await esperarServidor(20); // ~8 segundos máximo

    crearVentana();
    crearTray();

    if (!ok) {
        mainWindow.loadURL(
            'data:text/html,<body style="background:#080d14;color:#ef4444;' +
            'font-family:sans-serif;padding:40px;font-size:18px">' +
            'Error: no se pudo conectar con el servidor MacroDev (puerto 4000).</body>'
        );
    }
});

// ── Salida ──
app.on('before-quit', () => {
    app.isQuiting = true;
    if (serverProcess) {
        try { serverProcess.kill(); } catch (_) {}
    }
});

// Mantener proceso vivo aunque se cierren todas las ventanas
app.on('window-all-closed', (e) => { e.preventDefault(); });
