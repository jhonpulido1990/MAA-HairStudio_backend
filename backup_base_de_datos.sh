#!/bin/bash
# filepath: /home/jhon-puli/Documentos/portafolios/MAA-HairStudio/scripts/backup_database.sh

#==========================================
# Script de Backup de Base de Datos
# MAA Hair Studio - PostgreSQL (Neon)
#==========================================

set -e  # Salir si hay algún error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuración
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="maa_hairstudio_backup_${TIMESTAMP}.dump"
BACKUP_SQL="maa_hairstudio_backup_${TIMESTAMP}.sql"
LOG_FILE="./logs/backup_${TIMESTAMP}.log"

# Crear directorios si no existen
mkdir -p "$BACKUP_DIR"
mkdir -p "./logs"

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  Backup de Base de Datos${NC}"
echo -e "${YELLOW}  MAA Hair Studio${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Función para logging
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Función para verificar si pg_dump está instalado
check_pgdump() {
    if ! command -v pg_dump &> /dev/null; then
        echo -e "${RED}Error: pg_dump no está instalado${NC}"
        echo "Instala PostgreSQL client:"
        echo "  Ubuntu/Debian: sudo apt-get install postgresql-client"
        echo "  MacOS: brew install postgresql"
        echo "  Alpine: apk add postgresql-client"
        exit 1
    fi
}

# Función para realizar backup en formato custom (comprimido)
backup_custom() {
    log "Iniciando backup en formato custom..."
    
    PGPASSWORD="npg_0wZIjUaC7lFH" pg_dump \
        --host="ep-lingering-wind-ad9hacec-pooler.c-2.us-east-1.aws.neon.tech" \
        --username="neondb_owner" \
        --dbname="neondb" \
        --no-owner \
        --no-privileges \
        --format=custom \
        --file="$BACKUP_DIR/$BACKUP_FILE" \
        --verbose 2>&1 | tee -a "$LOG_FILE"
    
    if [ $? -eq 0 ]; then
        log "✓ Backup custom completado: $BACKUP_FILE"
        echo -e "${GREEN}✓ Backup completado exitosamente${NC}"
    else
        log "✗ Error al crear backup custom"
        echo -e "${RED}✗ Error al crear backup${NC}"
        exit 1
    fi
}

# Función para realizar backup en formato SQL (texto plano)
backup_sql() {
    log "Iniciando backup en formato SQL..."
    
    PGPASSWORD="$PGPASSWORD" pg_dump \
        --host="$PGHOST" \
        --username="$PGUSER" \
        --dbname="$PGDATABASE" \
        --no-owner \
        --no-privileges \
        --file="$BACKUP_DIR/$BACKUP_SQL" \
        --verbose 2>&1 | tee -a "$LOG_FILE"
    
    if [ $? -eq 0 ]; then
        log "✓ Backup SQL completado: $BACKUP_SQL"
        echo -e "${GREEN}✓ Backup SQL completado exitosamente${NC}"
    else
        log "✗ Error al crear backup SQL"
        echo -e "${RED}✗ Error al crear backup SQL${NC}"
        exit 1
    fi
}

# Función para comprimir backup SQL con gzip
compress_sql() {
    if [ -f "$BACKUP_DIR/$BACKUP_SQL" ]; then
        log "Comprimiendo backup SQL..."
        gzip "$BACKUP_DIR/$BACKUP_SQL"
        log "✓ Backup comprimido: ${BACKUP_SQL}.gz"
        echo -e "${GREEN}✓ Backup comprimido exitosamente${NC}"
    fi
}

# Función para mostrar información del backup
show_backup_info() {
    echo ""
    echo -e "${YELLOW}========================================${NC}"
    echo -e "${YELLOW}  Información del Backup${NC}"
    echo -e "${YELLOW}========================================${NC}"
    
    if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
        SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
        echo -e "${GREEN}Archivo custom:${NC} $BACKUP_FILE"
        echo -e "${GREEN}Tamaño:${NC} $SIZE"
        echo -e "${GREEN}Ubicación:${NC} $BACKUP_DIR/$BACKUP_FILE"
    fi
    
    if [ -f "$BACKUP_DIR/${BACKUP_SQL}.gz" ]; then
        SIZE=$(du -h "$BACKUP_DIR/${BACKUP_SQL}.gz" | cut -f1)
        echo -e "${GREEN}Archivo SQL:${NC} ${BACKUP_SQL}.gz"
        echo -e "${GREEN}Tamaño:${NC} $SIZE"
        echo -e "${GREEN}Ubicación:${NC} $BACKUP_DIR/${BACKUP_SQL}.gz"
    fi
    
    echo -e "${GREEN}Log:${NC} $LOG_FILE"
    echo ""
}

# Función para limpiar backups antiguos (mantener últimos 7)
cleanup_old_backups() {
    echo -e "${YELLOW}Limpiando backups antiguos...${NC}"
    
    # Mantener solo los últimos 7 backups
    cd "$BACKUP_DIR"
    ls -t maa_hairstudio_backup_*.dump 2>/dev/null | tail -n +8 | xargs -r rm -f
    ls -t maa_hairstudio_backup_*.sql.gz 2>/dev/null | tail -n +8 | xargs -r rm -f
    cd - > /dev/null
    
    log "✓ Backups antiguos eliminados (manteniendo últimos 7)"
    echo -e "${GREEN}✓ Limpieza completada${NC}"
}

# Función principal
main() {
    log "=== Iniciando proceso de backup ==="
    log "Base de datos: $PGDATABASE"
    log "Host: $PGHOST"
    log "Usuario: $PGUSER"
    
    # Verificar instalación
    check_pgdump
    
    # Realizar backups
    backup_custom
    backup_sql
    compress_sql
    
    # Limpiar backups antiguos
    cleanup_old_backups
    
    # Mostrar información
    show_backup_info
    
    log "=== Proceso de backup completado ==="
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Backup completado exitosamente${NC}"
    echo -e "${GREEN}========================================${NC}"
}

# Ejecutar función principal
main