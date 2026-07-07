export type DomainEvent =
  | {
      type: 'PROSPECT_CONVERTED';
      prospectId: string;
      projectId: string;
      projectName: string;
      timestamp: string;
    }
  | {
      type: 'PROJECT_WON';
      projectId: string;
      projectName: string;
      contractValue: number;
      timestamp: string;
    }
  | {
      type: 'PROJECT_DELETED';
      projectId: string;
      projectName: string;
      sourceProspectId?: string;
      timestamp: string;
    }
  | {
      type: 'PROSPECT_DELETED';
      prospectId: string;
      cascadeProjectId?: string;
      timestamp: string;
    }
  | {
      type: 'PROCUREMENT_DELETED';
      procurementId: string;
      projectId?: string;
      timestamp: string;
    };

/** Helper to stamp current ISO timestamp */
export function now(): string {
  return new Date().toISOString();
}
