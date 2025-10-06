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
import { useScoreProgress } from '../hooks/useScoreProgress';
import { usePredictions } from '../hooks/usePredictions';

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
  
  const [showStatus, setShowStatus] = useState(false);

  // Navegar automáticamente cuando la partitura esté lista (solo si el popup está visible)
  useEffect(() => {
    if (showStatus && isReady) {
      console.log('🎵 Partitura lista, navegando a Piano...');
      navigation.navigate('Piano', { score });
    }
  }, [showStatus, isReady, navigation, score]);

  const handleGoBack = () => {
    triggerVibration();
    stop();
    navigation.goBack();
  };

  const handleStartFromBeginning = () => {
    triggerVibration();
    
    // Si la partitura ya está lista, navegar directamente
    if (isReady) {
      navigation.navigate('Piano', { score });
      return;
    }
    
    // Si está procesando o pendiente, mostrar popup
    if (isProcessing || partituraDetails?.status === 'pending') {
      setShowStatus(true);
    }
  };

  const handleContinueFromProgress = () => {
    triggerVibration();
    navigation.navigate('Piano', { score, continueFrom: progress });
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

      <ScrollView style={styles.content}>
        {/* Progreso guardado */}
        {progress && (
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              Progreso guardado: 72%
            </Text>
            <Text style={styles.progressSubtext}>
              Última sesión: {new Date(progress.lastPlayed).toLocaleDateString()}
            </Text>
          </View>
        )}

        {/* Botones de acción */}
        <View style={styles.actionButtonsContainer}>
          {progress ? (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleContinueFromProgress}
                accessibilityLabel="Continuar desde donde se quedó"
                accessibilityRole="button"
                accessibilityHint="Continuar la partitura desde el último punto guardado"
              >
                <Text style={styles.actionButtonText}>SEGUIR</Text>
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
      </ScrollView>

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
