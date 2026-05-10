<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use App\Models\Panne;
use App\Models\Reparation;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class ReparationRequest extends FormRequest
{
    public function authorize(): bool
    {
        if (! $this->isOperator()) {
            return true;
        }

        $routeReparation = $this->route('reparation');
        $panneId = $routeReparation?->id_panne ?? ($this->filled('id_panne') ? $this->integer('id_panne') : null);

        return $panneId
            ? Panne::whereKey($panneId)->where('assigned_to', $this->user()->id)->exists()
            : true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('anomaly_id') && ! $this->filled('id_panne')) {
            $this->merge(['id_panne' => $this->input('anomaly_id')]);
        }

        if ($this->filled('panne_id') && ! $this->filled('id_panne')) {
            $this->merge(['id_panne' => $this->input('panne_id')]);
        }

        if ($this->filled('technician_id') && ! $this->filled('id_plombier')) {
            $this->merge(['id_plombier' => $this->input('technician_id')]);
        }

        if ($this->filled('repair_date') && ! $this->filled('date_reparation')) {
            $this->merge(['date_reparation' => $this->input('repair_date')]);
        }

        if ($this->isOperator()) {
            $this->merge(['id_plombier' => $this->user()->id]);
        }
    }

    public function rules(): array
    {
        $required = $this->isMethod('post') ? 'required' : 'sometimes';

        return [
            'id_panne' => [$required, Rule::exists('pannes', 'id')],
            'id_plombier' => [
                $required,
                Rule::exists('users', 'id')->where('role', UserRole::Technician->value),
            ],
            'date_reparation' => [$required, 'date'],
            'description' => ['nullable', 'string', 'max:5000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $routeReparation = $this->route('reparation');
            $panneId = $this->isOperator() && $routeReparation
                ? $routeReparation->id_panne
                : ($this->filled('id_panne')
                ? $this->integer('id_panne')
                : $routeReparation?->id_panne);

            if (! $panneId) {
                return;
            }

            $panne = Panne::find($panneId);

            if (! $panne) {
                return;
            }

            $repairDate = $routeReparation?->date_reparation;

            if ($this->filled('date_reparation') && ! $validator->errors()->has('date_reparation')) {
                $repairDate = CarbonImmutable::parse($this->input('date_reparation'));
            }

            if ($repairDate && $repairDate->lt($panne->date_panne)) {
                $validator->errors()->add('date_reparation', 'The repair date must be on or after the fault date.');
            }

            $query = Reparation::where('id_panne', $panne->id);

            if ($routeReparation) {
                $query->whereKeyNot($routeReparation->getKey());
            }

            if ($query->exists()) {
                $validator->errors()->add('id_panne', 'This fault already has an active repair.');
            }
        });
    }

    public function attributes(): array
    {
        return [
            'id_panne' => 'anomaly id',
            'id_plombier' => 'technician id',
            'date_reparation' => 'repair date',
        ];
    }

    private function isOperator(): bool
    {
        $role = $this->user()?->role;
        $value = $role instanceof UserRole ? $role->value : $role;

        return $value === UserRole::Technician->value;
    }
}
