<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \App\Models\User::updateOrCreate(
            ['email' => 'admin@cryptoscope.mousydev.website'],
            [
                'name'              => 'Super Admin',
                'password'          => \Illuminate\Support\Facades\Hash::make('Admin2026!CryptoScope'),
                'role'              => 'super_admin',
                'email_verified_at' => now(),
            ]
        );
    }
}
