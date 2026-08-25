import { ref, watchEffect } from 'vue';
import { supabase, isSupabaseConfigured } from '@/libs/supabase';
import { supabaseDb, useSupabaseTable } from '@/composables/useSupabase';


export function useAudit() {
  /**
   * Grava um log imutável na tabela 'audit_logs' do Supabase
   * @param {string} processId - ID do processo
   * @param {string} action - Ex: 'UPLOAD', 'IDP_STARTED', 'IDP_COMPLETED', 'HUMAN_VALIDATION', 'REASONING_COMPLETED'
   * @param {object} details - Detalhes específicos da ação
   */
  const logAction = async (processId, action, details = {}) => {
    if (!processId) return;

    try {
      const actorInfo = {
        uid: 'analista-sead-pa',
        email: 'analista.rh@sead.pa.gov.br'
      };

      const record = {
        process_id: processId,
        action,
        actor_uid: actorInfo.uid,
        actor_email: actorInfo.email,
        summary: details.summary || action,
        details: {
          previousValue: details.previousValue || null,
          newValue: details.newValue || null,
          notes: details.notes || '',
          summary: details.summary || ''
        },
        client_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Cortex/Agent',
        created_at: new Date().toISOString()
      };

      await supabaseDb.insert('audit_logs', record);
      console.log(`[AUDIT] ✅ Evento ${action} registrado no Supabase para o processo ${processId}`);
    } catch (error) {
      console.error("[AUDIT] ❌ Falha ao registrar log de auditoria:", error);
    }
  };

  return { logAction };
}

/**
 * Composable para escutar os logs de auditoria de um documento no Supabase
 */
export function useDocumentAuditLogs(processIdRef) {
  const logs = ref([]);
  const loading = ref(false);

  const getProcessId = () => {
    return typeof processIdRef === 'string' ? processIdRef : processIdRef?.value;
  };

  const fetchLogs = async (procId) => {
    if (!procId) {
      logs.value = [];
      loading.value = false;
      return;
    }

    loading.value = true;

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('process_id', procId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        logs.value = data || [];
      } catch (err) {
        console.warn('Erro ao carregar audit logs do Supabase:', err.message);
      } finally {
        loading.value = false;
      }
    } else {
      // Local fallback
      const { data: allLogs } = useSupabaseTable('audit_logs');
      logs.value = (allLogs.value || []).filter(l => l.process_id === procId || l.processId === procId);
      loading.value = false;
    }
  };

  watchEffect((onInvalidate) => {
    const procId = getProcessId();
    if (!procId) {
      logs.value = [];
      return;
    }

    fetchLogs(procId);

    if (isSupabaseConfigured()) {
      const channel = supabase
        .channel(`audit-logs-${procId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'audit_logs', filter: `process_id=eq.${procId}` },
          () => {
            fetchLogs(procId);
          }
        )
        .subscribe();

      onInvalidate(() => {
        supabase.removeChannel(channel);
      });
    }
  });

  return { logs, loading, refresh: () => fetchLogs(getProcessId()) };
}