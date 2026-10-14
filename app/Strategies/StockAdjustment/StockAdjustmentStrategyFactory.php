<?php

namespace App\Strategies\StockAdjustment;

use InvalidArgumentException;

class StockAdjustmentStrategyFactory
{
    public static function make(string $type): StockAdjustmentStrategy
    {
        return match ($type) {
            'increase' => new IncreaseStockStrategy(),
            'decrease' => new DecreaseStockStrategy(),
            default    => throw new InvalidArgumentException("Unsupported stock adjustment type: {$type}"),
        };
    }
}