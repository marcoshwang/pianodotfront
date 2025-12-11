import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';

const TutorialScreen = ({ navigation, styles, triggerVibration, stop }) => {
  const handleBack = () => {
    triggerVibration();
    stop();
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          accessibilityLabel="Volver atrás"
          accessibilityRole="button"
          accessibilityHint="Regresar a la pantalla de configuración"
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
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>TUTORIAL</Text>
          
          <Text style={[styles.description, { textAlign: 'left', marginBottom: 15 }]}>
            A continuación se detallan algunos conceptos básicos de la práctica de piano, que sirven como introducción si sos un usuario nuevo de este instrumento.
          </Text>

          <Text style={[styles.description, { textAlign: 'left', marginBottom: 15 }]}>
            La posición inicial básica para comenzar a tocar el piano es aquella donde cada mano adopta una posición de descanso sobre cinco teclas consecutivas. El contexto de la pieza musical es determinante para donde arrancar, o con que dedo hacerlo, sin embargo, la posición inicial general de descanso para cada mano es la siguiente. Tener en cuenta que se menciona la referencia espacial de cada nota mencionada, tal como se realiza durante las prácticas dentro de PianoDot.
          </Text>

          <Text style={[styles.description, { textAlign: 'left', marginBottom: 15 }]}>
            Primero, tenemos la mano derecha. El dedo Pulgar se ubica sobre Do (tecla grande a la izquierda del grupo de dos pequeñas), el dedo Índice se ubica sobre Re (1 tecla grande a la derecha del Do), el dedo Medio se ubica sobre Mi (1 tecla grande a la derecha del Re), el dedo Anular se ubica sobre Fa (1 tecla grande a la derecha del Mi) y el dedo Meñique se ubica sobre Sol (1 tecla grande a la derecha del Fa).
          </Text>

          <Text style={[styles.description, { textAlign: 'left', marginBottom: 15 }]}>
            Por su parte, la mano izquierda tiene la estructura contraria. El dedo Meñique se ubica sobre Do, el dedo Anular se ubica sobre Re, el dedo Medio se ubica sobre Mi, el dedo Índice se ubica sobre Fa y el dedo Pulgar se ubica sobre Sol.
          </Text>

          <Text style={[styles.description, { textAlign: 'left', marginTop: 10, marginBottom: 15 }]}>
            También, es necesario tener en cuenta algunos principios generales de la digitación, los cuales no son concluyentes, pero sí ayudan a tener noción de cómo se dispondrán.
          </Text>

          <Text style={[styles.description, { textAlign: 'left', marginBottom: 10 }]}>
            1. El Pulgar y el Meñique suelen ubicarse en los extremos de una frase musical.
          </Text>
          
          <Text style={[styles.description, { textAlign: 'left', marginBottom: 10 }]}>
            2. El Pulgar puede pasar por debajo de los otros dedos para extender el alcance de la mano sin cambiar de posición.
          </Text>
          
          <Text style={[styles.description, { textAlign: 'left', marginBottom: 15 }]}>
            3. El Anular es el dedo más débil, por lo que dependiendo el contexto, se prefiere usar otra alternativa.
          </Text>

          <Text style={[styles.description, { textAlign: 'left', marginTop: 10, marginBottom: 15 }]}>
            A pesar de existir múltiples reglas para la digitación, es importante comprender que este es un fenómeno contextual, por lo que su secuencia óptima no es fija para cada nota, sino que depende del contexto musical. El contexto musical son las notas anteriores, las siguientes, y la dirección melódica, entre otros, que influyen en esta elección. Es debido a esta razón que sugerimos que comiences a practicar con PianoDot, ya que esta aplicación analiza cada partitura y sugiere la digitación óptima basada en el contexto mencionado, aplicando principios ergonómicos para facilitarte la ejecución.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TutorialScreen;

