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
import { Advise, ThothConfig } from './types/thoth';


export async function get_config_file (
  init: RequestInit = {}
): Promise<ThothConfig> {

  // GET request
  try {
    const configfile = await requestAPI<any>('config');
    return configfile;
  } catch (reason) {
    console.error(`Error on GET /jupyterlab-requirements/config.\n${reason}`);
  }
}

export async function lock_requirements_with_thoth (
  notebook_path: string,
  init: RequestInit = {},
): Promise<Advise> {

  // POST request
  const dataToSend = {
    recommendation_type: 'latest',
    notebook_path: notebook_path
  };

  try {
    const advise = await requestAPI<any>('thoth', {
      body: JSON.stringify(dataToSend),
      method: 'POST'
    });
    return JSON.parse(JSON.stringify(advise));
  } catch (reason) {
    console.error(`Error on POST /jupyterlab-requirements/thoth.\n${reason}`);
  }
}

export async function lock_requirements_with_pipenv (
  notebook_path: string,
  init: RequestInit = {},
): Promise<Advise> {

  // POST request
  const dataToSend = {
    recommendation_type: 'latest',
    notebook_path: notebook_path
  };

  try {
    const advise = await requestAPI<any>('thoth', {
      body: JSON.stringify(dataToSend),
      method: 'POST'
    });
    return JSON.parse(JSON.stringify(advise));
  } catch (reason) {
    console.error(`Error on POST /jupyterlab-requirements/thoth.\n${reason}`);
  }
}
