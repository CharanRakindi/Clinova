import { useState, useRef } from 'react';
import { UploadCloud, File as FileIcon, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/axios';
import { cn } from '../utils/cn';

export default function FileUpload({ onUploadSuccess, label = "Upload File", accept = "image/*, .pdf, .doc, .docx" }) {
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
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (selectedFile) => {
    setFile(selectedFile);
    setUploadedUrl(''); // Reset if new file selected
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
      // Assuming axios is configured with baseURL and withCredentials
      const res = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = res.data.data;
      // Cloudinary returns an absolute URL (https://...), local returns relative (/uploads/...)
      const fileUrl = data.url.startsWith('http')
        ? data.url
        : `${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5001'}${data.url}`;
      
      setUploadedUrl(fileUrl);
      toast.success('File uploaded successfully!');
      
      if (onUploadSuccess) {
        onUploadSuccess(fileUrl, data);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full">
      <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{label}</p>
      
      {!file ? (
        <div 
          className={cn(
            "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer",
            isDragging 
              ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20" 
              : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadCloud className={cn("w-10 h-10 mb-3 transition-colors", isDragging ? "text-primary-600" : "text-slate-400")} />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300 text-center mb-1">
            Drag & drop your file here
          </p>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-500 text-center">
            or click to browse from your computer
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
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                <FileIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{file.name}</p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            
            {!uploadedUrl && !isUploading && (
              <button 
                onClick={clearFile}
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {uploadedUrl ? (
            <div className="flex items-center justify-center gap-2 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg font-bold text-sm">
              <CheckCircle className="w-4 h-4" />
              Upload Complete
            </div>
          ) : (
            <button
              onClick={uploadFile}
              disabled={isUploading}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-lg font-bold transition-all disabled:opacity-70"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  Upload File
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
