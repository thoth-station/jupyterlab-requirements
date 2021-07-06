# jupyterlab-requirements
# Copyright(C) 2020, 2021 Francesco Murdaca
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

"""Create new kernel API for jupyterlab requirements."""

import json
import logging
import subprocess
import shutil

from pathlib import Path

from jupyter_server.base.handlers import APIHandler
from tornado import web


_LOGGER = logging.getLogger("jupyterlab_requirements.kernel_handler")


class JupyterKernelHandler(APIHandler):
    """Jupyter Kernel handler to create new kernel for notebooks."""

    @web.authenticated
    def post(self):
        """Create kernel using new virtual environment."""
        input_data = self.get_json_body()

        kernel_name: str = input_data["kernel_name"]

        home = Path.home()
        complete_path = home.joinpath(".local/share/thoth/kernels")

        _LOGGER.info(f"Setting new jupyter kernel {kernel_name} from {complete_path}/{kernel_name}.")

        package = "ipykernel"
        check_install = subprocess.run(
            f". {kernel_name}/bin/activate &&"
            f"python3 -c \"import sys, pkgutil; sys.exit(0 if pkgutil.find_loader('{package}') else 1)\"",
            shell=True,
            cwd=complete_path,
            capture_output=True,
        )

        if check_install.returncode != 0:
            _LOGGER.debug(f"ipykernel is not installed in the host!: {check_install.stderr}")
            _ = subprocess.run(f". {kernel_name}/bin/activate && pip install ipykernel", shell=True, cwd=complete_path)
        else:
            _LOGGER.debug("ipykernel is already present on the host!")

        _LOGGER.debug(f"Installing kernelspec called {kernel_name}.")

        try:
            process_output = subprocess.run(
                f". {kernel_name}/bin/activate && ipython kernel install --user"
                f" --name={kernel_name} --display-name 'Python ({kernel_name})'",
                shell=True,
                cwd=complete_path,
                capture_output=True,
            )
            _LOGGER.info(process_output.stdout.decode("utf-8"))

        except Exception as e:
            _LOGGER.error(f"Could not enter environment {e}")

        self.finish(json.dumps({"data": f"installed kernel {kernel_name} at {complete_path}"}))

    @web.authenticated
    def get(self):
        """Get kernel list."""
        try:
            kernels_output = subprocess.run(
                "jupyter kernelspec list --json",
                shell=True,
                capture_output=True,
            )
            kernelspecs_str = kernels_output.stdout.decode("utf-8")
            _LOGGER.debug(kernelspecs_str)

        except Exception as e:
            _LOGGER.error(f"Could not get kernels available: {e}")

        kernelspecs_json = json.loads(kernelspecs_str)
        kernels = []
        for kernelspec in kernelspecs_json["kernelspecs"]:
            # Default kernel is filtered.
            if kernelspec != "python3":
                kernels.append(kernelspec)

        self.finish(json.dumps(kernels))

    @web.authenticated
    def delete(self):
        """Delete selected kernel."""
        input_data = self.get_json_body()

        kernel_name: str = input_data["kernel_name"]

        {"message": "", "error": False}

        # Delete jupyter kernel
        try:
            command_output = subprocess.run(
                f"jupyter kernelspec remove -f {kernel_name}",
                shell=True,
                capture_output=True,
            )
            _LOGGER.debug(command_output.returncode)

        except Exception as e:
            _LOGGER.error(f"Could not delete selected kernel: {e}")

        # Delete folder from host
        home = Path.home()
        complete_path = home.joinpath(".local/share/thoth/kernels")
        env_path = complete_path.joinpath(kernel_name)

        if env_path.exists():
            try:
                shutil.rmtree(env_path)
            except Exception as e:
                _LOGGER.warning(f"Repo at {env_path.as_posix()} was not removed because of: {e}")

        if command_output.returncode == 0:
            self.finish(json.dumps({"message": f"{kernel_name} successfully delete", "error": False}))
        else:
            self.finish(
                json.dumps({"message": f"{kernel_name} could not be delete, please check pod logs", "error": True})
            )
