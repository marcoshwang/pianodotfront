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
  
  // OAuth Domain por defecto (si no se especifica uno personalizado)
  // IMPORTANTE: Este dominio debe coincidir EXACTAMENTE con el que aparece en AWS Cognito Console
  // Ve a: Cognito > Tu User Pool > App integration > Domain
  // Copia el dominio que aparece ahí y úsalo aquí
  get defaultOAuthDomain() {
    // El dominio de Cognito Hosted UI NO siempre es {userPoolId}.auth.{region}.amazoncognito.com
    // Puede ser un dominio personalizado o un formato diferente
    // Por defecto, intentamos el formato estándar, pero DEBES verificar en AWS Console
    // Si el dominio no funciona, ve a AWS Console y copia el dominio exacto
    return `${this.userPoolId.toLowerCase()}.auth.${this.region}.amazoncognito.com`;
  },
};

export default COGNITO_CONFIG;

