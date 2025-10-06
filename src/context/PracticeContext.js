import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  
  // Audio cache
  const [audioCache, setAudioCache] = useState({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSound, setCurrentSound] = useState(null);

  // Cargar estado guardado al inicializar
  useEffect(() => {
    loadSavedPractice();
  }, []);

  // Guardar estado cuando cambie
  useEffect(() => {
    if (currentPractice) {
      savePracticeState();
    }
  }, [currentPractice, currentCompas]);

  // Cargar práctica guardada desde AsyncStorage
  const loadSavedPractice = async () => {
    try {
      const savedPractice = await AsyncStorage.getItem('currentPractice');
      if (savedPractice) {
        const practice = JSON.parse(savedPractice);
        setCurrentPractice(practice);
        setCurrentCompas(practice.current_compas);
        console.log('📚 Práctica cargada:', practice);
      }
    } catch (error) {
      console.error('❌ Error cargando práctica guardada:', error);
    }
  };

  // Guardar estado de práctica
  const savePracticeState = async () => {
    try {
      const practiceState = {
        ...currentPractice,
        currentCompas,
        lastUpdated: new Date().toISOString()
      };
      await AsyncStorage.setItem('currentPractice', JSON.stringify(practiceState));
    } catch (error) {
      console.error('❌ Error guardando práctica:', error);
    }
  };

  // Iniciar nueva práctica
  const startNewPractice = useCallback(async (partituraId) => {
    try {
      console.log('🎵 Iniciando nueva práctica:', partituraId);
      setIsLoading(true);
      setError(null);

      const practice = await startPractice(partituraId);
      console.log('✅ Práctica iniciada:', practice);
      
      setCurrentPractice(practice);
      setCurrentCompas(practice.current_compas || 1);
      
      return practice;
    } catch (err) {
      console.error('❌ Error iniciando práctica:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Continuar práctica existente
  const continuePractice = useCallback(async (partituraId) => {
    try {
      console.log('🔄 Continuando práctica:', partituraId);
      setIsLoading(true);
      setError(null);

      // Si ya tenemos una práctica activa para esta partitura, usar esa
      if (currentPractice && currentPractice.partitura_id === partituraId) {
        console.log('✅ Usando práctica existente');
        return currentPractice;
      }

      // Si no, iniciar nueva práctica
      return await startNewPractice(partituraId);
    } catch (err) {
      console.error('❌ Error continuando práctica:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentPractice, startNewPractice]);

  // Siguiente compás
  const nextCompas = useCallback(async () => {
    if (!currentPractice) {
      throw new Error('No hay práctica activa');
    }

    try {
      console.log('⏭️ Siguiente compás');
      setIsLoading(true);
      setError(null);

      const compas = await getNextCompas(currentPractice.partitura_id);
      console.log('✅ Siguiente compás obtenido:', compas);
      
      setCurrentCompas(compas.compas_number);
      return compas;
    } catch (err) {
      console.error('❌ Error obteniendo siguiente compás:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentPractice]);

  // Compás anterior
  const prevCompas = useCallback(async () => {
    if (!currentPractice) {
      throw new Error('No hay práctica activa');
    }

    try {
      console.log('⏮️ Compás anterior');
      setIsLoading(true);
      setError(null);

      const compas = await getPrevCompas(currentPractice.partitura_id);
      console.log('✅ Compás anterior obtenido:', compas);
      
      setCurrentCompas(compas.compas_number);
      return compas;
    } catch (err) {
      console.error('❌ Error obteniendo compás anterior:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentPractice]);

  // Repetir compás actual
  const repeatCurrentCompas = useCallback(async () => {
    if (!currentPractice) {
      throw new Error('No hay práctica activa');
    }

    try {
      console.log('🔄 Repitiendo compás actual');
      setIsLoading(true);
      setError(null);

      const compas = await repeatCompas(currentPractice.partitura_id);
      console.log('✅ Compás repetido:', compas);
      
      setCurrentCompas(compas.compas_number);
      return compas;
    } catch (err) {
      console.error('❌ Error repitiendo compás:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentPractice]);

  // Obtener audio TTS para compás específico
  const getCompasAudio = useCallback(async (compasNumber = null) => {
    if (!currentPractice) {
      throw new Error('No hay práctica activa');
    }

    const compas = compasNumber || currentCompas;
    const cacheKey = `${currentPractice.partitura_id}_${compas}`;

    // Verificar cache
    if (audioCache[cacheKey]) {
      console.log('🎵 Audio desde cache:', cacheKey);
      return audioCache[cacheKey];
    }

    try {
      console.log('🎵 Obteniendo audio TTS para compás:', compas);
      setIsLoading(true);
      setError(null);

      // Llamar al endpoint POST /practice/{id}/start para obtener el audio
      const practiceResponse = await startPractice(currentPractice.partitura_id);
      console.log('✅ Respuesta de práctica:', practiceResponse);
      
      // La respuesta contiene el path del archivo MP3
      const audioPath = practiceResponse.audio;
      console.log('🎵 Path del audio:', audioPath);

      // Convertir path local a URL HTTP
      const audioUrl = `http://127.0.0.1:8000/audio/${currentPractice.partitura_id}/compas_${compas}.mp3`;
      console.log('🎵 URL del audio:', audioUrl);

      const audioData = {
        path: audioPath,
        url: audioUrl,
        compas: compas,
        partituraId: currentPractice.partitura_id
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

  // Reproducir audio
  const playAudio = useCallback(async (audioBlob) => {
    try {
      console.log('🎵 Reproduciendo audio...');
      setIsPlaying(true);
      
      // Aquí se implementaría la reproducción real del audio
      // Por ahora solo simulamos
      console.log('✅ Audio reproducido');
      
      return true;
    } catch (err) {
      console.error('❌ Error reproduciendo audio:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsPlaying(false);
    }
  }, []);

  // Limpiar práctica
  const clearPractice = useCallback(() => {
    console.log('🧹 Limpiando práctica');
    setCurrentPractice(null);
    setCurrentCompas(null);
    setError(null);
    setAudioCache({});
    setCurrentSound(null);
    setIsPlaying(false);
  }, []);

  // Limpiar cache de audio
  const clearAudioCache = useCallback(() => {
    console.log('🧹 Limpiando cache de audio');
    setAudioCache({});
  }, []);

  const value = {
    // Estado
    currentPractice,
    currentCompas,
    isLoading,
    error,
    audioCache,
    isPlaying,
    currentSound,
    
    // Funciones de práctica
    startNewPractice,
    continuePractice,
    nextCompas,
    prevCompas,
    repeatCurrentCompas,
    getCompasAudio,
    playAudio,
    
    // Utilidades
    clearPractice,
    clearAudioCache,
    
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

export default PracticeContext;