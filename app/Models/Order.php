<?php

namespace App\Models;

use App\Services\OrderService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'order_no',
        'organization_id',
        'vehicle_id',
        'fuel_id',
        'fuel_qty',
        'total_price',
        'sold_date',
    ];

    protected $casts = [
        'sold_date' => 'date',
        'fuel_qty' => 'decimal:2',
        'total_price' => 'decimal:2',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function fuel(): BelongsTo
    {
        return $this->belongsTo(Fuel::class);
    }

    protected static function boot()
    {
        parent::boot();

        $orderService = new OrderService();
        self::creating(function (Order $order) use ($orderService) {
            $order->order_no = $orderService->generatOrderNo();
        });
    }
}
