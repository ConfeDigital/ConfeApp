import pandas as pd 
import math 
from candidatos.models import Cycle

def normalize_value(val):
    if pd.isna(val):
        return None
    if isinstance(val, float) and (math.isinf(val) or math.isnan(val)):
        return None
    return val

def process_excel_file(file):
    try:
        df = pd.read_excel(file)
        df = df.rename(columns=lambda col: col.strip())

        column_mapping = {
            "first_name": "first_name",
            "last_name": "last_name",
            "second_last_name": "second_last_name",
            "phone_number": "phone_number",
            "stage": "stage",
            "disability": "disability",
            "has_disability_certificate": "has_disability_certificate",
            "has_interdiction_judgment": "has_interdiction_judgment",
            "Generación": "cycle",
            "Nombre tutor / Institución": "tutor_name",
            "relationship": "tutor_relationship",
            "Lista de documentación": "has_documentation_list",
            "Estudio socieconómico": "has_socioeconomic_study",
            "address_municip": "municipio"
        }

        valid_columns = {k: v for k, v in column_mapping.items() if k in df.columns}
        df = df[list(valid_columns.keys())]
        df = df.rename(columns=valid_columns)

        df = df.applymap(normalize_value)

        candidate_data_list = df.to_dict(orient="records")
        errors = []

        stage_mapping = {
            "registro": "Reg",
            "preentrevista": "Pre",
            "entrevista": "Ent",
            "capacitación": "Cap",
            "agencia": "Agn",
            "canalización": "Can"
        }

        for i, candidate in enumerate(candidate_data_list):
            try:
                # Booleanos
                for field in ['has_disability_certificate', 'has_interdiction_judgment',
                              'has_documentation_list', 'has_socioeconomic_study']:
                    val = str(candidate.get(field, '')).strip().lower()
                    candidate[field] = val in ['true', 'si', 'sí', '1', 'x', 'en trámite']

                # Etapa
                raw_stage = str(candidate.get("stage", "")).strip().lower()
                candidate["stage"] = stage_mapping.get(raw_stage)
                if raw_stage and candidate["stage"] is None:
                    raise ValueError(f"Etapa inválida: '{raw_stage}'")

                # Ciclo
                ciclo_val = str(candidate.get("cycle", "")).strip()
                if ciclo_val.isdigit():
                    candidate["cycle"] = int(ciclo_val)
                elif ciclo_val:
                    match = Cycle.objects.filter(name__icontains=ciclo_val).first()
                    if match:
                        candidate["cycle"] = match.id
                    else:
                        raise ValueError(f"Generación no encontrada: '{ciclo_val}'")
                else:
                    candidate["cycle"] = None

                # Discapacidad
                disability = candidate.get("disability", "")
                if isinstance(disability, str):
                    candidate["disability"] = [disability.strip()]
                elif isinstance(disability, list):
                    candidate["disability"] = [d.strip() for d in disability]
            except Exception as e:
                errors.append({ "row": i + 2, "error": str(e) })  # +2 para considerar encabezado y base 1

        return candidate_data_list, errors

    except Exception as e:
        raise ValueError(f"Error processing Excel file: {str(e)}")