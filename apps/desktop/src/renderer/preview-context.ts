import type { PreviewElementContext } from '../shared/runtime';

export function buildPreviewPrompt(element: PreviewElementContext): string {
  return [
    'Deixe este botão maior.',
    '',
    'Contexto do elemento selecionado no preview:',
    `- URL: ${element.url}`,
    `- Seletor CSS: ${element.selector}`,
    `- Elemento: <${element.tag}>`,
    `- Texto: ${element.text || '(sem texto)'}`,
    `- Classes: ${element.classes.join(' ') || '(nenhuma)'}`,
    `- Área: ${Math.round(element.bounds.width)}×${Math.round(element.bounds.height)} em (${Math.round(element.bounds.x)}, ${Math.round(element.bounds.y)})`,
    `- Atributos: ${JSON.stringify(element.attributes)}`,
    '',
    'Use os arquivos já abertos como contexto para localizar o componente. Proponha a alteração em diff para revisão.',
  ].join('\n');
}
