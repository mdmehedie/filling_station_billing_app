<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
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
            'amount' => (float) $this->amount,
            'type' => $this->type,
            'payment_date' => $this->payment_date,
            'tnx_id' => $this->tnx_id,
            'note' => $this->note,
            'proof' => $this->proof,
            'bank_account' => $this->whenLoaded('bankAccount', fn () => [
                'id' => $this->bankAccount->id,
                'name' => $this->bankAccount->name,
            ]),
            'created_at' => $this->created_at,
        ];
    }
}
