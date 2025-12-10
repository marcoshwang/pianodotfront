import { useState, useCallback, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';

export const useAudioPlayer = () => {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  const [preloadedSounds, setPreloadedSounds] = useState({});
  
  // Usar ref para mantener referencia al sound actual sin causar re-renders
  const soundRef = useRef(null);

  // Configurar modo de audio una sola vez
  const configureAudioMode = useCallback(async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
    } catch (error) {
      console.error('Error configurando modo de audio:', error);
      // Continuar sin configuración si falla
    }
  }, []);

  // Precargar audio
  const preloadAudio = useCallback(async (audioUrl, type = 'audio') => {
    try {
      // Truncar URL para evitar logs muy largos (mostrar solo primeros 100 caracteres)
      
      // Configurar modo de audio
      await configureAudioMode();
      
      // Crear objeto de audio sin reproducir
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { 
          shouldPlay: false, // No reproducir automáticamente
          isLooping: false,
          volume: 1.0,
          rate: 1.0,
          shouldCorrectPitch: false,
          progressUpdateIntervalMillis: 500, // Actualizar cada 500ms
          androidImplementation: 'MediaPlayer'
        }
      );

      // Guardar en el cache de sonidos precargados
      setPreloadedSounds(prev => ({
        ...prev,
        [type]: newSound
      }));

      return newSound;
    } catch (err) {
      console.error(`Error precargando audio ${type}:`, err);
      throw err;
    }
  }, [configureAudioMode]);

  //Reproducir audio precargado usando callback en lugar de polling
  const playPreloadedAudio = useCallback(async (type = 'audio') => {
    try {
      const preloadedSound = preloadedSounds[type];
      if (!preloadedSound) {
        throw new Error(`Audio ${type} no está precargado`);
      }

      // Limpiar cualquier callback previo antes de empezar
      preloadedSound.setOnPlaybackStatusUpdate(null);
      
      // Detener y resetear el audio si estaba reproduciéndose
      try {
        const currentStatus = await preloadedSound.getStatusAsync();
        if (currentStatus.isLoaded && currentStatus.isPlaying) {
          await preloadedSound.stopAsync();
        }
        // Resetear a posición 0 para asegurar que empiece desde el principio
        await preloadedSound.setPositionAsync(0);
      } catch (err) {
        // Ignorar errores al resetear
      }

      setIsPlaying(true);
      setError(null);

      // Verificar estado antes de reproducir
      const statusBefore = await preloadedSound.getStatusAsync();
      console.log(`Estado antes de reproducir ${type}:`, {
        isLoaded: statusBefore.isLoaded,
        isPlaying: statusBefore.isPlaying,
        durationMillis: statusBefore.durationMillis
      });

      //Configurar el callback ANTES de reproducir
      return new Promise((resolve, reject) => {
        let hasFinished = false;
        let timeoutId = null;
        let callbackCleaned = false;

        // Función para limpiar todo de forma segura
        const cleanup = () => {
          if (callbackCleaned) return; // Ya se limpió, evitar múltiples limpiezas
          callbackCleaned = true;
          
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          
          // Limpiar callback de forma síncrona
          try {
            preloadedSound.setOnPlaybackStatusUpdate(null);
          } catch (err) {
            // Ignorar errores al limpiar
          }
          
          // Detener audio físicamente
          preloadedSound.stopAsync().catch(() => {});
          
          setIsPlaying(false);
        };

        // Callback para monitorear el estado de reproducción
        preloadedSound.setOnPlaybackStatusUpdate((status) => {
          // Verificación doble: hasFinished Y callbackCleaned
          if (hasFinished || callbackCleaned) {
            return; // Ya terminó, ignorar TODAS las actualizaciones
          }

          if (status.isLoaded) {
            // Verificar si terminó
            if (status.didJustFinish) {
              hasFinished = true;
              console.log(`Audio ${type} terminado correctamente`);
              
              cleanup();
              resolve(true);
              return; // Salir inmediatamente
            }
            
            // Log solo ocasionalmente para reducir spam (cada ~2 segundos)
            if (status.positionMillis % 2000 < 500) {
              console.log(`Reproduciendo ${type}:`, {
                position: Math.round(status.positionMillis / 1000),
                duration: Math.round(status.durationMillis / 1000),
                isPlaying: status.isPlaying
              });
            }
          } else if (status.error) {
            hasFinished = true;
            console.error(`Error en reproducción ${type}:`, status.error);
            
            cleanup();
            reject(new Error(status.error));
          }
        });

        //Timeout de seguridad aumentado a 2 minutos (120 segundos)
        timeoutId = setTimeout(() => {
          if (!hasFinished && !callbackCleaned) {
            hasFinished = true;
            console.log(`Timeout para audio ${type} después de 180s, asumiendo que terminó`);
            
            cleanup();
            resolve(true);
          }
        }, 180000); // 180 segundos = 2 minutos

        // Iniciar reproducción DESPUÉS de configurar el callback
        preloadedSound.playAsync().then(async () => {
          setSound(preloadedSound);
          soundRef.current = preloadedSound;
          
          // Verificar que realmente esté reproduciéndose
          const playStatus = await preloadedSound.getStatusAsync();
          console.log(`Estado después de playAsync ${type}:`, {
            isLoaded: playStatus.isLoaded,
            isPlaying: playStatus.isPlaying,
            durationMillis: playStatus.durationMillis
          });
          
          console.log(`Audio ${type} reproduciéndose...`);
        }).catch((err) => {
          if (!hasFinished && !callbackCleaned) {
            hasFinished = true;
            console.error(`Error iniciando reproducción ${type}:`, err);
            
            cleanup();
            reject(err);
          }
        });
      });

    } catch (err) {
      console.error('Error reproduciendo audio precargado:', err);
      setError(err.message);
      setIsPlaying(false);
      throw err;
    }
  }, [preloadedSounds]);

  // Reproducir audio desde URL (método original como fallback)
  const playAudioFromUrl = useCallback(async (audioUrl, type = 'audio') => {
    try {
      console.log(`Reproduciendo audio ${type} desde URL: ${audioUrl}`);
      
      // Detener audio anterior si existe
      if (soundRef.current) {
        try {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
        } catch (err) {
          console.log('Error deteniendo audio anterior:', err);
        }
      }

      // Configurar modo de audio
      await configureAudioMode();
      
      setIsPlaying(true);
      setError(null);

      // Crear objeto de audio
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { 
          shouldPlay: true, 
          isLooping: false,
          volume: 1.0,
          rate: 1.0,
          shouldCorrectPitch: false,
          progressUpdateIntervalMillis: 500,
          androidImplementation: 'MediaPlayer'
        }
      );

      setSound(newSound);
      soundRef.current = newSound;
      console.log(`Audio ${type} reproduciéndose...`);

      // Esperar a que termine la reproducción usando setOnPlaybackStatusUpdate
      return new Promise((resolve, reject) => {
        let hasFinished = false;
        let timeoutId = null;

        newSound.setOnPlaybackStatusUpdate((status) => {
          if (hasFinished) return;

          if (status.isLoaded) {
            if (status.didJustFinish) {
              hasFinished = true;
              if (timeoutId) clearTimeout(timeoutId);
              
              console.log(`Audio ${type} terminado correctamente`);
              setIsPlaying(false);
              
              newSound.setOnPlaybackStatusUpdate(null);
              resolve(true);
            }
          } else if (status.error) {
            hasFinished = true;
            if (timeoutId) clearTimeout(timeoutId);
            
            console.error(`Error en reproducción ${type}:`, status.error);
            setIsPlaying(false);
            
            newSound.setOnPlaybackStatusUpdate(null);
            reject(new Error(status.error));
          }
        });

        // Timeout de seguridad de 2 minutos
        timeoutId = setTimeout(() => {
          if (!hasFinished) {
            hasFinished = true;
            console.log(`Timeout para audio ${type} después de 120s`);
            setIsPlaying(false);
            
            newSound.setOnPlaybackStatusUpdate(null);
            resolve(true);
          }
        }, 120000);
      });

    } catch (err) {
      console.error('Error reproduciendo audio:', err);
      setError(err.message);
      setIsPlaying(false);
      throw err;
    }
  }, [configureAudioMode]);

  //Detener audio de forma más robusta
  const stopAudio = useCallback(async () => {
    try {
      console.log('Deteniendo audio...');
      
      // 1. Detener audio principal si existe
      if (soundRef.current) {
        try {
          // Verificar estado antes de detener
          const status = await soundRef.current.getStatusAsync();
          if (status.isLoaded) {
            // Limpiar callbacks antes de detener
            soundRef.current.setOnPlaybackStatusUpdate(null);
            if (status.isPlaying) {
              await soundRef.current.stopAsync();
            }
            await soundRef.current.unloadAsync();
          }
        } catch (err) {
          // Si el sonido ya fue descargado o no está cargado, ignorar el error
          if (!err.message?.includes('not loaded') && !err.message?.includes('Cannot complete')) {
            console.log('Error deteniendo audio principal:', err);
          }
        }
        soundRef.current = null;
        setSound(null);
      }
      
      // 2. Detener solo los audios precargados que están reproduciéndose
      // NO descargar los audios precargados que no están reproduciéndose
      for (const [type, sound] of Object.entries(preloadedSounds)) {
        if (sound) {
          try {
            // Verificar estado antes de detener
            const status = await sound.getStatusAsync();
            if (status.isLoaded) {
              // Limpiar callback siempre
              sound.setOnPlaybackStatusUpdate(null);
              
              // Solo detener si está reproduciéndose
              if (status.isPlaying) {
                await sound.stopAsync();
                // Resetear posición para que esté listo para la próxima reproducción
                await sound.setPositionAsync(0).catch(() => {});
              }
              // IMPORTANTE: NO descargar (unloadAsync) los audios precargados
              // para que estén disponibles para la siguiente reproducción
            }
          } catch (err) {
            // Si el sonido ya fue descargado o no está cargado, ignorar el error
            if (!err.message?.includes('not loaded') && !err.message?.includes('Cannot complete')) {
              console.log(`Error deteniendo audio precargado ${type}:`, err);
            }
          }
        }
      }
      
      // 3. Limpiar estado
      setIsPlaying(false);
      setError(null);
      
      console.log('Audio detenido completamente');
    } catch (error) {
      // Si es un error de "not loaded", es normal y lo ignoramos
      if (!error.message?.includes('not loaded') && !error.message?.includes('Cannot complete')) {
        console.error('Error deteniendo audio:', error);
      }
    }
  }, [preloadedSounds]);

  // Limpiar audios precargados
  const clearPreloadedSounds = useCallback(async () => {
    try {
      console.log('Limpiando audios precargados...');
      for (const [type, sound] of Object.entries(preloadedSounds)) {
        if (sound) {
          try {
            // Verificar estado antes de descargar
            const status = await sound.getStatusAsync();
            if (status.isLoaded) {
              // Limpiar callback antes de descargar
              sound.setOnPlaybackStatusUpdate(null);
              await sound.unloadAsync();
            }
          } catch (err) {
            // Si el sonido ya fue descargado o no está cargado, ignorar el error
            if (!err.message?.includes('not loaded') && !err.message?.includes('Cannot complete')) {
              console.log(`Error limpiando audio ${type}:`, err);
            }
          }
        }
      }
      setPreloadedSounds({});
      console.log('Audios precargados limpiados');
    } catch (error) {
      // Si es un error de "not loaded", es normal y lo ignoramos
      if (!error.message?.includes('not loaded') && !error.message?.includes('Cannot complete')) {
        console.error('Error limpiando audios precargados:', error);
      }
    }
  }, [preloadedSounds]);

  // Limpiar recursos al desmontar - SOLO UNA VEZ
  useEffect(() => {
    return () => {
      // Usar soundRef en lugar de sound para evitar dependencias
      if (soundRef.current) {
        soundRef.current.setOnPlaybackStatusUpdate(null);
        soundRef.current.unloadAsync().catch(err => {
          console.log('Error limpiando audio al desmontar:', err);
        });
      }
    };
  }, []); // Array vacío - solo se ejecuta al montar/desmontar

  return {
    playAudioFromUrl,
    playPreloadedAudio,
    preloadAudio,
    stopAudio,
    clearPreloadedSounds,
    isPlaying,
    error,
    sound,
    preloadedSounds
  };
};