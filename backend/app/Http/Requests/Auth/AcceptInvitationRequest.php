<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class AcceptInvitationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'     => ['required', 'string', 'max:255'],
            'password' => ['required', 'confirmed', 'string', 'min:8', 'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'      => 'İsim alanı zorunludur.',
            'password.required'  => 'Şifre alanı zorunludur.',
            'password.min'       => 'Şifre en az 8 karakter olmalıdır.',
            'password.regex'     => 'Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir.',
            'password.confirmed' => 'Şifre tekrarı eşleşmiyor.',
        ];
    }
}
