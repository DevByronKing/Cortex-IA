<script setup>
import { ref, computed } from 'vue';
import { useRBAC } from '@/composables/useRBAC';
import { 
  X, UploadCloud, FileText, CheckCircle2, AlertCircle, 
  Loader2, Trash2, Layers, Play, Check, Sparkles, Building 
} from 'lucide-vue-next';

const props = defineProps({
  secretarias: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['close', 'startBatch']);
const { currentSecretaria } = useRBAC();

const selectedSecretariaId = ref(currentSecretaria.value.id);
const selectedProcessoTipo = ref('auto');
const filesList = ref([]);
const isDragging = ref(false);
const isProcessing = ref(false);
const batchProgress = ref(0);

const processoTipos = [
  { id: 'auto', label: '🤖 Auto-detecção Multimodal por IA' },
  { id: 'licenca_premio', label: '📜 Licença-Prêmio (Quinquênio)' },
  { id: 'solicitacao_ferias', label: '🌴 Concessão de Férias & 1/3' },
  { id: 'licenca_maternidade', label: '👶 Licença Maternidade (180 dias)' },
  { id: 'progressao_funcional', label: '🛡️ Estágio Probatório / Estabilidade' },
  { id: 'adicional_titulacao', label: '🎓 Adicional de Titulação / Escolaridade' }
];

const handleFileSelect = (e) => {
  const selected = Array.from(e.target.files || []);
  addFiles(selected);
};

const handleDrop = (e) => {
  isDragging.value = false;
  const dropped = Array.from(e.dataTransfer.files || []);
  addFiles(dropped);
};

const addFiles = (newFiles) => {
  const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'text/plain'];
  for (const file of newFiles) {
    if (allowed.includes(file.type) || file.name.endsWith('.pdf')) {
      filesList.value.push({
        id: Math.random().toString(36).substring(2, 9),
        file,
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        type: file.type || 'application/pdf',
        status: 'pronto' // 'pronto' | 'lendo' | 'sucesso' | 'erro'
      });
    }
  }
};

const removeFile = (index) => {
  filesList.value.splice(index, 1);
};

const clearAll = () => {
  filesList.value = [];
};

const handleStartBatch = async () => {
  if (filesList.value.length === 0 || isProcessing.value) return;
  
  isProcessing.value = true;
  batchProgress.value = 0;

  const payloadList = [];

  for (let i = 0; i < filesList.value.length; i++) {
    const item = filesList.value[i];
    item.status = 'lendo';

    try {
      let fileData = null;
      let contentText = '';

      if (item.file.type.startsWith('image/')) {
        fileData = await readFileAsBase64(item.file);
        contentText = `Requerimento funcional digitalizado anexado: ${item.name}`;
      } else if (item.file.type === 'application/pdf' || item.name.endsWith('.pdf')) {
        fileData = await readFileAsBase64(item.file);
        contentText = `Peça processual em PDF autuada em lote: ${item.name}`;
      } else {
        contentText = await readFileAsText(item.file);
      }

      payloadList.push({
        fileName: item.name,
        fileData,
        mimeType: item.type,
        content: contentText,
        processoId: selectedProcessoTipo.value === 'auto' ? 'licenca_premio' : selectedProcessoTipo.value,
        secretariaId: selectedSecretariaId.value
      });

      item.status = 'sucesso';
    } catch (err) {
      console.error('Erro ao ler arquivo do lote:', err);
      item.status = 'erro';
    }

    batchProgress.value = Math.round(((i + 1) / filesList.value.length) * 100);
  }

  emit('startBatch', {
    items: payloadList,
    secretariaId: selectedSecretariaId.value
  });
};

const readFileAsBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};
</script>

