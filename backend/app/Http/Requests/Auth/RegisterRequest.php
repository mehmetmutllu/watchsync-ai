<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name'         => ['required', 'string', 'max:255'],
            'email'        => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password'     => ['required', 'string', 'min:8', 'confirmed', 'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'terms_accepted' => ['accepted'],
        ];
    }

    /**
     * Özel hata mesajları.
     */
    public function messages(): array
    {
        return [
            'name.required'           => __('requests.name_required'),
            'email.required'          => __('requests.email_required'),
            'email.email'             => __('requests.email_invalid'),
            'email.unique'            => __('requests.email_unique'),
            'password.required'       => __('requests.password_required'),
            'password.min'            => __('requests.password_min'),
            'password.regex'          => __('requests.password_regex'),
            'password.confirmed'      => __('requests.password_confirmed'),
            'terms_accepted.accepted' => __('requests.terms_accepted'),
        ];
    }
}
