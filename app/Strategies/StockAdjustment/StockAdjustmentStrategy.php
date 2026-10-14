<?php

namespace App\Strategies\StockAdjustment;

interface StockAdjustmentStrategy
{
    public function calculateNewStock(int $currentStock, int $quantity): int;
}
