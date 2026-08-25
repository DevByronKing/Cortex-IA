<script setup>
import PlatformView from '@/views/PlatformView.vue';
import ToastContainer from '@/components/ui/ToastContainer.vue';
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
    <ToastContainer />
    <PlatformView />
  </div>
</template>

<style>
body {
  margin: 0;
  padding: 0;
}
</style>