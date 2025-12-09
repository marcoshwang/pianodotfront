import 'react-native-get-random-values';

// Importar módulos nativos de Amplify de forma condicional
try {
  require('@aws-amplify/react-native');
} catch (error) {
  console.warn('⚠️ @aws-amplify/react-native no está vinculado. Necesitas hacer un nuevo build.');
}

try {
  require('@aws-amplify/rtn-web-browser');
  console.log('✅ @aws-amplify/rtn-web-browser cargado');
} catch (error) {
  console.warn('⚠️ @aws-amplify/rtn-web-browser no está vinculado. Necesitas hacer un nuevo build para OAuth.');
}

import React, { useState } from 'react';
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
    
    console.log('✅ Amplify configurado correctamente con Cognito');
    console.log('📍 User Pool:', COGNITO_CONFIG.userPoolId);
    console.log('📍 Region:', COGNITO_CONFIG.region);
    console.log('📍 OAuth Domain:', COGNITO_CONFIG.oauthDomain || COGNITO_CONFIG.defaultOAuthDomain);
    return true;
  } catch (error) {
    console.error('❌ Error configurando Amplify:', error);
    console.warn('⚠️ Continuando sin autenticación (modo desarrollo)');
    return false;
  }
};

configureAmplify();

import { getDynamicStyles } from './src/styles/appStyles';

const Stack = createNativeStackNavigator();

// Referencia de navegación global
export const navigationRef = React.createRef();

// ============================================================================
// DEEP LINK HANDLER - MANEJO ROBUSTO DE OAUTH
// ============================================================================

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
    console.error('❌ Error validando callback:', error.message);
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
        console.log(`✅ Tokens obtenidos (intento ${i + 1}/${maxAttempts})`);
        return session;
      }
      
      console.log(`⚠️ Intento ${i + 1}/${maxAttempts}: sin tokens`);
    } catch (error) {
      console.log(`⚠️ Intento ${i + 1}/${maxAttempts} falló:`, error.message);
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
        console.log('✅ Navegación a Home exitosa');
        return true;
      } catch (error) {
        console.error('❌ Error navegando:', error.message);
        return false;
      }
    }
    
    await new Promise(r => setTimeout(r, 100));
  }
  
  console.error('❌ Timeout esperando navegación');
  return false;
};

// Procesar callback de OAuth
const processOAuthCallback = async (url) => {
  console.log('🔄 Procesando callback de OAuth...');
  
  // Validar callback
  const callbackData = validateOAuthCallback(url);
  if (!callbackData) {
    console.log('ℹ️ No es un callback de OAuth válido');
    return;
  }
  
  console.log('✅ Callback de OAuth válido detectado');
  
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
    
    console.log('✅ Usuario obtenido:', cognitoUser.userId);
    
    // Guardar datos (crítico hacerlo ANTES de navegar)
    const { saveAuthData, loadAuthData } = await import('./utils/mockAuth');
    await saveAuthData(cognitoUser);
    await loadAuthData();
    
    console.log('✅ Datos de autenticación guardados');
    
    // Navegar a Home
    const navSuccess = await navigateToHome();
    
    if (!navSuccess) {
      console.warn('⚠️ No se pudo navegar automáticamente');
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
    console.error('❌ Error procesando OAuth:', error.message);
    throw error;
  }
};

// Hook para manejar deep links
const useDeepLinkHandler = () => {
  React.useEffect(() => {
    const handleDeepLink = async (event) => {
      const url = typeof event === 'string' ? event : event.url;
      
      console.log('🔗 Deep link recibido:', url);
      
      // Validaciones iniciales
      if (!url || !url.startsWith('pianodot://')) {
        return;
      }
      
      // Evitar procesamiento duplicado
      if (oauthState.isProcessing) {
        console.log('⚠️ Ya hay un proceso en curso');
        return;
      }
      
      if (oauthState.hasProcessed && oauthState.lastProcessedUrl === url) {
        console.log('⚠️ Esta URL ya fue procesada');
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
        console.error('❌ Callback inválido:', error.message);
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
        console.error('❌ Error en callback de OAuth:', error.message);
        
        // Limpiar datos parciales
        try {
          const { clearAllAuthData } = await import('./utils/mockAuth');
          await clearAllAuthData();
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

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

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

  // Usar el hook de deep links
  useDeepLinkHandler();

  const getStyles = () => {
    const sizeConfig = getCurrentSizeConfig();
    const contrastConfig = getCurrentContrastConfig();
    return getDynamicStyles(sizeConfig, contrastConfig, settings.contrast);
  };

  const styles = getStyles();
  
  return (
    <View style={styles.appContainer}>
      <StatusBar style={settings.contrast === 'whiteBlack' ? 'dark' : 'light'} />
      <NavigationContainer ref={navigationRef}>
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

// ============================================================================
// WRAPPER CON CARGA DE FUENTES
// ============================================================================

export default function App() {
  const [authLoaded, setAuthLoaded] = React.useState(false);
  
  let [fontsLoaded] = useFonts({
    Fredoka_400Regular,
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Fredoka_700Bold,
  });

  // Cargar datos de autenticación al iniciar
  React.useEffect(() => {
    const loadAuth = async () => {
      try {
        const { loadAuthData, saveAuthData } = await import('./utils/mockAuth');
        const { getCurrentUser } = await import('aws-amplify/auth');
        
        // Verificar si hay un callback de OAuth (cuando regresa de Google)
        try {
          const { fetchAuthSession } = await import('aws-amplify/auth');
          const session = await fetchAuthSession();
          
          // Si hay una sesión activa después de un redirect, obtener el usuario
          if (session.tokens && session.tokens.idToken) {
            console.log('✅ Sesión de OAuth detectada, obteniendo usuario...');
            const cognitoUser = await getCurrentUser();
            if (cognitoUser) {
              await saveAuthData(cognitoUser);
              console.log('✅ Usuario de Google autenticado correctamente');
            }
          }
        } catch (oauthError) {
          console.log('ℹ️ No hay sesión de OAuth activa');
        }
        
        const hasAuth = await loadAuthData();
        
        // ✅ NAVEGACIÓN AUTOMÁTICA SI TIENE SESIÓN
        if (hasAuth) {
          console.log('✅ Usuario autenticado, navegando automáticamente a Home...');
          // Esperar a que la navegación esté lista
          setTimeout(() => {
            if (navigationRef.current?.isReady()) {
              navigationRef.current.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              });
              console.log('✅ Navegación automática a Home completada');
            } else {
              // Si no está listo, reintentar después de un momento
              setTimeout(() => {
                if (navigationRef.current?.isReady()) {
                  navigationRef.current.reset({
                    index: 0,
                    routes: [{ name: 'Home' }],
                  });
                  console.log('✅ Navegación automática a Home completada (reintento)');
                }
              }, 500);
            }
          }, 100);
        } else {
          console.log('ℹ️ No hay sesión guardada, usuario no autenticado');
        }
      } catch (error) {
        console.error('Error cargando autenticación:', error);
        try {
          const { clearAllAuthData } = await import('./utils/mockAuth');
          await clearAllAuthData();
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
