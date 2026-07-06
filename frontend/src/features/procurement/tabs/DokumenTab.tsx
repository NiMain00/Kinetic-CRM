import React, { useState } from 'react';
import type { DocGroup, DocumentEntry } from '@/types/domain';
import type { Procurement } from '@/types/domain/procurement';
import { useProcurementStore } from '../procurementStore';

interface Props {
  procurement: Procurement;
}

export default function DokumenTab({ procurement }: Props) {
  const updateDocuments = useProcurementStore((s) => s.updateDocuments);
  const [docGroups, setDocGroups] = useState<DocGroup[]>(
    procurement.documents || [],
  );

  const handleUpload = () => {
    const newDoc: DocumentEntry = {
      id: `doc-${Date.now()}`,
      name: `Dokumen ${(docGroups[0]?.documents?.length || 0) + 1}`,
      size: '0 KB',
      uploadDate: new Date().toLocaleDateString('id-ID'),
      uploader: procurement.createdBy,
      version: '1.0',
      icon: 'description',
      iconColor: 'text-info',
    };
    const updated = [...docGroups];
    if (updated.length === 0) {
      updated.push({
        key: 'umum',
        label: 'Dokumen Procurement',
        icon: 'folder',
        color: 'text-primary',
        documents: [newDoc],
      });
    } else {
      updated[0] = {
        ...updated[0],
        documents: [...(updated[0].documents || []), newDoc],
      };
    }
    setDocGroups(updated);
    updateDocuments(procurement.id, updated);
  };

  const allDocs = docGroups.flatMap((g) => g.documents || []);

  if (allDocs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="material-symbols-outlined text-5xl text-outline mb-4">
          description
        </span>
        <h3 className="font-heading-section text-base text-on-surface">
          Belum Ada Dokumen
        </h3>
        <p className="text-sm text-secondary mt-1">
          Upload dokumen procurement di sini.
        </p>
        <button
          onClick={handleUpload}
          className="mt-4 px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">upload</span>
          Upload Dokumen
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={handleUpload}
          className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">upload</span>
          Upload
        </button>
      </div>
      {docGroups.map((group) => (
        <div
          key={group.key}
          className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-6"
        >
          <h3 className="font-label-sm text-xs font-semibold text-on-surface mb-4">
            {group.label}
          </h3>
          <div className="space-y-2">
            {group.documents?.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-surface-container rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className={`material-symbols-outlined ${doc.iconColor}`}>
                    {doc.icon}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-on-surface">
                      {doc.name}
                    </p>
                    <p className="text-[10px] text-secondary">
                      {doc.size} · {doc.uploadDate}
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline text-[18px] cursor-pointer">
                  download
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
