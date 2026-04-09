<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class WatchImageService
{
    private string $disk;

    public function __construct()
    {
        $this->disk = config('filesystems.default') === 's3' ? 's3' : 'public';
    }

    /**
     * Görseli depolar ve thumbnail oluşturur.
     *
     * @return array{original: string, thumbnail: string}
     */
    public function store(UploadedFile $file, int $dealerId, int $watchId): array
    {
        $filename  = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $directory = "watches/{$dealerId}/{$watchId}";
        $thumbDir  = "{$directory}/thumbnails";

        // Orijinal görseli kaydet
        $originalPath = $file->storeAs($directory, $filename, $this->disk);

        // Thumbnail oluştur (GD ile)
        $thumbnailPath = $this->createThumbnail($file, $thumbDir, $filename);

        return [
            'original'  => $originalPath,
            'thumbnail' => $thumbnailPath,
        ];
    }

    /**
     * Görseli ve thumbnail'ini siler.
     */
    public function delete(string $imagePath): void
    {
        Storage::disk($this->disk)->delete($imagePath);

        // Thumbnail'i de sil
        $thumbPath = $this->getThumbnailPath($imagePath);
        if (Storage::disk($this->disk)->exists($thumbPath)) {
            Storage::disk($this->disk)->delete($thumbPath);
        }
    }

    /**
     * Görsel URL'ini döner (public erişim).
     */
    public function url(string $path): string
    {
        return Storage::disk($this->disk)->url($path);
    }

    /**
     * GD ile thumbnail oluşturur (300x300 max, oranı korur).
     */
    private function createThumbnail(UploadedFile $file, string $thumbDir, string $filename): string
    {
        $thumbPath = "{$thumbDir}/{$filename}";
        $maxWidth  = 300;
        $maxHeight = 300;

        $imageInfo = getimagesize($file->getPathname());
        if ($imageInfo === false) {
            // Görsel okunamadıysa orijinali küçültmeden kaydet
            $file->storeAs($thumbDir, $filename, $this->disk);
            return $thumbPath;
        }

        [$origWidth, $origHeight, $type] = $imageInfo;

        // Oran hesapla
        $ratio = min($maxWidth / $origWidth, $maxHeight / $origHeight);
        if ($ratio >= 1) {
            // Zaten küçük, kopyala
            $file->storeAs($thumbDir, $filename, $this->disk);
            return $thumbPath;
        }

        $newWidth  = (int) round($origWidth * $ratio);
        $newHeight = (int) round($origHeight * $ratio);

        // Kaynak image'ı oluştur
        $source = match ($type) {
            IMAGETYPE_JPEG => imagecreatefromjpeg($file->getPathname()),
            IMAGETYPE_PNG  => imagecreatefrompng($file->getPathname()),
            IMAGETYPE_WEBP => imagecreatefromwebp($file->getPathname()),
            default        => null,
        };

        if ($source === null) {
            $file->storeAs($thumbDir, $filename, $this->disk);
            return $thumbPath;
        }

        $thumb = imagecreatetruecolor($newWidth, $newHeight);

        // PNG/WebP için alfa kanalı koru
        if ($type === IMAGETYPE_PNG || $type === IMAGETYPE_WEBP) {
            imagealphablending($thumb, false);
            imagesavealpha($thumb, true);
        }

        imagecopyresampled($thumb, $source, 0, 0, 0, 0, $newWidth, $newHeight, $origWidth, $origHeight);

        // Geçici dosyaya yaz
        $tempPath = tempnam(sys_get_temp_dir(), 'thumb_');
        match ($type) {
            IMAGETYPE_JPEG => imagejpeg($thumb, $tempPath, 85),
            IMAGETYPE_PNG  => imagepng($thumb, $tempPath, 8),
            IMAGETYPE_WEBP => imagewebp($thumb, $tempPath, 85),
            default        => imagejpeg($thumb, $tempPath, 85),
        };

        imagedestroy($source);
        imagedestroy($thumb);

        // Storage'a kaydet
        Storage::disk($this->disk)->put($thumbPath, file_get_contents($tempPath));
        unlink($tempPath);

        return $thumbPath;
    }

    /**
     * Orijinal yoldan thumbnail yolunu üretir.
     */
    private function getThumbnailPath(string $originalPath): string
    {
        $dir      = dirname($originalPath);
        $filename = basename($originalPath);

        return "{$dir}/thumbnails/{$filename}";
    }
}
