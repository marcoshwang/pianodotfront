import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { usePractice } from '../context/PracticeContext';

const PianoScreen = ({ navigation, route, styles, triggerVibration, stop, settings, getCurrentSizeConfig, getCurrentContrastConfig }) => {
  const score = route.params?.score;
  const playAudio = route.params?.playAudio;
  const playTimestamp = route.params?.playTimestamp;
  const ttsUrl = route.params?.ttsUrl;
  const pianoUrl = route.params?.pianoUrl;
  
  // Contexto de práctica
  const { playAudioFromUrl, playPreloadedAudio, stopAudio, clearPreloadedSounds, isPlaying } = usePractice();
  
  // Estado local
  const [isReproducing, setIsReproducing] = useState(false);
  
  // Refs para evitar re-renders
  const hasPlayedRef = useRef(false);
  const lastTimestampRef = useRef(null);
  const isMountedRef = useRef(true);
  const isPlayingRef = useRef(isPlaying);
  const isReproducingRef = useRef(isReproducing);
  const stopAudioRef = useRef(stopAudio);

  // Mantener refs actualizados
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
  
  useEffect(() => {
    isReproducingRef.current = isReproducing;
  }, [isReproducing]);
  
  useEffect(() => {
    stopAudioRef.current = stopAudio;
  }, [stopAudio]);

  // Función para reproducir ambos audios (ya precargados)
  const reproduceAudios = useCallback(async () => {
    if (!isMountedRef.current) {
      console.log('🚫 Componente desmontado, cancelando reproducción');
      return;
    }

    if (hasPlayedRef.current) {
      console.log('🎵 Audio ya reproducido para este timestamp');
      return;
    }
    
    try {
      setIsReproducing(true);
      hasPlayedRef.current = true;
      console.log('🎵 Marcando audio como reproducido');
      
      console.log('🎵 Reproduciendo audio Piano (melodía)...');
      try {
        await playPreloadedAudio('Piano');
      } catch (error) {
        console.log('⚠️ Fallback a playAudioFromUrl para Piano');
        await playAudioFromUrl(pianoUrl, 'Piano');
      }
      
      if (!isMountedRef.current) return;
      
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
      if (isMountedRef.current) {
        setIsReproducing(false);
      }
    }
  }, [playPreloadedAudio, playAudioFromUrl, pianoUrl, ttsUrl]);

  // Efecto para reproducir cuando cambia el timestamp
  useEffect(() => {
    if (playAudio && playTimestamp && lastTimestampRef.current !== playTimestamp) {
      console.log('✅ Nuevo timestamp detectado:', playTimestamp);
      lastTimestampRef.current = playTimestamp;
      hasPlayedRef.current = false;
      
      // Pequeño delay para asegurar que el componente esté listo
      const timeoutId = setTimeout(() => {
        if (isMountedRef.current) {
          reproduceAudios();
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [playAudio, playTimestamp, reproduceAudios]);

  // Efecto para limpiar al desmontar (SOLO navigation como dependencia)
  useEffect(() => {
    isMountedRef.current = true;
    console.log('🎬 PianoScreen montado');

    // Listener para cuando pierde el foco
    const unsubscribeBlur = navigation.addListener('blur', () => {
      console.log('🧹 PianoScreen blur - limpiando audio');
      if (isPlayingRef.current || isReproducingRef.current) {
        console.log('🛑 Deteniendo audio por blur...');
        stopAudioRef.current();
      }
    });

    return () => {
      console.log('🧹 PianoScreen desmontando');
      isMountedRef.current = false;
      unsubscribeBlur();
      
      // Limpiar audio al desmontar
      if (isPlayingRef.current || isReproducingRef.current) {
        console.log('🛑 Deteniendo audio por unmount...');
        stopAudioRef.current();
      }
    };
  }, [navigation]); // ✅ SOLO navigation como dependencia

  const handleGoBack = async () => {
    triggerVibration();
    
    // Detener audio si está reproduciéndose
    if (isPlaying || isReproducing) {
      console.log('🛑 Deteniendo audio al presionar volver...');
      await stopAudio();
      setIsReproducing(false);
    }
    
    // Limpiar audios precargados
    await clearPreloadedSounds();
    
    stop();
    navigation.goBack();
  };

  const handleControls = () => {
    triggerVibration();
    navigation.navigate('Controls', { score });
  };

  // Función para determinar si necesita separar el texto según el tamaño
  const getControlesText = () => {
    if (settings?.fontSize === 'extraLarge') {
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