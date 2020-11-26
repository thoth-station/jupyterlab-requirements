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

// import { NotebookPanel } from '@jupyterlab/notebook';
// import { Session } from '@jupyterlab/services';

import { requestAPI } from './handler'; 


export async function install_packages (
  notebook_path: string,
  kernel_name?: string,
  init: RequestInit = {},
): Promise<string> {

  // POST request
  const dataToSend = {
    notebook_path: notebook_path,
    kernel_name: kernel_name || ""
  };

  try {
    const message = await requestAPI<any>('dependencies', {
      body: JSON.stringify(dataToSend),
      method: 'POST'
    });
    return message;
  } catch (reason) {
    console.error(`Error on GET /jupyterlab-requirements/thoth.\n${reason}`);
  }
}

export async function get_installed_packages (
  init: RequestInit = {}
): Promise<string> {

  // GET request
  try {
    const configfile = await requestAPI<any>('environment');
    console.log(configfile);
    return configfile;
  } catch (reason) {
    console.error(`Error on GET /jupyterlab-requirements/environment.\n${reason}`);
  }
}

export async function create_new_kernel (
  kernel_name: string,
  init: RequestInit = {}
): Promise<string> {

  // POST request
  const dataToSend = {
    kernel_name: kernel_name
  };

  try {
    const message = await requestAPI<any>('customized_kernel', {
      body: JSON.stringify(dataToSend),
      method: 'POST'
    });
    return message;
  } catch (reason) {
    console.error(`Error on GET /jupyterlab-requirements/customized_kernel.\n${reason}`);
  }
}

export async function store_dependencies (
    notebook_path: string,
    requirements: string,
    requirement_lock: string,
    init: RequestInit = {},
  ): Promise<string> {
  
    // POST request
    const dataToSend = {
      notebook_path: notebook_path,
      requirements: requirements,
      requirement_lock: requirement_lock
    };
  
    try {
      const message = await requestAPI<any>('dependencies', {
        body: JSON.stringify(dataToSend),
        method: 'POST'
      });
      return message;
    } catch (reason) {
      console.error(`Error on GET /jupyterlab-requirements/thoth.\n${reason}`);
    }
  }
  
