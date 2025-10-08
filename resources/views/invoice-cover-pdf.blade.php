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
            font-size: 9pt;
            line-height: 1.6;
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
            justify-content: flex-end;
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
            font-weight: 400;
            font-size: 10pt;
            letter-spacing: .3px;
            margin-bottom: 2px;
        }

        .brand-sub {
            font-size: 9pt;
            color: #000;
            margin: 0;
            line-height: 1.2;
            font-weight: 400;
        }

        .top-meta {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding-bottom: 6px;
            margin-bottom: 12px;
        }

        .ref {
            font-weight: 400;
            text-align: left;
            font-size: 9pt;
        }

        .date-loc {
            text-align: right;
            font-size: 9pt;
            font-weight: 400;
        }

        /* ====== Subject ====== */
        .subject {
            font-size: 10pt;
            margin: 8px 0 6px;
        }

        .subject .label {
            font-weight: 700;
            color: #000;
        }

        /* ====== Body ====== */
        .para {
            margin: 6px 0;
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
            margin: 6px 0 4px;
        }

        .sheet th,
        .sheet td {
            border: 1px solid var(--border);
            padding: 3px 4px;
            vertical-align: middle;
            font-size: 8pt;
        }

        .sheet thead th {
            background: #f5f5f5;
            font-weight: 700;
            text-align: center;
            font-size: 8pt;
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
            font-size: 8pt;
        }

        .muted {
            color: var(--muted);
        }

        /* ====== Footer blocks ====== */
        .sig {
            margin-top: 18px;
            text-align: right;
        }

        .sig .name {
            font-weight: 700;
            margin-top: 30px;
            font-size: 9pt;
        }

        .sig .desig {
            margin-top: 2px;
            font-size: 8pt;
            font-weight: 400;
        }

        .meta-list {
            margin-top: 12px;
            display: block;
        }

        .meta-list .section {
            margin-bottom: 6px;
        }

        .meta-list h4 {
            margin: 6px 0 3px;
            font-size: 9pt;
            color: #000;
            font-weight: 700;
        }

        .meta-list ul {
            margin: 0;
            padding-left: 14px;
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
            /* font-weight: 400; */
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
            'য়',
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
            12 => 'ডিসেম্বর',
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
            return new NumberFormatter('bn_BD', NumberFormatter::CURRENCY, '৳ #,##,##0.00')->format($amount);
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
                'adblue' => 'অ্যাডব্লু',
            ];
            return $fuelBnNames[strtolower($fuelName)] ?? $fuelName;
        }
    @endphp
    <!-- Header -->
    <div class="header">
        <div class="header-right">
            <div class="brand bn-text">সি এস ডি ফিলিং স্টেশন</div>
            <div class="brand-sub bn-text">সি এস ডি বাংলাদেশ</div>
            <div class="brand-sub bn-text">ঢাকা সেনানিবাস</div>
        </div>
    </div>

    <div class="top-meta">
        <div class="ref">নথি নং- সি এস ডি/ফিলিং
            স্টেশন/ক্রেডিট/{{ formatBengaliNumber($month) }}{{ formatBengaliNumber($year % 200) }} /
            {{ formatBengaliNumber($organization->ucode) }}
        </div>
        <div class="date-loc">
            {{ $bengaliMonths[now()->month] }} {{ formatBengaliNumber(now()->year) }}
        </div>
    </div>

    <!-- Subject -->
    <div class="subject">
        <span>বিষয়ঃ</span>
        <span style="text-decoration: underline;">
            সি এস ডি ফিলিং স্টেশন হতে {{ $bengaliMonths[$month] }} {{ $bengaliYear }} মাসে ক্রেডিট ভাউচারের মাধ্যমে
            প্রদত্ত
            পেট্রোলিয়াম
            পণ্যের বিল পরিশোধ প্রসঙ্গে।
        </span>
    </div>

    <!-- Body -->
    <ol class="bn">
        <li class="para">
            আপনাদের চাহিদা অনুযায়ী সি এস ডি ফিলিং স্টেশন হতে {{ $bengaliMonths[$month] }} {{ $bengaliYear }}
            মাসে
            ক্রেডিট ভাউচারের মাধ্যমে প্রদানকৃত পেট্রোলিয়াম পণ্যের বিল পরিশোধের নিমিত্তে নিম্নের্ণিত ছক মোতাবেক প্রেরণ
            করা হলোঃ
            <table class="sheet">
                <thead>
                    <tr>
                        <td style="width: 50px;">ক্রম নং</td>
                        <td>জ্বালানীর প্রকার</td>
                        <td class="num">পরিমান (লিটার)</td>
                        <td class="num">মূল্য (প্রতি লিটার)</td>
                        <td class="num">মোট মূল্য</td>
                        <td class="center" style="width: 60px;">মন্তব্য</td>
                    </tr>
                </thead>
                <tbody>
                    @php
                        $serial = 0;
                    @endphp
                    @foreach ($data as $index => $item)
                        @php
                            $indexStart = 0;
                        @endphp
                        @foreach ($item['per_ltr_price_ranges'] as $range => $price)
                            @php
                                $indexs =
                                    array_reduce(explode('-', $range), function ($carry, $item) {
                                        return (int) $item - (int) $carry;
                                    }) + 1;

                                $totalBillOfRange = 0;
                                $totalQtyOfRange = 0;
                                foreach ($item['vehicles'] as $vehicle) {
                                    for ($i = $indexStart; $i < $indexs; $i++) {
                                        $totalBillOfRange += $vehicle['quantities'][$i] * $price;
                                        $totalQtyOfRange += $vehicle['quantities'][$i];
                                    }
                                }
                                $indexStart += $indexs;
                            @endphp
                            <tr>
                                <td class="center">{{ $letterOrder[$serial] }}।</td>
                                <td>{{ getFuelBengaliName($item['fuel_name']) }}</td>
                                <td class="num red">{{ bdtBengaliCurrencyFormat($totalQtyOfRange) }}
                                </td>
                                <td class="num">{{ bdtBengaliCurrencyFormat($price) }}</td>
                                <td class="num red">
                                    {{ bdtBengaliCurrencyFormat($totalBillOfRange) }}</td>
                                <td class="center">—</td>
                            </tr>
                            @php
                                $serial += 1;
                            @endphp
                        @endforeach
                    @endforeach
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="4" class="num">মোট টাকা</td>
                        <td class="num red">{{ bdtBengaliCurrencyFormat($totalBill) }}</td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
        </li>

        <li class="para">
            উপরোক্ত জ্বালানীর মূল্য বাবদ <span class="red">{{ bdtBengaliCurrencyFormat($totalBill) }}</span> টাকা
            জরুরী
            ভিত্তিতে
            “সি এস ডি ফিলিং স্টেশন” হিসাব নং ০০০২-০২১০০৩৯৯৭৩
            দি ইস্টার্ন ব্যাংক লি. ক্যান্টনমেন্ট শাখা, ঢাকার অনুকূলে
            অফিসিয়াল চেক বা ব্যাংক ট্রান্সফার দ্বারা
            প্রদান করার জন্য অনুরোধ করা হলো।
        </li>

        <li class="para">
            বিল প্রাপ্তি সাপেক্ষে আগামী ১০ {{ $bengaliMonths[now()->month] }}
            {{ formatBengaliNumber(now()->year) }} তারিখের মধ্যে
            পরিশোধ করার জন্য অনুরোধ করা হলো। উল্লেখ্য যে, অবিনিমেয় চেক অবশ্যই আবরণী পত্রের মাধ্যমে প্রদান করতে হবে। অন
            লাইনে বিল পরিশোধের ক্ষেত্রে পত্রের মাধ্যমে সি এস ডি ফিলিং স্টেশন'কে অবগত করার জন্য অনুরোধ করা হলো।
        </li>

        <li class="para">অনুগ্রহ পূর্বক প্রাপ্তি স্বীকার করবেন।</li>
    </ol>

    <!-- Signature -->
    <div class="sig">
        <div class="name">লেঃ কর্নেল হাবিব আব্দুল্লাহ সাঈদ</div>
        <div class="desig">হেড অব ফিলিং স্টেশন এন্ড মটর পার্টস
            <br>সি এস ডি ফিলিং স্টেশন
        </div>
    </div>

    <!-- Attachments / Copies -->
    <div class="meta-list">
        <div class="section">
            <span>সংযুক্তঃ</span>
            <ul>
                <li>জ্বালানী সংগ্রহের কুপন - <span class="red">{{ formatBengaliNumber($totalCoupon) }}</span> টি।
                </li>
                <li>বিল সামারী - {{ formatBengaliNumber($pageCount) }} কপি।</li>
            </ul>
        </div>

        <div class="section">
            <span>বিতরণঃ</span>
        </div>

        <div class="section">
            <span>বহির্গমনঃ</span>
        </div>

        <div class="section">
            <span>কার্যক্রমঃ</span>
            <div class="red">{{ $organization->name_bn }}</div>
        </div>
    </div>
</body>

</html>
