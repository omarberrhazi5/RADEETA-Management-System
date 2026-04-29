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
        return true;
    }

    public function rules(): array
    {
        $required = $this->isMethod('post') ? 'required' : 'sometimes';

        return [
            'id_panne' => [$required, 'required', Rule::exists('pannes', 'id')],
            'id_plombier' => [
                $required,
                'required',
                Rule::exists('users', 'id')->where('role', UserRole::Technician->value),
            ],
            'date_reparation' => [$required, 'required', 'date'],
            'description' => ['nullable', 'string', 'max:5000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $routeReparation = $this->route('reparation');
            $panneId = $this->filled('id_panne')
                ? $this->integer('id_panne')
                : $routeReparation?->id_panne;

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
}
