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

import json
import os
import logging
import subprocess

from pathlib import Path

from jupyter_server.base.handlers import APIHandler
from tornado import web

from thoth.python import Pipfile, PipfileLock

_LOGGER = logging.getLogger("jupyterlab_requirements.pipenv")


class PipenvHandler(APIHandler):
    """pipenv handler to receive optimized software stack."""

    @web.authenticated
    async def post(self):
        """Lock and install dependencies using pipenv."""
        initial_path = Path.cwd()
        input_data = self.get_json_body()

        notebook_path: str = input_data["notebook_path"]
        requirements: dict = json.loads(input_data["requirements"])

        pipfile_string = Pipfile.from_dict(requirements).to_string()
        _LOGGER.info("Starting using pipenv...")

        complete_path = initial_path.joinpath(Path(notebook_path).parent)
        os.chdir(os.path.dirname(complete_path))

        pipfile_path = complete_path.joinpath("Pipfile")
        with open(pipfile_path, "w") as pipfile_file:
            pipfile_file.write(pipfile_string)

        _LOGGER.info(f"Current path: {complete_path}")
        _LOGGER.info(f"Input Pipfile: \n{pipfile_string}")

        result = {"requirements_lock": "", "error": False}

        try:
            subprocess.run(["pipenv", "lock"], cwd=complete_path)

        except Exception as pipenv_error:
            _LOGGER.warning(f"error locking using pipenv {pipenv_error}")
            result['error'] = True

        if not result['error']:
            pipfile_lock_path = complete_path.joinpath("Pipfile.lock")

            with open(pipfile_lock_path, "r") as pipfile_lock_file:
                pipfile_lock_str = pipfile_lock_file.read()

            pipfile = Pipfile.from_string(pipfile_string)
            pipfile_lock_str: PipfileLock = PipfileLock.from_string(pipfile_lock_str, pipfile=pipfile)

            result["requirements_lock"] = pipfile_lock_str.to_dict()

            _LOGGER.debug(f"result from pipenv received {result}")

        os.chdir(initial_path)
        self.finish(json.dumps(result))
