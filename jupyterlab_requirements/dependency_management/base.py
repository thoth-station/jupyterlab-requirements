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

"""Base class for async tasks for jupyterlab requirements."""

import sys
import asyncio
import traceback
import logging
import tornado
import json

from tornado import web
from typing import Any, Dict, Callable

from jupyter_server.base.handlers import APIHandler

NAMESPACE = r"jupyterlab_requirements"

_LOGGER = logging.getLogger("jupyterlab_requirements.base")


class AsyncTasks:
    """Handle long asynchronous task for dependencies management."""

    task_index = 0

    def __init__(self):
        """Init."""
        self.tasks: Dict[int, asyncio.Task] = dict()

    def create_task(self, task: Callable, task_inputs) -> int:
        """Add an asynchronous task into the queue."""
        AsyncTasks.task_index += 1
        task_index = AsyncTasks.task_index

        async def _run_task(task_index, task, task_inputs) -> Any:
            try:
                _LOGGER.debug(f"Task to be executed {task_index}.")
                result = await task(task_inputs)
            except asyncio.CancelledError:
                raise
            except Exception as e:
                exc_type, _, exc_traceback = sys.exc_info()
                result = {
                    "type": exc_type.__qualname__,  # type: ignore
                    "error": str(e),
                    "task_inputs": task_inputs,
                    "traceback": traceback.format_tb(exc_traceback),
                }
                _LOGGER.error(f"Error for task index {task_index}: {result}")
            else:
                _LOGGER.debug(f"Task index {task_index} run.")

            return result

        self.tasks[task_index] = asyncio.ensure_future(_run_task(task_index, task, task_inputs))  # type: ignore

        return task_index

    def get_task(self, task_index: int) -> Any:
        """Get the task `idx` results or None."""
        if task_index not in self.tasks:
            raise ValueError(f"Task index {task_index} does not exists.")

        if self.tasks[task_index].done():
            task = self.tasks.pop(task_index)
            return task.result()
        else:
            return None

    def delete_task(self, task_index: int) -> None:
        """Delete the task using task_index."""
        _LOGGER.debug(f"Cancel task index {task_index}.")
        if task_index not in self.tasks:
            raise ValueError(f"Task index {task_index} does not exists.")

        self.tasks[task_index].cancel()

    def __del__(self):
        """Destructor."""
        for task in filter(lambda t: not t.cancelled(), self.tasks.values()):
            task.cancel()


class DependencyManagementBaseHandler(APIHandler):
    """Bsse Handler for dependency management."""

    _tasks = AsyncTasks()

    @web.authenticated
    def get(self, index: int):
        """`GET /tasks/<id>` Returns the task `index` status.

        Status are:

        * 200: Task result is returned
        * 202: Task is pending
        * 500: Task ends with errors

        Args:
            index (int): Task index

        Raises:
            404 if task `index` does not exist

        """
        try:
            r = self._tasks.get_task(int(index))
        except ValueError as err:
            raise tornado.web.HTTPError(404, reason=str(err))
        else:
            if r is None:
                self.set_status(202)
                self.finish("{}")
            else:
                if r[1]["error"]:
                    self.set_status(500)
                    _LOGGER.debug("%r", r)
                else:
                    self.set_status(200)
                self.finish(json.dumps(r[1]))

    def redirect_to_task(self, task_index: int):
        """Close a request by redirecting to a task."""
        self.set_status(202)
        self.set_header("Location", "/{}/tasks/{}".format(NAMESPACE, task_index))
        self.finish("{}")
