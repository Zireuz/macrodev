const express = require('express');
const cors    = require('cors');
const { exec } = require('child_process');
const http    = require('http');
const fs      = require('fs');
const path    = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ─────────────────────────────────────────────────────────
//  CONFIGURACIÓN
// ─────────────────────────────────────────────────────────
const CARPETA_MADRE = 'C:\\Users\\willt\\Desktop\\PORTAFOLIO';

// ─────────────────────────────────────────────────────────
//  HELPER: llama a la extensión MacroDev que corre dentro
//  de VS Code en localhost:4001
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
                catch { resolve({ status: 'error', message: 'Respuesta invalida de la extension.' }); }
            });
        });
        req.on('error', () => reject(
            new Error('VS Code cerrado o extension MacroDev inactiva. Abre VS Code primero.')
        ));
        req.write(body);
        req.end();
    });
}

app.get('/favicon.ico', (req, res) => res.status(204).end());

// ─────────────────────────────────────────────────────────
//  FUNCION: escanea carpetas buscando package.json
// ─────────────────────────────────────────────────────────
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
    } catch (e) {}
    return entornosEncontrados;
}

// ─────────────────────────────────────────────────────────
//  GET /api/panel-completo
// ─────────────────────────────────────────────────────────
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
                            const pkgPath = path.join(entorno.rutaAbsoluta, 'package.json');
                            const pkg     = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
                            if (pkg.scripts) scriptsDisponibles = Object.keys(pkg.scripts);
                        } catch (err) {}
                        proyectoObjeto.entornos.push({
                            tipo      : entorno.tipo === '' ? 'frontend' : entorno.tipo,
                            subCarpeta: entorno.subCarpeta,
                            scripts   : scriptsDisponibles
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

// ─────────────────────────────────────────────────────────
//  POST /api/macro/vscode-abrir/:nombre
//  Abre la carpeta del proyecto en VS Code
// ─────────────────────────────────────────────────────────
app.post('/api/macro/vscode-abrir/:nombre', (req, res) => {
    const { nombre } = req.params;
    const rutaProyecto = path.join(CARPETA_MADRE, nombre);

    const { spawn } = require('child_process');
    const proc = spawn('code', [rutaProyecto], {
        detached: true,
        stdio: 'ignore',
        shell: true,
        windowsHide: true   // ← suprime la ventana CMD
    });
    proc.unref();

    res.json({ status: 'success', message: `${nombre} abierto en VS Code!` });
});

// ─────────────────────────────────────────────────────────
//  POST /api/macro/start/:nombre
//  Pide a la extension que abra una terminal integrada
// ─────────────────────────────────────────────────────────
app.post('/api/macro/start/:nombre', async (req, res) => {
    const { nombre }             = req.params;
    const { comando, subCarpeta } = req.body;

    let rutaEjecucion = path.join(CARPETA_MADRE, nombre);
    if (subCarpeta) rutaEjecucion = path.join(rutaEjecucion, subCarpeta);

    // El titulo es la clave para encontrar y cerrar la terminal despues
    const titulo = `MacroDev | ${nombre} - ${subCarpeta || 'raiz'}`;

    console.log(`[start] Pidiendo terminal: "${titulo}" → ${comando}`);

    try {
        const respuesta = await llamarExtension('/terminal/start', {
            ruta   : rutaEjecucion,
            comando: comando,
            titulo : titulo
        });
        res.json(respuesta);
    } catch (error) {
        console.error(`[start] ${error.message}`);
        res.status(503).json({ status: 'error', message: error.message });
    }
});

// ─────────────────────────────────────────────────────────
//  POST /api/macro/stop/:nombre
//  Pide a la extension que cierre la terminal por su titulo
// ─────────────────────────────────────────────────────────
app.post('/api/macro/stop/:nombre', async (req, res) => {
    const { nombre }   = req.params;
    const { subCarpeta } = req.body;

    const titulo = `MacroDev | ${nombre} - ${subCarpeta || 'raiz'}`;

    console.log(`[stop] Cerrando terminal: "${titulo}"`);

    try {
        const respuesta = await llamarExtension('/terminal/stop', { titulo });
        res.json(respuesta);
    } catch (error) {
        console.error(`[stop] ${error.message}`);
        res.status(503).json({ status: 'error', message: error.message });
    }
});



app.post('/api/macro/clear/:nombre', async (req, res) => {
    const { nombre } = req.params;
    const { subCarpeta } = req.body;
    const titulo = `MacroDev | ${nombre} - ${subCarpeta || 'raiz'}`;
    try {
        const respuesta = await llamarExtension('/terminal/clear', { titulo });
        res.json(respuesta);
    } catch (error) {
        res.status(503).json({ status: 'error', message: error.message });
    }
});

app.post('/api/macro/ngrok/:nombre', async (req, res) => {
    const { nombre } = req.params;
    const { puerto } = req.body;

    const rutaProyectoRaiz = path.join(CARPETA_MADRE, nombre);
    const ejecutableNgrok  = path.join(rutaProyectoRaiz, 'ngrok.exe');

    if (!fs.existsSync(ejecutableNgrok)) {
        return res.json({ status: 'error', message: 'No se encontro ngrok.exe en la raiz.' });
    }

    const titulo = `MacroDev | ${nombre} - ngrok`;

    try {
        const respuesta = await llamarExtension('/terminal/start', {
            ruta   : rutaProyectoRaiz,
            comando: `.\\ngrok.exe http ${puerto}`,
            titulo : titulo
        });
        res.json(respuesta);
    } catch (error) {
        res.status(503).json({ status: 'error', message: error.message });
    }
});

// ─────────────────────────────────────────────────────────
//  POST /api/macro/clear-console
// ─────────────────────────────────────────────────────────
app.post('/api/macro/clear-console', (req, res) => {
    try {
        process.stdout.write('\x1B[2J\x1B[0f');
        res.json({ status: 'success', message: 'Consola de la PC limpia!' });
    } catch (error) {
        res.status(500).json({ status: 'error' });
    }
});

app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });

const PORT = 4000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor MacroDev corriendo en http://localhost:${PORT}`);
});