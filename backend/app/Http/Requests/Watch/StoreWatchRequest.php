<?php

namespace App\Http\Requests\Watch;

use Illuminate\Foundation\Http\FormRequest;

class StoreWatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'brand'            => 'required|string|max:255',
            'model'            => 'required|string|max:255',
            'reference_number' => 'nullable|string|max:100',
            'year'             => 'nullable|integer|min:1800|max:' . (date('Y') + 1),
            'condition'        => 'required|in:new,unworn,very_good,good,fair',
            'status'           => 'nullable|in:draft,active',
            'cost_price'       => 'nullable|numeric|min:0|max:99999999.99',
            'sale_price'       => 'nullable|numeric|min:0|max:99999999.99',
            'currency'         => 'nullable|in:EUR,USD,GBP,TRY,CHF',
            'features'         => 'nullable|array',
            'features.case_material'     => 'nullable|string|max:100',
            'features.bracelet_material' => 'nullable|string|max:100',
            'features.dial_color'        => 'nullable|string|max:100',
            'features.movement'          => 'nullable|string|max:100',
            'features.case_diameter'     => 'nullable|string|max:50',
            'features.water_resistance'  => 'nullable|string|max:50',
            'features.power_reserve'     => 'nullable|string|max:50',
            'features.scope_of_delivery' => 'nullable|string|max:255',
            'description'      => 'nullable|string|max:5000',
        ];
    }

    public function messages(): array
    {
        return [
            'brand.required'     => 'Marka alanı zorunludur.',
            'model.required'     => 'Model alanı zorunludur.',
            'condition.required' => 'Durum (condition) alanı zorunludur.',
            'condition.in'       => 'Geçersiz durum değeri.',
            'year.min'           => 'Yıl en az 1800 olmalıdır.',
            'cost_price.numeric' => 'Maliyet fiyatı geçerli bir sayı olmalıdır.',
            'sale_price.numeric' => 'Satış fiyatı geçerli bir sayı olmalıdır.',
            'currency.in'       => 'Geçersiz para birimi.',
        ];
    }
}
