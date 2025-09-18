'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DocumentCard } from './document-card';
import { SearchAndFilter } from './search-and-filter';

interface DocumentType {
  _id: string;
  title: string;
  language: 'en' | 'ar';
  uploadDate: string;
  items: Array<{
    ruleId: string;
    docRef: string;
    textEn: string;
    textAr: string;
    status: 'yes' | 'no' | 'pending';
    category: string;
    parent: string | null;
    parentText?: string;
    version: number;
    changes: Array<{
      date: string;
      previousText: string;
      newText: string;
    }>;
  }>;
  archived?: boolean;
}

interface DashboardClientProps {
  initialDocuments: DocumentType[];
  totalDocuments: number;
}

export function DashboardClient({ initialDocuments, totalDocuments }: DashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [documents] = useState(initialDocuments);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const updateUrlParams = (
    search: string = searchParams.get('search') ?? '',
    status: string = searchParams.get('status') ?? 'all',
    sort: string = searchParams.get('sort') ?? 'date-desc'
  ) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status !== 'all') params.set('status', status);
    if (sort !== 'date-desc') params.set('sort', sort);
    
    const queryString = params.toString();
    router.push(`/dashboard${queryString ? `?${queryString}` : ''}`);
  };

  const handleSearch = (search: string) => {
    updateUrlParams(search, searchParams.get('status') ?? 'all', searchParams.get('sort') ?? 'date-desc');
  };

  const handleFilterChange = (status: string) => {
    updateUrlParams(searchParams.get('search') ?? '', status, searchParams.get('sort') ?? 'date-desc');
  };

  const handleSortChange = (sort: string) => {
    updateUrlParams(searchParams.get('search') ?? '', searchParams.get('status') ?? 'all', sort);
  };

  const handleDocumentSelect = (documentId: string, selected: boolean) => {
    setSelectedDocuments(prev => 
      selected 
        ? [...prev, documentId]
        : prev.filter(id => id !== documentId)
    );
  };

  const handleBatchExport = async (documentIds: string[]) => {
    try {
      // Batch export logic handled by BatchExport component
      console.log('Exporting documents:', documentIds);
      setSelectedDocuments([]);
    } catch (error) {
      setError(error as Error);
    }
  };

  const handleDocumentDelete = (documentId: string) => {
    setSelectedDocuments(prev => prev.filter(id => id !== documentId));
    // Document deletion would be handled by server action
    console.log('Delete document:', documentId);
  };

  const handleDocumentArchive = (documentId: string) => {
    // Document archiving would be handled by server action
    console.log('Archive document:', documentId);
  };

  if (error) {
    return (
      <div className="text-center py-10 text-red-600">
        Error: {error.message}
        <button 
          onClick={() => setError(null)}
          className="ml-2 px-3 py-1 bg-red-100 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SearchAndFilter
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
        onBatchExport={handleBatchExport}
        totalDocuments={totalDocuments}
        selectedDocuments={selectedDocuments}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => (
          <DocumentCard 
            key={doc._id.toString()} 
            document={doc}
            isSelected={selectedDocuments.includes(doc._id)}
            onSelect={handleDocumentSelect}
            onDelete={() => handleDocumentDelete(doc._id)}
            onArchive={() => handleDocumentArchive(doc._id)}
          />
        ))}
        {documents.length === 0 && (
          <div className="col-span-full text-center py-10 text-muted-foreground">
            No documents found
          </div>
        )}
      </div>
    </div>
  );
}
