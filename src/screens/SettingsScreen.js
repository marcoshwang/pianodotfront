import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import { saveUserConfig } from '../../services/pianodotApi';

const SettingsScreen = ({ navigation, styles, triggerVibration, stop, settings, updateSetting, fontSizeConfig, contrastConfig, resetSettings }) => {
  const [saveTimeout, setSaveTimeout] = useState(null);
  const [pendingSaves, setPendingSaves] = useState(new Set());
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

  const handleBack = () => {
    triggerVibration();
    stop();
    navigation.goBack();
  };

  /**
   * Mapear valores del frontend al backend
   */
  const mapFrontendToBackend = (field, value) => {
    if (field === 'fontSize') {
      const fontSizeMap = {
        'normal': 'normal',
        'large': 'grande',
        'extraLarge': 'extraGrande'
      };
      return { font_size: fontSizeMap[value] || 'normal' };
    } else if (field === 'contrast') {
      return { tema_preferido: value };
    } else if (field === 'vibration') {
      return { vibracion: value };
    }
    return {};
  };

  /**
   * Guardar configuración en el backend
   */
  const saveSettingToBackend = async (field, value) => {
    try {
      // Verificar autenticación
      const { getAuthToken } = await import('../../auth/cognitoAuth');
      const token = await getAuthToken();

      if (!token) {
        console.warn('⚠️ No hay sesión activa, no se guardará en backend');
        setPendingSaves(prev => {
          const newSet = new Set(prev);
          newSet.delete(field);
          return newSet;
        });
        return false;
      }

      // Construir payload
      const payload = mapFrontendToBackend(field, value);

      await saveUserConfig(payload);

      // Remover de pendientes
      setPendingSaves(prev => {
        const newSet = new Set(prev);
        newSet.delete(field);
        return newSet;
      });

      return true;
    } catch (error) {
      console.error('Error guardando configuración:', error);
      
      // Remover de pendientes
      setPendingSaves(prev => {
        const newSet = new Set(prev);
        newSet.delete(field);
        return newSet;
      });
      
      // Solo mostrar alerta si no es error de autenticación
      if (error.status !== 401) {
        Alert.alert(
          'Error al guardar',
          'No se pudo guardar la configuración en el servidor. El cambio se aplicó localmente.',
          [{ text: 'OK' }]
        );
      }
      
      return false;
    }
  };

  /**
   * Manejar cambio de configuración con debouncing
   */
  const handleSettingChange = (setting, value) => {
    triggerVibration();
    
    // Actualizar UI inmediatamente (optimistic update)
    updateSetting(setting, value);
    
    // Marcar como pendiente de guardar
    setPendingSaves(prev => new Set(prev).add(setting));
    
    // Cancelar timeout anterior si existe
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    
    // Esperar 800ms antes de guardar (debouncing)
    const timeout = setTimeout(() => {
      saveSettingToBackend(setting, value);
    }, 800);
    
    setSaveTimeout(timeout);
  };

  const handleLogout = async () => {
    if (isLoggingOut) {
      return; // Prevenir múltiples clicks
    }

    // Si hay cambios pendientes, advertir
    if (pendingSaves.size > 0) {
      Alert.alert(
        'Cambios pendientes',
        'Hay cambios que aún no se han guardado. ¿Deseas continuar?',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Continuar',
            onPress: () => proceedWithLogout(),
          },
        ]
      );
      return;
    }

    // Si no hay cambios pendientes, proceder directamente
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
          onPress: () => proceedWithLogout(),
        },
      ]
    );
  };

  const proceedWithLogout = async () => {
    try {
      setIsLoggingOut(true);
      triggerVibration();
      
      // Cancelar cualquier guardado pendiente
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
      
      // 1. Resetear configuraciones localmente (SIN sincronizar con backend)
      if (resetSettings) {
        try {
          await resetSettings(true); // true = skipBackendSync
        } catch (resetError) {
        }
      }
      
      // 2. Limpiar todos los datos de autenticación (incluye signOut de Cognito)
      try {
        const { clearAllAuthData } = await import('../../auth/cognitoAuth');
        await clearAllAuthData();
      } catch (authError) {
        console.error('Error limpiando autenticación:', authError);
        // Continuar de todas formas
      }
      
      // 3. Navegar a Welcome (reset completo del stack)
      navigation.reset({
        index: 0,
        routes: [{ name: 'Welcome' }],
      });
      
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      setIsLoggingOut(false);
      
      Alert.alert(
        'Error',
        'Hubo un problema al cerrar sesión. Por favor, intenta nuevamente.',
        [{ text: 'OK' }]
      );
    }
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
              onPress={() => handleSettingChange('fontSize', 'normal')}
              disabled={isLoggingOut}
              accessibilityLabel="Tamaño normal"
              accessibilityRole="button"
              accessibilityState={{ selected: settings.fontSize === 'normal' }}
              accessibilityHint="Seleccionar tamaño normal para texto y botones"
            >
              <Text style={[styles.optionText, settings.fontSize === 'normal' && styles.selectedOptionText]}>
                NORMAL
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.optionButton, settings.fontSize === 'large' && styles.selectedOption]}
              onPress={() => handleSettingChange('fontSize', 'large')}
              disabled={isLoggingOut}
              accessibilityLabel="Tamaño grande"
              accessibilityRole="button"
              accessibilityState={{ selected: settings.fontSize === 'large' }}
              accessibilityHint="Seleccionar tamaño grande para texto y botones"
            >
              <Text style={[styles.optionText, settings.fontSize === 'large' && styles.selectedOptionText]}>
                GRANDE
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.optionButton, settings.fontSize === 'extraLarge' && styles.selectedOption]}
              onPress={() => handleSettingChange('fontSize', 'extraLarge')}
              disabled={isLoggingOut}
              accessibilityLabel="Tamaño extra grande"
              accessibilityRole="button"
              accessibilityState={{ selected: settings.fontSize === 'extraLarge' }}
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
              onPress={() => handleSettingChange('contrast', 'whiteBlack')}
              disabled={isLoggingOut}
              accessibilityLabel="Tema claro"
              accessibilityRole="button"
              accessibilityState={{ selected: settings.contrast === 'whiteBlack' }}
              accessibilityHint="Seleccionar tema claro con contraste blanco y negro"
            >
              <Text style={[styles.optionText, settings.contrast === 'whiteBlack' && styles.selectedOptionText]}>
                TEMA CLARO
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.optionButton, settings.contrast === 'blackWhite' && styles.selectedOption]}
              onPress={() => handleSettingChange('contrast', 'blackWhite')}
              disabled={isLoggingOut}
              accessibilityLabel="Tema oscuro"
              accessibilityRole="button"
              accessibilityState={{ selected: settings.contrast === 'blackWhite' }}
              accessibilityHint="Seleccionar tema oscuro con contraste negro y blanco"
            >
              <Text style={[styles.optionText, settings.contrast === 'blackWhite' && styles.selectedOptionText]}>
                TEMA OSCURO
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.optionButton, settings.contrast === 'blackYellow' && styles.selectedOption]}
              onPress={() => handleSettingChange('contrast', 'blackYellow')}
              disabled={isLoggingOut}
              accessibilityLabel="Tema de alto contraste amarillo"
              accessibilityRole="button"
              accessibilityState={{ selected: settings.contrast === 'blackYellow' }}
              accessibilityHint="Seleccionar tema de alto contraste amarillo"
            >
              <Text style={[styles.optionText, settings.contrast === 'blackYellow' && styles.selectedOptionText]}>
                TEMA CONTRASTE AMARILLO
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.optionButton, settings.contrast === 'blackBlue' && styles.selectedOption]}
              onPress={() => handleSettingChange('contrast', 'blackBlue')}
              disabled={isLoggingOut}
              accessibilityLabel="Tema de alto contraste azul"
              accessibilityRole="button"
              accessibilityState={{ selected: settings.contrast === 'blackBlue' }}
              accessibilityHint="Seleccionar tema de alto contraste azul"
            >
              <Text style={[styles.optionText, settings.contrast === 'blackBlue' && styles.selectedOptionText]}>
                TEMA CONTRASTE AZUL
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.optionButton, settings.contrast === 'blackGreen' && styles.selectedOption]}
              onPress={() => handleSettingChange('contrast', 'blackGreen')}
              disabled={isLoggingOut}
              accessibilityLabel="Tema de alto contraste verde"
              accessibilityRole="button"
              accessibilityState={{ selected: settings.contrast === 'blackGreen' }}
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
              onPress={() => handleSettingChange('vibration', true)}
              disabled={isLoggingOut}
              accessibilityLabel="Activar vibración"
              accessibilityRole="button"
              accessibilityState={{ selected: settings.vibration === true }}
              accessibilityHint="Activar vibración al tocar botones"
            >
              <Text style={[styles.optionText, settings.vibration === true && styles.selectedOptionText]}>
                ACTIVADA
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.optionButton, settings.vibration === false && styles.selectedOption]}
              onPress={() => handleSettingChange('vibration', false)}
              disabled={isLoggingOut}
              accessibilityLabel="Desactivar vibración"
              accessibilityRole="button"
              accessibilityState={{ selected: settings.vibration === false }}
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
              style={[
                styles.logoutButton,
                isLoggingOut && { opacity: 0.5 }
              ]}
              onPress={handleLogout}
              disabled={isLoggingOut}
              accessibilityLabel="Cerrar sesión"
              accessibilityRole="button"
              accessibilityHint="Cerrar sesión y eliminar todos los datos guardados"
              accessibilityState={{ disabled: isLoggingOut }}
            >
              <Text style={styles.logoutButtonText}>
                {isLoggingOut ? 'CERRANDO SESIÓN...' : 'CERRAR SESIÓN'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;
