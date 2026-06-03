export const uploadConfig = {
  maxFileSizeMb: Number(process.env.UPLOAD_MAX_FILE_SIZE_MB || 10),
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  allowedDocumentTypes: ['application/pdf', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  destinations: {
    images: 'uploads/images',
    videos: 'uploads/videos',
    documents: 'uploads/documents'
  }
};

export function getUploadLimitBytes() {
  return uploadConfig.maxFileSizeMb * 1024 * 1024;
}
