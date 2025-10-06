// Servicio API centralizado para PianoDot usando fetch
import { getBaseURL, getAuthHeaders } from '../config/api.config';
import { getAuthToken } from '../utils/mockAuth';

// Configuración base
const BASE_URL = getBaseURL();
const TIMEOUT = 10000;

// Función helper para crear headers con autenticación
const createHeaders = (customHeaders = {}) => {
  const token = getAuthToken();
  const headers = {
    ...getAuthHeaders(),
    ...customHeaders,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Función helper para manejar respuestas y errores
const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = `Error ${response.status}: ${response.statusText}`;
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.detail || errorMessage;
    } catch (e) {
      // Si no se puede parsear el error, usar el mensaje por defecto
    }
    
    const error = new Error(errorMessage);
    error.status = response.status;
    error.statusText = response.statusText;
    throw error;
  }
  
  return response;
};

// Función helper para hacer requests con timeout
const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
};

// ===== ENDPOINTS DE PARTITURAS =====

/**
 * Subir una nueva partitura
 * @param {FormData} formData - Datos del archivo a subir
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export const uploadPartitura = async (fileData) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('📤 Iniciando upload de partitura...');
      console.log('File data:', fileData);
      
      // Usar la URL que sabemos que funciona
      const uploadURL = 'http://10.0.2.2:8000/partituras';
      console.log('Haciendo POST a:', uploadURL);
      
      // Método directo: FormData simple
      console.log('🚀 Creando FormData directo...');
      const formData = new FormData();
      formData.append('file', {
        uri: fileData.uri,
        type: fileData.mimeType,
        name: fileData.name,
      });
      
      console.log('📤 FormData creado:', formData);
      console.log('📤 Archivo URI:', fileData.uri);
      console.log('📤 Archivo tipo:', fileData.mimeType);
      console.log('📤 Archivo nombre:', fileData.name);
      
      // Usar fetch simple sin timeout para evitar problemas
      console.log('🚀 Enviando request directo...');
      const response = await fetch(uploadURL, {
        method: 'POST',
        body: formData,
        headers: {
          // No agregar Content-Type para FormData, fetch lo maneja automáticamente
          'Accept': 'application/json',
        },
      });
      
      console.log('📊 Respuesta del upload:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Partitura subida exitosamente:', result);
        resolve(result);
      } else {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        console.error('❌ Status:', response.status);
        console.error('❌ StatusText:', response.statusText);
        reject(new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`));
      }
    } catch (error) {
      console.error('❌ Error subiendo partitura:', error);
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      reject(error);
    }
  });
};

/**
 * Obtener todas las partituras del usuario
 * @returns {Promise<Array>} - Lista de partituras
 */
export const getPartituras = async () => {
  try {
    console.log('Haciendo request a:', `${BASE_URL}/partituras`);
    console.log('Headers:', createHeaders());
    
    const response = await fetchWithTimeout(`${BASE_URL}/partituras`, {
      method: 'GET',
      headers: createHeaders(),
    });
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    await handleResponse(response);
    const data = await response.json();
    console.log('Response data:', data);
    return data;
  } catch (error) {
    console.error('Error obteniendo partituras:', error);
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    throw error;
  }
};

/**
 * Obtener detalles de una partitura específica
 * @param {string} partituraId - ID de la partitura
 * @returns {Promise<Object>} - Detalles de la partitura
 */
export const getPartituraDetails = async (partituraId) => {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/partituras/${partituraId}`, {
      method: 'GET',
      headers: createHeaders(),
    });
    
    await handleResponse(response);
    return await response.json();
  } catch (error) {
    console.error('Error obteniendo detalles de partitura:', error);
    throw error;
  }
};

/**
 * Obtener predicciones de una partitura
 * @param {string} partituraId - ID de la partitura
 * @returns {Promise<Object>} - Predicciones de la partitura
 */
export const getPartituraPredicciones = async (partituraId) => {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/partituras/${partituraId}/predicciones`, {
      method: 'GET',
      headers: createHeaders(),
    });
    
    await handleResponse(response);
    return await response.json();
  } catch (error) {
    console.error('Error obteniendo predicciones:', error);
    throw error;
  }
};

