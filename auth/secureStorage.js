import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Almacenamiento seguro para tokens y datos sensibles
 */
const STORAGE_KEYS = {
  ID_TOKEN: 'pianodot_id_token',
  ACCESS_TOKEN: 'pianodot_access_token',
  REFRESH_TOKEN: 'pianodot_refresh_token',
  USER_DATA: 'pianodot_user_data',
};

/**
 * Valida que la clave sea compatible con SecureStore
 * @param {string} key - Clave a validar
 * @returns {boolean}
 */
const isValidKey = (key) => {
  const validKeyRegex = /^[a-zA-Z0-9._-]+$/;
  return validKeyRegex.test(key) && key.length > 0;
};

/**
 * Guarda un valor de forma segura
 * @param {string} key - Clave para almacenar
 * @param {string} value - Valor a almacenar
 * @returns {Promise<void>}
 */
export const setSecureItem = async (key, value) => {
  try {
    if (!value) {
      return;
    }

    if (!isValidKey(key)) {
      console.error(`Clave inválida para SecureStore: ${key}`);
      throw new Error(`Clave inválida: ${key}. Solo se permiten letras, números, ".", "-", "_"`);
    }

    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }

    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error(`Error guardando ${key}:`, error);
    throw new Error(`No se pudo guardar ${key} de forma segura`);
  }
};

/**
 * Obtiene un valor almacenado de forma segura
 * @param {string} key - Clave a buscar
 * @returns {Promise<string|null>}
 */
export const getSecureItem = async (key) => {
  try {
    if (!isValidKey(key)) {
      console.error(`Clave inválida para SecureStore: ${key}`);
      return null;
    }

    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }

    const value = await SecureStore.getItemAsync(key);
    return value;
  } catch (error) {
    console.error(`Error obteniendo ${key}:`, error);
    return null;
  }
};

/**
 * Elimina un valor almacenado de forma segura
 * @param {string} key - Clave a eliminar
 * @returns {Promise<void>}
 */
export const deleteSecureItem = async (key) => {
  try {
    if (!isValidKey(key)) {
      console.error(`Clave inválida para SecureStore: ${key}`);
      return;
    }

    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }

    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error(`Error eliminando ${key}:`, error);
  }
};

//FUNCIONES PARA TOKENS DE AUTENTICACIÓN

/**
 * Guarda el ID Token de forma segura
 */
export const saveIdToken = async (token) => {
  await setSecureItem(STORAGE_KEYS.ID_TOKEN, token);
};

/**
 * Obtiene el ID Token
 */
export const getIdToken = async () => {
  return await getSecureItem(STORAGE_KEYS.ID_TOKEN);
};

/**
 * Guarda el Access Token de forma segura
 */
export const saveAccessToken = async (token) => {
  await setSecureItem(STORAGE_KEYS.ACCESS_TOKEN, token);
};

/**
 * Obtiene el Access Token
 */
export const getAccessToken = async () => {
  return await getSecureItem(STORAGE_KEYS.ACCESS_TOKEN);
};

/**
 * Guarda el Refresh Token de forma segura
 */
export const saveRefreshToken = async (token) => {
  await setSecureItem(STORAGE_KEYS.REFRESH_TOKEN, token);
};

/**
 * Obtiene el Refresh Token
 */
export const getRefreshToken = async () => {
  return await getSecureItem(STORAGE_KEYS.REFRESH_TOKEN);
};

/**
 * Guarda los datos del usuario de forma segura
 */
export const saveUserData = async (userData) => {
  const userString = JSON.stringify(userData);
  await setSecureItem(STORAGE_KEYS.USER_DATA, userString);
};

/**
 * Obtiene los datos del usuario
 */
export const getUserData = async () => {
  const userString = await getSecureItem(STORAGE_KEYS.USER_DATA);
  if (!userString) return null;
  
  try {
    return JSON.parse(userString);
  } catch (error) {
    console.error('Error parseando datos de usuario:', error);
    return null;
  }
};

/**
 * Guarda todos los tokens de autenticación
 */
export const saveAuthTokens = async (tokens) => {
  try {
    const promises = [];
    
    if (tokens.idToken) {
      promises.push(saveIdToken(tokens.idToken));
    }
    
    if (tokens.accessToken) {
      promises.push(saveAccessToken(tokens.accessToken));
    }
    
    if (tokens.refreshToken) {
      promises.push(saveRefreshToken(tokens.refreshToken));
    }
    
    await Promise.all(promises);
  } catch (error) {
    console.error('Error guardando tokens:', error);
    throw error;
  }
};

/**
 * Limpia todos los datos de autenticación de forma segura
 */
export const clearAuthStorage = async () => {
  try {
    const deletePromises = Object.values(STORAGE_KEYS).map(key => 
      deleteSecureItem(key)
    );
    
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error limpiando almacenamiento:', error);
    // No lanzar error, intentar eliminar individualmente
    for (const key of Object.values(STORAGE_KEYS)) {
      try {
        await deleteSecureItem(key);
      } catch (e) {
        console.error(`Error eliminando ${key}:`, e);
      }
    }
  }
};

/**
 * Verifica si hay tokens guardados
 */
export const hasStoredTokens = async () => {
  try {
    const idToken = await getIdToken();
    const accessToken = await getAccessToken();
    
    return !!(idToken || accessToken);
  } catch (error) {
    console.error('Error verificando tokens:', error);
    return false;
  }
};

/**
 * Obtiene todos los tokens almacenados
 */
export const getAllTokens = async () => {
  try {
    const [idToken, accessToken, refreshToken] = await Promise.all([
      getIdToken(),
      getAccessToken(),
      getRefreshToken(),
    ]);
    
    return {
      idToken,
      accessToken,
      refreshToken,
    };
  } catch (error) {
    console.error('Error obteniendo tokens:', error);
    return {
      idToken: null,
      accessToken: null,
      refreshToken: null,
    };
  }
};

export default {
  setSecureItem,
  getSecureItem,
  deleteSecureItem,

  saveIdToken,
  getIdToken,
  saveAccessToken,
  getAccessToken,
  saveRefreshToken,
  getRefreshToken,
  saveUserData,
  getUserData,
  saveAuthTokens,
  clearAuthStorage,
  hasStoredTokens,
  getAllTokens,
  
  STORAGE_KEYS,
};