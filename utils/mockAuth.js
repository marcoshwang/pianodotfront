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
    const idToken = session.tokens.idToken.toString();
    const refreshToken = session.tokens.refreshToken?.toString() || null;
    
    // Guardar IdToken (este es el que se usa en Authorization header)
    await AsyncStorage.setItem(TOKEN_KEY, idToken);
    console.log('✅ IdToken guardado en AsyncStorage');
    
    // Guardar refresh token solo si existe
    if (refreshToken) {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      console.log('✅ Refresh token guardado');
    } else {
      // Si no hay refresh token, eliminar el que pueda existir
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
      console.log('⚠️ No hay refresh token disponible');
    }
    
    // Obtener atributos del usuario (en Amplify v6 se obtienen por separado)
    let userAttributes = {};
    try {
      userAttributes = await fetchUserAttributes();
    } catch (attrError) {
      console.log('⚠️ No se pudieron obtener atributos del usuario:', attrError);
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
      const { getCurrentUser, fetchAuthSession, fetchUserAttributes } = await getAuthFunctions();
      const user = await getCurrentUser();
      const session = await fetchAuthSession();
      const idToken = session.tokens.idToken.toString();
      
      if (idToken && user) {
        // Guardar en AsyncStorage para acceso rápido
        await AsyncStorage.setItem(TOKEN_KEY, idToken);
        
        // Obtener atributos del usuario
        let userAttributes = {};
        try {
          userAttributes = await fetchUserAttributes();
        } catch (attrError) {
          console.log('⚠️ No se pudieron obtener atributos:', attrError);
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
        
        console.log('✅ Sesión de Cognito cargada');
        return true;
      }
    } catch (cognitoError) {
      console.log('⚠️ No hay sesión activa de Cognito:', cognitoError.message);
      // Si no hay sesión de Cognito, limpiar AsyncStorage también
      // porque los tokens guardados ya no son válidos
      await Promise.all([
        AsyncStorage.removeItem(TOKEN_KEY),
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
    // Cerrar sesión de Cognito primero
    try {
      const { signOut } = await getAuthFunctions();
      await signOut();
      console.log('✅ Sesión de Cognito cerrada');
    } catch (cognitoError) {
      console.log('⚠️ No había sesión de Cognito activa');
    }
    
    // Limpiar AsyncStorage completamente
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
    ]);
    
    isAuthenticated = false;
    currentUser = null;
    
    console.log('✅ Sesión cerrada y datos limpiados completamente');
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
 * Limpiar completamente todos los datos de autenticación (útil para debugging)
 * @returns {Promise<void>}
 */
export const clearAllAuthData = async () => {
  try {
    console.log('🧹 Limpiando todos los datos de autenticación...');
    
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
      AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
    ]);
    
    // Limpiar estado en memoria
    isAuthenticated = false;
    currentUser = null;
    
    console.log('✅ Todos los datos de autenticación limpiados');
  } catch (error) {
    console.error('❌ Error limpiando datos de autenticación:', error);
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
    // Primero intentar obtener desde Cognito session (más confiable)
    try {
      const { fetchAuthSession } = await getAuthFunctions();
      const session = await fetchAuthSession();
      
      // IMPORTANTE: Usar idToken, NO accessToken
      // API Gateway con Cognito User Pool Authorizer requiere IdToken
      const idToken = session.tokens.idToken?.toString();
      
      if (idToken) {
        console.log('✅ IdToken obtenido de Cognito session');
        console.log('🔑 IdToken (primeros 50 chars):', idToken.substring(0, 50));
        
        // Verificar que sea un JWT válido
        if (idToken.startsWith('eyJ')) {
          console.log('✅ IdToken es un JWT válido');
        } else {
          console.warn('⚠️ IdToken no parece ser un JWT válido');
        }
        
        // Actualizar AsyncStorage con el token actual
        await AsyncStorage.setItem(TOKEN_KEY, idToken);
        return idToken;
      } else {
        console.warn('⚠️ No se encontró idToken en la sesión');
        // Log de los tokens disponibles para debugging
        console.log('📋 Tokens disponibles:', {
          hasIdToken: !!session.tokens.idToken,
          hasAccessToken: !!session.tokens.accessToken,
          hasRefreshToken: !!session.tokens.refreshToken,
        });
      }
    } catch (cognitoError) {
      console.log('⚠️ No hay sesión activa de Cognito, intentando AsyncStorage...');
      console.log('❌ Error de Cognito:', cognitoError.message);
    }
    
    // Fallback a AsyncStorage
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      console.log('✅ Token obtenido de AsyncStorage');
      console.log('🔑 Token (primeros 50 chars):', token.substring(0, 50));
      return token;
    }
    
    console.warn('⚠️ No se encontró token ni en Cognito ni en AsyncStorage');
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
  clearAllAuthData,
};
