/**
 * Base Estruturada de Conhecimento Jurídico-Estatutário
 * Lei Estadual nº 5.810, de 24 de janeiro de 1994
 * Regime Jurídico Único dos Servidores Públicos Civis da Administração Direta,
 * das Autarquias e das Fundações Públicas do Estado do Pará.
 */

export const LEI_5810_ARTIGOS = [
  // --- ESTÁGIO PROBATÓRIO E ESTABILIDADE ---
  {
    artigo: "Art. 31",
    capitulo: "Do Estágio Probatório",
    titulo: "Do Provimento, Vacância, Remoção e Redistribuição",
    texto: "Ao entrar em exercício, o servidor nomeado para cargo de provimento efetivo ficará sujeito a estágio probatório por período de 3 (três) anos, durante o qual a sua aptidão e capacidade serão objeto de avaliação para o desempenho do cargo.",
    requisitos: ["3 anos de efetivo exercício", "Avaliação especial de desempenho", "Idoneidade moral, assiduidade, disciplina e produtividade"],
    processosRelacionados: ["progressao_funcional", "estabilidade"],
    tags: ["estágio probatório", "estabilidade", "3 anos", "avaliação", "efetivo exercício"]
  },
  {
    artigo: "Art. 32",
    capitulo: "Da Estabilidade",
    titulo: "Do Provimento, Vacância, Remoção e Redistribuição",
    texto: "O servidor habilitado em concurso público e empossado em cargo de provimento efetivo adquirirá estabilidade no serviço público ao completar 3 (três) anos de efetivo exercício, após aprovação em avaliação especial de desempenho.",
    requisitos: ["Concurso público", "Aprovação em estágio probatório", "3 anos ininterruptos"],
    processosRelacionados: ["progressao_funcional", "estabilidade"],
    tags: ["estabilidade", "servidor efetivo", "avaliação especial"]
  },

  // --- FÉRIAS ---
  {
    artigo: "Art. 71",
    capitulo: "Das Férias",
    titulo: "Dos Direitos e Vantagens",
    texto: "O servidor fará jus, anualmente, a 30 (trinta) dias consecutivos de férias, que podem ser acumuladas, até o máximo de dois períodos, no caso de comprovada necessidade do serviço, ressalvadas as hipóteses em que haja legislação específica.",
    requisitos: ["12 meses de exercício para o 1º período aquisitivo", "Máximo de 30 dias por ano", "Acumulação máxima de 2 períodos por necessidade do serviço"],
    processosRelacionados: ["solicitacao_ferias"],
    tags: ["férias", "30 dias", "período aquisitivo", "acumulação"]
  },
  {
    artigo: "Art. 73",
    capitulo: "Das Férias - Adicional Constitucional",
    titulo: "Dos Direitos e Vantagens",
    texto: "Independentemente de solicitação, será pago ao servidor, por ocasião das férias, um adicional correspondente a 1/3 (um terço) da remuneração do período de férias.",
    requisitos: ["Pagamento automático antecipado", "1/3 constitucional"],
    processosRelacionados: ["solicitacao_ferias"],
    tags: ["terço de férias", "adicional de férias", "remuneração"]
  },

  // --- LICENÇA-PRÊMIO (QUINQUÊNIO) ---
  {
    artigo: "Art. 81, inciso IV",
    capitulo: "Das Licenças - Disposições Gerais",
    titulo: "Dos Direitos e Vantagens",
    texto: "Conceder-se-á licença ao servidor: IV - como prêmio à assiduidade (Licença-Prêmio).",
    requisitos: ["Efetivo exercício", "Assiduidade plena"],
    processosRelacionados: ["licenca_premio"],
    tags: ["licença prêmio", "assiduidade", "quinquênio"]
  },
  {
    artigo: "Art. 98",
    capitulo: "Da Licença-Prêmio por Assiduidade",
    titulo: "Dos Direitos e Vantagens",
    texto: "Após cada quinquênio ininterrupto de efetivo exercício no serviço público estadual, o servidor fará jus a 3 (três) meses de licença-prêmio, com a remuneração do cargo efetivo.",
    requisitos: [
      "5 anos (quinquênio) ininterruptos de efetivo exercício",
      "Não ter sofrido penalidade disciplinar de suspensão",
      "Não ter faltado ao serviço injustificadamente por mais de 30 dias no período aquisitivo"
    ],
    processosRelacionados: ["licenca_premio"],
    tags: ["licença-prêmio", "quinquênio", "5 anos", "3 meses", "remuneração integral", "assiduidade"]
  },
  {
    artigo: "Art. 101",
    capitulo: "Da Licença-Prêmio - Fruição e Pecúnia",
    titulo: "Dos Direitos e Vantagens",
    texto: "O número de servidores em gozo simultâneo de licença-prêmio não poderá ser superior a 1/3 (um terço) da lotação da respectiva unidade administrativa do órgão.",
    requisitos: ["Conveniência da administração", "Escala de revezamento setorial"],
    processosRelacionados: ["licenca_premio"],
    tags: ["licença prêmio", "escala", "1/3 da lotação"]
  },

  // --- LICENÇA MATERNIDADE E ADOTANTE ---
  {
    artigo: "Art. 89",
    capitulo: "Da Licença à Gestante e Adotante",
    titulo: "Dos Direitos e Vantagens",
    texto: "Será concedida licença à servidora gestante por até 180 (cento e oitenta) dias consecutivos, sem prejuízo da remuneração, com início a partir do oitavo mês de gestação, salvo prescrição médica em contrário.",
    requisitos: ["Atestado médico comprobatório", "Até 180 dias consecutivos", "Remuneração integral"],
    processosRelacionados: ["licenca_maternidade"],
    tags: ["licença maternidade", "180 dias", "gestante", "remuneração integral", "atestado médico"]
  },
  {
    artigo: "Art. 92",
    capitulo: "Da Licença ao Adotante",
    titulo: "Dos Direitos e Vantagens",
    texto: "À servidora que adotar ou obtiver guarda judicial para fins de adoção de criança de até 1 (um) ano de idade, serão concedidos 180 (cento e oitenta) dias de licença remunerada.",
    requisitos: ["Termo de guarda ou certidão de adoção", "Criança de até 1 ano (ou proporcional conforme idade)"],
    processosRelacionados: ["licenca_maternidade", "licenca_adotante"],
    tags: ["adoção", "adotante", "guarda judicial", "180 dias"]
  },
  {
    artigo: "Art. 94",
    capitulo: "Da Licença Paternidade",
    titulo: "Dos Direitos e Vantagens",
    texto: "A licença-paternidade será concedida ao servidor pelo nascimento de filho ou adoção, pelo prazo de até 20 (vinte) dias consecutivos, sem prejuízo de sua remuneração.",
    requisitos: ["Certidão de nascimento ou termo de adoção", "Até 20 dias consecutivos"],
    processosRelacionados: ["licenca_paternidade"],
    tags: ["licença paternidade", "20 dias", "nascimento", "filho"]
  },

  // --- LICENÇA PARA TRATAMENTO DE SAÚDE ---
  {
    artigo: "Art. 82",
    capitulo: "Da Licença para Tratamento de Saúde",
    titulo: "Dos Direitos e Vantagens",
    texto: "Será concedida ao servidor licença para tratamento de saúde, a pedido ou de ofício, com base em perícia médica oficial, sem prejuízo da remuneração a que fizer jus.",
    requisitos: ["Atestado médico com CID", "Homologação por perícia médica oficial do Estado (Junta Médica)", "CRM do médico assistente"],
    processosRelacionados: ["licenca_tratamento_saude"],
    tags: ["saúde", "atestado médico", "perícia médica", "junta médica", "CID", "remuneração"]
  },
  {
    artigo: "Art. 86",
    capitulo: "Da Inspeção Médica e Prazos",
    titulo: "Dos Direitos e Vantagens",
    texto: "A licença superior a 30 (trinta) dias dependerá sempre de inspeção por junta médica oficial do Estado do Pará.",
    requisitos: ["Afastamento > 30 dias exige Junta Médica Oficial"],
    processosRelacionados: ["licenca_tratamento_saude"],
    tags: ["junta médica", "inspeção oficial", "30 dias"]
  },

  // --- LICENÇA PARA CAPACITAÇÃO / APERFEIÇOAMENTO ---
  {
    artigo: "Art. 105",
    capitulo: "Da Licença para Capacitação Profissional",
    titulo: "Dos Direitos e Vantagens",
    texto: "Após cada quinquênio de efetivo exercício, o servidor poderá, no interesse da Administração, afastar-se do exercício do cargo efetivo, com a respectiva remuneração, por até 3 (três) meses, para participar de curso de capacitação profissional.",
    requisitos: ["5 anos de efetivo exercício", "Interesse da Administração Pública", "Vinculação com as atribuições do cargo", "Comprovação de frequência e aproveitamento"],
    processosRelacionados: ["licenca_capacitacao"],
    tags: ["capacitação", "mestrado", "doutorado", "aperfeiçoamento", "5 anos", "interesse público"]
  },

  // --- ADICIONAL DE TITULAÇÃO E QUALIFICAÇÃO ---
  {
    artigo: "Art. 68 c/c PCCR",
    capitulo: "Das Gratificações e Adicionais por Qualificação",
    titulo: "Dos Vencimentos e Vantagens",
    texto: "O adicional de titulação é devido ao servidor titular de cargo efetivo em razão de formação acadêmica superior à exigida para o ingresso no cargo, nos percentuais previstos no respectivo Plano de Cargos, Carreiras e Remunerações (PCCR).",
    requisitos: ["Apresentação de diploma ou certificado reconhecido pelo MEC", "Especialização (Pós), Mestrado ou Doutorado", "Correlação com as atribuições funcionais"],
    processosRelacionados: ["adicional_titulacao", "progressao_funcional"],
    tags: ["adicional de titulação", "pós-graduação", "mestrado", "doutorado", "diploma", "MEC"]
  },

  // --- SALÁRIO-FAMÍLIA E DEPENDENTES ---
  {
    artigo: "Art. 120",
    capitulo: "Do Salário-Família",
    titulo: "Dos Benefícios e Concessões",
    texto: "O salário-família é devido ao servidor ativo ou inativo, por dependente econômico que viva sob sua dependência financeira e sob o mesmo teto, conforme os critérios da previdência estadual.",
    requisitos: ["Certidão de nascimento de dependente menor de 14 anos ou inválido", "Declaração de dependência econômica e residência sob o mesmo teto", "Comprovação de vacinação e frequência escolar"],
    processosRelacionados: ["salario_familia"],
    tags: ["salário-família", "dependentes", "auxílio", "filhos"]
  },

  // --- DEVERES, PROIBIÇÕES E REGIME DISCIPLINAR ---
  {
    artigo: "Art. 177",
    capitulo: "Dos Deveres do Servidor",
    titulo: "Do Regime Disciplinar",
    texto: "São deveres do servidor: exercer com zelo e dedicação as atribuições do cargo; ser leal às instituições a que servir; observar as normas legais e regulamentares; cumprir as ordens superiores, exceto quando manifestamente ilegais; atender com presteza ao público e à expedição de certidões requeridas para defesa de direitos.",
    requisitos: ["Zelo", "Dedicação", "Assiduidade", "Cumprimento das normas legais"],
    processosRelacionados: ["geral", "pad"],
    tags: ["deveres", "disciplina", "ética pública", "lealdade"]
  }
];

/**
 * Busca artigos da Lei 5.810/94 relevantes para um texto ou processo
 * @param {string} query - Termo ou conteúdo do requerimento
 * @param {string} [processoId] - Identificador do tipo de processo
 * @returns {Array<object>} - Artigos mais relevantes ordenados por score
 */
export const searchLegalArticles = (query = '', processoId = null) => {
  if (!query && !processoId) return LEI_5810_ARTIGOS.slice(0, 5);

  const cleanQuery = query.toLowerCase();
  
  const scored = LEI_5810_ARTIGOS.map(item => {
    let score = 0;

    // Match de processo específico
    if (processoId && item.processosRelacionados.includes(processoId)) {
      score += 10;
    }

    // Match de tags
    item.tags.forEach(tag => {
      if (cleanQuery.includes(tag.toLowerCase())) score += 3;
    });

    // Match de texto
    if (item.texto.toLowerCase().includes(cleanQuery)) score += 5;
    if (item.artigo.toLowerCase().includes(cleanQuery)) score += 8;

    return { ...item, score };
  });

  return scored
    .filter(item => item.score > 0 || (processoId && item.processosRelacionados.includes(processoId)))
    .sort((a, b) => b.score - a.score);
};
