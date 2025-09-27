<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VehicleResource extends JsonResource
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
            'organization_id' => $this->organization_id,
            'fuel_id' => $this->fuel_id,
            'organization' => $this->whenLoaded('organization', new OrganizationResource($this->organization)),
            'fuel' => $this->whenLoaded('fuel', new FuelResource($this->fuel)),
            'ucode' => $this->ucode,
            'name' => $this->name,
            'model' => $this->model,
            'type' => $this->type,
            'created_at' => $this->created_at,
        ];
    }
}
