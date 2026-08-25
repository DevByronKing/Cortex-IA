<script setup>
import { ref, computed } from 'vue';
import StatCard from './StatCard.vue';
import ExecutiveCockpit from './ExecutiveCockpit.vue';
import { FileText, CheckCircle, ListChecks, AlertTriangle, LayoutDashboard, BarChart3, SlidersHorizontal } from 'lucide-vue-next';

const props = defineProps({
  documents: {
    type: Array,
    default: () => []
  }
});

const dashboardMode = ref('executive'); // 'executive' | 'operational'

// Cálculo automático das estatísticas com base nos documentos
const stats = computed(() => {
  const docs = props.documents || [];
  const total = docs.length;
  
  const approved = docs.filter(d => d.status === 'Aprovado' || d.status === 'Finalizado').length;
  const pending = docs.filter(d => ['Validacao Pendente', 'Enriquecimento Pendente', 'Processing IDP', 'Raciocinio Pendente'].includes(d.status)).length;
  const rejected = docs.filter(d => ['Rejeitado', 'Failed'].includes(d.status)).length;

  const completionRate = total > 0 ? (approved / total) * 100 : 0;
  const rejectionRate = total > 0 ? (rejected / total) * 100 : 0;

  return { total, approved, pending, rejected, completionRate, rejectionRate };
});
</script>

<template>
  <div class="p-4 lg:p-6 text-slate-900 dark:text-white animate-fade-in space-y-6">
    <!-- Cabeçalho do Dashboard com Alternador de Visão -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
      <div>
        <h1 class="text-2xl lg:text-3xl font-extrabold flex items-center text-slate-900 dark:text-white">
          <LayoutDashboard class="w-7 h-7 mr-3 text-indigo-600 dark:text-indigo-400" /> Painel de Inteligência & Produtividade
        </h1>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Gestão Estratégica de Processos da Lei Estadual nº 5.810/94</p>
      </div>

      <div class="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
        <button 
          @click="dashboardMode = 'executive'"
          class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          :class="dashboardMode === 'executive' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
        >
          <BarChart3 class="w-3.5 h-3.5" /> Cockpit Executivo
        </button>
        <button 
          @click="dashboardMode = 'operational'"
          class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          :class="dashboardMode === 'operational' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
        >
          <SlidersHorizontal class="w-3.5 h-3.5" /> Visão Operacional
        </button>
      </div>
    </div>

    <!-- MODO 1: COCKPIT EXECUTIVO (GOVTECH ANALYTICS) -->
    <div v-if="dashboardMode === 'executive'">
      <ExecutiveCockpit :documents="documents" />
    </div>

    <!-- MODO 2: VISÃO OPERACIONAL DE CARDS -->
    <div v-else class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard 
          title="Processos no Sistema" 
          :value="stats.total" 
          unit="" 
          :icon="FileText" 
          colorClass="text-indigo-600 dark:text-indigo-400" 
        />
        
        <StatCard 
          title="Aprovados pelo Agente" 
          :value="stats.approved" 
          :unit="`/${stats.total}`" 
          :icon="CheckCircle" 
          colorClass="text-emerald-600 dark:text-emerald-400" 
          :rate="stats.completionRate" 
          rateLabel="Taxa de Aprovação" 
        />
        
        <StatCard 
          title="Em Andamento / Validação" 
          :value="stats.pending" 
          unit="" 
          :icon="ListChecks" 
          colorClass="text-amber-600 dark:text-amber-400" 
        />
        
        <StatCard 
          title="Rejeitados / Falhas" 
          :value="stats.rejected" 
          unit="" 
          :icon="AlertTriangle" 
          colorClass="text-rose-600 dark:text-rose-400" 
          :rate="stats.rejectionRate" 
          rateLabel="Taxa de Rejeição" 
        />
      </div>
    </div>
  </div>
</template>