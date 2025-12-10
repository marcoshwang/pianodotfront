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
  const [hasLoadedProgress, setHasLoadedProgress] = useState(false);

  // Establecer el ID de partitura al montar y resetear flag de carga
  useEffect(() => {
    if (score?.id) {
      setPartituraId(score.id);
      setHasLoadedProgress(false); // Resetear cuando cambia la partitura
    }
  }, [score?.id, setPartituraId]);

  // Cargar progreso automáticamente cuando se enfoca la pantalla
  useFocusEffect(
    useCallback(() => {
      const loadProgressOnFocus = async () => {
        if (!score?.id || hasLoadedProgress) {
          return; // Ya se cargó o no hay partitura
        }

        // Verificar si hay práctica activa para esta partitura
        const hasPracticeForThisScore = hasActivePractice && currentPartituraId === score.id;
        
        if (!hasPracticeForThisScore) {
          try {
            console.log('🔄 Verificando progreso guardado para partitura:', score.id);
            
            // Verificar si debe iniciar desde el principio
            const startFromBeginning = await AsyncStorage.getItem(`start_from_beginning_${score.id}`);
            
            if (startFromBeginning !== 'true') {
              // Cargar progreso guardado automáticamente
              console.log('📂 Cargando progreso guardado automáticamente...');
              await startNewPractice(score.id, false); // false = cargar progreso
              setHasLoadedProgress(true);
              console.log('✅ Progreso cargado automáticamente');
            } else {
              // Si debe iniciar desde el principio, marcar como cargado para evitar reintentos
              setHasLoadedProgress(true);
            }
          } catch (error) {
            console.error('❌ Error cargando progreso automáticamente:', error);
            // No mostrar error al usuario, solo loguear
          }
        } else {
          // Ya hay práctica activa para esta partitura
          setHasLoadedProgress(true);
        }
      };

      loadProgressOnFocus();
      
      return () => {
        // Solo detener audio si realmente está reproduciéndose
        // El cleanup de audio se maneja en PianoScreen cuando pierde foco
        // No necesitamos detener aquí para evitar llamadas duplicadas
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
      
      // Iniciar la práctica si no existe (cargará progreso guardado automáticamente)
      if (!hasActivePractice) {
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
      
      // Usar las URLs directas de S3 que vienen en la respuesta del backend
      // El backend devuelve: { audio_piano: "https://s3...", audio_tts: "https://s3..." }
      let pianoUrl, ttsUrl;
      
      if (practiceResponse?.audio_piano && practiceResponse?.audio_tts) {
        // Usar URLs directas de S3
        pianoUrl = practiceResponse.audio_piano;
        ttsUrl = practiceResponse.audio_tts;
        console.log('✅ Usando URLs directas de S3');
        console.log('🎹 Piano URL:', pianoUrl.substring(0, 100) + '...');
        console.log('🗣️ TTS URL:', ttsUrl.substring(0, 100) + '...');
      } else {
        // Fallback: construir URLs usando API Gateway (por si el backend no devuelve las URLs)
        console.warn('⚠️ No se encontraron URLs directas, usando API Gateway como fallback');
        const baseURL = getBaseURL();
        ttsUrl = `${baseURL}/partituras/${score.id}/audio_tts/${compasActual}`;
        pianoUrl = `${baseURL}/partituras/${score.id}/audio_piano/${compasActual}`;
      }
      
      // Precargar audios
      console.log('🎵 Precargando audios...');
      console.log('🎵 Precargando audio Piano desde URL:', pianoUrl.substring(0, 100) + '...');
      await preloadAudio(pianoUrl, 'Piano');
      console.log('🎵 Precargando audio TTS desde URL:', ttsUrl.substring(0, 100) + '...');
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
      const compasNumber = updatedPractice?.state?.last_compas || updatedPractice?.current_compas || 'N/A';
      console.log(`✅ Compás repetido - Compás: ${compasNumber}`);
      
      // Usar URLs directas de S3 si están disponibles, sino usar API Gateway
      let pianoUrl, ttsUrl;
      if (updatedPractice?.audio_piano && updatedPractice?.audio_tts) {
        pianoUrl = updatedPractice.audio_piano;
        ttsUrl = updatedPractice.audio_tts;
        console.log('✅ Usando URLs directas de S3 desde respuesta');
      } else {
        const baseURL = getBaseURL();
        pianoUrl = `${baseURL}/partituras/${currentPartituraId}/audio_piano/${updatedPractice.state.last_compas}`;
        ttsUrl = `${baseURL}/partituras/${currentPartituraId}/audio_tts/${updatedPractice.state.last_compas}`;
        console.log('⚠️ Usando URLs de API Gateway como fallback');
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
      const compasNumber = updatedPractice?.state?.last_compas || updatedPractice?.current_compas || 'N/A';
      console.log(`✅ Siguiente compás cargado - Compás: ${compasNumber}`);
      
      // Usar URLs directas de S3 si están disponibles, sino usar API Gateway
      let pianoUrl, ttsUrl;
      if (updatedPractice?.audio_piano && updatedPractice?.audio_tts) {
        pianoUrl = updatedPractice.audio_piano;
        ttsUrl = updatedPractice.audio_tts;
        console.log('✅ Usando URLs directas de S3 desde respuesta');
      } else {
        const baseURL = getBaseURL();
        pianoUrl = `${baseURL}/partituras/${currentPartituraId}/audio_piano/${updatedPractice.state.last_compas}`;
        ttsUrl = `${baseURL}/partituras/${currentPartituraId}/audio_tts/${updatedPractice.state.last_compas}`;
        console.log('⚠️ Usando URLs de API Gateway como fallback');
      }
      
      // Precargar audios con manejo de errores y timeout
      try {
        console.log('🎵 Precargando audios para compás:', compasNumber);
        
        // Precargar con timeout para evitar bloqueos
        const preloadPromise = Promise.all([
          preloadAudio(pianoUrl, 'Piano'),
          preloadAudio(ttsUrl, 'TTS')
        ]);
        
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout precargando audios')), 10000); // 10 segundos
        });
        
        await Promise.race([preloadPromise, timeoutPromise]);
        console.log('✅ Audios precargados correctamente');
      } catch (preloadError) {
        console.warn('⚠️ Error precargando audios (continuando de todas formas):', preloadError?.message || preloadError);
        // Continuar incluso si la precarga falla, los audios se pueden cargar en PianoScreen
      }
      
      const playTimestamp = Date.now();
      
      // Resetear estado de carga ANTES de navegar para evitar que se quede cargando
      setIsLoadingNext(false);
      
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
      setIsLoadingNext(false);
      Alert.alert('Error', 'No se pudo avanzar al siguiente compás');
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
      const compasNumber = updatedPractice?.state?.last_compas || updatedPractice?.current_compas || 'N/A';
      console.log(`✅ Compás anterior cargado - Compás: ${compasNumber}`);
      
      // Usar URLs directas de S3 si están disponibles, sino usar API Gateway
      let pianoUrl, ttsUrl;
      if (updatedPractice?.audio_piano && updatedPractice?.audio_tts) {
        pianoUrl = updatedPractice.audio_piano;
        ttsUrl = updatedPractice.audio_tts;
        console.log('✅ Usando URLs directas de S3 desde respuesta');
      } else {
        const baseURL = getBaseURL();
        pianoUrl = `${baseURL}/partituras/${currentPartituraId}/audio_piano/${updatedPractice.state.last_compas}`;
        ttsUrl = `${baseURL}/partituras/${currentPartituraId}/audio_tts/${updatedPractice.state.last_compas}`;
        console.log('⚠️ Usando URLs de API Gateway como fallback');
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