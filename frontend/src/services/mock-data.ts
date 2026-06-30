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
    { id: '1', name: 'Modernization of Data Center Jakarta', client: 'PT. Telekom Nusantara', customerId: 'C002', customerType: 'existing', status: 'Potensial', prospectType: 'potensial', potensiUnit: 3, author: 'Ahmad Sulistyo', date: 'Oct 24, 2023', estimatedValue: 1250000000, description: 'Pengadaan infrastruktur server modular untuk perluasan kapasitas regional base DC Jakarta.', branch: 'Jakarta Pusat', createdByUserId: '1' },
    { id: '2', name: 'Supply of Industrial High-Voltage Cables', client: 'Energi Bangsa Corp', customerId: 'C003', customerType: 'existing', status: 'Approved', potensiUnit: 5, author: 'Siti Rahmawati', date: 'Oct 22, 2023', estimatedValue: 3400000000, description: 'Pengadaan kabel transmisi tegangan tinggi untuk gardu induk Sumatera Selatan.', branch: 'Cabang Bandung', createdByUserId: '5' },
    { id: '3', name: 'Surveillance System Implementation Phase 2', client: 'Secure City Group', customerId: 'C004', customerType: 'existing', status: 'Waiting PM', potensiUnit: 2, author: 'Bambang Permadi', date: 'Oct 21, 2023', estimatedValue: 850000000, description: 'Instalasi pemantauan cerdas dengan IP camera berbasis AI di area komersial.', branch: 'Project Management', createdByUserId: '2' },
    { id: '4', name: 'Cloud Infrastructure Migration Strategy', client: 'Bank Artha Graha', customerId: 'C005', customerType: 'existing', status: 'Revision', potensiUnit: 1, author: 'Rina Marlina', date: 'Oct 19, 2023', estimatedValue: 1800000000, description: 'Consulting dan restrukturisasi database on-premise ke multi-cloud architecture.', branch: 'Operations Dept', createdByUserId: '3' },
    { id: '5', name: 'Solar Panel Installation - North Branch', client: 'Lestari Eco Farms', customerType: 'new', status: 'Non Potensial', prospectType: 'non_potensial', potensiUnit: 0, author: 'Ahmad Sulistyo', date: 'Oct 18, 2023', estimatedValue: 950000000, branch: 'Jakarta Pusat', customerData: { id: 'new-1', name: 'Lestari Eco Farms', code: 'LEF', type: 'swasta', city: 'Bandung', picName: 'Dewi Lestari', picPosition: 'Owner', picPhone: '0821-1234-5678', isNew: true, needsVerification: true }, createdByUserId: '1' },
    { id: '6', name: 'Enterprise Firewall Upgrade - Global', client: 'Defense Tech Solutions', status: 'Approved', potensiUnit: 4, author: 'Bambang Permadi', date: 'Oct 15, 2023', estimatedValue: 600000000, branch: 'Project Management', createdByUserId: '2' },
    { id: '7', name: 'Network Optimization Project v3.0', client: 'Global Logistics Inc.', status: 'Waiting PM', potensiUnit: 2, author: 'Rina Marlina', date: 'Oct 14, 2023', estimatedValue: 1100000000, branch: 'Operations Dept', createdByUserId: '3' },
    { id: '8', name: 'Warehouse Automation Consultation', client: 'Express Delivery Hub', status: 'Non Potensial', prospectType: 'non_potensial', potensiUnit: 0, author: 'Siti Rahmawati', date: 'Oct 12, 2023', estimatedValue: 500000000, branch: 'Cabang Bandung', createdByUserId: '5' },
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
    author: 'Bambang Permadi',
    date: 'Feb 24, 2025',
    progress: 65,
    estimatedValue: 4250000000,
    type: 'Tender',
    deadlineTender: '2026-06-25',
    createdByUserId: '2',
    pricing: {
      value: 4250000000,
      margin: 18.4,
      note: 'Harga penawaran ini sudah termasuk biaya perizinan lingkungan di wilayah Gatot Subroto, koordinasi ormas lokal, dan contingency plan.',
      referenceUrl: 'https://kinetic.sharepoint.com/projects/prj-2025-001/internal-calc'
    },
    winnerDetails: {
      outcome: null
    },
    rks: {
      nomorTender: 'TND/2025/HQ/0042',
      namaTender: 'Pembangunan Infrastruktur Data Center - Tahap II',
      deadlineTender: '2026-06-25',
      aanwijzing: 'Ya, Terjadwal',
      workLocation: 'Gatot Subroto, Jakarta',
      mainScope: 'Pembangunan infrastruktur data center terintegrasi meliputi instalasi kelistrikan, rack server, unit pendingin, dan fire suppression system.',
      additionalNotes: 'Perhatikan persyaratan sertifikasi TKDN minimal 40% untuk seluruh perangkat.',
      uploadedFiles: [
        { name: 'RKS_Technical_Draft_v1.pdf', size: '4.2 MB', time: '2 mins ago' },
        { name: 'BOQ_Analysis_v3.xlsx', size: '1.8 MB', time: '1 day ago' },
      ]
    },
    lphs: {
      lphsFileName: 'LPHS_Telkom_v2.pdf',
      lphsFileSize: '3.4 MB',
      lphsExternalUrl: 'https://docs.google.com/document/d/abc123',
      siosFileName: 'SIOS_Infra_TahapII.pdf',
      siosFileSize: '1.2 MB',
      selectedDepartments: ['01', '02'],
      departmentsLocked: true,
      pmStatus: 'approved',
      pmApprovedAt: '2025-03-10',
      mgmtStatus: 'pending',
      overallStatus: 'dept_review',
      submittedAt: '2025-03-08',
      departmentApprovals: [
        { departmentId: '01', departmentName: 'IT Infrastructure', status: 'approved', approverName: 'Budi Santoso', approvedAt: '2025-03-12', reviewNotes: 'Spesifikasi teknis sesuai standar.', revisionRound: 0, isTargetedRevision: false },
        { departmentId: '02', departmentName: 'Financial Audit', status: 'reviewing', approverName: undefined, revisionRound: 0, isTargetedRevision: false },
      ],
    },
    competitors: [
      { id: '1', name: 'Infrastructure Alpha', estPrice: 142500000000, advantages: ['Fast-track Delivery', 'Legacy Support'], notes: 'Strong political ties with the regional aviation authority.' },
      { id: '2', name: 'BuildCore Systems', estPrice: 138200000000, advantages: ['BIM Integration'], notes: 'Price leader but lacks heavy civil experience.' },
    ],
    timeline: [
      { id: 'evt-1', title: 'Proyek Dibuat', actor: 'Bambang Sutejo', role: 'Project Manager', time: 'Feb 24, 2025', type: 'submit' },
      { id: 'evt-2', title: 'RKS Disubmit', actor: 'Bambang Sutejo', role: 'Project Manager', time: 'Mar 1, 2025', type: 'submit', description: 'RKS berhasil dikirim ke tim review.' },
      { id: 'evt-3', title: 'RKS Direview', actor: 'Anies Wijaya', role: 'Regional Director', time: 'Mar 5, 2025', type: 'approve', description: 'Review RKS selesai, lanjut ke tahap LPHS/SIOS.' },
      { id: 'evt-4', title: 'Status Berubah', actor: 'System', role: 'System', time: 'Mar 5, 2025', type: 'status_change', prevVal: 'RKS', newVal: 'LPHS/SIOS' },
    ],
    documents: [
      {
        key: 'RKS', label: 'Rencana Kerja & Syarat-Syarat', icon: 'RKS', color: 'bg-primary/10 text-primary',
        documents: [
          { id: 'd1', name: 'RKS_Tahap_1_Pondasi_Final.pdf', size: '4.2 MB', uploadDate: '2025-10-12', uploader: 'Ahmad Subarjo', version: 'v2.4', icon: 'picture_as_pdf', iconColor: 'text-red-500' },
          { id: 'd2', name: 'RKS_BOQ_v2.xlsx', size: '1.8 MB', uploadDate: '2025-10-10', uploader: 'Deni Saputra', version: 'v2.0', icon: 'table_chart', iconColor: 'text-emerald-500' },
        ]
      },
      {
        key: 'LPHS', label: 'Laporan Penilaian Harga Satuan', icon: 'LPHS', color: 'bg-teal-50 text-teal-600',
        documents: []
      },
      {
        key: 'SIOS', label: 'Surat Instruksi Operasional Site', icon: 'SIOS', color: 'bg-purple-50 text-purple-600',
        documents: []
      },
      {
        key: 'Harga', label: 'Dokumen Penawaran Harga Final', icon: 'HRG', color: 'bg-amber-50 text-amber-600',
        documents: []
      },
      {
        key: 'MISC', label: 'Dokumen Lampiran & Foto Lapangan', icon: 'MISC', color: 'bg-sky-50 text-sky-600',
        documents: [
          { id: 'd3', name: 'Site_Photos_Sept_2023.zip', size: '128 MB', uploadDate: '2025-09-28', uploader: 'Siti Aminah', version: 'v1.0', icon: 'folder_zip', iconColor: 'text-sky-500' },
        ]
      },
    ],
  },
  {
    id: 'PR-2025-002',
    code: 'PRJ-2024-0892',
    name: 'Pembangunan Infrastruktur FTTH - Cluster Menteng 2',
    client: 'PT. Telekom Nusantara',
    status: 'Input Harga',
    phase: 'Harga',
    location: 'Menteng, Jakarta Pusat, DKI Jakarta',
    author: 'Ahmad Sulistyo',
    date: 'Aug 14, 2024',
    progress: 80,
    estimatedValue: 1250000000,
    type: 'Tender',
    deadlineTender: '2026-06-30',
    createdByUserId: '1',
    pricing: {
      value: 1250000000,
      margin: 12.5,
      note: 'Harga penawaran ini sudah termasuk biaya perizinan lingkungan di wilayah Menteng dan biaya koordinasi ormas lokal selama masa pembangunan 4 bulan.',
      referenceUrl: 'https://kinetic.sharepoint.com/projects/prj-2024-0892/internal-calc'
    },
    winnerDetails: {
      outcome: null
    },
    rks: {
      nomorTender: 'FTTH/2024/MTR/0018',
      namaTender: 'Pembangunan Infrastruktur FTTH - Cluster Menteng 2',
      deadlineTender: '2026-06-30',
      aanwijzing: 'Ya, Terjadwal',
      workLocation: 'Menteng, Jakarta Pusat, DKI Jakarta',
      mainScope: 'Penggelaran kabel fiber optik sepanjang 12 km mencakup 3.500 rumah, instalasi ODP, dan koneksi last-mile.',
      additionalNotes: '',
      uploadedFiles: [
        { name: 'RKS_FTTH_Menteng_v2.pdf', size: '3.1 MB', time: '2 weeks ago' },
      ]
    },
    lphs: {
      lphsFileName: 'LPHS_FTTH_Menteng.pdf',
      lphsFileSize: '2.8 MB',
      siosFileName: 'SIOS_Menteng.pdf',
      siosFileSize: '0.9 MB',
      selectedDepartments: ['01', '02'],
      departmentsLocked: true,
      pmStatus: 'approved',
      pmApprovedAt: '2024-08-28',
      mgmtStatus: 'approved',
      mgmtApprovedAt: '2024-09-03',
      overallStatus: 'approved',
      submittedAt: '2024-08-22',
      finalApprovedAt: '2024-09-03',
      departmentApprovals: [
        { departmentId: '01', departmentName: 'IT Infrastructure', status: 'approved', approverName: 'Budi Santoso', approvedAt: '2024-08-30', reviewNotes: 'OK', revisionRound: 0, isTargetedRevision: false },
        { departmentId: '02', departmentName: 'Financial Audit', status: 'approved', approverName: 'Siti Aminah', approvedAt: '2024-08-30', reviewNotes: 'Sesuai anggaran.', revisionRound: 0, isTargetedRevision: false },
      ],
    },
    competitors: [
      { id: '1', name: 'PT. Solusi Fiber Nusantara', estPrice: 1320000000, advantages: ['Harga kompetitif', 'Cakupan luas'], notes: 'Kompetitor utama, sudah memiliki infrastruktur di area sekitar.' },
      { id: '2', name: 'NetConnect Pro', estPrice: 1185000000, advantages: ['Teknologi terbaru'], notes: 'Pendatang baru dengan teknologi GPON terbaru.' },
    ],
    timeline: [
      { id: 'evt-5', title: 'Proyek Dibuat', actor: 'Alex BranchManager', role: 'Branch Manager', time: 'Aug 14, 2024', type: 'submit' },
      { id: 'evt-6', title: 'RKS Disubmit', actor: 'Alex BranchManager', role: 'Branch Manager', time: 'Aug 20, 2024', type: 'submit' },
      { id: 'evt-7', title: 'RKS Direview & Disetujui', actor: 'Anies Wijaya', role: 'Regional Director', time: 'Aug 25, 2024', type: 'approve' },
      { id: 'evt-8', title: 'LPHS/SIOS Selesai', actor: 'Deni Saputra', role: 'Procurement', time: 'Sep 5, 2024', type: 'approve' },
      { id: 'evt-9', title: 'Status Berubah', actor: 'System', role: 'System', time: 'Sep 5, 2024', type: 'status_change', prevVal: 'LPHS/SIOS', newVal: 'Input Harga' },
    ],
    documents: [
      { key: 'RKS', label: 'Rencana Kerja & Syarat-Syarat', icon: 'RKS', color: 'bg-primary/10 text-primary', documents: [] },
      { key: 'LPHS', label: 'Laporan Penilaian Harga Satuan', icon: 'LPHS', color: 'bg-teal-50 text-teal-600', documents: [] },
      { key: 'SIOS', label: 'Surat Instruksi Operasional Site', icon: 'SIOS', color: 'bg-purple-50 text-purple-600', documents: [] },
      { key: 'Harga', label: 'Dokumen Penawaran Harga Final', icon: 'HRG', color: 'bg-amber-50 text-amber-600', documents: [] },
      { key: 'MISC', label: 'Dokumen Lampiran & Foto Lapangan', icon: 'MISC', color: 'bg-sky-50 text-sky-600', documents: [] },
    ],
  },
  {
    id: 'PR-2025-003',
    code: 'PRJ-2024-0089',
    name: 'Modernization of Terminal 3',
    client: 'PT. Angkasa Pura II',
    status: 'Executing',
    phase: 'Executing',
    location: 'Cengkareng, Tangerang',
    author: 'Doni Wahyudi',
    date: 'Jan 10, 2024',
    progress: 95,
    estimatedValue: 142500000000,
    type: 'Tender',
    deadlineTender: '2026-05-30',
    createdByUserId: '4',
    pricing: {
      value: 142500000000,
      margin: 15.2,
      note: 'Harga penawaran final setelah negosiasi kontrak.',
    },
    winnerDetails: {
      outcome: 'menang',
      contractValue: 138200000000,
      startDate: '2024-02-01',
      duration: 360,
    },
    delivery: {
      startDate: '2024-02-01',
      endDate: '2025-01-26',
      note: 'Pengiriman material secara bertahap sesuai jadwal kontrak.',
    },
    rks: {
      nomorTender: 'AP2/2024/T3/001',
      namaTender: 'Modernization of Terminal 3',
      deadlineTender: '2026-05-30',
      aanwijzing: 'Ya, Terjadwal',
      workLocation: 'Cengkareng, Tangerang',
      mainScope: 'Modernisasi terminal 3 meliputi perluasan area check-in, pemasangan AVSEC baru, dan pembaruan sistem HVAC.',
      additionalNotes: 'Proyek prioritas nasional, wajib selesai sebelum Q2 2025.',
      uploadedFiles: [
        { name: 'RKS_Terminal3_Final.pdf', size: '8.5 MB', time: 'Jan 5, 2024' },
      ],
    },
    lphs: {
      lphsFileName: 'LPHS_Terminal3.pdf',
      lphsFileSize: '5.1 MB',
      siosFileName: 'SIOS_Terminal3.pdf',
      siosFileSize: '1.8 MB',
      selectedDepartments: ['01', '02'],
      departmentsLocked: true,
      pmStatus: 'approved',
      pmApprovedAt: '2024-01-19',
      mgmtStatus: 'approved',
      mgmtApprovedAt: '2024-01-21',
      overallStatus: 'approved',
      submittedAt: '2024-01-17',
      finalApprovedAt: '2024-01-21',
      departmentApprovals: [
        { departmentId: '01', departmentName: 'IT Infrastructure', status: 'approved', approverName: 'Budi Santoso', approvedAt: '2024-01-20', reviewNotes: 'Spesifikasi sesuai.', revisionRound: 0, isTargetedRevision: false },
        { departmentId: '02', departmentName: 'Financial Audit', status: 'approved', approverName: 'Siti Aminah', approvedAt: '2024-01-20', reviewNotes: 'Anggaran OK.', revisionRound: 0, isTargetedRevision: false },
      ],
    },
    competitors: [
      { id: '1', name: 'Infrastructure Alpha', estPrice: 142500000000, advantages: ['Fast-track Delivery', 'Legacy Support'], notes: 'Strong political ties.' },
      { id: '2', name: 'BuildCore Systems', estPrice: 138200000000, advantages: ['BIM Integration'], notes: 'Price leader.' },
      { id: '3', name: 'Mega Konstruksi Perkasa', estPrice: 145000000000, advantages: ['Peralatan lengkap'], notes: 'Memiliki pengalaman proyek serupa di bandara.' },
    ],
    timeline: [
      { id: 'evt-10', title: 'Proyek Dibuat', actor: 'John Doe', role: 'Project Manager', time: 'Jan 10, 2024', type: 'submit' },
      { id: 'evt-11', title: 'RKS Disubmit', actor: 'John Doe', role: 'Project Manager', time: 'Jan 15, 2024', type: 'submit' },
      { id: 'evt-12', title: 'RKS Lolos Review', actor: 'Anies Wijaya', role: 'Regional Director', time: 'Jan 18, 2024', type: 'approve' },
      { id: 'evt-13', title: 'LPHS/SIOS Selesai', actor: 'Deni Saputra', role: 'Procurement', time: 'Jan 22, 2024', type: 'approve' },
      { id: 'evt-14', title: 'Proyek Menang Tender', actor: 'John Doe', role: 'Project Manager', time: 'Jan 28, 2024', type: 'status_change', prevVal: 'Input Harga', newVal: 'Pemenang' },
      { id: 'evt-15', title: 'Kontrak Ditandatangani', actor: 'John Doe', role: 'Project Manager', time: 'Feb 1, 2024', type: 'approve', description: 'Nilai kontrak final Rp 138.200.000.000' },
      { id: 'evt-16', title: 'Target Delivery Dimulai', actor: 'John Doe', role: 'Project Manager', time: 'Feb 1, 2024', type: 'status_change', prevVal: 'Pemenang', newVal: 'Target Delivery' },
      { id: 'evt-17', title: 'Progres 50%', actor: 'Rina Amalia', role: 'Site Engineer', time: 'Jul 15, 2024', type: 'comment', description: 'Progres pembangunan mencapai 50%, sesuai jadwal.' },
      { id: 'evt-18', title: 'Progress 75%', actor: 'Rina Amalia', role: 'Site Engineer', time: 'Oct 30, 2024', type: 'comment', description: 'Struktur utama selesai, masuk tahap finishing.' },
      { id: 'evt-19', title: 'Dokumen QA Diunggah', actor: 'Rina Amalia', role: 'Site Engineer', time: 'Dec 15, 2024', type: 'upload', fileName: 'QA_Report_Q4_2024.pdf', fileSize: '2.3 MB' },
    ],
    documents: [
      { key: 'RKS', label: 'Rencana Kerja & Syarat-Syarat', icon: 'RKS', color: 'bg-primary/10 text-primary', documents: [
        { id: 'd1', name: 'RKS_Terminal3_Final.pdf', size: '8.5 MB', uploadDate: '2024-01-05', uploader: 'John Doe', version: 'v3.0', icon: 'picture_as_pdf', iconColor: 'text-red-500' },
      ]},
      { key: 'LPHS', label: 'Laporan Penilaian Harga Satuan', icon: 'LPHS', color: 'bg-teal-50 text-teal-600', documents: [
        { id: 'd2', name: 'LPHS_Analysis.xlsx', size: '2.1 MB', uploadDate: '2024-01-20', uploader: 'Deni Saputra', version: 'v1.2', icon: 'table_chart', iconColor: 'text-emerald-500' },
      ]},
      { key: 'SIOS', label: 'Surat Instruksi Operasional Site', icon: 'SIOS', color: 'bg-purple-50 text-purple-600', documents: [
        { id: 'd3', name: 'SIOS_Approval.pdf', size: '0.5 MB', uploadDate: '2024-02-01', uploader: 'Anies Wijaya', version: 'v1.0', icon: 'picture_as_pdf', iconColor: 'text-red-500' },
      ]},
      { key: 'Harga', label: 'Dokumen Penawaran Harga Final', icon: 'HRG', color: 'bg-amber-50 text-amber-600', documents: [
        { id: 'd4', name: 'Penawaran_Harga_Final.pdf', size: '3.2 MB', uploadDate: '2024-01-25', uploader: 'John Doe', version: 'v2.1', icon: 'picture_as_pdf', iconColor: 'text-red-500' },
      ]},
      { key: 'MISC', label: 'Dokumen Lampiran & Foto Lapangan', icon: 'MISC', color: 'bg-sky-50 text-sky-600', documents: [
        { id: 'd5', name: 'Site_Docs_Progress.zip', size: '256 MB', uploadDate: '2024-12-15', uploader: 'Rina Amalia', version: 'v4.0', icon: 'folder_zip', iconColor: 'text-sky-500' },
      ]},
    ],
  },
  {
    id: 'PR-2025-004',
    code: 'PROJ-03h',
    name: 'Infrastructure Expansion - Phase 4',
    client: 'Global Link Tech',
    status: 'Target Delivery',
    phase: 'Target Delivery',
    location: 'Jakarta Logistics Hub',
    author: 'Siti Rahmawati',
    date: 'May 12, 2023',
    progress: 90,
    estimatedValue: 1450000,
    type: 'Prospecting',
    createdByUserId: '5',
    winnerDetails: {
      outcome: 'menang',
      contractValue: 1450000
    },
    delivery: {
      startDate: '2023-06-01',
      endDate: '2023-11-30',
      note: 'Pengiriman material secara bertahap.',
    },
  },
];

