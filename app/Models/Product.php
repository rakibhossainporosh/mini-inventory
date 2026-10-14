<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'sku',
        'price',
        'stock_quantity',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'stock_quantity' => 'integer',
        ];
    }

    public function adjustments(): HasMany
    {
        return $this->hasMany(StockAdjustment::class)->latest();
    }

    /**
     * Scope a query to search products by name or SKU.
     */
    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        return $query->when($search, function (Builder $q, string $term) {
            $q->where(function (Builder $subQuery) use ($term) {
                $subQuery->where('name', 'like', "%{$term}%")
                         ->orWhere('sku', 'like', "%{$term}%");
            });
        });
    }

    /**
     * Scope a query to filter products by stock status.
     */
    public function scopeFilterByStatus(Builder $query, ?string $status): Builder
    {
        return $query->when($status, function (Builder $q, string $status) {
            match ($status) {
                'out_of_stock' => $q->where('stock_quantity', 0),
                'low_stock'    => $q->whereBetween('stock_quantity', [1, 9]),
                'in_stock'     => $q->where('stock_quantity', '>=', 10),
                default        => $q,
            };
        });
    }
}