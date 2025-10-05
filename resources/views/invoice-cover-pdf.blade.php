<!DOCTYPE html>
<html lang="bn">

<head>
  <meta charset="utf-8">
  <title>বিল পরিশোধ প্রসঙ্গে</title>
  <style>
    /* ====== Page Setup (A4) ====== */
    @page {
      size: A4;
      margin: 22mm 18mm 20mm 18mm;
    }

    /* Web Bengali font support */
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;700&display=swap');

    html,
    body {
      font-family: "Noto Sans Bengali", Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.8;
      color: #111;
    }

    /* ====== Brand / Theme ====== */
    :root {
      --accent: #e53935;
      --muted: #555;
      --border: #d9d9d9;
    }

    /* ====== Header ====== */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }

    .header-left {
      flex: 1;
    }

    .header-right {
      text-align: right;
    }

    .logo {
      width: 64px;
      height: 64px;
      object-fit: contain;
    }

    .brand {
      font-weight: 700;
      font-size: 18pt;
      letter-spacing: .3px;
      margin-bottom: 2px;
    }

    .brand-sub {
      font-size: 10pt;
      color: var(--muted);
      margin: 0;
      line-height: 1.2;
    }

    .top-meta {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-bottom: 2px solid #000;
      padding-bottom: 8px;
      margin-bottom: 14px;
    }

    .ref {
      font-weight: 600;
      text-align: left;
    }

    .date-loc {
      text-align: right;
      font-size: 11pt;
    }

    /* ====== Subject ====== */
    .subject {
      font-weight: 700;
      font-size: 13.5pt;
      margin: 12px 0 10px;
    }

    .subject .label {
      font-weight: 700;
      color: #000;
    }

    /* ====== Body ====== */
    .para {
      margin: 8px 0;
      text-align: justify;
    }

    ol.bn {
      margin: 8px 0 0 0;
      padding-left: 16px;
      counter-reset: bengali-counter;
      list-style: none;
    }

    ol.bn>li {
      margin: 6px 0;
      counter-increment: bengali-counter;
      position: relative;
    }

    ol.bn>li::before {
      content: counter(bengali-counter, bengali) "। ";
      font-weight: 600;
      margin-right: 4px;
    }

    @counter-style bengali {
      system: numeric;
      symbols: "০" "১" "২" "৩" "৪" "৫" "৬" "৭" "৮" "৯";
      suffix: "";
    }

    /* ====== Table ====== */
    table.sheet {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0 6px;
    }

    .sheet th,
    .sheet td {
      border: 1px solid var(--border);
      padding: 6px 8px;
      vertical-align: middle;
    }

    .sheet thead th {
      background: #fafafa;
      font-weight: 700;
      text-align: center;
    }

    .sheet td.num,
    .sheet th.num {
      text-align: right;
      white-space: nowrap;
    }

    .sheet td.center {
      text-align: center;
    }

    .sheet tfoot td {
      font-weight: 700;
    }

    .muted {
      color: var(--muted);
    }

    /* ====== Footer blocks ====== */
    .sig {
      margin-top: 22px;
      text-align: right;
    }

    .sig .name {
      font-weight: 700;
      margin-top: 36px;
    }

    .sig .desig {
      margin-top: 2px;
    }

    .meta-list {
      margin-top: 14px;
      display: block;
    }

    .meta-list .section {
      margin-bottom: 8px;
    }

    .meta-list h4 {
      margin: 8px 0 4px;
      font-size: 11.5pt;
      color: #000;
      font-weight: 700;
    }

    .meta-list ul {
      margin: 0;
      padding-left: 16px;
    }

    .watermark {
      position: fixed;
      bottom: 10mm;
      right: 0;
      left: 0;
      text-align: center;
      font-size: 9pt;
      color: #c62828;
      font-weight: 700;
    }

    /* Ensure red text like the screenshot */
    .red {
      color: var(--accent);
      font-weight: 700;
    }
  </style>
