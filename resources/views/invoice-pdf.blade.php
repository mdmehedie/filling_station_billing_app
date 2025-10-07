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
      <h3>CSD Dhaka Cantonment, Dhaka -1206</h3>
      <h3>Credit Sale Statement (For the Month of
        {{ \Carbon\Carbon::create()->month($month)->year($year)->format('F') }}
        {{ $year }})
      </h3>
    </div>
    <div class="logo-container">
      <img src="{{ $logo2 }}" alt="CSD Filling Station Logo">
    </div>
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
        <th width="60">Veh. No</th>
        <th>Count</th>
        @foreach ($tableHeaders as $header)
          <th>{{ $header['day'] }} {{ $header['month'] }}</th>
        @endforeach
        <!-- Continue until 31-Jul -->
        <th>Total</th>
      </tr>
      @foreach ($fuel['vehicles'] as $vehicle)
        <tr>
          <td width="60" style="text-align: center; padding-left: 6px;">{{ $vehicle['ucode'] }}</td>
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
        <td colspan="34" style="text-align:left;">Total Bill. <strong>{{ $fuel['total_price'] }} Tk</strong></td>
      </tr>
    </table>
  @endforeach

  <div class="summary">
    Total Coupon: {{ $totalCoupon }} <br>
    Total Bill ({{ substr($fuelItems, 0, -3) }}):
    {{ (new \NumberFormatter('en_BD', \NumberFormatter::CURRENCY))->format($totalBill) }}
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