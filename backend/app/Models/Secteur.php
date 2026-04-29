<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Secteur extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'nom_secteur',
        'emplacement',
        'num_torne',
        'latitude',
        'longitude',
    ];

    public function compteurs(): HasMany
    {
        return $this->hasMany(Compteur::class, 'id_secteur');
    }

    public function pannes(): HasManyThrough
    {
        return $this->hasManyThrough(Panne::class, Compteur::class, 'id_secteur', 'id_compteur', 'id', 'id');
    }

    protected static function booted(): void
    {
        static::deleting(function (Secteur $secteur): void {
            if (! $secteur->isForceDeleting()) {
                $secteur->compteurs()->delete();
            }
        });

        static::restoring(function (Secteur $secteur): void {
            $secteur->compteurs()->withTrashed()->restore();
        });
    }
}
