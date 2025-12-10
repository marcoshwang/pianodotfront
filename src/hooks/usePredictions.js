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
      setLoading(true);
      setError(null);
      
      const details = await getPartituraDetails(partituraId);
      setPartituraDetails(details);
      
      return details;
    } catch (err) {
      console.error('Error obteniendo detalles:', err);
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
      const preds = await getPartituraPredicciones(partituraId);
      setPredictions(preds);
      return preds;
    } catch (err) {
      console.error('Error obteniendo predicciones:', err);
      setError(err.message);
      throw err;
    }
  }, [partituraId]);

  // Función para iniciar polling si está procesando
  const startPolling = useCallback(() => {
    if (isPolling) return;
    
    setIsPolling(true);
    
    const pollInterval = setInterval(async () => {
      try {
        const details = await fetchPartituraDetails();
        
        if (details.status !== 'pending') {
          clearInterval(pollInterval);
          setIsPolling(false);
          
          if (details.status === 'ready') {
            await fetchPredictions();
          }
        }
      } catch (err) {
        console.error('Error en polling:', err);
        clearInterval(pollInterval);
        setIsPolling(false);
      }
    }, 3000);
    
    setTimeout(() => {
      clearInterval(pollInterval);
      setIsPolling(false);
    }, 120000);
  }, [isPolling, fetchPartituraDetails, fetchPredictions]);

  // Función para refrescar datos
  const refreshData = useCallback(async () => {
    try {
      const details = await fetchPartituraDetails();
      
      if (details.status === 'ready') {
        await fetchPredictions();
      } else if (details.status === 'pending') {
        startPolling();
      }
    } catch (err) {
      console.error('Error refrescando datos:', err);
    }
  }, [fetchPartituraDetails, fetchPredictions, startPolling]);

  // Cargar datos iniciales
  useEffect(() => {
    if (!partituraId) return;
    
    const loadInitialData = async () => {
      try {
        const details = await fetchPartituraDetails();
        
        if (details.status === 'ready') {
          await fetchPredictions();
        } else if (details.status === 'pending') {
          startPolling();
        }
      } catch (err) {
        console.error('Error cargando datos iniciales:', err);
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
    partituraDetails,
    predictions,
    loading,
    error,
    isPolling,
    
    refreshData,
    fetchPartituraDetails,
    fetchPredictions,

    isProcessing: partituraDetails?.status === 'pending',
    isReady: partituraDetails?.status === 'ready',
    hasError: partituraDetails?.status === 'error',
    hasPredictions: predictions && predictions.length > 0,
  };
};
