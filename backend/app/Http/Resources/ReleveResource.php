<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReleveResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'compteur_id' => $this->compteur_id,
            'ancien_index' => $this->ancien_index,
            'nouvel_index' => $this->nouvel_index,
            'consommation' => $this->consommation,
            'periode_debut' => $this->periode_debut?->toDateString(),
            'periode_fin' => $this->periode_fin?->toDateString(),
            'created_by' => $this->created_by,
            'compteur' => new CompteurResource($this->whenLoaded('compteur')),
            'creator' => new UserResource($this->whenLoaded('creator')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
