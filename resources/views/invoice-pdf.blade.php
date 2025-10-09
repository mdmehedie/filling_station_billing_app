<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Credit Sale Statement</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 10px;
        }

        .header-content {
            flex: 1;
            text-align: center;
        }

        .header-content h2 {
            margin: 0;
        }

        .header-content h3 {
            margin: 2px 0;
        }

        .logo-container {
            width: 100px;
            height: 80px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .logo-container img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        }

        .client-info {
            text-align: center;
            font-weight: bold;
            margin-bottom: 15px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 12px;
        }

        table,
        th,
        td {
            border: 1px solid black;
        }

        th,
        td {
            padding: 4px;
            text-align: center;
        }

        th {
            background-color: #f2f2f2;
        }

        .summary {
            font-weight: bold;
            margin-top: 10px;
        }

        .signatures {
            margin-top: 30px;
            display: flex;
            justify-content: space-between;
            font-size: 12px;
        }

        .sign-box {
            text-align: center;
            width: 23%;
        }
    </style>
</head>

<body>

    <div class="header">
        <div class="logo-container">
            <img src="{{ $logo1 }}" alt="CSD Logo">
        </div>
        <div class="header-content">
            <h2>CSD Filling Station</h2>
            <h3>Dhaka Cantonment, Dhaka -1206</h3>
            <h3>Credit Sale Statement ({{ \Carbon\Carbon::create()->month($month)->year($year)->format('F') }}
                {{ $year }})
            </h3>
        </div>
        <div class="logo-container">
            <img src="{{ $logo2 }}" alt="CSD Filling Station Logo">
        </div>
    </div>

    <div class="client-info">
        Client: ({{ $organization->ucode }}) {{ $organization->name }}
    </div>

    @php
        $fuelItems = '';
    @endphp
    @foreach ($data as $fuel)
        @php
            $fuelItems .= $fuel['fuel_name'] . ' + ';
        @endphp
        <h3 style="text-align:center">{{ $fuel['fuel_name'] }}</h3>
        <table class="table-striped table-sm">
            <tr>
                <th width="60">Veh. No</th>
                <th>Count</th>
                @foreach ($tableHeaders as $header)
                    <th>{{ $header['day'] }} {{ $header['month'] }}</th>
                @endforeach
                <th>Total</th>
            </tr>
            @foreach ($fuel['vehicles'] as $vehicle)
                <tr>
                    <td width="60" style="text-align: center; padding-left: 6px;">{{ $vehicle['ucode'] }}</td>
                    <td>{{ removeLeadingZeros($vehicle['order_count']) }}</td>

                    @foreach ($vehicle['quantities'] as $qty)
                        <td>{{ removeLeadingZeros($qty) }}</td>
                    @endforeach

                    <td>{{ removeLeadingZeros($vehicle['total_qty']) }}</td>
                </tr>
            @endforeach
            <tr>
                <td colspan="2" style="text-align:left;">Rate:</td>
                @foreach ($fuel['per_ltr_price_ranges'] as $range => $price)
                    @php
                        $colspan =
                            array_reduce(
                                explode('-', $range),
                                function ($carry, $item) {
                                    return (int) $item - (int) $carry;
                                },
                                0,
                            ) + 1;
                    @endphp
                    <td colspan={{ $colspan }} style="text-align:center;">
                        <strong>{{ removeLeadingZeros($price) }} Tk</strong>
                    </td>
                @endforeach
            </tr>
            <tr>
                <td colspan="34" style="text-align:left;">Total Ltr.
                    <strong>{{ removeLeadingZeros($fuel['total_qty']) }}</strong>
                </td>
            </tr>
            <tr>
                <td colspan="34" style="text-align:left;">Total Bill.
                    <strong>{{ removeLeadingZeros($fuel['total_price']) }} Tk</strong>
                </td>
            </tr>
        </table>
    @endforeach

    @php
        $formatter = new \NumberFormatter('en_BD', \NumberFormatter::CURRENCY);
    @endphp

    <div class="summary">
        Total Coupon: {{ $totalCoupon }} ({{ $repeatedCouponCount }} repeated) <br>
        Total Bill ({{ substr($fuelItems, 0, -3) }}):
        {{ removeLeadingZeros($formatter->format($totalBill)) }}
    </div>

    <div class="signatures">
        <div class="sign-box">
            <strong>Md Mohi Uddin</strong>
            <br>Executive<br>CSD Filling Station
        </div>
        <div class="sign-box">
            <strong>WO Md Rafiqul Islam (Retd)</strong>
            <br>Manager<br>CSD Filling Station
        </div>
        <div class="sign-box">
            <strong>Lt Col Habib Abdullah Sayeed</strong>
            <br>Head of Filling Station & Motor Parts
        </div>
    </div>

</body>

</html>
