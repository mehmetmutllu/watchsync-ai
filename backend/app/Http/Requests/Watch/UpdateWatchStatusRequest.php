<?php

namespace App\Http\Requests\Watch;

use Illuminate\Foundation\Http\FormRequest;

class UpdateWatchStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('inventory.edit') ?? false;
    }

    public function rules(): array
    {
        return [
            'status' => 'required|in:draft,active,reserved,sold,maintenance',
            'notes'  => 'nullable|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => 'Durum alanı zorunludur.',
            'status.in'       => 'Geçersiz durum değeri.',
        ];
    }
}
