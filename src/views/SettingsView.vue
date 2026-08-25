<script setup>
import { ref } from 'vue';
import { Settings, Bell, Database, ShieldCheck, Cpu, HardDrive, CheckCircle2, Building, UserCheck, Key } from 'lucide-vue-next';
import { useToastStore } from '@/stores/toast';
import { useRBAC } from '@/composables/useRBAC';

const toastStore = useToastStore();
const { secretarias, roles, activeSecretariaId, activeRoleId, currentSecretaria, currentRole, setSecretaria, setRole } = useRBAC();

const notifications = ref(true);
const autoProcess = ref(true);
const strictMode = ref(false);
const ragActive = ref(true);

const save = () => {
  toastStore.addToast("Configurações e parâmetros do sistema salvos com sucesso!", "success");
};
</script>

<template>
  <div class="p-4 lg:p-8 text-slate-900 dark:text-white max-w-4xl mx-auto animate-fade-in space-y-6">
    <div class="border-b border-slate-200 dark:border-slate-800 pb-4">
      <h1 class="text-2xl lg:text-3xl font-extrabold flex items-center text-slate-900 dark:text-white">
        <Settings class="w-7 h-7 mr-3 text-indigo-600 dark:text-indigo-400" /> Configurações & Parâmetros
      </h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Gerenciamento de integrações, perfis RBAC, secretarias e inteligência artificial</p>
    </div>
    
    <div class="space-y-5">
        <!-- Card 0: Multi-Secretarias & RBAC -->
        <div class="bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 class="text-base font-bold flex items-center text-slate-900 dark:text-white">
              <Building class="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400"/> Multi-Secretarias & Controle de Acesso (RBAC)
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Seletor de Secretaria -->
              <div class="space-y-1.5">
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">Órgão Estadual Ativo:</label>
                <select 
                  :value="activeSecretariaId"
                  @change="e => setSecretaria(e.target.value)"
                  class="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none cursor-pointer"
                >
                  <option v-for="sec in secretarias" :key="sec.id" :value="sec.id">
                    {{ sec.sigla }} - {{ sec.nome }}
                  </option>
                </select>
                <span class="text-[11px] text-slate-400 block">{{ currentSecretaria.tipo }}</span>
              </div>

              <!-- Seletor de Papel RBAC -->
              <div class="space-y-1.5">
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">Perfil Funcional Ativo:</label>
                <select 
                  :value="activeRoleId"
                  @change="e => setRole(e.target.value)"
                  class="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none cursor-pointer"
                >
                  <option v-for="r in roles" :key="r.id" :value="r.id">
                    {{ r.sigla }} ({{ r.nivel }})
                  </option>
                </select>
                <span class="text-[11px] text-slate-400 block">{{ currentRole.descricao }}</span>
              </div>
            </div>

            <!-- Permissões Concedidas ao Perfil Ativo -->
            <div class="pt-2">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Privilégios Funcionais Concedidos:</span>
              <div class="flex flex-wrap gap-1.5">
                <span 
                  v-for="p in currentRole.permissoes" 
                  :key="p"
                  class="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                >
                  ✓ {{ p }}
                </span>
              </div>
            </div>
        </div>

        <!-- Card 1: Notificações -->
        <div class="bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 class="text-base font-bold flex items-center text-slate-900 dark:text-white">
              <Bell class="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400"/> Notificações & Alertas
            </h3>
            <label class="flex items-center justify-between cursor-pointer group py-1">
                <div>
                  <span class="block text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-white transition-colors">Alertas em Tempo Real</span>
                  <span class="text-xs text-slate-500 dark:text-slate-400">Notificar analistas sobre novos processos autuados na fila.</span>
                </div>
                <input type="checkbox" v-model="notifications" class="w-5 h-5 accent-indigo-600 rounded cursor-pointer" />
            </label>
        </div>

        <!-- Card 2: Agentes IA & RAG -->
        <div class="bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 class="text-base font-bold flex items-center text-slate-900 dark:text-white">
              <Cpu class="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400"/> Pipeline de IA & RAG Estatutário
            </h3>
            <div class="space-y-4">
                <label class="flex items-center justify-between cursor-pointer group py-1">
                    <div>
                        <span class="block text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-white transition-colors">Processamento Automático Multimodal (IDP)</span>
                        <span class="text-xs text-slate-500 dark:text-slate-400">Disparar extração via Gemini 2.0 Flash assim que o processo for autuado.</span>
                    </div>
                    <input type="checkbox" v-model="autoProcess" class="w-5 h-5 accent-indigo-600 rounded cursor-pointer" />
                </label>
                
                <hr class="border-slate-100 dark:border-slate-800" />
                
                <label class="flex items-center justify-between cursor-pointer group py-1">
                    <div>
                        <span class="block text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-white transition-colors">RAG Especializado da Lei nº 5.810/94</span>
                        <span class="text-xs text-slate-500 dark:text-slate-400">Recuperação e injeção automática de artigos estatutários nos pareceres e no chat.</span>
                    </div>
                    <input type="checkbox" v-model="ragActive" class="w-5 h-5 accent-indigo-600 rounded cursor-pointer" />
                </label>

                <hr class="border-slate-100 dark:border-slate-800" />

                <label class="flex items-center justify-between cursor-pointer group py-1">
                    <div>
                        <span class="block text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-white transition-colors">Modo Estrito de Conformidade Normativa</span>
                        <span class="text-xs text-slate-500 dark:text-slate-400">Exigir validação humana obrigatória em casos de confiança inferida inferior a 75%.</span>
                    </div>
                    <input type="checkbox" v-model="strictMode" class="w-5 h-5 accent-indigo-600 rounded cursor-pointer" />
                </label>
            </div>
        </div>

        <!-- Card 3: Banco de Dados Supabase -->
        <div class="bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h3 class="text-base font-bold flex items-center text-slate-900 dark:text-white">
              <HardDrive class="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400"/> Conexão com Supabase
            </h3>
            <p class="text-xs text-slate-600 dark:text-slate-400">
              O banco de dados relacional e auditável está ativo com suporte a tabelas de processos, regras estatutárias, trilha de auditoria e base funcional de servidores públicos.
            </p>
            <div class="flex items-center gap-2 pt-1">
              <span class="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-lg flex items-center gap-1.5">
                <CheckCircle2 class="w-3.5 h-3.5" /> Supabase Client Operacional
              </span>
            </div>
        </div>

        <div class="flex justify-end pt-2">
          <button 
            @click="save" 
            class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
          >
              <ShieldCheck class="w-4 h-4" /> Salvar Configurações
          </button>
        </div>
    </div>
  </div>
</template>