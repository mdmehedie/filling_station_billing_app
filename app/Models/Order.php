<?php

namespace App\Models;

use App\Services\InvoiceService;
use App\Services\OrderService;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'user_id',
        'order_no',
        'organization_id',
        'vehicle_id',
        'fuel_id',
        'fuel_qty',
        'per_ltr_price',
        'total_price',
        'sold_date',
    ];

    protected $casts = [
        'sold_date' => 'date',
        'fuel_qty' => 'decimal:2',
        'total_price' => 'decimal:2',
        'per_ltr_price' => 'decimal:2',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

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

        // update invoice : created, updated,deleted
        $invoiceService = new InvoiceService();
        self::created(function (Order $order) use ($invoiceService) {
            $invoiceService->generateMonthlyInvoice(sold_date: $order->sold_date, organization_id: $order->organization_id);
        });

        self::updated(function (Order $order) use ($invoiceService) {
            // if year or month is changed, regenerate the previous month's or year's invoice
            if (Carbon::parse($order->sold_date)->format('Y') !== Carbon::parse($order->getOriginal('sold_date'))->format('Y')) {
                $invoiceService->generateMonthlyInvoice(sold_date: $order->getOriginal('sold_date'), organization_id: $order->organization_id);
            }

            if (Carbon::parse($order->sold_date)->format('m') !== Carbon::parse($order->getOriginal('sold_date'))->format('m')) {
                $invoiceService->generateMonthlyInvoice(sold_date: $order->getOriginal('sold_date'), organization_id: $order->organization_id);
            }

            $invoiceService->generateMonthlyInvoice(sold_date: $order->sold_date, organization_id: $order->organization_id);
        });

        self::deleted(function (Order $order) use ($invoiceService) {
            $invoiceService->generateMonthlyInvoice(sold_date: $order->sold_date, organization_id: $order->organization_id);
        });
    }
}
