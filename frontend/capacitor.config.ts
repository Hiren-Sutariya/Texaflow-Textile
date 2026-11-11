import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.texaflow.textile",
  appName: "TexaFlow Textile",
  webDir: "public",
  server: {
    // Live Cloud ERP URL: enables seamless live updates without re-downloading APK
    url: process.env.CAPACITOR_SERVER_URL || "https://texaflow-textile.vercel.app",
    cleartext: true,
    androidScheme: "https"
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1800,
      launchAutoHide: true,
      backgroundColor: "#2563eb",
      showSpinner: false,
      androidScaleType: "CENTER_CROP"
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#2563eb"
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false
  }
};

export default config;

