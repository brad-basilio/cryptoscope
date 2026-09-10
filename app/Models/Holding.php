<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Holding extends Model
{
    use HasFactory;

    protected $fillable = ['uuid', 'user_id', 'symbol', 'amount', 'cost_basis'];

    protected $casts = [
        'amount'     => 'float',
        'cost_basis' => 'float',
    ];

    protected static function booted(): void
    {
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function targets()
    {
        return $this->hasMany(PortfolioTarget::class);
    }
}
