from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('cuestionarios', '0001_initial'),
    ]

    operations = [
        migrations.RunSQL(
            # SQL para eliminar la restricción CHECK si existe
            sql="""
            IF EXISTS (
                SELECT * FROM sys.check_constraints 
                WHERE name = 'cuestionarios_respuesta_respuesta_90e87e00_check'
            )
            BEGIN
                ALTER TABLE cuestionarios_respuesta 
                DROP CONSTRAINT cuestionarios_respuesta_respuesta_90e87e00_check
            END
            """,
            reverse_sql="""
            -- No se puede recrear la restricción sin conocer su definición exacta
            -- Por lo tanto, el reverse_sql está vacío
            """
        ),
    ]
