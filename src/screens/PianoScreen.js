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

  const getKeyImageForNote = useCallback((note, mano) => {
    const noteMap = {
      // Mano derecha (MD)
      'MD_C': require('../../img/tecladotocado/mdtecladodo.png'),
      'MD_C#': require('../../img/tecladotocado/mdtecladocs.png'),
      'MD_D': require('../../img/tecladotocado/mdtecladore.png'),
      'MD_D#': require('../../img/tecladotocado/mdtecladods.png'),
      'MD_E': require('../../img/tecladotocado/mdtecladomi.png'),
      'MD_F': require('../../img/tecladotocado/mdtecladofa.png'),
      'MD_F#': require('../../img/tecladotocado/mdtecladofs.png'),
      'MD_G': require('../../img/tecladotocado/mdtecladosol.png'),
      'MD_G#': require('../../img/tecladotocado/mdtecladogs.png'),
      'MD_A': require('../../img/tecladotocado/mdtecladola.png'),
      'MD_A#': require('../../img/tecladotocado/mdtecladoas.png'),
      'MD_B': require('../../img/tecladotocado/mdtecladosi.png'),
      
      // Mano izquierda (MI)
      'MI_C': require('../../img/tecladotocado/mitecladodo.png'),
      'MI_C#': require('../../img/tecladotocado/mitecladocs.png'),
      'MI_D': require('../../img/tecladotocado/mitecladore.png'),
      'MI_D#': require('../../img/tecladotocado/mitecladods.png'),
      'MI_E': require('../../img/tecladotocado/mitecladomi.png'),
      'MI_F': require('../../img/tecladotocado/mitecladofa.png'),
      'MI_F#': require('../../img/tecladotocado/mitecladofs.png'),
      'MI_G': require('../../img/tecladotocado/mitecladosol.png'),
      'MI_G#': require('../../img/tecladotocado/mitecladogs.png'),
      'MI_A': require('../../img/tecladotocado/mitecladola.png'),
      'MI_A#': require('../../img/tecladotocado/mitecladoas.png'),
      'MI_B': require('../../img/tecladotocado/mitecladosi.png'),
    };
    
    const key = `${mano}_${note?.toUpperCase()}`;
    return noteMap[key] || null;
  }, []);

  const reproduceAudios = useCallback(async () => {
    if (isNavigatingAwayRef.current || !isMountedRef.current) {
      return;
    }

    if (hasPlayedRef.current) {
      return;
    }
    
    try {
      setIsReproducing(true);
      hasPlayedRef.current = true;
      
      setCurrentKeyImage(null);
      processedEventsRef.current.clear();
      
      try {
        await playPreloadedAudio('Piano');
      } catch (error) {
        await playAudioFromUrl(pianoUrl, 'Piano');
      }
      
      if (!isMountedRef.current || isNavigatingAwayRef.current) return;
      
      const startTime = Date.now();
      setAudioStartTime(startTime);
      try {
        await playPreloadedAudio('TTS');
      } catch (error) {
        await playAudioFromUrl(ttsUrl, 'TTS');
      }
      
      if (timelineCheckIntervalRef.current) {
        clearInterval(timelineCheckIntervalRef.current);
        timelineCheckIntervalRef.current = null;
      }
      
      setAudioStartTime(null);
      
      setCurrentKeyImage(null);

    } catch (error) {
      console.error('Error reproduciendo audios:', error);
    } finally {
      if (isMountedRef.current) {
        setIsReproducing(false);
      }
    }
  }, [playPreloadedAudio, playAudioFromUrl, pianoUrl, ttsUrl]);

  //Reproducir cuando cambia el timestamp
  useEffect(() => {
    if (playAudio && playTimestamp && lastTimestampRef.current !== playTimestamp) {
      lastTimestampRef.current = playTimestamp;
      hasPlayedRef.current = false;

      if (isReproducingRef.current) {
        stopAudioRef.current().catch(() => {});
      }
      
      const timeoutId = setTimeout(() => {
        if (isMountedRef.current && !isNavigatingAwayRef.current && !hasPlayedRef.current) {
          reproduceAudios();
        }
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [playAudio, playTimestamp]);

  const fetchTimeline = useCallback(async () => {
    if (!score?.id || !currentCompas) {
      return;
    }

    try {
      const timelineData = await getTimeline(score.id, currentCompas);

      const eventCount = timelineData?.timeline?.length || 0;
      const maxTimestamp = timelineData?.timeline?.length > 0 
        ? Math.max(...timelineData.timeline.map(e => e.timestamp_ms))
        : 0;
      console.log(`Timeline obtenido - Eventos: ${eventCount} | Duración: ${Math.round(maxTimestamp / 1000)}s`);
      
      setTimeline(timelineData);
    } catch (error) {
      console.error('Error obteniendo timeline:', error);
      setTimeline(null);
    }
  }, [score?.id, currentCompas]);

  useEffect(() => {
    if (score?.id && currentCompas) {
      fetchTimeline();
    }
  }, [score?.id, currentCompas, fetchTimeline]);

  //Limpiar estado cuando cambia el compás o el timeline
  useEffect(() => {
    processedEventsRef.current.clear();
    setCurrentKeyImage(null);
    setAudioStartTime(null);
    hasPlayedRef.current = false;
  }, [timeline, currentCompas]);


  const checkTimelineEvents = useCallback(() => {
    if (!timeline?.timeline || !audioStartTime) {
      return;
    }

    const elapsedTimeMs = Date.now() - audioStartTime;
    
    const maxTimestamp = Math.max(...timeline.timeline.map(e => e.timestamp_ms), 0);
    const bufferMs = 1000;
    
    if (elapsedTimeMs > maxTimestamp + bufferMs) {
      if (timelineCheckIntervalRef.current) {
        clearInterval(timelineCheckIntervalRef.current);
        timelineCheckIntervalRef.current = null;
      }
      return;
    }
    
    const currentEvents = timeline.timeline.filter(event => {
      const eventKey = `${event.timestamp_ms}_${event.pitch}_${event.mano}`;
      const timeDiff = Math.abs(event.timestamp_ms - elapsedTimeMs);

      return timeDiff < 200 && !processedEventsRef.current.has(eventKey);
    });

    if (currentEvents.length > 0) {
      currentEvents.sort((a, b) => {
        const diffA = Math.abs(a.timestamp_ms - elapsedTimeMs);
        const diffB = Math.abs(b.timestamp_ms - elapsedTimeMs);
        return diffA - diffB;
      });

      const event = currentEvents[0];
      const eventKey = `${event.timestamp_ms}_${event.pitch}_${event.mano}`;
      
      processedEventsRef.current.add(eventKey);
      
      const note = event.pitch?.toUpperCase();
      const mano = event.mano?.toUpperCase();
      
      console.log('NOTA DETECTADA:', {
        nota: note,
        mano: mano,
        timestamp_evento: event.timestamp_ms,
        tiempo_actual: elapsedTimeMs,
        diferencia: Math.abs(event.timestamp_ms - elapsedTimeMs)
      });

      if (note && mano && (mano === 'MD' || mano === 'MI')) {
        const validNotePattern = /^[A-G](#|b|)?$/;
        if (!validNotePattern.test(note)) {
          return;
        }

        try {
          const keyImage = getKeyImageForNote(note, mano);
          
          if (keyImage) {
            if (typeof keyImage === 'number' || (keyImage && keyImage.uri)) {
              setCurrentKeyImage(keyImage);
            } 
          } 
        } catch (error) {
          console.error(`Error obteniendo imagen para ${mano}_${note}:`, error.message || error);
        }
      }
    }
  }, [timeline, audioStartTime, getKeyImageForNote]);

  useEffect(() => {
    if (audioStartTime && timeline) {
      timelineCheckIntervalRef.current = setInterval(() => {
        checkTimelineEvents();
      }, 50);
    } else {
      if (timelineCheckIntervalRef.current) {
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

  useEffect(() => {
    isMountedRef.current = true;
    isNavigatingAwayRef.current = false;

    const unsubscribeBlur = navigation.addListener('blur', () => {
      isNavigatingAwayRef.current = true;
      
      if (isPlayingRef.current || isReproducingRef.current) {
        stopAudioRef.current();
      }
      
      if (timelineCheckIntervalRef.current) {
        clearInterval(timelineCheckIntervalRef.current);
        timelineCheckIntervalRef.current = null;
      }
      
      setAudioStartTime(null);
      setCurrentKeyImage(null);
    });

    const unsubscribeFocus = navigation.addListener('focus', () => {
      isNavigatingAwayRef.current = false;
    });

    return () => {
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
              
              {/* Tecla iluminada superpuesta según mano (MD/MI) */}
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
