import multer from 'multer';

// Use memory storage for direct streaming to Orthanc without writing temporary files to disk
const storage = multer.memoryStorage();

export const uploadDicomFiles = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB per file
    files: 50,                   // Up to 50 files per examination batch
  },
});
