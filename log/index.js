const {format, createLogger, transports} = require('winston');
const {combine, timestamp, label, printf} = format;

module.exports = function (module) {

  const logFormat = printf(({
    level,
    message,
    label,
    timestamp,
    stack
  }) => {
    return `[Osmium] ${timestamp} - [${level}]:[${label}] ${stack || message}`;
  });

  const logger = createLogger({
    level: 'debug',
    format: combine(
      format.colorize(),
      format.errors({
        stack: true
      }),
      timestamp({
        format: 'YYYY-MM-DD hh:mm:ss A'
      }),
      label({label: module}),
      logFormat
    ),
    transports: [
      // new transports.File({
      //   filename: './log/combined.log'
      // }),
      new transports.Console()
    ],
    defaultMeta: {
      service: 'user-service'
    }
  });

  return logger;
}

