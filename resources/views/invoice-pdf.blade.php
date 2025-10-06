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
      text-align: center;
      margin-bottom: 10px;
    }

    .header h2 {
      margin: 0;
    }

    .header h3 {
      margin: 2px 0;
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
    <h2>CSD Filling Station</h2>
    <h3>CSD Dhaka Cantonment, Dhaka -1206</h3>
    <h3>Credit Sale Statement (For the Month of {{ \Carbon\Carbon::create()->month($month)->year($year)->format('F') }}
      {{ $year }})
    </h3>
  </div>

  <div class="client-info">
    Client: {{ $organization->name }}
  </div>

  @php
    $fuelItems = "";
  @endphp
  @foreach ($data as $fuel)
    @php
      $fuelItems .= $fuel['fuel_name'] . ' + ';
    @endphp
    <h3 style="text-align:center">{{ $fuel['fuel_name'] }}</h3>
    <table>
      <tr>
        <th>Veh. No</th>
        <th>Count</th>
        @foreach ($tableHeaders as $header)
          <th>{{ $header['day'] }} {{ $header['month'] }}</th>
        @endforeach
        <!-- Continue until 31-Jul -->
        <th>Total</th>
      </tr>
      @foreach ($fuel['vehicles'] as $vehicle)
        <tr>
          <td>{{ $vehicle['ucode'] }}</td>
          <td>{{ $vehicle['order_count'] }}</td>

          @foreach ($vehicle['quantities'] as $qty)
            <td>{{ $qty }}</td>
          @endforeach

          <!-- Fill dynamically -->
          <td>{{ $vehicle['total_qty'] }}</td>
        </tr>
      @endforeach
      <tr>
        <td colspan="3" style="text-align:left;">Total Ltr.</td>
        <td colspan="5" style="text-align:center;">{{ $fuel['total_qty'] }}</td>
        <td colspan="26"> Rate: {{ $fuel['per_ltr_price'] }} Tk/L</td>
      </tr>
      <tr>
        <td colspan="34" style="text-align:left;">Total Bill. {{ $fuel['total_price'] }} Tk</td>
      </tr>
    </table>
  @endforeach

  <div class="summary">
    Total Coupon: {{ $totalCoupon }} <br>
    Total Bill ({{ substr($fuelItems, 0, -3) }}):
    {{ (new \NumberFormatter('en_BD', \NumberFormatter::CURRENCY))->format($totalBill) }}
  </div>

  <div class="signatures">
    <div class="sign-box">Md Mohi Uddin<br>Executive<br>CSD Filling Station</div>
    <div class="sign-box">WO Md Rafiqul Islam (Retd)<br>Manager<br>CSD Filling Station</div>
    <div class="sign-box">Engr. Md. Al Amin<br>AGM<br>CSD Filling Station</div>
    <div class="sign-box">Lt Col Habib Abdullah Sayeed<br>Head of Filling Station & Motor Parts</div>
  </div>

</body>

</html>