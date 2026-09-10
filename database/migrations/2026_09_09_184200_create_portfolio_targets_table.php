<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('portfolio_targets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('holding_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['take_profit', 'stop_loss']);
            $table->enum('mode', ['price', 'percent']); // trigger by USD price or by ROI %
            $table->decimal('value', 20, 8); // the target price or percentage
            $table->boolean('triggered')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('portfolio_targets');
    }
};
