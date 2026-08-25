-- ==============================================================================
-- CORTEX AI - Schema de Banco de Dados Governamental (Supabase / PostgreSQL)
-- Plataforma de Inteligência Estatutária e IDP de Recursos Humanos
-- Legislação Base: Lei Estadual nº 5.810/94 (Estatuto dos Servidores Civis do Pará)
-- ==============================================================================

-- Habilita extensão de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. TABELA DE PROCESSOS ADMINISTRATIVOS (processes)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.processes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    processo TEXT NOT NULL, -- Ex: 'licenca_premio', 'solicitacao_ferias'
    content TEXT,
    file_url TEXT,
    file_data TEXT,
    mime_type TEXT DEFAULT 'application/pdf',
    status TEXT NOT NULL DEFAULT 'Uploaded', 
    idp_result JSONB,
    nlp_result JSONB,
    enriched_data JSONB,
    rar_result JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para buscas rápidas por status e tipo de processo
CREATE INDEX IF NOT EXISTS idx_processes_status ON public.processes(status);
CREATE INDEX IF NOT EXISTS idx_processes_processo ON public.processes(processo);
CREATE INDEX IF NOT EXISTS idx_processes_created_at ON public.processes(created_at DESC);

-- ==============================================================================
-- 2. TABELA DE REGRAS ESTATUTÁRIAS DINÂMICAS (rules)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.rules (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    processo TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Ativa', -- 'Ativa' ou 'Inativa'
    condicoes JSONB NOT NULL,
    acao_se_verdadeiro JSONB NOT NULL,
    descricao TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 3. TABELA DE SERVIDORES PÚBLICOS (servidores) - BASE DE RH
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.servidores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    matricula TEXT UNIQUE NOT NULL,
    cargo TEXT NOT NULL,
    lotacao TEXT NOT NULL DEFAULT 'SEAD/PA',
    data_admissao DATE NOT NULL,
    tempo_de_servico_em_anos NUMERIC(5, 2) NOT NULL,
    regime TEXT DEFAULT 'Estatutário',
    situacao TEXT DEFAULT 'Ativo',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_servidores_nome ON public.servidores(nome);
CREATE INDEX IF NOT EXISTS idx_servidores_matricula ON public.servidores(matricula);

-- ==============================================================================
-- 4. TRILHA DE AUDITORIA IMUTÁVEL (audit_logs) - COMPLIANCE GOVTECH
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    process_id UUID REFERENCES public.processes(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    actor_uid TEXT,
    actor_email TEXT DEFAULT 'analista.rh@cortex.gov',
    summary TEXT,
    details JSONB,
    client_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_process_id ON public.audit_logs(process_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON public.audit_logs(created_at DESC);

-- ==============================================================================
-- 5. BASE JURÍDICA ESTATUTÁRIA (legal_articles)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.legal_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lei TEXT NOT NULL DEFAULT 'Lei Estadual nº 5.810/1994',
    artigo TEXT NOT NULL,
    titulo TEXT,
    capitulo TEXT,
    texto_integral TEXT NOT NULL,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 6. POPULAÇÃO INICIAL DE DADOS (SEEDS)
-- ==============================================================================

-- Inserção de Regras Padrão
INSERT INTO public.rules (id, nome, processo, status, condicoes, acao_se_verdadeiro, descricao)
VALUES 
(
    'REGRA_PREMIO_01', 
    'Interstício Licença Prêmio (Quinquênio)', 
    'licenca_premio', 
    'Ativa', 
    '[{"fato": "tempo_de_servico_em_anos", "operador": "<", "valor": 5}]'::jsonb, 
    '{"status": "REJEITADO", "mensagem": "Servidor não completou o interstício de 5 anos ininterruptos (Art. 81 e 98 da Lei 5.810/94)."}'::jsonb, 
    'Exige no mínimo 5 anos de efetivo exercício para concessão de 3 meses de licença-prêmio.'
),
(
    'REGRA_FERIAS_01', 
    'Limite Constitucional de Férias', 
    'solicitacao_ferias', 
    'Ativa', 
    '[{"fato": "dias_solicitados", "operador": ">", "valor": 30}]'::jsonb, 
    '{"status": "FALHA", "mensagem": "O período de férias solicitado não pode exceder 30 dias por exercício aquisitivo."}'::jsonb, 
    'Garante a observância do teto de 30 dias anuais.'
),
(
    'REGRA_MAT_01', 
    'Prazo Máximo Licença Maternidade', 
    'licenca_maternidade', 
    'Ativa', 
    '[{"fato": "dias_solicitados", "operador": ">", "valor": 180}]'::jsonb, 
    '{"status": "FALHA", "mensagem": "Prazo legal de licença maternidade no Estado do Pará é de até 180 dias consecutivos."}'::jsonb, 
    'Verifica a conformidade com o prazo estatutário estadual.'
),
(
    'REGRA_ESTAB_01', 
    'Estágio Probatório e Estabilidade', 
    'progressao_funcional', 
    'Ativa', 
    '[{"fato": "tempo_de_servico_em_anos", "operador": "<", "valor": 3}]'::jsonb, 
    '{"status": "REJEITADO", "mensagem": "Servidor em estágio probatório (menos de 3 anos de exercício)."}'::jsonb, 
    'A estabilidade no serviço público é adquirida após 3 anos de efetivo exercício com avaliação especial de desempenho.'
)
ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    condicoes = EXCLUDED.condicoes,
    acao_se_verdadeiro = EXCLUDED.acao_se_verdadeiro,
    descricao = EXCLUDED.descricao;

-- Inserção de Servidores Modelo para Demonstração e Enriquecimento de Dados
INSERT INTO public.servidores (nome, matricula, cargo, lotacao, data_admissao, tempo_de_servico_em_anos, regime)
VALUES 
('João Carlos de Almeida Barbosa', '892341-9', 'Auditor Fiscal de Receitas Estaduais', 'SEFA/PA', '2010-03-15', 14.50, 'Estatutário'),
('Maria Oliveira da Silva', '771234-2', 'Técnica em Gestão Pública', 'SEAD/PA', '2018-02-01', 6.50, 'Estatutário'),
('Carlos Eduardo Santos', '554321-0', 'Especialista em Educação Básica', 'SEDUC/PA', '2022-08-10', 2.00, 'Estatutário')
ON CONFLICT (matricula) DO NOTHING;
