// Sistema de autenticación para PianoDot con AWS Cognito
// Usa AsyncStorage para persistir el token y datos del usuario
import AsyncStorage from '@react-native-async-storage/async-storage';

// Importar funciones de Auth de forma lazy para evitar problemas de inicialización
let signIn, signUp, signOut, currentAuthenticatedUser, currentSession;

const getAuthFunctions = async () => {
  if (!signIn) {
    const authModule = await import('aws-amplify/auth');
    signIn = authModule.signIn;
    signUp = authModule.signUp;
    signOut = authModule.signOut;
    currentAuthenticatedUser = authModule.currentAuthenticatedUser;
    currentSession = authModule.currentSession;
  }
  return { signIn, signUp, signOut, currentAuthenticatedUser, currentSession };
};

// Claves para AsyncStorage
const TOKEN_KEY = '@pianodot:id_token';
const REFRESH_TOKEN_KEY = '@pianodot:refresh_token';
const USER_KEY = '@pianodot:user';

// Estado de autenticación en memoria
let isAuthenticated = false;
let currentUser = null;

/**
 * Guardar datos de autenticación después del login con Cognito
 * @param {Object} cognitoUser - Usuario de Cognito con tokens
 * @returns {Promise<void>}
 */
export const saveAuthData = async (cognitoUser) => {
  try {
    const { currentSession } = await getAuthFunctions();
    // Obtener los tokens de Cognito
    const session = await currentSession();
    const idToken = session.tokens.idToken.toString();
    const refreshToken = session.tokens.refreshToken?.toString() || null;
    
    // Guardar IdToken (este es el que se usa en Authorization header)
    await AsyncStorage.setItem(TOKEN_KEY, idToken);
    console.log('✅ IdToken guardado en AsyncStorage');
    
    // Guardar refresh token
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    console.log('✅ Refresh token guardado');
    
    // Guardar datos del usuario
    const userAttributes = cognitoUser.attributes || {};
    const userData = {
      id: cognitoUser.username,
      email: userAttributes.email,
      name: userAttributes.name || userAttributes.email,
    };
    
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
    currentUser = userData;
    console.log('✅ Usuario guardado');
    
    isAuthenticated = true;
  } catch (error) {
    console.error('❌ Error guardando datos de autenticación:', error);
    throw error;
  }
};

/**
 * Cargar datos de autenticación desde Cognito o AsyncStorage
 * @returns {Promise<boolean>} - True si hay sesión activa
 */
export const loadAuthData = async () => {
  try {
    // Primero intentar obtener sesión activa de Cognito
    try {
      const { currentAuthenticatedUser, currentSession } = await getAuthFunctions();
      const user = await currentAuthenticatedUser();
      const session = await currentSession();
      const idToken = session.tokens.idToken.toString();
      
      if (idToken && user) {
        // Guardar en AsyncStorage para acceso rápido
        await AsyncStorage.setItem(TOKEN_KEY, idToken);
        
        // Obtener datos del usuario
        const userAttributes = user.attributes || {};
        const userData = {
          id: user.username,
          email: userAttributes.email,
          name: userAttributes.name || userAttributes.email,
        };
        
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
        currentUser = userData;
        isAuthenticated = true;
        
        console.log('✅ Sesión de Cognito cargada');
        return true;
      }
    } catch (cognitoError) {
      console.log('⚠️ No hay sesión activa de Cognito');
    }
    
    // Fallback: intentar cargar desde AsyncStorage
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      const userData = await AsyncStorage.getItem(USER_KEY);
      currentUser = userData ? JSON.parse(userData) : null;
      isAuthenticated = true;
      console.log('✅ Datos de autenticación cargados desde AsyncStorage');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error cargando datos de autenticación:', error);
    return false;
  }
};

/**
 * Simular login del usuario (mantener para compatibilidad)
 * @returns {Promise<Object>} - Datos del usuario
 */
export const mockLogin = async () => {
  // Simular delay de red
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  isAuthenticated = true;
  currentUser = {
    id: 'user_123',
    email: 'usuario@ejemplo.com',
    name: 'Usuario Demo',
  };
  
  return {
    success: true,
    user: currentUser,
    token: 'mock_token_123456789',
  };
};

/**
 * Cerrar sesión y limpiar datos de autenticación
 * @returns {Promise<boolean>} - True si se cerró sesión
 */
export const mockLogout = async () => {
  try {
    // Limpiar AsyncStorage
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
    ]);
    
    isAuthenticated = false;
    currentUser = null;
    
    console.log('✅ Sesión cerrada y datos limpiados');
    return true;
  } catch (error) {
    console.error('❌ Error cerrando sesión:', error);
    // Aun así limpiar el estado en memoria
    isAuthenticated = false;
    currentUser = null;
    return false;
  }
};

/**
 * Obtener usuario actual
 * @returns {Object|null} - Usuario actual o null
 */
export const getCurrentUser = () => {
  return currentUser;
};

/**
 * Verificar si el usuario está autenticado
 * @returns {boolean} - True si está autenticado
 */
export const isUserAuthenticated = () => {
  return isAuthenticated;
};

/**
 * Obtener token de autenticación (IdToken de Cognito)
 * @returns {Promise<string|null>} - IdToken o null
 */
export const getAuthToken = async () => {
  try {
    // Primero intentar obtener desde Cognito session (más confiable)
    try {
      const { currentSession } = await getAuthFunctions();
      const session = await currentSession();
      const idToken = session.tokens.idToken.toString();
      if (idToken) {
        // Actualizar AsyncStorage con el token actual
        await AsyncStorage.setItem(TOKEN_KEY, idToken);
        return idToken;
      }
    } catch (cognitoError) {
      console.log('⚠️ No hay sesión activa de Cognito, intentando AsyncStorage...');
    }
    
    // Fallback a AsyncStorage
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      return token;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error obteniendo token:', error);
    return null;
  }
};

/**
 * Obtener token de autenticación (versión síncrona para compatibilidad)
 * @returns {string|null} - Token o null
 */
export const getAuthTokenSync = () => {
  // Esta función se mantiene para compatibilidad con código existente
  // pero debería migrarse a la versión async
  return currentUser?.token || null;
};

/**
 * Obtener ID del usuario
 * @returns {string|null} - ID del usuario o null
 */
export const getUserId = () => {
  return currentUser?.id || null;
};

/**
 * Simular verificación de token
 * @param {string} token - Token a verificar
 * @returns {Promise<boolean>} - True si el token es válido
 */
export const verifyToken = async (token) => {
  // Simular delay de verificación
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // En el mock, cualquier token que contenga "mock_token" es válido
  return token && token.includes('mock_token');
};

/**
 * Simular refresh del token
 * @returns {Promise<Object>} - Nuevo token
 */
export const refreshToken = async () => {
  // Simular delay de red
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (!isAuthenticated) {
    throw new Error('Usuario no autenticado');
  }
  
  // Generar nuevo token
  const newToken = `mock_token_${Date.now()}`;
  currentUser.token = newToken;
  
  return {
    success: true,
    token: newToken,
  };
};

export default {
  mockLogin,
  mockLogout,
  getCurrentUser,
  isUserAuthenticated,
  getAuthToken,
  getAuthTokenSync,
  getUserId,
  verifyToken,
  refreshToken,
  saveAuthData,
  loadAuthData,
};
