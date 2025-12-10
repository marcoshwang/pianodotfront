import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useScoreProgress } from '../hooks/useScoreProgress';
import { usePredictions } from '../hooks/usePredictions';
import { usePractice } from '../context/PracticeContext';
import { useFocusEffect } from '@react-navigation/native';
import { getPartituraPredicciones } from '../../services/pianodotApi';

const ScoreDetailScreen = ({ navigation, route, styles, triggerVibration, stop }) => {
  const score = route.params?.score;
  
  const { progress, loading, updateProgress } = useScoreProgress(score?.name);
  const {
    partituraDetails,
    predictions,
    loading: predictionsLoading,
    error: predictionsError,
    isPolling,
    isProcessing,
    isReady,
    hasError,
    hasPredictions,
    refreshData,
  } = usePredictions(score?.id);
  
  const { 
    setPartituraId, 
    loadProgress, 
    getProgressSummary,
    startNewPractice 
  } = usePractice();
  
  const [showStatus, setShowStatus] = useState(false);
  const [savedProgress, setSavedProgress] = useState(null);
  const [progressSummary, setProgressSummary] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(true);

  //Cargar progreso guardado cuando se enfoca la pantalla
  useFocusEffect(
    React.useCallback(() => {
      if (score?.id) {
        loadSavedProgress();
      }
    }, [score?.id])
  );

  //Función para cargar progreso guardado y calcular con predicciones
  const loadSavedProgress = async () => {
    try {
      setLoadingProgress(true);
      
      // Cargar progreso guardado localmente
      const localProgress = await loadProgress(score.id);
      setSavedProgress(localProgress);
      
      // Obtener predicciones para calcular total de compases
      const predicciones = await getPartituraPredicciones(score.id);
      
      let totalCompases = 0;
      
      // La estructura es: { partitura_id: "...", predicciones: [...] }
      if (predicciones?.predicciones && Array.isArray(predicciones.predicciones)) {
        // Encontrar el número de compás más alto
        const compasesUnicos = [...new Set(predicciones.predicciones.map(evento => evento.compas))];
        totalCompases = Math.max(...compasesUnicos);
      } 
      
      
      // Obtener resumen del backend
      const resumen = await getProgressSummary(score.id);
      
      // Combinar datos
      const progressData = {
        compases_visitados: resumen?.compases_visitados || 0,
        total_compases: totalCompases,
      };
      
      setProgressSummary(progressData);
    } catch (err) {
      console.error('Error cargando progreso:', err);
      console.error('Error stack:', err.stack);
    } finally {
      setLoadingProgress(false);
    }
  };

  // Navegar automáticamente cuando la partitura esté lista (solo si el popup está visible)
  useEffect(() => {
    if (showStatus && isReady) {
      navigation.navigate('Piano', { score });
    }
  }, [showStatus, isReady, navigation, score]);

  const handleGoBack = () => {
    triggerVibration();
    stop();
    navigation.goBack();
  };

  // Iniciar desde el principio (SIN generar audio)
  const handleStartFromBeginning = async () => {
    triggerVibration();
    
    // Si la partitura ya está lista, establecer ID global y navegar
    if (isReady) {
      setPartituraId(score.id);
      
      // Solo establecer el flag para iniciar desde el principio
      // NO llamar a startNewPractice aquí para evitar generación de audio
      await AsyncStorage.setItem(`start_from_beginning_${score.id}`, 'true');
      
      navigation.navigate('Piano', { score, fromBeginning: true });
      return;
    }
    
    // Si está procesando o pendiente, mostrar popup
    if (isProcessing || partituraDetails?.status === 'pending') {
      setShowStatus(true);
    }
  };

  // Continuar desde el progreso guardado (SIN generar audio)
  const handleContinueFromProgress = async () => {
    triggerVibration();
    
    if (isReady) {
      setPartituraId(score.id);
      
      // Solo establecer el flag para continuar desde progreso
      // NO llamar a startNewPractice aquí para evitar generación de audio
      await AsyncStorage.removeItem(`start_from_beginning_${score.id}`);
      
      navigation.navigate('Piano', { score, continueFromProgress: true });
      return;
    }
    
    // Si está procesando o pendiente, mostrar popup
    if (isProcessing || partituraDetails?.status === 'pending') {
      setShowStatus(true);
    }
  };

  //Calcular porcentaje de progreso
  const getProgressPercentage = () => {
    if (!progressSummary || !savedProgress) return 0;
    
    const { total_compases } = progressSummary;
    const { currentCompas } = savedProgress;
    
    if (!total_compases || total_compases === 0) return 0;
    
    // Calcular progreso basado en compás actual / total de compases
    return Math.round((currentCompas / total_compases) * 100);
  };

  if (!score) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleGoBack}
            accessibilityLabel="Volver atrás"
            accessibilityRole="button"
            accessibilityHint="Regresar a la pantalla anterior"
          >
            <Text style={styles.backButtonText}>VOLVER</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          <Text style={styles.description}>Error: No se encontró la partitura seleccionada</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleGoBack}
          accessibilityLabel="Volver atrás"
          accessibilityRole="button"
          accessibilityHint="Regresar a Mis Partituras"
        >
          <Text style={styles.backButtonText}>VOLVER</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/*Progreso guardado con datos reales del backend */}
        {loadingProgress ? (
          <View style={styles.progressInfo}>
            <ActivityIndicator size="small" color="#FF9500" />
            <Text style={styles.progressText}>Cargando progreso...</Text>
          </View>
        ) : savedProgress && progressSummary ? (
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              Progreso guardado: {getProgressPercentage()}%
            </Text>
            <Text style={styles.progressSubtext}>
              Compás actual: {savedProgress.currentCompas} de {progressSummary.total_compases || 'calculando...'}
            </Text>
            <Text style={styles.progressSubtext}>
              Última sesión: {new Date(savedProgress.lastUpdated).toLocaleDateString('es-ES')}
            </Text>
          </View>
        ) : savedProgress ? (
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              Progreso guardado detectado
            </Text>
            <Text style={styles.progressSubtext}>
              Compás actual: {savedProgress.currentCompas}
            </Text>
            <Text style={styles.progressSubtext}>
              Última sesión: {new Date(savedProgress.lastUpdated).toLocaleDateString('es-ES')}
            </Text>
          </View>
        ) : null}

        {/* Botones de acción */}
        <View style={styles.actionButtonsContainer}>
          {savedProgress ? (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleContinueFromProgress}
                accessibilityLabel="Continuar desde donde se quedó"
                accessibilityRole="button"
                accessibilityHint="Continuar la partitura desde el último punto guardado"
              >
                <Text style={styles.actionButtonText}>
                  SEGUIR DESDE COMPÁS {savedProgress.currentCompas}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleStartFromBeginning}
                accessibilityLabel="Comenzar desde el principio"
                accessibilityRole="button"
                accessibilityHint="Comenzar la partitura desde el inicio"
              >
                <Text style={styles.actionButtonText}>DESDE INICIO</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleStartFromBeginning}
              accessibilityLabel="Comenzar a tocar la partitura"
              accessibilityRole="button"
              accessibilityHint="Comenzar a tocar esta partitura"
            >
              <Text style={styles.actionButtonText}>COMENZAR A TOCAR</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Contenedor del popup de estado de procesamiento */}
      {showStatus && (isProcessing || predictionsLoading) && (
        <View style={styles.popupContainer}>
          <View style={styles.statusPopup}>
            <View style={styles.statusPopupContent}>
              <ActivityIndicator size="large" color="#FF9500" />
              <Text style={styles.statusTitle}>Realizando proceso de conversión</Text>
              <Text style={styles.statusSubtext}>Por favor espera mientras procesamos tu partitura...</Text>
              
              <TouchableOpacity
                style={styles.okButton}
                onPress={() => {
                  setShowStatus(false);
                  // Si está lista, navegar
                  if (isReady) {
                    navigation.navigate('Piano', { score });
                  }
                }}
              >
                <Text style={styles.okButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default ScoreDetailScreen;