/**
 * Eliminar una partitura
 * @param {string} partituraId - ID de la partitura a eliminar
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export const deletePartitura = async (partituraId) => {
  try {
    console.log('🗑️ Iniciando eliminación de partitura:', partituraId);
    console.log('🗑️ URL de eliminación:', `${BASE_URL}/partituras/${partituraId}`);
    console.log('🗑️ Headers:', createHeaders());
    
    const response = await fetchWithTimeout(`${BASE_URL}/partituras/${partituraId}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
    
    console.log('🗑️ Respuesta del DELETE:', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    });
    
    await handleResponse(response);
    const result = await response.json();
    console.log('✅ Partitura eliminada del backend:', result);
    return result;
  } catch (error) {
    console.error('❌ Error eliminando partitura:', error);
    console.error('❌ Error type:', error.constructor.name);
    console.error('❌ Error message:', error.message);
    throw error;
  }
};

/**
 * Obtener audio TTS para un compás específico
 * @param {string} partituraId - ID de la partitura
 * @param {number} compas - Número del compás
 * @returns {Promise<Blob>} - Audio en formato blob
 */
export const getTTSAudio = async (partituraId, compas) => {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/partituras/${partituraId}/tts/${compas}`, {
      method: 'GET',
      headers: createHeaders(),
    });
    
    await handleResponse(response);
    return await response.blob();
  } catch (error) {
    console.error('Error obteniendo audio TTS:', error);
    throw error;
  }
};

// ===== ENDPOINTS DE PRÁCTICA =====

/**
 * Iniciar una sesión de práctica
 * @param {string} partituraId - ID de la partitura
 * @returns {Promise<Object>} - Estado inicial de la práctica
 */
export const startPractice = async (partituraId) => {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/practice/${partituraId}/start`, {
      method: 'POST',
      headers: createHeaders(),
    });
    
    await handleResponse(response);
    return await response.json();
  } catch (error) {
    console.error('Error iniciando práctica:', error);
    throw error;
  }
};

/**
 * Obtener el siguiente compás
 * @param {string} partituraId - ID de la partitura
 * @returns {Promise<Object>} - Siguiente compás
 */
export const getNextCompas = async (partituraId) => {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/practice/${partituraId}/next`, {
      method: 'GET',
      headers: createHeaders(),
    });
    
    await handleResponse(response);
    return await response.json();
  } catch (error) {
    console.error('Error obteniendo siguiente compás:', error);
    throw error;
  }
};

/**
 * Obtener el compás anterior
 * @param {string} partituraId - ID de la partitura
 * @returns {Promise<Object>} - Compás anterior
 */
export const getPrevCompas = async (partituraId) => {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/practice/${partituraId}/prev`, {
      method: 'GET',
      headers: createHeaders(),
    });
    
    await handleResponse(response);
    return await response.json();
  } catch (error) {
    console.error('Error obteniendo compás anterior:', error);
    throw error;
  }
};

/**
 * Repetir el compás actual
 * @param {string} partituraId - ID de la partitura
 * @returns {Promise<Object>} - Compás repetido
 */
