
<div align="center">

<table>
  <tr>
    <td align="center" bgcolor="#0d1117" style="padding: 40px; border: 2px solid #38bdf8; border-radius: 12px;">
      <br />
      <sub>⚡ ORIGINAL PROJECT BY ⚡</sub>
      <h1 style="font-size: 2.8rem; margin: 10px 0; color: #ffffff; letter-spacing: 1px;">William Londoño Morales</h1>
      <h2 style="font-size: 2rem; margin: 5px 0; color: #38bdf8; letter-spacing: 2px;">✨ ZIREUZ ✨</h2>
      <p style="font-size: 1.2rem; color: #8b949e; max-width: 550px; margin-top: 15px;">
        <b>Software Developer & Systems Architect</b><br />
        Crafting high-performance applications and clean, production-ready code.
      </p>
      <br />
      <a href="mailto:willdevmor@gmail.com">
        <img src="https://img.shields.io/badge/Email-Contact%20Me-blue?style=for-the-badge&logo=gmail&logoColor=white&color=1473e6" alt="Email" />
      </a>
      <a href="https://linkedin.com/in/zireuz-software">
        <img src="https://img.shields.io/badge/LinkedIn-Connect-blue?style=for-the-badge&logo=linkedin&logoColor=white&color=0077b5" alt="LinkedIn" />
      </a>
      <a href="https://github.com/Zireuz">
        <img src="https://img.shields.io/badge/GitHub-Zireuz%20Hub-black?style=for-the-badge&logo=github&logoColor=white&color=24292e" alt="GitHub" />
      </a>
      <br /><br />
    </td>
  </tr>
</table>

---

### 🛡️ Aviso de Autoría y Propiedad Intelectual

> ⚠️ **IMPORTANT NOTICE FOR RECRUITERS & DEVELOPERS**
> Este proyecto, su arquitectura, lógica y código fuente son de la autoría exclusiva de **William Londoño Morales (Zireuz)**. Si estás viendo este código en el portafolio o entrevista de un tercero, por favor solicita una validación técnica en vivo o comunícate conmigo a través de los canales oficiales arriba indicados. *La copia no autorizada sin atribución viola los términos de la licencia del desarrollador.*

</div>



# MacroDev

Panel web de control asíncrono para gestionar entornos de desarrollo locales (Node, React, Vite, etc.) desde cualquier dispositivo en la misma red, incluyendo smartphones.

---

## ¿Qué hace?

- Detecta automáticamente todos los proyectos dentro de una carpeta raíz (`PORTAFOLIO`)
- Permite abrir proyectos en VS Code con un botón
- Lanza y detiene terminales integradas de VS Code de forma remota
- Ejecuta túneles Ngrok desde la terminal de VS Code
- Limpia terminales activas
- Muestra un QR al arrancar para acceder desde el móvil sin escribir IPs

---

## Arquitectura

```
Móvil (navegador)
    │
    │  HTTP  LAN WiFi
    ▼
MacroDev Server  (Node/Express  :4000)
    │
    │  HTTP  localhost
    ▼
MacroDev Extension  (VS Code  :4001)
    │
    │  VS Code API
    ▼
Terminal integrada de VS Code
```

---

## Estructura de archivos

```
macroweb/
├── server.js           ← Servidor Express (puerto 4000)
├── index.html          ← Panel de control principal
├── bienvenida.html     ← Página de inicio con QR y tutorial
├── iniciar.vbs         ← Lanzador de doble click (sin terminal visible)
└── README.md

macrodev-terminal/      ← Extensión de VS Code
├── extension.js        ← Servidor HTTP interno (puerto 4001)
└── package.json        ← Manifest de la extensión
```

---

## Requisitos

- Node.js v18+
- VS Code
- Windows 10/11
- Ngrok (opcional, solo si usas túneles)

---

## Instalación MacroWeb 🛫

     1. Poner carpeta "macroweb" dentro de la carpeta donde tengas tus proyectos, al mismo nive de estos.
     2. Instalar extension (La app solo funciona con la extensión.)

### 1. Extensión de VS Code

La extensión permite a MacroDev controlar las terminales integradas de VS Code.

**Opción A — desde terminal:**
```cmd
code --install-extension macrodev-terminal-1.0.0.vsix
```

**Opción B — desde VS Code:**
`Ctrl+Shift+X` → `···` (tres puntos) → `Install from VSIX` → seleccionar el archivo

Reinicia VS Code completamente después de instalar.
Deberías ver `$(terminal) MacroDev :4001` en la barra de estado inferior.

