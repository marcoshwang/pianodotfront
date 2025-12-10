import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { usePractice } from '../context/PracticeContext';
import { startPractice } from '../../services/pianodotApi';
import { getBaseURL } from '../../config/api.config';

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
    playAudioFromUrl,
    playPreloadedAudio,
    preloadAudio,
    stopAudio,
    isPlaying,
    hasActivePractice,
    currentPartituraId,
    setPartituraId,
  } = usePractice();

  // Estados locales
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isLoadingRepeat, setIsLoadingRepeat] = useState(false);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [isLoadingPrev, setIsLoadingPrev] = useState(false);

  // Establecer el ID de partitura al montar
  useEffect(() => {
    if (score?.id) {
      setPartituraId(score.id);
    }
  }, [score?.id, setPartituraId]);

  // Limpiar audio cuando se sale de ControlsScreen
  useFocusEffect(
    useCallback(() => {
      return () => {
        if (isPlaying) {
          stopAudio();
        }
      };
    }, [isPlaying, stopAudio])
  );

  const handleGoBack = () => {
    triggerVibration();
    stop();
    navigation.goBack();
  };

  // Botón 1 - Reproducir compás (con respeto al progreso guardado)
  const handlePlayCompas = async () => {
    try {
      triggerVibration();
      
      setIsLoadingAudio(true);
      
      // Iniciar la práctica si no existe (cargará progreso guardado automáticamente)
      if (!hasActivePractice) {
        // Verificar si debe iniciar desde el principio
        const startFromBeginning = await AsyncStorage.getItem(`start_from_beginning_${score.id}`);
        
        if (startFromBeginning === 'true') {
          await startNewPractice(score.id, true); // true = desde inicio
          await AsyncStorage.removeItem(`start_from_beginning_${score.id}`);
        } else {
          await startNewPractice(score.id, false); // false = cargar progreso
        }
      }
      
      const compasActual = currentCompas || 1;

      const practiceResponse = await startPractice(score.id);
      
      // Usar las URLs directas de S3 que vienen en la respuesta del backend
      // El backend devuelve: { audio_piano: "https://s3...", audio_tts: "https://s3..." }
      let pianoUrl, ttsUrl;
      
      if (practiceResponse?.audio_piano && practiceResponse?.audio_tts) {
        // Usar URLs directas de S3
        pianoUrl = practiceResponse.audio_piano;
        ttsUrl = practiceResponse.audio_tts;
      } else {
        // Fallback: construir URLs usando API Gateway (por si el backend no devuelve las URLs)
        const baseURL = getBaseURL();
        ttsUrl = `${baseURL}/partituras/${score.id}/audio_tts/${compasActual}`;
        pianoUrl = `${baseURL}/partituras/${score.id}/audio_piano/${compasActual}`;
      }
      
      // Precargar audios
      await preloadAudio(pianoUrl, 'Piano');
      await preloadAudio(ttsUrl, 'TTS');
      
      const playTimestamp = Date.now();
      
      // Navegar a PianoScreen
      navigation.navigate('Piano', { 
        score,
        playAudio: true,
        playTimestamp,
        ttsUrl,
        pianoUrl
      });
      
    } catch (error) {
      console.error('Error obteniendo audios:', error);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  // Botón 2: Repetir compás
  const handleRepeatCompas = async () => {
    try {
      triggerVibration();
      
      if (!currentPartituraId) {
        Alert.alert('Error', 'No hay una partitura seleccionada. Primero inicia una práctica.');
        return;
      }

      setIsLoadingRepeat(true);
      
      const updatedPractice = await repeatCurrentCompas();
      
      // Usar URLs directas de S3 si están disponibles, sino usar API Gateway
      let pianoUrl, ttsUrl;
      if (updatedPractice?.audio_piano && updatedPractice?.audio_tts) {
        pianoUrl = updatedPractice.audio_piano;
        ttsUrl = updatedPractice.audio_tts;
      } else {
        const baseURL = getBaseURL();
        pianoUrl = `${baseURL}/partituras/${currentPartituraId}/audio_piano/${updatedPractice.state.last_compas}`;
        ttsUrl = `${baseURL}/partituras/${currentPartituraId}/audio_tts/${updatedPractice.state.last_compas}`;
      }
      
      // Precargar audios
      await preloadAudio(pianoUrl, 'Piano');
      await preloadAudio(ttsUrl, 'TTS');
      
      const playTimestamp = Date.now();
      
      // Navegar a PianoScreen
      navigation.navigate('Piano', {
        score: { id: currentPartituraId },
        playAudio: true,
        playTimestamp,
        pianoUrl,
        ttsUrl
      });
      
    } catch (error) {
      console.error('Error repitiendo compás:', error);
    } finally {
      setIsLoadingRepeat(false);
    }
  };

  // Botón 3: Siguiente compás
  const handleNextCompas = async () => {
    try {
      triggerVibration();
      
      if (!currentPartituraId) {
        Alert.alert('Error', 'No hay una partitura seleccionada. Primero inicia una práctica.');
        return;
      }

      setIsLoadingNext(true);
      
      const updatedPractice = await nextCompas();
      
      // Usar URLs directas de S3 si están disponibles, sino usar API Gateway
      let pianoUrl, ttsUrl;
      if (updatedPractice?.audio_piano && updatedPractice?.audio_tts) {
        pianoUrl = updatedPractice.audio_piano;
        ttsUrl = updatedPractice.audio_tts;
      } else {
        const baseURL = getBaseURL();
        pianoUrl = `${baseURL}/partituras/${currentPartituraId}/audio_piano/${updatedPractice.state.last_compas}`;
        ttsUrl = `${baseURL}/partituras/${currentPartituraId}/audio_tts/${updatedPractice.state.last_compas}`;
      }
      
      // Precargar audios
      await preloadAudio(pianoUrl, 'Piano');
      await preloadAudio(ttsUrl, 'TTS');
      
      const playTimestamp = Date.now();
      
      // Navegar a PianoScreen
      navigation.navigate('Piano', {
        score: { id: currentPartituraId },
        playAudio: true,
        playTimestamp,
        pianoUrl,
        ttsUrl
      });
      
    } catch (error) {
      console.error('Error avanzando compás:', error);
    } finally {
      setIsLoadingNext(false);
    }
  };

  // Botón 4: Compás anterior
  const handlePrevCompas = async () => {
    try {
      triggerVibration();
      if (!currentPartituraId) {
        Alert.alert('Error', 'No hay una partitura seleccionada. Primero inicia una práctica.');
        return;
      }

      setIsLoadingPrev(true);
      
      const updatedPractice = await prevCompas();

      // Usar URLs directas de S3 si están disponibles, sino usar API Gateway
      let pianoUrl, ttsUrl;
      if (updatedPractice?.audio_piano && updatedPractice?.audio_tts) {
        pianoUrl = updatedPractice.audio_piano;
        ttsUrl = updatedPractice.audio_tts;
      } else {
        const baseURL = getBaseURL();
        pianoUrl = `${baseURL}/partituras/${currentPartituraId}/audio_piano/${updatedPractice.state.last_compas}`;
        ttsUrl = `${baseURL}/partituras/${currentPartituraId}/audio_tts/${updatedPractice.state.last_compas}`;
      }
      
      // Precargar audios
      await preloadAudio(pianoUrl, 'Piano');
      await preloadAudio(ttsUrl, 'TTS');
      
      const playTimestamp = Date.now();
      
      // Navegar a PianoScreen
      navigation.navigate('Piano', {
        score: { id: currentPartituraId },
        playAudio: true,
        playTimestamp,
        pianoUrl,
        ttsUrl
      });
      
    } catch (error) {
    } finally {
      setIsLoadingPrev(false);
    }
  };

  // Obtener configuraciones dinámicas
  const sizeConfig = getCurrentSizeConfig();
  const contrastConfig = getCurrentContrastConfig();

  const getReproducirText = () => {
    if (settings?.fontSize === 'large' || settings?.fontSize === 'extraLarge') {
      return 'COMENZAR' + '\n' + 'PRÁCTICA';
    }
    return 'COMENZAR' + '\n' + 'PRÁCTICA';
  };

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
        >
          <Text style={styles.backButtonText}>VOLVER</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{
          justifyContent: 'center',
          paddingTop: sizeConfig.buttonPadding,
          paddingBottom: sizeConfig.buttonPadding * 1.5,
        }}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.controlsButtonsContainer}>
          {/* Botón 1: Reproducir compás */}
          <TouchableOpacity
            style={[
              styles.controlButton,
              {
                paddingVertical: getControlPadding(),
                opacity: (practiceLoading || isLoadingAudio || hasActivePractice || isLoadingRepeat || isLoadingNext || isLoadingPrev) ? 0.7 : 1,
              }
            ]}
            onPress={handlePlayCompas}
            disabled={practiceLoading || isLoadingAudio || hasActivePractice || isLoadingRepeat || isLoadingNext || isLoadingPrev}
            accessibilityLabel="Comenzar práctica"
            accessibilityRole="button"
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
                opacity: (isLoadingAudio || practiceLoading || !hasActivePractice || isLoadingRepeat || isLoadingNext || isLoadingPrev) ? 0.7 : 1,
              }
            ]}
            onPress={handleRepeatCompas}
            disabled={isLoadingAudio || practiceLoading || !hasActivePractice || isLoadingRepeat || isLoadingNext || isLoadingPrev}
            accessibilityLabel="Repetir compás"
            accessibilityRole="button"
          >
            {isLoadingRepeat ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.controlButtonText}>REPETIR{'\n'}COMPÁS</Text>
            )}
          </TouchableOpacity>

          {/* Botón 3: Siguiente compás */}
          <TouchableOpacity
            style={[
              styles.controlButton,
              {
                paddingVertical: getControlPadding(),
                opacity: (isLoadingAudio || practiceLoading || !hasActivePractice || isLoadingNext || isLoadingRepeat || isLoadingPrev) ? 0.7 : 1,
              }
            ]}
            onPress={handleNextCompas}
            disabled={isLoadingAudio || practiceLoading || !hasActivePractice || isLoadingNext || isLoadingRepeat || isLoadingPrev}
            accessibilityLabel="Siguiente compás"
            accessibilityRole="button"
          >
            {isLoadingNext ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.controlButtonText}>SIGUIENTE{'\n'}COMPÁS</Text>
            )}
          </TouchableOpacity>

          {/* Botón 4: Compás anterior */}
          <TouchableOpacity
            style={[
              styles.controlButton,
              {
                paddingVertical: getControlPadding(),
                opacity: (isLoadingAudio || practiceLoading || !hasActivePractice || isLoadingPrev || isLoadingRepeat || isLoadingNext) ? 0.7 : 1,
              }
            ]}
            onPress={handlePrevCompas}
            disabled={isLoadingAudio || practiceLoading || !hasActivePractice || isLoadingPrev || isLoadingRepeat || isLoadingNext}
            accessibilityLabel="Anterior compás"
            accessibilityRole="button"
          >
            {isLoadingPrev ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.controlButtonText}>ANTERIOR{'\n'}COMPÁS</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ControlsScreen;