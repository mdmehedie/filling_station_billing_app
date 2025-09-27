<?php

namespace App\Models;

use App\Models\Fuel;
use App\Models\Organization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Vehicle extends Model
{
    use SoftDeletes;
    
    protected $fillable = [
        'fuel_id',
        'organization_id',
        'ucode',
        'name',
        'model',
        'type',
    ];

    public function fuel()
    {
        return $this->belongsTo(Fuel::class);
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }
}
