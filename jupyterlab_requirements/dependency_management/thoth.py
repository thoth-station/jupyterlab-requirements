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

from pathlib import Path

from jupyter_server.base.handlers import APIHandler
from tornado import web

from thamos.lib import advise_using_config
from thoth.python import Pipfile
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
        notebook_path: str = input_data["notebook_path"]
        requirements: dict = json.loads(input_data["requirements"])

        _LOGGER.info("Starting using thoth...")
        pipfile_string = Pipfile.from_dict(requirements).to_string()

        complete_path = initial_path.joinpath(Path(notebook_path).parent)
        os.chdir(os.path.dirname(complete_path))

        _LOGGER.info(f"Current path: {Path(notebook_path).parent}")
        _LOGGER.info(f"Input Pipfile: \n{pipfile_string}")

        advise = {"requirements": "", "requirement_lock": "", "error": False}

        # TODO: Handle all errors
        try:
            response = advise_using_config(
                pipfile=pipfile_string,
                pipfile_lock="",
                force=True,
                config=config,
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

                    advise['requirements'] = pipfile
                    advise['requirement_lock'] = pipfile_lock

        except Exception as api_error:
            _LOGGER.warning(f"error talking to Thoth {api_error}")
            advise['error'] = True

        _LOGGER.debug(f"advise received {advise}")

        os.chdir(initial_path)
        self.finish(json.dumps(advise))
