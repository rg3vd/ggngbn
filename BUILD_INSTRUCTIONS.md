# Інструкції для створення APK

## Варіант 1: GitHub Actions (Рекомендовано)

### Налаштування:

1. Отримайте Expo Access Token:
   ```bash
   eas login
   eas whoami
   ```
   Потім створіть токен на https://expo.dev/accounts/[your-username]/settings/access-tokens

2. Додайте токен до GitHub Secrets:
   - Перейдіть до Settings → Secrets and variables → Actions
   - Натисніть "New repository secret"
   - Name: `EXPO_TOKEN`
   - Value: ваш токен з Expo

3. Запустіть workflow:
   - Перейдіть до вкладки "Actions" у вашому репозиторії
   - Виберіть "Build Android APK"
   - Натисніть "Run workflow"

4. Завантажте APK:
   - Після завершення build перейдіть на https://expo.dev/accounts/ghtr/projects/skarbna-mrii/builds
   - Завантажте готовий APK файл

## Варіант 2: Локальний EAS Build

```bash
cd skarbna_mrii
eas login
eas build --platform android --profile preview
```

Після завершення build, завантажте APK з EAS dashboard.

## Варіант 3: Локальний build (потребує Java 17)

1. Встановіть Java 17:
   - Завантажте з https://adoptium.net/
   - Встановіть JAVA_HOME

2. Створіть APK:
   ```bash
   cd skarbna_mrii/android
   ./gradlew assembleRelease
   ```

3. APK буде в: `android/app/build/outputs/apk/release/app-release.apk`

## Поточна проблема

Локальний build не працює через Java 25 (занадто нова версія). Gradle 8.8 підтримує максимум Java 23.

**Рішення**: Використовуйте GitHub Actions або EAS Build онлайн.
