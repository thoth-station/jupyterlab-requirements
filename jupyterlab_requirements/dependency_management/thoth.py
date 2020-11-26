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
from typing import Tuple, Optional

from jupyter_server.base.handlers import APIHandler
import tornado

import thamos
from thamos.lib import advise as thoth_advise
from thoth.python import Project
from thoth.common import ThothAdviserIntegrationEnum

_LOGGER = logging.getLogger("jupyterlab_requirements.thoth")

class ThothAdviseHandler(APIHandler):
    """Thoth handler to receive optimized software stack."""

    @tornado.web.authenticated
    async def post(self):
        initial_path = Path.cwd()
        input_data = self.get_json_body()

        recommendation_type: str = input_data["recommendation_type"]
        notebook_path: str = input_data["notebook_path"]

        os.chdir(os.path.dirname(notebook_path))

        _LOGGER.info(f"Asking Thoth for advise with recommendation: {recommendation_type}")

        requirements_format = 'pipenv'

        pipfile, pipfile_lock = _load_files(
            requirements_format=requirements_format
        )
        _LOGGER.info(f"Input Pipfile: \n{pipfile}")
        _LOGGER.info(f"Input Pipfile.lock: \n{pipfile_lock}")

        advise = {"requirements": "", "requirement_lock": "", "error": False}

        # TODO: Handle all errors
        response = thoth_advise(
            pipfile=pipfile,
            pipfile_lock=pipfile_lock,
            recommendation_type=recommendation_type,
            nowait=False,
            source_type=ThothAdviserIntegrationEnum.JUPYTER_NOTEBOOK,
            no_static_analysis=True
        )

        if not response:
            raise Exception("Analysis was not successful.")

        result, error_result = response

        if error_result:
            advise['error'] = True

        else:
            # Print report of the best one - thus index zero.
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

        _LOGGER.debug("advise received", advise)

        os.chdir(initial_path)
        self.finish(json.dumps(advise))


def _load_files(requirements_format: str) -> Tuple[str, Optional[str]]:
    """Load Pipfile/Pipfile.lock or requirements.in/txt from the current directory."""
    if requirements_format == "pipenv":
        project = Project.from_files(
            without_pipfile_lock=not os.path.exists("Pipfile.lock")
        )
    elif requirements_format in ("pip", "pip-tools", "pip-compile"):
        project = Project.from_pip_compile_files(allow_without_lock=True)
    else:
        raise ValueError(
            f"Unknown configuration option for requirements format: {requirements_format!r}"
        )
    return (
        project.pipfile.to_string(),
        project.pipfile_lock.to_string() if project.pipfile_lock else None,
    )
