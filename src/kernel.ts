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

import { requestAPI, THOTH_JUPYTER_INTEGRATION_API_BASE_NAME, AsyncTaskHandler } from './handler';
import * as utils from "./utils";
import { INotification } from "jupyterlab_toastify";
/**
 * Function: Install dependencies in the new kernel.
 */

 export async function install_packages(
  kernel_name: string,
  resolution_engine: string,
): Promise<string|undefined> {
  try {
    // POST request
    const dataToSend = {
      kernel_name: kernel_name,
      resolution_engine: resolution_engine
    };
    const request: RequestInit = {
      body: JSON.stringify(dataToSend),
      method: 'POST'
    };
    var endpoint = "kernel/install"
    const { promise } = AsyncTaskHandler(
      endpoint,
      request
    );
    const response = await promise;
    if (response) {
      // this._uiStateChanged.emit({
      //   type: 'installed'
      // });
      return JSON.parse(JSON.stringify(response));
    }
  } catch (error) {
      let message: string = error.message || error.toString();

      if ( message == 'gateway_error') {
        console.error('Error on POST /' + THOTH_JUPYTER_INTEGRATION_API_BASE_NAME + '/' + endpoint + ':', message);
        message = "Gateway error while installing dependencies.";
      }
      else if ( message !== 'cancelled') {
        console.error('Error on POST /' + THOTH_JUPYTER_INTEGRATION_API_BASE_NAME + '/' + endpoint + ':', message);
        message = `An error occurred while installing dependencies.`;
      }
      else {
          console.error('Error on POST /' + THOTH_JUPYTER_INTEGRATION_API_BASE_NAME + '/' + endpoint + ':', message);
          message = "Task was cancelled due to some issue.";
      }

      throw new Error(message)
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
 * Function: Discover Python version.
 */

 export async function discover_python_version (
  init: RequestInit = {},
): Promise<string> {

  const endpoint: string = '/kernel/python'

  try {
    const packages = await requestAPI<any>(endpoint, {
      method: 'GET'
    });
    return JSON.parse(JSON.stringify(packages));
  } catch (reason) {
    console.error('Error on GET /' + THOTH_JUPYTER_INTEGRATION_API_BASE_NAME + '/' + endpoint + ':', reason);
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
 * Function: Create new kernel.
 */

 export async function get_kernel_list (
  init: RequestInit = {}
): Promise<Array<string>> {

  // GET request
  const endpoint: string = 'kernel/create'

  try {
    const message = await requestAPI<any>(endpoint, {
      method: 'GET'
    });
    return message;
  } catch (reason) {
    console.error('Error on GET /' + THOTH_JUPYTER_INTEGRATION_API_BASE_NAME + '/' + endpoint + ':', reason);
  }
}

/**
 * Function: Create new kernel.
 */

export async function delete_kernel (
  kernel_name: string,
  init: RequestInit = {}
): Promise<Array<string>> {

  // DELETE request
  const dataToSend = {
    kernel_name: kernel_name
  };

  const endpoint: string = 'kernel/create'

  try {
    const message = await requestAPI<any>(endpoint, {
      body: JSON.stringify(dataToSend),
      method: 'DELETE'
    });
    console.log(message)
    return message;
  } catch (reason) {
    console.error('Error on DELETE /' + THOTH_JUPYTER_INTEGRATION_API_BASE_NAME + '/' + endpoint + ':', reason);
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
    complete_path: string,
    init: RequestInit = {},
  ): Promise<string> {

    // POST request
    const dataToSend = {
      kernel_name: kernel_name,
      requirements: requirements,
      requirement_lock: requirement_lock,
      path_to_store: path_to_store,
      complete_path: complete_path
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


/**
 * Function: Get dependencies locally.
 */

 export async function get_dependencies (
  kernel_name: string,
  init: RequestInit = {},
): Promise<string> {

  // POST request
  const dataToSend = {
    kernel_name: kernel_name,
  };

  const endpoint: string = 'file/stored'

  try {
    const results = await requestAPI<any>(endpoint, {
      body: JSON.stringify(dataToSend),
      method: 'POST'
    })
    console.log(results)
    return JSON.parse(JSON.stringify(results));
  } catch (reason) {
    console.error('Error on POST /' + THOTH_JUPYTER_INTEGRATION_API_BASE_NAME + '/' + endpoint + ':', reason);
  }
}


/**
 * Function: Gather library usage from notebook cells.
 */

export async function gather_library_usage(
  notebook_content: string,
  init: RequestInit = {},
): Promise<Array<string>> {

  // POST request
  const dataToSend = {
    notebook_content: utils.escape( notebook_content ),
  };

  const endpoint: string = 'thoth/invectio'

  try {
    const gathered_packages = await requestAPI<any>(endpoint, {
      body: JSON.stringify(dataToSend),
      method: 'POST'
    });
    return JSON.parse(JSON.stringify(gathered_packages));
  } catch (reason) {
    console.error('Error on POST /' + THOTH_JUPYTER_INTEGRATION_API_BASE_NAME + '/' + endpoint + ':', reason);
    INotification.error("Error detecting libraries in your notebook using Thoth invectio library. Please open issue with Thoth team.", {
      buttons: [
        {
          label: "Open Issue",
          callback: () => open("https://github.com/thoth-station/jupyterlab-requirements/issues/new?assignees=&labels=bug&template=bug_report.md")
        },
      ]
    });
  }
}

/**
 * Function: Attempt to discover root directory for the project.
 */

export async function discover_root_directory(
  init: RequestInit = {},
): Promise<string> {
  const endpoint: string = 'file/directory'

  try {
    const root_directory = await requestAPI<any>(endpoint, {
      method: 'GET'
    });
    return JSON.parse(JSON.stringify(root_directory));
  } catch (reason) {
    console.error('Error on GET /' + THOTH_JUPYTER_INTEGRATION_API_BASE_NAME + '/' + endpoint + ':', reason);
  }
}
