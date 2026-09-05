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
            'method' => $this->method,
            'type' => $this->type,
            'is_deleted' => $this->is_deleted,
            'payment_date' => $this->payment_date,
            'tnx_id' => $this->tnx_id,
            'note' => $this->note,
            'proof' => $this->proof,
            'sender_bank' => $this->sender_bank,
            'check_number' => $this->check_number,
            'check_date' => $this->check_date,
            'bank_account' => $this->whenLoaded('bankAccount', fn () => [
                'id' => $this->bankAccount->id,
                'name' => $this->bankAccount->name,
            ]),
            'creator' => $this->whenLoaded('creator', fn () => [
                'id' => $this->creator->id,
                'name' => $this->creator->name,
            ]),
            'created_at' => $this->created_at,
        ];
    }
}
