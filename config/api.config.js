// Configuración de la API para PianoDot
// Cambiar estas URLs según tu configuración del backend
import { Platform } from 'react-native';

export const API_CONFIG = {
  // URL base del backend FastAPI (AWS API Gateway)
  BASE_URL: 'https://enq8cw8cyg.execute-api.us-east-1.amazonaws.com/prod',
  
  // URLs alternativas para diferentes entornos
  DEVELOPMENT: 'http://localhost:8000',
  // Para Android Emulator usar: 'http://10.0.2.2:8000'
  PRODUCTION: 'https://enq8cw8cyg.execute-api.us-east-1.amazonaws.com/prod',
  
  // Timeouts
  TIMEOUT: 10000,
  
  // Headers por defecto
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // Configuración de reintentos
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

// Función para obtener la URL base según el entorno y plataforma
export const getBaseURL = () => {
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
