<script setup>
import { computed } from 'vue';
import { TrendingUp } from 'lucide-vue-next';

const props = defineProps(['title', 'value', 'unit', 'icon', 'colorClass', 'rate', 'rateLabel']);

const rateColor = computed(() => {
    if (props.rate > 75) return 'text-emerald-600 dark:text-emerald-400';
    if (props.rate > 40) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
});
</script>

<template>
  <div class="bg-white dark:bg-slate-800/80 p-5 lg:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
    <div class="flex justify-between items-start">
      <div>
        <p class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{{ title }}</p>
        <h2 class="text-3xl font-extrabold mt-1 text-slate-900 dark:text-white flex items-baseline gap-1">
            {{ value }} <span class="text-sm font-semibold text-slate-400 dark:text-slate-500">{{ unit }}</span>
        </h2>
      </div>
      <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600/50">
        <component :is="icon" class="w-6 h-6" :class="colorClass" />
      </div>
    </div>
    
    <div v-if="rate !== undefined" class="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 text-xs font-bold flex items-center">
        <TrendingUp class="w-3.5 h-3.5 mr-1" :class="rateColor" />
        <span :class="rateColor">{{ rate.toFixed(1) }}%</span>
        <span class="ml-1.5 text-slate-400 dark:text-slate-500 font-normal">{{ rateLabel }}</span>
    </div>
  </div>
</template>