<script setup>
import { ref, computed } from 'vue';
import { X, Zap, UploadCloud, FileText, CheckCircle, Loader2, FileCheck2, Sparkles } from 'lucide-vue-next';
import { PROCESSOS_CCM } from '@/constants/processes';

const emit = defineEmits(['close', 'start']);
const isUploading = ref(false);
const selectedProcessId = ref('licenca_premio');
const selectedFile = ref(null);
const fileBase64 = ref(null);
const fileMimeType = ref(null);
const isDragOver = ref(false);

const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) processFile(file);
};

const handleDrop = (event) => {
    event.preventDefault();
    isDragOver.value = false;
    if (event.dataTransfer.files.length) {
        processFile(event.dataTransfer.files[0]);
    }
};

const processFile = (file) => {
    selectedFile.value = file;
    fileMimeType.value = file.type || 'application/pdf';

    const reader = new FileReader();
    reader.onload = (e) => {
        fileBase64.value = e.target.result;
    };
    reader.readAsDataURL(file);
};

const loadMockOfficialPDF = async () => {
    try {
        isUploading.value = true;
        const response = await fetch('/mock_process.pdf');
        const blob = await response.blob();
        const file = new File([blob], 'Processo_Licenca_Premio_2026_089_PA.pdf', { type: 'application/pdf' });
        selectedProcessId.value = 'licenca_premio';
        processFile(file);
    } catch (e) {
        console.warn('Erro ao carregar PDF modelo:', e);
    } finally {
        isUploading.value = false;
    }
};

const handleStart = () => {
    isUploading.value = true;
    const proc = PROCESSOS_CCM.find(p => p.id === selectedProcessId.value) || PROCESSOS_CCM[0];

    let contentText = proc.template;
    if (selectedFile.value && selectedFile.value.type === 'text/plain') {
        const textReader = new FileReader();
        textReader.onload = (e) => {
            sendPayload(proc, e.target.result);
        };
        textReader.readAsText(selectedFile.value);
    } else {
        sendPayload(proc, contentText);
    }
};

const sendPayload = (proc, textContent) => {
    const payload = {
        processoId: proc.id,
        processoNome: proc.nome,
        fileName: selectedFile.value?.name || `${proc.nome}_Requerimento.pdf`,
        content: textContent,
        fileUrl: fileBase64.value || null,
        fileData: fileBase64.value || null,
        mimeType: fileMimeType.value || 'application/pdf'
    };

    emit('start', payload);

    setTimeout(() => {
        isUploading.value = false;
        selectedFile.value = null;
        fileBase64.value = null;
    }, 400);
};

const currentProcessDescription = computed(() => {
    return PROCESSOS_CCM.find(p => p.id === selectedProcessId.value)?.descricao || '';
});
</script>

<template>
  <div class="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
    <div class="bg-white dark:bg-slate-900 p-6 lg:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-lg relative text-slate-900 dark:text-white shadow-2xl">
      <button 
        @click="emit('close')" 
        class="absolute top-5 right-5 p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <X class="w-5 h-5" />
      </button>
      
      <div class="flex items-center space-x-3 mb-1">
        <div class="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-600/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xs">
          <Zap class="w-5 h-5" />
        </div>
        <div>
          <h2 class="text-xl font-extrabold text-slate-900 dark:text-white">Autuar Novo Processo</h2>
          <p class="text-slate-500 dark:text-slate-400 text-xs">Extração Inteligente de Documentos (IDP Multimodal)</p>
        </div>
      </div>
      
      <div class="my-5 space-y-4">
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Tipo de Requerimento</label>
          <div class="relative">
            <select 
              v-model="selectedProcessId" 
              class="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all cursor-pointer text-xs font-semibold"
            >
              <option v-for="p in PROCESSOS_CCM" :key="p.id" :value="p.id">{{ p.nome }}</option>
            </select>
          </div>
          <p class="text-xs text-indigo-600 dark:text-indigo-400 mt-1.5 min-h-4">
            {{ currentProcessDescription }}
          </p>
        </div>

        <!-- Área de Upload Drag & Drop -->
        <div 
          class="border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-200 cursor-pointer group relative overflow-hidden"
          :class="[
              isDragOver ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/60',
              selectedFile ? 'border-emerald-500/60 bg-emerald-50/40 dark:bg-emerald-500/5' : ''
          ]"
          @dragover.prevent="isDragOver = true"
          @dragleave.prevent="isDragOver = false"
          @drop="handleDrop"
          @click="$refs.fileInput.click()"
        >
          <input type="file" ref="fileInput" class="hidden" accept=".pdf,.png,.jpg,.jpeg,.txt" @change="handleFileSelect" />
          
          <div v-if="!selectedFile" class="pointer-events-none space-y-2">
            <UploadCloud class="w-10 h-10 mx-auto text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
            <p class="text-xs font-bold text-slate-700 dark:text-slate-300">Arraste seu PDF ou Imagem aqui</p>
            <p class="text-[11px] text-slate-400 dark:text-slate-500">Suporta PDFs digitalizados, Atestados, PNG e JPG</p>
          </div>

          <div v-else class="flex flex-col items-center animate-slide-up">
            <div class="bg-emerald-100 dark:bg-emerald-500/20 p-2.5 rounded-full mb-1.5">
              <FileCheck2 class="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p class="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[280px]">{{ selectedFile.name }}</p>
            <p class="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1 font-semibold">
              <CheckCircle class="w-3.5 h-3.5" /> Arquivo pronto para análise multimodal
            </p>
          </div>
        </div>

        <!-- Botão Rápido para Teste com PDF Real -->
        <button 
          @click="loadMockOfficialPDF"
          type="button"
          class="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center gap-2 transition-all shadow-2xs"
        >
          <Sparkles class="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Carregar Requerimento Modelo Oficial (PDF Quinquênio)
        </button>
      </div>
      
      <button 
        @click="handleStart" 
        :disabled="isUploading" 
        class="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-xs gap-2"
      >
        <Loader2 v-if="isUploading" class="w-4 h-4 animate-spin" />
        {{ isUploading ? 'Processando Documento com IA...' : 'Autuar e Iniciar Pipeline IA' }}
      </button>
    </div>
  </div>
</template>