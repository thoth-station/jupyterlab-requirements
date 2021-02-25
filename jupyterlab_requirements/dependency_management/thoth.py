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

from thamos.lib import advise_using_config, _get_origin
from thoth.python import Pipfile
from thoth.python import Project
from thoth.common import ThothAdviserIntegrationEnum

_LOGGER = logging.getLogger("jupyterlab_requirements.thoth")


class ThothAdviseHandler(APIHandler):
    """Thoth handler to receive optimized software stack."""

    @web.authenticated
    async def post(self):
        """Lock dependencies using Thoth service."""
        initial_path = Path.cwd()
        input_data = self.get_json_body()

        config: str = input_data["thoth_config"]
        kernel_name: str = input_data["kernel_name"]
        requirements: dict = json.loads(input_data["requirements"])

        # Get origin before changing path
        origin: str = _get_origin()
        _LOGGER.info("Origin identified by thamos: %r", origin)

        home = Path.home()
        complete_path = home.joinpath(".local/share/thoth/kernels")
        env_path = complete_path.joinpath(kernel_name)

        # Delete and recreate folder
        if env_path.exists():
            _ = subprocess.call(
                f"rm -rf ./{kernel_name} ", shell=True, cwd=complete_path)

        env_path.mkdir(parents=True, exist_ok=True)
        os.chdir(os.path.dirname(env_path))

        _LOGGER.info("Resolution engine used: thoth")
        pipfile_string = Pipfile.from_dict(requirements).to_string()

        _LOGGER.info(f"Current path: %r ", env_path.as_posix())
        _LOGGER.info(f"Input Pipfile: \n{pipfile_string}")

        advise = {"requirements": {}, "requirement_lock": {}, "error": False}

        try:
            # TODO: Handle all errors
            adviser_inputs = {
                "pipfile": pipfile_string,
                "config": config,
                "origin": origin
            }
            _LOGGER.info("Adviser inputs are: %r", adviser_inputs)
            response = advise_using_config(
                pipfile=pipfile_string,
                pipfile_lock="",  # TODO: Provide Pipfile.lock retrieved?
                force=False,  # TODO: Provide force input from user?
                config=config,
                origin=origin,
                nowait=False,
                source_type=ThothAdviserIntegrationEnum.JUPYTER_NOTEBOOK,
                no_static_analysis=True
            )

            _LOGGER.info(f"Response: {response}")

            if not response:
                raise Exception("Analysis was not successful.")

            result, error_result = response

            if error_result:
                advise['error'] = True

            else:
                # Use report of the best one, therefore index 0
                if result["report"] and result["report"]["products"]:
                    justifications = result["report"]["products"][0]["justification"]
                    _LOGGER.info(f"Justification: {justifications}")

                    stack_info = result["report"]["stack_info"]
                    _LOGGER.debug(f"Stack info {stack_info}")

                    pipfile = result["report"]["products"][0]["project"]["requirements"]
                    pipfile_lock = result["report"]["products"][0]["project"][
                        "requirements_locked"
                    ]

                    advise = {"requirements": pipfile, "requirement_lock": pipfile_lock, "error": False}

        except Exception as api_error:
            _LOGGER.warning(f"error talking to Thoth: {api_error}")
            advise['error'] = True

        _LOGGER.info(f"advise received: {advise}")

        if not advise['error']:
            try:
                requirements_format = "pipenv"

                project = Project.from_dict(pipfile, pipfile_lock)

                pipfile_path = env_path.joinpath("Pipfile")
                pipfile_lock_path = env_path.joinpath("Pipfile.lock")

                if requirements_format == "pipenv":
                    _LOGGER.info("Writing to Pipfile/Pipfile.lock in %r", env_path.as_posix())
                    project.to_files(
                        pipfile_path=pipfile_path,
                        pipfile_lock_path=pipfile_lock_path
                    )
            except Exception as e:
                _LOGGER.warning("Requirements files have not been stored successfully %r", e)

        os.chdir(initial_path)
        self.finish(json.dumps(advise))
