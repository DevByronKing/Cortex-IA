<script setup>
import { ref, computed, watch } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useSupabaseTable, supabaseDb } from '@/composables/useSupabase';
import { useSeeder } from '@/composables/useSeeder';
import { useAudit } from '@/composables/useAudit';
import { useToastStore } from '@/stores/toast';
import { geminiApiService } from '@/services/geminiService';
import { ragService } from '@/services/ragService';
import { safeParse } from '@/utils/helpers';

// Componentes
import Header from '@/components/layout/Header.vue';
import Sidebar from '@/components/layout/Sidebar.vue';
import Dashboard from '@/components/dashboard/Dashboard.vue';
import DocumentViewer from '@/components/documents/DocumentViewer.vue';
import RuleManager from '@/components/rules/RuleManager.vue';
import UploadModal from '@/components/modals/UploadModal.vue';
import BatchUploadModal from '@/components/modals/BatchUploadModal.vue';
import ToolsView from './ToolsView.vue';
import SettingsView from './SettingsView.vue';
import { useRBAC } from '@/composables/useRBAC';

// --- ESTADO ---
const { user, isAuthReady } = useAuth();
const { secretarias, currentSecretaria } = useRBAC();
const toastStore = useToastStore();
const { logAction } = useAudit();
const currentView = ref('dashboard');
const selectedDocId = ref(null);
const isUploadModalOpen = ref(false);
const isBatchUploadModalOpen = ref(false);


// --- DADOS REATIVOS SUPABASE ---
const { data: documents } = useSupabaseTable('processes');
const { data: rules } = useSupabaseTable('rules');
const { data: servidores } = useSupabaseTable('servidores');

// Popula o banco com regras estatutárias padrão se estiver vazio
useSeeder();

// Documento atualmente selecionado
const selectedDocument = computed(() => {
  if (!documents.value || !documents.value.length) return null;
  if (selectedDocId.value) {
    return documents.value.find(d => d.id === selectedDocId.value) || documents.value[0];
  }
  return documents.value[0] || null;
});

// Sincroniza a seleção inicial
watch(documents, (docs) => {
  if (docs && docs.length > 0 && !selectedDocId.value) {
    selectedDocId.value = docs[0].id;
  }
}, { immediate: true });

// --- LÓGICA DE ORQUESTRAÇÃO (AGENTE IA) ---
// 1. IDP Multimodal
const startIDPChain = async (docToProcess) => {
    try {
      await supabaseDb.update('processes', docToProcess.id, { status: 'Processing IDP' });
      await logAction(docToProcess.id, 'IDP_STARTED', { 
        summary: `Extração inteligente de dados iniciada (${docToProcess.mimeType || docToProcess.mime_type || 'Texto'}).` 
      });
      
      const mlOutput = await geminiApiService.callGeminiAPIForProcessing(
        docToProcess.content,
        docToProcess.fileData || docToProcess.file_data,
        docToProcess.mimeType || docToProcess.mime_type
      );
      
      await supabaseDb.update('processes', docToProcess.id, { 
        status: 'Enriquecimento Pendente', 
        idpResult: JSON.stringify(mlOutput.idpResult), 
        nlpResult: JSON.stringify(mlOutput.nlpResult),
        idp_result: mlOutput.idpResult,
        nlp_result: mlOutput.nlpResult
      });

      await logAction(docToProcess.id, 'IDP_COMPLETED', { 
        summary: `Documento classificado como "${mlOutput.idpResult?.documentType || 'Processo'}" com ${mlOutput.idpResult?.keyFields?.length || 0} campos extraídos com sucesso.`,
        newValue: mlOutput.idpResult 
      });
    } catch (error) {
      console.error("Erro IDP:", error);
      await supabaseDb.update('processes', docToProcess.id, { status: 'Failed' });
      await logAction(docToProcess.id, 'IDP_FAILED', { notes: error.message });
    }
};

// 2. Enriquecimento Cadastral com Base de RH
const executeEnrichment = async (docToProcess) => {
    try {
        const idpData = safeParse(docToProcess.idpResult || docToProcess.idp_result);
        const personName = idpData?.keyFields?.find(f => 
          f.field.toLowerCase().includes("nome") || 
          f.field.toLowerCase().includes("pessoa") || 
          f.field.toLowerCase().includes("requerente")
        )?.value;

        let enrichedData = {};
        if (personName && servidores.value.length) {
            const servidor = servidores.value.find(s => s.nome && personName.toLowerCase().includes(s.nome.split(' ')[0].toLowerCase()));
            if (servidor) {
              enrichedData = { 
                nome: servidor.nome,
                cargo: servidor.cargo, 
                tempo_de_servico_em_anos: servidor.tempo_de_servico_em_anos, 
                matricula: servidor.matricula,
                lotacao: servidor.lotacao || 'SEAD/PA'
              };
            }
        }
        await supabaseDb.update('processes', docToProcess.id, { 
          status: 'Validacao Pendente', 
          enrichedData: JSON.stringify(enrichedData),
          enriched_data: enrichedData 
        });
        await logAction(docToProcess.id, 'ENRICHMENT_COMPLETED', { 
          summary: Object.keys(enrichedData).length ? 'Cruzamento cadastral com base de RH do Supabase concluído.' : 'Cadastro funcional não localizado na base local.',
          newValue: enrichedData 
        });
    } catch (e) {
        await supabaseDb.update('processes', docToProcess.id, { status: 'Validacao Pendente', enrichedData: '{}' });
    }
};

