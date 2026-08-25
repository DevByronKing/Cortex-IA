<script setup>
import { ref, computed, watch } from 'vue';
import { safeParse, getStatusDisplay } from '@/utils/helpers';
import { useDocumentAuditLogs } from '@/composables/useAudit';
import { useRBAC } from '@/composables/useRBAC';
import { generateOfficialParecerPDF } from '@/services/pdfGenerator';
import { useToastStore } from '@/stores/toast';
import { 
  Trash2, Brain, FileSearch, UserCheck, ListChecks, 
  GraduationCap, History, Clock, ShieldCheck, User, Bot, Download, 
  FileText, CheckCircle2, AlertTriangle, Eye, ArrowLeft, Building2, Scale,
  Newspaper, QrCode, Send
} from 'lucide-vue-next';
import VuePdfEmbed from 'vue-pdf-embed';
import DOEExportModal from '@/components/documents/DOEExportModal.vue';

const props = defineProps({
  doc: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['validate', 'delete', 'back']);
const toastStore = useToastStore();
const { hasPermission, currentRole } = useRBAC();

// --- AUDITORIA ---
const docIdRef = computed(() => props.doc?.id);
const { logs: auditLogs, loading: loadingLogs } = useDocumentAuditLogs(docIdRef);

const activeTab = ref('decision'); // 'decision' | 'fields' | 'cot' | 'audit'
const docViewMode = ref('visual'); // 'visual' | 'text'
const isGeneratingPDF = ref(false);
const isDOEModalOpen = ref(false);

const handleDownloadParecer = async () => {
  try {
    isGeneratingPDF.value = true;
    await generateOfficialParecerPDF(props.doc);
    toastStore.addToast('Parecer Técnico Oficial em PDF gerado com sucesso!', 'success');
  } catch (err) {
    console.error('Erro ao gerar PDF:', err);
    toastStore.addToast('Erro ao gerar documento PDF.', 'error');
  } finally {
    isGeneratingPDF.value = false;
  }
};


// --- PARSING DE DADOS ---
const idpData = computed(() => safeParse(props.doc?.idpResult || props.doc?.idp_result));
const nlpData = computed(() => safeParse(props.doc?.nlpResult || props.doc?.nlp_result));
const rarData = computed(() => safeParse(props.doc?.rarResult || props.doc?.rar_result));
const enrichedData = computed(() => safeParse(props.doc?.enrichedData || props.doc?.enriched_data));

// --- LÓGICA DE VALIDAÇÃO HUMANA (HIL) ---
const editableData = ref(null);

watch(() => props.doc, (newDoc) => {
  if (newDoc?.status === 'Validacao Pendente' && idpData.value) {
    editableData.value = JSON.parse(JSON.stringify(idpData.value));
  } else {
    editableData.value = null;
  }
}, { immediate: true, deep: true });

const handleHILSubmit = () => {
  if (editableData.value) {
    emit('validate', { docId: props.doc.id, data: editableData.value });
  }
};

// --- HELPERS VISUAIS ---
const statusDisplay = computed(() => getStatusDisplay(props.doc?.status));

const getConfidenceColor = (c) => {
  if (!c) return 'text-slate-400';
  return c >= 0.95 ? 'text-emerald-500 font-bold' : c >= 0.85 ? 'text-amber-500 font-bold' : 'text-rose-500 font-bold';
};

const formatAuditDate = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleString('pt-BR', { 
    day: '2-digit', month: '2-digit', year: 'numeric', 
    hour: '2-digit', minute: '2-digit', second: '2-digit' 
  });
};

