# jupyterlab-requirements
# Copyright(C) 2021 Francesco Murdaca
#
# This program is free software: you can redistribute it and / or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program. If not, see <http://www.gnu.org/licenses/>.

"""Library with core methods for jupyterlab-requirements."""

import os
import subprocess
import logging
import shutil
import typing
import tempfile
import json
import sys

from virtualenv import cli_run
from pathlib import Path

from rich.text import Text

from thoth.python import Project, Pipfile, PipfileLock
from thoth.python import PipfileMeta
from thoth.python import Source, PackageVersion

from thoth.common import ThothAdviserIntegrationEnum

from thamos.lib import advise_using_config, _get_origin
from thamos.config import _Configuration
from thamos.discover import discover_python_version

_LOGGER = logging.getLogger("jupyterlab_requirements.lib")


_EMOJI = {
    "WARNING": Text("\u26a0\ufe0f WARNING", style="yellow"),
    "ERROR": Text("\u274c ERROR", style="bold red"),
    "INFO": Text("\u2714\ufe0f INFO", "green"),
}


def get_notebook_content(notebook_path: str):
    """Get JSON of the notebook content."""
    actual_path = Path(notebook_path)

    if not actual_path.exists():
        raise FileNotFoundError(f"There is no file at this path: {actual_path.as_posix()!r}")

    if actual_path.suffix != ".ipynb":
        raise Exception("File submitted is not .ipynb")

    with open(notebook_path) as notebook_content:
        notebook = json.load(notebook_content)

    return notebook


def check_metadata_content(notebook_metadata: dict) -> list:
    """Check the metadata of notebook for dependencies."""
    result = []

    language = notebook_metadata["language_info"]["name"]

    if language and language != "python":
        result.append(
            {
                "message": "Only python programming language is supported.",
                "type": "ERROR",
            }
        )

        return result

    kernel_name = notebook_metadata["kernelspec"]["name"]

    result.append(
        {
            "message": f"kernel name: {kernel_name}",
            "type": "INFO",
        }
    )

    if "dependency_resolution_engine" not in notebook_metadata.keys():
        result.append(
            {
                "message": "dependency_resolution_engine key is not present in notebook metadata. "
                "It will be set after creating Pipfile and running `horus lock [YOUR_NOTEBOOK].ipynb`",
                "type": "WARNING",
            }
        )
    else:
        result.append(
            {
                "message": f"dependency resolution engine: {notebook_metadata['dependency_resolution_engine']}",
                "type": "INFO",
            }
        )

    resolution_engine = notebook_metadata.get("dependency_resolution_engine")

    if resolution_engine == "thoth":
        for thoth_specific_key in ["thoth_config"]:
            if thoth_specific_key not in notebook_metadata.keys():
                result.append(
                    {
                        "message": f"{thoth_specific_key} key is not present in notebook metadata. "
                        "You can run `horus lock [YOUR_NOTEBOOK].ipynb`.",
                        "type": "ERROR",
                    }
                )
            else:
                result.append(
                    {
                        "message": f"{thoth_specific_key} key is present in notebook metadata.",
                        "type": "INFO",
                    }
                )

    for mandatory_key in ["requirements"]:
        if mandatory_key not in notebook_metadata.keys():
            result.append(
                {
                    "message": f"{mandatory_key} key is not present in notebook metadata. "
                    "You can run `horus requirements [YOUR_NOTEBOOK].ipynb` with its options to set them.",
                    "type": "ERROR",
                }
            )
        else:
            result.append(
                {
                    "message": f"{mandatory_key} key is present in notebook metadata",
                    "type": "INFO",
                }
            )

    for mandatory_key in ["requirements_lock"]:
        if mandatory_key not in notebook_metadata.keys():
            result.append(
                {
                    "message": f"{mandatory_key} key is not present in notebook metadata. "
                    "You can run `horus lock [YOUR_NOTEBOOK].ipynb` if Pipfile already exists.",
                    "type": "ERROR",
                }
            )
        else:
            result.append(
                {
                    "message": f"{mandatory_key} key is present in notebook metadata.",
                    "type": "INFO",
                }
            )

    if "requirements" in notebook_metadata and "requirements_lock" in notebook_metadata:
        project = Project.from_strings(
            pipfile_str=notebook_metadata["requirements"], pipfile_lock_str=notebook_metadata["requirements_lock"]
        )

        if project.pipfile_lock.meta.hash["sha256"] != project.pipfile.hash()["sha256"]:
            result.append(
                {
                    "message": f"Pipfile hash stated in Pipfile.lock {project.pipfile_lock.meta.hash['sha256'][:6]} "
                    f"does not correspond to Pipfile hash {project.pipfile.hash()['sha256'][:6]} - was Pipfile "
                    "adjusted? Then you should run `horus lock [NOTEBOOK].ipynb`.",
                    "type": "ERROR",
                }
            )
        else:
            result.append(
                {
                    "message": f"Pipfile hash stated in Pipfile.lock {project.pipfile_lock.meta.hash['sha256'][:6]} "
                    f"correspond to Pipfile hash {project.pipfile.hash()['sha256'][:6]}.",
                    "type": "INFO",
                }
            )

        kernel_packages = get_packages(kernel_name=kernel_name)
        notebook_packages = project.pipfile_lock.packages

        check = 0
        for package in notebook_packages:
            if str(package.name) in kernel_packages:
                if str(package.version) in kernel_packages[str(package.name)]:
                    check += 1
            else:
                break

        if check == len([p for p in notebook_packages]):
            result.append(
                {
                    "message": f"kernel {kernel_name} selected has all dependencies installed.",
                    "type": "INFO",
                }
            )
        else:
            result.append(
                {
                    "message": f"kernel {kernel_name} selected does not match your dependencies. "
                    "Please run command horus set-kernel [NOTEBOOK].ipynb to create kernel for your notebook.",
                    "type": "WARNING",
                }
            )

    return result


