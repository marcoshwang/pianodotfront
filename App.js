import 'react-native-get-random-values';

// Importar módulos nativos de Amplify de forma condicional
try {
  require('@aws-amplify/react-native');
} catch (error) {
}

try {
  require('@aws-amplify/rtn-web-browser');
} catch (error) {
}

import React, { useState, useMemo } from 'react';
import { View, Text, Linking, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Fredoka_400Regular, Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Amplify } from 'aws-amplify';
import { COGNITO_CONFIG } from './config/cognito.config';
import { useTextToSpeech } from './src/hooks/useTextToSpeech';
import { useSettings } from './src/hooks/useSettings';
import { PracticeProvider } from './src/context/PracticeContext';

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

// Configurar Amplify con Cognito
const configureAmplify = () => {
  try {
    const amplifyConfig = {
      Auth: {
        Cognito: {
          userPoolId: COGNITO_CONFIG.userPoolId,
          userPoolClientId: COGNITO_CONFIG.clientId,
          region: COGNITO_CONFIG.region,
          loginWith: {
            email: true,
            username: false,
            phone: false,
            oauth: {
              domain: COGNITO_CONFIG.oauthDomain || COGNITO_CONFIG.defaultOAuthDomain,
              scopes: ['openid', 'email', 'profile'],
              redirectSignIn: ['pianodot://'],
              redirectSignOut: ['pianodot://'],
              responseType: 'code',
            },
          },
          signUpVerificationMethod: 'code',
          userAttributes: {
            email: {
              required: true,
            },
            name: {
              required: false,
            },
          },
        },
      },
    };

    Amplify.configure(amplifyConfig, {
      ssr: false,
    });
    
    return true;
  } catch (error) {
    return false;
  }
};

configureAmplify();

import { getDynamicStyles } from './src/styles/appStyles';

const Stack = createNativeStackNavigator();

// Referencia de navegación global
export const navigationRef = React.createRef();

// DEEP LINK HANDLER - MANEJO ROBUSTO DE OAUTH

// Estado global para evitar procesamiento duplicado
const oauthState = {
  isProcessing: false,
  hasProcessed: false,
  lastProcessedUrl: null,
};

// Helper: Validar callback de OAuth
const validateOAuthCallback = (url) => {
  try {
    if (!url || typeof url !== 'string') return null;
    
    const urlObj = new URL(url);
    
    if (urlObj.protocol !== 'pianodot:') {
      return null;
    }
    
    const error = urlObj.searchParams.get('error');
    if (error) {
      const errorDesc = urlObj.searchParams.get('error_description') || 'Unknown error';
      throw new Error(`OAuth error: ${error} - ${errorDesc}`);
    }
    
    const code = urlObj.searchParams.get('code');
    if (!code) {
      return null; // No es callback de OAuth
    }
    
    if (code.length < 10 || code.length > 500) {
      throw new Error('Invalid authorization code');
    }
    
    return {
      code,
      state: urlObj.searchParams.get('state'),
    };
  } catch (error) {
    console.error('Error validando callback:', error.message);
    throw error;
  }
};

// Helper: Obtener sesión con reintentos
const fetchSessionWithRetry = async (maxAttempts = 5, delayMs = 400) => {
  const { fetchAuthSession } = await import('aws-amplify/auth');
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const session = await fetchAuthSession({ forceRefresh: true });
      
      if (session?.tokens?.idToken) {
        return session;
      }
      
    } catch (error) {
    }
    
    if (i < maxAttempts - 1) {
      await new Promise(r => setTimeout(r, delayMs * (i + 1))); // Backoff exponencial
    }
  }
  
  throw new Error('No se pudieron obtener tokens después de reintentos');
};

// Helper: Navegar a Home
const navigateToHome = async (maxWaitMs = 5000) => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitMs) {
    if (navigationRef.current?.isReady()) {
      try {
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
        return true;
      } catch (error) {
        return false;
      }
    }
    
    await new Promise(r => setTimeout(r, 100));
  }
  
  return false;
};

