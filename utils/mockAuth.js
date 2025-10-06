// Mock de autenticación temporal para PianoDot
// Este archivo simula un sistema de autenticación hasta implementar el real

// Usuario dummy temporal
const MOCK_USER = {
  id: 'user_123',
  email: 'usuario@ejemplo.com',
  name: 'Usuario Demo',
  token: 'mock_token_123456789',
};

// Simular estado de autenticación
let isAuthenticated = false;
let currentUser = null;

/**
 * Simular login del usuario
 * @returns {Promise<Object>} - Datos del usuario
 */
export const mockLogin = async () => {
  // Simular delay de red
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  isAuthenticated = true;
  currentUser = MOCK_USER;
  
  return {
    success: true,
    user: MOCK_USER,
    token: MOCK_USER.token,
  };
};

/**
 * Simular logout del usuario
 * @returns {Promise<boolean>} - True si se cerró sesión
 */
export const mockLogout = async () => {
  // Simular delay de red
  await new Promise(resolve => setTimeout(resolve, 500));
  
  isAuthenticated = false;
  currentUser = null;
  
  return true;
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
 * Obtener token de autenticación
 * @returns {string|null} - Token o null
 */
export const getAuthToken = () => {
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
  getUserId,
  verifyToken,
  refreshToken,
};
