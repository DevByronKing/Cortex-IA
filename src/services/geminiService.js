import { getFunctions, httpsCallable } from 'firebase/functions';
import { IDP_PROMPT_TEMPLATE, RAR_PROMPT_TEMPLATE } from '@/constants/prompts.js';
import { IDP_RESPONSE_SCHEMA, RAR_RESPONSE_SCHEMA } from '@/constants/schemas.js';

const functions = getFunctions();

/**
 * Função genérica para chamar o Cloud Function 'callGeminiAgent'.
 * @param {object} data - O payload para enviar para a função.
 * @returns {Promise<any>} - O resultado da chamada da função.
 */
const callGeminiApi = async (data) => {
  try {
    const callGeminiAgent = httpsCallable(functions, 'callGeminiAgent');
    const result = await callGeminiAgent(data);
    return result.data;
  } catch (error) {
    console.error('Erro ao chamar a Cloud Function:', error);
    throw new Error('Falha na comunicação com o serviço de IA.');
  }
};

/**
 * Prepara e envia dados para o processamento de IDP (Intelligent Document Processing).
 * @param {string} documentContent - O conteúdo do documento a ser processado.
 * @returns {Promise<any>}
 */
export const callGeminiAPIForProcessing = (documentContent) => {
  return callGeminiApi({
    content: IDP_PROMPT_TEMPLATE.replace('{{document_content}}', documentContent),
    schema: JSON.stringify(IDP_RESPONSE_SCHEMA),
  });
};

/**
 * Prepara e envia dados para o Raciocínio Baseado em Regras (RAR).
 * @param {string} prompt - O prompt contendo os dados e regras para análise.
 * @returns {Promise<any>}
 */
export const callGeminiAPIForReasoning = (prompt) => {
  return callGeminiApi({
    content: RAR_PROMPT_TEMPLATE.replace('{{prompt}}', prompt),
    schema: JSON.stringify(RAR_RESPONSE_SCHEMA),
  });
};

export const geminiApiService = {
  callGeminiAPIForProcessing,
  callGeminiAPIForReasoning,
};
