import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Image,
  BackHandler,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { usePractice } from '../context/PracticeContext';

const HomeScreen = ({ navigation, styles, triggerVibration, stop, settings, speak, speakIntro }) => {
  // Contexto de práctica para detener audio
  const { stopAudio } = usePractice();



  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription?.remove();
    }, [])
  );

  const handleLoadScores = () => {
    triggerVibration();
    stop();
    navigation.navigate('LoadScores');
  };

  const handleMyScores = () => {
    triggerVibration();
    stop();
    navigation.navigate('MyScores');
  };

  const handleSettings = () => {
    triggerVibration();
    stop();
    navigation.navigate('Settings');
  };

  // Función para determinar si necesita separar el texto según el tamaño
  const getConfiguracionText = () => {
    if (settings.fontSize === 'large' || settings.fontSize === 'extraLarge') {
      return 'CONFIGU\nRACIÓN';
    }
    return 'CONFIGURACIÓN';
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

      {/* Botones principales */}
      <View style={styles.buttonsContainer}>
        {/* Botón Cargar Partituras */}
        <TouchableOpacity 
          style={styles.mainButton}
          onPress={handleLoadScores}
          accessibilityLabel="Cargar Partituras"
          accessibilityRole="button"
          accessibilityHint="Navegar a la pantalla para cargar nuevas partituras"
        >
          <Text style={styles.buttonText}>CARGAR PARTITURAS</Text>
        </TouchableOpacity>

        {/* Botón Mis Partituras */}
        <TouchableOpacity 
          style={styles.mainButton}
          onPress={handleMyScores}
          accessibilityLabel="Mis Partituras"
          accessibilityRole="button"
          accessibilityHint="Ver y gestionar mis partituras guardadas"
        >
          <Text style={styles.buttonText}>MIS PARTITURAS</Text>
        </TouchableOpacity>

        {/* Botón Configuración */}
        <TouchableOpacity 
          style={styles.mainButton}
          onPress={handleSettings}
          accessibilityLabel="Configuración"
          accessibilityRole="button"
          accessibilityHint="Acceder a la configuración de la aplicación"
        >
          <Text style={styles.buttonText}>{getConfiguracionText()}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};


export default HomeScreen;
