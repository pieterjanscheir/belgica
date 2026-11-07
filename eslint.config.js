// @ts-check
import js from '@eslint/js'
import globals from 'globals'
import jsdoc from 'eslint-plugin-jsdoc'
import tseslint from 'typescript-eslint'

export default tseslint.config(
    {
        ignores: [
            'dist/',
            'coverage/',
            'docs/.vitepress/dist/',
            'docs/.vitepress/cache/',
            'docs/public/map/',
            'src/ids.generated.ts',
            'src/canton-names.generated.ts',
            'src/data-files.generated.ts',
            'src/court-details-files.generated.ts',
            'site/.next/',
            'site/out/',
            'site/next-env.d.ts',
        ],
    },
    js.configs.recommended,
    {
        files: ['**/*.ts', '**/*.tsx'],
        extends: [tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
        languageOptions: {
            parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
        },
        rules: {
            // Template literals with numbers are clear and used throughout
            '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
        },
    },
    {
        // Every export of the package has a doc comment, for editor hovers. Of an overloaded
        // function, the signatures callers see do; the implementation's own one is hidden.
        files: ['src/**/*.ts'],
        plugins: { jsdoc },
        rules: {
            'jsdoc/require-jsdoc': [
                'error',
                {
                    publicOnly: true,
                    exemptOverloadedImplementations: true,
                    require: { FunctionDeclaration: true },
                    contexts: [
                        'ExportNamedDeclaration > TSDeclareFunction',
                        'ExportNamedDeclaration > VariableDeclaration',
                    ],
                },
            ],
        },
    },
    {
        // The site's own files: type-aware rules need the VitePress and Vue types, which the
        // package's tsconfig doesn't load
        files: ['docs/**'],
        extends: [tseslint.configs.disableTypeChecked],
    },
    {
        // The explorer imports belgica from dist/, which `pnpm check` lints before it builds;
        // its types are checked by `pnpm --filter belgica-site typecheck` after the build (CI)
        files: ['site/**'],
        extends: [tseslint.configs.disableTypeChecked],
    },
    {
        files: ['scripts/**', 'site/scripts/**', 'test/**', '*.config.*', '**/*.cjs', '**/*.mjs'],
        languageOptions: { globals: globals.node },
    },
)
