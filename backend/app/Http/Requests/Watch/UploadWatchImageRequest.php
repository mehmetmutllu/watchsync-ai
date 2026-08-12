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
            'images.required'  => __('requests.images_required'),
            'images.max'       => __('requests.images_max'),
            'images.*.image'   => __('requests.image_invalid'),
            'images.*.mimes'   => __('requests.image_mimes'),
            'images.*.max'     => __('requests.image_max_size'),
        ];
    }
}
