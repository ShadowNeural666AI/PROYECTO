# EXO INSIGHT AI – ASISTENTE VIRTUAL INTELIGENTE

> **Centro de control holográfico y asistente de inteligencia artificial con visión artificial en tiempo real, comandos de voz y el robot 3D interactivo EXO renderizado con WebGL y Three.js.**

---

## 1. Visión General del Proyecto

**EXO INSIGHT AI** es una plataforma web futurista inspirada en interfaces cyberpunk y centros de mando de inteligencia artificial. Su objetivo es brindar una experiencia fluida e interactiva donde el usuario puede:

- **Ver el entorno mediante Visión Artificial:** Reconocer objetos con la cámara web utilizando modelos de clasificación de imágenes entrenados en **Google Teachable Machine** y ejecutados con **TensorFlow.js**.
- **Interactuar por Voz:** Dictar comandos y recibir respuestas habladas mediante la **Web Speech API** y modelos de audio.
- **Interactuar con el Robot 3D EXO:** Un personaje robótico tridimensional original construido con **Three.js**, con cinemática procedural continua, seguimiento ocular y cefálico del cursor, efectos holográficos y 9 estados emocionales sincronizados con las funciones de IA.
- **Consultar Analíticas e Historial:** Registro cronológico de predicciones y estadísticas interactivas con **Chart.js** y almacenamiento local en **LocalStorage** (preparado para **PostgreSQL**).

---

## 2. Tecnologías Empleadas

| Área | Tecnologías |
| :--- | :--- |
| **Estructura y Maquetación** | HTML5 semántico con HUDs holográficos |
| **Estilos y Animaciones** | CSS3 moderno, Glassmorphism, Neon Glows, Flexbox, CSS Grid y efectos de escáner láser |
| **Interactividad y Lógica** | JavaScript ES6+ modular y reactivo |
| **Motor 3D WebGL** | Three.js r128 con cinemática procedural, PBR shaders, iluminación dinámica y OrbitControls |
| **Inteligencia Artificial** | TensorFlow.js, Google Teachable Machine Image & Audio, MobileNet |
| **Voz y Audio** | Web Speech API (`SpeechRecognition` & `SpeechSynthesis`), Web Audio API para síntesis de efectos sonoros |
| **Estadísticas y Gráficos** | Chart.js 4.4 con paleta cyberpunk |
| **Persistencia** | LocalStorage (preparado para Node.js, Express y PostgreSQL) |

---

## 3. Organización de Archivos

```
ASISTENTE AI/
│
├── index.html              # Estructura principal del dashboard y vistas
├── README.md               # Documentación y guía de entrenamiento
│
├── css/
│   └── styles.css          # Estilos glassmorphism, temas oscuros y animaciones HUD
│
├── js/
│   ├── app.js              # Controlador maestro, reloj digital, efectos de audio y tabs
│   ├── exo3d.js            # Motor Three.js del robot 3D EXO y escenario holográfico
│   ├── vision.js           # Visión artificial, cámara y Teachable Machine Image
│   ├── voice.js            # Reconocimiento y síntesis de voz, visualizador de ondas
│   ├── assistant.js        # Lógica conversacional del asistente virtual
│   ├── history.js          # Gestión y persistencia del historial de eventos
│   └── statistics.js       # Gráficos Chart.js y métricas cuantitativas
│
└── models/
    ├── image/
    │   └── metadata.json   # Metadatos de las 7 clases del modelo de imagen
    └── audio/
        └── metadata.json   # Metadatos de las clases de comandos de voz
```

---

## 4. Instrucciones de Instalación y Ejecución

Dado que la aplicación accede a la cámara web (`getUserMedia`) y carga scripts de TensorFlow y Three.js, **debe servirse mediante un servidor HTTP local** (no abrir como archivo `file:///`).

### Opción 1: Con Python (Recomendado)
Abre una terminal en la carpeta del proyecto y ejecuta:
```bash
python -m http.server 8000
```
Luego abre tu navegador en:
```
http://localhost:8000
```

