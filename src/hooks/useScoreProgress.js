import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useScoreProgress = (scoreName) => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar progreso al montar el componente
  useEffect(() => {
    if (scoreName) {
      loadProgress();
    }
  }, [scoreName]);

  const loadProgress = async () => {
    try {
      const progressKey = `scoreProgress_${scoreName}`;
      const savedProgress = await AsyncStorage.getItem(progressKey);
      if (savedProgress) {
        setProgress(JSON.parse(savedProgress));
      }
    } catch (error) {
      console.error('Error al cargar progreso:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = async (progressData) => {
    try {
      const progressKey = `scoreProgress_${scoreName}`;
      const progressToSave = {
        ...progressData,
        lastPlayed: new Date().toISOString(),
        scoreName: scoreName
      };
      await AsyncStorage.setItem(progressKey, JSON.stringify(progressToSave));
      setProgress(progressToSave);
      return true;
    } catch (error) {
      console.error('Error al guardar progreso:', error);
      return false;
    }
  };

  const resetProgress = async () => {
    try {
      const progressKey = `scoreProgress_${scoreName}`;
      await AsyncStorage.removeItem(progressKey);
      setProgress(null);
      return true;
    } catch (error) {
      console.error('Error al reiniciar progreso:', error);
      return false;
    }
  };

  const updateProgress = async (percentage, currentPosition, additionalData = {}) => {
    const progressData = {
      percentage: Math.min(100, Math.max(0, percentage)),
      currentPosition,
      ...additionalData
    };
    return await saveProgress(progressData);
  };

  return {
    progress,
    loading,
    saveProgress,
    resetProgress,
    updateProgress,
    loadProgress
  };
};
