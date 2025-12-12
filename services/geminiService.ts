import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeWebInput = async (input: string, type: string): Promise<AnalysisResult> => {
  const model = "gemini-2.5-flash";
  
  const prompt = `
    Analyze the following web input (URL or Description) for an Android App conversion tool.
    Input Type: ${type}
    Input Value: "${input}"
    
    Determine if this is likely a PWA, suggest a valid Java package name (reverse domain style), 
    extract a likely app name, list probable Android permissions needed (e.g., CAMERA, INTERNET), 
    and identify any potential security warnings (like Mixed Content or cleartext traffic).

    Return ONLY JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedPackage: { type: Type.STRING, description: "e.g. com.example.app" },
            detectedName: { type: Type.STRING },
            isPwa: { type: Type.BOOLEAN },
            permissions: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            securityWarnings: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            }
          },
          required: ["suggestedPackage", "detectedName", "isPwa", "permissions", "securityWarnings"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AnalysisResult;
    }
    throw new Error("Empty response from AI");
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    // Fallback if API fails or key is missing
    return {
      suggestedPackage: 'com.example.webapp',
      detectedName: 'My Web App',
      isPwa: false,
      permissions: ['android.permission.INTERNET'],
      securityWarnings: []
    };
  }
};

export const generateBuildReport = async (logs: string[]): Promise<string> => {
  const model = "gemini-2.5-flash";
  // Taking the last 20 lines of logs for brevity
  const logSnippet = logs.slice(-20).join("\n");
  
  const prompt = `
    Generate a short, professional build summary based on these build logs. 
    Highlight success or specific failure reasons.
    
    Logs:
    ${logSnippet}
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text || "Build completed successfully (Report unavailable).";
  } catch (e) {
    return "Build completed. See raw logs for details.";
  }
};