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
from thamos.discover import discover_python_version

from .lib import _EMOJI
from .lib import check_metadata_content
from .lib import create_pipfile_from_packages
from .lib import gather_libraries
from .lib import get_notebook_content
from .lib import horus_extract_command
from .lib import horus_requirements_command
from .lib import horus_set_kernel_command
from .lib import horus_show_command
from .lib import horus_lock_command

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

        # command: requirements
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
        requirements_command.add_argument("--dev", help="Set dev dependencies.", action="store_true")

        # command: show
        show_command = subparsers.add_parser("show", description="Show dependencies from notebook metadata.")
        show_command.add_argument("--pipfile", help="Show Pipfile (if available).", action="store_true")
        show_command.add_argument("--pipfile-lock", help="Show Pipfile.lock (if available).", action="store_true")
        show_command.add_argument("--thoth-config", help="Show .thoth.yaml (if available).", action="store_true")

        # command: lock
        lock_command = subparsers.add_parser(
            "lock", description="Lock requirements in notebook metadata [default Thoth]."
        )
        lock_command.add_argument("--force", help="Force request to Thoth.", action="store_true")
        lock_command.add_argument(
            "--kernel-name",
            default="jupyterlab-requirements",
            type=str,
            help="Specify kernel name to be used when creating it.",
        )

        # Only Thoth
        lock_command.add_argument(
            "--recommendation-type",
            choices=["latest", "stable", "performance", "security"],
            default="latest",
            type=str,
            const="all",
            nargs="?",
            help="Specify recommendation type for thoth advise.",
        )
        lock_command.add_argument(
            "--timeout",
            default=180,
            type=int,
            help="Set timeout for Thoth request.",
        )
        lock_command.add_argument(
            "--os-name",
            type=str,
            help="Use OS name for request to Thoth.",
        )
        lock_command.add_argument(
            "--os-version",
            type=str,
            help="Use OS version for request to Thoth.",
        )
        lock_command.add_argument(
            "--python-version",
            type=str,
            help="Use Python version for request to Thoth.",
        )

        # Use Pipenv
        lock_command.add_argument("--pipenv", help="Use pipenv resolution engine.", action="store_true")

        # command: set
        set_command = subparsers.add_parser(
            "set-kernel", description="Set kernel from dependencies in notebook content."
        )
        set_command.add_argument(
            "--kernel-name",
            type=str,
            help="Specify kernel name to be used when creating it.",
        )

        # command: discover
        discover_command = subparsers.add_parser("discover", description="Discover dependencies from notebook content.")
        discover_command.add_argument("--force", help="Force saving dependencies in the notebook.", action="store_true")

        # command: extract
        extract_command = subparsers.add_parser("extract", description="Extract dependencies from notebook metadata.")
        extract_command.add_argument(
            "--store-files-path",
            default=".",
            type=str,
            help="Custom path used to store all files.",
        )
        extract_command.add_argument("--pipfile", help="Extract Pipfile (if available).", action="store_true")
        extract_command.add_argument("--pipfile-lock", help="Extract Pipfile.lock (if available).", action="store_true")
        extract_command.add_argument("--thoth-config", help="Extract .thoth.yaml (if available).", action="store_true")
        extract_command.add_argument(
            "--force", help="Force extracting dependencies files from notebook.", action="store_true"
        )
        extract_command.add_argument(
            "--use-overlay", help="Extract Pipfile and Pipfile.lock in overlay with kernel name.", action="store_true"
        )

        ## Parse inputs
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

            result = check_metadata_content(notebook_metadata=notebook_metadata, is_cli=False)

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

        if args.command == "show":
            _LOGGER.info("Show dependencies content from notebook content.")

            results = horus_show_command(
                path=nb_path,
                pipfile=args.pipfile,
                pipfile_lock=args.pipfile_lock,
                thoth_config=args.thoth_config,
            )

            result = []
            for r in results:

                result.append(
                    {
                        "type": r,
                        "result": results[r],
                    }
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
                    row.append(entry if entry is not None else "-")

                table.add_row(*row)

            console = Console()

            return console.print(table, justify="center")

        if args.command == "lock":
            _LOGGER.info("Show dependencies content from notebook content.")

            results, lock_results = horus_lock_command(
                path=nb_path,
                resolution_engine="thoth" if not args.pipenv else "pipenv",
                timeout=args.timeout,
                force=args.force,
                recommendation_type=args.recommendation_type,
                kernel_name=args.kernel_name,
                os_name=args.os_name,
                os_version=args.os_version,
                python_version=args.python_version,
                save_in_notebook=False,
                save_on_disk=True,
            )

            if lock_results["error"]:
                return Exception(lock_results["error_msg"])
            else:
                _LOGGER.info("Set kernel for dependencies in notebook metadata.")

                kernel_results = horus_set_kernel_command(
                    path=nb_path,
                    kernel_name=args.kernel_name,
                    save_in_notebook=False,
                    resolution_engine=results["dependency_resolution_engine"],
                    is_magic_command=True,
                )

                return json.dumps(
                    {
                        "kernel_name": kernel_results["kernel_name"],
                        "resolution_engine": results["dependency_resolution_engine"],
                    }
                )

        if args.command == "set-kernel":
            _LOGGER.info("Set kernel for dependencies in notebook metadata.")

            kernel_results = horus_set_kernel_command(
                path=nb_path,
                kernel_name=args.kernel_name if args.kernel_name else None,
                save_in_notebook=False,
            )

            return json.dumps(
                {
                    "kernel_name": kernel_results["kernel_name"],
                }
            )

        if args.command == "discover":
            _LOGGER.info("Discover dependencies from notebook content.")
            packages = gather_libraries(notebook_path=nb_path)

            if packages:
                _LOGGER.info(f"Thoth invectio libraries gathered: {json.dumps(packages)}")
            else:
                _LOGGER.info(f"No libraries discovered from notebook at path: {nb_path}")

            python_version = discover_python_version()
            _LOGGER.info(f"Python version discovered from host: {python_version}")
            pipfile = create_pipfile_from_packages(packages=packages, python_version=python_version)

            return json.dumps({"requirements": pipfile.to_dict(), "force": args.force})

        if args.command == "extract":
            _LOGGER.info("Extract dependencies content from notebook content.")

            _ = horus_extract_command(
                notebook_path=nb_path,
                store_files_path=args.store_files_path,
                pipfile=args.pipfile,
                pipfile_lock=args.pipfile_lock,
                thoth_config=args.thoth_config,
                use_overlay=args.use_overlay,
                force=args.force,
            )
