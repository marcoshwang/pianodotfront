import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

const LoginScreen = ({ navigation, styles, triggerVibration, stop, settings }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    triggerVibration();
    stop();
    // Por ahora navegamos directamente al home, después se implementará la autenticación
    navigation.navigate('Home');
  };

  const handleRegister = () => {
    triggerVibration();
    stop();
    navigation.navigate('Register');
  };

  const handleGoBack = () => {
    triggerVibration();
    stop();
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header con botón de volver */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleGoBack}
              accessibilityLabel="Volver atrás"
              accessibilityRole="button"
              accessibilityHint="Regresar a la pantalla de autenticación"
            >
              <Text style={styles.backButtonText}>VOLVER</Text>
            </TouchableOpacity>
          </View>


          {/* Contenido principal */}
          <View style={styles.loginContent}>
            <Text style={styles.loginTitle}>
              Iniciar Sesión
            </Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Correo electrónico"
                placeholderTextColor={settings.contrast === 'whiteBlack' ? '#666666' : '#CCCCCC'}
                value={email}
                onChangeText={setEmail}
                keyboardType="default"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                blurOnSubmit={false}
                accessibilityLabel="Campo de correo electrónico"
                accessibilityHint="Ingresa tu correo electrónico"
              />
              
              <TextInput
                style={styles.textInput}
                placeholder="Contraseña"
                placeholderTextColor={settings.contrast === 'whiteBlack' ? '#666666' : '#CCCCCC'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
                returnKeyType="done"
                accessibilityLabel="Campo de contraseña"
                accessibilityHint="Ingresa tu contraseña"
              />
            </View>

            <TouchableOpacity 
              style={styles.loginButton}
              onPress={handleLogin}
              accessibilityLabel="Iniciar sesión"
              accessibilityRole="button"
              accessibilityHint="Iniciar sesión con tu cuenta"
            >
              <Text style={styles.loginButtonText}>INICIAR SESIÓN</Text>
            </TouchableOpacity>
          </View>

          {/* Sección de registro */}
          <View style={styles.registerSection}>
            <Text style={styles.registerText}>
              ¿No tenés cuenta?
            </Text>
            
            <TouchableOpacity 
              style={styles.registerButton}
              onPress={handleRegister}
              accessibilityLabel="Registrarse"
              accessibilityRole="button"
              accessibilityHint="Crear una nueva cuenta"
            >
              <Text style={styles.registerButtonText}>REGISTRATE</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
