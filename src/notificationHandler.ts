import { INotification } from "jupyterlab_toastify";
import { TypeOptions } from "react-toastify"

const MESSAGE_TIMEOUT = 5000

export const notificationHandler = (notifications: {[key: string]: {type: TypeOptions | "inProgress", id: string | null, timestamp: number}} = {}, garbageCollector: NodeJS.Timeout = null) => {
  const collectGarbage = () => {
    Object.entries(notifications).forEach(([key, value]) => {
      if(Date.now() > value.timestamp + MESSAGE_TIMEOUT) {
        delete notifications[key]
      }
    })
  }


  const createNotification = (message: string, type: TypeOptions) => {
    // if notification is already present
    if(notifications[message]) {
      // update message timeout
      // if message has its id yet
      if(notifications[message].id) {
        INotification.update({
          toastId: notifications[message].id,
          type: type,
          autoClose: MESSAGE_TIMEOUT,
          message: message
        })
      }
    }
    else {
      // create new notification
      notifications[message] = {id: null, type: type, timestamp: Date.now()}

      clearInterval(garbageCollector)
      garbageCollector = setTimeout(collectGarbage, MESSAGE_TIMEOUT*4)

      switch(type) {
        case "error":
          INotification.error(message, {
            autoClose: MESSAGE_TIMEOUT,
          }).then(id => {
            notifications[message] = {...notifications[message], id: id as string}
          })
          break
        case "info":
          INotification.info(message, {
            autoClose: MESSAGE_TIMEOUT,
          }).then(id => {
            notifications[message] = {...notifications[message], id: id as string}
          })
          break
        case "default":
          INotification.inProgress(message, {
            autoClose: MESSAGE_TIMEOUT,
          }).then(id => {
            notifications[message] = {...notifications[message], id: id as string}
          })
          break
        case "success":
          INotification.success(message, {
            autoClose: MESSAGE_TIMEOUT,
          }).then(id => {
            notifications[message] = {...notifications[message], id: id as string}
          })
          break
        case "warning":
          INotification.warning(message, {
            autoClose: MESSAGE_TIMEOUT,
          }).then(id => {
            notifications[message] = {...notifications[message], id: id as string}
          })
      }


    }

  }

  const errorNotification = (message: string) => createNotification(message, "error")
  const warningNotification = (message: string) => createNotification(message, "warning")
  const infoNotification = (message: string) => createNotification(message, "info")
  const successNotification = (message: string) => createNotification(message, "success")
  const inProgressNotification = (message: string) => createNotification(message, "default")


  return {errorNotification, warningNotification, infoNotification, successNotification, inProgressNotification}

}
