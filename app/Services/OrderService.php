<?php

namespace App\Services;

use App\Models\Order;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;
use Illuminate\Support\Facades\Auth;
use \Spatie\Browsershot\Browsershot;

class OrderService
{
    function __construct() {}

    public function orderList($showAll = false)
    {
        return QueryBuilder::for(Order::class)
            ->with(['organization', 'vehicle', 'fuel', 'creator'])
            ->defaultSort('-id')
            ->allowedFilters([
                AllowedFilter::callback('search', function ($query, $value) {
                    $query
                        ->where('id', 'like', "%{$value}%")
                        ->orWhereHas('organization', function ($query) use ($value) {
                            $query->where('name', 'like', "%{$value}%");
                            $query->orWhere('name_bn', 'like', "%{$value}%");
                        })
                        ->orWhereHas('vehicle', function ($query) use ($value) {
                            $query->where('name', 'like', "%{$value}%");
                        });
                }),
                AllowedFilter::callback('start_date', function ($query, $value) {
                    $query->whereDate('sold_date', '>=', $value);
                }),
                AllowedFilter::callback('end_date', function ($query, $value) {
                    $query->whereDate('sold_date', '<=', $value);
                }),
                AllowedFilter::callback('organization_id', function ($query, $value) {
                    $query->where('organization_id', $value);
                }),
                AllowedFilter::callback('vehicle_id', function ($query, $value) {
                    $query->where('vehicle_id', $value);
                }),
                AllowedFilter::callback('fuel_id', function ($query, $value) {
                    $query->where('fuel_id', $value);
                }),
            ])
            ->when(Auth::user()->role === 'user', fn($q) => $q->where('user_id', Auth::id()))
            ->allowedSorts(['id', 'organization_id', 'vehicle_id', 'fuel_id', 'fuel_qty', 'total_price', 'sold_date', 'created_at'])
            ->when($showAll, function ($query) {
                return $query->get();
            }, function ($query) {
                return $query->paginate(15);
            });
    }

    public function generatOrderNo()
    {
        $order = Order::query()->orderBy('id', 'desc')->first();

        if (!$order) {
            $code = now()->format('dmy') . '0001';
            return (int) $code;
        }

        $code = (int) $order->order_no;

        return (int) $code + 1;
    }
}
