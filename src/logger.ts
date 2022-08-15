const winston = require('winston');

const timezone = () => {
    return new Date().toLocaleString('zh', {
        timeZone: 'Asia/Shanghai'
    });
}

const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp({ format: timezone }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
    ],
});

export default logger