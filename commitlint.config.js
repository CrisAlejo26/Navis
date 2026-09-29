/** @type {import('@commitlint/types').UserConfig} */
export default {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'scope-enum': [
            2,
            'always',
            [
                'api',
                'web',
                'mobile',
                'ai',
                'shared',
                'theme',
                'api-client',
                'docs',
                'infra',
                'deps',
                'repo',
            ],
        ],
        'subject-case': [0],
        // Un commit con el cuerpo en viñetas largas es normal; el límite que
        // trae la configuración convencional (100) lo rechazaba y el commit
        // se quedaba a medias, con los ficheros en el índice.
        'body-max-line-length': [0],
        'footer-max-line-length': [0],
        'header-max-length': [2, 'always', 100],
    },
};