// 3. Raciocínio Estatutário com RAG da Lei 5.810/94
const startReasoningChain = async (docToProcess) => {
    try {
         const idpData = safeParse(docToProcess.idpResult || docToProcess.idp_result);
         const enrichedData = safeParse(docToProcess.enrichedData || docToProcess.enriched_data);
         const activeRules = rules.value.filter(r => r.status === 'Ativa').map(r => `- ${r.nome}: ${JSON.stringify(r.condicoes)}`).join('\n');
         
         // 1. Recupera artigos da Lei 5.810/94 via RAG Jurídico
         const ragContext = await ragService.buildRAGContext(docToProcess.processo, docToProcess.content);

         const prompt = `Analise o processo administrativo estatutário:
DADOS EXTRAÍDOS DO IDP: ${JSON.stringify(idpData)}
HISTÓRICO FUNCIONAL RH: ${JSON.stringify(enrichedData)}
REGRAS DE CONFORMIDADE: ${activeRules}
${ragContext}`;
         
         await logAction(docToProcess.id, 'REASONING_STARTED', { 
           summary: 'Agente Jurídico aplicando regras estatutárias com RAG da Lei 5.810/94.' 
         });
         const rarResult = await geminiApiService.callGeminiAPIForReasoning(prompt);
         const finalStatus = rarResult.veredicto?.status || 'Finalizado';
         
         await supabaseDb.update('processes', docToProcess.id, { 
           status: finalStatus, 
           rarResult: JSON.stringify(rarResult),
           rar_result: rarResult 
         });
         await logAction(docToProcess.id, 'REASONING_COMPLETED', { 
           summary: `Veredito emitido: ${finalStatus}. Parecer: ${rarResult.veredicto?.parecer || ''}`,
           newValue: rarResult
         });

         toastStore.addToast(`Processo ${finalStatus}!`, 'success');
    } catch (e) {
        console.error("Erro no Raciocínio:", e);
        await supabaseDb.update('processes', docToProcess.id, { status: 'Failed' });
        await logAction(docToProcess.id, 'REASONING_FAILED', { notes: e.message });
    }
};

// Callback Validação Humana
const onHumanValidation = async ({ docId, data }) => {
    await supabaseDb.update('processes', docId, { 
      idpResult: JSON.stringify(data), 
      idp_result: data,
      status: 'Raciocinio Pendente' 
    });
    await logAction(docId, 'HUMAN_VALIDATION', { 
      summary: 'Analista revisou e confirmou os dados extraídos pelo IDP.',
      newValue: data 
    });
    toastStore.addToast('Validação humana concluída. Agente de Análise acionado!', 'info');
};

// Watcher de Orquestração Reativo
watch(documents, (newDocs) => {
    newDocs.forEach(doc => {
        if (doc.status === 'Uploaded') startIDPChain(doc);
        else if (doc.status === 'Enriquecimento Pendente') executeEnrichment(doc);
        else if (doc.status === 'Raciocinio Pendente') startReasoningChain(doc);
    });
}, { deep: true });

// --- INTERFACE HANDLERS ---
const handleStartProcess = async (payload) => {
    try {
        const newRecord = {
            name: payload.fileName,
            content: payload.content,
            fileUrl: payload.fileUrl || null,
            file_url: payload.fileUrl || null,
            fileData: payload.fileData || null,
            file_data: payload.fileData || null,
            mimeType: payload.mimeType || 'application/pdf',
            mime_type: payload.mimeType || 'application/pdf',
            processo: payload.processoId,
            status: 'Uploaded',
            timestamp: Date.now()
        };

        const createdDoc = await supabaseDb.insert('processes', newRecord);
        
        await logAction(createdDoc.id, 'UPLOAD', { 
          summary: `Processo autuado: ${payload.processoNome} (${payload.fileName}).`
        });

        toastStore.addToast(`Processo autuado com sucesso!`, 'success');
        isUploadModalOpen.value = false;
        selectedDocId.value = createdDoc.id;
        currentView.value = 'documents';
    } catch (e) {
        console.error(e);
        toastStore.addToast('Erro ao criar processo.', 'error');
    }
};