def install_packages(
    kernel_name: str,
    resolution_engine: str,
    kernels_path: Path = Path.home().joinpath(".local/share/thoth/kernels"),
    is_cli: bool = False,
) -> None:
    """Install dependencies in the virtualenv."""
    _LOGGER.info(f"kernel_name selected: {kernel_name}")

    env_name = kernel_name
    env_path = kernels_path.joinpath(env_name)

    env_path.mkdir(parents=True, exist_ok=True)

    package_manager: str = "micropipenv"

    _LOGGER.info(f"Installing requirements using {package_manager} in virtualenv at {env_path}.")

    # 1. Creating new environment
    if is_cli or resolution_engine != "pipenv":
        cli_run([str(env_path)])

    # 2. Install micropipenv if not installed already
    check_install = subprocess.run(
        f"python3 -c \"import sys, pkgutil; sys.exit(0 if pkgutil.find_loader('{package_manager}') else 1)\"",
        shell=True,
        cwd=kernels_path,
        capture_output=True,
    )

    if check_install.returncode != 0:
        _LOGGER.debug("micropipenv is not installed in the host!: %r", check_install.stderr)
        _ = subprocess.run(
            "pip install micropipenv",
            shell=True,
            cwd=kernels_path,
        )
    else:
        _LOGGER.debug("micropipenv is already present on the host!")

    # 3. Install packages using micropipenv
    _ = subprocess.run(
        f". {kernel_name}/bin/activate " f"&& cd {kernel_name} && micropipenv install --dev",
        shell=True,
        cwd=kernels_path,
    )


def get_packages(kernel_name: str, kernels_path: Path = Path.home().joinpath(".local/share/thoth/kernels")) -> dict:
    """Get packages in the virtualenv (pip list)."""
    _LOGGER.info(f"kernel_name selected: {kernel_name}")

    process_output = subprocess.run(
        f". {kernel_name}/bin/activate && pip list", shell=True, capture_output=True, cwd=kernels_path
    )

    processed_list = process_output.stdout.decode("utf-8").split("\n")[2:]
    packages = {}

    for processed_package in processed_list:
        if processed_package:
            package_version = [el for el in processed_package.split(" ") if el != ""]
            packages[package_version[0]] = package_version[1]

    return packages


