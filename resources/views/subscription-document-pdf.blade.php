@php
    $isInvoice = $type === 'invoice';
    $documentNumber = $isInvoice ? $payment->invoice_number : $payment->receipt_number;
    $headerImage = 'data:image/png;base64,'.base64_encode(file_get_contents(public_path('subscription-documents/texon-header.png')));
    $footerImage = 'data:image/png;base64,'.base64_encode(file_get_contents(public_path('subscription-documents/texon-footer.png')));
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>{{ $isInvoice ? 'Subscription Invoice' : 'Money Receipt' }} {{ $documentNumber }}</title>
    <style>
        @page { size: letter; margin: 0; }
        * { box-sizing: border-box; }
        body { margin: 0; color: #172033; font-family: Arial, Helvetica, sans-serif; font-size: 11px; }
        .brand-header { position: absolute; top: 0; left: 0; width: 100%; }
        .brand-footer { position: absolute; bottom: 0; left: 0; width: 100%; }
        .page-content { padding: 152px 72px 142px; }
        .recipient { min-height: 116px; line-height: 1.5; }
        .recipient-label { margin: 0 0 7px; color: #1987ec; font-size: 10px; font-weight: bold; letter-spacing: 1.2px; text-transform: uppercase; }
        .recipient-name { margin: 0; font-size: 15px; font-weight: bold; }
        .recipient-detail { margin: 2px 0; color: #46556a; }
        .heading-row { display: table; width: 100%; margin: 14px 0 24px; }
        .heading-left, .heading-right { display: table-cell; vertical-align: top; }
        .heading-left { width: 57%; }
        .heading-right { width: 43%; text-align: right; }
        h1 { margin: 0 0 10px; color: #111d2f; font-size: 28px; font-weight: normal; }
        .document-number { margin: 0; color: #172033; font-size: 12px; font-weight: bold; }
        .small-label { display: block; margin-bottom: 4px; color: #6c7789; font-size: 9px; font-weight: bold; letter-spacing: .7px; text-transform: uppercase; }
        .document-date { margin-top: 7px; }
        .paid-stamp { display: inline-block; margin-top: 13px; border: 1px solid #168756; border-radius: 4px; padding: 5px 12px; color: #168756; font-size: 11px; font-weight: bold; letter-spacing: 1.5px; }
        .line-items { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .line-items th { background: #49b7ef; padding: 12px 10px; color: #fff; font-size: 10px; font-weight: bold; text-align: left; }
        .line-items th:last-child, .line-items td:last-child { text-align: right; }
        .line-items td { border-bottom: 2px solid #fff; background: #f0f2f4; padding: 14px 10px; vertical-align: top; line-height: 1.5; }
        .line-items .description { font-weight: bold; }
        .line-items .subtext { display: block; margin-top: 3px; color: #667386; font-size: 10px; font-weight: normal; }
        .summary { width: 255px; margin: 19px 0 0 auto; border-collapse: collapse; }
        .summary td { padding: 7px 0; }
        .summary td:last-child { text-align: right; font-weight: bold; }
        .summary .total td { border-top: 1px solid #d7dce3; padding-top: 10px; color: #0e7dce; font-size: 14px; }
        .details { margin-top: 33px; border-top: 1px solid #e1e5ea; padding-top: 19px; }
        .details-title { margin: 0 0 13px; font-size: 12px; font-weight: bold; }
        .details-grid { display: table; width: 100%; table-layout: fixed; }
        .details-row { display: table-row; }
        .details-cell { display: table-cell; width: 50%; padding: 0 14px 14px 0; vertical-align: top; overflow-wrap: anywhere; }
        .details-cell strong { font-size: 11px; }
        .thank-you { margin-top: 30px; color: #0875d9; font-size: 12px; font-weight: bold; text-align: right; }
    </style>
</head>
<body>
    <img class="brand-header" src="{{ $headerImage }}" alt="Texon Software Solutions">
    <img class="brand-footer" src="{{ $footerImage }}" alt="Texon contact information">

    <main class="page-content">
        <section class="recipient">
            <p class="recipient-label">{{ $isInvoice ? 'Invoice to' : 'Received from' }}</p>
            <p class="recipient-name">Head of Filling Station,<br>CSD Filling Station</p>
            <p class="recipient-detail">csdfillingstation@gmail.com</p>
        </section>

        <div class="heading-row">
            <div class="heading-left">
                <h1>{{ $isInvoice ? 'Invoice' : 'Money Receipt' }}</h1>
                <span class="small-label">{{ $isInvoice ? 'Invoice no.' : 'Receipt no.' }}</span>
                <p class="document-number">{{ $documentNumber }}</p>
            </div>
            <div class="heading-right">
                <span class="small-label">{{ $isInvoice ? 'Invoice date' : 'Receipt date' }}</span>
                <p class="document-date">{{ $payment->approved_at->format('d-m-Y') }}</p>
                <span class="paid-stamp">PAID</span>
            </div>
        </div>

        <table class="line-items">
            <thead>
                <tr>
                    <th style="width: 43%">Description</th>
                    <th style="width: 36%">Coverage</th>
                    <th style="width: 21%">Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <span class="description">{{ $payment->plan_name }} subscription</span>
                        <span class="subtext">Filling Station Software Services · {{ $payment->duration_months }} {{ $payment->duration_months === 1 ? 'month' : 'months' }}</span>
                    </td>
                    <td>{{ $payment->coverage_start->format('d M Y') }}<br>to {{ $payment->coverage_end->format('d M Y') }}</td>
                    <td>{{ number_format($payment->amount, 2) }} Tk</td>
                </tr>
            </tbody>
        </table>

        <table class="summary">
            <tr><td>{{ $isInvoice ? 'Paid amount' : 'Amount received' }}</td><td>{{ number_format($payment->amount, 2) }} Tk</td></tr>
            @if($isInvoice)
                <tr class="total"><td>Due amount</td><td>0.00 Tk</td></tr>
            @else
                <tr class="total"><td>Payment status</td><td>Paid</td></tr>
            @endif
        </table>

        <section class="details">
            <p class="details-title">{{ $isInvoice ? 'Payment details' : 'Receipt details' }}</p>
            <div class="details-grid">
                <div class="details-row">
                    <div class="details-cell"><span class="small-label">Payment method</span><strong>Manual bKash Send Money</strong></div>
                    <div class="details-cell"><span class="small-label">bKash Transaction ID / TrxID</span><strong>{{ $payment->transaction_id }}</strong></div>
                </div>
                <div class="details-row">
                    <div class="details-cell"><span class="small-label">{{ $isInvoice ? 'Payment submitted' : 'Payment date' }}</span><strong>{{ $payment->submitted_at->format('d-m-Y') }}</strong></div>
                    <div class="details-cell"><span class="small-label">Approved on</span><strong>{{ $payment->approved_at->format('d-m-Y') }}</strong></div>
                </div>
                @unless($isInvoice)
                    <div class="details-row">
                        <div class="details-cell"><span class="small-label">Approved by</span><strong>Texon Software Solutions</strong></div>
                        <div class="details-cell"><span class="small-label">Payment reference</span><strong>SP-{{ str_pad($payment->id, 6, '0', STR_PAD_LEFT) }}</strong></div>
                    </div>
                @endunless
            </div>
        </section>

        <p class="thank-you">Thank you for your business!</p>
    </main>
</body>
</html>
