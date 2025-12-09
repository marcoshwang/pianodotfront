// Servicio API centralizado para PianoDot usando fetch
import { getBaseURL, getAuthHeaders } from '../config/api.config';
import { getAuthToken, getAuthTokenSync, getAccessToken } from '../utils/mockAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuración base
const BASE_URL = getBaseURL();
const TIMEOUT = 10000;
// Usar la misma clave que mockAuth.js para consistencia
const TOKEN_KEY = '@pianodot:id_token';

// Función helper para crear headers con autenticación (versión async)
const createHeaders = async (customHeaders = {}, options = {}) => {
  let token = null;
  try {
    // IMPORTANTE: Para OAuth (Google login), el backend requiere access_token
    // porque valida el at_hash claim. Intentar primero con access_token.
    // Si no está disponible, usar idToken como fallback.
    
    // Primero intentar obtener access_token (necesario para validación de at_hash)
    token = await getAccessToken();
    
    if (!token) {
      // Si no hay access_token, usar idToken como fallback
      console.log('ℹ️ No hay access_token disponible, usando idToken...');
      token = await getAuthToken();
      
      if (!token) {
        // Fallback: intentar obtener directamente desde AsyncStorage
        token = await AsyncStorage.getItem(TOKEN_KEY);
        if (!token) {
          // Último fallback a versión sync
          token = getAuthTokenSync();
        }
      }
    } else {
      console.log('✅ Usando access_token para autenticación (requerido para at_hash validation)');
    }
    
    // Log del token obtenido para debugging
    if (token) {
      console.log('✅ Token obtenido correctamente');
      console.log('🔑 Token (primeros 50 chars):', token.substring(0, 50));
      console.log('🔑 Token length:', token.length);
      // Verificar que sea un JWT válido (debe empezar con "eyJ")
      if (token.startsWith('eyJ')) {
        console.log('✅ Token parece ser un JWT válido');
      } else {
        console.warn('⚠️ Token no parece ser un JWT válido');
      }
    } else {
      console.warn('⚠️ NO SE PUDO OBTENER TOKEN');
    }
  } catch (error) {
    console.error('❌ Error obteniendo token:', error);
    // Fallback a versión sync
    token = getAuthTokenSync();
  }
  
  // Obtener headers base
  const baseHeaders = getAuthHeaders();
  
  // Si se especifica excludeContentType, eliminar Content-Type (útil para FormData)
  if (options.excludeContentType) {
    delete baseHeaders['Content-Type'];
    console.log('ℹ️ Content-Type excluido (para FormData)');
  }
  
  const headers = {
    ...baseHeaders,
    ...customHeaders,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('✅ Header Authorization agregado');
  } else {
    console.warn('⚠️ NO SE AGREGÓ HEADER Authorization - El request puede fallar con 403');
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
      
      // Usar la URL base centralizada
      const uploadURL = `${BASE_URL}/partituras`;
      console.log('Haciendo POST a:', uploadURL);
      
      // Obtener headers con autenticación
      // IMPORTANTE: excludeContentType=true para FormData (fetch lo establece automáticamente)
      const headers = await createHeaders(
        {
          'Accept': 'application/json',
        },
        {
          excludeContentType: true, // Excluir Content-Type para que fetch lo establezca automáticamente
        }
      );
      
      // Log del token para debugging (solo primeros caracteres por seguridad)
      if (headers['Authorization']) {
        const tokenPreview = headers['Authorization'].substring(0, 30) + '...';
        console.log('🔑 Token enviado (preview):', tokenPreview);
        console.log('🔑 Token completo (primeros 50 chars):', headers['Authorization'].substring(7, 57));
      } else {
        console.warn('⚠️ NO HAY TOKEN EN LOS HEADERS!');
      }
      
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
      console.log('📋 Headers completos:', JSON.stringify(headers, null, 2));
      
      const response = await fetch(uploadURL, {
        method: 'POST',
        body: formData,
        headers: headers,
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
    const headers = await createHeaders();
    console.log('Headers:', headers);
    
    const response = await fetchWithTimeout(`${BASE_URL}/partituras`, {
      method: 'GET',
      headers: headers,
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
    const headers = await createHeaders();
    const response = await fetchWithTimeout(`${BASE_URL}/partituras/${partituraId}`, {
      method: 'GET',
      headers: headers,
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
    const headers = await createHeaders();
    const response = await fetchWithTimeout(`${BASE_URL}/partituras/${partituraId}/predicciones`, {
      method: 'GET',
      headers: headers,
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
    const headers = await createHeaders();
    console.log('🗑️ Headers:', headers);
    
    const response = await fetchWithTimeout(`${BASE_URL}/partituras/${partituraId}`, {
      method: 'DELETE',
      headers: headers,
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
    const headers = await createHeaders();
    const response = await fetchWithTimeout(`${BASE_URL}/partituras/${partituraId}/tts/${compas}`, {
      method: 'GET',
      headers: headers,
    });
    
    await handleResponse(response);
    return await response.blob();
  } catch (error) {
    console.error('Error obteniendo audio TTS:', error);
    throw error;
  }
};

/**
 * Obtener audio de piano para un compás específico
 * @param {string} partituraId - ID de la partitura
 * @param {number} compas - Número del compás
 * @returns {Promise<Blob>} - Audio en formato blob
 */
export const getPianoAudio = async (partituraId, compas) => {
  try {
    const baseHeaders = await createHeaders();
    const response = await fetchWithTimeout(`${BASE_URL}/partituras/${partituraId}/audio_piano/${compas}`, {
      method: 'GET',
      headers: {
        ...baseHeaders,
        'Accept': 'audio/mpeg',
        'Content-Type': 'audio/mpeg',
      },
    });
    
    await handleResponse(response);
    return await response.blob();
  } catch (error) {
    console.error('Error obteniendo audio piano:', error);
    throw error;
  }
};

// ===== ENDPOINTS DE AUTENTICACIÓN =====
// Usando AWS Cognito para autenticación

// Importar funciones de Auth de forma lazy
let signIn, signUp, signOut, getCurrentUserFn, fetchAuthSession, signInWithRedirect;

const getAuthFunctions = async () => {
  if (!signIn) {
    const authModule = await import('aws-amplify/auth');
    signIn = authModule.signIn;
    signUp = authModule.signUp;
    signOut = authModule.signOut;
    getCurrentUserFn = authModule.getCurrentUser;
    fetchAuthSession = authModule.fetchAuthSession;
    signInWithRedirect = authModule.signInWithRedirect;
  }
  return { signIn, signUp, signOut, getCurrentUser: getCurrentUserFn, fetchAuthSession, signInWithRedirect };
};

/**
 * Iniciar sesión de usuario con AWS Cognito
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña del usuario
 * @returns {Promise<Object>} - Usuario de Cognito con tokens
 */
export const login = async (email, password) => {
  try {
    console.log('🔐 Iniciando sesión con Cognito...');
    
    const { signIn, signOut, getCurrentUser } = await getAuthFunctions();
    
    // Siempre cerrar cualquier sesión previa antes de hacer login
    try {
      const existingUser = await getCurrentUser();
      if (existingUser) {
        console.log('⚠️ Detectada sesión previa, cerrando sesión completamente...');
        await signOut();
        // Limpiar también AsyncStorage
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await Promise.all([
          AsyncStorage.removeItem('@pianodot:id_token'),
          AsyncStorage.removeItem('@pianodot:refresh_token'),
          AsyncStorage.removeItem('@pianodot:user'),
        ]);
        console.log('✅ Sesión anterior cerrada completamente');
        // Esperar un momento para que Cognito procese el cierre
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (e) {
      // No hay usuario autenticado, pero limpiar AsyncStorage por si acaso
      console.log('ℹ️ No hay sesión de Cognito, limpiando AsyncStorage...');
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await Promise.all([
          AsyncStorage.removeItem('@pianodot:id_token'),
          AsyncStorage.removeItem('@pianodot:refresh_token'),
          AsyncStorage.removeItem('@pianodot:user'),
        ]);
      } catch (clearError) {
        console.log('⚠️ Error limpiando AsyncStorage:', clearError);
      }
    }
    
    // Autenticar con Cognito usando el método estándar de Amplify
    const { isSignedIn } = await signIn({ username: email, password });
    
    if (!isSignedIn) {
      throw new Error('No se pudo iniciar sesión');
    }
    
    // Obtener el usuario autenticado
    const cognitoUser = await getCurrentUser();
    
    console.log('✅ Login exitoso con Cognito');
    return cognitoUser;
  } catch (error) {
    console.error('❌ Error en login:', error);
    
    // Mejorar mensajes de error
    let errorMessage = 'Error al iniciar sesión';
    if (error.code === 'NotAuthorizedException') {
      errorMessage = 'Credenciales incorrectas';
    } else if (error.code === 'UserNotConfirmedException') {
      errorMessage = 'Usuario no confirmado. Verifica tu email.';
    } else if (error.code === 'UserNotFoundException') {
      errorMessage = 'Usuario no encontrado';
    } else if (error.code === 'UserAlreadyAuthenticatedException') {
      // Si aún está autenticado después de intentar cerrar, forzar cierre y reintentar
      console.log('⚠️ Usuario aún autenticado después de cerrar, forzando limpieza...');
      try {
        await signOut();
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await Promise.all([
          AsyncStorage.removeItem('@pianodot:id_token'),
          AsyncStorage.removeItem('@pianodot:refresh_token'),
          AsyncStorage.removeItem('@pianodot:user'),
        ]);
        await new Promise(resolve => setTimeout(resolve, 1500));
        // Reintentar login después de limpiar
        console.log('🔄 Reintentando login después de limpiar sesión...');
        const { isSignedIn } = await signIn({ username: email, password });
        if (isSignedIn) {
          const cognitoUser = await getCurrentUser();
          return cognitoUser;
        }
        throw new Error('No se pudo iniciar sesión después de limpiar');
      } catch (e) {
        errorMessage = 'Error al limpiar sesión previa. Por favor, cierra sesión manualmente e intenta nuevamente.';
        console.error('❌ Error en reintento:', e);
      }
    } else if (error.code === 'InvalidParameterException') {
      errorMessage = error.message || 'Error en la configuración de autenticación';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    const customError = new Error(errorMessage);
    customError.code = error.code;
    throw customError;
  }
};

/**
 * Iniciar sesión con Google usando Cognito Federated Identity
 * @returns {Promise<void>}
 */
export const loginWithGoogle = async () => {
  try {
    console.log('🔐 Iniciando sesión con Google...');
    
    const { signInWithRedirect, signOut, getCurrentUser } = await getAuthFunctions();
    
    // Cerrar cualquier sesión previa antes de iniciar con Google
    try {
      const existingUser = await getCurrentUser();
      if (existingUser) {
        console.log('⚠️ Detectada sesión previa, cerrando sesión antes de iniciar con Google...');
        
        // Limpiar AsyncStorage primero
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await Promise.all([
          AsyncStorage.removeItem('@pianodot:id_token'),
          AsyncStorage.removeItem('@pianodot:access_token'),
          AsyncStorage.removeItem('@pianodot:refresh_token'),
          AsyncStorage.removeItem('@pianodot:user'),
        ]);
        
        // Cerrar sesión de Cognito
        try {
          await signOut();
          console.log('✅ Sesión de Cognito cerrada');
        } catch (signOutError) {
          console.warn('⚠️ Error cerrando sesión de Cognito:', signOutError.message);
          // Continuar de todas formas
        }
        
        // Esperar un momento para que Cognito procese el cierre
        console.log('⏳ Esperando que se procese el cierre de sesión...');
        await new Promise(resolve => setTimeout(resolve, 500)); // Reducido a 500ms
      }
    } catch (e) {
      // No hay usuario autenticado, continuar
      console.log('ℹ️ No hay sesión previa, continuando con Google...');
    }
    
    // Iniciar el flujo de autenticación con Google
    console.log('🚀 Iniciando redirect a Google...');
    await signInWithRedirect({
      provider: 'Google',
    });
    
    console.log('✅ Redirección a Google iniciada');
  } catch (error) {
    console.error('❌ Error iniciando sesión con Google:', error);
    
    let errorMessage = 'Error al iniciar sesión con Google';
    if (error.code === 'UserAlreadyAuthenticatedException') {
      // Si aún está autenticado después de intentar cerrar, forzar cierre y reintentar
      console.log('⚠️ Usuario aún autenticado, forzando cierre...');
      try {
        const { signOut } = await getAuthFunctions();
        await signOut();
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await Promise.all([
          AsyncStorage.removeItem('@pianodot:id_token'),
          AsyncStorage.removeItem('@pianodot:refresh_token'),
          AsyncStorage.removeItem('@pianodot:user'),
        ]);
        await new Promise(resolve => setTimeout(resolve, 1500));
        // Reintentar después de limpiar
        console.log('🔄 Reintentando login con Google después de limpiar...');
        const { signInWithRedirect } = await getAuthFunctions();
        await signInWithRedirect({
          provider: 'Google',
        });
        return; // Salir exitosamente
      } catch (retryError) {
        errorMessage = 'No se pudo cerrar la sesión previa. Por favor, cierra sesión manualmente e intenta nuevamente.';
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    const customError = new Error(errorMessage);
    customError.code = error.code;
    throw customError;
  }
};

/**
 * Registrar nuevo usuario con AWS Cognito
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña del usuario
 * @param {string} name - Nombre del usuario (opcional)
 * @returns {Promise<Object>} - Resultado del registro
 */
export const register = async (email, password, name = null) => {
  try {
    console.log('📝 Registrando usuario con Cognito...');
    
    const { signUp } = await getAuthFunctions();
    
    // Atributos del usuario
    const attributes = {
      email,
    };
    
    if (name) {
      attributes.name = name;
    }
    
    // Registrar usuario en Cognito
    const { userId } = await signUp({
      username: email,
      password,
      options: {
        userAttributes: attributes,
      },
    });
    
    console.log('✅ Registro exitoso con Cognito');
    return {
      success: true,
      userId,
      message: 'Usuario registrado. Verifica tu email para confirmar la cuenta.',
    };
  } catch (error) {
    console.error('❌ Error en registro:', error);
    
    // Mejorar mensajes de error
    let errorMessage = 'Error al registrar usuario';
    if (error.code === 'UsernameExistsException') {
      errorMessage = 'Este email ya está registrado';
    } else if (error.code === 'InvalidPasswordException') {
      errorMessage = 'La contraseña no cumple los requisitos';
    } else if (error.code === 'InvalidParameterException') {
      errorMessage = 'Email inválido';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    const customError = new Error(errorMessage);
    customError.code = error.code;
    throw customError;
  }
};

/**
 * Cerrar sesión con AWS Cognito
 * @returns {Promise<void>}
 */
export const logout = async () => {
  try {
    console.log('🚪 Cerrando sesión de Cognito...');
    const { signOut } = await getAuthFunctions();
    
    // Cerrar sesión de Cognito
    await signOut();
    
    // Limpiar AsyncStorage también
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await Promise.all([
      AsyncStorage.removeItem('@pianodot:id_token'),
      AsyncStorage.removeItem('@pianodot:refresh_token'),
      AsyncStorage.removeItem('@pianodot:user'),
    ]);
    
    console.log('✅ Sesión cerrada exitosamente');
  } catch (error) {
    console.error('❌ Error en logout:', error);
    // Intentar limpiar AsyncStorage aunque falle Cognito
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await Promise.all([
        AsyncStorage.removeItem('@pianodot:id_token'),
        AsyncStorage.removeItem('@pianodot:refresh_token'),
        AsyncStorage.removeItem('@pianodot:user'),
      ]);
    } catch (e) {
      console.error('❌ Error limpiando AsyncStorage:', e);
    }
    throw error;
  }
};

/**
 * Obtener información del usuario actual de Cognito
 * @returns {Promise<Object>} - Datos del usuario
 */
export const getCurrentUser = async () => {
  try {
    const { getCurrentUser: getCurrentUserFn } = await getAuthFunctions();
    const user = await getCurrentUserFn();
    return user;
  } catch (error) {
    console.error('❌ Error obteniendo usuario actual:', error);
    // Si no hay usuario autenticado, retornar null en lugar de lanzar error
    if (error.name === 'NotAuthorizedException' || error.message?.includes('not authenticated')) {
      return null;
    }
    throw error;
  }
};

/**
 * Refrescar token de autenticación con Cognito
 * @returns {Promise<string>} - Nuevo IdToken
 */
export const refreshToken = async () => {
  try {
    console.log('🔄 Refrescando token de Cognito...');
    const { fetchAuthSession } = await getAuthFunctions();
    const session = await fetchAuthSession();
    const idToken = session.tokens.idToken.toString();
    console.log('✅ Token refrescado');
    return idToken;
  } catch (error) {
    console.error('❌ Error refrescando token:', error);
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
    const headers = await createHeaders();
    const response = await fetchWithTimeout(`${BASE_URL}/practice/${partituraId}/start`, {
      method: 'POST',
      headers: headers,
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
    console.log('⏭️ Llamando a next compás para partitura:', partituraId);
    const url = `${BASE_URL}/practice/${partituraId}/next`;
    console.log('🔗 URL:', url);
    
    const headers = await createHeaders();
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: headers,
    });
    
    console.log('📡 Respuesta del servidor:', response.status);
    await handleResponse(response);
    const result = await response.json();
    console.log('✅ Siguiente compás obtenido exitosamente:', result);
    return result;
  } catch (error) {
    console.error('❌ Error obteniendo siguiente compás:', error);
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
    const headers = await createHeaders();
    const response = await fetchWithTimeout(`${BASE_URL}/practice/${partituraId}/prev`, {
      method: 'GET',
      headers: headers,
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
    console.log(`🔄 Llamando a repeat compás para partitura: ${partituraId}`);
    const url = `${BASE_URL}/practice/${partituraId}/repeat`;
    console.log(`🔗 URL: ${url}`);
    
    const headers = await createHeaders();
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: headers,
    });
    
    console.log(`📡 Respuesta del servidor: ${response.status}`);
    await handleResponse(response);
    const result = await response.json();
    console.log('✅ Compás repetido exitosamente:', result);
    return result;
  } catch (error) {
    console.error('❌ Error repitiendo compás:', error);
    throw error;
  }
};


/**
 * Obtener resumen de compases visitados de una partitura
 * @param {string} partituraId - ID de la partitura
 * @returns {Promise<Object>} - Resumen con compases visitados y total
 */
export const getCompasesResumen = async (partituraId) => {
  try {
    console.log('📊 Obteniendo resumen de compases para:', partituraId);
    const headers = await createHeaders();
    const response = await fetchWithTimeout(`${BASE_URL}/partituras/${partituraId}/compases/resumen`, {
      method: 'GET',
      headers: headers,
    });
    
    await handleResponse(response);
    const data = await response.json();
    console.log('✅ Resumen obtenido:', data);
    return data;
  } catch (error) {
    console.error('❌ Error obteniendo resumen de compases:', error);
    throw error;
  }
};

/**
 * Obtener timeline de práctica para un compás específico
 * @param {string} partituraId - ID de la partitura
 * @param {number} compas - Número del compás
 * @returns {Promise<Object>} - Timeline con eventos del compás
 */
export const getTimeline = async (partituraId, compas) => {
  try {
    console.log('📅 Obteniendo timeline para partitura:', partituraId, 'compás:', compas);
    const url = `${BASE_URL}/partituras/${partituraId}/practice/${compas}/timeline`;
    console.log('🌐 URL del endpoint:', url);
    
    const headers = await createHeaders();
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: headers,
    });
    
    console.log('📊 Respuesta del servidor (GET timeline):', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    await handleResponse(response);
    const data = await response.json();
    
    console.log('✅ RESPUESTA COMPLETA DEL ENDPOINT GET /partituras/{partitura_id}/practice/{compas}/timeline:');
    console.log(JSON.stringify(data, null, 2));
    console.log('📊 Número de eventos en timeline:', data?.timeline?.length || 0);
    
    return data;
  } catch (error) {
    console.error('❌ Error obteniendo timeline:', error);
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
    const headers = await createHeaders();
    const response = await fetchWithTimeout(`${BASE_URL}/health`, {
      method: 'GET',
      headers: headers,
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
    
    const headers = await createHeaders();
    const response = await fetchWithTimeout(`${BASE_URL}/`, {
      method: 'GET',
      headers: headers,
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
      const headers = await createHeaders();
      
      const response = await fetch(`${url}/`, {
        method: 'GET',
        headers: headers,
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
    const headers = await createHeaders();
    
    const response = await fetch(uploadURL, {
      method: 'POST',
      body: testFormData,
      headers: headers,
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
      const headers = await createHeaders();
      
      const response = await fetch(`${url}/partituras`, {
        method: 'GET',
        headers: headers,
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

// ===== ENDPOINTS DE CONFIGURACIÓN DE USUARIO =====

/**
 * Obtener configuración del usuario actual
 * @returns {Promise<Object>} - Configuración del usuario
 */
export const getUserConfig = async () => {
  try {
    console.log('📥 Haciendo GET a /users/me/config...');
    const headers = await createHeaders();
    const url = `${BASE_URL}/users/me/config`;
    console.log('🌐 URL del endpoint:', url);
    
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: headers,
    });
    
    console.log('📊 Respuesta del servidor (GET /users/me/config):', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    await handleResponse(response);
    const config = await response.json();
    console.log('✅ Configuración del usuario obtenida (GET /users/me/config):', config);
    return config;
  } catch (error) {
    console.error('❌ Error obteniendo configuración del usuario (GET /users/me/config):', error);
    throw error;
  }
};

/**
 * Guardar configuración del usuario actual
 * @param {Object} config - Configuración a guardar
 * @param {string} config.font_size - Tamaño de fuente: 'normal', 'grande', 'extraGrande'
 * @param {string} config.tema_preferido - Tema preferido: 'whiteBlack', 'blackYellow', 'blackBlue', 'blackGreen', 'blackWhite'
 * @param {boolean} config.vibracion - Vibración activada: true, false
 * @returns {Promise<Object>} - Configuración guardada
 */
export const saveUserConfig = async (config) => {
  try {
    console.log('💾 Iniciando guardado de configuración en backend...');
    console.log('📋 Configuración a guardar:', JSON.stringify(config, null, 2));
    
    const headers = await createHeaders();
    console.log('📋 Headers preparados:', {
      'Content-Type': headers['Content-Type'],
      'Authorization': headers['Authorization'] ? 'Bearer ***' : 'NO HAY TOKEN'
    });
    
    const url = `${BASE_URL}/users/me/config`;
    console.log('🌐 URL del endpoint:', url);
    
    // El endpoint espera PATCH según la documentación
    const response = await fetchWithTimeout(url, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify(config),
    });
    
    console.log('📊 Respuesta del servidor:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    await handleResponse(response);
    const savedConfig = await response.json();
    console.log('✅ Configuración del usuario guardada exitosamente:', savedConfig);
    return savedConfig;
  } catch (error) {
    console.error('❌ Error guardando configuración del usuario:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    throw error;
  }
};

export default {
  // Autenticación
  login,
  loginWithGoogle,
  register,
  logout,
  getCurrentUser,
  refreshToken,
  
  // Partituras
  uploadPartitura,
  getPartituras,
  getPartituraDetails,
  getPartituraPredicciones,
  deletePartitura,
  getTTSAudio,
  getPianoAudio,
  
  // Práctica
  startPractice,
  getNextCompas,
  getPrevCompas,
  repeatCompas,
  
  // Configuración de usuario
  getUserConfig,
  saveUserConfig,
  
  // Utilidades
  checkBackendHealth,
  setBaseURL,
};
