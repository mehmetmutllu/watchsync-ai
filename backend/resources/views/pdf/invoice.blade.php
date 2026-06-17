<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Rechnung {{ $invoice->invoice_number }}</title>
    <style>
        body {
            font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;
            color: #333;
            line-height: 1.5;
            font-size: 14px;
        }
        .header {
            width: 100%;
            margin-bottom: 40px;
        }
        .header td {
            vertical-align: top;
        }
        .company-details {
            text-align: right;
            font-size: 12px;
            color: #555;
        }
        .customer-details {
            margin-top: 40px;
            margin-bottom: 40px;
        }
        .invoice-details {
            margin-bottom: 30px;
        }
        table.items {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        table.items th, table.items td {
            padding: 10px;
            border-bottom: 1px solid #ddd;
            text-align: left;
        }
        table.items th {
            background-color: #f8f8f8;
            font-weight: bold;
        }
        table.items td.right {
            text-align: right;
        }
        table.items th.right {
            text-align: right;
        }
        .totals {
            width: 50%;
            float: right;
        }
        .totals table {
            width: 100%;
            border-collapse: collapse;
        }
        .totals table td {
            padding: 5px 10px;
            text-align: right;
        }
        .totals table tr.bold td {
            font-weight: bold;
            border-top: 2px solid #333;
        }
        .footer {
            position: absolute;
            bottom: 30px;
            width: 100%;
            text-align: center;
            font-size: 10px;
            color: #777;
            border-top: 1px solid #eee;
            padding-top: 10px;
        }
    </style>
</head>
<body>
    <table class="header">
        <tr>
            <td>
                <h1 style="color: #3b82f6; margin: 0;">WatchSync AI</h1>
                <p style="margin: 0; color: #777;">Premium Watch Inventory Management</p>
            </td>
            <td class="company-details">
                <strong>{{ $dealer->company_name ?? 'Dein Uhrenhandel' }}</strong><br>
                {{ $dealer->address ?? 'Musterstraße 1' }}<br>
                {{ $dealer->city ?? '12345 Musterstadt' }}<br>
                {{ $dealer->email ?? 'info@beispiel.de' }}
            </td>
        </tr>
    </table>

    <div class="customer-details">
        <strong>Rechnungsempfänger:</strong><br>
        {{ $invoice->customer->first_name }} {{ $invoice->customer->last_name }}<br>
        @if($invoice->company_name)
            {{ $invoice->company_name }}<br>
        @endif
        @if($invoice->customer->address)
            {{ $invoice->customer->address }}<br>
        @endif
        {{ $invoice->customer->email }}
    </div>

    <div class="invoice-details">
        <h2 style="margin-bottom: 5px;">Rechnung {{ $invoice->invoice_number }}</h2>
        <strong>Rechnungsdatum:</strong> {{ \Carbon\Carbon::parse($invoice->issue_date)->format('d.m.Y') }}<br>
        <strong>Fälligkeitsdatum:</strong> {{ $invoice->due_date ? \Carbon\Carbon::parse($invoice->due_date)->format('d.m.Y') : 'Sofort nach Erhalt' }}<br>
    </div>

    <table class="items">
        <thead>
            <tr>
                <th>Pos.</th>
                <th>Beschreibung</th>
                <th class="right">Menge</th>
                <th class="right">Einzelpreis</th>
                <th class="right">Gesamt</th>
            </tr>
        </thead>
        <tbody>
            @foreach($invoice->items as $index => $item)
            <tr>
                <td>{{ $index + 1 }}</td>
                <td>{{ $item->description }}</td>
                <td class="right">{{ $item->quantity }}</td>
                <td class="right">{{ number_format($item->unit_price, 2, ',', '.') }} €</td>
                <td class="right">{{ number_format($item->total, 2, ',', '.') }} €</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="totals">
        <table>
            <tr>
                <td>Zwischensumme:</td>
                <td>{{ number_format($invoice->subtotal, 2, ',', '.') }} €</td>
            </tr>
            <tr>
                <td>Umsatzsteuer ({{ number_format($invoice->tax_rate, 2, ',', '.') }}%):</td>
                <td>{{ number_format($invoice->tax_amount, 2, ',', '.') }} €</td>
            </tr>
            <tr class="bold">
                <td>Gesamtbetrag:</td>
                <td>{{ number_format($invoice->total, 2, ',', '.') }} €</td>
            </tr>
        </table>
    </div>
    
    <div style="clear: both;"></div>

    @if($invoice->notes)
    <div style="margin-top: 50px;">
        <strong>Hinweise:</strong><br>
        {{ $invoice->notes }}
    </div>
    @endif

    <div class="footer">
        {{ $dealer->company_name ?? 'Dein Uhrenhandel' }} | Steuernummer: {{ $dealer->tax_id ?? 'DE123456789' }} | Bank: Musterbank, IBAN: DEXX XXXX XXXX XXXX XXXX XX
    </div>
</body>
</html>
