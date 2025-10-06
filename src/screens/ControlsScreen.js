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
import { startPractice } from '../../services/pianodotApi';

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

  // No inicializar práctica automáticamente
  // La práctica se iniciará solo cuando se presione "REPRODUCIR COMPÁS"

  const handleGoBack = () => {
    triggerVibration();
    stop();
    navigation.goBack();
  };


  // Botón 1: Reproducir compás (Audio TTS) - Solo generar MP3
  const handlePlayCompas = async () => {
    try {
      triggerVibration();
      console.log('🎵 Generando MP3 para partitura:', score.id);
      
      setIsLoadingAudio(true);
      
      // Llamar directamente al endpoint POST /practice/{id}/start para generar MP3
      const practiceResponse = await startPractice(score.id);
      console.log('✅ MP3 generado exitosamente:', practiceResponse);
      console.log('🎵 Respuesta completa:', practiceResponse);
      console.log('🎵 State:', practiceResponse.state);
      console.log('🎵 Audio path:', practiceResponse.audio);
      
      // Mostrar que se generó correctamente
      Alert.alert('Éxito', 'MP3 generado correctamente. Revisa la consola para ver los detalles.');
      
    } catch (error) {
      console.error('❌ Error generando MP3:', error);
      Alert.alert('Error', 'No se pudo generar el MP3');
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