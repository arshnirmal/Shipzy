#!/bin/bash
set -e

echo "🔄 Shipzy Database Restore Utility..."

# Configuration
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-shipzy_dev}"
DB_USER="${DB_USER:-shipzy_user}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"

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

# Function to list available backups
list_backups() {
    print_status "Available backup files:"
    
    if [ -d "$BACKUP_DIR" ] && [ "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
        local index=1
        while IFS= read -r -d $'\0' file; do
            echo "  $index) $(basename "$file") ($(du -h "$file" | cut -f1))"
            index=$((index + 1))
        done < <(find "$BACKUP_DIR" -name "${DB_NAME}_backup_*.sql*" -type f -print0 | sort -z)
        
        return $((index - 1))
    else
        print_warning "No backup directory or no backups found"
        return 0
    fi
}

# Function to restore database from backup
restore_backup() {
    local backup_file="$1"
    
    print_status "Restoring database from backup..."
    print_status "Backup file: $backup_file"
    print_status "Target database: $DB_NAME"
    
    # Check if backup file exists
    if [ ! -f "$backup_file" ]; then
        print_error "Backup file not found: $backup_file"
        return 1
    fi
    
    # Confirm restore operation
    if [ "$FORCE_RESTORE" != "true" ]; then
        echo -e "${YELLOW}⚠️  WARNING: This will completely replace the current database!${NC}"
        echo "Backup file: $backup_file"
        echo "Target database: $DB_NAME on $DB_HOST:$DB_PORT"
        read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirm
        if [ "$confirm" != "yes" ]; then
            print_status "Database restore cancelled"
            exit 0
        fi
    fi
    
    # Drop and recreate database
    print_status "Resetting target database..."
    PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres <<-EOSQL
        DROP DATABASE IF EXISTS "$DB_NAME";
        CREATE DATABASE "$DB_NAME";
        GRANT ALL PRIVILEGES ON DATABASE "$DB_NAME" TO "$DB_USER";
EOSQL
    
    # Restore from backup
    print_status "Restoring data from backup..."
    
    # Handle compressed files
    if [[ "$backup_file" == *.gz ]]; then
        if gunzip -c "$backup_file" | PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"; then
            print_success "Database restored successfully from compressed backup!"
        else
            print_error "Failed to restore database from compressed backup"
            return 1
        fi
    else
        if PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < "$backup_file"; then
            print_success "Database restored successfully!"
        else
            print_error "Failed to restore database"
            return 1
        fi
    fi
}

# Function to select backup interactively
select_backup() {
    local backup_count
    list_backups
    backup_count=$?
    
    if [ $backup_count -eq 0 ]; then
        print_error "No backup files available"
        exit 1
    fi
    
    echo ""
    read -p "Enter backup number (1-$backup_count): " choice
    
    if [[ "$choice" =~ ^[0-9]+$ ]] && [ "$choice" -ge 1 ] && [ "$choice" -le $backup_count ]; then
        local index=1
        while IFS= read -r -d $'\0' file; do
            if [ $index -eq $choice ]; then
                echo "$file"
                return 0
            fi
            index=$((index + 1))
        done < <(find "$BACKUP_DIR" -name "${DB_NAME}_backup_*.sql*" -type f -print0 | sort -z)
    else
        print_error "Invalid selection"
        exit 1
    fi
}

# Main execution
main() {
    local action="${1:-interactive}"
    local backup_file="$2"
    
    case "$action" in
        "interactive")
            print_status "Starting interactive database restore..."
            backup_file=$(select_backup)
            restore_backup "$backup_file"
            ;;
        "file")
            if [ -z "$backup_file" ]; then
                print_error "Backup file path required"
                echo "Usage: $0 file <backup_file_path>"
                exit 1
            fi
            restore_backup "$backup_file"
            ;;
        "list")
            list_backups
            ;;
        "help"|"-h"|"--help")
            echo "Usage: $0 [interactive|file <backup_file>|list|help]"
            echo ""
            echo "Commands:"
            echo "  interactive  - Interactive backup selection (default)"
            echo "  file         - Restore from specific backup file"
            echo "  list         - List available backup files"
            echo "  help         - Show this help message"
            echo ""
            echo "Environment variables:"
            echo "  DB_HOST      - Database host (default: postgres)"
            echo "  DB_PORT      - Database port (default: 5432)"
            echo "  DB_NAME      - Database name (default: shipzy_dev)"
            echo "  DB_USER      - Database user (default: shipzy_user)"
            echo "  DB_PASSWORD  - Database password"
            echo "  BACKUP_DIR   - Backup directory (default: ./backups)"
            echo "  FORCE_RESTORE - Skip confirmation prompt (default: false)"
            ;;
        *)
            print_error "Unknown action: $action"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Handle script interruption
trap 'print_warning "Restore process interrupted"; exit 130' INT TERM

# Run main function
main "$@"
