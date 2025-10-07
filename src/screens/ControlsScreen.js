import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
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
    setPartituraId, // ✅ AÑADIDO
  } = usePractice();

  // Estados locales
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isLoadingRepeat, setIsLoadingRepeat] = useState(false);
  const [isLoadingNext, setIsLoadingNext] = useState(false); // ✅ AÑADIDO
  const [isLoadingPrev, setIsLoadingPrev] = useState(false); // ✅ AÑADIDO

  // ✅ AÑADIDO: Establecer el ID de partitura al montar el componente
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

  // Botón 1: Reproducir compás (Audio TTS) - Obtener ambos audios
  const handlePlayCompas = async () => {
    try {
      triggerVibration();
      console.log('🎵 Obteniendo audios para partitura:', score.id);
      
      setIsLoadingAudio(true);
      
      console.log('🔍 Score ID que estamos usando:', score.id);
      console.log('🔍 Score completo:', score);
      
      // Primero iniciar la práctica si no existe
      if (!hasActivePractice) {
        console.log('🚀 Iniciando nueva práctica...');
        await startNewPractice(score.id);
        console.log('✅ Práctica iniciada');
      }
      
      // Primero generar los archivos (si no existen)
      console.log('🚀 Generando archivos de audio...');
      const practiceResponse = await startPractice(score.id);
      console.log('✅ Archivos generados:', practiceResponse);
      
      // ✅ MEJORADO: Usar el compás actual de la práctica
      const compasActual = currentCompas || 1;
      
      // URLs de los audios
      const ttsUrl = `http://10.0.2.2:8000/partituras/${score.id}/audio_tts/${compasActual}`;
      const pianoUrl = `http://10.0.2.2:8000/partituras/${score.id}/audio_piano/${compasActual}`;
      
      // Precargar audios antes de navegar
      console.log('🎵 Precargando audios...');
      await preloadAudio(pianoUrl, 'Piano');
      await preloadAudio(ttsUrl, 'TTS');
      console.log('✅ Audios precargados');
      
      // TIMESTAMP ÚNICO para forzar reproducción
      const playTimestamp = Date.now();
      
      // Navegar a PianoScreen para reproducir los audios
      console.log('🎵 Navegando a PianoScreen para reproducir audios...');
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
      console.log('🔍 ID de partitura global:', currentPartituraId);
      
      if (!currentPartituraId) {
        console.warn('⚠️ No hay ID de partitura, no se puede repetir compás');
        Alert.alert('Error', 'No hay una partitura seleccionada. Primero inicia una práctica.');
        return;
      }

      setIsLoadingRepeat(true);
      
      const updatedPractice = await repeatCurrentCompas();
      console.log('✅ Compás repetido exitosamente');
      console.log('🎵 Navegando a PianoScreen para reproducir audios repetidos...');
      
      // URLs de los audios
      const pianoUrl = `http://10.0.2.2:8000/partituras/${currentPartituraId}/audio_piano/${updatedPractice.state.last_compas}`;
      const ttsUrl = `http://10.0.2.2:8000/partituras/${currentPartituraId}/audio_tts/${updatedPractice.state.last_compas}`;
      
      // Precargar audios nuevamente
      console.log('🎵 Precargando audios para repetir...');
      await preloadAudio(pianoUrl, 'Piano');
      await preloadAudio(ttsUrl, 'TTS');
      console.log('✅ Audios precargados para repetir');
      
      const playTimestamp = Date.now();
      
      // Navegar a PianoScreen con los nuevos audios
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

  // ✅ MEJORADO: Botón 3: Siguiente compás
  const handleNextCompas = async () => {
    try {
      triggerVibration();
      console.log('⏭️ Siguiente compás');
      
      if (!currentPartituraId) {
        console.warn('⚠️ No hay ID de partitura, no se puede avanzar');
        Alert.alert('Error', 'No hay una partitura seleccionada. Primero inicia una práctica.');
        return;
      }

      setIsLoadingNext(true);
      
      // Avanzar al siguiente compás
      const updatedPractice = await nextCompas();
      console.log('✅ Siguiente compás cargado:', updatedPractice);
      
      // URLs de los audios del nuevo compás
      const pianoUrl = `http://10.0.2.2:8000/partituras/${currentPartituraId}/audio_piano/${updatedPractice.state.last_compas}`;
      const ttsUrl = `http://10.0.2.2:8000/partituras/${currentPartituraId}/audio_tts/${updatedPractice.state.last_compas}`;
      
      // Precargar audios
      console.log('🎵 Precargando audios para siguiente compás...');
      await preloadAudio(pianoUrl, 'Piano');
      await preloadAudio(ttsUrl, 'TTS');
      console.log('✅ Audios precargados para siguiente compás');
      
      const playTimestamp = Date.now();
      
      // Navegar a PianoScreen para reproducir
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

  // ✅ MEJORADO: Botón 4: Compás anterior
  const handlePrevCompas = async () => {
    try {
      triggerVibration();
      console.log('⏮️ Compás anterior');
      
      if (!currentPartituraId) {
        console.warn('⚠️ No hay ID de partitura, no se puede retroceder');
        Alert.alert('Error', 'No hay una partitura seleccionada. Primero inicia una práctica.');
        return;
      }

      setIsLoadingPrev(true);
      
      // Retroceder al compás anterior
      const updatedPractice = await prevCompas();
      console.log('✅ Compás anterior cargado:', updatedPractice);
      
      // URLs de los audios del compás anterior
      const pianoUrl = `http://10.0.2.2:8000/partituras/${currentPartituraId}/audio_piano/${updatedPractice.state.last_compas}`;
      const ttsUrl = `http://10.0.2.2:8000/partituras/${currentPartituraId}/audio_tts/${updatedPractice.state.last_compas}`;
      
      // Precargar audios
      console.log('🎵 Precargando audios para compás anterior...');
      await preloadAudio(pianoUrl, 'Piano');
      await preloadAudio(ttsUrl, 'TTS');
      console.log('✅ Audios precargados para compás anterior');
      
      const playTimestamp = Date.now();
      
      // Navegar a PianoScreen para reproducir
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
                opacity: (practiceLoading || !hasActivePractice || isLoadingRepeat) ? 0.7 : 1,
              }
            ]}
            onPress={handleRepeatCompas}
            disabled={practiceLoading || !hasActivePractice || isLoadingRepeat}
            accessibilityLabel="Repetir compás"
            accessibilityRole="button"
            accessibilityHint="Presionar para repetir el compás actual"
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
            accessibilityHint="Presionar para avanzar al siguiente compás"
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
            accessibilityHint="Presionar para retroceder al compás anterior"
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