import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

/** Recarrega os dados toda vez que a tela volta ao foco (ex.: depois de salvar num formulário). */
export function useFocusReload(reload: () => Promise<unknown> | void) {
  useFocusEffect(useCallback(() => { void reload(); }, [reload]));
}
