<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReparationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'id_reparation' => $this->id,
            'id_panne' => $this->id_panne,
            'id_plombier' => $this->id_plombier,
            'date_reparation' => $this->date_reparation?->toDateString(),
            'description' => $this->description,
            'cout' => null,
            'statut' => 'effectuée',
            'panne' => new PanneResource($this->whenLoaded('panne')),
            'plombier' => new UserResource($this->whenLoaded('plombier')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
