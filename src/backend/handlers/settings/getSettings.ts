import { Settings, store } from "../../../store";

export function getSettings(): Settings {
    return store.get('settings', { openAIKey: '', anthropicKey: '', mobileNodeKey: '', numOfBrowser: 4 }) as Settings;
}

export function updateSettings(_:unknown, newSettings: Partial<Settings>): void {
    const currentSettings = getSettings();
    store.set('settings', { ...currentSettings, ...newSettings });
}