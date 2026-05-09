<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SecteurResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'id_secteur' => $this->id,
            'nom_secteur' => $this->nom_secteur,
            'emplacement' => $this->emplacement,
            'agence' => $this->agence,
            'num_torne' => $this->num_torne,
            'latitude' => $this->latitude !== null ? (float) $this->latitude : null,
            'longitude' => $this->longitude !== null ? (float) $this->longitude : null,
            'compteurs' => CompteurResource::collection($this->whenLoaded('compteurs')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
