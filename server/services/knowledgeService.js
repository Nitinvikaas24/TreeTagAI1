import { GoogleGenAI } from "@google/genai";

export async function learnAboutPlant(scientificName) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMMA_API_KEY });
  console.log({ key: process.env.GEMMA_API_KEY });
  // console.log(ai.List)
  const prompt = `
You are an agroforestry expert. I need data for a new plant: "${scientificName}".
Provide a short, encouraging description for a home gardener (as 'description'),
a bulleted list of benefits (as 'benefits'),
and a bulleted list of care instructions (as 'care').

Respond with ONLY a valid JSON object in this format:
{
  "description": "...",
  "benefits": ["Benefit 1...", "Benefit 2..."],
  "care": ["Care step 1...", "Care step 2..."]
}
strictly adhere to the above format, i want a plain text, without formatting and bold
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });
  console.log(response.text);

  return JSON.parse(response.text);
}