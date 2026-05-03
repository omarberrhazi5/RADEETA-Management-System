<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaiementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'facture_id' => $this->facture_id,
            'montant' => $this->montant,
            'mode' => $this->mode,
            'reference' => $this->reference,
            'paid_at' => $this->paid_at?->toISOString(),
            'created_by' => $this->created_by,
            'facture' => new FactureResource($this->whenLoaded('facture')),
            'creator' => new UserResource($this->whenLoaded('creator')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
