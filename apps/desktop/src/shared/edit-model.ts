export interface EditBlock {
  readonly id: string;
  readonly originalStart: number;
  readonly modifiedStart: number;
  readonly originalLines: readonly string[];
  readonly modifiedLines: readonly string[];
}

export interface ProposedFileInput {
  readonly path: string;
  readonly proposedContent: string | null;
}

export interface ReviewFileChange {
  readonly path: string;
  readonly kind: 'create' | 'modify' | 'delete';
  readonly original: string;
  readonly modified: string;
  readonly blocks: readonly EditBlock[];
  readonly unifiedDiff: string;
}

export interface EditProposal {
  readonly id: string;
  readonly title: string;
  readonly createdAt: string;
  readonly status: 'pending' | 'applied' | 'rejected';
  readonly files: readonly ReviewFileChange[];
}

export interface FileReviewSelection {
  readonly path: string;
  readonly accepted: boolean;
  readonly blockIds?: readonly string[];
  readonly editedContent?: string;
}

export interface ApplyProposalResult {
  readonly proposalId: string;
  readonly checkpointId: string;
  readonly appliedFiles: readonly string[];
  readonly skippedFiles: readonly string[];
}

type DiffOperation = {
  readonly type: 'equal' | 'add' | 'remove';
  readonly line: string;
};

const MAX_LCS_CELLS = 500_000;

const splitLines = (content: string): string[] => content.split('\n');

const fallbackOperations = (
  original: readonly string[],
  modified: readonly string[],
): DiffOperation[] => {
  let prefix = 0;
  while (
    prefix < original.length &&
    prefix < modified.length &&
    original[prefix] === modified[prefix]
  ) {
    prefix += 1;
  }
  let suffix = 0;
  while (
    suffix < original.length - prefix &&
    suffix < modified.length - prefix &&
    original[original.length - 1 - suffix] === modified[modified.length - 1 - suffix]
  ) {
    suffix += 1;
  }
  return [
    ...original.slice(0, prefix).map((line) => ({ type: 'equal' as const, line })),
    ...original
      .slice(prefix, original.length - suffix)
      .map((line) => ({ type: 'remove' as const, line })),
    ...modified
      .slice(prefix, modified.length - suffix)
      .map((line) => ({ type: 'add' as const, line })),
    ...original.slice(original.length - suffix).map((line) => ({ type: 'equal' as const, line })),
  ];
};

const diffOperations = (
  original: readonly string[],
  modified: readonly string[],
): DiffOperation[] => {
  if (original.length * modified.length > MAX_LCS_CELLS) {
    return fallbackOperations(original, modified);
  }
  const width = modified.length + 1;
  const table = new Uint32Array((original.length + 1) * width);
  for (let originalIndex = original.length - 1; originalIndex >= 0; originalIndex -= 1) {
    for (let modifiedIndex = modified.length - 1; modifiedIndex >= 0; modifiedIndex -= 1) {
      const offset = originalIndex * width + modifiedIndex;
      table[offset] =
        original[originalIndex] === modified[modifiedIndex]
          ? (table[(originalIndex + 1) * width + modifiedIndex + 1] ?? 0) + 1
          : Math.max(
              table[(originalIndex + 1) * width + modifiedIndex] ?? 0,
              table[originalIndex * width + modifiedIndex + 1] ?? 0,
            );
    }
  }

  const operations: DiffOperation[] = [];
  let originalIndex = 0;
  let modifiedIndex = 0;
  while (originalIndex < original.length && modifiedIndex < modified.length) {
    if (original[originalIndex] === modified[modifiedIndex]) {
      operations.push({ type: 'equal', line: original[originalIndex] ?? '' });
      originalIndex += 1;
      modifiedIndex += 1;
    } else if (
      (table[(originalIndex + 1) * width + modifiedIndex] ?? 0) >=
      (table[originalIndex * width + modifiedIndex + 1] ?? 0)
    ) {
      operations.push({ type: 'remove', line: original[originalIndex] ?? '' });
      originalIndex += 1;
    } else {
      operations.push({ type: 'add', line: modified[modifiedIndex] ?? '' });
      modifiedIndex += 1;
    }
  }
  while (originalIndex < original.length) {
    operations.push({ type: 'remove', line: original[originalIndex] ?? '' });
    originalIndex += 1;
  }
  while (modifiedIndex < modified.length) {
    operations.push({ type: 'add', line: modified[modifiedIndex] ?? '' });
    modifiedIndex += 1;
  }
  return operations;
};

