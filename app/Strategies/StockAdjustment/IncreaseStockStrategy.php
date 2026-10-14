<?php

namespace App\Strategies\StockAdjustment;

class IncreaseStockStrategy implements StockAdjustmentStrategy
{
    public function calculateNewStock(int $currentStock, int $quantity): int
    {
        return $currentStock + $quantity;
    }
}