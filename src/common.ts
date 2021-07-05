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

/**
 * Function: Check installed packages and verify pipfile.lock are all in installed list
 */

import _ from "lodash"

export function checkInstalledPackages(kernel_packages: {}, packages: {}): boolean {

    // Check if pipfile.lock has any packages
    if ( _.size(packages) == 0) {
        return false
    }

    var counter = 0
    _.forIn(packages, function(version: string, name: string) {
        console.debug(version, name)

        if (_.has(kernel_packages, name.toLowerCase()) && _.get(kernel_packages, name.toLowerCase()) == version ) {
            console.debug( `Package '${ name }' in version '${ version }' is already installed` )
            counter += 1
        }
        else {
            console.debug( `Package '${ name }' in version '${ version }' not installed` )
            return false
        }
    })

    if ( _.size(packages) == counter) {
        return true
    }
    else {
        return false
    }
}
