# PianoDot

PianoDot es una aplicación móvil desarrollada con React Native y Expo que permite aprender a tocar piano a través de instrucciones auditivas. La aplicación guía al usuario mostrando visualmente qué teclas presionar mientras reproduce audio de instrucciones y música.

## Características Principales

- **Aprendizaje Guiado**: Instrucciones auditivas que guían al usuario paso a paso
- **Visualización de Teclas**: Muestra visualmente qué teclas presionar en tiempo real
- **Gestión de Partituras**: Carga y gestiona tus partituras musicales
- **Seguimiento de Progreso**: Guarda tu progreso y continúa desde donde lo dejaste
- **Reproducción de Audio**: Audio de piano y texto a voz (TTS) sincronizados
- **Accesibilidad**: Soporte completo para lectores de pantalla (TalkBack/VoiceOver)
- **Personalización**: Configuración de tamaño de fuente, contraste y temas
- **Autenticación Segura**: Integración con AWS Cognito para autenticación de usuarios

## Tecnologías Utilizadas

### Frontend
- **React Native** (0.72.10)
- **Expo** (~49.0.15)
- **React Navigation** (v6) - Navegación entre pantallas
- **Expo AV** - Reproducción de audio
- **Expo Speech** - Texto a voz
- **Expo Haptics** - Retroalimentación háptica
- **Expo Document Picker** - Selección de archivos

### Autenticación y Backend
- **AWS Amplify** - SDK de AWS
- **AWS Cognito** - Autenticación de usuarios
- **AWS API Gateway** - API REST backend
- **AWS S3** - Almacenamiento de archivos de audio

### Almacenamiento
- **AsyncStorage** - Almacenamiento local
- **Expo Secure Store** - Almacenamiento seguro de tokens

### Estilos
- **Expo Google Fonts (Fredoka)** - Tipografía personalizada

## Requisitos Previos

- **Node.js** (versión 14 o superior)
- **npm** o **yarn**
- **Expo CLI** (`npm install -g expo-cli`)
- **Cuenta de Expo** (opcional, para EAS Build)
- **Cuenta de AWS** con Cognito configurado
- **Backend API** desplegado en AWS API Gateway

## Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd pianodotfront
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   
   Edita `config/cognito.config.js` con tu configuración de AWS Cognito:
   ```javascript
   export const COGNITO_CONFIG = {
     userPoolId: 'tu-user-pool-id',
     clientId: 'tu-client-id',
     region: 'us-east-1',
     oauthDomain: 'tu-dominio-oauth',
   };
   ```

   Edita `config/api.config.js` con la URL de tu API:
   ```javascript
   export const API_CONFIG = {
     BASE_URL: 'https://tu-api-gateway-url.amazonaws.com/prod',
   };
   ```

4. **Iniciar el proyecto**
   ```bash
   npm start
   ```

## Scripts Disponibles

- `npm start` - Inicia el servidor de desarrollo de Expo
- `npm run android` - Ejecuta la app en Android

## Estructura del Proyecto

```
pianodotfront/
├── assets/              # Recursos estáticos
├── auth/                # Módulos de autenticación
│   ├── cognitoAuth.js   # Configuración y funciones de Cognito
│   └── secureStorage.js # Almacenamiento seguro
├── config/              # Configuraciones
│   ├── api.config.js    # Configuración de API
│   └── cognito.config.js # Configuración de Cognito
├── img/                 # Imágenes de la aplicación
│   ├── logo*.png        # Logo
│   ├── piano-stretched.png
│   └── tecladotocado/   # Imágenes de teclas presionadas
├── services/            # Servicios de API
│   └── pianodotApi.js   # Cliente de API
├── src/
│   ├── context/         # Contextos de React
│   │   └── PracticeContext.js # Contexto de práctica
│   ├── hooks/           # Custom hooks
│   │   ├── useAudioPlayer.js
│   │   ├── usePredictions.js
│   │   ├── useScoreProgress.js
│   │   ├── useSettings.js
│   │   └── useTextToSpeech.js
│   ├── screens/         # Pantallas de la aplicación
│   │   ├── AuthScreen.js
│   │   ├── ControlsScreen.js
│   │   ├── HomeScreen.js
│   │   ├── LoadScoresScreen.js
│   │   ├── LoginScreen.js
│   │   ├── MyScoresScreen.js
│   │   ├── PianoScreen.js
│   │   ├── RegisterScreen.js
│   │   ├── ScoreDetailScreen.js
│   │   ├── SettingsScreen.js
│   │   └── WelcomeLandingScreen.js
│   ├── styles/          # Estilos de la aplicación
│   │   ├── appStyles.js
│   │   └── homeStyles.js
│   └── utils/           # Utilidades
│       └── settingsEvents.js
├── App.js               # Componente principal
├── app.json             # Configuración de Expo
├── package.json         # Dependencias del proyecto
└── README.md           # Este archivo
```

