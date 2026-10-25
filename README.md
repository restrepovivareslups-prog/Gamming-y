# Funnel Master — El reto del embudo de ventas

Videojuego educativo en español sobre las etapas del embudo de ventas. Incluye cinco modos, feedback educativo, estadísticas simuladas, XP, rangos y guardado local.

## 1. Ejecutar la versión principal (sin Python)

1. Abre la carpeta `funnel-master` en Visual Studio Code.
2. Abre `index.html` en un navegador. Recomendado: extensión **Live Server** de VS Code y botón **Go Live**.
3. El juego funciona con HTML, CSS y JavaScript. No necesita instalar paquetes ni conectarse a internet.

## 2. Archivos

- `index.html`: pantallas y estructura.
- `css/styles.css`: diseño adaptable, colores, tarjetas y animaciones.
- `js/challenges.js`: preguntas, situaciones y explicaciones.
- `js/statistics.js`: estado, puntos, cálculos y guardado en `localStorage`.
- `js/game.js`: navegación y lógica de los cinco modos.
- `python/app.py`: API opcional con Flask para guardar resultados.
- `python/requirements.txt`: dependencias opcionales de Python.

## 3. Estadísticas iniciales

Los valores son ficticios para practicar: 1.000 visitantes, 300 leads, 150 interesados, 30 compradores y 12 clientes recurrentes. La conversión de compra se calcula como `compradores / visitantes * 100`, es decir, 3 % al inicio.

## 4. API opcional de Python

Necesitas Python 3.10 o posterior.

En una terminal, desde la carpeta raíz del proyecto:

```bash
python -m venv .venv
```

Activa el entorno virtual:

- Windows PowerShell: `.venv\Scripts\Activate.ps1`
- macOS/Linux: `source .venv/bin/activate`

Instala dependencias y ejecuta la API:

```bash
pip install -r python/requirements.txt
python python/app.py
```

La API estará disponible en `http://127.0.0.1:5000`. Comprueba el servicio en `/api/health`.

Ejemplo de envío de resultado desde una herramienta como curl:

```bash
curl -X POST http://127.0.0.1:5000/api/results ^
  -H "Content-Type: application/json" ^
  -d "{\"mode\":\"build\",\"score\":75,\"correct\":5,\"answered\":7}"
```

En PowerShell puede ser más cómodo ejecutar el `curl.exe` en una sola línea. La API valida los datos y conserva los últimos 1.000 resultados en `python/results.json`.

**Nota:** la API queda preparada como complemento y no está conectada automáticamente a la interfaz del juego. El juego principal guarda el progreso en el navegador con `localStorage`; para sincronizar los resultados con Flask, añade una llamada `fetch('/api/results', ...)` al flujo de finalización y sirve la página desde el mismo servidor o configura correctamente el origen permitido. No expongas la API pública sin autenticación y límites de uso.

## 5. Reiniciar progreso

Usa el botón ↻ de la parte superior. El juego pedirá confirmación antes de borrar los datos guardados en el navegador.


## 6. Instalar en el celular como una app (PWA)

El proyecto incluye `manifest.webmanifest`, `service-worker.js` e iconos. Esto permite instalarlo en la pantalla de inicio como una **aplicación web progresiva (PWA)** y usar los archivos principales sin conexión después de la primera carga.

**Importante:** un ZIP no se puede instalar directamente como una aplicación Android. Primero hay que publicar esta carpeta en un hosting con HTTPS (por ejemplo, GitHub Pages, Netlify o un servidor propio). Después abre la dirección publicada en el celular.

### Android (Chrome)
1. Abre la página publicada en Chrome.
2. Pulsa el menú `⋮`.
3. Elige **Instalar aplicación** o **Añadir a pantalla de inicio**.
4. Confirma. Funnel Master aparecerá como icono en el celular.

### iPhone (Safari)
1. Abre la página publicada en Safari.
2. Pulsa **Compartir**.
3. Selecciona **Añadir a pantalla de inicio**.
4. Pulsa **Añadir**.

### Publicar gratis con GitHub Pages
1. Crea un repositorio en GitHub y sube el contenido de la carpeta `funnel-master` (no solo el ZIP).
2. En el repositorio entra a **Settings → Pages**.
3. En “Build and deployment”, selecciona **Deploy from a branch**, la rama principal y la carpeta raíz `/`.
4. Guarda y espera a que GitHub genere la dirección HTTPS.
5. Abre esa dirección en el celular e instala la app con los pasos anteriores.

El botón **Instalar app** aparece cuando el navegador detecta que la instalación está disponible. Si no aparece, utiliza el menú del navegador.

**Alcance:** esto instala una PWA, no un APK nativo. Para generar un APK que se instale directamente, habría que empaquetar la web con herramientas como Capacitor/Android Studio y compilarla en un entorno de desarrollo Android.
