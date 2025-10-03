import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Fredoka_400Regular, Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import { useTextToSpeech } from './src/hooks/useTextToSpeech';
import { useSettings } from './src/hooks/useSettings';
import SettingsScreen from './src/components/SettingsScreen';
import LoadScoresScreen from './src/screens/LoadScoresScreen';
import HomeScreen from './src/screens/HomeScreen';
import MyScoresScreen from './src/screens/MyScoresScreen';
import ScoreDetailScreen from './src/screens/ScoreDetailScreen';
import PianoScreen from './src/screens/PianoScreen';
import ControlsScreen from './src/screens/ControlsScreen';
import WelcomeLandingScreen from './src/screens/WelcomeLandingScreen';
import AuthScreen from './src/screens/AuthScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import { getDynamicStyles } from './src/styles/appStyles';

// Componente principal de la aplicación
function PianoDotApp() {
  const [currentScreen, setCurrentScreen] = useState('landing');
  const [selectedScore, setSelectedScore] = useState(null);
  const { speak, speakIntro, stop } = useTextToSpeech();
  const { 
    settings, 
    triggerVibration, 
    getCurrentSizeConfig, 
    getCurrentContrastConfig,
    updateSetting,
    fontSizeConfig,
    contrastConfig
  } = useSettings();

  // Obtener estilos dinámicos desde archivo separado
  const getStyles = () => {
    const sizeConfig = getCurrentSizeConfig();
    const contrastConfig = getCurrentContrastConfig();
    return getDynamicStyles(sizeConfig, contrastConfig);
  };

  // Audio de bienvenida cuando se llega a la pantalla principal
  useEffect(() => {
    if (currentScreen === 'home') {
      const welcomeText = 'Bienvenido a PianoDot. Aplicación de aprendizaje de piano. Toca Cargar Partituras, Mis Partituras o Configuración.';
      
      // Delay para asegurar que la aplicación se haya cargado completamente
      const timer = setTimeout(() => {
        console.log('🎉 Pantalla principal - Reproduciendo audio de bienvenida');
        speakIntro(welcomeText);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [currentScreen]); // Se ejecuta cuando cambia a la pantalla home

  // Leer automáticamente el contenido cuando cambie la pantalla
  useEffect(() => {
    const screenTexts = {
      landing: 'Bienvenido a PianoDot. Sumérgete en el aprendizaje del piano a través de instrucciones auditivas. Toca Empezar para comenzar.',
      auth: 'Pantalla de autenticación. Elige cómo quieres continuar: con correo electrónico o con Google.',
      login: 'Pantalla de inicio de sesión. Ingresa tu correo electrónico y contraseña, o regístrate si no tienes cuenta.',
      register: 'Pantalla de registro. Completa tus datos: nombre, apellido, correo electrónico y contraseña.',
      home: 'Pantalla principal. Toca Cargar Partituras, Mis Partituras o Configuración.',
      load: 'Pantalla de Cargar Partituras. Aquí podrás cargar nuevas partituras para aprender piano.',
      my: 'Pantalla de Mis Partituras. Aquí encontrarás todas tus partituras guardadas.',
      scoreDetail: 'Pantalla de detalles de partitura. Aquí puedes comenzar a tocar o continuar tu progreso.',
      piano: 'Pantalla del teclado de piano. Aquí puedes tocar la partitura seleccionada.',
      controls: 'Pantalla de controles. Aquí encontrarás los controles para la reproducción.',
      settings: 'Pantalla de Configuración. Configura las opciones de la aplicación para una mejor experiencia.'
    };

    // Solo reproducir audio si no es la pantalla inicial (home)
    if (currentScreen !== 'home') {
      // Delay para asegurar que TalkBack no interfiera
      const timer = setTimeout(() => {
        console.log(`📱 Cambiando a pantalla: ${currentScreen}`);
        speakIntro(screenTexts[currentScreen]);
      }, 500); // Delay de 500ms para dar tiempo a que se estabilice la pantalla

      return () => clearTimeout(timer);
    }
  }, [currentScreen]); // Solo depende de currentScreen, no de speakIntro

  const renderScreen = () => {
    const styles = getStyles();
    
    switch (currentScreen) {
      case 'landing':
        return (
          <WelcomeLandingScreen 
            styles={styles}
            triggerVibration={triggerVibration}
            stop={stop}
            setCurrentScreen={setCurrentScreen}
            settings={settings}
          />
        );
      
      case 'auth':
        return (
          <AuthScreen 
            styles={styles}
            triggerVibration={triggerVibration}
            stop={stop}
            setCurrentScreen={setCurrentScreen}
            settings={settings}
          />
        );
      
      case 'login':
        return (
          <LoginScreen 
            styles={styles}
            triggerVibration={triggerVibration}
            stop={stop}
            setCurrentScreen={setCurrentScreen}
            settings={settings}
          />
        );
      
      case 'register':
        return (
          <RegisterScreen 
            styles={styles}
            triggerVibration={triggerVibration}
            stop={stop}
            setCurrentScreen={setCurrentScreen}
            settings={settings}
          />
        );
      
      case 'home':
        return (
          <HomeScreen 
            styles={styles}
            triggerVibration={triggerVibration}
            stop={stop}
            setCurrentScreen={setCurrentScreen}
            settings={settings}
          />
        );
      
      case 'load':
        return (
          <LoadScoresScreen 
            styles={styles}
            triggerVibration={triggerVibration}
            stop={stop}
            setCurrentScreen={setCurrentScreen}
            setSelectedScore={setSelectedScore}
          />
        );

      case 'my':
        return (
          <MyScoresScreen 
            styles={styles}
            triggerVibration={triggerVibration}
            stop={stop}
            setCurrentScreen={setCurrentScreen}
            setSelectedScore={setSelectedScore}
          />
        );

      case 'scoreDetail':
        return (
          <ScoreDetailScreen 
            styles={styles}
            triggerVibration={triggerVibration}
            stop={stop}
            setCurrentScreen={setCurrentScreen}
            selectedScore={selectedScore}
            setSelectedScore={setSelectedScore}
          />
        );

      case 'piano':
        return (
          <PianoScreen 
            styles={styles}
            triggerVibration={triggerVibration}
            stop={stop}
            setCurrentScreen={setCurrentScreen}
            selectedScore={selectedScore}
            settings={settings}
            getCurrentSizeConfig={getCurrentSizeConfig}
            getCurrentContrastConfig={getCurrentContrastConfig}
          />
        );

      case 'controls':
        return (
          <ControlsScreen 
            styles={styles}
            triggerVibration={triggerVibration}
            stop={stop}
            setCurrentScreen={setCurrentScreen}
            settings={settings}
            getCurrentSizeConfig={getCurrentSizeConfig}
            getCurrentContrastConfig={getCurrentContrastConfig}
          />
        );

      case 'settings':
        return (
          <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                      triggerVibration();
                      stop(); // Detener cualquier audio antes de cambiar
                      setCurrentScreen('home');
                    }}
                    accessibilityLabel="Volver atrás"
                    accessibilityRole="button"
                    accessibilityHint="Regresar a la pantalla principal, siempre se mantiene en el superior"
                  >
                    <Text style={styles.backButtonText}>VOLVER</Text>
                  </TouchableOpacity>
                </View>

            <SettingsScreen 
              settings={settings}
              triggerVibration={triggerVibration}
              styles={styles}
              updateSetting={updateSetting}
              fontSizeConfig={fontSizeConfig}
              contrastConfig={contrastConfig}
              setCurrentScreen={setCurrentScreen}
            />
          </SafeAreaView>
        );

      default:
        return null;
    }
  };

  const styles = getStyles();
  
  return (
    <View style={styles.appContainer}>
      <StatusBar style={settings.contrast === 'whiteBlack' ? 'dark' : 'light'} />
      {renderScreen()}
    </View>
  );
}

// Componente wrapper que maneja la carga de fuentes
export default function App() {
  let [fontsLoaded] = useFonts({
    Fredoka_400Regular,
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Fredoka_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return <PianoDotApp />;
}