const handleStartBatchProcess = async ({ items, secretariaId }) => {
    try {
        let firstId = null;
        for (const item of items) {
            const newRecord = {
                name: item.fileName,
                content: item.content,
                fileUrl: null,
                file_url: null,
                fileData: item.fileData,
                file_data: item.fileData,
                mimeType: item.mimeType || 'application/pdf',
                mime_type: item.mimeType || 'application/pdf',
                processo: item.processoId,
                secretariaId: secretariaId || 'SEAD',
                status: 'Uploaded',
                timestamp: Date.now()
            };

            const createdDoc = await supabaseDb.insert('processes', newRecord);
            if (!firstId) firstId = createdDoc.id;

            await logAction(createdDoc.id, 'UPLOAD', { 
              summary: `Processo autuado em lote (${secretariaId}): ${item.fileName}.`
            });
        }

        toastStore.addToast(`Lote de ${items.length} processos autuado e em processamento paralelo!`, 'success');
        isBatchUploadModalOpen.value = false;
        if (firstId) selectedDocId.value = firstId;
        currentView.value = 'documents';
    } catch (e) {
        console.error('Erro no processamento em lote:', e);
        toastStore.addToast('Erro ao autuar lote de processos.', 'error');
    }
};

const handleDelete = async (id) => {
    if(confirm("Deseja realmente excluir este processo? Esta ação removerá os registros associados.")) {
        await logAction(id, 'DELETED', { summary: 'Processo removido pelo analista.' });
        await supabaseDb.delete('processes', id);
        selectedDocId.value = null;
        toastStore.addToast('Processo excluído com sucesso.', 'info');
    }
};
</script>

<template>
  <div class="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden transition-colors duration-200">
    <!-- Header Principal com Navegação e Alternador de Tema -->
    <Header 
      :currentView="currentView" 
      @update:view="val => currentView = val" 
      @openUpload="isUploadModalOpen = true"
      @openBatchUpload="isBatchUploadModalOpen = true"
    />

    <!-- Área de Conteúdo Principal -->
    <div class="flex-grow overflow-hidden flex flex-col">
      
      <!-- 1. DASHBOARD EXECUTIVO & PERFORMANCE -->
      <div 
        v-if="currentView === 'dashboard'" 
        class="flex-grow overflow-y-auto custom-scrollbar p-4 lg:p-6"
      >
        <Dashboard :documents="documents" />
      </div>

      <!-- 2. FILA DE PROCESSOS & WORKSPACE DE ANÁLISE -->
      <div 
        v-else-if="currentView === 'documents'" 
        class="flex-grow flex overflow-hidden"
      >
        <!-- Painel Esquerdo: Fila de Processos -->
        <div class="w-full md:w-80 lg:w-96 shrink-0 h-full border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <Sidebar 
            :documents="documents" 
            :selectedId="selectedDocId"
            @select="id => selectedDocId = id" 
            @upload="isUploadModalOpen = true"
          />
        </div>

        <!-- Painel Direito: Espaço de Trabalho do Processo -->
        <main class="hidden md:flex flex-grow overflow-hidden flex-col h-full bg-slate-50/50 dark:bg-slate-950/40">
          <DocumentViewer 
            :doc="selectedDocument" 
            @validate="onHumanValidation"
            @delete="handleDelete"
          />
        </main>
      </div>

      <!-- 3. ASSISTENTE JURÍDICO & RAG DA LEI 5.810/94 -->
      <div 
        v-else-if="currentView === 'tools'" 
        class="flex-grow overflow-hidden flex flex-col"
      >
        <ToolsView />
      </div>

      <!-- 4. MOTOR DE REGRAS ESTATUTÁRIAS - RAR -->
      <div 
        v-else-if="currentView === 'rules'" 
        class="flex-grow overflow-y-auto custom-scrollbar p-4 lg:p-6"
      >
        <RuleManager :rules="rules" />
      </div>

      <!-- 5. CONFIGURAÇÕES & SUPABASE -->
      <div 
        v-else-if="currentView === 'settings'" 
        class="flex-grow overflow-y-auto custom-scrollbar p-4 lg:p-6"
      >
        <SettingsView />
      </div>

    </div>
    
    <!-- Modal de Autuação Individual -->
    <UploadModal 
      v-if="isUploadModalOpen" 
      @close="isUploadModalOpen = false" 
      @start="handleStartProcess" 
    />

    <!-- Modal de Autuação em Lote (Batch IDP) -->
    <BatchUploadModal 
      v-if="isBatchUploadModalOpen"
      :secretarias="secretarias"
      @close="isBatchUploadModalOpen = false"
      @startBatch="handleStartBatchProcess"
    />
  </div>
</template>