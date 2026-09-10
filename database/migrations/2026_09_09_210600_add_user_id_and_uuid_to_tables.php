<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('holdings', function (Blueprint $table) {
            $table->uuid('uuid')->nullable()->unique()->after('id');
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete()->after('uuid');
        });

        Schema::table('alerts', function (Blueprint $table) {
            $table->uuid('uuid')->nullable()->unique()->after('id');
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete()->after('uuid');
        });

        Schema::table('portfolio_targets', function (Blueprint $table) {
            $table->uuid('uuid')->nullable()->unique()->after('id');
        });
    }

    public function down(): void
    {
        Schema::table('holdings', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn(['user_id', 'uuid']);
        });

        Schema::table('alerts', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn(['user_id', 'uuid']);
        });

        Schema::table('portfolio_targets', function (Blueprint $table) {
            $table->dropColumn(['uuid']);
        });
    }
};
