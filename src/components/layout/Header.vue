<script setup>
import { useTheme } from '@/composables/useTheme';
import { useRBAC } from '@/composables/useRBAC';
import { 
  Sparkles, LayoutDashboard, FileText, Bot, Settings, 
  Shield, Sun, Moon, Plus, Layers, Building, ChevronDown, UserCheck
} from 'lucide-vue-next';

const props = defineProps({
  currentView: {
    type: String,
    default: 'dashboard'
  }
});

const emit = defineEmits(['update:view', 'openUpload', 'openBatchUpload']);
const { theme, toggleTheme } = useTheme();
const { secretarias, roles, activeSecretariaId, activeRoleId, currentSecretaria, currentRole, setSecretaria, setRole } = useRBAC();

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'documents', label: 'Processos', icon: FileText },
  { id: 'tools', label: 'Assistente IA', icon: Bot },
  { id: 'rules', label: 'Regras RAR', icon: Shield },
  { id: 'settings', label: 'Configurações', icon: Settings },
];
</script>

<template>
  <header class="h-14 px-3 sm:px-5 lg:px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs z-30 shrink-0 flex items-center justify-between gap-2 transition-colors duration-200">
    <!-- Esquerda: Brand & Seletor de Secretaria -->
    <div class="flex items-center space-x-3">
      <div class="flex items-center space-x-2.5 cursor-pointer select-none" @click="emit('update:view', 'dashboard')">
        <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shadow-xs">
          <Sparkles class="w-4 h-4 text-white" />
        </div>
        <div class="flex items-center gap-1.5">
          <span class="text-base font-black tracking-tight text-slate-900 dark:text-white">CORTEX</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">GovPA</span>
        </div>
      </div>

      <!-- Seletor de Secretaria Ativa -->
      <div class="relative hidden sm:block">
        <select 
          :value="activeSecretariaId"
          @change="e => setSecretaria(e.target.value)"
          class="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 py-1.5 pl-2.5 pr-7 rounded-xl outline-none cursor-pointer appearance-none shadow-2xs"
          title="Alternar Secretaria Estadual Ativa"
        >
          <option v-for="sec in secretarias" :key="sec.id" :value="sec.id">
            🏛️ {{ sec.sigla }}
          </option>
        </select>
        <ChevronDown class="w-3 h-3 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
      </div>
    </div>

    <!-- Centro: Navegação em Linha Única -->
    <nav class="hidden md:flex items-center bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
      <button 
        v-for="item in navItems"
        :key="item.id"
        @click="emit('update:view', item.id)" 
        class="flex items-center px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer"
        :class="currentView === item.id 
          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs' 
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
      >
        <component :is="item.icon" class="w-3.5 h-3.5 mr-1.5 shrink-0" />
        <span>{{ item.label }}</span>
      </button>
    </nav>

    <!-- Direita: Ações Rápidas, RBAC & Perfil -->
    <div class="flex items-center space-x-2">
      <!-- Botão Autuação em Lote -->
      <button 
        @click="emit('openBatchUpload')"
        class="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer whitespace-nowrap"
        title="Autuação massiva de processos em lote (Batch IDP)"
      >
        <Layers class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
        <span>Lote</span>
      </button>

      <!-- Botão Novo Processo Individual -->
      <button 
        @click="emit('openUpload')"
        class="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
      >
        <Plus class="w-3.5 h-3.5" />
        <span class="hidden sm:inline">Novo Processo</span>
      </button>

      <!-- Alternador Modo Claro / Escuro -->
      <button 
        @click="toggleTheme" 
        class="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
        :title="theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'"
      >
        <Sun v-if="theme === 'dark'" class="w-4 h-4 text-amber-400" />
        <Moon v-else class="w-4 h-4 text-indigo-600" />
      </button>

      <!-- Seletor de Perfil RBAC & Avatar -->
      <div class="flex items-center space-x-1.5 pl-1.5 border-l border-slate-200 dark:border-slate-800">
        <select 
          :value="activeRoleId"
          @change="e => setRole(e.target.value)"
          class="hidden xl:block text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 py-1 px-2 rounded-lg outline-none cursor-pointer"
          title="Alternar Perfil Funcional RBAC"
        >
          <option v-for="r in roles" :key="r.id" :value="r.id">
            👤 {{ r.sigla }}
          </option>
        </select>

        <div class="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center shadow-2xs" :title="`${currentRole.nome} - ${currentSecretaria.sigla}`">
          {{ currentRole.id === 'secretario_adjunto' ? 'SEC' : currentRole.id === 'assessor_juridico' ? 'JUR' : currentRole.id === 'auditor_interno' ? 'AUD' : 'RH' }}
        </div>
      </div>
    </div>
  </header>
</template>