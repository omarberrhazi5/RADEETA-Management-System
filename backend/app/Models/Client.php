<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Client extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'police',
        'nom',
        'prenom',
        'cin',
        'telephone',
        'adresse',
        'type_abonnement',
        'service_type',
        'id_secteur',
        'abonne',
    ];

    protected function casts(): array
    {
        return [
            'abonne' => 'boolean',
        ];
    }

    public function compteurs(): HasMany
    {
        return $this->hasMany(Compteur::class, 'id_client');
    }

    public function secteur(): BelongsTo
    {
        return $this->belongsTo(Secteur::class, 'id_secteur')->withTrashed();
    }

    protected static function booted(): void
    {
        static::deleting(function (Client $client): void {
            if (! $client->isForceDeleting()) {
                $client->compteurs()->delete();
            }
        });

        static::restoring(function (Client $client): void {
            $client->compteurs()->withTrashed()->restore();
        });
    }
}
