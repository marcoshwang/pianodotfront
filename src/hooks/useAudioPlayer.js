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
      console.error('❌ Error configurando modo de audio:', error);
      // Continuar sin configuración si falla
    }
  }, []);

  // Precargar audio
  const preloadAudio = useCallback(async (audioUrl, type = 'audio') => {
    try {
      console.log(`🎵 Precargando audio ${type} desde URL: ${audioUrl}`);
      
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
          progressUpdateIntervalMillis: 1000,
          androidImplementation: 'MediaPlayer'
        }
      );

      // Guardar en el cache de sonidos precargados
      setPreloadedSounds(prev => ({
        ...prev,
        [type]: newSound
      }));

      console.log(`✅ Audio ${type} precargado correctamente`);
      return newSound;
    } catch (err) {
      console.error(`❌ Error precargando audio ${type}:`, err);
      throw err;
    }
  }, [configureAudioMode]);

  // Reproducir audio precargado
  const playPreloadedAudio = useCallback(async (type = 'audio') => {
    try {
      const preloadedSound = preloadedSounds[type];
      if (!preloadedSound) {
        throw new Error(`Audio ${type} no está precargado`);
      }

      console.log(`🎵 Reproduciendo audio precargado ${type}...`);
      setIsPlaying(true);
      setError(null);

      // Verificar estado antes de reproducir
      const status = await preloadedSound.getStatusAsync();
      console.log(`🔍 Estado antes de reproducir ${type}:`, {
        isLoaded: status.isLoaded,
        isPlaying: status.isPlaying,
        durationMillis: status.durationMillis
      });

      // Reproducir el audio precargado
      await preloadedSound.playAsync();
      setSound(preloadedSound);
      soundRef.current = preloadedSound; // Actualizar ref
      
      // Verificar que realmente esté reproduciéndose
      const playStatus = await preloadedSound.getStatusAsync();
      console.log(`🔍 Estado después de playAsync ${type}:`, {
        isLoaded: playStatus.isLoaded,
        isPlaying: playStatus.isPlaying,
        durationMillis: playStatus.durationMillis
      });
      
      console.log(`✅ Audio ${type} reproduciéndose...`);

      // Esperar a que termine usando polling más frecuente
      return new Promise((resolve, reject) => {
        let isResolved = false;
        
        // Timeout de seguridad (60 segundos)
        const timeout = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            console.log(`⏰ Timeout para audio ${type}, asumiendo que terminó`);
            setIsPlaying(false);
            resolve(true);
          }
        }, 60000);
        
        const checkStatus = async () => {
          try {
            const status = await preloadedSound.getStatusAsync();
            
            if (status.isLoaded && status.didJustFinish && !isResolved) {
              isResolved = true;
              clearTimeout(timeout);
              console.log(`✅ Audio ${type} terminado correctamente`);
              setIsPlaying(false);
              resolve(true);
            } else if (status.isLoaded && status.durationMillis && status.positionMillis >= status.durationMillis - 100 && !isResolved) {
              // Verificar si el audio ha terminado basándose en la duración (con margen de 100ms)
              isResolved = true;
              clearTimeout(timeout);
              console.log(`✅ Audio ${type} terminado por duración`);
              setIsPlaying(false);
              resolve(true);
            } else if (status.error && !isResolved) {
              isResolved = true;
              clearTimeout(timeout);
              console.error(`❌ Error en reproducción ${type}:`, status.error);
              setIsPlaying(false);
              reject(new Error(status.error));
            } else if (!isResolved && status.isLoaded && status.isPlaying) {
              // Solo logear cada 2 segundos para evitar spam
              if (Math.random() < 0.1) { // 10% de probabilidad de logear
                console.log(`🔍 Estado audio ${type}:`, {
                  isLoaded: status.isLoaded,
                  isPlaying: status.isPlaying,
                  didJustFinish: status.didJustFinish,
                  durationMillis: status.durationMillis,
                  positionMillis: status.positionMillis
                });
              }
              // Verificar nuevamente en 500ms si está reproduciéndose
              setTimeout(checkStatus, 500);
            } else if (!isResolved) {
              // Verificar nuevamente en 1000ms si no está reproduciéndose
              setTimeout(checkStatus, 1000);
            }
          } catch (err) {
            if (!isResolved) {
              isResolved = true;
              clearTimeout(timeout);
              console.error(`❌ Error verificando estado ${type}:`, err);
              setIsPlaying(false);
              reject(err);
            }
          }
        };
        
        // Iniciar verificación después de un momento
        setTimeout(checkStatus, 1000);
      });

    } catch (err) {
      console.error('❌ Error reproduciendo audio precargado:', err);
      setError(err.message);
      setIsPlaying(false);
      throw err;
    }
  }, [preloadedSounds]);

  // Reproducir audio desde URL (método original como fallback)
  const playAudioFromUrl = useCallback(async (audioUrl, type = 'audio') => {
    try {
      console.log(`🎵 Reproduciendo audio ${type} desde URL: ${audioUrl}`);
      
      // Detener audio anterior si existe
      if (soundRef.current) {
        try {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
        } catch (err) {
          console.log('⚠️ Error deteniendo audio anterior:', err);
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
          progressUpdateIntervalMillis: 1000,
          androidImplementation: 'MediaPlayer'
        }
      );

      setSound(newSound);
      soundRef.current = newSound;
      console.log(`✅ Audio ${type} reproduciéndose...`);

      // Esperar a que termine la reproducción usando setOnPlaybackStatusUpdate
      return new Promise((resolve, reject) => {
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
            if (status.didJustFinish) {
              console.log(`✅ Audio ${type} terminado correctamente`);
              setIsPlaying(false);
              resolve(true);
            }
          } else if (status.error) {
            console.error(`❌ Error en reproducción ${type}:`, status.error);
            setIsPlaying(false);
            reject(new Error(status.error));
          }
        });
      });

    } catch (err) {
      console.error('❌ Error reproduciendo audio:', err);
      setError(err.message);
      setIsPlaying(false);
      throw err;
    }
  }, [configureAudioMode]);

  // Detener audio
  const stopAudio = useCallback(async () => {
    try {
      if (soundRef.current) {
        console.log('🛑 Deteniendo audio...');
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setSound(null);
        setIsPlaying(false);
        console.log('✅ Audio detenido');
      }
    } catch (error) {
      console.error('❌ Error deteniendo audio:', error);
    }
  }, []);

  // Limpiar audios precargados
  const clearPreloadedSounds = useCallback(async () => {
    try {
      console.log('🧹 Limpiando audios precargados...');
      for (const [type, sound] of Object.entries(preloadedSounds)) {
        if (sound) {
          try {
            await sound.unloadAsync();
          } catch (err) {
            console.log(`⚠️ Error limpiando audio ${type}:`, err);
          }
        }
      }
      setPreloadedSounds({});
      console.log('✅ Audios precargados limpiados');
    } catch (error) {
      console.error('❌ Error limpiando audios precargados:', error);
    }
  }, [preloadedSounds]);

  // Limpiar recursos al desmontar - SOLO UNA VEZ
  useEffect(() => {
    return () => {
      // Usar soundRef en lugar de sound para evitar dependencias
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(err => {
          console.log('⚠️ Error limpiando audio al desmontar:', err);
        });
      }
    };
  }, []); // ✅ Array vacío - solo se ejecuta al montar/desmontar

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