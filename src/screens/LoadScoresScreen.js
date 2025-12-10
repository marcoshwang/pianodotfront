import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uploadPartitura, testUploadEndpoint, testPostConnectivity, testPartiturasPostEndpoint } from '../../services/pianodotApi';
import { usePractice } from '../context/PracticeContext';

const LoadScoresScreen = ({ navigation, styles, triggerVibration, stop }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  
  const { clearPractice, stopAudio, clearPreloadedSounds, clearAudioCache } = usePractice();

  useEffect(() => {
    const cleanupPreviousPractice = async () => {
      try {
        await stopAudio();
        await new Promise(resolve => setTimeout(resolve, 100));
        await clearPreloadedSounds();
        await clearPractice(false);
        clearAudioCache();

      } catch (error) {
        console.error('Error limpiando práctica:', error);
      }
    };

    cleanupPreviousPractice();
  }, []);

  const handleFileUpload = async () => {
    triggerVibration();
    
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false,
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
    }
  };

  const handleConfirmUpload = async () => {
    triggerVibration();
    
    if (selectedFiles.length > 0) {
      try {
        setUploading(true);
        setUploadError(null);
        const file = selectedFiles[0];
        const uploadedPartitura = await uploadPartitura(file);
        const existingFilesString = await AsyncStorage.getItem('savedScores');
        const existingFiles = existingFilesString ? JSON.parse(existingFilesString) : [];
        const updatedFiles = [...existingFiles, file];
        await AsyncStorage.setItem('savedScores', JSON.stringify(updatedFiles));
        
        setSelectedFiles([]);
        
        await stopAudio();
        await clearPreloadedSounds();
        clearAudioCache();
        
        navigation.navigate('ScoreDetail', { score: uploadedPartitura });
      } catch (error) {
        console.error('Error en handleConfirmUpload:', error);
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        setUploadError(error.message || 'Error al subir el archivo. Por favor, intenta de nuevo.');
      } finally {
        setUploading(false);
      }
    } else {
      setUploadError('No se seleccionaron archivos');
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
        
        {uploadError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error: {uploadError}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => setUploadError(null)}
            >
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {!uploading && selectedFiles.length === 0 ? (
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
        ) : !uploading && (
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
                style={[styles.mainButton, uploading && styles.disabledButton]}
                onPress={handleConfirmUpload}
                disabled={uploading}
                accessibilityLabel="Confirmar carga"
                accessibilityRole="button"
                accessibilityHint="Toca para confirmar la carga de los archivos seleccionados"
              >
                <Text style={[styles.buttonText, uploading && styles.disabledButtonText]}>
                  {uploading ? 'SUBIENDO...' : 'CONFIRMAR\nCARGA'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

export default LoadScoresScreen;