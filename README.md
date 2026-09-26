# Piko Sudoku — projekt mobilny 0.4.0

Projekt Android i iOS oparty na Capacitor 8.5.2. Rozwija wcześniejszy prototyp, zachowując 12 światów, 72 ilustracje i 240 ćwiczeń. Poprzednie pliki HTML pozostają osobnym prototypem; bieżący kod jest tutaj w `src/`.

## Co dodano

- Projekty Android Gradle i iOS Xcode / Swift Package Manager.
- Systemowy zapis przez Capacitor Preferences. Operacje są kolejkowane, żeby starszy zapis nie nadpisał nowszego. Błąd odczytu blokuje nadpisywanie nieodczytanego zapisu.
- Normalizacja niepełnych zapisów, walidacja planszy i historii cofania.
- Obsługa Android Back: zamknięcie dialogu lub podpowiedzi, pauza w grze, powrót na start, minimalizacja na ekranie startowym.
- Pauza po przejściu w tło; dostęp do ustawień rodzica wygasa w tle.
- Bramka rodzica z losowym działaniem i zmianą zadania po błędnej odpowiedzi. Nie stanowi weryfikacji wieku ani prawnej zgody rodzica.
- Lokalny ekran informacji o danych w PL/EN.
- Geometryczna ikona Piko i ekrany startowe zamiast grafik szablonu Capacitor.
- Manifest prywatności iOS z powodem dostępu do UserDefaults CA92.1, dołączony do zasobów targetu.
- Android: AdMob z reklamami testowymi, INTERNET i ACCESS_NETWORK_STATE. Usunięte uprawnienia AD_ID i AdServices. iOS z integracją AdMob w trybie testowym. Brak zakupów i własnej analityki; SDK reklamowy przetwarza dane techniczne. Szczegóły w release/admob.md.
- Wersja 0.4.0, roboczy identyfikator `com.piko.sudoku.preview`.

## Uruchomienie i synchronizacja

W katalogu projektu:

```sh
npm ci
npm test
npm run sync
```

`src/` jest źródłem. `www/` i kopie zasobów w projektach natywnych są wynikami budowania. Zmiany w `src/` wymagają `npm run sync` przed następną kompilacją natywną. Podgląd `www/index.html` działa także w przeglądarce i używa jej localStorage, a aplikacja natywna używa systemowych Preferences. Zapis przeglądarki nie przechodzi automatycznie do aplikacji.

Android: ustaw JAVA_HOME na JDK 21 oraz ANDROID_HOME na lokalny Android SDK. Używany target/compile SDK: 36, min SDK: 24. Następnie:

```sh
cd android
./gradlew assembleDebug
```

Na Windows użyj `gradlew.bat`. Wynik: `android/app/build/outputs/apk/debug/app-debug.apk`. To build deweloperski do testowania; nie wysyłać go do Play Console jako wydania produkcyjnego.

iOS: na Macu z Xcode 26+ wykonaj `npm ci`, `npm run sync`, `npm run ios`. Wybierz zespół podpisujący i produkcyjny bundle identifier, następnie zbuduj i przetestuj archiwum. Projekt iOS wygenerowano i sprawdzono strukturalnie na Windows; nie skompilowano IPA.

Aktualne źródła wymagań: [Capacitor — środowisko](https://capacitorjs.com/docs/getting-started/environment-setup), [Preferences](https://capacitorjs.com/docs/apis/preferences), [App lifecycle / Back](https://capacitorjs.com/docs/apis/app).

## Przed wydaniem

Przeczytaj `release/README.md`. Uzupełnij dane w `release/publisher.json`. `npm run check:release` pokaże brakujące pozycje; obecnie ma celowo zakończyć się błędem, bo brakuje danych wydawcy i testów urządzeń oraz gotowości reklam produkcyjnych.

Zmiana appId tylko w capacitor.config.json NIE zmienia automatycznie już utworzonych projektów. Uzgodnić identyfikator przed wpisywaniem do sklepów, poprawić namespace/applicationId i pakiet MainActivity w Androidzie oraz PRODUCT_BUNDLE_IDENTIFIER w Xcode. Debug `.preview` nie oznacza dostępności marki ani identyfikatora w sklepach.

Android korzysta z modelu banerów po ukończeniu planszy. Dane i dostęp do kont sklepowych, publiczna domena oraz testy fizycznych urządzeń pozostają otwarte. iOS również zawiera baner AdMob, bez zakupów. Dokument prywatności i listingi to robocze materiały, nie opublikowane strony ani potwierdzone deklaracje w konsolach.

## Zależności i prawa

Wersje npm są przypięte w package-lock.json. Override uuid 11.1.1 dotyczy narzędzia xcode wykorzystywanego przez CLI; sprawdzono parsowanie projektu i generowanie identyfikatorów po aktualizacji. Na moment przygotowania `npm audit` nie wykazuje podatności.

Font Nunito: oryginalne pliki z dostarczonego projektu, dołączona licencja OFL z repozytorium Google Fonts. Ilustracje: kopie wybranych plików użytkownika, lista w `src/asset-sources.json`. Prawa do publikacji ilustracji i nazwy wymagają potwierdzenia wydawcy.

## AdMob iOS 0.4

Integracja testowa jest gotowa w źródłach i projekcie SPM. Instrukcja Mac/Xcode oraz ograniczenia walidacji: `release/ios-admob.md`. Nie zbudowano ani nie podpisano IPA na Windows.
