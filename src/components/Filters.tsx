import React from 'react';
import { ScrollView } from 'react-native';
import type { Unit } from '../api/types';
import { Chip } from './ui';

export function UnitFilter({ units, value, onChange }: { units: Unit[]; value: number | null; onChange: (id: number | null) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
      <Chip label="Todas as UCs" active={value === null} onPress={() => onChange(null)} />
      {units.map((u) => (
        <Chip key={u.id} label={u.name} active={value === u.id} onPress={() => onChange(u.id)} />
      ))}
    </ScrollView>
  );
}
