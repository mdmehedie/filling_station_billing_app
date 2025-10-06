<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
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
            'organization_id' => 'required|exists:organizations,id',
            'sold_date' => 'required|date',
            'order_items' => 'required|array',
            'order_items.*.vehicle_id' => 'required|exists:vehicles,id',
            'order_items.*.fuel_id' => 'required|exists:fuels,id',
            'order_items.*.fuel_qty' => 'required|numeric',
            'order_items.*.total_price' => 'required|numeric',
            'order_items.*.per_ltr_price' => 'required|numeric',
        ];
    }
}
