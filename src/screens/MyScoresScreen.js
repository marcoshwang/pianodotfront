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
      console.log('🔄 Pantalla enfocada - sincronizando con backend...');
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
      
      console.log('🔄 Sincronizando con el backend...');
      console.log('URL base configurada:', getBaseURL());
      
      // Obtener partituras directamente del backend
      const backendScores = await getPartituras();
      console.log('✅ Partituras obtenidas del backend:', backendScores);
      
      // Actualizar estado con las partituras del backend
      setSavedScores(backendScores);
      
      // También actualizar AsyncStorage como respaldo
      await AsyncStorage.setItem('savedScores', JSON.stringify(backendScores));
      console.log('💾 Partituras guardadas en AsyncStorage como respaldo');
      
    } catch (error) {
      console.error('❌ Error al sincronizar con el backend:', error);
      setError(error.message);
      
      // Si falla el backend, cargar desde AsyncStorage como respaldo
      try {
        console.log('🔄 Cargando desde respaldo local...');
        const savedScoresString = await AsyncStorage.getItem('savedScores');
        if (savedScoresString) {
          const scores = JSON.parse(savedScoresString);
          setSavedScores(scores);
          console.log('✅ Partituras cargadas desde respaldo local:', scores.length);
        } else {
          console.log('⚠️ No hay partituras en respaldo local');
        }
      } catch (localError) {
        console.error('❌ Error cargando partituras locales:', localError);
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
      console.log('🗑️ Iniciando eliminación de partitura:', score.name);
      console.log('🗑️ Score data:', score);
      console.log('🗑️ Score ID:', score.id);
      
      // Si tiene ID del backend, eliminar del backend
      if (score.id) {
        console.log('🗑️ Eliminando del backend con ID:', score.id);
        try {
          await deletePartitura(score.id);
          console.log('✅ Partitura eliminada del backend exitosamente');
        } catch (backendError) {
          console.error('❌ Error eliminando del backend:', backendError);
          throw new Error(`Error eliminando del backend: ${backendError.message}`);
        }
      } else {
        console.log('⚠️ La partitura no tiene ID del backend, solo se eliminará localmente');
      }
      
      // Recargar partituras desde el backend para sincronizar
      console.log('🔄 Sincronizando después de eliminar...');
      await loadSavedScores();
      
      console.log('✅ Partitura eliminada y sincronizada correctamente');
    } catch (error) {
      console.error('❌ Error al eliminar partitura:', error);
      console.error('❌ Error type:', error.constructor.name);
      console.error('❌ Error message:', error.message);
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