const getActionBadge = (action) => {
  const map = {
    'UPLOAD': { label: 'Autuação', bg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30' },
    'IDP_STARTED': { label: 'IDP Iniciado', bg: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/30' },
    'IDP_COMPLETED': { label: 'IDP Concluído', bg: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/30' },
    'ENRICHMENT_COMPLETED': { label: 'Cruzamento RH', bg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30' },
    'HUMAN_VALIDATION': { label: 'Validação Humana', bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30' },
    'REASONING_STARTED': { label: 'Raciocínio IA', bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30' },
    'REASONING_COMPLETED': { label: 'Veredito Emitido', bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30' },
    'DELETED': { label: 'Exclusão', bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30' }
  };
  return map[action] || { label: action, bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700' };
};
</script>

<template>
  <div v-if="!doc" class="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 p-8 animate-fade-in">
    <div class="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-slate-800 flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400 shadow-xs">
      <FileSearch class="w-8 h-8" />
    </div>
    <h2 class="text-xl font-bold text-slate-700 dark:text-slate-300">Nenhum Processo Selecionado</h2>
    <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm text-center">
      Selecione um processo na fila lateral para visualizar a peça processual, conferir a fundamentação jurídica e emitir pareceres.
    </p>
  </div>

  <div v-else class="flex flex-col h-full overflow-hidden animate-fade-in bg-slate-50/50 dark:bg-slate-950/40">
    
    <!-- Top Action Bar -->
    <div class="px-6 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
      <div class="flex items-center gap-3">
        <button 
          @click="emit('back')" 
          class="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all md:hidden"
          title="Voltar para a Fila"
        >
          <ArrowLeft class="w-4 h-4" />
        </button>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-base lg:text-lg font-bold text-slate-900 dark:text-white truncate max-w-md">
              {{ doc.name }}
            </h1>
            <span class="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 uppercase">
              {{ doc.processo || 'Geral' }}
            </span>
          </div>
          <p class="text-[11px] text-slate-500 dark:text-slate-400">
            Autuação: {{ new Date(doc.timestamp || Date.now()).toLocaleString('pt-BR') }}
          </p>
        </div>
      </div>

      <!-- Status Pill & Actions -->
      <div class="flex items-center gap-2">
        <div 
          class="flex items-center text-xs font-extrabold px-3 py-1.5 rounded-xl border"
          :class="[
            doc.status === 'Aprovado' || doc.status === 'Finalizado'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
              : doc.status === 'Rejeitado'
              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30'
              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30'
          ]"
        >
          <component :is="statusDisplay.icon" class="w-3.5 h-3.5 mr-1.5" :class="statusDisplay.animate" />
          <span>{{ statusDisplay.text }}</span>
        </div>

        <!-- Botão Diário Oficial (DOE-PA) -->
        <button 
          v-if="rarData?.veredicto?.status === 'Aprovado' || doc.status === 'Aprovado' || doc.status === 'Finalizado'"
          @click="isDOEModalOpen = true"
          class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold rounded-xl transition-all shadow-2xs text-xs flex items-center gap-1.5 cursor-pointer"
          title="Gerar Portaria para Publicação no Diário Oficial do Estado do Pará (DOE-PA)"
        >
          <Newspaper class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span class="hidden sm:inline">Diário Oficial (DOE)</span>
        </button>

        <!-- Botão Exportar Parecer Técnico Padronizado em PDF -->
        <button 
          @click="handleDownloadParecer" 
          :disabled="isGeneratingPDF"
          class="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-xs text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          title="Exportar Parecer Técnico Oficial em formato PDF padronizado com QR Code"
        >
          <Download class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">{{ isGeneratingPDF ? 'Gerando PDF...' : 'Exportar Parecer (PDF)' }}</span>
        </button>

        <button 
          @click="emit('delete', doc.id)" 
          class="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl border border-transparent hover:border-rose-200 dark:hover:border-rose-800/50 transition-all cursor-pointer" 
          title="Excluir Processo"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Main 2-Pane Workspace -->
    <div class="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-5 p-4 lg:p-6 overflow-hidden">
      
      <!-- PAINEL ESQUERDO: DOCUMENTO DIGITAL / PDF (5 colunas) -->
      <div class="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-xs">
        <div class="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/60">
          <div class="flex items-center gap-2">
            <FileText class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span class="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Peça Processual Digital</span>
          </div>
          
          <div class="flex items-center bg-slate-200 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-bold">
            <button 
              @click="docViewMode = 'visual'"
              class="px-2 py-1 rounded-md transition-all"
              :class="docViewMode === 'visual' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'"
            >
              Visual
            </button>
            <button 
              @click="docViewMode = 'text'"
              class="px-2 py-1 rounded-md transition-all"
              :class="docViewMode === 'text' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'"
            >
              Texto
            </button>
          </div>
        </div>

        <div class="flex-grow overflow-y-auto p-4 custom-scrollbar flex flex-col items-center justify-start bg-slate-100/50 dark:bg-slate-950/50">
          
          <!-- Modo Visual (Imagem ou PDF Embed) -->
          <template v-if="docViewMode === 'visual'">
            <img 
              v-if="doc.fileUrl && doc.fileUrl.startsWith('data:image/')" 
              :src="doc.fileUrl" 
              class="shadow-md max-w-full rounded-xl object-contain border border-slate-200 dark:border-slate-800" 
              alt="Documento Digitalizado" 
            />
            <VuePdfEmbed 
              v-else-if="doc.fileUrl" 
              :source="doc.fileUrl" 
              class="shadow-md w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800" 
            />
            <div v-else class="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
              <FileText class="w-12 h-12 mb-2 opacity-30" />
              <p class="text-xs font-semibold">Sem anexo visual.</p>
              <p class="text-[11px] text-slate-400">O conteúdo do processo está disponível na visualização de texto.</p>
            </div>
          </template>

          <!-- Modo Texto Extraído -->
          <div v-else class="w-full bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 text-xs font-sans text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {{ doc.content }}
          </div>
        </div>
      </div>

      <!-- PAINEL DIREITO: DECISÃO, DADOS & AUDITORIA (7 colunas) -->
      <div class="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-xs">
        
        <!-- Abas de Navegação -->
        <div class="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto custom-scrollbar bg-slate-50/60 dark:bg-slate-900/60">
          <button 
            @click="activeTab = 'decision'" 
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap"
            :class="activeTab === 'decision' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'"
          >
            <Scale class="w-3.5 h-3.5" /> Parecer & Decisão
          </button>
          <button 
            @click="activeTab = 'fields'" 
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap"
            :class="activeTab === 'fields' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'"
          >
            <ListChecks class="w-3.5 h-3.5" /> Metadados IDP & RH
          </button>
          <button 
            @click="activeTab = 'cot'" 
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap"
            :class="activeTab === 'cot' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'"
          >
            <Brain class="w-3.5 h-3.5" /> Raciocínio (CoT)
          </button>
          <button 
            @click="activeTab = 'audit'" 
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap"
            :class="activeTab === 'audit' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'"
          >
            <History class="w-3.5 h-3.5" /> Auditoria ({{ auditLogs.length }})
          </button>
        </div>

        <!-- Conteúdo Scrollável -->
        <div class="flex-grow overflow-y-auto p-5 custom-scrollbar space-y-4">
          
          <!-- TAB 1: PARECER E DECISÃO ESTATUTÁRIA -->
          <div v-if="activeTab === 'decision'" class="space-y-4">
            
            <!-- Veredito Final -->
            <div 
              v-if="rarData?.veredicto" 
              class="p-5 rounded-2xl border shadow-xs space-y-3 transition-all"
              :class="rarData.veredicto.status === 'Aprovado'
                ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-500/40 text-emerald-950 dark:text-emerald-200'
                : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-500/40 text-rose-950 dark:text-rose-200'"
            >
              <div class="flex items-center justify-between">
                <h2 class="text-base font-extrabold flex items-center gap-2">
                  <UserCheck class="w-5 h-5 text-emerald-600 dark:text-emerald-400" v-if="rarData.veredicto.status === 'Aprovado'" />
                  <AlertTriangle class="w-5 h-5 text-rose-600 dark:text-rose-400" v-else />
                  Veredito Estatutário: {{ rarData.veredicto.status }}
                </h2>
                <span class="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider bg-white/80 dark:bg-slate-900/80 shadow-2xs">
                  Decisão Concluída
                </span>
              </div>

              <p class="text-xs lg:text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                {{ rarData.veredicto.parecer }}
              </p>
              
              <!-- Fundamentação Legal Citada -->
              <div class="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2">
                <div class="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <Scale class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Dispositivos da Lei Estadual nº 5.810/94 Aplicados:</span>
                </div>
                <div class="flex flex-wrap gap-1.5">
                  <span 
                    v-for="(art, aIdx) in (rarData.veredicto.artigos_citados || ['Art. 81 - Lei 5.810/94', 'Art. 98 - Quinquênio'])" 
                    :key="aIdx"
                    class="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-lg shadow-2xs font-mono"
                  >
                    {{ art }}
                  </span>
                </div>
              </div>

              <!-- Minuta de Despacho DOE -->
              <div v-if="rarData.veredicto.sugestao_despacho" class="bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sugestão de Despacho (DOE-PA):</span>
                <p class="text-xs text-slate-800 dark:text-slate-200 font-mono italic">{{ rarData.veredicto.sugestao_despacho }}</p>
              </div>

              <!-- Banner de Emissão de Parecer Oficial e Publicação no Diário Oficial -->
              <div class="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/60 dark:bg-slate-900/60 p-3.5 rounded-xl border border-black/5 dark:border-white/5">
                <div class="flex items-center gap-2">
                  <FileText class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <span class="text-xs font-bold text-slate-800 dark:text-slate-200 block">Documento Oficial Pronto</span>
                    <span class="text-[10px] text-slate-500 flex items-center gap-1">
                      <ShieldCheck class="w-3 h-3 text-emerald-500" /> Certificação Digital ICP-Brasil & QR Code
                    </span>
                  </div>
                </div>

                <div class="flex items-center gap-2 w-full sm:w-auto">
                  <button 
                    v-if="rarData.veredicto.status === 'Aprovado'"
                    @click="isDOEModalOpen = true"
                    class="w-full sm:w-auto px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  >
                    <Newspaper class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    Publicar no DOE
                  </button>

                  <button 
                    @click="handleDownloadParecer" 
                    :disabled="isGeneratingPDF"
                    class="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                  >
                    <Download class="w-3.5 h-3.5" />
                    {{ isGeneratingPDF ? 'Gerando...' : 'Baixar Parecer (PDF)' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Validação Humana Requerida (HITL) -->
            <div v-if="editableData" class="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/40 p-5 rounded-2xl shadow-xs space-y-3">
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0">
                  <ListChecks class="w-4 h-4" />
                </div>
                <div>
                  <h3 class="text-sm font-bold text-amber-900 dark:text-amber-300">Validação Humana Requerida (HITL)</h3>
                  <p class="text-xs text-amber-800 dark:text-amber-200/80">Revise os dados extraídos pelo IDP antes de disparar o Agente Decisor.</p>
                </div>
              </div>

              <!-- Campos Editáveis -->
              <div class="space-y-2">
                <div 
                  v-for="(field, index) in editableData.keyFields" 
                  :key="index" 
                  class="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                >
                  <label class="text-slate-700 dark:text-slate-300 font-semibold w-full sm:w-1/3 flex items-center gap-1">
                    {{ field.field }}
                    <span class="text-[10px] font-mono" :class="getConfidenceColor(field.confidence)" v-if="field.confidence">
                      ({{ Math.round(field.confidence * 100) }}%)
                    </span>
                  </label>
                  <input 
                    v-model="field.value" 
                    class="w-full sm:w-2/3 p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs outline-none focus:border-indigo-500" 
                  />
                </div>
              </div>

              <button 
                @click="handleHILSubmit" 
                class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-xs flex items-center justify-center text-xs gap-2"
              >
                <Brain class="w-4 h-4" /> Confirmar e Executar Decisão IA
              </button>
            </div>

            <!-- Dados Funcionais Cruzados do RH -->
            <div class="bg-slate-50 dark:bg-slate-850/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5">
              <h3 class="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Dados Cadastrais do Servidor (Base RH)
              </h3>
              
              <div v-if="enrichedData && Object.keys(enrichedData).length" class="grid grid-cols-2 gap-2 text-xs">
                <div class="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span class="text-slate-400 block text-[10px]">Nome do Servidor</span>
                  <span class="font-bold text-slate-800 dark:text-slate-200">{{ enrichedData.nome || 'Não localizado' }}</span>
                </div>
                <div class="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span class="text-slate-400 block text-[10px]">Matrícula</span>
                  <span class="font-mono font-bold text-slate-800 dark:text-slate-200">{{ enrichedData.matricula || '-' }}</span>
                </div>
                <div class="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span class="text-slate-400 block text-[10px]">Cargo Efetivo</span>
                  <span class="font-bold text-slate-800 dark:text-slate-200">{{ enrichedData.cargo || '-' }}</span>
                </div>
                <div class="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span class="text-slate-400 block text-[10px]">Tempo de Serviço</span>
                  <span class="font-bold text-slate-800 dark:text-slate-200">{{ enrichedData.tempo_de_servico_em_anos ? `${enrichedData.tempo_de_servico_em_anos} anos` : '-' }}</span>
                </div>
              </div>
              <p v-else class="text-slate-400 text-xs text-center py-2">Nenhum vínculo funcional cruzado automaticamente.</p>
            </div>
          </div>

          <!-- TAB 2: METADADOS IDP -->
          <div v-else-if="activeTab === 'fields'" class="space-y-3">
            <div v-if="idpData" class="space-y-3 text-xs">
              <div class="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span class="text-slate-400 uppercase text-[10px] font-bold">Tipo Documental Classificado</span>
                <p class="text-sm font-bold text-indigo-600 dark:text-indigo-300">{{ idpData.documentType }}</p>
                <p class="text-slate-600 dark:text-slate-400 text-xs">{{ idpData.resumo }}</p>
              </div>

              <div class="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span class="text-slate-400 uppercase text-[10px] font-bold">Campos Extraídos por Visão Computacional</span>
                <div class="space-y-1.5">
                  <div 
                    v-for="(f, i) in idpData.keyFields" 
                    :key="i" 
                    class="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800"
                  >
                    <span class="text-slate-600 dark:text-slate-400 font-medium">{{ f.field }}</span>
                    <span class="font-bold text-slate-900 dark:text-slate-100">{{ f.value }}</span>
                  </div>
                </div>
              </div>
            </div>
            <p v-else class="text-slate-400 text-xs text-center py-6">Aguardando processamento IDP...</p>
          </div>

          <!-- TAB 3: RACIOCÍNIO (CHAIN OF THOUGHT) -->
          <div v-else-if="activeTab === 'cot'" class="space-y-3">
            <div v-if="rarData?.chainOfThought" class="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
              {{ rarData.chainOfThought }}
            </div>
            <p v-else class="text-slate-400 text-xs text-center py-6">Aguardando raciocínio do Agente Decisor...</p>
          </div>

          <!-- TAB 4: TRILHA DE AUDITORIA IMUTÁVEL -->
          <div v-else class="space-y-3">
            <div class="p-3 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-500/20 rounded-xl text-xs text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
              <ShieldCheck class="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>Trilha de auditoria cronológica em conformidade com as diretrizes de governança e LGPD.</span>
            </div>

            <div v-if="loadingLogs" class="text-center py-6 text-slate-400 text-xs">
              Carregando eventos de auditoria...
            </div>

            <div v-else-if="auditLogs.length === 0" class="text-center py-8 text-slate-400 text-xs">
              Nenhum evento registrado ainda para este processo.
            </div>

            <div v-else class="space-y-2.5 relative pl-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              <div 
                v-for="log in auditLogs" 
                :key="log.id"
                class="relative bg-white dark:bg-slate-950/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 shadow-2xs hover:border-indigo-300 dark:hover:border-slate-700 transition-all"
              >
                <span class="absolute -left-[19px] top-4 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-white dark:ring-slate-950"></span>
                
                <div class="flex items-center justify-between">
                  <span 
                    class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border"
                    :class="getActionBadge(log.action).bg"
                  >
                    {{ getActionBadge(log.action).label }}
                  </span>
                  <span class="text-[10px] text-slate-400 dark:text-slate-500 font-mono flex items-center gap-1">
                    <Clock class="w-3 h-3" /> {{ formatAuditDate(log.timestamp) }}
                  </span>
                </div>

                <p class="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">{{ log.details?.summary || log.action }}</p>

                <div class="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-850">
                  <span class="flex items-center gap-1">
                    <component :is="log.actor?.uid?.includes('system') ? Bot : User" class="w-3 h-3 text-indigo-500" />
                    {{ log.actor?.email || 'Agente Cortex' }}
                  </span>
                  <span class="font-mono text-slate-400 truncate max-w-[150px]">{{ log.clientAgent?.split(' ')[0] }}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>

    <!-- Modal de Publicação no Diário Oficial (DOE-PA) -->
    <DOEExportModal 
      v-if="isDOEModalOpen" 
      :doc="doc" 
      :rarData="rarData" 
      :enrichedData="enrichedData" 
      @close="isDOEModalOpen = false" 
    />
  </div>
</template>

