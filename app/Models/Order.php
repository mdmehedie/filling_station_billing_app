<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'organization_id',
        'vehicle_id',
        'fuel_id',
        'fuel_qty',
        'total_price',
        'sold_date',
    ];
}
