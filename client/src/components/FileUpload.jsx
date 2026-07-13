import { useState, useRef } from 'react';
import { UploadCloud, File as FileIcon, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/axios';
import { cn } from '../utils/cn';

export default function FileUpload({
  onUploadSuccess,
  label = 'Upload file',
  accept = 'image/*, .pdf, .doc, .docx',
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
              ? 'border-slate-400 bg-slate-100'
              : 'border-slate-200 bg-slate-50/80 hover:border-slate-300 hover:bg-slate-50'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadCloud
            className={cn(
              'mb-3 h-9 w-9 transition-colors',
              isDragging ? 'text-slate-700' : 'text-slate-400'
            )}
            strokeWidth={1.5}
          />
          <p className="mb-1 text-center text-[13px] font-medium text-slate-700">
            Drag & drop your file here
          </p>
          <p className="text-center text-[12px] font-normal text-slate-400">
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
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50">
                <FileIcon className="h-4.5 w-4.5 text-slate-500" strokeWidth={1.75} />
              </div>
              <div className="overflow-hidden">
                <p className="truncate text-[13px] font-medium text-slate-900">{file.name}</p>
                <p className="text-[12px] font-normal text-slate-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>

            {!uploadedUrl && !isUploading && (
              <button
                type="button"
                onClick={clearFile}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
                title="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {uploadedUrl ? (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 py-2.5 text-[13px] font-medium text-emerald-700">
              <CheckCircle className="h-4 w-4" />
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
