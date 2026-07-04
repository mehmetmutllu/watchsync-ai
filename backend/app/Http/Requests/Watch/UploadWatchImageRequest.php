<?php

namespace App\Http\Requests\Watch;

use Illuminate\Foundation\Http\FormRequest;

class UploadWatchImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('inventory.edit') ?? false;
    }

    public function rules(): array
    {
        return [
            'images'       => 'required|array|min:1|max:10',
            'images.*'     => 'required|image|mimes:jpeg,jpg,png,webp|max:10240',
            'is_primary'   => 'nullable|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'images.required'  => 'En az bir görsel yüklemelisiniz.',
            'images.max'       => 'En fazla 10 görsel yükleyebilirsiniz.',
            'images.*.image'   => 'Dosya geçerli bir görsel olmalıdır.',
            'images.*.mimes'   => 'Görsel formatı jpeg, jpg, png veya webp olmalıdır.',
            'images.*.max'     => 'Her görsel en fazla 10 MB olabilir.',
        ];
    }
}
