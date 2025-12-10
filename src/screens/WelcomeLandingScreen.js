import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import { usePractice } from '../context/PracticeContext';

const WelcomeLandingScreen = ({ navigation, styles, triggerVibration, stop, speak, speakIntro, settings }) => {
  // Contexto de práctica para detener audio
  const { stopAudio } = usePractice();



  const handleStart = () => {
    triggerVibration();
    stop();
    navigation.navigate('Auth');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Logo de la aplicación */}
      <View style={styles.header}>
        <Image 
          source={
            settings.contrast === 'whiteBlack' ? require('../../img/logonegro.png') :
            settings.contrast === 'blackBlue' ? require('../../img/logoazul.png') :
            settings.contrast === 'blackGreen' ? require('../../img/logoverde.png') :
            settings.contrast === 'blackYellow' ? require('../../img/logoamarillo.png') :
            settings.contrast === 'blackWhite' ? require('../../img/logoblanco.png') :
            require('../../img/logoblanco.png')
          } 
          style={styles.logo}
          accessibilityLabel="PianoDot"
        />
      </View>

      {/* Contenido principal */}
      <View style={styles.landingContent}>
        <Text style={styles.welcomeTitle}>
          Bienvenido a PianoDot
        </Text>
        
        <Text style={styles.welcomeDescription}>
          Sumergite en el aprendizaje del piano a través de instrucciones auditivas
        </Text>
      </View>

      <View style={styles.newButtonContainer}>
        <TouchableOpacity 
          style={styles.newButton}
          onPress={handleStart}
          accessibilityLabel="Empezar"
          accessibilityRole="button"
          accessibilityHint="Comenzar a usar la aplicación PianoDot"
        >
          <Text style={styles.newButtonText}>EMPEZAR</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default WelcomeLandingScreen;
