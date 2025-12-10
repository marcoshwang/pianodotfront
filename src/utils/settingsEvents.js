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
    this.listeners.forEach(callback => callback());
  }
}

export const settingsEvents = new SettingsEventEmitter();

