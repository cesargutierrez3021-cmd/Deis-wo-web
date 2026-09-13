import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.noah.conductor.atlas',
  appName: 'NOAH Atlas',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
}

export default config
