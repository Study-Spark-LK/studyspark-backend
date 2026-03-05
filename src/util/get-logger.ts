import { LogLayer, BlankTransport } from 'loglayer';
import pino from 'pino';
import { PinoTransport } from '@loglayer/transport-pino';
import { serializeError } from 'serialize-error';
import { ValidatedEnv } from '@/validators';

export function getLogger(env: Env, validatedEnv: ValidatedEnv) {
    const { ENVIRONMENT } = validatedEnv;

    let activeLevel: 'info' | 'trace' = 'info';

    if (ENVIRONMENT === 'development') {
        activeLevel = 'trace';
    }

    const p = pino({
        level: activeLevel
    });

    const log = new LogLayer({
        errorSerializer: serializeError,
        transport:
            ENVIRONMENT === 'production'
                ? [
                    // TODO need a production platform
                    new PinoTransport({
                        logger: p
                    })
                ]
                : [
                    new PinoTransport({
                        logger: p
                    })
                ]
    });

    return log;
}
