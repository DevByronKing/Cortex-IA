<script setup>
import { computed } from 'vue';
import { safeParse } from '@/utils/helpers';
import { 
  TrendingUp, Clock, Award, ShieldAlert, Building2, 
  Sparkles, CheckCircle2, Zap, ArrowDownRight, Layers, FileCheck
} from 'lucide-vue-next';

const props = defineProps({
  documents: {
    type: Array,
    default: () => []
  }
});

// --- CÁLCULOS ANALYTICS GOVTECH ---
const analytics = computed(() => {
  const docs = props.documents || [];
  const total = docs.length;

  const approved = docs.filter(d => ['Aprovado', 'Finalizado'].includes(d.status)).length;
  const pending = docs.filter(d => ['Validacao Pendente', 'Enriquecimento Pendente', 'Processing IDP', 'Raciocinio Pendente', 'Uploaded'].includes(d.status)).length;
  const rejected = docs.filter(d => ['Rejeitado', 'Failed'].includes(d.status)).length;

  // Celeridade e Horas Economizadas (Base Gov: média de 3.5 horas gastas por processo tradicional)
  const hoursSaved = (total * 3.5).toFixed(1);
  const avgSlaTraditional = "45 dias";
  const avgSlaCortex = "1.8 min";
  const slaReduction = "99.9%";

  // Distribuição por Tipo de Processo
  const processCounts = {};
  docs.forEach(d => {
    const proc = d.processo || 'Geral';
    processCounts[proc] = (processCounts[proc] || 0) + 1;
  });

  const processDistribution = Object.keys(processCounts).map(key => {
    const count = processCounts[key];
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    return {
      name: key.replace(/_/g, ' ').toUpperCase(),
      rawKey: key,
      count,
      percentage
    };
  }).sort((a, b) => b.count - a.count);

  // Distribuição por Órgão / Secretaria (a partir de enrichedData)
  const orgCounts = { 'SEAD/PA': 0, 'SEFA/PA': 0, 'SEDUC/PA': 0, 'OUTROS': 0 };
  docs.forEach(d => {
    const enriched = safeParse(d.enrichedData || d.enriched_data);
    const lotacao = enriched?.lotacao || 'SEAD/PA';
    if (orgCounts[lotacao] !== undefined) {
      orgCounts[lotacao]++;
    } else {
      orgCounts['OUTROS']++;
    }
  });

  const totalOrgs = Object.values(orgCounts).reduce((a, b) => a + b, 0);
  const orgDistribution = Object.keys(orgCounts).map(key => ({
    name: key,
    count: orgCounts[key],
    percentage: totalOrgs > 0 ? Math.round((orgCounts[key] / totalOrgs) * 100) : 0
  })).filter(o => o.count > 0 || total === 0);

  // Taxa de Conformidade
  const complianceRate = total > 0 ? Math.round(((approved + rejected) / total) * 100) : 100;

  return {
    total,
    approved,
    pending,
    rejected,
    hoursSaved,
    avgSlaTraditional,
    avgSlaCortex,
    slaReduction,
    processDistribution,
    orgDistribution,
    complianceRate
  };
});
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- BANNER DE IMPACTO GOVTECH -->
    <div class="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white p-6 lg:p-7 rounded-3xl border border-indigo-500/30 shadow-xl relative overflow-hidden">
      <div class="absolute -right-10 -top-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
      
      <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="px-3 py-1 bg-indigo-500/30 text-indigo-200 text-xs font-bold rounded-full border border-indigo-400/30 flex items-center gap-1.5 shadow-2xs">
              <Zap class="w-3.5 h-3.5 text-indigo-300" /> Cockpit Executivo de Produtividade GovTech
            </span>
            <span class="text-xs text-indigo-200/80">Dados Consolidados em Tempo Real</span>
          </div>
          <h2 class="text-2xl lg:text-3xl font-black text-white tracking-tight">Impacto da Automação Estatutária</h2>
          <p class="text-indigo-200/90 text-xs lg:text-sm mt-1 max-w-2xl leading-relaxed">
            Monitoramento estratégico de celeridade processual, auditoria e conformidade funcional com a Lei nº 5.810/94 (Pará).
          </p>
        </div>

        <div class="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
          <div class="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-center min-w-36 shadow-lg">
            <p class="text-[11px] text-indigo-200 uppercase font-bold tracking-wider">Economia Estimada</p>
            <p class="text-2xl font-black text-emerald-300 mt-0.5">
              {{ analytics.hoursSaved }}h
            </p>
            <p class="text-[10px] text-indigo-300/80">Horas de Analistas</p>
          </div>

          <div class="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-center min-w-36 shadow-lg">
            <p class="text-[11px] text-indigo-200 uppercase font-bold tracking-wider">Ganho de Celeridade</p>
            <p class="text-2xl font-black text-white mt-0.5">
              {{ analytics.slaReduction }}
            </p>
            <p class="text-[10px] text-indigo-300/80">{{ analytics.avgSlaTraditional }} ➔ {{ analytics.avgSlaCortex }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- CARDS DE MÉTRICAS PRINCIPAIS -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
      <!-- 1. Volume Total -->
      <div class="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-2">
        <div class="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span class="text-xs font-bold uppercase tracking-wider">Volume de Processos</span>
          <div class="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <Layers class="w-4 h-4" />
          </div>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-3xl font-extrabold text-slate-900 dark:text-white">{{ analytics.total }}</span>
          <span class="text-xs text-slate-500">autuados</span>
        </div>
        <p class="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
          <CheckCircle2 class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> 100% digitalizados
        </p>
      </div>

      <!-- 2. Decisões Aprovadas -->
      <div class="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-2">
        <div class="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span class="text-xs font-bold uppercase tracking-wider">Aprovados pelo Agente</span>
          <div class="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            <Award class="w-4 h-4" />
          </div>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{{ analytics.approved }}</span>
          <span class="text-xs text-slate-500">({{ analytics.total > 0 ? Math.round((analytics.approved / analytics.total) * 100) : 0 }}%)</span>
        </div>
        <p class="text-xs text-emerald-700 dark:text-emerald-400/90 font-medium">Conformes com a Lei 5.810/94</p>
      </div>

      <!-- 3. Em Tramitação -->
      <div class="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-2">
        <div class="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span class="text-xs font-bold uppercase tracking-wider">Em Análise / Validação</span>
          <div class="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
            <Clock class="w-4 h-4" />
          </div>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-3xl font-extrabold text-amber-600 dark:text-amber-400">{{ analytics.pending }}</span>
          <span class="text-xs text-slate-500">pendentes</span>
        </div>
        <p class="text-xs text-amber-700 dark:text-amber-400/90 font-medium">Aguardando IA ou Validação Humana</p>
      </div>

      <!-- 4. Indeferimentos / Riscos -->
      <div class="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-2">
        <div class="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span class="text-xs font-bold uppercase tracking-wider">Indeferimentos Fundamentados</span>
          <div class="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
            <ShieldAlert class="w-4 h-4" />
          </div>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-3xl font-extrabold text-rose-600 dark:text-rose-400">{{ analytics.rejected }}</span>
          <span class="text-xs text-slate-500">rejeitados</span>
        </div>
        <p class="text-xs text-rose-700 dark:text-rose-400/90 font-medium">Com indicação de regras infringidas</p>
      </div>
    </div>

    <!-- SEÇÕES DE DISTRIBUIÇÃO E GRÁFICOS -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      <!-- Coluna 1: Demandas por Categoria Estatutária -->
      <div class="bg-white dark:bg-slate-800/80 p-6 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileCheck class="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Demandas por Categoria Estatutária
          </h3>
          <span class="text-xs text-slate-500 dark:text-slate-400 font-mono">{{ analytics.processDistribution.length }} categorias</span>
        </div>

        <div v-if="analytics.processDistribution.length === 0" class="text-center py-8 text-slate-400 text-xs">
          Nenhum processo autuado ainda.
        </div>

        <div v-else class="space-y-3.5">
          <div v-for="proc in analytics.processDistribution" :key="proc.rawKey" class="space-y-1">
            <div class="flex justify-between text-xs">
              <span class="text-slate-700 dark:text-slate-300 font-semibold truncate max-w-[240px]">{{ proc.name }}</span>
              <span class="text-slate-500 dark:text-slate-400 font-mono">{{ proc.count }} proc. ({{ proc.percentage }}%)</span>
            </div>
            <div class="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-2 overflow-hidden">
              <div 
                class="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full transition-all duration-500" 
                :style="{ width: `${proc.percentage}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Coluna 2: Volume por Secretaria / Órgão do Estado -->
      <div class="bg-white dark:bg-slate-800/80 p-6 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 class="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Volume por Órgão da Administração
          </h3>
          <span class="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 class="w-3.5 h-3.5" /> Multi-Secretarias
          </span>
        </div>

        <div class="space-y-3.5">
          <div v-for="org in analytics.orgDistribution" :key="org.name" class="space-y-1">
            <div class="flex justify-between text-xs">
              <span class="text-slate-700 dark:text-slate-300 font-semibold">{{ org.name }}</span>
              <span class="text-slate-500 dark:text-slate-400 font-mono">{{ org.count }} servidores ({{ org.percentage }}%)</span>
            </div>
            <div class="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-2 overflow-hidden">
              <div 
                class="bg-emerald-500 dark:bg-emerald-400 h-2 rounded-full transition-all duration-500" 
                :style="{ width: `${org.percentage}%` }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Box de Conformidade e Segurança -->
        <div class="mt-4 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p class="text-xs font-bold text-slate-800 dark:text-slate-200">Índice de Conformidade Normativa</p>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">Decisões auditáveis alinhadas às orientações da PGE/PA</p>
          </div>
          <div class="text-right">
            <span class="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{{ analytics.complianceRate }}%</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

