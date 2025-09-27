<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FuelResource extends JsonResource
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
            'price' => $this->price,
            'updated_at' => $this->when('updated_at', $this->updated_at?->format('Y-m-d H:i:s A')),
            'created_at' => $this->when('created_at', $this->created_at?->format('Y-m-d H:i:s A')),
        ];
    }
}
