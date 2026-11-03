<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Statement of Account - {{ $organization->name }}</title>
    <style>
        body { font-family: 'Arial', sans-serif; font-size: 12px; }
        .header { text-align: center; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 20px; }
        .info { margin-bottom: 20px; }
        .info table { width: 100%; border-collapse: collapse; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .summary { margin-top: 20px; float: right; width: 300px; }
        .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #777; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Statement of Account</h1>
        <p>{{ $organization->name }} ({{ $organization->ucode }})</p>
    </div>

    <div class="info">
        <table>
            <tr>
                <td><strong>Organization:</strong> {{ $organization->name }}</td>
                <td class="text-right"><strong>Date:</strong> {{ date('d M, Y') }}</td>
            </tr>
            <tr>
                <td><strong>Address:</strong> {{ $organization->address ?? 'N/A' }}</td>
                <td class="text-right"><strong>Status:</strong> Statement</td>
            </tr>
        </table>
    </div>

    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Description</th>
                <th class="text-right">Debit (Orders)</th>
                <th class="text-right">Credit (Payments)</th>
                <th class="text-right">Balance</th>
            </tr>
        </thead>
        <tbody>
            @php $balance = 0; @endphp
            @foreach($entries as $entry)
                @php 
                    if ($entry['type'] == 'order') $balance += $entry['amount'];
                    else $balance -= $entry['amount'];
                @endphp
                <tr>
                    <td>{{ date('d M, Y', strtotime($entry['date'])) }}</td>
                    <td>{{ $entry['description'] }}</td>
                    <td class="text-right">{{ $entry['type'] == 'order' ? number_format($entry['amount'], 2) : '-' }}</td>
                    <td class="text-right">{{ $entry['type'] == 'payment' ? number_format($entry['amount'], 2) : '-' }}</td>
                    <td class="text-right font-bold">{{ number_format($balance, 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="summary">
        <table>
            <tr>
                <td class="font-bold">Total Orders (Debit)</td>
                <td class="text-right">{{ number_format($totalOrders, 2) }}</td>
            </tr>
            <tr>
                <td class="font-bold">Total Payments (Credit)</td>
                <td class="text-right">{{ number_format($totalPayments, 2) }}</td>
            </tr>
            <tr style="background-color: #f9f9f9;">
                <td class="font-bold text-lg">Total Due</td>
                <td class="text-right font-bold text-lg">{{ number_format($totalOrders - $totalPayments, 2) }}</td>
            </tr>
        </table>
    </div>

    <div style="clear: both;"></div>

    <div class="footer">
        <p>This is a computer-generated statement and does not require a signature.</p>
    </div>
</body>
</html>
