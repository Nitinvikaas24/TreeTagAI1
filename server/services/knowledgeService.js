import { GoogleGenAI } from "@google/genai";

export async function learnAboutPlant(scientificName) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMMA_API_KEY });
  console.log({ key: process.env.GEMMA_API_KEY });

  // --- PROMPT ENGINEERING FOR TAMIL LANDSCAPES (TIṆAI) ---
  const prompt = `
You are an expert in Tamil Nadu agriculture and Sangam literature landscapes (Aintinai). 
I need detailed agricultural and cultural data for the plant: "${scientificName}".

Analyze this plant's natural habitat (soil, water, altitude) and classify it into the traditional Tamil Landscape (Tiṇai):
1. **Kurinji** (Mountainous/Hilly regions)
2. **Mullai** (Forests/Pastures/Red Soil)
3. **Marutham** (Fertile Agricultural Fields/River Plains/Clay Soil)
4. **Neithal** (Coastal/Sandy/Saline Soil)
5. **Palai** (Dry/Arid/Wasteland)

Provide the following strictly in English (it will be translated later):
1. 'description': A short, encouraging description for a farmer.
2. 'benefits': A bulleted list of economic and ecological benefits.
3. 'care': A bulleted list of care instructions.
4. 'landscape': The specific Tamil Tiṇai and a brief reason (e.g., "Mullai (Forests) - Thrives in red soil and pasture lands").

Respond with ONLY a valid JSON object in this format:
{
  "description": "...",
  "benefits": ["Benefit 1...", "Benefit 2..."],
  "care": ["Care step 1...", "Care step 2..."],
  "landscape": "..."
}
strictly adhere to the above format, i want a plain text, without formatting and bold.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    
    // Clean potential markdown formatting from AI response
    const cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    console.log("AI Response:", cleanText);
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("AI Knowledge Error:", error);
    // Return empty fallback structure to prevent crashes
    return {
      description: "Description unavailable.",
      benefits: [],
      care: [],
      landscape: "Marutham (General Agriculture)" // Default fallback
    };
  }
}