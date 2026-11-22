import { File } from 'expo-file-system';
import { makeFilePart } from './filePart';

/** Arquivo escolhido no seletor de documentos (uri local + nome original) como parte de um FormData. */
export function filePart(asset: { uri: string; name: string; mimeType?: string | null }, fallbackType?: string): Blob {
  const file = new File(asset.uri);
  return makeFilePart(asset.name, asset.mimeType ?? fallbackType, () => file.bytes()) as unknown as Blob;
}
