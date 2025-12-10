import { useState, useEffect, useCallback } from 'react';
import * as Speech from 'expo-speech';

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioQueue, setAudioQueue] = useState([]);
  
  // Configuración estándar de volumen para todas las funciones
  // Reducido significativamente para que TalkBack se escuche mejor
  const STANDARD_VOLUME = 0.3;
  const INTRO_VOLUME = 0.4;

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const speak = useCallback((text, options = {}) => {
    Speech.stop();
    
    const defaultOptions = {
      language: 'es-ES',
      pitch: 1.0,
      rate: 0.7,
      volume: STANDARD_VOLUME,
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
    const finalOptions = { ...defaultOptions, ...options, volume: STANDARD_VOLUME };
    setTimeout(() => {
      Speech.speak(text, finalOptions);
    }, 0);
  }, []);

  // Función específica para audio introductorio con máxima prioridad
  const speakIntro = useCallback((text, options = {}) => {
    Speech.stop();
    
    setTimeout(() => {
      
      const introOptions = {
        language: 'es-ES',
        pitch: 1.0,
        rate: 0.5,
        volume: INTRO_VOLUME,
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
      
      const finalIntroOptions = { ...introOptions, ...options, volume: INTRO_VOLUME };
      console.log('Volumen introductorio aplicado:', finalIntroOptions.volume, '(ligeramente más alto para prioridad)');
      
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
