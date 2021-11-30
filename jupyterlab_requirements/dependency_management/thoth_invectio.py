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

"""Thoth invection library for jupyterlab requirements."""


import json
import logging
import ast
import sys
import textwrap

from pathlib import Path
from jupyter_server.base.handlers import APIHandler
from tornado import web

import invectio
import distutils

from .lib import verify_gathered_libraries

_LOGGER = logging.getLogger("jupyterlab_requirements.thoth_invectio")


class ThothInvectioHandler(APIHandler):  # type: ignore
    """Thoth invectio handler for user requirements."""

    @web.authenticated
    def post(self):  # type: ignore
        """Gather import libraries using invectio."""
        input_data = self.get_json_body()
        notebook_content: str = input_data["notebook_content"]

        std_lib_path = Path(distutils.sysconfig.get_python_lib(standard_lib=True))
        std_lib = {p.name.rstrip(".py") for p in std_lib_path.iterdir()}

        tree = ast.parse(textwrap.dedent(f"""{notebook_content}""").replace(" \\", ""))

        visitor = invectio.lib.InvectioLibraryUsageVisitor()
        visitor.visit(tree)

        report = visitor.get_module_report()

        libs = filter(lambda k: k not in std_lib | set(sys.builtin_module_names), report)
        gathered_libraries = list(libs)
        _LOGGER.info("Thoth invectio library gathered: %r", gathered_libraries)

        # Use Thoth user-API endpoint to verify what is the packages using that import name
        verified_libraries = verify_gathered_libraries(gathered_libraries=gathered_libraries)
        packages = [package["package_name"] for package in verified_libraries]

        self.finish(json.dumps(list(packages)))
