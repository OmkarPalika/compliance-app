export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  error?: string;
  data?: T;
}

export interface UploadResponse extends ApiResponse {
  documentId?: string;
  summary?: {
    totalRules: number;
    sections: number;
  };
}

export interface ProcessingStatus {
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress?: number;
  message?: string;
}
