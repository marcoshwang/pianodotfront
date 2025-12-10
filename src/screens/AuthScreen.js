import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { loginWithGoogle } from '../../services/pianodotApi';

const AuthScreen = ({ navigation, styles, triggerVibration, stop, settings }) => {
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [oauthInitiated, setOauthInitiated] = useState(false);

  // Limpiar loading state cuando el componente se vuelve a montar
  useEffect(() => {
    // Si OAuth fue iniciado pero volvimos a esta pantalla, significa que falló o se canceló
    if (oauthInitiated) {
      setIsLoadingGoogle(false);
      setOauthInitiated(false);
    }
  }, []);

  const handleEmailAuth = () => {
    // No iniciar si ya hay un proceso OAuth en curso
    if (isLoadingGoogle) {
      return;
    }
    
    triggerVibration();
    stop();
    navigation.navigate('Login');
  };

  const handleGoogleAuth = async () => {
    // Evitar doble tap
    if (isLoadingGoogle) {
      return;
    }
    
    try {
      triggerVibration();
      setIsLoadingGoogle(true);
      setOauthInitiated(true);
      
      
      // Iniciar el flujo de autenticación con Google
      await loginWithGoogle();
      
      // Si llegamos aquí, la redirección se inició correctamente
      // El loading state se mantendrá hasta que:
      // 1. El deep link handler complete exitosamente (navega a Home)
      // 2. Haya un error y el usuario vuelva a esta pantalla
      // 3. El usuario cancele en el navegador y vuelva
      // Timeout de seguridad: si después de 60 segundos seguimos en esta pantalla,
      // resetear el loading state (el usuario probablemente canceló)
      setTimeout(() => {
        setIsLoadingGoogle(false);
      }, 60000);
      
    } catch (error) {
      // Resetear estados
      setIsLoadingGoogle(false);
      setOauthInitiated(false);
      
      // Si el usuario canceló la autenticación, no mostrar error (es una acción normal)
      if (error.isCancellation || 
          error.message?.toLowerCase().includes('cancel') ||
          error.message?.includes('cancelada por el usuario')) {
        return;
      }
      
      // Para otros errores, mostrar alert al usuario
      console.error('Error en autenticación con Google:', error);
      Alert.alert(
        'Error de autenticación',
        error.message || 'No se pudo iniciar sesión con Google. Por favor, intenta nuevamente.',
        [{ text: 'OK' }]
      );
    }
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
          style={[
            styles.authButton,
            isLoadingGoogle && { opacity: 0.5 }
          ]}
          onPress={handleEmailAuth}
          disabled={isLoadingGoogle}
          accessibilityLabel="Continuar con correo electrónico"
          accessibilityRole="button"
          accessibilityHint="Iniciar sesión con tu correo electrónico"
        >
          <Text style={styles.authButtonText}>
            CONTINUAR CON CORREO ELECTRÓNICO
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.googleAuthButton,
            isLoadingGoogle && { opacity: 0.7 }
          ]}
          onPress={handleGoogleAuth}
          disabled={isLoadingGoogle}
          accessibilityLabel="Continuar con Google"
          accessibilityRole="button"
          accessibilityHint="Iniciar sesión con tu cuenta de Google"
          accessibilityState={{ disabled: isLoadingGoogle }}
        >
          {isLoadingGoogle ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.googleAuthButtonText}>
              CONTINUAR CON GOOGLE
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default AuthScreen;
