import { getBaseURL, getAuthHeaders } from '../config/api.config';
import { getAuthToken, getAccessToken, getValidToken } from '../auth/cognitoAuth';
import { clearAuthStorage } from '../auth/secureStorage';

const BASE_URL = getBaseURL();
const TIMEOUT = 30000;

// ===== HELPERS INTERNOS =====

/**
 * Crea headers con autenticación
 * Intenta obtener el token de forma segura con fallbacks
 */
const createHeaders = async (customHeaders = {}, options = {}) => {
  let token = null;
  
  try {
    // 1. Intentar obtener un token válido (con refresh automático si es necesario)
    token = await getValidToken();
    
    // 2. Si no hay token válido, intentar obtener access token directo
    if (!token) {
      token = await getAccessToken();
    }
    
    // 3. Si aún no hay token, intentar ID token
    if (!token) {
      token = await getAuthToken();
    }
  } catch (error) {
    console.error('Error obteniendo token:', error);
  }
  
  const baseHeaders = getAuthHeaders();
  
  if (options.excludeContentType) {
    delete baseHeaders['Content-Type'];
  }
  
  const headers = {
    ...baseHeaders,
    ...customHeaders,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

/**
 * Maneja las respuestas de la API
 */
const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = 'Error en la solicitud';
    
    try {
      const errorData = await response.json();
      
      // Manejar errores específicos sin exponer detalles técnicos
      if (response.status === 401) {
        errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
      } else if (response.status === 403) {
        errorMessage = 'No tienes permisos para realizar esta acción.';
      } else if (response.status === 404) {
        errorMessage = 'Recurso no encontrado.';
      } else if (response.status === 429) {
        errorMessage = 'Demasiadas solicitudes. Por favor, intenta más tarde.';
      } else if (response.status >= 500) {
        errorMessage = 'Error del servidor. Por favor, intenta más tarde.';
      } else {
        errorMessage = errorData.message || errorData.detail || errorMessage;
      }
    } catch (e) {
      // Si no se puede parsear, usar mensaje por defecto según status
      if (response.status === 401) {
        errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
      }
    }
    
    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }
  
  return response;
};

/**
 * Fetch con timeout
 */
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
      throw new Error('La solicitud tardó demasiado tiempo. Verifica tu conexión.');
    }
    throw error;
  }
};

// ===== ENDPOINTS DE AUTENTICACIÓN =====

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
  return { 
    signIn, 
    signUp, 
    signOut, 
    getCurrentUser: getCurrentUserFn, 
    fetchAuthSession, 
    signInWithRedirect 
  };
};

/**
 * Login con email y contraseña
 */
