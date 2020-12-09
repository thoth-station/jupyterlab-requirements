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
import { Advise, PipenvResult, ThothConfig } from './types/thoth';
// import { PipenvResult } from './types/thoth';

export async function get_config_file (
  init: RequestInit = {}
): Promise<ThothConfig> {

  // GET request
  try {
    const configfile = await requestAPI<any>('thoth/config');
    return configfile;
  } catch (reason) {
    console.error(`Error on GET /jupyterlab-requirements/thoth/config.\n${reason}`);
  }
}

export async function lock_requirements_with_thoth (
  kernel_name: string,
  thoth_config: string,
  requirements: string,
  init: RequestInit = {},
): Promise<Advise> {

  // POST request
  const dataToSend = {
    kernel_name: kernel_name,
    thoth_config: thoth_config,
    requirements: requirements
  };

  try {
    const advise = await requestAPI<any>('thoth/resolution', {
      body: JSON.stringify(dataToSend),
      method: 'POST'
    });
    return JSON.parse(JSON.stringify(advise));
  } catch (reason) {
    console.error(`Error on POST /jupyterlab-requirements/thoth/resolution.\n${reason}`);
  }
}

export async function lock_requirements_with_pipenv (
  kernel_name: string,
  requirements: string,
  init: RequestInit = {},
): Promise<PipenvResult> {

  // POST request
  const dataToSend = {
    kernel_name: kernel_name,
    requirements: requirements
  };

  try {
    const result = await requestAPI<any>('pipenv', {
      body: JSON.stringify(dataToSend),
      method: 'POST'
    });
    return JSON.parse(JSON.stringify(result));
  } catch (reason) {
    console.error(`Error on POST /jupyterlab-requirements/pipenv.\n${reason}`);
  }
}
