import type { Prospect } from '@/types/domain';

export interface DuplicateGroup {
  original: Prospect;
  duplicates: Prospect[];
  score: number;
  reasons: string[];
}

function normalize(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function jaroWinkler(a: string, b: string): number {
  const an = normalize(a);
  const bn = normalize(b);
  if (an === bn) return 1;
  if (an.length === 0 || bn.length === 0) return 0;

  const matchDistance = Math.floor(Math.max(an.length, bn.length) / 2) - 1;
  const aMatches = new Array(an.length).fill(false);
  const bMatches = new Array(bn.length).fill(false);
  let matches = 0;

  for (let i = 0; i < an.length; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(bn.length, i + matchDistance + 1);
    for (let j = start; j < end; j++) {
      if (bMatches[j]) continue;
      if (an[i] !== bn[j]) continue;
      aMatches[i] = true;
      bMatches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < an.length; i++) {
    if (!aMatches[i]) continue;
    while (!bMatches[k]) k++;
    if (an[i] !== bn[k]) transpositions++;
    k++;
  }

  const jaro = (matches / an.length + matches / bn.length + (matches - transpositions / 2) / matches) / 3;
  const prefix = (() => {
    let len = 0;
    for (let i = 0; i < Math.min(4, an.length, bn.length); i++) {
      if (an[i] === bn[i]) len++;
      else break;
    }
    return len;
  })();

  return jaro + prefix * 0.1 * (1 - jaro);
}

export function findDuplicates(prospects: Prospect[]): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];
  const processed = new Set<string>();

  for (let i = 0; i < prospects.length; i++) {
    if (processed.has(prospects[i].id)) continue;

    const dups: Prospect[] = [];
    const reasons: string[] = [];
    let maxScore = 0;

    for (let j = i + 1; j < prospects.length; j++) {
      if (processed.has(prospects[j].id)) continue;

      const nameScore = jaroWinkler(prospects[i].name, prospects[j].name);
      const clientScore = jaroWinkler(prospects[i].client, prospects[j].client);
      const combined = nameScore * 0.6 + clientScore * 0.4;

      if (combined >= 0.8) {
        dups.push(prospects[j]);
        processed.add(prospects[j].id);
        const r: string[] = [];
        if (nameScore > 0.85) r.push('Nama mirip');
        if (clientScore > 0.85) r.push('Client mirip');
        if (prospects[i].estimatedValue && prospects[j].estimatedValue &&
            Math.abs(prospects[i].estimatedValue! - prospects[j].estimatedValue!) / Math.max(prospects[i].estimatedValue!, 1) < 0.2) {
          r.push('Nilai estimasi hampir sama');
        }
        reasons.push(...r);
        maxScore = Math.max(maxScore, combined);
      }
    }

    if (dups.length > 0) {
      groups.push({
        original: prospects[i],
        duplicates: dups,
        score: Math.round(maxScore * 100),
        reasons: [...new Set(reasons)],
      });
      processed.add(prospects[i].id);
    }
  }

  return groups.sort((a, b) => b.score - a.score);
}

export function mergeProspectData(
  primary: Prospect,
  secondary: Prospect,
): Prospect {
  return {
    ...primary,
    description: primary.description || secondary.description,
    estimatedValue: primary.estimatedValue || secondary.estimatedValue,
    providerExisting: primary.providerExisting || secondary.providerExisting,
    potensiUnit: Math.max(primary.potensiUnit, secondary.potensiUnit),
    timeline: [
      ...(primary.timeline || []),
      ...(secondary.timeline || []),
    ],
    documents: [
      ...(primary.documents || []),
      ...(secondary.documents || []),
    ],
    answers: {
      ...(secondary.answers || {}),
      ...(primary.answers || {}),
    },
  };
}
