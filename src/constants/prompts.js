export const IDP_PROMPT_TEMPLATE = `
Extraia os seguintes campos do documento anexo:
- NOME_DO_SERVIDOR
- TIPO_DE_LICENCA
- DATA_DE_INICIO
- NUMERO_DE_DIAS
O documento é:
{{document_content}}
`;

export const RAR_PROMPT_TEMPLATE = `
Você é um agente de RH especialista em legislação do Pará.
Analise o pedido de licença com base nos dados do servidor e nas regras.
{{prompt}}
`;
