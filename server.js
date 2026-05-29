const express  = require('express');
const QRCode   = require('qrcode');
const cors    = require('cors');
const { exec, spawn } = require('child_process');
const http    = require('http');
const os      = require('os');
const fs      = require('fs');
const path    = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ─────────────────────────────────────────────────────────
//  HELPER: llama a la extensión MacroDev en VS Code (:4001)
// ─────────────────────────────────────────────────────────
function llamarExtension(endpoint, datos) {
    return new Promise((resolve, reject) => {
        const body     = JSON.stringify(datos);
        const opciones = {
            hostname: '127.0.0.1',
            port    : 4001,
            path    : endpoint,
            method  : 'POST',
            headers : {
                'Content-Type'  : 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        };
        const req = http.request(opciones, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch { resolve({ status: 'error', message: 'Respuesta invalida.' }); }
            });
        });
        req.on('error', () => reject(
            new Error('VS Code cerrado o extension MacroDev inactiva. Abre VS Code primero.')
        ));
        req.write(body);
        req.end();
    });
}

// 📁 CONFIGURACIÓN DE RUTAS
const CARPETA_MADRE = 'C:\\Users\\willt\\Desktop\\PORTAFOLIO'; 

// Guardaremos los PID (Identificadores) de los procesos para apagarlos individualmente
let procesosActivos = {};

app.get('/favicon.ico', (req, res) => res.status(204).end());

// 🔍 FUNCIÓN AUXILIAR: Escanea carpetas buscando package.json
function detectarEntornos(rutaProyectoBase) {
    let entornosEncontrados = [];
    if (fs.existsSync(path.join(rutaProyectoBase, 'package.json'))) {
        entornosEncontrados.push({ tipo: 'frontend', rutaAbsoluta: rutaProyectoBase, subCarpeta: '' });
    }
    try {
        const subelementos = fs.readdirSync(rutaProyectoBase);
        for (let sub of subelementos) {
            const rutaSub = path.join(rutaProyectoBase, sub);
            if (fs.statSync(rutaSub).isDirectory() && !sub.startsWith('.') && sub !== 'node_modules') {
                if (fs.existsSync(path.join(rutaSub, 'package.json'))) {
                    entornosEncontrados.push({ tipo: sub, rutaAbsoluta: rutaSub, subCarpeta: sub });
                }
            }
        }
    } catch (e) { /* Ignorar carpetas inaccesibles */ }
    return entornosEncontrados;
}

// 🌐 ENDPOINT: Carga inicial de proyectos agrupados
app.get('/api/panel-completo', (req, res) => {
    try {
        const elementos = fs.readdirSync(CARPETA_MADRE);
        const proyectosAgrupados = [];

        elementos.forEach(elemento => {
            if (elemento === 'macroweb' || elemento.startsWith('.')) return;
            const rutaCompleta = path.join(CARPETA_MADRE, elemento);
            
            if (fs.statSync(rutaCompleta).isDirectory()) {
                const entornos = detectarEntornos(rutaCompleta);
                if (entornos.length > 0) {
                    const proyectoObjeto = { nombre: elemento, entornos: [] };
                    entornos.forEach(entorno => {
                        let scriptsDisponibles = [];
                        try {
                            const packageJsonPath = path.join(entorno.rutaAbsoluta, 'package.json');
                            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                            if (packageJson.scripts) scriptsDisponibles = Object.keys(packageJson.scripts);
                        } catch (err) {}
                        proyectoObjeto.entornos.push({
                            tipo: entorno.tipo === '' ? 'frontend' : entorno.tipo,
                            subCarpeta: entorno.subCarpeta,
                            scripts: scriptsDisponibles
                        });
                    });
                    proyectosAgrupados.push(proyectoObjeto);
                }
            }
        });
        res.json({ status: 'success', proyectos: proyectosAgrupados });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Error al leer el entorno local.' });
    }
});

// 💻 ENDPOINT: Abrir la ventana principal de VS Code de forma desprendida
app.post('/api/macro/vscode-abrir/:nombre', (req, res) => {
    const { nombre } = req.params;
    const rutaProyecto = path.join(CARPETA_MADRE, nombre);

    console.log(`💻 Abriendo VS Code en: ${rutaProyecto}`);
    const proc = spawn('code', [rutaProyecto], {
        detached   : true,
        stdio      : 'ignore',
        shell      : true,
        windowsHide: true
    });
    proc.unref();
    res.json({ status: 'success', message: `${nombre} abierto en VS Code!` });
});

