<script setup>
import { ref, computed, nextTick } from 'vue';
import { geminiApiService } from '@/services/geminiService';
import { ragService } from '@/services/ragService';
import { LEI_5810_ARTIGOS } from '@/constants/legalKnowledge';
import { useToastStore } from '@/stores/toast';
import { 
  Send, Bot, User, BookOpen, Loader2, Sparkles, 
  Trash2, Search, CheckCircle2, MessageSquare, Scale, Copy, ArrowUpRight,
  Calculator, ShieldCheck, Clock, Plus
} from 'lucide-vue-next';

const toastStore = useToastStore();
const activeToolTab = ref('chat'); // 'chat' | 'articles' | 'simulator'

// --- CHAT ESTADO ---
const messages = ref([
  { 
    role: 'assistant', 
    text: `Olá! Sou o **Assistente Jurídico do Cortex AI**, treinado com a base completa da **Lei Estadual nº 5.810/1994** (Estatuto dos Servidores Públicos do Pará).\n\nPosso auxiliá-lo na análise de processos, cálculo de prazos de quinquênio e estágio probatório, fundamentação de minutas de pareceres e esclarecimento de direitos funcionais.`,
    citations: ['Art. 81 - Licença-Prêmio', 'Art. 65 - Férias', 'Art. 86 - Maternidade']
  }
]);
const userInput = ref('');
const loading = ref(false);
const chatContainer = ref(null);

// --- PERGUNTAS RÁPIDAS ---
const quickTopics = [
  { label: 'Licença-Prêmio (Quinquênio)', query: 'Quais são os requisitos cumulativos para a concessão de Licença-Prêmio (Quinquênio) segundo o Art. 81 da Lei 5.810/94?' },
  { label: 'Férias & Adicional 1/3', query: 'Como funciona a acumulação e o pagamento do adicional de férias de 1/3 para servidores estaduais?' },
  { label: 'Licença Maternidade (180 dias)', query: 'Qual o prazo legal, prorrogação e condições da Licença Maternidade no Estado do Pará?' },
  { label: 'Estágio Probatório & Licenças', query: 'Servidor em estágio probatório pode usufruir de licença para tratar de interesses particulares ou licença-prêmio?' },
  { label: 'Adicional de Titulação', query: 'Quais os percentuais e requisitos para concessão de Gratificação de Escolaridade e Titulação (Especialização, Mestrado, Doutorado)?' },
  { label: 'Acumulação de Cargos', query: 'Quais as regras constitucionais e estatutárias para acumulação lícita de cargos públicos no Estado do Pará?' }
];

// --- EXPLORADOR DE LEGISLAÇÃO ---
const searchLegalQuery = ref('');
const selectedCategory = ref('todos');

const filteredArticles = computed(() => {
  const query = searchLegalQuery.value.toLowerCase().trim();
  return LEI_5810_ARTIGOS.filter(art => {
    const matchesQuery = !query || 
      art.artigo.toLowerCase().includes(query) || 
      art.capitulo.toLowerCase().includes(query) || 
      art.texto.toLowerCase().includes(query) ||
      art.tags.some(t => t.toLowerCase().includes(query));

    const matchesCat = selectedCategory.value === 'todos' || 
      art.processosRelacionados.includes(selectedCategory.value);

    return matchesQuery && matchesCat;
  });
});

// --- SIMULADOR ESTATUTÁRIO ---
const simDataAdmissao = ref('2021-03-01');
const simFaltasInjustificadas = ref(0);
const simPenalidades = ref('nenhuma');

