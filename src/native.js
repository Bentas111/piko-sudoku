import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { App } from '@capacitor/app';
import { createStorage } from './storage.cjs';
import { installAds } from './ads.js';
import { installClub } from './club.js';

async function launch() {
  const native = Capacitor.isNativePlatform();
  if (native) {
    const storage = createStorage({
      get: async key => (await Preferences.get({ key })).value,
      set: (key, value) => Preferences.set({ key, value }),
      notify: ok => window.dispatchEvent(new CustomEvent('piko:storage', { detail: { ok } }))
    });
    window.PikoStorage = storage;
    try { await storage.init('piko-sudoku-family-v1'); }
    catch { /* Keep writes disabled if the read fails; never overwrite an unread save. */ }
    await App.addListener('appStateChange', ({ isActive }) => {
      window.dispatchEvent(new CustomEvent('piko:lifecycle', { detail: { isActive } }));
      if (!isActive) storage.flush().catch(() => {});
    });
    await installClub(Capacitor.getPlatform());
    installAds(Capacitor.getPlatform());
    if (Capacitor.getPlatform() === 'android') {
      await App.addListener('backButton', () => {
        if (!window.PikoBack?.()) App.minimizeApp().catch(() => {});
      });
    }
  }
  const app = document.createElement('script');
  app.src = 'app.js';
  document.body.appendChild(app);
}
launch().catch(() => {
  document.getElementById('app').textContent = 'Nie udało się uruchomić gry. Zamknij i otwórz aplikację ponownie. / Please restart the app.';
});
