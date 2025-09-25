<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Vehicle extends Model
{
    protected $fillable = [
        'fuel_id',
        'organization_id',
        'ucode',
        'name',
        'model',
        'type',
    ];
}
