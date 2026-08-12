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
            'name.required'      => __('requests.name_required_short'),
            'password.required'  => __('requests.password_required'),
            'password.min'       => __('requests.password_min'),
            'password.regex'     => __('requests.password_regex'),
            'password.confirmed' => __('requests.password_confirmed'),
        ];
    }
}
