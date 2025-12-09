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

  // ✅ Escuchar eventos de recarga (por ejemplo, después de login con OAuth)
  useEffect(() => {
    console.log('👂 Suscribiéndose a eventos de recarga de settings');
    const unsubscribe = settingsEvents.subscribe(() => {
      console.log('🔔 Evento recibido: recargando settings desde AsyncStorage...');
      loadSettings();
    });
    
    return () => {
      console.log('👋 Desuscribiéndose de eventos de settings');
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
      console.log('⏸️ Settings no cambiaron, saltando guardado');
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
      const { getAuthToken } = await import('../../utils/mockAuth');
      const token = await getAuthToken();
      return !!token;
    } catch (error) {
      return false;
    }
  };

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Cargando configuraciones...');
      
      // Verificar autenticación
      const authenticated = await isAuthenticated();
      console.log('🔐 Usuario autenticado:', authenticated);
      
      let loadedSettings = null;
      
      if (authenticated) {
        // Intentar cargar desde el backend
        try {
          console.log('📥 Intentando cargar configuración desde backend (GET /users/me/config)...');
          const backendConfig = await getUserConfig();
          
          if (backendConfig) {
            loadedSettings = mapBackendToFrontend(backendConfig);
            console.log('✅ Configuración cargada desde backend (GET /users/me/config):', loadedSettings);
            
            // Guardar en AsyncStorage como backup
            await AsyncStorage.setItem('pianoSettings', JSON.stringify(loadedSettings));
            console.log('✅ Configuración guardada en AsyncStorage como backup');
          }
        } catch (backendError) {
          console.warn('⚠️ No se pudo cargar desde backend (GET /users/me/config):', backendError.message);
          // Continuar con fallback a AsyncStorage
        }
      }
      
      // Si no hay settings del backend, intentar cargar desde AsyncStorage
      if (!loadedSettings) {
        console.log('📥 Intentando cargar desde AsyncStorage...');
        const savedSettings = await AsyncStorage.getItem('pianoSettings');
        
        if (savedSettings) {
          loadedSettings = JSON.parse(savedSettings);
          console.log('✅ Configuración cargada desde AsyncStorage:', loadedSettings);
        } else {
          console.log('ℹ️ No hay configuración guardada, usando valores por defecto');
        }
      }
      
      // Actualizar estado si hay settings cargadas
      if (loadedSettings) {
        console.log('🔄 Aplicando configuración cargada al estado:', loadedSettings);
        setSettings(loadedSettings);
        lastSavedSettings.current = JSON.stringify(loadedSettings);
        console.log('✅ Estado actualizado, debería causar re-render');
      }
      
    } catch (error) {
      console.error('❌ Error cargando configuración:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    // Prevenir guardados simultáneos
    if (isSaving.current) {
      console.log('⏸️ Ya hay un guardado en progreso, saltando...');
      return;
    }

    try {
      isSaving.current = true;
      console.log('💾 Guardando configuraciones:', settings);
      
      // Guardar en AsyncStorage primero (más rápido)
      await AsyncStorage.setItem('pianoSettings', JSON.stringify(settings));
      console.log('✅ Guardado en AsyncStorage');
      
      // Verificar autenticación
      const authenticated = await isAuthenticated();
      
      if (authenticated) {
        // Guardar en backend
        try {
          const backendConfig = mapFrontendToBackend(settings);
          console.log('📤 Guardando en backend:', backendConfig);
          
          await saveUserConfig(backendConfig);
          console.log('✅ Guardado en backend exitoso');
          
          // Actualizar referencia de última configuración guardada
          lastSavedSettings.current = JSON.stringify(settings);
        } catch (backendError) {
          console.error('❌ Error guardando en backend:', backendError.message);
          // No lanzar error - ya guardamos localmente
        }
      } else {
        console.log('ℹ️ Usuario no autenticado, guardado solo local');
        lastSavedSettings.current = JSON.stringify(settings);
      }
    } catch (error) {
      console.error('❌ Error guardando configuración:', error);
    } finally {
      isSaving.current = false;
    }
  };

  const updateSetting = (key, value) => {
    console.log(`🔧 Actualizando setting: ${key} = ${value}`);
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetSettings = async (skipBackendSync = false) => {
    try {
      console.log('🔄 Reseteando configuraciones...');
      
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
      console.log('✅ AsyncStorage limpiado');
      
      // Si está autenticado y NO se debe saltar la sincronización, resetear en backend
      if (!skipBackendSync) {
        const authenticated = await isAuthenticated();
        if (authenticated) {
          try {
            const backendConfig = mapFrontendToBackend(defaultSettings);
            await saveUserConfig(backendConfig);
            console.log('✅ Configuración reseteada en backend');
          } catch (error) {
            console.warn('⚠️ No se pudo resetear en backend:', error.message);
          }
        }
      } else {
        console.log('ℹ️ Sincronización con backend omitida (skipBackendSync=true)');
      }
      
      console.log('✅ Configuraciones reseteadas');
    } catch (error) {
      console.error('❌ Error reseteando configuraciones:', error);
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
