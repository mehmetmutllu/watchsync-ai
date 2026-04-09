<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Notifications\InvoiceSentNotification;
use App\Services\InvoiceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function __construct(
        private InvoiceService $invoiceService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $dealerId = $request->user()->dealer_id;

        $query = Invoice::where('dealer_id', $dealerId)
            ->with('customer:id,first_name,last_name,company');

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $invoices = $query->orderByDesc('issue_date')->paginate(20);

        return response()->json($invoices);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id'     => 'nullable|exists:customers,id',
            'issue_date'      => 'required|date',
            'due_date'        => 'nullable|date|after_or_equal:issue_date',
            'tax_rate'        => 'sometimes|numeric|min:0|max:100',
            'currency'        => 'sometimes|string|size:3',
            'notes'           => 'nullable|string|max:2000',
            'company_name'    => 'nullable|string|max:200',
            'company_address' => 'nullable|string|max:1000',
            'tax_id'          => 'nullable|string|max:50',
            'items'           => 'required|array|min:1',
            'items.*.watch_id'    => 'nullable|exists:watches,id',
            'items.*.description' => 'required|string|max:500',
            'items.*.quantity'    => 'sometimes|integer|min:1|max:999',
            'items.*.unit_price'  => 'required|numeric|min:0',
        ]);

        $dealerId = $request->user()->dealer_id;

        $invoice = Invoice::create([
            'dealer_id'       => $dealerId,
            'customer_id'     => $validated['customer_id'] ?? null,
            'invoice_number'  => $this->invoiceService->generateNextNumber($dealerId),
            'status'          => 'draft',
            'issue_date'      => $validated['issue_date'],
            'due_date'        => $validated['due_date'] ?? null,
            'tax_rate'        => $validated['tax_rate'] ?? 19.00,
            'currency'        => $validated['currency'] ?? 'EUR',
            'notes'           => $validated['notes'] ?? null,
            'company_name'    => $validated['company_name'] ?? null,
            'company_address' => $validated['company_address'] ?? null,
            'tax_id'          => $validated['tax_id'] ?? null,
        ]);

        foreach ($validated['items'] as $item) {
            $qty   = $item['quantity'] ?? 1;
            $total = round($qty * $item['unit_price'], 2);

            $invoice->items()->create([
                'watch_id'    => $item['watch_id'] ?? null,
                'description' => $item['description'],
                'quantity'    => $qty,
                'unit_price'  => $item['unit_price'],
                'total'       => $total,
            ]);
        }

        $invoice->recalculate();
        $invoice->load(['items', 'customer:id,first_name,last_name']);

        return response()->json(['data' => $invoice], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $invoice = Invoice::where('dealer_id', $request->user()->dealer_id)
            ->with(['customer', 'items.watch:id,brand,model_name,reference_number'])
            ->findOrFail($id);

        return response()->json(['data' => $invoice]);
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

    public function downloadPdf(Request $request, int $id)
    {
        $invoice = Invoice::where('dealer_id', $request->user()->dealer_id)
            ->findOrFail($id);

        return $this->invoiceService->streamPdf($invoice);
    }

    public function send(Request $request, int $id): JsonResponse
    {
        $invoice = Invoice::where('dealer_id', $request->user()->dealer_id)
            ->with('customer')
            ->findOrFail($id);

        if (!$invoice->customer || !$invoice->customer->email) {
            return response()->json(['message' => 'Müşterinin e-posta adresi yok.'], 422);
        }

        $invoice->customer->notify(new InvoiceSentNotification($invoice));

        if ($invoice->status === 'draft') {
            $invoice->update(['status' => 'sent']);
        }

        return response()->json(['message' => 'Fatura e-posta ile gönderildi.']);
    }
}
