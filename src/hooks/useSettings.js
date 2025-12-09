import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { getUserConfig, saveUserConfig } from '../../services/pianodotApi';

export const useSettings = () => {
  const [settings, setSettings] = useState({
    fontSize: 'normal', // normal, large, extraLarge
    contrast: 'whiteBlack', // whiteBlack, blackYellow, blackBlue, blackGreen
    vibration: true // true, false
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const isInitialLoad = useRef(true);
  const isSavingToBackend = useRef(false);

  // Cargar configuraciones al inicializar
  useEffect(() => {
    loadSettings();
  }, []);

  // Guardar configuraciones cuando cambien (pero no en la carga inicial)
  useEffect(() => {
    if (!isInitialLoad.current && !isSavingToBackend.current) {
      saveSettings();
    }
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
      
      // Verificar si el usuario está autenticado antes de intentar cargar del backend
      const authenticated = await isAuthenticated();
      
      if (authenticated) {
        // Intentar cargar desde el backend primero
        try {
          console.log('📥 Cargando configuración desde el backend...');
          const backendConfig = await getUserConfig();
          
          if (backendConfig) {
            const frontendSettings = mapBackendToFrontend(backendConfig);
            setSettings(frontendSettings);
            // También guardar en AsyncStorage como backup
            await AsyncStorage.setItem('pianoSettings', JSON.stringify(frontendSettings));
            console.log('✅ Configuración cargada desde el backend:', frontendSettings);
            isInitialLoad.current = false;
            return;
          }
        } catch (backendError) {
          console.log('⚠️ No se pudo cargar desde el backend, usando AsyncStorage:', backendError.message);
        }
      } else {
        console.log('ℹ️ Usuario no autenticado, cargando desde AsyncStorage');
      }
      
      // Fallback: cargar desde AsyncStorage
      const savedSettings = await AsyncStorage.getItem('pianoSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
        console.log('✅ Configuración cargada desde AsyncStorage:', parsedSettings);
        
        // Intentar sincronizar con el backend en segundo plano solo si está autenticado
        if (authenticated) {
          try {
            const backendConfig = mapFrontendToBackend(parsedSettings);
            await saveUserConfig(backendConfig);
            console.log('✅ Configuración sincronizada con el backend');
          } catch (syncError) {
            console.log('⚠️ No se pudo sincronizar con el backend:', syncError.message);
          }
        }
      } else {
        console.log('ℹ️ No hay configuración guardada, usando valores por defecto');
      }
    } catch (error) {
      console.error('❌ Error cargando configuración:', error);
    } finally {
      setIsLoading(false);
      isInitialLoad.current = false;
    }
  };

  const saveSettings = async () => {
    try {
      // Guardar en AsyncStorage primero (más rápido y siempre funciona)
      await AsyncStorage.setItem('pianoSettings', JSON.stringify(settings));
      console.log('✅ Configuración guardada localmente');
      
      // Verificar si el usuario está autenticado antes de intentar guardar en el backend
      const authenticated = await isAuthenticated();
      
      if (authenticated) {
        // Intentar guardar en el backend en segundo plano (no bloquea)
        // No esperamos a que termine para no bloquear la UI
        isSavingToBackend.current = true;
        const backendConfig = mapFrontendToBackend(settings);
        
        // Ejecutar en segundo plano sin bloquear
        saveUserConfig(backendConfig)
          .then(() => {
            console.log('✅ Configuración guardada en el backend:', backendConfig);
          })
          .catch((backendError) => {
            // Solo log, no mostrar error al usuario ya que está guardado localmente
            console.log('⚠️ No se pudo guardar en el backend, solo guardado localmente:', backendError.message);
          })
          .finally(() => {
            isSavingToBackend.current = false;
          });
      } else {
        console.log('ℹ️ Usuario no autenticado, configuración guardada solo localmente');
      }
    } catch (error) {
      // Solo errores críticos (como fallo de AsyncStorage)
      console.error('❌ Error guardando configuración:', error);
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const triggerVibration = () => {
    if (settings.vibration) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  // Configuraciones de tamaño
  const fontSizeConfig = {
    normal: {
      buttonText: 35, // 24 * 2
      buttonPadding: 10,
      logoWidth: 250,
      logoHeight: 100,
      subtitleSize: 28 // 14 * 2
    },
    large: {
      buttonText: 45, // 28 * 2
      buttonPadding: 10,
      logoWidth: 280,
      logoHeight: 120,
      subtitleSize: 32 // 16 * 2
    },
    extraLarge: {
      buttonText: 49, // 32 * 2
      buttonPadding: 10,
      logoWidth: 320,
      logoHeight: 140,
      subtitleSize: 36 // 18 * 2
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
    isLoading
  };
};
