<?php

namespace App\Services;

use App\Models\Product;
use App\Strategies\StockAdjustment\StockAdjustmentStrategyFactory;
use Illuminate\Support\Facades\DB;

class InventoryService
{
    public function adjustStock(Product $product, string $type, int $quantity, string $reason): Product
    {
        return DB::transaction(function () use ($product, $type, $quantity, $reason) {
            $lockedProduct = Product::where('id', $product->id)
                ->lockForUpdate()
                ->firstOrFail();

            // Resolve strategy and calculate new stock
            $strategy = StockAdjustmentStrategyFactory::make($type);
            $newStock = $strategy->calculateNewStock($lockedProduct->stock_quantity, $quantity);

            // Update Product Stock
            $lockedProduct->update([
                'stock_quantity' => $newStock,
            ]);

            $lockedProduct->adjustments()->create([
                'type'            => $type,
                'quantity_change' => $quantity,
                'reason'          => $reason,
            ]);

            return $lockedProduct;
        });
    }
}