export function createEditBlocks(originalContent: string, modifiedContent: string): EditBlock[] {
  if (originalContent === modifiedContent) return [];
  const operations = diffOperations(splitLines(originalContent), splitLines(modifiedContent));
  const blocks: EditBlock[] = [];
  let originalLine = 1;
  let modifiedLine = 1;
  let current:
    | {
        originalStart: number;
        modifiedStart: number;
        originalLines: string[];
        modifiedLines: string[];
      }
    | undefined;

  const finish = (): void => {
    if (!current) return;
    blocks.push({ id: `block-${blocks.length + 1}`, ...current });
    current = undefined;
  };

  for (const operation of operations) {
    if (operation.type === 'equal') {
      finish();
      originalLine += 1;
      modifiedLine += 1;
      continue;
    }
    current ??= {
      originalStart: originalLine,
      modifiedStart: modifiedLine,
      originalLines: [],
      modifiedLines: [],
    };
    if (operation.type === 'remove') {
      current.originalLines.push(operation.line);
      originalLine += 1;
    } else {
      current.modifiedLines.push(operation.line);
      modifiedLine += 1;
    }
  }
  finish();
  return blocks;
}

export function applySelectedBlocks(
  originalContent: string,
  blocks: readonly EditBlock[],
  selectedIds: ReadonlySet<string>,
): string {
  const original = splitLines(originalContent);
  const output: string[] = [];
  let cursor = 0;
  for (const block of blocks) {
    if (!selectedIds.has(block.id)) continue;
    const start = block.originalStart - 1;
    if (start < cursor) throw new Error('Blocos de edição sobrepostos.');
    output.push(...original.slice(cursor, start), ...block.modifiedLines);
    cursor = start + block.originalLines.length;
  }
  output.push(...original.slice(cursor));
  return output.join('\n');
}

export function createUnifiedDiff(
  filePath: string,
  originalContent: string,
  modifiedContent: string,
  blocks = createEditBlocks(originalContent, modifiedContent),
): string {
  const original = splitLines(originalContent);
  const modified = splitLines(modifiedContent);
  const lines = [`--- a/${filePath}`, `+++ b/${filePath}`];
  for (const block of blocks) {
    const contextBefore = Math.min(3, block.originalStart - 1, block.modifiedStart - 1);
    const originalAfterIndex = block.originalStart - 1 + block.originalLines.length;
    const modifiedAfterIndex = block.modifiedStart - 1 + block.modifiedLines.length;
    const contextAfter = Math.min(
      3,
      original.length - originalAfterIndex,
      modified.length - modifiedAfterIndex,
    );
    const oldStart = Math.max(1, block.originalStart - contextBefore);
    const newStart = Math.max(1, block.modifiedStart - contextBefore);
    const oldCount = contextBefore + block.originalLines.length + contextAfter;
    const newCount = contextBefore + block.modifiedLines.length + contextAfter;
    lines.push(`@@ -${oldStart},${oldCount} +${newStart},${newCount} @@`);
    lines.push(
      ...original
        .slice(block.originalStart - 1 - contextBefore, block.originalStart - 1)
        .map((line) => ` ${line}`),
      ...block.originalLines.map((line) => `-${line}`),
      ...block.modifiedLines.map((line) => `+${line}`),
      ...original
        .slice(originalAfterIndex, originalAfterIndex + contextAfter)
        .map((line) => ` ${line}`),
    );
  }
  return lines.join('\n');
}
