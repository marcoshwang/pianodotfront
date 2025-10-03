import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';

const PianoScreen = ({ styles, triggerVibration, stop, setCurrentScreen, selectedScore, settings, getCurrentSizeConfig, getCurrentContrastConfig }) => {
  const handleGoBack = () => {
    triggerVibration();
    stop();
    setCurrentScreen('scoreDetail');
  };

  const handleControls = () => {
    triggerVibration();
    setCurrentScreen('controls');
  };

  // Función para determinar si necesita separar el texto según el tamaño
  const getControlesText = () => {
    // Si el tamaño de fuente es grande o extra grande, separar el texto
    if ( settings?.fontSize === 'extraLarge') {
      return 'CONTROLES';
    }
    return 'CONTROLES';
  };

  // Función para obtener el padding vertical del botón controles
  const getControlesPadding = () => {
    if (settings?.fontSize === 'normal') {
      return sizeConfig.buttonPadding * 9;
    }
    return sizeConfig.buttonPadding * 5;
  };

  // Obtener configuraciones dinámicas
  const sizeConfig = getCurrentSizeConfig();
  const contrastConfig = getCurrentContrastConfig();


  if (!selectedScore) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleGoBack}
            accessibilityLabel="Volver atrás"
            accessibilityRole="button"
            accessibilityHint="Regresar a la pantalla anterior"
          >
            <Text style={styles.backButtonText}>VOLVER</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          <Text style={styles.description}>Error: No se encontró la partitura seleccionada</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleGoBack}
          accessibilityLabel="Volver atrás"
          accessibilityRole="button"
          accessibilityHint="Regresar a los detalles de la partitura"
        >
          <Text style={styles.backButtonText}>VOLVER</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <ScrollView 
          style={styles.pianoScrollContainer}
          contentContainerStyle={styles.pianoScrollContent}
          showsVerticalScrollIndicator={true}
          showsHorizontalScrollIndicator={true}
        >
          <View style={styles.pianoContainer}>
            <Image 
              source={require('../../img/piano-stretched.png')} 
              style={[
                styles.pianoImage,
                {
                  minHeight: sizeConfig.buttonText * 8,
                  maxHeight: sizeConfig.buttonText * 12,
                }
              ]}
              resizeMode="contain"
              accessibilityLabel="Teclado de piano"
            />
          </View>
        </ScrollView>

        <View style={styles.pianoControls}>
          <TouchableOpacity
            style={[
              styles.controlsButton,
              {
                paddingVertical: getControlesPadding(),
              }
            ]}
            onPress={handleControls}
            accessibilityLabel="Controles"
            accessibilityRole="button"
            accessibilityHint="Abrir controles de reproducción"
          >
            <Text style={styles.controlsButtonText}>{getControlesText()}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default PianoScreen;
