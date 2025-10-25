<?php

namespace App\Models;

use App\Enums\MonthEnums;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    protected $fillable = [
        'organization_id',
        'month',
        'year',
        'total_bill',
        'total_qty',
        'total_coupon',
        'order_ids',
        'fuel_breakdown'
    ];

    protected $casts = [
        'order_ids' => 'array',
        'fuel_breakdown' => 'array'
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }
}
