<?php

namespace App\Http\Requests\Team;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMemberPermissionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->canManageTeam() ?? false;
    }

    public function rules(): array
    {
        $validPermissions = array_keys(config('permissions.permissions'));

        return [
            'permissions'   => ['present', 'array'],
            'permissions.*' => [Rule::in($validPermissions)],
        ];
    }
}
