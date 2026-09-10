<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('holdings', function (Blueprint $table) {
            $table->id();
            $table->string('symbol', 20);
            $table->decimal('amount', 20, 8);
            $table->decimal('cost_basis', 20, 8); // precio de compra promedio en USD
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('holdings');
    }
};
