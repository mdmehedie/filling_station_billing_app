<?php

namespace App\Services;

use App\Http\Resources\OrderCollection;
use App\Models\Order;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;
use \Spatie\Browsershot\Browsershot;

class OrderService
{
    function __construct() {}

    public function orderList()
    {
        $query = QueryBuilder::for(Order::class)
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
            ->allowedSorts(['id', 'organization_id', 'vehicle_id', 'fuel_id', 'fuel_qty', 'total_price', 'sold_date', 'created_at']);

        $statsQuery = (clone $query)->getEloquentBuilder();
        $stats = $statsQuery->select([
            DB::raw('COUNT(DISTINCT vehicle_id) as total_vehicles'),
            DB::raw('SUM(fuel_qty) as total_quantity'),
            DB::raw('SUM(total_price) as total_sales'),
        ])->first();

        return (new OrderCollection($query->paginate(5)))
            ->additional(['stats' => [
                'total_vehicles' => $stats->total_vehicles ?? 0,
                'total_quantity' => $stats->total_quantity ?? 0,
                'total_sales' => $stats->total_sales ?? 0,
            ]]);
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
