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

const HomeScreen = ({ navigation, styles, triggerVibration, stop, settings, speak, speakIntro }) => {
  // Prevenir que el botón back de Android salga de la aplicación cuando estemos en HomeScreen
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        // Retornar true significa que interceptamos el evento y no permitimos la acción por defecto
        // Esto previene que el usuario salga de la app usando el botón back
        return true;
      };

      // Agregar el listener cuando la pantalla está enfocada
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      // Limpiar el listener cuando la pantalla pierde el foco
      return () => subscription?.remove();
    }, [])
  );

  // Reproducir mensaje introductorio cuando se carga la pantalla
  useEffect(() => {
    const homeMessage = "Pantalla principal. Tienes tres opciones disponibles: Cargar Partituras para subir nuevas partituras, Mis Partituras para ver tus partituras guardadas, y Configuración para ajustar las opciones de la aplicación.";
    
    // Usar speakIntro si está disponible, sino usar speak
    if (speakIntro) {
      speakIntro(homeMessage);
    } else if (speak) {
      speak(homeMessage);
    }
  }, []);
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
    // Si el tamaño de fuente es grande o extra grande, separar el texto
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
