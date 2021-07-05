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

const _ = require("lodash")
// import {
//     checkInstalledPackages,
// } from '../src/helpers';

// var thoth = require('../src/helpers');

function checkInstalledPackages(kernel_packages, packages) {

    // Check if pipfile.lock has any packages
    if ( _.size(packages) == 0) {
        return false
    }

    var counter = 0
    _.forIn(packages, function(version, name) {
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

describe('checkInstalledPackages', function() {
  it('test same packages', function() {
    var installed_packages = {
      "test1" : "33"
    }

    var packages = {
      "test1" : "33"
    }

    var check = checkInstalledPackages(
        installed_packages,
        packages,
      );
      console.debug("Check received", check);

    expect(check).toBe(true);
      }
  );

  it('test different packages', function() {
    var installed_packages = {
      "test1" : "23"
    }

    var packages = {
      "test1" : "33"
    }

    var check = checkInstalledPackages(
        installed_packages,
        packages,
      );
      console.debug("Check received", check);

    expect(check).toBe(false);
      }
  );

  it('test empty pipfile.lock', function() {
    var installed_packages = {
      "test1" : "23"
    }

    var packages = {
      "test1" : "33"
    }

    var check = checkInstalledPackages(
        installed_packages,
        packages,
      );
      console.debug("Check received", check);

    expect(check).toBe(false);
      }
  );

})