def create_kernel(kernel_name: str, kernels_path: Path = Path.home().joinpath(".local/share/thoth/kernels")) -> None:
    """Create kernel using new virtualenv."""
    _LOGGER.info(f"Setting new jupyter kernel {kernel_name} from {kernels_path}/{kernel_name}.")
    package = "ipykernel"
    check_install = subprocess.run(
        f". {kernel_name}/bin/activate &&"
        f"python3 -c \"import sys, pkgutil; sys.exit(0 if pkgutil.find_loader('{package}') else 1)\"",
        shell=True,
        cwd=kernels_path,
        capture_output=True,
    )

    if check_install.returncode != 0:
        _LOGGER.debug("ipykernel is not installed in the host!: %r", check_install.stderr)
        _ = subprocess.run(f". {kernel_name}/bin/activate && pip install ipykernel", shell=True, cwd=kernels_path)
    else:
        _LOGGER.debug("ipykernel is already present on the host!")

    _LOGGER.debug(f"Installing kernelspec called {kernel_name}.")

    try:
        process_output = subprocess.run(
            f". {kernel_name}/bin/activate && ipython kernel install --user"
            f" --name={kernel_name} --display-name 'Python ({kernel_name})'",
            shell=True,
            cwd=kernels_path,
            capture_output=True,
        )
        _LOGGER.info(process_output.stdout.decode("utf-8"))

    except Exception as e:
        _LOGGER.error(f"Could not enter environment {e}")


def delete_kernel(kernel_name: str, kernels_path: Path = Path.home().joinpath(".local/share/thoth/kernels")):
    """Delete kernel from host."""
    # Delete jupyter kernel
    try:
        command_output = subprocess.run(
            f"jupyter kernelspec remove -f {kernel_name}",
            shell=True,
            capture_output=True,
        )
        _LOGGER.debug(command_output.returncode)

    except Exception as e:
        _LOGGER.error(f"Selected kernel could not be deleted: {e}")

    # Delete folder from host
    env_path = kernels_path.joinpath(kernel_name)

    if env_path.exists():
        try:
            shutil.rmtree(env_path)
        except Exception as e:
            _LOGGER.warning(f"Repo at {env_path.as_posix()} was not removed because of: {e}")

    return command_output


def load_files(base_path: str) -> typing.Tuple[str, typing.Optional[str]]:
    """Load Pipfile/Pipfile.lock from path."""
    _LOGGER.info("Looking for Pipenv files located in %r directory", base_path)
    pipfile_path = Path(base_path).joinpath("Pipfile")
    pipfile_lock_path = Path(base_path).joinpath("Pipfile.lock")

    project = Project.from_files(
        pipfile_path=pipfile_path,
        pipfile_lock_path=pipfile_lock_path,
        without_pipfile_lock=not pipfile_lock_path.exists(),
    )

    if pipfile_lock_path.exists() and project.pipfile_lock.meta.hash["sha256"] != project.pipfile.hash()["sha256"]:
        _LOGGER.error(
            "Pipfile hash stated in Pipfile.lock %r does not correspond to Pipfile hash %r - was Pipfile "
            "adjusted? This error is not critical.",
            project.pipfile_lock.meta.hash["sha256"][:6],
            project.pipfile.hash()["sha256"][:6],
        )

    return (
        project.pipfile.to_string(),
        project.pipfile_lock.to_string() if project.pipfile_lock else None,
    )


