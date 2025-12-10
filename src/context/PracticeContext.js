import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import {
  startPractice,
  getNextCompas,
  getPrevCompas,
  repeatCompas,
  getTTSAudio,
  getPianoAudio,
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

  // Guardar progreso automáticamente cuando cambia la práctica
  useEffect(() => {
    if (currentPractice && currentPartituraId) {
      saveProgress(currentPartituraId, currentPractice);
    }
  }, [currentPractice, currentPartituraId, currentCompas]);

  // Función para guardar el progreso de una partitura
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
      const summary = {
        partituraId,
        currentCompas: progressData.currentCompas,
        lastUpdated: progressData.lastUpdated,
        hasPractice: !!practice,
        hasAudioUrls: !!(practice?.audio_piano && practice?.audio_tts)
      };
    } catch (err) {
      console.error('Error guardando progreso:', err);
    }
  }, [currentCompas]);

  // Función para cargar el progreso de una partitura específica
  const loadProgress = useCallback(async (partituraId) => {
    try {
      const progressKey = `practice_progress_${partituraId}`;
      const savedProgress = await AsyncStorage.getItem(progressKey);
      
      if (savedProgress) {
        const progressData = JSON.parse(savedProgress);
        return progressData;
      }
      return null;
    } catch (err) {
      console.error('Error cargando progreso:', err);
      return null;
    }
  }, []);

  // Función para obtener resumen de compases
  const getProgressSummary = useCallback(async (partituraId) => {
    try {
      const resumen = await getCompasesResumen(partituraId);
      return resumen;
    } catch (err) {
      console.error(' Error obteniendo resumen:', err);
      return null;
    }
  }, []);

  // Función para limpiar el progreso de una partitura
  const clearProgress = useCallback(async (partituraId) => {
    try {
      const progressKey = `practice_progress_${partituraId}`;
      await AsyncStorage.removeItem(progressKey);
    } catch (err) {
      console.error('Error limpiando progreso:', err);
    }
  }, []);

  //startNewPractice sin llamar al backend (evita generación de audio)
  const startNewPractice = useCallback(async (partituraId, fromBeginning = false) => {
    setIsLoading(true);
    setError(null);
    try {
      
      // Si es desde el inicio, limpiar progreso guardado
      if (fromBeginning) {
        await clearProgress(partituraId);
      }
      
      // Si NO es desde el inicio, intentar cargar progreso guardado
      if (!fromBeginning) {
        const savedProgress = await loadProgress(partituraId);
        
        if (savedProgress && savedProgress.practice) {
          setCurrentPractice(savedProgress.practice);
          setCurrentCompas(savedProgress.currentCompas);
          setCurrentPartituraId(partituraId);
          return savedProgress.practice;
        }
      }
      
      // Si es desde inicio O no hay progreso guardado, iniciar desde cero
      
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
        setCurrentCompas(currentPractice.state?.last_compas || currentPractice.current_compas);
        return currentPractice;
      } else {
        return await startNewPractice(partituraId, false);
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
      console.error(' No hay ID de partitura disponible');
      setError('No partitura ID available.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedPractice = await getNextCompas(currentPartituraId);
      setCurrentPractice(updatedPractice);
      setCurrentCompas(updatedPractice.state.last_compas);
      return updatedPractice;
    } catch (err) {
      console.error('Error en nextCompas:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentPartituraId]);

  const prevCompas = useCallback(async () => {
    if (!currentPartituraId) {
      console.error('No hay ID de partitura disponible');
      setError('No partitura ID available.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedPractice = await getPrevCompas(currentPartituraId);
      setCurrentPractice(updatedPractice);
      setCurrentCompas(updatedPractice.state.last_compas);
      return updatedPractice;
    } catch (err) {
      console.error('Error en prevCompas:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentPartituraId]);

  const repeatCurrentCompas = useCallback(async () => {
    if (!currentPartituraId) {
      console.error('No hay ID de partitura disponible');
      setError('No partitura ID available.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const updatedPractice = await repeatCompas(currentPartituraId);
      setCurrentPractice(updatedPractice);
      setCurrentCompas(updatedPractice.state.last_compas);
      return updatedPractice;
    } catch (err) {
      console.error('Error en repeatCurrentCompas:', err);
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

    if (audioCache[cacheKey]) {
      return audioCache[cacheKey];
    }

    try {
      setIsLoading(true);
      setError(null);

      const practiceResponse = await startPractice(id);

      const ttsBlob = await getTTSAudio(id, compas);

      const pianoBlob = await getPianoAudio(id, compas);

      const audioData = {
        ttsBlob: ttsBlob,
        pianoBlob: pianoBlob,
        compas: compas,
        partituraId: id
      };

      setAudioCache(prev => ({
        ...prev,
        [cacheKey]: audioData
      }));

      return audioData;
    } catch (err) {
      console.error('Error obteniendo audio TTS:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentPractice, currentCompas, audioCache]);

  // Función para establecer el ID de la partitura actual
  const setPartituraId = useCallback((partituraId) => {
    setCurrentPartituraId(partituraId);
  }, []);

  // Limpiar práctica y opcionalmente el progreso guardado
  const clearPractice = useCallback(async (alsoDeleteProgress = false) => {
    
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
    setAudioCache({});
  }, []);

  //Función para reiniciar el progreso de una partitura
  const resetProgress = useCallback(async (partituraId) => {
    try {
      await clearProgress(partituraId);
      
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
      
    } catch (err) {
      console.error('Error reiniciando progreso:', err);
      throw err;
    }
  }, [currentPartituraId, clearProgress]);

  const value = {
    currentPractice,
    currentCompas,
    isLoading,
    error: error || audioError,
    audioCache,
    isPlaying,
    sound,
    currentPartituraId,

    startNewPractice,
    continuePractice,
    nextCompas,
    prevCompas,
    repeatCurrentCompas,
    
    getCompasAudio,
    playAudioFromUrl,
    playPreloadedAudio,
    preloadAudio,
    stopAudio,
    clearPreloadedSounds,

    clearPractice,
    clearAudioCache,
    resetProgress,
    loadProgress,
    getProgressSummary,
    saveProgress,

    setPartituraId,

    hasActivePractice: !!currentPractice,
    isPracticeActive: !!currentPractice && !!currentCompas,
  };

  return (
    <PracticeContext.Provider value={value}>
      {children}
    </PracticeContext.Provider>
  );
};