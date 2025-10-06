import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useScoreProgress } from '../hooks/useScoreProgress';

const ScoreDetailScreen = ({ navigation, route, styles, triggerVibration, stop }) => {
  const score = route.params?.score;
  
  const { progress, loading, updateProgress } = useScoreProgress(score?.name);

  const handleGoBack = () => {
    triggerVibration();
    stop();
    navigation.goBack();
  };

  const handleStartFromBeginning = () => {
    triggerVibration();
    navigation.navigate('Piano', { score });
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

      <View style={styles.content}>
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

        <View style={styles.scoreDetailContainer}>
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
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ScoreDetailScreen;
