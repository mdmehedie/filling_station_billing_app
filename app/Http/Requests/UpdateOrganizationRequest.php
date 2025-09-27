<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class UpdateOrganizationRequest extends FormRequest
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
            'ucode' => 'required|string|max:255|unique:organizations,ucode,' . $this->route('organization')->id,
            'name' => 'required|string|max:255',
            'name_bn' => 'required|string|max:255',
            'logo' => 'nullable|image|max:2048',
            'remove_logo' => 'nullable|boolean',
            'is_vat_applied' => 'required|boolean',
            'vat_rate' => 'required_if:is_vat_applied,true|numeric|min:0|max:100',
        ];
    }

    public function messages(): array
    {
        return [
            'ucode.unique' => 'The organization code must be unique.',
            'vat_rate.required_if' => 'The VAT rate is required when VAT is applied.',
        ];
    }

    public function attributes(): array
    {
        return [
            'ucode' => 'Organization Code',
            'vat_rate' => 'VAT Rate',
        ];
    }

    public function prepareForValidation()
    {
        $this->merge([
            'is_vat_applied' => $this->boolean('is_vat_applied'),
        ]);
    }

    public function validated($key = null, $default = null)
    {
        $data = parent::validated($key, $default);
        
        if($this->hasFile('logo')){
            $logo = $this->file('logo');
            $logoName = time() . '_' . uniqid() . '.' . $logo->getClientOriginalExtension();
            $logo->storeAs('organizations', $logoName, 'public');
            $data['logo'] = $logoName;
        } elseif($this->boolean('remove_logo')) {
            // If remove_logo is true, set logo to null
            $data['logo'] = null;
        }
        
        // Remove the remove_logo flag from the data as it's not a database field
        unset($data['remove_logo']);
        
        return $data;
    }
}