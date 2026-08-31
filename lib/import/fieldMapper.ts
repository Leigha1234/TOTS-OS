// ==========================================
// lib/import/fieldMapper.ts
// ==========================================

import {
  COLUMN_ALIASES,
} from "./constants";

import {
  RawRow,
} from "./types";

// ============================================================
// NORMALISATION
// ============================================================

function normaliseString(
  value: unknown
): string {
  if (
    value ===
      undefined ||
    value ===
      null
  ) {
    return "";
  }

  return String(
    value
  )
    .trim()
    .toLowerCase()
    .replace(
      /[._\-]+/g,
      " "
    )
    .replace(
      /[^a-z0-9\s]/g,
      ""
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

// ============================================================

function hasUsableValue(
  value: unknown
) {
  if (
    value ===
      undefined ||
    value ===
      null
  ) {
    return false;
  }

  if (
    typeof value ===
    "string"
  ) {
    return (
      value.trim() !==
      ""
    );
  }

  return true;
}

// ============================================================

function getTokens(
  value: string
) {
  return value
    .split(
      " "
    )
    .filter(
      Boolean
    );
}

// ============================================================

function tokenMatchScore(
  header: string,
  alias: string
) {
  const headerTokens =
    getTokens(
      header
    );

  const aliasTokens =
    getTokens(
      alias
    );

  if (
    headerTokens.length ===
      0 ||
    aliasTokens.length ===
      0
  ) {
    return 0;
  }

  const headerSet =
    new Set(
      headerTokens
    );

  const aliasSet =
    new Set(
      aliasTokens
    );

  const matchingTokens =
    aliasTokens.filter(
      (
        token
      ) =>
        headerSet.has(
          token
        )
    ).length;

  if (
    matchingTokens ===
    0
  ) {
    return 0;
  }

  const aliasCoverage =
    matchingTokens /
    aliasSet.size;

  const headerCoverage =
    matchingTokens /
    headerSet.size;

  return (
    aliasCoverage *
      0.7 +
    headerCoverage *
      0.3
  );
}

// ============================================================
// EXACT HEADER MATCH
// ============================================================

function findExactMatch(
  row:
    RawRow,

  aliases:
    string[]
) {
  const rowKeys =
    Object.keys(
      row
    );

  const normalisedAliases =
    new Set(
      aliases.map(
        normaliseString
      )
    );

  for (
    const key of
    rowKeys
  ) {
    const value =
      row[
        key
      ];

    if (
      !hasUsableValue(
        value
      )
    ) {
      continue;
    }

    const normalisedKey =
      normaliseString(
        key
      );

    if (
      normalisedAliases.has(
        normalisedKey
      )
    ) {
      return {
        key,
        value,
        confidence:
          1,
      };
    }
  }

  return null;
}

// ============================================================
// SAFE TOKEN MATCH
// ============================================================

function findBestTokenMatch(
  row:
    RawRow,

  aliases:
    string[]
) {
  const candidates:
    {
      key:
        string;

      value:
        unknown;

      score:
        number;
    }[] =
    [];

  for (
    const key of
    Object.keys(
      row
    )
  ) {
    const value =
      row[
        key
      ];

    if (
      !hasUsableValue(
        value
      )
    ) {
      continue;
    }

    const normalisedKey =
      normaliseString(
        key
      );

    let bestScore =
      0;

    for (
      const alias of
      aliases
    ) {
      const normalisedAlias =
        normaliseString(
          alias
        );

      const score =
        tokenMatchScore(
          normalisedKey,
          normalisedAlias
        );

      if (
        score >
        bestScore
      ) {
        bestScore =
          score;
      }
    }

    if (
      bestScore >=
      0.8
    ) {
      candidates.push({
        key,
        value,
        score:
          bestScore,
      });
    }
  }

  if (
    candidates.length ===
    0
  ) {
    return null;
  }

  candidates.sort(
    (
      a,
      b
    ) =>
      b.score -
      a.score
  );

  const best =
    candidates[
      0
    ];

  const secondBest =
    candidates[
      1
    ];

  /*
   * Only use fuzzy/token matching when it is clearly better
   * than the next candidate.
   *
   * This avoids ambiguous mappings such as:
   *
   * "name"
   * "company name"
   *
   * both being treated as the same field.
   */
  if (
    secondBest &&
    Math.abs(
      best.score -
        secondBest.score
    ) <
      0.08
  ) {
    return null;
  }

  return best;
}

// ============================================================
// PUBLIC: FIND MAPPED VALUE
// ============================================================

export function findMappedValue(
  row:
    RawRow,

  canonicalKey:
    string
): any {
  const aliases =
    COLUMN_ALIASES[
      canonicalKey
    ] ?? [
      canonicalKey,
    ];

  const completeAliases =
    Array.from(
      new Set(
        [
          canonicalKey,
          ...aliases,
        ]
      )
    );

  // ----------------------------------------------------------
  // 1. Exact match
  // ----------------------------------------------------------

  const exact =
    findExactMatch(
      row,
      completeAliases
    );

  if (
    exact
  ) {
    return exact.value;
  }

  // ----------------------------------------------------------
  // 2. Safe token-aware fallback
  // ----------------------------------------------------------

  const tokenMatch =
    findBestTokenMatch(
      row,
      completeAliases
    );

  if (
    tokenMatch
  ) {
    return tokenMatch.value;
  }

  return null;
}

// ============================================================
// PUBLIC: FIND MAPPED KEY
// ============================================================

export function findMappedKey(
  row:
    RawRow,

  canonicalKey:
    string
): string | null {
  const aliases =
    COLUMN_ALIASES[
      canonicalKey
    ] ?? [
      canonicalKey,
    ];

  const completeAliases =
    Array.from(
      new Set(
        [
          canonicalKey,
          ...aliases,
        ]
      )
    );

  const exact =
    findExactMatch(
      row,
      completeAliases
    );

  if (
    exact
  ) {
    return exact.key;
  }

  const tokenMatch =
    findBestTokenMatch(
      row,
      completeAliases
    );

  return (
    tokenMatch?.key ??
    null
  );
}

// ============================================================
// PUBLIC: MAP MULTIPLE FIELDS
// ============================================================

export function mapFields(
  row:
    RawRow,

  canonicalKeys:
    string[]
) {
  const mapped:
    Record<
      string,
      any
    > = {};

  canonicalKeys.forEach(
    (
      canonicalKey
    ) => {
      const value =
        findMappedValue(
          row,
          canonicalKey
        );

      if (
        hasUsableValue(
          value
        )
      ) {
        mapped[
          canonicalKey
        ] =
          value;
      }
    }
  );

  return mapped;
}