'use client';

import { useCallback, useMemo, useEffect } from 'react';
import { Upload, X, GripVertical, Image as ImageIcon } from 'lucide-react';
import { watchesApi } from '@/lib/watches-api';
import { useToastStore } from '@/stores/toastStore';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface ExistingImage {
  id: number;
  url: string;
  thumb_url: string;
  is_primary: boolean;
}

interface StepPhotosProps {
  watchId: number | null;
  existingImages: ExistingImage[];
  pendingFiles: File[];
  onExistingImagesChange: (images: ExistingImage[]) => void;
  onPendingFilesChange: (files: File[]) => void;
  isUploading: boolean;
}

export default function StepPhotos({
  watchId,
  existingImages,
  pendingFiles,
  onExistingImagesChange,
  onPendingFilesChange,
  isUploading,
}: StepPhotosProps) {
  const addToast = useToastStore((s) => s.addToast);

  const pendingPreviews = useMemo(
    () => pendingFiles.map((f) => URL.createObjectURL(f)),
    [pendingFiles]
  );

  useEffect(() => {
    return () => {
      pendingPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [pendingPreviews]);

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files);
      addFiles(files);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [existingImages.length, pendingFiles.length]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return;
      const files = Array.from(e.target.files);
      addFiles(files);
      e.target.value = ''; // Reset input
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [existingImages.length, pendingFiles.length]
  );

  const addFiles = (files: File[]) => {
    const total = existingImages.length + pendingFiles.length;
    const valid: File[] = [];

    for (const file of files) {
      if (total + valid.length >= 20) {
        addToast({ type: 'warning', title: 'Maksimum 20 fotoğraf yükleyebilirsiniz.' });
        break;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        addToast({ type: 'warning', title: `${file.name}: Sadece JPEG, PNG ve WebP desteklenir.` });
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        addToast({ type: 'warning', title: `${file.name}: Dosya boyutu 10MB'ı aşamaz.` });
        continue;
      }
      valid.push(file);
    }

    if (valid.length > 0) {
      onPendingFilesChange([...pendingFiles, ...valid]);
    }
  };

  const removePending = (index: number) => {
    onPendingFilesChange(pendingFiles.filter((_, i) => i !== index));
  };

  const removeExisting = async (imageId: number) => {
    if (!watchId) return;
    try {
      await watchesApi.deleteImage(watchId, imageId);
      onExistingImagesChange(existingImages.filter((img) => img.id !== imageId));
    } catch {
        addToast({ type: 'error', title: 'Fotoğraf silinirken hata oluştu.' });
    }
  };

  const totalCount = existingImages.length + pendingFiles.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-primary-text mb-1">Fotoğraflar</h2>
        <p className="text-sm text-secondary-text">
          Saatinizin fotoğraflarını yükleyin. En az 1 fotoğraf zorunludur. (Maks. 10MB/görsel)
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleFileDrop}
        onDragOver={(e) => e.preventDefault()}
        className="relative border-2 border-dashed border-border-subtle rounded-xl p-8 text-center hover:border-accent-blue/50 hover:bg-accent-blue/5 transition-colors cursor-pointer"
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <Upload className="w-10 h-10 text-secondary-text mx-auto mb-3" />
        <p className="text-sm font-medium text-primary-text">
          Fotoğrafları sürükleyip bırakın
        </p>
        <p className="text-xs text-secondary-text mt-1">
          veya dosya seçmek için tıklayın — JPEG, PNG, WebP (maks. 10MB)
        </p>
        <p className="text-xs text-tertiary-text mt-2">
          {totalCount}/20 fotoğraf
        </p>
      </div>

      {/* Image Gallery */}
      {totalCount > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* Existing Images */}
          {existingImages.map((img, i) => (
            <div key={`existing-${img.id}`} className="relative group aspect-square rounded-lg overflow-hidden border border-border-subtle">
              <img src={img.thumb_url || img.url} alt={`Saat fotoğrafı ${i + 1}`} className="w-full h-full object-cover" />
              {img.is_primary && (
                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[10px] font-medium bg-accent-blue text-white rounded">
                  Ana
                </span>
              )}
              <button
                onClick={() => removeExisting(img.id)}
                className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent h-8 flex items-end px-2 pb-1">
                <span className="text-[10px] text-white/80">Yüklendi</span>
              </div>
            </div>
          ))}

          {/* Pending Files */}
          {pendingFiles.map((file, i) => (
            <div key={`pending-${i}`} className="relative group aspect-square rounded-lg overflow-hidden border border-accent-blue/30 bg-accent-blue/5">
              <img src={pendingPreviews[i]} alt={file.name} className="w-full h-full object-cover" />
              <button
                onClick={() => removePending(i)}
                className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent h-8 flex items-end px-2 pb-1">
                <span className="text-[10px] text-amber-400">Bekliyor</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload progress */}
      {isUploading && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-accent-blue/10 border border-accent-blue/20">
          <div className="animate-spin w-5 h-5 border-2 border-accent-blue border-t-transparent rounded-full" />
          <span className="text-sm text-accent-blue">Fotoğraflar yükleniyor...</span>
        </div>
      )}

      {/* Warning if no photos */}
      {totalCount === 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <ImageIcon className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <span className="text-sm text-amber-500">Sonraki adıma geçmek için en az 1 fotoğraf yüklemelisiniz.</span>
        </div>
      )}
    </div>
  );
}
