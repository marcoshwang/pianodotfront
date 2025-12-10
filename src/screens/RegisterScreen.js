import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { register } from '../../services/pianodotApi';

const RegisterScreen = ({ navigation, styles, triggerVibration, stop, settings }) => {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!nombre || !email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'La contraseña debe tener al menos 8 caracteres');
      return;
    }

    try {
      triggerVibration();
      setIsLoading(true);
      
      const name = `${nombre} ${apellido}`.trim();
      const result = await register(email, password, name);
      
      stop();
      navigation.replace('Login');
    } catch (error) {
      console.error('Error en registro:', error);
      Alert.alert(
        'Error de registro',
        error.message || 'No se pudo registrar el usuario. Intenta nuevamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    triggerVibration();
    stop();
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
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
            disabled={isLoading}
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
              editable={!isLoading}
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
              editable={!isLoading}
              accessibilityLabel="Campo de apellido"
              accessibilityHint="Ingresa tu apellido"
            />
            
            <TextInput
              style={styles.textInput}
              placeholder="Correo electrónico"
              placeholderTextColor={settings.contrast === 'whiteBlack' ? '#666666' : '#CCCCCC'}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              blurOnSubmit={false}
              editable={!isLoading}
              accessibilityLabel="Campo de correo electrónico"
              accessibilityHint="Ingresa tu correo electrónico"
            />
            
            <TextInput
              style={styles.textInput}
              placeholder="Contraseña (mínimo 8 caracteres)"
              placeholderTextColor={settings.contrast === 'whiteBlack' ? '#666666' : '#CCCCCC'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={true}
              returnKeyType="done"
              onSubmitEditing={handleRegister}
              editable={!isLoading}
              accessibilityLabel="Campo de contraseña"
              accessibilityHint="Ingresa tu contraseña"
            />
          </View>

          <TouchableOpacity 
            style={[styles.registerButton, isLoading && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={isLoading}
            accessibilityLabel="Crear cuenta"
            accessibilityRole="button"
            accessibilityHint="Crear nueva cuenta con los datos ingresados"
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.registerButtonText}>ACEPTAR</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RegisterScreen;