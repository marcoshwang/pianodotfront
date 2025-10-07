import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { usePractice } from '../context/PracticeContext';

const PianoScreen = ({ navigation, route, styles, triggerVibration, stop, settings, getCurrentSizeConfig, getCurrentContrastConfig }) => {
  const score = route.params?.score;
  const playAudio = route.params?.playAudio;
  const ttsUrl = route.params?.ttsUrl;
  const pianoUrl = route.params?.pianoUrl;
  
  // Contexto de práctica
  const { playAudioFromUrl, playPreloadedAudio, preloadAudio, stopAudio, clearPreloadedSounds, isPlaying } = usePractice();
  
  // Estado local
  const [isReproducing, setIsReproducing] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [shouldAutoPlay, setShouldAutoPlay] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Función para reproducir ambos audios (ya precargados)
  const reproduceAudios = useCallback(async () => {
    if (hasPlayed) {
      console.log('🎵 Audio ya reproducido, saltando...');
      return;
    }
    
    try {
      setIsReproducing(true);
      setHasPlayed(true); // Marcar como reproducido inmediatamente
      console.log('🎵 Marcando audio como reproducido');
      
      console.log('🎵 Reproduciendo audio Piano (melodía)...');
      try {
        await playPreloadedAudio('Piano');
      } catch (error) {
        console.log('⚠️ Fallback a playAudioFromUrl para Piano');
        await playAudioFromUrl(pianoUrl, 'Piano');
      }
      
      console.log('🎵 Reproduciendo audio TTS (instrucciones)...');
      try {
        await playPreloadedAudio('TTS');
      } catch (error) {
        console.log('⚠️ Fallback a playAudioFromUrl para TTS');
        await playAudioFromUrl(ttsUrl, 'TTS');
      }
      
      console.log('✅ Todos los audios reproducidos');
    } catch (error) {
      console.error('❌ Error reproduciendo audios:', error);
    } finally {
      setIsReproducing(false);
    }
  }, [playPreloadedAudio, playAudioFromUrl, pianoUrl, ttsUrl, hasPlayed]);

  // Resetear estado cuando se entra a la pantalla (solo si viene de ControlsScreen)
  useFocusEffect(
    useCallback(() => {
      // Solo resetear si viene con playAudio=true (desde ControlsScreen) y no se ha inicializado
      if (playAudio && !hasInitialized) {
        setHasPlayed(false);
        setShouldAutoPlay(true);
        setHasInitialized(true);
        console.log('🔄 PianoScreen: Inicializando estado para reproducción');
      } else if (playAudio && hasInitialized) {
        console.log('🔄 PianoScreen: Ya inicializado, no reseteando estado');
      }
    }, [playAudio, hasInitialized])
  );

  // Efecto para reproducir audio cuando se carga la pantalla
  useEffect(() => {
    if (playAudio && ttsUrl && pianoUrl && !hasPlayed && shouldAutoPlay) {
      console.log('🎵 PianoScreen: Iniciando reproducción de audios...');
      reproduceAudios();
    } else if (playAudio && hasPlayed) {
      console.log('🎵 PianoScreen: Audio ya reproducido, no se reproduce automáticamente');
    } else if (playAudio && !shouldAutoPlay) {
      console.log('🎵 PianoScreen: Auto-reproducción deshabilitada');
    }
  }, [playAudio, ttsUrl, pianoUrl, hasPlayed, shouldAutoPlay, reproduceAudios]);

  const handleGoBack = async () => {
    triggerVibration();
    
    // Detener audio si está reproduciéndose
    if (isPlaying || isReproducing) {
      console.log('🛑 Deteniendo audio al salir de PianoScreen...');
      await stopAudio();
      setIsReproducing(false);
    }
    
    // Limpiar audios precargados para evitar conflictos
    await clearPreloadedSounds();
    
    // Limpiar estado para evitar conflictos
    setHasPlayed(true); // Marcar como reproducido para evitar reproducción automática
    
    stop();
    navigation.goBack();
  };

  const handleControls = () => {
    triggerVibration();
    navigation.navigate('Controls', { score });
  };


  // Función para determinar si necesita separar el texto según el tamaño
  const getControlesText = () => {
    // Si el tamaño de fuente es grande o extra grande, separar el texto
    if ( settings?.fontSize === 'extraLarge') {
      return 'CONTROLES';
    }
    return 'CONTROLES';
  };

  // Función para obtener el padding vertical del botón controles
  const getControlesPadding = () => {
    if (settings?.fontSize === 'normal') {
      return sizeConfig.buttonPadding * 9;
    }
    return sizeConfig.buttonPadding * 5;
  };

  // Obtener configuraciones dinámicas
  const sizeConfig = getCurrentSizeConfig();
  const contrastConfig = getCurrentContrastConfig();


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
          accessibilityHint="Regresar a los detalles de la partitura"
        >
          <Text style={styles.backButtonText}>VOLVER</Text>
        </TouchableOpacity>
      </View>

        <View style={styles.content}>
          <ScrollView
            style={styles.pianoScrollContainer}
            contentContainerStyle={styles.pianoScrollContent}
            showsVerticalScrollIndicator={true}
            showsHorizontalScrollIndicator={true}
          >
            <View style={styles.pianoContainer}>
              <Image
                source={require('../../img/piano-stretched.png')}
                style={[
                  styles.pianoImage,
                  {
                    minHeight: sizeConfig.buttonText * 8,
                    maxHeight: sizeConfig.buttonText * 12,
                  }
                ]}
                resizeMode="contain"
                accessibilityLabel="Teclado de piano"
              />
            </View>
          </ScrollView>


          <View style={styles.pianoControls}>
            <TouchableOpacity
              style={[
                styles.controlsButton,
                {
                  paddingVertical: getControlesPadding(),
                }
              ]}
              onPress={handleControls}
              accessibilityLabel="Controles"
              accessibilityRole="button"
              accessibilityHint="Abrir controles de reproducción"
            >
              <Text style={styles.controlsButtonText}>{getControlesText()}</Text>
            </TouchableOpacity>
          </View>
        </View>
    </SafeAreaView>
  );
};

export default PianoScreen;
