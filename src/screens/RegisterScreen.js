import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

const RegisterScreen = ({ styles, triggerVibration, stop, setCurrentScreen, settings }) => {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = () => {
    triggerVibration();
    stop();
    // Por ahora navegamos directamente al home, después se implementará el registro
    setCurrentScreen('home');
  };

  const handleGoBack = () => {
    triggerVibration();
    stop();
    setCurrentScreen('login');
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
              accessibilityHint="Regresar a la pantalla de login"
            >
              <Text style={styles.backButtonText}>VOLVER</Text>
            </TouchableOpacity>
          </View>

          {/* Contenido principal */}
          <View style={styles.registerContent}>
            <Text style={styles.registerTitle}>
              Crear Cuenta
            </Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Nombre"
                placeholderTextColor={settings.contrast === 'whiteBlack' ? '#666666' : '#CCCCCC'}
                value={nombre}
                onChangeText={setNombre}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
                blurOnSubmit={false}
                accessibilityLabel="Campo de nombre"
                accessibilityHint="Ingresa tu nombre"
              />
              
              <TextInput
                style={styles.textInput}
                placeholder="Apellido"
                placeholderTextColor={settings.contrast === 'whiteBlack' ? '#666666' : '#CCCCCC'}
                value={apellido}
                onChangeText={setApellido}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
                blurOnSubmit={false}
                accessibilityLabel="Campo de apellido"
                accessibilityHint="Ingresa tu apellido"
              />
              
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
              style={styles.registerButton}
              onPress={handleRegister}
              accessibilityLabel="Crear cuenta"
              accessibilityRole="button"
              accessibilityHint="Crear nueva cuenta con los datos ingresados"
            >
              <Text style={styles.registerButtonText}>ACEPTAR</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;
