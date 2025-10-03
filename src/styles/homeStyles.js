import { StyleSheet } from 'react-native';

export const homeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
  },
  
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
    paddingTop: 15,
  },
  
  logo: {
    width: 250,
    height: 100,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  
  subtitle: {
    fontSize: 14,
    color: '#cccccc',
    textAlign: 'center',
  },
  
  buttonsContainer: {
    flex: 1,
    justifyContent: 'space-evenly',
    paddingVertical: 20,
  },
  
  mainButton: {
    backgroundColor: '#2d5a87',
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 18,
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
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Fredoka_700Bold',
    textAlign: 'center',
    letterSpacing: 1,
    lineHeight: 22,
  },
});
