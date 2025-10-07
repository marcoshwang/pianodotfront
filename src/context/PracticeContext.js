import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import {
  startPractice,
  getNextCompas,
  getPrevCompas,
  repeatCompas,
  getTTSAudio
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

  // Cargar estado guardado al inicializar
  useEffect(() => {
    loadSavedPractice();
  }, []);

  // Guardar estado cuando cambia
  useEffect(() => {
    if (currentPractice) {
      AsyncStorage.setItem('currentPractice', JSON.stringify(currentPractice));
    } else {
      AsyncStorage.removeItem('currentPractice');
    }
  }, [currentPractice]);

  const loadSavedPractice = async () => {
    try {
      const savedPractice = await AsyncStorage.getItem('currentPractice');
      if (savedPractice) {
        const parsedPractice = JSON.parse(savedPractice);
        setCurrentPractice(parsedPractice);
        setCurrentCompas(parsedPractice.current_compas);
      }
    } catch (err) {
      console.error('Error loading practice from storage:', err);
    }
  };

  const startNewPractice = useCallback(async (partituraId) => {
    setIsLoading(true);
    setError(null);
    try {
      const practice = await startPractice(partituraId);
      setCurrentPractice(practice);
      setCurrentCompas(practice.current_compas);
      return practice;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const continuePractice = useCallback(async (partituraId) => {
    setIsLoading(true);
    setError(null);
    try {
      if (currentPractice && currentPractice.partitura_id === partituraId) {
        console.log('Continuing existing practice:', currentPractice);
        setCurrentCompas(currentPractice.current_compas);
        return currentPractice;
      } else {
        console.log('Starting new practice for:', partituraId);
        return await startNewPractice(partituraId);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentPractice, startNewPractice]);

  const nextCompas = useCallback(async () => {
    if (!currentPractice) {
      setError('No active practice session.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const updatedPractice = await getNextCompas(currentPractice.partitura_id);
      setCurrentPractice(updatedPractice);
      setCurrentCompas(updatedPractice.current_compas);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentPractice]);

  const prevCompas = useCallback(async () => {
    if (!currentPractice) {
      setError('No active practice session.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const updatedPractice = await getPrevCompas(currentPractice.partitura_id);
      setCurrentPractice(updatedPractice);
      setCurrentCompas(updatedPractice.current_compas);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentPractice]);

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
      return updatedPractice; // Devolver la respuesta para usar en ControlsScreen
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
        timeout: 30000, // 30 segundos
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
        timeout: 30000, // 30 segundos
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

  // Limpiar práctica
  const clearPractice = useCallback(() => {
    console.log('🧹 Limpiando práctica');
    setCurrentPractice(null);
    setCurrentCompas(null);
    setCurrentPartituraId(null);
    setError(null);
    setAudioCache({});
  }, []);

  const clearAudioCache = useCallback(() => {
    console.log('🧹 Limpiando cache de audio');
    setAudioCache({});
  }, []);

  const value = {
    currentPractice,
    currentCompas,
    isLoading,
    error: error || audioError,
    audioCache,
    isPlaying,
    sound,

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

    // Variable global para ID de partitura
    currentPartituraId,
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