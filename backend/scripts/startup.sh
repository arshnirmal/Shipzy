#!/bin/sh
set -e

echo "🚀 Shipzy Backend Startup Sequence..."

# Configuration
MAX_RETRIES=30
RETRY_INTERVAL=2
DB_HOST="${DB_HOST}"
DB_PORT="${DB_PORT}"
DB_NAME="${DB_NAME}"
DB_USER="${DB_USER}"
DB_PASSWORD="${DB_PASSWORD}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Try DB connectivity: psql if installed (local dev), else Node + pg (Docker Alpine has no psql)
_db_ping() {
    if command -v psql >/dev/null 2>&1; then
        PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1
        return $?
    fi

    if [ -f "/app/package.json" ] && [ -f "/app/scripts/db-ping.mjs" ]; then
        (cd /app && node /app/scripts/db-ping.mjs) >/dev/null 2>&1
        return $?
    fi

    _ROOT="$(cd "$(dirname "$0")/.." && pwd)"
    if [ -f "$_ROOT/node_modules/pg/package.json" ] && [ -f "$_ROOT/scripts/db-ping.mjs" ]; then
        (cd "$_ROOT" && node "$_ROOT/scripts/db-ping.mjs") >/dev/null 2>&1
        return $?
    fi

    print_error "Cannot check database: install psql or ensure pg is in node_modules and scripts/db-ping.mjs exists"
    return 1
}

# Function to check database readiness
check_database_ready() {
    print_status "Checking database readiness..."

    local retry=0
    while [ $retry -lt $MAX_RETRIES ]; do
        if _db_ping; then
            print_success "Database is ready!"
            return 0
        fi

        retry=$((retry + 1))
        print_status "Database not ready (attempt $retry/$MAX_RETRIES), retrying in ${RETRY_INTERVAL}s..."
        sleep $RETRY_INTERVAL
    done

    print_error "Database failed to become ready after $MAX_RETRIES attempts"
    print_warning "Check DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD and that Postgres accepts connections from this container."
    return 1
}

# Function to deploy database migrations
deploy_migrations() {
    print_status "Deploying database migrations..."

    if [ -f "/app/package.json" ]; then
        # Running in Docker container
        cd /app
    else
        # Running locally
        cd "$(dirname "$0")/.."
    fi

    # Check if there are any migration files
    if [ ! -d "src/database/migrations" ] || [ -z "$(ls -A src/database/migrations/*.sql 2>/dev/null)" ]; then
        print_warning "No migration files found, generating from schema..."
        if ! pnpm run db:generate; then
            print_error "Failed to generate migrations"
            return 1
        fi
    fi

    # Deploy migrations
    if pnpm run db:deploy; then
        print_success "Database migrations deployed successfully!"
    else
        print_error "Failed to deploy database migrations"
        return 1
    fi
}

# Function to start the application
start_application() {
    print_status "Starting Shipzy backend application..."

    if [ -f "/app/package.json" ]; then
        # Running in Docker container
        cd /app
        exec pnpm run dev
    else
        # Running locally
        cd "$(dirname "$0")/.."
        exec pnpm run dev
    fi
}

# Main execution flow
main() {
    print_status "Starting Shipzy backend startup sequence..."
    print_status "Environment: $NODE_ENV"
    print_status "Database: $DB_HOST:$DB_PORT/$DB_NAME"

    # Step 1: Check database readiness
    if ! check_database_ready; then
        print_error "Startup sequence failed: Database not ready"
        exit 1
    fi

    # Step 2: Deploy migrations
    if ! deploy_migrations; then
        print_error "Startup sequence failed: Migration deployment"
        exit 1
    fi

    # Step 3: Start application
    print_success "Startup sequence completed successfully!"
    start_application
}

# Handle script interruption
trap 'print_warning "Startup sequence interrupted"; exit 130' INT TERM

# Run main function
main "$@"
