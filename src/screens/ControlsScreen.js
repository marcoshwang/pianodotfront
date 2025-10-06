import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { usePractice } from '../context/PracticeContext';

const ControlsScreen = ({ navigation, route, styles, triggerVibration, stop, settings, getCurrentSizeConfig, getCurrentContrastConfig }) => {
  const score = route.params?.score;
  
  // Contexto de práctica
  const {
    currentPractice,
    currentCompas,
    isLoading: practiceLoading,
    error: practiceError,
    startNewPractice,
    continuePractice,
    nextCompas,
    prevCompas,
    repeatCurrentCompas,
    getCompasAudio,
    playAudio,
    hasActivePractice,
  } = usePractice();

  // Estados locales
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  // Inicializar práctica cuando se carga la pantalla
  useEffect(() => {
    if (score?.id) {
      console.log('🎵 Inicializando práctica para score:', score.id);
      initializePractice();
    }
  }, [score?.id]);

  const handleGoBack = () => {
    triggerVibration();
    stop();
    navigation.goBack();
  };

  // Inicializar práctica
  const initializePractice = async () => {
    try {
      console.log('🎵 Inicializando práctica para:', score.id);
      await continuePractice(score.id);
    } catch (error) {
      console.error('❌ Error inicializando práctica:', error);
      Alert.alert('Error', 'No se pudo inicializar la práctica');
    }
  };

  // Botón 1: Reproducir compás (Audio TTS)
  const handlePlayCompas = async () => {
    try {
      triggerVibration();
      console.log('🎵 Reproduciendo compás:', currentCompas);
      
      setIsLoadingAudio(true);
      
      // Obtener audio del compás actual
      const audioBlob = await getCompasAudio(currentCompas);
      console.log('✅ Audio obtenido, reproduciendo...');
      
      // Reproducir audio
      await playAudio(audioBlob);
      setIsPlaying(true);
      
    } catch (error) {
      console.error('❌ Error reproduciendo compás:', error);
      Alert.alert('Error', 'No se pudo reproducir el compás');
    } finally {
      setIsLoadingAudio(false);
    }
  };

  // Botón 2: Repetir compás
  const handleRepeatCompas = async () => {
    try {
      triggerVibration();
      console.log('🔄 Repitiendo compás');
      await repeatCurrentCompas();
      console.log('✅ Compás repetido');
    } catch (error) {
      console.error('❌ Error repitiendo compás:', error);
      Alert.alert('Error', 'No se pudo repetir el compás');
    }
  };

  // Botón 3: Siguiente compás
  const handleNextCompas = async () => {
    try {
      triggerVibration();
      console.log('⏭️ Siguiente compás');
      await nextCompas();
      console.log('✅ Siguiente compás cargado');
    } catch (error) {
      console.error('❌ Error avanzando compás:', error);
      Alert.alert('Error', 'No se pudo avanzar al siguiente compás');
    }
  };

  // Botón 4: Compás anterior
  const handlePrevCompas = async () => {
    try {
      triggerVibration();
      console.log('⏮️ Compás anterior');
      await prevCompas();
      console.log('✅ Compás anterior cargado');
    } catch (error) {
      console.error('❌ Error retrocediendo compás:', error);
      Alert.alert('Error', 'No se pudo retroceder al compás anterior');
    }
  };

  // Obtener configuraciones dinámicas
  const sizeConfig = getCurrentSizeConfig();
  const contrastConfig = getCurrentContrastConfig();

  // Función para determinar si necesita separar el texto según el tamaño
  const getReproducirText = () => {
    if (settings?.fontSize === 'large' || settings?.fontSize === 'extraLarge') {
      return 'REPRODU' + '\n' + 'CIR COMPÁS';
    }
    return 'REPRODUCIR' + '\n' + 'COMPÁS';
  };

  // Función para obtener el padding vertical de los botones de control
  const getControlPadding = () => {
    if (settings?.fontSize === 'normal') {
      return sizeConfig.buttonPadding * 3;
    }
    return sizeConfig.buttonPadding * 1.2;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
          accessibilityLabel="Volver"
          accessibilityRole="button"
          accessibilityHint="Regresar a la pantalla anterior"
        >
          <Text style={styles.backButtonText}>VOLVER</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.controlsContainer}>

        <View style={styles.controlsButtonsContainer}>
          {/* Botón 1: Reproducir compás */}
          <TouchableOpacity
            style={[
              styles.controlButton,
              {
                paddingVertical: getControlPadding(),
                opacity: (practiceLoading || isLoadingAudio) ? 0.7 : 1,
              }
            ]}
            onPress={handlePlayCompas}
            disabled={practiceLoading || isLoadingAudio}
            accessibilityLabel="Reproducir compás"
            accessibilityRole="button"
            accessibilityHint="Presionar para reproducir el compás actual"
          >
            {isLoadingAudio ? (
              <ActivityIndicator size="small" color={contrastConfig.textColor} />
            ) : (
              <Text style={styles.controlButtonText}>{getReproducirText()}</Text>
            )}
          </TouchableOpacity>

          {/* Botón 2: Repetir compás */}
          <TouchableOpacity
            style={[
              styles.controlButton,
              {
                paddingVertical: getControlPadding(),
                opacity: practiceLoading ? 0.7 : 1,
              }
            ]}
            onPress={handleRepeatCompas}
            disabled={practiceLoading}
            accessibilityLabel="Repetir compás"
            accessibilityRole="button"
            accessibilityHint="Presionar para repetir el compás actual"
          >
            <Text style={styles.controlButtonText}>REPETIR{'\n'}COMPÁS</Text>
          </TouchableOpacity>

          {/* Botón 3: Siguiente compás */}
          <TouchableOpacity
            style={[
              styles.controlButton,
              {
                paddingVertical: getControlPadding(),
                opacity: practiceLoading ? 0.7 : 1,
              }
            ]}
            onPress={handleNextCompas}
            disabled={practiceLoading}
            accessibilityLabel="Siguiente compás"
            accessibilityRole="button"
            accessibilityHint="Presionar para avanzar al siguiente compás"
          >
            <Text style={styles.controlButtonText}>SIGUIENTE{'\n'}COMPÁS</Text>
          </TouchableOpacity>

          {/* Botón 4: Compás anterior */}
          <TouchableOpacity
            style={[
              styles.controlButton,
              {
                paddingVertical: getControlPadding(),
                opacity: practiceLoading ? 0.7 : 1,
              }
            ]}
            onPress={handlePrevCompas}
            disabled={practiceLoading}
            accessibilityLabel="Anterior compás"
            accessibilityRole="button"
            accessibilityHint="Presionar para retroceder al compás anterior"
          >
            <Text style={styles.controlButtonText}>ANTERIOR{'\n'}COMPÁS</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ControlsScreen;