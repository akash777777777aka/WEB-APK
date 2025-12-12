export enum WrapperType {
  TWA = 'Trusted Web Activity (Recommended)',
  CAPACITOR = 'Capacitor (Native Runtime)',
  CORDOVA = 'Cordova (Legacy)',
}

export enum InputType {
  URL = 'Remote URL',
  FOLDER = 'Local Folder',
  FILE = 'Single HTML File',
  ARCHIVE = 'Archive (.zip/.tar)',
}

export interface BuildConfiguration {
  inputType: InputType;
  inputValue: string; // URL or File name
  wrapper: WrapperType;
  packageName: string;
  appName: string;
  versionName: string;
  versionCode: number;
  primaryColor: string;
  signingEnabled: boolean;
  keystorePath?: string;
  targetSdk: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

export interface AnalysisResult {
  suggestedPackage: string;
  detectedName: string;
  isPwa: boolean;
  permissions: string[];
  securityWarnings: string[];
}