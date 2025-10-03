import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

export const useSettings = () => {
  const [settings, setSettings] = useState({
    fontSize: 'large', // normal, large, extraLarge
    contrast: 'whiteBlack', // whiteBlack, blackYellow, blackBlue, blackGreen
    vibration: true // true, false
  });

  // Cargar configuraciones al inicializar
  useEffect(() => {
    loadSettings();
  }, []);

  // Guardar configuraciones cuando cambien
  useEffect(() => {
    saveSettings();
  }, [settings]);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('pianoSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.log('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem('pianoSettings', JSON.stringify(settings));
    } catch (error) {
      console.log('Error saving settings:', error);
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
    contrastConfig
  };
};
