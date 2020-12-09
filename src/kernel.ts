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


import { requestAPI } from './handler';

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

  try {
    const message = await requestAPI<any>('kernel/install', {
      body: JSON.stringify(dataToSend),
      method: 'POST'
    });
    return message;
  } catch (reason) {
    console.error(`Error on POST /jupyterlab-requirements/kernel/install.\n${reason}`);
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

  try {
    const packages = await requestAPI<any>('kernel/packages', {
      body: JSON.stringify(dataToSend),
      method: 'POST'
    });
    return JSON.parse(JSON.stringify(packages));
  } catch (reason) {
    console.error(`Error on POST /jupyterlab-requirements/kernel/packages.\n${reason}`);
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

  try {
    const message = await requestAPI<any>('kernel/create', {
      body: JSON.stringify(dataToSend),
      method: 'POST'
    });
    return message;
  } catch (reason) {
    console.error(`Error on POST /jupyterlab-requirements/kernel/create.\n${reason}`);
  }
}

/**
 * Function: Store dependencies locally.
 */

export async function store_dependencies (
    kernel_name: string,
    requirements: string,
    requirement_lock: string,
    init: RequestInit = {},
  ): Promise<string> {

    // POST request
    const dataToSend = {
      kernel_name: kernel_name,
      requirements: requirements,
      requirement_lock: requirement_lock
    };

    try {
      const message = await requestAPI<any>('file/dependencies', {
        body: JSON.stringify(dataToSend),
        method: 'POST'
      });
      return message;
    } catch (reason) {
      console.error(`Error on POST /jupyterlab-requirements/file/dependencies.\n${reason}`);
    }
  }
