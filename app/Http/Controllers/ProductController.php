<?php

namespace App\Http\Controllers;

use App\Http\Requests\AdjustStockRequest;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Product;
use App\Services\InventoryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function __construct(
        private readonly InventoryService $inventoryService
    ) {}

    public function index(Request $request): Response
    {
        $filters = $request->only(['search', 'status']);

        $products = Product::query()
            ->with(['adjustments' => fn ($query) => $query->limit(5)])
            ->search($filters['search'] ?? null)
            ->filterByStatus($filters['status'] ?? null)
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('products/index', [
            'products' => $products,
            'filters' => [
                'search' => $filters['search'] ?? '',
                'status' => $filters['status'] ?? '',
            ],
        ]);
    }

    public function store(StoreProductRequest $request): RedirectResponse
    {
        Product::create($request->validated());

        return back()->with('success', 'Product created successfully.');
    }

    public function update(UpdateProductRequest $request, Product $product): RedirectResponse
    {
        $product->update($request->validated());

        return back()->with('success', 'Product updated successfully.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        if ($product->stock_quantity > 0) {
            return back()->withErrors([
                'delete' => "Cannot delete '{$product->name}' because it still has {$product->stock_quantity} items in stock. Adjust stock to 0 first.",
            ]);
        }

        $product->delete();

        return back()->with('success', 'Product deleted successfully.');
    }

    public function adjustStock(AdjustStockRequest $request, Product $product): RedirectResponse
    {
        $validated = $request->validated();

        $this->inventoryService->adjustStock(
            product: $product,
            type: $validated['type'],
            quantity: (int) $validated['quantity'],
            reason: $validated['reason']
        );

        return back()->with('success', 'Stock adjusted successfully.');
    }
}
