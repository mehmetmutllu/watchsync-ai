<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Invoice {{ $invoice->invoice_number }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #1a1a1a; padding: 40px; }
        .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .company-info { max-width: 50%; }
        .company-info h1 { font-size: 24px; color: #0f172a; margin-bottom: 4px; }
        .company-info p { color: #64748b; line-height: 1.5; }
        .invoice-meta { text-align: right; }
        .invoice-meta h2 { font-size: 20px; color: #0f172a; margin-bottom: 8px; }
        .invoice-meta table td { padding: 2px 0; }
        .invoice-meta table td:first-child { color: #64748b; padding-right: 12px; }
        .status { display: inline-block; padding: 2px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
        .status-draft { background: #fef3c7; color: #92400e; }
        .status-sent { background: #dbeafe; color: #1e40af; }
        .status-paid { background: #d1fae5; color: #065f46; }
        .status-cancelled { background: #fee2e2; color: #991b1b; }
        .customer-section { margin-bottom: 30px; padding: 16px; background: #f8fafc; border-radius: 6px; }
        .customer-section h3 { font-size: 11px; text-transform: uppercase; color: #64748b; margin-bottom: 6px; }
        .customer-section p { line-height: 1.6; }
        table.items { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        table.items thead th { background: #0f172a; color: #fff; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; }
        table.items tbody td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
        table.items tbody tr:last-child td { border-bottom: none; }
        .text-right { text-align: right; }
        .totals { width: 280px; margin-left: auto; margin-bottom: 30px; }
        .totals table { width: 100%; }
        .totals table td { padding: 6px 0; }
        .totals table td:first-child { color: #64748b; }
        .totals table td:last-child { text-align: right; font-weight: 600; }
        .totals .grand-total td { font-size: 16px; border-top: 2px solid #0f172a; padding-top: 10px; color: #0f172a; }
        .notes { margin-top: 20px; padding: 16px; background: #fffbeb; border-radius: 6px; }
        .notes h3 { font-size: 11px; text-transform: uppercase; color: #92400e; margin-bottom: 6px; }
        .footer { margin-top: 40px; text-align: center; color: #94a3b8; font-size: 10px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
    </style>
</head>
<body>
    <table style="width:100%; margin-bottom:40px;">
        <tr>
            <td style="width:50%; vertical-align:top;">
                <div class="company-info">
                    <h1>{{ $invoice->company_name ?? $invoice->dealer->name ?? 'WatchSync' }}</h1>
                    @if($invoice->company_address)
                        <p>{!! nl2br(e($invoice->company_address)) !!}</p>
                    @endif
                    @if($invoice->tax_id)
                        <p style="margin-top:4px;">Tax ID: {{ $invoice->tax_id }}</p>
                    @endif
                </div>
            </td>
            <td style="width:50%; vertical-align:top; text-align:right;">
                <h2 style="font-size:20px; color:#0f172a; margin-bottom:8px;">INVOICE</h2>
                <table style="margin-left:auto;">
                    <tr><td style="color:#64748b; padding-right:12px;">Number:</td><td><strong>{{ $invoice->invoice_number }}</strong></td></tr>
                    <tr><td style="color:#64748b; padding-right:12px;">Date:</td><td>{{ $invoice->issue_date->format('d.m.Y') }}</td></tr>
                    @if($invoice->due_date)
                    <tr><td style="color:#64748b; padding-right:12px;">Due:</td><td>{{ $invoice->due_date->format('d.m.Y') }}</td></tr>
                    @endif
                    <tr><td style="color:#64748b; padding-right:12px;">Status:</td><td><span class="status status-{{ $invoice->status }}">{{ ucfirst($invoice->status) }}</span></td></tr>
                </table>
            </td>
        </tr>
    </table>

    @if($invoice->customer)
    <div class="customer-section">
        <h3>Bill To</h3>
        <p>
            <strong>{{ $invoice->customer->first_name }} {{ $invoice->customer->last_name }}</strong><br>
            @if($invoice->customer->company){{ $invoice->customer->company }}<br>@endif
            @if($invoice->customer->address){{ $invoice->customer->address }}<br>@endif
            @if($invoice->customer->postal_code || $invoice->customer->city){{ $invoice->customer->postal_code }} {{ $invoice->customer->city }}<br>@endif
            @if($invoice->customer->country){{ $invoice->customer->country }}<br>@endif
            @if($invoice->customer->email){{ $invoice->customer->email }}@endif
        </p>
    </div>
    @endif

    <table class="items">
        <thead>
            <tr>
                <th style="width:5%;">#</th>
                <th style="width:50%;">Description</th>
                <th style="width:10%;" class="text-right">Qty</th>
                <th style="width:17%;" class="text-right">Unit Price</th>
                <th style="width:18%;" class="text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($invoice->items as $i => $item)
            <tr>
                <td>{{ $i + 1 }}</td>
                <td>
                    {{ $item->description }}
                    @if($item->watch)
                        <br><small style="color:#64748b;">Ref: {{ $item->watch->reference_number ?? '' }}</small>
                    @endif
                </td>
                <td class="text-right">{{ $item->quantity }}</td>
                <td class="text-right">{{ number_format($item->unit_price, 2, ',', '.') }} {{ $invoice->currency }}</td>
                <td class="text-right">{{ number_format($item->total, 2, ',', '.') }} {{ $invoice->currency }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="totals">
        <table>
            <tr>
                <td>Subtotal</td>
                <td>{{ number_format($invoice->subtotal, 2, ',', '.') }} {{ $invoice->currency }}</td>
            </tr>
            <tr>
                <td>Tax ({{ number_format($invoice->tax_rate, 1) }}%)</td>
                <td>{{ number_format($invoice->tax_amount, 2, ',', '.') }} {{ $invoice->currency }}</td>
            </tr>
            <tr class="grand-total">
                <td>Total</td>
                <td>{{ number_format($invoice->total, 2, ',', '.') }} {{ $invoice->currency }}</td>
            </tr>
        </table>
    </div>

    @if($invoice->notes)
    <div class="notes">
        <h3>Notes</h3>
        <p>{!! nl2br(e($invoice->notes)) !!}</p>
    </div>
    @endif

    <div class="footer">
        <p>This invoice was generated by WatchSync AI &mdash; {{ now()->format('d.m.Y H:i') }}</p>
    </div>
</body>
</html>
