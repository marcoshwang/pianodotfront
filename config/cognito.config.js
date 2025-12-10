// Configuración de AWS Cognito para PianoDot
export const COGNITO_CONFIG = {
  // User Pool ID
  userPoolId: 'us-east-1_SdSuMYw5U',
  
  // Client ID
  clientId: '3j00gk06nl3opms808j8bo6d96',
  
  // Región
  region: 'us-east-1',
  
  // OAuth Domain (Hosted UI Domain)
  // Dominio de Cognito Hosted UI para OAuth (Google Login, etc.)
  oauthDomain: 'pianodot.auth.us-east-1.amazoncognito.com',
  
  // Endpoint de Cognito (se construye automáticamente)
  get cognitoEndpoint() {
    return `cognito-idp.${this.region}.amazonaws.com`;
  },
  
  // URL del User Pool
  get userPoolEndpoint() {
    return `https://${this.cognitoEndpoint}/${this.userPoolId}`;
  },
  
  // OAuth Domain por defecto
  get defaultOAuthDomain() {
    return `${this.userPoolId.toLowerCase()}.auth.${this.region}.amazoncognito.com`;
  },
};

export default COGNITO_CONFIG;

