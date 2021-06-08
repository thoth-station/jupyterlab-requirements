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

import { Requirements, RequirementsLock } from "./requirements";


export interface Advise {
    error: boolean,
    error_msg: string,
    requirements: Requirements,
    requirement_lock: RequirementsLock
}

export interface PipenvResult {
    error: boolean,
    error_msg: string,
    requirements_lock: RequirementsLock
}

// Thoth config

export interface OperatingSystem {
    name: string,
    version: string,
}

export interface RuntimeEnvironment {
    name: string,
    operating_system: OperatingSystem
    python_version: string,
    recommendation_type: string
}

export interface ThothConfig {
    host: string,
    tls_verify: boolean,
    requirements_format: string,
    runtime_environments: Array<RuntimeEnvironment>
}