export const repeatCompas = async (partituraId) => {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/practice/${partituraId}/repeat`, {
      method: 'GET',
      headers: createHeaders(),
    });
    
    await handleResponse(response);
    return await response.json();
  } catch (error) {
    console.error('Error repitiendo compás:', error);
    throw error;
  }
};

// ===== UTILIDADES =====

/**
 * Verificar si el backend está disponible
 * @returns {Promise<boolean>} - True si está disponible
 */
export const checkBackendHealth = async () => {
  try {
    console.log('Verificando conectividad con:', BASE_URL);
    const response = await fetchWithTimeout(`${BASE_URL}/health`, {
      method: 'GET',
      headers: createHeaders(),
    });
    
    console.log('Health check response:', response.status);
    return response.ok;
  } catch (error) {
    console.error('Backend no disponible:', error);
    console.error('Error type:', error.constructor.name);
    return false;
  }
};

/**
 * Test de conectividad básica
 * @returns {Promise<Object>} - Resultado del test
 */
export const testConnectivity = async () => {
  const result = {
    url: BASE_URL,
    timestamp: new Date().toISOString(),
    success: false,
    error: null,
    response: null
  };
  
  try {
    console.log('🧪 Iniciando test de conectividad...');
    console.log('📍 URL:', BASE_URL);
    
    const response = await fetchWithTimeout(`${BASE_URL}/`, {
      method: 'GET',
      headers: createHeaders(),
    });
    
    result.success = response.ok;
    result.response = {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    };
    
    console.log('✅ Test de conectividad exitoso:', result);
    return result;
  } catch (error) {
    result.error = {
      type: error.constructor.name,
      message: error.message,
      stack: error.stack
    };
    
    console.log('❌ Test de conectividad falló:', result);
    return result;
  }
};

/**
 * Test de conectividad con múltiples URLs
 * @returns {Promise<Object>} - Resultado del test con la mejor URL
 */
export const testMultipleURLs = async () => {
  const urls = [
    'http://10.0.2.2:8000', // Android Emulator (prioridad)
    'http://localhost:8000',
    'http://127.0.0.1:8000',
  ];
  
  console.log('🔍 Probando múltiples URLs...');
  
  for (const url of urls) {
    try {
      console.log(`📍 Probando: ${url}`);
      
      // Usar fetch normal con timeout manual
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos
      
      const response = await fetch(`${url}/`, {
        method: 'GET',
        headers: createHeaders(),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      console.log(`📊 Respuesta de ${url}:`, {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });
      
      if (response.ok) {
        console.log(`✅ URL funcional encontrada: ${url}`);
        return {
          success: true,
          url: url,
          response: {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
          }
        };
      } else {
        console.log(`⚠️ ${url} respondió pero no es OK:`, response.status);
      }
    } catch (error) {
      console.log(`❌ ${url} falló:`, error.message);
      if (error.name === 'AbortError') {
        console.log(`⏰ ${url} timeout después de 5 segundos`);
      }
    }
  }
  
  console.log('❌ Ninguna URL funcionó');
  return {
    success: false,
    error: 'No se pudo conectar a ninguna URL'
  };
};

/**
 * Test de upload con archivo dummy
 * @returns {Promise<Object>} - Resultado del test
 */
export const testUploadEndpoint = async () => {
  try {
    console.log('🧪 Test de upload endpoint...');
    
    // Crear FormData dummy para test
    const testFormData = new FormData();
    testFormData.append('file', {
      uri: 'file://test.pdf',
      type: 'application/pdf',
      name: 'test.pdf',
    });
    
    const uploadURL = 'http://10.0.2.2:8000/partituras';
    console.log('📍 Probando upload en:', uploadURL);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(uploadURL, {
      method: 'POST',
      body: testFormData,
      headers: createHeaders(),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    console.log('📊 Respuesta del test upload:', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Test upload exitoso:', data);
      return {
        success: true,
        url: uploadURL,
        data: data,
        response: {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        }
      };
    } else {
      const errorText = await response.text();
      console.log('⚠️ Test upload respondió pero no es OK:', response.status, errorText);
      return {
        success: false,
        error: `Upload test failed: ${response.status} ${errorText}`
      };
    }
  } catch (error) {
    console.log('❌ Test upload falló:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Test de conectividad básica con POST
 * @returns {Promise<Object>} - Resultado del test
 */
export const testPostConnectivity = async () => {
  const urls = [
    'http://10.0.2.2:8000',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
  ];
  
  console.log('🔍 Probando conectividad POST...');
  
  for (const url of urls) {
    try {
      console.log(`📍 Probando POST en: ${url}`);
      
      // Test 1: POST simple sin FormData
      const controller1 = new AbortController();
      const timeoutId1 = setTimeout(() => controller1.abort(), 5000);
      
      const response1 = await fetch(`${url}/partituras`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: 'data' }),
        signal: controller1.signal,
      });
      
      clearTimeout(timeoutId1);
      
      console.log(`📊 POST simple en ${url}:`, {
        status: response1.status,
        ok: response1.ok,
        statusText: response1.statusText
      });
      
      // Test 2: POST con FormData
      const testFormData = new FormData();
      testFormData.append('file', {
        uri: 'file://test.pdf',
        type: 'application/pdf',
        name: 'test.pdf',
      });
      
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), 5000);
      
      const response2 = await fetch(`${url}/partituras`, {
        method: 'POST',
        body: testFormData,
        signal: controller2.signal,
      });
      
      clearTimeout(timeoutId2);
      
      console.log(`📊 POST FormData en ${url}:`, {
        status: response2.status,
        ok: response2.ok,
        statusText: response2.statusText
      });
      
      if (response2.ok) {
        const data = await response2.json();
        console.log(`✅ POST FormData exitoso en ${url}:`, data);
        return {
          success: true,
          url: url,
          data: data,
          response: {
            status: response2.status,
            statusText: response2.statusText,
            ok: response2.ok
          }
        };
      }
    } catch (error) {
      console.log(`❌ POST falló en ${url}:`, error.message);
      if (error.name === 'AbortError') {
        console.log(`⏰ POST timeout en ${url}`);
      }
    }
  }
  
  console.log('❌ Ningún POST funcionó');
  return {
    success: false,
    error: 'No se pudo conectar a ningún endpoint POST'
  };
};

/**
 * Test específico del endpoint POST /partituras
 * @returns {Promise<Object>} - Resultado del test
 */
export const testPartiturasPostEndpoint = async () => {
  const urls = [
    'http://10.0.2.2:8000',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
  ];
  
  console.log('🎵 Probando endpoint POST /partituras específicamente...');
  
  for (const url of urls) {
    try {
      console.log(`📍 Probando POST /partituras en: ${url}`);
      
      // Test 1: Verificar si el endpoint existe
      console.log('🧪 Test 1: Verificar endpoint...');
      const controller1 = new AbortController();
      const timeoutId1 = setTimeout(() => controller1.abort(), 5000);
      
      const response1 = await fetch(`${url}/partituras`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: 'data' }),
        signal: controller1.signal,
      });
      
      clearTimeout(timeoutId1);
      
      console.log(`📊 Respuesta POST /partituras en ${url}:`, {
        status: response1.status,
        ok: response1.ok,
        statusText: response1.statusText
      });
      
      // Test 2: Verificar si acepta FormData
      console.log('🧪 Test 2: Verificar FormData...');
      const testFormData = new FormData();
      testFormData.append('file', {
        uri: 'file://test.pdf',
        type: 'application/pdf',
        name: 'test.pdf',
      });
      
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), 5000);
      
      const response2 = await fetch(`${url}/partituras`, {
        method: 'POST',
        body: testFormData,
        signal: controller2.signal,
      });
      
      clearTimeout(timeoutId2);
      
      console.log(`📊 Respuesta POST FormData en ${url}:`, {
        status: response2.status,
        ok: response2.ok,
        statusText: response2.statusText
      });
      
      if (response2.ok) {
        const data = await response2.json();
        console.log(`✅ POST /partituras exitoso en ${url}:`, data);
        return {
          success: true,
          url: url,
          data: data,
          response: {
            status: response2.status,
            statusText: response2.statusText,
            ok: response2.ok
          }
        };
      } else {
        const errorText = await response2.text();
        console.log(`⚠️ POST /partituras respondió pero no es OK:`, response2.status, errorText);
        return {
          success: false,
          error: `POST /partituras failed: ${response2.status} ${errorText}`,
          url: url,
          response: {
            status: response2.status,
            statusText: response2.statusText,
            ok: response2.ok
          }
        };
      }
    } catch (error) {
      console.log(`❌ POST /partituras falló en ${url}:`, error.message);
      if (error.name === 'AbortError') {
        console.log(`⏰ POST /partituras timeout en ${url}`);
      }
    }
  }
  
  console.log('❌ Ningún POST /partituras funcionó');
  return {
    success: false,
    error: 'No se pudo conectar a ningún endpoint POST /partituras'
  };
};

/**
 * Test directo del endpoint de partituras
 * @returns {Promise<Object>} - Resultado del test
 */
export const testPartiturasEndpoint = async () => {
  const urls = [
    'http://10.0.2.2:8000', // Android Emulator (prioridad)
    'http://localhost:8000',
    'http://127.0.0.1:8000',
  ];
  
  console.log('🎵 Probando endpoint de partituras...');
  
  for (const url of urls) {
    try {
      console.log(`📍 Probando partituras en: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 segundos
      
      const response = await fetch(`${url}/partituras`, {
        method: 'GET',
        headers: createHeaders(),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      console.log(`📊 Respuesta de partituras en ${url}:`, {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Partituras obtenidas de ${url}:`, data);
        return {
          success: true,
          url: url,
          data: data,
          response: {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
          }
        };
      } else {
        console.log(`⚠️ ${url}/partituras respondió pero no es OK:`, response.status);
      }
    } catch (error) {
      console.log(`❌ ${url}/partituras falló:`, error.message);
      if (error.name === 'AbortError') {
        console.log(`⏰ ${url}/partituras timeout después de 8 segundos`);
      }
    }
  }
  
  console.log('❌ Ningún endpoint de partituras funcionó');
  return {
    success: false,
    error: 'No se pudo conectar a ningún endpoint de partituras'
  };
};

/**
 * Configurar la URL base del backend
 * @param {string} url - Nueva URL base
 */
export const setBaseURL = (url) => {
  // Actualizar la URL base global
  BASE_URL = url;
};

export default {
  // Partituras
  uploadPartitura,
  getPartituras,
  getPartituraDetails,
  getPartituraPredicciones,
  deletePartitura,
  getTTSAudio,
  
  // Práctica
  startPractice,
  getNextCompas,
  getPrevCompas,
  repeatCompas,
  
  // Utilidades
  checkBackendHealth,
  setBaseURL,
};
