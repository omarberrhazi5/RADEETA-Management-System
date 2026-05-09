<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Intervention extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'intervention_number',
        'panne_id',
        'client_id',
        'meter_id',
        'technician_id',
        'service_type',
        'work_type',
        'materials_used',
        'observations',
        'priority',
        'status',
        'started_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'materials_used' => 'array',
        ];
    }

    public function panne(): BelongsTo
    {
        return $this->belongsTo(Panne::class, 'panne_id');
    }

    public function technician(): BelongsTo
    {
        return $this->belongsTo(User::class, 'technician_id');
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'client_id')->withTrashed();
    }

    public function meter(): BelongsTo
    {
        return $this->belongsTo(Compteur::class, 'meter_id')->withTrashed();
    }

    protected static function booted(): void
    {
        static::creating(function (Intervention $intervention): void {
            if (! $intervention->intervention_number) {
                $intervention->intervention_number = self::nextNumber();
            }
        });
    }

    private static function nextNumber(): string
    {
        $prefix = 'INT-'.now()->format('Ymd').'-';
        $last = self::withTrashed()
            ->where('intervention_number', 'like', $prefix.'%')
            ->orderByDesc('id')
            ->value('intervention_number');

        $next = $last ? ((int) str($last)->afterLast('-')->toString()) + 1 : 1;

        return $prefix.str_pad((string) $next, 4, '0', STR_PAD_LEFT);
    }
}
