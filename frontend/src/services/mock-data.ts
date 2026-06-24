// Mock data for Kinetic CRM demo

import type { Prospect, Project, ApprovalItem, TimelineEvent, Customer } from '../types/domain';

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'C001', name: 'PT. Telkom Indonesia Tbk.', code: 'TELKOM', type: 'bumn', city: 'Bandung', npwp: '01.234.567.8-091.000', picName: 'Budi Santoso', picPosition: 'Procurement Manager', picPhone: '0812-3456-7890' },
  { id: 'C002', name: 'PT. Telekom Nusantara', code: 'TELKON', type: 'bumn', city: 'Jakarta Selatan', npwp: '02.345.678.9-092.001', picName: 'Siti Aminah', picPosition: 'IT Director', picPhone: '0813-4567-8901' },
  { id: 'C003', name: 'Energi Bangsa Corp', code: 'EBC', type: 'swasta', city: 'Jakarta Pusat', picName: 'Rizky Pratama', picPosition: 'CEO', picPhone: '0814-5678-9012' },
  { id: 'C004', name: 'Secure City Group', code: 'SCG', type: 'swasta', city: 'Jakarta Timur', picName: 'Dian Permata', picPosition: 'Security Manager', picPhone: '0815-6789-0123' },
  { id: 'C005', name: 'Bank Artha Graha', code: 'BAG', type: 'swasta', city: 'Jakarta Barat', npwp: '03.456.789.0-093.002', picName: 'Hendra Gunawan', picPosition: 'Finance Director', picPhone: '0816-7890-1234' },
  { id: 'C006', name: 'Pemerintah Provinsi DKI Jakarta', code: 'PEMDKI', type: 'pemerintah', city: 'Jakarta Pusat', picName: 'Bambang Sutejo', picPosition: 'Kepala Dinas', picPhone: '021-1234567' },
  { id: 'C007', name: 'Global Tech Solutions', code: 'GTS', type: 'asing', city: 'Jakarta Selatan', npwp: '04.567.890.1-094.003', picName: 'John Smith', picPosition: 'Regional Manager', picPhone: '0817-8901-2345' },
];

