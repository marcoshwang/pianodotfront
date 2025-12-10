import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { getUserConfig, saveUserConfig } from '../../services/pianodotApi';
import { settingsEvents } from '../utils/settingsEvents';

export const useSettings = () => {
  const [settings, setSettings] = useState({
    fontSize: 'normal',
    contrast: 'whiteBlack',
    vibration: true
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const isInitialMount = useRef(true);
  const isSaving = useRef(false);
  const lastSavedSettings = useRef(null);

  //Escuchar eventos de recarga (por ejemplo, después de login con OAuth)
  useEffect(() => {
    const unsubscribe = settingsEvents.subscribe(() => {
      loadSettings();
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  // Cargar configuraciones al inicializar
  useEffect(() => {
    loadSettings();
  }, []);

  // Guardar configuraciones cuando cambien (excepto en la carga inicial)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Solo guardar si las settings realmente cambiaron
    const settingsString = JSON.stringify(settings);
    if (lastSavedSettings.current === settingsString) {
      return;
    }

    // Guardar con debounce
    const timeoutId = setTimeout(() => {
      saveSettings();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [settings]);

  // Mapear valores del backend al frontend
  const mapBackendToFrontend = (backendConfig) => {
    const fontSizeMap = {
      'normal': 'normal',
      'grande': 'large',
      'extraGrande': 'extraLarge'
    };
    
    return {
      fontSize: fontSizeMap[backendConfig.font_size] || 'normal',
      contrast: backendConfig.tema_preferido || 'whiteBlack',
      vibration: backendConfig.vibracion !== undefined ? backendConfig.vibracion : true
    };
  };

  // Mapear valores del frontend al backend
  const mapFrontendToBackend = (frontendSettings) => {
    const fontSizeMap = {
      'normal': 'normal',
      'large': 'grande',
      'extraLarge': 'extraGrande'
    };
    
    return {
      font_size: fontSizeMap[frontendSettings.fontSize] || 'normal',
      tema_preferido: frontendSettings.contrast || 'whiteBlack',
      vibracion: frontendSettings.vibration !== undefined ? frontendSettings.vibration : true
    };
  };

  // Verificar si el usuario está autenticado
  const isAuthenticated = async () => {
    try {
      const { getAuthToken } = await import('../../auth/cognitoAuth');
      const token = await getAuthToken();
      return !!token;
    } catch (error) {
      return false;
    }
  };

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      // Verificar autenticación
      const authenticated = await isAuthenticated();
      
      let loadedSettings = null;
      
      if (authenticated) {
        // Intentar cargar desde el backend
        try {
          const backendConfig = await getUserConfig();
          
          if (backendConfig) {
            loadedSettings = mapBackendToFrontend(backendConfig);;
            
            // Guardar en AsyncStorage como backup
            await AsyncStorage.setItem('pianoSettings', JSON.stringify(loadedSettings));
          }
        } catch (backendError) {
          // Continuar con fallback a AsyncStorage
        }
      }
      
      // Si no hay settings del backend, intentar cargar desde AsyncStorage
      if (!loadedSettings) {
        const savedSettings = await AsyncStorage.getItem('pianoSettings');
        
        if (savedSettings) {
          loadedSettings = JSON.parse(savedSettings);
        }
      }
      
      // Actualizar estado si hay settings cargadas
      if (loadedSettings) {
        setSettings(loadedSettings);
        lastSavedSettings.current = JSON.stringify(loadedSettings);
      }
      
    } catch (error) {
      console.error('Error cargando configuración:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    // Prevenir guardados simultáneos
    if (isSaving.current) {
      return;
    }

    try {
      isSaving.current = true;
      
      // Guardar en AsyncStorage primero (más rápido)
      await AsyncStorage.setItem('pianoSettings', JSON.stringify(settings));     
      // Verificar autenticación
      const authenticated = await isAuthenticated();
      
      if (authenticated) {
        // Guardar en backend
        try {
          const backendConfig = mapFrontendToBackend(settings);
          
          await saveUserConfig(backendConfig);
          
          // Actualizar referencia de última configuración guardada
          lastSavedSettings.current = JSON.stringify(settings);
        } catch (backendError) {
          console.error('Error guardando en backend:', backendError.message);
          // No lanzar error - ya guardamos localmente
        }
      } else {
        lastSavedSettings.current = JSON.stringify(settings);
      }
    } catch (error) {
      console.error('Error guardando configuración:', error);
    } finally {
      isSaving.current = false;
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetSettings = async (skipBackendSync = false) => {
    try {
      
      const defaultSettings = {
        fontSize: 'normal',
        contrast: 'whiteBlack',
        vibration: true
      };
      
      // Actualizar estado
      setSettings(defaultSettings);
      lastSavedSettings.current = JSON.stringify(defaultSettings);
      
      // Limpiar AsyncStorage
      await AsyncStorage.removeItem('pianoSettings');
      
      // Si está autenticado y NO se debe saltar la sincronización, resetear en backend
      if (!skipBackendSync) {
        const authenticated = await isAuthenticated();
        if (authenticated) {
          try {
            const backendConfig = mapFrontendToBackend(defaultSettings);
            await saveUserConfig(backendConfig);
          } catch (error) {
          }
        }
      }
      
    } catch (error) {
      console.error('Error reseteando configuraciones:', error);
    }
  };

  const triggerVibration = () => {
    if (settings.vibration) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  // Configuraciones de tamaño
  const fontSizeConfig = {
    normal: {
      buttonText: 35,
      buttonPadding: 10,
      logoWidth: 250,
      logoHeight: 100,
      subtitleSize: 28
    },
    large: {
      buttonText: 45,
      buttonPadding: 10,
      logoWidth: 280,
      logoHeight: 120,
      subtitleSize: 32
    },
    extraLarge: {
      buttonText: 49,
      buttonPadding: 10,
      logoWidth: 320,
      logoHeight: 140,
      subtitleSize: 36
    }
  };

  // Configuraciones de contraste
  const contrastConfig = {
    whiteBlack: {
      backgroundColor: '#FFFFFF',
      buttonColor: '#000000',
      textColor: '#FFFFFF',
      subtitleColor: '#000000',
      backButtonColor: '#000000'
    },
    blackYellow: {
      backgroundColor: '#000000',
      buttonColor: '#1A1A1A',
      textColor: '#FFFF00',
      subtitleColor: '#FFFF00',
      backButtonColor: '#FFFF00'
    },
    blackBlue: {
      backgroundColor: '#000000',
      buttonColor: '#1A1A1A',
      textColor: '#3FE6FF',
      subtitleColor: '#3FE6FF',
      backButtonColor: '#3FE6FF'
    },
    blackGreen: {
      backgroundColor: '#000000',
      buttonColor: '#1A1A1A',
      textColor: '#76FF03',
      subtitleColor: '#76FF03',
      backButtonColor: '#76FF03'
    },
    blackWhite: {
      backgroundColor: '#000000',
      buttonColor: '#1A1A1A',
      textColor: '#FFFFFF',
      subtitleColor: '#FFFFFF',
      backButtonColor: '#FFFFFF'
    }
  };

  const getCurrentSizeConfig = () => fontSizeConfig[settings.fontSize];
  const getCurrentContrastConfig = () => contrastConfig[settings.contrast];

  return {
    settings,
    updateSetting,
    triggerVibration,
    getCurrentSizeConfig,
    getCurrentContrastConfig,
    fontSizeConfig,
    contrastConfig,
    isLoading,
    resetSettings,
    loadSettings
  };
};
