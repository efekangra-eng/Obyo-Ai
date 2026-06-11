import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const aiClient = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

async function main() {
  try {
    const config = {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isValidChart: { type: Type.BOOLEAN, description: "Must be true if the image is a trading chart/graph, and false otherwise." },
          direction: { type: Type.STRING },
          confidence: { type: Type.INTEGER },
          reasoning: { type: Type.STRING },
          targetPrice: { type: Type.STRING },
          stopLoss: { type: Type.STRING },
          timeframe: { type: Type.STRING },
          indicators: {
            type: Type.OBJECT,
            properties: {
              trend: { type: Type.STRING },
              pattern: { type: Type.STRING },
              rsi: { type: Type.STRING },
              macd: { type: Type.STRING },
              movingAverages: { type: Type.STRING }
            },
            required: ["trend", "pattern", "rsi", "macd", "movingAverages"]
          },
          annotations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                color: { type: Type.STRING },
                label: { type: Type.STRING },
                x1: { type: Type.INTEGER },
                y1: { type: Type.INTEGER },
                x2: { type: Type.INTEGER },
                y2: { type: Type.INTEGER }
              },
              required: ["type", "color", "label", "x1", "y1"]
            }
          }
        },
        required: ["isValidChart"]
      }
    };
    
    // A simple red dot image (1x1 PNG) to simulate a non-chart
    const base64Data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    
    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: "image/png",
      },
    };

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [imagePart, { text: "Analyze this image" }],
      config
    });
    console.log(response.text);
  } catch (err) {
    console.error("error:", err);
  }
}
main();
