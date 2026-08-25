/**
 * Catálogo Oficial de Secretarias e Órgãos do Governo do Estado do Pará
 * e Matriz de Permissões de Controle de Acesso Baseado em Papéis (RBAC).
 */

export const SECRETARIAS_PARÁ = [
  {
    id: 'SEAD',
    sigla: 'SEAD',
    nome: 'Secretaria de Estado de Planejamento e Administração',
    tipo: 'Órgão Central de Gestão de Pessoas',
    cor: 'indigo',
    badgeClass: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
  },
  {
    id: 'SEDUC',
    sigla: 'SEDUC',
    nome: 'Secretaria de Estado de Educação',
    tipo: 'Órgão Setorial de Educação',
    cor: 'emerald',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
  },
  {
    id: 'SESPA',
    sigla: 'SESPA',
    nome: 'Secretaria de Estado de Saúde Pública',
    tipo: 'Órgão Setorial de Saúde',
    cor: 'rose',
    badgeClass: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
  },
  {
    id: 'SEFA',
    sigla: 'SEFA',
    nome: 'Secretaria de Estado da Fazenda',
    tipo: 'Órgão Setorial Financeiro e Tributário',
    cor: 'amber',
    badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
  },
  {
    id: 'PCPA',
    sigla: 'PC-PA',
    nome: 'Polícia Civil do Estado do Pará',
    tipo: 'Segurança Pública',
    cor: 'slate',
    badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
  },
  {
    id: 'ITERPA',
    sigla: 'ITERPA',
    nome: 'Instituto de Terras do Pará',
    tipo: 'Autarquia Fundiária',
    cor: 'teal',
    badgeClass: 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800'
  },
  {
    id: 'DETRAN',
    sigla: 'DETRAN-PA',
    nome: 'Departamento de Trânsito do Estado do Pará',
    tipo: 'Autarquia de Trânsito',
    cor: 'yellow',
    badgeClass: 'bg-yellow-50 dark:bg-yellow-950/60 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
  }
];

export const ROLES_RBAC = [
  {
    id: 'analista_rh',
    nome: 'Analista de Gestão de Pessoas',
    sigla: 'Analista RH',
    nivel: 'Operacional',
    descricao: 'Autua processos, executa IDP, valida dados cadastrais e redige minutas de parecer.',
    permissoes: [
      'processos:autuar',
      'processos:validar_idp',
      'processos:lote_upload',
      'rag:consultar',
      'parecer:redigir_minuta',
      'pdf:exportar_preliminar'
    ]
  },
  {
    id: 'assessor_juridico',
    nome: 'Assessor Jurídico Especialista',
    sigla: 'Assessor Jurídico',
    nivel: 'Técnico-Normativo',
    descricao: 'Revisa a fundamentação da Lei nº 5.810/94, ajusta o veredito e instrui recursos.',
    permissoes: [
      'processos:autuar',
      'processos:validar_idp',
      'rag:consultar',
      'parecer:redigir_minuta',
      'parecer:alterar_veredito',
      'regras:editar',
      'pdf:exportar_oficial'
    ]
  },
  {
    id: 'auditor_interno',
    nome: 'Auditor de Controle e Conformidade',
    sigla: 'Auditor Interno',
    nivel: 'Auditoria & Compliance',
    descricao: 'Acesso irrestrito a logs de auditoria, trilha de raciocínio CoT e métricas de integridade.',
    permissoes: [
      'processos:visualizar',
      'auditoria:visualizar_logs',
      'auditoria:inspecionar_cot',
      'regras:visualizar',
      'dashboard:cockpit_avancado',
      'pdf:exportar_oficial'
    ]
  },
  {
    id: 'secretario_adjunto',
    nome: 'Secretário Adjunto / Ordenador',
    sigla: 'Secretário Adjunto',
    nivel: 'Decisório / Governança',
    descricao: 'Homologa e defere decisões finais, assina com certificado digital e autoriza publicação no DOE.',
    permissoes: [
      'processos:autuar',
      'processos:lote_upload',
      'parecer:homologar',
      'parecer:assinar_digitalmente',
      'doe:publicar_portaria',
      'pdf:exportar_oficial',
      'regras:editar',
      'auditoria:visualizar_logs'
    ]
  }
];
