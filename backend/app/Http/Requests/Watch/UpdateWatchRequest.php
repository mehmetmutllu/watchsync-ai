<?php

namespace App\Http\Requests\Watch;

use Illuminate\Foundation\Http\FormRequest;

class UpdateWatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('inventory.edit') ?? false;
    }

    public function rules(): array
    {
        return [
            'brand'            => 'sometimes|required|string|max:255',
            'model'            => 'sometimes|required|string|max:255',
            'reference_number' => 'nullable|string|max:100',
            'year'             => 'nullable|integer|min:1800|max:' . (date('Y') + 1),
            'condition'        => 'sometimes|required|in:new,unworn,very_good,good,fair',
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
            'brand.required'     => __('requests.brand_required'),
            'model.required'     => __('requests.model_required'),
            'condition.required' => __('requests.condition_required'),
            'condition.in'       => __('requests.condition_in'),
            'year.min'           => __('requests.year_min'),
            'cost_price.numeric' => __('requests.cost_price_numeric'),
            'sale_price.numeric' => __('requests.sale_price_numeric'),
            'currency.in'        => __('requests.currency_in'),
        ];
    }
}