export const INITIAL_APPROVALS: ApprovalItem[] = [
  // Prospek Approvals
  { id: 'app-1', ref: 'PR-2023-08-001', name: 'Surveillance System Implementation Phase 2', branch: 'Jakarta Selatan', waitingSince: '2026-06-23T08:00:00.000Z', slaStatus: 'Overdue', type: 'Prospek', client: 'Secure City Group', entityId: '3', entityType: 'prospect', assigneeUserId: '1' },
  { id: 'app-2', ref: 'PR-2023-08-005', name: 'Network Optimization Project v3.0', branch: 'Makassar', waitingSince: '2026-06-25T06:00:00.000Z', slaStatus: 'Near Deadline', type: 'Prospek', client: 'Global Logistics Inc.', entityId: '7', entityType: 'prospect', assigneeUserId: '3' },

  // RKS Approvals
  { id: 'app-4', ref: 'RKS-88902-B', name: 'Pembangunan Infrastruktur Data Center - Tahap II', branch: 'Jakarta Pusat', waitingSince: '2026-06-22T12:00:00.000Z', slaStatus: 'Overdue', type: 'RKS', client: 'PT. Telkom Indonesia Tbk.', entityId: 'PR-2025-001', entityType: 'project', assigneeUserId: '1' },
  { id: 'app-5', ref: 'RKS-89011-A', name: 'Pembangunan Infrastruktur FTTH - Cluster Menteng 2', branch: 'Jakarta Pusat', waitingSince: '2026-06-25T12:00:00.000Z', slaStatus: 'Normal', type: 'RKS', client: 'PT. Telekom Nusantara', entityId: 'PR-2025-002', entityType: 'project', assigneeUserId: '2' },

  // LPHS Approvals
  { id: 'app-6', ref: 'LPHS-PR-2025-001', name: 'Pembangunan Infrastruktur Data Center - Tahap II', branch: 'Jakarta Pusat', waitingSince: '2026-06-22T12:00:00.000Z', slaStatus: 'Near Deadline', type: 'LPHS', client: 'PT. Telkom Indonesia Tbk.', entityId: 'PR-2025-001', entityType: 'project', assigneeUserId: '1' },
  { id: 'app-7', ref: 'LPHS-PRJ-2024-0089', name: 'Modernization of Terminal 3', branch: 'Cengkareng, Tangerang', waitingSince: '2026-06-25T12:00:00.000Z', slaStatus: 'Normal', type: 'LPHS', client: 'PT. Angkasa Pura II', entityId: 'PR-2025-003', entityType: 'project', assigneeUserId: '5' },
  { id: 'app-8', ref: 'LPHS-PRJ-2024-0892', name: 'Pembangunan Infrastruktur FTTH - Cluster Menteng 2', branch: 'Jakarta Pusat', waitingSince: '2026-06-26T00:00:00.000Z', slaStatus: 'Normal', type: 'LPHS', client: 'PT. Telekom Nusantara', entityId: 'PR-2025-002', entityType: 'project', assigneeUserId: '2' }
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
