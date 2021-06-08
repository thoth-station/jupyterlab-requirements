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


// Requirements

export interface Requires {
    python_version: string
}

export interface Requirements {
    packages: { [ name: string ]: string }
    requires: Requires
    sources: ( SourcesEntity )[] | null
    "dev-packages"?: any
}

// Requirements Lock

export interface SourcesEntity {
    name: string
    url: string
    verify_ssl: boolean
}

export interface Hash {
    sha256: string
}

export interface Meta {
    hash: Hash
    requires: Requires
    sources: ( SourcesEntity )[] | null
    "pipfile-spec"?: number
}

export interface LockedPackageVersion {
    version: string
    hashes: ( string )[] | null
    index?: string | null
    markers?: string | null
}

export interface RequirementsLock {
    _meta: Meta
    default: { [ name: string ]: LockedPackageVersion }
    develop: { [ name: string ]: LockedPackageVersion }
}

export class Source {
    constructor(
        public readonly name: string = "pypi",
        public readonly url: string = "https://pypi.org/simple",
        public readonly verify_ssl: boolean = true,
        public warehouse?: string,
        public warehouse_api_url?: string
    ) { }
}