// ⚡ ENDPOINT START: Abre terminal integrada en VS Code vía extensión MacroDev
app.post('/api/macro/start/:nombre', async (req, res) => {
    const { nombre } = req.params;
    const { comando, subCarpeta } = req.body;

    let rutaEjecucion = path.join(CARPETA_MADRE, nombre);
    if (subCarpeta) rutaEjecucion = path.join(rutaEjecucion, subCarpeta);

    const titulo = `MacroDev | ${nombre} - ${subCarpeta || 'raiz'}`;
    console.log(`⚡ [start] Terminal: "${titulo}" → ${comando}`);

    try {
        const respuesta = await llamarExtension('/terminal/start', {
            ruta: rutaEjecucion, comando, titulo
        });
        res.json(respuesta);
    } catch (error) {
        res.status(503).json({ status: 'error', message: error.message });
    }
});

// 🛑 ENDPOINT STOP: Cierra terminal integrada por su título único
app.post('/api/macro/stop/:nombre', async (req, res) => {
    const { nombre } = req.params;
    const { subCarpeta } = req.body;

    const titulo = `MacroDev | ${nombre} - ${subCarpeta || 'raiz'}`;
    console.log(`🛑 [stop] Cerrando terminal: "${titulo}"`);

    try {
        const respuesta = await llamarExtension('/terminal/stop', { titulo });
        res.json(respuesta);
    } catch (error) {
        res.status(503).json({ status: 'error', message: error.message });
    }
});

// 🌐 ENDPOINT NGROK GLOBAL
app.post('/api/macro/ngrok/:nombre', async (req, res) => {
    const { nombre } = req.params;
    const { puerto } = req.body; 

    const rutaProyectoRaiz = path.join(CARPETA_MADRE, nombre);
    const ejecutableNgrok = path.join(rutaProyectoRaiz, 'ngrok.exe');

    if (!fs.existsSync(ejecutableNgrok)) {
        return res.json({ status: 'error', message: 'No se encontró ngrok.exe en la raíz.' });
    }

    console.log(`🚀 Lanzando Ngrok de fondo en puerto ${puerto}`);
    try {
        const respuesta = await llamarExtension('/terminal/start', {
            ruta   : rutaProyectoRaiz,
            comando: `.\\ngrok.exe http ${puerto}`,
            titulo : `MacroDev | ${nombre} - ngrok`
        });
        return res.json(respuesta);
    } catch (error) {
        return res.status(503).json({ status: 'error', message: error.message });
    }

    res.json({ status: 'success', message: `Túnel Ngrok en puerto ${puerto} abierto.` });
});

// 🧼 ENDPOINT: Limpiar la terminal física
app.post('/api/macro/clear-console', (req, res) => {
    try {
        process.stdout.write('\x1B[2J\x1B[0f');
        res.json({ status: 'success', message: '¡Consola de la PC limpia!' });
    } catch (error) { res.status(500).json({ status: 'error' }); }
});

// Bienvenida (raíz) y panel
app.get('/',      (req, res) => res.sendFile(path.join(__dirname, 'bienvenida.html')));
app.get('/panel', (req, res) => res.sendFile(path.join(__dirname, 'panel.html')));

// Info del servidor para generar el QR
app.get('/api/info', (req, res) => {
    const ip = Object.values(os.networkInterfaces())
        .flat()
        .find(i => i.family === 'IPv4' && !i.internal)?.address || 'localhost';
    res.json({ ip, puerto: PORT, url: `http://${ip}:${PORT}` });
});

// QR como PNG binario directo
app.get('/api/qr', async (req, res) => {
    const url = req.query.url || 'http://localhost:4000/panel';
    try {
        const buffer = await QRCode.toBuffer(url, { width: 210, margin: 2 });
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'no-store');
        res.end(buffer);
    } catch (err) {
        res.status(500).send('Error generando QR');
    }
});

const PORT = 4000;
app.listen(PORT, '0.0.0.0', () => { console.log(`🚀 Servidor MacroDev Estable corriendo en http://localhost:${PORT}`); });