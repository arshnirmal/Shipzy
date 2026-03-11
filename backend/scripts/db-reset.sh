#!/bin/bash
set -e

echo "🗑️  Shipzy Database Reset Utility..."

# Configuration
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-shipzy_dev}"
DB_USER="${DB_USER:-shipzy_user}"
POSTGRES_DB="${POSTGRES_DB:-shipzy_dev}"
POSTGRES_USER="${POSTGRES_USER:-shipzy_user}"

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

# Function to confirm dangerous operation
confirm_reset() {
    if [ "$FORCE_RESET" != "true" ]; then
        echo -e "${YELLOW}⚠️  WARNING: This will completely delete all data in the database!${NC}"
        echo "Database: $DB_NAME on $DB_HOST:$DB_PORT"
        read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirm
        if [ "$confirm" != "yes" ]; then
            print_status "Database reset cancelled"
            exit 0
        fi
    fi
}

# Function to drop and recreate database
reset_database() {
    print_status "Resetting database..."
    
    # Connect to postgres database to drop/recreate the target database
    PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres <<-EOSQL
        -- Drop existing database
        DROP DATABASE IF EXISTS "$DB_NAME";
        
        -- Create new database
        CREATE DATABASE "$DB_NAME";
        
        -- Grant privileges
        GRANT ALL PRIVILEGES ON DATABASE "$DB_NAME" TO "$DB_USER";
EOSQL
    
    print_success "Database reset completed!"
}

# Function to run setup and migrations
setup_database() {
    print_status "Running database setup..."
    
    # Change to appropriate directory
    if [ -f "/app/package.json" ]; then
        # Running in Docker container
        cd /app
    else
        # Running locally
        cd "$(dirname "$0")/.."
    fi
    
    # Run deployment script which handles setup.sql, functions, and migrations
    if pnpm run db:deploy; then
        print_success "Database setup completed!"
    else
        print_error "Database setup failed"
        return 1
    fi
}

# Function to seed data (optional)
seed_data() {
    if [ "$SKIP_SEEDING" != "true" ]; then
        print_status "Seeding development data..."
        
        if pnpm run db:seed; then
            print_success "Development data seeded successfully!"
        else
            print_warning "Failed to seed development data (non-critical)"
        fi
    else
        print_status "Skipping data seeding"
    fi
}

# Main execution
main() {
    print_status "Starting database reset process..."
    print_status "Target database: $DB_NAME on $DB_HOST:$DB_PORT"
    
    # Confirm dangerous operation
    confirm_reset
    
    # Reset database
    if ! reset_database; then
        print_error "Database reset failed"
        exit 1
    fi
    
    # Setup database (run migrations)
    if ! setup_database; then
        print_error "Database setup failed"
        exit 1
    fi
    
    # Seed data
    seed_data
    
    print_success "Database reset and setup completed successfully!"
}

# Handle script interruption
trap 'print_warning "Database reset interrupted"; exit 130' INT TERM

# Run main function
main "$@"
