<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Compteur extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'cadran',
        'calibre',
        'marque',
        'index_releve',
        'id_client',
        'id_secteur',
    ];

    protected function casts(): array
    {
        return [
            'index_releve' => 'decimal:2',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'id_client')->withTrashed();
    }

    public function secteur(): BelongsTo
    {
        return $this->belongsTo(Secteur::class, 'id_secteur')->withTrashed();
    }

    public function pannes(): HasMany
    {
        return $this->hasMany(Panne::class, 'id_compteur');
    }

    protected static function booted(): void
    {
        static::deleting(function (Compteur $compteur): void {
            if (! $compteur->isForceDeleting()) {
                $compteur->pannes()->delete();
            }
        });

        static::restoring(function (Compteur $compteur): void {
            $compteur->pannes()->withTrashed()->restore();
        });
    }
}
