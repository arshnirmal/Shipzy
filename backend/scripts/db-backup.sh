#!/bin/bash
set -e

echo "💾 Shipzy Database Backup Utility..."

# Configuration
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-shipzy_dev}"
DB_USER="${DB_USER:-shipzy_user}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_backup_${TIMESTAMP}.sql"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to create backup directory
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        print_status "Created backup directory: $BACKUP_DIR"
    fi
}

# Function to create database backup
create_backup() {
    print_status "Creating database backup..."
    print_status "Database: $DB_NAME"
    print_status "Backup file: $BACKUP_FILE"
    
    # Create backup using pg_dump
    if PGPASSWORD="${DB_PASSWORD}" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --verbose --clean --if-exists --create --no-owner --no-privileges \
        --file="$BACKUP_FILE"; then
        print_success "Database backup created successfully!"
        print_status "Backup file: $BACKUP_FILE"
        print_status "File size: $(du -h "$BACKUP_FILE" | cut -f1)"
    else
        print_error "Failed to create database backup"
        return 1
    fi
}

# Function to compress backup
compress_backup() {
    if [ "$COMPRESS_BACKUP" = "true" ]; then
        print_status "Compressing backup file..."
        
        if gzip "$BACKUP_FILE"; then
            BACKUP_FILE="${BACKUP_FILE}.gz"
            print_success "Backup compressed successfully!"
            print_status "Compressed file: $BACKUP_FILE"
            print_status "Compressed size: $(du -h "$BACKUP_FILE" | cut -f1)"
        else
            print_warning "Failed to compress backup file"
        fi
    fi
}

# Function to cleanup old backups
cleanup_old_backups() {
    if [ -n "$KEEP_BACKUPS" ] && [ "$KEEP_BACKUPS" -gt 0 ]; then
        print_status "Cleaning up old backups (keeping last $KEEP_BACKUPS)..."
        
        # Find and remove old backup files
        find "$BACKUP_DIR" -name "${DB_NAME}_backup_*.sql*" -type f | \
            sort -r | \
            tail -n +$((KEEP_BACKUPS + 1)) | \
            xargs -r rm
        
        print_success "Old backups cleaned up"
    fi
}

# Function to list backups
list_backups() {
    print_status "Available backups:"
    
    if [ -d "$BACKUP_DIR" ] && [ "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
        ls -lah "$BACKUP_DIR"/${DB_NAME}_backup_*.sql* 2>/dev/null || \
            print_warning "No backup files found"
    else
        print_warning "No backup directory or no backups found"
    fi
}

# Main execution
main() {
    local action="${1:-backup}"
    
    case "$action" in
        "backup")
            print_status "Starting database backup process..."
            create_backup_dir
            create_backup
            compress_backup
            cleanup_old_backups
            print_success "Database backup completed!"
            ;;
        "list")
            list_backups
            ;;
        "help"|"-h"|"--help")
            echo "Usage: $0 [backup|list|help]"
            echo ""
            echo "Commands:"
            echo "  backup  - Create a new database backup (default)"
            echo "  list    - List available backup files"
            echo "  help    - Show this help message"
            echo ""
            echo "Environment variables:"
            echo "  DB_HOST        - Database host (default: postgres)"
            echo "  DB_PORT        - Database port (default: 5432)"
            echo "  DB_NAME        - Database name (default: shipzy_dev)"
            echo "  DB_USER        - Database user (default: shipzy_user)"
            echo "  DB_PASSWORD    - Database password"
            echo "  BACKUP_DIR     - Backup directory (default: ./backups)"
            echo "  COMPRESS_BACKUP - Compress backup file (default: false)"
            echo "  KEEP_BACKUPS   - Number of backups to keep (default: unlimited)"
            ;;
        *)
            print_error "Unknown action: $action"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Handle script interruption
trap 'print_warning "Backup process interrupted"; exit 130' INT TERM

# Run main function
main "$@"