export const login = async (email, password) => {
  try {
    const { signIn, signOut, getCurrentUser } = await getAuthFunctions();
    
    // Limpiar sesión existente si hay alguna
    try {
      const existingUser = await getCurrentUser();
      if (existingUser) {
        await signOut();
        await clearAuthStorage();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (e) {
      await clearAuthStorage();
    }
    
    // Iniciar sesión
    const { isSignedIn } = await signIn({ 
      username: email, 
      password 
    });
    
    if (!isSignedIn) {
      throw new Error('No se pudo iniciar sesión');
    }
    
    const cognitoUser = await getCurrentUser();
    return cognitoUser;
    
  } catch (error) {
    let errorMessage = 'Error al iniciar sesión';
    
    if (error.code === 'NotAuthorizedException') {
      errorMessage = 'Credenciales incorrectas';
    } else if (error.code === 'UserNotConfirmedException') {
      errorMessage = 'Usuario no confirmado. Verifica tu email.';
    } else if (error.code === 'UserNotFoundException') {
      errorMessage = 'Usuario no encontrado';
    } else if (error.code === 'TooManyRequestsException') {
      errorMessage = 'Demasiados intentos. Por favor, intenta más tarde.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    const customError = new Error(errorMessage);
    customError.code = error.code;
    throw customError;
  }
};

/**
 * Login con Google
 */
export const loginWithGoogle = async () => {
  try {
    const { signInWithRedirect, signOut, getCurrentUser } = await getAuthFunctions();
    
    // Limpiar sesión existente
    try {
      const existingUser = await getCurrentUser();
      if (existingUser) {
        await clearAuthStorage();
        
        try {
          await signOut();
        } catch (signOutError) {
          console.warn('Error cerrando sesión previa:', signOutError);
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (e) {
      // No hay usuario autenticado
    }
    
    await signInWithRedirect({ provider: 'Google' });
    
  } catch (error) {
    let errorMessage = 'Error al iniciar sesión con Google';
    
    if (error.code === 'UserAlreadyAuthenticatedException') {
      try {
        const { signOut } = await getAuthFunctions();
        await signOut();
        await clearAuthStorage();
        await new Promise(resolve => setTimeout(resolve, 1000));
        const { signInWithRedirect } = await getAuthFunctions();
        await signInWithRedirect({ provider: 'Google' });
        return;
      } catch (retryError) {
        errorMessage = 'No se pudo cerrar la sesión previa. Por favor, intenta nuevamente.';
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
 * Registro de usuario
 */
export const register = async (email, password, name = null) => {
  try {
    const { signUp } = await getAuthFunctions();
    
    const attributes = { email };
    if (name) {
      attributes.name = name;
    }
    
    const { userId } = await signUp({
      username: email,
      password,
      options: {
        userAttributes: attributes,
      },
    });
    
    return {
      success: true,
      userId,
      message: 'Usuario registrado. Verifica tu email para confirmar la cuenta.',
    };
  } catch (error) {
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
 * Cerrar sesión
 */
export const logout = async () => {
  try {
    const { signOut } = await getAuthFunctions();
    await signOut();
    await clearAuthStorage();
  } catch (error) {
    try {
      await clearAuthStorage();
    } catch (e) {
      console.error('Error limpiando almacenamiento:', e);
    }
    throw error;
  }
};

/**
 * Obtener usuario actual
 */
export const getCurrentUser = async () => {
  try {
    const { getCurrentUser: getCurrentUserFn } = await getAuthFunctions();
    const user = await getCurrentUserFn();
    return user;
  } catch (error) {
    if (error.name === 'NotAuthorizedException' || 
        error.message?.includes('not authenticated')) {
      return null;
    }
    throw error;
  }
};

/**
 * Refrescar token
 */
export const refreshToken = async () => {
  try {
    const { fetchAuthSession } = await getAuthFunctions();
    const session = await fetchAuthSession({ forceRefresh: true });
    
    if (!session.tokens || !session.tokens.idToken) {
      throw new Error('No se pudo refrescar la sesión');
    }
    
    const idToken = session.tokens.idToken.toString();
    return idToken;
  } catch (error) {
    throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
  }
};

// ===== ENDPOINTS DE PARTITURAS =====

export const uploadPartitura = async (fileData) => {
  return new Promise(async (resolve, reject) => {
    try {
      const uploadURL = `${BASE_URL}/partituras`;
      
      const headers = await createHeaders(
        { 'Accept': 'application/json' },
        { excludeContentType: true }
      );
      
      const formData = new FormData();
      formData.append('file', {
        uri: fileData.uri,
        type: fileData.mimeType,
        name: fileData.name,
      });
      
      const response = await fetchWithTimeout(uploadURL, {
        method: 'POST',
        body: formData,
        headers: headers,
      });
      
      await handleResponse(response);
      const result = await response.json();
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
};

export const getPartituras = async () => {
  try {
    const headers = await createHeaders();
    const response = await fetchWithTimeout(`${BASE_URL}/partituras`, {
      method: 'GET',
      headers: headers,
    });
    
    await handleResponse(response);
    return await response.json();
  } catch (error) {
    throw error;
  }
};

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
    throw error;
  }
};

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
    throw error;
  }
};

export const deletePartitura = async (partituraId) => {
  try {
    const headers = await createHeaders();
    const response = await fetchWithTimeout(`${BASE_URL}/partituras/${partituraId}`, {
      method: 'DELETE',
      headers: headers,
    });
    
    await handleResponse(response);
    return await response.json();
  } catch (error) {
    throw error;
  }
};

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
    throw error;
  }
};

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
    throw error;
  }
};

export const getCompasesResumen = async (partituraId) => {
  try {
    const headers = await createHeaders();
    const response = await fetchWithTimeout(`${BASE_URL}/partituras/${partituraId}/compases/resumen`, {
      method: 'GET',
      headers: headers,
    });
    
    await handleResponse(response);
    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const getTimeline = async (partituraId, compas) => {
  try {
    const headers = await createHeaders();
    const response = await fetchWithTimeout(`${BASE_URL}/partituras/${partituraId}/practice/${compas}/timeline`, {
      method: 'GET',
      headers: headers,
    });
    
    await handleResponse(response);
    return await response.json();
  } catch (error) {
    throw error;
  }
};

// ===== ENDPOINTS DE PRÁCTICA =====

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
    throw error;
  }
};

export const getNextCompas = async (partituraId) => {
  try {
    const headers = await createHeaders();
    const response = await fetchWithTimeout(`${BASE_URL}/practice/${partituraId}/next`, {
      method: 'GET',
      headers: headers,
    });
    
    await handleResponse(response);
    return await response.json();
  } catch (error) {
    throw error;
  }
};

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
    throw error;
  }
};

export const repeatCompas = async (partituraId) => {
  try {
    const headers = await createHeaders();
    const response = await fetchWithTimeout(`${BASE_URL}/practice/${partituraId}/repeat`, {
      method: 'GET',
      headers: headers,
    });
    
    await handleResponse(response);
    return await response.json();
  } catch (error) {
    throw error;
  }
};

// ===== ENDPOINTS DE CONFIGURACIÓN DE USUARIO =====

export const getUserConfig = async () => {
  try {
    const headers = await createHeaders();
    const response = await fetchWithTimeout(`${BASE_URL}/users/me/config`, {
      method: 'GET',
      headers: headers,
    });
    
    await handleResponse(response);
    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const saveUserConfig = async (config) => {
  try {
    const headers = await createHeaders();
    const response = await fetchWithTimeout(`${BASE_URL}/users/me/config`, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify(config),
    });
    
    await handleResponse(response);
    return await response.json();
  } catch (error) {
    throw error;
  }
};

// ===== UTILIDADES =====

export const checkBackendHealth = async () => {
  try {
    const headers = await createHeaders();
    const response = await fetchWithTimeout(`${BASE_URL}/health`, {
      method: 'GET',
      headers: headers,
    });
    
    return response.ok;
  } catch (error) {
    return false;
  }
};

export const setBaseURL = (url) => {
  BASE_URL = url;
};

export default {
  login,
  loginWithGoogle,
  register,
  logout,
  getCurrentUser,
  refreshToken,
  uploadPartitura,
  getPartituras,
  getPartituraDetails,
  getPartituraPredicciones,
  deletePartitura,
  getTTSAudio,
  getPianoAudio,
  startPractice,
  getNextCompas,
  getPrevCompas,
  repeatCompas,
  getUserConfig,
  saveUserConfig,
  checkBackendHealth,
  setBaseURL,
};
