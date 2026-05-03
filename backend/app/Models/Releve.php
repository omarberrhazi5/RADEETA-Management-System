<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Releve extends Model
{
    use HasFactory;

    protected $fillable = [
        'compteur_id',
        'ancien_index',
        'nouvel_index',
        'consommation',
        'periode_debut',
        'periode_fin',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'ancien_index' => 'decimal:2',
            'nouvel_index' => 'decimal:2',
            'consommation' => 'decimal:2',
            'periode_debut' => 'date',
            'periode_fin' => 'date',
        ];
    }

    public function compteur(): BelongsTo
    {
        return $this->belongsTo(Compteur::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function facture(): HasOne
    {
        return $this->hasOne(Facture::class);
    }

    protected static function booted(): void
    {
        static::saving(function (Releve $releve): void {
            $releve->consommation = max(0, (float) $releve->nouvel_index - (float) $releve->ancien_index);
        });
    }
}
