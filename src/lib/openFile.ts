import type { File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

interface OpenOptions {
  title: string;
  mimeType?: string;
}

/**
 * Abre o arquivo baixado no leitor do aparelho (visualizador de PDF/imagem), sem passar pela folha de
 * compartilhamento. Só se não houver nenhum leitor instalado oferece, como alternativa explícita, salvar/compartilhar.
 */
export async function openInReader(file: File, { title, mimeType }: OpenOptions): Promise<void> {
  const type = mimeType ?? (file.type || undefined);

  if (await file.canPreview({ mimeType: type })) {
    await file.preview({ title, mimeType: type });
    return;
  }

  Alert.alert(
    'Nenhum leitor encontrado',
    'Este aparelho não tem um aplicativo para abrir o arquivo. Instale um leitor de PDF ou escolha salvar/compartilhar.',
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salvar / compartilhar',
        onPress: () => {
          void (async () => {
            if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: type, dialogTitle: title });
          })();
        },
      },
    ],
  );
}
