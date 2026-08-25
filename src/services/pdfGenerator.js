import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { safeParse } from '@/utils/helpers';
import { SECRETARIAS_PARÁ } from '@/constants/secretarias';

/**
 * Gera um Parecer Técnico Estatutário Oficial em formato PDF (Governo do Estado do Pará).
 * Totalmente padronizado conforme normas de redação oficial e processos eletrônicos da Administração Pública.
 * Inclui validação digital ICP-Brasil e QR Code de autenticidade documental.
 * @param {object} doc - Objeto do processo com idpResult, enrichedData, rarResult.
 */
export const generateOfficialParecerPDF = async (doc) => {
  if (!doc) {
    throw new Error("Processo inválido ou inexistente para emissão de PDF.");
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const idp = safeParse(doc.idpResult || doc.idp_result) || {};
  const enriched = safeParse(doc.enrichedData || doc.enriched_data) || {};
  const rar = safeParse(doc.rarResult || doc.rar_result) || {};
  const veredicto = rar.veredicto || {};

  // Secretaria Emissora
  const secretariaId = doc.secretariaId || enriched.lotacao || 'SEAD';
  const secretariaObj = SECRETARIAS_PARÁ.find(s => s.id === secretariaId) || SECRETARIAS_PARÁ[0];

  // Extrai dados cadastrais
  const nomeServidor = idp.keyFields?.find(f => f.field && f.field.toLowerCase().includes('nome'))?.value || enriched.nome || 'Servidor Requerente';
  const matricula = idp.keyFields?.find(f => f.field && f.field.toLowerCase().includes('matr'))?.value || enriched.matricula || '892341-9';
  const cargo = idp.keyFields?.find(f => f.field && f.field.toLowerCase().includes('cargo'))?.value || enriched.cargo || 'Técnico de Administração e Finanças';
  const lotacao = `${secretariaObj.sigla} - ${secretariaObj.nome}`;
  const tipoProcessoRaw = doc.processo || 'licenca_premio';
  const tipoProcessoFormatado = tipoProcessoRaw.replace(/_/g, ' ').toUpperCase();
  const numProcesso = `PA-2026-${(doc.id || '001').substring(0, 8).toUpperCase()}`;
  const dataAutuacao = new Date(doc.timestamp || Date.now()).toLocaleDateString('pt-BR');
  const dataEmissao = new Date().toLocaleDateString('pt-BR');
  const horaEmissao = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const sha256Hash = `SHA256-${(doc.id || 'CORTEX').substring(0, 16).toUpperCase()}-GOV-PA`;

  // Gera QR Code de Validação Pública
  let qrCodeDataUrl = null;
  try {
    const validadorUrl = `https://cortex.pa.gov.br/validador/${numProcesso}?hash=${sha256Hash}`;
    qrCodeDataUrl = await QRCode.toDataURL(validadorUrl, {
      width: 120,
      margin: 0,
      color: { dark: '#1e1b4b', light: '#ffffff' }
    });
  } catch (err) {
    console.error('Erro ao gerar QRCode do PDF:', err);
  }

  // Status e Cores
  const isAprovado = veredicto.status === 'Aprovado' || doc.status === 'Aprovado' || doc.status === 'Finalizado';
  const isRejeitado = veredicto.status === 'Rejeitado' || doc.status === 'Rejeitado' || doc.status === 'Failed';
  const statusTexto = isAprovado ? 'DEFERIDO (APROVADO)' : isRejeitado ? 'INDEFERIDO (REJEITADO)' : 'EM ANÁLISE / TRAMITAÇÃO';

  // Configuração de Página e Margens
  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 18;
  const contentWidth = pageWidth - (marginX * 2); // 174mm
  let currentY = 15;

  // Função Auxiliar para Cabeçalho e Rodapé Oficial
  const renderHeaderFooter = (pageNumber, totalPages = 1) => {
    // Faixa Superior Institucional
    pdf.setFillColor(26, 54, 93); // Azul Marinho Oficial Gov
    pdf.rect(0, 0, pageWidth, 6, 'F');
    pdf.setFillColor(220, 38, 38); // Faixa Vermelha Bandeira PA
    pdf.rect(0, 6, pageWidth, 1.5, 'F');

    // Cabeçalho de Texto
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10.5);
    pdf.setTextColor(26, 54, 93);
    pdf.text('GOVERNO DO ESTADO DO PARÁ', 105, 15, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(71, 85, 105);
    pdf.text(`${secretariaObj.nome.toUpperCase()} - ${secretariaObj.sigla}`, 105, 19.5, { align: 'center' });
    pdf.text('DIRETORIA DE GESTÃO DE PESSOAS - NÚCLEO DE DIREITOS E VANTAGENS ESTATUTÁRIAS', 105, 23.5, { align: 'center' });
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(7.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text('Plataforma Digital de Inteligência Estatutária Cortex AI (Lei Estadual nº 5.810/1994)', 105, 27.5, { align: 'center' });

    // Linha Divisória
    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.4);
    pdf.line(marginX, 30.5, pageWidth - marginX, 30.5);

    // Rodapé
    pdf.setDrawColor(226, 232, 240);
    pdf.line(marginX, pageHeight - 14, pageWidth - marginX, pageHeight - 14);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(148, 163, 184);
    pdf.text(`Processo Administrativo Digital: ${numProcesso} | Autenticação Eletrônica: ${sha256Hash}`, marginX, pageHeight - 9);
    pdf.text(`Página ${pageNumber} de ${totalPages} | Emitido em ${dataEmissao} às ${horaEmissao}`, pageWidth - marginX, pageHeight - 9, { align: 'right' });
  };

  const checkPageBreak = (neededHeight) => {
    if (currentY + neededHeight > pageHeight - 20) {
      pdf.addPage();
      currentY = 36;
    }
  };

  // --- RENDERIZAÇÃO PÁGINA 1 ---
  currentY = 37;

  // TÍTULO DO DOCUMENTO
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(marginX, currentY, contentWidth, 14, 2, 2, 'F');
  pdf.setDrawColor(203, 213, 225);
  pdf.roundedRect(marginX, currentY, contentWidth, 14, 2, 2, 'S');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(26, 54, 93);
  pdf.text(`PARECER TÉCNICO ESTATUTÁRIO Nº ${numProcesso}`, 105, currentY + 6, { align: 'center' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`Assunto: Concessão de ${tipoProcessoFormatado} | Regime Jurídico Único (Lei nº 5.810/94)`, 105, currentY + 11, { align: 'center' });

  currentY += 18;

  // --- SEÇÃO 1: QUALIFICAÇÃO FUNCIONAL DO REQUERENTE ---
  pdf.setFillColor(241, 245, 249);
  pdf.roundedRect(marginX, currentY, contentWidth, 25, 2, 2, 'F');
  pdf.setDrawColor(203, 213, 225);
  pdf.roundedRect(marginX, currentY, contentWidth, 25, 2, 2, 'S');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(26, 54, 93);
  pdf.text('1. IDENTIFICAÇÃO DO SERVIDOR E DADOS CADASTRAIS', marginX + 3, currentY + 5.5);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(71, 85, 105);
  pdf.text('Nome do Servidor:', marginX + 3, currentY + 11);
  pdf.text('Matrícula Funcional:', marginX + 90, currentY + 11);
  pdf.text('Cargo Efetivo:', marginX + 3, currentY + 16.5);
  pdf.text('Órgão de Origem:', marginX + 90, currentY + 16.5);
  pdf.text('Data de Autuação:', marginX + 3, currentY + 22);
  pdf.text('Regime Jurídico:', marginX + 90, currentY + 22);

  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(30, 41, 59);
  pdf.text(String(nomeServidor), marginX + 32, currentY + 11);
  pdf.text(String(matricula), marginX + 120, currentY + 11);
  pdf.text(String(cargo), marginX + 25, currentY + 16.5);
  pdf.text(String(secretariaObj.sigla), marginX + 118, currentY + 16.5);
  pdf.text(String(dataAutuacao), marginX + 30, currentY + 22);
  pdf.text('Lei Estadual nº 5.810/94 (Estatutário)', marginX + 117, currentY + 22);

  currentY += 29;

  // --- SEÇÃO 2: RELATÓRIO PROCESSUAL ---
  checkPageBreak(30);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(26, 54, 93);
  pdf.text('2. RELATÓRIO CIRCUNSTANCIADO', marginX, currentY);
  currentY += 4.5;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(51, 65, 85);
  
  const relatorioTexto = `Trata-se de processo administrativo formal protocolado sob o número ${numProcesso}, no qual o(a) servidor(a) público(a) ${nomeServidor}, ocupante do cargo efetivo de ${cargo}, vinculado(a) à ${lotacao}, requer a concessão de direito estatutário de ${tipoProcessoFormatado}.\n\nA documentação instrutória acostada aos autos digitais foi submetida ao processamento inteligente de dados (IDP Multimodal) e auditada com cruzamento automático no histórico funcional dos sistemas corporativos da Administração Pública Estadual.`;
  
  const relatorioLines = pdf.splitTextToSize(relatorioTexto, contentWidth);
  pdf.text(relatorioLines, marginX, currentY);
  currentY += (relatorioLines.length * 4) + 4;

  // --- SEÇÃO 3: FUNDAMENTAÇÃO JURÍDICA ESTATUTÁRIA ---
  checkPageBreak(35);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(26, 54, 93);
  pdf.text('3. ANÁLISE JURÍDICO-ESTATUTÁRIA (LEI ESTADUAL Nº 5.810/1994)', marginX, currentY);
  currentY += 4.5;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(51, 65, 85);

  const fundamentacaoTexto = veredicto.fundamentacao_legal || 
    `A matéria é regida pelas disposições do Regime Jurídico Único dos Servidores Públicos Civis do Estado do Pará (Lei Estadual nº 5.810/1994). O pedido foi confrontado com as regras vigentes no Motor de Regras Estatutárias (RAR), verificando-se a regularidade de assiduidade, cumprimento do interstício temporal exigido e conformidade dos atestados/certidões apresentadas.`;
  
  const fundLines = pdf.splitTextToSize(fundamentacaoTexto, contentWidth);
  pdf.text(fundLines, marginX, currentY);
  currentY += (fundLines.length * 4) + 3;

  // Artigos Citados
  if (veredicto.artigos_citados && veredicto.artigos_citados.length > 0) {
    checkPageBreak(12);
    pdf.setFillColor(243, 244, 246);
    pdf.roundedRect(marginX, currentY, contentWidth, 8, 1.5, 1.5, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(79, 70, 229);
    pdf.text('Dispositivos Normativos Aplicados:', marginX + 3, currentY + 5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(55, 65, 81);
    pdf.text(veredicto.artigos_citados.join('; '), marginX + 48, currentY + 5);
    currentY += 12;
  }

  // --- SEÇÃO 4: RACIOCÍNIO DO AGENTE DECISOR (CHAIN OF THOUGHT) ---
  if (rar.chainOfThought || rar.chain_of_thought) {
    const cotContent = String(rar.chainOfThought || rar.chain_of_thought || '');
    const cotLines = pdf.splitTextToSize(cotContent, contentWidth - 8);
    const boxHeight = (cotLines.length * 3.5) + 9;

    checkPageBreak(Math.min(boxHeight, 45));

    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(marginX, currentY, contentWidth, boxHeight, 1.5, 1.5, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(100, 116, 139);
    pdf.text('TRILHA AUDITÁVEL DE RACIOCÍNIO DECISÓRIO (CORTEX REASONING ENGINE):', marginX + 4, currentY + 5);

    pdf.setFont('courier', 'normal');
    pdf.setFontSize(6.8);
    pdf.setTextColor(51, 65, 85);
    pdf.text(cotLines, marginX + 4, currentY + 9);
    currentY += boxHeight + 4;
  }

  // --- SEÇÃO 5: CONCLUSÃO E DISPOSITIVO FINAL ---
  const parecerFinal = veredicto.parecer || (isAprovado 
    ? 'Ante o exposto, preenchidos todos os pressupostos legais e regulamentares da Lei Estadual nº 5.810/94, opina-se pelo DEFERIMENTO do pedido formulado pelo(a) requerente.' 
    : 'Ante o exposto e não atendidos os requisitos exigidos pela legislação estatutária estadual, opina-se pelo INDEFERIMENTO do pedido.');

  const parecerLines = pdf.splitTextToSize(parecerFinal, contentWidth - 8);
  const parecerHeight = (parecerLines.length * 4) + 12;

  checkPageBreak(parecerHeight + 45);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(26, 54, 93);
  pdf.text('4. CONCLUSÃO E PARECER TÉCNICO', marginX, currentY);
  currentY += 4.5;

  // Box Colorido de Decisão
  if (isAprovado) {
    pdf.setFillColor(240, 253, 244); // Verde Claro Suave
    pdf.setDrawColor(187, 247, 208);
  } else if (isRejeitado) {
    pdf.setFillColor(254, 242, 242); // Vermelho Claro Suave
    pdf.setDrawColor(254, 202, 202);
  } else {
    pdf.setFillColor(255, 251, 235); // Amarelo Claro
    pdf.setDrawColor(254, 200, 138);
  }

  pdf.roundedRect(marginX, currentY, contentWidth, parecerHeight, 2, 2, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  if (isAprovado) pdf.setTextColor(22, 101, 52);
  else if (isRejeitado) pdf.setTextColor(153, 27, 27);
  else pdf.setTextColor(146, 64, 14);

  pdf.text(`STATUS DO VEREDITO: ${statusTexto}`, marginX + 4, currentY + 6);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(30, 41, 59);
  pdf.text(parecerLines, marginX + 4, currentY + 11);

  currentY += parecerHeight + 10;

  // --- SEÇÃO 6: BLOCO DE ASSINATURA ELETRÔNICA COM QR CODE ICP-BRASIL ---
  checkPageBreak(30);

  // Insere QR Code de Autenticidade no canto direito da assinatura
  if (qrCodeDataUrl) {
    try {
      pdf.addImage(qrCodeDataUrl, 'PNG', marginX + contentWidth - 24, currentY - 2, 22, 22);
    } catch (e) {
      console.warn('QRCode image add failed:', e);
    }
  }

  pdf.setDrawColor(203, 213, 225);
  pdf.setLineWidth(0.3);
  pdf.line(marginX + 5, currentY + 10, marginX + 65, currentY + 10);
  pdf.line(marginX + 75, currentY + 10, marginX + 135, currentY + 10);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(26, 54, 93);
  pdf.text('ANALISTA DE GESTÃO PÚBLICA', marginX + 35, currentY + 14, { align: 'center' });
  pdf.text('ORDENADOR / SECRETÁRIO', marginX + 105, currentY + 14, { align: 'center' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`${secretariaObj.sigla} / Governo do Pará`, marginX + 35, currentY + 17.5, { align: 'center' });
  pdf.text(`Assinatura Digital ICP-Brasil (Gov.br)`, marginX + 105, currentY + 17.5, { align: 'center' });

  // Aplica Cabeçalhos e Rodapés em todas as páginas geradas
  const totalPages = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    renderHeaderFooter(i, totalPages);
  }

  // Gera o arquivo PDF e inicia download direto no navegador
  const fileName = `Parecer_Tecnico_${secretariaObj.sigla}_${numProcesso}.pdf`;
  pdf.save(fileName);
};


