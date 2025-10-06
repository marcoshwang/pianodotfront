// Configuración de la API para PianoDot
// Cambiar estas URLs según tu configuración del backend
import { Platform } from 'react-native';

export const API_CONFIG = {
  // URL base del backend FastAPI
  BASE_URL: 'http://localhost:8000',
  
  // URLs alternativas para diferentes entornos
  DEVELOPMENT: 'http://localhost:8000',
  // Para Android Emulator usar: 'http://10.0.2.2:8000'
  // Para iOS Simulator usar: 'http://localhost:8000'
  // Para dispositivo físico usar tu IP local: 'http://192.168.1.XXX:8000'
  PRODUCTION: 'https://tu-dominio.com/api',
  
  // Timeouts
  TIMEOUT: 10000, // 10 segundos
  
  // Headers por defecto
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // Configuración de reintentos
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 segundo
};

// Función para obtener la URL base según el entorno y plataforma
export const getBaseURL = () => {
  // En desarrollo, detectar la plataforma
  if (__DEV__) {
    // Detectar si estamos en Android Emulator
    if (Platform.OS === 'android') {
      // Para Android Emulator, usar 10.0.2.2
      return 'http://10.0.2.2:8000';
    }
    
    // Para iOS Simulator, usar localhost
    if (Platform.OS === 'ios') {
      return API_CONFIG.DEVELOPMENT;
    }
    
    // Para web, usar localhost
    return API_CONFIG.DEVELOPMENT;
  }
  
  // En producción, usar la URL de producción
  return API_CONFIG.PRODUCTION;
};

// Función para obtener headers con autenticación
export const getAuthHeaders = (token = null) => {
  const headers = { ...API_CONFIG.DEFAULT_HEADERS };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

export default API_CONFIG;
