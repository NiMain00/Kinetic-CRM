export interface InputOption {
  value: string;
  label: string;
  sort_order: number;
  is_active: boolean;
  color_hex?: string;
  metadata?: Record<string, string>;
}

export type InputConfigCategory = 'form' | 'filter' | 'sla' | 'workflow' | 'other';

export interface InputConfigGroup {
  id: string;
  key: string;
  name: string;
  description: string;
  category: InputConfigCategory;
  options: InputOption[];
  is_system: boolean;
}

export type InputConfigGroupKey =
  | 'customer_types'
  | 'project_types'
  | 'escalation_roles'
  | 'sla_entity_types'
  | 'sla_units'
  | 'prospect_filter_tabs'
  | 'pipeline_tabs'
  | 'account_statuses'
  | 'workflow_entity_tabs';
