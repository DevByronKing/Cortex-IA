import { ref, computed } from 'vue';
import { SECRETARIAS_PARÁ, ROLES_RBAC } from '@/constants/secretarias';

const activeSecretariaId = ref(localStorage.getItem('cortex_active_sec') || 'SEAD');
const activeRoleId = ref(localStorage.getItem('cortex_active_role') || 'analista_rh');

export function useRBAC() {
  const currentSecretaria = computed(() => {
    return SECRETARIAS_PARÁ.find(s => s.id === activeSecretariaId.value) || SECRETARIAS_PARÁ[0];
  });

  const currentRole = computed(() => {
    return ROLES_RBAC.find(r => r.id === activeRoleId.value) || ROLES_RBAC[0];
  });

  const setSecretaria = (secId) => {
    if (SECRETARIAS_PARÁ.some(s => s.id === secId)) {
      activeSecretariaId.value = secId;
      localStorage.setItem('cortex_active_sec', secId);
    }
  };

  const setRole = (roleId) => {
    if (ROLES_RBAC.some(r => r.id === roleId)) {
      activeRoleId.value = roleId;
      localStorage.setItem('cortex_active_role', roleId);
    }
  };

  const hasPermission = (permission) => {
    if (!currentRole.value || !currentRole.value.permissoes) return false;
    return currentRole.value.permissoes.includes(permission);
  };

  return {
    secretarias: SECRETARIAS_PARÁ,
    roles: ROLES_RBAC,
    activeSecretariaId,
    activeRoleId,
    currentSecretaria,
    currentRole,
    setSecretaria,
    setRole,
    hasPermission
  };
}
