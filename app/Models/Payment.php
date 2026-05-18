<?php

namespace App\Models;

use App\Enums\PaymentMethodTypeEnums;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'organization_id',
        'bank_account_id',
        'method',
        'type',
        'amount',
        'payment_date',
        'tnx_id',
        'note',
        'proof',
        'sender_bank',
        'check_number',
        'check_date',
        'is_deleted',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'payment_date' => 'date',
        'check_date' => 'date',
        'amount' => 'decimal:2',
        'proof' => 'json',
        'method' => PaymentMethodTypeEnums::class,
        'is_deleted' => 'boolean',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function bankAccount()
    {
        return $this->belongsTo(BankAccount::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
