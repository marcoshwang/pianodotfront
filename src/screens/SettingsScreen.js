import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import { saveUserConfig } from '../../services/pianodotApi';

const SettingsScreen = ({ navigation, styles, triggerVibration, stop, settings, updateSetting, fontSizeConfig, contrastConfig, resetSettings }) => {
  const [saveTimeout, setSaveTimeout] = useState(null);
  const [pendingSaves, setPendingSaves] = useState(new Set());

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
   * @param {string} field - Campo a actualizar ('fontSize', 'contrast', 'vibration')
   * @param {any} value - Valor a guardar
   */
  const saveSettingToBackend = async (field, value) => {
    try {
      // Verificar autenticación
      const { getAuthToken } = await import('../../utils/mockAuth');
      const token = await getAuthToken();

      if (!token) {
        throw new Error('No hay sesión activa');
      }

      // Construir el payload mapeando valores del frontend al backend
      const payload = mapFrontendToBackend(field, value);

      console.log('💾 Guardando configuración:', payload);
      console.log('📤 Haciendo PATCH a /users/me/config con payload:', JSON.stringify(payload, null, 2));

      // Usar la función centralizada de pianodotApi
      await saveUserConfig(payload);
      console.log('✅ Configuración guardada exitosamente en el backend (PATCH /users/me/config)');

      // Remover de pendientes
      setPendingSaves(prev => {
        const newSet = new Set(prev);
        newSet.delete(field);
        return newSet;
      });

      return true;
    } catch (error) {
      console.error('❌ Error guardando configuración:', error);
      
      // Remover de pendientes
      setPendingSaves(prev => {
        const newSet = new Set(prev);
        newSet.delete(field);
        return newSet;
      });
      
      Alert.alert(
        'Error al guardar',
        'No se pudo guardar la configuración en el servidor. El cambio se aplicó localmente pero no se sincronizó.',
        [{ text: 'OK' }]
      );
      
      return false;
    }
  };

  /**
   * Manejar cambio de configuración con debouncing
   * @param {string} setting - Nombre del setting ('fontSize', 'contrast', 'vibration')
   * @param {any} value - Valor a establecer
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
    // Si hay cambios pendientes, forzar guardado antes de logout
    if (pendingSaves.size > 0) {
      Alert.alert(
        'Guardando cambios',
        'Hay cambios pendientes de guardar. Espera un momento...',
        [{ text: 'OK' }]
      );
      
      // Esperar a que termine el timeout
      if (saveTimeout) {
        clearTimeout(saveTimeout);
        // Esperar un momento para que se completen los guardados pendientes
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

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
              console.log('🚪 Iniciando cierre de sesión...');
              
              // 1. Resetear configuraciones localmente (SIN sincronizar con backend)
              if (resetSettings) {
                console.log('🔄 Reseteando configuraciones localmente (sin PATCH)...');
                await resetSettings(true); // true = skipBackendSync
                console.log('✅ Configuraciones reseteadas localmente');
              }
              
              // 2. Cerrar sesión de Cognito
              try {
                const { signOut } = await import('aws-amplify/auth');
                console.log('🔐 Cerrando sesión de Cognito...');
                await signOut();
                console.log('✅ Sesión de Cognito cerrada');
              } catch (cognitoError) {
                console.warn('⚠️ Error cerrando sesión de Cognito:', cognitoError.message);
              }
              
              // 3. Limpiar todos los datos de autenticación
              const { clearAllAuthData } = await import('../../utils/mockAuth');
              console.log('🗑️ Limpiando datos de autenticación...');
              await clearAllAuthData();
              console.log('✅ Datos de autenticación limpiados');
              
              // 4. Navegar a Welcome (reset completo del stack de navegación)
              console.log('🏠 Navegando a Welcome...');
              navigation.reset({
                index: 0,
                routes: [{ name: 'Welcome' }],
              });
              
              console.log('✅ Cierre de sesión completado');
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
              onPress={() => handleSettingChange('fontSize', 'normal')}
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
