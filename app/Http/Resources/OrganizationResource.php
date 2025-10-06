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
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'name_bn' => $this->name_bn,
            'ucode' => $this->ucode,
            'logo_url' => $this->logo_url,
            'is_vat_applied' => $this->is_vat_applied,
            'vat_rate' => $this->vat_rate,
            'user' => $this->whenLoaded('user', fn() => new UserResource($this->user)),
            'created_at' => $this->created_at,
            'vehicles_count' => $this->vehicles_count,
            'orders_count' => $this->orders_count,
        ];
    }
}
