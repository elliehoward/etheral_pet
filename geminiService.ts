
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { PetProfile, ChatMessage, EvolutionStage, CareItem } from "./types";

const API_KEY = process.env.API_KEY || "";

export const generatePetImage = async (pet: Partial<PetProfile> & { prompt: string }, base64Image?: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const accessoryStr = pet.selectedAccessories?.length 
    ? `The pet is wearing: ${pet.selectedAccessories.join(", ")}.` 
    : "";
    
  const envStr = pet.environment 
    ? `The background is a ${pet.environment}.` 
    : "The background is clean and slightly out of focus.";

  const fullPrompt = `Create a high-quality, professional 3D character render of a virtual pet.
Species: ${pet.species || 'Unknown'}
Stage: ${pet.stage || 'Baby'}
Description: ${pet.prompt}
Personality: ${pet.personality}
${accessoryStr}
${envStr}
Style: Stylized, vibrant, expressive, centered framing. If 'Adult' or 'Ancient', make it look more majestic and powerful. If 'Baby', make it extremely cute and small.`;

  const parts: any[] = [{ text: fullPrompt }];
  
  if (base64Image) {
    parts.push({
      inlineData: {
        data: base64Image,
        mimeType: 'image/png'
      }
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts },
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("Failed to generate pet image");
};

export const chatWithPet = async (pet: PetProfile, history: ChatMessage[], newMessage: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const systemInstruction = `You are ${pet.name}, an AI companion. 
Evolution: ${pet.stage}. Personality: "${pet.personality}".
Location: ${pet.environment}.

Your goal is to be a supportive and engaging friend. 
- Do NOT be repetitive. If you just asked about wellness, don't ask again.
- Focus on reacting to what the user says naturally.
- Only suggest or ask about real-world wellness habits (like stretching, drinking water, napping) if it fits the conversation flow.
- You are a companion first, not a wellness coach. Keep the vibe casual and warm.
- Keep responses very short (1-2 sentences). Use emojis sparingly but effectively.
- If the user is sharing their day, just listen and respond like a friend.`;

  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction,
      temperature: 0.9, // Increased for more variety
    },
  });

  const result = await chat.sendMessage({ message: newMessage });
  return result.text || "I'm here for you. Let's grow together! ✨";
};

export const extractCareItems = async (message: string, existingItems: string[]): Promise<CareItem[]> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const existingList = existingItems.join(", ");
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze this message: "${message}". 
    Extract any DISTINCT NEW real-world activities mentioned that are NOT similar to these existing ones: [${existingList}].
    If the user mentions something that is basically the same as an existing item (e.g., "nap" vs "power nap"), DO NOT extract it.
    
    1. Healthy foods/drinks (food)
    2. Active play/hobbies (play)
    3. Relaxation/wellness methods (rest)
    
    Return a JSON array of objects with keys: "name", "icon" (emoji), and "category".
    Prioritize real-world wellness. Avoid science fiction or nonsensical items.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            icon: { type: Type.STRING },
            category: { type: Type.STRING, enum: ['food', 'play', 'rest'] }
          },
          required: ['name', 'icon', 'category']
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    return [];
  }
};

export const getPetSummary = async (prompt: string): Promise<{name: string, species: string, personality: string}> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Based on this user request for a virtual pet: "${prompt}", give it a creative name, determine its species, and describe its personality. Return ONLY a valid JSON object with keys: name, species, personality.`,
    config: {
        responseMimeType: "application/json"
    }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return { name: "Buddy", species: "Unknown", personality: "Supportive and calm" };
  }
};

export const getEvolutionSummary = async (pet: PetProfile, nextStage: EvolutionStage): Promise<{species: string, personality: string}> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `My virtual pet is evolving from ${pet.stage} to ${nextStage}. 
Name: ${pet.name}. Species: ${pet.species}. Personality: ${pet.personality}.
Describe its evolved form and how its focus on wellness/care matures. 
Return ONLY a valid JSON object with keys: species, personality.`,
    config: {
        responseMimeType: "application/json"
    }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return { species: `Exalted ${pet.species}`, personality: "Wise and grounded" };
  }
};
