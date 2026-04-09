<?php

namespace App\Services;

use App\Models\Invoice;
use Barryvdh\DomPDF\Facade\Pdf;

class InvoiceService
{
    public function generateNextNumber(int $dealerId): string
    {
        $year = now()->format('Y');
        $lastInvoice = Invoice::where('dealer_id', $dealerId)
            ->where('invoice_number', 'like', "INV-{$year}-%")
            ->orderByDesc('invoice_number')
            ->first();

        if ($lastInvoice) {
            $lastNum = (int) substr($lastInvoice->invoice_number, -5);
            $nextNum = $lastNum + 1;
        } else {
            $nextNum = 1;
        }

        return sprintf('INV-%s-%05d', $year, $nextNum);
    }

    public function generatePdf(Invoice $invoice): string
    {
        $invoice->load(['customer', 'items.watch', 'dealer']);

        $pdf = Pdf::loadView('invoices.pdf', [
            'invoice' => $invoice,
        ]);

        $pdf->setPaper('a4');

        $path = storage_path("app/private/invoices/{$invoice->invoice_number}.pdf");
        $dir = dirname($path);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $pdf->save($path);

        return $path;
    }

    public function streamPdf(Invoice $invoice)
    {
        $invoice->load(['customer', 'items.watch', 'dealer']);

        $pdf = Pdf::loadView('invoices.pdf', [
            'invoice' => $invoice,
        ]);

        $pdf->setPaper('a4');

        return $pdf->stream("{$invoice->invoice_number}.pdf");
    }
}
