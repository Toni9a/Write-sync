
import { GoogleGenAI, Type } from "@google/genai";
import { NoteAnalysis } from "../types";

export const analyzeHandwrittenNote = async (imageUrl: string, density: number = 4): Promise<NoteAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Directly extract base64 if it's already a data URL to save time
  let base64Data = "";
  if (imageUrl.startsWith('data:')) {
    base64Data = imageUrl.split(',')[1];
  } else {
    const responseData = await fetch(imageUrl);
    const blob = await responseData.blob();
    base64Data = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(blob);
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: base64Data,
            },
          },
          {
            text: `Analyze this handwritten note. Detect every word and return as JSON.
            Structure: { "segments": [{ "text": "word", "box_2d": [ymin, xmin, ymax, xmax] }] }
            Coordinates must be 0-1000. Sort by top-to-bottom, then left-to-right reading order.`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          segments: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                box_2d: {
                  type: Type.ARRAY,
                  items: { type: Type.NUMBER },
                },
              },
              required: ["text", "box_2d"],
            },
          },
        },
        required: ["segments"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response");
  const parsed = JSON.parse(text);
  
  if (parsed.segments && parsed.segments.length > 0) {
    // Simple reading order sort: 20px (2%) vertical tolerance for same-line words
    parsed.segments.sort((a: any, b: any) => {
      const diffY = a.box_2d[0] - b.box_2d[0];
      if (Math.abs(diffY) < 20) return a.box_2d[1] - b.box_2d[1];
      return diffY;
    });
  }
  
  return parsed as NoteAnalysis;
};