// Procesar callback de OAuth
const processOAuthCallback = async (url) => {
  
  // Validar callback
  const callbackData = validateOAuthCallback(url);
  if (!callbackData) {
    return;
  }

  
  // Esperar que Amplify procese el código de autorización
  await new Promise(r => setTimeout(r, 500));
  
  try {
    // Obtener sesión con reintentos
    const session = await fetchSessionWithRetry();
    
    // Obtener usuario
    const { getCurrentUser } = await import('aws-amplify/auth');
    const cognitoUser = await getCurrentUser();
    
    if (!cognitoUser) {
      throw new Error('No se pudo obtener el usuario');
    }
       
    // Usar saveAuthData
    const { saveAuthData } = await import('./auth/cognitoAuth');
    await saveAuthData(cognitoUser);
    
    
    // Recargar configuraciones desde el backend
    try {
      const { getUserConfig } = await import('./services/pianodotApi');
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      
      const backendConfig = await getUserConfig();
      if (backendConfig) {
        const fontSizeMap = {
          'normal': 'normal',
          'grande': 'large',
          'extraGrande': 'extraLarge'
        };
        
        const frontendSettings = {
          fontSize: fontSizeMap[backendConfig.font_size] || 'normal',
          contrast: backendConfig.tema_preferido || 'whiteBlack',
          vibration: backendConfig.vibracion !== undefined ? backendConfig.vibracion : true
        };
        
        await AsyncStorage.setItem('pianoSettings', JSON.stringify(frontendSettings));
        
        try {
          const { settingsEvents } = await import('./src/utils/settingsEvents');
          settingsEvents.emit();
        } catch (emitError) {
          console.log('No se pudieron emitir eventos de settings');
        }
      }
    } catch (configError) {
      console.log('No se pudieron cargar configuraciones del backend');
    }
    
    // Navegar a Home
    const navSuccess = await navigateToHome();
    
    if (!navSuccess) {
      Alert.alert(
        'Inicio de sesión exitoso',
        'Por favor, ve a la pantalla principal.',
        [
          {
            text: 'OK',
            onPress: () => navigationRef.current?.navigate('Home'),
          },
        ]
      );
    }
  } catch (error) {
    console.error('Error procesando OAuth:', error.message);
    throw error;
  }
};

// Hook para manejar deep links
const useDeepLinkHandler = () => {
  React.useEffect(() => {
    const handleDeepLink = async (event) => {
      const url = typeof event === 'string' ? event : event.url;
      
      // Validaciones iniciales
      if (!url || !url.startsWith('pianodot://')) {
        return;
      }
      
      // Evitar procesamiento duplicado
      if (oauthState.isProcessing) {
        return;
      }
      
      if (oauthState.hasProcessed && oauthState.lastProcessedUrl === url) {
        return;
      }
      
      // Verificar si es callback de OAuth
      let isOAuthCallback = false;
      try {
        const callbackData = validateOAuthCallback(url);
        if (!callbackData) {
          return; // No es callback de OAuth
        }
        isOAuthCallback = true;
      } catch (error) {
        console.error('Callback inválido:', error.message);
        Alert.alert('Error', error.message);
        return;
      }
      
      if (!isOAuthCallback) {
        return;
      }
      
      // Marcar como procesando
      oauthState.isProcessing = true;
      oauthState.lastProcessedUrl = url;
      
      // Timeout de 30 segundos
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout de autenticación')), 30000);
      });
      
      try {
        await Promise.race([
          processOAuthCallback(url),
          timeoutPromise,
        ]);
        
        // Marcar como procesado exitosamente
        oauthState.hasProcessed = true;
      } catch (error) {
        console.error('Error en callback de OAuth:', error.message);
        
        // Usar clearAuthData
        try {
          const { clearAuthData } = await import('./auth/cognitoAuth');
          await clearAuthData();
        } catch (cleanupError) {
          console.error('Error limpiando datos:', cleanupError);
        }
        
        // Mostrar error al usuario
        Alert.alert(
          'Error de autenticación',
          error.message === 'Timeout de autenticación'
            ? 'La autenticación tardó demasiado. Por favor, intenta de nuevo.'
            : 'No se pudo completar el inicio de sesión. Por favor, intenta de nuevo.',
          [{ text: 'OK' }]
        );
        
        // Resetear estado para permitir reintento
        oauthState.hasProcessed = false;
        oauthState.lastProcessedUrl = null;
      } finally {
        oauthState.isProcessing = false;
      }
    };
    
    let subscription = null;
    
    // Procesar URL inicial si existe
    Linking.getInitialURL()
      .then(async (url) => {
        if (url) {
          await handleDeepLink(url);
        }
        // Registrar listener DESPUÉS
        subscription = Linking.addEventListener('url', handleDeepLink);
      })
      .catch((error) => {
        console.error('Error obteniendo URL inicial:', error);
        subscription = Linking.addEventListener('url', handleDeepLink);
      });
    
    return () => {
      subscription?.remove();
    };
  }, []);
};

