import { useState, useRef } from 'react';
import { UploadCloud, File as FileIcon, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/axios';
import { cn } from '../utils/cn';

export default function FileUpload({
  onUploadSuccess,
  label = 'Upload file',
  accept = 'image/*, .pdf, .doc, .docx',
  /** Optional clinical scope — server validates care relationship */
  patientId,
  resourceType = 'general',
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files?.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (selectedFile) => {
    setFile(selectedFile);
    setUploadedUrl('');
  };

  const clearFile = () => {
    setFile(null);
    setUploadedUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadFile = async () => {
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    if (patientId) formData.append('patientId', patientId);
    if (resourceType) formData.append('resourceType', resourceType);

    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = res.data.data;
      // Cloudinary absolute URLs stay as-is; local paths are authenticated API routes
      const fileUrl = data.url.startsWith('http')
        ? data.url
        : `${import.meta.env.VITE_API_URL?.replace(/\/api\/v1\/?$/, '') || 'http://localhost:5001'}${data.url.startsWith('/') ? data.url : `/${data.url}`}`;

      setUploadedUrl(fileUrl);
      toast.success('File uploaded successfully');
      onUploadSuccess?.(fileUrl, data);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full">
      <p className="label mb-2">{label}</p>

      {!file ? (
        <div
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-8 transition-all',
            isDragging
              ? 'border-ink-faint bg-surface-subtle'
              : 'border-line bg-surface-subtle/80 hover:border-line-strong hover:bg-surface-subtle'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadCloud
            className={cn(
              'mb-3 h-9 w-9 transition-colors',
              isDragging ? 'text-ink-secondary' : 'text-ink-faint'
            )}
            strokeWidth={1.5}
          />
          <p className="mb-1 text-center text-sm font-medium text-ink-secondary">
            Drag & drop your file here
          </p>
          <p className="text-center text-xs font-normal text-ink-faint">
            or click to browse · PDF, images, documents
          </p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInput}
            className="hidden"
            accept={accept}
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line-soft bg-surface-subtle">
                <FileIcon className="h-4.5 w-4.5 text-ink-muted" strokeWidth={1.75} />
              </div>
              <div className="overflow-hidden">
                <p className="truncate text-sm font-medium text-ink">{file.name}</p>
                <p className="text-xs font-normal text-ink-faint">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>

            {!uploadedUrl && !isUploading && (
              <button
                type="button"
                onClick={clearFile}
                className="btn-icon btn-icon-danger"
                title="Remove file"
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {uploadedUrl ? (
            <div
              role="status"
              className="flex items-center justify-center gap-2 rounded-lg bg-success-soft py-2.5 text-sm font-medium text-success"
            >
              <CheckCircle className="h-4 w-4" aria-hidden />
              Upload complete
            </div>
          ) : (
            <button
              type="button"
              onClick={uploadFile}
              disabled={isUploading}
              className="btn btn-primary w-full py-2.5"
            >
              {isUploading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Uploading…
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />
                  Upload file
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
