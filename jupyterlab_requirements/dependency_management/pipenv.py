# jupyterlab-requirements
# Copyright(C) 2020 Francesco Murdaca
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

"""Thoth API for jupyterlab requirements."""

import os
import json
import logging
import subprocess

from pathlib import Path

from jupyter_server.base.handlers import APIHandler
from tornado import web

from thoth.python import Pipfile, PipfileLock

from virtualenv import cli_run

_LOGGER = logging.getLogger("jupyterlab_requirements.pipenv")


class PipenvHandler(APIHandler):
    """pipenv handler to receive optimized software stack."""

    @web.authenticated
    async def post(self):
        """Lock and install dependencies using pipenv."""
        initial_path = Path.cwd()
        input_data = self.get_json_body()

        kernel_name: str = input_data["kernel_name"]
        requirements: dict = json.loads(input_data["requirements"])

        home = Path.home()
        complete_path = home.joinpath(".local/share/thoth/kernels")
        env_path = complete_path.joinpath(kernel_name)

        # Delete and recreate folder
        if not env_path.exists():
            _ = subprocess.call(
                f"rm -rf ./{kernel_name} ", shell=True, cwd=complete_path)

        env_path.mkdir(parents=True, exist_ok=True)

        result = {"requirements_lock": "", "error": False}

        ## Create virtualenv
        cli_run([str(env_path)])

        pipfile_path = env_path.joinpath("Pipfile")

        pipfile_string = Pipfile.from_dict(requirements).to_string()
        _LOGGER.info("Resolution engine used: pipenv")

        with open(pipfile_path, "w") as pipfile_file:
            pipfile_file.write(pipfile_string)

        _LOGGER.info(f"kernel path: {env_path}")
        _LOGGER.info(f"Input Pipfile: \n{pipfile_string}")

        try:
            # TODO: check if pipenv is installed
            subprocess.run(
                f". {kernel_name}/bin/activate && cd {kernel_name} && pip install pipenv",
                cwd=complete_path,
                shell=True
            )
        except Exception as pipenv_error:
            _LOGGER.warning("error installing pipenv: %r", pipenv_error)
            result['error'] = True
            os.chdir(initial_path)
            self.finish(json.dumps(result))

        try:
            subprocess.run(
                f". {kernel_name}/bin/activate && cd {kernel_name} && pipenv lock",
                env=dict(os.environ, PIPENV_CACHE_DIR='/tmp'),
                cwd=complete_path,
                shell=True
            )
        except Exception as pipenv_error:
            _LOGGER.warning("error locking dependencies using Pipenv: %r", pipenv_error)
            result['error'] = True

        os.chdir(env_path)

        if not result['error']:

            pipfile_lock_path = env_path.joinpath("Pipfile.lock")

            if pipfile_lock_path.exists():

                with open(pipfile_lock_path, "r") as pipfile_lock_file:
                    pipfile_lock_str = pipfile_lock_file.read()

                pipfile = Pipfile.from_string(pipfile_string)
                pipfile_lock_str: PipfileLock = PipfileLock.from_string(pipfile_lock_str, pipfile=pipfile)

                result["requirements_lock"] = pipfile_lock_str.to_dict()

                _LOGGER.debug(f"result from pipenv received: {result}")

            else:
                _LOGGER.warning("Pipfile.lock cannot be found at: %r", str(pipfile_lock_path))
                result['error'] = True

        os.chdir(initial_path)
        self.finish(json.dumps(result))
