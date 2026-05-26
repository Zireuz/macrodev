# 🚀 Pro Macro Control Panel (Web Edition)

Un panel de automatización web avanzado y dinámico inspirado en MacroDroid, diseñado específicamente para desarrolladores. Permite gestionar múltiples entornos de desarrollo en tu PC, crear y eliminar macros personalizadas en caliente (como comandos de Git, procesos de _build_ o linters) y ejecutar tareas en segundo plano directamente desde el navegador de tu teléfono móvil a través de la red Wi-Fi local.

## 🛠️ Arquitectura y Tecnologías

- **Backend:** Node.js con Express. Gestiona el sistema de archivos (`fs`), administra subprocesos asíncronos (`child_process.exec`) y controla de manera independiente los PIDs de las terminales para apagarlas de forma limpia.
- **Persistencia Local:** Base de datos ligera basada en un archivo plano `macros-personalizadas.json` que almacena los comandos configurados desde la IU sin dependencias externas pesadas.
- **Frontend:** Single Page Application (SPA) responsiva construida con HTML5, CSS3 y JavaScript Vanilla (Fetch API), optimizada para pantallas móviles y guardado como Web App.

---

## 📦 Estructura del Directorio de Trabajo

Para un funcionamiento óptimo y una correcta detección, organiza la herramienta dentro de tu carpeta raíz de proyectos:

```text
📁 PORTAFOLIO/                       <- Tu carpeta madre de desarrollo
├── 📁 tu-tienda-virtual/            <- Un proyecto cualquiera de tu lista
├── 📁 mi-portafolio-web/            <- Otro proyecto de tu lista
└── 📁 macroweb/                     <- ESTE PROYECTO (Servidor de automatización)
    ├── 📁 node_modules/             <- Módulos de Node (Express, Cors)
    ├── 📄 package.json              <- Configuración del servidor de macros
    ├── 📄 server.js                 <- Código fuente del backend
    ├── 📄 index.html                <- Código fuente de la interfaz web
    └── 📄 macros-personalizadas.json<- Archivo auto-generado (Base de datos de macros)

```

---

## 🚀 Pasos para la Implementación

### 1. Configurar la Ruta de Desarrollo (`server.js`)

Abre el archivo `server.js` y asegúrate de que la constante `CARPETA_MADRE` apunte al directorio raíz donde tienes guardados tus proyectos. Recuerda usar doble barra invertida (`\\`) si estás trabajando en Windows:

```javascript
const CARPETA_MADRE = "C:\\Users\\willt\\Desktop\\PORTAFOLIO";
```

### 2. Configurar el Punto de Acceso Móvil (`index.html`)

Abre tu archivo `index.html` y coloca la dirección IP local IPv4 de tu computadora en la constante `IP_COMPUTADORA`:

```javascript
const IP_COMPUTADORA = "192.168.1.15"; // Reemplaza con tu IP local real
```

_(Nota: Puedes obtener tu IP abriendo la consola de comandos de tu PC y ejecutando `ipconfig` en Windows o `ifconfig` / `ip a` en entornos basados en Unix)._

### 3. Instalación de Dependencias e Inicialización

Abre la terminal de tu sistema operativo o la consola integrada de VS Code, dirígete a la carpeta del proyecto e inicia el servidor con los siguientes comandos:

```bash
# Cambiar al directorio del panel de macros
cd c:/Users/willt/Desktop/PORTAFOLIO/macroweb

# Instalar los paquetes express y cors requeridos
npm install

# Lanzar el backend de automatización
node server.js

```

Si todo está bien configurado, la terminal de tu PC mostrará el mensaje:

`🚀 Servidor Pro-Macros listo en puerto 5000`

---

## 📱 Configuración y Emparejamiento en el Celular

1. **Red Común:** Verifica que tu teléfono móvil y tu computadora compartan exactamente la **misma red Wi-Fi**.
2. **Navegación Local:** Abre el navegador web en tu smartphone (se recomienda Google Chrome en Android o Safari en iOS) e ingresa la IP de la PC junto con el puerto asignado:

```text
[http://192.168.1.15:5000](http://192.168.1.15:5000)


```

```
3. **Transformar en Aplicación Móvil:** Para evitar ingresar la dirección URL manualmente en el futuro:
   * En **Chrome (Android):** Despliega el menú de los **tres puntos** arriba a la derecha y pulsa **"Añadir a la pantalla de inicio"**.
   * En **Safari (iOS):** Toca el botón de **"Compartir"** abajo al centro y selecciona **"Añadir a la pantalla de inicio"**.
   * Esto colocará un icono de acceso rápido en tu escritorio idéntico al de una App nativa.

---

## 🔍 Características Avanzadas del Sistema

* **Escaner en Caliente:** El servidor inspecciona tu carpeta de desarrollo dinámicamente en cada petición. Si agregas, pegas, clonas o creas carpetas nuevas desde el Explorador de Archivos de Windows, aparecerán en tu móvil al instante, siempre y cuando contengan su respectivo archivo `package.json`.
* **Capa de Aislamiento:** La carpeta `macroweb` se encuentra protegida mediante filtros lógicos internos en el endpoint `/api/panel-completo` para evitar que apagues el servidor remoto de macros por accidente.
* **Inyección y Consumición de Macros Custom:** Al rellenar el formulario superior desde tu móvil, los comandos se guardan en el archivo JSON. Al ejecutarlos, el backend corre la instrucción en la carpeta destino seleccionada, captura el *output* estándar de la terminal de tu PC (`stdout`) y te devuelve los primeros caracteres del resultado de la consola directo a la pantalla de tu teléfono.

```
