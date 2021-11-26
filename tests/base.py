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

from pathlib import Path
import os

from voluptuous import All
from voluptuous import Length
from voluptuous import Schema


class HorusTestCaseException(Exception):  # noqa: N818
    """A base class for exceptions that can occur in the test suite."""


class HorusTestCase:
    """A base class for implementing horus's test cases."""

    data_dir = Path(os.path.dirname(os.path.realpath(__file__))) / "data"
    empty_notebook_path = data_dir / "empty-notebook.ipynb"

    _KERNEL_SCHEMA = Schema(
        [
            All(str, Length(min=1))
        ]
    )
