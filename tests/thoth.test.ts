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

var thoth = require('../src/common');

describe('checkInstalledPackages', function() {
  it('test same packages', function() {
    var installed_packages = {
      "test1" : "33"
    }

    var packages = {
      "test1" : "33"
    }

    var check = thoth.checkInstalledPackages(
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

    var check = thoth.checkInstalledPackages(
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

    var packages = {}

    var check = thoth.checkInstalledPackages(
        installed_packages,
        packages,
      );
      console.debug("Check received", check);

    expect(check).toBe(false);
      }
  );

})
