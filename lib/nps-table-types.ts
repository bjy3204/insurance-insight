export type NpsBaseRow = { no: number; income: number; premium: number };
export type NpsOldAgeRow = NpsBaseRow & { year10: number; year15: number; year20: number; year25: number; year30: number; year35: number; year40: number };
export type NpsDisabilityRow = NpsBaseRow & { grade1: number; grade2: number; grade3: number; grade4Lump: number };
export type NpsSurvivorRow = NpsBaseRow & { under10: number; between10And20: number; year20: number };
export type NpsTables = {
  version: 1;
  effectiveMonth: string;
  sourceTitle: string;
  sourceUrl: string;
  downloadUrl: string;
  checksum: string;
  updatedAt: string;
  oldAge: NpsOldAgeRow[];
  disability: NpsDisabilityRow[];
  survivor: NpsSurvivorRow[];
};
