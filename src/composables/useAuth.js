import { ref, onMounted, onUnmounted } from 'vue';
import { supabase, isSupabaseConfigured } from '@/libs/supabase';

const user = ref({
  id: 'analista-sead-pa',
  uid: 'analista-sead-pa',
  email: 'analista.rh@sead.pa.gov.br',
  role: 'Analista de Gestão Pública',
  orgao: 'SEAD/PA'
});
const isAuthReady = ref(false);

export function useAuth() {
  onMounted(async () => {
    if (isSupabaseConfigured()) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          user.value = {
            ...session.user,
            uid: session.user.id,
            orgao: 'SEAD/PA'
          };
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session?.user) {
            user.value = {
              ...session.user,
              uid: session.user.id,
              orgao: 'SEAD/PA'
            };
          }
        });

        onUnmounted(() => {
          subscription?.unsubscribe();
        });
      } catch (err) {
        console.warn("Supabase Auth fallback ativo:", err.message);
      }
    }
    isAuthReady.value = true;
  });

  return { user, isAuthReady };
}