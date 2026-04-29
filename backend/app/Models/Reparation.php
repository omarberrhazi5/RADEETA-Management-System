<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Reparation extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'id_panne',
        'id_plombier',
        'date_reparation',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'date_reparation' => 'date',
        ];
    }

    public function panne(): BelongsTo
    {
        return $this->belongsTo(Panne::class, 'id_panne');
    }

    public function plombier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_plombier');
    }
}
