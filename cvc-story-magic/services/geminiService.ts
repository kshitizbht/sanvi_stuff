import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Story } from "../types";

// Initialize Gemini client
// Note: In a real app, ensure API_KEY is defined. 
// We assume process.env.API_KEY is available as per instructions.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const storySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Title of the story" },
    pages: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { 
            type: Type.STRING, 
            description: "A single simple sentence using CVC words. Ex: 'The cat sat on the mat'." 
          },
          imageDescription: { 
            type: Type.STRING, 
            description: "A vivid, kid-friendly visual description of the scene for an illustrator." 
          },
        },
        required: ["text", "imageDescription"],
      },
    },
  },
  required: ["title", "pages"],
};

export const generateStoryContent = async (topic: string): Promise<Story> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Write a short 5-page story for children learning to read. 
      Topic: ${topic}.
      Rules:
      1. Use mostly CVC (Consonant-Vowel-Consonant) words and simple sight words.
      2. Each page should have exactly one simple sentence.
      3. Provide a cute, colorful image description for each page.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: storySchema,
        systemInstruction: "You are a helpful reading teacher and children's book author.",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No text returned from Gemini");
    
    return JSON.parse(text) as Story;
  } catch (error) {
    console.error("Error generating story text:", error);
    throw error;
  }
};

export const generateStoryImage = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: `A cute, flat vector style children's book illustration: ${prompt}` }],
      },
      config: {
        // Nano banana (flash-image) usually returns base64 in inlineData
      },
    });

    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Error generating image:", error);
    // Return a placeholder if generation fails to keep app usable
    return `https://picsum.photos/800/800?random=${Math.random()}`;
  }
};

export const editStoryImage = async (imageDataUrl: string, prompt: string): Promise<string> => {
  // Parse Data URL to get base64 and mimeType
  const matches = imageDataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Invalid image data URL format");
  }
  const mimeType = matches[1];
  const base64Data = matches[2];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: `Edit this illustration: ${prompt}. Keep the style consistent (cute, flat vector children's book style).`,
          },
        ],
      },
    });

    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image data found in edit response");
  } catch (error) {
    console.error("Error editing image:", error);
    throw error;
  }
};