export const INITIAL_PROSPECTS: Prospect[] = [
  { id: '1', name: 'Modernization of Data Center Jakarta', client: 'PT. Telekom Nusantara', customerId: 'C002', customerType: 'existing', status: 'Potensial', prospectType: 'potensial', potensiUnit: 3, author: 'Andi Wijaya', date: 'Oct 24, 2023', estimatedValue: 1250000000, description: 'Pengadaan infrastruktur server modular untuk perluasan kapasitas regional base DC Jakarta.', branch: 'Jakarta Pusat' },
  { id: '2', name: 'Supply of Industrial High-Voltage Cables', client: 'Energi Bangsa Corp', customerId: 'C003', customerType: 'existing', status: 'Approved', potensiUnit: 5, author: 'Siti Aminah', date: 'Oct 22, 2023', estimatedValue: 3400000000, description: 'Pengadaan kabel transmisi tegangan tinggi untuk gardu induk Sumatera Selatan.', branch: 'Surabaya' },
  { id: '3', name: 'Surveillance System Implementation Phase 2', client: 'Secure City Group', customerId: 'C004', customerType: 'existing', status: 'Waiting PM', potensiUnit: 2, author: 'Budi Santoso', date: 'Oct 21, 2023', estimatedValue: 850000000, description: 'Instalasi pemantauan cerdas dengan IP camera berbasis AI di area komersial.', branch: 'Jakarta Selatan' },
  { id: '4', name: 'Cloud Infrastructure Migration Strategy', client: 'Bank Artha Graha', customerId: 'C005', customerType: 'existing', status: 'Revision', potensiUnit: 1, author: 'Rina Kartika', date: 'Oct 19, 2023', estimatedValue: 1800000000, description: 'Consulting dan restrukturisasi database on-premise ke multi-cloud architecture.', branch: 'Jakarta Barat' },
  { id: '5', name: 'Solar Panel Installation - North Branch', client: 'Lestari Eco Farms', customerType: 'new', status: 'Non Potensial', prospectType: 'non_potensial', potensiUnit: 0, author: 'Andi Wijaya', date: 'Oct 18, 2023', estimatedValue: 950000000, branch: 'Bandung', customerData: { id: 'new-1', name: 'Lestari Eco Farms', code: 'LEF', type: 'swasta', city: 'Bandung', picName: 'Dewi Lestari', picPosition: 'Owner', picPhone: '0821-1234-5678', isNew: true, needsVerification: true } },
  { id: '6', name: 'Enterprise Firewall Upgrade - Global', client: 'Defense Tech Solutions', status: 'Approved', potensiUnit: 4, author: 'Budi Santoso', date: 'Oct 15, 2023', estimatedValue: 600000000, branch: 'Jakarta Pusat' },
  { id: '7', name: 'Network Optimization Project v3.0', client: 'Global Logistics Inc.', status: 'Waiting PM', potensiUnit: 2, author: 'Rina Kartika', date: 'Oct 14, 2023', estimatedValue: 1100000000, branch: 'Makassar' },
  { id: '8', name: 'Warehouse Automation Consultation', client: 'Express Delivery Hub', status: 'Non Potensial', prospectType: 'non_potensial', potensiUnit: 0, author: 'Siti Aminah', date: 'Oct 12, 2023', estimatedValue: 500000000, branch: 'Surabaya' },
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'PR-2025-001',
    code: 'PR-2025-001',
    name: 'Pembangunan Infrastruktur Data Center - Tahap II',
    client: 'PT. Telkom Indonesia Tbk.',
    status: 'LPHS/SIOS',
    phase: 'LPHS/SIOS',
    location: 'Gatot Subroto, Jakarta',
    author: 'Bambang Sutejo',
    date: 'Feb 24, 2025',
    progress: 65,
    estimatedValue: 4250000000,
    type: 'Tender',
    deadlineTender: '2026-06-25',
    pricing: {
      value: 4250000000,
      margin: 18.4,
      note: 'Harga penawaran ini sudah termasuk biaya perizinan lingkungan di wilayah Gatot Subroto, koordinasi ormas lokal, dan contingency plan.',
      referenceUrl: 'https://kinetic.sharepoint.com/projects/prj-2025-001/internal-calc'
    },
    winnerDetails: {
      outcome: null
    }
  },
  {
    id: 'PR-2025-002',
    code: 'PRJ-2024-0892',
    name: 'Pembangunan Infrastruktur FTTH - Cluster Menteng 2',
    client: 'PT. Telekom Nusantara',
    status: 'Input Harga',
    phase: 'Harga',
    location: 'Menteng, Jakarta Pusat, DKI Jakarta',
    author: 'Alex BranchManager',
    date: 'Aug 14, 2024',
    progress: 80,
    estimatedValue: 1250000000,
    type: 'Tender',
    deadlineTender: '2026-06-30',
    pricing: {
      value: 1250000000,
      margin: 12.5,
      note: 'Harga penawaran ini sudah termasuk biaya perizinan lingkungan di wilayah Menteng dan biaya koordinasi ormas lokal selama masa pembangunan 4 bulan.',
      referenceUrl: 'https://kinetic.sharepoint.com/projects/prj-2024-0892/internal-calc'
    },
    winnerDetails: {
      outcome: null
    }
  },
  {
    id: 'PR-2025-003',
    code: 'PRJ-2024-0089',
    name: 'Modernization of Terminal 3',
    client: 'PT. Angkasa Pura II',
    status: 'Executing',
    phase: 'Overview',
    location: 'Cengkareng, Tangerang',
    author: 'John Doe',
    date: 'Jan 10, 2024',
    progress: 95,
    estimatedValue: 142500000000,
    type: 'Tender',
    deadlineTender: '2026-05-30',
    winnerDetails: {
      outcome: 'menang',
      contractValue: 138200000000,
      startDate: '2024-02-01',
      duration: 360
    }
  },
  {
    id: 'PR-2025-004',
    code: 'PROJ-03h',
    name: 'Infrastructure Expansion - Phase 4',
    client: 'Global Link Tech',
    status: 'Target Delivery',
    phase: 'Target Delivery',
    location: 'Jakarta Logistics Hub',
    author: 'Alex Rivera',
    date: 'May 12, 2023',
    progress: 90,
    estimatedValue: 1450000,
    type: 'Prospecting',
    winnerDetails: {
      outcome: 'menang',
      contractValue: 1450000
    }
  }
];

