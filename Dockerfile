FROM php:8.3-fpm


# Set working directory
WORKDIR /var/www/html

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libonig-dev \
    libxml2-dev \
    nginx \
    supervisor \
    nodejs \
    npm \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libzip-dev \
    zip \
    unzip \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) pdo_mysql mbstring exif pcntl bcmath gd zip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*


# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy existing application directory contents but not public/storage
COPY . /var/www/html

# Copy existing application directory permissions
COPY --chown=www-data:www-data . /var/www/html


# Create storage directories and set permissions
RUN mkdir -p /var/www/html/storage/framework/sessions \
    /var/www/html/storage/framework/views \
    /var/www/html/storage/framework/cache \
    /var/www/html/storage/logs \
    /var/www/html/bootstrap/cache

RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
RUN chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache


# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Install Node dependencies and build assets
RUN npm install && npm run build




# clean up node modules to reduce image size
RUN rm -rf node_modules package-lock.json
RUN npm cache clean --force
RUN apt-get remove -y npm nodejs
RUN apt-get autoremove -y
RUN apt-get clean
RUN rm -rf /var/lib/apt/lists/*

# delete .env file if it exists to avoid conflicts
RUN if [ -f .env ]; then rm .env; fi



# Copy nginx configuration
RUN echo 'server { \n\
    listen 80; \n\
    listen [::]:80; \n\
    server_name localhost; \n\
    root /var/www/html/public; \n\
\n\
    add_header X-Frame-Options "SAMEORIGIN"; \n\
    add_header X-Content-Type-Options "nosniff"; \n\
\n\
    index index.php; \n\
\n\
    charset utf-8; \n\
\n\
    location / { \n\
        try_files $uri $uri/ /index.php?$query_string; \n\
    } \n\
\n\
    location = /favicon.ico { access_log off; log_not_found off; } \n\
    location = /robots.txt  { access_log off; log_not_found off; } \n\
\n\
    error_page 404 /index.php; \n\
\n\
    location ~ \\.php$ { \n\
        fastcgi_pass 127.0.0.1:9000; \n\
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name; \n\
        include fastcgi_params; \n\
    } \n\
\n\
    location ~ /\\.(?!well-known).* { \n\
        deny all; \n\
    } \n\
}' > /etc/nginx/sites-available/default

# Copy supervisor configuration
RUN echo '[supervisord] \n\
nodaemon=true \n\
user=root \n\
logfile=/var/log/supervisor/supervisord.log \n\
pidfile=/var/run/supervisord.pid \n\
\n\
[program:php-fpm] \n\
command=/usr/local/sbin/php-fpm -F \n\
autostart=true \n\
autorestart=true \n\
priority=5 \n\
stdout_logfile=/dev/stdout \n\
stdout_logfile_maxbytes=0 \n\
stderr_logfile=/dev/stderr \n\
stderr_logfile_maxbytes=0 \n\
\n\
[program:nginx] \n\
command=/usr/sbin/nginx -g "daemon off;" \n\
autostart=true \n\
autorestart=true \n\
priority=10 \n\
stdout_logfile=/dev/stdout \n\
stdout_logfile_maxbytes=0 \n\
stderr_logfile=/dev/stderr \n\
stderr_logfile_maxbytes=0 \n\
\n\
[program:laravel-scheduler] \n\
process_name=%(program_name)s \n\
command=/bin/sh -c "while true; do php /var/www/html/artisan schedule:run --verbose --no-interaction; sleep 60; done" \n\
autostart=true \n\
autorestart=true \n\
user=www-data \n\
redirect_stderr=true \n\
stdout_logfile=/var/www/html/storage/logs/scheduler.log \n\
\n\
[program:laravel-queue] \n\
process_name=%(program_name)s \n\
command=php /var/www/html/artisan queue:work \n\
autostart=true \n\
autorestart=true \n\
user=www-data \n\
redirect_stderr=true \n\
stdout_logfile=/var/www/html/storage/logs/queue.log' >/etc/supervisor/conf.d/supervisord.conf

# Create entrypoint script
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
# Create flag file location\n\
FLAG_FILE="/var/www/html/storage/.migrations_done"\n\
\n\
# Run migrations only on first run\n\
if [ ! -f "$FLAG_FILE" ]; then\n\
    echo "First run detected - Running migrations..."\n\
    php artisan storage:link \n\
    php artisan migrate --force\n\
    echo "Migrations completed!"\n\
    touch "$FLAG_FILE"\n\
else\n\
    echo "Migrations already run, skipping..."\n\
fi\n\
php artisan optimize:clear\n\
\n\
# Start supervisor\n\
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf\n\
' > /usr/local/bin/docker-entrypoint.sh

RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose port 80
EXPOSE 80

# Set entrypoint
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
