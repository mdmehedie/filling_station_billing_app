<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Organization extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'name_bn',
        'logo',
        'is_vat_applied',
        'vat_rate',
        'vat_flat_amount',
    ];
}