const simResultado = computed(() => {
  if (!simDataAdmissao.value) return null;
  const admissao = new Date(simDataAdmissao.value);
  const hoje = new Date();
  
  const diffTime = Math.abs(hoje - admissao);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffYears = (diffDays / 365.25).toFixed(1);
  
  const diasNecessariosQuinquenio = 5 * 365;
  const diasEfetivos = diffDays - (parseInt(simFaltasInjustificadas.value) || 0);
  const quinquenioApto = diasEfetivos >= diasNecessariosQuinquenio && simPenalidades.value === 'nenhuma' && simFaltasInjustificadas.value <= 30;
  
  const dataFimQuinquenio = new Date(admissao);
  dataFimQuinquenio.setDate(dataFimQuinquenio.getDate() + diasNecessariosQuinquenio + (parseInt(simFaltasInjustificadas.value) || 0));

  const estagioApto = diffDays >= (3 * 365);

  return {
    tempoServicoAnos: diffYears,
    diasEfetivos,
    quinquenioApto,
    dataFimQuinquenio: dataFimQuinquenio.toLocaleDateString('pt-BR'),
    estagioApto,
    faltas: simFaltasInjustificadas.value,
    penalidades: simPenalidades.value
  };
});

const scrollToBottom = async () => {
  await nextTick();
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  }
};

const sendMessage = async (customText = null) => {
  const query = (customText || userInput.value).trim();
  if (!query || loading.value) return;
  
  messages.value.push({ role: 'user', text: query });
  userInput.value = '';
  loading.value = true;
  activeToolTab.value = 'chat';
  await scrollToBottom();

  try {
    const ragContext = await ragService.buildRAGContext(null, query);

    const formattedHistory = messages.value.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      text: m.text
    }));

    if (formattedHistory.length > 0 && ragContext) {
      formattedHistory[formattedHistory.length - 1].text += `\n\n[CONTEXTO ESTATUTÁRIO DA LEI 5.810/94 RECUPERADO]:\n${ragContext}`;
    }

    const response = await geminiApiService.callGeminiChat(formattedHistory);
    const replyText = response?.resposta || response?.text || response?.data?.resposta || (typeof response === 'string' ? response : 'Não foi possível encontrar fundamentação para esta consulta.');

    const matchedArticles = LEI_5810_ARTIGOS.filter(a => replyText.toLowerCase().includes(a.artigo.toLowerCase())).map(a => a.artigo);

    messages.value.push({ 
      role: 'assistant', 
      text: replyText,
      citations: matchedArticles.length ? matchedArticles : null
    });
  } catch (error) {
    console.error('Erro no assistente jurídico:', error);
    messages.value.push({ 
      role: 'assistant', 
      text: 'Ocorreu uma instabilidade temporária ao consultar a base estatutária. Por favor, tente novamente.' 
    });
  } finally {
    loading.value = false;
    await scrollToBottom();
  }
};

const askAboutArticle = (art) => {
  activeToolTab.value = 'chat';
  sendMessage(`Explique detalhadamente os requisitos, prazos e aplicação prática do ${art.artigo} (${art.capitulo}) da Lei Estadual nº 5.810/94.`);
};

const copyArticleText = (art) => {
  navigator.clipboard.writeText(`${art.artigo} da Lei Estadual nº 5.810/94: "${art.texto}"`);
  toastStore.addToast(`Texto do ${art.artigo} copiado com sucesso!`, 'info');
};

const copyMessageText = (msg) => {
  navigator.clipboard.writeText(msg.text);
  toastStore.addToast('Fundamentação copiada para a área de transferência!', 'success');
};

const clearChat = () => {
  messages.value = [
    { 
      role: 'assistant', 
      text: 'Histórico reiniciado. Qual matéria estatutária você deseja consultar?' 
    }
  ];
  toastStore.addToast('Conversa limpa.', 'info');
};
</script>