def lock_dependencies_with_thoth(
    kernel_name: str,
    pipfile_string: str,
    config: str,
    timeout: int,
    force: bool,
    notebook_content: str,
    kernels_path: Path = Path.home().joinpath(".local/share/thoth/kernels"),
) -> typing.Tuple[int, dict]:
    """Lock dependencies using Thoth resolution engine."""
    initial_path = Path.cwd()
    # Get origin before changing path
    origin: str = _get_origin()
    _LOGGER.info("Origin identified by thamos: %r", origin)

    env_path = kernels_path.joinpath(kernel_name)

    env_path.mkdir(parents=True, exist_ok=True)
    os.chdir(env_path)

    _LOGGER.info("Resolution engine used: thoth")

    _LOGGER.info("Current path: %r ", env_path.as_posix())
    _LOGGER.info(f"Input Pipfile: \n{pipfile_string}")

    advise = {"requirements": {}, "requirement_lock": {}, "error": False, "error_msg": ""}
    returncode = 0

    temp = tempfile.NamedTemporaryFile(prefix="jl_thoth_", mode="w+t")

    try:
        adviser_inputs = {"pipfile": pipfile_string, "config": config, "origin": origin}
        _LOGGER.info("Adviser inputs are: %r", adviser_inputs)

        temp.write(notebook_content)
        _LOGGER.info("path to temporary file is: %r", temp.name)

        response = advise_using_config(
            pipfile=pipfile_string,
            pipfile_lock="",  # TODO: Provide Pipfile.lock retrieved?
            force=force,
            config=config,
            origin=origin,
            nowait=False,
            source_type=ThothAdviserIntegrationEnum.JUPYTER_NOTEBOOK,
            no_static_analysis=False,
            timeout=timeout,
            src_path=temp.name,
        )

        _LOGGER.info(f"Response: {response}")

        if not response:
            raise Exception("Analysis was not successful.")

        result, error_result = response

        if error_result:
            advise["error"] = True
            advise["error_msg"] = result.get("error_msg")
            returncode = 1

        else:
            # Use report of the best one, therefore index 0
            if result["report"] and result["report"]["products"]:
                justifications = result["report"]["products"][0]["justification"]
                _LOGGER.info(f"Justification: {justifications}")

                stack_info = result["report"]["stack_info"]
                _LOGGER.debug(f"Stack info {stack_info}")

                pipfile = result["report"]["products"][0]["project"]["requirements"]
                pipfile_lock = result["report"]["products"][0]["project"]["requirements_locked"]

                advise = {"requirements": pipfile, "requirement_lock": pipfile_lock, "error": False}

    except Exception as api_error:
        _LOGGER.warning(f"error locking dependencies using Thoth: {api_error}")
        advise["error"] = True
        advise[
            "error_msg"
        ] = f"Error locking dependencies, check pod logs for more details about the error. {api_error}"
        returncode = 1

    finally:
        temp.close()

    _LOGGER.info(f"advise received: {advise}")

    if not advise["error"]:
        try:
            requirements_format = "pipenv"

            project = Project.from_dict(pipfile, pipfile_lock)

            pipfile_path = env_path.joinpath("Pipfile")
            pipfile_lock_path = env_path.joinpath("Pipfile.lock")

            if requirements_format == "pipenv":
                _LOGGER.info("Writing to Pipfile/Pipfile.lock in %r", env_path.as_posix())
                project.to_files(pipfile_path=pipfile_path, pipfile_lock_path=pipfile_lock_path)
        except Exception as e:
            _LOGGER.warning("Requirements files have not been stored successfully %r", e)

    os.chdir(initial_path)

    return returncode, advise


def get_thoth_config(
    kernel_name: str,
    kernels_path: Path = Path.home().joinpath(".local/share/thoth/kernels"),
) -> _Configuration:
    """Get Thoth config."""
    initial_path = Path.cwd()
    env_path = kernels_path.joinpath(kernel_name)
    env_path.mkdir(parents=True, exist_ok=True)

    os.chdir(env_path)

    _LOGGER.info(f"kernel_name selected: {kernel_name} and path: {env_path}")

    config = _Configuration()

    if not config.config_file_exists():
        _LOGGER.info("Thoth config does not exist, creating it...")
        try:
            config.create_default_config()
        except Exception as e:
            raise Exception("Thoth config file could not be created! %r", e)

    config.load_config()

    os.chdir(initial_path)

    return config