</head>

<body class="bn-text">

  @php
    $letterOrder = [
      'ক',
      'খ',
      'গ',
      'ঘ',
      'ঙ',
      'চ',
      'ছ',
      'জ',
      'ঝ',
      'ঞ',
      'ট',
      'ঠ',
      'ড',
      'ঢ',
      'ণ',
      'ত',
      'থ',
      'দ',
      'ধ',
      'ন',
      'প',
      'ফ',
      'ব',
      'ভ',
      'ম',
      'য',
      'র',
      'ল',
      'শ',
      'ষ',
      'স',
      'হ',
      'ড়',
      'ঢ়',
      'য়'
    ];

    $bengaliMonths = [
      1 => 'জানুয়ারি',
      2 => 'ফেব্রুয়ারি',
      3 => 'মার্চ',
      4 => 'এপ্রিল',
      5 => 'মে',
      6 => 'জুন',
      7 => 'জুলাই',
      8 => 'আগস্ট',
      9 => 'সেপ্টেম্বর',
      10 => 'অক্টোবর',
      11 => 'নভেম্বর',
      12 => 'ডিসেম্বর'
    ];
    $bengaliNumbers = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    $englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    $bengaliYear = str_replace($englishNumbers, $bengaliNumbers, $year);

    function formatBengaliNumber($number)
    {
      $bengaliNumbers = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
      $englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
      return str_replace($englishNumbers, $bengaliNumbers, $number);
    }

    function bdtBengaliCurrencyFormat($amount)
    {
      return (new NumberFormatter('bn_BD', NumberFormatter::CURRENCY, '৳ #,##,##0.00'))->format($amount);
    }

    function getFuelBengaliName($fuelName)
    {
      $fuelBnNames = [
        'petrol' => 'পেট্রোল',
        'diesel' => 'ডিজেল',
        'octane' => 'অকটেন',
        'lubricant' => 'লুব্রিকেন্ট',
        'cng' => 'সিএনজি',
        'lpg' => 'এলপিজি',
        'adblue' => 'অ্যাডব্লু'
      ];
      return $fuelBnNames[strtolower($fuelName)] ?? $fuelName;
    }
  @endphp
  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <div class="ref">নথি নং- সি এস ডি/ফিলিং
        স্টেশন/ক্রেডিট/{{ formatBengaliNumber($month) }}/{{ formatBengaliNumber($organization->ucode) }}</div>
    </div>
    <div class="header-right">
      <div class="brand bn-text">সি এস ডি ফিলিং স্টেশন</div>
      <div class="brand-sub bn-text">সি এস ডি বাংলাদেশ</div>
      <div class="brand-sub bn-text">ঢাকা সেনানিবাস</div>
    </div>
  </div>

  <div class="top-meta">
    <div></div>
    <div class="date-loc">
      {{ $bengaliMonths[now()->month] }} {{ formatBengaliNumber(now()->year) }}
    </div>
  </div>

  <!-- Subject -->
  <div class="subject">
    <span class="label">বিষয়ঃ</span>
    সি এস ডি ফিলিং স্টেশন হতে {{ $bengaliMonths[$month] }} {{ $bengaliYear }} মাসে ক্রেডিট ভাউচারের মাধ্যমে প্রদত্ত
    পেট্রোলিয়াম
    পণ্যের বিল পরিশোধ প্রসঙ্গে।
  </div>

  <!-- Body -->
  <ol class="bn">
    <li class="para">
      আপনাদের চাহিদানুসারে অধোনিবন্ধিত সি এস ডি ফিলিং স্টেশন হতে {{ $bengaliMonths[$month] }} {{ $bengaliYear }} মাসে
      ক্রেডিট ভাউচারের মাধ্যমে প্রদত্ত পেট্রোলিয়াম পণ্যের বিল পরিশোধের নিমিত্তে
      দরপত্র (ইনভয়েস) প্রেরণ করা হলো:
      <table class="sheet">
        <thead>
          <tr>
            <th style="width: 60px;">ক্রম নং</th>
            <th>জ্বালানির প্রকার</th>
            <th class="num">পরিমাণ (লিটার)</th>
            <th class="num">মূল্য (প্রতি লিটার)</th>
            <th class="num">মোট মূল্য</th>
            <th class="center" style="width: 80px;">মন্তব্য</th>
          </tr>
        </thead>
        <tbody>
          @foreach ($data as $item)
            <tr>
              <td class="center">{{ $letterOrder[$loop->index] }}</td>
              <td>{{ getFuelBengaliName($item['fuel_name']) }}</td>
              <td class="num">{{ bdtBengaliCurrencyFormat($item['total_qty']) }}</td>
              <td class="num">{{ bdtBengaliCurrencyFormat($item['per_ltr_price']) }}</td>
              <td class="num">{{ bdtBengaliCurrencyFormat($item['total_price']) }}</td>
              <td class="center">—</td>
            </tr>
          @endforeach
        </tbody>
        <tfoot>
          <tr>
            <td colspan="4" class="num">মোট টাকা</td>
            <td class="num">{{ bdtBengaliCurrencyFormat($totalBill) }}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </li>

    <li class="para">
      উপরোক্ত দাবিকৃত মূল্য বাবদ <span class="red">{{ bdtBengaliCurrencyFormat($totalBill) }}</span> টাকা জরুরি
      ভিত্তিতে
      “সি এস ডি ফিলিং স্টেশন” হিসাব নং <strong>০০০২-০২১০০৩৯৯৭৩</strong>
      দি ইস্টার্ন ব্যাংক লি. ক্যান্টনমেন্ট শাখা, ঢাকার অনুকূলে
      <strong>অফিসিয়াল চেক</strong> বা <strong>ব্যাংক ট্রান্সফার</strong> দ্বারা
      প্রদান করার জন্য অনুরোধ করা হলো।
    </li>

    <li class="para">
      বিল প্রতি সাপেক্ষে আগামী <strong>১৫ {{ $bengaliMonths[now()->month] }}
        {{ formatBengaliNumber(now()->year) }}</strong> তারিখের মধ্যে
      পরিশোধ করার জন্য অনুরোধ করা হলো। অনুগ্রহ করে চেক গ্রহণের পর
      প্রাপ্তির রসিদ/আবেদনপত্র প্রেরণ করবেন। অন লাইনে বিল পরিশোধের ক্ষেত্রে
      ভাউচার নম্বর উল্লেখ করে সি এস ডি ফিলিং স্টেশনকে অবগত করার জন্যও অনুরোধ করা হলো।
    </li>

    <li class="para">অনুমুত পূর্বক প্রাপ্তি স্বীকার করবেন।</li>
  </ol>

  <!-- Signature -->
  <div class="sig">
    <div class="name">লেফটেন্যান্ট কর্নেল (অব.) হাবিব আব্দুল্লাহ সাঈদ</div>
    <div class="desig">হেড অব ফিলিং স্টেশন অ্যান্ড মটর পার্টস
      <br>সি এস ডি ফিলিং স্টেশন
    </div>
  </div>

  <!-- Attachments / Copies -->
  <div class="meta-list">
    <div class="section">
      <h4>সংযুক্তঃ</h4>
      <ul>
        <li>জ্বালানী সংগ্রহের কুপন - {{ formatBengaliNumber($totalCoupon) }} টি।</li>
        <li>বিল সামারী - {{ formatBengaliNumber($pageCount) }} কপি।</li>
      </ul>
    </div>

    <div class="section">
      <h4>বিতরণঃ</h4>
    </div>

    <div class="section">
      <h4>বহির্গমনঃ</h4>
    </div>

    <div class="section">
      <h4>কার্যক্রমঃ</h4>
      <div class="red">{{ $organization->name_bn }}</div>
    </div>
  </div>
</body>

</html>