<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Facture extends Model
{
    use HasFactory;

    public const STATUT_PAYEE = 'payee';
    public const STATUT_IMPAYEE = 'impayee';
    public const STATUT_PARTIELLE = 'partielle';

    protected $fillable = [
        'client_id',
        'compteur_id',
        'releve_id',
        'reference',
        'tournee',
        'numero_client',
        'client_name',
        'address',
        'numero_contrat',
        'usage_type',
        'agence',
        'facture_date',
        'periode_debut',
        'periode_fin',
        'numero_facture_eau_assainissement',
        'compteur_number',
        'coefficient',
        'diametre_compteur',
        'ancienne_date_lecture',
        'nouvelle_date_lecture',
        'ancien_index',
        'nouvel_index',
        'consommation_m3',
        'montant_ht',
        'taxes',
        'tva',
        'total_ttc',
        'montant_especes',
        'montant_autre_mode',
        'line_items',
        'detail_snapshot',
        'statut',
        'due_date',
        'generated_at',
    ];

    protected function casts(): array
    {
        return [
            'montant_ht' => 'decimal:2',
            'taxes' => 'decimal:2',
            'tva' => 'decimal:2',
            'total_ttc' => 'decimal:2',
            'montant_especes' => 'decimal:2',
            'montant_autre_mode' => 'decimal:2',
            'coefficient' => 'decimal:2',
            'ancien_index' => 'decimal:2',
            'nouvel_index' => 'decimal:2',
            'consommation_m3' => 'decimal:2',
            'line_items' => 'array',
            'detail_snapshot' => 'array',
            'facture_date' => 'date',
            'periode_debut' => 'date',
            'periode_fin' => 'date',
            'ancienne_date_lecture' => 'date',
            'nouvelle_date_lecture' => 'date',
            'due_date' => 'date',
            'generated_at' => 'datetime',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function compteur(): BelongsTo
    {
        return $this->belongsTo(Compteur::class);
    }

    public function releve(): BelongsTo
    {
        return $this->belongsTo(Releve::class);
    }

    public function paiements(): HasMany
    {
        return $this->hasMany(Paiement::class);
    }

    public function getPaidAmountAttribute(): float
    {
        return (float) $this->paiements()->sum('montant');
    }

    public function refreshPaymentStatus(): void
    {
        $paid = $this->paid_amount;
        $total = (float) $this->total_ttc;

        $this->forceFill([
            'statut' => $paid >= $total
                ? self::STATUT_PAYEE
                : ($paid > 0 ? self::STATUT_PARTIELLE : self::STATUT_IMPAYEE),
        ])->save();
    }
}