## Funcionalidades Detalladas

### Autenticación
- Registro de nuevos usuarios
- Inicio de sesión con email/contraseña
- Inicio de sesión con Google (OAuth)
- Gestión de sesiones y tokens
- Recuperación de contraseña

### Gestión de Partituras
- Carga de archivos de partituras (MusicXML, etc.)
- Listado de partituras guardadas
- Detalles de cada partitura
- Eliminación de partituras
- Sincronización con backend

### Práctica de Piano
- Reproducción de audio de piano
- Instrucciones de texto a voz (TTS)
- Visualización de teclas a presionar
- Navegación entre compases (siguiente/anterior)
- Repetición de compases
- Guardado automático de progreso
- Timeline sincronizado con audio

### Configuración
- Tamaños de fuente (normal, grande, extra grande)
- Temas de contraste (blanco/negro, negro/blanco, alto contraste)
- Configuración de audio
- Accesibilidad mejorada

## Configuración de AWS Cognito

La aplicación requiere una configuración previa de AWS Cognito:

1. Crear un User Pool en AWS Cognito
2. Configurar OAuth providers (Google)
3. Configurar redirect URIs: `pianodot://`
4. Obtener User Pool ID, Client ID y OAuth Domain
5. Configurar en `config/cognito.config.js`

## Configuración de API

La aplicación se conecta a un backend FastAPI desplegado en AWS API Gateway:

- **Endpoints principales**:
  - `/partituras` - Gestión de partituras
  - `/practice/{id}/start` - Iniciar práctica
  - `/practice/{id}/next` - Siguiente compás
  - `/practice/{id}/prev` - Compás anterior
  - `/practice/{id}/repeat` - Repetir compás
  - `/partituras/{id}/audio_piano/{compas}` - Audio de piano
  - `/partituras/{id}/audio_tts/{compas}` - Audio TTS
  - `/partituras/{id}/practice/{compas}/timeline` - Timeline de eventos

## Personalización

### Temas de Contraste
- `whiteBlack` - Fondo blanco, texto negro
- `blackWhite` - Fondo negro, texto blanco
- `blackYellow` - Alto contraste amarillo
- `blackBlue` - Alto contraste azul
- `blackGreen` - Alto contraste verde

### Tamaños de Fuente
- `normal` - Tamaño estándar
- `large` - Tamaño grande
- `extraLarge` - Tamaño extra grande

## Plataformas Soportadas

- Android

## Desarrollo

### Estructura de Navegación

La aplicación utiliza React Navigation con las siguientes pantallas:

1. **WelcomeLandingScreen** - Pantalla de bienvenida
2. **AuthScreen** - Selección de método de autenticación
3. **LoginScreen** - Inicio de sesión
4. **RegisterScreen** - Registro de usuario
5. **HomeScreen** - Pantalla principal
6. **LoadScoresScreen** - Carga de partituras
7. **MyScoresScreen** - Lista de partituras
8. **ScoreDetailScreen** - Detalles de partitura
9. **PianoScreen** - Pantalla de práctica
10. **ControlsScreen** - Controles de reproducción
11. **SettingsScreen** - Configuración

### Contextos y Hooks

- **PracticeContext**: Gestiona el estado global de la práctica
- **useAudioPlayer**: Manejo de reproducción de audio
- **useTextToSpeech**: Texto a voz
- **useSettings**: Configuración de la aplicación
- **useScoreProgress**: Progreso de partituras
- **usePredictions**: Predicciones y estado de partituras



## Autores

Desarrollado por marcos hwang y matias gomila

---

