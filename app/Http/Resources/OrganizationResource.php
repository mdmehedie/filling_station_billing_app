<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrganizationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request):array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'name_bn' => $this->name_bn,
            'logo' => $this->logo,
            'is_vat_applied' => $this->is_vat_applied,
            'vat_rate' => $this->vat_rate,
            'vat_flat_amount' => $this->vat_flat_amount,
            'user' => new UserResource($this->user),
        ];
    }
}
