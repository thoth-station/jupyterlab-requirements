#!/usr/bin/env python3
# thoth-jupyterlab-requirements
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

"""jupyterlab-requirements magic commands."""

import os
import json
import logging
import argparse
import ipynbname

from rich.console import Console
from rich.table import Table

from IPython.core.magic import line_magic  # Called with %

# from IPython.core.magic import line_cell_magic  # Called with % or %%
# from IPython.core.magic import cell_magic  # Called with %%
from IPython.core.magic import magics_class, Magics

from .lib import _EMOJI
from .lib import check_metadata_content
from .lib import get_notebook_content
from .lib import horus_requirements_command

_LOGGER = logging.getLogger("thoth.jupyterlab_requirements.magic_commands")


@magics_class
class HorusMagics(Magics):
    """Horus jupyterlab-requirements CLI as magic commands."""

    @line_magic
    def horus(self, line: str):
        """Horus magic commands."""
        parser = argparse.ArgumentParser(description="This is Horus: jupyterlab-requirements CLI.")
        parser.add_argument("--verbose", help="increase output verbosity", action="store_true")

        subparsers = parser.add_subparsers(dest="command")
        # command: check
        _ = subparsers.add_parser("check", description="Check dependencies in notebook metadata.")

        # command: check
        requirements_command = subparsers.add_parser(
            "requirements", description="Add/Remove one or multiple requirements from the notebook."
        )
        requirements_command.add_argument(
            "--index-url",
            "-i",
            default="https://pypi.org/simple",
            type=str,
            help="Specify Python package index to be used as a source for the given requirement/s.",
        )
        requirements_command.add_argument(
            "--add", action="store", nargs="+", type=str, help="Examples: --add tensorflow pytorch"
        )
        requirements_command.add_argument(
            "--remove", action="store", nargs="+", type=str, help="Examples: --add tensorflow pytorch"
        )

        requirements_command.add_argument("--dev", help="increase output verbosity", action="store_true")

        opts = line.split()
        args = parser.parse_args(opts)

        if any([opt in {"-h", "--help"} for opt in opts]):
            # print help and return
            return ""

        if args.verbose:
            _LOGGER.setLevel(logging.DEBUG)

        _LOGGER.debug("Debug mode is on")

        nb_path = ipynbname.path()
        nb_name = ipynbname.name()
        _LOGGER.info(f"Notebook path: {nb_path}")

        if args.command == "check":
            _LOGGER.info("checking notebook content")

            notebook = get_notebook_content(notebook_path=nb_path)
            notebook_metadata = notebook.get("metadata")

            result = check_metadata_content(notebook_metadata=notebook_metadata)

            result.insert(
                0,
                {
                    "message": f"notebook name: {nb_name}",
                    "type": "INFO",
                },
            )

            table = Table()

            header = set()
            for item in result:
                for key in item.keys():
                    header.add(key)

            header_sorted = sorted(header)
            for element in header_sorted:
                table.add_column(
                    element.replace("_", " ").capitalize(),
                    style="cyan",
                    overflow="fold",
                )

            for item in result:
                row = []
                for key in header_sorted:
                    entry = item.get(key)
                    if not bool(int(os.getenv("JUPYTERLAB_REQUIREMENTS_NO_EMOJI", 0))) and isinstance(entry, str):
                        entry = _EMOJI.get(entry, entry)

                    row.append(entry if entry is not None else "-")

                table.add_row(*row)

            console = Console()

            return console.print(table, justify="center")

        if args.command == "requirements":
            _LOGGER.info("Managing requirements in notebook content.")

            pipfile_ = horus_requirements_command(
                path=nb_path, index_url=args.index_url, dev=args.dev, add=args.add, remove=args.remove, save=False
            )

            return json.dumps(pipfile_.to_dict())