export const INITIAL_APPROVALS: ApprovalItem[] = [
  // Prospek Approvals
  { id: 'app-1', ref: 'PR-2023-08-001', name: 'Budi Pratama', branch: 'Jakarta Central (HQ)', waitingSince: '3 days 4h ago', slaStatus: 'Overdue', type: 'Prospek', client: 'PT. Telekom Nusantara' },
  { id: 'app-2', ref: 'PR-2023-08-005', name: 'Siti Mulyani', branch: 'Surabaya Timur', waitingSince: '18h 22m ago', slaStatus: 'Near Deadline', type: 'Prospek', client: 'Energi Bangsa Corp' },
  { id: 'app-3', ref: 'PR-2023-08-012', name: 'Dedi Arianto', branch: 'Bandung Utara', waitingSince: '2h 15m ago', slaStatus: 'Normal', type: 'Prospek', client: 'Secure City Group' },
  
  // RKS Approvals
  { id: 'app-4', ref: 'RKS-88902-B', name: 'Maintenance Tower IX - Fase 2', branch: 'Medan Belawan', waitingSince: '4 days 12h ago', slaStatus: 'Overdue', type: 'RKS', client: 'PT. Telkom Indonesia' },
  { id: 'app-5', ref: 'RKS-89011-A', name: 'Pengadaan AC Central Lobby', branch: 'Makassar Center', waitingSince: '5h 30m ago', slaStatus: 'Normal', type: 'RKS', client: 'PT. Angkasa Pura' },
  
  // LPHS Approvals
  { id: 'app-6', ref: 'SURV-902-B', name: 'Site K-902 Balikpapan', branch: 'Balikpapan Base', waitingSince: '1d 6h ago', slaStatus: 'Near Deadline', type: 'LPHS', client: 'Balikpapan Offsh.' }
];

export const INITIAL_TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: 'evt-1',
    title: 'Final Phase Approval Granted',
    actor: 'Anies Wijaya',
    role: 'Regional Director - West Division',
    time: '10:45 AM (Hari ini)',
    type: 'approve',
    description: '"The budget reconciliation matches the operational requirements. Proceeding to execution stage."'
  },
  {
    id: 'evt-2',
    title: 'Project Status Changed',
    actor: 'System Automator',
    role: 'Triggered by Approval Event #882',
    time: '09:12 AM (Hari ini)',
    type: 'status_change',
    prevVal: 'Pending Review',
    newVal: 'Active Execution'
  },
  {
    id: 'evt-3',
    title: 'Technical Blueprint v2.4 Uploaded',
    actor: 'Rina Permata',
    role: 'Lead Architect - Surabaya Branch',
    time: 'Yesterday, 04:30 PM',
    type: 'upload',
    fileName: 'blueprint_proj_03i_final.pdf',
    fileSize: '4.2 MB'
  },
  {
    id: 'evt-4',
    title: 'Budget Line Item Revision',
    actor: 'Budi Santoso',
    role: 'Branch Manager - Jakarta',
    time: 'Yesterday, 11:15 AM',
    type: 'revision',
    prevVal: 'Rp 1.420.000.000',
    newVal: 'Rp 1.585.000.000',
    description: 'Adjustment for unexpected soil condition variations in sector 4B.'
  },
  {
    id: 'evt-5',
    title: 'Stakeholder Memo Added',
    actor: 'Sari Putri',
    role: 'Public Relations - Jakarta',
    time: 'Yesterday, 08:45 AM',
    type: 'comment',
    description: '"Meeting with local community leaders concluded successfully. No major objections recorded for the new access road."'
  }
];

export const COMPETITORS = [
  { id: '1', name: 'Infrastructure Alpha', estPrice: 142500000000, advantages: ['Fast-track Delivery', 'Legacy Support'], notes: 'Strong political ties with the regional aviation authority.' },
  { id: '2', name: 'BuildCore Systems', estPrice: 138200000000, advantages: ['BIM Integration'], notes: 'Price leader but lacks heavy civil experience.' },
];