#!/bin/bash
# filepath: /home/jhon-puli/Documentos/portafolios/MAA-HairStudio/scripts/restore_database.sh

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Cargar variables de entorno
source "../MAA-HairStdio_Backend/.env"

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  Restaurar Base de Datos${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Listar backups disponibles
echo -e "${YELLOW}Backups disponibles:${NC}"
ls -lh ./backups/maa_hairstudio_backup_*.dump 2>/dev/null || echo "No hay backups disponibles"
echo ""

# Solicitar archivo de backup
read -p "Ingresa el nombre del archivo de backup: " BACKUP_FILE

if [ ! -f "./backups/$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Archivo no encontrado${NC}"
    exit 1
fi

# Confirmar restauración
echo -e "${RED}ADVERTENCIA: Esto sobrescribirá la base de datos actual${NC}"
read -p "¿Deseas continuar? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Operación cancelada"
    exit 0
fi

echo -e "${YELLOW}Restaurando base de datos...${NC}"

# Restaurar backup
PGPASSWORD="$PGPASSWORD" pg_restore \
    --host="$PGHOST" \
    --username="$PGUSER" \
    --dbname="$PGDATABASE" \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    --verbose \
    "./backups/$BACKUP_FILE"

echo -e "${GREEN}✅ Base de datos restaurada exitosamente${NC}"