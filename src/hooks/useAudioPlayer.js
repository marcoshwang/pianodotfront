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
          progressUpdateIntervalMillis: 500, // Actualizar cada 500ms
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

  // ✅ SOLUCION: Reproducir audio precargado usando callback en lugar de polling
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
      const statusBefore = await preloadedSound.getStatusAsync();
      console.log(`🔍 Estado antes de reproducir ${type}:`, {
        isLoaded: statusBefore.isLoaded,
        isPlaying: statusBefore.isPlaying,
        durationMillis: statusBefore.durationMillis
      });

      // ✅ CLAVE: Configurar el callback ANTES de reproducir
      return new Promise((resolve, reject) => {
        let hasFinished = false;
        let timeoutId = null;

        // Callback para monitorear el estado de reproducción
        preloadedSound.setOnPlaybackStatusUpdate((status) => {
          if (hasFinished) return; // Ya terminó, ignorar actualizaciones

          if (status.isLoaded) {
            // Log solo ocasionalmente para reducir spam (cada ~2 segundos)
            if (status.positionMillis % 2000 < 500) {
              console.log(`🔍 Reproduciendo ${type}:`, {
                position: Math.round(status.positionMillis / 1000),
                duration: Math.round(status.durationMillis / 1000),
                isPlaying: status.isPlaying
              });
            }

            // ✅ Verificar si terminó
            if (status.didJustFinish) {
              hasFinished = true;
              if (timeoutId) clearTimeout(timeoutId);
              
              console.log(`✅ Audio ${type} terminado correctamente`);
              setIsPlaying(false);
              
              // Limpiar el callback
              preloadedSound.setOnPlaybackStatusUpdate(null);
              resolve(true);
            }
          } else if (status.error) {
            hasFinished = true;
            if (timeoutId) clearTimeout(timeoutId);
            
            console.error(`❌ Error en reproducción ${type}:`, status.error);
            setIsPlaying(false);
            
            // Limpiar el callback
            preloadedSound.setOnPlaybackStatusUpdate(null);
            reject(new Error(status.error));
          }
        });

        // ✅ Timeout de seguridad aumentado a 2 minutos (120 segundos)
        timeoutId = setTimeout(() => {
          if (!hasFinished) {
            hasFinished = true;
            console.log(`⏰ Timeout para audio ${type} después de 120s, asumiendo que terminó`);
            setIsPlaying(false);
            
            // Limpiar el callback
            preloadedSound.setOnPlaybackStatusUpdate(null);
            resolve(true);
          }
        }, 120000); // 120 segundos = 2 minutos

        // Iniciar reproducción DESPUÉS de configurar el callback
        preloadedSound.playAsync().then(async () => {
          setSound(preloadedSound);
          soundRef.current = preloadedSound;
          
          // Verificar que realmente esté reproduciéndose
          const playStatus = await preloadedSound.getStatusAsync();
          console.log(`🔍 Estado después de playAsync ${type}:`, {
            isLoaded: playStatus.isLoaded,
            isPlaying: playStatus.isPlaying,
            durationMillis: playStatus.durationMillis
          });
          
          console.log(`✅ Audio ${type} reproduciéndose...`);
        }).catch((err) => {
          if (!hasFinished) {
            hasFinished = true;
            if (timeoutId) clearTimeout(timeoutId);
            
            console.error(`❌ Error iniciando reproducción ${type}:`, err);
            setIsPlaying(false);
            
            // Limpiar el callback
            preloadedSound.setOnPlaybackStatusUpdate(null);
            reject(err);
          }
        });
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
          progressUpdateIntervalMillis: 500,
          androidImplementation: 'MediaPlayer'
        }
      );

      setSound(newSound);
      soundRef.current = newSound;
      console.log(`✅ Audio ${type} reproduciéndose...`);

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
              
              console.log(`✅ Audio ${type} terminado correctamente`);
              setIsPlaying(false);
              
              newSound.setOnPlaybackStatusUpdate(null);
              resolve(true);
            }
          } else if (status.error) {
            hasFinished = true;
            if (timeoutId) clearTimeout(timeoutId);
            
            console.error(`❌ Error en reproducción ${type}:`, status.error);
            setIsPlaying(false);
            
            newSound.setOnPlaybackStatusUpdate(null);
            reject(new Error(status.error));
          }
        });

        // Timeout de seguridad de 2 minutos
        timeoutId = setTimeout(() => {
          if (!hasFinished) {
            hasFinished = true;
            console.log(`⏰ Timeout para audio ${type} después de 120s`);
            setIsPlaying(false);
            
            newSound.setOnPlaybackStatusUpdate(null);
            resolve(true);
          }
        }, 120000);
      });

    } catch (err) {
      console.error('❌ Error reproduciendo audio:', err);
      setError(err.message);
      setIsPlaying(false);
      throw err;
    }
  }, [configureAudioMode]);

  // ✅ MEJORADO: Detener audio de forma más robusta
  const stopAudio = useCallback(async () => {
    try {
      console.log('🛑 Deteniendo audio...');
      
      // 1. Detener audio principal si existe
      if (soundRef.current) {
        try {
          // Limpiar callbacks antes de detener
          soundRef.current.setOnPlaybackStatusUpdate(null);
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
        } catch (err) {
          console.log('⚠️ Error deteniendo audio principal:', err);
        }
        soundRef.current = null;
        setSound(null);
      }
      
      // 2. Detener todos los audios precargados
      for (const [type, sound] of Object.entries(preloadedSounds)) {
        if (sound) {
          try {
            sound.setOnPlaybackStatusUpdate(null);
            await sound.stopAsync();
            await sound.unloadAsync();
          } catch (err) {
            console.log(`⚠️ Error deteniendo audio precargado ${type}:`, err);
          }
        }
      }
      
      // 3. Limpiar estado
      setIsPlaying(false);
      setError(null);
      
      console.log('✅ Audio detenido completamente');
    } catch (error) {
      console.error('❌ Error deteniendo audio:', error);
    }
  }, [preloadedSounds]);

  // Limpiar audios precargados
  const clearPreloadedSounds = useCallback(async () => {
    try {
      console.log('🧹 Limpiando audios precargados...');
      for (const [type, sound] of Object.entries(preloadedSounds)) {
        if (sound) {
          try {
            // Limpiar callback antes de descargar
            sound.setOnPlaybackStatusUpdate(null);
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
        soundRef.current.setOnPlaybackStatusUpdate(null);
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