**Verificar que está activa:**
```
http://127.0.0.1:4001/ping
```
Respuesta esperada: `{"status":"ok","message":"MacroDev Extension activa."}`

### 2. Dependencias del servidor

```cmd
cd macroweb
npm install
```

### 3. Configurar la carpeta de proyectos

Edita esta línea en `server.js`:
```js
const CARPETA_MADRE = 'C:\\Users\\TU_USUARIO\\Desktop\\PORTAFOLIO';
```

---

## Uso

### Arrancar MacroDev

**Opción A — doble click:**
Doble click en `iniciar.VBS`. El servidor arranca en segundo plano y abre el navegador automáticamente.

**Opción B — terminal:**
```cmd (abrir terminal desde la carpeta macrodev)
npx electron .
```

### Acceder desde el móvil

Al abrir `http://localhost:4000` en la PC verás la página de bienvenida con:
- Un QR con la URL de tu red local (`http://192.168.x.x:4000`)
- Estado de la extensión de VS Code
- Guía de instalación de la extensión

Escanea el QR con tu móvil (misma red WiFi) y accede al panel.

### Panel de control (`/panel`)

1. **Selecciona un proyecto** del dropdown — MacroDev lo detecta automáticamente leyendo los `package.json`
2. **Abrir en VS Code** — abre la carpeta del proyecto en VS Code
3. **⚡ Terminal [script]** — abre una terminal integrada en VS Code y ejecuta el script (start, dev, etc.)
4. **🛑 Stop** — cierra esa terminal integrada
5. **🧹** — limpia (cls) esa terminal sin cerrarla
6. **Ngrok** — abre un túnel HTTP en la terminal de VS Code al puerto indicado

---

## Endpoints de la API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/panel-completo` | Lista todos los proyectos detectados con sus scripts |
| GET | `/api/info` | Devuelve IP, puerto y URL del servidor |
| POST | `/api/macro/vscode-abrir/:nombre` | Abre el proyecto en VS Code |
| POST | `/api/macro/start/:nombre` | Abre terminal integrada y ejecuta comando |
| POST | `/api/macro/stop/:nombre` | Cierra la terminal integrada |
| POST | `/api/macro/clear/:nombre` | Ejecuta `cls` en la terminal activa |
| POST | `/api/macro/ngrok/:nombre` | Lanza ngrok en terminal de VS Code |
| POST | `/api/macro/clear-console` | Limpia la consola donde corre MacroDev |

---

## Extensión — Endpoints internos (:4001)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/ping` | Verificar que la extensión está activa |
| POST | `/terminal/start` | Crear terminal con `{ ruta, comando, titulo }` |
| POST | `/terminal/stop` | Cerrar terminal por `{ titulo }` |
| POST | `/terminal/clear` | Enviar `cls` a terminal por `{ titulo }` |
| POST | `/terminal/notify` | Mostrar popup en VS Code con `{ mensaje }` |

---

## Solución de problemas

**La extensión no aparece en VS Code:**
- Verifica que instalaste con `code --install-extension` y reiniciaste VS Code completamente
- Ejecuta `code --list-extensions | findstr macrodev` para confirmar instalación

**No conecta desde el móvil:**
- Ambos dispositivos deben estar en la misma red WiFi
- Verifica que el firewall de Windows permite conexiones al puerto 4000

**El botón Start devuelve error 503:**
- VS Code debe estar abierto antes de usar los botones del panel
- Verifica el ping a `http://127.0.0.1:4001/ping`

**Ngrok no ejecuta:**
- El archivo `ngrok.exe` debe estar en la raíz del proyecto (no en subcarpeta)
- Verifica que ngrok está autenticado con `ngrok config add-authtoken TU_TOKEN`

---

## Regenerar la extensión (.vsix)

Si modificas `extension.js`, reempaqueta así desde la carpeta `macrodev-terminal`:

```cmd
npx @vscode/vsce package --no-dependencies --allow-missing-repository --allow-star-activation
code --install-extension macrodev-terminal-1.0.0.vsix
```

Reinicia VS Code después.

🤝 Contribuciones

Este proyecto es una pieza de portafolio personal. Si deseas sugerir mejoras de UI/UX o correcciones en el contenido, siéntete libre de abrir un Pull Request.

Landing page diseñada y mantenida por [William / Zireuz] Linkedin: https://www.linkedin.com/in/zireuz-software. Contacto: +57 3156374818 Correo: willdevmor@gmail.com
