import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

const ControlsScreen = ({ styles, triggerVibration, stop, setCurrentScreen, settings, getCurrentSizeConfig, getCurrentContrastConfig }) => {
  const handleGoBack = () => {
    triggerVibration();
    stop();
    setCurrentScreen('piano');
  };

  const handleButtonPress = (buttonNumber) => {
    triggerVibration();
    console.log(`Botón ${buttonNumber} presionado`);
    // Aquí se implementaría la lógica específica de cada botón
  };

  // Obtener configuraciones dinámicas
  const sizeConfig = getCurrentSizeConfig();
  const contrastConfig = getCurrentContrastConfig();

  // Función para determinar si necesita separar el texto según el tamaño
  const getReproducirText = () => {
    // Si el tamaño de fuente es grande o extra grande, separar el texto
    if (settings?.fontSize === 'large' || settings?.fontSize === 'extraLarge') {
      return 'REPRODU\nCIR COMPÁS';
    }
    return 'REPRODUCIR\nCOMPÁS';
  };

  // Función para obtener el padding vertical de los botones de control
  const getControlPadding = () => {
    if (settings?.fontSize === 'normal') {
      return sizeConfig.buttonPadding * 3;
    }
    return sizeConfig.buttonPadding * 1.2;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
          accessibilityLabel="Volver"
          accessibilityRole="button"
          accessibilityHint="Regresar a la pantalla anterior"
        >
          <Text style={styles.backButtonText}>VOLVER</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.controlsContainer}>
        <View style={styles.controlsButtonsContainer}>
          <TouchableOpacity
            style={[
              styles.controlButton,
              {
                paddingVertical: getControlPadding(),
              }
            ]}
            onPress={() => handleButtonPress(1)}
            accessibilityLabel="Reproducir compás"
            accessibilityRole="button"
            accessibilityHint="Presionar para reproducir el compás actual"
          >
            <Text style={styles.controlButtonText}>{getReproducirText()}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.controlButton,
              {
                paddingVertical: getControlPadding(),
              }
            ]}
            onPress={() => handleButtonPress(2)}
            accessibilityLabel="Repetir compás"
            accessibilityRole="button"
            accessibilityHint="Presionar para repetir el compás actual"
          >
            <Text style={styles.controlButtonText}>REPETIR{'\n'}COMPÁS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.controlButton,
              {
                paddingVertical: getControlPadding(),
              }
            ]}
            onPress={() => handleButtonPress(3)}
            accessibilityLabel="Siguiente compás"
            accessibilityRole="button"
            accessibilityHint="Presionar para avanzar al siguiente compás"
          >
            <Text style={styles.controlButtonText}>SIGUIENTE{'\n'}COMPÁS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.controlButton,
              {
                paddingVertical: getControlPadding(),
              }
            ]}
            onPress={() => handleButtonPress(4)}
            accessibilityLabel="Anterior compás"
            accessibilityRole="button"
            accessibilityHint="Presionar para retroceder al compás anterior"
          >
            <Text style={styles.controlButtonText}>ANTERIOR{'\n'}COMPÁS</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ControlsScreen;
