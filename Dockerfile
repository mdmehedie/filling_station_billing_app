FROM php:8.3-fpm

# Set working directory
WORKDIR /var/www/html

# Install system dependencies in a single layer with cleanup
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libonig-dev \
    libxml2-dev \
    nginx \
    supervisor \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libzip-dev \
    zip \
    unzip \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) pdo_mysql mbstring exif pcntl bcmath gd zip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Create storage directories early
RUN mkdir -p /var/www/html/storage/framework/{sessions,views,cache} \
    /var/www/html/storage/logs \
    /var/www/html/bootstrap/cache

# Copy composer files first for better layer caching
COPY composer.json composer.lock ./

# Install PHP dependencies (this layer will be cached if composer files don't change)
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts --no-autoloader

# Copy package files for Node dependencies
COPY package*.json ./

# Build frontend assets in a multi-stage approach
FROM node:20-alpine AS node-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Continue with main image
FROM php:8.3-fpm
WORKDIR /var/www/html

# Install only runtime dependencies
RUN apt-get update && apt-get install -y \
    libonig-dev \
    libxml2-dev \
    nginx \
    supervisor \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libzip-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) pdo_mysql mbstring exif pcntl bcmath gd zip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Get Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Create directories
RUN mkdir -p storage/framework/{sessions,views,cache} storage/logs bootstrap/cache

# Copy composer files and install dependencies
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts --no-autoloader

# Copy application files (use .dockerignore to exclude unnecessary files)
COPY --chown=www-data:www-data . .

# Copy built assets from node-builder stage
COPY --from=node-builder /app/public/build ./public/build

# Finalize composer installation
RUN composer dump-autoload --optimize --classmap-authoritative

# Set permissions
RUN chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Remove .env file if exists
RUN rm -f .env

# Nginx configuration
COPY <<'EOF' /etc/nginx/sites-available/default
server {
    listen 80;
    listen [::]:80;
    server_name localhost;
    root /var/www/html/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;
    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_buffer_size 128k;
        fastcgi_buffers 256 16k;
        fastcgi_busy_buffers_size 256k;
        fastcgi_temp_file_write_size 256k;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
EOF

# Supervisor configuration
COPY <<'EOF' /etc/supervisor/conf.d/supervisord.conf
[supervisord]
nodaemon=true
user=root
logfile=/var/log/supervisor/supervisord.log
pidfile=/var/run/supervisord.pid

[program:php-fpm]
command=/usr/local/sbin/php-fpm -F
autostart=true
autorestart=true
priority=5
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

[program:nginx]
command=/usr/sbin/nginx -g "daemon off;"
autostart=true
autorestart=true
priority=10
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

[program:laravel-scheduler]
process_name=%(program_name)s
command=/bin/sh -c "while true; do php /var/www/html/artisan schedule:run --verbose --no-interaction; sleep 60; done"
autostart=true
autorestart=true
user=www-data
redirect_stderr=true
stdout_logfile=/var/www/html/storage/logs/scheduler.log

[program:laravel-queue]
process_name=%(program_name)s
command=php /var/www/html/artisan queue:work
autostart=true
autorestart=true
user=www-data
redirect_stderr=true
stdout_logfile=/var/www/html/storage/logs/queue.log
EOF

# Create entrypoint script
COPY <<'EOF' /usr/local/bin/docker-entrypoint.sh
#!/bin/bash
set -e

FLAG_FILE="/var/www/html/storage/.migrations_done"

if [ ! -f "$FLAG_FILE" ]; then
    echo "First run detected - Running migrations..."
    php artisan storage:link
    php artisan migrate --force
    echo "Migrations completed!"
    touch "$FLAG_FILE"
else
    echo "Migrations already run, skipping..."
fi

php artisan optimize:clear

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
EOF

RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
