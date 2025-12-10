import {
  saveIdToken,
  getIdToken,
  saveAccessToken,
  getAccessToken as getSecureAccessToken,
  saveRefreshToken,
  getRefreshToken,
  saveUserData,
  getUserData,
  saveAuthTokens,
  clearAuthStorage,
  hasStoredTokens,
} from './secureStorage';

/**
 * Guarda los datos de autenticación de forma segura
 * @param {Object} cognitoUser - Usuario de Cognito
 */
export const saveAuthData = async (cognitoUser) => {
  try {
    
    // Obtener la sesión actual para extraer los tokens
    const { fetchAuthSession } = await import('aws-amplify/auth');
    const session = await fetchAuthSession();
    
    if (!session || !session.tokens) {
      throw new Error('No se pudo obtener la sesión de autenticación');
    }
    
    // Extraer tokens
    const tokens = {
      idToken: session.tokens.idToken?.toString(),
      accessToken: session.tokens.accessToken?.toString(),
      refreshToken: session.tokens.refreshToken?.toString(),
    };
    
    // Guardar tokens de forma segura
    await saveAuthTokens(tokens);
    
    // Guardar datos del usuario
    if (cognitoUser) {
      const userData = {
        userId: cognitoUser.userId,
        username: cognitoUser.username,
        signInDetails: cognitoUser.signInDetails,
      };
      await saveUserData(userData);
    }
    
  } catch (error) {
    console.error('Error guardando datos de autenticación:', error);
    throw error;
  }
};

/**
 * Obtiene el token de autenticación (ID Token)
 * @returns {Promise<string|null>}
 */
export const getAuthToken = async () => {
  try {
    const idToken = await getIdToken();
    return idToken;
  } catch (error) {
    console.error('Error obteniendo ID token:', error);
    return null;
  }
};

/**
 * Obtiene el token de autenticación de forma sincrónica (fallback)
 * NOTA: Esta función debe usarse solo como último recurso
 * @returns {string|null}
 */
export const getAuthTokenSync = () => {
  return null;
};

/**
 * Obtiene el Access Token de forma segura
 * @returns {Promise<string|null>}
 */
export const getAccessToken = async () => {
  try {
    // Primero intentar obtener del almacenamiento seguro
    let accessToken = await getSecureAccessToken();
    
    if (!accessToken) {
      // Si no está en el almacenamiento, intentar obtener de Amplify
      const { fetchAuthSession } = await import('aws-amplify/auth');
      const session = await fetchAuthSession({ forceRefresh: false });
      
      if (session?.tokens?.accessToken) {
        accessToken = session.tokens.accessToken.toString();
        // Guardar para próximas veces
        await saveAccessToken(accessToken);
      }
    }
    
    return accessToken;
  } catch (error) {
    console.error('Error obteniendo access token:', error);
    return null;
  }
};

/**
 * Obtiene el Refresh Token de forma segura
 * @returns {Promise<string|null>}
 */
export const getStoredRefreshToken = async () => {
  try {
    return await getRefreshToken();
  } catch (error) {
    console.error('Error obteniendo refresh token:', error);
    return null;
  }
};

/**
 * Refresca los tokens usando el refresh token
 * @returns {Promise<boolean>}
 */
export const refreshAuthTokens = async () => {
  try {
    const { fetchAuthSession } = await import('aws-amplify/auth');
    const session = await fetchAuthSession({ forceRefresh: true });
    
    if (!session || !session.tokens) {
      throw new Error('No se pudieron refrescar los tokens');
    }
    
    // Guardar nuevos tokens
    const tokens = {
      idToken: session.tokens.idToken?.toString(),
      accessToken: session.tokens.accessToken?.toString(),
      refreshToken: session.tokens.refreshToken?.toString(),
    };
    
    await saveAuthTokens(tokens);
    
    return true;
  } catch (error) {
    console.error('Error refrescando tokens:', error);
    return false;
  }
};

/**
 * Verifica si el usuario está autenticado
 * @returns {Promise<boolean>}
 */
export const isAuthenticated = async () => {
  try {
    // Verificar si hay tokens almacenados
    const hasTokens = await hasStoredTokens();
    
    if (!hasTokens) {
      return false;
    }
    
    // Verificar si el usuario actual existe en Cognito
    const { getCurrentUser } = await import('aws-amplify/auth');
    const user = await getCurrentUser();
    
    return !!user;
  } catch (error) {
    return false;
  }
};

/**
 * Obtiene el usuario actual del almacenamiento seguro
 * @returns {Promise<Object|null>}
 */
export const getStoredUser = async () => {
  try {
    return await getUserData();
  } catch (error) {
    console.error('Error obteniendo usuario almacenado:', error);
    return null;
  }
};

/**
 * Limpia todos los datos de autenticación
 */
export const clearAuthData = async () => {
  try {
    await clearAuthStorage();
  } catch (error) {
    console.error('Error limpiando datos de autenticación:', error);
    throw error;
  }
};

/**
 * Limpia todos los datos de autenticación y cierra sesión de Cognito
 */
export const clearAllAuthData = async () => {
  try {
    
    // 1. Intentar cerrar sesión de Cognito
    try {
      const { signOut } = await import('aws-amplify/auth');
      await signOut();
    } catch (cognitoError) {
      // Continuar de todas formas para limpiar datos locales
    }
    
    // 2. Limpiar almacenamiento seguro
    await clearAuthStorage();
  } catch (error) {
    console.error('Error limpiando todos los datos:', error);
    // Intentar limpiar almacenamiento de todas formas
    try {
      await clearAuthStorage();
    } catch (storageError) {
      console.error('Error crítico limpiando almacenamiento:', storageError);
    }
    throw error;
  }
};

/**
 * Verifica y refresca el token si es necesario
 * @returns {Promise<string|null>}
 */
export const getValidToken = async () => {
  try {
    // Intentar obtener el access token actual
    let accessToken = await getAccessToken();
    
    if (!accessToken) {
      // Si no hay token, intentar refrescar
      const refreshed = await refreshAuthTokens();
      
      if (refreshed) {
        accessToken = await getAccessToken();
      }
    }
    
    return accessToken;
  } catch (error) {
    console.error('Error obteniendo token válido:', error);
    return null;
  }
};

export default {
  saveAuthData,
  getAuthToken,
  getAuthTokenSync,
  getAccessToken,
  getStoredRefreshToken,
  refreshAuthTokens,
  isAuthenticated,
  getStoredUser,
  clearAuthData,
  clearAllAuthData, // Exportar también clearAllAuthData
  getValidToken,
};
