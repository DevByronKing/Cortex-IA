export const IDP_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    documentType: { type: 'string' },
    resumo: { type: 'string' },
    risco_inconsistencia: { type: 'string', enum: ['Baixo', 'Médio', 'Alto'] },
    keyFields: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          field: { type: 'string' },
          value: { type: 'string' },
          confidence: { type: 'number' },
        },
        required: ['field', 'value'],
      },
    },
  },
  required: ['documentType', 'keyFields'],
};

export const RAR_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    veredicto: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['Aprovado', 'Rejeitado', 'Necessita Análise'] },
        parecer: { type: 'string' },
        fundamentacao_legal: { type: 'string' },
        artigos_citados: {
          type: 'array',
          items: { type: 'string' }
        },
        sugestao_despacho: { type: 'string' }
      },
      required: ['status', 'parecer'],
    },
    chainOfThought: { type: 'string' },
  },
  required: ['veredicto', 'chainOfThought'],
};