<template>
  <div class="flex flex-col h-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
    
    <!-- Top Sub-Header Limpo e Integrado -->
    <div class="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
      <div class="flex items-center gap-2.5">
        <div class="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
          <Scale class="w-4 h-4" />
        </div>
        <div>
          <h1 class="text-sm font-bold text-slate-900 dark:text-white leading-none">Assistente Jurídico Estatutário</h1>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">RAG Especializado: Lei Estadual nº 5.810/1994 (Pará)</p>
        </div>
      </div>

      <!-- Abas de Navegação -->
      <div class="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
        <button 
          @click="activeToolTab = 'chat'" 
          class="px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
          :class="activeToolTab === 'chat' 
            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs' 
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
        >
          <MessageSquare class="w-3.5 h-3.5" /> Chat IA
        </button>

        <button 
          @click="activeToolTab = 'articles'" 
          class="px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
          :class="activeToolTab === 'articles' 
            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs' 
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
        >
          <BookOpen class="w-3.5 h-3.5" /> Artigos da Lei ({{ LEI_5810_ARTIGOS.length }})
        </button>

        <button 
          @click="activeToolTab = 'simulator'" 
          class="px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
          :class="activeToolTab === 'simulator' 
            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs' 
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
        >
          <Calculator class="w-3.5 h-3.5" /> Simulador
        </button>

        <button 
          v-if="activeToolTab === 'chat'"
          @click="clearChat" 
          class="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all ml-1 cursor-pointer"
          title="Limpar Conversa"
        >
          <Trash2 class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- 1. MODO CHAT IA -->
    <div v-if="activeToolTab === 'chat'" class="flex-grow flex flex-col overflow-hidden p-4 lg:p-6 bg-slate-50/40 dark:bg-slate-950/40">
      
      <!-- Mensagens do Chat -->
      <div 
        ref="chatContainer"
        class="flex-grow overflow-y-auto space-y-4 pr-2 mb-4 custom-scrollbar"
      >
        <div 
          v-for="(msg, i) in messages" 
          :key="i" 
          class="flex gap-3 max-w-4xl"
          :class="msg.role === 'user' ? 'ml-auto justify-end' : 'mr-auto justify-start'"
        >
          <!-- Avatar da IA -->
          <div v-if="msg.role === 'assistant'" class="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
            <Bot class="w-4 h-4" />
          </div>

          <!-- Balão de Mensagem -->
          <div 
            class="p-4 rounded-2xl shadow-xs leading-relaxed text-xs lg:text-sm space-y-2 max-w-3xl"
            :class="msg.role === 'user' 
              ? 'bg-indigo-600 text-white rounded-tr-none' 
              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 rounded-tl-none'"
          >
            <div class="flex items-center justify-between gap-4 border-b border-black/5 dark:border-white/10 pb-1.5">
              <span class="text-[11px] font-bold uppercase tracking-wider opacity-75 flex items-center gap-1.5">
                <component :is="msg.role === 'user' ? User : ShieldCheck" class="w-3.5 h-3.5" />
                {{ msg.role === 'user' ? 'Analista' : 'Cortex Jurídico IA' }}
              </span>

              <!-- Botão Copiar -->
              <button 
                v-if="msg.role === 'assistant'" 
                @click="copyMessageText(msg)"
                class="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center gap-1 text-[11px] cursor-pointer"
                title="Copiar fundamentação"
              >
                <Copy class="w-3 h-3" />
                <span class="hidden sm:inline">Copiar</span>
              </button>
            </div>

            <!-- Conteúdo -->
            <p class="whitespace-pre-wrap leading-relaxed">{{ msg.text }}</p>

            <!-- Citations / Artigos -->
            <div v-if="msg.citations && msg.citations.length" class="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap items-center gap-1.5">
              <span class="text-[10px] font-bold uppercase text-slate-400">Artigos Citados:</span>
              <span 
                v-for="cit in msg.citations" 
                :key="cit"
                class="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-bold rounded-md"
              >
                {{ cit }}
              </span>
            </div>
          </div>

          <!-- Avatar do Usuário -->
          <div v-if="msg.role === 'user'" class="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 mt-1">
            <User class="w-4 h-4" />
          </div>
        </div>

        <!-- Indicador de Carregamento RAG -->
        <div v-if="loading" class="flex gap-3 items-start mr-auto max-w-xl animate-pulse">
          <div class="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Loader2 class="w-4 h-4 animate-spin" />
          </div>
          <div class="bg-white dark:bg-slate-800 p-3.5 rounded-2xl rounded-tl-none border border-slate-200 dark:border-slate-700 text-xs text-indigo-600 dark:text-indigo-300 flex items-center gap-2 shadow-xs">
            <span>Consultando Lei nº 5.810/94 e elaborando fundamentação...</span>
          </div>
        </div>
      </div>

      <!-- Tópicos Rápidos -->
      <div class="mb-3">
        <div class="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 text-xs">
          <span class="text-[11px] font-bold uppercase text-slate-400 shrink-0 flex items-center gap-1 mr-1">
            <Sparkles class="w-3 h-3 text-indigo-500" /> Sugestões:
          </span>
          <button 
            v-for="(top, idx) in quickTopics" 
            :key="idx"
            @click="sendMessage(top.query)"
            :disabled="loading"
            class="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 whitespace-nowrap transition-all flex items-center gap-1 disabled:opacity-50 text-xs cursor-pointer shadow-2xs"
          >
            {{ top.label }}
          </button>
        </div>
      </div>

      <!-- Barra de Entrada -->
      <div class="relative">
        <input 
          v-model="userInput" 
          @keydown.enter="sendMessage()"
          :disabled="loading"
          type="text" 
          placeholder="Digite sua dúvida sobre a Lei 5.810/94 (ex: prazos de quinquênio, férias, licença maternidade)..." 
          class="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-3.5 pl-4 pr-12 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-xs text-xs sm:text-sm placeholder:text-slate-400"
        />
        <button 
          @click="sendMessage()" 
          :disabled="loading || !userInput.trim()"
          class="absolute right-2 top-2 p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 rounded-lg text-white transition-all shadow-xs cursor-pointer"
          title="Enviar"
        >
          <Send class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- 2. MODO ARTIGOS DA LEI -->
    <div v-else-if="activeToolTab === 'articles'" class="flex-grow flex flex-col overflow-hidden p-4 lg:p-6 space-y-4 bg-slate-50/40 dark:bg-slate-950/40">
      
      <!-- Busca e Filtros -->
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="relative flex-grow">
          <Search class="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input 
            v-model="searchLegalQuery" 
            type="text" 
            placeholder="Pesquisar por artigo (ex: 81), termo ou assunto (ex: quinquênio, férias)..." 
            class="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-500 outline-none text-xs sm:text-sm placeholder:text-slate-400"
          />
        </div>

        <div class="flex gap-1 overflow-x-auto pb-1 text-xs shrink-0">
          <button 
            @click="selectedCategory = 'todos'" 
            class="px-3 py-1.5 rounded-lg font-semibold transition-all border cursor-pointer"
            :class="selectedCategory === 'todos' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'"
          >
            Todos ({{ LEI_5810_ARTIGOS.length }})
          </button>
          <button 
            @click="selectedCategory = 'licenca_premio'" 
            class="px-3 py-1.5 rounded-lg font-semibold transition-all border whitespace-nowrap cursor-pointer"
            :class="selectedCategory === 'licenca_premio' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'"
          >
            Licença-Prêmio
          </button>
          <button 
            @click="selectedCategory = 'solicitacao_ferias'" 
            class="px-3 py-1.5 rounded-lg font-semibold transition-all border whitespace-nowrap cursor-pointer"
            :class="selectedCategory === 'solicitacao_ferias' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'"
          >
            Férias
          </button>
          <button 
            @click="selectedCategory = 'licenca_maternidade'" 
            class="px-3 py-1.5 rounded-lg font-semibold transition-all border whitespace-nowrap cursor-pointer"
            :class="selectedCategory === 'licenca_maternidade' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'"
          >
            Maternidade
          </button>
        </div>
      </div>

      <!-- Lista de Artigos -->
      <div class="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-3">
        <div 
          v-for="art in filteredArticles" 
          :key="art.artigo"
          class="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2.5">
              <span class="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-lg font-mono">
                {{ art.artigo }}
              </span>
              <span class="text-xs font-bold text-slate-800 dark:text-slate-200">{{ art.capitulo }}</span>
            </div>

            <div class="flex items-center gap-2">
              <button 
                @click="copyArticleText(art)" 
                class="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-50 dark:bg-slate-700 rounded-lg transition-all cursor-pointer" 
                title="Copiar texto"
              >
                <Copy class="w-3.5 h-3.5" />
              </button>
              <button 
                @click="askAboutArticle(art)" 
                class="px-2.5 py-1 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all flex items-center gap-1 cursor-pointer"
              >
                Analisar no Chat <ArrowUpRight class="w-3 h-3" />
              </button>
            </div>
          </div>

          <p class="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-serif bg-slate-50 dark:bg-slate-900 p-3.5 rounded-lg border border-slate-100 dark:border-slate-800">
            "{{ art.texto }}"
          </p>

          <div v-if="art.requisitos && art.requisitos.length" class="space-y-1 pt-1">
            <span class="text-[10px] font-bold uppercase text-slate-400">Requisitos:</span>
            <div class="flex flex-wrap gap-1.5">
              <span 
                v-for="(req, rIdx) in art.requisitos" 
                :key="rIdx"
                class="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs rounded-md flex items-center gap-1 font-medium"
              >
                <CheckCircle2 class="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> {{ req }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="filteredArticles.length === 0" class="text-center py-12 text-slate-400 text-xs">
          Nenhum artigo encontrado para a pesquisa.
        </div>
      </div>
    </div>

    <!-- 3. MODO SIMULADOR -->
    <div v-else class="flex-grow flex flex-col overflow-hidden p-4 lg:p-6 space-y-4 bg-slate-50/40 dark:bg-slate-950/40">
      <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
        <h2 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Calculator class="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Simulador de Prazos e Direitos (Lei 5.810/94)
        </h2>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Cálculo de tempo de serviço efetivo, estágio probatório e previsão de quinquênio.
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-y-auto pr-2 custom-scrollbar">
        <!-- Entradas -->
        <div class="lg:col-span-5 bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3.5">
          <h3 class="text-xs font-bold uppercase text-slate-400">Parâmetros</h3>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Data de Admissão / Posse:</label>
            <input 
              v-model="simDataAdmissao" 
              type="date" 
              class="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Faltas Injustificadas no Período:</label>
            <input 
              v-model.number="simFaltasInjustificadas" 
              type="number" 
              min="0"
              class="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Penalidades Disciplinares:</label>
            <select 
              v-model="simPenalidades"
              class="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="nenhuma">Nenhuma penalidade</option>
              <option value="advertencia">Advertência</option>
              <option value="suspensao">Suspensão</option>
            </select>
          </div>
        </div>

        <!-- Resultados -->
        <div class="lg:col-span-7 bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
          <h3 class="text-xs font-bold uppercase text-slate-400">Diagnóstico</h3>

          <div v-if="simResultado" class="space-y-3">
            <div class="grid grid-cols-3 gap-3">
              <div class="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800 text-center">
                <span class="text-[10px] font-bold text-slate-400 uppercase">Tempo</span>
                <p class="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">{{ simResultado.tempoServicoAnos }} anos</p>
              </div>

              <div class="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800 text-center">
                <span class="text-[10px] font-bold text-slate-400 uppercase">Estágio Probatório</span>
                <p class="text-xs font-bold mt-1.5" :class="simResultado.estagioApto ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'">
                  {{ simResultado.estagioApto ? 'Concluído' : 'Em Curso' }}
                </p>
              </div>

              <div class="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800 text-center">
                <span class="text-[10px] font-bold text-slate-400 uppercase">Quinquênio</span>
                <p class="text-xs font-bold mt-1.5" :class="simResultado.quinquenioApto ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'">
                  {{ simResultado.quinquenioApto ? 'Apto' : simResultado.dataFimQuinquenio }}
                </p>
              </div>
            </div>

            <div 
              class="p-3.5 rounded-lg border text-xs leading-relaxed"
              :class="simResultado.quinquenioApto 
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
                : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'"
            >
              <span class="font-bold block mb-1">
                {{ simResultado.quinquenioApto ? '✓ Requisitos Cumpridos (Art. 81)' : '⏳ Em Período Aquisitivo' }}
              </span>
              {{ simResultado.quinquenioApto 
                ? 'O servidor completou 5 anos de efetivo exercício sem faltas impeditivas, estando apto a usufruir de 3 meses de Licença-Prêmio.'
                : `Previsão de aquisição do direito em ${simResultado.dataFimQuinquenio}.`
              }}
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>