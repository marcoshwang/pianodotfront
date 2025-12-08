// Configuración de AWS Cognito para PianoDot
export const COGNITO_CONFIG = {
  // User Pool ID
  userPoolId: 'us-east-1_SdSuMYw5U',
  
  // Client ID
  clientId: '3j00gk06nl3opms808j8bo6d96',
  
  // Región
  region: 'us-east-1',
  
  // Endpoint de Cognito (se construye automáticamente)
  get cognitoEndpoint() {
    return `cognito-idp.${this.region}.amazonaws.com`;
  },
  
  // URL del User Pool
  get userPoolEndpoint() {
    return `https://${this.cognitoEndpoint}/${this.userPoolId}`;
  },
};

export default COGNITO_CONFIG;

