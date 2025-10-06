import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoadScoresScreen = ({ navigation, styles, triggerVibration, stop }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleFileUpload = async () => {
    triggerVibration();
    
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Permite seleccionar cualquier tipo de archivo
        copyToCacheDirectory: true,
        multiple: false, // Solo permite seleccionar un archivo
      });

      if (!result.canceled && result.assets) {
        const file = {
          name: result.assets[0].name,
          size: result.assets[0].size,
          uri: result.assets[0].uri,
          mimeType: result.assets[0].mimeType
        };
        
        setSelectedFiles([file]);
      }
    } catch (error) {
      console.error('Error al seleccionar archivos:', error);
      Alert.alert('Error', 'No se pudieron seleccionar los archivos');
    }
  };

  const handleConfirmUpload = async () => {
    triggerVibration();
    if (selectedFiles.length > 0) {
      try {
        console.log('Confirmando carga de archivos:', selectedFiles);
        
        // Obtener archivos existentes de AsyncStorage
        const existingFilesString = await AsyncStorage.getItem('savedScores');
        const existingFiles = existingFilesString ? JSON.parse(existingFilesString) : [];
        
        // Agregar nuevos archivos a la lista existente
        const updatedFiles = [...existingFiles, ...selectedFiles];
        
        // Guardar la lista actualizada en AsyncStorage
        await AsyncStorage.setItem('savedScores', JSON.stringify(updatedFiles));
        
        setSelectedFiles([]);
        
        // Navegar con el score como parámetro
        const firstFile = selectedFiles[0];
        navigation.navigate('ScoreDetail', { score: firstFile });
      } catch (error) {
        console.error('Error al guardar archivos:', error);
        Alert.alert('Error', 'No se pudieron guardar los archivos en la aplicación');
      }
    }
  };

  const handleClearFiles = () => {
    triggerVibration();
    setSelectedFiles([]);
  };

  const handleGoBack = () => {
    triggerVibration();
    stop();
    navigation.navigate('Home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleGoBack}
          accessibilityLabel="Volver atrás"
          accessibilityRole="button"
          accessibilityHint="Regresar a la pantalla principal, siempre se mantiene en el superior"
        >
          <Text style={styles.backButtonText}>VOLVER</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {selectedFiles.length === 0 ? (
          <TouchableOpacity 
            style={styles.fullScreenButton}
            onPress={handleFileUpload}
            accessibilityLabel="Seleccionar archivo de partitura"
            accessibilityRole="button"
            accessibilityHint="Toca para seleccionar un archivo de partitura desde el almacenamiento"
          >
            <Text style={styles.fullScreenButtonText}>
              SELECCIONAR{'\n'}ARCHIVO DE{'\n'}PARTITURA
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity 
              style={styles.selectedFilesContainer}
              onPress={handleFileUpload}
              accessibilityLabel="Archivo seleccionado. Toca para seleccionar otro archivo"
              accessibilityRole="button"
              accessibilityHint="Archivo de partitura seleccionado. Toca para seleccionar otro archivo"
            >
              <View style={styles.filesHeader}>
                <Text style={styles.selectedFilesTitle}>
                  Archivo seleccionado:
                </Text>
              </View>
              {selectedFiles.map((file, index) => (
                <View key={index} style={styles.fileItem}>
                  <Text style={styles.selectedFileText}>• {file.name}</Text>
                </View>
              ))}
            </TouchableOpacity>

            <View style={styles.buttonsContainer}>
              <TouchableOpacity 
                style={styles.mainButton}
                onPress={handleClearFiles}
                accessibilityLabel="Limpiar archivo seleccionado"
                accessibilityRole="button"
                accessibilityHint="Elimina el archivo seleccionado"
              >
                <Text style={styles.buttonText}>LIMPIAR{'\n'}ARCHIVO</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.mainButton}
                onPress={handleConfirmUpload}
                accessibilityLabel="Confirmar carga"
                accessibilityRole="button"
                accessibilityHint="Toca para confirmar la carga de los archivos seleccionados"
              >
                <Text style={styles.buttonText}>CONFIRMAR{'\n'}CARGA</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

export default LoadScoresScreen;
