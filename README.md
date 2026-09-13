# NOAH Conductor

App para el conductor de moto/carro con apps de viajes (Uber, DiDi, inDrive,
Cabify, Picap, Rappi o particular): jornada y viajes con GPS, gastos de la
moto, gastos del hogar, deudas, balance, avisos tipo alarma y rutina diaria.
Todo se guarda en el teléfono — no hay backend ni cuenta.

React + Vite + TypeScript + Tailwind, empacada como app Android con
[Capacitor](https://capacitorjs.com). Dos capacidades nativas propias, en
Kotlin dentro de `android/app/src/main/java/com/noah/conductor/`:

- **`burbuja/`** — la burbuja flotante que sigue el viaje fuera de la app
  (requiere el permiso "Mostrar sobre otras apps").
- **`alarma/`** — alarmas a pantalla completa, incluso con el celular
  bloqueado, para vencimientos, la meta del día y la rutina.

## Compilar el APK

Este entorno de desarrollo no tiene salida a `dl.google.com`, así que el APK
no se compila aquí: lo compila GitHub Actions en cada push
(`.github/workflows/build-conductor-apk.yml`), que sí tiene internet
completo. El resultado queda adjunto en la release `conductor-latest` del
repositorio — se puede descargar directo desde el navegador del celular.

Para compilarlo a mano con el SDK de Android instalado:

```bash
npm install
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

El APK queda en `android/app/build/outputs/apk/debug/app-debug.apk`.
