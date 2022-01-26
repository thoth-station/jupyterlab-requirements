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


export interface StackInfo {
    link: string,
    message: string,
    type: string
}

export interface Justification {
    link: string,
    message: string,
    type: string
}

export interface Advise {
    thoth_analysis_id: string,
    error: boolean,
    error_msg: string,
    requirements: Requirements,
    requirements_lock: RequirementsLock,
    stack_info: Array<StackInfo>,
    justifications: Array<Justification>
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

export interface Hardware {
    cpu_model?: number,
    cpu_family?: number,
    gpu_family?: string,
}

export interface RuntimeEnvironment {
    name: string,
    operating_system: OperatingSystem
    python_version: string,
    recommendation_type: string,
    base_image?: string,
    labels?: string,
    hardware?: Hardware
}

export interface ThothConfig {
    host: string,
    tls_verify: boolean,
    requirements_format: string,
    runtime_environments: Array<RuntimeEnvironment>
}