<template>
  <div class="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in p-4">
    <div class="bg-white dark:bg-slate-900 p-6 lg:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl relative text-slate-900 dark:text-white shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
      
      <!-- Botão Fechar -->
      <button 
        @click="emit('close')" 
        :disabled="isProcessing"
        class="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
      >
        <X class="w-5 h-5" />
      </button>

      <!-- Cabeçalho -->
      <div class="flex items-center gap-3 mb-5 shrink-0">
        <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-xs">
          <Layers class="w-5 h-5" />
        </div>
        <div>
          <h2 class="text-lg font-black text-slate-900 dark:text-white tracking-tight">Processamento em Lote (Batch IDP)</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400">Autuação massiva de requerimentos com triagem e instrução paralela via IA</p>
        </div>
      </div>

      <!-- Configuração de Secretaria & Tipo de Processo -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 shrink-0">
        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
            <Building class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Secretaria / Órgão de Origem:
          </label>
          <select 
            v-model="selectedSecretariaId"
            :disabled="isProcessing"
            class="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none cursor-pointer"
          >
            <option v-for="sec in secretarias" :key="sec.id" :value="sec.id">
              {{ sec.sigla }} - {{ sec.nome }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Matéria Estatutária do Lote:
          </label>
          <select 
            v-model="selectedProcessoTipo"
            :disabled="isProcessing"
            class="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none cursor-pointer"
          >
            <option v-for="proc in processoTipos" :key="proc.id" :value="proc.id">
              {{ proc.label }}
            </option>
          </select>
        </div>
      </div>

      <!-- Área de Drag & Drop -->
      <div 
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
        class="border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer relative shrink-0 mb-4"
        :class="isDragging 
          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20' 
          : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/50 bg-slate-50/50 dark:bg-slate-850/40'"
      >
        <input 
          type="file" 
          multiple
          accept=".pdf,image/png,image/jpeg,image/webp,text/plain" 
          class="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          @change="handleFileSelect"
          :disabled="isProcessing"
        />
        <div class="flex flex-col items-center">
          <UploadCloud class="w-8 h-8 text-indigo-600 dark:text-indigo-400 mb-1.5 animate-bounce" />
          <p class="text-xs font-bold text-slate-800 dark:text-slate-200">Arraste múltiplos arquivos PDF ou imagens aqui</p>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Suporta PDF, PNG, JPG, JPEG e TXT (Sem limite de quantidade)</p>
        </div>
      </div>

      <!-- Lista de Arquivos do Lote -->
      <div class="flex-grow overflow-y-auto pr-1 custom-scrollbar space-y-2 mb-4">
        <div class="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
          <span>Arquivos Selecionados ({{ filesList.length }})</span>
          <button 
            v-if="filesList.length > 0 && !isProcessing" 
            @click="clearAll" 
            class="text-rose-600 hover:underline cursor-pointer text-[11px]"
          >
            Limpar Todos
          </button>
        </div>

        <div 
          v-for="(item, idx) in filesList" 
          :key="item.id"
          class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
        >
          <div class="flex items-center gap-2.5 truncate">
            <FileText class="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <div class="truncate">
              <p class="font-bold text-slate-800 dark:text-slate-200 truncate">{{ item.name }}</p>
              <span class="text-[10px] text-slate-400">{{ item.size }}</span>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <span 
              v-if="item.status === 'lendo'" 
              class="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-bold text-[10px] flex items-center gap-1"
            >
              <Loader2 class="w-3 h-3 animate-spin" /> Carregando
            </span>
            <span 
              v-else-if="item.status === 'sucesso'" 
              class="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] flex items-center gap-1"
            >
              <Check class="w-3 h-3" /> Pronto
            </span>
            <span 
              v-else-if="item.status === 'erro'" 
              class="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-bold text-[10px]"
            >
              Erro
            </span>

            <button 
              v-if="!isProcessing" 
              @click="removeFile(idx)" 
              class="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div v-if="filesList.length === 0" class="text-center py-6 text-slate-400 text-xs">
          Nenhum arquivo adicionado ao lote até o momento.
        </div>
      </div>

      <!-- Barra de Progresso durante processamento -->
      <div v-if="isProcessing" class="mb-4 shrink-0 space-y-1.5">
        <div class="flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
          <span>Autuando e processando lote de processos...</span>
          <span>{{ batchProgress }}%</span>
        </div>
        <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
          <div 
            class="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${batchProgress}%` }"
          ></div>
        </div>
      </div>

      <!-- Rodapé de Ações -->
      <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
        <button 
          @click="emit('close')" 
          :disabled="isProcessing"
          class="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
        >
          Cancelar
        </button>

        <button 
          @click="handleStartBatch" 
          :disabled="filesList.length === 0 || isProcessing"
          class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
        >
          <Play class="w-3.5 h-3.5 fill-current" />
          <span>Autuar e Processar {{ filesList.length }} Requerimentos</span>
        </button>
      </div>

    </div>
  </div>
</template>
