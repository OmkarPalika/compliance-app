export const UPLOAD_CONFIG = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['application/pdf'],
  allowedExtensions: ['.pdf'],
};

export function isValidFileType(file: File) {
  return UPLOAD_CONFIG.allowedTypes.includes(file.type);
}

export function isValidFileSize(file: File) {
  return file.size <= UPLOAD_CONFIG.maxSize;
}

export function getFileExtension(filename: string) {
  return filename.substring(filename.lastIndexOf('.')).toLowerCase();
}

export function isValidFileExtension(filename: string) {
  const ext = getFileExtension(filename);
  return UPLOAD_CONFIG.allowedExtensions.includes(ext);
}
