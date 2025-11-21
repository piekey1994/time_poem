import { GoogleGenAI, Type, Schema } from "@google/genai";
import { NewsItem, PresentAnalysis, FuturePrediction } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_SEARCH = 'gemini-2.5-flash';
const MODEL_REASONING = 'gemini-2.5-flash';
const MODEL_IMAGE = 'gemini-2.5-flash-image'; 

const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * Step 1: "Past" - Search for information within the last 30 days
 */
export const searchPastNews = async (keyword: string): Promise<NewsItem[]> => {
  try {
    // 1. Perform Search with strict time constraint in prompt
    const searchResponse = await ai.models.generateContent({
      model: MODEL_SEARCH,
      contents: `Find the most significant news and events regarding "${keyword}" that occurred specifically within the **last 30 days**. 
      Do not include old history. Focus only on the most recent developments from this month.
      Provide a comprehensive text summary that cites at least 6 distinct recent items.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    // 2. Prepare context for extraction
    const mainText = searchResponse.text || "";
    const chunks = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    let sourceContext = "";
    chunks.forEach((chunk, index) => {
        if (chunk.web) {
            sourceContext += `[${index + 1}] Title: ${chunk.web.title}, URL: ${chunk.web.uri}\n`;
        }
    });

    // 3. Extract structured data
    const formatResponse = await ai.models.generateContent({
        model: MODEL_REASONING,
        contents: `Analyze the following Search Summary (which covers the last 30 days) and Source List.
        Extract 6 distinct news items or events related to "${keyword}" into a JSON array.
        
        Search Summary:
        "${mainText.substring(0, 10000)}"
        
        Source List:
        ${sourceContext}
        
        Requirements:
        - 'title': Concise title of the event.
        - 'summary': A detailed 2-3 sentence summary. Ensure it reflects recent events.
        - 'source': The publisher name.
        - 'url': The most relevant URL.
        - 'date': The specific date or "X days ago".
        - 'originalLanguage': Detect language (e.g., 'en', 'zh').
        `,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        summary: { type: Type.STRING },
                        source: { type: Type.STRING },
                        url: { type: Type.STRING },
                        date: { type: Type.STRING },
                        originalLanguage: { type: Type.STRING }
                    }
                }
            }
        }
    });

    const jsonRaw = formatResponse.text;
    if (!jsonRaw) throw new Error("Failed to parse search results");

    const parsedItems = JSON.parse(jsonRaw);
    
    return parsedItems.map((item: any) => ({
        id: generateId(),
        title: item.title || "Unknown Title",
        summary: item.summary || "No summary available.",
        source: item.source || "Web",
        url: item.url || `https://www.google.com/search?q=${encodeURIComponent(keyword)}`,
        date: item.date,
        originalLanguage: item.originalLanguage || 'en'
    }));

  } catch (error) {
    console.error("Search Error:", error);
    return [
        { id: '1', title: `Error retrieving data for ${keyword}`, summary: 'Please try again later.', source: 'System', url: '#', originalLanguage: 'en' },
    ];
  }
};

/**
 * Helper: Translate text
 */
export const translateContent = async (text: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: MODEL_REASONING,
            contents: `Translate the following text into Simplified Chinese. If it is already Chinese, return it as is.
            
            Text: "${text}"`
        });
        return response.text || text;
    } catch (e) {
        return text;
    }
}

/**
 * Step 2: "Present" - Deep Analysis of the last month
 */