def lock_dependencies_with_pipenv(
    kernel_name: str,
    pipfile_string: str,
    kernels_path: Path = Path.home().joinpath(".local/share/thoth/kernels"),
) -> typing.Tuple[int, dict]:
    """Lock dependencies using Pipenv resolution engine."""
    initial_path = Path.cwd()
    env_path = kernels_path.joinpath(kernel_name)

    # Delete and recreate folder
    if not env_path.exists():
        _ = subprocess.call(f"rm -rf ./{kernel_name} ", shell=True, cwd=kernels_path)

    env_path.mkdir(parents=True, exist_ok=True)

    result = {"requirements_lock": "", "error": False, "error_msg": ""}
    returncode = 0

    ## Create virtualenv
    cli_run([str(env_path)])

    pipfile_path = env_path.joinpath("Pipfile")

    _LOGGER.info("Resolution engine used: pipenv")

    with open(pipfile_path, "w") as pipfile_file:
        pipfile_file.write(pipfile_string)

    _LOGGER.info(f"kernel path: {env_path}")
    _LOGGER.info(f"Input Pipfile: \n{pipfile_string}")

    # 2. Install pipenv if not installed already
    package = "pipenv"
    check_install = subprocess.run(
        f"python3 -c \"import sys, pkgutil; sys.exit(0 if pkgutil.find_loader('{package}') else 1)\"",
        shell=True,
        cwd=kernels_path,
        capture_output=True,
    )

    if check_install.returncode != 0:
        _LOGGER.debug(f"pipenv is not installed in the host!: {check_install.stderr!r}")

        try:
            subprocess.run("pip install pipenv", cwd=kernels_path, shell=True)
        except Exception as pipenv_install_error:
            _LOGGER.warning("error installing pipenv: %r", pipenv_install_error)
            result["error"] = True
            result["error_msg"] = pipenv_install_error
            returncode = 1
            os.chdir(initial_path)

            return returncode, result
    else:
        _LOGGER.debug("pipenv is already present on the host!")

    pipfile_lock_path = env_path.joinpath("Pipfile.lock")

    try:
        output = subprocess.run(
            f". {kernel_name}/bin/activate && cd {kernel_name} && pipenv lock",
            env=dict(os.environ, PIPENV_CACHE_DIR="/tmp"),
            cwd=kernels_path,
            shell=True,
            capture_output=True,
        )
    except Exception as pipenv_error:
        _LOGGER.warning("error locking dependencies using Pipenv: %r", pipenv_error)
        result["error"] = True
        result["error_msg"] = str(pipenv_error)
        returncode = 1

    if output.returncode != 0:
        _LOGGER.warning("error in process trying to lock dependencies with pipenv: %r", output.stderr)
        result["error"] = True
        result["error_msg"] = str(output.stderr)
        returncode = 1

    os.chdir(env_path)

    if not result["error"]:

        if pipfile_lock_path.exists():

            with open(pipfile_lock_path, "r") as pipfile_lock_file:
                pipfile_lock_str = pipfile_lock_file.read()

            pipfile = Pipfile.from_string(pipfile_string)
            pipfile_lock_: PipfileLock = PipfileLock.from_string(pipfile_lock_str, pipfile=pipfile)

            result["requirements_lock"] = pipfile_lock_.to_dict()

            _LOGGER.debug(f"result from pipenv received: {result}")

        else:
            _LOGGER.warning("Pipfile.lock cannot be found at: %r", str(pipfile_lock_path))
            result["error"] = True
            result["error_msg"] = "Error retrieving Pipfile.lock created from pipenv."

    os.chdir(initial_path)

    return returncode, result


def horus_requirements_command(
    path: str,
    index_url: str,
    dev: bool,
    add: typing.Optional[typing.List[str]] = None,
    remove: typing.Optional[typing.List[str]] = None,
    save: bool = True,
):
    """Horus requirements command."""
    notebook = get_notebook_content(notebook_path=path)
    notebook_metadata = dict(notebook.get("metadata"))

    pipfile_string = notebook_metadata.get("requirements")

    if not pipfile_string:
        python_version = discover_python_version()
        pipfile_ = create_pipfile_from_packages(packages=[], python_version=python_version)
    else:
        pipfile_ = Pipfile.from_string(pipfile_string)

    if add:
        for req in add:
            _LOGGER.info(
                "Adding %r to %s requirements",
                req,
                "development" if dev else "default",
            )
            pipfile_.add_requirement(req, is_dev=dev, index_url=index_url, force=True)

    if remove:
        for req in remove:
            any_change = False

            if req in pipfile_.packages.packages:
                pipfile_.packages.packages.pop(req)
                _LOGGER.info(
                    "Removed %r from default requirements",
                    req,
                )
                any_change = True

            if req in pipfile_.dev_packages.packages:
                pipfile_.dev_packages.packages.pop(req)
                _LOGGER.info(
                    "Removed %r from development requirements",
                    req,
                )
                any_change = True

            if not any_change:
                _LOGGER.error(
                    "Requirement %r not found in requirements, " "aborting making any changes.",
                    req,
                )
                sys.exit(1)

    if save:
        notebook_metadata["requirements"] = json.dumps(pipfile_.to_dict())

        notebook["metadata"] = notebook_metadata
        save_notebook_content(notebook_path=path, notebook=notebook)

    return pipfile_


def create_pipfile_from_packages(packages: list, python_version: str):
    """Create Pipfile from list of packages."""
    source = Source(url="https://pypi.org/simple", name="pypi", verify_ssl=True)

    pipfile_meta = PipfileMeta(sources={"pypi": source}, requires={"python_version": python_version})

    packages_versions = []

    for package_name in packages:
        package_version = PackageVersion(name=package_name, version="*", develop=False)
        packages_versions.append(package_version)

    pipfile_ = Pipfile.from_package_versions(packages=packages_versions, meta=pipfile_meta)

    return pipfile_


def save_notebook_content(notebook_path: str, notebook: dict):
    """Save notebook content."""
    with open(notebook_path, "w") as notebook_content:
        json.dump(notebook, notebook_content)

    return notebook
