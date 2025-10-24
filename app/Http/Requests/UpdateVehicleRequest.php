<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateVehicleRequest extends FormRequest
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
            'fuel_id' => 'required|exists:fuels,id',
            'organization_id' => 'required|exists:organizations,id',
            'ucode' => 'required|string|max:255|unique:vehicles,ucode,' . $this->vehicle->id,
            'name' => 'sometimes|max:255',
            'model' => 'sometimes|max:255',
            'type' => 'required|string|max:255',
        ];
    }

    public function messages(): array
    {
        return [
            'fuel_id.required' => 'The fuel field is required.',
        ];
    }

    public function attributes(): array
    {
        return [
            'fuel_id' => 'Fuel',
        ];
    }
}
