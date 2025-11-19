
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { LogEntry, Language } from '../types';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getOrchardInsights = async (logs: LogEntry[], language: Language): Promise<string> => {
  const modelId = 'gemini-2.5-flash';
  
  const recentLogs = logs.sort((a, b) => b.createdAt - a.createdAt).slice(0, 50);
  const today = new Date();
  const dateString = today.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const month = today.getMonth() + 1; // 1-12

  const langInstruction = language === 'tr' 
    ? "Respond strictly in Turkish language." 
    : "Respond in English.";

  const prompt = `
    Current Date: ${dateString}
    Current Month: ${month}
    Location Context: Northern Hemisphere (Turkey/USA standard Pistachio climate).
    
    You are an expert agronomist specializing in Pistachio orchards. 
    Analyze the following recent activity logs from the orchard.
    
    Logs:
    ${JSON.stringify(recentLogs)}
    
    CRITICAL SEASONAL RULES:
    1. **Phenology Awareness**: You must verify the current date against the pistachio growth cycle.
       - **Winter (Nov-Feb)**: Trees are dormant (sleep). Leaves are falling or gone. **NEVER** recommend foliar (leaf) fertilizers during this time as there are no leaves to absorb it. Focus on pruning, soil sampling, or winter oil sprays.
       - **Spring (Mar-May)**: Bud break, flowering, pollination.
       - **Summer (Jun-Aug)**: Nut fill. Irrigation is critical.
       - **Autumn (Sep-Oct)**: Harvest and post-harvest irrigation.
    2. **Weather Logic**: Assume typical seasonal weather for the date. Do not suggest spraying if it is typically rainy season unless explicitly for disease control requiring wet conditions.
    
    ${langInstruction}
    Provide a brief, 3-bullet point summary of the recent operations and 1 actionable suggestion for the coming week based on standard pistachio farming practices AND the current date.
    
    If the user asks for something agronomically wrong for the season (like foliar feed in December), warn them against it.
    Keep the tone professional but encouraging.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });
    return response.text || (language === 'tr' ? "Şu anda analiz oluşturulamıyor." : "Unable to generate insights at this time.");
  } catch (error) {
    console.error("Error getting insights:", error);
    return language === 'tr' 
      ? "Servis geçici olarak kullanılamıyor." 
      : "Service temporarily unavailable.";
  }
};

export const chatWithOrchardData = async (logs: LogEntry[], userMessage: string, language: Language): Promise<string> => {
  const modelId = 'gemini-2.5-flash';
  
  const today = new Date();
  const dateString = today.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const langInstruction = language === 'tr' 
    ? "Respond in Turkish." 
    : "Respond in English.";

  const prompt = `
    Current Date: ${dateString}
    Role: Expert Pistachio Orchard Manager Assistant.
    
    You have access to the following orchard logs:
    ${JSON.stringify(logs)}
    
    User Question: "${userMessage}"
    
    STRICT GUIDELINES:
    1. **Seasonality**: Always check the "Current Date" before answering. 
    2. **Avoid Waste**: Do not recommend inputs (fertilizers/water) that the tree cannot use due to its current phenological stage (e.g., no nitrogen flushing during harvest, no foliar feeding during dormancy).
    3. **Leaf Drop**: If today is between November and February, assume trees have no leaves.
    
    ${langInstruction}
    Answer based strictly on the logs provided and agronomic best practices for the current season. 
    Format your response nicely using Markdown (bolding key figures, lists where appropriate).
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });
    return response.text || (language === 'tr' ? "İsteğinizi işleyemedim." : "I couldn't process that request.");
  } catch (error) {
    console.error("Error in chat:", error);
    return language === 'tr' 
      ? "Sorunuzu yanıtlarken bir hatayla karşılaştım." 
      : "I encountered an error trying to answer your question.";
  }
};
