# Custom PostgreSQL + PostGIS image with schema
FROM postgis/postgis:17-3.6-alpine

# Copy initialization files
COPY ./src/database/init/schema.sql /tmp/schema.sql
COPY ./src/database/functions /docker-entrypoint-initdb.d/functions
COPY ./docker/postgres/init-scripts/01-extensions.sql /docker-entrypoint-initdb.d/01-extensions.sql
COPY ./docker/postgres/init-scripts/02-load-schema.sh /docker-entrypoint-initdb.d/02-load-schema.sh
COPY ./docker/postgres/init-scripts/03-load-functions.sh /docker-entrypoint-initdb.d/03-load-functions.sh

# Make scripts executable
RUN chmod +x /docker-entrypoint-initdb.d/02-load-schema.sh /docker-entrypoint-initdb.d/03-load-functions.sh

# Set proper permissions
RUN chown -R postgres:postgres /docker-entrypoint-initdb.d/
