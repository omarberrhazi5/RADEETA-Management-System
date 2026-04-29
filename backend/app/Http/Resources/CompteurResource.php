<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CompteurResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'id_compteur' => $this->id,
            'cadran' => $this->cadran,
            'calibre' => $this->calibre,
            'marque' => $this->marque,
            'index_releve' => $this->index_releve,
            'statut' => $this->pannes->where('status', 'open')->isNotEmpty() ? 'en panne' : 'actif',
            'date_installation' => $this->created_at?->toDateString(),
            'id_client' => $this->id_client,
            'id_secteur' => $this->id_secteur,
            'client' => new ClientResource($this->whenLoaded('client')),
            'secteur' => new SecteurResource($this->whenLoaded('secteur')),
            'pannes' => PanneResource::collection($this->whenLoaded('pannes')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
