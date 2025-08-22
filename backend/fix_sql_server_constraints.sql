-- Script para verificar y eliminar restricciones CHECK problemáticas en Microsoft SQL Server
-- Ejecutar este script en la base de datos de producción

-- 1. Verificar todas las restricciones CHECK en la tabla cuestionarios_respuesta
SELECT 
    cc.name AS constraint_name,
    cc.definition AS constraint_definition,
    c.name AS column_name
FROM sys.check_constraints cc
INNER JOIN sys.columns c ON cc.parent_column_id = c.column_id
INNER JOIN sys.tables t ON c.object_id = t.object_id
WHERE t.name = 'cuestionarios_respuesta'
AND c.name = 'respuesta';

-- 2. Eliminar la restricción CHECK específica si existe
IF EXISTS (
    SELECT * FROM sys.check_constraints 
    WHERE name = 'cuestionarios_respuesta_respuesta_90e87e00_check'
)
BEGIN
    PRINT 'Eliminando restricción CHECK: cuestionarios_respuesta_respuesta_90e87e00_check'
    ALTER TABLE cuestionarios_respuesta 
    DROP CONSTRAINT cuestionarios_respuesta_respuesta_90e87e00_check
    PRINT 'Restricción eliminada exitosamente'
END
ELSE
BEGIN
    PRINT 'La restricción CHECK no existe'
END

-- 3. Verificar si hay otras restricciones CHECK en la columna respuesta
SELECT 
    cc.name AS constraint_name,
    cc.definition AS constraint_definition
FROM sys.check_constraints cc
INNER JOIN sys.columns c ON cc.parent_column_id = c.column_id
INNER JOIN sys.tables t ON c.object_id = t.object_id
WHERE t.name = 'cuestionarios_respuesta'
AND c.name = 'respuesta';

-- 4. Opcional: Eliminar todas las restricciones CHECK de la columna respuesta
-- (Descomentar solo si es necesario)
/*
DECLARE @sql NVARCHAR(MAX) = ''

SELECT @sql = @sql + 'ALTER TABLE cuestionarios_respuesta DROP CONSTRAINT ' + cc.name + ';' + CHAR(13)
FROM sys.check_constraints cc
INNER JOIN sys.columns c ON cc.parent_column_id = c.column_id
INNER JOIN sys.tables t ON c.object_id = t.object_id
WHERE t.name = 'cuestionarios_respuesta'
AND c.name = 'respuesta'

IF @sql != ''
BEGIN
    PRINT 'Eliminando todas las restricciones CHECK de la columna respuesta:'
    PRINT @sql
    EXEC sp_executesql @sql
    PRINT 'Todas las restricciones eliminadas'
END
ELSE
BEGIN
    PRINT 'No se encontraron restricciones CHECK para eliminar'
END
*/
