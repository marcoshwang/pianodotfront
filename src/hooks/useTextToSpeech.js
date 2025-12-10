import { useState, useEffect, useCallback } from 'react';
import * as Speech from 'expo-speech';

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioQueue, setAudioQueue] = useState([]);
  
  // Configuración estándar de volumen para todas las funciones
  // Reducido significativamente para que TalkBack se escuche mejor
  const STANDARD_VOLUME = 0.3; // Muy bajo para no interferir con TalkBack
  const INTRO_VOLUME = 0.4; // Ligeramente más alto para el audio introductorio

  useEffect(() => {
    return () => {
      // Limpiar al desmontar el componente
      Speech.stop();
    };
  }, []);

  const speak = useCallback((text, options = {}) => {
    // Siempre detener cualquier speech anterior
    Speech.stop();
    
    const defaultOptions = {
      language: 'es-ES', // Español
      pitch: 1.0,
      rate: 0.7, // Velocidad más lenta para mejor comprensión y prioridad
      volume: STANDARD_VOLUME, // Volumen estándar garantizado
      onStart: () => {
        console.log('Speech started:', text.substring(0, 50) + '...');
        setIsSpeaking(true);
      },
      onDone: () => {
        console.log('Speech done');
        setIsSpeaking(false);
      },
      onStopped: () => {
        console.log('Speech stopped');
        setIsSpeaking(false);
      },
      onError: (error) => {
        console.log('Speech error:', error);
        setIsSpeaking(false);
      },
    };

    console.log('Speaking:', text.substring(0, 100) + '...');
    // Asegurar que el volumen estándar siempre tenga prioridad
    const finalOptions = { ...defaultOptions, ...options, volume: STANDARD_VOLUME };
    console.log('🔊 Volumen normal aplicado:', finalOptions.volume, '(balanceado con TalkBack)');
    // Usar setTimeout con 0 para dar prioridad al audio introductorio
    setTimeout(() => {
      Speech.speak(text, finalOptions);
    }, 0);
  }, []);

  // Función específica para audio introductorio con máxima prioridad
  const speakIntro = useCallback((text, options = {}) => {
    console.log('=== INICIANDO AUDIO INTRODUCTORIO ===');
    
    // Detener cualquier speech anterior
    Speech.stop();
    
    // Pequeño delay para asegurar limpieza
    setTimeout(() => {
      
      const introOptions = {
        language: 'es-ES',
        pitch: 1.0,
        rate: 0.5, // Aún más lento para asegurar prioridad
        volume: INTRO_VOLUME, // Volumen específico para audio introductorio
        onStart: () => {
          console.log('Audio introductorio INICIADO');
          setIsSpeaking(true);
        },
        onDone: () => {
          console.log('Audio introductorio COMPLETADO');
          setIsSpeaking(false);
        },
        onStopped: () => {
          console.log('Audio introductorio DETENIDO');
          setIsSpeaking(false);
        },
        onError: (error) => {
          console.log('Error en audio introductorio:', error);
          setIsSpeaking(false);
        },
      };

      console.log('Reproduciendo:', text.substring(0, 50) + '...');
      
      // Asegurar que el volumen introductorio siempre tenga prioridad
      const finalIntroOptions = { ...introOptions, ...options, volume: INTRO_VOLUME };
      console.log('Volumen introductorio aplicado:', finalIntroOptions.volume, '(ligeramente más alto para prioridad)');
      
      // Reproducir una sola vez
      Speech.speak(text, finalIntroOptions);
      
    }, 100);
  }, []);

  const stop = useCallback(() => {
    console.log('Stopping speech');
    Speech.stop();
    setIsSpeaking(false);
  }, []);

  const pause = useCallback(() => {
    Speech.pause();
  }, []);

  const resume = useCallback(() => {
    Speech.resume();
  }, []);

  return {
    speak,
    speakIntro,
    stop,
    pause,
    resume,
    isSpeaking,
  };
};
