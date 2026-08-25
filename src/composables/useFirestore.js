import { useSupabaseTable } from '@/composables/useSupabase';

export function useFirestoreCollection(pathOrTableRef) {
  // Converte paths legados para tabelas do Supabase caso algum componente ainda chame useFirestoreCollection
  const tableName = typeof pathOrTableRef === 'string' 
    ? pathOrTableRef.split('/').pop() 
    : (pathOrTableRef?.value ? pathOrTableRef.value.split('/').pop() : 'processes');

  const mappedTable = tableName === 'intelligent_platform_docs' ? 'processes' : tableName;
  return useSupabaseTable(mappedTable);
}