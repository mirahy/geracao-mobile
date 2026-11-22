import { useRouter, type Href } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { Card } from '../../src/components/ui';
import { visibleAdminSections } from '../../src/lib/access';
import { useAuth } from '../../src/lib/auth';
import { useTheme } from '../../src/theme';

const SECTIONS: { key: string; title: string; hint: string; href: Href; permission: string; icon: string; generatorOnly?: boolean }[] = [
  { key: 'users', title: 'Usuários', hint: 'Cadastro, perfis e unidades de cada pessoa', href: '/admin/users', permission: 'usuarios.gerenciar', icon: '👥' },
  { key: 'roles', title: 'Perfis e permissões', hint: 'O que cada perfil pode ver e fazer', href: '/admin/roles', permission: 'perfis.gerenciar', icon: '🛡️' },
  { key: 'requests', title: 'Solicitações de acesso', hint: 'Aprovar ou recusar pedidos de unidades', href: '/admin/requests', permission: 'solicitacoes.gerenciar', icon: '🔑' },
  { key: 'units', title: 'Unidades consumidoras', hint: 'Cadastro de UCs geradoras e beneficiárias', href: '/admin/units', permission: 'unidades.ver', icon: '🏠' },
  { key: 'installments', title: 'Parcelas das placas', hint: 'Valor mensal pago pelas placas solares', href: '/admin/installments', permission: 'parcelas.ver', icon: '💰', generatorOnly: true },
  { key: 'documents', title: 'Importações', hint: 'Faturas e demonstrativos importados (PDF)', href: '/admin/documents', permission: 'documentos.ver', icon: '📥' },
];

export default function AdminHome() {
  const t = useTheme();
  const router = useRouter();
  const { can, hasGenerator } = useAuth();
  const visible = visibleAdminSections(SECTIONS, can, hasGenerator);
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      {visible.length === 0 ? <Text style={{ color: t.muted }}>Seu perfil não tem acesso às telas de administração.</Text> : null}
      {visible.map((s) => (
        <Pressable key={s.title} onPress={() => router.push(s.href)}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{ fontSize: 26 }}>{s.icon}</Text>
            <Text style={{ flex: 1 }}>
              <Text style={{ color: t.text, fontWeight: '700', fontSize: 16 }}>{s.title}{'\n'}</Text>
              <Text style={{ color: t.muted, fontSize: 13 }}>{s.hint}</Text>
            </Text>
            <Text style={{ color: t.muted, fontSize: 20 }}>›</Text>
          </Card>
        </Pressable>
      ))}
    </ScrollView>
  );
}
