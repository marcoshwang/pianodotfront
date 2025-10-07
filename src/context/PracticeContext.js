import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import {
  startPractice,
  getNextCompas,
  getPrevCompas,
  repeatCompas,
  getTTSAudio,
  getCompasesResumen,
  getPartituraPredicciones
} from '../../services/pianodotApi';

const PracticeContext = createContext();

export const usePractice = () => {
  const context = useContext(PracticeContext);
  if (!context) {
    throw new Error('usePractice debe ser usado dentro de PracticeProvider');
  }
  return context;
};

export const PracticeProvider = ({ children }) => {
  // Estado de la práctica actual
  const [currentPractice, setCurrentPractice] = useState(null);
  const [currentCompas, setCurrentCompas] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Variable global para el ID de la partitura actual
  const [currentPartituraId, setCurrentPartituraId] = useState(null);
  
  // Audio cache
  const [audioCache, setAudioCache] = useState({});
  
  // Usar el hook personalizado para manejo de audio
  const { playAudioFromUrl, playPreloadedAudio, preloadAudio, stopAudio, clearPreloadedSounds, isPlaying, error: audioError, sound } = useAudioPlayer();

  // ✅ Guardar progreso automáticamente cuando cambia la práctica
  useEffect(() => {
    if (currentPractice && currentPartituraId) {
      saveProgress(currentPartituraId, currentPractice);
    }
  }, [currentPractice, currentPartituraId, currentCompas]);

  // ✅ Función para guardar el progreso de una partitura
  const saveProgress = useCallback(async (partituraId, practice) => {
    try {
      const progressKey = `practice_progress_${partituraId}`;
      const progressData = {
        partituraId,
        currentCompas: practice.state?.last_compas || currentCompas || 1,
        lastUpdated: new Date().toISOString(),
        practice: practice
      };
      
      await AsyncStorage.setItem(progressKey, JSON.stringify(progressData));
      console.log(`💾 Progreso guardado para partitura ${partituraId}:`, progressData);
    } catch (err) {
      console.error('❌ Error guardando progreso:', err);
    }
  }, [currentCompas]);

  // ✅ Función para cargar el progreso de una partitura específica
  const loadProgress = useCallback(async (partituraId) => {
    try {
      const progressKey = `practice_progress_${partituraId}`;
      const savedProgress = await AsyncStorage.getItem(progressKey);
      
      if (savedProgress) {
        const progressData = JSON.parse(savedProgress);
        console.log(`📂 Progreso cargado para partitura ${partituraId}:`, progressData);
        return progressData;
      }
      
      console.log(`📂 No hay progreso guardado para partitura ${partituraId}`);
      return null;
    } catch (err) {
      console.error('❌ Error cargando progreso:', err);
      return null;
    }
  }, []);

  // ✅ Función para obtener resumen de compases (progreso real del backend)
  const getProgressSummary = useCallback(async (partituraId) => {
    try {
      const resumen = await getCompasesResumen(partituraId);
      console.log(`📊 Resumen de compases para ${partituraId}:`, resumen);
      return resumen;
    } catch (err) {
      console.error('❌ Error obteniendo resumen:', err);
      return null;
    }
  }, []);

  // ✅ Función para limpiar el progreso de una partitura
  const clearProgress = useCallback(async (partituraId) => {
    try {
      const progressKey = `practice_progress_${partituraId}`;
      await AsyncStorage.removeItem(progressKey);
      console.log(`🧹 Progreso eliminado para partitura ${partituraId}`);
    } catch (err) {
      console.error('❌ Error limpiando progreso:', err);
    }
  }, []);

  // ✅ MODIFICADO: startNewPractice sin llamar al backend (evita generación de audio)
  const startNewPractice = useCallback(async (partituraId, fromBeginning = false) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('🚀 Iniciando práctica para partitura:', partituraId);
      console.log('🔍 Desde el principio:', fromBeginning);
      
      // Si es desde el inicio, limpiar progreso guardado
      if (fromBeginning) {
        console.log('🧹 Limpiando progreso guardado...');
        await clearProgress(partituraId);
      }
      
      // Si NO es desde el inicio, intentar cargar progreso guardado
      if (!fromBeginning) {
        const savedProgress = await loadProgress(partituraId);
        
        if (savedProgress && savedProgress.practice) {
          console.log('📂 Restaurando progreso guardado desde compás:', savedProgress.currentCompas);
          setCurrentPractice(savedProgress.practice);
          setCurrentCompas(savedProgress.currentCompas);
          setCurrentPartituraId(partituraId);
          return savedProgress.practice;
        }
      }
      
      // Si es desde inicio O no hay progreso guardado, iniciar desde cero
      console.log('🆕 Iniciando desde compás 1 (sin llamar al backend todavía)');
      
      // NO llamar a startPractice aquí para evitar generación de audio
      // Solo establecer el estado inicial
      const initialPractice = {
        partitura_id: partituraId,
        state: {
          last_compas: 1,
        },
        current_compas: 1,
      };
      
      setCurrentPractice(initialPractice);
      setCurrentCompas(1);
      setCurrentPartituraId(partituraId);
      
      return initialPractice;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [loadProgress, clearProgress]);

  const continuePractice = useCallback(async (partituraId) => {
    setIsLoading(true);
    setError(null);
    try {
      if (currentPractice && currentPractice.partitura_id === partituraId) {
        console.log('✅ Continuando práctica existente:', currentPractice);
        setCurrentCompas(currentPractice.state?.last_compas || currentPractice.current_compas);
        return currentPractice;
      } else {
        console.log('🔄 Iniciando nueva práctica para:', partituraId);
        return await startNewPractice(partituraId, false); // false = cargar progreso si existe
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentPractice, startNewPractice]);

  const nextCompas = useCallback(async () => {
    if (!currentPartituraId) {
      console.error('❌ No hay ID de partitura disponible');
      setError('No partitura ID available.');
      return;
    }
    
    console.log('⏭️ Iniciando avance a siguiente compás...');
    console.log('🔍 ID de partitura:', currentPartituraId);
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedPractice = await getNextCompas(currentPartituraId);
      console.log('✅ Siguiente compás obtenido:', updatedPractice);
      setCurrentPractice(updatedPractice);
      setCurrentCompas(updatedPractice.state.last_compas);
      // El progreso se guarda automáticamente por el useEffect
      return updatedPractice;
    } catch (err) {
      console.error('❌ Error en nextCompas:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentPartituraId]);

  const prevCompas = useCallback(async () => {
    if (!currentPartituraId) {
      console.error('❌ No hay ID de partitura disponible');
      setError('No partitura ID available.');
      return;
    }
    
    console.log('⏮️ Iniciando retroceso a compás anterior...');
    console.log('🔍 ID de partitura:', currentPartituraId);
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedPractice = await getPrevCompas(currentPartituraId);
      console.log('✅ Compás anterior obtenido:', updatedPractice);
      setCurrentPractice(updatedPractice);
      setCurrentCompas(updatedPractice.state.last_compas);
      // El progreso se guarda automáticamente por el useEffect
      return updatedPractice;
    } catch (err) {
      console.error('❌ Error en prevCompas:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentPartituraId]);

  const repeatCurrentCompas = useCallback(async () => {
    if (!currentPartituraId) {
      console.error('❌ No hay ID de partitura disponible');
      setError('No partitura ID available.');
      return;
    }
    console.log('🔄 Iniciando repetición de compás...');
    console.log('🔍 ID de partitura:', currentPartituraId);
    console.log('🔍 Compás actual:', currentCompas);
    
    setIsLoading(true);
    setError(null);
    try {
      const updatedPractice = await repeatCompas(currentPartituraId);
      console.log('✅ Compás repetido, nueva práctica:', updatedPractice);
      setCurrentPractice(updatedPractice);
      setCurrentCompas(updatedPractice.state.last_compas);
      // El progreso se guarda automáticamente por el useEffect
      return updatedPractice;
    } catch (err) {
      console.error('❌ Error en repeatCurrentCompas:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentPartituraId, currentCompas]);

  // Obtener audio TTS para compás específico
  const getCompasAudio = useCallback(async (compasNumber = null, partituraId = null) => {
    const compas = compasNumber || currentCompas || 1;
    const id = partituraId || currentPartituraId;

    if (!id) {
      throw new Error('No hay partitura ID disponible');
    }

    const cacheKey = `${id}_${compas}`;

    // Verificar cache
    if (audioCache[cacheKey]) {
      console.log('🎵 Audio desde cache:', cacheKey);
      return audioCache[cacheKey];
    }

    try {
      console.log('🎵 Obteniendo audio TTS para compás:', compas);
      console.log('🔍 Partitura ID:', id);
      setIsLoading(true);
      setError(null);

      // Llamar al endpoint POST /practice/{id}/start para generar los archivos
      const practiceResponse = await startPractice(id);
      console.log('✅ Archivos generados:', practiceResponse);

      // Obtener audio de instrucciones TTS
      const ttsUrl = `http://10.0.2.2:8000/partituras/${id}/audio_tts/${compas}`;
      console.log('🎵 Obteniendo audio TTS desde:', ttsUrl);
      
      const ttsResponse = await fetch(ttsUrl, {
        method: 'GET',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'audio/mpeg',
        },
        timeout: 30000,
      });
      
      if (!ttsResponse.ok) {
        throw new Error(`Error obteniendo audio TTS: ${ttsResponse.status}`);
      }
      const ttsBlob = await ttsResponse.blob();
      console.log('✅ Audio TTS obtenido:', ttsBlob);

      // Obtener audio del piano
      const pianoUrl = `http://10.0.2.2:8000/partituras/${id}/audio_piano/${compas}`;
      console.log('🎵 Obteniendo audio piano desde:', pianoUrl);
      
      const pianoResponse = await fetch(pianoUrl, {
        method: 'GET',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'audio/mpeg',
        },
        timeout: 30000,
      });
      
      if (!pianoResponse.ok) {
        throw new Error(`Error obteniendo audio piano: ${pianoResponse.status}`);
      }
      const pianoBlob = await pianoResponse.blob();
      console.log('✅ Audio piano obtenido:', pianoBlob);

      const audioData = {
        ttsBlob: ttsBlob,
        pianoBlob: pianoBlob,
        compas: compas,
        partituraId: id
      };

      // Guardar en cache
      setAudioCache(prev => ({
        ...prev,
        [cacheKey]: audioData
      }));

      return audioData;
    } catch (err) {
      console.error('❌ Error obteniendo audio TTS:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentPractice, currentCompas, audioCache]);

  // Función para establecer el ID de la partitura actual
  const setPartituraId = useCallback((partituraId) => {
    console.log('🎵 Estableciendo ID de partitura global:', partituraId);
    setCurrentPartituraId(partituraId);
  }, []);

  // ✅ MODIFICADO: Limpiar práctica y opcionalmente el progreso guardado
  const clearPractice = useCallback(async (alsoDeleteProgress = false) => {
    console.log('🧹 Limpiando práctica');
    
    if (alsoDeleteProgress && currentPartituraId) {
      await clearProgress(currentPartituraId);
    }
    
    setCurrentPractice(null);
    setCurrentCompas(null);
    setCurrentPartituraId(null);
    setError(null);
    setAudioCache({});
  }, [currentPartituraId, clearProgress]);

  const clearAudioCache = useCallback(() => {
    console.log('🧹 Limpiando cache de audio');
    setAudioCache({});
  }, []);

  // ✅ Función para reiniciar el progreso de una partitura
  const resetProgress = useCallback(async (partituraId) => {
    try {
      console.log('🔄 Reiniciando progreso para partitura:', partituraId);
      await clearProgress(partituraId);
      
      // Si es la partitura actual, reiniciar también el estado
      if (currentPartituraId === partituraId) {
        const initialPractice = {
          partitura_id: partituraId,
          state: {
            last_compas: 1,
          },
          current_compas: 1,
        };
        setCurrentPractice(initialPractice);
        setCurrentCompas(1);
      }
      
      console.log('✅ Progreso reiniciado exitosamente');
    } catch (err) {
      console.error('❌ Error reiniciando progreso:', err);
      throw err;
    }
  }, [currentPartituraId, clearProgress]);

  const value = {
    // Estados
    currentPractice,
    currentCompas,
    isLoading,
    error: error || audioError,
    audioCache,
    isPlaying,
    sound,
    currentPartituraId,

    // Funciones de práctica
    startNewPractice,
    continuePractice,
    nextCompas,
    prevCompas,
    repeatCurrentCompas,
    
    // Funciones de audio
    getCompasAudio,
    playAudioFromUrl,
    playPreloadedAudio,
    preloadAudio,
    stopAudio,
    clearPreloadedSounds,

    // Funciones de limpieza y progreso
    clearPractice,
    clearAudioCache,
    resetProgress,
    loadProgress,
    getProgressSummary,
    saveProgress,

    // Setters
    setPartituraId,

    // Estados derivados
    hasActivePractice: !!currentPractice,
    isPracticeActive: !!currentPractice && !!currentCompas,
  };

  return (
    <PracticeContext.Provider value={value}>
      {children}
    </PracticeContext.Provider>
  );
};