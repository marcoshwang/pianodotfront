import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';

const WelcomeLandingScreen = ({ navigation, styles, triggerVibration, stop, settings }) => {
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

      {/* Botón de empezar */}
      <View style={styles.landingButtonContainer}>
        <TouchableOpacity 
          style={styles.landingButton}
          onPress={handleStart}
          accessibilityLabel="Empezar"
          accessibilityRole="button"
          accessibilityHint="Comenzar a usar la aplicación PianoDot"
        >
          <Text style={styles.landingButtonText}>EMPEZAR</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default WelcomeLandingScreen;
