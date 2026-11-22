import { useColorScheme } from 'react-native';

const light = {
  bg: '#F5F7FA', card: '#FFFFFF', text: '#14202B', muted: '#6B7885', border: '#E1E6EC',
  primary: '#F59E0B', primaryText: '#1F1300', good: '#16A34A', bad: '#DC2626',
  series: ['#F59E0B', '#0EA5E9', '#16A34A', '#8B5CF6', '#EC4899'],
};
const dark: typeof light = {
  bg: '#0E141B', card: '#17202A', text: '#EAF0F6', muted: '#8FA0B0', border: '#263340',
  primary: '#FBBF24', primaryText: '#1F1300', good: '#4ADE80', bad: '#F87171',
  series: ['#FBBF24', '#38BDF8', '#4ADE80', '#A78BFA', '#F472B6'],
};

export type Theme = typeof light;
export const useTheme = (): Theme => (useColorScheme() === 'dark' ? dark : light);
