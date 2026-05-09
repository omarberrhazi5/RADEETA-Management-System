<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('users')) {
            if (! Schema::hasColumn('users', 'agence')) {
                Schema::table('users', function (Blueprint $table): void {
                    $table->string('agence')->default('SRM-FM Taza')->after('email');
                });
            }

            DB::table('users')->where('role', 'super_admin')->update(['role' => 'directeur']);
            DB::table('users')->where('role', 'admin')->update(['role' => 'responsable']);
        }

        if (Schema::hasTable('secteurs') && ! Schema::hasColumn('secteurs', 'agence')) {
            Schema::table('secteurs', function (Blueprint $table): void {
                $table->string('agence')->default('SRM-FM Taza')->after('emplacement');
            });
        }

        if (Schema::hasTable('clients')) {
            Schema::table('clients', function (Blueprint $table): void {
                if (! Schema::hasColumn('clients', 'type_abonnement')) {
                    $table->enum('type_abonnement', ['domestic', 'commercial', 'industrial'])->default('domestic')->after('adresse');
                }

                if (! Schema::hasColumn('clients', 'service_type')) {
                    $table->enum('service_type', ['water', 'electricity'])->default('water')->after('type_abonnement');
                }

                if (! Schema::hasColumn('clients', 'id_secteur')) {
                    $table->foreignId('id_secteur')->nullable()->after('type_abonnement')->constrained('secteurs')->nullOnDelete();
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('clients')) {
            Schema::table('clients', function (Blueprint $table): void {
                if (Schema::hasColumn('clients', 'id_secteur')) {
                    $table->dropConstrainedForeignId('id_secteur');
                }

                if (Schema::hasColumn('clients', 'type_abonnement')) {
                    $table->dropColumn('type_abonnement');
                }
            });
        }

        if (Schema::hasTable('secteurs') && Schema::hasColumn('secteurs', 'agence')) {
            Schema::table('secteurs', fn (Blueprint $table) => $table->dropColumn('agence'));
        }

        if (Schema::hasTable('users') && Schema::hasColumn('users', 'agence')) {
            Schema::table('users', fn (Blueprint $table) => $table->dropColumn('agence'));
        }
    }
};