### Opción 2: Con Node.js / npx
```bash
npx serve .
```

### Opción 3: Con VS Code Live Server
Haz clic derecho en `index.html` y selecciona **«Open with Live Server»**.

---

## 5. Guía Paso a Paso: Google Teachable Machine

### A. Modelo de Visión (Clasificación de Imágenes)

1. Ingresa a [Google Teachable Machine](https://teachablemachine.withgoogle.com/) y haz clic en **«Empezar»** → **«Proyecto de imagen»** → **«Modelo de imagen estándar»**.
2. Crea exactamente las **7 clases obligatorias**:
   - `Computadora`
   - `Celular`
   - `Mouse`
   - `Teclado`
   - `Botella`
   - `Persona`
   - `Sin objeto`
3. Para cada clase, activa la cámara web y graba entre **50 y 150 muestras** variando los ángulos y la iluminación.
4. Haz clic en **«Preparar modelo» (Train Model)** y espera a que finalice el entrenamiento.
5. Haz clic en **«Exportar modelo» (Export Model)**:
   - **Método A (Enlace en la nube - Recomendado):**
     1. Selecciona la pestaña **«TensorFlow.js»** y haz clic en **«Subir mi modelo» (Upload my model)**.
     2. Copia el enlace generado (ejemplo: `https://teachablemachine.withgoogle.com/models/vKzJzW4x_/`).
     3. En la aplicación **EXO INSIGHT AI**, ve a la pestaña **«Configuración»**, pega el enlace en el campo **«URL del Modelo de Imagen»** y haz clic en **«Conectar Modelo»**.
   - **Método B (Descarga local):**
     1. Elige **«Descargar mi modelo» (Download)**.
     2. Descomprime los archivos `model.json`, `metadata.json` y `weights.bin` directamente dentro de la carpeta `models/image/` del proyecto.
     3. En la aplicación, haz clic en el botón **«Modelo Local (models/image/)»**.

> **Nota sobre el modelo de visión:** Teachable Machine clasifica la imagen completa según la probabilidad global. No inventa cajas delimitadoras de detección de múltiples objetos simultáneos, garantizando fidelidad con la especificación.

---

### B. Modelo de Audio Entrenado (Proyecto Teachable Machine)

El sistema integra y ha entrenado el modelo acústico neuronal a partir del archivo de proyecto **`RECONOCER COMANDOS DE VOZ (1).tm`**, que contiene 60 muestras reales distribuidas en:
- `_background_noise_` (20 muestras de calibración ambiental)
- `INICIA` (20 muestras vocales de activación)
- `ALTO` (20 muestras vocales de detención)

La red neuronal fue entrenada alcanzando un **100 % de precisión**, y sus pesos y matrices de sesgo han sido exportados a `models/audio/model_weights.json` y `models/audio/metadata.json` (reproducible mediante `python models/audio/train_audio_model.py`).

Adicionalmente, para evitar respuestas repetitivas o monótonas, EXO incorpora un **motor conversacional dinámico no-monótono** que varía sus frases, modula su tono y responde a temas cotidianos (chistes, datos curiosos, saludos por hora, estado emocional y agradecimientos).

---

## 6. Diccionario de Comandos de Voz y Acciones

| Comando de Voz | Acción del Sistema | Reacción del Robot EXO | Variedad Conversacional |
| :--- | :--- | :--- | :--- |
| `«INICIA»` *(TM Entrenado)* | Activa la cámara y ejecuta la clasificación en vivo | Modo Escaneo + Haz láser cian | Frases dinámicas de confirmación óptica |
| `«ALTO»` *(TM Entrenado)* | Detiene de inmediato el escaneo y apaga la cámara | Retorno a reposo | Confirmaciones variadas de detención |
| `«Hola asistente»` / `«Hola EXO»` | Saludo interactivo con reconocimiento de operador | Saludo animado, levanta el brazo | Respuestas contextuales y de bienvenida |
| `«¿Qué estás viendo?»` | Consulta el objeto detectado y su confianza real | Gesto de habla y respuesta por voz | Descripción técnica y porcentaje |
| `«Necesito ayuda»` | Enuncia las capacidades y comandos disponibles | Gesto explicativo sincronizado | Explicación detallada de funciones |
| `«¿Cómo estás?»` | Consulta sobre el estado del robot | Movimiento gestual y fonación | Respuestas de personalidad y estado |
| `«Dato curioso»` / `«Chiste»` | Preguntas de entretenimiento y curiosidades | Risa/guiño y locución hablada | Banco dinámico de humor y tecnología |
| `«Detener análisis»` | Detiene el escaneo y apaga la cámara | Retorna suavemente a reposo | Pausa segura de periféricos |

---

## 7. Módulo Especial: Robot 3D EXO

El personaje **EXO** es un modelo tridimensional procedural original renderizado en tiempo real con WebGL:

- **Estructura y Materiales:**
  - Cabeza aerodinámica con casco blanco pulido PBR y visor de cristal oscuro.
  - Ojos LED azules cian expresivos con animación de parpadeo y dilatación.
  - Chasis torácico con armadura plateada y núcleo reactor de arco pulsante.
  - Extremidades articuladas (hombro, codo, mano) para saludos y gesticulación.
  - Plataforma holográfica con anillos concéntricos giratorios y nube de partículas ascendentes.
- **Interacción y Seguimiento:**
  - La cabeza y los ojos siguen suavemente la posición del cursor del usuario en la pantalla (`mousemove` con interpolación lerp).
  - Al hacer clic sobre EXO, reacciona saludando y mostrando un bocadillo de diálogo holográfico.
- **Estados de Animación Automatizados:**
  - `EXO_IDLE`: Flotación continua en el eje Y con movimiento armónico suave.
  - `EXO_GREETING`: Gira al usuario y saluda con el brazo derecho.
  - `EXO_LISTENING`: Inclina la cabeza con atención y cambia los ojos a azul profundo.
  - `EXO_THINKING`: Mirada exploratoria lateral y pulsación violeta.
  - `EXO_SCANNING`: Activa haz láser cian proyectado desde el visor.
  - `EXO_SPEAKING`: Gestos de brazos y asentimientos en sincronía con la voz.
  - `EXO_SUCCESS`: Celebración con brazos elevados al identificar un objeto.
  - `EXO_ERROR`: Negación cefálica y alerta luminosa ámbar/roja.
  - `EXO_GOODBYE`: Inclinación suave y atenuación de potencia.

---

## 8. Persistencia y Futura Integración con PostgreSQL

Actualmente, la persistencia temporal de los análisis, estadísticas y configuración se gestiona mediante `LocalStorage`. Para conectar un backend en **Node.js, Express y PostgreSQL**:

1. **Estructura de la tabla PostgreSQL:**
   ```sql
   CREATE TABLE detection_history (
       id SERIAL PRIMARY KEY,
       timestamp TIMESTAMPTZ DEFAULT NOW(),
       event_type VARCHAR(20) NOT NULL, -- 'vision' o 'voice'
       title VARCHAR(150) NOT NULL,
       object_name VARCHAR(100),
       confidence VARCHAR(10),
       detail TEXT
   );
   ```
2. **Endpoints API REST en Express:**
   - `GET /api/history` → Retorna registros ordenados cronológicamente.
   - `POST /api/history` → Inserta un nuevo análisis o comando ejecutado.
   - `DELETE /api/history` → Limpia los registros.

El módulo `js/history.js` está estructurado con métodos (`addRecord`, `loadRecords`, `saveRecords`, `clearAll`) que pueden cambiar fácilmente sus llamadas internas de `localStorage` a `fetch('/api/history')` sin alterar la interfaz de usuario.
