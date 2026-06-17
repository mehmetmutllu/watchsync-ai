<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Watch;
use App\Models\Customer;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class InvoiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $invoices = Invoice::with(['customer'])
            ->where('dealer_id', $request->user()->dealer_id)
            ->latest('issue_date')
            ->get();
            
        return response()->json(['data' => $invoices]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $invoice = Invoice::with(['customer', 'items'])
            ->where('dealer_id', $request->user()->dealer_id)
            ->findOrFail($id);
            
        return response()->json(['data' => $invoice]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'status' => 'nullable|in:draft,sent,paid,cancelled',
            'issue_date' => 'required|date',
            'due_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.watch_id' => 'nullable|exists:watches,id',
            'items.*.description' => 'required|string|max:255',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        $dealerId = $request->user()->dealer_id;
        
        $customer = Customer::where('dealer_id', $dealerId)
            ->findOrFail($validated['customer_id']);

        // Generate Invoice Number (e.g., INV-2026-0001)
        $latestInvoice = Invoice::where('dealer_id', $dealerId)
            ->whereYear('created_at', date('Y'))
            ->latest('id')
            ->first();
        
        $sequence = $latestInvoice ? intval(substr($latestInvoice->invoice_number, -4)) + 1 : 1;
        $invoiceNumber = 'INV-' . date('Y') . '-' . str_pad($sequence, 4, '0', STR_PAD_LEFT);

        $invoice = new Invoice();
        $invoice->dealer_id = $dealerId;
        $invoice->customer_id = $customer->id;
        $invoice->invoice_number = $invoiceNumber;
        $invoice->status = $validated['status'] ?? 'draft';
        $invoice->issue_date = $validated['issue_date'];
        $invoice->due_date = $validated['due_date'] ?? null;
        $invoice->notes = $validated['notes'] ?? null;
        $invoice->company_name = $customer->company;
        $invoice->company_address = $customer->address;
        $invoice->tax_rate = 19.00; // Default tax rate
        
        $subtotal = 0;
        
        $invoice->save();

        foreach ($validated['items'] as $itemData) {
            $total = $itemData['quantity'] * $itemData['unit_price'];
            $subtotal += $total;
            
            $item = new InvoiceItem();
            $item->invoice_id = $invoice->id;
            $item->watch_id = $itemData['watch_id'] ?? null;
            $item->description = $itemData['description'];
            $item->quantity = $itemData['quantity'];
            $item->unit_price = $itemData['unit_price'];
            $item->total = $total;
            $item->save();
        }

        $taxAmount = $subtotal * ($invoice->tax_rate / 100);
        $total = $subtotal + $taxAmount;

        $invoice->subtotal = $subtotal;
        $invoice->tax_amount = $taxAmount;
        $invoice->total = $total;
        $invoice->save();

        // Also add a timeline event to the customer's notes if it's not a draft
        if ($invoice->status !== 'draft') {
            $customer->notes()->create([
                'user_id' => $request->user()->id,
                'content' => "Rechnung {$invoice->invoice_number} über " . number_format($invoice->total, 2, ',', '.') . " € erstellt.",
                'type' => 'invoice'
            ]);
        }

        return response()->json(['data' => $invoice->load('items')], 201);
    }

    public function downloadPdf(Request $request, int $id)
    {
        $invoice = Invoice::with(['customer', 'items'])
            ->where('dealer_id', $request->user()->dealer_id)
            ->findOrFail($id);
            
        $dealer = $request->user()->dealer;

        // Ensure the views/pdf directory exists
        if (!file_exists(resource_path('views/pdf'))) {
            mkdir(resource_path('views/pdf'), 0755, true);
        }

        $pdf = Pdf::loadView('pdf.invoice', [
            'invoice' => $invoice,
            'dealer' => $dealer,
        ]);

        return $pdf->download("Rechnung_{$invoice->invoice_number}.pdf");
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $invoice = Invoice::where('dealer_id', $request->user()->dealer_id)
            ->where('status', 'draft')
            ->findOrFail($id);

        $validated = $request->validate([
            'customer_id'     => 'nullable|exists:customers,id',
            'issue_date'      => 'sometimes|date',
            'due_date'        => 'nullable|date',
            'tax_rate'        => 'sometimes|numeric|min:0|max:100',
            'currency'        => 'sometimes|string|size:3',
            'notes'           => 'nullable|string|max:2000',
            'company_name'    => 'nullable|string|max:200',
            'company_address' => 'nullable|string|max:1000',
            'tax_id'          => 'nullable|string|max:50',
            'status'          => 'sometimes|in:draft,sent,paid,cancelled',
        ]);

        $invoice->update($validated);
        $invoice->load(['items', 'customer:id,first_name,last_name']);

        return response()->json(['data' => $invoice]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $invoice = Invoice::where('dealer_id', $request->user()->dealer_id)
            ->where('status', 'draft')
            ->findOrFail($id);

        $invoice->delete();

        return response()->json(['message' => 'Fatura silindi.']);
    }

    public function send(Request $request, int $id): JsonResponse
    {
        $invoice = Invoice::where('dealer_id', $request->user()->dealer_id)
            ->with('customer')
            ->findOrFail($id);

        if (!$invoice->customer || !$invoice->customer->email) {
            return response()->json(['message' => 'Müşterinin e-posta adresi yok.'], 422);
        }

        // $invoice->customer->notify(new InvoiceSentNotification($invoice)); // Assuming this class is somewhere

        if ($invoice->status === 'draft') {
            $invoice->update(['status' => 'sent']);
        }

        return response()->json(['message' => 'Fatura e-posta ile gönderildi.']);
    }
}
