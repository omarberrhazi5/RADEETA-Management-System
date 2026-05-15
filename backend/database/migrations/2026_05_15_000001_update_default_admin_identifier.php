<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $admin = DB::table('users')
            ->where('identifiant', 'admin')
            ->orWhere('email', 'admin@example.com')
            ->orderBy('id')
            ->first();

        if (! $admin) {
            return;
        }

        $identifierTaken = DB::table('users')
            ->where('identifiant', 'nabil.hammoch')
            ->where('id', '!=', $admin->id)
            ->exists();

        if ($identifierTaken) {
            return;
        }

        DB::table('users')->where('id', $admin->id)->update([
            'nom' => 'Hammoch',
            'prenom' => 'Nabil',
            'identifiant' => 'nabil.hammoch',
            'name' => 'Nabil Hammoch',
            'email' => 'admin@example.com',
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        $user = DB::table('users')
            ->where('identifiant', 'nabil.hammoch')
            ->where('email', 'admin@example.com')
            ->first();

        if (! $user) {
            return;
        }

        $identifierTaken = DB::table('users')
            ->where('identifiant', 'admin')
            ->where('id', '!=', $user->id)
            ->exists();

        if ($identifierTaken) {
            return;
        }

        DB::table('users')->where('id', $user->id)->update([
            'nom' => 'Responsable',
            'prenom' => 'Default',
            'identifiant' => 'admin',
            'name' => 'Default Admin',
            'email' => 'admin@example.com',
            'updated_at' => now(),
        ]);
    }
};
