import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';

const AuthScreen = ({ navigation, styles, triggerVibration, stop, settings }) => {
  const handleEmailAuth = () => {
    triggerVibration();
    stop();
    navigation.navigate('Login');
  };

  const handleGoogleAuth = () => {
    triggerVibration();
    stop();
    // Por ahora navegamos directamente al home, después se implementará la autenticación
    navigation.replace('Home'); // replace para no poder volver atrás
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
      <View style={styles.authContent}>
        <Text style={styles.authTitle}>
          Continúa con tu cuenta
        </Text>
        
        <Text style={styles.authDescription}>
          Elige cómo querés continuar para guardar tu progreso
        </Text>
      </View>

      {/* Botones de autenticación */}
      <View style={styles.authButtonsContainer}>
        <TouchableOpacity 
          style={styles.authButton}
          onPress={handleEmailAuth}
          accessibilityLabel="Continuar con correo electrónico"
          accessibilityRole="button"
          accessibilityHint="Iniciar sesión con tu correo electrónico"
        >
          <Text style={styles.authButtonText}>CONTINUAR CON CORREO ELECTRÓNICO</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.googleAuthButton}
          onPress={handleGoogleAuth}
          accessibilityLabel="Continuar con Google"
          accessibilityRole="button"
          accessibilityHint="Iniciar sesión con tu cuenta de Google"
        >
          <View style={styles.googleButtonContent}>
            <Image 
              source={require('../../img/google.png')} 
              style={styles.googleLogo}
              accessibilityLabel="Logo de Google"
            />
            <Text style={styles.googleAuthButtonText}>CONTINUAR CON GOOGLE</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default AuthScreen;
