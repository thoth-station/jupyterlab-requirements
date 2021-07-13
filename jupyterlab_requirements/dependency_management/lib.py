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

import subprocess
import logging
import shutil

from virtualenv import cli_run
from pathlib import Path


_LOGGER = logging.getLogger("jupyterlab_requirements.lib")


def install_packages(
    kernel_name: str, resolution_engine: str, kernels_path: Path = Path.home().joinpath(".local/share/thoth/kernels")
):
    """Install dependencies in the virtualenv."""
    _LOGGER.info(f"kernel_name selected: {kernel_name}")

    env_name = kernel_name
    env_path = kernels_path.joinpath(env_name)

    env_path.mkdir(parents=True, exist_ok=True)

    package_manager: str = "micropipenv"

    _LOGGER.info(f"Installing requirements using {package_manager} in virtualenv at {env_path}.")

    # 1. Creating new environment
    if resolution_engine != "pipenv":
        cli_run([str(env_path)])

    # 2. Install micropipenv if not installed already
    check_install = subprocess.run(
        f"python3 -c \"import sys, pkgutil; sys.exit(0 if pkgutil.find_loader('{package_manager}') else 1)\"",
        shell=True,
        cwd=kernels_path,
        capture_output=True,
    )

    if check_install.returncode != 0:
        _LOGGER.debug(f"micropipenv is not installed in the host!: {check_install.stderr}")
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


def create_kernel(kernel_name: str, kernels_path: Path = Path.home().joinpath(".local/share/thoth/kernels")):
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
        _LOGGER.debug(f"ipykernel is not installed in the host!: {check_install.stderr}")
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

    return kernels_path


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
