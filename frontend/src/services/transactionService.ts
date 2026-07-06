/**
 * Transaction Service — Generic sequential transaction dengan rollback.
 *
 * Pola Write-After-Read untuk mencegah race condition saat
 * operasi multi-store (misal: konversi deal → project + create procurement).
 */

export interface TransactionStep {
  name: string;
  execute: () => Promise<void> | void;
  rollback: () => Promise<void> | void;
}

export class TransactionError extends Error {
  constructor(
    message: string,
    public readonly failedStep: number,
    public readonly completedSteps: number[],
  ) {
    super(message);
    this.name = 'TransactionError';
  }
}

/**
 * Execute transaction steps sequentially.
 * Jika salah satu step gagal, semua step yang sudah sukses akan di-rollback.
 */
export async function executeTransaction(steps: TransactionStep[]): Promise<void> {
  const completed: number[] = [];

  try {
    for (let i = 0; i < steps.length; i++) {
      await steps[i].execute();
      completed.push(i);
    }
  } catch (error) {
    // Rollback in reverse order
    const rollbackErrors: string[] = [];
    for (const index of completed.reverse()) {
      try {
        await steps[index].rollback();
      } catch (rbError) {
        rollbackErrors.push(
          `Step ${index} (${steps[index].name}) rollback failed: ${rbError instanceof Error ? rbError.message : String(rbError)}`,
        );
      }
    }

    throw new TransactionError(
      `Transaction failed at step ${completed.length} (${steps[completed[0] || 0]?.name || 'unknown'}): ${error instanceof Error ? error.message : String(error)}${rollbackErrors.length > 0 ? `. Rollback errors: ${rollbackErrors.join('; ')}` : ''}`,
      completed.length > 0 ? completed[completed.length - 1] + 1 : 0,
      completed,
    );
  }
}

/**
 * Helper untuk membuat transaction step dari store action.
 * Menggunakan getState() untuk menghindari hook dependency.
 */
export function storeStep<T>(
  name: string,
  action: () => void,
  rollbackAction: () => void,
): TransactionStep {
  return {
    name,
    execute: () => {
      action();
    },
    rollback: () => {
      rollbackAction();
    },
  };
}
