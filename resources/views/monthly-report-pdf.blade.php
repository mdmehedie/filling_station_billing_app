<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Credit Sales Summary</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 9mm;
        }

        * {
            box-sizing: border-box;
        }

        body {
            color: #111;
            font-family: "Times New Roman", serif;
            font-size: 10px;
            margin: 0;
        }

        .sheet {
            border: 1px solid #333;
            padding: 7px;
            width: 100%;
        }

        .header {
            align-items: center;
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
            min-height: 78px;
        }

        .logo {
            align-items: center;
            display: flex;
            height: 66px;
            justify-content: center;
            width: 92px;
        }

        .logo img {
            max-height: 66px;
            max-width: 92px;
            object-fit: contain;
        }

        .heading {
            flex: 1;
            line-height: 1.12;
            text-align: center;
        }

        .heading h1,
        .heading h2,
        .heading p {
            margin: 0;
        }

        .heading h1 {
            font-size: 21px;
            text-decoration: underline;
        }

        .heading .address {
            font-size: 12px;
            margin-top: 3px;
        }

        .heading h2 {
            font-size: 18px;
            margin-top: 3px;
        }

        .heading .period {
            font-size: 13px;
            font-weight: bold;
            margin-top: 3px;
        }

        table {
            border-collapse: collapse;
            table-layout: fixed;
            width: 100%;
        }

        th,
        td {
            border: 1px solid #333;
            line-height: 1.1;
            padding: 3px 4px;
            vertical-align: middle;
            white-space: nowrap;
        }

        th {
            background: #e9e9e9;
            font-size: 10px;
            font-weight: bold;
            text-align: center;
        }

        td {
            font-size: 10px;
        }

        .date {
            text-align: left;
            width: 46px;
        }

        .coupon {
            text-align: center;
            width: 36px;
        }

        .liter {
            text-align: right;
            width: 62px;
        }

        .amount {
            text-align: right;
            width: 74px;
        }

        tfoot td {
            background: #f3f3f3;
            font-weight: bold;
        }
    </style>
</head>

<body>
    @php
        $amountFormatter = new \NumberFormatter('en_IN', \NumberFormatter::DECIMAL);
        $amountFormatter->setAttribute(\NumberFormatter::MIN_FRACTION_DIGITS, 2);
        $amountFormatter->setAttribute(\NumberFormatter::MAX_FRACTION_DIGITS, 2);

        $formatBlankInt = function ($value) {
            return (int) $value === 0 ? '' : (string) (int) $value;
        };

        $formatTotalInt = function ($value) {
            return (string) (int) $value;
        };

        $formatBlankQuantity = function ($value) {
            if ((float) $value == 0.0) {
                return '';
            }

            return removeLeadingZeros(number_format((float) $value, 2, '.', ''));
        };

        $formatTotalQuantity = function ($value) {
            return removeLeadingZeros(number_format((float) $value, 2, '.', ''));
        };

        $formatBlankAmount = function ($value) use ($amountFormatter) {
            return (float) $value == 0.0 ? '' : $amountFormatter->format((float) $value);
        };

        $formatTotalAmount = function ($value) use ($amountFormatter) {
            return $amountFormatter->format((float) $value);
        };
    @endphp

    <div class="sheet">
        <div class="header">
            <div class="logo">
                @if ($logo1)
                    <img src="{{ $logo1 }}" alt="CSD Logo">
                @endif
            </div>
            <div class="heading">
                <h1>CSD Filling Station</h1>
                <p class="address">CSD Dhaka Cantonment, Dhaka -1206</p>
                <h2>Credit Sales Summary</h2>
                <p class="period">{{ $periodLabel }}</p>
            </div>
            <div class="logo">
                @if ($logo2)
                    <img src="{{ $logo2 }}" alt="CSD Filling Station Logo">
                @endif
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th rowspan="2" class="date">Date</th>
                    <th colspan="3">Coupon</th>
                    <th colspan="3">Liter</th>
                    <th colspan="3">Amount</th>
                </tr>
                <tr>
                    <th class="coupon">Octane</th>
                    <th class="coupon">Diesel</th>
                    <th class="coupon">Total</th>
                    <th class="liter">Octane (L)</th>
                    <th class="liter">Diesel</th>
                    <th class="liter">Total</th>
                    <th class="amount">Octane</th>
                    <th class="amount">Diesel</th>
                    <th class="amount">Total</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($rows as $row)
                    <tr>
                        <td class="date">{{ $row['date'] }}</td>
                        <td class="coupon">{{ $formatBlankInt($row['coupon_octane']) }}</td>
                        <td class="coupon">{{ $formatBlankInt($row['coupon_diesel']) }}</td>
                        <td class="coupon">{{ $formatBlankInt($row['coupon_total']) }}</td>
                        <td class="liter">{{ $formatBlankQuantity($row['liter_octane']) }}</td>
                        <td class="liter">{{ $formatBlankQuantity($row['liter_diesel']) }}</td>
                        <td class="liter">{{ $formatBlankQuantity($row['liter_total']) }}</td>
                        <td class="amount">{{ $formatBlankAmount($row['amount_octane']) }}</td>
                        <td class="amount">{{ $formatBlankAmount($row['amount_diesel']) }}</td>
                        <td class="amount">{{ $formatBlankAmount($row['amount_total']) }}</td>
                    </tr>
                @endforeach
            </tbody>
            <tfoot>
                <tr>
                    <td class="date">Total</td>
                    <td class="coupon">{{ $formatTotalInt($totals['coupon_octane']) }}</td>
                    <td class="coupon">{{ $formatTotalInt($totals['coupon_diesel']) }}</td>
                    <td class="coupon">{{ $formatTotalInt($totals['coupon_total']) }}</td>
                    <td class="liter">{{ $formatTotalQuantity($totals['liter_octane']) }}</td>
                    <td class="liter">{{ $formatTotalQuantity($totals['liter_diesel']) }}</td>
                    <td class="liter">{{ $formatTotalQuantity($totals['liter_total']) }}</td>
                    <td class="amount">{{ $formatTotalAmount($totals['amount_octane']) }}</td>
                    <td class="amount">{{ $formatTotalAmount($totals['amount_diesel']) }}</td>
                    <td class="amount">{{ $formatTotalAmount($totals['amount_total']) }}</td>
                </tr>
            </tfoot>
        </table>
    </div>
</body>

</html>
