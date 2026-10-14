<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $product_id
 * @property string $type
 * @property int $quantity_change
 * @property string $reason
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class StockAdjustment extends Model
{
    protected $fillable = [
        'product_id',
        'type',
        'quantity_change',
        'reason',
    ];

    protected function casts(): array
    {
        return [
            'quantity_change' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
