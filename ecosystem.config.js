module.exports = {
    apps: [
        {
            name: 'eduflow-backend',
            script: 'venv/bin/uvicorn',
            args: 'main:app --host 0.0.0.0 --port 8000',
            cwd: './api',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '512M',
            env: {
                NODE_ENV: 'production',
                PYTHONUNBUFFERED: '1'
            },
            error_file: './logs/backend-error.log',
            out_file: './logs/backend-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
        },
        {
            name: 'eduflow-frontend',
            script: 'node_modules/next/dist/bin/next',
            args: 'start -p 3000',
            cwd: './',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'production',
                PORT: 3000
            },
            error_file: './logs/frontend-error.log',
            out_file: './logs/frontend-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
        }
    ]
};
