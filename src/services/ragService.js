import { LEI_5810_ARTIGOS, searchLegalArticles } from '@/constants/legalKnowledge';
import { supabase, isSupabaseConfigured } from '@/libs/supabase';

/**
 * Serviço de RAG Jurídico (Retrieval-Augmented Generation) para o Estatuto dos Servidores Públicos do Pará.
 */
export const ragService = {
  /**
   * Recupera os artigos estatutários relevantes para fundamentar uma análise
   * @param {string} processoId - Identificador do processo (ex: 'licenca_premio')
   * @param {string} textContent - Texto extraído ou consulta do usuário
   * @returns {Promise<Array<object>>} - Artigos com fundamentação e requisitos
   */
  async retrieveRelevantArticles(processoId, textContent = '') {
    // 1. Busca na base local embutida de alta performance
    const localMatches = searchLegalArticles(textContent, processoId);

    // 2. Se o Supabase estiver configurado com a tabela legal_articles, busca também no banco
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('legal_articles')
          .select('*')
          .limit(5);

        if (!error && data && data.length > 0) {
          const formatted = data.map(d => ({
            artigo: d.artigo,
            capitulo: d.capitulo || 'Estatuto dos Servidores do Pará',
            titulo: d.titulo || 'Lei Estadual nº 5.810/94',
            texto: d.texto_integral,
            requisitos: d.tags || [],
            processosRelacionados: [processoId],
            score: 15
          }));
          return [...formatted, ...localMatches].slice(0, 4);
        }
      } catch (err) {
        console.warn('Busca no Supabase legal_articles falhou, usando base RAG local:', err.message);
      }
    }

    return localMatches.slice(0, 4);
  },

  /**
   * Constrói o bloco de fundamentação legal para injetar no prompt do Agente Decisor
   * @param {string} processoId
   * @param {string} documentContent
   * @returns {Promise<string>}
   */
  async buildRAGContext(processoId, documentContent = '') {
    const articles = await this.retrieveRelevantArticles(processoId, documentContent);
    if (!articles.length) return '';

    let context = '\n\n=== FUNDAMENTAÇÃO LEGAL OBRIGATÓRIA (LEI ESTADUAL Nº 5.810/1994) ===\n';
    articles.forEach(art => {
      context += `\n[${art.artigo} - ${art.capitulo}]\n`;
      context += `Texto Legal: "${art.texto}"\n`;
      if (art.requisitos && art.requisitos.length) {
        context += `Requisitos Cumulativos: ${art.requisitos.join(', ')}\n`;
      }
    });
    context += '========================================================================\n';

    return context;
  },

  /**
   * Retorna todos os artigos da lei para navegação no visualizador de legislação
   */
  getAllArticles() {
    return LEI_5810_ARTIGOS;
  }
};
