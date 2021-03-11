/**
 * Jupyterlab requirements.
 *
 * Jupyterlab extension for managing dependencies.
 *
 * @link   https://github.com/thoth-station/jupyterlab-requirements#readme
 * @file   Jupyterlab extension for managing dependencies.
 * @author Francesco Murdaca <fmurdaca@redhat.com>
 * @since  0.0.1
 */

// Reference logic used: https://github.com/thoth-station/jupyter-nbrequirements/blob/master/js/src/utils.ts


export function escape(
    strings: string | string[],
    ...values: string[]
): string {

    // @ts-ignore
    const raw = typeof strings === "string" ? [ strings ] : strings.raw

    // first, perform interpolation
    let result = ""
    for ( let i = 0; i < raw.length; i++ ) {
        result += raw[ i ]
            // handle backslashes in general
            .replace( /\\/g, "\\\\" )
            // handle escaped newlines
            .replace( /(?:\\r\\n|\\r|\\n)([ \t]*)/g, "\\\\n$1" )

        if ( i < values.length ) {
            result += values[ i ]
        }
    }

    return result
}

export function indent( text: string, indent = 4 ): string {
    const indentation = " ".repeat( indent )

    return text
        .split( "\n" )
        .map( ( line ) => `${ indentation }${ line }` )
        .join( "\n" )
}
