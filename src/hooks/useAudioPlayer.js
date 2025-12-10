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
    }
  }, []);

  // Precargar audio
  const preloadAudio = useCallback(async (audioUrl, type = 'audio') => {
    try {
      // Configurar modo de audio
      await configureAudioMode();
      
      // Crear objeto de audio sin reproducir
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { 
          shouldPlay: false,
          isLooping: false,
          volume: 1.0,
          rate: 1.0,
          shouldCorrectPitch: false,
          progressUpdateIntervalMillis: 500,
          androidImplementation: 'MediaPlayer'
        }
      );

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

      preloadedSound.setOnPlaybackStatusUpdate(null);
      
      try {
        const currentStatus = await preloadedSound.getStatusAsync();
        if (currentStatus.isLoaded && currentStatus.isPlaying) {
          await preloadedSound.stopAsync();
        }
        await preloadedSound.setPositionAsync(0);
      } catch (err) {
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
          if (callbackCleaned) return;
          callbackCleaned = true;
          
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          
          try {
            preloadedSound.setOnPlaybackStatusUpdate(null);
          } catch (err) {
          }
          
          preloadedSound.stopAsync().catch(() => {});
          
          setIsPlaying(false);
        };

        preloadedSound.setOnPlaybackStatusUpdate((status) => {
          if (hasFinished || callbackCleaned) {
            return;
          }

          if (status.isLoaded) {
            if (status.didJustFinish) {
              hasFinished = true;
              console.log(`Audio ${type} terminado correctamente`);
              
              cleanup();
              resolve(true);
              return;
            }
            
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

        timeoutId = setTimeout(() => {
          if (!hasFinished && !callbackCleaned) {
            hasFinished = true;
            console.log(`Timeout para audio ${type} después de 180s, asumiendo que terminó`);
            
            cleanup();
            resolve(true);
          }
        }, 180000);

        preloadedSound.playAsync().then(async () => {
          setSound(preloadedSound);
          soundRef.current = preloadedSound;
          
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


  const playAudioFromUrl = useCallback(async (audioUrl, type = 'audio') => {
    try {
      console.log(`Reproduciendo audio ${type} desde URL: ${audioUrl}`);
      
      if (soundRef.current) {
        try {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
        } catch (err) {
          console.log('Error deteniendo audio anterior:', err);
        }
      }

      await configureAudioMode();
      
      setIsPlaying(true);
      setError(null);

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

  const stopAudio = useCallback(async () => {
    try {
      console.log('Deteniendo audio...');
      
      // 1. Detener audio principal si existe
      if (soundRef.current) {
        try {
          const status = await soundRef.current.getStatusAsync();
          if (status.isLoaded) {
            soundRef.current.setOnPlaybackStatusUpdate(null);
            if (status.isPlaying) {
              await soundRef.current.stopAsync();
            }
            await soundRef.current.unloadAsync();
          }
        } catch (err) {
          if (!err.message?.includes('not loaded') && !err.message?.includes('Cannot complete')) {
            console.log('Error deteniendo audio principal:', err);
          }
        }
        soundRef.current = null;
        setSound(null);
      }
      
      // 2. Detener solo los audios precargados que están reproduciéndose
      for (const [type, sound] of Object.entries(preloadedSounds)) {
        if (sound) {
          try {
            const status = await sound.getStatusAsync();
            if (status.isLoaded) {
              sound.setOnPlaybackStatusUpdate(null);

              if (status.isPlaying) {
                await sound.stopAsync();
                await sound.setPositionAsync(0).catch(() => {});
              }
            }
          } catch (err) {
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
            const status = await sound.getStatusAsync();
            if (status.isLoaded) {
              sound.setOnPlaybackStatusUpdate(null);
              await sound.unloadAsync();
            }
          } catch (err) {
            if (!err.message?.includes('not loaded') && !err.message?.includes('Cannot complete')) {
              console.log(`Error limpiando audio ${type}:`, err);
            }
          }
        }
      }
      setPreloadedSounds({});
      console.log('Audios precargados limpiados');
    } catch (error) {
      if (!error.message?.includes('not loaded') && !error.message?.includes('Cannot complete')) {
        console.error('Error limpiando audios precargados:', error);
      }
    }
  }, [preloadedSounds]);

  // Limpiar recursos al desmontar
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.setOnPlaybackStatusUpdate(null);
        soundRef.current.unloadAsync().catch(err => {
          console.log('Error limpiando audio al desmontar:', err);
        });
      }
    };
  }, []);

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