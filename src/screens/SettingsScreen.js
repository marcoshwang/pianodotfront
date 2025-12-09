import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';

const SettingsScreen = ({ navigation, styles, triggerVibration, stop, settings, updateSetting, fontSizeConfig, contrastConfig }) => {
  const handleBack = () => {
    triggerVibration();
    stop();
    navigation.goBack();
  };

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              triggerVibration();
              console.log('🚪 Cerrando sesión...');
              
              // Cerrar sesión de Cognito
              try {
                const { signOut } = await import('aws-amplify/auth');
                await signOut();
                console.log('✅ Sesión de Cognito cerrada');
              } catch (cognitoError) {
                console.warn('⚠️ Error cerrando sesión de Cognito:', cognitoError.message);
                // Continuar de todas formas para limpiar datos locales
              }
              
              // Limpiar todos los datos de autenticación (tokens, usuario, etc.)
              const { clearAllAuthData } = await import('../../utils/mockAuth');
              await clearAllAuthData();
              console.log('✅ Tokens y datos de autenticación limpiados');
              
              // Navegar a Welcome
              navigation.reset({
                index: 0,
                routes: [{ name: 'Welcome' }],
              });
              
              console.log('✅ Sesión cerrada exitosamente');
            } catch (error) {
              console.error('❌ Error al cerrar sesión:', error);
              Alert.alert(
                'Error',
                'Hubo un problema al cerrar sesión. Por favor, intenta nuevamente.'
              );
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          accessibilityLabel="Volver atrás"
          accessibilityRole="button"
          accessibilityHint="Regresar a la pantalla principal"
        >
          <Text style={styles.backButtonText}>VOLVER</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={{ 
          flexGrow: 1, 
          justifyContent: 'flex-start', 
          alignItems: 'stretch', 
          width: '100%', 
          paddingHorizontal: 10,
          paddingTop: 10, 
          paddingBottom: 20
        }}
        showsVerticalScrollIndicator={true}
        indicatorStyle="default"
        scrollIndicatorInsets={{ right: 1 }}
      >
        {/* Sección de Tamaño */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>TAMAÑO DE TEXTO Y BOTONES</Text>
          
          <View style={{ justifyContent: 'center' }}>
            <TouchableOpacity 
              style={[styles.optionButton, settings.fontSize === 'normal' && styles.selectedOption]}
              onPress={() => {
                triggerVibration();
                updateSetting('fontSize', 'normal');
              }}
              accessibilityLabel="Tamaño normal"
              accessibilityRole="button"
              accessibilityHint="Seleccionar tamaño normal para texto y botones"
            >
              <Text style={[styles.optionText, settings.fontSize === 'normal' && styles.selectedOptionText]}>
                NORMAL
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.optionButton, settings.fontSize === 'large' && styles.selectedOption]}
              onPress={() => {
                triggerVibration();
                updateSetting('fontSize', 'large');
              }}
              accessibilityLabel="Tamaño grande"
              accessibilityRole="button"
              accessibilityHint="Seleccionar tamaño grande para texto y botones"
            >
              <Text style={[styles.optionText, settings.fontSize === 'large' && styles.selectedOptionText]}>
                GRANDE
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.optionButton, settings.fontSize === 'extraLarge' && styles.selectedOption]}
              onPress={() => {
                triggerVibration();
                updateSetting('fontSize', 'extraLarge');
              }}
              accessibilityLabel="Tamaño extra grande"
              accessibilityRole="button"
              accessibilityHint="Seleccionar tamaño extra grande para texto y botones"
            >
              <Text style={[styles.optionText, settings.fontSize === 'extraLarge' && styles.selectedOptionText]}>
                EXTRA GRANDE
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sección de Contraste */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>CONTRASTE DE COLORES</Text>
          
          <View style={{ justifyContent: 'center' }}>
            <TouchableOpacity 
              style={[styles.optionButton, settings.contrast === 'whiteBlack' && styles.selectedOption]}
              onPress={() => {
                triggerVibration();
                updateSetting('contrast', 'whiteBlack');
              }}
              accessibilityLabel="Tema claro"
              accessibilityRole="button"
              accessibilityHint="Seleccionar tema claro con contraste blanco y negro"
            >
              <Text style={[styles.optionText, settings.contrast === 'whiteBlack' && styles.selectedOptionText]}>
                TEMA CLARO
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.optionButton, settings.contrast === 'blackWhite' && styles.selectedOption]}
              onPress={() => {
                triggerVibration();
                updateSetting('contrast', 'blackWhite');
              }}
              accessibilityLabel="Tema oscuro"
              accessibilityRole="button"
              accessibilityHint="Seleccionar tema oscuro con contraste negro y blanco"
            >
              <Text style={[styles.optionText, settings.contrast === 'blackWhite' && styles.selectedOptionText]}>
                TEMA OSCURO
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.optionButton, settings.contrast === 'blackYellow' && styles.selectedOption]}
              onPress={() => {
                triggerVibration();
                updateSetting('contrast', 'blackYellow');
              }}
              accessibilityLabel="Tema de alto contraste amarillo"
              accessibilityRole="button"
              accessibilityHint="Seleccionar tema de alto contraste amarillo"
            >
              <Text style={[styles.optionText, settings.contrast === 'blackYellow' && styles.selectedOptionText]}>
                TEMA CONTRASTE AMARILLO
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.optionButton, settings.contrast === 'blackBlue' && styles.selectedOption]}
              onPress={() => {
                triggerVibration();
                updateSetting('contrast', 'blackBlue');
              }}
              accessibilityLabel="Tema de alto contraste azul"
              accessibilityRole="button"
              accessibilityHint="Seleccionar tema de alto contraste azul"
            >
              <Text style={[styles.optionText, settings.contrast === 'blackBlue' && styles.selectedOptionText]}>
                TEMA CONTRASTE AZUL
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.optionButton, settings.contrast === 'blackGreen' && styles.selectedOption]}
              onPress={() => {
                triggerVibration();
                updateSetting('contrast', 'blackGreen');
              }}
              accessibilityLabel="Tema de alto contraste verde"
              accessibilityRole="button"
              accessibilityHint="Seleccionar tema de alto contraste verde"
            >
              <Text style={[styles.optionText, settings.contrast === 'blackGreen' && styles.selectedOptionText]}>
                TEMA CONTRASTE VERDE
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sección de Vibración */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>VIBRACIÓN</Text>
          
          <View style={{ justifyContent: 'center' }}>
            <TouchableOpacity 
              style={[styles.optionButton, settings.vibration === true && styles.selectedOption]}
              onPress={() => {
                triggerVibration();
                updateSetting('vibration', true);
              }}
              accessibilityLabel="Activar vibración"
              accessibilityRole="button"
              accessibilityHint="Activar vibración al tocar botones"
            >
              <Text style={[styles.optionText, settings.vibration === true && styles.selectedOptionText]}>
                ACTIVADA
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.optionButton, settings.vibration === false && styles.selectedOption]}
              onPress={() => {
                triggerVibration();
                updateSetting('vibration', false);
              }}
              accessibilityLabel="Desactivar vibración"
              accessibilityRole="button"
              accessibilityHint="Desactivar vibración al tocar botones"
            >
              <Text style={[styles.optionText, settings.vibration === false && styles.selectedOptionText]}>
                DESACTIVADA
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sección de Cerrar Sesión */}
        <View style={styles.settingsSection}>
          <View style={{ justifyContent: 'center' }}>
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
              accessibilityLabel="Cerrar sesión"
              accessibilityRole="button"
              accessibilityHint="Cerrar sesión y eliminar todos los datos guardados"
            >
              <Text style={styles.logoutButtonText}>
                CERRAR SESIÓN
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;
