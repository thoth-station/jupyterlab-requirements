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


import { requestAPI, THOTH_JUPYTER_INTEGRATION_API_BASE_NAME } from './handler';

/**
 * Function: Install dependencies in the new kernel.
 */

export async function install_packages (
  kernel_name?: string,
  init: RequestInit = {},
): Promise<string> {

  // POST request
  const dataToSend = {
    kernel_name: kernel_name
  };

  const endpoint: string = 'kernel/install'

  try {
    const message = await requestAPI<any>(endpoint, {
      body: JSON.stringify(dataToSend),
      method: 'POST'
    });
    return message;
  } catch (reason) {
    console.error('Error on POST /' + THOTH_JUPYTER_INTEGRATION_API_BASE_NAME + '/' + endpoint + ':', reason);
  }
}

/**
 * Function: Discover installed packages in the kernel.
 */

export async function discover_installed_packages (
  kernel_name: string,
  init: RequestInit = {},
): Promise<string> {

  // POST request
  const dataToSend = {
    kernel_name: kernel_name
  };

  const endpoint: string = 'kernel/packages'

  try {
    const packages = await requestAPI<any>(endpoint, {
      body: JSON.stringify(dataToSend),
      method: 'POST'
    });
    return JSON.parse(JSON.stringify(packages));
  } catch (reason) {
    console.error('Error on POST /' + THOTH_JUPYTER_INTEGRATION_API_BASE_NAME + '/' + endpoint + ':', reason);
  }
}

/**
 * Function: Create new kernel.
 */

export async function create_new_kernel (
  kernel_name: string,
  init: RequestInit = {}
): Promise<string> {

  // POST request
  const dataToSend = {
    kernel_name: kernel_name
  };

  const endpoint: string = 'kernel/create'

  try {
    const message = await requestAPI<any>(endpoint, {
      body: JSON.stringify(dataToSend),
      method: 'POST'
    });
    return message;
  } catch (reason) {
    console.error('Error on POST /' + THOTH_JUPYTER_INTEGRATION_API_BASE_NAME + '/' + endpoint + ':', reason);
  }
}

/**
 * Function: Store dependencies locally.
 */

export async function store_dependencies (
    kernel_name: string,
    requirements: string,
    requirement_lock: string,
    path_to_store: string = ".local/share/thoth/kernels",
    using_home_path_base: boolean = true,
    init: RequestInit = {},
  ): Promise<string> {

    // POST request
    const dataToSend = {
      kernel_name: kernel_name,
      requirements: requirements,
      requirement_lock: requirement_lock,
      path_to_store: path_to_store,
      using_home_path_base: using_home_path_base
    };

    const endpoint: string = 'file/dependencies'

    try {
      const message = await requestAPI<any>(endpoint, {
        body: JSON.stringify(dataToSend),
        method: 'POST'
      });
      return message;
    } catch (reason) {
      console.error('Error on POST /' + THOTH_JUPYTER_INTEGRATION_API_BASE_NAME + '/' + endpoint + ':', reason);
    }
  }
