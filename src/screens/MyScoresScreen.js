import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPartituras, deletePartitura, testConnectivity, testMultipleURLs, testPartiturasEndpoint } from '../../services/pianodotApi';
import { getBaseURL } from '../../config/api.config';

const MyScoresScreen = ({ navigation, styles, triggerVibration, stop }) => {
  const [savedScores, setSavedScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Cargar partituras guardadas al montar el componente
  useEffect(() => {
    loadSavedScores();
  }, []);

  // Sincronizar automáticamente cada vez que el usuario entre a la pantalla
  useFocusEffect(
    React.useCallback(() => {
      loadSavedScores();
    }, [])
  );

  const loadSavedScores = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const backendScores = await getPartituras();
      
      // Actualizar estado con las partituras del backend
      setSavedScores(backendScores);
      
      // También actualizar AsyncStorage como respaldo
      await AsyncStorage.setItem('savedScores', JSON.stringify(backendScores));
      
    } catch (error) {
      console.error('Error al sincronizar con el backend:', error);
      setError(error.message);
      
      // Si falla el backend, cargar desde AsyncStorage como respaldo
      try {
        const savedScoresString = await AsyncStorage.getItem('savedScores');
        if (savedScoresString) {
          const scores = JSON.parse(savedScoresString);
          setSavedScores(scores);
        }
      } catch (localError) {
        console.error('Error cargando partituras locales:', localError);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleGoBack = () => {
    triggerVibration();
    stop();
    navigation.navigate('Home');
  };

  const handlePlayScore = (score) => {
    triggerVibration();
    navigation.navigate('ScoreDetail', { score });
  };

  const handleDeleteScore = async (scoreIndex) => {
    triggerVibration();
    const score = savedScores[scoreIndex];
    
    try {
      // Si tiene ID del backend, eliminar del backend
      if (score.id) {
        try {
          await deletePartitura(score.id);
        } catch (backendError) {
          console.error('Error eliminando del backend:', backendError);
          throw new Error(`Error eliminando del backend: ${backendError.message}`);
        }
      }
      
      // Recargar partituras desde el backend para sincronizar
      await loadSavedScores();
      
    } catch (error) {
      console.error('Error al eliminar partitura:', error);
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      Alert.alert('Error', `No se pudo eliminar la partitura: ${error.message}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleGoBack}
          accessibilityLabel="Volver atrás"
          accessibilityRole="button"
          accessibilityHint="Regresar a la pantalla principal"
        >
          <Text style={styles.backButtonText}>VOLVER</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.description}>Cargando partituras...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error: {error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => loadSavedScores()}
            >
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : savedScores.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.description}>
              No tienes partituras guardadas aún.
            </Text>
            <Text style={styles.description}>
              Ve a "Cargar Partituras" para agregar tus primeras partituras.
            </Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.scrollContainer} 
            showsVerticalScrollIndicator={true}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadSavedScores(true)}
                colors={['#007AFF']}
                tintColor="#007AFF"
              />
            }
          >
            {savedScores.map((score, index) => (
              <View key={index} style={styles.scoreItem}>
                <TouchableOpacity
                  style={styles.scoreButton}
                  onPress={() => handlePlayScore(score)}
                  accessibilityLabel={`Partitura ${score.name}`}
                  accessibilityRole="button"
                  accessibilityHint="Toca para reproducir esta partitura"
                >
                  <Text style={styles.scoreName}>{score.name}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteScore(index)}
                  accessibilityLabel={`Eliminar ${score.name}`}
                  accessibilityRole="button"
                  accessibilityHint="Elimina esta partitura de tu colección"
                >
                  <Text style={styles.deleteButtonText}>ELIMINAR</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

export default MyScoresScreen;
