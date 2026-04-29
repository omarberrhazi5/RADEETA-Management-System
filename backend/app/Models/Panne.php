<?php

namespace App\Models;

use App\Enums\PanneAnomalie;
use App\Enums\PanneStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Panne extends Model
{
    use HasFactory, SoftDeletes;

    public const ANOMALIES = PanneAnomalie::class;

    public const STATUSES = PanneStatus::class;

    protected $fillable = [
        'id_compteur',
        'date_panne',
        'anomalie',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'date_panne' => 'date',
            'anomalie' => PanneAnomalie::class,
            'status' => PanneStatus::class,
        ];
    }

    public function compteur(): BelongsTo
    {
        return $this->belongsTo(Compteur::class, 'id_compteur')->withTrashed();
    }

    public function reparations(): HasMany
    {
        return $this->hasMany(Reparation::class, 'id_panne');
    }

    protected static function booted(): void
    {
        static::deleting(function (Panne $panne): void {
            if (! $panne->isForceDeleting()) {
                $panne->reparations()->delete();
            }
        });

        static::restoring(function (Panne $panne): void {
            $panne->reparations()->withTrashed()->restore();
        });
    }
}
