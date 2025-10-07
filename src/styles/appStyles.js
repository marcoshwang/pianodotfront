import { StyleSheet } from 'react-native';

// Función para obtener estilos dinámicos
export const getDynamicStyles = (sizeConfig, contrastConfig, currentTheme) => {
  return StyleSheet.create({
    // Estilos principales de la aplicación
    appContainer: {
      flex: 1,
      backgroundColor: contrastConfig.backgroundColor,
    },
    
    container: {
      flex: 1,
      backgroundColor: contrastConfig.backgroundColor,
      paddingHorizontal: 20,
      paddingTop: 10,
      width: '100%',
    },
    
    header: {
      alignItems: 'center',
      marginTop: 20,
      marginBottom: sizeConfig.buttonPadding,
      paddingTop: 15,
      paddingHorizontal: 0,
    },
    
    logo: {
      width: 250,
      height: 100,
      resizeMode: 'contain',
      marginBottom: 15,
    },
    
    subtitle: {
      fontSize: sizeConfig.subtitleSize,
      color: contrastConfig.subtitleColor,
      textAlign: 'center',
    },
    
    buttonsContainer: {
      flex: 1,
      justifyContent: 'space-evenly',
      paddingTop: sizeConfig.buttonPadding,
      paddingBottom: sizeConfig.buttonPadding,
    },
    
    mainButton: {
      backgroundColor: contrastConfig.buttonColor,
      borderRadius: 20,
      paddingVertical: sizeConfig.buttonPadding * 1.2,
      paddingHorizontal: 20,
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      marginVertical: 10,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      elevation: 8,
    },
    
    buttonText: {
      color: contrastConfig.textColor,
      fontSize: sizeConfig.buttonText * 1.0,
      fontFamily: 'Fredoka_700Bold',
      textAlign: 'center',
      letterSpacing: 1,
      lineHeight: sizeConfig.buttonText * 1.0 * 1.2,
    },
    
    // Estilos del botón de volver
    backButton: {
      marginBottom: 5,
      width: '100%',
      paddingVertical: sizeConfig.buttonPadding * 1.5,
      paddingHorizontal: 30,
      borderRadius: 12,
      backgroundColor: contrastConfig.buttonColor,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 6,
    },
    
    backButtonText: {
      color: contrastConfig.textColor,
      fontSize: sizeConfig.buttonText * 1.1,
      fontFamily: 'Fredoka_700Bold',
      textAlign: 'center',
      letterSpacing: 1.5,
      lineHeight: sizeConfig.buttonText * 1.1 * 1.2,
    },
    
    // Estilos de títulos y contenido
    title: {
      fontSize: sizeConfig.buttonText / 1.1,
      fontFamily: 'Fredoka_600SemiBold',
      color: contrastConfig.subtitleColor,
      textAlign: 'center',
      marginTop: 5,
      marginBottom: 5,
    },
    
    content: {
      flex: 1,
      width: '100%',
      paddingHorizontal: 0,
      paddingTop: sizeConfig.buttonPadding,
      paddingBottom: 20,
    },
    
    description: {
      fontSize: sizeConfig.buttonText * 0.7,
      fontFamily: 'Fredoka_500Medium',
      color: contrastConfig.subtitleColor,
      textAlign: 'center',
      marginBottom: 20,
    },
    
    comingSoon: {
      fontSize: sizeConfig.buttonText * 0.6,
      fontFamily: 'Fredoka_400Regular',
      color: contrastConfig.subtitleColor,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    
    // Estilos para configuración
    settingsSection: {
      marginBottom: 20,
      width: '100%',
      alignItems: 'stretch',
      backgroundColor: contrastConfig.backgroundColor,
      borderRadius: 20,
      marginTop: 10,
      padding: 20,
      borderWidth: 2,
      borderColor: contrastConfig.buttonColor,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      justifyContent: 'flex-start',
    },
    
    sectionTitle: {
      fontSize: sizeConfig.buttonText / 1.1,
      fontFamily: 'Fredoka_600SemiBold',
      color: contrastConfig.subtitleColor,
      marginBottom: 15,
      textAlign: 'center',
      lineHeight: sizeConfig.buttonText / 1.1 * 1.2,
    },
    
    optionButton: {
      backgroundColor: contrastConfig.buttonColor,
      borderRadius: 12,
      paddingVertical: sizeConfig.buttonPadding * 1.5,
      paddingHorizontal: 20,
      marginVertical: 6,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: contrastConfig.backgroundColor,
      width: '100%',
      minHeight: sizeConfig.buttonText * 2.5,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.2,
      shadowRadius: 1.41,
      elevation: 2,
    },
    
    selectedOption: {
      borderColor: contrastConfig.subtitleColor,
      borderWidth: 2,
      backgroundColor: contrastConfig.subtitleColor,
    },
    
    selectedOptionText: {
      color: contrastConfig.backgroundColor,
    },
    
    optionText: {
      color: contrastConfig.textColor,
      fontSize: sizeConfig.buttonText / 1.2,
      fontFamily: 'Fredoka_600SemiBold',
      textAlign: 'center',
      lineHeight: sizeConfig.buttonText / 1.2 * 1.2,
    },
    
    // Estilos para pantalla de cargar partituras
    selectedFilesContainer: {
      backgroundColor: contrastConfig.buttonColor,
      borderRadius: 12,
      padding: 15,
      marginVertical: 20,
      borderWidth: 1,
      borderColor: contrastConfig.backgroundColor,
    },
    filesHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    selectedFilesTitle: {
      fontSize: sizeConfig.buttonText / 1.5,
      fontFamily: 'Fredoka_600SemiBold',
      color: contrastConfig.textColor,
      flex: 1,
    },
    clearButton: {
      backgroundColor: '#FF4444',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      marginLeft: 10,
    },
    clearButtonText: {
      color: '#FFFFFF',
      fontSize: sizeConfig.buttonText / 2.5,
      fontFamily: 'Fredoka_600SemiBold',
    },
    fileItem: {
      marginBottom: 8,
    },
    selectedFileText: {
      fontSize: sizeConfig.buttonText / 1.8,
      fontFamily: 'Fredoka_500Medium',
      color: contrastConfig.textColor,
      marginBottom: 2,
    },
    fileDetails: {
      fontSize: sizeConfig.buttonText / 2.2,
      fontFamily: 'Fredoka_400Regular',
      color: contrastConfig.textColor,
      opacity: 0.7,
      marginLeft: 10,
    },
    disabledButton: {
      backgroundColor: '#666666',
      opacity: 0.6,
    },
    disabledButtonText: {
      color: '#999999',
    },
    
    // Botón de pantalla completa
    fullScreenButton: {
      flex: 1,
      backgroundColor: contrastConfig.buttonColor,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
      paddingVertical: 40,
      marginHorizontal: 0,
      marginVertical: 15,
      width: '100%',
      minHeight: '75%',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 6,
      },
      shadowOpacity: 0.4,
      shadowRadius: 6.65,
      elevation: 12,
    },
    fullScreenButtonText: {
      color: contrastConfig.textColor,
      fontSize: sizeConfig.buttonText * 0.82,
      fontFamily: 'Fredoka_700Bold',
      textAlign: 'center',
      letterSpacing: sizeConfig.buttonText * 0.015,
      lineHeight: sizeConfig.buttonText * 0.85 * 1.4,
      flexWrap: 'wrap',
      width: '90%',
      paddingHorizontal: 10,
    },
    
    // Estilos para MyScoresScreen
    scrollContainer: {
      flex: 1,
      width: '100%',
      paddingTop: sizeConfig.buttonPadding,
    },
    
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginTop: 50,
    },
    
    scoreItem: {
      marginVertical: 16,
      paddingHorizontal: 0,
    },
    
    scoreContainer: {
      flexDirection: 'column',
      alignItems: 'stretch',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: 16,
      paddingHorizontal: 0,
      paddingVertical: 8,
      width: '100%',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 8,
    },
    
    scoreButton: {
      backgroundColor: contrastConfig.buttonColor,
      borderRadius: 12,
      paddingVertical: sizeConfig.buttonPadding * 1.5,
      paddingHorizontal: 30,
      width: '100%',
      marginBottom: 6,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 6,
    },
    
    scoreName: {
      color: contrastConfig.textColor,
      fontSize: sizeConfig.buttonText * 1.1,
      fontFamily: 'Fredoka_700Bold',
      textAlign: 'center',
      letterSpacing: 1.5,
      lineHeight: sizeConfig.buttonText * 1.1 * 1.2,
    },
    
    deleteButton: {
      backgroundColor: '#FF4444',
      borderRadius: 12,
      paddingVertical: sizeConfig.buttonPadding * 1.2,
      paddingHorizontal: 30,
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 6,
    },
    
    deleteButtonText: {
      color: '#FFFFFF',
      fontSize: sizeConfig.buttonText * 0.8,
      fontFamily: 'Fredoka_700Bold',
      textAlign: 'center',
      letterSpacing: 1.5,
      lineHeight: sizeConfig.buttonText * 0.8 * 1.2,
    },
    
    // Estilos para ScoreDetailScreen
    scoreDetailContainer: {
      flex: 1,
      justifyContent: 'center',
      paddingTop: sizeConfig.buttonPadding,
    },
    
    scoreDetailTitle: {
      fontSize: sizeConfig.buttonText * 1.2,
      fontFamily: 'Fredoka_700Bold',
      color: contrastConfig.subtitleColor,
      textAlign: 'center',
      marginBottom: 30,
      letterSpacing: 1,
      lineHeight: sizeConfig.buttonText * 1.2 * 1.2,
    },
    
    progressInfo: {
      backgroundColor: contrastConfig.backgroundColor,
      borderRadius: 16,
      padding: 20,
      marginBottom: 10,
      marginTop: 10,
      width: '100%',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: contrastConfig.buttonColor,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    
    progressText: {
      fontSize: sizeConfig.buttonText * 0.9,
      fontFamily: 'Fredoka_600SemiBold',
      color: contrastConfig.subtitleColor === '#76FF03' ? '#76FF03' : 
             contrastConfig.subtitleColor === '#3FE6FF' ? '#3FE6FF' : 
             contrastConfig.subtitleColor === '#FFFF00' ? '#FFFF00' : 
             contrastConfig.subtitleColor === '#FFFFFF' ? '#FFFFFF' : '#000000',
      textAlign: 'center',
      marginBottom: 5,
    },
    
    progressSubtext: {
      fontSize: sizeConfig.buttonText * 0.7,
      fontFamily: 'Fredoka_400Regular',
      color: contrastConfig.subtitleColor,
      textAlign: 'center',
      opacity: 0.8,
    },
    
    actionButtonsContainer: {
      flex: 1,
      justifyContent: 'space-evenly',
      paddingTop: sizeConfig.buttonPadding,
      paddingBottom: sizeConfig.buttonPadding,
    },
    
    actionButton: {
      backgroundColor: contrastConfig.buttonColor,
      borderRadius: 16,
      paddingVertical: sizeConfig.buttonPadding * 15,
      paddingHorizontal: 20,
      marginVertical: 15,
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      minHeight: '80%',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 6,
      },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 8,
    },
    
    actionButtonText: {
      color: contrastConfig.textColor,
      fontSize: sizeConfig.buttonText * 1.1,
      fontFamily: 'Fredoka_700Bold',
      textAlign: 'center',
      letterSpacing: 1.5,
      lineHeight: sizeConfig.buttonText * 1.1 * 1.3,
    },
    
    resetButton: {
      backgroundColor: '#FF6B6B',
      borderRadius: 12,
      paddingVertical: sizeConfig.buttonPadding * 1.2,
      paddingHorizontal: 20,
      marginVertical: 8,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 6,
    },
    
    resetButtonText: {
      color: '#FFFFFF',
      fontSize: sizeConfig.buttonText * 0.8,
      fontFamily: 'Fredoka_700Bold',
      textAlign: 'center',
      letterSpacing: 1,
      lineHeight: sizeConfig.buttonText * 0.8 * 1.2,
    },
    
    // Estilos para PianoScreen
    pianoScrollContainer: {
      flex: 1,
      width: '100%',
      paddingTop: sizeConfig.buttonPadding,
    },
    
    pianoScrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 0,
    },
    
    pianoContainer: {
      flex: 1,
      justifyContent: 'flex-start',
      alignItems: 'center',
      width: '100%',
      height: '100%',
      paddingTop: 0,
      marginTop: 0,
    },
    
    
    pianoImage: {
      width: '100%',
      height: '100%',
      flex: 1,
    },
    
    pianoControls: {
      paddingVertical: 15,
      backgroundColor: contrastConfig.backgroundColor,
      marginTop: -30,
    },

    // Mensaje de lección terminada
    lessonCompleteContainer: {
      backgroundColor: contrastConfig.buttonColor,
      borderRadius: 15,
      paddingVertical: 15,
      paddingHorizontal: 25,
      marginHorizontal: 20,
      marginBottom: 15,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 8,
    },

    
    controlsButton: {
      backgroundColor: contrastConfig.buttonColor,
      borderRadius: 12,
      paddingVertical: sizeConfig.buttonPadding * 5,
      paddingHorizontal: 30,
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      marginVertical: 10,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 6,
    },
    
    controlsButtonText: {
      color: contrastConfig.textColor,
      fontSize: sizeConfig.buttonText * 1.1,
      fontFamily: 'Fredoka_700Bold',
      textAlign: 'center',
      letterSpacing: 0,
      lineHeight: sizeConfig.buttonText * 1.1 * 1.2,
    },
    
    // Estilos para ControlsScreen
    controlsContainer: {
      flex: 1,
      justifyContent: 'center',
      paddingTop: sizeConfig.buttonPadding,
    },
    
    controlsButtonsContainer: {
      flex: 1,
      justifyContent: 'space-between',
      paddingTop: sizeConfig.buttonPadding,
      paddingBottom: sizeConfig.buttonPadding * 1.5,
    },
    
    controlButton: {
      backgroundColor: contrastConfig.buttonColor,
      borderRadius: 16,
      paddingVertical: sizeConfig.buttonPadding * 1.2,
      paddingHorizontal: 20,
      marginVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      elevation: 8,
    },
    
    controlButtonText: {
      color: contrastConfig.textColor,
      fontSize: sizeConfig.buttonText * 1.1,
      fontFamily: 'Fredoka_600SemiBold',
      textAlign: 'center',
      letterSpacing: 1,
      lineHeight: sizeConfig.buttonText * 1.1 * 1.2,
    },
    
    // Estilos para botón de cerrar sesión
    logoutButton: {
      backgroundColor: '#FF4444',
      borderRadius: 12,
      paddingVertical: sizeConfig.buttonPadding * 1.5,
      paddingHorizontal: 20,
      marginVertical: 6,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 6,
    },
    
    logoutButtonText: {
      color: '#FFFFFF',
      fontSize: sizeConfig.buttonText / 1.2,
      fontFamily: 'Fredoka_700Bold',
      textAlign: 'center',
      letterSpacing: 1,
      lineHeight: sizeConfig.buttonText / 1.2 * 1.2,
    },
    
    // Estilos para pantalla de bienvenida
    landingContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 40,
    },
    
    welcomeTitle: {
      fontSize: sizeConfig.buttonText * 1.3,
      fontFamily: 'Fredoka_700Bold',
      color: contrastConfig.subtitleColor,
      textAlign: 'center',
      marginBottom: 30,
      letterSpacing: 1,
      lineHeight: sizeConfig.buttonText * 1.3 * 1.2,
    },
    
    pianoPlayerImage: {
      width: 250,
      height: 250,
      resizeMode: 'contain',
      marginVertical: 20,
      alignSelf: 'center',
    },
    
    welcomeDescription: {
      fontSize: sizeConfig.buttonText * 0.8,
      fontFamily: 'Fredoka_500Medium',
      color: contrastConfig.subtitleColor,
      textAlign: 'center',
      lineHeight: sizeConfig.buttonText * 0.8 * 1.4,
      paddingHorizontal: 20,
    },
    
    landingButtonContainer: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    
    landingButton: {
      backgroundColor: contrastConfig.buttonColor,
      borderRadius: 25,
      paddingVertical: sizeConfig.buttonPadding * 3.5,
      paddingHorizontal: 80,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 12,
    },
    
    landingButtonText: {
      color: contrastConfig.textColor,
      fontSize: sizeConfig.buttonText * 1,
      fontFamily: 'Fredoka_700Bold',
      textAlign: 'center',
      letterSpacing: 1.5,
      lineHeight: sizeConfig.buttonText * 2.5,
    },
    
    // Estilos para pantalla de autenticación
    authContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 40,
    },
    
    authTitle: {
      fontSize: sizeConfig.buttonText * 1.2,
      fontFamily: 'Fredoka_700Bold',
      color: contrastConfig.subtitleColor,
      textAlign: 'center',
      marginBottom: 20,
      letterSpacing: 1,
      lineHeight: sizeConfig.buttonText * 1.2 * 1.2,
    },
    
    authDescription: {
      fontSize: sizeConfig.buttonText * 0.8,
      fontFamily: 'Fredoka_500Medium',
      color: contrastConfig.subtitleColor,
      textAlign: 'center',
      lineHeight: sizeConfig.buttonText * 0.8 * 1.4,
      paddingHorizontal: 20,
      marginBottom: 40,
    },
    
    authButtonsContainer: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    
    authButton: {
      backgroundColor: contrastConfig.buttonColor,
      borderRadius: 16,
      paddingVertical: sizeConfig.buttonPadding * 2,
      paddingHorizontal: 20,
      marginTop: 10,
      marginBottom: 20,
      marginLeft: -10,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 6,
    },
    
    authButtonText: {
      color: contrastConfig.textColor,
      fontSize: sizeConfig.buttonText * 0.9,
      fontFamily: 'Fredoka_700Bold',
      textAlign: 'center',
      letterSpacing: 1,
      lineHeight: sizeConfig.buttonText * 0.9 * 1.2,
    },
    
    googleAuthButton: {
      backgroundColor: '#4285F4',
      borderRadius: 16,
      paddingVertical: sizeConfig.buttonPadding * 2,
      paddingHorizontal: 20,
      marginTop: 0,
      marginBottom: 10,
      marginLeft: -10,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 6,
    },
    
    googleButtonContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'center',
    },
    
    googleLogo: {
      width: 32,
      height: 32,
      marginRight: 12,
      marginTop: 2,
      resizeMode: 'contain',
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 4,
    },
    
    googleAuthButtonText: {
      color: '#FFFFFF',
      fontSize: sizeConfig.buttonText * 0.9,
      fontFamily: 'Fredoka_700Bold',
      textAlign: 'center',
      letterSpacing: 1,
      lineHeight: sizeConfig.buttonText * 0.9 * 1.2,
    },
    
    // Estilos para pantalla de login
    keyboardAvoidingView: {
      flex: 1,
    },
    
    scrollView: {
      flex: 1,
    },
    
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'flex-start',
      paddingBottom: 40,
    },
    
    logoContainer: {
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 10,
    },
    
    loginContent: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 20,
      marginTop: 40,
    },
    
    loginTitle: {
      fontSize: sizeConfig.buttonText * 1.2,
      fontFamily: 'Fredoka_700Bold',
      color: contrastConfig.subtitleColor,
      textAlign: 'center',
      marginBottom: 40,
      letterSpacing: 1,
      lineHeight: sizeConfig.buttonText * 1.2 * 1.2,
    },
    
    inputContainer: {
      width: '100%',
      marginBottom: 30,
    },
    
    textInput: {
      backgroundColor: contrastConfig.backgroundColor,
      borderWidth: 2,
      borderColor: contrastConfig.buttonColor,
      borderRadius: 12,
      paddingVertical: sizeConfig.buttonPadding * 1.5,
      paddingHorizontal: 20,
      marginVertical: 10,
      fontSize: sizeConfig.buttonText * 0.8,
      fontFamily: 'Fredoka_500Medium',
      color: contrastConfig.subtitleColor,
      textAlignVertical: 'center',
      includeFontPadding: false,
    },
    
    loginButton: {
      backgroundColor: contrastConfig.buttonColor,
      borderRadius: 16,
      paddingVertical: sizeConfig.buttonPadding * 4,
      paddingHorizontal: 20,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 6,
    },
    
    loginButtonText: {
      color: contrastConfig.textColor,
      fontSize: sizeConfig.buttonText * 0.9,
      fontFamily: 'Fredoka_700Bold',
      textAlign: 'center',
      letterSpacing: 1,
      lineHeight: sizeConfig.buttonText * 0.9 * 1.2,
    },
    
    registerSection: {
      paddingHorizontal: 20,
      paddingBottom: 40,
      alignItems: 'center',
    },
    
    registerText: {
      fontSize: sizeConfig.buttonText * 0.7,
      fontFamily: 'Fredoka_500Medium',
      color: contrastConfig.subtitleColor,
      textAlign: 'center',
      marginBottom: 15,
    },
    
    registerButton: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: contrastConfig.buttonColor,
      borderRadius: 12,
      paddingVertical: sizeConfig.buttonPadding * 1.2,
      paddingHorizontal: 30,
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    registerButtonText: {
      color: contrastConfig.buttonColor,
      fontSize: sizeConfig.buttonText * 0.8,
      fontFamily: 'Fredoka_700Bold',
      textAlign: 'center',
      letterSpacing: 1,
      lineHeight: sizeConfig.buttonText * 0.8 * 1.2,
    },
    
    // Estilos para pantalla de registro
    registerContent: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 20,
      marginTop: 40,
    },
    
    registerTitle: {
      fontSize: sizeConfig.buttonText * 1.2,
      fontFamily: 'Fredoka_700Bold',
      color: contrastConfig.subtitleColor,
      textAlign: 'center',
      marginBottom: 40,
      letterSpacing: 1,
      lineHeight: sizeConfig.buttonText * 1.2 * 1.2,
    },
    
    registerButton: {
      backgroundColor: contrastConfig.buttonColor,
      borderRadius: 16,
      paddingVertical: sizeConfig.buttonPadding * 2,
      paddingHorizontal: 40,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 6,
    },
    
    registerButtonText: {
      color: contrastConfig.textColor,
      fontSize: sizeConfig.buttonText * 0.9,
      fontFamily: 'Fredoka_700Bold',
      textAlign: 'center',
      letterSpacing: 1,
      lineHeight: sizeConfig.buttonText * 0.9 * 1.2,
    },

    // Estilos para popup de upload
    uploadPopup: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    
    uploadPopupContent: {
      backgroundColor: contrastConfig.backgroundColor,
      borderRadius: 20,
      padding: 30,
      alignItems: 'center',
      minWidth: 280,
      maxWidth: '90%',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    
    uploadPopupTitle: {
      fontSize: sizeConfig.titleSize,
      fontWeight: 'bold',
      color: contrastConfig.textColor,
      textAlign: 'center',
      marginTop: 15,
      marginBottom: 10,
    },
    
    uploadPopupMessage: {
      fontSize: sizeConfig.textSize,
      color: contrastConfig.subtitleColor,
      textAlign: 'center',
      lineHeight: sizeConfig.textSize * 1.4,
    },

    // Estilos para ScoreDetailScreen con predicciones
    scoreInfoContainer: {
      backgroundColor: contrastConfig.cardBackground,
      borderRadius: 15,
      padding: 20,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    
    scoreTitle: {
      fontSize: sizeConfig.titleSize,
      fontWeight: 'bold',
      color: contrastConfig.textColor,
      textAlign: 'center',
      marginBottom: 10,
    },
    
    scoreSubtitle: {
      fontSize: (sizeConfig.textSize || 16) * 0.9,
      color: contrastConfig.subtitleColor,
      textAlign: 'center',
      fontStyle: 'italic',
      marginBottom: 15,
    },
    
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 15,
      padding: 10,
      backgroundColor: contrastConfig.backgroundColor,
      borderRadius: 10,
    },
    
    statusText: {
      fontSize: sizeConfig.textSize || 16,
      color: contrastConfig.textColor,
      marginLeft: 8,
      fontWeight: '500',
    },
    
    statusSubtext: {
      fontSize: (sizeConfig.textSize || 16) * 0.9,
      color: contrastConfig.subtitleColor,
      marginLeft: 8,
      fontStyle: 'italic',
    },
    
    readyStatusText: {
      fontSize: sizeConfig.textSize || 16,
      color: '#34C759',
      fontWeight: 'bold',
    },
    
    errorStatusText: {
      fontSize: sizeConfig.textSize || 16,
      color: '#FF3B30',
      fontWeight: 'bold',
    },
    
    detailsContainer: {
      marginBottom: 15,
    },
    
    detailsTitle: {
      fontSize: sizeConfig.textSize || 16,
      fontWeight: 'bold',
      color: contrastConfig.textColor,
      marginBottom: 8,
    },
    
    detailText: {
      fontSize: (sizeConfig.textSize || 16) * 0.9,
      color: contrastConfig.subtitleColor,
      marginBottom: 4,
      lineHeight: (sizeConfig.textSize || 16) * 1.3,
    },
    
    predictionsContainer: {
      marginBottom: 15,
    },
    
    predictionsTitle: {
      fontSize: sizeConfig.textSize || 16,
      fontWeight: 'bold',
      color: contrastConfig.textColor,
      marginBottom: 8,
    },
    
    predictionItem: {
      backgroundColor: contrastConfig.backgroundColor,
      padding: 10,
      borderRadius: 8,
      marginBottom: 5,
    },
    
    predictionText: {
      fontSize: (sizeConfig.textSize || 16) * 0.9,
      color: contrastConfig.textColor,
      lineHeight: (sizeConfig.textSize || 16) * 1.2,
    },
    
    refreshButton: {
      backgroundColor: contrastConfig.buttonColor,
      borderRadius: 10,
      padding: 12,
      alignItems: 'center',
      marginTop: 10,
    },
    
    refreshButtonText: {
      color: contrastConfig.textColor,
      fontSize: (sizeConfig.buttonText || 18) * 0.9,
      fontWeight: 'bold',
    },
    
    // Contenedor del popup
    popupContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
    },
    
    // Estilos para popup de estado
    statusPopup: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    
    statusPopupContent: {
      backgroundColor: currentTheme === 'whiteBlack' ? '#000000' : contrastConfig.buttonColor,
      borderRadius: 30,
      padding: 60,
      margin: 40,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 10,
      },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 20,
      minWidth: 350,
      maxWidth: 420,
      minHeight: 300,
      borderWidth: 2,
      borderColor: contrastConfig.borderColor || '#E0E0E0',
    },
    
    retryButton: {
      backgroundColor: contrastConfig.buttonColor,
      borderRadius: 10,
      padding: 12,
      marginTop: 15,
      minWidth: 120,
      alignItems: 'center',
    },
    
    retryButtonText: {
      color: contrastConfig.textColor,
      fontSize: sizeConfig.buttonText || 18,
      fontWeight: 'bold',
    },
    
    // Estilos para el popup mejorado
    statusTitle: {
      fontSize: (sizeConfig.textSize || 16) * 1.5,
      fontFamily: 'Fredoka_700Bold',
      color: currentTheme === 'whiteBlack' ? '#FFFFFF' : contrastConfig.textColor,
      textAlign: 'center',
      marginTop: 25,
      marginBottom: 15,
      letterSpacing: 0.5,
    },
    
    statusSubtext: {
      fontSize: sizeConfig.textSize || 16,
      fontFamily: 'Fredoka_400Regular',
      color: currentTheme === 'whiteBlack' ? '#FFFFFF' : contrastConfig.subtitleColor,
      textAlign: 'center',
      marginBottom: 35,
      lineHeight: (sizeConfig.textSize || 16) * 1.8,
      paddingHorizontal: 20,
    },
    
    okButton: {
      backgroundColor: currentTheme === 'whiteBlack' ? '#808080' : '#000000',
      borderRadius: 25,
      paddingVertical: 18,
      paddingHorizontal: 60,
      minWidth: 200,
      alignItems: 'center',
      shadowColor: currentTheme === 'whiteBlack' ? '#808080' : '#000000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    
    okButtonText: {
      color: contrastConfig.textColor,
      fontSize: sizeConfig.buttonText || 18,
      fontFamily: 'Fredoka_600SemiBold',
      letterSpacing: 0.5,
    },
  });
};
