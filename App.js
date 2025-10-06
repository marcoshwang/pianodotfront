import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Fredoka_400Regular, Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTextToSpeech } from './src/hooks/useTextToSpeech';
import { useSettings } from './src/hooks/useSettings';
import SettingsScreen from './src/screens/SettingsScreen';
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

// React Navigation configurado correctamente
import { getDynamicStyles } from './src/styles/appStyles';

const Stack = createNativeStackNavigator();

// Componente principal de la aplicación
function PianoDotApp() {
  const [selectedScore, setSelectedScore] = useState(null);
  const { stop, speak, speakIntro } = useTextToSpeech();
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
    return getDynamicStyles(sizeConfig, contrastConfig, settings.contrast);
  };


  // React Navigation configurado con sintaxis de children para evitar warnings

  const styles = getStyles();
  
  return (
    <View style={styles.appContainer}>
      <StatusBar style={settings.contrast === 'whiteBlack' ? 'dark' : 'light'} />
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Welcome"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Welcome">
            {(props) => <WelcomeLandingScreen {...props} styles={getStyles()} triggerVibration={triggerVibration} stop={stop} speak={speak} speakIntro={speakIntro} settings={settings} />}
          </Stack.Screen>
          <Stack.Screen name="Auth">
            {(props) => <AuthScreen {...props} styles={getStyles()} triggerVibration={triggerVibration} stop={stop} settings={settings} />}
          </Stack.Screen>
          <Stack.Screen name="Login">
            {(props) => <LoginScreen {...props} styles={getStyles()} triggerVibration={triggerVibration} stop={stop} settings={settings} />}
          </Stack.Screen>
          <Stack.Screen name="Register">
            {(props) => <RegisterScreen {...props} styles={getStyles()} triggerVibration={triggerVibration} stop={stop} settings={settings} />}
          </Stack.Screen>
          <Stack.Screen name="Home">
            {(props) => <HomeScreen {...props} styles={getStyles()} triggerVibration={triggerVibration} stop={stop} settings={settings} speak={speak} speakIntro={speakIntro} />}
          </Stack.Screen>
          <Stack.Screen name="LoadScores">
            {(props) => <LoadScoresScreen {...props} styles={getStyles()} triggerVibration={triggerVibration} stop={stop} />}
          </Stack.Screen>
          <Stack.Screen name="MyScores">
            {(props) => <MyScoresScreen {...props} styles={getStyles()} triggerVibration={triggerVibration} stop={stop} />}
          </Stack.Screen>
          <Stack.Screen name="ScoreDetail">
            {(props) => <ScoreDetailScreen {...props} styles={getStyles()} triggerVibration={triggerVibration} stop={stop} settings={settings} contrastConfig={contrastConfig} />}
          </Stack.Screen>
          <Stack.Screen name="Piano">
            {(props) => <PianoScreen {...props} styles={getStyles()} triggerVibration={triggerVibration} stop={stop} settings={settings} getCurrentSizeConfig={getCurrentSizeConfig} getCurrentContrastConfig={getCurrentContrastConfig} />}
          </Stack.Screen>
          <Stack.Screen name="Controls">
            {(props) => <ControlsScreen {...props} styles={getStyles()} triggerVibration={triggerVibration} stop={stop} settings={settings} getCurrentSizeConfig={getCurrentSizeConfig} getCurrentContrastConfig={getCurrentContrastConfig} />}
          </Stack.Screen>
          <Stack.Screen name="Settings">
            {(props) => <SettingsScreen {...props} styles={getStyles()} triggerVibration={triggerVibration} stop={stop} settings={settings} updateSetting={updateSetting} fontSizeConfig={fontSizeConfig} contrastConfig={contrastConfig} />}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
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

