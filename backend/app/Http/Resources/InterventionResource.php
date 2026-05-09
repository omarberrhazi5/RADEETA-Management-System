<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InterventionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'intervention_number' => $this->intervention_number,
            'numero_intervention' => $this->intervention_number,
            'panne_id' => $this->panne_id,
            'id_panne' => $this->panne_id,
            'client_id' => $this->client_id,
            'meter_id' => $this->meter_id,
            'technician_id' => $this->technician_id,
            'service_type' => $this->service_type,
            'started_at' => $this->started_at?->format('Y-m-d\TH:i'),
            'intervention_at' => $this->started_at?->format('Y-m-d\TH:i'),
            'completed_at' => $this->completed_at?->format('Y-m-d\TH:i'),
            'work_type' => $this->work_type,
            'materials_used' => $this->materials_used ?? [],
            'material_used' => $this->materials_used ?? [],
            'observations' => $this->observations,
            'priority' => $this->priority,
            'status' => $this->status,
            'panne' => new PanneResource($this->whenLoaded('panne')),
            'client' => new ClientResource($this->whenLoaded('client')),
            'meter' => new CompteurResource($this->whenLoaded('meter')),
            'technician' => new UserResource($this->whenLoaded('technician')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
