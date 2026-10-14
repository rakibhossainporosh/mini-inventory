<?php

namespace App\Strategies\StockAdjustment;

use Illuminate\Validation\ValidationException;

class DecreaseStockStrategy implements StockAdjustmentStrategy
{
    public function calculateNewStock(int $currentStock, int $quantity): int
    {
        if ($currentStock < $quantity) {
            throw ValidationException::withMessages([
                'quantity' => "Insufficient stock! Current stock is {$currentStock}, cannot decrease by {$quantity}.",
            ]);
        }

        return $currentStock - $quantity;
    }
}