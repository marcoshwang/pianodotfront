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
    clearPractice,
  } = usePractice();

  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isLoadingRepeat, setIsLoadingRepeat] = useState(false);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [isLoadingPrev, setIsLoadingPrev] = useState(false);
  const [hasLoadedProgress, setHasLoadedProgress] = useState(false);

  // Establecer el ID de partitura al montar y resetear flag de carga
  useEffect(() => {
    if (score?.id) {
      setPartituraId(score.id);
      setHasLoadedProgress(false);
    }
  }, [score?.id, setPartituraId]);

  // Cargar progreso automáticamente cuando se enfoca la pantalla
  useFocusEffect(
    useCallback(() => {
      const loadProgressOnFocus = async () => {
        if (!score?.id || hasLoadedProgress) {
          return;
        }

        const startFromBeginning = await AsyncStorage.getItem(`start_from_beginning_${score.id}`);
        
        if (startFromBeginning === 'true') {
          try {
            const progressKey = `practice_progress_${score.id}`;
            await AsyncStorage.removeItem(progressKey);
          } catch (error) {
            console.error('Error limpiando progreso:', error);
          }
          
          if (hasActivePractice && currentPartituraId === score.id) {
            try {
              await clearPractice();
              setPartituraId(score.id);
            } catch (error) {
              console.error('Error limpiando práctica activa:', error);
            }
          }
          
          setHasLoadedProgress(true);
        } else {
          const hasPracticeForThisScore = hasActivePractice && currentPartituraId === score.id;
          
          if (!hasPracticeForThisScore) {
            try {
              await startNewPractice(score.id, false);
              setHasLoadedProgress(true);
            } catch (error) {
              console.error('Error cargando progreso automáticamente:', error);
            }
          } else {
            setHasLoadedProgress(true);
          }
        }
      };

      loadProgressOnFocus();
      
      return () => {
      };
    }, [score?.id, hasActivePractice, currentPartituraId, startNewPractice, isPlaying, stopAudio, hasLoadedProgress])
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
      if (!hasActivePractice) {
        const startFromBeginning = await AsyncStorage.getItem(`start_from_beginning_${score.id}`);
        
        if (startFromBeginning === 'true') {
          await startNewPractice(score.id, true);
          await AsyncStorage.removeItem(`start_from_beginning_${score.id}`);
        } else {
          await startNewPractice(score.id, false);
        }
        
      }
      
      const compasActual = currentCompas || 1;
      
      const practiceResponse = await startPractice(score.id);
      let pianoUrl, ttsUrl;
      
      if (practiceResponse?.audio_piano && practiceResponse?.audio_tts) {
        pianoUrl = practiceResponse.audio_piano;
        ttsUrl = practiceResponse.audio_tts;
      } else {
        const baseURL = getBaseURL();
        ttsUrl = `${baseURL}/partituras/${score.id}/audio_tts/${compasActual}`;
        pianoUrl = `${baseURL}/partituras/${score.id}/audio_piano/${compasActual}`;
      }
      
      await preloadAudio(pianoUrl, 'Piano');
      await preloadAudio(ttsUrl, 'TTS');
      
      const playTimestamp = Date.now();
      
      navigation.navigate('Piano', { 
        score,
        playAudio: true,
        playTimestamp,
        ttsUrl,
        pianoUrl
      });
      
    } catch (error) {
      console.error('Error obteniendo audios:', error);
      Alert.alert('Error', 'No se pudieron obtener los audios');
    } finally {
      setIsLoadingAudio(false);
    }
  };

  // Botón 2: Repetir compás
  const handleRepeatCompas = async () => {
    try {
      triggerVibration();
      console.log('Repitiendo compás actual...');
      
      if (!currentPartituraId) {
        Alert.alert('Error', 'No hay una partitura seleccionada. Primero inicia una práctica.');
        return;
      }

      setIsLoadingRepeat(true);
      
      const updatedPractice = await repeatCurrentCompas();
      const compasNumber = updatedPractice?.state?.last_compas || updatedPractice?.current_compas || 'N/A';
      
      let pianoUrl, ttsUrl;
      if (updatedPractice?.audio_piano && updatedPractice?.audio_tts) {
        pianoUrl = updatedPractice.audio_piano;
        ttsUrl = updatedPractice.audio_tts;
      } else {
        const baseURL = getBaseURL();
        pianoUrl = `${baseURL}/partituras/${currentPartituraId}/audio_piano/${updatedPractice.state.last_compas}`;
        ttsUrl = `${baseURL}/partituras/${currentPartituraId}/audio_tts/${updatedPractice.state.last_compas}`;
      }
      
      await preloadAudio(pianoUrl, 'Piano');
      await preloadAudio(ttsUrl, 'TTS');
      
      const playTimestamp = Date.now();
      
      navigation.navigate('Piano', {
        score: { id: currentPartituraId },
        playAudio: true,
        playTimestamp,
        pianoUrl,
        ttsUrl
      });
      
    } catch (error) {
      console.error('Error repitiendo compás:', error);
      Alert.alert('Error', 'No se pudo repetir el compás');
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
      const compasNumber = updatedPractice?.state?.last_compas || updatedPractice?.current_compas || 'N/A';
      
      let pianoUrl, ttsUrl;
      if (updatedPractice?.audio_piano && updatedPractice?.audio_tts) {
        pianoUrl = updatedPractice.audio_piano;
        ttsUrl = updatedPractice.audio_tts;
      } else {
        const baseURL = getBaseURL();
        pianoUrl = `${baseURL}/partituras/${currentPartituraId}/audio_piano/${updatedPractice.state.last_compas}`;
        ttsUrl = `${baseURL}/partituras/${currentPartituraId}/audio_tts/${updatedPractice.state.last_compas}`;
      }
      
      try {
        const preloadPromise = Promise.all([
          preloadAudio(pianoUrl, 'Piano'),
          preloadAudio(ttsUrl, 'TTS')
        ]);
        
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout precargando audios')), 10000); // 10 segundos
        });
        
        await Promise.race([preloadPromise, timeoutPromise]);
      } catch (preloadError) {
      }
      
      const playTimestamp = Date.now();

      setIsLoadingNext(false);

      navigation.navigate('Piano', {
        score: { id: currentPartituraId },
        playAudio: true,
        playTimestamp,
        pianoUrl,
        ttsUrl
      });
      
    } catch (error) {
      console.error('Error avanzando compás:', error);
      setIsLoadingNext(false);
      Alert.alert('Error', 'No se pudo avanzar al siguiente compás');
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
      const compasNumber = updatedPractice?.state?.last_compas || updatedPractice?.current_compas || 'N/A';

      let pianoUrl, ttsUrl;
      if (updatedPractice?.audio_piano && updatedPractice?.audio_tts) {
        pianoUrl = updatedPractice.audio_piano;
        ttsUrl = updatedPractice.audio_tts;
      } else {
        const baseURL = getBaseURL();
        pianoUrl = `${baseURL}/partituras/${currentPartituraId}/audio_piano/${updatedPractice.state.last_compas}`;
        ttsUrl = `${baseURL}/partituras/${currentPartituraId}/audio_tts/${updatedPractice.state.last_compas}`;
      }

      await preloadAudio(pianoUrl, 'Piano');
      await preloadAudio(ttsUrl, 'TTS');
      
      const playTimestamp = Date.now();

      navigation.navigate('Piano', {
        score: { id: currentPartituraId },
        playAudio: true,
        playTimestamp,
        pianoUrl,
        ttsUrl
      });
      
    } catch (error) {
      console.error('Error retrocediendo compás:', error);
      Alert.alert('Error', 'No se pudo retroceder al compás anterior');
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