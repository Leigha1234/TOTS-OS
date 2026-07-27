// ==========================================
// 10. lib/import/progressTracker.ts
// ==========================================

export class ProgressTracker {
  private startTime: number;
  private onUpdate: (progress: { phase: string; percent: number; currentBatch: number; totalBatches: number; processedRows: number; elapsedMs: number; etaMs: number }) => void;

  constructor(onUpdate: (progress: any) => void) {
    this.startTime = Date.now();
    this.onUpdate = onUpdate;
  }

  update(phase: string, percent: number, currentBatch: number = 0, totalBatches: number = 1, processedRows: number = 0) {
    const elapsedMs = Date.now() - this.startTime;
    const etaMs = percent > 0 ? (elapsedMs / percent) * (100 - percent) : 0;

    this.onUpdate({
      phase,
      percent,
      currentBatch,
      totalBatches,
      processedRows,
      elapsedMs,
      etaMs
    });
  }

  getElapsedTime(): number {
    return Date.now() - this.startTime;
  }

  complete() {
    this.update('success', 100, 1, 1);
  }
}