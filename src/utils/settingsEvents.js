// src/utils/settingsEvents.js
class SettingsEventEmitter {
  constructor() {
    this.listeners = [];
  }
  
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }
  
  emit() {
    console.log('📢 Emitiendo evento de recarga de settings');
    this.listeners.forEach(callback => callback());
  }
}

export const settingsEvents = new SettingsEventEmitter();

