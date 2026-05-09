<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Laravel\Sanctum\PersonalAccessToken;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('auth:clear-tokens {--user= : Only clear tokens for a specific user ID}', function () {
    $query = PersonalAccessToken::query();

    if ($userId = $this->option('user')) {
        $query->where('tokenable_type', App\Models\User::class)
            ->where('tokenable_id', $userId);
    }

    $deleted = $query->delete();

    $this->info("Cleared {$deleted} personal access token(s).");
})->purpose('Clear Sanctum personal access tokens after authentication or role changes');
