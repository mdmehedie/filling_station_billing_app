<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'organization_id',
        'payment_method_id',
        'amount',
        'payment_date',
        'tnx_id',
        'note',
        'proof',
    ];

    protected $casts = [
        'payment_date' => 'date',
        'amount' => 'decimal:2',
        'proof' => 'json',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function paymentMethod()
    {
        return $this->belongsTo(PaymentMethod::class);
    }
}
