<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class PortfolioTarget extends Model
{
    use HasFactory;

    protected $fillable = ['uuid', 'holding_id', 'type', 'mode', 'value', 'triggered'];

    protected $casts = [
        'value'     => 'float',
        'triggered' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    public function holding()
    {
        return $this->belongsTo(Holding::class);
    }
}