export const analyzePresent = async (keyword: string, newsItems: NewsItem[]): Promise<PresentAnalysis> => {
  const context = newsItems.map(n => `Title: ${n.title}\nSummary: ${n.summary}`).join('\n---\n');
  
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      summaryTitle: { type: Type.STRING },
      overview: { type: Type.STRING, description: "A summary of the news from the last month." },
      detailedAnalysis: { type: Type.STRING, description: "Deep insights, patterns, or implications derived from these recent events." },
      keyThemes: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            icon: { type: Type.STRING, description: "A single emoji representing this theme" }
          }
        }
      },
      sentimentScore: { type: Type.NUMBER, description: "0 (Negative) to 100 (Positive)" }
    },
    required: ["summaryTitle", "overview", "detailedAnalysis", "keyThemes", "sentimentScore"]
  };

  const response = await ai.models.generateContent({
    model: MODEL_REASONING,
    contents: `Analyze the news from the **last month** regarding "${keyword}" based on these contexts: 
    
    ${context}
    
    Provide a comprehensive report (The "Present"). 
    1. Summarize what happened this month.
    2. Provide detailed analysis/insights on what these events mean for the keyword.
    Output in Simplified Chinese.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });

  const text = response.text;
  if (!text) throw new Error("No analysis generated");
  return JSON.parse(text) as PresentAnalysis;
};

/**
 * Step 3: "Future" - 1 Year Prediction + Distant Future
 */
export const predictFuture = async (keyword: string, analysis: PresentAnalysis): Promise<FuturePrediction> => {
    const context = `Current Status (Last Month): ${analysis.overview}. Insights: ${analysis.detailedAnalysis}. Sentiment: ${analysis.sentimentScore}`;

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            scenarioTitle: { type: Type.STRING },
            probability: { type: Type.STRING, description: "e.g., High, Moderate, Low" },
            description: { type: Type.STRING, description: "General outlook for the near future." },
            nearTermEvents: {
                type: Type.ARRAY,
                description: "Predictions for the next 12 months",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        timeframe: { type: Type.STRING, description: "e.g., 'Next Month', 'In 6 Months', 'End of Year'" },
                        event: { type: Type.STRING, description: "What is likely to happen." }
                    }
                }
            },
            distantVision: {
                type: Type.OBJECT,
                description: "Prediction for the distant future (beyond 1 year)",
                properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING }
                }
            },
            visualPrompt: { type: Type.STRING, description: "A visual description of this future scenario" }
        },
        required: ["scenarioTitle", "probability", "description", "nearTermEvents", "distantVision", "visualPrompt"]
    };

    const response = await ai.models.generateContent({
        model: MODEL_REASONING,
        contents: `Based on the analysis of the last month's news for "${keyword}", predict the future. 
        
        1. Provide reasonable predictions for the **Next 1 Year**.
        2. Provide a brief, bold prediction for the **Distant Future** (more remote).
        
        Be creative but grounded in the provided context. Output in Simplified Chinese.
        
        Context: ${context}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema
        }
    });

    const text = response.text;
    if (!text) throw new Error("No prediction generated");
    return JSON.parse(text) as FuturePrediction;
};

/**
 * Step 4: "Time Poem" - Generate Image and Poem
 */
export interface PoeticContent {
    imageUrl: string;
    poem: string;
}

export const generatePoeticContent = async (keyword: string, futurePrediction: FuturePrediction): Promise<PoeticContent> => {
    
    // 1. Generate Poem
    const poemResponse = await ai.models.generateContent({
        model: MODEL_REASONING,
        contents: `Write a short, elegant, 4-line poem in Chinese about the keyword "${keyword}". 
        Reflect on its journey from the past to the future described as: "${futurePrediction.distantVision.title}".
        Style: Mystical, deep, philosophical.
        Output raw text only.`
    });
    
    const poem = poemResponse.text?.trim() || `${keyword}之光，\n穿梭时光的长廊，\n过去与未来交响，\n编织永恒的篇章。`;

    // 2. Generate Image
    // Note: gemini-2.5-flash-image does not support responseMimeType, so we manually prompt.
    const imagePrompt = `A surreal, artistic, and elegant masterpiece illustration representing the concept of '${keyword}' evolving into the future. 
    Visual elements: ${futurePrediction.visualPrompt}. 
    Style: Cinematic, Ethereal, Oil Painting, highly detailed, 4k, golden hour lighting, dreamy atmosphere.`;

    const imageResponse = await ai.models.generateContent({
        model: MODEL_IMAGE,
        contents: {
            parts: [{ text: imagePrompt }]
        },
        config: {
             imageConfig: {
                 aspectRatio: "1:1"
             }
        }
    });

    let imageUrl = "";
    for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
        }
    }

    if (!imageUrl) {
        // Fallback if generation fails
        imageUrl = `https://picsum.photos/seed/${keyword}/800/800`;
    }

    return { imageUrl, poem };
};