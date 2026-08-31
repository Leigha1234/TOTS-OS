// ==========================================
// lib/import/progressTracker.ts
// ==========================================

// ============================================================
// TYPES
// ============================================================

export interface ImportProgress {
  phase: string;
  percent: number;
  currentBatch: number;
  totalBatches: number;
  processedRows: number;
  elapsedMs: number;
  etaMs: number;
}

export type ProgressUpdateHandler = (
  progress: ImportProgress
) => void;

// ============================================================
// HELPERS
// ============================================================

function clampPercent(
  value: number
): number {
  if (
    !Number.isFinite(
      value
    )
  ) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      value
    )
  );
}

// ============================================================

function safeInteger(
  value: number,
  minimum = 0
): number {
  if (
    !Number.isFinite(
      value
    )
  ) {
    return minimum;
  }

  return Math.max(
    minimum,
    Math.floor(
      value
    )
  );
}

// ============================================================
// PROGRESS TRACKER
// ============================================================

export class ProgressTracker {
  private startTime: number;

  private onUpdate:
    ProgressUpdateHandler;

  private lastProgress:
    ImportProgress;

  // ==========================================================
  // CONSTRUCTOR
  // ==========================================================

  constructor(
    onUpdate:
      ProgressUpdateHandler
  ) {
    this.startTime =
      Date.now();

    this.onUpdate =
      onUpdate;

    this.lastProgress = {
      phase:
        "idle",

      percent:
        0,

      currentBatch:
        0,

      totalBatches:
        1,

      processedRows:
        0,

      elapsedMs:
        0,

      etaMs:
        0,
    };
  }

  // ==========================================================
  // UPDATE
  // ==========================================================

  update(
    phase: string,
    percent: number,
    currentBatch = 0,
    totalBatches = 1,
    processedRows = 0
  ): ImportProgress {
    const now =
      Date.now();

    const elapsedMs =
      Math.max(
        0,
        now -
          this.startTime
      );

    const safePercent =
      clampPercent(
        percent
      );

    const safeTotalBatches =
      Math.max(
        1,
        safeInteger(
          totalBatches,
          1
        )
      );

    const safeCurrentBatch =
      Math.min(
        safeTotalBatches,
        safeInteger(
          currentBatch,
          0
        )
      );

    const safeProcessedRows =
      safeInteger(
        processedRows,
        0
      );

    // ========================================================
    // ETA
    // ========================================================

    let etaMs =
      0;

    /**
     * ETA only makes sense once progress has actually started
     * and before it has completed.
     */
    if (
      safePercent >
        0 &&
      safePercent <
        100 &&
      elapsedMs >
        0
    ) {
      const estimatedTotalMs =
        elapsedMs /
        (
          safePercent /
          100
        );

      etaMs =
        Math.max(
          0,
          estimatedTotalMs -
            elapsedMs
        );
    }

    const progress:
      ImportProgress = {
      phase,

      percent:
        safePercent,

      currentBatch:
        safeCurrentBatch,

      totalBatches:
        safeTotalBatches,

      processedRows:
        safeProcessedRows,

      elapsedMs,

      etaMs:
        Math.round(
          etaMs
        ),
    };

    this.lastProgress =
      progress;

    this.onUpdate(
      progress
    );

    return progress;
  }

  // ==========================================================
  // GET ELAPSED TIME
  // ==========================================================

  getElapsedTime(): number {
    return Math.max(
      0,
      Date.now() -
        this.startTime
    );
  }

  // ==========================================================
  // GET CURRENT PROGRESS
  // ==========================================================

  getProgress(): ImportProgress {
    return {
      ...this.lastProgress,
    };
  }

  // ==========================================================
  // RESET
  // ==========================================================

  reset(): void {
    this.startTime =
      Date.now();

    this.lastProgress = {
      phase:
        "idle",

      percent:
        0,

      currentBatch:
        0,

      totalBatches:
        1,

      processedRows:
        0,

      elapsedMs:
        0,

      etaMs:
        0,
    };

    this.onUpdate({
      ...this.lastProgress,
    });
  }

  // ==========================================================
  // COMPLETE
  // ==========================================================

  complete(
    processedRows?:
      number
  ): ImportProgress {
    return this.update(
      "success",
      100,

      this.lastProgress
        .totalBatches,

      this.lastProgress
        .totalBatches,

      processedRows ??
        this.lastProgress
          .processedRows
    );
  }
}