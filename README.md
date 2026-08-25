# CORTEX AI - Plataforma de Inteligência Estatutária & GovTech

**Cortex AI** é uma plataforma corporativa *GovTech* de última geração desenvolvida para automatizar e acelerar a instrução, análise e emissão de pareceres em processos administrativos de Recursos Humanos no setor público, com foco estrito no cumprimento do **Regime Jurídico Único dos Servidores Públicos Civis do Estado do Pará (Lei Estadual nº 5.810/1994)**.

![Vue.js](https://img.shields.io/badge/vuejs-%2335495e.svg?style=for-the-badge&logo=vuedotjs&logoColor=%234FC08D)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Google%20Gemini%202.0%20Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)

---

## 🏛️ Funcionalidades Principais

* **Orquestração de Agentes IA com Chain of Thought (CoT):**
  1. **IDP Multimodal (Gemini 2.0 Flash):** Leitura óptica e extração estruturada de certidões, atestados e requerimentos em PDF e imagem.
  2. **Enriquecimento Cadastral Automático:** Cruzamento instantâneo com a base de dados funcional do Estado (Supabase).
  3. **Raciocínio Jurídico & RAG Estatutário:** Aplicação auditável das regras da Lei Estadual nº 5.810/94 com recuperação contextual dos artigos normativos.
* **Multi-Secretarias & RBAC (Controle de Acesso):**
  - Segmentação por órgãos estaduais: **SEAD, SEDUC, SESPA, SEFA, PC-PA, ITERPA e DETRAN-PA**.
  - Perfis de acesso funcionais: *Analista de RH, Assessor Jurídico, Auditor Interno e Secretário Adjunto / Ordenador*.
* **Processamento em Lote (Batch IDP):**
  - Autuação massiva com triagem paralela e barra de progresso visual em tempo real.
* **Publicação no Diário Oficial (DOE-PA) & Certificação ICP-Brasil:**
  - Emissão da minuta padrão IOEPA para publicação de Portarias de concessão.
  - Validação pública com **QR Code dinâmico** e hash criptográfico SHA-256.
* **Exportação em PDF Oficial Padronizado:**
  - Parecer Técnico A4 oficial no padrão de redação do Governo do Pará.
* **Assistente Jurídico Copilot:**
  - Consulta interativa ao acervo da Lei nº 5.810/94 e Simulador de Direitos Estatutários (Quinquênios e Estágio Probatório).
* **Modo Claro e Modo Escuro:**
  - Interface fluida com alto contraste e design moderno.

---

## 🛠️ Stack Tecnológica

### Frontend
* **Framework:** Vue 3 (Composition API)
* **Build Tool:** Vite 7
* **Estilização:** Tailwind CSS (Dark/Light mode via class)
* **Estado:** Pinia & Composables Reativos
* **Ícones:** Lucide Vue Next
* **Visualizador PDF & Autenticação:** Vue PDF Embed, jsPDF, QRCode

### Backend & Inteligência Artificial
* **Banco de Dados Relacional:** Supabase (PostgreSQL, Realtime, Trilha de Auditoria)
* **Modelo Multimodal:** Google Gemini 2.0 Flash via API Key

---

## ⚙️ Pré-requisitos & Instalação

```bash
# 1. Clonar o repositório
git clone https://github.com/DevByronKing/Cortex-IA.git
cd Cortex-IA

# 2. Instalar as dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env

# 4. Executar em modo de desenvolvimento
npm run dev

# 5. Compilar para produção
npm run build
```

