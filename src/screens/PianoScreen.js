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
import { getTimeline } from '../../services/pianodotApi';

const PianoScreen = ({ navigation, route, styles, triggerVibration, stop, settings, getCurrentSizeConfig, getCurrentContrastConfig }) => {
  const score = route.params?.score;
  const playAudio = route.params?.playAudio;
  const playTimestamp = route.params?.playTimestamp;
  const ttsUrl = route.params?.ttsUrl;
  const pianoUrl = route.params?.pianoUrl;
  
  const { playAudioFromUrl, playPreloadedAudio, stopAudio, clearPreloadedSounds, isPlaying, currentCompas } = usePractice();
  
  const [isReproducing, setIsReproducing] = useState(false);
  const [timeline, setTimeline] = useState(null);
  const [currentKeyImage, setCurrentKeyImage] = useState(null);
  const [audioStartTime, setAudioStartTime] = useState(null);
  const timelineCheckIntervalRef = useRef(null);
  const processedEventsRef = useRef(new Set());
  
  const hasPlayedRef = useRef(false);
  const lastTimestampRef = useRef(null);
  const isMountedRef = useRef(true);
  const isPlayingRef = useRef(isPlaying);
  const isReproducingRef = useRef(isReproducing);
  const stopAudioRef = useRef(stopAudio);
  const isNavigatingAwayRef = useRef(false);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
  
  useEffect(() => {
    isReproducingRef.current = isReproducing;
  }, [isReproducing]);
  
  useEffect(() => {
    stopAudioRef.current = stopAudio;
  }, [stopAudio]);

  // ✅ Mapeo de notas a imágenes de teclas
  const getKeyImageForNote = useCallback((note) => {
    const noteMap = {
      'C': require('../../img/tecladotocado/tecladodo.png'),
      'D': require('../../img/tecladotocado/tecladore.png'),
      'E': require('../../img/tecladotocado/tecladomi.png'),
      'F': require('../../img/tecladotocado/tecladofa.png'),
      'G': require('../../img/tecladotocado/tecladosol.png'),
      'A': require('../../img/tecladotocado/tecladola.png'),
      'B': require('../../img/tecladotocado/tecladosi.png'),
    };
    return noteMap[note?.toUpperCase()] || null;
  }, []);

  // ✅ Función para reproducir ambos audios
  const reproduceAudios = useCallback(async () => {
    if (isNavigatingAwayRef.current || !isMountedRef.current) {
      console.log('🚫 Navegando fuera o desmontado, cancelando reproducción');
      return;
    }

    if (hasPlayedRef.current) {
      console.log('🎵 Audio ya reproducido para este timestamp');
      return;
    }
    
    try {
      setIsReproducing(true);
      hasPlayedRef.current = true;
      
      setCurrentKeyImage(null);
      processedEventsRef.current.clear();
      
      // ⏰ Establecer tiempo de inicio ANTES de reproducir
      const startTime = Date.now();
      setAudioStartTime(startTime);
      console.log('⏰ Inicio de reproducción - Timestamp:', startTime);
      
      console.log('🎵 Reproduciendo Piano...');
      try {
        await playPreloadedAudio('Piano');
      } catch (error) {
        console.log('⚠️ Fallback a playAudioFromUrl para Piano');
        await playAudioFromUrl(pianoUrl, 'Piano');
      }
      
      if (!isMountedRef.current || isNavigatingAwayRef.current) return;
      
      console.log('🎵 Reproduciendo TTS...');
      try {
        await playPreloadedAudio('TTS');
      } catch (error) {
        console.log('⚠️ Fallback a playAudioFromUrl para TTS');
        await playAudioFromUrl(ttsUrl, 'TTS');
      }
      
      console.log('✅ Audios reproducidos correctamente');
    } catch (error) {
      console.error('❌ Error reproduciendo audios:', error);
    } finally {
      if (isMountedRef.current) {
        setIsReproducing(false);
        // ⚠️ NO limpiar audioStartTime aquí - lo necesitamos para el timeline
      }
    }
  }, [playPreloadedAudio, playAudioFromUrl, pianoUrl, ttsUrl]);

  // ✅ Reproducir cuando cambia el timestamp
  useEffect(() => {
    if (playAudio && playTimestamp && lastTimestampRef.current !== playTimestamp) {
      console.log('🎬 Nuevo timestamp detectado:', playTimestamp);
      lastTimestampRef.current = playTimestamp;
      hasPlayedRef.current = false;
      
      const timeoutId = setTimeout(() => {
        if (isMountedRef.current && !isNavigatingAwayRef.current) {
          reproduceAudios();
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [playAudio, playTimestamp, reproduceAudios]);

  // ✅ Obtener timeline del compás actual
  const fetchTimeline = useCallback(async () => {
    if (!score?.id || !currentCompas) {
      console.log('⚠️ No hay score.id o currentCompas');
      return;
    }

    try {
      console.log('📡 Obteniendo timeline para compás:', currentCompas);
      const timelineData = await getTimeline(score.id, currentCompas);
      console.log('✅ Timeline obtenido:', JSON.stringify(timelineData, null, 2));
      setTimeline(timelineData);
    } catch (error) {
      console.error('❌ Error obteniendo timeline:', error);
      setTimeline(null);
    }
  }, [score?.id, currentCompas]);

  useEffect(() => {
    if (score?.id && currentCompas) {
      fetchTimeline();
    }
  }, [score?.id, currentCompas, fetchTimeline]);

  // ✅ FUNCIÓN PRINCIPAL: Verificar eventos del timeline y mostrar teclas
  const checkTimelineEvents = useCallback(() => {
    if (!timeline?.timeline || !audioStartTime) {
      return;
    }

    const elapsedTimeMs = Date.now() - audioStartTime;
    
    // Buscar eventos cercanos al tiempo actual (ventana de ±100ms)
    const currentEvents = timeline.timeline.filter(event => {
      const eventKey = `${event.timestamp_ms}_${event.pitch}`;
      const timeDiff = Math.abs(event.timestamp_ms - elapsedTimeMs);
      
      // Solo procesar eventos dentro de la ventana de tiempo y no procesados previamente
      return timeDiff < 100 && !processedEventsRef.current.has(eventKey);
    });

    if (currentEvents.length > 0) {
      // Ordenar por cercanía al tiempo actual y tomar el primero
      currentEvents.sort((a, b) => {
        const diffA = Math.abs(a.timestamp_ms - elapsedTimeMs);
        const diffB = Math.abs(b.timestamp_ms - elapsedTimeMs);
        return diffA - diffB;
      });

      const event = currentEvents[0];
      const eventKey = `${event.timestamp_ms}_${event.pitch}`;
      
      // Marcar como procesado
      processedEventsRef.current.add(eventKey);
      
      const note = event.pitch?.toUpperCase();
      
      console.log('🎹 NOTA DETECTADA:', {
        nota: note,
        timestamp_evento: event.timestamp_ms,
        tiempo_actual: elapsedTimeMs,
        diferencia: Math.abs(event.timestamp_ms - elapsedTimeMs),
        mano: event.mano
      });

      if (note && /[A-G]/.test(note)) {
        const keyImage = getKeyImageForNote(note);
        
        if (keyImage) {
          console.log('✅ Mostrando tecla:', note, 'Ruta:', keyImage);
          setCurrentKeyImage(keyImage);
          // ✅ NO ocultamos automáticamente - se mantiene hasta la siguiente nota
        } else {
          console.warn('⚠️ No hay imagen para nota:', note);
        }
      }
    }
  }, [timeline, audioStartTime, getKeyImageForNote]);

  // ✅ Intervalo para verificar timeline (cada 50ms para precisión)
  useEffect(() => {
    if (audioStartTime && timeline) {
      console.log('▶️ Iniciando tracking de timeline');
      
      timelineCheckIntervalRef.current = setInterval(() => {
        checkTimelineEvents();
      }, 50);
    } else {
      if (timelineCheckIntervalRef.current) {
        console.log('⏹️ Deteniendo tracking de timeline');
        clearInterval(timelineCheckIntervalRef.current);
        timelineCheckIntervalRef.current = null;
      }
    }

    return () => {
      if (timelineCheckIntervalRef.current) {
        clearInterval(timelineCheckIntervalRef.current);
        timelineCheckIntervalRef.current = null;
      }
    };
  }, [audioStartTime, timeline, checkTimelineEvents]);

  // ✅ Limpieza al desmontar y manejo de navegación
  useEffect(() => {
    isMountedRef.current = true;
    isNavigatingAwayRef.current = false;
    console.log('🎬 PianoScreen montado');

    const unsubscribeBlur = navigation.addListener('blur', () => {
      console.log('👋 Pantalla perdió foco');
      isNavigatingAwayRef.current = true;
      
      if (isPlayingRef.current || isReproducingRef.current) {
        console.log('🛑 Deteniendo audio por blur');
        stopAudioRef.current();
      }
      
      // Limpiar timeline tracking
      if (timelineCheckIntervalRef.current) {
        clearInterval(timelineCheckIntervalRef.current);
        timelineCheckIntervalRef.current = null;
      }
      
      setAudioStartTime(null);
      setCurrentKeyImage(null);
    });

    const unsubscribeFocus = navigation.addListener('focus', () => {
      console.log('👁️ Pantalla recuperó foco');
      isNavigatingAwayRef.current = false;
    });

    return () => {
      console.log('🧹 PianoScreen desmontando');
      isMountedRef.current = false;
      isNavigatingAwayRef.current = true;
      
      unsubscribeBlur();
      unsubscribeFocus();
      
      if (isPlayingRef.current || isReproducingRef.current) {
        stopAudioRef.current();
      }
      
      if (timelineCheckIntervalRef.current) {
        clearInterval(timelineCheckIntervalRef.current);
      }
      
      setCurrentKeyImage(null);
      setAudioStartTime(null);
    };
  }, [navigation]);

  const handleGoBack = async () => {
    triggerVibration();
    isNavigatingAwayRef.current = true;
    
    if (isPlaying || isReproducing) {
      console.log('🛑 Deteniendo audio...');
      await stopAudio();
      setIsReproducing(false);
    }
    
    if (timelineCheckIntervalRef.current) {
      clearInterval(timelineCheckIntervalRef.current);
    }
    
    await clearPreloadedSounds();
    stop();
    navigation.goBack();
  };

  const handleControls = () => {
    triggerVibration();
    navigation.navigate('Controls', { score });
  };

  const getControlesText = () => {
    return settings?.fontSize === 'extraLarge' ? 'CONTROLES' : 'CONTROLES';
  };

  const getControlesPadding = () => {
    const sizeConfig = getCurrentSizeConfig();
    return settings?.fontSize === 'normal' 
      ? sizeConfig.buttonPadding * 9 
      : sizeConfig.buttonPadding * 5;
  };

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
          >
            <Text style={styles.backButtonText}>VOLVER</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          <Text style={styles.description}>Error: No se encontró la partitura</Text>
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
          <View style={[styles.pianoContainer, { position: 'relative' }]}>
            <View style={{ position: 'relative', width: '100%', flex: 1 }}>
              {/* Piano base */}
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
              
              {/* Tecla iluminada superpuesta */}
              {currentKeyImage && (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 10,
                    backgroundColor: 'transparent',
                  }}
                >
                  <Image
                    source={currentKeyImage}
                    style={[
                      styles.pianoImage,
                      {
                        minHeight: sizeConfig.buttonText * 8,
                        maxHeight: sizeConfig.buttonText * 12,
                        width: '100%',
                        height: '100%',
                      }
                    ]}
                    resizeMode="contain"
                    accessibilityLabel="Tecla presionada"
                  />
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        <View style={styles.pianoControls}>
          <TouchableOpacity
            style={[
              styles.controlsButton,
              { paddingVertical: getControlesPadding() }
            ]}
            onPress={handleControls}
            accessibilityLabel="Controles"
            accessibilityRole="button"
          >
            <Text style={styles.controlsButtonText}>{getControlesText()}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default PianoScreen;
