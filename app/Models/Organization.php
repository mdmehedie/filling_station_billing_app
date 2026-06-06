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
        'security_money',
        'previous_due',
        'previous_paid',
    ];

    protected $appends = ['logo_url', 'total_paid', 'total_due'];

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

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function getLogoUrlAttribute()
    {
        return $this->logo ? asset('storage/organizations/'.$this->logo) : null;
    }

    public function getTotalPaidAttribute()
    {
        $payments_sum = $this->payments()->where('is_deleted', false)->sum('amount');

        return $payments_sum + ($this->previous_paid ?? 0);
    }

    public function getTotalDueAttribute()
    {
        $total_orders = ($this->orders_sum_total_price ?? $this->orders()->sum('total_price') ?? 0) + ($this->previous_due ?? 0);

        return $total_orders - $this->total_paid;
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
