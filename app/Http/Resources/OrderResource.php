<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
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
            'vehicle_id' => $this->vehicle_id,
            'fuel_id' => $this->fuel_id,
            'fuel_qty' => $this->fuel_qty,
            'total_price' => $this->total_price,
            'per_ltr_price' => $this->per_ltr_price,
            'sold_date' => $this->sold_date->format('Y-m-d'),
            'created_at' => $this->created_at->format('Y-m-d'),
            'organization' => [
                'id' => $this->organization->id,
                'ucode' => $this->organization->ucode,
                'name' => $this->organization->name,
                'name_bn' => $this->organization->name_bn,
            ],
            'vehicle' => [
                'id' => $this->vehicle->id,
                'ucode' => $this->vehicle->ucode,
                'name' => $this->vehicle->name,
                'model' => $this->vehicle->model,
                'type' => $this->vehicle->type,
            ],
            'fuel' => [
                'id' => $this->fuel->id,
                'name' => $this->fuel->name,
                'type' => $this->fuel->type,
                'price' => $this->fuel->price,
            ],
        ];
    }
}
