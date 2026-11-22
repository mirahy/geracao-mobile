/**
 * Parte de arquivo para FormData no formato aceito pelo `fetch` do Expo (SDK 53+): objeto com `name`, `type`
 * opcional e `bytes()`. O formato antigo do React Native, `{ uri, name, type }`, não é aceito e faz o envio
 * falhar antes de sair do aparelho ("Unsupported FormDataPart implementation").
 */
export interface FilePart {
  name: string;
  type?: string;
  bytes: () => Promise<Uint8Array>;
}

export function makeFilePart(name: string, type: string | null | undefined, bytes: () => Promise<Uint8Array>): FilePart {
  return type ? { name, type, bytes } : { name, bytes };
}
