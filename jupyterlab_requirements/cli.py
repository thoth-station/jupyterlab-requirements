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

"""A CLI for jupyterlab-requirements."""

import logging
import os
import json

import click
from typing import Optional
from pathlib import Path

from thoth.python import Pipfile, PipfileLock
from thamos.config import _Configuration

_LOGGER = logging.getLogger("thoth.jupyterlab_requirements.cli")


def _get_version(name):
    """Print jupyterlab-requirements version and exit."""
    with open(os.path.join(name, "__init__.py")) as f:
        content = f.readlines()

    for line in content:
        if line.startswith("__version__ ="):
            # dirty, remove trailing and leading chars
            return line.split(" = ")[1][1:-2]
    raise ValueError("No version identifier found")


def _print_version(ctx: click.Context, _, value: str):
    """Print version and exit."""
    if not value or ctx.resilient_parsing:
        return

    click.echo(_get_version(name="jupyterlab_requirements"))
    ctx.exit()


@click.group()
@click.pass_context
@click.option(
    "-v",
    "--verbose",
    is_flag=True,
    envvar="THOTH_JUPYTERLAB_REQUIREMENTS_DEBUG",
    help="Be verbose about what's going on.",
)
@click.option(
    "--version",
    is_flag=True,
    is_eager=True,
    callback=_print_version,
    expose_value=False,
    help="Print version and exit.",
)
def cli(
    ctx=None,
    verbose: bool = False,
    output: Optional[str] = None,
):
    """CLI tool for jupyterlab-requirements."""
    if verbose:
        _LOGGER.setLevel(logging.DEBUG)

    _LOGGER.debug("Debug mode is on")
    _LOGGER.info("Version: %s", _get_version(name="jupyterlab_requirements"))


def get_notebook_metadata(notebook_path: str):
    """Get JSON of the notebook metadata."""
    actual_path = Path(notebook_path)

    if not actual_path.exists():
        raise FileNotFoundError(f"There is no file at this path: {actual_path.as_posix()!r}")

    if actual_path.suffix != ".ipynb":
        raise Exception("File submitted is not .ipynb")

    with open(notebook_path) as notebook_content:
        notebook = json.load(notebook_content)

    notebook_metadata = notebook.get("metadata")
    if not notebook_metadata:
        raise Exception("There is no metadata key in notebook.")

    return notebook_metadata


@cli.command("extract")
@click.pass_context
@click.option(
    "--path",
    is_flag=False,
    required=True,
    help="Path to notebook.",
)
@click.option(
    "--store-files-path",
    is_flag=False,
    default=".",
    help="Custom path used to store all files.",
)
@click.option(
    "--pipfile",
    is_flag=True,
    help="Extract and store Pipfile.",
)
@click.option(
    "--pipfile-lock",
    is_flag=True,
    help="Extract and store Pipfile.lock.",
)
@click.option(
    "--thoth-config",
    is_flag=True,
    help="Extract and store .thoth.yaml",
)
@click.option(
    "--use-overlay",
    is_flag=True,
    help="Extract Pipfile and Pipfile.lock in overlay with kernel name",
)
@click.option(
    "--extract-all",
    is_flag=True,
    help="Extract and store all content from metadata.",
)
@click.option(
    "--show-only",
    is_flag=True,
    help="If active only the content will be shown but not extracted.",
)
@click.option(
    "--force",
    is_flag=True,
    help="Force actions for extraction.",
)
def notebook(
    ctx: click.Context,
    path: str,
    store_files_path: str,
    pipfile: bool = False,
    pipfile_lock: bool = False,
    thoth_config: bool = False,
    use_overlay: bool = False,
    show_only: bool = False,
    force: bool = False,
    extract_all: bool = False,
):
    """Extract actions from notebook metadata."""
    notebook_metadata = get_notebook_metadata(notebook_path=path)

    language_info = notebook_metadata.get("language_info")
    language = language_info.get("name")

    if language != "python":
        raise Exception("Only Python kernels are currently supported.")

    dependency_resolution_engine = notebook_metadata.get("dependency_resolution_engine")
    kernelspec = notebook_metadata.get("kernelspec")
    kernel_name = kernelspec.get("name")
    click.echo(f"Kernel name is: {kernel_name!s}")

    if use_overlay:
        if not kernel_name:
            raise Exception("No kernel name identified in notebook metadata kernelspec.")

        store_files_path = Path(store_files_path).joinpath("overlays").joinpath(kernel_name)
        store_files_path.mkdir(parents=True, exist_ok=True)

    if not dependency_resolution_engine:
        raise Exception("No Resolution engine identified in notebook metadata.")

    click.echo(f"Resolution engine identified: {dependency_resolution_engine!s}")

    if pipfile or extract_all:
        pipfile_string = notebook_metadata.get("requirements")

        if not pipfile_string:
            raise Exception("No Pipfile identified in notebook metadata.")

        pipfile_ = Pipfile.from_string(pipfile_string)

        if show_only:
            click.echo(f"\nPipfile:\n\n{pipfile_.to_string()}")

            if not extract_all:
                ctx.exit(0)
        else:
            pipfile_path = Path(store_files_path).joinpath("Pipfile")

            if pipfile_path.exists() and not force:
                raise Exception(f"Cannot store Pipfile because it already exists at path: {pipfile_path.as_posix()!r}")
            else:
                pipfile_.to_file(path=pipfile_path)

    if pipfile_lock or extract_all:
        pipfile_lock_string = notebook_metadata.get("requirements_lock")

        if not pipfile_lock_string:
            raise Exception("No Pipfile.lock identified in notebook metadata.")

        pipfile_lock_ = PipfileLock.from_string(pipfile_content=pipfile_lock_string, pipfile=Pipfile.from_string(""))

        if show_only:
            click.echo(f"\nPipfile.lock:\n\n{pipfile_lock_.to_string()}")

            if not extract_all:
                ctx.exit(0)
        else:
            pipfile_lock_path = Path(store_files_path).joinpath("Pipfile.lock")

            if pipfile_lock_path.exists() and not force:
                raise Exception(
                    f"Cannot store Pipfile.lock because it already exists at path: {pipfile_lock_path.as_posix()!r}"
                )
            else:
                pipfile_lock_.to_file(path=pipfile_lock_path)

    if thoth_config or extract_all:
        thoth_config_string = notebook_metadata.get("thoth_config")

        if not thoth_config_string:
            raise Exception("No .thoth.yaml identified in notebook metadata.")

        config = _Configuration()
        config.load_config_from_string(thoth_config_string)
        if show_only:
            click.echo(f"\n.thoth.yaml:\n\n{config.content}")

            if not extract_all:
                ctx.exit(0)
        else:
            yaml_path = Path(".thoth.yaml")
            if yaml_path.exists() and not force:
                raise Exception(f"Cannot store .thoth.yaml because it already exists at path: {yaml_path.as_posix()!r}")
            else:
                config.save_config()

    ctx.exit(0)


__name__ == "__main__" and cli()
