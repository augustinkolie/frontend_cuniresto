import React from 'react'
import { useNotification } from '../context/NotificationContext'
import NotificationToast from './NotificationToast'

export default function NotificationManager() {
  const { currentNotification, isVisible, closeNotification } = useNotification()

  return (
    <NotificationToast
      notification={currentNotification}
      onClose={closeNotification}
      isVisible={isVisible}
    />
  )
}
