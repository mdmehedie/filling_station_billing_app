<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Organization extends Model
{
    protected $fillable = [
        'user_id',
        'ucode',
        'name',
        'name_bn',
        'logo',
        'is_vat_applied',
        'vat_rate',
    ];

    protected $appends = ['logo_url'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function vehicles()
    {
        return $this->hasMany(Vehicle::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function getLogoUrlAttribute()
    {
        return $this->logo ? asset('storage/organizations/' . $this->logo) : null;
    }

    public function getVehiclesCountAttribute()
    {
        return $this->vehicles()->count();
    }

    public function getOrdersCountAttribute()
    {
        return $this->orders()->count();
    }
}
