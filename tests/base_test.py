#!/usr/bin/env python3
# jupyterlab-requirements
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

"""A base class for implementing horus' test cases."""

import tempfile
import shutil
import os

from pathlib import Path
from voluptuous import All
from voluptuous import Length
from voluptuous import Schema
from voluptuous import Optional


class HorusTestCaseException(Exception):  # noqa: N818
    """A base class for exceptions that can occur in the test suite."""


class HorusTestCase:
    """A base class for implementing horus's test cases."""

    data_dir = Path(os.path.dirname(os.path.realpath(__file__))) / "data"
    empty_notebook_path = data_dir / "empty-notebook.ipynb"
    requirements_notebook_path = data_dir / "requirements-notebook.ipynb"
    locked_notebook_path = data_dir / "locked-notebook.ipynb"

    _KERNEL_SCHEMA = Schema([All(str, Length(min=1))])

    _JUPYTERLAB_REQUIREMENTS_METADATA_SCHEMA = Schema(
        {
            "dependency_resolution_engine": All(str, Length(min=1)),
            "requirements": All(str, Length(min=1)),
            "requirements_lock": All(str, Length(min=1)),
            Optional("thoth_config"): All(str, Length(min=1)),
            Optional("adviser_analysis_id"): All(str, Length(min=1)),
        }
    )

    @staticmethod
    def create_temporary_copy(path: str):
        """Create a temporary notebook."""
        tmp = tempfile.NamedTemporaryFile(delete=True, prefix="notebook_test_", mode="w+t", suffix=".ipynb")
        shutil.copy2(path, tmp.name)

        return tmp, tmp.name
