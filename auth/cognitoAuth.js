// Sistema de autenticación para PianoDot con AWS Cognito
// Usa AsyncStorage para persistir el token y datos del usuario
import AsyncStorage from '@react-native-async-storage/async-storage';

// Importar funciones de Auth de forma lazy para evitar problemas de inicialización
let signIn, signUp, signOut, getCurrentUserFn, fetchAuthSession, fetchUserAttributes;

const getAuthFunctions = async () => {
  if (!signIn) {
    const authModule = await import('aws-amplify/auth');
    signIn = authModule.signIn;
    signUp = authModule.signUp;
    signOut = authModule.signOut;
    getCurrentUserFn = authModule.getCurrentUser;
    fetchAuthSession = authModule.fetchAuthSession;
    fetchUserAttributes = authModule.fetchUserAttributes;
  }
  return { signIn, signUp, signOut, getCurrentUser: getCurrentUserFn, fetchAuthSession, fetchUserAttributes };
};

// Claves para AsyncStorage
const TOKEN_KEY = '@pianodot:id_token';
const ACCESS_TOKEN_KEY = '@pianodot:access_token';
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
    const { fetchAuthSession, fetchUserAttributes } = await getAuthFunctions();
    // Obtener los tokens de Cognito
    const session = await fetchAuthSession();
    
    // Verificar que la sesión tenga tokens
    if (!session || !session.tokens || !session.tokens.idToken) {
      console.error('Error: La sesión no tiene tokens válidos');
      console.error('Session object:', session);
      throw new Error('No se pudieron obtener los tokens de la sesión');
    }
    
    const idToken = session.tokens.idToken.toString();
    const accessToken = session.tokens.accessToken?.toString() || null;
    const refreshToken = session.tokens.refreshToken?.toString() || null;
    
    // Guardar IdToken (este es el que se usa en Authorization header para API Gateway)
    await AsyncStorage.setItem(TOKEN_KEY, idToken);
    
    // Guardar Access Token (útil para otras operaciones)
    if (accessToken) {
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    } else {
      await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
    }
    
    // Guardar refresh token solo si existe
    if (refreshToken) {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } else {
      // Si no hay refresh token, eliminar el que pueda existir
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    }
    
    // Obtener atributos del usuario (en Amplify v6 se obtienen por separado)
    let userAttributes = {};
    try {
      userAttributes = await fetchUserAttributes();
    } catch (attrError) {
      // Usar datos básicos del usuario
      userAttributes = {
        email: cognitoUser.userId || cognitoUser.signInDetails?.loginId,
      };
    }
    
    // Guardar datos del usuario
    const userData = {
      id: cognitoUser.userId || cognitoUser.username,
      email: userAttributes.email || cognitoUser.userId || cognitoUser.signInDetails?.loginId,
      name: userAttributes.name || userAttributes.email || cognitoUser.userId,
    };
    
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
    currentUser = userData;
    
    isAuthenticated = true;
  } catch (error) {
    console.error('Error guardando datos de autenticación:', error);
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
      const { getCurrentUser, fetchAuthSession, fetchUserAttributes } = await getAuthFunctions();
      const user = await getCurrentUser();
      const session = await fetchAuthSession();
      const idToken = session.tokens.idToken.toString();
      
      if (idToken && user) {
        // Guardar en AsyncStorage para acceso rápido
        await AsyncStorage.setItem(TOKEN_KEY, idToken);
        
        // Guardar también access token si está disponible
        const accessToken = session.tokens.accessToken?.toString() || null;
        if (accessToken) {
          await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        } else {
          await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
        }
        
        // Guardar refresh token si está disponible
        const refreshToken = session.tokens.refreshToken?.toString() || null;
        if (refreshToken) {
          await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        } else {
          await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
        }
        
        // Obtener atributos del usuario
        let userAttributes = {};
        try {
          userAttributes = await fetchUserAttributes();
        } catch (attrError) {;
          userAttributes = {
            email: user.userId || user.signInDetails?.loginId,
          };
        }
        
        // Obtener datos del usuario
        const userData = {
          id: user.userId || user.username,
          email: userAttributes.email || user.userId || user.signInDetails?.loginId,
          name: userAttributes.name || userAttributes.email || user.userId,
        };
        
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
        currentUser = userData;
        isAuthenticated = true;
        
        return true;
      }
    } catch (cognitoError) {
      // Si no hay sesión de Cognito, limpiar AsyncStorage también
      // porque los tokens guardados ya no son válidos
      await Promise.all([
        AsyncStorage.removeItem(TOKEN_KEY),
        AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
        AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
        AsyncStorage.removeItem(USER_KEY),
      ]);
      currentUser = null;
      isAuthenticated = false;
      return false;
    }
    
    // NO usar fallback de AsyncStorage si no hay sesión de Cognito válida
    // Los tokens en AsyncStorage pueden estar expirados o inválidos
    currentUser = null;
    isAuthenticated = false;
    return false;
  } catch (error) {
    return false;
  }
};

/**
 * Limpiar completamente todos los datos de autenticación (útil para debugging)
 * @returns {Promise<void>}
 */
export const clearAllAuthData = async () => {
  try {
    // Cerrar sesión de Cognito
    try {
      const { signOut } = await getAuthFunctions();
      await signOut();
    } catch (e) {
      // Ignorar si no hay sesión
    }
    
    // Limpiar AsyncStorage
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
      AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
    ]);
    
    // Limpiar estado en memoria
    isAuthenticated = false;
    currentUser = null;
  } catch (error) {
    console.error('Error limpiando datos de autenticación:', error);
    throw error;
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
    try {
      const { fetchAuthSession } = await getAuthFunctions();
      const session = await fetchAuthSession();
      
      // API Gateway con Cognito User Pool Authorizer requiere IdToken
      const idToken = session.tokens.idToken?.toString();
      
      if (idToken) {
        // Verificar que sea un JWT válido
        if (idToken.startsWith('eyJ')) {
          console.log('IdToken es un JWT válido');
        } else {
          console.warn('IdToken no parece ser un JWT válido');
        }
        
        // Actualizar AsyncStorage con el token actual
        await AsyncStorage.setItem(TOKEN_KEY, idToken);
        return idToken;
      } else {
        console.warn('No se encontró idToken en la sesión');
      }
    } catch (cognitoError) {
    }
    
    // Fallback a AsyncStorage
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      return token;
    }
    return null;
  } catch (error) {
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
 * Obtener access token de autenticación
 * @returns {Promise<string|null>} - AccessToken o null
 */
export const getAccessToken = async () => {
  try {
    // Primero intentar obtener desde Cognito session
    try {
      const { fetchAuthSession } = await getAuthFunctions();
      const session = await fetchAuthSession();
      const accessToken = session.tokens.accessToken?.toString();
      
      if (accessToken) {
        await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        return accessToken;
      }
    } catch (cognitoError) {
    }
    
    // Fallback a AsyncStorage
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      return token;
    }
    return null;
  } catch (error) {
    console.error('Error obteniendo access token:', error);
    return null;
  }
};

/**
 * Obtener ID del usuario
 * @returns {string|null} - ID del usuario o null
 */
export const getUserId = () => {
  return currentUser?.id || null;
};

export default {
  getCurrentUser,
  isUserAuthenticated,
  getAuthToken,
  getAuthTokenSync,
  getAccessToken,
  getUserId,
  saveAuthData,
  loadAuthData,
  clearAllAuthData,
};

