import {onCall, HttpsError, CallableRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {GoogleGenerativeAI, GenerationConfig} from "@google/generative-ai";

// Define a interface dos dados que esperamos receber do Frontend
interface AgentRequestData {
  content?: string;
  fileData?: string; // Base64 do PDF ou Imagem
  mimeType?: string; // 'application/pdf', 'image/png', 'image/jpeg'
  messages?: Array<{ role: string; text: string }>;
  systemInstruction?: string;
  schema?: string;
  mode?: "json" | "text" | "chat";
}

// Pega a chave do ambiente ou usa string vazia
const API_KEY = process.env.GEMINI_API_KEY || "";

const genAI = new GoogleGenerativeAI(API_KEY);

export const callGeminiAgent = onCall(
  {cors: true},
  async (request: CallableRequest<AgentRequestData>) => {
    // 1. Validação de Autenticação
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "O usuário deve estar logado.");
    }

    const {content, fileData, mimeType, messages, systemInstruction, schema, mode} = request.data;

    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: systemInstruction || "Você é o Agente de Extração e Inteligência Jurídica do Cortex AI, especializado em processos administrativos e estatuto dos servidores públicos.",
      });

      const isJson = mode === "json" || !!schema;

      const generationConfig: GenerationConfig = isJson ? {
        responseMimeType: "application/json",
        responseSchema: schema ? JSON.parse(schema) : undefined,
      } : {};

      let contents: Array<{ role: string; parts: Array<any> }> = [];

      if (messages && messages.length > 0) {
        contents = messages.map(m => ({
          role: m.role === "assistant" || m.role === "model" ? "model" : "user",
          parts: [{ text: m.text }],
        }));
      } else {
        const parts: Array<any> = [];

        if (content) {
          parts.push({ text: content });
        }

        if (fileData && mimeType) {
          const cleanBase64 = fileData.includes("base64,") ? fileData.split("base64,")[1] : fileData;
          parts.push({
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType,
            },
          });
        }

        if (parts.length === 0) {
          throw new HttpsError("invalid-argument", "Nenhum conteúdo, arquivo ou mensagem fornecido.");
        }

        contents = [{ role: "user", parts }];
      }

      const result = await model.generateContent({
        contents,
        generationConfig,
      });

      const responseText = result.response.text();

      if (isJson) {
        try {
          const cleanText = responseText.replace(/```json\n?|\n?```/g, "").trim();
          return { data: JSON.parse(cleanText) };
        } catch {
          return { data: { resposta: responseText } };
        }
      }

      return { data: { text: responseText } };
    } catch (error: unknown) {
      logger.error("Erro no Gemini:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      throw new HttpsError("internal", `Erro ao processar IA: ${errorMessage}`);
    }
  });
