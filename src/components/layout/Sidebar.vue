<script setup>
import { ref, computed } from 'vue';
import { Upload, Search, FileText, Loader2, Filter, Plus, Clock, FileCheck, AlertCircle } from 'lucide-vue-next';
import { getStatusDisplay } from '@/utils/helpers';

const props = defineProps({
  documents: {
    type: Array,
    default: () => []
  },
  selectedId: {
    type: [String, Number],
    default: null
  }
});

const emit = defineEmits(['select', 'upload']);

const searchTerm = ref('');
const filterStatus = ref('All');

const filteredDocuments = computed(() => {
  if (!props.documents) return [];
  
  return props.documents.filter(doc => {
    const term = searchTerm.value.toLowerCase();
    const matchesSearch = (doc.name || '').toLowerCase().includes(term) ||
      (doc.processo || '').toLowerCase().includes(term);
    
    if (filterStatus.value === 'All') return matchesSearch;
    if (filterStatus.value === 'Pendentes') {
      return matchesSearch && ['Validacao Pendente', 'Enriquecimento Pendente', 'Processing IDP', 'Raciocinio Pendente', 'Uploaded'].includes(doc.status);
    }
    if (filterStatus.value === 'Aprovados') {
      return matchesSearch && ['Aprovado', 'Finalizado'].includes(doc.status);
    }
    if (filterStatus.value === 'Rejeitados') {
      return matchesSearch && ['Rejeitado', 'Failed'].includes(doc.status);
    }
    return matchesSearch && doc.status === filterStatus.value;
  });
});

const filters = [
  { label: 'Todos', value: 'All' },
  { label: 'Em Análise', value: 'Pendentes' },
  { label: 'Aprovados', value: 'Aprovados' },
  { label: 'Rejeitados', value: 'Rejeitados' }
];
</script>

<template>
  <aside class="w-full h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-colors duration-200">
    
    <!-- Barra Superior: Busca & Botão Novo -->
    <div class="p-3.5 border-b border-slate-200 dark:border-slate-800 space-y-2.5 bg-slate-50/50 dark:bg-slate-900/50">
      <div class="flex items-center gap-2">
        <div class="relative flex-grow">
          <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por servidor ou tipo..." 
            v-model="searchTerm"
            class="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs transition-all placeholder:text-slate-400" 
          />
        </div>
        <button 
          @click="emit('upload')" 
          class="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-all hover:scale-105 active:scale-95 shrink-0"
          title="Autuar Novo Processo"
        >
          <Plus class="w-4 h-4" />
        </button>
      </div>

      <!-- Filtros Rápidos -->
      <div class="flex gap-1.5 overflow-x-auto custom-scrollbar pb-0.5">
        <button 
          v-for="f in filters" 
          :key="f.value"
          @click="filterStatus = f.value"
          class="px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all"
          :class="filterStatus === f.value 
            ? 'bg-indigo-600 text-white shadow-xs' 
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'"
        >
          {{ f.label }}
        </button>
      </div>
    </div>

    <!-- Lista de Processos -->
    <div class="flex-grow overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar">
      <div v-if="!documents || documents.length === 0" class="text-center py-12 text-slate-400 dark:text-slate-500 text-xs">
        <FileText class="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p class="font-medium">Nenhum processo na fila.</p>
        <button 
          @click="emit('upload')"
          class="mt-3 px-3 py-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
        >
          + Autuar primeiro requerimento
        </button>
      </div>

      <div 
        v-else
        v-for="doc in filteredDocuments" 
        :key="doc.id" 
        @click="emit('select', doc.id)"
        class="p-3 rounded-xl cursor-pointer border transition-all duration-150 relative overflow-hidden group"
        :class="doc.id === selectedId 
          ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-500/50 shadow-xs' 
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-750'"
      >
        <div v-if="doc.id === selectedId" class="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600"></div>

        <div class="flex justify-between items-start mb-1 pl-1.5">
          <div class="flex items-center gap-1.5 truncate w-10/12">
            <span class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
              {{ doc.secretariaId || 'SEAD' }}
            </span>
            <h3 
              class="font-bold text-xs truncate transition-colors"
              :class="doc.id === selectedId ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-200'"
            >
              {{ doc.name || 'Processo Sem Nome' }}
            </h3>
          </div>

          <component 
            :is="getStatusDisplay(doc.status).icon" 
            class="w-4 h-4 shrink-0" 
            :class="[getStatusDisplay(doc.status).color, getStatusDisplay(doc.status).animate]" 
          />
        </div>
        
        <div class="flex items-center justify-between pl-1.5 mt-2">
          <span 
            class="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-md"
            :class="[
              doc.status === 'Aprovado' || doc.status === 'Finalizado' 
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                : doc.status === 'Rejeitado'
                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
                : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
            ]"
          >
            {{ getStatusDisplay(doc.status).text }}
          </span>
          <span class="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
            {{ new Date(doc.timestamp || Date.now()).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) }}
          </span>
        </div>
      </div>
    </div>
  </aside>
</template>