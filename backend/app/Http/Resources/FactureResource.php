<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FactureResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $paid = $this->whenLoaded('paiements', fn () => (float) $this->paiements->sum('montant'), (float) $this->paid_amount);
        $remaining = max(0, (float) $this->total_ttc - (float) $paid);

        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'client_id' => $this->client_id,
            'compteur_id' => $this->compteur_id,
            'releve_id' => $this->releve_id,
            'tournee' => $this->tournee,
            'numero_client' => $this->numero_client,
            'client_name' => $this->client_name,
            'client_address' => $this->address,
            'address' => $this->address,
            'numero_contrat' => $this->numero_contrat,
            'usage_type' => $this->usage_type,
            'agence' => $this->agence,
            'facture_date' => $this->facture_date?->toDateString(),
            'periode_debut' => $this->periode_debut?->toDateString(),
            'periode_fin' => $this->periode_fin?->toDateString(),
            'numero_facture_eau_assainissement' => $this->numero_facture_eau_assainissement,
            'compteur_number' => $this->compteur_number,
            'coefficient' => $this->coefficient,
            'diametre_compteur' => $this->diametre_compteur,
            'ancienne_date_lecture' => $this->ancienne_date_lecture?->toDateString(),
            'nouvelle_date_lecture' => $this->nouvelle_date_lecture?->toDateString(),
            'ancien_index' => $this->ancien_index,
            'nouvel_index' => $this->nouvel_index,
            'consommation_m3' => $this->consommation_m3,
            'montant_ht' => $this->montant_ht,
            'taxes' => $this->taxes,
            'tva' => $this->tva,
            'total_ttc' => $this->total_ttc,
            'montant_especes' => $this->montant_especes,
            'montant_autre_mode' => $this->montant_autre_mode,
            'line_items' => $this->line_items ?? [],
            'detail_snapshot' => $this->detail_snapshot ?? [],
            'paid_amount' => number_format((float) $paid, 2, '.', ''),
            'remaining_amount' => number_format($remaining, 2, '.', ''),
            'statut' => $this->statut,
            'due_date' => $this->due_date?->toDateString(),
            'generated_at' => $this->generated_at?->toISOString(),
            'client' => new ClientResource($this->whenLoaded('client')),
            'compteur' => new CompteurResource($this->whenLoaded('compteur')),
            'releve' => new ReleveResource($this->whenLoaded('releve')),
            'paiements' => PaiementResource::collection($this->whenLoaded('paiements')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