// COMPONENTE PRINCIPAL

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
    contrastConfig,
    resetSettings,
    loadSettings
  } = useSettings();

  useDeepLinkHandler();

  //  Usar useMemo para recalcular estilos cuando settings cambia
  const styles = useMemo(() => {
    const sizeConfig = getCurrentSizeConfig();
    const contrastConfig = getCurrentContrastConfig();
    
    return getDynamicStyles(sizeConfig, contrastConfig, settings.contrast);
  }, [settings.contrast, settings.fontSize]);
  
  
  return (
    <View style={styles.appContainer}>
      <StatusBar style={settings.contrast === 'whiteBlack' ? 'dark' : 'light'} />
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator 
          initialRouteName="Welcome"
          screenOptions={{ headerShown: false }}
        >
          
          <Stack.Screen name="Welcome">
            {(props) => <WelcomeLandingScreen {...props} styles={styles} triggerVibration={triggerVibration} stop={stop} speak={speak} speakIntro={speakIntro} settings={settings} />}
          </Stack.Screen>
          <Stack.Screen name="Auth">
            {(props) => <AuthScreen {...props} styles={styles} triggerVibration={triggerVibration} stop={stop} settings={settings} />}
          </Stack.Screen>
          <Stack.Screen name="Login">
            {(props) => <LoginScreen {...props} styles={styles} triggerVibration={triggerVibration} stop={stop} settings={settings} loadSettings={loadSettings} />}
          </Stack.Screen>
          <Stack.Screen name="Register">
            {(props) => <RegisterScreen {...props} styles={styles} triggerVibration={triggerVibration} stop={stop} settings={settings} />}
          </Stack.Screen>
          <Stack.Screen name="Home">
            {(props) => <HomeScreen {...props} styles={styles} triggerVibration={triggerVibration} stop={stop} settings={settings} speak={speak} speakIntro={speakIntro} />}
          </Stack.Screen>
          <Stack.Screen name="LoadScores">
            {(props) => <LoadScoresScreen {...props} styles={styles} triggerVibration={triggerVibration} stop={stop} />}
          </Stack.Screen>
          <Stack.Screen name="MyScores">
            {(props) => <MyScoresScreen {...props} styles={styles} triggerVibration={triggerVibration} stop={stop} />}
          </Stack.Screen>
          <Stack.Screen name="ScoreDetail">
            {(props) => <ScoreDetailScreen {...props} styles={styles} triggerVibration={triggerVibration} stop={stop} settings={settings} contrastConfig={contrastConfig} />}
          </Stack.Screen>
          <Stack.Screen name="Piano">
            {(props) => <PianoScreen {...props} styles={styles} triggerVibration={triggerVibration} stop={stop} settings={settings} getCurrentSizeConfig={getCurrentSizeConfig} getCurrentContrastConfig={getCurrentContrastConfig} />}
          </Stack.Screen>
          <Stack.Screen name="Controls">
            {(props) => <ControlsScreen {...props} styles={styles} triggerVibration={triggerVibration} stop={stop} settings={settings} getCurrentSizeConfig={getCurrentSizeConfig} getCurrentContrastConfig={getCurrentContrastConfig} />}
          </Stack.Screen>
          <Stack.Screen name="Settings">
            {(props) => <SettingsScreen {...props} styles={styles} triggerVibration={triggerVibration} stop={stop} settings={settings} updateSetting={updateSetting} fontSizeConfig={fontSizeConfig} contrastConfig={contrastConfig} resetSettings={resetSettings} />}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}

// WRAPPER CON CARGA DE FUENTES

export default function App() {
  const [authLoaded, setAuthLoaded] = React.useState(false);
  
  let [fontsLoaded] = useFonts({
    Fredoka_400Regular,
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Fredoka_700Bold,
  });

  //Cargar datos de autenticación al iniciar
  React.useEffect(() => {
    const loadAuth = async () => {
      try {
        // Importar funciones correctas
        const { isAuthenticated, saveAuthData } = await import('./auth/cognitoAuth');
        const { getCurrentUser, fetchAuthSession } = await import('aws-amplify/auth');
        
        // Verificar si hay una sesión activa (OAuth callback)
        try {
          const session = await fetchAuthSession();
          
          if (session?.tokens?.idToken) {
            const cognitoUser = await getCurrentUser();
            if (cognitoUser) {
              await saveAuthData(cognitoUser);
            }
          }
        } catch (oauthError) {
        }
        
        // Verificar si el usuario está autenticado
        const hasAuth = await isAuthenticated();
          
        // Navegación automática si tiene sesión
        if (hasAuth) {
          setTimeout(() => {
            if (navigationRef.current?.isReady()) {
              navigationRef.current.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              });
            } else {
              // Reintentar después de un momento
              setTimeout(() => {
                if (navigationRef.current?.isReady()) {
                  navigationRef.current.reset({
                    index: 0,
                    routes: [{ name: 'Home' }],
                  });
                }
              }, 500);
            }
          }, 100);
        }
      } catch (error) {
        // Limpiar datos si hay error
        try {
          const { clearAuthData } = await import('./auth/cognitoAuth');
          await clearAuthData();
        } catch (clearError) {
          console.error('Error limpiando datos:', clearError);
        }
      } finally {
        setAuthLoaded(true);
      }
    };
    
    loadAuth();
  }, []);

  if (!fontsLoaded || !authLoaded) {
    return null;
  }

  return (
    <PracticeProvider>
      <PianoDotApp />
    </PracticeProvider>
  );
}
