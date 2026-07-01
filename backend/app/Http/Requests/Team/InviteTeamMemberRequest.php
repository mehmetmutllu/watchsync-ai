<?php

namespace App\Http\Requests\Team;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class InviteTeamMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->canManageTeam() ?? false;
    }

    public function rules(): array
    {
        $validPermissions = array_keys(config('permissions.permissions'));

        return [
            'email'           => ['required', 'email', 'max:255'],
            'role'            => ['required', Rule::in(config('permissions.invitable_roles'))],
            'permissions'     => ['nullable', 'array'],
            'permissions.*'   => [Rule::in($validPermissions)],
            'expires_in_days' => ['nullable', 'integer', 'min:1', 'max:365'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.required' => 'E-posta adresi zorunludur.',
            'role.in'        => 'Yalnızca yönetici veya çalışan rolü davet edilebilir.',
        ];
    }
}
