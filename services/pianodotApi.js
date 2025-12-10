// Servicio API centralizado para PianoDot usando fetch
import { getBaseURL, getAuthHeaders } from '../config/api.config';
import { getAuthToken, getAuthTokenSync, getAccessToken } from '../auth/cognitoAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = getBaseURL();
const TIMEOUT = 10000;
const TOKEN_KEY = '@pianodot:id_token';

// ===== HELPERS INTERNOS =====

const createHeaders = async (customHeaders = {}, options = {}) => {
  let token = null;
  try {
    token = await getAccessToken();
    
    if (!token) {
      token = await getAuthToken();
      
      if (!token) {
        token = await AsyncStorage.getItem(TOKEN_KEY);
        if (!token) {
          token = getAuthTokenSync();
        }
      }
    }
  } catch (error) {
    token = getAuthTokenSync();
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

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = `Error ${response.status}: ${response.statusText}`;
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.detail || errorMessage;
    } catch (e) {
      // Usar mensaje por defecto
    }
    
    const error = new Error(errorMessage);
    error.status = response.status;
    error.statusText = response.statusText;
    throw error;
  }
  
  return response;
};

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
      
      const response = await fetch(uploadURL, {
        method: 'POST',
        body: formData,
        headers: headers,
      });
      
      if (response.ok) {
        const result = await response.json();
        resolve(result);
      } else {
        const errorText = await response.text();
        reject(new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`));
      }
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
  return { signIn, signUp, signOut, getCurrentUser: getCurrentUserFn, fetchAuthSession, signInWithRedirect };
};

const clearAuthStorage = async () => {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  await Promise.all([
    AsyncStorage.removeItem('@pianodot:id_token'),
    AsyncStorage.removeItem('@pianodot:access_token'),
    AsyncStorage.removeItem('@pianodot:refresh_token'),
    AsyncStorage.removeItem('@pianodot:user'),
  ]);
};

export const login = async (email, password) => {
  try {
    const { signIn, signOut, getCurrentUser } = await getAuthFunctions();
    
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
    
    const { isSignedIn } = await signIn({ username: email, password });
    
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
    } else if (error.code === 'UserAlreadyAuthenticatedException') {
      try {
        await signOut();
        await clearAuthStorage();
        await new Promise(resolve => setTimeout(resolve, 1500));
        const { isSignedIn } = await signIn({ username: email, password });
        if (isSignedIn) {
          const cognitoUser = await getCurrentUser();
          return cognitoUser;
        }
        throw new Error('No se pudo iniciar sesión después de limpiar');
      } catch (e) {
        errorMessage = 'Error al limpiar sesión previa. Por favor, cierra sesión manualmente e intenta nuevamente.';
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

export const loginWithGoogle = async () => {
  try {
    const { signInWithRedirect, signOut, getCurrentUser } = await getAuthFunctions();
    
    try {
      const existingUser = await getCurrentUser();
      if (existingUser) {
        await clearAuthStorage();
        
        try {
          await signOut();
        } catch (signOutError) {
          // Continuar de todas formas
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (e) {
      // No hay usuario autenticado, continuar
    }
    
    await signInWithRedirect({ provider: 'Google' });
  } catch (error) {
    let errorMessage = 'Error al iniciar sesión con Google';
    
    if (error.code === 'UserAlreadyAuthenticatedException') {
      try {
        const { signOut } = await getAuthFunctions();
        await signOut();
        await clearAuthStorage();
        await new Promise(resolve => setTimeout(resolve, 1500));
        const { signInWithRedirect } = await getAuthFunctions();
        await signInWithRedirect({ provider: 'Google' });
        return;
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

export const logout = async () => {
  try {
    const { signOut } = await getAuthFunctions();
    await signOut();
    await clearAuthStorage();
  } catch (error) {
    try {
      await clearAuthStorage();
    } catch (e) {
      // Error limpiando AsyncStorage
    }
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const { getCurrentUser: getCurrentUserFn } = await getAuthFunctions();
    const user = await getCurrentUserFn();
    return user;
  } catch (error) {
    if (error.name === 'NotAuthorizedException' || error.message?.includes('not authenticated')) {
      return null;
    }
    throw error;
  }
};

export const refreshToken = async () => {
  try {
    const { fetchAuthSession } = await getAuthFunctions();
    const session = await fetchAuthSession();
    const idToken = session.tokens.idToken.toString();
    return idToken;
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