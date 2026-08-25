<script setup>
import { ref, computed } from 'vue';
import { Shield, Check, X, Edit3, Power, Sliders, CheckCircle2, AlertCircle } from 'lucide-vue-next';
import { supabaseDb } from '@/composables/useSupabase';
import { useToastStore } from '@/stores/toast';

const props = defineProps({
  rules: {
    type: Array,
    default: () => []
  }
});

const toast = useToastStore();
const editingId = ref(null);
const tempRule = ref({});
const selectedProcessFilter = ref('todos');

const filteredRules = computed(() => {
  if (selectedProcessFilter.value === 'todos') return props.rules;
  return props.rules.filter(r => r.processo === selectedProcessFilter.value);
});

// Iniciar Edição
const startEdit = (rule) => {
  editingId.value = rule.id;
  tempRule.value = {
    ...rule,
    condicoes: JSON.stringify(rule.condicoes, null, 2),
    acao_se_verdadeiro: JSON.stringify(rule.acao_se_verdadeiro, null, 2)
  };
};

const cancelEdit = () => {
  editingId.value = null;
  tempRule.value = {};
};

// Alternar Status da Regra
const toggleRuleStatus = async (rule) => {
  const newStatus = rule.status === 'Ativa' ? 'Inativa' : 'Ativa';
  try {
    await supabaseDb.update('rules', rule.id, { status: newStatus });
    toast.addToast(`Regra ${newStatus === 'Ativa' ? 'ativada' : 'desativada'} com sucesso!`, 'info');
  } catch (err) {
    toast.addToast('Erro ao atualizar status da regra.', 'error');
  }
};

// Salvar Regra
const saveRule = async () => {
  try {
    const ruleToSave = {
      ...tempRule.value,
      condicoes: JSON.parse(tempRule.value.condicoes),
      acao_se_verdadeiro: JSON.parse(tempRule.value.acao_se_verdadeiro)
    };

    await supabaseDb.update('rules', editingId.value, ruleToSave);
    toast.addToast('Regra atualizada com sucesso!', 'success');
    cancelEdit();
  } catch (e) {
    console.error(e);
    toast.addToast('Erro: JSON inválido. Verifique a sintaxe.', 'error');
  }
};
</script>

<template>
  <div class="space-y-6 animate-fade-in text-slate-900 dark:text-white">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
      <div>
        <h1 class="text-2xl lg:text-3xl font-extrabold flex items-center text-slate-900 dark:text-white">
          <Shield class="w-7 h-7 mr-3 text-indigo-600 dark:text-indigo-400" /> Motor de Regras Estatutárias (Módulo RAR)
        </h1>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Configuração de parâmetros de conformidade da Lei Estadual nº 5.810/94</p>
      </div>

      <!-- Filtros por Processo -->
      <div class="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 text-xs">
        <button 
          @click="selectedProcessFilter = 'todos'"
          class="px-3 py-1.5 rounded-xl font-bold transition-all"
          :class="selectedProcessFilter === 'todos' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
        >
          Todas ({{ rules.length }})
        </button>
        <button 
          @click="selectedProcessFilter = 'licenca_premio'"
          class="px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap"
          :class="selectedProcessFilter === 'licenca_premio' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
        >
          Licença-Prêmio
        </button>
        <button 
          @click="selectedProcessFilter = 'solicitacao_ferias'"
          class="px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap"
          :class="selectedProcessFilter === 'solicitacao_ferias' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
        >
          Férias
        </button>
        <button 
          @click="selectedProcessFilter = 'licenca_maternidade'"
          class="px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap"
          :class="selectedProcessFilter === 'licenca_maternidade' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
        >
          Maternidade
        </button>
      </div>
    </div>
    
    <!-- Grid de Regras -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
      <div 
        v-for="rule in filteredRules" 
        :key="rule.id" 
        class="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all space-y-3"
      >
        <!-- Modo Edição -->
        <div v-if="editingId === rule.id" class="space-y-3">
          <input 
            v-model="tempRule.nome" 
            class="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm outline-none focus:border-indigo-500" 
          />
          
          <div class="space-y-2">
             <div>
                <label class="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Condições Lógicas (JSON)</label>
                <textarea 
                  v-model="tempRule.condicoes" 
                  rows="4" 
                  class="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 font-mono text-xs border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 outline-none"
                ></textarea>
             </div>
             <div>
                <label class="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Ação / Veredito (JSON)</label>
                <textarea 
                  v-model="tempRule.acao_se_verdadeiro" 
                  rows="3" 
                  class="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 font-mono text-xs border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 outline-none"
                ></textarea>
             </div>
          </div>

          <div class="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
             <button @click="cancelEdit" class="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200">Cancelar</button>
             <button @click="saveRule" class="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1"><Check class="w-3.5 h-3.5"/> Salvar</button>
          </div>
        </div>

        <!-- Modo Visualização -->
        <div v-else class="space-y-3">
          <div class="flex justify-between items-start">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-base font-bold text-slate-900 dark:text-white">{{ rule.nome }}</h3>
                <span class="text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {{ rule.processo }}
                </span>
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">{{ rule.descricao || 'Regra estatutária aplicável à tramitação.' }}</p>
            </div>

            <!-- Status Badge & Toggle -->
            <button 
              @click="toggleRuleStatus(rule)"
              class="px-2.5 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition-all"
              :class="rule.status === 'Ativa' 
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'"
              :title="rule.status === 'Ativa' ? 'Clique para desativar' : 'Clique para ativar'"
            >
              <span class="w-2 h-2 rounded-full" :class="rule.status === 'Ativa' ? 'bg-emerald-500' : 'bg-slate-400'"></span>
              {{ rule.status }}
            </button>
          </div>

          <!-- Bloco de Condições -->
          <div class="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Critérios de Avaliação:</span>
            <pre class="font-mono text-[11px] text-slate-700 dark:text-slate-300 overflow-x-auto custom-scrollbar">{{ JSON.stringify(rule.condicoes, null, 2) }}</pre>
          </div>

          <div class="flex justify-end pt-1">
            <button 
              @click="startEdit(rule)" 
              class="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <Edit3 class="w-3.5 h-3.5" /> Editar Parâmetros
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>