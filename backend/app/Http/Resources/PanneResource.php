<?php

namespace App\Http\Resources;

use App\Enums\PanneAnomalie;
use App\Enums\PanneStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PanneResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $status = $this->status instanceof PanneStatus ? $this->status->value : $this->status;

        return [
            'id' => $this->id,
            'id_panne' => $this->id,
            'id_compteur' => $this->id_compteur,
            'date_panne' => $this->date_panne?->toDateString(),
            'anomalie' => $this->anomalie instanceof PanneAnomalie ? $this->anomalie->value : $this->anomalie,
            'status' => $status,
            'statut' => $status === PanneStatus::Resolved->value ? 'résolue' : 'ouverte',
            'description' => null,
            'compteur' => new CompteurResource($this->whenLoaded('compteur')),
            'reparations' => ReparationResource::collection($this->whenLoaded('reparations')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
