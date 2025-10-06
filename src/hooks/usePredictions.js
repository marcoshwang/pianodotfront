import { useState, useEffect, useCallback } from 'react';
import { getPartituraDetails, getPartituraPredicciones } from '../../services/pianodotApi';

/**
 * Hook para manejar predicciones de partituras
 * @param {string} partituraId - ID de la partitura
 * @returns {Object} - Estado y funciones de predicciones
 */
export const usePredictions = (partituraId) => {
  const [partituraDetails, setPartituraDetails] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPolling, setIsPolling] = useState(false);

  // Función para obtener detalles de la partitura
  const fetchPartituraDetails = useCallback(async () => {
    if (!partituraId) return;
    
    try {
      console.log('📊 Obteniendo detalles de partitura:', partituraId);
      setLoading(true);
      setError(null);
      
      const details = await getPartituraDetails(partituraId);
      console.log('✅ Detalles obtenidos:', details);
      setPartituraDetails(details);
      
      return details;
    } catch (err) {
      console.error('❌ Error obteniendo detalles:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [partituraId]);

  // Función para obtener predicciones
  const fetchPredictions = useCallback(async () => {
    if (!partituraId) return;
    
    try {
      console.log('🔮 Obteniendo predicciones:', partituraId);
      const preds = await getPartituraPredicciones(partituraId);
      console.log('✅ Predicciones obtenidas:', preds);
      setPredictions(preds);
      return preds;
    } catch (err) {
      console.error('❌ Error obteniendo predicciones:', err);
      setError(err.message);
      throw err;
    }
  }, [partituraId]);

  // Función para iniciar polling si está procesando
  const startPolling = useCallback(() => {
    if (isPolling) return;
    
    console.log('🔄 Iniciando polling para predicciones...');
    setIsPolling(true);
    
    const pollInterval = setInterval(async () => {
      try {
        const details = await fetchPartituraDetails();
        
        // Si ya no está procesando, detener polling
        if (details.status !== 'pending') {
          console.log('✅ Procesamiento completado, deteniendo polling');
          clearInterval(pollInterval);
          setIsPolling(false);
          
          // Obtener predicciones finales
          if (details.status === 'ready') {
            await fetchPredictions();
          }
        }
      } catch (err) {
        console.error('❌ Error en polling:', err);
        clearInterval(pollInterval);
        setIsPolling(false);
      }
    }, 3000); // Polling cada 3 segundos
    
    // Limpiar polling después de 2 minutos máximo
    setTimeout(() => {
      clearInterval(pollInterval);
      setIsPolling(false);
      console.log('⏰ Polling timeout después de 2 minutos');
    }, 120000);
  }, [isPolling, fetchPartituraDetails, fetchPredictions]);

  // Función para refrescar datos
  const refreshData = useCallback(async () => {
    try {
      console.log('🔄 Refrescando datos de partitura...');
      const details = await fetchPartituraDetails();
      
      // Si está listo, obtener predicciones
      if (details.status === 'ready') {
        await fetchPredictions();
      } else if (details.status === 'pending') {
        startPolling();
      }
    } catch (err) {
      console.error('❌ Error refrescando datos:', err);
    }
  }, [fetchPartituraDetails, fetchPredictions, startPolling]);

  // Cargar datos iniciales
  useEffect(() => {
    if (!partituraId) return;
    
    const loadInitialData = async () => {
      try {
        console.log('🚀 Cargando datos iniciales de partitura...');
        const details = await fetchPartituraDetails();
        
        // Si está listo, obtener predicciones
        if (details.status === 'ready') {
          await fetchPredictions();
        } else if (details.status === 'pending') {
          console.log('⏳ Partitura procesándose, iniciando polling...');
          startPolling();
        }
      } catch (err) {
        console.error('❌ Error cargando datos iniciales:', err);
      }
    };
    
    loadInitialData();
  }, [partituraId, fetchPartituraDetails, fetchPredictions, startPolling]);

  // Limpiar polling al desmontar
  useEffect(() => {
    return () => {
      setIsPolling(false);
    };
  }, []);

  return {
    // Estado
    partituraDetails,
    predictions,
    loading,
    error,
    isPolling,
    
    // Funciones
    refreshData,
    fetchPartituraDetails,
    fetchPredictions,
    
    // Estados derivados
    isProcessing: partituraDetails?.status === 'pending',
    isReady: partituraDetails?.status === 'ready',
    hasError: partituraDetails?.status === 'error',
    hasPredictions: predictions && predictions.length > 0,
  };
};
