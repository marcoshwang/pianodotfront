import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MyScoresScreen = ({ navigation, styles, triggerVibration, stop, setSelectedScore }) => {
  const [savedScores, setSavedScores] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar partituras guardadas al montar el componente
  useEffect(() => {
    loadSavedScores();
  }, []);

  const loadSavedScores = async () => {
    try {
      const savedScoresString = await AsyncStorage.getItem('savedScores');
      if (savedScoresString) {
        const scores = JSON.parse(savedScoresString);
        setSavedScores(scores);
      }
    } catch (error) {
      console.error('Error al cargar partituras:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    triggerVibration();
    stop();
    navigation.navigate('Home');
  };

  const handlePlayScore = (score) => {
    triggerVibration();
    setSelectedScore(score);
    navigation.navigate('ScoreDetail');
  };

  const handleDeleteScore = async (scoreIndex) => {
    triggerVibration();
    try {
      const updatedScores = savedScores.filter((_, index) => index !== scoreIndex);
      await AsyncStorage.setItem('savedScores', JSON.stringify(updatedScores));
      setSavedScores(updatedScores);
    } catch (error) {
      console.error('Error al eliminar partitura:', error);
      Alert.alert('Error', 'No se pudo eliminar la partitura');
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
          <Text style={styles.description}>Cargando partituras...</Text>
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
          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={true}>
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
