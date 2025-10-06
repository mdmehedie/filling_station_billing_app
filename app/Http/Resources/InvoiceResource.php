<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
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
            'month' => $this->month,
            'year' => $this->year,
            'organization' => $this->whenLoaded('organization', fn() => new OrganizationResource($this->organization)),
            'totalBill' => $this->total_bill,
            'totalCoupon' => $this->total_coupon,
            'totalQuantity' => $this->total_qty,
            'updated_at' => $this->updated_at->format('Y-m-d H:i:s A'),
        ];
    }
}
