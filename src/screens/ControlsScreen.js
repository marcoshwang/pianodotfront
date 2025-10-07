import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
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
      console.log('🎵 Estableciendo ID de partitura en ControlsScreen:', score.id);
      setPartituraId(score.id);
    }
  }, [score?.id, setPartituraId]);

  // Limpiar audio cuando se sale de ControlsScreen
  useFocusEffect(
    useCallback(() => {
      return () => {
        console.log('🧹 Limpiando audio al salir de ControlsScreen...');
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

  // ✅ MODIFICADO: Botón 1 - Reproducir compás (con respeto al progreso guardado)
  const handlePlayCompas = async () => {
    try {
      triggerVibration();
      console.log('🎵 Reproduciendo compás para partitura:', score.id);
      
      setIsLoadingAudio(true);
      
      // Iniciar la práctica si no existe (cargará progreso guardado automáticamente)
      if (!hasActivePractice) {
        console.log('🚀 Cargando práctica...');
        
        // Verificar si debe iniciar desde el principio
        const startFromBeginning = await AsyncStorage.getItem(`start_from_beginning_${score.id}`);
        
        if (startFromBeginning === 'true') {
          console.log('🆕 Iniciando desde compás 1');
          await startNewPractice(score.id, true); // true = desde inicio
          await AsyncStorage.removeItem(`start_from_beginning_${score.id}`);
        } else {
          console.log('📂 Cargando progreso guardado');
          await startNewPractice(score.id, false); // false = cargar progreso
        }
        
        console.log('✅ Práctica lista, compás actual:', currentCompas);
      }
      
      const compasActual = currentCompas || 1;
      console.log('🎵 Compás a reproducir:', compasActual);
      
      // SOLO AQUÍ generamos los archivos de audio (cuando el usuario presiona reproducir)
      console.log('🚀 Generando archivos de audio...');
      const practiceResponse = await startPractice(score.id);
      console.log('✅ Archivos generados:', practiceResponse);
      
      // URLs de los audios
      const ttsUrl = `http://10.0.2.2:8000/partituras/${score.id}/audio_tts/${compasActual}`;
      const pianoUrl = `http://10.0.2.2:8000/partituras/${score.id}/audio_piano/${compasActual}`;
      
      // Precargar audios
      console.log('🎵 Precargando audios...');
      await preloadAudio(pianoUrl, 'Piano');
      await preloadAudio(ttsUrl, 'TTS');
      console.log('✅ Audios precargados');
      
      const playTimestamp = Date.now();
      
      // Navegar a PianoScreen
      console.log('🎵 Navegando a PianoScreen...');
      navigation.navigate('Piano', { 
        score,
        playAudio: true,
        playTimestamp,
        ttsUrl,
        pianoUrl
      });
      
    } catch (error) {
      console.error('❌ Error obteniendo audios:', error);
      Alert.alert('Error', 'No se pudieron obtener los audios');
    } finally {
      setIsLoadingAudio(false);
    }
  };

  // Botón 2: Repetir compás
  const handleRepeatCompas = async () => {
    try {
      triggerVibration();
      console.log('🔄 Repitiendo compás actual...');
      
      if (!currentPartituraId) {
        Alert.alert('Error', 'No hay una partitura seleccionada. Primero inicia una práctica.');
        return;
      }

      setIsLoadingRepeat(true);
      
      const updatedPractice = await repeatCurrentCompas();
      console.log('✅ Compás repetido exitosamente');
      
      // URLs de los audios
      const pianoUrl = `http://10.0.2.2:8000/partituras/${currentPartituraId}/audio_piano/${updatedPractice.state.last_compas}`;
      const ttsUrl = `http://10.0.2.2:8000/partituras/${currentPartituraId}/audio_tts/${updatedPractice.state.last_compas}`;
      
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
      console.error('❌ Error repitiendo compás:', error);
      Alert.alert('Error', 'No se pudo repetir el compás');
    } finally {
      setIsLoadingRepeat(false);
    }
  };

  // Botón 3: Siguiente compás
  const handleNextCompas = async () => {
    try {
      triggerVibration();
      console.log('⏭️ Siguiente compás');
      
      if (!currentPartituraId) {
        Alert.alert('Error', 'No hay una partitura seleccionada. Primero inicia una práctica.');
        return;
      }

      setIsLoadingNext(true);
      
      const updatedPractice = await nextCompas();
      console.log('✅ Siguiente compás cargado:', updatedPractice);
      
      // URLs de los audios
      const pianoUrl = `http://10.0.2.2:8000/partituras/${currentPartituraId}/audio_piano/${updatedPractice.state.last_compas}`;
      const ttsUrl = `http://10.0.2.2:8000/partituras/${currentPartituraId}/audio_tts/${updatedPractice.state.last_compas}`;
      
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
      console.error('❌ Error avanzando compás:', error);
      Alert.alert('Error', 'No se pudo avanzar al siguiente compás');
    } finally {
      setIsLoadingNext(false);
    }
  };

  // Botón 4: Compás anterior
  const handlePrevCompas = async () => {
    try {
      triggerVibration();
      console.log('⏮️ Compás anterior');
      
      if (!currentPartituraId) {
        Alert.alert('Error', 'No hay una partitura seleccionada. Primero inicia una práctica.');
        return;
      }

      setIsLoadingPrev(true);
      
      const updatedPractice = await prevCompas();
      console.log('✅ Compás anterior cargado:', updatedPractice);
      
      // URLs de los audios
      const pianoUrl = `http://10.0.2.2:8000/partituras/${currentPartituraId}/audio_piano/${updatedPractice.state.last_compas}`;
      const ttsUrl = `http://10.0.2.2:8000/partituras/${currentPartituraId}/audio_tts/${updatedPractice.state.last_compas}`;
      
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
      console.error('❌ Error retrocediendo compás:', error);
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
      return 'REPRODU' + '\n' + 'CIR COMPÁS';
    }
    return 'REPRODUCIR' + '\n' + 'COMPÁS';
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
                opacity: (practiceLoading || !hasActivePractice || isLoadingRepeat) ? 0.7 : 1,
              }
            ]}
            onPress={handleRepeatCompas}
            disabled={practiceLoading || !hasActivePractice || isLoadingRepeat}
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
                opacity: (practiceLoading || !hasActivePractice || isLoadingNext) ? 0.7 : 1,
              }
            ]}
            onPress={handleNextCompas}
            disabled={practiceLoading || !hasActivePractice || isLoadingNext}
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
                opacity: (practiceLoading || !hasActivePractice || isLoadingPrev) ? 0.7 : 1,
              }
            ]}
            onPress={handlePrevCompas}
            disabled={practiceLoading || !hasActivePractice || isLoadingPrev}
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
      </View>
    </SafeAreaView>
  );
};

export default ControlsScreen;