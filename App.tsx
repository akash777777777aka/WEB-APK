import React, { useState, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { WrapperType, InputType, BuildConfiguration, LogEntry, AnalysisResult } from './types';
import { analyzeWebInput, generateBuildReport } from './services/geminiService';
import { Terminal } from './components/Terminal';
import { Button } from './components/Button';
import { 
  FolderIcon, 
  GlobeAltIcon, 
  CommandLineIcon, 
  CogIcon, 
  ShieldCheckIcon, 
  ArrowDownTrayIcon,
  CheckCircleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

// --- Mock Build Steps ---
const MOCK_BUILD_STEPS = [
  "Initializing Gradle Wrapper...",
  "Validating Android Manifest...",
  "Running preflight checks on Service Worker...",
  "Generating adaptive icons...",
  "Compiling resources (aapt2)...",
  "Transpiling Java/Kotlin sources...",
  "Running lint checks...",
  "Packaging APK...",
  "Signing artifact with debug key...",
  "Zipalign verification..."
];

export default function App() {
  // --- State ---
  const [step, setStep] = useState<number>(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [buildReport, setBuildReport] = useState<string>('');
  
  const [config, setConfig] = useState<BuildConfiguration>({
    inputType: InputType.URL,
    inputValue: '',
    wrapper: WrapperType.TWA,
    packageName: '',
    appName: '',
    versionName: '1.0.0',
    versionCode: 1,
    primaryColor: '#3DDC84',
    signingEnabled: false,
    targetSdk: 34
  });

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  // --- Handlers ---

  const handleAnalysis = async () => {
    if (!config.inputValue) return;
    setIsAnalyzing(true);
    setLogs([]); // Clear previous logs
    
    try {
      const result = await analyzeWebInput(config.inputValue, config.inputType);
      setAnalysis(result);
      setConfig(prev => ({
        ...prev,
        packageName: result.suggestedPackage,
        appName: result.detectedName,
        wrapper: result.isPwa ? WrapperType.TWA : WrapperType.CAPACITOR
      }));
      setStep(2);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addLog = (message: string, level: LogEntry['level'] = 'info') => {
    const entry: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      level,
      message
    };
    setLogs(prev => [...prev, entry]);
  };

  const startBuild = useCallback(async () => {
    setStep(3);
    setIsBuilding(true);
    setLogs([]);
    setBuildReport('');

    addLog(`Starting build pipeline for ${config.packageName}...`);
    addLog(`Wrapper: ${config.wrapper}`);
    addLog(`Target SDK: ${config.targetSdk}`);

    // Simulation Loop
    let i = 0;
    const interval = setInterval(async () => {
      if (i >= MOCK_BUILD_STEPS.length) {
        clearInterval(interval);
        addLog("Build Successful!", 'success');
        addLog(`Output: dist/${config.appName.replace(/\s+/g, '_')}-release.apk`, 'success');
        setIsBuilding(false);
        const report = await generateBuildReport(logs.map(l => l.message));
        setBuildReport(report);
        return;
      }
      
      // Randomly inject warnings
      if (Math.random() > 0.8) {
         addLog("Warning: Uses cleartext traffic (HTTP) - ensure security config allows this.", 'warn');
      }

      addLog(MOCK_BUILD_STEPS[i]);
      i++;
    }, 800);
  }, [config, logs]);

  // --- Render Steps ---

  const renderStep1 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white tracking-tight">Source Selection</h2>
        <p className="text-slate-400">Choose your web application source to begin the conversion.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {Object.values(InputType).map((type) => (
          <button
            key={type}
            onClick={() => setConfig({ ...config, inputType: type })}
            className={`p-4 border rounded-xl flex flex-col items-center justify-center space-y-3 transition-all ${
              config.inputType === type 
                ? 'border-android bg-android/10 text-android' 
                : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:border-slate-600'
            }`}
          >
            {type === InputType.URL ? <GlobeAltIcon className="w-8 h-8" /> : 
             type === InputType.FOLDER ? <FolderIcon className="w-8 h-8" /> :
             <CommandLineIcon className="w-8 h-8" />}
            <span className="font-medium">{type}</span>
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">
          {config.inputType === InputType.URL ? "Target URL" : "Path to Source"}
        </label>
        <div className="flex space-x-2">
          <input
            type={config.inputType === InputType.URL ? "url" : "text"}
            value={config.inputValue}
            onChange={(e) => setConfig({ ...config, inputValue: e.target.value })}
            placeholder={config.inputType === InputType.URL ? "https://myapp.com" : "/users/dev/project/build"}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-android focus:border-transparent outline-none transition-all"
          />
          {config.inputType !== InputType.URL && (
            <div className="relative overflow-hidden">
               <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                 if(e.target.files?.[0]) setConfig({...config, inputValue: e.target.files[0].name})
               }} />
               <Button variant="secondary" className="h-full">Browse</Button>
            </div>
          )}
        </div>
      </div>

      <Button 
        onClick={handleAnalysis} 
        isLoading={isAnalyzing}
        className="w-full py-4 text-lg"
        disabled={!config.inputValue}
      >
        {isAnalyzing ? "Analyzing PWA Manifest..." : "Analyze & Configure"}
      </Button>

      <div className="mt-4 p-4 bg-slate-900/50 rounded-lg border border-slate-800 text-xs text-slate-500">
        <p className="font-mono">Ready: Java JDK 17, Android SDK 34, Gradle 8.4</p>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 h-full flex flex-col">
      <div className="flex items-center justify-between">
         <div>
            <h2 className="text-2xl font-bold text-white">Build Configuration</h2>
            <p className="text-slate-400 text-sm">Fine-tune your Android package settings.</p>
         </div>
         {analysis && (
           <div className="flex items-center space-x-2 bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-xs border border-green-500/20">
             <CheckCircleIcon className="w-4 h-4" />
             <span>AI Analysis Complete</span>
           </div>
         )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-2 pb-20">
        
        {/* General Settings */}
        <div className="space-y-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <CogIcon className="w-5 h-5 mr-2" /> App Details
          </h3>
          
          <div>
            <label className="label-text">App Name</label>
            <input 
              value={config.appName} 
              onChange={(e) => setConfig({...config, appName: e.target.value})}
              className="input-field" 
            />
          </div>

          <div>
            <label className="label-text">Package ID (Application ID)</label>
            <input 
              value={config.packageName}
              onChange={(e) => setConfig({...config, packageName: e.target.value})}
              className="input-field font-mono text-sm" 
            />
          </div>

           <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">Version Name</label>
              <input 
                value={config.versionName}
                onChange={(e) => setConfig({...config, versionName: e.target.value})}
                className="input-field" 
              />
            </div>
            <div>
              <label className="label-text">Version Code</label>
              <input 
                type="number"
                value={config.versionCode}
                onChange={(e) => setConfig({...config, versionCode: parseInt(e.target.value)})}
                className="input-field" 
              />
            </div>
          </div>
        </div>

        {/* Engine Settings */}
        <div className="space-y-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
          <h3 className="text-lg font-semibold text-white flex items-center">
             <CommandLineIcon className="w-5 h-5 mr-2" /> Engine & Wrapper
          </h3>
          
          <div className="space-y-2">
            <label className="label-text">Wrapper Strategy</label>
            <div className="flex flex-col space-y-2">
              {Object.values(WrapperType).map((w) => (
                <label key={w} className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${config.wrapper === w ? 'border-android bg-android/5' : 'border-slate-700 hover:bg-slate-700'}`}>
                  <input 
                    type="radio" 
                    name="wrapper" 
                    checked={config.wrapper === w}
                    onChange={() => setConfig({...config, wrapper: w})}
                    className="text-android focus:ring-android bg-slate-900 border-slate-600"
                  />
                  <span className="ml-2 text-sm text-slate-200">{w}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Security / Permissions */}
        <div className="space-y-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700 col-span-1 md:col-span-2">
           <h3 className="text-lg font-semibold text-white flex items-center">
             <ShieldCheckIcon className="w-5 h-5 mr-2" /> Security & Signing
          </h3>
          
          {analysis && analysis.permissions.length > 0 && (
            <div className="mb-4">
              <label className="label-text mb-2 block">Detected Permissions</label>
              <div className="flex flex-wrap gap-2">
                {analysis.permissions.map(p => (
                  <span key={p} className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300 border border-slate-600 font-mono">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center space-x-4">
             <label className="flex items-center space-x-2 cursor-pointer">
               <input 
                  type="checkbox" 
                  checked={config.signingEnabled} 
                  onChange={(e) => setConfig({...config, signingEnabled: e.target.checked})}
                  className="rounded border-slate-600 bg-slate-900 text-android focus:ring-android" 
                />
               <span className="text-sm">Enable Release Signing</span>
             </label>
             {config.signingEnabled && (
               <div className="flex-1">
                  <input type="file" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-android file:text-slate-900 hover:file:bg-android-dark"/>
               </div>
             )}
          </div>
        </div>

      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 bg-slate-950/90 backdrop-blur-sm border-t border-slate-800 flex justify-between">
         <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
         <Button onClick={startBuild} className="w-48">Initialize Build</Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="h-full flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center">
            <CommandLineIcon className="w-6 h-6 mr-2 text-android" />
            Build Pipeline
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Running {config.wrapper} pipeline for {config.packageName}
          </p>
        </div>
        <div className="flex space-x-2">
           {!isBuilding && (
             <>
               <Button variant="secondary" onClick={() => setStep(2)}>Configure</Button>
               {buildReport && (
                 <Button variant="ghost" onClick={() => alert("Report downloaded (mock)")} className="border border-slate-700">
                    <DocumentTextIcon className="w-4 h-4 mr-2" /> Report.json
                 </Button>
               )}
               <Button onClick={() => { /* Download logic mock */ }}>
                 <ArrowDownTrayIcon className="w-4 h-4 mr-2" /> Download APK
               </Button>
             </>
           )}
        </div>
      </div>

      <div className={`flex-1 min-h-0 transition-all duration-300 ${buildReport ? 'h-1/2' : 'h-full'}`}>
        <Terminal logs={logs} isRunning={isBuilding} />
      </div>

      {!isBuilding && buildReport && (
        <div className="flex-1 min-h-0 bg-slate-900 rounded-lg border border-slate-700 overflow-hidden flex flex-col shadow-xl">
           <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex justify-between items-center">
             <h4 className="font-bold text-slate-200 text-sm flex items-center">
               <CheckCircleIcon className="w-4 h-4 mr-2 text-green-500" />
               Build Analysis
             </h4>
             <span className="text-xs text-slate-500">Gemini 2.5 Flash</span>
           </div>
           <div className="p-6 overflow-y-auto prose prose-invert prose-sm max-w-none">
             <ReactMarkdown>{buildReport}</ReactMarkdown>
           </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-full bg-slate-950 text-slate-200">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 border-r border-slate-800 p-6 hidden md:flex flex-col">
        <div className="flex items-center space-x-2 mb-8">
          <div className="w-8 h-8 bg-android rounded-lg flex items-center justify-center">
            <div className="text-slate-900 font-bold text-xl">W</div>
          </div>
          <span className="font-bold text-lg tracking-tight">Web2Droid</span>
        </div>

        <nav className="space-y-1 flex-1">
          {[1, 2, 3].map((s) => (
            <div 
              key={s}
              className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                step === s ? 'bg-android/10 text-android' : 'text-slate-400'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs mr-3 border ${
                step === s ? 'border-android bg-android text-slate-900' : 'border-slate-600'
              }`}>
                {s}
              </div>
              {s === 1 ? 'Source' : s === 2 ? 'Configuration' : 'Build & Output'}
            </div>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
           <div className="text-xs text-slate-500">
             <p>Engine: Bubblewrap v1.18</p>
             <p>Gradle: v8.4</p>
             <p className="mt-2 text-green-600/60 flex items-center">
               <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
               System Online
             </p>
           </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden h-16 border-b border-slate-800 flex items-center px-6">
           <span className="font-bold">Web2Droid</span>
        </header>
        <main className="flex-1 p-6 md:p-10 overflow-hidden relative">
           <div className="max-w-5xl mx-auto h-full">
             {step === 1 && renderStep1()}
             {step === 2 && renderStep2()}
             {step === 3 && renderStep3()}
           </div>
        </main>
      </div>
      
      {/* Global CSS for inputs */}
      <style>{`
        .label-text {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: #cbd5e1;
          margin-bottom: 0.5rem;
        }
        .input-field {
          width: 100%;
          background-color: #0f172a;
          border: 1px solid #334155;
          border-radius: 0.5rem;
          padding: 0.5rem 1rem;
          color: white;
          transition: all 0.2s;
        }
        .input-field:focus {
          outline: none;
          border-color: #3DDC84;
          box-shadow: 0 0 0 1px #3DDC84;
        }
      `}</style>
    </div>
  );
}